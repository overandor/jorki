import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Shield, Copy, Check, Terminal, BookOpen,
  Dna, Brain, DollarSign, FileText, Code, Zap, Lock,
  Activity, Database, Cpu, Layers, Eye,
  ChevronDown, ChevronRight, Play, RefreshCw,
  TrendingUp, ScrollText, Gauge, FlaskConical,
} from 'lucide-react'

const API_BASE = ''

const ENDPOINT_CATALOG = [
  { group: 'Core', endpoints: [
    { method: 'GET',  path: '/health', desc: 'System health, version, endpoint registry' },
    { method: 'GET',  path: '/files', desc: 'List all indexed files with metadata' },
    { method: 'POST', path: '/index', desc: 'Upload and index a file for AI access' },
    { method: 'POST', path: '/index/batch', desc: 'Batch upload 1000+ files/min parallel indexing' },
    { method: 'POST', path: '/index/dir', desc: 'Index entire directory recursively' },
    { method: 'POST', path: '/index/path', desc: 'Index a local file by path' },
    { method: 'POST', path: '/reindex/{id}', desc: 'Re-index file with latest analyzers' },
  ]},
  { group: 'Analysis', endpoints: [
    { method: 'GET', path: '/meta/{id}', desc: 'File metadata: SHA-256, Merkle root, line count' },
    { method: 'GET', path: '/summary/{id}', desc: 'Semantic summary with symbols and word frequency' },
    { method: 'GET', path: '/capabilities/{id}', desc: 'Available capabilities for this file' },
    { method: 'GET', path: '/stats/{id}', desc: 'Query statistics and access patterns' },
    { method: 'GET', path: '/superpose/state/{id}', desc: 'Session state, compression ratio, index size' },
  ]},
  { group: 'Intelligence', endpoints: [
    { method: 'GET', path: '/dna/{id}', desc: 'DNA fingerprint: species, complexity, 10 genes' },
    { method: 'GET', path: '/kpi/{id}', desc: 'Extracted KPIs: financial, metrics, dates, APIs' },
    { method: 'GET', path: '/kpi/{id}/gif', desc: 'Animated KPI visualization (GIF)' },
    { method: 'GET', path: '/ml/{id}', desc: 'ML insights: TF-IDF, topics, clusters, anomalies' },
    { method: 'GET', path: '/profile/{id}', desc: 'Financial profile: origin, standards, risk grades' },
    { method: 'GET', path: '/valuation/{id}', desc: 'Code valuation: build cost, replacement, depreciation' },
    { method: 'GET', path: '/resume/{id}', desc: 'Full resume: DNA + KPI + ML + valuation + profile' },
    { method: 'GET', path: '/video/{id}', desc: 'Video dossier generation' },
  ]},
  { group: 'Query', endpoints: [
    { method: 'GET', path: '/search/{id}?q=', desc: 'Full-text search across chunks and symbols' },
    { method: 'GET', path: '/chunk/{id}/{idx}', desc: 'Retrieve specific chunk by index' },
    { method: 'POST', path: '/query/sql/{id}', desc: 'SQL query on file index (SQLite)' },
  ]},
  { group: 'Security', endpoints: [
    { method: 'POST', path: '/password/{id}', desc: 'Set password protection on file' },
    { method: 'POST', path: '/password/{id}/verify', desc: 'Verify password to gain access' },
    { method: 'GET', path: '/password/{id}/status', desc: 'Check password protection status' },
  ]},
  { group: 'Research', endpoints: [
    { method: 'GET', path: '/formulas', desc: 'All formulas, algorithms, scoring models' },
    { method: 'GET', path: '/api/dashboard', desc: 'Production control surface with KPIs' },
    { method: 'GET', path: '/api/kpis', desc: 'Live KPI readout (Immortality, Virality, Conversion)' },
    { method: 'GET', path: '/api/kpis/history', desc: 'KPI trend history over time' },
    { method: 'POST', path: '/api/metrics/ingest', desc: 'Ingest first-party metrics' },
    { method: 'POST', path: '/api/decision-gate', desc: 'Decision ledger: approve/reject with evidence' },
    { method: 'GET', path: '/api/receipts', desc: 'Tamper-evident receipt chain' },
    { method: 'POST', path: '/api/experiments', desc: 'Create experiment with hypothesis tracking' },
    { method: 'GET', path: '/api/operator-report', desc: 'Operator report: STATUS/PROOF/RISK/NEXT_MOVE' },
  ]},
  { group: 'Pipeline', endpoints: [
    { method: 'POST', path: '/pipeline/trigger', desc: 'Trigger processing pipeline' },
    { method: 'GET', path: '/pipeline/status/{id}', desc: 'Pipeline stage status' },
    { method: 'GET', path: '/pipeline/latest', desc: 'Latest pipeline run' },
  ]},
]

