# Bunseki — Backlog

Source of truth for **what to build next**. Sessions pick the top unblocked
ticket from the active milestone. When a ticket is done, check it off and
update `CHANGELOG.md`.

**Status legend**

- ✅ Done
- 🔵 In progress / active milestone
- ⚪ Not started
- ⛔ Blocked (depends on another ticket; pick something else)
- 🧭 Decision point: Mentor mode applies before any code

**Ticket sizing.** One ticket ≈ one session (30 min to 3 hours). Bigger than
that, split it.

---

## Roadmap at a glance

| #  | Milestone                       | Status         | Notes                                                        |
| -- | ------------------------------- | -------------- | ------------------------------------------------------------ |
| M0 | Foundation & hygiene            | 🔵 Active      | Security and build-integrity fixes from the 2026-11 audit    |
| M1 | Watchlist (persisted)           | ⚪ Not started | Model exists; actions and UI wiring do not                   |
| M2 | Price alerts                    | ⚪ Not started | Types exist in `types/global.d.ts`; nothing implemented      |
| M3 | Portfolio & P&L                 | ⚪ Not started | New feature; heaviest on data-model decisions                |
| M4 | Portfolio readiness (recruiter) | ⚪ Not started | Demo account, README case study, CI, a11y/Lighthouse         |

---

## M0 — Foundation & hygiene 🔵

**Acceptance criteria.** The build fails on real type or lint errors, no
secret can reach the browser, every server action is authorization-safe,
and the README is accurate.

- [ ] **M0-T1 — Make the build honest.** `next.config.ts` sets
      `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds:
      true`, and the `eslint` key is no longer valid in Next 16's
      `NextConfig` (it is itself a type error). Remove both, add a
      `typecheck` script (`tsc --noEmit`), fix whatever surfaces. Also align
      `eslint-config-next` (15.5.2) with Next 16.
- [ ] **M0-T2 — Finnhub key server-only.** Rename
      `NEXT_PUBLIC_FINNHUB_API_KEY` → `FINNHUB_API_KEY` everywhere (code,
      `.env`, Vercel, README). Rotate the key in the Finnhub dashboard,
      because the old one may have shipped in a client bundle. Add
      `.env.example`. MANUAL STEPS required.
- [ ] **M0-T3 — Middleware that actually runs.** 🧭 The auth middleware
      lives in `middleware/index.ts`, which Next does not load (it must be a
      root-level `middleware.ts`, renamed `proxy.ts` in Next 16). Routes are
      still protected by the server-side session check in
      `app/(root)/layout.tsx`. Decide: move it to `proxy.ts` (optimistic
      cookie redirect as a first layer), or delete it and keep the layout
      check as the single gate.
- [ ] **M0-T4 — Server action authorization pass.** `"use server"` files
      export `getWatchlistSymbolsByEmail(email)` and
      `getAllUsersForNewsEmail()`, both of which take or return other users'
      data. Move internal-only helpers into `server-only` modules; make any
      action callable from the client derive the user from the session.
      Run `security-scan`.
- [ ] **M0-T5 — Remove debug noise.** `console.log(results)` in
      `searchStocks`, `(r as any).__exchange` hack, unused commented types.
      Keep `app/api/test-db` (already disabled in production) or remove it
      along with `test-connection.ts`/`check-env.ts` if unused.
- [ ] **M0-T6 — README accuracy.** Broken first screenshot
      (`docs/bunseki_00.png` vs actual `docs/bunseki00.png`), placeholder
      clone URL, env var names that don't match the code (`EMAIL_*` vs
      `NODEMAILER_*`, missing `GEMINI_API_KEY`), "Built by a passionate
      developer" line.
- [ ] **M0-T7 — Test runner.** 🧭 Vitest vs Jest for unit tests; Playwright
      for E2E later (M4). Set up the unit runner with one real test so M1
      starts with tests.
