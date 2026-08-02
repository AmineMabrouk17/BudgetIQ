---
name: issue-implementation
description: Use when the user talks about implementing an issue, fixing a bug, or adding a feature. Follows a structured workflow: create branch from main, open GitHub issue, plan atomic steps, implement step-by-step with conventional commits, push, lint+typecheck, run dev server for visual review, then create a PR.
---

# Issue Implementation Workflow

Follow these steps **in order** every time the user asks to implement something.

## 1. Branch Setup

Create a new branch from `main` with a descriptive name:

```bash
git checkout main && git pull origin main
git checkout -b <descriptive-branch-name>
```

## 2. GitHub Issue

If the issue does not already exist, open it via `gh`:

- Use `gh issue list` to check if one exists for this topic
- If none found, create one: `gh issue create --title "<title>" --body "<description>"`
- Note the issue number for the branch/PR

## 3. Planning

Break the work into atomic steps. Each step should:
- Be a single logical change (one concern per commit)
- Map to a conventional commit type (`feat`, `fix`, `style`, `refactor`, `chore`, `docs`, `perf`)
- Be ordered to avoid broken intermediate states

Present the plan to the user before starting implementation.

## 4. Implement Step by Step

For each atomic step:

1. Make the code changes
2. `git add` the relevant files (specific, not `--all` unless intentional)
3. `git commit -m "<type>: <english description>"` — imperative mood, no period, under 72 chars
4. `git push -u origin <branch>`

Available commit types (from AGENTS.md):

| Type | Use for |
|------|---------|
| `feat` | New feature or section |
| `fix` | Bug fix |
| `style` | CSS/visual changes (no logic change) |
| `refactor` | Code restructuring (no feature/fix) |
| `chore` | Tooling, config, housekeeping |
| `docs` | Documentation only |
| `perf` | Performance improvement |

Do NOT add `Co-Authored-By` or any AI agent credit trailers.

## 5. Final Checks

After all steps are committed and pushed:

```bash
pnpm lint
pnpm tsc --noEmit
```

Fix any errors before proceeding.

## 6. Visual Review

Run the dev server:

```bash
pnpm dev
```

Tell the user to review the changes in the browser and report back their opinion.

## 7. Pull Request

Once the user gives feedback (approves or requests tweaks):

- If tweaks are requested, make them, commit with `fix:` or `style:` as appropriate, and push
- Create a PR linking to the issue:

```bash
gh pr create \
  --title "<conventional-commit style title>" \
  --body "Closes #ISSUE_NUMBER" \
  --base main
```

If the user's feedback is simply that everything looks good, proceed directly to creating the PR.
