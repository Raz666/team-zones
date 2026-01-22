# AI Coding Guidelines — Team Zones App

These rules apply to all AI-assisted changes in this repository.

The project is:
- Expo React Native
- TypeScript
- Offline-first
- Feature-based folder structure
- Hook + repository architecture
- useReducer for UI flow state
- Monorepo with mobile app + backend API + shared packages

---

# GENERAL RULES

- Do NOT change behavior unless explicitly instructed.
- Prefer moving code over rewriting logic.
- Avoid introducing new dependencies unless explicitly requested.
- Do not break existing exports or public APIs.
- Preserve AsyncStorage keys and persisted data formats.
- Maintain Expo compatibility.
- Make smallest safe change possible per task.

---

# REPOSITORY STRUCTURE RULES

This repository is a monorepo.

Preferred layout:

apps/
- mobile/            # Expo React Native app
- api/               # Node backend (accounts, sync, entitlements)

packages/
- shared/            # Shared types/constants ONLY (no secrets)

If the current layout differs:
- Backend must remain isolated in a single top-level folder
- Shared code must be isolated from app and backend logic

Never mix backend and mobile logic in the same folder.

---

# MOBILE APP STRUCTURE RULES

Use feature-based organization:

src/
- app/        → App bootstrap & providers
- features/   → Business domains (zones, settings)
- shared/     → Reusable UI + utilities
- theme/
- flags/

Do NOT place domain logic in the root folder.

---

# COMPONENT RULES

- UI components must remain mostly presentational.
- Business logic must live in hooks or utils.
- Avoid "God components" exceeding ~300 lines.
- Extract logic into hooks when complexity grows.

---

# HOOK RULES

Hooks should:

- Be focused on one responsibility.
- Avoid UI rendering logic.
- Return explicit APIs.
- Be easily unit-testable.

Examples:

GOOD:
- useZones
- useAddZoneForm
- useTimeZoneSearch

BAD:
- Hooks that manipulate animations AND storage AND UI state.

---

# STATE MANAGEMENT RULES

- Use useReducer for complex UI state flows.
- Keep domain state in dedicated hooks.
- Avoid global state unless needed.
- Avoid prop drilling by extracting hooks, not by adding stores.

---

# STORAGE RULES

- All AsyncStorage access must go through repository modules.
- Components must never call AsyncStorage directly.
- Always handle corrupted or missing data gracefully.
- Secure storage (Keychain/Keystore) must be used for:
  - refresh tokens
  - entitlement certificates

---

# TESTING RULES

- Pure logic must be testable with Vitest.
- Prefer testing utils, reducers, repositories, and hooks.
- Avoid snapshot testing unless explicitly requested.
- Tests must not depend on React Native rendering unless required.

---

# REFACTORING RULES

When refactoring:

- Perform incremental changes.
- Keep PR scope small.
- Do not combine architecture changes with feature changes.
- Preserve git history when possible.

---

# PERFORMANCE RULES

- Avoid recreating heavy data structures inside renders.
- Use memoization where needed.
- Avoid unnecessary re-renders in lists.

---

# ANIMATION RULES

- Keep animation logic isolated.
- Do not mix business logic into animation handlers.
- Preserve existing animation behavior.

---

# BACKEND + SECURITY CONVENTIONS (CRITICAL)

These rules apply to apps/api and any account, sync, or entitlement work.

## Absolute security rules (non-negotiable)

1) NEVER commit secrets
- No API keys
- No service account JSON
- No private signing keys
- No encryption keys
- Use .env files and .env.example
- Secrets must be gitignored

2) NEVER leak sensitive data
- Do not log:
  - auth tokens
  - magic link tokens
  - refresh tokens
  - purchase tokens
  - encryption keys
- API error responses must be sanitized

3) Server-authoritative entitlements
- Mobile app must NOT self-grant premium
- Premium state comes only from backend verification
- Offline access uses signed certificates only

4) Offline premium hardening
- Offline premium is allowed via SIGNED certificate with expiry
- Client must validate:
  - signature
  - expiration time
- Never store "isPremium=true" flags as the source of truth

---

# BACKEND ENGINEERING RULES (Node / TypeScript)

## Project structure

apps/api/src/
- index.ts          → process entrypoint
- server.ts         → server factory
- config/           → env parsing + validation
- routes/           → route modules
- plugins/          → auth, rate-limit, db
- lib/              → crypto, helpers, errors
- db/               → prisma client wrapper

Avoid monolithic files.

---

## Environment configuration

- ALL env vars must be validated at startup
- App must fail fast if invalid

Secrets must be separated:

- AUTH_JWT_SECRET
- ENTITLEMENT_CERT_SECRET
- SETTINGS_ENCRYPTION_KEY
- GOOGLE service account credentials

Never reuse the same secret for multiple purposes.

---

## Authentication rules

- Access token:
  - short-lived JWT (~15 minutes)
- Refresh token:
  - random opaque string
  - stored HASHED in DB
  - rotated on refresh
- Avoid email enumeration:
  - auth endpoints must not reveal whether email exists

---

## Database + migrations

- Prisma migrations only
- No manual DB changes
- Purchase tokens MUST be unique
- Settings snapshots must be versioned and monotonic

---

## Crypto rules

Allowed:
- AES-256-GCM for backend encryption
- Secure random bytes for tokens
- JWT HS256 or Ed25519 for certificates

Forbidden:
- custom crypto
- weak hashes
- insecure random generators

Crypto helpers must have tests.

---

## Logging + audit rules

Backend must log (sanitized):

- login link requests
- token exchanges
- refresh rotations
- purchase verification attempts (success/failure)

Do NOT log:
- emails in full
- tokens
- secrets

Prefer userId instead of email.

---

# SHARED PACKAGE RULES (packages/shared)

Allowed:
- API request/response types
- constants (entitlement keys, error codes)
- schema versions

Forbidden:
- secrets
- environment config
- API credentials
- backend-only logic

Shared code must be platform-neutral.

---

# CODEX WORKFLOW RULES

When implementing a task:

1) Make smallest safe diff
2) Do not refactor unrelated code
3) Update docs when behavior changes
4) Add tests for security-critical logic
5) Preserve existing architecture patterns
6) Prefer explicit code over magic abstractions

---

# FINAL CHECKLIST BEFORE OUTPUT

Before producing changes:

- App compiles
- Backend builds
- Types pass
- Behavior preserved
- No secrets added
- Imports updated correctly
- No unused files left behind
- Security rules respected
