# Nonlocal Coherence — a protocol for verifiable parallel agent-state continuation

**Status:** Draft specification `v0.1` (Proposed). Reference implementation runs;
protocol not yet independently reproduced. This document defines the protocol
and states — up front — what is novel and what is prior art.

> Companion to the sequential HDAR capsule protocol (see
> [`FOUNDER_PROOF_BRIEF.md`](FOUNDER_PROOF_BRIEF.md), [`../proto/`](../proto/),
> and [`../macapp/`](../macapp/)). Sequential HDAR proves `E1 → (one host) → E2`.
> Nonlocal Coherence is the **parallel** extension: `E1 → {shards} → E2` with a
> proof that the distributed result equals a single-pass result.

---

## 1. What this is (one paragraph)

An owner-signed, content-addressed agent workspace capsule (epoch E1) is fanned
out to **N sub-executors** ("shards"). Each shard computes a partition of a
deterministic task and signs its partial result with an independent ephemeral
key. A **merge** combines the partials, checks a **signed quorum**, and asserts
the distributed result is **equal** to what a single monolithic pass would have
produced. The merge seals a lineage-linked successor capsule (E2) and emits a
**coherence proof** that a third party can verify offline. The name is a
metaphor; see §7.

## 2. Why (motivation)

As agents move from one runtime to many concurrent sub-executors (parallel tool
calls, fork/merge cognition, distributed inference), no widely-used mechanism
proves that the *fanned-out* execution is faithful to a *single* execution and
carries the owner's identity across the split. HDAR already proves sequential
continuity with an offline third-party verifier; this extends that same
evidence discipline to the parallel case.

## 3. Definitions

| Term | Meaning |
|---|---|
| **Owner** | Holder of the long-lived Ed25519 key that signs E1 and E2. |
| **Capsule** | Content-addressed workspace + signed manifest + hash-linked receipt (HDAR format). |
| **Shard** | A sub-executor holding an ephemeral Ed25519 key for one run. |
| **Partition** | The subset of the task assigned to a shard. |
| **Monolithic result** | The task's output computed in one pass (the reference). |
| **Merged result** | The reduction of all shard partials. |
| **Coherence** | The verifiable invariant `merged == monolithic` under a valid signed quorum. |

## 4. Protocol

```
        owner-signed E1 capsule (epoch 1)
                   │  fan-out (partition task into N)
     ┌─────────────┼─────────────┐
   shard_1       shard_2   …   shard_N        each: compute partial,
     │ sign(1:p1)  │ sign(2:p2)   │ sign        sign (index:partial) with
     └─────────────┼─────────────┘             an ephemeral Ed25519 key
                   │  merge
      quorum check (≥ q valid shard signatures)
      equivalence check (Σ partials == monolithic)
                   │
        owner-signed E2 capsule (epoch 2, parent = E1.manifest_hash)
                 + coherence_proof
```

1. **Seal E1** — owner seals the workspace into a capsule and signs the manifest
   (Ed25519 over the manifest digest).
2. **Fan-out** — partition the deterministic task across `N` shards
   (round-robin over content-addressed file hashes in the reference).
3. **Shard compute + sign** — each shard reduces its partition to a `partial`
   and signs the message `"<index>:<partial>"` with a fresh ephemeral key.
4. **Merge** — the coordinator:
   - verifies each shard signature; counts `valid`;
   - computes `merged = reduce(partials)`;
   - computes (or is given) the `monolithic` reference;
   - sets `coherent = (merged == monolithic) AND (valid ≥ q)`.
5. **Seal E2** — restore E1's workspace, add `coherence_result.json`, seal a
   successor capsule with `parent_manifest_hash = E1.manifest_hash`, owner-signed.
6. **Emit proof** — write `coherence_proof.json` (§5).

**Reduction requirement.** The reduce operator must be associative and
commutative so that any partition yields the same merged result (the reference
uses addition modulo the Mersenne prime `2^61 − 1`).

## 5. The coherence proof object

```
hdar.coherence-proof/v0.1
  shards            N
  quorum            q
  valid_signatures  count of verifying shard signatures
  monolithic_result reference result (decimal string)
  merged_result     reduction of partials (decimal string)
  results_equal     merged == monolithic
  coherent          results_equal AND valid_signatures >= quorum
  e1_manifest_hash  parent capsule identity
  e2_manifest_hash  successor capsule identity
  shard_results[]   { index, file_count, public_key, partial, signature, signature_valid }
```

## 6. Offline third-party verifier (checks)

A verifier holding only the E1 capsule, the E2 capsule, the coherence proof, and
the owner public key checks:

1. **owner_signature** — E1 manifest Ed25519 signature verifies for the owner key.
2. **e1_integrity** — E1 manifest hash, blocks, receipt consistent.
3. **e2_integrity** — E2 manifest hash, blocks, receipt consistent.
4. **lineage** — `E2.parent_manifest_hash == E1.manifest_hash`, epoch +1.
5. **shard_signatures** — every `shard_results[i].signature` verifies for its
   `public_key` over `"<index>:<partial>"`.
