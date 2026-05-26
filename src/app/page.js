'use client'
import { useState, useEffect, useCallback } from 'react'

const fmt = (n, d = 4) => n == null ? '—' : Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
const fmtPct = (n) => n == null ? '—' : `${n >= 0 ? '+' : ''}${Number(n).toFixed(2)}%`
const fmtBig = (n) => {
  if (n == null) return '—'
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  return `$${n.toFixed(0)}`
}

function Card({ title, children, accent, style = {} }) {
  return (
    <div style={{ background: 'rgba(10,18,30,0.9)', border: `1px solid ${accent ? '#00f5c4' : '#1a2535'}`, borderRadius: '12px', padding: '18px', backdropFilter: 'blur(8px)', boxShadow: accent ? '0 0 24px rgba(0,245,196,0.07)' : 'none', ...style }}>
      {title && <div style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#00f5c4', marginBottom: '14px', fontFamily: "'Space Mono',monospace" }}>{title}</div>}
      {children}
    </div>
  )
}

function Row({ label, value, bullish, mono = false }) {
  const color = bullish === true ? '#00f5c4' : bullish === false ? '#ff4d6d' : bullish === 'warn' ? '#ffd166' : '#e0eaf5'
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #0f1e30' }}>
      <span style={{ fontSize: '11px', color: '#8899aa' }}>{label}</span>
      <span style={{ fontSize: '11px', fontWeight: 700, color, fontFamily: mono ? "'Space Mono',monospace" : 'inherit' }}>{value}</span>
    </div>
  )
}

function Bar({ value, max = 100, label, showVal = true }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const color = pct > 65 ? '#00f5c4' : pct < 35 ? '#ff4d6d' : '#ffd166'
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', color: '#8899aa' }}>{label}</span>
        {showVal && <span style={{ fontSize: '11px', color, fontWeight: 700 }}>{typeof value === 'number' ? value.toFixed(0) : value}</span>}
      </div>
      <div style={{ height: '5px', background: '#0f1e30', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${color}99,${color})`, borderRadius: '3px', transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

function Gauge({ value }) {
  const pct = Math.max(0, Math.min(1, value / 100))
  const angle = -135 + pct * 270
  const color = pct < 0.33 ? '#ff4d6d' : pct < 0.62 ? '#ffd166' : '#00f5c4'
  const label = pct >= 0.62 ? 'BULLISH' : pct <= 0.38 ? 'BEARISH' : 'NEUTRAL'
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="100" height="66" viewBox="0 0 100 66">
        <path d="M 12 60 A 38 38 0 0 1 88 60" fill="none" stroke="#0f1e30" strokeWidth="7" strokeLinecap="round" />
        <path d="M 12 60 A 38 38 0 0 1 88 60" fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${pct * 119} 119`} />
        <g transform={`rotate(${angle},50,60)`}>
          <line x1="50" y1="60" x2="50" y2="28" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <circle cx="50" cy="60" r="4" fill={color} />
        </g>
      </svg>
      <div style={{ fontSize: '22px', fontWeight: 800, color, marginTop: '-6px', fontFamily: "'Space Mono',monospace" }}>{Math.round(value)}</div>
      <div style={{ fontSize: '9px', color, letterSpacing: '2px', fontWeight: 700, marginTop: '2px' }}>{label}</div>
    </div>
  )
}

