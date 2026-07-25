"""Produce a self-contained transport script for second-host restoration.

Embeds the sealed capsule (tar.gz, base64), the capsule library source,
and the demo shared secret into one python file. Host B runs it with no
other dependencies: it reconstructs the capsule, verifies integrity,
restores the workspace, continues the unfinished task, seals a
successor capsule (epoch+1, parent = original manifest hash), and
prints a JSON report plus the successor capsule as base64.

NOTE: transporting the HMAC secret inside the bundle is a
proof-of-concept convenience. It means Host B's verification is
shared-secret authentication, not independent attribution — exactly
the limitation docs/FOUNDER_PROOF_BRIEF.md requires us to state.
"""

import base64
import io
import os
import tarfile

HERE = os.path.dirname(os.path.abspath(__file__))

RUNNER = '''\
import base64, io, json, os, platform, shutil, sys, tarfile, tempfile

CAPSULE_B64 = "{capsule_b64}"
SECRET = b"demo-shared-secret"
EXPECT_MANIFEST = "{expect_manifest}"

CAPSULE_LIB = base64.b64decode("{capsule_lib_b64}")

def main():
    work = tempfile.mkdtemp(prefix="hostB-")
    with open(os.path.join(work, "capsule.py"), "wb") as f:
        f.write(CAPSULE_LIB)
    sys.path.insert(0, work)
    import capsule

    cap = os.path.join(work, "capsule-in")
    with tarfile.open(fileobj=io.BytesIO(base64.b64decode(CAPSULE_B64))) as t:
        t.extractall(cap)

    ws = os.path.join(work, "restored")
    manifest, mhash = capsule.restore(cap, ws, secret=SECRET, min_epoch=1)
    assert mhash == EXPECT_MANIFEST, "transported manifest hash mismatch"
    root_restored = capsule.workspace_root_hash(ws)

    # Continue the unfinished task exactly from the declared checkpoint:
    # extend the sequence from the last two recorded values, no replay.
    with open(os.path.join(ws, "progress.log")) as f:
        vals = [int(l.split("=")[1]) for l in f.read().splitlines()]
    assert len(vals) == 10, "checkpoint does not match declared state"
    with open(os.path.join(ws, "progress.log"), "a") as f:
        a, b = vals[-2], vals[-1]
        for i in range(len(vals) + 1, 21):
            a, b = b, a + b
            f.write("F(" + str(i) + ") = " + str(b) + "\\n")

    succ = os.path.join(work, "capsule-out")
    mhash2 = capsule.seal(
        ws, succ,
        identity=manifest["identity"], epoch=manifest["epoch"] + 1, parent=mhash,
        objective=manifest["objective"],
        next_action="objective complete; awaiting new contract",
        secret=SECRET,
    )
    capsule.verify(succ, secret=SECRET, min_epoch=manifest["epoch"] + 1)

    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w:gz") as t:
        t.add(succ, arcname=".")
    shutil.rmtree(work, ignore_errors=True)

    print("REPORT " + json.dumps({{
        "host": platform.node(),
        "platform": platform.platform(),
        "machine": platform.machine(),
        "restored_manifest": mhash,
        "restored_root": root_restored,
        "successor_manifest": mhash2,
        "successor_epoch": manifest["epoch"] + 1,
        "next_action_recovered": manifest["next_action"],
    }}, sort_keys=True))
    print("SUCCESSOR_B64 " + base64.b64encode(buf.getvalue()).decode())

main()
'''


def main():
    cap_dir = os.path.join(HERE, "demo_state", "capsule")
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w:gz") as t:
        t.add(cap_dir, arcname=".")
    capsule_b64 = base64.b64encode(buf.getvalue()).decode()

    with open(os.path.join(cap_dir, "manifest.json"), "rb") as f:
        import hashlib
        expect_manifest = hashlib.sha256(f.read()).hexdigest()

    with open(os.path.join(HERE, "capsule.py"), "rb") as f:
        capsule_lib_b64 = base64.b64encode(f.read()).decode()

    script = RUNNER.format(capsule_b64=capsule_b64,
                           expect_manifest=expect_manifest,
                           capsule_lib_b64=capsule_lib_b64)
    out = os.path.join(HERE, "demo_state", "hostB_restore_continue.py")
    with open(out, "w") as f:
        f.write(script)
    print(f"bundle written: {out} ({os.path.getsize(out)} bytes)")
    print(f"expected manifest: {expect_manifest}")


if __name__ == "__main__":
    main()
