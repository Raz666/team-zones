# Security Notes

This document summarizes security assumptions and operational guidance for Team Zones.

## Threat model (high level)

- Attacker can run a modified client (tamper, patch, or replace local storage).
- Attacker can capture network traffic on an untrusted network.
- Attacker can obtain a stolen device with cached data.
- Attacker can attempt replay/abuse of tokens (magic links, refresh tokens).

## Offline limitations

- The mobile client is offline-first and can be patched.
- Offline premium relies on a signed entitlement certificate with an expiry.
- A patched client can bypass UI checks, so server-side enforcement is required
  for any sensitive operations.

## Server-authoritative entitlements

- Premium access is granted only after server verification.
- The client must not self-grant entitlements.
- Offline access uses a signed certificate and must be revalidated after expiry.

## Soft delete + purge behavior

- Soft deletes mark rows with `deletedAt` and keep them queryable only when
  explicitly requested.
- A background purge task hard-deletes rows where `deletedAt` is older than the
  configured retention window.
- Purge logging records counts only; it must not include PII or token values.

## Ops checklist

- Set all required secrets in production:
  - `AUTH_JWT_SECRET`
  - `ENTITLEMENT_CERT_SECRET` (must differ from `AUTH_JWT_SECRET`)
  - `GOOGLE_SERVICE_ACCOUNT_JSON` or `GOOGLE_SERVICE_ACCOUNT_JSON_PATH`
- Configure purge behavior if needed:
  - `SOFT_DELETE_PURGE_ENABLED`
  - `SOFT_DELETE_PURGE_AFTER_DAYS`
  - `SOFT_DELETE_PURGE_INTERVAL_HOURS`
- Rotate secrets on a regular schedule and after any suspected compromise.
- Back up the SQLite database file (`DATABASE_URL`) and test restore procedures.
- Keep audit logs free of PII and tokens.
