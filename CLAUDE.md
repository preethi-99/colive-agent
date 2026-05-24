# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # Type-check (tsc -b) then bundle (vite build)
npm run lint      # Run ESLint
npm run preview   # Serve the production build locally
```

There is no test runner configured — do not invent test commands.

## Architecture

**Stack:** React 19 + TypeScript, Vite, Tailwind CSS 4, Anthropic SDK, Supabase.

**Entry points:**
- `index.html` → `src/main.tsx` (React root, StrictMode)
- `src/App.tsx` — currently the only top-level component; this is where feature work begins

**AI integration:** `@anthropic-ai/sdk` is installed. The Anthropic client requires an API key — expect it from an environment variable (e.g., `VITE_ANTHROPIC_API_KEY`). For any server-side API calls, route through Supabase Edge Functions to avoid exposing the key in the browser bundle.

**Backend:** `@supabase/supabase-js` is installed for database and auth. Supabase URL and anon key are expected as environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

**Styling:** Global CSS custom properties are defined in `src/index.css` (dark-mode aware). Component styles live in co-located `.css` files. Tailwind utility classes are also available — the config in `tailwind.config.js` may need its `content` glob patterns updated as new files are added.

## TypeScript config

Two tsconfig files split by context:
- `tsconfig.app.json` — `src/` files, strict lint rules (`noUnusedLocals`, `noUnusedParameters`), targets ES2023
- `tsconfig.node.json` — `vite.config.ts` only

`tsc -b` (composite build) runs both. Fix all TS errors before shipping — the build will fail otherwise.
