# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Navispot

Navispot migrates Spotify playlists and liked songs to a Navidrome server. It matches tracks using ISRC codes, fuzzy scoring (Levenshtein), and strict normalized string comparison, then creates/updates playlists and stars favorites on the Navidrome side. It also supports importing playlists from Exportify CSV files and optionally syncing artists to Lidarr.

## Commands

```bash
pnpm dev          # Start dev server (port 3000)
pnpm build        # Production build
pnpm lint         # ESLint (core-web-vitals + typescript)
pnpm start        # Start production server

# Docker
docker compose up -d   # Runs on host port 3883
```

Both `pnpm` and `bun` work as package managers. Docker uses pnpm.

There is no test framework configured.

## Environment

Copy `.env.example` to `.env.local`. Required: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`, `NEXT_PUBLIC_APP_URL`. Navidrome credentials are optional (configurable via UI).

## Architecture

**Thin server, fat client.** The Next.js server only handles Spotify PKCE OAuth (`app/api/auth/` — 4 routes). All business logic — data fetching, track matching, playlist export — runs in the browser.

**No database.** Auth tokens, Navidrome/Lidarr credentials, export cache, and playlist selection all live in `localStorage`/`sessionStorage`. Export cache uses Spotify `snapshot_id` for differential updates and expires after 90 days.

### Key layers

- **`app/api/auth/`** — Server-side Spotify OAuth only (PKCE flow, token exchange, refresh, session cookie)
- **`lib/auth/auth-context.tsx`** — `AuthProvider` context wrapping the app; `useAuth()` hook for all auth state (Spotify, Navidrome, Lidarr)
- **`lib/spotify/client.ts`** — `SpotifyClient` singleton with built-in rate limiting (30 req/min) and auto token refresh on 401
- **`lib/navidrome/client.ts`** — `NavidromeApiClient` using both native REST API (`/api/...` for CRUD) and Subsonic API (`/rest/...` for starring)
- **`lib/matching/`** — Three-strategy pipeline: ISRC → fuzzy (weighted Levenshtein, threshold 0.8) → strict normalized match. `BatchMatcher` drives the process; `orchestrator.matchTrack()` applies strategies in order.
- **`lib/export/`** — `PlaylistExporter` (create/append/overwrite/update modes) and `FavoritesExporter` (star via Subsonic API). Factory functions (`createBatchMatcher`, `createPlaylistExporter`, etc.) for instantiation.
- **`lib/csv/parser.ts`** — Parses Exportify-format CSV into `SpotifyTrack[]`; supports flexible column detection, BOM handling, and Spotify URI/URL ID extraction
- **`lib/lidarr/client.ts`** — `LidarrApiClient` for artist syncing via Lidarr's v1 API (lookup, add, list artists, root folders, quality/metadata profiles). Auth via `X-Api-Key` header.
- **`hooks/usePlaylistTable.ts`** — Sorting, filtering, search, selection state for the playlist table
- **`components/Dashboard/`** — Main UI; feature-grouped subcomponents including `CsvUpload.tsx` for CSV playlist import
- **`components/lidarr-credentials-form.tsx`** — Lidarr connection form (URL + API key, with ping test)
- **`components/ui/`** — shadcn/ui primitives (new-york style, zinc base, lucide icons)
- **`types/`** — All TypeScript interfaces, re-exported from `types/index.ts`

### Patterns

- All components are `"use client"` — no server-rendered data beyond auth
- `AbortSignal` threaded through all long-running operations for cancellation
- State: React Context for auth, `useState`/`useCallback`/`useMemo` elsewhere, no external state library
- Data fetching: direct `fetch()` in service classes, no React Query/SWR
- Path alias: `@/*` maps to repo root (`@/lib/...`, `@/components/...`, `@/types/...`)
- Styling: Tailwind CSS v4 via PostCSS plugin, CSS variables for theming
- Dark mode is always on (hardcoded `className="dark"` on `<html>`)
