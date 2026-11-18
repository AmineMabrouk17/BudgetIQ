<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Agent skills

### Issue tracker

Issues and specs live as GitHub issues on this repo; drive them with `gh`. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles map to matching labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` at the repo root plus `docs/adr/`. See `docs/agents/domain.md`.

### PR evidence

Every PR that changes UI ships visual evidence of its own change, declared in
`.factory/evidence.json` and captured by `scripts/capture-evidence.mjs`.
See `docs/agents/evidence.md`. Evidence of a generic page is a failed PR, and a
change behind auth is captured as the demo user, never as a login redirect.

### PR bodies

Author every PR with the `pr` skill: Summary as the smallest view that makes the
change clear (a diff sketch, component tree or short tree beats prose), Evidence
from real captures, and Merge Danger stated as door (`one-way` / `two-way`) plus
blast radius. The title describes the diff that actually landed, not the issue
title that started it.
