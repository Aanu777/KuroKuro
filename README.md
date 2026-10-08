# Kurokuro

A calm, privacy-first search interface built around SearXNG.

## Current foundation

- Next.js + TypeScript application layer
- SearXNG server-side proxy at `/api/search`
- Web / Images / Videos / News category routing
- Local-first search history
- Local-first bookmarks
- Basic settings for history and theme preference
- Keyboard `/` shortcut to focus search
- Minimal, non-dashboard UI

## Run

1. Copy `.env.example` to `.env.local`.
2. Start SearXNG (see `searxng/`).
3. Run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Architecture

Browser → Kurokuro Next.js API route → SearXNG → configured search engines → aggregated results.

The browser stores history and bookmarks locally by default. Search requests still leave the SearXNG instance toward whatever external engines are enabled there.

## Next build phases

1. Complete category-specific result rendering.
2. Add pagination and time/language/region/SafeSearch controls.
3. Add advanced search builder and operator parser.
4. Add developer shortcuts / bangs.
5. Add API documentation and rate limiting.
6. Harden SearXNG config, reverse proxy, HTTPS, and self-hosting deployment.
7. Add polished keyboard navigation and accessibility pass.
