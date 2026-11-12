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
