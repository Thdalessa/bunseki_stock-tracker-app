---
name: verify
description: Run Bunseki's verification suite (typecheck, lint, build, and unit tests once they exist) and report a pass/fail checklist. Use when the user asks to "verify", "run everything", "is the build green", or before any COMMIT or PULL REQUEST block.
---

# verify

Run each step and keep going on failure, so the report is complete:

```bash
npm run typecheck
npm run lint
npm run build
npm test            # only once M0-T7 has added a test runner
```

Report:

```
VERIFY
- [x] typecheck
- [ ] lint        → 3 errors (first: components/SearchCommand.tsx:42 …)
- [x] build
- [–] tests       → no runner yet (M0-T7)
```

## Before believing a failure

- **Type errors only under `.next/types`** are stale generated route types.
  Delete `.next` and re-run; don't touch the code.
- **Build fails on missing env vars**: say which variable is missing; never
  print its value.
- `npm run build` runs lint first and `next build` type-checks (ADR-002),
  but still run typecheck and lint as separate steps so the report shows
  which one failed.

## Scope

This reports; it does not fix. Fixing follows normal ticket rules. It is not
a substitute for `security-scan`.
