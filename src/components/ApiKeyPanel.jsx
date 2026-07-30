import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Key, RefreshCw, Zap, AlertTriangle, CheckCircle, XCircle, Clock, Plus, Cpu, TrendingUp, Gauge } from 'lucide-react'

import { API_BASE } from '../config'
const GLYPHS = { active: '◉', expired: '⟁', rate_limited: '⧖', invalid: '✕', untested: '◌', unknown: '◌', loading: '◍' }
const COLORS = { active: 'text-emerald-400', expired: 'text-red-400', rate_limited: 'text-amber-400', invalid: 'text-red-500', untested: 'text-zinc-500', unknown: 'text-zinc-500', loading: 'text-blue-400' }
const PULSE = { active: true, expired: false, rate_limited: true, invalid: false, untested: false, unknown: false, loading: true }
const GLOW = { active: 'shadow-[0_0_12px_rgba(52,211,153,0.3)]', expired: '', rate_limited: 'shadow-[0_0_8px_rgba(251,191,36,0.2)]', invalid: '', untested: '', unknown: '', loading: 'shadow-[0_0_8px_rgba(96,165,250,0.2)]' }

export default function ApiKeyPanel() {
  const [keys, setKeys] = useState([])
  const [chain, setChain] = useState([])
  const [health, setHealth] = useState({ providers: [], summary: {} })
  const [usage, setUsage] = useState({})
  const [catalog, setCatalog] = useState({ services: [] })
  const [models, setModels] = useState({ models: [] })
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [newKey, setNewKey] = useState({ provider: '', key: '' })
  const [chatMsg, setChatMsg] = useState('')
  const [chatResp, setChatResp] = useState(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(0)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [k, c, h, u, cat, m] = await Promise.all([
        fetch(`${API_BASE}/llm/keys`).then(r => r.json()).catch(() => ({ keys: [] })),
        fetch(`${API_BASE}/llm/chain`).then(r => r.json()).catch(() => ({ chain: [] })),
        fetch(`${API_BASE}/llm/health`).then(r => r.json()).catch(() => ({ providers: [], summary: {} })),
        fetch(`${API_BASE}/llm/usage`).then(r => r.json()).catch(() => ({})),
        fetch(`${API_BASE}/llm/catalog`).then(r => r.json()).catch(() => ({ services: [] })),
        fetch(`${API_BASE}/llm/models`).then(r => r.json()).catch(() => ({ models: [] })),
      ])
      setKeys(k.keys || []); setChain(c.chain || []); setHealth(h); setUsage(u); setCatalog(cat); setModels(m)
      setLastUpdate(Date.now())
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll(); const i = setInterval(fetchAll, 30000); return () => clearInterval(i) }, [fetchAll])

  const rotate = async () => {
    setLoading(true)
    try { await fetch(`${API_BASE}/llm/rotate`, { method: 'POST' }) } finally { setTimeout(fetchAll, 2000) }
  }
  const addKey = async () => {
    await fetch(`${API_BASE}/llm/keys/add`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newKey) })
    setNewKey({ provider: '', key: '' }); setShowAdd(false); await fetchAll()
  }
  const sendChat = async () => {
    setChatLoading(true)
    try {
      const r = await fetch(`${API_BASE}/llm/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: chatMsg }) })
      setChatResp(await r.json())
    } finally { setChatLoading(false) }
  }

  const activeCount = health.summary?.active || 0
  const totalCount = health.summary?.total || 0
  const catCount = catalog.services?.length || 0
  const modelCount = models.models?.length || 0
  const deadKeys = keys.filter(k => k.status !== 'active' && k.status !== 'untested')

  const providerGroups = {}
  keys.forEach(k => {
    if (!providerGroups[k.provider]) providerGroups[k.provider] = { keys: [], bestLatency: Infinity, models: new Set(), lastValidated: '' }
    providerGroups[k.provider].keys.push(k)
    if (k.status === 'active' && k.latency_ms < providerGroups[k.provider].bestLatency) providerGroups[k.provider].bestLatency = k.latency_ms
    if (k.model) providerGroups[k.provider].models.add(k.model)
    if (k.timestamp) providerGroups[k.provider].lastValidated = k.timestamp
  })

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 font-mono">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Key className="w-6 h-6 text-orange-500" />
            <h1 className="text-xl font-bold tracking-tight">API KEY AGENT</h1>
            <span className="text-xs text-zinc-500">{catCount} services · {modelCount} models</span>
            <span className="text-xs text-zinc-600">⟡ {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : '—'}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={rotate} disabled={loading} className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 rounded text-sm font-medium transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> ROTATE
            </button>
            <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-sm">
              <Plus className="w-4 h-4" /> ADD KEY
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6 px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
          <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400" /><span className="text-2xl font-bold text-emerald-400">{activeCount}</span><span className="text-xs text-zinc-500">ACTIVE</span></div>
          <div className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-400" /><span className="text-2xl font-bold text-red-400">{deadKeys.length}</span><span className="text-xs text-zinc-500">DEAD</span></div>
          <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-orange-500" /><span className="text-2xl font-bold text-orange-500">{usage.total_requests || 0}</span><span className="text-xs text-zinc-500">REQUESTS</span></div>
          <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" /><span className="text-2xl font-bold text-amber-400">{usage.fallbacks_triggered || 0}</span><span className="text-xs text-zinc-500">FALLBACKS</span></div>
          <div className="flex items-center gap-2 ml-auto"><Cpu className="w-4 h-4 text-blue-400" /><span className="text-2xl font-bold text-blue-400">{modelCount}</span><span className="text-xs text-zinc-500">MODELS</span></div>
        </div>

        <AnimatePresence>{showAdd && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
              <input value={newKey.provider} onChange={e => setNewKey({ ...newKey, provider: e.target.value })} placeholder="provider (groq, openrouter, google...)" className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm" />
              <input value={newKey.key} onChange={e => setNewKey({ ...newKey, key: e.target.value })} placeholder="api key" className="flex-[2] bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm" />
              <button onClick={addKey} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium">STAMP</button>
            </div>
          </motion.div>
        )}</AnimatePresence>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(providerGroups).map(([prov, data], i) => {
            const hasActive = data.keys.some(k => k.status === 'active')
            const status = hasActive ? 'active' : data.keys[0]?.status || 'untested'
            return (
              <motion.div key={prov} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                className={`p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg ${GLOW[status] || ''} ${hasActive ? 'border-emerald-900/50' : 'border-red-900/20'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-lg ${PULSE[status] ? 'animate-pulse' : ''} ${COLORS[status]}`}>{GLYPHS[status]}</span>
                  <span className="text-xs text-zinc-500 uppercase tracking-wider">{prov}</span>
                </div>
                <div className="flex items-center gap-2 text-xs"><Gauge className="w-3 h-3 text-zinc-600" /><span className="text-zinc-400">{data.bestLatency === Infinity ? '—' : `${data.bestLatency}ms`}</span></div>
                <div className="flex items-center gap-2 text-xs mt-1"><Key className="w-3 h-3 text-zinc-600" /><span className="text-zinc-500">{data.keys.length} keys · {data.models.size} models</span></div>
                {data.lastValidated && <div className="text-[10px] text-zinc-700 mt-1">validated {new Date(data.lastValidated).toLocaleString()}</div>}
              </motion.div>
            )
          })}
          {Object.keys(providerGroups).length === 0 && <div className="col-span-full text-xs text-zinc-600 py-4 text-center">No keys validated yet. Run ROTATE.</div>}
        </div>

        <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg">
          <h2 className="text-sm font-bold mb-3 text-zinc-400 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-orange-500" /> FALLBACK CHAIN</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {chain.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`px-3 py-1.5 rounded text-xs ${c.score > 0 ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50' : 'bg-zinc-800 text-zinc-500'}`}>
                  <span className="font-bold">{c.provider}</span><span className="text-zinc-600 mx-1">·</span>
                  <span className="text-zinc-400">{c.model?.split('/').pop()?.split(':')[0]}</span><span className="text-zinc-600 mx-1">·</span>
                  <span className="text-zinc-500">{c.latency_ms}ms</span>
                  {c.score > 0 && <span className="text-emerald-600 ml-1">◆{c.score}</span>}
                </div>
                {i < chain.length - 1 && <span className="text-orange-600 text-lg">→</span>}
              </div>
            ))}
            {chain.length === 0 && <span className="text-xs text-zinc-600">No active keys. Run ROTATE to discover.</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg">
            <h2 className="text-sm font-bold mb-3 text-zinc-400 flex items-center gap-2"><Zap className="w-4 h-4 text-orange-500" /> USAGE</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-xs"><span className="text-zinc-500">Total Requests</span><span className="text-orange-400 font-bold">{usage.total_requests || 0}</span></div>
              <div className="flex justify-between text-xs"><span className="text-zinc-500">Fallbacks Triggered</span><span className="text-amber-400 font-bold">{usage.fallbacks_triggered || 0}</span></div>
              <div className="border-t border-zinc-800 pt-2">
                <div className="text-xs text-zinc-500 mb-2">Per Provider</div>
                {Object.entries(usage.per_provider || {}).map(([prov, count]) => (
                  <div key={prov} className="flex justify-between text-xs py-0.5"><span className="text-zinc-400">{prov}</span><span className="text-zinc-300">{count}</span></div>
                ))}
                {Object.keys(usage.per_provider || {}).length === 0 && <div className="text-xs text-zinc-700">No requests served yet.</div>}
              </div>
            </div>
          </div>

          <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg">
            <h2 className="text-sm font-bold mb-3 text-zinc-400 flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400" /> LLM CHAT TEST</h2>
            <div className="flex gap-3 mb-3">
              <input value={chatMsg} onChange={e => setChatMsg(e.target.value)} placeholder="test prompt..." className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm" onKeyDown={e => e.key === 'Enter' && sendChat()} />
              <button onClick={sendChat} disabled={chatLoading} className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 rounded text-sm font-medium">{chatLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'SEND'}</button>
            </div>
            {chatResp && (
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded text-sm">
                {chatResp.error ? <span className="text-red-400">{chatResp.error} — {JSON.stringify(chatResp.errors)}</span> :
                  <div><div className="text-xs text-emerald-400 mb-1">◉ {chatResp.provider} · {chatResp.model}</div><div className="text-zinc-200">{chatResp.response}</div></div>}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg">
          <h2 className="text-sm font-bold mb-3 text-zinc-400">KEY REGISTRY ({keys.length})</h2>
          <div className="space-y-1">
            {keys.map((k, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 bg-zinc-950/50 rounded text-xs hover:bg-zinc-900/50 transition-colors">
                <span className={`text-base ${COLORS[k.status] || 'text-zinc-500'} ${PULSE[k.status] ? 'animate-pulse' : ''}`}>{GLYPHS[k.status] || '◌'}</span>
                <span className="text-zinc-300 w-32">{k.provider}</span>
                <span className="text-zinc-500 flex-1 truncate">{k.model}</span>
                <span className="text-zinc-600">{k.latency_ms}ms</span>
                <span className="text-zinc-600">◆{k.score}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${k.status === 'active' ? 'bg-emerald-900/30 text-emerald-400' : k.status === 'expired' ? 'bg-red-900/30 text-red-400' : k.status === 'rate_limited' ? 'bg-amber-900/30 text-amber-400' : 'bg-zinc-800 text-zinc-500'}`}>{k.status}</span>
              </div>
            ))}
            {keys.length === 0 && <div className="text-xs text-zinc-600 py-4 text-center">No keys validated yet. Run ROTATE.</div>}
          </div>
        </div>

        <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg">
          <h2 className="text-sm font-bold mb-3 text-zinc-400">CATALOG ({catCount} services)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {catalog.services?.slice(0, 30).map((s, i) => (
              <div key={i} className="px-2 py-1.5 bg-zinc-950/50 rounded text-xs">
                <div className="text-zinc-400 truncate">{s.name || s.n}</div>
                <div className="text-zinc-600 text-[10px]">{s.models?.length || s.m?.length || 0} models</div>
              </div>
            ))}
            {catCount > 30 && <div className="px-2 py-1.5 text-xs text-zinc-600">+{catCount - 30} more...</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
