---
name: session-start
description: Orient yourself at the beginning of every Bunseki session. Use at the very start of any session on the bunseki repo, before reading source or doing any work, even if the user just says "continue" or "let's keep going". Loads the living docs (CHANGELOG, AGENT_NOTES, DECISIONS, BACKLOG), checks git state, and outputs a concise "you are here" briefing ending with a suggested next ticket.
---

# session-start

Bunseki sessions can be days or weeks apart. Walking in cold leads to
rebuilding things that exist, missing constraints recorded in past decisions,
and re-proposing options Thiago already rejected. This takes two minutes.

## Steps (in order)

### 1. Read the living documents

1. `docs/CHANGELOG.md`: the latest milestone section.
2. `docs/AGENT_NOTES.md`: the last 10 entries, end to end.
3. `docs/DECISIONS.md`: skim titles; read any ADR relevant to the next
   ticket in full.
4. `docs/BACKLOG.md`: the active milestone (🔵). Identify the top unchecked,
   unblocked ticket and whether it is a 🧭 decision point.

### 2. Check git state

```bash
git status
git branch --show-current
git log --oneline -10
git log --since="2 weeks ago" --name-status --pretty=format:'%h %s' | head -60
```

Warn loudly if on `main` with uncommitted changes. If the working tree is
dirty, show it and ask before touching those files.

### 3. Output the briefing

```
📈 Bunseki: session orientation

Where we are
  Active milestone: M1 — Watchlist (🔵)
  Last shipped:     M0-T8 (signed unsubscribe link)
  Open in milestone: M1-T1 … M1-T5

Current branch
  main · working tree clean

Notes that affect this session
  - (relevant AGENT_NOTES / ADR lines, quoted briefly)

Suggested next move
  M1-T1 — watchlist server actions. Plan mode recommended (new actions +
  validation). Contains a 🧭 decision: <what>.

Awaiting your go-ahead.
```

## Edge cases

- **No BACKLOG.md**: tell Thiago; don't guess.
- **No 🔵 milestone**: ask which milestone is next.
- **CHANGELOG/AGENT_NOTES stale** relative to git log: flag it and offer to
  catch them up before new work.

## Don't

- Don't read source code here. The briefing is about state.
- Don't propose a long plan. End with "Awaiting your go-ahead."
