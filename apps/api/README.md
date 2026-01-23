# API

## Development

From the repo root:

```bash
npm run --workspace apps/api dev
```

From `apps/api`:

```bash
npm run dev
```

Install dependencies first if needed:

```bash
npm install
```

## Environment loading

- `.env` is loaded **only** when `NODE_ENV` is not `production`.
- In production, the API expects env vars to be provided by the hosting platform.
- See `.env.example` for the supported variables.

## Endpoints

- `GET /healthz`
- `GET /readyz`
