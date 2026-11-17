# Media tooling: OpenScreen and brag

This repo uses two project-local agent skills for launch/demo media. Both are
installed with the `skills` CLI under `.agents/skills/` (the repo's canonical
agent-skill directory, mirrored to `.opencode/skills/` where an equivalent
layout exists), and their upstream source commits and content hashes are recorded
in [`skills-lock.json`](../skills-lock.json).
The lock is the pin: upgrade skills through the CLI so the lock stays in sync.

## OpenScreen (`openscreen-demo`)

[OpenScreen](https://getopenscreen.com/) is a screen recorder/editor whose CLI is
built into the desktop app executable (there is no separate headless npm package).
The `openscreen-demo` skill drives it through MCP to record a feature, add zooms
and callouts, export an MP4, and optionally attach it to a PR or draft a post.

Locally:

```bash
# Install the app from https://getopenscreen.com/download/ first.
# Install the project-local skill (pinned entry already in skills-lock.json):
npx --yes skills add https://github.com/getopenscreen/openscreen \
  --skill openscreen-demo --agent opencode --copy -y

# CLI is the app binary on Linux; on macOS use the full app path shown in the docs.
openscreen --version || openscreen help
openscreen record --duration 8 --project demo.openscreen --json
openscreen export demo.openscreen -o demo.mp4 --json
```

Recording needs a real desktop session. On Linux/Wayland a ScreenCast portal
picker must be answered; on a headless box, `xvfb-run` provides a display but
cannot answer the portal. Export can run headless with `xvfb-run` and a software
Vulkan driver (Mesa lavapipe). The CLI/project format can change between
releases, so keep the pinned release in CI in mind.

## brag / brag-slim

[brag](https://github.com/latent-spaces/brag) turns a project or URL into a short
launch video. `brag-slim` is the one-file variant: the agent writes the storyboard,
visuals, audio and render itself using tools already on the machine; deliverables
land in `brag-output/`. CI installs `brag-slim` only.

Locally:

```bash
npx --yes skills add https://github.com/latent-spaces/brag \
  --skill brag-slim --agent opencode --copy -y
npx --yes hyperframes doctor        # optional tooling check
# Then invoke /brag-slim in OpenCode (or /brag if the full skill is installed).
ffmpeg -version                     # needed for rendering
```

Rendering is intentionally a local, human-invoked action: it may need API keys
and can spend real time on frames/audio.

## How CI uses them

[`.github/workflows/media.yml`](../.github/workflows/media.yml) is separate from
`ci.yml`; lint, typecheck, tests and audit are untouched. It triggers on
`pull_request` (`opened`, `synchronize`, `reopened`) and `workflow_dispatch`, with
`contents: read` and `pull-requests: write`.

- **Node 22 / pnpm**: both jobs set up pnpm 10 and Node 22 to match repo tooling.
- **openscreen job**: installs the pinned Linux AppImage (`v2.3.0` by default —
  verified as the latest stable GitHub release; override with the
  `openscreen_version` dispatch input), extracts it, checks
  `openscreen --version`, and attempts the 8s capture/export under `xvfb-run`.
  Every external step is `continue-on-error`; a missing display or portal simply
  yields no MP4. If a file is produced, it is uploaded as `openscreen-demo` and a
  same-repo PR gets a `gh pr comment` with the artifact URL (skipped on forks and
  when the token is unavailable).
- **brag job**: installs ffmpeg (best effort), installs `brag-slim` into
  `.agents/skills/` via the locked upstream source, runs `hyperframes doctor`
  (best effort), verifies `SKILL.md` exists, prints the product name, tagline and
  live-demo URL detected from `README.md`, and uploads `brag-skill-validation.log`.
  **No video is rendered in CI** (no API keys).
- **Opt-in**: video generation on manual runs is gated by the
  `generate_video` workflow_dispatch input (default `false`). PR runs only do the
  short fail-soft probe. Both skills remain project-local and pinned via
  `skills-lock.json`.

### Caveats

- `openscreen --version` is not documented as a stable CLI surface; the job falls
  back to `openscreen help` and never fails on either check.
- `gh pr comment` is skipped for fork PRs because their `GITHUB_TOKEN` is
  read-only; the artifact is still uploaded.
- The AppImage is extracted instead of mounted so hosted runners do not need
  FUSE; rendering software (lavapipe) and Xvfb are installed best effort.
