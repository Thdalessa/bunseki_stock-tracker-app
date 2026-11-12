---
name: market-data-invariants
description: Enforce Bunseki's correctness rules for market data, money, and time. Invoke before writing or changing code that fetches quotes or news (lib/actions/finnhub.actions.ts), computes or stores prices, quantities, P&L, or alert thresholds (lib/portfolio/**, lib/alerts/**, database/models/**), runs scheduled jobs (lib/inngest/**), or formats numbers and dates. Invoke even for "small" changes; that's how financial bugs get in.
---

# market-data-invariants

In a finance app, a wrong number is worse than a missing one. A recruiter
who spots a P&L that doesn't add up stops reading. These are the rules.

## 1. Money and quantities

- Representation follows the ADR from M3-T1. Until it exists, don't
  persist money: compute in memory only, and flag any ticket that needs to
  store it.
- Never do arithmetic on formatted strings. Format only at the edge (render).
- Rounding happens once, at display, through the shared formatter. Never
  `toFixed` inside calculations.
- Quantities can be fractional (fractional shares). Don't assume integers.

## 2. P&L and calculations

- Calculations are pure functions in `lib/`: input data in, numbers out. No
  fetch, DB, or `Date.now()` inside; pass "now" and prices as arguments.
- Every calculation function ships with unit tests covering: empty input,
  a single lot, multiple lots, partial sell, full sell (zero position), and
  a price of 0 / missing price.
- Percent change uses the previous close as the base, and divide-by-zero
  returns `null` (rendered as "—"), never `Infinity` or `NaN`.

## 3. Time

- Store UTC. Market logic uses `America/New_York` (handles DST). "Today",
  "day change", and "market open" are computed in market time, not server
  time, and not the user's local time.
- Every displayed live value carries an "as of" timestamp or market-state
  label.

## 4. Fetching (Finnhub)

- Server-only. Key read from `FINNHUB_API_KEY` (no `NEXT_PUBLIC_`).
- Respect the plan's rate limit (check the current limit in Finnhub's docs;
  don't trust memory). Batch per-symbol calls, cap concurrency, cache with
  `revalidate` appropriate to the data (quotes: seconds; profiles: hours;
  news: ~1h).
- A failed or rate-limited fetch degrades to the last known value with its
  timestamp, or an explicit "unavailable" state. Never a fake 0.
- Validate response shapes before use; Finnhub returns `{}` or zeros for
  unknown symbols instead of an error.

## 5. Alerts and scheduled jobs (Inngest)

- **Idempotent.** An alert fires once per threshold crossing. Retries and
  overlapping cron runs must not send duplicates. Persist the trigger
  before or atomically with sending, and wrap side effects in `step.run`.
- **Crossing, not level.** "Above 200" triggers when the price moves from
  ≤200 to >200, not on every run while it stays above.
- Evaluate only during relevant market hours unless the ticket says
  otherwise.

## 6. Language

- No text that reads as advice ("buy", "you should sell"). Describe data;
  don't recommend.

## Output

When invoked, list each rule area touched by the change with ✅ (holds),
⚠️ (needs attention, with file:line), or N/A, before writing the COMMIT
block.
