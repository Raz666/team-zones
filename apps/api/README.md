# Team Zones API

Fastify-based API foundation with strict config validation and operational
endpoints.

## Quick start

1) Copy the example env file and adjust as needed (it is auto-loaded when
running the API):

```bash
cp .env.example .env
```

2) Run the dev server:

```bash
# From repo root
npm run --workspace apps/api dev

# From apps/api
npm run dev
```

The server will fail fast at startup if required env vars are missing or invalid.

## Required environment variables

These must be provided (see `.env.example`):

- `NODE_ENV` (development | test | production)
- `PORT`
- `LOG_LEVEL` (fatal | error | warn | info | debug | trace)

### Optional environment variables

- `HOST` (defaults to 0.0.0.0)
- `CORS_ALLOW_ORIGINS` (comma-separated list; required in production)
- `RATE_LIMIT_MAX` (defaults to 100)
- `RATE_LIMIT_WINDOW_MS` (defaults to 60000)

## Health endpoints

- `GET /healthz` -> `{ ok: true, service: "api", version, time }`
- `GET /readyz` -> `{ ok: true, db: "not_configured" }`
