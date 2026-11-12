# Bunseki — Changelog

What shipped, one section per milestone, newest first. Written for humans:
a reviewer should be able to read this without opening the code.

---

## M0 — Foundation & hygiene

- **Honest build (M0-T1).** Type and lint errors now fail the build instead
  of being silently ignored. Added `npm run typecheck`, upgraded the ESLint
  config to Next 16, and fixed everything that surfaced: untyped Finnhub
  search data, a React effect that caused extra renders, and an unstable
  TradingView widget effect.
- **Fixed a redirect loop.** Signed-in users opening `/sign-in` were sent
  back to `/sign-in` instead of the dashboard, because an error handler was
  catching Next's own redirect.

---

## Pre-backlog (2025-12 → 2026-03)

- Dashboard with TradingView market overview, heatmap, news, and quotes.
- Stock search with Cmd/Ctrl+K command palette backed by Finnhub.
- Stock detail pages with chart, technical analysis, and financials widgets.
- Email/password auth (Better Auth) with investor-profile onboarding.
- AI-personalized welcome email and daily news digest (Inngest + Gemini).
- Deployed to Vercel.
