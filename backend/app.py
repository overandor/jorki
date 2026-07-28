"""
Jorki backend — a content-addressed, metadata-only file-intelligence gateway.

This is the missing backend the Jorki UI (src/hooks/useJorkiApi.js) has always
called. It implements the same endpoint contract as the live FileOracle service,
as a clean, self-contained, dependency-light FastAPI app you can run and audit.

Design principles
-----------------
- **Content-addressed.** A file's id IS the first 12 hex of its SHA-256. Same
  bytes in → same id. Re-indexing is idempotent.
- **Metadata-first.** Every answer is derived deterministically from the indexed
  content and its structure. There are **no external LLM calls** in this service
  at all — nothing about your files is sent anywhere. Content stays on the host
  you run this on.
- **Verifiable.** Each file carries a Merkle root over its chunk hashes; the
  root and per-chunk hashes are returned so a client can re-derive them.

Run:  uvicorn app:app --reload      (from backend/)
Docs: http://127.0.0.1:8000/docs
"""
from __future__ import annotations

import base64
import hashlib
import json
import re
import sqlite3
import time
from collections import Counter
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Jorki Backend", version="0.1.0",
              description="Content-addressed, metadata-only file-intelligence gateway.")

# The Jorki UI is served from a different origin (Vite dev server / Pages).
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

SUPERPOSE_PREFIX = "JORKI:v1:"

# ─────────────────────────────── storage ────────────────────────────────
# In-memory registry. Each file: content chunks + derived metadata. No content
# ever leaves this process except through the read endpoints the owner calls.
REGISTRY: Dict[str, Dict[str, Any]] = {}


def sha256_hex(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def merkle_root(hashes: List[str]) -> str:
    """SHA-256 Merkle root over the ordered chunk hashes (duplicate-last padding)."""
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
    """Split into ~target-char chunks on paragraph/line boundaries."""
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
    r"|(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=",
    re.MULTILINE,
)
WORD_RE = re.compile(r"[A-Za-z][A-Za-z0-9_]{2,}")
STOP = set("the and for that this with from your you are was were has have not "
           "but all can will out get file files type text data code use using".split())


def build_index(name: str, content: bytes) -> Dict[str, Any]:
    file_id = sha256_hex(content)[:12]
    try:
        text = content.decode("utf-8", errors="replace")
    except Exception:
        text = ""
    chunks = chunk_text(text)
    chunk_hashes = [sha256_hex(c.encode()) for c in chunks]
    ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
    words = [w.lower() for w in WORD_RE.findall(text)]
    top_terms = [{"term": t, "count": n}
                 for t, n in Counter(w for w in words if w not in STOP).most_common(12)]
    symbols = sorted({m.group(1) or m.group(2) for m in SYMBOL_RE.finditer(text)
                      if (m.group(1) or m.group(2))})
    return {
        "file_id": file_id,
        "name": name,
        "size": len(content),
        "sha256": sha256_hex(content),
        "ext": ext,
        "line_count": text.count("\n") + 1 if text else 0,
        "chunk_count": len(chunks),
        "merkle_root": merkle_root(chunk_hashes),
        "top_terms": top_terms,
        "symbols": symbols[:64],
        "created_at": time.time(),
        "revoked": False,
        "access": 0,
        "_chunks": chunks,
        "_chunk_hashes": chunk_hashes,
    }


def public_meta(rec: Dict[str, Any]) -> Dict[str, Any]:
    return {k: v for k, v in rec.items() if not k.startswith("_")}


def require(file_id: str) -> Dict[str, Any]:
    rec = REGISTRY.get(file_id)
    if rec is None:
        raise HTTPException(404, {"error": "file_not_found", "file_id": file_id})
    if rec["revoked"]:
        raise HTTPException(404, {"error": "session_revoked", "file_id": file_id})
    rec["access"] += 1
    return rec


# ─────────────────────────────── models ─────────────────────────────────
class IndexIn(BaseModel):
    name: str
    content: str          # raw text (or base64 if is_base64)
    is_base64: bool = False


class SqlIn(BaseModel):
    sql: str


# ─────────────────────────────── ingest ─────────────────────────────────
@app.post("/index")
def index_file(body: IndexIn):
    raw = base64.b64decode(body.content) if body.is_base64 else body.content.encode()
    rec = build_index(body.name, raw)
    REGISTRY[rec["file_id"]] = rec
    return {"file_id": rec["file_id"], "merkle_root": rec["merkle_root"],
            "chunk_count": rec["chunk_count"], "size": rec["size"]}


