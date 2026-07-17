# EvidencePipe

> A $300,000 pre-seed company, not a large generic ETL platform.

EvidencePipe is a verification ETL system for AI and software projects. It continuously collects test results and evidence receipts from local machines, GitHub, CI providers, storage, and webhooks; normalizes them into a tamper-evident ledger; verifies what actually ran; and produces an approval-gated action package.

The core promise:

> EvidencePipe turns "the tests passed" into portable, independently verifiable proof — and prevents autonomous systems from acting externally without human authorization.

EvidencePipe sits **outside the canonical runtime project** — per the [founder proof brief](FOUNDER_PROOF_BRIEF.md), the runtime's receipt protocol is an internal primitive of the runtime, not this product pasted onto it. EvidencePipe is a standalone company thesis that shares the same evidence philosophy, and its receipts are the evidence backbone of the [Proof-of-Answer economy](PROOF_OF_ANSWER.md).

## Product boundary

The first version does four things extremely well:

- Ingest test reports, logs, builds, commits, coverage results, and signed receipts.
- Validate hashes, signatures, chronology, provenance, environment binding, and test reconciliation.
- Generate a concise verification summary with verified, contradicted, incomplete, and stale claims.
- Require digest-bound human approval before deployment, merging, messaging, publishing, or any other external mutation.

This is not another observability dashboard. Observability shows what systems reported. EvidencePipe determines whether those reports support the claims being made.

## Initial buyer

Start with teams building autonomous coding agents, regulated AI workflows, CI/CD infrastructure, and agent sandboxes. Their immediate problem is that an agent can generate tests, run tests, summarize tests, and approve its own interpretation — an epistemic conflict disguised as automation.

The entry product is a GitHub application plus a lightweight local collector. Every pull request receives a verification package and an approval-ready action proposal.

## $300K use of funds

Use approximately:

| Allocation | Amount |
|---|---|
| Two technical founders, or one founder plus a senior systems engineer | $150K |
| Infrastructure, signing, artifact storage, CI workloads, and reproducibility environments | $45K |
| Security review, threat modeling, and an initial independent audit | $35K |
| Design partners, integrations, and customer onboarding | $30K |
| Legal, company formation, contracts, and privacy documentation | $20K |
| Reserve for unexpected infrastructure and integration costs | $20K |

That provides roughly 10–12 months of disciplined runway if founder compensation remains controlled.

## Seed milestones

**By month three**, demonstrate ingestion from GitHub Actions, local files, and one additional CI provider. Validate JUnit, coverage, build artifacts, Git commits, and JSONL receipt chains.

**By month six**, show that EvidencePipe detects fabricated passes, missing artifacts, replayed receipts, mismatched commits, altered reports, contradictory test totals, and unverifiable environment claims.

**By month nine**, operate with five design partners and produce at least 1,000 verification packages. Measure detection accuracy, verification latency, false alarms, evidence completeness, and approval conversion.

**By month twelve**, target:

- 10 paying teams
- $10K–$20K monthly recurring revenue
- Three production integrations
- One independently audited verification protocol
- More than 10,000 validated runs
- Documented examples where EvidencePipe prevented an unsupported deployment or external action

## Business model

Offer a free local verifier to create adoption. Charge teams for hosted ingestion, durable evidence storage, policy enforcement, approval workflows, organization controls, and audit exports.

A credible starting price is $500–$2,000 per team each month. Enterprise contracts can later price around verification volume, retention requirements, private deployment, and compliance controls.

## Investment case

The defensible asset is not the dashboard. It is the normalized evidence protocol, validation engine, tamper-evident history, integration graph, and growing corpus of valid and invalid execution evidence.

The $300K round should finance one proof:

> An autonomous system proposed an external action, EvidencePipe independently established exactly what was and was not proven, and no action occurred until a human approved the immutable payload.

That is narrow enough to build, valuable enough to sell, and substantial enough to become the trust layer underneath autonomous software.
