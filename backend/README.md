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

Point the UI at it: the dev server proxies same-origin (`API_BASE=''`), or set
the base to `http://127.0.0.1:8000` in `src/hooks/useJorkiApi.js`.

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
- **This is an MVP reference**, not the full ~40-endpoint FileOracle. Storage is
  in-process (restart clears it) — swap in SQLite/Redis for persistence. It does
  not yet do auth, upload of binary archives, or the DNA/valuation intelligence
  endpoints. Those are additive.
- **Not the HDAR transport.** This is the file-gateway backend. The
  content-addressed *agent-state* transport (owner-signed successor state,
  distributed executors, offline verifier) is the separate invention layer — see
  `../docs/` and the `hdar` repo.