6. **quorum** — `valid_signatures ≥ quorum`.
7. **equivalence** — `merged_result == monolithic_result`, and `merged_result`
   equals the reduction of the listed partials recomputed by the verifier.
8. **coherence** — `coherent == true`.

## 7. Security model, threat model, and honest limits

**Name.** "Nonlocal Coherence" is a **product metaphor**. Decoherence in physics
is the *loss* of quantum coherence; there is no literal quantum nonlocality
here — shards communicate over ordinary channels. The protocol's "coherence" is
a **verifiable equivalence invariant**, nothing more. Do not present it as
physics.

**What v0.1 proves:** owner identity carried across a parallel split; each
shard's partial is signed by an independent key; the distributed result equals a
single-pass result under a signed quorum; the whole transition is a
lineage-linked capsule pair verifiable offline.

**What v0.1 does NOT prove (roadmap):**
- **Deterministic payload only.** The reference task is an associative
  map-reduce, not a language model. Wiring a real sharded model as the payload
  is future work; equivalence for a nondeterministic model requires a defined
  tolerance/semantic-equivalence relation, not bit-equality.
- **Coordinator recomputes the reference.** The merge computes `monolithic`
  itself, so this is a coherence PoC, not a trustless system. A genuinely
  trustless merge (coordinator never recomputes; equivalence established from
  shard evidence alone, e.g. via redundant overlapping partitions or a
  succinct proof) is future work.
- **In-process shards** in the reference. Real independent hosts per shard,
  each with provider-attested execution provenance, is future work — the same
  open boundary as `hdar-cross-platform-proof/TRUST_BOUNDARY.md` (Host B origin).
- **Ephemeral shard keys are unattested.** A shard signature proves *a* key
  signed, not *whose* key. Binding shard keys to attested identities (TEE, OIDC
  workflow identity, transparency log) is future work.

## 8. Prior art, and what is / is not novel

The primitives here are **all established**. An honest positioning cites them:

- **Authenticated MapReduce** — signing at split/map/combine/reduce/result
  stages is prior art (US Patent 8,875,227, "Privacy aware authenticated
  map-reduce"). Signed partial results in a split/merge are **not** novel.
- **Quorum equivalence certificates** — "when a quorum of independent verifiers
  confirms that proposals converge on a semantically equivalent outcome, a
  signed execution certificate is issued" appears in agent-governance work
  (Governing Actions, Not Agents, arXiv 2606.26298; and IETF
  draft-bu-agentproto-security-principal-binding). Quorum-signed equivalence is
  **not** novel.
- **Verifiable distributed inference** — ZKML, proof-of-computation, and
  TEE-rollups target the same trust gap (ComputeCred Proof-of-Computation;
  zkSNARK ML evaluations, arXiv 2402.02675; Optimistic TEE-Rollups, arXiv
  2512.20176). The *inference-verification* problem is **not** ours to claim.
- **Composable / incremental attestation** for evolving distributed AI systems
  (arXiv 2603.02451) and **agent fork-merge** patterns (industry) cover parallel
  cognition with convergence.

**The thin, defensible novelty** is the *specific integration*, not any
primitive: **binding a parallel split→merge equivalence proof into an
owner-signed, content-addressed, epoch-chained agent-workspace capsule lineage
(HDAR), such that a single lineage-linked successor capsule + coherence proof is
verifiable offline by an unaffiliated third party.** Claim the integration and
the offline-verifiable capsule packaging — not "signed map-reduce," not "quorum
certificates," not "verifiable inference." Those doors are closed.

## 9. Reference implementation

- Runnable reference: [`../macapp/reference/coherence_ref.py`](../macapp/reference/coherence_ref.py)
  (stdlib + `cryptography`; real Ed25519). Mirrors the Swift engine in
  [`../macapp/Sources/HDARKit/Coherence.swift`](../macapp/Sources/HDARKit/Coherence.swift).
- Run: `python3 macapp/reference/coherence_ref.py --selftest`.

## 10. Priority record

The dated, signed priority record for this specification (SHA-256 of the frozen
document, owner public key, and timestamp) is in
[`PRIORITY.md`](PRIORITY.md). Method: git commit timestamp + Ed25519-signed
capsule of this spec; optional Bitcoin-anchored OpenTimestamps.

---

**Sources (prior art):**
[Governing Actions, Not Agents (arXiv 2606.26298)](https://arxiv.org/pdf/2606.26298) ·
[IETF draft-bu-agentproto-security-principal-binding](https://datatracker.ietf.org/doc/draft-bu-agentproto-security-principal-binding/) ·
[Composable Attestation (arXiv 2603.02451)](https://arxiv.org/html/2603.02451v1) ·
[ComputeCred Proof-of-Computation](https://www.computecred.com/proof-of-computation) ·
[Verifiable ML evaluations with zkSNARKs (arXiv 2402.02675)](https://arxiv.org/pdf/2402.02675) ·
[Optimistic TEE-Rollups (arXiv 2512.20176)](https://arxiv.org/html/2512.20176) ·
US Patent 8,875,227 (Privacy aware authenticated map-reduce)
