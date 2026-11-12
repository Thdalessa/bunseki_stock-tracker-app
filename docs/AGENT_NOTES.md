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
