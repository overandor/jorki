# Jorki — operating modes

Jorki is the React/Vite **command-center UI** for a File Gateway backend (the
file-intelligence API, a.k.a. "FileOracle"). Part of the
[syndication standard](syndication/STANDARD.md).

| Mode | Command | Requires | Status |
|---|---|---|---|
| `dev` | `npm install && npm run dev` | Node | ✅ runs the UI locally (Vite dev server) |
| `build` | `npm run build` | Node | ✅ static build (deployed to Cloudflare Pages) |
| `preview` | `npm run preview` | a prior `build` | ✅ serves the built app |
| `live` | serve the app behind a backend exposing the endpoints below | the File Gateway / FileOracle API | ⚠️ backend **not included in this repo** |

## Backend contract (what the UI calls)

`src/hooks/useJorkiApi.js` fetches these same-origin endpoints (`API_BASE=''`):

```
GET  /health
GET  /files
GET  /meta/:fileId
GET  /summary/:fileId
GET  /capabilities/:fileId
GET  /superpose/state/:fileId
GET  /stats/:fileId
GET  /search/:fileId?q=...
GET  /chunk/:fileId/:idx
POST /query/sql/:fileId
```

## Honest note

This repo is the **front end only**. Without a backend serving the endpoints
above, API calls fail and the UI shows empty/error states (mock fixtures exist
in `src/data/mockData.js` for design work). The backend that answers these —
the actual **FileOracle** file-intelligence service — is a separate component
and is not in this repository.
