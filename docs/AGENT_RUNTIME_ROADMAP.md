# Hardware-Detached Agent Runtime Roadmap

## Stage 0 — Freeze the contract (Week 1)

Define the narrow product promise:

> Suspend an agent into a signed capsule, destroy its runtime, and restore it through the same SSH identity with its unfinished work, authority, workspace, and evidence intact.

**Deliverables:**

- Capsule specification v0.1
- Threat model and trust boundaries
- Exact, semantic, and degraded restoration contracts
- Capability attenuation rules
- Benchmark and acceptance-test definitions
- Explicit unsupported-features list

**Exit gate:** every future feature can be evaluated against one written restoration contract.

## Stage 1 — Capsule core (Weeks 2–5)

**Build:**

- Stable agent identities
- Content-addressed workspace storage
- Incremental filesystem chunking
- Durable objectives and continuation checkpoints
- Hash-linked receipts
- Signed manifests
- Atomic capsule sealing
- Capsule lineage and epochs
- Independent offline verifier

**Required tests:**

- Delete the original workspace and reconstruct it exactly.
- Detect modified blocks, manifests, and receipts.
- Reject incomplete capsules.
- Reject rollback to an unauthorized epoch.
- Demonstrate deduplication between successive checkpoints.

**Exit gate:**

```
workspace → capsule → destroy workspace → verified identical restoration
```

## Stage 2 — Isolated execution (Weeks 6–9)

**Build:**

- One isolated Linux runtime per active agent
- Apple `container` provider adapter
- Host control plane
- Typed operation protocol
- Filesystem, executable, and network policies
- CPU, memory, disk, and time limits
- Command-output and filesystem-delta capture
- Secret references through a broker interface

**Exit gate:**

```
authorized operation
→ isolated execution
→ measured state change
→ signed, independently verifiable receipt
```

The agent must not receive unrestricted macOS access.

## Stage 3 — Safe suspension (Weeks 10–14)

**Build:**

- Semantic-quiescence protocol
- Pending external-effect registry
- Operation IDs and idempotency support
- Child-process reconciliation
- Database and filesystem flush hooks
- Explicit next-action checkpoint
- Suspend and resume APIs
- Runtime destruction verification
- Warm and cold restoration

**Failure tests:**

- Crash during sealing
- Tool still running during suspension
- Unknown external-operation outcome
- Corrupted latest capsule
- Missing content block
- Restore attempted twice concurrently

**Exit gate:**

```
active task
→ safe checkpoint
→ sealed capsule
→ runtime destroyed
→ fresh runtime
→ correct continuation
```

Duplicate external effects must remain zero.

## Stage 4 — Stable SSH identity (Weeks 15–18)

**Build:**

- `ssh agent-id@runtime-network`
- Forced-command SSH gateway
- Identity-to-capsule resolver
- Exclusive wake leases
- Anti-rollback checks
- Runtime provider selection
- Terminal attachment
- Idle-collapse policy
- Session and migration receipts

**Exit gate:**

```
SSH connection
→ capsule verified
→ runtime materialized
→ unfinished work continued
→ disconnect
→ capsule resealed
→ runtime destroyed
```

The SSH address remains stable while the underlying runtime disappears.

## Stage 5 — Genuine second-host restoration (Months 5–6)

Add a second execution environment that is operationally independent from the development Mac.

**Build:**

- Capsule transport
- Remote content-addressed block synchronization
- Provider compatibility negotiation
- Capability translation
- Model and image resolution by digest
- Migration authorization
- Degraded-mode disclosure
- Split-brain prevention

**Test both:**

- Exact restoration between compatible ARM64 environments
- Semantic restoration when execution environments differ

**Exit gate:** destroy Runtime A, move the capsule, and continue through the same agent identity on Runtime B. Two local directories do not count.

## Stage 6 — Developer preview (Months 7–9)

Productize the working system:

- CLI and SDK
- Documented capsule format
- Provider adapter interface
- Local installation workflow
- Example coding-agent integration
- Recovery and diagnostic commands
- Structured observability
- Versioned policy schema
- Upgrade and compatibility rules
- Reproducible demonstration repository

**Recruit:**

- 3–5 outside developers
- 2 design partners
- 1 security-focused reviewer

**Exit gate:** three developers complete the suspend–migrate–restore workflow without direct founder intervention.

## Stage 7 — Security and reliability (Months 9–12)

**Harden:**

- Key rotation and revocation
- Replay and fork protection
- Multi-tenant isolation
- Secret-broker integration
- Disaster recovery
- Capsule garbage collection
- Provider failure recovery
- Property-based and fault-injection testing
- External security review
- Signed release and supply-chain provenance

**Target measurements:**

- Zero accepted corrupted or rolled-back capsules
- Zero silent authority escalation
- Zero duplicated external effects in the test suite
- Defined recovery behavior for every interrupted transition
- Restore-success rate above 99% in supported configurations

## Stage 8 — Hosted control plane (Months 12–18)

Build only after the local protocol works:

- Hosted identity and capsule resolver
- Encrypted remote capsule storage
- Provider registry
- Organization policies and audit logs
- Usage accounting
- Team access controls
- Managed SSH gateway
- Enterprise secret integrations
- Regional and retention controls
- Paid design-partner deployments

The hosted service should coordinate execution without becoming the sole owner of capsule identity or verification.

## Fundraising gates

### Pre-seed-quality proof

- Local capsule lifecycle works.
- Runtime is visibly destroyed.
- Stable SSH restoration works.
- Offline verification detects tampering.

### Credible $3M seed gate

- Genuine second-host restoration
- Stable identity across providers
- Capability preservation or explicit reduction
- Independent receipt verification
- Rollback, corruption, and duplicate-wake rejection
- Published latency, storage, reliability, and compute metrics
- Three external developers
- Two serious design partners
- Clear hosted-product path

## Metrics to publish from the beginning

- Suspension latency
- Warm and cold restoration latency
- Capsule and delta size
- Deduplication ratio
- Dormant compute consumption
- Restore-success rate
- Receipt-verification latency
- Capability-mapping failures
- Rollback and corruption detection
- Duplicate external effects
- Tasks continued without complete prompt replay

## Features deliberately deferred

- Metal-to-CUDA live migration
- Cross-ISA process restoration
- Portable GPU-kernel state
- Arbitrary TCP-session migration
- Deterministic LLM replay
- Compute-marketplace scheduling
- Consensus between autonomous capsule forks

## Critical path

```
capsule integrity
→ isolated execution
→ safe suspension
→ stable SSH restoration
→ separate-host migration
→ external adoption
→ hosted product
```

Everything else is secondary until that chain works end to end.
