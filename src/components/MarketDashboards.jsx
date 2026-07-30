import { useMemo, useState } from 'react'
import { useMarketData } from '../hooks/useMarketData.js'

const money = (value) => {
  if (!Number.isFinite(Number(value))) return '—'
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value)
}
const pct = (value, digits = 2) => `${Number(value || 0) >= 0 ? '+' : ''}${Number(value || 0).toFixed(digits)}%`

function Sparkline({ values = [], tone = 'green' }) {
  const points = values.filter(Number.isFinite)
  if (points.length < 2) return <div className="chart-empty">NO SERIES</div>
  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min || 1
  const path = points.map((v, i) => `${(i / (points.length - 1)) * 100},${32 - ((v - min) / span) * 28}`).join(' ')
  return <svg className={`sparkline ${tone}`} viewBox="0 0 100 36" preserveAspectRatio="none" aria-hidden="true"><polyline points={path} /></svg>
}

function StatusStrip({ market }) {
  const global = market?.global || {}
  const metrics = [
    ['TOTAL MARKET CAP', `$${money(global.total_market_cap?.usd)}`, pct(global.market_cap_change_percentage_24h_usd)],
    ['24H VOLUME', `$${money(global.total_volume?.usd)}`, `${global.active_cryptocurrencies || 0} assets`],
    ['MARKET BREADTH', pct((market?.derived?.market_breadth || 0) * 100, 1), 'top 30 advancing'],
    ['LIQUIDITY CONC.', pct((market?.derived?.liquidity_concentration || 0) * 100, 1), 'top 5 share'],
    ['REALIZED VOL.', pct(market?.derived?.realized_volatility, 2), 'mean abs move'],
  ]
  return <section className="metric-strip" aria-label="Global market metrics">
    {metrics.map(([label, value, sub]) => <div className="strip-metric" key={label}><span>{label}</span><strong>{value}</strong><small>{sub}</small></div>)}
  </section>
}

function Panel({ title, kicker, children, className = '' }) {
  return <section className={`terminal-panel ${className}`}><header><div><span className="panel-kicker">{kicker}</span><h2>{title}</h2></div><span className="panel-node" /></header>{children}</section>
}

function AssetTable({ coins, limit = 8 }) {
  return <div className="asset-table" role="table" aria-label="Live asset market data">
    <div className="asset-row table-head" role="row"><span># / ASSET</span><span>PRICE</span><span>24H</span><span>VOLUME</span><span>LIQUIDITY</span></div>
    {coins.slice(0, limit).map((coin) => {
      const change = Number(coin.price_change_percentage_24h || 0)
      const liquidity = coin.market_cap ? Math.min(100, (coin.total_volume / coin.market_cap) * 500) : 0
      return <div className="asset-row" role="row" key={coin.id}>
        <span className="asset-name"><img src={coin.image} alt="" /><b>{coin.symbol?.toUpperCase()}</b><small>{coin.name}</small></span>
        <span>${coin.current_price?.toLocaleString(undefined, { maximumFractionDigits: coin.current_price < 1 ? 5 : 2 })}</span>
        <span className={change >= 0 ? 'positive' : 'negative'}>{pct(change)}</span>
        <span>${money(coin.total_volume)}</span>
        <span className="liquidity-bar"><i style={{ width: `${liquidity}%` }} /></span>
      </div>
    })}
  </div>
}

function NarrativeList({ articles }) {
  return <div className="narrative-list">{articles.slice(0, 7).map((article, index) => <a href={article.url} target="_blank" rel="noreferrer" key={`${article.url}-${index}`}>
    <span className="story-rank">{String(index + 1).padStart(2, '0')}</span><span><b>{article.title}</b><small>{article.domain} · {article.language || 'unknown'}</small></span><md-icon>north_east</md-icon>
  </a>)}</div>
}

