# BudgetIQ project overrides (local enhancement)

This file is a project-local enhancement layered on top of the upstream Impeccable skill. It is read after `SKILL.md` and before any command reference. It records the **recommended answers** for this repository so agents can proceed without an interview.

## Recommended answers

The repository maintainer explicitly asked for no interactive questions for the skill setup and follow-up work. When Impeccable's references call for a question, use these answers and state the substitution once in the first reply:

| Question | Recommended answer |
|---|---|
| Who is the product for? | See `PRODUCT.md` → **Users**. Privacy-conscious people who are tired of manual data entry, including freelancers with variable income. |
| What must be preserved? | The domain vocabulary in `CONTEXT.md`; the "not a budgeting/limits product" positioning; display-only currency conversion; light and dark DaisyUI themes; RLS privacy story. |
| New surface or replacement world? | No replacement world. Extend the incumbent DaisyUI/Tailwind system. |
| Mode for the landing page | Persuade. |
| Mode for dashboard, settings, onboarding, admin, assistant drawer | Operate. |
| Mockup-first or code-led? | Code-led. Verify by rendering the real app. |
| How much to change? | Narrow, evidence-backed refinements only. No redesign, no new visual language. |
| Which issues to implement? | P0 then P1 findings from `critique`/`audit` only. Hand them to the `implement` skill with acceptance criteria. |
| How to close a critique when 3+ issues were found? | Apply the recommended answer above, then emit `Questions skipped: maintainer instructed no questions; recommended answers applied.` Do not stall the run. |

## Durable context

- `PRODUCT.md` — product truth, users, brand commitments, constraints.
- `CONTEXT.md` — authoritative domain language; always load before writing UI copy.
- `docs/adr/` — architecture decisions, including display-only currency.
- `.agents/skills/implement/SKILL.md` — the implementation workflow for critique findings.

## Handoff contract: Impeccable → implement

When a critique or audit produces findings that need code changes, write a plan file to `design-plans/<slug>.md` with, for each P0/P1 finding:

- `id`, `severity`, `title`
- `files` — concrete paths
- `problem` — verified evidence
- `acceptance_criteria` — testable bullets
- `suggested_command` — the Impeccable command that would address it

Then invoke the `implement` skill with that file as the spec. Do not edit product source during planning-only critique/audit runs.

## Detector

After UI edits, run the deterministic scan once:

```bash
.opencode/skills/impeccable/scripts/impeccable detect --json <changed targets>
```
