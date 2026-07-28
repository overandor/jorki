# Jorki Backend — operating modes

Part of the [syndication standard](../syndication/STANDARD.md).

| Mode | Command | Requires | Status |
|---|---|---|---|
| `test` | `python test_smoke.py` | deps | ✅ 16/16 checks pass, no network |
| `local` | `uvicorn app:app --reload` | deps | ✅ serves at `http://127.0.0.1:8000`, `/docs` for OpenAPI |
| `docker` | `docker build -t jorki-backend . && docker run -p 8000:8000 -v jorki:/data jorki-backend` | Docker | ✅ SQLite persisted on the `/data` volume |
| `prod` | `uvicorn app:app --host 0.0.0.0 --port $PORT` behind a reverse proxy | deps | ⚠️ add auth + tighten CORS first |
| `ui+api` | `uvicorn app:app` (in `backend/`) **and** `npm run dev` (in repo root) | deps + Node | ✅ Vite proxies the API paths to the backend — full stack, one command each |

## Honest notes

- **No offline gap:** every mode runs fully offline — the service makes **zero
  outbound calls** (no LLM, no network) by construction.
- **Persistent:** state is in SQLite (`JORKI_DB`) and survives restarts.
- CORS is open (`*`) for local UI development — tighten it for `prod`, and add
  auth before exposing it publicly.
