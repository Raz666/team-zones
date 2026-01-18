# AI Coding Guidelines — Team Zones App

These rules apply to all AI-assisted changes in this repository.

The project is:
- Expo React Native
- TypeScript
- Offline-first
- Feature-based folder structure
- Hook + repository architecture
- useReducer for UI flow state

---

## GENERAL RULES

- Do NOT change behavior unless explicitly instructed.
- Prefer moving code over rewriting logic.
- Avoid introducing new dependencies unless explicitly requested.
- Do not break existing exports or public APIs.
- Preserve AsyncStorage keys and persisted data formats.
- Maintain Expo compatibility.

---

## FOLDER STRUCTURE RULES

Use feature-based organization:

src/
app/ → App bootstrap & providers
features/ → Business domains (zones, settings)
shared/ → Reusable UI + utilities
theme/
flags/

yaml
Copy code

Do NOT place domain logic in the root folder.

---

## COMPONENT RULES

- UI components must remain mostly presentational.
- Business logic must live in hooks or utils.
- Avoid "God components" exceeding ~300 lines.
- Extract logic into hooks when complexity grows.

---

## HOOK RULES

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

## STATE MANAGEMENT RULES

- Use useReducer for complex UI state flows.
- Keep domain state in dedicated hooks.
- Avoid global state unless needed.
- Avoid prop drilling by extracting hooks, not by adding stores.

---

## STORAGE RULES

- All AsyncStorage access must go through repository modules.
- Components must never call AsyncStorage directly.
- Always handle corrupted or missing data gracefully.

---

## TESTING RULES

- Pure logic must be testable with Vitest.
- Prefer testing utils, reducers, repositories, and hooks.
- Avoid snapshot testing unless explicitly requested.
- Tests must not depend on React Native rendering unless required.

---

## REFACTORING RULES

When refactoring:

- Perform incremental changes.
- Keep PR scope small.
- Do not combine architecture changes with feature changes.
- Preserve git history when possible.

---

## PERFORMANCE RULES

- Avoid recreating heavy data structures inside renders.
- Use memoization where needed.
- Avoid unnecessary re-renders in lists.

---

## ANIMATION RULES

- Keep animation logic isolated.
- Do not mix business logic into animation handlers.
- Preserve existing animation behavior.

---

## FINAL CHECKLIST BEFORE OUTPUT

Before producing changes:

- App compiles
- Types pass
- Behavior preserved
- Imports updated correctly
- No unused files left behind