---
name: animatic
description: Build a deterministic animated PR preview (WebM/GIF) and storyboard of interface changes from changed routes or component files. Use when asked for an animated PR preview, animatic, GIF/WebM preview, storyboard, or to show interface changes in a pull request body.
---

# /animatic

Produce a small, self-contained animated preview of the UI changes in the current
PR, suitable for pasting straight into a GitHub PR body. Everything runs locally:
no API keys, no uploads, no network services, no edits to application source.

## Outputs

All four files are written to `docs/media/<slug>/`:

| File | Purpose |
| --- | --- |
| `animatic.webm` | VP9 preview, <= 12 fps, <= 720 px wide, <= 5 MB |
| `animatic.gif` | Same preview as a GIF for inline PR rendering, <= 5 MB |
| `storyboard.svg` | Self-contained labelled storyboard (also the fallback when screenshots are unavailable) |
| `PR_BODY_ANIMATIC.md` | GitHub-flavoured markdown snippet with `<picture>`/`<img>` tags and a "What changed" list |

The deterministic parts (caption burn-in, frame stitching, SVG storyboard, size
guard, cleanup) are implemented by `scripts/build-animatic.sh` next to this file.
Call it; do not reimplement ffmpeg commands ad hoc.

## Inputs and limits

1. **Targets**: a list of routes or component files changed in the PR.
   Default when the caller supplies none:

   ```bash
   git diff --name-only main...HEAD
   ```

   Write the result to `$TMP/sources.txt` (one path per line). `main` may be
   absent on unusual branches; if so, use the caller's explicit list or
   `git diff --name-only HEAD~1...HEAD`, and say so in the PR snippet.
2. **Frame budget**: at most **8** frames total. Nothing in this skill may
   produce more; the script enforces the cap again.
3. **Viewports**: desktop `1280x800`, mobile `390x844`. Light theme always;
   dark theme only if `components/ThemeToggle.tsx` (or an equivalent theme
   toggle) exists in the repo.
4. **Ports**: fixed `3211` for the current branch and `3212` for the temporary
   `main` checkout. Never pick random ports.
5. **Captions**: one line per frame, in frame order, e.g.
   `AFTER · /dashboard · desktop · light · HEAD` or
   `BEFORE · /dashboard · desktop · main`. The script burns these into the
   frames and uses them in the SVG storyboard.

Map changed files to routes deterministically:

- `app/page.tsx` -> `/`
- `app/(dashboard)/dashboard/page.tsx` -> `/dashboard`
- `app/(auth)/login/page.tsx` -> `/login`
- any other `app/**/page.tsx` -> the URL path with route groups `(...)` removed
- a component under `components/` -> the route that imports it (`grep -R` the
  component name under `app/`); if none, use `/` or `/dashboard`

Prioritise frames in this order and stop at 8: for each of up to 3 changed
routes, AFTER desktop light then BEFORE desktop light (when a `main` checkout
is available); then AFTER mobile light and AFTER desktop dark for the first
route. Fill any remaining slots with further changed routes.

## Safety rules (non-negotiable)

- Do not read or print `.env*`, tokens, cookies, or credentials. Do not pass
  secrets to ffmpeg, Playwright, or the PR body. Never put real user data on a
  captured screen: if a route shows private data, skip that route and note it.
- No network uploads, no `gh` attach/upload, no `git push`, no force pushes.
  This skill only writes local files under `docs/media/<slug>/` and temp files.
- Do not modify application source code, tests, or configuration.
- Always stop the dev servers you started (see Cleanup) and remove any temp
  git worktree you created. Pass their PIDs/worktree path to the support script
  so cleanup also happens if a step fails.
- Fail soft: if a tool or browser is unavailable, write the best artefact you
  can (at minimum `storyboard.svg` and `PR_BODY_ANIMATIC.md`), print a clear
  WARNING naming the missing tool, and continue. Never block PR creation.

## Workflow

### 1. Prepare a temp workspace

```bash
SLUG=<short-kebab-case-slug>
OUT="docs/media/$SLUG"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/animatic.XXXXXX")"
FRAMES="$TMP/frames"
mkdir -p "$FRAMES" "$OUT"
git diff --name-only main...HEAD > "$TMP/sources.txt"   # or the caller's explicit list
: > "$TMP/captions.txt"
```

### 2. Start the dev server(s) — always stop them at the end

```bash
NEXT_TELEMETRY_DISABLED=1 pnpm dev -p 3211 > "$TMP/dev-after.log" 2>&1 &
DEV_PID=$!
```

Wait up to ~60 s for `http://127.0.0.1:3211/` to answer (`curl -fsS -o /dev/null`
or a retry with the screenshot command). If it never answers, stop the server,
skip live capture, and go to step 5 (fallback).

**BEFORE frames.** If `main` exists, try a temporary detached worktree:

```bash
WT="${TMPDIR:-/tmp}/animatic-worktree-$SLUG"
git worktree add --detach "$WT" main
[ -d node_modules ] && ln -s "$PWD/node_modules" "$WT/node_modules"
(cd "$WT" && exec env NEXT_TELEMETRY_DISABLED=1 pnpm dev -p 3212 > "$TMP/dev-before.log" 2>&1) &
BEFORE_PID=$!   # `exec` makes this the real dev-server PID, not a wrapper subshell
```

