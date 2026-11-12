# Bunseki — Architecture Decision Records

Non-obvious calls, with rationale. One entry per decision. Each entry ends
with a "How to say it in an interview" line.

Format:

```
## ADR-NNN — Title
**Date:** YYYY-MM-DD · **Status:** Accepted | Superseded by ADR-NNN
**Context:** what problem forced a choice.
**Options:** the 2–3 alternatives considered.
**Decision:** what we picked.
**Why:** the reasoning.
**Consequences:** what this makes easier/harder.
**How to say it in an interview:** one or two sentences.
```

---

## ADR-001 — Ticket-driven workflow with a CLAUDE.md operating manual

**Date:** 2026-11-12 · **Status:** Accepted

**Context:** Bunseki is being taken from a tutorial-shaped app to a flagship
portfolio piece. Work happens across many sessions with Claude, days apart.

**Options:** ad-hoc prompting per session; a fixed sequence of prompts; a
ticket backlog with living docs (the model used on Villa Aike).

**Decision:** Ticket backlog (`docs/BACKLOG.md`) + living docs + Mentor
mode, mirroring Villa Aike.

**Why:** Sessions start from recorded state instead of memory, decisions are
written down once, and the docs double as evidence of engineering process
for reviewers.

**Consequences:** Small overhead per ticket (CHANGELOG, DECISIONS updates).

**How to say it in an interview:** "I ran the project like a small team
would: a prioritized backlog, ADRs for every non-obvious decision, and a
changelog, so anyone could pick it up mid-stream."

---

## ADR-002 — Enforce lint by chaining it into the build script

**Date:** 2026-11-12 · **Status:** Accepted (to be superseded in M4-T3)

**Context:** M0's acceptance criteria require the build to fail on lint
errors. Next 16 removed ESLint from `next build` entirely (and the `eslint`
key from `NextConfig`), so lint errors would no longer block a Vercel
deploy. There is no CI yet.

**Options:**
A) `"build": "npm run lint && next build"`, explicit in the build script.
B) A `prebuild` npm lifecycle script, run automatically before `build`.
C) Leave the build alone and enforce lint in CI (GitHub Actions).

**Decision:** A now; switch to C when CI lands in M4-T3.

**Why:** C is the industry norm but leaves lint unenforced for three
milestones. Between A and B, A is explicit: anyone reading `package.json`
sees what a build does, while `prebuild` runs by naming convention and is
easy to miss. Cost: every build (local and Vercel) runs lint, adding a few
seconds.

**Consequences:** Vercel deploys fail on lint errors. Warnings don't fail
the build. M4-T3 must remove the chain and supersede this ADR.

**How to say it in an interview:** "Next 16 stopped linting during builds,
so before we had CI I chained lint into the build script, explicitly
rather than through a hidden prebuild hook, so a lint error couldn't reach
production. It was a deliberate stopgap: once CI exists, lint moves there,
where it belongs."
