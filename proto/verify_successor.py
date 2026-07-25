"""Host A verification of the successor capsule returned from Host B.

Usage: python3 verify_successor.py <hostB_output_file>
Reads the REPORT and SUCCESSOR_B64 lines from Host B's stdout, unpacks
the successor capsule, and verifies: integrity + HMAC, lineage (parent
= original manifest hash, epoch advanced), unchanged files untouched,
and the continuation correct (progress.log holds F(1)..F(20)).
"""

import base64
import io
import json
import os
import shutil
import sys
import tarfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import capsule

HERE = os.path.dirname(os.path.abspath(__file__))
SECRET = b"demo-shared-secret"


def fib(n):
    a, b = 1, 1
    out = []
    for _ in range(n):
        out.append(a)
        a, b = b, a + b
    return out


def main(path):
    report, succ_b64 = None, None
    with open(path) as f:
        for line in f:
            if line.startswith("REPORT "):
                report = json.loads(line[len("REPORT "):])
            elif line.startswith("SUCCESSOR_B64 "):
                succ_b64 = line[len("SUCCESSOR_B64 "):].strip()
    assert report and succ_b64, "host B output missing REPORT or SUCCESSOR_B64"

    orig_manifest, orig_hash = capsule.verify(
        os.path.join(HERE, "demo_state", "capsule"), secret=SECRET)

    succ_dir = os.path.join(HERE, "demo_state", "capsule-successor")
    if os.path.exists(succ_dir):
        shutil.rmtree(succ_dir)
    with tarfile.open(fileobj=io.BytesIO(base64.b64decode(succ_b64))) as t:
        t.extractall(succ_dir)

    manifest, mhash = capsule.verify(succ_dir, secret=SECRET,
                                     min_epoch=orig_manifest["epoch"] + 1)
    assert mhash == report["successor_manifest"], "successor hash != host B report"
    assert manifest["parent"] == orig_hash, "lineage broken: parent hash mismatch"
    assert manifest["identity"] == orig_manifest["identity"], "identity changed"
    assert manifest["epoch"] == orig_manifest["epoch"] + 1, "epoch did not advance"
    assert report["restored_manifest"] == orig_hash, "host B restored a different capsule"

    ws = os.path.join(HERE, "demo_state", "successor-restored")
    capsule.restore(succ_dir, ws, secret=SECRET)

    assert manifest["files"]["task.md"] == orig_manifest["files"]["task.md"], \
        "untouched file was modified"
    with open(os.path.join(ws, "progress.log")) as f:
        got = [int(l.split("=")[1]) for l in f.read().splitlines()]
    assert got == fib(20), f"continuation incorrect: {got}"

    print("SECOND-HOST VERIFICATION: PASS")
    print(f"  host B platform:    {report['platform']} ({report['machine']})")
    print(f"  original manifest:  {orig_hash} (epoch {orig_manifest['epoch']})")
    print(f"  successor manifest: {mhash} (epoch {manifest['epoch']}, parent verified)")
    print(f"  continuation:       progress.log now F(1)..F(20), task.md byte-identical")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
