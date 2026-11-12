# Bunseki — Agent Notes

Working notebook: gotchas, conventions not obvious from the code, deferred
items. Append-only, newest at the bottom. Read the last 10 entries at the
start of every session.

---

## 2026-11-12 — Audit when the operating manual was introduced

State of `main` at `2b57014` (last commit 2026-03-14).

**Works:** dashboard (TradingView widgets), Cmd/Ctrl+K search via Finnhub,
`/stocks/[symbol]` detail page (TradingView widgets), Better Auth
email/password with onboarding fields, Inngest welcome email (Gemini
`gemini-2.5-flash-lite`) and daily news cron (`0 12 * * *` UTC).

**Gotchas found:**

- `next.config.ts` has `ignoreBuildErrors: true` and
  `eslint.ignoreDuringBuilds: true`, so type and lint errors never fail a
  build. `npx tsc --noEmit` currently reports one error: the `eslint` key
  isn't a valid `NextConfig` property in Next 16. → M0-T1.
- `middleware/index.ts` is never loaded by Next (needs root `middleware.ts`
  / `proxy.ts` in Next 16). Real protection comes from the session check in
  `app/(root)/layout.tsx`. → M0-T3.
- Finnhub key is `NEXT_PUBLIC_FINNHUB_API_KEY`. It's only read in a
  `"use server"` file, but the prefix makes it eligible for client bundling,
  and the name invites misuse. → M0-T2.
- `lib/actions/watchlist.actions.ts` and `lib/actions/user.actions.ts` are
  `"use server"` files exporting functions that take an email or return all
  users. They're only called from Inngest today, but the pattern is unsafe.
  → M0-T4.
- `WatchlistButton` only toggles local state; nothing persists. Search
  results hardcode `isInWatchlist: false`. → M1.
- `types/global.d.ts` declares types for alerts, watchlist table, quotes,
  profiles, financials, with no implementation behind them. They're a
  useful sketch for M1/M2; don't treat them as a contract.
- README first screenshot path is wrong (`bunseki_00.png` vs
  `bunseki00.png`), and its env var names don't match the code. → M0-T6.
- Email unsubscribe link targets a non-existent `/unsubscribe?email=` route.
  → M0-T8.
- Package manager is **npm** (`package-lock.json`). Don't introduce pnpm/yarn
  lockfiles.
- Better Auth uses the raw MongoDB driver via `mongoose.connection.db`; its
  collections (`user`, `session`, `account`, `verification`) are not
  Mongoose models. User lookups use `user.id`, not `_id`.

## 2026-11-12 — M0-T1 (honest build)

- **Next 16's `next build` does not run ESLint.** Lint is enforced only
  because the `build` script runs `npm run lint` first (ADR-002). Don't
  remove that until CI exists (M4-T3).
- **`redirect()`, `notFound()` and `headers()` work by throwing.** Any
  `try/catch` around them must call `unstable_rethrow(error)` first in the
  `catch`, or it swallows the redirect (this caused a `/sign-in` redirect
  loop) and logs build-time dynamic-rendering probes as errors.
- **`next build` rewrites `tsconfig.json`** (Next 16 forces
  `jsx: react-jsx` and adds `.next/dev/types`). Commit those changes.
- `eslint-config-next` v16 ships a native flat config; import
  `eslint-config-next/core-web-vitals` and `/typescript` directly, no
  `FlatCompat`. It enables the React Compiler hook rules
  (e.g. `react-hooks/set-state-in-effect`), which are errors, not warnings.
- **Deferred to M0-T3:** `app/(auth)/layout.tsx` still redirects to
  `/sign-in` when the session check genuinely fails, which loops if the
  failure happens on `/sign-in` itself. The comment's intent was "render the
  auth page anyway". Decide alongside the middleware/proxy work.
- `SearchCommand`: `i === stocks.length - 1` compares against `stocks`, not
  `displayStocks`, so the rounded last-item corner is wrong when the
  popular list is sliced to 10. Cosmetic; left for M0-T5.

## 2026-11-12 — security-scan on the M0-T1 branch (WARN decisions)

- **Finnhub key still `NEXT_PUBLIC_`** → tracked in M0-T2 (rename + rotate).
- **No `.env.example`** → tracked in M0-T2.
- **`"use server"` exports taking an email / returning all users**
  (`getWatchlistSymbolsByEmail`, `getAllUsersForNewsEmail`) → tracked in
  M0-T4.
- **Middleware not loaded; auth layout failure path can loop** → M0-T3.
  Layouts remain the server-side gate, so this is WARN, not FAIL.
- **Unsubscribe link carries a raw email** → tracked in M0-T8.
- **Prod dependency criticals (`next`, `better-auth`, `mongoose`,
  `protobufjs`)** → pre-existing on `main`, not introduced by this branch
  (only devDependencies changed). New ticket M0-T9.
- **LLM HTML and user `name` inserted unescaped into email templates** →
  new ticket M0-T10.
- **Inngest signing key:** `serve()` reads `INNGEST_SIGNING_KEY` from the
  environment implicitly; it isn't referenced in code, so confirm it's set
  in Vercel during M0-T2's env pass.
- **No CSP header** → defer to M4 (TradingView embeds need a tuned policy).
