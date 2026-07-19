# Hardware-Detached Agent Runtime — Canonical Founder Proof Brief

> This is the canonical version of the thesis. Where other documents in this directory overlap with it, this brief wins. Use this version in the repository, architecture document, landing page, demonstration script and investor material.

## Target definition

> This section describes the product being built, not what exists today. See "Implemented today" immediately below for current status.

A **storage-rooted, proof-carrying runtime for persistent AI agents**.

An agent will be able to suspend into a signed, provider-neutral capsule; release its active execution resources; wake through the same stable SSH identity on fresh compatible compute; recover its workspace, objectives, authority and evidence chain; continue unfinished work; and collapse back into storage when idle.

The durable identity belongs to the capsule — not to a container, VM, process, cloud account or physical computer.

## Implemented today

Status as of **2026-07-19**. Anything not listed as built here is a target, regardless of how confidently later sections describe it.

**Built and tested:**

- Capsule and lineage logic
- Semantic-quiescence and fencing invariants (including SQLite fencing)
- HMAC capsule sealing
- Offline verification by an authorized (shared-secret-holding) verifier

**Not built:**

- Isolated execution provider
- Stable SSH gateway and identity
- Independent-host (A → B) migration
- Reliability harness

Until the decisive demonstration passes, fundraising language must use "we are building," not "we built."

### Sealing today is HMAC, not asymmetric signatures

HMAC proves integrity to parties holding the shared secret — but any holder of that secret can also mint a valid authentication tag. It is not independent public-key attribution. Until asymmetric signing (e.g. Ed25519) exists, the honest terms are:

- "authenticated capsule"
- "shared-secret integrity verification"
- "offline verification by an authorized verifier"

Do **not** say: "independently attributable signature," "public offline verification," or "verifier cannot forge." Where later sections say "cryptographic signature" or "independent verifier," read them as targets gated on asymmetric signing.

## Claim ledger

Every claim carries one of four states — **Proposed → Implemented → Tested → Independently reproduced** — and may only advance with evidence (repository component, test name, receipt artifact, or reproduction record).

| Claim | State (2026-07-19) |
|---|---|
| Capsule integrity | Tested |
| HMAC authentication | Tested |
| Effect quiescence | Tested |
| SQLite fencing | Tested |
| Isolated runtime destruction | Proposed |
| Stable SSH identity | Proposed |
| Host A → Host B restoration | Proposed |
| 100 successful migrations | Proposed |
| External developer reproduction | Not started |

## The first product has exactly one job

> Suspend a functioning agent into signed storage, destroy its original runtime, and restore it through the same SSH identity inside a newly materialized isolated environment — with its pending task, filesystem, permissions and proof history intact.

That is the investable wedge.

It does **not** initially claim:

- Hardware-free computation
- Exact Metal-to-CUDA continuation
- Cross-ISA register translation
- Live migration of arbitrary GPU kernels
- Preservation of every active TCP connection
- Deterministic replay across unrelated model providers
- A universal compute marketplace
- A conscious or immortal agent

## The M5 Pro architecture

The M5 Pro should operate as four logically separate systems:

```text
macOS host
├── Metal-native LLM inference plane
├── capsule and identity control plane
├── isolated Linux execution provider
└── content-addressed suspension store
```

