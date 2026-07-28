# FileOracle — the Jorki File Gateway backend

**Status: located and live.** FileOracle is the file-intelligence API that
[`jorki`](https://github.com/overandor/jorki)'s UI calls. It was not a missing
product — it ships today.

| | |
|---|---|
| **What it is** | A FastAPI file-intelligence gateway: upload files → index → answer metadata/intelligence queries, without raw content leaving the user's control. |
| **Live deployment** | `https://josephrw-llm-file-proxy.hf.space` (Hugging Face Space) |
| **Canonical source** | [`overandor/glyphos`](https://github.com/overandor/glyphos) → `hf_space_app.py` (+ `afc_server.py`); spec in `SPEC/JORKI_PRODUCT_SPEC.md`; audit in `docs/jorki-ai-file-gateway-production-audit.md` |
| **Clean variant** | `overandor/rentmasseur-unified` → `variants/daemon/llm_file_proxy/` (self-contained `hf_space.py` + README) |
| **Front end** | `overandor/jorki` (this repo) via `src/hooks/useJorkiApi.js` |
| **Branding note** | The source file is headed "SystemLake Underwriter — Privacy-Preserving Code Evaluation Gateway"; same service, second brand. |

## The privacy model (the actual pitch)

```
Upload → Extract → Crawl → Hash → Merkle Root → Detect Systems →
Score Collateral → Redact (strip source, keep metadata) →
Build Cognition Packet → Send to LLM → Get Evaluation → Write Receipt → Verdict
```

**Sent to the LLM (cognition packet):** SHA-256 file hashes, sizes, extensions,
categories, Merkle root, system-detection flags (`has_git`/`has_tests`/
`has_endpoints`), 10-dimension collateral scores, risk register, verification
results, capabilities summary.

**Never sent:** source code, file contents, `.env`/`.ssh`/keys/wallets/
credentials, binaries — *any* file content. Raw files stay with the user; only
metadata leaves. That is the defensible claim, and it is what makes FileOracle
distinct from "upload your repo to an LLM."

## API surface (from `hf_space_app.py`)

| Group | Endpoints |
|---|---|
| Ingest | `POST /index`, `/index/batch`, `/index/dir`, `/index/path`, `/reindex/{id}` |
| Read | `GET /files`, `/meta/{id}`, `/summary/{id}`, `/capabilities/{id}`, `/superpose/state/{id}`, `/search/{id}?q=`, `/chunk/{id}/{idx}`, `/stats/{id}` |
| Query | `POST /query/sql/{id}` (read-only SELECT over the file index) |
| Superposition | `POST /superpose/encode` / `/superpose/decode` → one `JORKI:v1:base64…` blob for clipboard transport of multiple sessions |
| Intelligence | `GET /kpi/{id}` (+`/gif`), `/dna/{id}`, `/profile/{id}`, `/valuation/{id}`, `/resume/{id}`, `/ml/{id}`, `/video/{id}` |
| Security | `POST /password/{id}` (+`/verify`, `/status`), session revoke |
| LLM | `GET/POST /llm/{keys,catalog,models,health,chain,chat,rotate,usage}` |
| Underwriter (SystemLake brand) | `POST /upload`, `GET /result/{id}` (+`/packet`,`/evaluation`,`/receipt`), `/systems`, `/risks`, `/scores`, `/merkle`, `/receipt`, `/memo`, `/verification` |
| Health | `GET /health`, `/telemetry` |

## SDK / client

FileOracle is an **HTTP API**; the reference client is jorki's `useJorkiApi()`
hook (see [`../SDK.md`](../SDK.md)). Raw:

```bash
# index, then query without shipping content to the model
curl -s "https://josephrw-llm-file-proxy.hf.space/files"
curl -s "https://josephrw-llm-file-proxy.hf.space/summary/<file_id>"
curl -s -X POST "https://josephrw-llm-file-proxy.hf.space/query/sql/<file_id>" \
  -H "Content-Type: application/json" -d '{"sql":"SELECT ..."}'
# superpose multiple files into one clipboard blob
curl -s -X POST "https://josephrw-llm-file-proxy.hf.space/superpose/encode" \
  -H "Content-Type: application/json" -d '["<id1>","<id2>"]'   # → JORKI:v1:…
```

## Honest status & the one real problem

- **It works and it's deployed** — there is a production-audit doc in `glyphos`
  marking endpoints "Verified," and the live Space answers.
- **It has no clean home.** The canonical code sits inside `glyphos` (a large
  multi-purpose monorepo, also carrying MorphOS/discovery and the SystemLake
  brand) and is duplicated into `rentmasseur-unified`. For a seed story this is
  the liability: the product is real but scattered and double-branded.
- **Recommended next step:** extract FileOracle into its **own repo**
  (`overandor/fileoracle`) from the `rentmasseur-unified/variants/daemon/llm_file_proxy/`
  variant (the cleanest copy), give it the mode/SDK/docs standard, point the
  live Space and jorki at it, and settle on **one** name (FileOracle vs
  SystemLake vs Jorki-gateway) — the same single-identity discipline the HDAR
  repos needed.
