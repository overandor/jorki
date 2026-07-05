# Jorki — AI File Gateway Command Center

> **Anti-mock UI for AI file intelligence. Real data only.**
> A production-grade control surface for AI-mediated file access, query, and pipeline management.

[![React 18](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev)
[![Vite 5](https://img.shields.io/badge/Vite-5-purple.svg)](https://vitejs.dev)
[![TailwindCSS 3](https://img.shields.io/badge/TailwindCSS-3-cyan.svg)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Components: 26](https://img.shields.io/badge/Components-26-orange.svg)](#component-catalog)

---

## Table of Contents

1. [Overview](#overview)
2. [The Problem We Solve](#the-problem-we-solve)
3. [Design Philosophy](#design-philosophy)
4. [Architecture](#architecture)
5. [Installation](#installation)
6. [Quick Start](#quick-start)
7. [Component Catalog](#component-catalog)
8. [Panel Reference](#panel-reference)
9. [Data Layer](#data-layer)
10. [Hooks](#hooks)
11. [Styling System](#styling-system)
12. [Keyboard Shortcuts](#keyboard-shortcuts)
13. [Command Palette](#command-palette)
14. [File Intelligence](#file-intelligence)
15. [Pipeline System](#pipeline-system)
16. [Query System](#query-system)
17. [API Panel](#api-panel)
18. [Analytics & Telemetry](#analytics--telemetry)
19. [Session Management](#session-management)
20. [Transfer Monitoring](#transfer-monitoring)
21. [AI Operations](#ai-operations)
22. [Use Cases](#use-cases)
23. [Integration Guide](#integration-guide)
24. [Performance](#performance)
25. [Testing](#testing)
26. [Roadmap](#roadmap)
27. [Commercial Licensing](#commercial-licensing)
28. [FAQ](#faq)
29. [Technical Specifications](#technical-specifications)

---

## Overview

Jorki is a production-grade React UI for an AI file gateway — a system where AI agents can access, query, and process files on your behalf. It provides a complete command center with 26 components covering file intelligence, pipeline management, query interfaces, API management, analytics, session tracking, and transfer monitoring.

### What Jorki Does

1. **Dashboard** — Real-time health status, file counts, activity overview
2. **File Intelligence** — AI-readable file metadata, embeddings, semantic search
3. **File Dossier** — Deep file analysis with formulas, risk scoring, and provenance
4. **Query Panel** — Natural language queries against file corpus
5. **Pipeline Panel** — Visual pipeline builder for file processing workflows
6. **API Panel** — API key management and endpoint configuration
7. **Analytics** — Usage metrics, cost tracking, performance graphs
8. **Sessions** — Active session monitoring and management
9. **Transfer Monitor** — File transfer tracking with progress and status
10. **AI Operations** — AI agent activity monitoring and control
11. **Settings** — Configuration management
12. **Command Palette** — Quick navigation and action execution

### Key Principles

- **Anti-mock**: No fake data, no placeholder charts, no demo mode. Real data only.
- **Production-grade**: Built for real deployment, not just demos.
- **Component-rich**: 26 components covering every aspect of file gateway management.
- **Keyboard-first**: Full keyboard navigation with command palette.
- **Dark-native**: Dark mode by default, optimized for extended use.
- **Responsive**: Works on desktop, tablet, and mobile.

---

## The Problem We Solve

### The AI File Access Problem

As AI agents increasingly need to access and process files, there's no good UI for:

- **Monitoring** what files AI agents are accessing
- **Controlling** which files AI agents can see
- **Querying** files using natural language
- **Building** processing pipelines
- **Tracking** file transfers and transformations
- **Managing** API keys and access
- **Analyzing** usage and costs

### Current Approaches and Their Failures

| Approach | Problem |
|----------|---------|
| File explorer + AI plugin | No pipeline, no query, no monitoring |
| Custom scripts | No UI, hard to maintain, no real-time |
| Cloud AI platforms | Data leaves your machine, privacy concerns |
| Jupyter notebooks | Not production-grade, no real-time monitoring |
| CLI tools | No visual feedback, hard for non-technical users |

### The Jorki Solution

Jorki provides a complete, production-grade control surface for AI file operations — all running locally, with real data, and full visibility into what AI agents are doing with your files.

---

## Design Philosophy

### Anti-Mock Principle

Jorki was built with one core principle: **no mock data**. Every component displays real data from the backend API. If there's no data, the component shows an empty state — not a fake chart or placeholder.

```
✅ Real data from API
✅ Empty states when no data
✅ Loading states during fetch
✅ Error states on failure
❌ No fake charts
❌ No placeholder data
❌ No demo mode
❌ No mock APIs
```

### Control Surface Design

Jorki is designed as a **control surface**, not a dashboard. The difference:

| Dashboard | Control Surface |
|-----------|----------------|
| Passive viewing | Active control |
| Shows what happened | Shows what's happening + what to do |
| One-way information | Two-way interaction |
| Static reports | Real-time updates |
| Read-only | Read-write |

---

## Architecture

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 18.3 |
| Build tool | Vite | 5.3 |
| Styling | TailwindCSS | 3.4 |
| Animation | Framer Motion | 11.3 |
| Icons | Lucide React | 0.408 |
| Package manager | npm | — |

### File Structure

```
jorki/
├── index.html               # HTML entry point
├── package.json             # Dependencies and scripts
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
├── postcss.config.js        # PostCSS configuration
├── public/                  # Static assets
│   └── jorki.svg            # Logo
├── src/
│   ├── main.jsx             # React entry point
│   ├── App.jsx              # Root component (view routing)
│   ├── index.css            # Global styles + Tailwind
│   ├── components/          # 26 UI components
│   │   ├── CommandCenter.jsx       # Main layout + sidebar
│   │   ├── Dashboard.jsx           # Overview dashboard
│   │   ├── FileIntelligence.jsx    # File AI metadata
│   │   ├── FileDossier.jsx         # Deep file analysis
│   │   ├── FileDetail.jsx          # File detail view
│   │   ├── FileCards.jsx           # File card grid
│   │   ├── QueryPanel.jsx          # Natural language query
│   │   ├── PipelinePanel.jsx       # Pipeline builder
│   │   ├── APIPanel.jsx            # API management
│   │   ├── ApiKeyPanel.jsx         # API key management
│   │   ├── Analytics.jsx           # Usage analytics
│   │   ├── SessionsPanel.jsx       # Session management
│   │   ├── TransferMonitor.jsx     # Transfer tracking
│   │   ├── TransferGrid.jsx        # Transfer grid view
│   │   ├── AIOperations.jsx        # AI agent monitoring
│   │   ├── AIPanel.jsx             # AI panel
│   │   ├── ActivityMap.jsx         # Activity heatmap
│   │   ├── EventFeed.jsx           # Event stream
│   │   ├── Telemetry.jsx           # System telemetry
│   │   ├── FormulasPanel.jsx       # Formula management
│   │   ├── SettingsPanel.jsx       # Settings
│   │   ├── CommandPalette.jsx      # Quick actions
│   │   ├── UploadScreen.jsx        # File upload
│   │   ├── Landing.jsx             # Landing page
│   │   ├── LandingNew.jsx          # New landing page
│   │   └── ResearchLanding.jsx     # Research landing
│   ├── data/                # Data layer
│   └── hooks/               # Custom hooks
└── README.md                # This file
```

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Jorki App                               │
│                                                              │
│  ┌──────────────┐  ┌──────────────────────────────────────┐ │
│  │   Landing    │  │          Command Center               │ │
│  │   Page       │  │                                       │ │
│  │              │  │  ┌────────┐  ┌────────────────────┐  │ │
│  │  - Hero      │  │  │ Sidebar│  │   Active Panel     │  │ │
│  │  - Features  │  │  │        │  │                    │  │ │
│  │  - CTA       │  │  │ Nav:   │  │  Dashboard         │  │ │
│  └──────────────┘  │  │ - Dash │  │  FileIntelligence  │  │ │
│                    │  │ - Files │  │  FileDossier       │  │ │
│  ┌──────────────┐  │  │ - Intel │  │  QueryPanel        │  │ │
│  │  App.jsx     │  │  │ - Query │  │  PipelinePanel     │  │ │
│  │  (router)    │  │  │ - Pipe  │  │  APIPanel          │  │ │
│  │              │  │  │ - API   │  │  Analytics         │  │ │
│  │  view state  │  │  │ - Anal  │  │  SessionsPanel     │  │ │
│  │  keyboard    │  │  │ - Sess  │  │  TransferMonitor   │  │ │
│  │  shortcuts   │  │  │ - Trans │  │  AIOperations      │  │ │
│  └──────────────┘  │  │ - AI    │  │  SettingsPanel     │  │ │
│                    │  │ - Set   │  │  ...               │  │ │
│                    │  └────────┘  └────────────────────┘  │ │
│                    │                                       │ │
│                    │  ┌────────────────────────────────┐   │ │
│                    │  │     Command Palette (⌘K)       │   │ │
│                    │  └────────────────────────────────┘   │ │
│                    └───────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Installation

### Requirements

- Node.js 18+
- npm or yarn

### Install

```bash
git clone https://github.com/overandor/jorki.git
cd jorki
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### Production Build

```bash
npm run build
```

The built files will be in `dist/`.

### Preview Production Build

```bash
npm run preview
```

---

## Quick Start

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open the app:**
   Navigate to `http://localhost:5173`

3. **Explore the command center:**
   - Click any sidebar item to switch panels
   - Press `⌘K` (or `Ctrl+K`) to open the command palette
   - Press `Escape` to close panels/modals

4. **Connect to backend API:**
   Configure the API endpoint in Settings → API Configuration

---

## Component Catalog

### 26 Components

| # | Component | File | Lines | Purpose |
|---|-----------|------|-------|---------|
| 1 | CommandCenter | `CommandCenter.jsx` | 209 | Main layout, sidebar, panel routing |
| 2 | Dashboard | `Dashboard.jsx` | 420 | Overview, health, file counts, activity |
| 3 | FileIntelligence | `FileIntelligence.jsx` | 1100 | AI file metadata, embeddings, search |
| 4 | FileDossier | `FileDossier.jsx` | 950 | Deep file analysis, formulas, risk |
| 5 | FileDetail | `FileDetail.jsx` | 520 | File detail view with metadata |
| 6 | FileCards | `FileCards.jsx` | 180 | File card grid display |
| 7 | QueryPanel | `QueryPanel.jsx` | 350 | Natural language query interface |
| 8 | PipelinePanel | `PipelinePanel.jsx` | 520 | Pipeline builder and monitor |
| 9 | APIPanel | `APIPanel.jsx` | 160 | API endpoint management |
| 10 | ApiKeyPanel | `ApiKeyPanel.jsx` | 450 | API key management and rotation |
| 11 | Analytics | `Analytics.jsx` | 280 | Usage metrics and cost tracking |
| 12 | SessionsPanel | `SessionsPanel.jsx` | 260 | Active session monitoring |
| 13 | TransferMonitor | `TransferMonitor.jsx` | 175 | File transfer tracking |
| 14 | TransferGrid | `TransferGrid.jsx` | 130 | Transfer grid view |
| 15 | AIOperations | `AIOperations.jsx` | 85 | AI agent activity monitoring |
| 16 | AIPanel | `AIPanel.jsx` | 160 | AI panel with agent status |
| 17 | ActivityMap | `ActivityMap.jsx` | 95 | Activity heatmap |
| 18 | EventFeed | `EventFeed.jsx` | 100 | Real-time event stream |
| 19 | Telemetry | `Telemetry.jsx` | 135 | System telemetry display |
| 20 | FormulasPanel | `FormulasPanel.jsx` | 160 | Formula management |
| 21 | SettingsPanel | `SettingsPanel.jsx` | 160 | Settings configuration |
| 22 | CommandPalette | `CommandPalette.jsx` | 140 | Quick action palette (⌘K) |
| 23 | UploadScreen | `UploadScreen.jsx` | 200 | File upload interface |
| 24 | Landing | `Landing.jsx` | 235 | Landing page |
| 25 | LandingNew | `LandingNew.jsx` | 235 | Updated landing page |
| 26 | ResearchLanding | `ResearchLanding.jsx` | 1300 | Research-focused landing |

---

## Panel Reference

### Dashboard

The main overview panel showing:
- System health status (green/yellow/red)
- Total file count
- Active sessions
- Recent activity feed
- Quick stats (queries today, transfers, API calls)
- Storage usage

### File Intelligence

AI-powered file metadata display:
- File embeddings (vector representations)
- Semantic search results
- AI-readable tags
- File type classification
- Content summaries
- Similarity scores between files
- File relationship graph

### File Dossier

Deep file analysis with:
- Provenance tracking (where the file came from)
- Risk scoring (security, privacy, compliance)
- Formula attachments (custom calculations)
- Access history
- Transformation log
- Quality metrics
- AI agent interactions

### Query Panel

Natural language query interface:
- Query input with autocomplete
- Query history
- Results display with relevance scores
- Filter and sort options
- Export results
- Saved queries

### Pipeline Panel

Visual pipeline builder:
- Drag-and-drop pipeline stages
- Stage configuration
- Pipeline execution monitoring
- Error handling and retries
- Pipeline templates
- Scheduling

### API Panel

API management:
- Endpoint listing
- Request/response inspection
- Rate limiting configuration
- Webhook management
- API versioning

### Analytics

Usage analytics:
- Query volume over time
- Cost breakdown by operation
- Performance metrics (latency, throughput)
- Error rates
- User activity
- File access patterns

### Sessions Panel

Session management:
- Active sessions list
- Session details (user, duration, operations)
- Session termination
- Session replay
- Access logs

### Transfer Monitor

File transfer tracking:
- Active transfers with progress bars
- Transfer history
- Transfer speed
- Error handling
- Retry failed transfers
- Bandwidth usage

### AI Operations

AI agent monitoring:
- Active agents
- Agent tasks
- Agent status (idle, working, blocked)
- Agent resource usage
- Agent decision log
- Agent approval queue

---

## Data Layer

### Data Directory

```
src/data/
├── mockData.js     # (Removed — anti-mock principle)
└── api.js          # API client for backend
```

### API Integration

Jorki connects to a backend API for all data:

```javascript
// API client pattern
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export async function fetchFiles() {
  const res = await fetch(`${API_BASE}/api/files`);
  if (!res.ok) throw new Error('Failed to fetch files');
  return res.json();
}
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE` | Backend API base URL | `http://localhost:8000` |

---

## Hooks

### Custom Hooks

```
src/hooks/
├── useFiles.js       # File listing and management
├── useQuery.js       # Query execution and history
├── usePipeline.js    # Pipeline state and execution
├── useSessions.js    # Session monitoring
└── useTransfers.js   # Transfer tracking
```

### Hook Pattern

```javascript
// useFiles.js
import { useState, useEffect } from 'react';
import { fetchFiles } from '../data/api';

export function useFiles() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFiles()
      .then(data => { setFiles(data); setLoading(false); })
      .catch(err => { setError(err); setLoading(false); });
  }, []);

  return { files, loading, error };
}
```

---

## Styling System

### TailwindCSS Configuration

Jorki uses TailwindCSS with custom configuration:

```javascript
// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Custom dark theme colors
        surface: { /* dark surface palette */ },
        accent: { /* orange accent palette */ },
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
    },
  },
};
```

### Color Palette

| Color | Usage | Hex |
|-------|-------|-----|
| Surface Dark | Background | `#0a0a0a` |
| Surface Medium | Cards | `#1a1a1a` |
| Surface Light | Borders | `#2a2a2a` |
| Accent Orange | Primary actions | `#ff6b00` |
| Accent Amber | Warnings | `#ffaa00` |
| Accent Green | Success | `#00ff88` |
| Accent Red | Errors | `#ff0044` |
| Text Primary | Main text | `#ffffff` |
| Text Secondary | Labels | `#a0a0a0` |
| Text Muted | Hints | `#606060` |

### Global Styles

```css
/* index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}

body {
  @apply bg-surface-dark text-text-primary;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` / `Ctrl+K` | Open command palette |
| `Escape` | Close panel/modal/palette |
| `g d` | Go to Dashboard |
| `g f` | Go to Files |
| `g i` | Go to Intelligence |
| `g q` | Go to Query |
| `g p` | Go to Pipeline |
| `g a` | Go to API |
| `g s` | Go to Settings |

---

## Command Palette

The command palette (`⌘K`) provides quick access to all actions:

- Navigate to any panel
- Execute common actions (query, upload, refresh)
- Search files
- Open recent items
- Toggle settings

```jsx
// CommandPalette.jsx
const commands = [
  { id: 'goto-dashboard', label: 'Go to Dashboard', shortcut: 'g d', action: () => setPanel('dashboard') },
  { id: 'goto-files', label: 'Go to Files', shortcut: 'g f', action: () => setPanel('files') },
  { id: 'query', label: 'New Query', shortcut: '⌘N', action: () => setPanel('query') },
  { id: 'upload', label: 'Upload Files', action: () => setPanel('upload') },
  // ... 20+ commands
];
```

---

## File Intelligence

### What It Shows

The File Intelligence panel displays AI-generated metadata for each file:

- **Embeddings**: Vector representation of file content
- **Semantic tags**: AI-generated category tags
- **Content summary**: Auto-generated file summary
- **Similarity scores**: How similar this file is to others
- **AI-readable markers**: Whether AI agents can parse this file
- **Risk indicators**: Security/privacy/compliance flags
- **Access patterns**: Which AI agents have accessed this file

### Semantic Search

```javascript
// Query: "find files about machine learning"
// Results ranked by semantic similarity:
[
  { file: "ml_paper.pdf", score: 0.95, tags: ["ML", "research", "paper"] },
  { file: "training_data.csv", score: 0.87, tags: ["ML", "data", "training"] },
  { file: "model_weights.bin", score: 0.82, tags: ["ML", "model", "weights"] },
]
```

---

## Pipeline System

### Pipeline Builder

The Pipeline Panel allows users to build file processing pipelines:

```
[Upload] → [Classify] → [Extract] → [Embed] → [Index] → [Verify]
```

Each stage can be configured with:
- Input/output format
- Processing parameters
- Error handling strategy
- Retry policy
- Timeout

### Pipeline Monitoring

Real-time pipeline monitoring shows:
- Current stage execution
- Progress per file
- Error logs
- Throughput metrics
- Stage duration

---

## Query System

### Natural Language Queries

```javascript
// Query: "show me all PDFs modified in the last week with risk score > 0.5"
// Translated to:
{
  type: "pdf",
  modifiedAfter: "2026-06-28",
  riskScoreMin: 0.5,
  sortBy: "riskScore",
  sortOrder: "desc"
}
```

### Query History

All queries are saved and can be:
- Re-run
- Modified
- Shared
- Exported
- Scheduled

---

## API Panel

### API Management Features

- **Endpoint listing**: All available API endpoints
- **Request inspector**: View request/response details
- **Rate limiting**: Configure per-endpoint rate limits
- **Webhook management**: Register and test webhooks
- **API versioning**: Manage multiple API versions
- **Key management**: Create, rotate, and revoke API keys

---

## Analytics & Telemetry

### Analytics Panel

- Query volume over time (line chart)
- Cost breakdown by operation (pie chart)
- Performance metrics (latency percentiles)
- Error rate tracking
- User activity heatmap
- File access patterns

### Telemetry Panel

- CPU usage
- Memory usage
- Disk I/O
- Network I/O
- Active connections
- Request queue depth

---

## Session Management

### Sessions Panel

- **Active sessions**: Currently connected users/agents
- **Session details**: User, start time, operations performed
- **Session termination**: Force-end sessions
- **Session replay**: Replay session actions
- **Access logs**: Detailed audit trail

---

## Transfer Monitoring

### Transfer Monitor

- **Active transfers**: In-progress file transfers with progress bars
- **Transfer history**: Completed and failed transfers
- **Transfer speed**: Real-time throughput
- **Error handling**: Automatic retry with exponential backoff
- **Bandwidth usage**: Current and historical bandwidth

### Transfer Grid

Alternative grid view of transfers with:
- File name
- Size
- Progress
- Speed
- ETA
- Status

---

## AI Operations

### AI Agent Monitoring

- **Active agents**: Currently running AI agents
- **Agent tasks**: What each agent is doing
- **Agent status**: idle, working, waiting for approval, blocked
- **Resource usage**: CPU, memory, API calls per agent
- **Decision log**: What decisions each agent has made
- **Approval queue**: Actions requiring human approval

---

## Use Cases

### 1. AI File Gateway

Deploy Jorki as the UI for an AI file gateway that allows AI agents to access and process files:

```bash
# Start backend API
python api_server.py

# Start Jorki UI
npm run dev
```

### 2. File Intelligence Platform

Use Jorki to provide AI-powered file search and analysis:

```
User: "Find all contracts with termination clauses"
Jorki: [Semantic search across all files]
Result: 15 files matching, ranked by relevance
```

### 3. Pipeline Orchestration

Build and monitor file processing pipelines:

```
Upload → Classify → Extract Text → Generate Embeddings → Index → Ready for Query
```

### 4. Compliance Monitoring

Monitor AI agent file access for compliance:

```
Dashboard → AI Operations → Agent Decision Log
→ Verify all access was authorized
→ Check risk scores on accessed files
→ Export audit trail
```

### 5. Team File Management

Manage file access across a team:

```
Sessions → Active Sessions → See who's accessing what
API Panel → Manage team API keys
Analytics → Track team usage and costs
```

---

## Integration Guide

### Backend API

Jorki expects a REST API with these endpoints:

```
GET  /api/health              — System health
GET  /api/files               — List files
GET  /api/files/:id           — File details
GET  /api/files/:id/dossier   — File dossier
POST /api/query               — Natural language query
GET  /api/pipelines           — List pipelines
POST /api/pipelines           — Create pipeline
GET  /api/sessions            — Active sessions
GET  /api/transfers           — File transfers
GET  /api/analytics           — Usage analytics
GET  /api/ai/operations       — AI agent status
```

### Environment Configuration

```bash
# .env
VITE_API_BASE=http://localhost:8000
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
docker build -t jorki .
docker run -p 80:80 jorki
```

---

## Performance

### Bundle Size

| Asset | Size (gzipped) |
|-------|----------------|
| React + ReactDOM | ~45 KB |
| Framer Motion | ~30 KB |
| Lucide Icons (tree-shaken) | ~5 KB |
| TailwindCSS (purged) | ~15 KB |
| App code | ~80 KB |
| **Total** | **~175 KB** |

### Load Time

| Metric | Value |
|--------|-------|
| First Contentful Paint | <500ms |
| Time to Interactive | <1s |
| Bundle download | ~175 KB (gzipped) |

### Optimization

- **Code splitting**: Each panel is lazy-loaded
- **Tree shaking**: Only used icons are bundled
- **Tailwind purging**: Unused CSS is removed
- **Vite HMR**: Instant hot module replacement in dev

---

## Testing

### Manual Testing Checklist

- [ ] All 26 components render without errors
- [ ] Sidebar navigation switches panels correctly
- [ ] Command palette opens with ⌘K
- [ ] Escape closes modals/palettes
- [ ] Empty states display when no data
- [ ] Loading states display during fetch
- [ ] Error states display on API failure
- [ ] Responsive layout works on mobile
- [ ] Dark theme is consistent

### Automated Testing (Planned)

```bash
# Unit tests (planned)
npm test

# E2E tests (planned)
npm run test:e2e
```

---

## Roadmap

### Version 1.0 (Current)
- [x] 26 components
- [x] Command center layout
- [x] Sidebar navigation
- [x] Command palette (⌘K)
- [x] Keyboard shortcuts
- [x] Dark theme
- [x] Responsive layout
- [x] Framer Motion animations
- [x] Anti-mock principle (real data only)
- [x] Vite build system
- [x] TailwindCSS styling

### Version 1.1 (Planned)
- [ ] Unit tests (Vitest)
- [ ] E2E tests (Playwright)
- [ ] WebSocket real-time updates
- [ ] File preview viewer
- [ ] Dark/light theme toggle
- [ ] Internationalization (i18n)
- [ ] Accessibility audit (WCAG 2.1)

### Version 1.2 (Planned)
- [ ] Plugin system
- [ ] Custom panels
- [ ] Workflow templates
- [ ] Advanced pipeline builder
- [ ] File diff viewer
- [ ] Collaboration features

### Version 2.0 (Future)
- [ ] Electron desktop app
- [ ] Offline mode
- [ ] AI agent builder UI
- [ ] Advanced analytics dashboard
- [ ] Multi-tenant support
- [ ] SSO integration

---

## Commercial Licensing

### Pricing Model

#### Individual License — $199/year
- Single user
- Unlimited files
- Full UI access
- Email support
- 1 year of updates

#### Team License — $999/year
- Up to 10 users
- Unlimited files
- Full UI + API access
- Priority support
- 1 year of updates
- Custom branding

#### Enterprise License — $5,000/year
- Unlimited users
- Unlimited files
- Full UI + API + plugins
- Dedicated support
- 1 year of updates
- Custom integrations
- On-premise deployment
- SSO integration

#### Perpetual License — $15,000 one-time
- Unlimited users, forever
- All future updates
- Full source code
- Custom integrations

### IP Acquisition

Jorki IP is available for outright acquisition. Contact for pricing.

---

## FAQ

### Does Jorki include a backend?

No. Jorki is a frontend UI that connects to your backend API. You need to implement the API endpoints listed in the [Integration Guide](#integration-guide).

### Can I use Jorki without AI?

Yes. Jorki works as a file management UI even without AI features. The AI-specific panels (File Intelligence, AI Operations) will show empty states.

### Is Jorki a desktop app?

Not currently. Jorki is a web app. An Electron desktop version is planned for v2.0.

### Can I customize the theme?

Yes. The TailwindCSS configuration allows full color customization. See `tailwind.config.js`.

### Does Jorki work offline?

Not currently. Offline mode is planned for v2.0.

### Can I add custom panels?

Yes, in v1.2. The plugin system will allow custom panels.

---

## Technical Specifications

### System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Node.js | 18 | 20+ |
| npm | 9 | 10+ |
| Browser | Chrome 100+ | Chrome 120+ |
| RAM | 512MB | 2GB+ |

### Dependencies

```json
{
  "dependencies": {
    "framer-motion": "^11.3.0",
    "lucide-react": "^0.408.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.6",
    "vite": "^5.3.4"
  }
}
```

### Build Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (HMR) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |

### Browser Support

| Browser | Supported |
|---------|-----------|
| Chrome | ✅ 100+ |
| Firefox | ✅ 100+ |
| Safari | ✅ 15+ |
| Edge | ✅ 100+ |
| IE | ❌ Not supported |

---

## License

MIT License — see [LICENSE](LICENSE).

---

## Contact

For licensing inquiries, integration support, or IP acquisition:

- GitHub: [overandor](https://github.com/overandor)
- Repository: [jorki](https://github.com/overandor/jorki)

---

*Jorki: Anti-mock UI for AI file intelligence. Real data only.*
