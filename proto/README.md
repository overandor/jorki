# Capsule prototype (Stage 1 slice)

A minimal, stdlib-only implementation of the Phase-one capsule slice from
[`../docs/FOUNDER_PROOF_BRIEF.md`](../docs/FOUNDER_PROOF_BRIEF.md): content-addressed
blocks, a canonical sealed manifest, HMAC authentication, hash-linked receipts,
lineage epochs, atomic sealing, and byte-verified restoration.

This is the runnable artifact behind the brief's **Tested** claim ledger rows
(capsule integrity, HMAC authentication, rollback rejection). It is deliberately
small and honest about its limits.

## What's here

| File | Purpose |
|---|---|
| `capsule.py` | The capsule library: `seal`, `verify`, `restore`, `workspace_root_hash`. |
| `demo_local.py` | Local lifecycle demo + tamper/rollback/incompleteness rejection tests. |
| `make_bundle.py` | Produces a self-contained transport script for restoring a capsule on a second host. |
| `verify_successor.py` | Host-A verification of a successor capsule returned from Host B (lineage, continuation, integrity). |

Generated demo output (`demo_state/`) and bytecode (`__pycache__/`) are
git-ignored; run the demos to regenerate them.

## Run the local lifecycle demo

```
python3 demo_local.py
```

Pass condition (the Stage-1 exit gate): `workspace → sealed capsule → destroy
workspace → byte-identical restoration`, plus rejection of modified blocks,
modified manifests, missing content blocks, epoch rollback, and forged receipt
chains.

## Second-host transport (proof of concept)

`make_bundle.py` emits a single self-contained Python script that embeds a
sealed capsule and the capsule library. Running it on a second host reconstructs
the capsule, verifies integrity, restores the workspace, continues the
unfinished task from the declared checkpoint (no prompt replay), and seals a
successor capsule with the epoch advanced and the parent hash linked.
`verify_successor.py` then re-verifies that successor back on the origin host.

## Honest limits

- **HMAC, not asymmetric signatures.** Sealing uses a shared secret. Any holder
  of that secret can mint a valid tag — this is shared-secret integrity
  verification, not independent public-key attribution. Ed25519-class signing is
  a target, not implemented here. (See the brief's sealing-language section.)
- The transport bundle carries the shared secret for convenience, so Host B's
  verification is shared-secret authentication, not independent attribution.
- This slice does **not** implement isolated execution, a stable SSH gateway,
  semantic quiescence, or genuine independent-host migration — those are the
  later stages in the roadmap.
