# Syndication standard v0.1 — mode / SDK / docs

Every product repo in the curated set gets the same three-part surface so they
read as one portfolio. This is the source-of-truth template; the rollout status
per repo is tracked in [`REGISTRY.md`](REGISTRY.md).

A repo is **syndicated** when it has all three, each honest about real status:

## 1. `MODES.md` — how to run it, in every mode
Enumerate the operating modes with exact commands and what each requires/proves.
Mark which are real vs aspirational. Minimum modes:

| Mode | Purpose | Requires |
|---|---|---|
| `local` | Runs offline, no external services; the honest default demo | nothing beyond deps |
| `demo` | Scripted end-to-end run producing artifacts a reviewer can inspect | deps |
| `prod` | Real deployment path (cloud/sandbox/keys) | credentials/infra |

Rule: if a mode does not yet emit what it claims, say so in that mode's row.

## 2. `SDK.md` — the importable surface
- Install (one command)
- Minimal import + example that actually runs
- Public API table (symbol → one-line purpose)
- Stability note (what's stable vs experimental)

## 3. `docs/` (or a `## Docs` README section)
- What it is (one sentence, no hype)
- **Status / claim boundary** — what is proven, tested, and NOT yet proven
- Links to deeper docs, evidence, or specs

## Honesty rules (non-negotiable)
- No mode/example/claim that behaves differently than advertised.
- Separate *tested* from *aspirational* explicitly.
- If a headline command produces nothing, document that until it's fixed.

These mirror the discipline in `docs/FOUNDER_PROOF_BRIEF.md` (claim ledger) and
`hdar-cross-platform-proof/TRUST_BOUNDARY.md`.