If the worktree cannot be served (missing dependencies, port busy, checkout
failure), do **not** start a second server. Instead use `git show main:<path>`
for each source file so the storyboard and captions still carry BEFORE context:
`BEFORE · /<route> · main (source via git show)`. Drop the worktree immediately
in that case. Never force-push or switch the main working tree's branch.

### 3. Capture frames with Playwright

Use the repo's existing dependency; do not install a different browser stack.
If `pnpm exec playwright --version` fails, try `pnpm install --frozen-lockfile`
only if the local pnpm store can satisfy it offline; otherwise jump to step 5.
If browsers are missing (`Executable doesn't exist` / `playwright install`
needed), also jump to step 5 — do not download browsers implicitly.

Desktop, light:

```bash
pnpm exec playwright screenshot --browser=chromium \
  --viewport-size="1280,800" --color-scheme=light --wait-for-timeout=1200 \
  "http://127.0.0.1:3211/dashboard" "$FRAMES/01-after-dashboard-desktop-light.png"
printf '%s\n' 'AFTER · /dashboard · desktop 1280x800 · light · HEAD' >> "$TMP/captions.txt"
```

Mobile, light:

```bash
pnpm exec playwright screenshot --browser=chromium \
  --viewport-size="390,844" --color-scheme=light --wait-for-timeout=1200 \
  "http://127.0.0.1:3211/dashboard" "$FRAMES/02-after-dashboard-mobile-light.png"
printf '%s\n' 'AFTER · /dashboard · mobile 390x844 · light · HEAD' >> "$TMP/captions.txt"
```

Dark (only if a theme toggle exists): repeat with `--color-scheme=dark` and a
caption ending `dark · HEAD`. If this Playwright version rejects
`--color-scheme`, omit dark frames and say so in the warning.

BEFORE frames: repeat the desktop command against port `3212` (the worktree)
with filenames `03-before-...` and captions labelled `BEFORE ... main`. Keep
filenames and caption lines in the same order. Stop at 8 frames.

Check each screenshot is a real page, not an error/login redirect. If a route
needs authentication, skip it rather than supplying credentials.

### 4. Build the artefacts

```bash
bash .agents/skills/animatic/scripts/build-animatic.sh \
  --out "$OUT" --slug "$SLUG" \
  --frames "$FRAMES" --captions "$TMP/captions.txt" \
  --sources "$TMP/sources.txt" \
  --fps 8 --kill-pid "$DEV_PID" ${BEFORE_PID:+--kill-pid "$BEFORE_PID"} \
  ${WT:+--worktree "$WT"}
```

The script clamps fps to 8 (limit 12), width to 720, frames to 8, burns the
captions, retries progressively smaller VP9/GIF encodes until both files are
<= 5,000,000 bytes, and writes the four output files. It kills the supplied PIDs
and removes the supplied temp worktree on exit.

### 5. Fallback when Playwright or browsers are unavailable

Run the same command **without** `--frames` (or with an empty frames directory):

```bash
bash .agents/skills/animatic/scripts/build-animatic.sh \
  --out "$OUT" --slug "$SLUG" --sources "$TMP/sources.txt" \
  --captions "$TMP/captions.txt" \
  --fps 8 --kill-pid "$DEV_PID" ${BEFORE_PID:+--kill-pid "$BEFORE_PID"} \
  ${WT:+--worktree "$WT"}
```

The script then writes `storyboard.svg` from the changed source files (with
`git show main:<path>` excerpts when available), generates labelled text panels
with ffmpeg so `animatic.webm`/`animatic.gif` still exist when ffmpeg is present,
and notes in `PR_BODY_ANIMATIC.md` that the preview is source-derived. If ffmpeg
is missing too, only the SVG and the snippet are produced; the snippet says
"Animated media unavailable in this environment; the storyboard below is the
fallback preview." Report that limitation plainly.

### 6. Verify and hand off

- Confirm `storyboard.svg` and `PR_BODY_ANIMATIC.md` exist; confirm both media
  files exist and are under 5 MB (`wc -c`). Confirm captions show route names
  and BEFORE/AFTER labels.
- Read `PR_BODY_ANIMATIC.md` and paste it into the PR body verbatim. If GitHub
  strips `<picture>`, the plain GIF image link in the snippet still renders.
- Report the four paths in your response.

### Cleanup (mandatory, even on failure)

```bash
kill "$DEV_PID" 2>/dev/null || true
[ -n "${BEFORE_PID:-}" ] && kill "$BEFORE_PID" 2>/dev/null || true
[ -n "${WT:-}" ] && git worktree remove --force -- "$WT" 2>/dev/null || true
rm -rf "$TMP"
```

The support script also performs this cleanup via its `--kill-pid` and
`--worktree` arguments. Cleanup only ever targets the PIDs and the single temp
worktree path created by this run.

## Failure messages

Use these verbatim where relevant, then continue:

- `Playwright or its browsers are unavailable; wrote a source-derived storyboard instead.`
- `ffmpeg is unavailable; wrote storyboard.svg and the PR snippet only.`
- `No main checkout available; BEFORE labels use git show source excerpts.`
- `Route requires authentication; skipped it to avoid handling secrets.`
- `Media exceeded 5 MB after all fallback encodes; storyboard only.`