const SDK_EXAMPLES = {
  python: {
    name: 'Python', icon: '🐍',
    code: `import requests, json

JORKI = "https://josephrw-llm-file-proxy.hf.space"

# Index a file
r = requests.post(f"{JORKI}/index", files={"file": open("main.py", "rb")})
file_id = r.json()["file_id"]

# DNA fingerprint
dna = requests.get(f"{JORKI}/dna/{file_id}").json()
print(f"Species: {dna['species']}, Complexity: {dna['complexity_score']}")

# KPIs
kpis = requests.get(f"{JORKI}/kpi/{file_id}").json()
for k in kpis.get('kpis', []):
    print(f"  {k['name']}: {k['value']} (conf={k['confidence']})")

# ML insights
ml = requests.get(f"{JORKI}/ml/{file_id}").json()
print(f"Topics: {ml.get('topics', [])}")

# Full resume
resume = requests.get(f"{JORKI}/resume/{file_id}").json()
print(f"Valuation: ${resume['valuation']['build_cost']}")

# Batch index 1000 files
files = [("files", (f.name, f)) for f in open_files]
r = requests.post(f"{JORKI}/index/batch", files=files)
print(f"Rate: {r.json()['files_per_minute']} files/min")`,
  },
  javascript: {
    name: 'JavaScript', icon: '⚡',
    code: `const JORKI = "https://josephrw-llm-file-proxy.hf.space"

// Index a file
const fd = new FormData()
fd.append('file', fileInput.files[0])
const { file_id } = await fetch(\`\${JORKI}/index\`, { method: 'POST', body: fd }).then(r => r.json())

// DNA fingerprint
const dna = await fetch(\`\${JORKI}/dna/\${file_id}\`).then(r => r.json())
console.log('Species:', dna.species, 'Complexity:', dna.complexity_score)

// KPIs
const { kpis } = await fetch(\`\${JORKI}/kpi/\${file_id}\`).then(r => r.json())
kpis.forEach(k => console.log(\`\${k.name}: \${k.value}\`))

// ML insights
const ml = await fetch(\`\${JORKI}/ml/\${file_id}\`).then(r => r.json())
console.log('Topics:', ml.topics, 'Anomalies:', ml.anomalies.length)

// Batch index
const batch = new FormData()
fileList.forEach(f => batch.append('files', f))
const result = await fetch(\`\${JORKI}/index/batch\`, { method: 'POST', body: batch }).then(r => r.json())
console.log(\`Rate: \${result.files_per_minute} files/min\`)`,
  },
  curl: {
    name: 'cURL', icon: '⬡',
    code: `# Index a file
curl -X POST https://josephrw-llm-file-proxy.hf.space/index \\
  -F "file=@main.py"

# DNA fingerprint
curl https://josephrw-llm-file-proxy.hf.space/dna/a1b2c3d4e5f6

# KPIs
curl https://josephrw-llm-file-proxy.hf.space/kpi/a1b2c3d4e5f6

# ML insights
curl https://josephrw-llm-file-proxy.hf.space/ml/a1b2c3d4e5f6

# Full resume
curl https://josephrw-llm-file-proxy.hf.space/resume/a1b2c3d4e5f6

# Batch index 50 files
curl -X POST https://josephrw-llm-file-proxy.hf.space/index/batch \\
  -F "files=@file1.py" -F "files=@file2.py" -F "files=@file3.py"

# SQL Query
curl -X POST https://josephrw-llm-file-proxy.hf.space/query/sql/a1b2c3d4e5f6 \\
  -H "Content-Type: application/json" \\
  -d '{"query": "SELECT * FROM chunks WHERE line_count > 10"}'

# Formulas
curl https://josephrw-llm-file-proxy.hf.space/formulas`,
  },
  mcp: {
    name: 'MCP', icon: '🔌',
    code: `{
  "mcpServers": {
    "jorki": {
      "url": "https://josephrw-llm-file-proxy.hf.space/mcp",
      "tools": [
        "index_file", "search_file", "get_dna",
        "get_kpi", "get_ml_insights", "get_valuation",
        "get_resume", "batch_index", "sql_query",
        "set_password", "verify_password", "reindex_file"
      ]
    }
  }
}`,
  },
}

