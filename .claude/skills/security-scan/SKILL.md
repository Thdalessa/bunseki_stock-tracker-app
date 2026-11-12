---
name: security-scan
description: Security audit of the Bunseki codebase. Invoke before any PR that touches server actions ("use server" files), API routes, auth (Better Auth), middleware/proxy, database models, Inngest functions, email sending, or env config, and after adding any npm package. Also on demand for a full audit. Produces a PASS/WARN/FAIL report with file references and fixes.
---

# security-scan

Bunseki stores user accounts, emails, investor profiles, and (from M3)
portfolio holdings. It's also a public portfolio piece: a reviewer who finds
an exposed key or an IDOR (one user reading another's data) in the repo will
judge the whole thing by it.

Work through every category. Grep and read the files; don't rely on memory.

## 1 — Secrets & env

- [ ] No variable holding a secret starts with `NEXT_PUBLIC_`
      (`grep -rn "NEXT_PUBLIC_" --include=*.ts --include=*.tsx .`).
- [ ] No `.env*` file tracked or ever committed:
      `git ls-files | grep -i env`, `git log --all --oneline -- .env .env.local`.
- [ ] No secret-looking literals in history:
      `git log --all -p -S "api_key" | head`, same for `mongodb+srv`, `token=`.
- [ ] Every `process.env.X` used in code is listed in `.env.example`; no
      hardcoded fallbacks for secrets.
- [ ] No logging of env values, tokens, or full request/response payloads.

FAIL: any secret reachable from the client bundle or in git history (the fix
includes rotating the key; tell Thiago).

## 2 — Server actions & authorization (IDOR)

- [ ] List every export in every `"use server"` file. Each one is a public
      POST endpoint.
- [ ] Each derives the user from `auth.api.getSession({ headers })` and
      scopes every query to that user. None accepts `userId`/`email` from
      the caller to choose whose data to touch.
- [ ] Internal helpers (used only by Inngest or other server code) live in
      `import "server-only"` modules, not `"use server"` files.
- [ ] DB queries for user-owned data include the owner in the filter
      (e.g. `{ _id, userId }`), not just `_id`.

FAIL: any action that reads or mutates another user's data given a
parameter.

## 3 — Input validation

- [ ] Every server action and API route validates input with a schema
      before use. Symbols: uppercase, length-bounded, charset-limited.
      Numbers: finite, bounded. Strings: `max` length.
- [ ] User input interpolated into Finnhub URLs goes through
      `encodeURIComponent`.
- [ ] No Mongo query built from raw objects the client controls (operator
      injection like `{ "$ne": null }`).

## 4 — Auth & routing

- [ ] Protected routes are gated server-side (layout or page session check).
      Middleware/proxy is an optimistic first layer only, never the sole
      gate.
- [ ] Better Auth: `BETTER_AUTH_SECRET` strong and set in every
      environment; `baseURL` correct per env; password length policy
      sensible. Note: email verification is currently off (record as WARN
      with rationale, not FAIL).
- [ ] Sign-in/sign-up errors don't reveal whether an email exists.

## 5 — Background jobs & email (Inngest, Nodemailer)

- [ ] `/api/inngest` requires the Inngest signing key in production.
- [ ] Jobs are idempotent (see `market-data-invariants` §5).
- [ ] Emails contain no PII in URLs. Unsubscribe uses a signed token, not
      a raw email address.
- [ ] LLM output (Gemini) is treated as untrusted text: escaped before
      being inserted into HTML templates.

## 6 — Client-side & headers

- [ ] No `dangerouslySetInnerHTML` with user or LLM content.
- [ ] Third-party scripts limited to TradingView's known origin; note CSP
      status (WARN if none).
- [ ] Debug endpoints (`/api/test-db`) disabled in production.

## 7 — Dependencies

- [ ] `npm audit --omit=dev`: list criticals/highs with a decision each.
- [ ] Any newly added package: maintained, reasonable download count, no
      install scripts doing anything surprising.

## Report format

```
SECURITY SCAN: <branch> · <date>

| # | Check                                  | Result | Where / fix            |
|---|----------------------------------------|--------|------------------------|
| 1 | No NEXT_PUBLIC_ secrets                | FAIL   | finnhub.actions.ts:8 … |
| 2 | Server actions session-scoped          | WARN   | …                      |

Verdict: FAIL (n) · WARN (n) · PASS (n)
Blocking for merge: <list of FAILs>
```

FAILs block the PULL REQUEST block. WARNs need a one-line decision each,
recorded in `AGENT_NOTES.md`.
