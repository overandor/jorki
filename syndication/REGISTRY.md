# Syndication registry — curated real products

Rollout tracker for the [syndication standard](STANDARD.md) (mode / SDK / docs)
pushed into each curated real-product repo. Excludes numbered scratch repos
(`overandor/1`…`49`) and private trading-bot repos.

Status: ☐ not started · ◐ in progress (draft PR) · ☑ syndicated

| Repo | What it is | Has SDK? | Has docs? | Status |
|---|---|---|---|---|
| [hdar](https://github.com/overandor/hdar) | Unified HDAR runtime (canonical) | yes (`hdar/`) | partial | ◐ flagship / reference |
| [hdar-cross-platform-proof](https://github.com/overandor/hdar-cross-platform-proof) | Cross-platform Ed25519 proof + Rust verifier | partial | strong (`TRUST_BOUNDARY.md`) | ☐ |
| [hdar-sdk](https://github.com/overandor/hdar-sdk) | Core SDK (superseded by `hdar`) | yes | yes | ☐ (archive candidate) |
| [hdar-host-b-proof](https://github.com/overandor/hdar-host-b-proof) | E2B Host-B proof runner | partial | partial | ☐ (archive candidate) |
| [hdar-hitelesites](https://github.com/overandor/hdar-hitelesites) | Portable protocol (marketing README) | partial | weak | ☐ (archive candidate) |
| [jorki](https://github.com/overandor/jorki) | AI File Gateway Command Center — **candidate "FileOracle"** | ☐ | yes (`docs/`) | ☐ |
| [nyx-semantic](https://github.com/overandor/nyx-semantic) | Semantic system (needs inspection) | ? | ? | ☐ |
| [DepthOS](https://github.com/overandor/DepthOS) | (needs inspection) | ? | ? | ☐ |
| [jentic-egy](https://github.com/overandor/jentic-egy) | Diagnostics + Ed25519 attestation (folded into `hdar/morphos.py`) | ? | ? | ☐ |
| [hf-catacomb-oracle](https://github.com/overandor/hf-catacomb-oracle) | Private "oracle" repo — **candidate "FileOracle"** | ? | ? | ☐ (private) |
| [hf-catacomb-oracle-v7](https://github.com/overandor/hf-catacomb-oracle-v7) | Private "oracle" repo (v7) | ? | ? | ☐ (private) |
| [champ-lm](https://github.com/overandor/champ-lm) | (needs inspection) | ? | ? | ☐ |
| [veis-cleanstat](https://github.com/overandor/veis-cleanstat) | (needs inspection) | ? | ? | ☐ |
| [CodeRunnerApp](https://github.com/overandor/CodeRunnerApp) | (needs inspection) | ? | ? | ☐ |
| [snap2txt](https://github.com/overandor/snap2txt) | Screenshot→text (fork) | ? | ? | ☐ (fork) |

## FileOracle — UNRESOLVED
No repo named "FileOracle" exists, and a full search of this session's machine
found nothing by that name. It is on the founder's Mac, on the gated
`alep-local-systems` site, or a concept to be built. **Candidates:** `jorki`
(the File Gateway) or the `hf-catacomb-oracle` repos. Awaiting identification
before it can be syndicated.

## Rollout order
1. `hdar` (flagship / reference — also fixes the misleading `verify_chains`
   demo and the empty `prove --local-only` output).
2. `hdar-cross-platform-proof`, then the remaining HDAR repos (or archive the
   superseded ones instead).
3. `jorki` (FileOracle candidate), `nyx-semantic`, `DepthOS`, `jentic-egy`.
4. Remaining curated repos after inspection.
