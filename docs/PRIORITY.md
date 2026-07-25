# Priority record — Nonlocal Coherence v0.1

This file establishes a dated, content-bound priority record for the
specification in [`NONLOCAL_COHERENCE.md`](NONLOCAL_COHERENCE.md). It does not
grant ownership; it fixes **what existed and when**, so the work can be shown to
predate a later competing claim, and so no one can patent around it unnoticed.

## Frozen artifact

| Field | Value |
|---|---|
| Document | `docs/NONLOCAL_COHERENCE.md` |
| SHA-256 (spec bytes) | `048b12799d726ebfaeae2f655657982559c9655432ec1d3a8e49fa8dc02f1585` |
| Signed capsule | `docs/priority/nonlocal_coherence_v0.1/` (Ed25519-signed, content-addressed) |
| Capsule manifest hash | `2c6cb545ea68abdac094ee126a95d1f9c10d9680e39aac6090040ca62f7ffbec` |
| Signing public key (Ed25519) | `ca7d8a4538d45453a391bf4190b06e418a8c802a5ca9f37da2e3d0f528290ed2` |
| Sealed (UTC) | `2026-07-25T05:27Z` |

> The signing key above is an **ephemeral key generated in the build
> environment** for this seal — it proves the content was signed, not durable
> authorship. The durable anchor is the **git commit timestamp** (GitHub's
> record) plus, once added, the OpenTimestamps proof below.

## Three layers of priority (strongest last)

1. **Git commit timestamp** — this commit, in `overandor/jorki`, is a dated
   public record of the spec bytes. Available immediately.
2. **Ed25519-signed capsule** — `docs/priority/nonlocal_coherence_v0.1/` binds
   the spec content to a signature; anyone can recompute the manifest hash and
   verify it against the public key above with the reference verifier.
3. **Bitcoin-anchored OpenTimestamps** — *pending*. The build environment could
   not reach the OpenTimestamps calendars (0 attestations within timeout). Add
   the anchor from a machine with open network:

   ```bash
   pip install opentimestamps-client
   ots stamp docs/NONLOCAL_COHERENCE.md      # creates docs/NONLOCAL_COHERENCE.md.ots
   # wait ~1–24h for Bitcoin confirmation, then:
   ots upgrade docs/NONLOCAL_COHERENCE.md.ots
   ots verify  docs/NONLOCAL_COHERENCE.md.ots   # shows the Bitcoin block time
   ```
   Commit the `.ots` file. It proves the spec hash existed before a specific
   Bitcoin block — an independent, trustless timestamp.

## Re-anchor with the durable owner key (recommended)

To bind this spec to your real HDAR owner identity (the key on your Mac, not the
ephemeral build key), re-seal on the Mac:

```bash
python3 macapp/reference/coherence_ref.py --selftest   # confirm the engine
# then seal docs/NONLOCAL_COHERENCE.md with your owner key and record the new
# manifest hash + signature here.
```

## Verify this record

```bash
# spec hash
shasum -a 256 docs/NONLOCAL_COHERENCE.md      # must equal SHA-256 above

# capsule signature + integrity (reference verifier)
python3 - <<'PY'
import sys; sys.path.insert(0, "macapp/reference")
import coherence_ref as C
for name, ok in C.verify("docs/priority/nonlocal_coherence_v0.1"):
    print(f"[{'PASS' if ok else 'FAIL'}] {name}")
PY
```
