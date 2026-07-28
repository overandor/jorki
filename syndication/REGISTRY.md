# Syndication registry — curated real products

Rollout tracker for the [syndication standard](STANDARD.md) (mode / SDK / docs)
pushed into each curated real-product repo. Excludes numbered scratch repos
(`overandor/1`…`49`) and private trading-bot repos.

Status: ☐ not started · ◐ in progress (draft PR) · ☑ syndicated

| Repo | What it is | Has SDK? | Has docs? | Status |
|---|---|---|---|---|
| [hdar](https://github.com/overandor/hdar) | Unified HDAR runtime (canonical) | yes (`hdar/`) | partial | ◐ draft PR [hdar#1](https://github.com/overandor/hdar/pull/1) |
| [hdar-cross-platform-proof](https://github.com/overandor/hdar-cross-platform-proof) | Cross-platform Ed25519 proof + Rust verifier | partial | strong (`TRUST_BOUNDARY.md`) | ☐ |
| [hdar-sdk](https://github.com/overandor/hdar-sdk) | Core SDK (superseded by `hdar`) | yes | yes | ☐ (archive candidate) |
| [hdar-host-b-proof](https://github.com/overandor/hdar-host-b-proof) | E2B Host-B proof runner | partial | partial | ☐ (archive candidate) |
| [hdar-hitelesites](https://github.com/overandor/hdar-hitelesites) | Portable protocol (marketing README) | partial | weak | ☐ (archive candidate) |
| [jorki](https://github.com/overandor/jorki) | File Gateway UI; backend = **"FileOracle"** file-intelligence API (separate) | `useJorkiApi` hook | yes (`docs/`, `MODES.md`, `SDK.md`) | ◐ inline on [jorki#3](https://github.com/overandor/jorki/pull/3) |
| [nyx-semantic](https://github.com/overandor/nyx-semantic) | Selector-free semantic DOM location (TF-IDF, no LLM) | yes (`nyx`) | strong README | ◐ draft PR [nyx-semantic#2](https://github.com/overandor/nyx-semantic/pull/2) |
| ~~DepthOS~~ | Gate.io market-making / trading infra ("MarketForge") | — | — | ⛔ EXCLUDED — trading system, out of curated scope |
| [jentic-egy](https://github.com/overandor/jentic-egy) | Diagnostics + Ed25519 attestation (folded into `hdar/morphos.py`) | ? | no README on default branch | ⚠️ near-empty / needs attention |
| [hf-catacomb-oracle](https://github.com/overandor/hf-catacomb-oracle) | Private "oracle" repo — **candidate "FileOracle"** | ? | ? | ☐ (private) |
| [hf-catacomb-oracle-v7](https://github.com/overandor/hf-catacomb-oracle-v7) | Private "oracle" repo (v7) | ? | ? | ☐ (private) |
| [champ-lm](https://github.com/overandor/champ-lm) | LLM-ensemble research orchestration engine (Streamlit + Docker, CI) | `src/` components | strong README | ◐ draft PR [champ-lm#3](https://github.com/overandor/champ-lm/pull/3) |
| [veis-cleanstat](https://github.com/overandor/veis-cleanstat) | Municipal data hardening (thin README → `docs/municipal-production-hardening.md`) | ? | thin | ☐ needs structure inspection |
| [CodeRunnerApp](https://github.com/overandor/CodeRunnerApp) | HDAR & FileVM Passport Colab suite — **HDAR-family**, overlaps `hdar` | notebooks | yes | ☐ (HDAR-family; consolidate vs syndicate) |
| [snap2txt](https://github.com/overandor/snap2txt) | Screenshot→text (fork) | ? | ? | ☐ (fork — likely skip) |

## FileOracle — LOCATED & LIVE ✅
FileOracle is the file-intelligence backend behind jorki. Found by tracing its
endpoint fingerprints (`/superpose/state`, `/query/sql`).
- **Live:** `https://josephrw-llm-file-proxy.hf.space`
- **Canonical source:** `overandor/glyphos` → `hf_space_app.py` (+ `afc_server.py`,
  `SPEC/JORKI_PRODUCT_SPEC.md`, `docs/jorki-ai-file-gateway-production-audit.md`)
- **Clean variant:** `overandor/rentmasseur-unified` → `variants/daemon/llm_file_proxy/`
- **Full product doc:** [`../docs/FILEORACLE.md`](../docs/FILEORACLE.md)

**Recommended:** extract it into its own repo (`overandor/fileoracle`) from the
`rentmasseur-unified` variant, apply mode/SDK/docs, and settle on one name
(FileOracle vs SystemLake vs Jorki-gateway).

## Rollout order
1. `hdar` (flagship / reference — also fixes the misleading `verify_chains`
   demo and the empty `prove --local-only` output).
2. `hdar-cross-platform-proof`, then the remaining HDAR repos (or archive the
   superseded ones instead).
3. `jorki` (FileOracle candidate), `nyx-semantic`, `DepthOS`, `jentic-egy`.
4. Remaining curated repos after inspection.
