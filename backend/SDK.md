# Jorki Backend — client surface

An HTTP gateway. The reference client is the UI's `useJorkiApi()` hook; here is
the raw contract. Part of the [syndication standard](../syndication/STANDARD.md).

## curl

```bash
# index text -> content-addressed id + merkle root
curl -s localhost:8000/index -H 'content-type: application/json' \
  -d '{"name":"notes.md","content":"# hello\nsecond line\n"}'

# deterministic summary (no LLM)
curl -s localhost:8000/summary/<file_id>

# read-only SQL over the file's chunk index
curl -s localhost:8000/query/sql/<file_id> -H 'content-type: application/json' \
  -d '{"sql":"SELECT idx, length FROM chunks ORDER BY length DESC LIMIT 5"}'

# many files -> one clipboard blob
curl -s localhost:8000/superpose/encode -H 'content-type: application/json' \
  -d '["<id1>","<id2>"]'          # -> {"blob":"JORKI:v1:...."}
```

## Python

```python
import httpx
c = httpx.Client(base_url="http://localhost:8000")
fid = c.post("/index", json={"name": "a.py", "content": open("a.py").read()}).json()["file_id"]
print(c.get(f"/summary/{fid}").json()["symbols"])
print(c.post(f"/query/sql/{fid}", json={"sql": "SELECT count(*) n FROM chunks"}).json()["rows"])
```

## The `chunks` table (for `/query/sql`)

| Column | Type | Meaning |
|---|---|---|
| `idx` | INTEGER | chunk ordinal |
| `text` | TEXT | chunk content |
| `hash` | TEXT | SHA-256 of the chunk |
| `length` | INTEGER | chunk length in bytes |

## Stability

- **Stable & tested** (`test_smoke.py`): `/index`, `/health`, `/files`, `/meta`,
  `/summary`, `/search`, `/chunk`, `/query/sql`, `/superpose/*`, `/revoke`.
- **MVP surface** — response shapes may extend; the read-only SELECT contract and
  the content-addressed `file_id` are the fixed points.
