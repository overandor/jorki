#!/usr/bin/env python3
"""
Nonlocal Coherence — runnable reference implementation.

Mirrors the Swift engine in macapp/Sources/HDARKit/ (Capsule.swift, Coherence.swift)
so the protocol in docs/NONLOCAL_COHERENCE.md can be executed and checked on any
platform with Python + `cryptography` (real Ed25519), including CI and Linux where
CryptoKit is unavailable.

    python3 coherence_ref.py --selftest

INTEROP NOTE: this targets the same v0.1 canonicalization as the Swift engine
(sorted keys, compact separators, unescaped slashes, integer-only numbers).
Byte-for-byte parity with a Swift-sealed capsule is still to be confirmed on a
Mac; until then treat each implementation as its own verifier domain.
"""
import argparse
import hashlib
import json
import os
import sys
import tempfile

from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey, Ed25519PublicKey,
)
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
from cryptography.exceptions import InvalidSignature

PRIME = 2**61 - 1  # Mersenne, matches Coherence.swift
CAPSULE_SCHEMA = "hdar.desktop-capsule/v0.1"
RECEIPT_SCHEMA = "hdar.receipt/v0.1"


# ---- canonical JSON + hashing (mirror Canonical.swift) ----

def canonical(obj) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"),
                      ensure_ascii=False).encode("utf-8")