- [ ] **M0-T8 — Unsubscribe link.** Emails link to
      `/unsubscribe?email=...`, a route that doesn't exist and that would put
      an email address in a URL. Implement a signed-token unsubscribe or
      remove the link and the daily email opt-out claim.

---

## M1 — Watchlist (persisted) ⚪

**Acceptance criteria.** A signed-in user can add/remove symbols from the
detail page and the search palette. The state survives reloads and devices,
and there is a dedicated watchlist page with live figures.

- [ ] **M1-T1 — Watchlist server actions.** `addToWatchlist`,
      `removeFromWatchlist`, `getMyWatchlist`. Session-derived user, input
      validation, `company` required by the model (it was missing in the
      earlier implementation and caused validation errors), unique index
      already on `{userId, symbol}`. Run `market-data-invariants`.
- [ ] **M1-T2 — WatchlistButton wired.** 🧭 Optimistic update vs
      wait-for-server. Detail page reads the real `isInWatchlist`.
- [ ] **M1-T3 — Search palette shows real watchlist status** (currently
      hardcoded `isInWatchlist: false`).
- [ ] **M1-T4 — `/watchlist` page.** Self-built table (price, change, % change,
      market cap, P/E) using `StockWithData`/`WatchlistTableProps`. 🧭 Quote
      fetching strategy under the Finnhub rate limit.
- [ ] **M1-T5 — Watchlist news panel** (`WatchlistNewsProps`), reusing
      `getNews(symbols)`.

---

## M2 — Price alerts ⚪

**Acceptance criteria.** A user can create "price above/below X" alerts per
symbol, sees them listed, and receives exactly one email when a threshold is
crossed.

- [ ] **M2-T1 — Alert model + actions.** 🧭 Data model (one collection vs
      embedded in watchlist), statuses (active, triggered, paused).
- [ ] **M2-T2 — Alert modal + alerts list UI** (`AlertModalProps`,
      `AlertsListProps`).
- [ ] **M2-T3 — Evaluation job.** 🧭 Inngest cron during US market hours,
      batched quotes within the rate limit, crossing detection with
      idempotency (an alert fires once per crossing, never twice on retry).
- [ ] **M2-T4 — Alert notification email** with the existing email
      pipeline.

---

## M3 — Portfolio & P&L ⚪

**Acceptance criteria.** A user can record buys/sells and see positions,
cost basis, unrealized and realized P&L, day change, and allocation, all
computed by tested pure functions.

- [ ] **M3-T1 — Data model.** 🧭 Transactions (lots) vs positions; money
      representation (JS number vs integer minor units vs Decimal128);
      cost-basis method (FIFO vs average cost). Biggest decision in the
      project; write a longer ADR.
- [ ] **M3-T2 — Transactions CRUD + form.**
- [ ] **M3-T3 — P&L engine.** Pure functions + unit tests (partial sells,
      multiple lots, zero-quantity positions).
- [ ] **M3-T4 — Portfolio dashboard.** Self-built charts (allocation, value
      over time). Use the `dataviz` skill. 🧭 Chart library.
- [ ] **M3-T5 — Historical prices.** 🧭 Verify which Finnhub endpoints the
      current plan allows for daily candles before designing around them.

---

## M4 — Portfolio readiness ⚪

**Acceptance criteria.** A recruiter can try the app in under a minute and
understand the engineering behind it in under five.

- [ ] **M4-T1 — Demo account** with seeded watchlist, alerts, and portfolio
      ("Try the demo" button, read-only or reset nightly). 🧭
- [ ] **M4-T2 — README as a case study.** Problem, architecture diagram,
      3–4 key decisions pulled from `DECISIONS.md`, screenshots, what's next.
- [ ] **M4-T3 — CI.** GitHub Actions: typecheck, lint, unit tests, build on
      every PR.
- [ ] **M4-T4 — E2E smoke tests** (Playwright): sign in, add to watchlist,
      create alert, add transaction.
- [ ] **M4-T5 — Accessibility + Lighthouse pass.**