function LetterGrid({ coins }) {
  const letters = useMemo(() => {
    const counts = new Map()
    coins.forEach(c => { const key = c.name?.[0]?.toUpperCase(); if (key) counts.set(key, (counts.get(key) || 0) + Number(c.total_volume || 0)) })
    const max = Math.max(...counts.values(), 1)
    return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => ({ letter, value: counts.get(letter) || 0, heat: (counts.get(letter) || 0) / max }))
  }, [coins])
  return <div className="letter-grid">{letters.map(item => <div key={item.letter} style={{ '--heat': item.heat }}><b>{item.letter}</b><small>{item.value ? `$${money(item.value)}` : '—'}</small></div>)}</div>
}

function TerminalDashboard({ market, narratives }) {
  const coins = market.coins || []
  const top = coins[0] || {}
  return <main className="dashboard-grid terminal-view">
    <StatusStrip market={market} />
    <Panel title="Live primitive heatmap" kicker="MARKET SEMANTICS" className="span-8"><LetterGrid coins={coins} /></Panel>
    <Panel title="Top letter leaderboard" kicker="SYMBOL FLOW" className="span-4">
      <div className="rank-list">{coins.slice(0, 8).map((coin, i) => <div key={coin.id}><span>{i + 1}</span><b>{coin.symbol?.[0]?.toUpperCase()}</b><i style={{ width: `${Math.max(8, 100 - i * 10)}%` }} /><small>{coin.symbol?.toUpperCase()}</small></div>)}</div>
    </Panel>
    <Panel title="Full market ranking" kicker="COINGECKO · LIVE" className="span-7"><AssetTable coins={coins} /></Panel>
    <Panel title="Narrative pressure" kicker="GDELT · LATEST" className="span-5"><NarrativeList articles={narratives.articles || []} /></Panel>
    <Panel title={`Primitive asset: ${top.symbol?.toUpperCase() || '—'}`} kicker="PRICE / LIQUIDITY" className="span-7">
      <div className="asset-focus"><div className="asset-glyph">{top.symbol?.[0]?.toUpperCase() || '—'}</div><div className="focus-stats"><span>PRICE<strong>${top.current_price?.toLocaleString() || '—'}</strong></span><span>MARKET CAP<strong>${money(top.market_cap)}</strong></span><span>24H VOLUME<strong>${money(top.total_volume)}</strong></span></div><Sparkline values={top.sparkline_in_7d?.price || []} tone="amber" /></div>
    </Panel>
    <Panel title="Source distribution" kicker="PROVENANCE" className="span-5"><div className="source-stack"><div><b>CoinGecko</b><span>Market, price, volume, supply</span><strong>LIVE</strong></div><div><b>GDELT</b><span>Global narrative coverage</span><strong>LIVE</strong></div><div><b>Derived</b><span>Breadth, concentration, volatility</span><strong>LOCAL</strong></div></div></Panel>
  </main>
}

function Orbit({ coins, label }) {
  return <div className="orbit" aria-label={`${label} market topology`}><div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" /><div className="orbit-core"><span>{coins[0]?.symbol?.[0]?.toUpperCase() || 'M'}</span><small>{label}</small></div>{coins.slice(1, 7).map((coin, i) => <div className={`orbit-node node-${i + 1}`} key={coin.id}><b>{coin.symbol?.toUpperCase()}</b><small>{pct(coin.price_change_percentage_24h, 1)}</small></div>)}</div>
}

