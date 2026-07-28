# Jorki SDK — the API client surface

Jorki's client surface is the `useJorkiApi()` React hook — a thin typed-by-usage
client for the File Gateway / FileOracle backend. Part of the
[syndication standard](syndication/STANDARD.md).

## Use

```jsx
import { useJorkiApi } from './hooks/useJorkiApi'

function Panel() {
  const { health, files, loading, error,
          fetchFiles, fetchMeta, fetchSummary, querySql } = useJorkiApi()
  // ...render files / intelligence
}
```

## Client surface

| Function | Calls | Purpose |
|---|---|---|
| `fetchHealth()` | `GET /health` | backend liveness |
| `fetchFiles()` | `GET /files` | list ingested files |
| `fetchMeta(id)` | `GET /meta/:id` | file metadata |
| `fetchSummary(id)` | `GET /summary/:id` | AI summary |
| `fetchCapabilities(id)` | `GET /capabilities/:id` | what can be asked of a file |
| `fetchSuperposeState(id)` | `GET /superpose/state/:id` | file "state" view |
| `fetchStats(id)` | `GET /stats/:id` | per-file stats |
| `search(id, q)` | `GET /search/:id?q=` | in-file search |
| `fetchChunk(id, idx)` | `GET /chunk/:id/:idx` | retrieve a chunk |
| `querySql(id, sql)` | `POST /query/sql/:id` | SQL over a file |

## Stability

- **Stable:** the hook shape and endpoint paths (used across the UI components).
- **Depends on an external backend:** every call requires the FileOracle service
  at the same origin. There is no bundled server in this repo — see
  [`MODES.md`](MODES.md). Base URL is hard-coded to `''` (same origin); make it
  configurable before pointing the UI at a remote gateway.
