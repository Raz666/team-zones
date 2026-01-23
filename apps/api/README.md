# API

## Development

From the repo root:

```bash
npm install
npm run --workspace apps/api db:migrate
npm run --workspace apps/api dev
```

From `apps/api`:

```bash
npm install
npm run db:migrate
npm run dev
```

## Environment loading

- `.env` is loaded **only** when `NODE_ENV` is not `production`.
- In production, the API expects env vars to be provided by the hosting platform.
- See `.env.example` for the supported variables.

### Database

- `DATABASE_URL` uses SQLite with a safe default: `file:./prisma/dev.db`.
- Workspace scripts run with `apps/api` as the working directory, so the relative path resolves to `apps/api/prisma/dev.db`.
- `DATABASE_URL` is required in production.
- Migrations are committed under `prisma/migrations`.

### Auth

- `AUTH_JWT_SECRET` and `AUTH_JWT_ISSUER` are required.
- Access tokens default to 15 minutes; refresh tokens default to 90 days.
- `/auth/request-link` uses `AUTH_RATE_LIMIT_MAX_REQUEST_LINK` and `AUTH_RATE_LIMIT_WINDOW_MS`.
- In development, the magic-link token is logged to the console for copy/paste.
- In production, the email sender is a TODO stub (no real delivery yet).

## Migrations

```bash
npm run --workspace apps/api db:migrate
npm run --workspace apps/api db:deploy
npm run --workspace apps/api db:reset
npm run --workspace apps/api db:studio
```

## Endpoints

- `GET /healthz`
- `GET /readyz` (returns 503 when the database is unavailable)
- `POST /auth/request-link`
- `POST /auth/exchange-link`
- `POST /auth/refresh`
- `POST /auth/logout`

## Notes

- `LoginToken` records do not use soft deletes; they are intended to be purged by expiry.
