# Jorki Backend — operating modes

Part of the [syndication standard](../syndication/STANDARD.md).

| Mode | Command | Requires | Status |
|---|---|---|---|
| `test` | `python test_smoke.py` | deps | ✅ 16/16 checks pass, no network |
| `local` | `uvicorn app:app --reload` | deps | ✅ serves at `http://127.0.0.1:8000`, `/docs` for OpenAPI |
| `prod` | `uvicorn app:app --host 0.0.0.0 --port $PORT` (behind a reverse proxy) | deps | ⚠️ add persistence + auth first (see README limits) |

## Honest notes

- **No offline gap:** every mode runs fully offline — the service makes **zero
  outbound calls** (no LLM, no network) by construction.
- **State is in-process** in this MVP; a restart clears the registry. Swap the
  in-memory `REGISTRY` for SQLite/Redis before `prod`.
- CORS is open (`*`) for local UI development — tighten it for `prod`.
