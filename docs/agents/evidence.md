# PR evidence contract

Every PR that changes UI must ship visual evidence of **the change that PR
makes** — not a screenshot of the homepage.

CI enforces this in `.github/workflows/ci.yml`:

- A PR that touches `app/**` or `components/**` (other than tests) without
  `.factory/evidence.json` fails `visual-evidence`.
- The capture script (`scripts/capture-evidence.mjs`) reads that file, captures
  the same routes and states on the base branch and the PR branch, and fails
  when the PR branch does not render the text the PR is supposed to introduce.
  Actions that only exist after the change are tolerated on the base branch, so
  a brand-new control still gets a clean "before".
- Each screenshot is captioned in the PR body with its route, viewport and
  whether it was captured as the demo user.

## `.factory/evidence.json`

```json
{
  "routes": [
    {
      "label": "dashboard-nav",
      "path": "/dashboard",
      "viewport": "mobile",
      "auth": true,
      "expect": "Salary Planner"
    },
    {
      "label": "kpi-modal",
      "path": "/dashboard",
      "viewport": "desktop",
      "auth": true,
      "actions": [{ "click": "button[aria-label^=\"Edit \"]" }],
      "expect": "Amount under target"
    }
  ]
}
```

| Field | Required | Meaning |
|---|---|---|
| `label` | yes | Lowercase slug, unique per file. Names the screenshot files. |
| `path` | yes | Route to capture, starting with `/`. Include the hash when the change lives in a section (`/#faq`). |
| `viewport` | no | `"desktop"` (1280×800), `"mobile"` (390×844) or `{ "width": n, "height": n }`. Defaults to desktop. |
| `auth` | no | `true` captures as the demo user through the signed preview session. Defaults to `false`. |
| `actions` | no | Steps that put the UI into the state the PR changes. |
| `expect` | no | Text the **PR branch** must render after the actions run. The base branch is captured as it is — its old state is the "before" — so this only guards the after shot. |

### Actions

| Action | Example | Use for |
|---|---|---|
| `click` | `{ "click": "text=Create account" }` | opening menus, drawers, modals, switching modes |
| `fill` | `{ "fill": { "selector": "input[placeholder^=\"Search\"]", "value": "coffee" } }` | typed states such as an active search |
| `press` | `{ "press": "Escape" }` | dismissing UI the PR adds |
| `scrollTo` | `{ "scrollTo": "#why-budgetiq" }` | long pages where the change is below the fold |
| `wait` | `{ "wait": 500 }` | animations alongside the other steps (milliseconds) |

## The demo user

`auth: true` sends the signed preview headers described in
`lib/auth/preview-bypass.ts`. CI generates a fresh `PREVIEW_TEST_SECRET` per run
and launches the app with `VERCEL_ENV=preview`, so the middleware and the page
tree both resolve the synthetic user and the dashboard renders the fixture in
`lib/preview/demo-data.ts` (profile, transactions, KPI cards).

Use it whenever the change is behind auth. A login redirect is never evidence.

## Before you push

Run the same capture locally:

```bash
VERCEL_ENV=preview PREVIEW_TEST_SECRET=local-secret \
  APP_URL=http://127.0.0.1:3000 \
  node scripts/capture-evidence.mjs --base-dir . --pr-dir . --out-dir /tmp/evidence
```

Then open `before-<label>.png` and `after-<label>.png` and check that the
difference is the change you described in the PR. If it is not, fix
`.factory/evidence.json` — do not merge with a screenshot that shows something
else.
