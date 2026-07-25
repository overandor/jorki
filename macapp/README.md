# HDAR desktop (macOS app)

A native macOS app for the Hardware-Detached Agent Runtime capsule protocol —
**seal** a workspace into a signed capsule, **verify** it independently, and run
**Nonlocal Coherence**: a parallel fan-out that certifies a distributed result
equals a single-pass result under a signed quorum.

Built entirely on Apple frameworks — **Foundation, CryptoKit, SwiftUI** — with
no third-party dependencies. Ed25519 signatures are real (CryptoKit
`Curve25519.Signing`), not placeholders.

> This is the desktop sibling of the `overandor/hdar-*` proof repos and the
> `proto/` prototype in this repository. It is a working PoC, written to the
> same honesty discipline as `hdar-cross-platform-proof/TRUST_BOUNDARY.md`:
> claims are bounded, and what is not yet proven is said plainly below.

## Build & run (on a Mac)

Requires the Xcode command-line tools (`xcode-select --install`). No Xcode IDE
project needed.

```bash
cd macapp
./build_app.sh          # produces ./HDAR.app
open HDAR.app
```

Headless engine check (no GUI), useful in CI or over SSH:

```bash
swift run hdar-selftest
```

The self-test seals a capsule, verifies it, runs an honest coherence fan-out
(expects **coherent**), then a fault-injected one (expects **not coherent**),
and exits non-zero if any expectation fails.

## What the app does

| Tab | Action |
|---|---|
| **Seal** | Pick a workspace folder + output folder → writes a signed `capsule_epoch_1/` (content-addressed `blocks/`, `manifest.json`, `receipt.json`). |
| **Verify** | Pick a capsule dir → runs 5 independent checks (manifest hash, Ed25519 owner signature, content blocks, workspace root hash, receipt binding). |
| **Coherence** | Pick an E1 capsule + output → fans the task across N in-process shards, each signing its partial with an ephemeral key, then seals `capsule_epoch_2/` and writes `coherence_proof.json`. A "faulty shards" stepper lets you watch the proof correctly refuse to certify. |
| **Identity** | Shows the Ed25519 owner public key. The private key lives at `~/Library/Application Support/HDAR/owner_key.bin` (0600) and never leaves the machine. |

## Capsule format (`hdar.desktop-capsule/v0.1`)

- **Content-addressed blocks**: `blocks/<sha256[:2]>/<sha256>`.
- **Workspace root hash**: SHA-256 over canonical JSON of `{rel_path: sha256}`.
- **Manifest hash**: SHA-256 over the canonical JSON manifest body (everything
  except `manifest_hash`, `owner_signature`, `owner_signature_algorithm`).
- **Owner signature**: Ed25519 over the 32-byte manifest digest.
- **Receipt**: hash-linked, bound to `manifest_hash`.
- **Lineage**: E2 records `parent_manifest_hash = E1.manifest_hash`.

Canonical JSON here means `JSONSerialization` with `.sortedKeys` and
`.withoutEscapingSlashes`, over integer-only numeric fields.

## Nonlocal Coherence — what it proves, and what it does not

**Proves (PoC):** an E1 capsule can be split across N shards, each shard signs
its partial with an independent ephemeral Ed25519 key, and the merge certifies
`merged == monolithic` (distributed result equals a single-pass result) only
when at least `quorum` signatures are valid. A resealed, lineage-linked E2
capsule and a `coherence_proof.json` are emitted.

**Does not prove (roadmap — stated up front):**
- The payload is a **deterministic map-reduce**, not a language model. This
  demonstrates the verifiable split→merge protocol; wiring a real sharded model
  as the payload is future work.
- Shards run **in-process**, so this is a coherence PoC, not a trustless
  distributed system. The coordinator recomputes the monolithic reference; a
  genuinely trustless merge (coordinator never recomputes) is future work.
- "Coherence" is a **verifiable invariant** (distributed == monolithic under a
  signed quorum). It is **not** a physics claim, and "Nonlocal Coherence" is a
  product name, not an assertion about quantum nonlocality.

## Interop note (read before claiming cross-verification)

This app implements a **self-consistent** `v0.1` canonicalization: capsules it
seals, it verifies. Byte-level compatibility with the Python/Rust reference
verifiers in the `hdar-*` repos is **not yet confirmed** — the canonicalization
and signature-input rules must be pinned to one spec and a capsule round-tripped
across both implementations first. Until then, treat this as its own verifier
domain.

## Distribution

`build_app.sh` ad-hoc signs the app so it runs locally. For distribution outside
your machine, sign with a Developer ID certificate and notarize
(`xcrun notarytool`) — otherwise Gatekeeper will quarantine it.