# ─────────────────────────────── read ───────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "files_registered": len(REGISTRY),
            "service": "jorki-backend", "version": app.version, "llm_calls": 0}


@app.get("/files")
def files():
    return {"files": [
        {"file_id": r["file_id"], "name": r["name"], "size": r["size"],
         "chunk_count": r["chunk_count"], "created_at": r["created_at"],
         "revoked": r["revoked"]}
        for r in REGISTRY.values()]}


@app.get("/meta/{file_id}")
def meta(file_id: str):
    return public_meta(require(file_id))


@app.get("/summary/{file_id}")
def summary(file_id: str):
    r = require(file_id)
    return {"file_id": file_id, "method": "deterministic (no LLM)",
            "line_count": r["line_count"], "chunk_count": r["chunk_count"],
            "top_terms": r["top_terms"], "symbols": r["symbols"],
            "headline": f'{r["name"]} — {r["line_count"]} lines, '
                        f'{len(r["symbols"])} symbols, {r["chunk_count"]} chunks'}


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
    index_bytes = sum(len(c) for c in r["_chunks"])
    ratio = round(r["size"] / index_bytes, 3) if index_bytes else 1.0
    return {"file_id": file_id, "status": "live", "chunk_count": r["chunk_count"],
            "index_bytes": index_bytes, "compression_ratio": ratio,
            "merkle_root": r["merkle_root"]}


@app.get("/stats/{file_id}")
def stats(file_id: str):
    r = require(file_id)
    return {"file_id": file_id, "accesses": r["access"], "size": r["size"],
            "chunk_count": r["chunk_count"], "created_at": r["created_at"]}


@app.get("/search/{file_id}")
def search(file_id: str, q: str = ""):
    r = require(file_id)
    ql = q.lower().strip()
    hits = []
    if ql:
        for i, c in enumerate(r["_chunks"]):
            n = c.lower().count(ql)
            if n:
                pos = c.lower().find(ql)
                snippet = c[max(0, pos - 40):pos + 60].strip().replace("\n", " ")
                hits.append({"chunk": i, "score": n, "snippet": snippet})
        hits.sort(key=lambda h: -h["score"])
    return {"file_id": file_id, "q": q, "hits": hits[:25], "total": len(hits)}


@app.get("/chunk/{file_id}/{idx}")
def chunk(file_id: str, idx: int):
    r = require(file_id)
    if not (0 <= idx < len(r["_chunks"])):
        raise HTTPException(404, {"error": "chunk_out_of_range",
                                  "have": len(r["_chunks"])})
    return {"file_id": file_id, "idx": idx, "text": r["_chunks"][idx],
            "sha256": r["_chunk_hashes"][idx]}


# ─────────────────────────────── query ──────────────────────────────────
_SELECT_ONLY = re.compile(r"^\s*select\b", re.IGNORECASE)
_FORBIDDEN = re.compile(r"\b(attach|pragma|insert|update|delete|drop|alter|"
                        r"create|vacuum|reindex)\b", re.IGNORECASE)


@app.post("/query/sql/{file_id}")
def query_sql(file_id: str, body: SqlIn):
    r = require(file_id)
    sql = body.sql.strip().rstrip(";")
    if not _SELECT_ONLY.match(sql) or _FORBIDDEN.search(sql) or ";" in sql:
        raise HTTPException(400, {"error": "only single read-only SELECT allowed"})
    # Ephemeral in-memory DB holding only THIS file's chunk index.
    con = sqlite3.connect(":memory:")
    con.execute("CREATE TABLE chunks(idx INTEGER, text TEXT, hash TEXT, length INTEGER)")
    con.executemany("INSERT INTO chunks VALUES (?,?,?,?)",
                    [(i, c, r["_chunk_hashes"][i], len(c))
                     for i, c in enumerate(r["_chunks"])])
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
@app.post("/superpose/encode")
def superpose_encode(file_ids: List[str] = Body(...)):
    sessions = [{"id": fid, "status": ("live" if fid in REGISTRY
                 and not REGISTRY[fid]["revoked"] else "unknown")}
                for fid in file_ids]
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
        rec = REGISTRY.get(s["id"])
        s["status"] = ("revoked" if rec and rec["revoked"]
                       else "live" if rec else "session_not_found")
    return data


@app.post("/revoke/{file_id}")
def revoke(file_id: str):
    rec = REGISTRY.get(file_id)
    if rec is None:
        raise HTTPException(404, {"error": "file_not_found"})
    rec["revoked"] = True
    return {"file_id": file_id, "revoked": True}
