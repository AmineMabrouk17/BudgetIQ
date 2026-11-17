import { chromium } from 'playwright';
import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function parseArg(flag) {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : null;
}

const baseDir = path.resolve(parseArg('--base-dir') || 'base-branch');
const prDir = path.resolve(parseArg('--pr-dir') || 'pr-branch');
const outDir = path.resolve(parseArg('--out-dir') || 'evidence-out');
fs.mkdirSync(outDir, { recursive: true });

const appUrl = process.env.APP_URL || 'http://127.0.0.1:3000';
const targetPath = process.env.TARGET_PATH || '/';
const fullUrl = new URL(targetPath, appUrl).toString();

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

async function captureFromDir(dir, label, record = false) {
  const cmd = detectStartCommand(dir);
  if (!cmd) {
    console.log(`No web server start script detected in ${dir}; skipping ${label}.`);
    return;
  }

  installDeps(dir);
  const proc = spawn('bash', ['-lc', cmd], { cwd: dir, stdio: 'inherit', detached: true });

  try {
    const ready = await waitForServer(fullUrl);
    if (!ready) {
      console.warn(`Server did not respond at ${fullUrl} for ${label}.`);
      return;
    }

    const browser = await chromium.launch();
    const videoDir = path.join(outDir, 'tmp-video');
    if (record) fs.mkdirSync(videoDir, { recursive: true });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      ...(record ? { recordVideo: { dir: videoDir, size: { width: 1280, height: 800 } } } : {}),
    });

    const page = await context.newPage();
    await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, `${label}.png`), fullPage: true });

    if (record) {
      await page.mouse.wheel(0, 400);
      await page.waitForTimeout(800);
      await page.mouse.wheel(0, -400);
      await page.waitForTimeout(800);
    }

    const video = page.video();
    await context.close();
    await browser.close();

    if (record && video) {
      const webmPath = await video.path();
      const mp4Path = path.join(outDir, 'after.mp4');
      const gifPath = path.join(outDir, 'after.gif');
      execSync(`ffmpeg -y -i "${webmPath}" -c:v libx264 -pix_fmt yuv420p "${mp4Path}"`, { stdio: 'inherit' });
      execSync(`ffmpeg -y -i "${webmPath}" -vf "fps=10,scale=960:-1:flags=lanczos" "${gifPath}"`, { stdio: 'inherit' });
      fs.rmSync(videoDir, { recursive: true, force: true });
    }
  } finally {
    try {
      process.kill(-proc.pid);
    } catch {}
  }
}

await captureFromDir(baseDir, 'before', false);
await captureFromDir(prDir, 'after', true);
