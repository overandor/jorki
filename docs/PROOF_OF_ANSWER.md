# Proof-of-Answer: The LLM as an Economic Actor

The LLM could become an economic actor that earns money for producing useful, verifiable answers.

The clean mechanism is:

> A user asks a question. The agent answers. If the answer produces an accepted result — such as solving a bug, completing research, generating a qualified lead, or enabling a purchase — the payer releases a reward. The revenue belongs to the agent's persistent identity, not to whichever machine happened to run it.

## Why the Hardware-Detached Agent Runtime makes this work

The [Hardware-Detached Agent Runtime](AGENT_RUNTIME_ROADMAP.md) makes this especially interesting because the payment history can travel inside the agent's signed capsule:

- The agent has a stable identity and payment address.
- Each paid task has an explicit contract and success condition.
- Execution receipts show which model, tools, evidence, and capabilities produced the answer.
- A verifier checks delivery before payment is released.
- Revenue pays inference, storage, and execution providers.
- The remainder accumulates as the agent's operating balance.
- When suspended, its balance and obligations remain attached to its identity.
- When restored elsewhere, it continues earning and fulfilling unfinished contracts.

## Who pays

The crucial distinction is who pays:

- **Users** can pay directly for answers.
- **Businesses** can sponsor clearly disclosed answers.
- **Marketplaces** can pay agents for verified task completion.
- **Other agents** can purchase information or computation.
- **Developers** can receive royalties when their specialized agent is used.

This is stronger than KV-cache advertising. An advertisement pays because attention occurred. A paid-answer system pays because verified value occurred.

## The Proof-of-Answer Receipt

The safest commercial unit is not a token or impression. It is a receipt-backed outcome:

```
question → answer → evidence → acceptance → payment receipt
```

The primitive is a **Proof-of-Answer Receipt**. It binds:

- The question
- The answer digest
- Evidence
- Payer
- Price
- Acceptance criteria
- Policy version
- Payment outcome

Payment must never silently change the truth of the response; sponsorship and conflicts must be visible.

## What this means

The LLM gets paid for answering — but technically, its durable agent identity earns revenue for completing verified intellectual work, even while its underlying compute providers continually change. That turns the runtime from a suspension system into infrastructure for persistent, economically autonomous agents.

Within the [four-system pipe](AGENT_ECONOMY_ARCHITECTURE.md), the Proof-of-Answer Receipt is the atomic unit that the Contract, Treasury and Settlement Engine escrows against and the Proof and Capability Continuity Network verifies. That verification is performed by the runtime's own internal verifier; [EvidencePipe](EVIDENCEPIPE.md) is an optional external product that may additionally consume or verify these receipts, and nothing here depends on it existing.
