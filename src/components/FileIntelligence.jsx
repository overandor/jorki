import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dna, Brain, DollarSign, Scale, Hash, Shield, Film, Image,
  RefreshCw, Lock, Unlock, Loader2, AlertTriangle, Check, Play,
  FileText, TrendingUp, Activity, Eye,
} from 'lucide-react'

import { API_BASE } from '../config'

const GLYPHS = {
  dna: '◇', ml: '⟡', valuation: '$', profile: '§', kpi: '#',
  password: '🔒', gif: '⌁', video: '▶', reindex: '↻',
}

export default function FileIntelligence({ fileId, onBack }) {
  const [files, setFiles] = useState([])
  const [selectedId, setSelectedId] = useState(fileId)
  const [activeTab, setActiveTab] = useState('dna')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/files`).then(r => r.json()).then(d => {
      setFiles(d.files || [])
      if (!selectedId && d.files?.length > 0) setSelectedId(d.files[0].file_id)
    }).catch(() => {})
  }, [])

  useEffect(() => { if (fileId) setSelectedId(fileId) }, [fileId])

  const tabs = [
    { id: 'dna', label: 'DNA', icon: Dna },
    { id: 'ml', label: 'ML', icon: Brain },
    { id: 'valuation', label: 'Valuation', icon: DollarSign },
    { id: 'profile', label: 'Profile', icon: Scale },
    { id: 'kpi', label: 'KPIs', icon: Hash },
    { id: 'password', label: 'Password', icon: Shield },
    { id: 'gif', label: 'KPI GIF', icon: Image },
    { id: 'video', label: 'Video', icon: Film },
    { id: 'reindex', label: 'Reindex', icon: RefreshCw },
  ]

  return (
    <div className="p-6 h-full overflow-y-auto thin-scrollbar">
      {/* File selector + back */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-1 text-xs text-secondary hover:text-text px-2 py-1.5 rounded-lg glass transition-all">
            ← Back
          </button>
        )}
        {files.map(f => (
          <button
            key={f.file_id}
            onClick={() => setSelectedId(f.file_id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${selectedId === f.file_id ? 'glass-orange text-primary' : 'glass text-secondary hover:text-text'}`}
          >
            {f.filename}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all ${activeTab === tab.id ? 'glass-orange text-primary font-medium' : 'glass text-secondary hover:text-text'}`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {selectedId && activeTab === 'dna' && <DNAPanel fileId={selectedId} />}
          {selectedId && activeTab === 'ml' && <MLPanel fileId={selectedId} />}
          {selectedId && activeTab === 'valuation' && <ValuationPanel fileId={selectedId} />}
          {selectedId && activeTab === 'profile' && <ProfilePanel fileId={selectedId} />}
          {selectedId && activeTab === 'kpi' && <KPIPanel fileId={selectedId} />}
          {selectedId && activeTab === 'password' && <PasswordPanel fileId={selectedId} />}
          {selectedId && activeTab === 'gif' && <GIFPanel fileId={selectedId} />}
          {selectedId && activeTab === 'video' && <VideoPanel fileId={selectedId} />}
          {selectedId && activeTab === 'reindex' && <ReindexPanel fileId={selectedId} />}
          {!selectedId && (
            <div className="flex items-center justify-center py-12 text-secondary text-sm">No file selected.</div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ─── DNA Panel ──────────────────────────────────────────────────────────

function DNAPanel({ fileId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/dna/${fileId}`).then(r => r.json()).then(d => setData(d)).catch(() => setData({ error: 'Failed' })).finally(() => setLoading(false))
  }, [fileId])

  if (loading) return <LoadingSpinner label="Extracting DNA fingerprint..." />
  if (data?.error) return <ErrorBox msg={data.error} />

  const genes = data.genes || {}
  const complexity = data.complexity_score || 0

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-primary text-lg font-mono">{GLYPHS.dna}</span>
          <Dna className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold">Structural DNA</span>
          <span className="ml-auto text-[10px] font-mono text-secondary/40">{data.genome_size || 0} bytes</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <StatBox label="Species" value={data.species || '—'} mono />
          <StatBox label="Complexity" value={`${complexity}/100`} mono />
          <StatBox label="DNA Sequence" value={data.dna_sequence ? `${data.dna_sequence.slice(0, 20)}...` : '—'} mono />
          <StatBox label="Genome Size" value={`${data.genome_size || 0} bytes`} mono />
        </div>
        <div className="pt-3 border-t border-white/5">
          <div className="text-[10px] uppercase tracking-wider text-secondary/50 mb-3">Genes (10 structural metrics)</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {Object.entries(genes).map(([k, v]) => (
              <div key={k} className="glass rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-wider text-secondary/50 mb-1">{k.replace(/_/g, ' ')}</div>
                <div className="text-sm font-mono text-text">{typeof v === 'number' ? v.toLocaleString() : String(v).slice(0, 20)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── ML Panel ───────────────────────────────────────────────────────────

function MLPanel({ fileId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/ml/${fileId}`).then(r => r.json()).then(d => setData(d)).catch(() => setData({ error: 'Failed' })).finally(() => setLoading(false))
  }, [fileId])

  if (loading) return <LoadingSpinner label="Running ML inference..." />
  if (data?.error) return <ErrorBox msg={data.error} />

  const ml = data.ml || {}
  if (!ml.available) return (
    <div className="glass rounded-2xl p-8 text-center">
      <AlertTriangle className="w-6 h-6 text-warning mx-auto mb-3" />
      <div className="text-sm text-secondary">ML unavailable — {ml.error || 'unknown error'}</div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-primary text-lg font-mono">{GLYPHS.ml}</span>
          <Brain className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold">ML Insights</span>
          <span className="ml-auto text-[10px] font-mono px-2 py-1 rounded-lg glass-orange text-primary">{ml.engine || 'sklearn'}</span>
        </div>

        {/* TF-IDF */}
        {ml.tfidf_top_terms?.length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-wider text-secondary/50 mb-2">TF-IDF Top Terms</div>
            <div className="flex flex-wrap gap-1.5">
              {ml.tfidf_top_terms.map((t, i) => (
                <span key={i} className="text-[10px] px-2 py-1 rounded-lg glass-orange text-primary font-mono">
                  {t.term} <span className="text-secondary/40">{t.score}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Topics */}
        {ml.topics?.length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-wider text-secondary/50 mb-2">Topics</div>
            <div className="space-y-2">
              {ml.topics.map((t, i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white/3">
                  <span className="text-[10px] font-mono text-primary flex-shrink-0">T{t.topic_id}</span>
                  <div className="flex-1 flex flex-wrap gap-1">
                    {t.keywords?.map((kw, j) => (
                      <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-secondary font-mono">{kw}</span>
                    ))}
                  </div>
                  <span className="text-[10px] font-mono text-secondary/40 flex-shrink-0">{t.chunk_count} chunks · {t.strength}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clusters */}
        {ml.clusters && Object.keys(ml.clusters).length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-wider text-secondary/50 mb-2">Clusters</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {Object.entries(ml.clusters).map(([k, c]) => (
                <div key={k} className="glass rounded-xl p-3">
                  <div className="text-[10px] font-mono text-primary mb-1">{k}</div>
                  <div className="text-xs text-secondary mb-1">{c.size} chunks</div>
                  <div className="flex flex-wrap gap-1">
                    {c.centroid_terms?.map((t, i) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-secondary font-mono">{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Anomalies */}
        {ml.anomalies?.length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-wider text-secondary/50 mb-2">Anomalies ({ml.anomalies.length})</div>
            <div className="space-y-1">
              {ml.anomalies.map((a, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-warning/5 text-[10px] font-mono">
                  <AlertTriangle className="w-3 h-3 text-warning flex-shrink-0" />
                  <span className="text-warning">Chunk #{a.chunk_idx}</span>
                  <span className="text-secondary/60 truncate">{a.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inferred KPIs */}
        {ml.inferred_kpis?.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-secondary/50 mb-2">Inferred KPIs</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {ml.inferred_kpis.map((k, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-white/3">
                  <span className="text-[10px] font-mono text-primary flex-shrink-0">{k.name}</span>
                  <span className="text-[10px] font-mono text-text flex-1 truncate">{k.value}</span>
                  <span className="text-[9px] font-mono text-secondary/40">{k.method}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LLM Extrapolation */}
        {ml.llm_extrapolation && (
          <div className="mt-4 pt-3 border-t border-white/5">
            <div className="text-[10px] uppercase tracking-wider text-secondary/50 mb-2">LLM Extrapolation</div>
            <div className="space-y-2 text-xs">
              {ml.llm_extrapolation.inferred_purpose && <div className="text-secondary"><span className="text-primary font-mono">Purpose:</span> {ml.llm_extrapolation.inferred_purpose}</div>}
              {ml.llm_extrapolation.hidden_value && <div className="text-secondary"><span className="text-primary font-mono">Hidden Value:</span> {ml.llm_extrapolation.hidden_value}</div>}
              {ml.llm_extrapolation.counterparty_risk && <div className="text-secondary"><span className="text-critical font-mono">Risk:</span> {ml.llm_extrapolation.counterparty_risk}</div>}
              {ml.llm_extrapolation.monetization_vector && <div className="text-secondary"><span className="text-success font-mono">Monetization:</span> {ml.llm_extrapolation.monetization_vector}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Valuation Panel ────────────────────────────────────────────────────

function ValuationPanel({ fileId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/valuation/${fileId}`).then(r => r.json()).then(d => setData(d)).catch(() => setData({ error: 'Failed' })).finally(() => setLoading(false))
  }, [fileId])

  if (loading) return <LoadingSpinner label="Computing valuation..." />
  if (data?.error) return <ErrorBox msg={data.error} />

  const v = data.valuation || {}

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-primary text-lg font-mono">{GLYPHS.valuation}</span>
          <DollarSign className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold">Valuation</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <ValueBox label="Build Cost" value={v.build_cost?.estimated_usd} glyph="⌁" />
          <ValueBox label="Replacement" value={v.replacement_cost?.estimated_usd} glyph="↻" />
          <ValueBox label="Insurance" value={v.insurance_value?.estimated_usd} glyph="◆" />
          <ValueBox label="Depreciated" value={v.depreciation?.depreciated_value_usd} glyph="▼" sub={`${v.depreciation?.remaining_value_pct || 0}% remaining`} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="glass rounded-xl p-3">
            <div className="text-[10px] uppercase tracking-wider text-secondary/50 mb-1">Prod Readiness</div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">{v.production_readiness?.grade || 'F'}</span>
              <span className="text-secondary font-mono text-xs">{v.production_readiness?.score || 0}/100</span>
            </div>
            <div className="text-[10px] text-secondary/60 mt-1">{v.production_readiness?.distance_to_prod || '—'}</div>
          </div>
          <div className="glass rounded-xl p-3">
            <div className="text-[10px] uppercase tracking-wider text-secondary/50 mb-1">File Type</div>
            <div className="text-sm font-mono">{v.build_cost?.breakdown?.file_type || '—'}</div>
            <div className="text-[10px] text-secondary/60 mt-1">Rate: ${v.build_cost?.breakdown?.rate_per_loc || 0}/LOC</div>
          </div>
          <div className="glass rounded-xl p-3">
            <div className="text-[10px] uppercase tracking-wider text-secondary/50 mb-1">Difficulty</div>
            <div className="text-sm font-mono capitalize">{v.replacement_cost?.difficulty || '—'}</div>
            <div className="text-[10px] text-secondary/60 mt-1">{v.replacement_cost?.time_to_rebuild?.days || 0} days to rebuild</div>
          </div>
        </div>
        {v.production_readiness?.blocking_issues?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {v.production_readiness.blocking_issues.map((issue, i) => (
              <span key={i} className="text-[10px] px-2 py-1 rounded-lg bg-critical/10 text-critical font-mono">⟁ {issue}</span>
            ))}
          </div>
        )}
        {v.depreciation?.signals?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <div className="text-[10px] uppercase tracking-wider text-secondary/50 mb-2">Depreciation Signals</div>
            <div className="flex flex-wrap gap-1.5">
              {v.depreciation.signals.map((s, i) => (
                <span key={i} className="text-[10px] px-2 py-1 rounded-lg bg-warning/10 text-warning font-mono">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Profile Panel ──────────────────────────────────────────────────────

function ProfilePanel({ fileId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/profile/${fileId}`).then(r => r.json()).then(d => setData(d)).catch(() => setData({ error: 'Failed' })).finally(() => setLoading(false))
  }, [fileId])

  if (loading) return <LoadingSpinner label="Building semantic profile..." />
  if (data?.error) return <ErrorBox msg={data.error} />

  const p = data.profile || {}

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-primary text-lg font-mono">{GLYPHS.profile}</span>
          <Scale className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold">Semantic Profile</span>
        </div>

        {/* Origin */}
        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-wider text-secondary/50 mb-2">Origin</div>
          <div className="text-sm font-mono text-primary mb-2">{p.origin?.primary || 'unknown'}</div>
          <div className="flex flex-wrap gap-1.5">
            {p.origin?.detected?.map((o, i) => (
              <span key={i} className="text-[10px] px-2 py-1 rounded-lg bg-white/5 text-secondary font-mono">
                {o.type} ({Math.round(o.confidence * 100)}%)
              </span>
            ))}
          </div>
        </div>

        {/* Accounting + Finance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="glass rounded-xl p-3">
            <div className="text-[10px] uppercase tracking-wider text-secondary/50 mb-2">Accounting</div>
            {p.accounting?.standards_detected?.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {p.accounting.standards_detected.map(s => (
                  <span key={s} className="text-[10px] px-2 py-1 rounded-lg bg-white/5 text-secondary font-mono uppercase">{s}</span>
                ))}
              </div>
            ) : <div className="text-xs text-secondary/40">No standards detected</div>}
            {p.accounting?.concepts_found && Object.keys(p.accounting.concepts_found).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Object.entries(p.accounting.concepts_found).map(([k, v]) => (
                  <span key={k} className="text-[10px] px-2 py-1 rounded-lg bg-white/5 text-secondary font-mono">{k} ×{v}</span>
                ))}
              </div>
            )}
          </div>
          <div className="glass rounded-xl p-3">
            <div className="text-[10px] uppercase tracking-wider text-secondary/50 mb-2">Finance</div>
            {p.finance?.metrics_detected && Object.keys(p.finance.metrics_detected).length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(p.finance.metrics_detected).map(([k, v]) => (
                  <span key={k} className="text-[10px] px-2 py-1 rounded-lg glass-orange text-primary font-mono">{k} ×{v}</span>
                ))}
              </div>
            ) : <div className="text-xs text-secondary/40">No metrics detected</div>}
          </div>
        </div>

        {/* Collateral + Liquidity + Risk */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="glass rounded-xl p-3">
            <div className="text-[10px] uppercase tracking-wider text-secondary/50 mb-1">Collateral</div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">{p.collateral?.grade || 'F'}</span>
              <span className="text-xs font-mono text-secondary">{p.collateral?.score || 0}/100</span>
            </div>
          </div>
          <div className="glass rounded-xl p-3">
            <div className="text-[10px] uppercase tracking-wider text-secondary/50 mb-1">Liquidity</div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">{p.liquidity?.grade || 'F'}</span>
              <span className="text-xs font-mono text-secondary">{p.liquidity?.score || 0}/100</span>
            </div>
            <div className="text-[10px] text-secondary/60 mt-1">{p.liquidity?.time_to_liquidate || '—'}</div>
          </div>
          <div className="glass rounded-xl p-3">
            <div className="text-[10px] uppercase tracking-wider text-secondary/50 mb-1">Risk Level</div>
            <div className="text-lg font-bold capitalize text-primary">{p.risk?.level || 'unknown'}</div>
            <div className="text-[10px] text-secondary/60 mt-1">{p.risk?.score || 0}/100</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── KPI Panel ──────────────────────────────────────────────────────────

function KPIPanel({ fileId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/kpi/${fileId}`).then(r => r.json()).then(d => setData(d)).catch(() => setData({ error: 'Failed' })).finally(() => setLoading(false))
  }, [fileId])

  if (loading) return <LoadingSpinner label="Extracting KPIs..." />
  if (data?.error) return <ErrorBox msg={data.error} />

  const cats = data.by_category || {}

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-primary text-lg font-mono">{GLYPHS.kpi}</span>
          <Hash className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold">KPIs ({data.total_kpis || 0})</span>
        </div>
        {Object.keys(cats).length === 0 ? (
          <div className="text-xs text-secondary/40 py-4 text-center">No KPIs extracted</div>
        ) : (
          <div className="space-y-4">
            {Object.entries(cats).map(([cat, kpis]) => (
              <div key={cat}>
                <div className="text-[10px] uppercase tracking-wider text-secondary/50 mb-2">{cat} ({kpis.length})</div>
                <div className="space-y-1">
                  {kpis.map((k, i) => (
                    <div key={i} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-white/5 text-[11px] font-mono">
                      <span className="text-primary flex-shrink-0 w-28 truncate">{k.name}</span>
                      <span className="text-text flex-1 truncate">{k.value}</span>
                      <span className="text-secondary/40 flex-shrink-0">L{k.line}</span>
                      <span className="text-secondary/30 flex-shrink-0">{Math.round((k.confidence || 0) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Password Panel ─────────────────────────────────────────────────────

function PasswordPanel({ fileId }) {
  const [status, setStatus] = useState(null)
  const [password, setPassword] = useState('')
  const [verifyPassword, setVerifyPassword] = useState('')
  const [result, setResult] = useState(null)
  const [verifyResult, setVerifyResult] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/password/${fileId}/status`).then(r => r.json()).then(d => setStatus(d)).catch(() => setStatus({ error: 'Failed' }))
  }, [fileId])

  const setPassword_ = async () => {
    if (!password) return
    setLoading(true); setResult(null)
    try {
      const res = await fetch(`${API_BASE}/password/${fileId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      const d = await res.json()
      setResult(d)
      if (!d.error) { setStatus({ has_password: true }); setPassword('') }
    } catch (e) { setResult({ error: e.message }) }
    finally { setLoading(false) }
  }

  const verifyPwd = async () => {
    if (!verifyPassword) return
    setLoading(true); setVerifyResult(null)
    try {
      const res = await fetch(`${API_BASE}/password/${fileId}/verify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: verifyPassword })
      })
      const d = await res.json()
      setVerifyResult(d)
    } catch (e) { setVerifyResult({ error: e.message }) }
    finally { setLoading(false) }
  }

  const hasPwd = status?.has_password

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-primary text-lg font-mono">{GLYPHS.password}</span>
          {hasPwd ? <Lock className="w-5 h-5 text-success" /> : <Unlock className="w-5 h-5 text-warning" />}
          <span className="text-sm font-semibold">Password Protection</span>
          <span className={`ml-auto text-[10px] font-mono px-2 py-1 rounded-lg ${hasPwd ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
            {hasPwd ? '◆ PROTECTED' : '◌ UNPROTECTED'}
          </span>
        </div>

        {/* Set password */}
        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-wider text-secondary/50 mb-2">{hasPwd ? 'Update Password' : 'Set Password'}</div>
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setPassword_()}
              placeholder="Enter password..."
              className="flex-1 px-3 py-2 rounded-xl glass text-xs font-mono text-text placeholder:text-secondary/30 outline-none focus:glass-orange"
            />
            <button
              onClick={setPassword_}
              disabled={loading || !password}
              className="px-4 py-2 rounded-xl glass-orange text-primary text-xs font-mono disabled:opacity-30"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : hasPwd ? 'Update' : 'Set'}
            </button>
          </div>
          {result?.error && <div className="text-[10px] text-critical mt-2 font-mono">⟁ {result.error}</div>}
          {result?.status === 'set' && <div className="text-[10px] text-success mt-2 font-mono">◆ Password set successfully</div>}
        </div>

        {/* Verify password */}
        {hasPwd && (
          <div className="pt-3 border-t border-white/5">
            <div className="text-[10px] uppercase tracking-wider text-secondary/50 mb-2">Verify Password</div>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={verifyPassword}
                onChange={e => setVerifyPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && verifyPwd()}
                placeholder="Enter password to verify..."
                className="flex-1 px-3 py-2 rounded-xl glass text-xs font-mono text-text placeholder:text-secondary/30 outline-none focus:glass-orange"
              />
              <button
                onClick={verifyPwd}
                disabled={loading || !verifyPassword}
                className="px-4 py-2 rounded-xl glass text-secondary text-xs font-mono hover:glass-orange disabled:opacity-30"
              >
                Verify
              </button>
            </div>
            {verifyResult?.verified && <div className="text-[10px] text-success mt-2 font-mono flex items-center gap-1"><Check className="w-3 h-3" /> Verified — access granted</div>}
            {verifyResult?.verified === false && <div className="text-[10px] text-critical mt-2 font-mono flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Incorrect password</div>}
            {verifyResult?.error && <div className="text-[10px] text-critical mt-2 font-mono">⟁ {verifyResult.error}</div>}
          </div>
        )}

        {/* Hash info */}
        {status?.hash_prefix && (
          <div className="mt-4 pt-3 border-t border-white/5">
            <div className="text-[10px] uppercase tracking-wider text-secondary/50 mb-1">Hash</div>
            <div className="text-[10px] font-mono text-secondary/60">{status.hash_prefix}... · PBKDF2 · {status.iterations || 100000} iterations</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── GIF Panel ──────────────────────────────────────────────────────────

function GIFPanel({ fileId }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [gifUrl, setGifUrl] = useState(null)

  const generate = async () => {
    setLoading(true); setError(null); setGifUrl(null)
    try {
      const res = await fetch(`${API_BASE}/kpi/${fileId}/gif`)
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error || `HTTP ${res.status}`)
      } else {
        const blob = await res.blob()
        setGifUrl(URL.createObjectURL(blob))
      }
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-primary text-lg font-mono">{GLYPHS.gif}</span>
          <Image className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold">KPI Animated GIF</span>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="px-4 py-2 rounded-xl glass-orange text-primary text-xs font-mono disabled:opacity-30 flex items-center gap-2"
        >
          {loading ? <><Loader2 className="w-3 h-3 animate-spin" /> Generating...</> : <><Play className="w-3 h-3" /> Generate GIF</>}
        </button>
        {error && <div className="text-[10px] text-critical mt-3 font-mono">⟁ {error}</div>}
        {gifUrl && (
          <div className="mt-4">
            <img src={gifUrl} alt="KPI Animation" className="rounded-xl max-w-full" />
            <a href={gifUrl} download={`${fileId}_kpi.gif`} className="text-[10px] text-primary hover:text-accent mt-2 inline-block font-mono">↓ Download GIF</a>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Video Panel ────────────────────────────────────────────────────────

function VideoPanel({ fileId }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)

  const generate = async () => {
    setLoading(true); setError(null); setVideoUrl(null)
    try {
      const res = await fetch(`${API_BASE}/video/${fileId}`)
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error || `HTTP ${res.status}`)
      } else {
        const blob = await res.blob()
        setVideoUrl(URL.createObjectURL(blob))
      }
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-primary text-lg font-mono">{GLYPHS.video}</span>
          <Film className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold">Video Dossier</span>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="px-4 py-2 rounded-xl glass-orange text-primary text-xs font-mono disabled:opacity-30 flex items-center gap-2"
        >
          {loading ? <><Loader2 className="w-3 h-3 animate-spin" /> Rendering video...</> : <><Play className="w-3 h-3" /> Generate Video</>}
        </button>
        {error && <div className="text-[10px] text-critical mt-3 font-mono">⟁ {error}</div>}
        {videoUrl && (
          <div className="mt-4">
            <video src={videoUrl} controls className="rounded-xl max-w-full" />
            <a href={videoUrl} download={`${fileId}_dossier.mp4`} className="text-[10px] text-primary hover:text-accent mt-2 inline-block font-mono">↓ Download Video</a>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Reindex Panel ──────────────────────────────────────────────────────

function ReindexPanel({ fileId }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const reindex = async () => {
    setLoading(true); setResult(null); setError(null)
    try {
      const res = await fetch(`${API_BASE}/reindex/${fileId}`, { method: 'POST' })
      const d = await res.json()
      if (d.error) setError(d.error)
      else setResult(d)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-primary text-lg font-mono">{GLYPHS.reindex}</span>
          <RefreshCw className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold">Re-Index File</span>
        </div>
        <div className="text-xs text-secondary mb-4">
          Rebuilds the file index with the latest extraction algorithms. Use after backend updates to refresh DNA, KPIs, and all analysis layers.
        </div>
        <button
          onClick={reindex}
          disabled={loading}
          className="px-4 py-2 rounded-xl glass-orange text-primary text-xs font-mono disabled:opacity-30 flex items-center gap-2"
        >
          {loading ? <><Loader2 className="w-3 h-3 animate-spin" /> Re-indexing...</> : <><RefreshCw className="w-3 h-3" /> Re-Index Now</>}
        </button>
        {error && <div className="text-[10px] text-critical mt-3 font-mono">⟁ {error}</div>}
        {result && (
          <div className="mt-4 pt-3 border-t border-white/5">
            <div className="text-[10px] uppercase tracking-wider text-secondary/50 mb-2">Result</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatBox label="File ID" value={result.file_id || result.new_file_id} mono />
              <StatBox label="Lines" value={result.total_lines} mono />
              <StatBox label="Chunks" value={result.total_chunks} mono />
              <StatBox label="KPIs" value={result.kpi_count} mono />
            </div>
            {result.old_file_id !== result.new_file_id && (
              <div className="text-[10px] text-warning mt-2 font-mono">⚠ File ID changed: {result.old_file_id} → {result.new_file_id}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Helper components ──────────────────────────────────────────────────

function LoadingSpinner({ label }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
        <div className="text-xs text-secondary font-mono">{label}</div>
      </div>
    </div>
  )
}

function ErrorBox({ msg }) {
  return (
    <div className="glass rounded-2xl p-8 text-center">
      <AlertTriangle className="w-6 h-6 text-critical mx-auto mb-3" />
      <div className="text-sm text-critical font-mono">{msg}</div>
    </div>
  )
}

function StatBox({ label, value, mono }) {
  return (
    <div className="glass rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-wider text-secondary/50 mb-1">{label}</div>
      <div className={`text-sm ${mono ? 'font-mono' : ''} text-text`}>{value ?? '—'}</div>
    </div>
  )
}

function ValueBox({ label, value, glyph, sub }) {
  const formatted = typeof value === 'number' && value > 0 ? `$${value.toLocaleString()}` : value ? `$${value}` : '—'
  return (
    <div className="glass rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-primary text-xs font-mono">{glyph}</span>
        <span className="text-[10px] uppercase tracking-wider text-secondary/50">{label}</span>
      </div>
      <div className="text-sm font-bold font-mono text-text">{formatted}</div>
      {sub && <div className="text-[9px] text-secondary/40 mt-0.5">{sub}</div>}
    </div>
  )
}