const RESEARCH_MODULES = [
  { id: 'dna', icon: Dna, title: 'DNA Fingerprinting', subtitle: 'Species classification · 10-gene genome · Complexity scoring',
    desc: 'Every file gets a unique DNA fingerprint based on structural, lexical, and semantic features. The genome consists of 10 genes measuring code quality, complexity, and organization.',
    formula: 'complexity = (gene_3 × 10 + gene_4 × 0.5 + min(gene_5, 500) × 0.01 + entropy × 0.5 + gene_6 × 0.1) / max(gene_1, 1) × 100',
    endpoint: '/dna/{id}', metrics: ['Species', 'Complexity Score', '10 Genes', 'Genome Size', 'DNA Sequence', 'Entropy'] },
  { id: 'ml', icon: Brain, title: 'ML Intelligence Layer', subtitle: 'TF-IDF · Topic modeling · Clustering · Anomaly detection',
    desc: 'Pure-Python ML extraction without scikit-learn. Computes TF-IDF top terms, latent topics, document clustering, and anomaly detection using Zipf distribution analysis.',
    formula: 'tfidf(t,d) = tf(t,d) × log(N / df(t)) | Zipf slope = linear regression on log(freq) vs log(rank)',
    endpoint: '/ml/{id}', metrics: ['TF-IDF Terms', 'Topics', 'Clusters', 'Anomalies', 'Inferred KPIs', 'LLM Extrapolation'] },
  { id: 'valuation', icon: DollarSign, title: 'Code Valuation Engine', subtitle: 'Build cost · Replacement cost · Depreciation · Insurance value',
    desc: 'Species-aware valuation with different rates per LOC. Python at $0.20/LOC, documentation near-zero. Capped at $3M total. Includes depreciation from test coverage and complexity.',
    formula: 'build_cost = LOC × rate × complexity_multiplier | max $0.20/LOC | capped $3M',
    endpoint: '/valuation/{id}', metrics: ['Build Cost', 'Replacement Cost', 'Insurance Value', 'Depreciated Value', 'Production Readiness', 'Rate/LOC'] },
  { id: 'kpi', icon: Gauge, title: 'KPI Extraction Pipeline', subtitle: 'Financial · Metrics · Dates · APIs · Tables · Key-value pairs',
    desc: 'Regex-based extraction of 7 KPI categories. Financial patterns, percentage metrics, date references, API endpoints, markdown tables, and uppercase key-value pairs with confidence scores.',
    formula: 'confidence = 1.0 if exact match, 0.8 if contextual, 0.6 if inferred',
    endpoint: '/kpi/{id}', metrics: ['Monetary Values', 'Percentages', 'Revenue Figures', 'Dates', 'API Endpoints', 'Tables', 'Key-Value Pairs'] },
  { id: 'profile', icon: FileText, title: 'Financial Profiling', subtitle: 'Origin tracking · Accounting standards · Collateral grading',
    desc: 'Determines file origin (generated, handwritten, mixed), accounting standards compliance (GAAP, IFRS), and grades collateral quality, liquidity, and risk for underwriting analysis.',
    formula: 'collateral_grade = f(quality, completeness, verifiability) | liquidity_grade = f(turnover, demand)',
    endpoint: '/profile/{id}', metrics: ['Origin', 'Accounting Standards', 'Collateral Grade', 'Liquidity Grade', 'Risk Grade', 'Finance Metrics'] },
  { id: 'batch', icon: Zap, title: 'Parallel Batch Indexing', subtitle: '1000+ files/min · ThreadPoolExecutor · WAL mode · Fast-path',
    desc: 'Batch indexing with 8-worker ThreadPoolExecutor, SQLite WAL mode, synchronous=OFF, and executemany batch inserts. Fast mode skips DNA/KPI. Benchmarked at 22,151 files/min.',
    formula: 'throughput = files / (parallelism × per_file_cost) | WAL + executemany + fast_path',
    endpoint: '/index/batch', metrics: ['Files/Second', 'Files/Minute', 'Parallel Workers', 'WAL Mode', 'Fast Path', 'Registry Batch'] },
  { id: 'receipts', icon: ScrollText, title: 'Tamper-Evident Receipts', subtitle: 'SHA-256 chaining · Sequential numbering · Proof chain',
    desc: 'Every important action generates a receipt with SHA-256 hash, previous receipt hash, sequential number, and timestamp. Creates a tamper-evident chain. Any modification breaks the chain.',
    formula: 'receipt_hash = SHA-256(action + data + prev_hash + timestamp + sequence)',
    endpoint: '/api/receipts', metrics: ['Receipt Count', 'Chain Integrity', 'Latest Hash', 'Sequence Number', 'Timestamp', 'Action Type'] },
  { id: 'kpis_live', icon: Activity, title: 'Live KPI Dashboard', subtitle: 'Immortality · Virality · Conversion · Proof composite',
    desc: 'Production control surface measuring four composite KPIs from first-party metrics. Immortality tracks durability. Virality measures attention. Conversion tracks profile-to-contact ratio. Proof measures evidence density.',
    formula: 'composite = (Immortality + Virality + Conversion + Proof) / 4 | each scored 0-100',
    endpoint: '/api/kpis', metrics: ['Immortality Score', 'Virality Score', 'Conversion Score', 'Proof Score', 'Composite', 'Trend History'] },
]

