# FamilyOS Web

Vite + React + TypeScript + Tailwind dashboard for FamilyOS: auth, family switcher, documents, calendar, dashboard.

## Requirements

- Node.js **18.18+** or **20+**

## Environment (tracked template)

```bash
cp .env.example .env.local
```

Edit `.env.local` if you need `VITE_API_BASE_URL` for production builds. **Do not commit** `.env` or `.env.local` with real secrets.

For CI, use **GitHub → Settings → Secrets and variables → Actions** — not committed files.

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Opens the app (default [http://localhost:5173](http://localhost:5173)). The dev server proxies `/api` to `http://localhost:8080` unless `VITE_API_BASE_URL` is set.

## Production build

```bash
npm run build
npm run preview   # optional local preview of dist/
```

## API errors

The shared client in `src/lib/api.ts` throws `ApiError` with a human-readable **message** parsed from the backend `ProblemDetail` (`detail` field) and optional **fieldErrors** for validation failures.
