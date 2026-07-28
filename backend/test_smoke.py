"""End-to-end smoke test for the Jorki backend. Run: python test_smoke.py"""
import sys
from fastapi.testclient import TestClient
from app import app

c = TestClient(app)
ok = True


def check(label, cond):
    global ok
    print(("  [PASS] " if cond else "  [FAIL] ") + label)
    ok = ok and cond


SAMPLE = """\
def alpha(x):
    return x + 1

def beta(y):
    # privacy matters here
    return y * 2

class Gateway:
    pass
"""

print("index a file")
r = c.post("/index", json={"name": "worker.py", "content": SAMPLE}).json()
fid = r["file_id"]
check("returns content-addressed file_id", len(fid) == 12)
check("returns a merkle root", len(r["merkle_root"]) == 64)

print("re-index is idempotent (content-addressed)")
r2 = c.post("/index", json={"name": "worker.py", "content": SAMPLE}).json()
check("same bytes -> same file_id", r2["file_id"] == fid)

print("health + files")
h = c.get("/health").json()
check("health ok, no llm calls", h["status"] == "ok" and h["llm_calls"] == 0)
check("file is listed", any(f["file_id"] == fid for f in c.get("/files").json()["files"]))

print("summary is deterministic, no LLM")
s = c.get(f"/summary/{fid}").json()
check("method is deterministic", s["method"].startswith("deterministic"))
check("extracts symbols", set(["alpha", "beta", "Gateway"]).issubset(set(s["symbols"])))

print("search")
se = c.get(f"/search/{fid}", params={"q": "privacy"}).json()
check("finds the term", se["total"] >= 1)

print("chunk + hash")
ch = c.get(f"/chunk/{fid}/0").json()
check("chunk has verifiable sha256", len(ch["sha256"]) == 64)

print("SQL over the index")
q = c.post(f"/query/sql/{fid}", json={"sql": "SELECT idx, length FROM chunks ORDER BY idx"}).json()
check("SELECT returns rows", q["row_count"] >= 1 and "length" in q["columns"])
bad = c.post(f"/query/sql/{fid}", json={"sql": "DROP TABLE chunks"})
check("non-SELECT rejected", bad.status_code == 400)
inj = c.post(f"/query/sql/{fid}", json={"sql": "SELECT 1; DROP TABLE chunks"})
check("stacked-statement injection rejected", inj.status_code == 400)

print("superposition round-trip")
enc = c.post("/superpose/encode", json=[fid]).json()
check("blob has JORKI:v1 prefix", enc["blob"].startswith("JORKI:v1:"))
dec = c.post("/superpose/decode", json={"blob": enc["blob"]}).json()
check("decodes to live session", dec["sessions"][0]["status"] == "live")

print("revoke closes the session")
c.post(f"/revoke/{fid}")
check("revoked file returns 404", c.get(f"/meta/{fid}").status_code == 404)
dec2 = c.post("/superpose/decode", json={"blob": enc["blob"]}).json()
check("blob now shows revoked", dec2["sessions"][0]["status"] == "revoked")

print("\nSMOKE:", "PASS" if ok else "FAIL")
sys.exit(0 if ok else 1)
