# Bunseki — Database reference

MongoDB (Atlas). Connection cached on `global.mongooseCache` in
`database/mongoose.ts` to survive serverless/hot-reload. Update this file
whenever a model or index changes.

## Conventions

- Timestamps stored as UTC `Date`.
- Symbols stored uppercase, trimmed.
- The app-level user id is Better Auth's `user.id` (string), not `_id`.
- Money/quantity representation: **undecided**, see M3-T1.

## Collections

### Better Auth (managed by the library, raw driver, no Mongoose model)

`user`, `session`, `account`, `verification`. Schema owned by Better Auth;
don't write to these directly except through `auth.api.*`.

Note: the onboarding fields (country, investment goals, risk tolerance,
preferred industry) are currently only sent in the Inngest event, not
persisted on the user.

### `watchlists` (Mongoose model `Watchlist`)

| Field     | Type   | Notes                         |
| --------- | ------ | ----------------------------- |
| userId    | String | required, Better Auth user id |
| symbol    | String | required, uppercase, trimmed  |
| company   | String | required, trimmed             |
| addedAt   | Date   | default now                   |

Indexes: unique compound `{ userId: 1, symbol: 1 }`.
