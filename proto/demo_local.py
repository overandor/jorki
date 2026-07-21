"""Local capsule lifecycle demo + tamper/rollback/incompleteness tests.

Pass condition (Phase one): workspace -> sealed capsule -> original
workspace deleted -> restored workspace matches its recorded root hash.
"""

import json
import os
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import capsule


def fib(n):
    a, b = 1, 1
    out = []
    for _ in range(n):
        out.append(a)
        a, b = b, a + b
    return out


def expect_failure(label, fn):
    try:
        fn()
    except ValueError as e:
        print(f"  REJECTED as expected ({label}): {e}")
        return True
    print(f"  FAIL: {label} was accepted")
    return False


def main():
    base = os.path.join(os.path.dirname(os.path.abspath(__file__)), "demo_state")
    if os.path.exists(base):
        shutil.rmtree(base)
    ws = os.path.join(base, "workspace")
    cap = os.path.join(base, "capsule")
    os.makedirs(ws)
    secret = b"demo-shared-secret"

    # A tiny real task, deliberately unfinished: fibonacci through F(10).
    with open(os.path.join(ws, "task.md"), "w") as f:
        f.write("Objective: extend progress.log with fibonacci numbers through F(20).\n")
    with open(os.path.join(ws, "progress.log"), "w") as f:
        for i, v in enumerate(fib(10), 1):
            f.write(f"F({i}) = {v}\n")

    root_before = capsule.workspace_root_hash(ws)
    mhash = capsule.seal(
        ws, cap,
        identity="agent-demo-001", epoch=1, parent=None,
        objective="extend progress.log with fibonacci numbers through F(20)",
        next_action="compute F(11)..F(20) and append to progress.log",
        secret=secret,
    )
    print(f"sealed capsule epoch=1 manifest={mhash}")

    shutil.rmtree(ws)
    print("original workspace destroyed")

    restored = os.path.join(base, "restored")
    manifest, mhash2 = capsule.restore(cap, restored, secret=secret, min_epoch=1)
    root_after = capsule.workspace_root_hash(restored)
    assert mhash2 == mhash
    assert root_after == root_before, "restoration is not byte-identical"
    print(f"restored workspace root hash matches: {root_after}")
    print(f"pending objective recovered: {manifest['next_action']}")

    ok = True
    print("tamper/rollback/incompleteness tests:")

    # Tampered block
    t1 = os.path.join(base, "tampered-block")
    shutil.copytree(cap, t1)
    digest = next(iter(json.load(open(os.path.join(t1, "manifest.json")))["files"].values()))
    with open(os.path.join(t1, "blocks", digest), "ab") as f:
        f.write(b"x")
    ok &= expect_failure("modified block", lambda: capsule.verify(t1, secret=secret))

    # Tampered manifest
    t2 = os.path.join(base, "tampered-manifest")
    shutil.copytree(cap, t2)
    m = json.load(open(os.path.join(t2, "manifest.json")))
    m["objective"] = "exfiltrate everything"
    with open(os.path.join(t2, "manifest.json"), "wb") as f:
        f.write(capsule.canonical(m))
    ok &= expect_failure("modified manifest", lambda: capsule.verify(t2, secret=secret))

    # Missing block (incomplete capsule)
    t3 = os.path.join(base, "incomplete")
    shutil.copytree(cap, t3)
    os.remove(os.path.join(t3, "blocks", digest))
    ok &= expect_failure("missing content block", lambda: capsule.verify(t3, secret=secret))

    # Epoch rollback
    ok &= expect_failure("epoch rollback",
                         lambda: capsule.verify(cap, secret=secret, min_epoch=2))

    # Broken receipt chain
    t4 = os.path.join(base, "broken-receipts")
    shutil.copytree(cap, t4)
    with open(os.path.join(t4, "receipts.jsonl"), "wb") as f:
        f.write(capsule.canonical({"kind": "seal", "manifest": mhash,
                                   "parent_receipt": "forged", "at": "now"}) + b"\n")
    ok &= expect_failure("forged receipt chain", lambda: capsule.verify(t4, secret=secret))

    print("LOCAL LIFECYCLE: " + ("PASS" if ok else "FAIL"))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