function OracleDashboard({ market, narratives }) {
  const coins = market.coins || []
  const rising = [...coins].sort((a,b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0))
  const falling = [...coins].sort((a,b) => (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0))
  return <main className="oracle-layout">
    <StatusStrip market={market} />
    <section className="oracle-hero terminal-panel"><div className="oracle-index">1</div><div className="oracle-copy"><span>ABYSSAL MARKET STORM</span><h2>Liquidity convergence</h2></div><Orbit coins={coins} label="DOMINANT CORE" /><div className="storm-metrics"><span>GRAVITY INDEX <b>{(market.derived?.liquidity_concentration || 0).toFixed(3)}</b></span><span>STORM VELOCITY <b>{pct(market.derived?.weighted_change_24h)}</b></span><span>MARKET BREADTH <b>{pct((market.derived?.market_breadth || 0) * 100, 1)}</b></span><span>VOLATILITY <b>{pct(market.derived?.realized_volatility)}</b></span></div></section>
    <section className="orderbook terminal-panel"><div className="oracle-index">2</div><div className="oracle-copy"><span>NECROTIC ORDERBOOK</span><h2>Momentum, decay, resurrection</h2></div><div className="split-book"><div className="book-side buy"><h3>BUY MOMENTUM</h3>{rising.slice(0,6).map((c,i)=><div key={c.id}><b>{c.symbol?.toUpperCase()}</b><i style={{width:`${100-i*12}%`}}/><span>{pct(c.price_change_percentage_24h)}</span></div>)}</div><div className="book-core">{coins[0]?.symbol?.toUpperCase() || 'M'}<small>SPREAD<br/>{pct((rising[0]?.price_change_percentage_24h || 0) - (falling[0]?.price_change_percentage_24h || 0))}</small></div><div className="book-side sell"><h3>SELL PRESSURE</h3>{falling.slice(0,6).map((c,i)=><div key={c.id}><b>{c.symbol?.toUpperCase()}</b><i style={{width:`${100-i*12}%`}}/><span>{pct(c.price_change_percentage_24h)}</span></div>)}</div></div></section>
    <section className="oracle-hero terminal-panel veil"><div className="oracle-index">3</div><div className="oracle-copy"><span>QUANTUM MARKET VEIL</span><h2>Probabilistic market future</h2></div><Orbit coins={coins.slice().reverse()} label="PROBABILITY" /><div className="storm-metrics"><span>PROBABILITY DENSITY <b>{(market.derived?.market_breadth || 0).toFixed(3)}</b></span><span>UNCERTAINTY VOLUME <b>{(1 - (market.derived?.market_breadth || 0)).toFixed(3)}</b></span><span>REALITY FRACTURES <b>{narratives.articles?.length || 0}</b></span><span>SIGNAL COHERENCE <b>{(1 - Math.min(1, (market.derived?.realized_volatility || 0)/20)).toFixed(3)}</b></span></div></section>
  </main>
}

export default function MarketDashboards({ mode }) {
  const { market, narratives } = useMarketData()
  const [query, setQuery] = useState('')
  if (market.isLoading) return <main className="loading-state"><md-circular-progress indeterminate aria-label="Loading production market data" /><p>ESTABLISHING MARKET UPLINK</p></main>
  if (market.error) return <main className="error-state"><md-icon>cloud_off</md-icon><h1>Market uplink unavailable</h1><p>The dashboard never substitutes fabricated values. Retry CoinGecko to continue.</p><md-filled-button onClick={() => market.mutate()}>Retry source</md-filled-button></main>
  const marketData = market.data
  const narrativeData = narratives.data || { articles: [], fetched_at: marketData.fetched_at, stale: true, unavailable: true }
  const filtered = query ? { ...marketData, coins: marketData.coins.filter(c => `${c.name} ${c.symbol}`.toLowerCase().includes(query.toLowerCase())) } : marketData
  return <div className="market-workspace"><div className="workspace-toolbar"><div><span className={`live-dot ${marketData.stale || narrativeData.stale ? 'stale' : ''}`} />{marketData.stale || narrativeData.stale ? 'STALE CACHE' : 'LIVE PUBLIC FEEDS'}</div><label><md-icon>search</md-icon><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Filter assets" aria-label="Filter assets" /></label><span>UPDATED {new Date(Math.min(marketData.fetched_at, narrativeData.fetched_at) * 1000).toLocaleTimeString()}</span></div>{mode === 'terminal' ? <TerminalDashboard market={filtered} narratives={narrativeData} /> : <OracleDashboard market={filtered} narratives={narrativeData} />}</div>
}
