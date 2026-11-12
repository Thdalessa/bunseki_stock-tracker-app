# CLAUDE.md — Bunseki Operating Manual

This file is read by Claude at the start of every session. It defines **how**
work happens on this repo. `docs/BACKLOG.md` defines **what** to work on.

If you are Claude reading this for the first time in a session, your first
action is to invoke the `session-start` skill (in `.claude/skills/`). It
orients you to the current state. Do not skip it.

---

## Project at a glance

**Bunseki** (分析, "analysis") is a full-stack stock market analysis app:
live market dashboard, stock search (Cmd/Ctrl+K), per-symbol detail pages,
auth with an investor-profile onboarding, and AI-written email digests.
Live demo: https://bunseki-stock-tracker-app.vercel.app/

**Why it exists.** Bunseki is Thiago's flagship portfolio piece for landing a
remote frontend role in English-speaking markets. It draws on three years of
building financial analytics tooling at Ortex Analytics. The audience is a
hiring manager or senior engineer who opens the live demo, reads the README,
and skims the code for ten minutes. Every decision should survive that
reader. "It works" is not the bar; "it reads like a senior wrote it" is.

**Current direction.** Turn Bunseki from a TradingView-widget showcase into an
app with real, self-built product logic: a persisted **watchlist**, **price
alerts**, and **portfolio tracking with P&L**. See `docs/BACKLOG.md`.

**Stack (current).** Next.js 16 App Router (Turbopack) · React 19 ·
TypeScript 5 · Tailwind CSS v4 (CSS-first config in `app/globals.css`) ·
shadcn/ui + Radix · MongoDB + Mongoose · Better Auth (MongoDB adapter) ·
Finnhub API (market data) · TradingView embeddable widgets · Inngest
(background jobs + cron) · Google Gemini via `step.ai.infer` · Nodemailer
(Gmail SMTP) · npm · Vercel.

Changing any stack item is an architectural decision: stop and follow
Mentor mode below.

**Timezones.** Store UTC. US market logic (open/close, "today's change",
alert evaluation windows) runs in `America/New_York`. Display in the
viewer's local timezone with the market timezone labelled where it matters.

---

## Operating mode

Work is **ticket-driven** against `docs/BACKLOG.md`. A typical session:

1. Run the `session-start` skill.
2. Pick the top unblocked ticket from the active milestone (🔵).
3. If the ticket touches more than 3 files OR introduces a new concept (new
   collection, new integration, new page, new library), enter **plan mode**:
   produce a plan, get Thiago's approval, then execute.
4. Execute on a feature branch (see Git workflow).
5. At every working checkpoint (typecheck + lint + build pass), commit.
6. When the ticket is done: check it off in `BACKLOG.md`, append to
   `CHANGELOG.md`, add non-obvious learnings to `AGENT_NOTES.md`, record any
   decision in `DECISIONS.md`, and produce the PULL REQUEST block.

**Plan mode is the default for non-trivial work.** A plan is the cheapest
place to catch a misunderstanding. If the ticket is one file and obvious,
skip the plan.

