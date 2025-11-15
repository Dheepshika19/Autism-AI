# autismAI

Phase 1 — Setup & Core Structure

This repository contains a monorepo with a React (Vite+TS) client, a Node.js (Express+TS) server, and shared TypeScript types.

## Structure

- `client/` — React + TypeScript + Vite + TailwindCSS + PWA + IndexedDB (Dexie)
- `server/` — Node.js + Express + TypeScript + CORS + dotenv
- `shared/` — Shared TypeScript types and utilities
- `public/` — Static fallback templates (used for offline-first)

## Prerequisites

- Node.js >= 18
- npm >= 9

## Getting Started

Install dependencies for all workspaces:

```bash
npm install
```

### Run client (Vite dev server)
```bash
npm run dev:client
```

### Run server (Express)
```bash
npm run dev:server
```

### Build
```bash
npm run build
```

### Start server (after build)
```bash
npm run start
```

## Environment Variables

Create a `server/.env` file with:
```
OPENAI_API_KEY=your_key_here
PORT=5000
```

> Note: No AI features are implemented in Phase 1; the key is only wired for future use.

## Offline-First

- A baseline service worker (`client/public/sw.js`) is registered in `client/src/main.tsx`.
- A web app manifest is available at `client/public/manifest.webmanifest`.
- A simple offline fallback page is provided at `public/offline.html`.

## Shared Types

Shared types live under `shared/src/` and can be imported by both client and server via workspace paths.

## Next Phases

- Add pages: Home, Children Manager, Timetable Planner, Staff Allocator, Progress Dashboard, Settings.
- Implement AI features using OpenAI API.