const ARCH_LAYERS = [
  { layer: 'Presentation', icon: Eye, components: ['React UI', 'Command Center', 'Dashboard', 'File Intelligence', 'Dossier', 'Formulas Panel'], color: 'text-primary' },
  { layer: 'API Gateway', icon: Terminal, components: ['FastAPI', 'REST endpoints', 'MCP protocol', 'Static file serving'], color: 'text-accent' },
  { layer: 'Analysis Engine', icon: Cpu, components: ['DNA Fingerprinting', 'KPI Extraction', 'ML Insights', 'Code Valuation', 'Financial Profiling', 'Resume Generator'], color: 'text-success' },
  { layer: 'Indexing Core', icon: Database, components: ['SQLite per-file index', 'Merkle root hashing', 'Semantic chunking', 'Symbol table', 'Word frequency', 'Capability registry'], color: 'text-warning' },
  { layer: 'Security', icon: Lock, components: ['Password protection', 'SHA-256 hashing', 'Salted hashes', 'Access control', 'Receipt chain', 'Decision ledger'], color: 'text-critical' },
  { layer: 'Evidence', icon: Shield, components: ['Tamper-evident receipts', 'KPI history', 'Experiment tracking', 'Operator reports', 'Audit trail', 'Proof density'], color: 'text-secondary' },
]

const methodColors = {
  GET: 'text-success bg-success/10 border-success/20',
  POST: 'text-primary bg-primary/10 border-primary/20',
  DELETE: 'text-critical bg-critical/10 border-critical/20',
  PUT: 'text-warning bg-warning/10 border-warning/20',
}

