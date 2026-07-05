import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, ChevronDown, ChevronRight, Loader2, AlertTriangle, Copy, Check } from 'lucide-react'

const API_BASE = ''

export default function FormulasPanel() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/formulas`).then(r => r.json()).then(d => setData(d)).catch(() => setData({ error: 'Failed' })).finally(() => setLoading(false))
  }, [])

  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }))

  const copyFormula = (text, id) => {
    navigator.clipboard?.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <div className="text-xs text-secondary font-mono">Loading formulas...</div>
        </div>
      </div>
    )
  }

  if (data?.error) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="flex flex-col items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-critical" />
          <div className="text-sm text-critical">{data.error}</div>
        </div>
      </div>
    )
  }

  const categories = data.categories || {}

  return (
    <div className="p-6 space-y-4 h-full overflow-y-auto thin-scrollbar">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5"
      >
        <div className="flex items-center gap-3 mb-3">
          <BookOpen className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold">Formula Documentation</span>
          <span className="ml-auto text-[10px] font-mono text-secondary/40">{data.version || 'v2.0'}</span>
        </div>
        <div className="text-xs text-secondary/60">{data.description || 'All formulas, algorithms, and scoring models'}</div>
      </motion.div>

      {Object.entries(categories).map(([catKey, cat], catIdx) => (
        <motion.div
          key={catKey}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: catIdx * 0.05 }}
          className="glass rounded-2xl overflow-hidden"
        >
          <button
            onClick={() => toggle(catKey)}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/3 transition-all"
          >
            <span className="text-primary text-sm font-mono">◇</span>
            {expanded[catKey] ? <ChevronDown className="w-4 h-4 text-secondary/50" /> : <ChevronRight className="w-4 h-4 text-secondary/50" />}
            <span className="text-sm font-semibold flex-1 text-left">{catKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
            <span className="text-[10px] font-mono text-secondary/40">{cat.endpoint || '—'}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg glass-orange text-primary">{cat.formulas?.length || 0}</span>
          </button>
          <AnimatePresence>
            {expanded[catKey] && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 space-y-2">
                  {cat.formulas?.map((f, i) => {
                    const fid = `${catKey}-${i}`
                    return (
                      <div key={i} className="py-2 px-3 rounded-lg bg-white/3 hover:bg-white/5 transition-all group">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono text-primary flex-shrink-0">{f.name || '—'}</span>
                          {f.unit && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-secondary/60">{f.unit}</span>}
                          {f.range && <span className="text-[9px] font-mono text-secondary/40">{f.range}</span>}
                          <button
                            onClick={() => copyFormula(f.formula || '', fid)}
                            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {copied === fid ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3 text-secondary/50" />}
                          </button>
                        </div>
                        <div className="text-[10px] font-mono text-secondary leading-relaxed">{f.formula || '—'}</div>
                        {f.rates && <div className="text-[9px] font-mono text-secondary/40 mt-1">{f.rates}</div>}
                        {f.max_rate && <div className="text-[9px] font-mono text-primary/60 mt-0.5">Max: {f.max_rate}</div>}
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  )
}
