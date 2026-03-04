# AGENTS.md

Guidance for autonomous coding agents working in this repository.
This file is optimized for practical implementation behavior.

## Rule files and precedence
- Primary project guidance is in `CLAUDE.md` and is reflected here.
- No Cursor rules were found:
  - `.cursor/rules/` (not present)
  - `.cursorrules` (not present)
- No Copilot instruction file was found:
  - `.github/copilot-instructions.md` (not present)
- If any of those files are added later, treat them as additional constraints.

## Project snapshot
- Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui.
- Purpose: migrate Spotify playlists and liked songs to Navidrome.
- Matching pipeline: ISRC -> fuzzy -> strict normalized string matching.
- Server is intentionally thin: Spotify PKCE auth routes only in `app/api/auth/*`.
- Most business logic runs in browser-side service classes under `lib/*`.
- No database is used.
- Runtime state is stored in `localStorage` and `sessionStorage`.
- Path alias: `@/*` maps to repo root.

## Package managers
- `pnpm` and `bun` both work in this repo.
- Docker build flow uses `pnpm`.
- Prefer `pnpm` for consistency unless explicitly told otherwise.

## Build, lint, and test commands
### Core commands
- Install deps: `pnpm install`
- Dev server (localhost:3000): `pnpm dev`
- Production build: `pnpm build`
- Production start: `pnpm start`
- Lint all files: `pnpm lint`
- Docker run (host port 3883): `docker compose up -d`

### Quick command matrix
- Fast repo validation: `corepack pnpm lint && corepack pnpm build`
- Lint one changed file: `corepack pnpm eslint path/to/file.tsx`
- Lint one changed folder: `corepack pnpm eslint components/Dashboard`
- Type-check only: `corepack pnpm exec tsc --noEmit`
- Run all tests: `corepack pnpm test`
- Run single test file: `corepack pnpm test lib/matching/fuzzy.test.ts`
- Local run command: `corepack pnpm dev`

### Targeted quality commands
- Lint a single file: `pnpm eslint app/page.tsx`
- Lint a directory: `pnpm eslint components/Dashboard`
- Type-check without emit: `pnpm exec tsc --noEmit`
- Full integration validation: `pnpm build`

### Test status (important)
- Test framework: Vitest (`vitest` / `pnpm test`).
- Current test coverage starts with matching and export-cache unit tests.
- Run all tests: `pnpm test`.
- Run a single test file: `pnpm test lib/matching/strict-matcher.test.ts`.
- Run a single test case by name: `pnpm test -t "returns matched"`.

### If tests are added later (recommended pattern)
- Add scripts such as `test` and `test:watch`.
- Ensure single test execution works, for example:
  - `pnpm test path/to/file.test.ts`
  - `pnpm test -t "case name"`

## Environment and secrets
- Copy `.env.example` to `.env.local` for local development.
- Required vars: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`, `NEXT_PUBLIC_APP_URL`, `SPOTIFY_TOKEN_COOKIE_SECRET`.
- Navidrome/Lidarr credentials are entered in UI and kept in in-memory React state (not persisted).
- Never commit secrets, tokens, `.env*`, or exported credential payloads.

## Architectural boundaries
- Keep server logic limited to auth/session/token refresh concerns.
- Do not move matching/export business logic into server routes unless requested.
- Preserve the client-centric flow in `lib/*` and `components/*`.
- Keep cancellation support by threading `AbortSignal` through long operations.

## Imports and module organization
- Prefer absolute imports via `@/` for internal modules.
- Use relative imports mostly for same-folder utilities.
- Group imports in this order when practical:
  1) external packages
  2) internal alias imports (`@/...`)
  3) local relative imports
- Use `import type` for type-only imports where helpful.
- Prefer named exports for reusable modules.
- Use default exports where Next.js conventions expect them or where already established.

## Formatting and general style
- Follow the existing style of the file you edit.
- The repo has mixed quote and semicolon styles.
- Do not do broad reformatting or style-only churn.
- Use 2-space indentation and keep wrapping readable.
- Keep diffs minimal and local to the task.
- Add comments only for non-obvious logic.

## TypeScript guidelines
- `strict` mode is enabled; keep code type-safe.
- Avoid `any`; prefer explicit interfaces, unions, and narrowing.
- Reuse shared types from `types/*` before introducing new shapes.
- Prefer `interface` for object contracts in this codebase.
- Prefer string literal unions over enums unless enums are justified.
- Defensively handle nullable/optional API fields.

## Naming conventions
- Components, classes, and types: PascalCase.
- Functions, variables, and hooks: camelCase.
- Hook names must start with `use`.
- Constants: UPPER_SNAKE_CASE only for true module-level constants.
- Boolean names should be intention-revealing (`isLoading`, `hasToken`, `canExport`).
- Follow existing file naming patterns:
  - feature components are often PascalCase in feature folders
  - some top-level component files are kebab-case
  - avoid renaming files unless required

## React and Next.js conventions
- Use `"use client"` where hooks or browser APIs are needed.
- Preserve App Router conventions (`app/**/page.tsx`, `layout.tsx`, `route.ts`).
- Keep components focused; move data/API logic into `lib/*` services.
- Use memoization hooks (`useMemo`, `useCallback`) when existing patterns rely on them.
- Keep current dark-mode behavior (root html uses `className="dark"`).

## Error handling and logging
- Fail fast on invalid state; otherwise degrade gracefully.
- In API clients, mirror existing patterns:
  - return `{ success, error }` for expected operational failures, or
  - throw `Error` for caller-handled hard failures.
- Preserve `AbortError` semantics; do not swallow cancellation.
- In UI, surface actionable errors via state.
- Use `console.warn` and `console.error` sparingly with context.

## Data fetching and persistence
- Use direct `fetch()` in service classes; do not add React Query/SWR by default.
- Respect the existing Spotify rate-limiting behavior.
- Keep auth/cache persistence keys centralized and consistent.
- Do not introduce server-side persistence without explicit requirement.

## Styling and UI
- Use Tailwind utilities and tokens in `app/globals.css`.
- Reuse `components/ui/*` shadcn primitives when possible.
- Preserve existing interaction patterns and visual language.
- Ensure responsive behavior on desktop and mobile.

## File placement guide
- Spotify OAuth routes: `app/api/auth/*`.
- Auth context/state: `lib/auth/auth-context.tsx`.
- API clients: `lib/spotify/client.ts`, `lib/navidrome/client.ts`, `lib/lidarr/client.ts`.
- Matching/export logic: `lib/matching/*`, `lib/export/*`.
- Main UI surfaces: `components/Dashboard/*` and related component folders.
- Shared contracts: `types/*` with re-exports from `types/index.ts`.

## Agent execution checklist
- Read relevant modules and nearby call sites before editing.
- Implement the smallest correct change.
- Run targeted lint (`pnpm eslint <path>`) on touched files when feasible.
- Run `pnpm build` for substantial cross-module changes.
- If you add a new command or workflow, update docs (`README.md` and/or this file).
- Do not commit unless explicitly asked.

## Non-goals and anti-patterns
- Avoid unrelated refactors in focused tasks.
- Do not replace client storage architecture with DB/server sessions without request.
- Do not add heavy dependencies for simple utilities.
- Do not silently change API contracts across layers.
