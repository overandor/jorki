"""Minimal hardware-detached capsule prototype.

Implements the Phase-one slice from docs/FOUNDER_PROOF_BRIEF.md:
content-addressed blocks, canonical sealed manifest, HMAC
authentication (shared-secret — NOT asymmetric attribution, per the
brief's sealing language), hash-linked receipts, lineage epochs,
atomic sealing, and byte-verified restoration. Stdlib only.
"""

import hashlib
import hmac as hmaclib
import json
import os
import shutil
import time


def sha256_bytes(data):
    return hashlib.sha256(data).hexdigest()


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode()


def utcnow():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def seal(workspace, capsule_dir, *, identity, epoch, parent, objective,
         next_action, secret, prev_receipt_hash=None):
    """Seal `workspace` into `capsule_dir` atomically. Returns manifest hash."""
    tmp = capsule_dir + ".tmp"
    if os.path.exists(tmp):
        shutil.rmtree(tmp)
    blocks = os.path.join(tmp, "blocks")
    os.makedirs(blocks)

    files = {}
    for root, _, names in os.walk(workspace):
        for name in sorted(names):
            path = os.path.join(root, name)
            rel = os.path.relpath(path, workspace)
            with open(path, "rb") as f:
                data = f.read()
            digest = sha256_bytes(data)
            files[rel] = digest
            block_path = os.path.join(blocks, digest)
            if not os.path.exists(block_path):
                with open(block_path, "wb") as f:
                    f.write(data)

    manifest = {
        "identity": identity,
        "epoch": epoch,
        "parent": parent,
        "objective": objective,
        "next_action": next_action,
        "files": files,
        "sealed_at": utcnow(),
    }
    mbytes = canonical(manifest)
    mhash = sha256_bytes(mbytes)
    with open(os.path.join(tmp, "manifest.json"), "wb") as f:
        f.write(mbytes)
    tag = hmaclib.new(secret, mbytes, hashlib.sha256).hexdigest()
    with open(os.path.join(tmp, "manifest.hmac"), "w") as f:
        f.write(tag)

    receipt = {
        "kind": "seal",
        "manifest": mhash,
        "parent_receipt": prev_receipt_hash,
        "at": manifest["sealed_at"],
    }
    with open(os.path.join(tmp, "receipts.jsonl"), "ab") as f:
        f.write(canonical(receipt) + b"\n")

    if os.path.exists(capsule_dir):
        shutil.rmtree(capsule_dir)
    os.rename(tmp, capsule_dir)  # atomic: capsule exists fully sealed or not at all
    return mhash


def verify(capsule_dir, secret=None, min_epoch=None):
    """Verify capsule integrity. Returns (manifest dict, manifest hash).

    Raises ValueError on any tampering, incompleteness, bad receipt
    chain, or epoch rollback below `min_epoch`. HMAC is checked only
    when `secret` is supplied (shared-secret verification, not
    independent attribution).
    """
    mpath = os.path.join(capsule_dir, "manifest.json")
    with open(mpath, "rb") as f:
        mbytes = f.read()
    manifest = json.loads(mbytes)
    if canonical(manifest) != mbytes:
        raise ValueError("manifest is not in canonical form")
    mhash = sha256_bytes(mbytes)

    if secret is not None:
        with open(os.path.join(capsule_dir, "manifest.hmac")) as f:
            tag = f.read().strip()
        expect = hmaclib.new(secret, mbytes, hashlib.sha256).hexdigest()
        if not hmaclib.compare_digest(tag, expect):
            raise ValueError("HMAC authentication failed")

    if min_epoch is not None and manifest["epoch"] < min_epoch:
        raise ValueError(
            f"epoch rollback: capsule epoch {manifest['epoch']} < required {min_epoch}")

    for rel, digest in manifest["files"].items():
        block_path = os.path.join(capsule_dir, "blocks", digest)
        if not os.path.exists(block_path):
            raise ValueError(f"missing content block for {rel}: {digest}")
        with open(block_path, "rb") as f:
            if sha256_bytes(f.read()) != digest:
                raise ValueError(f"block content does not match its address: {digest}")

    prev = None
    seal_seen = False
    with open(os.path.join(capsule_dir, "receipts.jsonl"), "rb") as f:
        for line in f.read().splitlines():
            receipt = json.loads(line)
            if canonical(receipt) != line:
                raise ValueError("receipt is not in canonical form")
            if receipt.get("parent_receipt") != prev:
                raise ValueError("receipt chain link broken")
            if receipt["kind"] == "seal":
                if receipt["manifest"] != mhash:
                    raise ValueError("seal receipt does not match manifest")
                seal_seen = True
            prev = sha256_bytes(line)
    if not seal_seen:
        raise ValueError("no seal receipt: capsule incomplete")

    return manifest, mhash


def restore(capsule_dir, dest, secret=None, min_epoch=None):
    """Verify then reconstruct the workspace at `dest`. Returns (manifest, mhash)."""
    manifest, mhash = verify(capsule_dir, secret=secret, min_epoch=min_epoch)
    if os.path.exists(dest):
        shutil.rmtree(dest)
    for rel, digest in manifest["files"].items():
        out = os.path.join(dest, rel)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        shutil.copyfile(os.path.join(capsule_dir, "blocks", digest), out)
        with open(out, "rb") as f:
            if sha256_bytes(f.read()) != digest:
                raise ValueError(f"restored file does not match manifest: {rel}")
    return manifest, mhash


def workspace_root_hash(workspace):
    """Deterministic root hash of a directory's contents."""
    files = {}
    for root, _, names in os.walk(workspace):
        for name in sorted(names):
            path = os.path.join(root, name)
            rel = os.path.relpath(path, workspace)
            with open(path, "rb") as f:
                files[rel] = sha256_bytes(f.read())
    return sha256_bytes(canonical(files))