Run local inference on macOS through [MLX](https://github.com/ml-explore/mlx) or another Metal-native engine. MLX is designed specifically for Apple silicon and uses its unified-memory architecture so supported CPU and GPU operations can work over shared arrays without the conventional device-copy model.

Run agent tools and untrusted code in isolated Linux environments. Apple's [`container`](https://github.com/apple/container) tooling runs Linux containers through lightweight virtual machines and is optimized for Apple silicon; the underlying [Containerization framework](https://github.com/apple/containerization) places each Linux container in its own lightweight VM.

Keep the main LLM outside those Linux environments. GPU access for Apple-silicon Linux containers is [not currently supported](https://github.com/apple/containerization/issues/46) by Apple's Containerization project, and the corresponding request was closed as `wontfix`.

The operating path is therefore:

```text
User or SSH session
→ agent resolver
→ macOS LLM produces typed plan
→ policy engine authorizes capabilities
→ isolated Linux runtime executes
→ verifier observes results
→ receipt enters capsule history
```

[Nested virtualization](https://developer.apple.com/documentation/virtualization/vzgenericplatformconfiguration/isnestedvirtualizationsupported) is technically available on M3 and later Macs, which includes the M5 generation, but it is not necessary for the first product.

## The five state classes

Do not call everything "memory." Separate it rigorously.

**Immutable state** contains model identifiers, tokenizer identifiers, runtime images, tool schemas and policy versions.

**Durable agent state** contains objectives, commitments, working summaries, unresolved questions, task boundaries and continuation instructions.

**Mutable workspace state** contains files, repository changes, generated artifacts and execution outputs.

**Ephemeral acceleration state** contains KV cache, temporary tensors, compiled kernels, scheduler internals and process memory. This may be discarded during semantic migration.

**Evidence state** contains commands, policy decisions, capability grants, file hashes, verification outcomes, capsule lineage and signatures.

Provider-neutral restoration requires durable agent state, workspace state and evidence state. It does not require pretending every accelerator byte is portable.

## The suspension capsule

The capsule should contain:

- Stable agent identity and lineage epoch
- Parent capsule hash
- Model and tokenizer content digests
- Inference requirements and substitution policy
- Current objective and pending continuation point
- Working-memory summary
- Content-addressed filesystem root
- Capability grants and prohibitions
- Secret references, never raw secrets
- Pending external-operation registry
- Runtime compatibility manifest
- Exact and semantic restoration checkpoints
- Hash-linked execution and migration receipts
- Cryptographic signature over the sealed manifest

Model weights should be referenced by digest and resolved from a shared cache. They should not be duplicated inside every agent capsule.

The capsule is the agent's **operational passport**, not a complete copy of every machine it has visited.

## Semantic quiescence

Suspension is valid only after the runtime reaches a safe operational boundary.

Before sealing, it must establish that:

- Model generation has reached an explicit boundary
- Tool calls have completed or been cancelled
- Files have been flushed
- Database transactions are closed
- External actions have known commitment status
- Child processes have terminated or been checkpointed
- Pending payments, messages and deployments have operation IDs
- The next permitted action is recorded
- The receipt chain has been finalized

Freezing memory alone is insufficient. An agent suspended after an email was accepted but before the acknowledgement was recorded may send the same message again after restoration.

## The three restoration contracts

**Exact restoration** applies only when architecture, runtime, image, process representation and relevant hardware are compatible.

**Semantic restoration** reconstructs the same operational task from the portable checkpoint on different hardware. It preserves objectives, commitments, workspace, permissions and evidence without claiming bit-identical continuation.

**Degraded restoration** occurs when the destination lacks a required tool, model, network route or accelerator. Missing capabilities must be disclosed and accepted by policy or the operator.

Every restoration receipt must state which contract was used.

## The capability invariant

Across every transition:

> Authority may be preserved or reduced, but it must never silently increase.

A destination provider must translate abstract capabilities into local enforcement:

- Filesystem mounts
- Network rules
- Allowed executables
- API scopes
- Secret-broker permissions
- Spending ceilings
- Time and resource limits
- Human-approval requirements
- Child-agent delegation depth

Failure to map a capability safely must block restoration or place the runtime into declared degraded mode.

## Stable SSH identity

The address identifies the agent rather than its current machine:

```text
ssh agent-id@runtime-network
```

The resolver then:

1. Authenticates the human or calling service.
2. Resolves the latest authorized capsule.
3. Acquires an exclusive wake lease.
4. Rejects rollback, corruption or unauthorized forks.
5. Selects a compatible execution provider.
6. Materializes an isolated runtime.
7. Restores the capsule.
8. Verifies capabilities and lineage.
9. Attaches the SSH stream.
10. Suspends and seals the runtime after inactivity.

The physical host may change while the visible agent identity remains stable.

## Proof-carrying execution

Do not attempt to prove that the LLM's internal reasoning is correct. Prove observable transitions.

Each receipt should establish:

- Which capsule requested the action
- Which policy was evaluated
- Which capability authorized it
- Which runtime image executed it
- Which structured operation or command ran
- Which inputs were committed
- Which outputs were observed
- Which files or resources changed
- Which verification followed
- Which receipt preceded it
- Which capsule resulted

A signature proves integrity and attribution. It does not automatically prove that the action was intelligent or commercially useful.

EvidencePipe remains outside the canonical project. The receipt protocol is an internal primitive of the runtime, not a separate product pasted onto it.

# Build sequence

## Phase one: Capsule core

Build content-addressed storage, atomic sealing, agent identity, lineage epochs, hash-linked receipts, signature verification and workspace reconstruction.

Pass condition:

```text
workspace
→ sealed capsule
→ original workspace deleted
→ restored workspace matches its recorded root hash
```

## Phase two: Isolated execution

Add one Linux VM-backed container per active agent, typed operations, resource limits, mount policies, output capture and filesystem-delta recording.

Pass condition:

```text
authorized operation
→ isolated execution
→ observed state transition
→ independently verifiable receipt
```

## Phase three: Suspension lifecycle

Add semantic quiescence, pending-effect reconciliation, idle suspension, runtime destruction, warm restoration and cold restoration.

Pass condition:

```text
active agent
→ safe checkpoint
→ capsule sealed
→ runtime destroyed
→ runtime materialized again
→ pending task continues
```

## Phase four: Agent-addressed SSH

Add stable SSH identity, forced-command gateway, capsule resolver, exclusive wake leases, anti-rollback validation and automatic collapse after disconnect.

Pass condition:

```text
ssh agent-name
→ fresh runtime appears
→ agent recovers unfinished objective
→ work continues
→ session closes
→ runtime disappears
```

Treat this as four engineering phases. Four weeks may be a useful prototype sprint target, but it is not a credible production-readiness schedule for one developer.

# The decisive demonstration

The fundraising demo should visibly show:

1. An agent begins a real repository task.
2. It makes verified changes and records an unfinished objective.
3. Suspension is requested.
4. External effects are reconciled.
5. A signed capsule is sealed.
6. The original Linux runtime is destroyed.
7. Active inference and execution resources are released.
8. The capsule is transferred to a second execution environment.
9. The same SSH agent identity is used.
10. A new runtime materializes.
11. The agent recovers the objective and workspace.
12. It continues rather than restarting the entire task.
13. Tests pass.
14. An independent verifier validates the complete receipt chain.
15. The agent returns to dormant storage.

The second environment must be genuinely separate. Two directories controlled by the same continuously running process do not establish migration.

# Operational metrics

The project should publish:

- Suspension latency
- Warm restoration latency
- Cold restoration latency
- Capsule size
- Content deduplication ratio
- Dormant active-compute consumption
- Restoration success rate
- Receipt-verification latency
- Capability-mapping failure rate
- Corruption and rollback detection rate
- Duplicate external-effect count
- Number of independently supported providers
- Percentage of tasks resumed without full prompt replay

The most important reliability metric is not merely "the agent woke up." It is:

> The agent continued from the correct declared operational boundary without duplicated or unauthorized external effects.

# The $3 million seed gate

A $3 million seed remains plausible, not guaranteed.

The category is clearly fundable: [Daytona announced a $24 million Series A](https://www.daytona.io/dotfiles/daytona-raises-24m-series-a-to-give-every-agent-a-computer) around infrastructure that provides computers for agents — after first raising a [$2 million pre-seed](https://www.daytona.io/dotfiles/daytona-raises-2m-in-pre-seed) and then $5 million. [E2B](https://e2b.dev) publicly positions itself as secure isolated computer infrastructure for AI agents and raised a $21 million Series A, bringing its total funding to $32 million. Browserbase raised a $40 million Series B for agent browser infrastructure. These are not identical products, but they confirm investor demand for defensible execution infrastructure beneath agents — and they also mean "we built another sandbox" will not be enough.

The market is also selective. [Carta reported](https://carta.com/learn/startups/fundraising/seed-funding/) a $3.5 million median seed raise for 2024 and a $16 million median pre-money valuation for new seed rounds in Q1 2025, while the number of seed rounds declined 28% year over year. Capital exists, but fewer companies are clearing the evidence threshold.

The figures below are **illustrative fundraising positioning, not underwriting conclusions**. A migration demo does not mechanically produce a check; financing also depends on founder credibility, market urgency, buyer interviews, competitive differentiation, investor access, ownership and cap table, security posture, and current fundraising conditions.

The fundraising hierarchy is roughly:

- **One-Mac demonstration:** technically interesting — perhaps a $500,000 to $1.5 million pre-seed story.
- **Mac-to-second-host migration with proof continuity, plus an open specification:** credible $2 million to $3 million seed story.
- **Repeatable deployment, external developers, design partners, and a clear hosted product:** strong $3 million seed candidate.
- **Revenue, integrations, and provider participation:** grounds for a larger institutional round.

A $3 million round should target roughly **15 to 24 months of runway**, covering a small systems team, security work, hosted infrastructure, independent audits, and initial customer deployments.

The financing gate is:

- Restoration onto a genuinely separate runtime
- Stable SSH identity across that transition
- Capability continuity or explicit attenuation
- Signed and independently verified receipts
- Detection of tampering, rollback and unauthorized duplication
- At least three outside developers reproducing the workflow
- At least two serious design partners
- Measured operational benefit over ordinary persistent sandboxes
- A public capsule specification or SDK boundary
- A credible path from local runtime to hosted control plane

Before those conditions, it is an ambitious technical prototype.

After those conditions, it becomes a defensible seed-stage infrastructure company.

What would probably **not** justify $3 million:

- A design document
- A container that restarts after shutdown
- `tmux` persistence
- A ZIP archive called a capsule
- A chatbot remembering its previous goal
- A hash chain that records commands but cannot prove restoration continuity
- A demo where both "providers" are just two folders on the same running process

# Canonical fundraising claim

The claim supportable **today**:

> **We are building a storage-rooted runtime for persistent AI agents. Capsule integrity, lineage, semantic quiescence, and fencing invariants are implemented and tested; isolated execution, stable SSH identity, and cross-host migration are the next gates.**

The claim to use **only after the decisive demonstration passes**:

> **We built a storage-rooted runtime for persistent AI agents. An agent can suspend into a portable, proof-carrying capsule, release its active machine, wake through the same SSH identity on compatible compute, retain its authorized capabilities and unfinished work, and return to storage when idle. Exact restoration is used where environments are compatible; heterogeneous transitions use explicitly labeled semantic restoration.**

Do not claim exact heterogeneous CPU/GPU migration in version one. Investors forgive an unsolved hard problem. They are less charitable when a founder attempts to repeal computer architecture during the pitch.

---

# Appendix: M5 Pro implementation details

Two implementation specifics that support the brief but do not belong in investor material.

## Capsule on-disk layout

```text
capsule/
├── manifest.cbor
├── agent-state/
│   ├── identity.json
│   ├── goals.json
│   ├── working-memory.json
│   ├── checkpoint.json
│   └── rng-state.bin
├── filesystem/
│   ├── root-index.json
│   └── content-addressed-blocks/
├── capabilities/
│   ├── grants.json
│   ├── requirements.json
│   └── secret-references.json
├── runtime/
│   ├── image-digest.json
│   ├── environment.json
│   └── restore-contract.json
├── evidence/
│   ├── receipts.jsonl
│   └── signatures/
└── lineage/
    ├── parent-hash
    ├── epoch
    └── migration-chain.jsonl
```

The model reference inside `runtime/` resolves weights by digest from a shared cache:

```json
{
  "model": {
    "family": "local-model",
    "weights_digest": "sha256:…",
    "tokenizer_digest": "sha256:…",
    "quantization": "4bit",
    "runtime": "mlx",
    "minimum_context": 32768
  }
}
```

That turns 20 agents × one large model copy into one model copy + 20 small operational capsules.

## Unified-memory division

Until the exact unified-memory capacity is specified, allocate by percentage rather than fixed gigabytes:

```text
25%  macOS, filesystem cache and control services
50%  local model and inference cache
15%  active Linux execution runtime
10%  restore staging, compression and safety margin
```

For heavier models, allow the model plane to reach roughly 60%, but never let macOS begin sustained swap thrashing. The SSD is the dormant-state layer, not RAM wearing a fake mustache.

Keep only one substantial model resident during early development. Use a smaller model for tool planning, capsule classification, policy parsing, receipt summarization and restore verification. Reserve the strongest local model for ambiguous planning and code repair.