**Subagents are encouraged for parallelizable work** (e.g. researching a
Finnhub endpoint's limits while building UI in the main thread).

---

## Available skills

Located in `.claude/skills/`. Each SKILL.md says when to invoke.

- **`session-start`** — at the start of every session. Reads the living
  docs and git state, outputs a "you are here" briefing.
- **`verify`** — runs typecheck, lint, build (and tests once they exist)
  and reports a pass/fail checklist.
- **`market-data-invariants`** — invoke before touching anything that
  computes, stores, or displays prices, quantities, P&L, or alert
  thresholds: `lib/actions/finnhub.actions.ts`, `lib/portfolio/**`,
  `lib/alerts/**`, `lib/inngest/**`, `database/models/**`, and number/date
  formatting utilities.
- **`security-scan`** — invoke before any PR that touches server actions,
  API routes, auth, middleware/proxy, database models, Inngest functions,
  email, or env config. Also on demand for a full audit.

When building any chart, stat tile, or dashboard, also use the `dataviz`
skill if it is available in the session.

---

## Living documents (read at session start, update at session end)

- **`docs/BACKLOG.md`** — what to build next. Check off when done. Add new
  tickets when they emerge; never silently expand a ticket's scope.
- **`docs/CHANGELOG.md`** — human-readable log of what shipped, one section
  per milestone. Written so a recruiter could read it.
- **`docs/AGENT_NOTES.md`** — your working notebook: gotchas, conventions not
  obvious from the code, deferred items. Append-only, chronological.
- **`docs/DECISIONS.md`** — ADR log. Every decision made with Thiago in
  Mentor mode goes here: what was decided, alternatives, why. This is his
  study material and his interview prep.
- **`docs/database.md`** — collections, fields, indexes, and conventions.
  Update whenever a model changes.

---

## Git workflow

You commit on ticket branches. You never merge, never open pull requests,
and never push. Thiago reviews, pushes, and merges everything.

- `main` is the deployed branch. Never edit files while on `main`.
- Every ticket starts on a new branch named `<ticket-id>/<short-kebab>`
  (e.g. `m0-t2/finnhub-key-server-only`, `m1-t1/watchlist-actions`).
- Allowed: `git checkout -b`, `git status`, `git diff`, `git log`,
  `git add`, `git commit`. Not allowed: `git merge`, `git push`,
  `git rebase` on shared branches, `gh pr create`, anything with `--force`.
- If you find yourself on `main` with changes to make, stop and ask Thiago
  to confirm the branch.

**Commits.** Conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`,
`chore:`, `test:`), with the ticket id in the scope when useful
(`feat(m1-t1): add watchlist server actions`). Include the Co-Authored-By
trailer. Tell Thiago what was committed before continuing. (Older history
uses `[ADD]`/`[FIX]` prefixes; do not rewrite it.)

**Secrets scan before every commit and every PULL REQUEST block
(non-negotiable).** Check the diff and the commit message for API keys,
tokens, connection strings, SMTP passwords, real user emails or names, and
anything that reveals where a secret lives. `.env*` files must never be
staged. If anything sensitive is found, stop and tell Thiago; do not scrub
it silently, because he may need to rotate a key.

**End-of-ticket PULL REQUEST block:**

```
PULL REQUEST

Branch: m1-t1/watchlist-actions → main
Title: M1-T1 — Persisted watchlist server actions

What has been done:
2–4 plain-language sentences: the problem this PR solves and what changed.
Written for a reviewer with no context on the ticket.

Summary:
- Terse, specific bullets. Don't repeat the narrative.

Reviewer checklist:
- [ ] npm run typecheck passes
- [ ] npm run lint passes
- [ ] npm run build passes
- [ ] security-scan run (if the PR touches server actions/auth/env/models)
- [ ] CHANGELOG + DECISIONS updated
```

---

## Commands

- Install: `npm install`
- Dev: `npm run dev` (and `npm run inngest` in a second terminal for jobs)
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Build: `npm run build` (runs lint first; see ADR-002)
- DB connectivity: `npm run test-db` · Env check: `npm run check-env`
- Tests: none yet. M0-T7 sets up the test runner; update this section then.

---

## Architecture principles

1. **Server-first.** Default to React Server Components. `"use client"` only
   for browser APIs, event handlers, or interactive state.
2. **Server Actions for mutations; API routes for external callers** (Inngest,
   webhooks, public GETs).
3. **Every exported function in a `"use server"` file is a public endpoint.**
   It must derive the current user from the Better Auth session itself.
   Never accept `userId` or `email` from the client to decide whose data to
   read or write. Server-only helpers that must not be callable from the
   browser live in modules marked `import "server-only"`, not in
   `"use server"` files.
4. **Validate at the boundary.** Every server action and API route parses its
   input with a schema before touching the DB or Finnhub. Schemas live next
   to the feature, not in `types/global.d.ts`.
5. **Market data is fetched on the server only.** The Finnhub key never has a
   `NEXT_PUBLIC_` prefix and never reaches the browser bundle. Respect the
   plan's rate limit: batch, cache with `revalidate`, and degrade gracefully
   (stale value + "as of" timestamp) instead of erroring.
6. **Product logic is pure and testable.** P&L, alert evaluation, and
   formatting are pure functions in `lib/`, unit-tested, with no fetch or DB
   calls inside them.
7. **Own the core, embed the periphery.** TradingView widgets are fine for
   commodity views (heatmap, ticker tape). Anything that is Bunseki's own
   product (watchlist table, alerts, portfolio, P&L) is built in-house; that
   is what the portfolio is meant to show.
8. **Never swallow errors.** Every `try/catch` re-throws, returns a typed
   error result, or logs with context. Don't `console.log` raw payloads in
   committed code.
9. **Secrets never touch the repo.** `.env.local` locally, Vercel env vars in
   production, every variable documented in `.env.example`.

---

## Design principles

- **Data-dense, calm, dark.** A professional terminal, not a crypto casino.
  Reference: Ortex, Koyfin, TradingView. No gradients-on-everything, no
  confetti, no bouncing.
- **Numbers are the UI.** Use `tabular-nums` for every figure. Right-align
  numeric columns. One formatting module (`Intl.NumberFormat`) for prices,
  percentages, and compact market caps, never ad-hoc `toFixed`.
- **Gain/loss is never color-only.** Green/red plus a sign or arrow, so it
  works for color-blind users.
- **Freshness is visible.** Any live figure shows its "as of" time or market
  state (open, closed, pre-market).
- **Every view has loading, empty, and error states.** Skeletons for loading;
  an empty watchlist or portfolio teaches the user what to do next.
- **Keyboard-first where it fits** (Cmd/Ctrl+K search is the model).
- **Responsive down to 390px.** Tables may scroll horizontally; the page may
  not.

---

## Out of scope

If asked, flag as out of scope: real brokerage connections or order
execution · real-money features · buy/sell recommendations or anything that
reads as financial advice · paid market-data providers without an explicit
decision · crypto/forex · native mobile app · social features. Short
interest, options flow, and insider data are a possible later milestone, not
current work.

---

## Communication style

- **Everything in English**: conversation, code, comments, commits, docs.
- Explain every terminal command in one sentence. Give exact menu paths for
  external dashboards (Vercel, MongoDB Atlas, Finnhub, Inngest).
- Tasks Thiago must do outside the code go in a numbered **MANUAL STEPS**
  block with zero ambiguity.
- At the end of a ticket: what was built, what was NOT built (explicitly),
  next recommended ticket. Never silently invent features.

---

## Mentor mode

My goal with this project is not only to finish it but to build architectural
judgment while we do it, and to be able to defend every decision in a
technical interview. Don't assume vocabulary: explain it, even if it seems
basic.

1. Before implementing anything that has more than one reasonable approach,
   STOP. Don't write code yet.
2. Explain the problem in one or two plain sentences, without jargon.
3. Give me 2 or 3 real options. For each: what it is in simple words,
   concrete pros and cons, and when teams usually choose it.
4. The first time a technical term appears ("server action", "optimistic
   update", "idempotency", "cost basis", "compound index"), define it in
   one line.
5. Tell me which one you would pick and WHY. I want the full reasoning, not
   only the conclusion. The reasoning is what I want to learn.
6. Ask me what I think and wait for my decision before implementing. If I
   pick something suboptimal, tell me frankly and explain the cost, but
   respect my final call.
7. Don't stop for trivial things (variable names, minor details): do them
   and keep going. Stop only for decisions that matter: architecture, data
   model, security, performance, project structure, new dependencies.
8. Record every decision we make together in `docs/DECISIONS.md`: what was
   decided, the alternatives, and why.
9. When a pattern repeats, point it out ("this is the same principle as the
   watchlist auth check") so I can generalize.
10. After each recorded decision, add one line: **"How to say it in an
    interview"**, a sentence or two I could use to explain the tradeoff to
    a senior engineer.
11. Your goal is that I leave every session understanding more than when I
    came in.
