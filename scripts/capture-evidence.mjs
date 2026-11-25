import { chromium } from 'playwright';
import { execSync, spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Captures before/after evidence for the exact routes and states a PR changes.
 *
 * The branch declares them in `.factory/evidence.json`; this script refuses to
 * fall back to a generic homepage shot for a UI change. Behind auth the routes
 * are captured as the demo user via the signed preview session
 * (`lib/auth/preview-bypass`), so a dashboard change shows a populated
 * dashboard instead of a login redirect.
 *
 * Contract and examples: docs/agents/evidence.md
 */

function parseArg(flag) {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : null;
}

const baseDir = path.resolve(parseArg('--base-dir') || 'base-branch');
const prDir = path.resolve(parseArg('--pr-dir') || 'pr-branch');
const outDir = path.resolve(parseArg('--out-dir') || 'evidence-out');
fs.mkdirSync(outDir, { recursive: true });

const appUrl = process.env.APP_URL || 'http://127.0.0.1:3000';
const previewSecret = process.env.PREVIEW_TEST_SECRET || '';
const fallbackPath = process.env.TARGET_PATH || '/';

const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 },
};

function fail(message) {
  console.error(`\nEvidence error: ${message}\n`);
  process.exit(1);
}

function readConfig(dir) {
  const configPath = path.join(dir, '.factory', 'evidence.json');
  if (!fs.existsSync(configPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    fail(`.factory/evidence.json is not valid JSON: ${error.message}`);
  }
}

function normaliseRoutes(config) {
  const rawRoutes = config?.routes;
  if (!Array.isArray(rawRoutes) || rawRoutes.length === 0) {
    fail('.factory/evidence.json must declare at least one entry in "routes".');
  }

  const labels = new Set();
  return rawRoutes.map((route, index) => {
    if (!route || typeof route !== 'object') {
      fail(`routes[${index}] must be an object.`);
    }
    if (!route.label || !/^[a-z0-9][a-z0-9-]*$/.test(route.label)) {
      fail(`routes[${index}].label must be a lowercase slug (a-z, 0-9, -).`);
    }
    if (labels.has(route.label)) fail(`Duplicate route label "${route.label}".`);
    labels.add(route.label);

    if (typeof route.path !== 'string' || !route.path.startsWith('/')) {
      fail(`routes[${index}].path must start with "/".`);
    }

    const viewport =
      typeof route.viewport === 'object' && route.viewport
        ? route.viewport
        : VIEWPORTS[route.viewport || 'desktop'];
    if (!viewport || !viewport.width || !viewport.height) {
      fail(`routes[${index}].viewport must be "desktop", "mobile" or {width, height}.`);
    }

    if (route.theme && !['light', 'dark'].includes(route.theme)) {
      fail(`routes[${index}].theme must be "light" or "dark".`);
    }

    const actions = route.actions ?? [];
    if (!Array.isArray(actions)) fail(`routes[${index}].actions must be an array.`);
    for (const [actionIndex, action] of actions.entries()) {
      const keys = ['click', 'fill', 'press', 'wait', 'scrollTo'];
      if (!action || !keys.some((key) => key in action)) {
        fail(`routes[${index}].actions[${actionIndex}] must use one of ${keys.join(', ')}.`);
      }
    }

    return {
      label: route.label,
      path: route.path,
      viewport,
      theme: route.theme || 'light',
      auth: Boolean(route.auth),
      actions,
      expect: typeof route.expect === 'string' ? route.expect : null,
    };
  });
}

const config = readConfig(prDir);
const routes = config
  ? normaliseRoutes(config)
  : [
      {
        label: 'page',
        path: fallbackPath,
        viewport: VIEWPORTS.desktop,
        theme: 'light',
        auth: false,
        actions: [],
        expect: null,
      },
    ];

/** Capture status per route and side: "captured" | "unavailable". */
const results = new Map(
  routes.map((route) => [route.label, { before: null, after: null }])
);

function writeManifest() {
  const manifest = routes.map((route) => ({
    label: route.label,
    path: route.path,
    viewport: route.viewport,
    theme: route.theme,
    auth: route.auth,
    expected: route.expect,
    declared: Boolean(config),
    before: results.get(route.label)?.before,
    after: results.get(route.label)?.after,
  }));
  fs.writeFileSync(
    path.join(outDir, 'evidence-manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
}

if (!config) {
  console.warn(
    'No .factory/evidence.json on this branch; capturing a single generic page. ' +
      'UI PRs are expected to declare exact routes (docs/agents/evidence.md).'
  );
}

function detectStartCommand(dir) {
  if (process.env.START_CMD) return process.env.START_CMD;
  const pkgPath = path.join(dir, 'package.json');
  if (!fs.existsSync(pkgPath)) return null;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const scripts = pkg.scripts || {};
  if (scripts.preview) return 'npm run preview -- --port 3000 --host 127.0.0.1';
  if (scripts.start) return 'PORT=3000 npm start';
  if (scripts.dev) return 'npm run dev -- --port 3000 --host 127.0.0.1';
  return null;
}

function installDeps(dir) {
  // Local runs can point at an app they already installed and built.
  if (process.env.SKIP_INSTALL === '1') return;
  if (!fs.existsSync(path.join(dir, 'package.json'))) return;
  execSync('npm ci || npm install', { cwd: dir, stdio: 'inherit' });
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  if (pkg.scripts?.build) {
    execSync('npm run build', { cwd: dir, stdio: 'inherit' });
  }
}

async function waitForServer(url, timeoutMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

/** Signed headers that make the app treat this request as the demo user. */
function previewAuthHeaders() {
  if (!previewSecret) {
    fail(
      'routes[].auth is true but PREVIEW_TEST_SECRET is not set. The demo session ' +
        'is signed with this secret; the workflow sets it per run.'
    );
  }
  const timestamp = String(Date.now());
  const signature = crypto
    .createHmac('sha256', previewSecret)
    .update(timestamp)
    .digest('hex');
  return {
    'x-test-auth-signature': signature,
    'x-test-auth-timestamp': timestamp,
  };
}

async function runActions(page, actions, side) {
  for (const action of actions) {
    try {
      if ('click' in action) {
        await page.locator(action.click).first().click({ timeout: 10000 });
      } else if ('fill' in action) {
        await page.locator(action.fill.selector).first().fill(action.fill.value);
      } else if ('press' in action) {
        await page.keyboard.press(action.press);
      } else if ('scrollTo' in action) {
        await page
          .locator(action.scrollTo)
          .first()
          .scrollIntoViewIfNeeded({ timeout: 10000 });
      } else if ('wait' in action) {
        await page.waitForTimeout(action.wait);
      }
      // Let the UI settle after each step so the frame shows the end state.
      await page.waitForTimeout(250);
    } catch (error) {
      // The base branch may not have the control yet — the change this PR
      // introduces is the thing that creates it. Capture the pre-action state
      // there and keep the failure strict on the PR branch.
      if (side === 'before') {
        console.warn(
          `Before capture: action ${JSON.stringify(action)} did not apply ` +
            `(${error.message.split('\n')[0]}). Capturing the state before it.`
        );
        continue;
      }
      fail(
        `Action ${JSON.stringify(action)} failed on the PR branch: ` +
          `${error.message.split('\n')[0]}. The evidence would not show the ` +
          `state this PR claims; fix the selector or the action.`
      );
    }
  }
}

function failureReason({
  route,
  redirectedToLogin,
  redirectedAway,
  landedPath,
  blank,
}) {
  if (redirectedToLogin) {
    return `Route "${route.label}" (${route.path}) redirected to the login page even ` +
      `with auth: true. The demo session failed — check PREVIEW_TEST_SECRET and ` +
      `VERCEL_ENV=preview on the server, and that the route is reachable.`;
  }
  if (blank) return `Route "${route.label}" (${route.path}) rendered a blank page.`;
  if (redirectedAway) {
    return `Route "${route.label}" (${route.path}) landed on ${landedPath} instead of ` +
      `the declared path.`;
  }
  return `Route "${route.label}" (${route.path}) does not render the expected text ` +
    `"${route.expect}". Evidence must show the change this PR makes; fix the ` +
    `route, the actions or the expectation in .factory/evidence.json.`;
}

function missingExpected(route, body) {
  return route.expect ? !body.includes(route.expect) : false;
}

/**
 * Captures one route. The PR branch must show the change; the base branch may
 * legitimately not have the route yet (a page or capability this PR adds), in
 * which case the manifest records it as unavailable instead of shipping a
 * misleading login redirect as "before".
 */
async function captureRoute(page, route, side) {
  const url = new URL(route.path, appUrl).toString();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await runActions(page, route.actions, side);

  const requestedPath = new URL(url).pathname;
  const landedPath = new URL(page.url()).pathname;
  const redirectedAway = landedPath !== requestedPath;
  const redirectedToLogin = redirectedAway && landedPath.startsWith('/login');
  const body = (await page.locator('body').innerText()).trim();
  const blank = body.length < 20;
  // `expect` proves the PR branch shows the change. The base branch is meant to
  // show the old state, so a mismatch there is the evidence, not an error.
  const mismatch = side === 'after' && missingExpected(route, body);

  if (redirectedAway || blank || mismatch) {
    const reason = failureReason({
      route,
      redirectedToLogin,
      redirectedAway,
      landedPath,
      blank,
    });
    if (side === 'before') {
      console.warn(
        `Before capture for "${route.label}" skipped: ${reason}. Recording it as unavailable.`
      );
      results.get(route.label).before = 'unavailable';
      return false;
    }
    fail(reason);
  }

  await page.screenshot({
    path: path.join(outDir, `${side}-${route.label}.png`),
    fullPage: true,
  });
  results.get(route.label)[side] = 'captured';
  return true;
}

async function captureFromDir(dir, label, record = false) {
  const cmd = detectStartCommand(dir);
  if (!cmd) {
    console.log(`No web server start script detected in ${dir}; skipping ${label}.`);
    return;
  }

  installDeps(dir);
  const proc = spawn('bash', ['-lc', cmd], { cwd: dir, stdio: 'inherit', detached: true });

  try {
    const ready = await waitForServer(new URL(routes[0].path, appUrl).toString());
    if (!ready) {
      fail(`Server did not respond at ${appUrl} for ${label}.`);
    }

    // The default headless shell does not apply clicks to the hydrated React
    // tree reliably; the full Chromium build does.
    const browser = await chromium.launch({ channel: 'chromium' });
    try {
      for (const route of routes) {
        const videoDir = path.join(outDir, `tmp-video-${route.label}`);
        if (record) fs.mkdirSync(videoDir, { recursive: true });

        const context = await browser.newContext({
          viewport: route.viewport,
          cookies: [
            {
              name: 'theme',
              value: route.theme,
              url: new URL('/', appUrl).toString(),
            },
          ],
          ...(route.auth ? { extraHTTPHeaders: previewAuthHeaders() } : {}),
          ...(record
            ? { recordVideo: { dir: videoDir, size: route.viewport } }
            : {}),
        });

        const page = await context.newPage();
        await captureRoute(page, route, label === 'after' ? 'after' : 'before');

        const video = record ? page.video() : null;
        await context.close();

        if (record && video) {
          const webmPath = await video.path();
          const mp4Path = path.join(outDir, `after-${route.label}.mp4`);
          const gifPath = path.join(outDir, `after-${route.label}.gif`);
          execSync(
            `ffmpeg -y -i "${webmPath}" -c:v libx264 -pix_fmt yuv420p "${mp4Path}"`,
            { stdio: 'inherit' }
          );
          execSync(
            `ffmpeg -y -i "${webmPath}" -vf "fps=10,scale=960:-1:flags=lanczos" "${gifPath}"`,
            { stdio: 'inherit' }
          );
          fs.rmSync(videoDir, { recursive: true, force: true });
        }
      }
    } finally {
      await browser.close();
    }
  } finally {
    try {
      process.kill(-proc.pid);
    } catch {}
  }
}

await captureFromDir(baseDir, 'before', false);
await captureFromDir(prDir, 'after', true);
writeManifest();