def sha_hex(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()

def canon_hash(obj) -> str:
    return sha_hex(canonical(obj))

def value_for_hash(hex_str: str) -> int:
    return int(hex_str[:16], 16) % PRIME

def addmod(a: int, b: int) -> int:
    return ((a % PRIME) + (b % PRIME)) % PRIME


# ---- keys ----

def gen_key():
    return Ed25519PrivateKey.generate()

def pub_hex(priv) -> str:
    return priv.public_key().public_bytes(Encoding.Raw, PublicFormat.Raw).hex()

def verify_sig(public_key_hex: str, signature_hex: str, message: bytes) -> bool:
    try:
        pk = Ed25519PublicKey.from_public_bytes(bytes.fromhex(public_key_hex))
        pk.verify(bytes.fromhex(signature_hex), message)
        return True
    except (InvalidSignature, ValueError):
        return False


# ---- capsule seal / verify / restore (mirror Capsule.swift) ----

def build_workspace(root: str, blocks_dir: str):
    files, path_hashes, total = [], {}, 0
    for dirpath, _, names in os.walk(root):
        for n in names:
            full = os.path.join(dirpath, n)
            rel = os.path.relpath(full, root)
            with open(full, "rb") as f:
                data = f.read()
            h = sha_hex(data)
            mode = os.stat(full).st_mode & 0o777
            shard = os.path.join(blocks_dir, h[:2])
            os.makedirs(shard, exist_ok=True)
            block = os.path.join(shard, h)
            if not os.path.exists(block):
                with open(block, "wb") as f:
                    f.write(data)
            files.append({"rel_path": rel, "sha256": h, "size": len(data), "mode": mode})
            path_hashes[rel] = h
            total += len(data)
    files.sort(key=lambda x: x["rel_path"])
    root_hash = canon_hash(path_hashes)
    return {"files": files, "root_hash": root_hash, "total_size": total}, root_hash


def seal(workspace: str, owner, agent_id: str, epoch: int, out: str,
         parent_manifest_hash=None, event="capsule_sealed"):
    os.makedirs(out, exist_ok=True)
    blocks = os.path.join(out, "blocks")
    os.makedirs(blocks, exist_ok=True)
    ws, root_hash = build_workspace(workspace, blocks)

    body = {
        "schema": CAPSULE_SCHEMA,
        "agent_id": agent_id,
        "epoch": epoch,
        "created_at_ms": 0,  # deterministic for the reference
        "file_count": len(ws["files"]),
        "owner_public_key": pub_hex(owner),
        "workspace_manifest": ws,
    }
    if parent_manifest_hash:
        body["parent_manifest_hash"] = parent_manifest_hash

    manifest_hash = canon_hash(body)
    signature = owner.sign(hashlib.sha256(canonical(body)).digest())

    manifest = dict(body)
    manifest["manifest_hash"] = manifest_hash
    manifest["owner_signature"] = signature.hex()
    manifest["owner_signature_algorithm"] = "ed25519"
    with open(os.path.join(out, "manifest.json"), "w") as f:
        json.dump(manifest, f, sort_keys=True, indent=2)

    receipt = {
        "schema": RECEIPT_SCHEMA, "event": event, "epoch": epoch,
        "agent_id": agent_id, "manifest_hash": manifest_hash,
        "workspace_root_hash": root_hash, "sealed_at_ms": 0,
    }
    receipt["receipt_hash"] = canon_hash(receipt)
    with open(os.path.join(out, "receipt.json"), "w") as f:
        json.dump(receipt, f, sort_keys=True, indent=2)

    return {"dir": out, "epoch": epoch, "manifest_hash": manifest_hash,
            "root_hash": root_hash, "file_count": len(ws["files"]),
            "total_size": ws["total_size"]}


def load_manifest(cap_dir: str):
    with open(os.path.join(cap_dir, "manifest.json")) as f:
        return json.load(f)

def manifest_body(m: dict):
    return {k: v for k, v in m.items()
            if k not in ("manifest_hash", "owner_signature", "owner_signature_algorithm")}


def verify(cap_dir: str):
    checks = []
    m = load_manifest(cap_dir)
    body = manifest_body(m)

    recomputed = canon_hash(body)
    checks.append(("manifest_hash", recomputed == m.get("manifest_hash")))

    digest = hashlib.sha256(canonical(body)).digest()
    checks.append(("owner_signature",
                   verify_sig(m.get("owner_public_key", ""), m.get("owner_signature", ""), digest)))

    ws = m.get("workspace_manifest", {})
    blocks = os.path.join(cap_dir, "blocks")
    ok_blocks, path_hashes = True, {}
    for fobj in ws.get("files", []):
        h, rel = fobj["sha256"], fobj["rel_path"]
        path_hashes[rel] = h
        block = os.path.join(blocks, h[:2], h)
        try:
            with open(block, "rb") as f:
                if sha_hex(f.read()) != h:
                    ok_blocks = False
        except FileNotFoundError:
            ok_blocks = False
    checks.append(("content_blocks", ok_blocks))
    checks.append(("workspace_root_hash", canon_hash(path_hashes) == ws.get("root_hash")))

    try:
        with open(os.path.join(cap_dir, "receipt.json")) as f:
            r = json.load(f)
        stored = r.pop("receipt_hash", None)
        checks.append(("receipt", canon_hash(r) == stored and r.get("manifest_hash") == m.get("manifest_hash")))
    except FileNotFoundError:
        checks.append(("receipt", False))
    return checks


def restore(cap_dir: str, target: str):
    os.makedirs(target, exist_ok=True)
    m = load_manifest(cap_dir)
    blocks = os.path.join(cap_dir, "blocks")
    for fobj in m.get("workspace_manifest", {}).get("files", []):
        h, rel = fobj["sha256"], fobj["rel_path"]
        with open(os.path.join(blocks, h[:2], h), "rb") as f:
            data = f.read()
        assert sha_hex(data) == h, f"block hash mismatch {rel}"
        dest = os.path.join(target, rel)
        os.makedirs(os.path.dirname(dest) or ".", exist_ok=True)
        with open(dest, "wb") as f:
            f.write(data)


# ---- Nonlocal Coherence fan-out (mirror Coherence.swift) ----

def coherence(cap_dir: str, owner, shards: int, quorum: int, out: str, faulty=0):
    assert shards >= 1 and 1 <= quorum <= shards
    assert all(ok for _, ok in verify(cap_dir)), "E1 failed verification"

    m = load_manifest(cap_dir)
    e1_hash = m["manifest_hash"]
    hashes = [f["sha256"] for f in m["workspace_manifest"]["files"]]

    monolithic = 0
    for h in hashes:
        monolithic = addmod(monolithic, value_for_hash(h))

    partitions = [[] for _ in range(shards)]
    for i, h in enumerate(hashes):
        partitions[i % shards].append(h)

    results, merged = [], 0
    for idx in range(shards):
        partial = 0
        for h in partitions[idx]:
            partial = addmod(partial, value_for_hash(h))
        if idx < faulty:
            partial = addmod(partial, 1)  # injected fault
        k = gen_key()
        msg = f"{idx}:{partial}".encode()
        sig = k.sign(msg)
        pkh = pub_hex(k)
        results.append({
            "index": idx, "file_count": len(partitions[idx]), "public_key": pkh,
            "partial": str(partial), "signature": sig.hex(),
            "signature_valid": verify_sig(pkh, sig.hex(), msg),
        })
        merged = addmod(merged, partial)

    valid = sum(1 for r in results if r["signature_valid"])
    equal = merged == monolithic
    coherent = equal and valid >= quorum

    os.makedirs(out, exist_ok=True)
    e2_ws = os.path.join(out, "workspace_e2")
    if os.path.exists(e2_ws):
        import shutil; shutil.rmtree(e2_ws)
    restore(cap_dir, e2_ws)
    with open(os.path.join(e2_ws, "coherence_result.json"), "w") as f:
        json.dump({"task": "coherence_map_reduce_v0.1", "shards": shards,
                   "quorum": quorum, "monolithic_result": str(monolithic),
                   "merged_result": str(merged), "coherent": coherent},
                  f, sort_keys=True, indent=2)

    e2 = seal(e2_ws, owner, m.get("agent_id", "hdar-ref-agent"),
              m.get("epoch", 1) + 1, os.path.join(out, "capsule_epoch_2"),
              parent_manifest_hash=e1_hash,
              event="capsule_sealed_after_coherence_merge")

    proof = {
        "schema": "hdar.coherence-proof/v0.1",
        "shards": shards, "quorum": quorum, "valid_signatures": valid,
        "monolithic_result": str(monolithic), "merged_result": str(merged),
        "results_equal": equal, "coherent": coherent,
        "e1_manifest_hash": e1_hash, "e2_manifest_hash": e2["manifest_hash"],
        "shard_results": results,
    }
    with open(os.path.join(out, "coherence_proof.json"), "w") as f:
        json.dump(proof, f, sort_keys=True, indent=2)
    return proof


# ---- offline third-party verifier (docs/NONLOCAL_COHERENCE.md §6) ----

def third_party_verify(e1_dir, e2_dir, proof, owner_public_key_hex):
    checks = []
    e1 = load_manifest(e1_dir)
    checks.append(("owner_signature",
                   e1.get("owner_public_key") == owner_public_key_hex
                   and all(ok for n, ok in verify(e1_dir) if n == "owner_signature")))
    checks.append(("e1_integrity", all(ok for _, ok in verify(e1_dir))))
    checks.append(("e2_integrity", all(ok for _, ok in verify(e2_dir))))

    e2 = load_manifest(e2_dir)
    checks.append(("lineage",
                   e2.get("parent_manifest_hash") == e1.get("manifest_hash")
                   and e2.get("epoch") == e1.get("epoch") + 1))

    sig_ok = True
    recomputed_merge = 0
    for r in proof["shard_results"]:
        msg = f"{r['index']}:{r['partial']}".encode()
        if not verify_sig(r["public_key"], r["signature"], msg):
            sig_ok = False
        recomputed_merge = addmod(recomputed_merge, int(r["partial"]))
    checks.append(("shard_signatures", sig_ok))
    checks.append(("quorum", proof["valid_signatures"] >= proof["quorum"]))
    checks.append(("equivalence",
                   proof["merged_result"] == proof["monolithic_result"]
                   and str(recomputed_merge) == proof["merged_result"]))
    checks.append(("coherence", proof["coherent"] is True))
    return checks


# ---- selftest ----

def _make_workspace(root):
    os.makedirs(os.path.join(root, "src"), exist_ok=True)
    open(os.path.join(root, "src", "worker.py"), "w").write("print('hello host a')\n")
    open(os.path.join(root, "todo.md"), "w").write("task: continue\nstatus: pending\n")
    open(os.path.join(root, "agent_state.json"), "w").write('{"epoch":1,"cursor":42}\n')

def selftest():
    tmp = tempfile.mkdtemp(prefix="coherence-ref-")
    owner = gen_key()
    print(f"owner public key: {pub_hex(owner)}")

    ws = os.path.join(tmp, "ws"); _make_workspace(ws)
    e1 = seal(ws, owner, "hdar-ref", 1, os.path.join(tmp, "capsule_epoch_1"))
    print(f"sealed E1: manifest={e1['manifest_hash'][:16]}… files={e1['file_count']}")

    for name, ok in verify(e1["dir"]):
        print(f"  [{'PASS' if ok else 'FAIL'}] {name}")
    e1_ok = all(ok for _, ok in verify(e1["dir"]))

    good = coherence(e1["dir"], owner, 5, 4, os.path.join(tmp, "coh_good"))
    print(f"coherence (5 shards, quorum 4): monolithic={good['monolithic_result']} "
          f"merged={good['merged_result']} equal={good['results_equal']} "
          f"validSigs={good['valid_signatures']} -> coherent={good['coherent']}")

    tpv = third_party_verify(e1["dir"], os.path.join(tmp, "coh_good", "capsule_epoch_2"),
                             good, pub_hex(owner))
    for name, ok in tpv:
        print(f"  [3PV {'PASS' if ok else 'FAIL'}] {name}")
    tpv_ok = all(ok for _, ok in tpv)

    bad = coherence(e1["dir"], owner, 5, 4, os.path.join(tmp, "coh_bad"), faulty=1)
    print(f"coherence with 1 faulty shard: equal={bad['results_equal']} "
          f"-> coherent={bad['coherent']} (expected: not coherent)")

    import shutil; shutil.rmtree(tmp, ignore_errors=True)
    ok = e1_ok and good["coherent"] and tpv_ok and not bad["coherent"]
    print("\nSELFTEST:", "PASS" if ok else "FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--selftest", action="store_true")
    args = ap.parse_args()
    if args.selftest:
        sys.exit(selftest())
    ap.print_help()
