import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const repo = process.env.REPO;
const prNumber = process.env.PR_NUMBER;
const headSha = process.env.HEAD_SHA;
const evidenceMd = process.env.EVIDENCE_MD || '';

function ghApi(endpoint) {
  const out = execFileSync('gh', ['api', endpoint], { encoding: 'utf8' });
  return JSON.parse(out);
}

async function findPreviewUrl() {
  const maxAttempts = 12; // ~2 minutes
  for (let i = 0; i < maxAttempts; i++) {
    // 1. Check GitHub Deployments API (Vercel & Cloudflare Pages create deployments)
    const deployments = ghApi(`repos/${repo}/deployments?sha=${headSha}`);
    for (const dep of deployments) {
      const statuses = ghApi(`repos/${repo}/deployments/${dep.id}/statuses`);
      for (const st of statuses) {
        const url = st.environment_url || st.target_url;
        if (url && (url.includes('vercel.app') || url.includes('pages.dev') || url.includes('workers.dev'))) {
          return { url, provider: url.includes('vercel') ? 'Vercel' : 'Cloudflare' };
        }
      }
    }

    // 2. Fallback: scan PR bot comments (Vercel / Cloudflare bots)
    const comments = ghApi(`repos/${repo}/issues/${prNumber}/comments`);
    for (const c of comments) {
      const match = c.body.match(/https:\/\/[^\s)]+\.(vercel\.app|pages\.dev|workers\.dev)[^\s)]*/);
      if (match) {
        return { url: match[0], provider: match[1].includes('vercel') ? 'Vercel' : 'Cloudflare' };
      }
    }

    await new Promise((r) => setTimeout(r, 10000));
  }
  return null;
}

const preview = await findPreviewUrl();
const previewUrl = preview ? preview.url : '';
const previewMd = preview
  ? `### Preview Deployment (${preview.provider})\n- Live Preview: ${preview.url}`
  : `### Preview Deployment\n- Pending or not configured for this repository.`;

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `url=${previewUrl}\n`);
}

const pr = ghApi(`repos/${repo}/pulls/${prNumber}`);
let body = pr.body || '';

const replaceSection = (text, startMarker, endMarker, content) => {
  const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, 'm');
  const block = `${startMarker}\n${content}\n${endMarker}`;
  return regex.test(text) ? text.replace(regex, block) : `${text}\n\n${block}`;
};

body = replaceSection(body, '<!-- FACTORY_PREVIEW_START -->', '<!-- FACTORY_PREVIEW_END -->', previewMd);
if (evidenceMd.trim()) {
  body = replaceSection(body, '<!-- FACTORY_EVIDENCE_START -->', '<!-- FACTORY_EVIDENCE_END -->', evidenceMd);
}

const tmpFile = '/tmp/pr-body.md';
fs.writeFileSync(tmpFile, body);
execFileSync('gh', ['pr', 'edit', prNumber, '--repo', repo, '--body-file', tmpFile], { stdio: 'inherit' });
