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

## Notes

- `LoginToken` records do not use soft deletes; they are intended to be purged by expiry.