function MiniChart({ prices, color }) {
  if (!prices || prices.length < 2) return <div style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2a3a4a', fontSize: '11px' }}>No data</div>
  const rising = prices[prices.length - 1] >= prices[0]
  const c = color || (rising ? '#00f5c4' : '#ff4d6d')
  const min = Math.min(...prices), max = Math.max(...prices), range = max - min || 1
  const pts = prices.map((v, i) => `${(i / (prices.length - 1)) * 398},${98 - ((v - min) / range) * 94}`).join(' ')
  return (
    <svg viewBox="0 0 400 100" style={{ width: '100%', height: '90px' }}>
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.25" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,100 ${pts} 398,100`} fill="url(#grad)" />
      <polyline points={pts} fill="none" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function FibLevels({ fib, price }) {
  if (!fib) return <div style={{ color: '#445566', fontSize: '11px' }}>No data</div>
  const levels = [
    { label: 'Ext 1.618', val: fib.ext1618, type: 'resistance' },
    { label: 'Ext 1.272', val: fib.ext1272, type: 'resistance' },
    { label: 'Fib 0.000 (High)', val: fib.r1000 + (fib.ext1618 - fib.r1000) * 0, type: 'resistance' },
    { label: 'Fib 0.236', val: fib.r236, type: 'resistance' },
    { label: 'Fib 0.382', val: fib.r382, type: 'neutral' },
    { label: 'Fib 0.500', val: fib.r500, type: 'neutral' },
    { label: 'Fib 0.618 ★', val: fib.r618, type: 'support' },
    { label: 'Fib 0.786', val: fib.r786, type: 'support' },
    { label: 'Fib 1.000 (Low)', val: fib.r1000, type: 'support' },
  ].sort((a, b) => b.val - a.val)

  return (
    <div>
      {levels.map(({ label, val, type }) => {
        const isNearest = price && Math.abs(val - price) / price < 0.02
        const typeColor = type === 'resistance' ? '#ff4d6d' : type === 'support' ? '#00f5c4' : '#ffd166'
        return (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #0f1e30', background: isNearest ? 'rgba(0,245,196,0.04)' : 'transparent' }}>
            <span style={{ fontSize: '11px', color: isNearest ? '#00f5c4' : '#8899aa' }}>{label}{isNearest ? ' ◀ near' : ''}</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: typeColor, fontFamily: "'Space Mono',monospace" }}>${fmt(val, 4)}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('overview')
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [lastFetched, setLastFetched] = useState(null)
  const [pos, setPos] = useState({ capital: '10000', risk: '2', entry: '', stop: '' })
  const [journal, setJournal] = useState([])
  const [note, setNote] = useState('')
  const [noteSentiment, setNoteSentiment] = useState('neutral')

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/xrp')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
      setLastFetched(new Date())
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchData()
    const t = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(t)
  }, [fetchData])

  const getAI = async () => {
    if (!data) return
    setAiLoading(true); setAiText('')
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1200,
          messages: [{
            role: 'user',
            content: `You are a professional XRP analyst. Provide a structured institutional-grade trading analysis using this live data:

Price: $${fmt(data.price, 4)} | 24h: ${fmtPct(data.change24h)} | 7d: ${fmtPct(data.change7d)} | 30d: ${fmtPct(data.change30d)}
Volume: ${fmtBig(data.volume24h)} | MCap: ${fmtBig(data.marketCap)} | Vol/MCap: ${data.volMcapRatio?.toFixed(2)}%
RSI(14): ${data.rsi14 ?? 'N/A'} | RSI(7): ${data.rsi7 ?? 'N/A'} | MA Signal: ${data.maSignal?.toUpperCase()} | VWAP: ${data.vwapSignal?.toUpperCase()}
BB: Upper $${fmt(data.bb?.upper, 4)} / Lower $${fmt(data.bb?.lower, 4)} | Squeeze: ${data.bbSqueeze ? 'YES' : 'No'} | Position: ${data.bbPosition}
Fib 0.618: $${fmt(data.fib?.r618, 4)} | 0.382: $${fmt(data.fib?.r382, 4)} | 0.786: $${fmt(data.fib?.r786, 4)}
BTC: $${fmt(data.btcPrice, 0)} (${fmtPct(data.btcChange24h)}) | BTC Dom: ${data.btcDom?.toFixed(1)}% | XRP Alpha: ${fmtPct(data.xrpVsBtc)}
Fear & Greed: ${data.fngValue} (${data.fngLabel}) | Score: ${data.score}/100

Respond with these bold headers:
**1. MARKET STRUCTURE**
**2. KEY SIGNALS**
**3. CRITICAL PRICE LEVELS**
**4. TRADE SCENARIOS**
**5. DERIVATIVES & SENTIMENT**
**6. RECOMMENDATION**

Be direct, specific, cite actual prices. Professional tone.`
          }]
        })
      })
      const j = await res.json()
      setAiText(j.content?.find(b => b.type === 'text')?.text || 'Unavailable.')
    } catch { setAiText('⚠️ Failed. Check API key in environment variables.') }
    finally { setAiLoading(false) }
  }

  const posResult = (() => {
    const c = parseFloat(pos.capital), r = parseFloat(pos.risk), e = parseFloat(pos.entry), s = parseFloat(pos.stop)
    if (!c || !r || !e || !s || e === s) return null
    const rAmt = (c * r) / 100
    const units = rAmt / Math.abs(e - s)
    const rrRatio = e && s && data?.price ? Math.abs((data.price * 1.05 - e) / (e - s)) : null
    return { rAmt: rAmt.toFixed(2), units: units.toFixed(0), total: (units * e).toFixed(2), rr: rrRatio?.toFixed(2) }
  })()

  const tabs = ['overview', 'technicals', 'macro', 'fibonacci', 'position', 'journal', 'ai']
  const scoreColor = data ? (data.score >= 62 ? '#00f5c4' : data.score <= 38 ? '#ff4d6d' : '#ffd166') : '#445566'

  return (
    <div style={{ minHeight: '100vh', background: '#050c14', color: '#e0eaf5', fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(0,245,196,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,245,196,0.025) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
      <div style={{ position: 'fixed', top: '-200px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(0,245,196,0.05) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1080px', margin: '0 auto', padding: '20px 14px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg,#00f5c4,#006c9e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 900, color: '#050c14' }}>✕</div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' }}>XRP <span style={{ color: '#00f5c4' }}>Command</span> <span style={{ fontSize: '12px', background: 'rgba(0,245,196,0.1)', color: '#00f5c4', border: '1px solid #00f5c433', borderRadius: '4px', padding: '2px 7px', fontWeight: 700, letterSpacing: '1px', verticalAlign: 'middle' }}>PRO</span></div>
              <div style={{ fontSize: '10px', color: '#8899aa', fontFamily: "'Space Mono',monospace", letterSpacing: '1px' }}>INSTITUTIONAL TRADING INTELLIGENCE</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {loading && !data && <div style={{ color: '#00f5c4', fontSize: '13px' }}>Fetching live data…</div>}
            {data && (
              <>
                <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-1px', color: '#e0eaf5' }}>${fmt(data.price, 4)}</div>
                <div style={{ fontSize: '13px', color: data.change24h >= 0 ? '#00f5c4' : '#ff4d6d', fontWeight: 600 }}>{fmtPct(data.change24h)} 24h &nbsp;·&nbsp; <span style={{ color: scoreColor }}>{data.score}/100</span></div>
                {lastFetched && <div style={{ fontSize: '9px', color: '#2a3a4a', marginTop: '2px' }}>Live · {lastFetched.toLocaleTimeString()} · refreshes every 5m</div>}
              </>
            )}
            {error && <div style={{ color: '#ff4d6d', fontSize: '11px', maxWidth: '200px' }}>{error}</div>}
            <button onClick={fetchData} disabled={loading} style={{ marginTop: '5px', padding: '4px 12px', borderRadius: '6px', border: '1px solid #1a2535', background: 'transparent', color: '#8899aa', fontSize: '10px', cursor: 'pointer' }}>{loading ? '…' : '↻ Refresh'}</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '3px', marginBottom: '16px', background: 'rgba(10,18,30,0.8)', padding: '4px', borderRadius: '10px', border: '1px solid #1a2535', overflowX: 'auto' }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: '0 0 auto', padding: '7px 10px', borderRadius: '7px', border: 'none', cursor: 'pointer', background: tab === t ? '#00f5c4' : 'transparent', color: tab === t ? '#050c14' : '#8899aa', fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', fontFamily: "'Space Mono',monospace", transition: 'all 0.15s', whiteSpace: 'nowrap' }}>{t === 'ai' ? 'AI' : t}</button>
          ))}
        </div>

        {/* ══ OVERVIEW ══ */}
        {tab === 'overview' && (
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: '10px' }}>
              {data ? [
                { l: '7d', v: fmtPct(data.change7d), c: (data.change7d ?? 0) >= 0 ? '#00f5c4' : '#ff4d6d' },
                { l: '30d', v: fmtPct(data.change30d), c: (data.change30d ?? 0) >= 0 ? '#00f5c4' : '#ff4d6d' },
                { l: 'Volume', v: fmtBig(data.volume24h), c: '#e0eaf5' },
                { l: 'Market Cap', v: fmtBig(data.marketCap), c: '#e0eaf5' },
                { l: '24h High', v: `$${fmt(data.high24h, 4)}`, c: '#00f5c4' },
                { l: '24h Low', v: `$${fmt(data.low24h, 4)}`, c: '#ff4d6d' },
                { l: 'Fear & Greed', v: data.fngValue != null ? `${data.fngValue} · ${data.fngLabel}` : '—', c: data.fngValue > 60 ? '#00f5c4' : data.fngValue < 35 ? '#ff4d6d' : '#ffd166' },
                { l: 'BTC Dom', v: data.btcDom != null ? `${data.btcDom.toFixed(1)}%` : '—', c: '#e0eaf5' },
              ].map(({ l, v, c }) => (
                <Card key={l} style={{ padding: '12px' }}>
                  <div style={{ fontSize: '9px', color: '#8899aa', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px' }}>{l}</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: c }}>{v}</div>
                </Card>
              )) : Array(8).fill(0).map((_, i) => <Card key={i} style={{ padding: '12px', opacity: 0.3 }}><div style={{ height: '28px', background: '#1a2535', borderRadius: '4px' }} /></Card>)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px' }}>
              <Card title="30-Day Price History">
                {data ? <MiniChart prices={data.chartPrices} /> : <div style={{ height: '90px', background: '#0f1e30', borderRadius: '6px' }} />}
              </Card>
              <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '140px' }}>
                {data ? <Gauge value={data.score} /> : <div style={{ width: '100px', height: '66px', background: '#0f1e30', borderRadius: '6px' }} />}
              </Card>
            </div>

            {data && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Card title="Signal Summary">
                  <Row label="MA Trend" value={data.maSignal?.toUpperCase()} bullish={data.maSignal === 'bullish'} />
                  <Row label="VWAP" value={data.vwapSignal?.toUpperCase()} bullish={data.vwapSignal === 'bullish'} />
                  <Row label="RSI Signal" value={data.rsiSignal?.toUpperCase()} bullish={data.rsiSignal === 'bullish' || data.rsiSignal === 'oversold' ? true : data.rsiSignal === 'bearish' || data.rsiSignal === 'overbought' ? false : null} />
                  <Row label="BB Position" value={data.bbPosition?.replace('_', ' ').toUpperCase()} bullish={data.bbPosition === 'below_lower' ? true : data.bbPosition === 'above_upper' ? false : null} />
                  <Row label="BB Squeeze" value={data.bbSqueeze ? '⚠️ YES — watch for breakout' : 'No'} bullish={data.bbSqueeze ? 'warn' : null} />
                  <Row label="XRP vs BTC" value={fmtPct(data.xrpVsBtc)} bullish={data.xrpVsBtc >= 0} />
                </Card>
                <Card title="ATH & Supply">
                  <Row label="ATH" value={`$${fmt(data.ath, 4)}`} bullish={null} mono />
                  <Row label="From ATH" value={fmtPct(data.athPct)} bullish={false} />
                  <Row label="Circulating" value={data.circulatingSupply ? `${(data.circulatingSupply / 1e9).toFixed(1)}B` : '—'} bullish={null} />
                  <Row label="Total Supply" value={data.totalSupply ? `${(data.totalSupply / 1e9).toFixed(1)}B` : '—'} bullish={null} />
                  <Row label="Vol/MCap" value={data.volMcapRatio ? `${data.volMcapRatio.toFixed(2)}%` : '—'} bullish={data.volMcapRatio > 5} />
                  <Row label="24h Range Width" value={data.rangeWidth ? `${data.rangeWidth.toFixed(2)}%` : '—'} bullish={null} />
                </Card>
              </div>
            )}
          </div>
        )}

        {/* ══ TECHNICALS ══ */}
        {tab === 'technicals' && data && (
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Card title="Moving Averages" accent>
                <Row label="Price" value={`$${fmt(data.price, 4)}`} bullish={null} mono />
                <Row label="MA7" value={data.ma7 ? `$${fmt(data.ma7, 4)}` : '—'} bullish={data.price > data.ma7} mono />
                <Row label="MA25" value={data.ma25 ? `$${fmt(data.ma25, 4)}` : '—'} bullish={data.price > data.ma25} mono />
                <Row label="MA99" value={data.ma99 ? `$${fmt(data.ma99, 4)}` : '—'} bullish={data.price > data.ma99} mono />
                <Row label="VWAP" value={data.vwap ? `$${fmt(data.vwap, 4)}` : '—'} bullish={data.price > data.vwap} mono />
                <Row label="MA Signal" value={data.maSignal?.toUpperCase()} bullish={data.maSignal === 'bullish'} />
              </Card>

              <Card title="Oscillators">
                <Row label="RSI (14)" value={data.rsi14 != null ? `${data.rsi14}` : '—'} bullish={data.rsi14 < 30 ? true : data.rsi14 > 70 ? false : null} mono />
                <Row label="RSI Status" value={data.rsiSignal?.toUpperCase()} bullish={data.rsiSignal === 'bullish' || data.rsiSignal === 'oversold' ? true : data.rsiSignal === 'bearish' || data.rsiSignal === 'overbought' ? false : null} />
                <Row label="RSI (7)" value={data.rsi7 != null ? `${data.rsi7}` : '—'} bullish={data.rsi7 < 40 ? true : data.rsi7 > 65 ? false : null} mono />
              </Card>
            </div>

            <Card title="Bollinger Bands">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <Row label="Upper Band" value={data.bb ? `$${fmt(data.bb.upper, 4)}` : '—'} bullish={null} mono />
                  <Row label="Middle (MA20)" value={data.bb ? `$${fmt(data.bb.middle, 4)}` : '—'} bullish={data.price > data.bb?.middle} mono />
                  <Row label="Lower Band" value={data.bb ? `$${fmt(data.bb.lower, 4)}` : '—'} bullish={null} mono />
                </div>
                <div>
                  <Row label="Band Width" value={data.bb ? `${data.bb.width.toFixed(2)}%` : '—'} bullish={null} />
                  <Row label="Squeeze Alert" value={data.bbSqueeze ? '⚠️ SQUEEZE' : 'Normal'} bullish={data.bbSqueeze ? 'warn' : null} />
                  <Row label="Price Position" value={data.bbPosition?.replace(/_/g, ' ').toUpperCase()} bullish={data.bbPosition === 'below_lower' ? true : data.bbPosition === 'above_upper' ? false : null} />
                </div>
              </div>
            </Card>

            <Card title="Momentum Bars">
              {data.rsi14 != null && <Bar label="RSI (14)" value={data.rsi14} />}
              <Bar label="Signal Score" value={data.score} />
              <Bar label="ATH Recovery" value={Math.max(0, 100 + (data.athPct || 0))} />
              {data.volMcapRatio != null && <Bar label="Volume Activity" value={Math.min(data.volMcapRatio * 5, 100)} />}
            </Card>
          </div>
        )}

        {/* ══ MACRO ══ */}
        {tab === 'macro' && data && (
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Card title="BTC Context" accent>
                <Row label="BTC Price" value={`$${fmt(data.btcPrice, 0)}`} bullish={null} mono />
                <Row label="BTC 24h" value={fmtPct(data.btcChange24h)} bullish={data.btcChange24h >= 0} />
                <Row label="BTC Dominance" value={data.btcDom ? `${data.btcDom.toFixed(1)}%` : '—'} bullish={null} />
                <Row label="XRP Alpha vs BTC" value={fmtPct(data.xrpVsBtc)} bullish={data.xrpVsBtc >= 0} />
                <div style={{ marginTop: '10px', padding: '10px', background: '#0a1220', borderRadius: '8px', fontSize: '11px', color: '#8899aa', lineHeight: 1.6 }}>
                  {data.btcDom > 55 ? '⚠️ High BTC dominance — altcoin headwinds. XRP may underperform.' : data.btcDom < 45 ? '✅ Low BTC dominance — altcoin season conditions favorable for XRP.' : 'ℹ️ Neutral BTC dominance. XRP trading on its own fundamentals.'}
                </div>
              </Card>

              <Card title="Fear & Greed Index">
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div style={{ fontSize: '48px', fontWeight: 800, color: data.fngValue > 60 ? '#00f5c4' : data.fngValue < 35 ? '#ff4d6d' : '#ffd166', fontFamily: "'Space Mono',monospace" }}>{data.fngValue ?? '—'}</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#8899aa', marginTop: '4px' }}>{data.fngLabel ?? '—'}</div>
                  {data.fngYesterday != null && <div style={{ fontSize: '11px', color: '#445566', marginTop: '6px' }}>Yesterday: {data.fngYesterday} &nbsp;·&nbsp; Change: {data.fngValue > data.fngYesterday ? '▲' : '▼'} {Math.abs(data.fngValue - data.fngYesterday)} pts</div>}
                </div>
                <div style={{ height: '8px', background: '#0f1e30', borderRadius: '4px', overflow: 'hidden', marginTop: '8px' }}>
                  <div style={{ height: '100%', width: `${data.fngValue}%`, background: data.fngValue > 60 ? 'linear-gradient(90deg,#00f5c4,#00b894)' : data.fngValue < 35 ? 'linear-gradient(90deg,#ff4d6d,#c0392b)' : 'linear-gradient(90deg,#ffd166,#f39c12)', borderRadius: '4px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '9px', color: '#2a3a4a' }}>
                  <span>Extreme Fear</span><span>Neutral</span><span>Extreme Greed</span>
                </div>
              </Card>
            </div>

            <Card title="Market Context Signals">
              <Row label="BTC Dominance Trend" value={data.btcDom > 55 ? 'HIGH — Alt headwind' : data.btcDom < 45 ? 'LOW — Alt season' : 'NEUTRAL'} bullish={data.btcDom < 50} />
              <Row label="XRP Outperforming BTC" value={data.xrpVsBtc >= 0 ? 'YES — Relative strength' : 'NO — Underperforming'} bullish={data.xrpVsBtc >= 0} />
              <Row label="Market Sentiment" value={data.fngLabel?.toUpperCase() ?? '—'} bullish={data.fngValue > 55 ? true : data.fngValue < 40 ? false : null} />
              <Row label="Sentiment Momentum" value={data.fngYesterday != null ? (data.fngValue > data.fngYesterday ? `▲ Improving (+${data.fngValue - data.fngYesterday})` : `▼ Deteriorating (${data.fngValue - data.fngYesterday})`) : '—'} bullish={data.fngValue > data.fngYesterday} />
              <Row label="Volume Spike" value={data.volMcapRatio > 8 ? '⚠️ Elevated — watch for reversal' : data.volMcapRatio > 4 ? 'Above average' : 'Normal'} bullish={data.volMcapRatio > 4 && data.change24h > 0 ? true : null} />
            </Card>
          </div>
        )}

        {/* ══ FIBONACCI ══ */}
        {tab === 'fibonacci' && data && (
          <div style={{ display: 'grid', gap: '12px' }}>
            <Card title="Fibonacci Retracement & Extension Levels" accent>
              <div style={{ fontSize: '11px', color: '#8899aa', marginBottom: '14px', lineHeight: 1.5 }}>
                Calculated from 30-day high/low range. Green = support levels, Red = resistance levels. ★ = golden ratio (0.618) — the most watched level by professional traders.
              </div>
              <FibLevels fib={data.fib} price={data.price} />
            </Card>

            <Card title="How to Use These Levels">
              {[
                ['0.236', 'Shallow retracement — momentum still strong. Bounce here signals trend continuation.'],
                ['0.382', 'Common retracement in strong trends. Buy zone in bull markets.'],
                ['0.500', 'Psychological midpoint. Not a Fibonacci ratio but widely watched.'],
                ['0.618 ★', 'The "golden ratio" — deepest common retracement. Strongest support/resistance. Professional traders enter here.'],
                ['0.786', 'Deep retracement — trend may be reversing. Caution zone.'],
                ['1.272 Ext', 'First extension target. Common profit-taking level in breakouts.'],
                ['1.618 Ext', 'Full golden ratio extension. Major target in strong breakout moves.'],
              ].map(([level, desc]) => (
                <div key={level} style={{ display: 'flex', gap: '10px', padding: '8px 0', borderBottom: '1px solid #0f1e30' }}>
                  <span style={{ fontSize: '11px', color: '#00f5c4', fontFamily: "'Space Mono',monospace", minWidth: '60px', fontWeight: 700 }}>{level}</span>
                  <span style={{ fontSize: '11px', color: '#8899aa', lineHeight: 1.5 }}>{desc}</span>
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* ══ POSITION ══ */}
        {tab === 'position' && (
          <div style={{ display: 'grid', gap: '12px' }}>
            <Card title="Position Size Calculator" accent>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                {[
                  { label: 'Capital ($)', key: 'capital', ph: '10000' },
                  { label: 'Risk %', key: 'risk', ph: '2' },
                  { label: 'Entry Price ($)', key: 'entry', ph: data ? fmt(data.price, 4) : '0.0000' },
                  { label: 'Stop Loss ($)', key: 'stop', ph: '0.0000' },
                ].map(({ label, key, ph }) => (
                  <div key={key}>
                    <div style={{ fontSize: '10px', color: '#8899aa', marginBottom: '4px', letterSpacing: '1px' }}>{label}</div>
                    <input type="number" placeholder={ph} value={pos[key]} onChange={e => setPos(p => ({ ...p, [key]: e.target.value }))}
                      style={{ width: '100%', padding: '8px 10px', background: '#0a1220', border: '1px solid #1a2535', borderRadius: '6px', color: '#e0eaf5', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
              {posResult ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
                  {[
                    { l: '$ at Risk', v: `$${posResult.rAmt}`, c: '#ff4d6d' },
                    { l: 'XRP Units', v: posResult.units, c: '#00f5c4' },
                    { l: 'Position Value', v: `$${posResult.total}`, c: '#ffd166' },
                    { l: 'Est. R:R', v: posResult.rr ? `1:${posResult.rr}` : '—', c: parseFloat(posResult.rr) >= 2 ? '#00f5c4' : '#ff4d6d' },
                  ].map(({ l, v, c }) => (
                    <div key={l} style={{ textAlign: 'center', padding: '10px 6px', background: '#0a1220', borderRadius: '8px', border: '1px solid #1a2535' }}>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: c }}>{v}</div>
                      <div style={{ fontSize: '9px', color: '#8899aa', marginTop: '3px' }}>{l}</div>
                    </div>
                  ))}
                </div>
              ) : <div style={{ padding: '12px', background: '#0a1220', borderRadius: '8px', color: '#8899aa', fontSize: '12px', textAlign: 'center' }}>Fill in all fields to calculate</div>}
            </Card>

            <Card title="Professional Risk Rules">
              {[
                ['✅', '1-2% Max Risk', 'Risk no more than 1-2% of total capital on a single XRP trade regardless of conviction'],
                ['✅', 'Minimum 1:2 R:R', 'Never enter a trade unless your target gives at least 2× what you risk — calculator above shows this'],
                ['✅', '10% Position Cap', 'No single position should be more than 10% of your portfolio, including highly correlated assets'],
                ['⚠️', 'BTC Correlation', 'XRP has ~0.7-0.8 BTC correlation — if you hold BTC too, your real risk is higher than it appears'],
                ['⚠️', 'Fib 0.618 Stops', 'Professional traders often place stops just beyond key Fibonacci levels — check the Fibonacci tab'],
                ['ℹ️', 'Liquidity Hours', 'XRP volume peaks during US/EU overlap (13:00-17:00 UTC) — tighter spreads, easier entries/exits'],
                ['ℹ️', 'Regulatory Risk', 'XRP carries unique legal risk from ongoing Ripple/SEC developments — size accordingly'],
              ].map(([icon, rule, desc]) => (
                <div key={rule} style={{ display: 'flex', gap: '10px', padding: '9px 0', borderBottom: '1px solid #0f1e30' }}>
                  <span style={{ fontSize: '14px' }}>{icon}</span>
                  <div><div style={{ fontSize: '12px', fontWeight: 700 }}>{rule}</div><div style={{ fontSize: '11px', color: '#8899aa', marginTop: '2px', lineHeight: 1.5 }}>{desc}</div></div>
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* ══ JOURNAL ══ */}
        {tab === 'journal' && (
          <div style={{ display: 'grid', gap: '12px' }}>
            <Card title="Log Trade Note" accent>
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Trade rationale, setup details, key levels, risk/reward thinking…"
                style={{ width: '100%', minHeight: '90px', background: '#0a1220', border: '1px solid #1a2535', borderRadius: '8px', color: '#e0eaf5', fontSize: '13px', padding: '10px', resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginBottom: '10px', fontFamily: 'inherit', lineHeight: 1.6 }} />
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {['bullish', 'neutral', 'bearish'].map(s => {
                  const c = s === 'bullish' ? '#00f5c4' : s === 'bearish' ? '#ff4d6d' : '#ffd166'
                  return <button key={s} onClick={() => setNoteSentiment(s)} style={{ padding: '5px 12px', borderRadius: '6px', border: `1px solid ${noteSentiment === s ? c : '#1a2535'}`, background: noteSentiment === s ? `rgba(${s === 'bullish' ? '0,245,196' : s === 'bearish' ? '255,77,109' : '255,209,102'},0.1)` : 'transparent', color: c, fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>{s.toUpperCase()}</button>
                })}
                <button onClick={() => { if (!note.trim()) return; setJournal(p => [{ id: Date.now(), date: new Date().toLocaleString(), note, sentiment: noteSentiment, price: data?.price, score: data?.score }, ...p]); setNote('') }}
                  style={{ marginLeft: 'auto', padding: '6px 18px', borderRadius: '6px', border: 'none', background: '#00f5c4', color: '#050c14', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>LOG ENTRY</button>
              </div>
            </Card>
            {journal.length === 0
              ? <div style={{ textAlign: 'center', padding: '40px', color: '#2a3a4a', fontSize: '13px' }}>No entries yet. Document your trade reasoning above.</div>
              : journal.map(e => {
                const c = e.sentiment === 'bullish' ? '#00f5c4' : e.sentiment === 'bearish' ? '#ff4d6d' : '#ffd166'
                return (
                  <Card key={e.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: c, letterSpacing: '1px' }}>{e.sentiment?.toUpperCase()}</span>
                        {e.score && <span style={{ fontSize: '10px', color: '#445566' }}>Score: {e.score}/100</span>}
                      </div>
                      <span style={{ fontSize: '10px', color: '#2a3a4a' }}>{e.date}{e.price ? ` · $${fmt(e.price, 4)}` : ''}</span>
                    </div>
                    <div style={{ fontSize: '13px', lineHeight: 1.7, color: '#b0c4d8' }}>{e.note}</div>
                  </Card>
                )
              })}
          </div>
        )}

        {/* ══ AI ══ */}
        {tab === 'ai' && (
          <div style={{ display: 'grid', gap: '12px' }}>
            <Card accent>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#00f5c4' }}>Institutional AI Analysis</div>
                  <div style={{ fontSize: '11px', color: '#8899aa', marginTop: '2px' }}>Claude · Live data · RSI · Bollinger · Fibonacci · Macro · Sentiment</div>
                </div>
                <button onClick={getAI} disabled={aiLoading || !data} style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', background: aiLoading || !data ? '#1a2535' : 'linear-gradient(135deg,#00f5c4,#00b894)', color: '#050c14', fontWeight: 800, fontSize: '12px', cursor: aiLoading || !data ? 'not-allowed' : 'pointer', letterSpacing: '0.5px' }}>
                  {aiLoading ? '⏳ Analyzing…' : '🤖 Run Full Analysis'}
                </button>
              </div>
              {!aiText && !aiLoading && <div style={{ padding: '30px', textAlign: 'center', color: '#2a3a4a', fontSize: '12px', border: '1px dashed #1a2535', borderRadius: '8px' }}>{data ? 'Analyzes RSI, Bollinger Bands, Fibonacci levels, BTC correlation, Fear & Greed, and more' : 'Load market data first'}</div>}
              {aiLoading && <div style={{ padding: '30px', textAlign: 'center' }}><div style={{ fontSize: '12px', color: '#00f5c4', marginBottom: '10px' }}>Running institutional analysis…</div><div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>{[0,1,2].map(i => <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f5c4', animation: `pulse 1.2s ${i*0.2}s infinite` }} />)}</div></div>}
              {aiText && (
                <div style={{ fontSize: '13px', lineHeight: 1.8, color: '#b0c4d8' }}>
                  {aiText.split('\n').map((line, i) => {
                    if (/^\*\*\d\./.test(line)) return <div key={i} style={{ color: '#00f5c4', fontWeight: 700, fontSize: '11px', letterSpacing: '1.5px', marginTop: '20px', marginBottom: '8px', borderLeft: '3px solid #00f5c4', paddingLeft: '10px' }}>{line.replace(/\*\*/g, '')}</div>
                    if (line.trim().startsWith('-')) return <div key={i} style={{ paddingLeft: '12px', marginBottom: '3px', color: '#b0c4d8' }}>{line}</div>
                    if (line.trim() === '') return <div key={i} style={{ height: '4px' }} />
                    return <div key={i} style={{ marginBottom: '3px' }}>{line}</div>
                  })}
                </div>
              )}
            </Card>
          </div>
        )}

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '9px', color: '#1a2535', letterSpacing: '1px' }}>
          XRP COMMAND PRO · COINGECKO · ALTERNATIVE.ME · ANTHROPIC CLAUDE · NOT FINANCIAL ADVICE
        </div>
      </div>

      <style>{`
        @keyframes pulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1)}}
        *{box-sizing:border-box}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
        button,textarea,input{font-family:inherit}
        textarea::placeholder,input::placeholder{color:#2a3a4a}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#0a0f1a}
        ::-webkit-scrollbar-thumb{background:#1a2535;border-radius:2px}
      `}</style>
    </div>
  )
}
