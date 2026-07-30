import { useEffect, useState } from 'react'
import MarketDashboards from './components/MarketDashboards.jsx'
import CommandCenter from './components/CommandCenter.jsx'
import MaterialWebLoader from './components/MaterialWebLoader.jsx'

const MODES = [
  { id: 'terminal', label: 'Terminal', icon: 'monitoring' },
  { id: 'oracle', label: 'Oracle', icon: 'hub' },
  { id: 'tools', label: 'Tools', icon: 'construction' },
]

export default function App() {
  const [mode, setMode] = useState('terminal')
  const [activePanel, setActivePanel] = useState('dashboard')
  const [clock, setClock] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return <div className="app-shell">
    <MaterialWebLoader />
    <header className="masthead">
      <div className="brand-mark" aria-hidden="true"><span>J</span></div>
      <div className="brand-copy"><strong>JORKI</strong><small>MARKET OBSERVABILITY INFRASTRUCTURE</small></div>
      <nav aria-label="Primary dashboard views">
        {MODES.map(item => <md-text-button key={item.id} class={mode === item.id ? 'active' : ''} onClick={() => setMode(item.id)}>
          <md-icon slot="icon">{item.icon}</md-icon>{item.label}
        </md-text-button>)}
      </nav>
      <div className="system-clock"><span><i /> SYSTEM LIVE</span><b>{clock.toLocaleTimeString([], { hour12: false })}</b><small>UTC {clock.toLocaleDateString()}</small></div>
    </header>
    <div className="ticker" aria-label="Live market source status"><span>COINGECKO MARKET FEED</span><b>•</b><span>GDELT NARRATIVE FEED</span><b>•</b><span>120S CACHE WINDOW</span><b>•</b><span>NO SYNTHETIC VALUES</span></div>
    {mode === 'tools' ? <div className="tools-host"><CommandCenter activePanel={activePanel} setActivePanel={setActivePanel} onExit={() => setMode('terminal')} /></div> : <MarketDashboards mode={mode} />}
    <footer className="system-footer"><span>JORKI MARKET TERMINAL · v1.0</span><b>ALL SYSTEMS OBSERVABLE</b><span>COINGECKO · GDELT · LOCAL DERIVATION</span></footer>
  </div>
}