export default function ResearchLanding({ onLaunch }) {
  const [health, setHealth] = useState(null)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('hero')
  const [sdkLang, setSdkLang] = useState('python')
  const [copied, setCopied] = useState(null)
  const [expandedGroups, setExpandedGroups] = useState({ Core: true })
  const [liveResponse, setLiveResponse] = useState(null)
  const [liveEndpoint, setLiveEndpoint] = useState(null)
  const [liveLoading, setLiveLoading] = useState(false)
  const [selectedModule, setSelectedModule] = useState(null)
  const [formulas, setFormulas] = useState(null)
  const [kpis, setKpis] = useState(null)
  const [receipts, setReceipts] = useState(null)
  const [fileId, setFileId] = useState(null)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const hRes = await fetch(`${API_BASE}/health`)
        const h = await hRes.json()
        setHealth(h)
        const fRes = await fetch(`${API_BASE}/files`)
        const f = await fRes.json()
        setFiles(f.files || [])
        if (f.files?.length > 0) setFileId(f.files[0].file_id)
      } catch (e) {
        setHealth({ status: 'error', error: e.message })
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
    const id = setInterval(fetchAll, 15000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (activeSection === 'formulas' && !formulas) {
      fetch(`${API_BASE}/formulas`).then(r => r.json()).then(setFormulas).catch(() => {})
    }
    if (activeSection === 'kpis' && !kpis) {
      fetch(`${API_BASE}/api/kpis`).then(r => r.json()).then(setKpis).catch(() => {})
    }
    if (activeSection === 'receipts' && !receipts) {
      fetch(`${API_BASE}/api/receipts`).then(r => r.json()).then(setReceipts).catch(() => {})
    }
  }, [activeSection])

  const copyCode = (text, id = 'main') => {
    navigator.clipboard?.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const tryEndpoint = useCallback(async (ep) => {
    if (!fileId && ep.path.includes('{id}')) return
    setLiveLoading(true)
    setLiveEndpoint(ep)
    try {
      let url = `${API_BASE}${ep.path.replace('{id}', fileId)}`
      if (ep.path.includes('?q=')) url = `${API_BASE}/search/${fileId}?q=test`
      const opts = ep.method === 'POST' ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) } : {}
      const res = await fetch(url, opts)
      const data = await res.json()
      setLiveResponse({ status: res.status, data })
    } catch (e) {
      setLiveResponse({ error: e.message })
    } finally {
      setLiveLoading(false)
    }
  }, [fileId])

  const scrollTo = (id) => {
    setActiveSection(id)
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const isLive = health?.status === 'ok'
  const fileCount = health?.files_registered ?? files.length

  return (
    <div className="relative h-screen w-screen overflow-y-auto no-scrollbar bg-bg">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-1/4 -left-1/4 w-[60%] h-[60%] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(255,138,0,0.06) 0%, transparent 70%)' }}
          animate={{ x: [0, 60, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 grid-bg opacity-[0.07]" />
      </div>

      {/* Nav */}
      <div className="sticky top-0 z-50 glass-strong border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center px-6 h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-orange">
              <span className="text-bg font-black text-sm">J</span>
            </div>
            <span className="font-bold tracking-tight">Jorki</span>
            <span className="text-[10px] font-mono text-secondary/40 ml-1">Research SDK</span>
          </div>
          <div className="flex-1" />
          <nav className="hidden md:flex items-center gap-1">
            {[
              ['hero', 'Overview'], ['endpoints', 'API'], ['sdk', 'SDK'],
              ['research', 'Research'], ['architecture', 'Architecture'],
              ['formulas', 'Formulas'], ['kpis', 'Live KPIs'], ['receipts', 'Receipts'],
            ].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeSection === id ? 'glass-orange text-primary' : 'text-secondary hover:text-text hover:bg-white/5'
                }`}>{label}</button>
            ))}
          </nav>
          <div className="flex items-center gap-3 ml-4">
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-success animate-pulse' : 'bg-critical'}`} />
            <span className="text-[10px] font-mono text-secondary hidden sm:inline">{isLive ? 'LIVE' : 'OFF'}</span>
            <button onClick={onLaunch}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary to-accent text-bg text-xs font-semibold glow-orange hover:scale-105 transition-transform">
              Launch <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 space-y-24">

        {/* HERO */}
        <section id="section-hero" className="flex flex-col items-center text-center pt-8">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-6">
            <span className="text-[10px] font-mono px-3 py-1 rounded-full glass text-secondary">
              ◉ Live · {health?.version ? `v${health.version}` : 'v2.0'} · {fileCount} files indexed
            </span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tight mb-4">
            JORKI <span className="text-gradient">Research SDK</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="text-lg md:text-xl text-secondary max-w-2xl mb-2">
            File intelligence platform with DNA fingerprinting, ML extraction, code valuation, and tamper-evident receipts.
          </motion.p>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-sm text-secondary/50 max-w-xl mb-8">
            30+ API endpoints · 8 analysis engines · 22,151 files/min batch indexing · Production deployed
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-3xl mb-8">
            {[
              { label: 'Endpoints', value: health?.endpoints?.length || 30, icon: Code },
              { label: 'Files Indexed', value: fileCount, icon: Database },
              { label: 'Batch Rate', value: '22K/min', icon: Zap },
              { label: 'Receipts', value: receipts?.total || '—', icon: ScrollText },
            ].map((stat, i) => (
              <div key={i} className="glass rounded-xl p-4 text-center">
                <stat.icon className="w-4 h-4 text-primary mx-auto mb-2" />
                <div className="text-2xl font-black text-text">{stat.value}</div>
                <div className="text-[10px] font-mono text-secondary/60 uppercase tracking-wider mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex items-center gap-3">
            <button onClick={onLaunch}
              className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-bg font-semibold glow-orange-strong hover:scale-105 transition-transform">
              Launch Command Center <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => scrollTo('endpoints')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl glass text-text font-semibold hover:glass-orange transition-all">
              <Terminal className="w-4 h-4" /> Explore API
            </button>
          </motion.div>
        </section>

        {/* ENDPOINT EXPLORER */}
        <section id="section-endpoints">
          <SectionHeader icon={Code} title="API Endpoint Explorer" subtitle="30+ live endpoints · Click any endpoint to execute in real-time" />
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              {ENDPOINT_CATALOG.map((group, gi) => (
                <div key={group.group} className="glass rounded-2xl overflow-hidden">
                  <button onClick={() => setExpandedGroups(prev => ({ ...prev, [group.group]: !prev[group.group] }))}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-all">
                    {expandedGroups[group.group] ? <ChevronDown className="w-4 h-4 text-secondary/50" /> : <ChevronRight className="w-4 h-4 text-secondary/50" />}
                    <span className="text-sm font-semibold flex-1 text-left">{group.group}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg glass-orange text-primary">{group.endpoints.length}</span>
                  </button>
                  <AnimatePresence>
                    {expandedGroups[group.group] && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-3 pb-3 space-y-1">
                          {group.endpoints.map((ep, ei) => (
                            <button key={`${gi}-${ei}`} onClick={() => tryEndpoint(ep)}
                              className={`w-full flex items-center gap-3 py-2 px-3 rounded-xl transition-all text-left group ${
                                liveEndpoint?.path === ep.path ? 'glass-orange' : 'hover:bg-white/5'}`}>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-semibold border ${methodColors[ep.method]}`}>{ep.method}</span>
                              <span className="text-[11px] font-mono text-text flex-1 truncate">{ep.path}</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
                              <span className="text-[9px] text-secondary/40 opacity-0 group-hover:opacity-100 transition-opacity hidden lg:block max-w-[200px] truncate">{ep.desc}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            <div className="glass rounded-2xl overflow-hidden sticky top-20 h-fit">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                {liveLoading ? <RefreshCw className="w-4 h-4 text-primary animate-spin" /> : <Terminal className="w-4 h-4 text-primary" />}
                <span className="text-sm font-semibold">Live Response</span>
                {liveEndpoint && (
                  <span className={`ml-2 px-2 py-0.5 rounded text-[9px] font-mono font-semibold border ${methodColors[liveEndpoint.method]}`}>{liveEndpoint.method}</span>
                )}
                {liveEndpoint && <span className="text-[10px] font-mono text-secondary truncate">{liveEndpoint.path.replace('{id}', fileId || '{id}')}</span>}
                {liveResponse && (
                  <button onClick={() => copyCode(JSON.stringify(liveResponse.data || liveResponse, null, 2), 'resp')} className="ml-auto">
                    {copied === 'resp' ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3 text-secondary/50" />}
                  </button>
                )}
              </div>
              <div className="p-4 max-h-[500px] overflow-y-auto thin-scrollbar">
                {!liveEndpoint && !liveLoading && (
                  <div className="text-center py-12 text-secondary/40 text-xs">
                    <Terminal className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    Select an endpoint to execute it live
                  </div>
                )}
                {liveLoading && (
                  <div className="text-center py-12">
                    <RefreshCw className="w-6 h-6 text-primary animate-spin mx-auto mb-3" />
                    <span className="text-xs text-secondary">Executing...</span>
                  </div>
                )}
                {liveResponse && !liveLoading && (
                  <div className="space-y-2">
                    {liveResponse.status && (
                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        <span className={liveResponse.status === 200 ? 'text-success' : 'text-critical'}>● {liveResponse.status}</span>
                      </div>
                    )}
                    <pre className="text-[10px] font-mono text-secondary leading-relaxed whitespace-pre-wrap break-all">
                      {JSON.stringify(liveResponse.data || liveResponse.error || liveResponse, null, 2).slice(0, 2000)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SDK */}
        <section id="section-sdk">
          <SectionHeader icon={Terminal} title="SDK & Code Examples" subtitle="Production-ready code in Python, JavaScript, cURL, and MCP" />
          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                {Object.entries(SDK_EXAMPLES).map(([key, val]) => (
                  <button key={key} onClick={() => setSdkLang(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                      sdkLang === key ? 'glass-orange text-primary' : 'text-secondary hover:text-text hover:bg-white/5'}`}>
                    <span>{val.icon}</span>{val.name}
                  </button>
                ))}
              </div>
              <button onClick={() => copyCode(SDK_EXAMPLES[sdkLang].code, 'sdk')}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] glass hover:glass-orange transition-all">
                {copied === 'sdk' ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                {copied === 'sdk' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="p-5 text-[11px] font-mono text-text/80 leading-relaxed overflow-x-auto thin-scrollbar">
              {SDK_EXAMPLES[sdkLang].code}
            </pre>
          </div>
        </section>

        {/* RESEARCH MODULES */}
        <section id="section-research">
          <SectionHeader icon={FlaskConical} title="Research Modules" subtitle="8 analysis engines · Each with formulas, metrics, and live endpoints" />
          <div className="grid md:grid-cols-2 gap-4">
            {RESEARCH_MODULES.map((mod, i) => (
              <motion.div key={mod.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="glass rounded-2xl p-5 hover:glass-orange transition-all cursor-pointer group"
                onClick={() => setSelectedModule(selectedModule === mod.id ? null : mod.id)}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl glass-orange flex items-center justify-center flex-shrink-0">
                    <mod.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold mb-1">{mod.title}</div>
                    <div className="text-[10px] text-secondary/60 font-mono mb-2">{mod.subtitle}</div>
                    <p className="text-xs text-secondary leading-relaxed mb-3">{mod.desc}</p>
                    <AnimatePresence>
                      {selectedModule === mod.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="pt-3 border-t border-white/5 space-y-3">
                            <div>
                              <div className="text-[9px] font-mono text-primary/60 uppercase tracking-wider mb-1">Formula</div>
                              <div className="text-[10px] font-mono text-secondary bg-white/3 p-2 rounded-lg">{mod.formula}</div>
                            </div>
                            <div>
                              <div className="text-[9px] font-mono text-primary/60 uppercase tracking-wider mb-1">Metrics</div>
                              <div className="flex flex-wrap gap-1.5">
                                {mod.metrics.map(m => <span key={m} className="text-[9px] font-mono px-2 py-0.5 rounded-lg bg-white/3 text-secondary">{m}</span>)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono text-primary/60">Endpoint:</span>
                              <code className="text-[10px] font-mono text-primary">{mod.endpoint}</code>
                              {fileId && (
                                <button onClick={(e) => { e.stopPropagation(); tryEndpoint({ method: 'GET', path: mod.endpoint }) }}
                                  className="ml-auto flex items-center gap-1 text-[9px] text-primary hover:text-accent transition-colors">
                                  <Play className="w-2.5 h-2.5" /> Try
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {!selectedModule && (
                      <div className="flex items-center gap-2 text-[9px] text-secondary/40">
                        <span className="font-mono">{mod.endpoint}</span>
                        <ChevronRight className="w-3 h-3 ml-auto group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ARCHITECTURE */}
        <section id="section-architecture">
          <SectionHeader icon={Layers} title="System Architecture" subtitle="6 layers · From presentation to evidence chain" />
          <div className="space-y-2">
            {ARCH_LAYERS.map((layer, i) => (
              <motion.div key={layer.layer} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="glass rounded-2xl p-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/3 flex items-center justify-center flex-shrink-0">
                    <layer.icon className={`w-5 h-5 ${layer.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold mb-2">{layer.layer}</div>
                    <div className="flex flex-wrap gap-2">
                      {layer.components.map(c => <span key={c} className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-white/3 text-secondary">{c}</span>)}
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-secondary/30">L{i + 1}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FORMULAS */}
        <section id="section-formulas">
          <SectionHeader icon={BookOpen} title="Formula Documentation" subtitle="Live from /formulas endpoint · All scoring models and algorithms" />
          {formulas ? (
            <div className="space-y-3">
              {Object.entries(formulas.categories || {}).map(([catKey, cat]) => (
                <FormulaCard key={catKey} catKey={catKey} cat={cat} />
              ))}
            </div>
          ) : (
            <div className="glass rounded-2xl p-8 text-center">
              <RefreshCw className="w-6 h-6 text-primary animate-spin mx-auto mb-3" />
              <span className="text-xs text-secondary">Loading formulas from /formulas...</span>
            </div>
          )}
        </section>

        {/* LIVE KPIs */}
        <section id="section-kpis">
          <SectionHeader icon={Activity} title="Live Production KPIs" subtitle="Immortality · Virality · Conversion · Proof — from /api/kpis" />
          {kpis ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { key: 'immortality', label: 'Immortality', icon: Shield, desc: 'Durability, visibility, persistence' },
                { key: 'virality', label: 'Virality', icon: TrendingUp, desc: 'Movement, velocity, spread' },
                { key: 'conversion', label: 'Conversion', icon: Zap, desc: 'Profile views to contact actions' },
                { key: 'proof', label: 'Proof', icon: ScrollText, desc: 'Receipts, metrics, artifacts' },
              ].map(({ key, label, icon: Icon, desc }) => {
                const val = kpis[key]
                const score = typeof val === 'object' ? val?.score : val
                return (
                  <div key={key} className="glass rounded-2xl p-5">
                    <Icon className="w-5 h-5 text-primary mb-3" />
                    <div className="text-3xl font-black text-text mb-1">{typeof score === 'number' ? score.toFixed(1) : '—'}</div>
                    <div className="text-xs font-semibold mb-1">{label}</div>
                    <div className="text-[10px] text-secondary/50">{desc}</div>
                    {typeof score === 'number' && (
                      <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full bar-fill transition-all" style={{ width: `${Math.min(score, 100)}%` }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="glass rounded-2xl p-8 text-center">
              <RefreshCw className="w-6 h-6 text-primary animate-spin mx-auto mb-3" />
              <span className="text-xs text-secondary">Loading KPIs from /api/kpis...</span>
            </div>
          )}
        </section>

        {/* RECEIPTS */}
        <section id="section-receipts">
          <SectionHeader icon={ScrollText} title="Tamper-Evident Receipts" subtitle="SHA-256 chained proof · From /api/receipts" />
          {receipts ? (
            <div className="glass rounded-2xl p-5">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-black text-primary">{receipts.total || receipts.count || 0}</div>
                  <div className="text-[10px] font-mono text-secondary/60 uppercase">Total Receipts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-success">{receipts.chain_valid !== false ? '✓' : '✗'}</div>
                  <div className="text-[10px] font-mono text-secondary/60 uppercase">Chain Valid</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-mono text-secondary truncate">{receipts.latest_hash?.slice(0, 16) || '—'}...</div>
                  <div className="text-[10px] font-mono text-secondary/60 uppercase">Latest Hash</div>
                </div>
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto thin-scrollbar">
                {(receipts.receipts || []).slice(0, 20).map((r, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white/3 text-[10px] font-mono">
                    <span className="text-primary/60">#{r.sequence || i + 1}</span>
                    <span className="text-secondary flex-1 truncate">{r.action || r.type || '—'}</span>
                    <span className="text-secondary/40">{r.timestamp ? new Date(r.timestamp * 1000).toLocaleTimeString() : '—'}</span>
                    <span className="text-success/40 truncate max-w-[80px]">{r.hash?.slice(0, 12) || '—'}</span>
                  </div>
                ))}
                {(!receipts.receipts || receipts.receipts.length === 0) && (
                  <div className="text-center py-6 text-secondary/40 text-xs">No receipts yet. Generate activity to create proof.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass rounded-2xl p-8 text-center">
              <RefreshCw className="w-6 h-6 text-primary animate-spin mx-auto mb-3" />
              <span className="text-xs text-secondary">Loading receipts from /api/receipts...</span>
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="flex flex-col items-center text-center pb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="glass rounded-3xl p-8 max-w-2xl">
            <h2 className="text-3xl font-black mb-3">Ready to build?</h2>
            <p className="text-sm text-secondary mb-6">Launch the Command Center to upload files, run analysis, and explore the full API.</p>
            <button onClick={onLaunch}
              className="group flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-bg font-semibold glow-orange-strong hover:scale-105 transition-transform mx-auto">
              Launch Command Center <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
          <div className="mt-8 flex items-center gap-4 text-[10px] font-mono text-secondary/30">
            <span>◉ Live</span><span>·</span>
            <span>{health?.version ? `v${health.version}` : 'v2.0'}</span><span>·</span>
            <span>{fileCount} files</span><span>·</span>
            <span>{health?.endpoints?.length || 30} endpoints</span>
          </div>
        </section>
      </div>
    </div>
  )
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-5 h-5 text-primary" />
        <h2 className="text-2xl font-black tracking-tight">{title}</h2>
      </div>
      <p className="text-sm text-secondary/60 ml-8">{subtitle}</p>
    </div>
  )
}

function FormulaCard({ catKey, cat }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/3 transition-all">
        {expanded ? <ChevronDown className="w-4 h-4 text-secondary/50" /> : <ChevronRight className="w-4 h-4 text-secondary/50" />}
        <span className="text-primary text-sm font-mono">◇</span>
        <span className="text-sm font-semibold flex-1 text-left">{catKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
        <span className="text-[10px] font-mono text-secondary/40">{cat.endpoint || '—'}</span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg glass-orange text-primary">{cat.formulas?.length || 0}</span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-2">
              {cat.formulas?.map((f, i) => (
                <div key={i} className="py-2 px-3 rounded-lg bg-white/3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-primary">{f.name || '—'}</span>
                    {f.unit && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-secondary/60">{f.unit}</span>}
                    {f.range && <span className="text-[9px] font-mono text-secondary/40">{f.range}</span>}
                  </div>
                  <div className="text-[10px] font-mono text-secondary leading-relaxed">{f.formula || '—'}</div>
                  {f.rates && <div className="text-[9px] font-mono text-secondary/40 mt-1">{f.rates}</div>}
                  {f.max_rate && <div className="text-[9px] font-mono text-primary/60 mt-0.5">Max: {f.max_rate}</div>}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
