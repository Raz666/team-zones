# Mobile API Integration

## API base URL

The app resolves the API base URL in this order:

1. `EXPO_PUBLIC_API_URL` (recommended)
2. `expo.extra.apiBaseUrl` in `app.json`
3. `http://localhost:3000` (fallback)

Example (from repo root):

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.153:3000 npm run --workspace apps/mobile start
```

## Dev login testing

1. Start the API and request a magic link from the in-app debug menu.
2. Copy the token from the API logs (dev mode prints it).
3. Either:
   - Paste the token into the debug modal and tap **Exchange**, or
   - Open a deep link like `teamzones://auth?token=YOUR_TOKEN`.

To open the debug menu, tap the app title 7 times (dev mode).

## Settings sync

Settings sync currently mirrors your zones list to the backend and applies newer versions from the server.
