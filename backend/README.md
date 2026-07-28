# Jorki Backend

The backend the Jorki UI has always called — now in the repo. A content-addressed,
**metadata-only** file-intelligence gateway in a single FastAPI file, with **zero
external LLM calls**. It answers the exact endpoint contract in
`../src/hooks/useJorkiApi.js`.

> Jorki used to be a frontend pointing at a separate service (the live FileOracle
> Space). This makes the repo full-stack: the console *and* the engine it drives.

## Run

```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload            # http://127.0.0.1:8000  ·  /docs for OpenAPI
```

Wire the UI to it: `npm run dev` already proxies the API paths to the backend
(see `../vite.config.js`), so the console and engine run together with no code
change. Point at a remote backend with `VITE_API_TARGET=https://… npm run dev`.

Deploy it: `docker build -t jorki-backend . && docker run -p 8000:8000 -v jorki:/data jorki-backend`
(the `/data` volume persists the SQLite DB).

## Test

```bash
python test_smoke.py                # 16 checks, end-to-end, no network
```

Covers: content-addressed + idempotent indexing, deterministic summary, search,
verifiable chunk hashes, read-only SQL (with injection rejected), superposition
encode/decode round-trip, and session revoke.

## What it does

| Endpoint | Method | Purpose |
|---|---|---|
| `/index` | POST | Index text → content-addressed `file_id` + Merkle root |
| `/health` | GET | Liveness + `llm_calls: 0` |
| `/files` | GET | List indexed files |
| `/meta/{id}` | GET | File metadata |
| `/summary/{id}` | GET | Deterministic summary (top terms, symbols) — **no LLM** |
| `/capabilities/{id}` | GET | What this file can answer |
| `/superpose/state/{id}` | GET | Session state, compression ratio, Merkle root |
| `/stats/{id}` | GET | Access stats |
| `/search/{id}?q=` | GET | In-file search with snippets |
| `/chunk/{id}/{idx}` | GET | A chunk + its SHA-256 |
| `/query/sql/{id}` | POST | Read-only `SELECT` over the file's chunk index |
| `/superpose/encode` · `/decode` | POST | Many ids ⇄ one `JORKI:v1:` blob |
| `/revoke/{id}` | POST | Close a session (subsequent access → 404) |

## Design & honest limits

- **Content-addressed:** `file_id = sha256(content)[:12]`. Same bytes → same id;
  re-indexing is idempotent. Each file carries a Merkle root over chunk hashes.
- **Metadata-only / no LLM:** every answer is derived deterministically from the
  indexed content. Nothing is sent to any external model — the "raw content never
  leaves" claim holds because there is no outbound call at all.
- **SQL is sandboxed:** only a single `SELECT` runs, against an **ephemeral
  in-memory DB** loaded with just that file's chunks. Non-SELECT, stacked
  statements, and `PRAGMA/ATTACH/…` are rejected.
- **Persistent:** state lives in SQLite (`JORKI_DB`, default `./jorki.db`) and
  survives restarts — verified by re-reading the DB from a fresh process.
- **Still an MVP subset**, not the full ~40-endpoint FileOracle: no auth, no
  binary-archive upload, and no DNA/valuation intelligence endpoints yet. Those
  are additive.
- **Not the HDAR transport.** This is the file-gateway backend. The
  content-addressed *agent-state* transport (owner-signed successor state,
  distributed executors, offline verifier) is the separate invention layer — see
  `../docs/` and the `hdar` repo.
