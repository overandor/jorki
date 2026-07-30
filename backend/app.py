"""
Jorki backend — a content-addressed, metadata-only file-intelligence gateway.

The backend the Jorki UI (src/hooks/useJorkiApi.js) has always called, now in the
repo as a clean, self-contained, SQLite-backed FastAPI app with **zero external
LLM calls**. Content stays on the host you run this on.

Design
------
- **Content-addressed.** A file's id IS the first 12 hex of its SHA-256. Same
  bytes in → same id; re-indexing is idempotent.
- **Metadata-first, no LLM.** Every answer is derived deterministically from the
  indexed content and its structure. Nothing is sent anywhere.
- **Verifiable.** Each file carries a Merkle root over its chunk hashes.
- **Persistent.** State lives in SQLite (`JORKI_DB`, default `./jorki.db`) and
  survives restarts.

Run:  uvicorn app:app --reload      (from backend/)
Docs: http://127.0.0.1:8000/docs
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
import re
import sqlite3
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from contextlib import contextmanager
from typing import Any, Dict, List

from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

app = FastAPI(title="Jorki Backend", version="0.2.0",
              description="Content-addressed, metadata-only file-intelligence gateway.")
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])

SUPERPOSE_PREFIX = "JORKI:v1:"
DB_PATH = os.environ.get("JORKI_DB", os.path.join(os.path.dirname(__file__), "jorki.db"))


@contextmanager
def db():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    try:
        yield con
        con.commit()
    finally:
        con.close()


def init_db():
    with db() as con:
        con.executescript("""
        CREATE TABLE IF NOT EXISTS files(
          file_id TEXT PRIMARY KEY, name TEXT, size INTEGER, sha256 TEXT, ext TEXT,
          line_count INTEGER, chunk_count INTEGER, merkle_root TEXT,
          top_terms TEXT, symbols TEXT, created_at REAL, revoked INTEGER DEFAULT 0,
          access INTEGER DEFAULT 0);
        CREATE TABLE IF NOT EXISTS chunks(
          file_id TEXT, idx INTEGER, text TEXT, hash TEXT, length INTEGER,
          PRIMARY KEY(file_id, idx));
        """)


init_db()


# ─────────────────────────────── helpers ────────────────────────────────
def sha256_hex(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def merkle_root(hashes: List[str]) -> str:
    if not hashes:
        return sha256_hex(b"")
    layer = [bytes.fromhex(h) for h in hashes]
    while len(layer) > 1:
        if len(layer) % 2:
            layer.append(layer[-1])
        layer = [hashlib.sha256(layer[i] + layer[i + 1]).digest()
                 for i in range(0, len(layer), 2)]
    return layer[0].hex()


def chunk_text(text: str, target: int = 800) -> List[str]:
    if not text.strip():
        return []
    blocks, cur, size = [], [], 0
    for line in text.splitlines(keepends=True):
        cur.append(line)
        size += len(line)
        if size >= target:
            blocks.append("".join(cur))
            cur, size = [], 0
    if cur:
        blocks.append("".join(cur))
    return blocks


SYMBOL_RE = re.compile(
    r"^\s*(?:def|class|function|func|async\s+def)\s+([A-Za-z_][\w]*)"
    r"|(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=", re.MULTILINE)
WORD_RE = re.compile(r"[A-Za-z][A-Za-z0-9_]{2,}")
STOP = set("the and for that this with from your you are was were has have not "
           "but all can will out get file files type text data code use using".split())


def require(file_id: str) -> sqlite3.Row:
    with db() as con:
        row = con.execute("SELECT * FROM files WHERE file_id=?", (file_id,)).fetchone()
        if row is None:
            raise HTTPException(404, {"error": "file_not_found", "file_id": file_id})
        if row["revoked"]:
            raise HTTPException(404, {"error": "session_revoked", "file_id": file_id})
        con.execute("UPDATE files SET access=access+1 WHERE file_id=?", (file_id,))
    return row


def get_chunks(file_id: str) -> List[sqlite3.Row]:
    with db() as con:
        return con.execute(
            "SELECT idx, text, hash, length FROM chunks WHERE file_id=? ORDER BY idx",
            (file_id,)).fetchall()


# ─────────────────────────────── models ─────────────────────────────────
class IndexIn(BaseModel):
    name: str
    content: str
    is_base64: bool = False


class SqlIn(BaseModel):
    sql: str


# ─────────────────────────────── landing ────────────────────────────────
_INDEX_HTML = os.path.join(os.path.dirname(__file__), "index.html")


@app.get("/", include_in_schema=False)
def landing():
    """Live landing page + playground served same-origin, so its fetch() calls
    hit the endpoints below directly."""
    return FileResponse(_INDEX_HTML)


# ─────────────────────────────── ingest ─────────────────────────────────
@app.post("/index")
def index_file(body: IndexIn):
    raw = base64.b64decode(body.content) if body.is_base64 else body.content.encode()
    file_id = sha256_hex(raw)[:12]
    text = raw.decode("utf-8", errors="replace")
    chunks = chunk_text(text)
    chunk_hashes = [sha256_hex(c.encode()) for c in chunks]
    ext = body.name.rsplit(".", 1)[-1].lower() if "." in body.name else ""
    words = [w.lower() for w in WORD_RE.findall(text)]
    top_terms = [{"term": t, "count": n}
                 for t, n in Counter(w for w in words if w not in STOP).most_common(12)]
    symbols = sorted({m.group(1) or m.group(2) for m in SYMBOL_RE.finditer(text)
                      if (m.group(1) or m.group(2))})[:64]
    root = merkle_root(chunk_hashes)
    with db() as con:
        con.execute("DELETE FROM files WHERE file_id=?", (file_id,))
        con.execute("DELETE FROM chunks WHERE file_id=?", (file_id,))
        con.execute(
            "INSERT INTO files VALUES (?,?,?,?,?,?,?,?,?,?,?,0,0)",
            (file_id, body.name, len(raw), sha256_hex(raw), ext,
             (text.count("\n") + 1 if text else 0), len(chunks), root,
             json.dumps(top_terms), json.dumps(symbols), time.time()))
        con.executemany(
            "INSERT INTO chunks VALUES (?,?,?,?,?)",
            [(file_id, i, c, chunk_hashes[i], len(c)) for i, c in enumerate(chunks)])
    return {"file_id": file_id, "merkle_root": root,
            "chunk_count": len(chunks), "size": len(raw)}


# ─────────────────────────────── read ───────────────────────────────────
_EXTERNAL_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL = 120


def fetch_json(url: str, cache_key: str, ttl: int = CACHE_TTL) -> Dict[str, Any]:
    """Fetch a public JSON feed with bounded caching and stale-on-error fallback."""
    cached = _EXTERNAL_CACHE.get(cache_key)
    now = time.time()
    if cached and now - cached["fetched_at"] < ttl:
        return {"data": cached["data"], "fetched_at": cached["fetched_at"], "stale": False}
    request = urllib.request.Request(url, headers={"User-Agent": "Jorki-Market-Terminal/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            data = json.loads(response.read().decode("utf-8"))
        _EXTERNAL_CACHE[cache_key] = {"data": data, "fetched_at": now}
        return {"data": data, "fetched_at": now, "stale": False}
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        if cached:
            return {"data": cached["data"], "fetched_at": cached["fetched_at"], "stale": True}
        raise HTTPException(503, {"error": "upstream_unavailable", "source": cache_key, "detail": str(exc)})


@app.get("/market/overview")
def market_overview():
    markets_url = (
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd"
        "&order=market_cap_desc&per_page=30&page=1&sparkline=true&price_change_percentage=24h,7d"
    )
    global_feed = fetch_json("https://api.coingecko.com/api/v3/global", "coingecko-global")
    markets_feed = fetch_json(markets_url, "coingecko-markets")
    trending_feed = fetch_json("https://api.coingecko.com/api/v3/search/trending", "coingecko-trending", 300)
    coins = markets_feed["data"]
    total_volume = sum(float(c.get("total_volume") or 0) for c in coins)
    weighted_change = (
        sum(float(c.get("price_change_percentage_24h") or 0) * float(c.get("total_volume") or 0) for c in coins)
        / total_volume if total_volume else 0
    )
    gainers = len([c for c in coins if float(c.get("price_change_percentage_24h") or 0) > 0])
    breadth = gainers / len(coins) if coins else 0
    return {
        "source": "CoinGecko",
        "fetched_at": min(global_feed["fetched_at"], markets_feed["fetched_at"]),
        "stale": global_feed["stale"] or markets_feed["stale"],
        "global": global_feed["data"].get("data", {}),
        "coins": coins,
        "trending": [item.get("item", {}) for item in trending_feed["data"].get("coins", [])],
        "derived": {
            "weighted_change_24h": weighted_change,
            "market_breadth": breadth,
            "liquidity_concentration": (sum(float(c.get("total_volume") or 0) for c in coins[:5]) / total_volume) if total_volume else 0,
            "realized_volatility": sum(abs(float(c.get("price_change_percentage_24h") or 0)) for c in coins) / len(coins) if coins else 0,
        },
    }


@app.get("/market/narratives")
def market_narratives(q: str = "cryptocurrency OR bitcoin OR ethereum"):
    safe_query = urllib.parse.quote(q[:120])
    url = (
        "https://api.gdeltproject.org/api/v2/doc/doc?"
        f"query={safe_query}&mode=artlist&maxrecords=30&format=json&sort=datedesc"
    )
    feed = fetch_json(url, f"gdelt-{safe_query}", 300)
    articles = feed["data"].get("articles", [])
    return {
        "source": "GDELT DOC 2.0",
        "fetched_at": feed["fetched_at"],
        "stale": feed["stale"],
        "articles": [{
            "title": article.get("title", "Untitled"),
            "url": article.get("url", ""),
            "domain": article.get("domain", ""),
            "language": article.get("language", ""),
            "seen_at": article.get("seendate", ""),
            "image": article.get("socialimage", ""),
        } for article in articles],
    }


@app.get("/health")
def health():
    with db() as con:
        n = con.execute("SELECT count(*) c FROM files").fetchone()["c"]
    return {"status": "ok", "files_registered": n, "service": "jorki-backend",
            "version": app.version, "llm_calls": 0, "persistent": True}


@app.get("/files")
def files():
    with db() as con:
        rows = con.execute(
            "SELECT file_id,name,size,chunk_count,created_at,revoked FROM files "
            "ORDER BY created_at DESC").fetchall()
    return {"files": [dict(r) for r in rows]}


@app.get("/meta/{file_id}")
def meta(file_id: str):
    r = require(file_id)
    d = dict(r)
    d["top_terms"] = json.loads(d["top_terms"])
    d["symbols"] = json.loads(d["symbols"])
    return d


@app.get("/summary/{file_id}")
def summary(file_id: str):
    r = require(file_id)
    symbols = json.loads(r["symbols"])
    return {"file_id": file_id, "method": "deterministic (no LLM)",
            "line_count": r["line_count"], "chunk_count": r["chunk_count"],
            "top_terms": json.loads(r["top_terms"]), "symbols": symbols,
            "headline": f'{r["name"]} — {r["line_count"]} lines, '
                        f'{len(symbols)} symbols, {r["chunk_count"]} chunks'}


@app.get("/capabilities/{file_id}")
def capabilities(file_id: str):
    require(file_id)
    return {"file_id": file_id, "capabilities": [
        {"name": "summary", "endpoint": f"/summary/{file_id}"},
        {"name": "search", "endpoint": f"/search/{file_id}?q=..."},
        {"name": "chunk", "endpoint": f"/chunk/{file_id}/0"},
        {"name": "sql", "endpoint": f"/query/sql/{file_id}", "method": "POST"},
        {"name": "stats", "endpoint": f"/stats/{file_id}"},
        {"name": "superpose", "endpoint": "/superpose/encode", "method": "POST"},
    ]}


@app.get("/superpose/state/{file_id}")
def superpose_state(file_id: str):
    r = require(file_id)
    chunks = get_chunks(file_id)
    index_bytes = sum(c["length"] for c in chunks)
    ratio = round(r["size"] / index_bytes, 3) if index_bytes else 1.0
    return {"file_id": file_id, "status": "live", "chunk_count": r["chunk_count"],
            "index_bytes": index_bytes, "compression_ratio": ratio,
            "merkle_root": r["merkle_root"]}


@app.get("/stats/{file_id}")
def stats(file_id: str):
    r = require(file_id)
    return {"file_id": file_id, "accesses": r["access"] + 1, "size": r["size"],
            "chunk_count": r["chunk_count"], "created_at": r["created_at"]}


@app.get("/search/{file_id}")
def search(file_id: str, q: str = ""):
    require(file_id)
    ql = q.lower().strip()
    hits = []
    if ql:
        for c in get_chunks(file_id):
            n = c["text"].lower().count(ql)
            if n:
                pos = c["text"].lower().find(ql)
                snip = c["text"][max(0, pos - 40):pos + 60].strip().replace("\n", " ")
                hits.append({"chunk": c["idx"], "score": n, "snippet": snip})
        hits.sort(key=lambda h: -h["score"])
    return {"file_id": file_id, "q": q, "hits": hits[:25], "total": len(hits)}


@app.get("/chunk/{file_id}/{idx}")
def chunk(file_id: str, idx: int):
    require(file_id)
    with db() as con:
        row = con.execute(
            "SELECT text, hash FROM chunks WHERE file_id=? AND idx=?",
            (file_id, idx)).fetchone()
    if row is None:
        raise HTTPException(404, {"error": "chunk_out_of_range"})
    return {"file_id": file_id, "idx": idx, "text": row["text"], "sha256": row["hash"]}


# ─────────────────────────────── query ──────────────────────────────────
_SELECT_ONLY = re.compile(r"^\s*select\b", re.IGNORECASE)
_FORBIDDEN = re.compile(r"\b(attach|pragma|insert|update|delete|drop|alter|"
                        r"create|vacuum|reindex)\b", re.IGNORECASE)


@app.post("/query/sql/{file_id}")
def query_sql(file_id: str, body: SqlIn):
    require(file_id)
    sql = body.sql.strip().rstrip(";")
    if not _SELECT_ONLY.match(sql) or _FORBIDDEN.search(sql) or ";" in sql:
        raise HTTPException(400, {"error": "only single read-only SELECT allowed"})
    # Ephemeral in-memory DB holding only THIS file's chunk index.
    con = sqlite3.connect(":memory:")
    con.execute("CREATE TABLE chunks(idx INTEGER, text TEXT, hash TEXT, length INTEGER)")
    con.executemany("INSERT INTO chunks VALUES (?,?,?,?)",
                    [(c["idx"], c["text"], c["hash"], c["length"])
                     for c in get_chunks(file_id)])
    try:
        cur = con.execute(sql)
        cols = [d[0] for d in cur.description] if cur.description else []
        rows = [dict(zip(cols, row)) for row in cur.fetchmany(500)]
    except sqlite3.Error as e:
        raise HTTPException(400, {"error": "sql_error", "detail": str(e)})
    finally:
        con.close()
    return {"file_id": file_id, "columns": cols, "rows": rows, "row_count": len(rows)}


# ───────────────────────────── superposition ────────────────────────────
def _status(file_id: str) -> str:
    with db() as con:
        r = con.execute("SELECT revoked FROM files WHERE file_id=?", (file_id,)).fetchone()
    return "session_not_found" if r is None else ("revoked" if r["revoked"] else "live")


@app.post("/superpose/encode")
def superpose_encode(file_ids: List[str] = Body(...)):
    sessions = [{"id": fid, "status": _status(fid)} for fid in file_ids]
    payload = json.dumps({"sessions": sessions, "created_at": time.time()}).encode()
    return {"blob": SUPERPOSE_PREFIX + base64.b64encode(payload).decode(),
            "count": len(sessions)}


@app.post("/superpose/decode")
def superpose_decode(blob: str = Body(..., embed=True)):
    if not blob.startswith(SUPERPOSE_PREFIX):
        raise HTTPException(400, {"error": "bad_prefix", "want": SUPERPOSE_PREFIX})
    try:
        data = json.loads(base64.b64decode(blob[len(SUPERPOSE_PREFIX):]))
    except Exception:
        raise HTTPException(400, {"error": "corrupt_blob"})
    for s in data.get("sessions", []):
        s["status"] = _status(s["id"])
    return data


@app.post("/revoke/{file_id}")
def revoke(file_id: str):
    with db() as con:
        r = con.execute("SELECT 1 FROM files WHERE file_id=?", (file_id,)).fetchone()
        if r is None:
            raise HTTPException(404, {"error": "file_not_found"})
        con.execute("UPDATE files SET revoked=1 WHERE file_id=?", (file_id,))
    return {"file_id": file_id, "revoked": True}
