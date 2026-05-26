export const dynamic = 'force-dynamic'

const fmt = (n, d = 4) => n == null ? 'N/A' : Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
const fmtPct = (n) => n == null ? 'N/A' : `${n >= 0 ? '+' : ''}${Number(n).toFixed(2)}%`
const fmtBig = (n) => {
  if (n == null) return 'N/A'
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  return `$${n.toFixed(0)}`
}

function buildEmailHTML(d, analysis) {
  const scoreColor = d.score >= 62 ? '#00c896' : d.score <= 38 ? '#ff4d6d' : '#ffd166'
  const scoreLabel = d.score >= 62 ? 'BULLISH' : d.score <= 38 ? 'BEARISH' : 'NEUTRAL'
  const priceColor = d.change24h >= 0 ? '#00c896' : '#ff4d6d'
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const sections = analysis.split('\n').map(line => {
    if (/^\*\*\d\./.test(line)) return `<h3 style="color:#00c896;font-size:13px;letter-spacing:1px;margin:20px 0 8px;text-transform:uppercase;border-left:3px solid #00c896;padding-left:10px">${line.replace(/\*\*/g, '')}</h3>`
    if (line.trim().startsWith('-') || line.trim().startsWith('•')) return `<p style="margin:4px 0 4px 14px;color:#b0c4d8;font-size:13px">${line}</p>`
    if (line.trim() === '') return '<br>'
    return `<p style="margin:4px 0;color:#b0c4d8;font-size:13px;line-height:1.7">${line}</p>`
  }).join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0f1a;font-family:'Helvetica Neue',Arial,sans-serif">
<div style="max-width:620px;margin:0 auto;padding:20px">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#0d1f35,#0a1628);border:1px solid #1a2e47;border-radius:12px;padding:24px;margin-bottom:16px;text-align:center">
    <div style="display:inline-block;background:linear-gradient(135deg,#00c896,#006c9e);border-radius:50%;width:40px;height:40px;line-height:40px;font-size:20px;font-weight:900;color:#050c14;margin-bottom:10px">✕</div>
    <h1 style="margin:0;color:#e0eaf5;font-size:22px;font-weight:800;letter-spacing:-0.5px">XRP Command <span style="color:#00c896">Pro</span></h1>
    <p style="margin:4px 0 0;color:#8899aa;font-size:11px;letter-spacing:2px;text-transform:uppercase">Daily Trading Intelligence Briefing</p>
    <p style="margin:8px 0 0;color:#445566;font-size:11px">${date}</p>
  </div>

  <!-- Price Hero -->
  <div style="background:#0d1f35;border:1px solid #1a2e47;border-radius:12px;padding:20px;margin-bottom:16px">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
      <div>
        <div style="font-size:11px;color:#8899aa;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">XRP / USD</div>
        <div style="font-size:36px;font-weight:800;color:#e0eaf5;letter-spacing:-1px">$${fmt(d.price, 4)}</div>
        <div style="font-size:14px;color:${priceColor};font-weight:700;margin-top:2px">${fmtPct(d.change24h)} past 24 hours</div>
      </div>
      <div style="text-align:center;background:#0a1220;border-radius:10px;padding:14px 20px;border:1px solid ${scoreColor}33">
        <div style="font-size:28px;font-weight:800;color:${scoreColor}">${d.score}</div>
        <div style="font-size:9px;color:#8899aa;letter-spacing:1px">SIGNAL SCORE</div>
        <div style="font-size:11px;font-weight:800;color:${scoreColor};margin-top:2px">${scoreLabel}</div>
      </div>
    </div>
  </div>

  <!-- Stat Grid -->
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px">
    ${[
      ['7d Change', fmtPct(d.change7d), d.change7d >= 0 ? '#00c896' : '#ff4d6d'],
      ['30d Change', fmtPct(d.change30d), d.change30d >= 0 ? '#00c896' : '#ff4d6d'],
      ['24h Volume', fmtBig(d.volume24h), '#e0eaf5'],
      ['Market Cap', fmtBig(d.marketCap), '#e0eaf5'],
      ['RSI (14)', d.rsi14 != null ? `${d.rsi14} — ${d.rsi14 < 30 ? 'OVERSOLD' : d.rsi14 > 70 ? 'OVERBOUGHT' : 'NEUTRAL'}` : 'N/A', d.rsi14 < 30 ? '#00c896' : d.rsi14 > 70 ? '#ff4d6d' : '#ffd166'],
      ['Fear & Greed', d.fngValue != null ? `${d.fngValue} — ${d.fngLabel}` : 'N/A', d.fngValue > 60 ? '#00c896' : d.fngValue < 35 ? '#ff4d6d' : '#ffd166'],
    ].map(([l, v, c]) => `
      <div style="background:#0d1f35;border:1px solid #1a2e47;border-radius:8px;padding:12px">
        <div style="font-size:9px;color:#8899aa;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">${l}</div>
        <div style="font-size:13px;font-weight:700;color:${c}">${v}</div>
      </div>`).join('')}
  </div>

  <!-- BTC / Macro Context -->
  <div style="background:#0d1f35;border:1px solid #1a2e47;border-radius:12px;padding:18px;margin-bottom:16px">
    <div style="font-size:10px;color:#00c896;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px">Macro Context</div>
    <table style="width:100%;border-collapse:collapse">
      ${[
        ['BTC Price', `$${fmt(d.btcPrice, 0)}`, null],
        ['BTC 24h Change', fmtPct(d.btcChange24h), d.btcChange24h >= 0],
        ['BTC Dominance', d.btcDom != null ? `${d.btcDom.toFixed(1)}%` : 'N/A', null],
        ['XRP vs BTC (alpha)', d.xrpVsBtc != null ? fmtPct(d.xrpVsBtc) : 'N/A', d.xrpVsBtc >= 0],
        ['Fear & Greed Δ', d.fngYesterday != null ? `${d.fngValue > d.fngYesterday ? '▲' : '▼'} ${Math.abs(d.fngValue - d.fngYesterday)} pts` : 'N/A', d.fngValue > d.fngYesterday],
      ].map(([l, v, bull]) => `
        <tr style="border-bottom:1px solid #1a2e47">
          <td style="padding:7px 0;font-size:11px;color:#8899aa">${l}</td>
          <td style="padding:7px 0;font-size:11px;font-weight:700;color:${bull === null ? '#e0eaf5' : bull ? '#00c896' : '#ff4d6d'};text-align:right">${v}</td>
        </tr>`).join('')}
    </table>
  </div>

  <!-- Technical Levels -->
  <div style="background:#0d1f35;border:1px solid #1a2e47;border-radius:12px;padding:18px;margin-bottom:16px">
    <div style="font-size:10px;color:#00c896;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px">Technical Levels</div>
    <table style="width:100%;border-collapse:collapse">
      ${[
        ['MA7 (trend)', d.ma7 != null ? `$${fmt(d.ma7, 4)}` : 'N/A', d.price > d.ma7],
        ['MA25', d.ma25 != null ? `$${fmt(d.ma25, 4)}` : 'N/A', d.price > d.ma25],
        ['MA99', d.ma99 != null ? `$${fmt(d.ma99, 4)}` : 'N/A', d.price > d.ma99],
        ['VWAP', d.vwap != null ? `$${fmt(d.vwap, 4)}` : 'N/A', d.price > d.vwap],
        ['BB Upper', d.bb != null ? `$${fmt(d.bb.upper, 4)}` : 'N/A', null],
        ['BB Lower', d.bb != null ? `$${fmt(d.bb.lower, 4)}` : 'N/A', null],
        ['BB Squeeze', d.bbSqueeze != null ? (d.bbSqueeze ? '⚠️ YES — breakout pending' : 'No') : 'N/A', d.bbSqueeze],
        ['Fib 0.618', d.fib != null ? `$${fmt(d.fib.r618, 4)}` : 'N/A', null],
        ['Fib 0.382', d.fib != null ? `$${fmt(d.fib.r382, 4)}` : 'N/A', null],
      ].map(([l, v, bull]) => `
        <tr style="border-bottom:1px solid #1a2e47">
          <td style="padding:7px 0;font-size:11px;color:#8899aa">${l}</td>
          <td style="padding:7px 0;font-size:11px;font-weight:700;color:${bull === null ? '#e0eaf5' : bull ? '#00c896' : '#ff4d6d'};text-align:right">${v}</td>
        </tr>`).join('')}
    </table>
  </div>

  <!-- AI Analysis -->
  <div style="background:#0d1f35;border:1px solid #00c89633;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 0 20px rgba(0,200,150,0.05)">
    <div style="font-size:10px;color:#00c896;letter-spacing:2px;text-transform:uppercase;margin-bottom:16px">🤖 AI Analysis — Claude</div>
    ${sections}
  </div>

  <!-- Footer -->
  <div style="text-align:center;padding:16px">
    <p style="margin:0 0 6px;font-size:11px;color:#445566">
      Generated at ${new Date().toLocaleTimeString('en-US', { timeZone: 'UTC' })} UTC
    </p>
    <p style="margin:0;font-size:10px;color:#2a3a4a;letter-spacing:0.5px">
      XRP Command Pro · Not financial advice · For informational purposes only
    </p>
  </div>

</div>
</body>
</html>`
}

export async function GET(request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Fetch all market data
    const dataRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/xrp`)
    const d = await dataRes.json()
    if (d.error) throw new Error('Data fetch failed: ' + d.error)

    // 2. Call Claude for analysis
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        messages: [{
          role: 'user',
          content: `You are a professional XRP/Ripple trading analyst at an institutional desk. Provide today's trading briefing using this live data:

PRICE ACTION:
- XRP Price: $${fmt(d.price, 4)} | 24h: ${fmtPct(d.change24h)} | 7d: ${fmtPct(d.change7d)} | 30d: ${fmtPct(d.change30d)}
- 24h Range: $${fmt(d.low24h, 4)} – $${fmt(d.high24h, 4)} | Range width: ${d.rangeWidth?.toFixed(2)}%
- Volume: ${fmtBig(d.volume24h)} | Vol/MCap: ${d.volMcapRatio?.toFixed(2)}%
- ATH: $${fmt(d.ath, 4)} | Distance from ATH: ${fmtPct(d.athPct)}

TECHNICALS:
- RSI(14): ${d.rsi14 ?? 'N/A'} [${d.rsiSignal?.toUpperCase() ?? 'N/A'}] | RSI(7): ${d.rsi7 ?? 'N/A'}
- MA7: $${fmt(d.ma7, 4)} | MA25: $${fmt(d.ma25, 4)} | MA99: $${fmt(d.ma99, 4)}
- MA Signal: ${d.maSignal?.toUpperCase()} | VWAP: $${fmt(d.vwap, 4)} [${d.vwapSignal?.toUpperCase()}]
- Bollinger Bands: Upper $${fmt(d.bb?.upper, 4)} | Mid $${fmt(d.bb?.middle, 4)} | Lower $${fmt(d.bb?.lower, 4)}
- BB Width: ${d.bb?.width?.toFixed(2)}% | Squeeze: ${d.bbSqueeze ? 'YES ⚠️' : 'No'} | Price position: ${d.bbPosition}
- Fib 0.236: $${fmt(d.fib?.r236, 4)} | 0.382: $${fmt(d.fib?.r382, 4)} | 0.618: $${fmt(d.fib?.r618, 4)} | 0.786: $${fmt(d.fib?.r786, 4)}

MACRO / MARKET:
- BTC: $${fmt(d.btcPrice, 0)} (${fmtPct(d.btcChange24h)}) | BTC Dominance: ${d.btcDom?.toFixed(1)}%
- XRP alpha vs BTC: ${fmtPct(d.xrpVsBtc)} (outperformance today)
- Fear & Greed: ${d.fngValue ?? 'N/A'} (${d.fngLabel ?? 'N/A'}) | Yesterday: ${d.fngYesterday ?? 'N/A'}

COMPOSITE: Score ${d.score}/100 → ${d.sentiment?.toUpperCase()}

Write a professional daily briefing with these exact sections (bold headers):

**1. MARKET STRUCTURE**
Describe current price action, trend phase, and structure. Reference specific price levels.

**2. KEY SIGNALS**
List the 5 most important bullish and bearish signals from the data. Be specific with numbers.

**3. CRITICAL PRICE LEVELS**
List key support levels, resistance levels, and Fibonacci levels to watch today with exact prices.

**4. TRADE SCENARIOS**
Bull case (price target, catalyst, invalidation) and Bear case (price target, catalyst, invalidation).

**5. DERIVATIVES & SENTIMENT CONTEXT**
Interpret Fear & Greed, BTC dominance, and XRP alpha vs BTC for today's session.

**6. RECOMMENDATION**
Clear directional bias, suggested entry zone, stop loss level, target, and the single most important risk to monitor today.

Be direct, specific, use actual numbers from the data. Professional tone — no hype.`
        }]
      })
    })

    const claudeJson = await claudeRes.json()
    const analysis = claudeJson.content?.find(b => b.type === 'text')?.text || 'Analysis unavailable.'

    // 3. Send email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'XRP Command <briefing@yourdomain.com>',
        to: [process.env.ALERT_EMAIL],
        subject: `XRP Daily Briefing — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · $${fmt(d.price, 4)} · ${d.score}/100 ${d.sentiment?.toUpperCase()}`,
        html: buildEmailHTML(d, analysis),
      })
    })

    const emailJson = await emailRes.json()
    if (!emailRes.ok) throw new Error('Email failed: ' + JSON.stringify(emailJson))

    return Response.json({ success: true, emailId: emailJson.id, score: d.score, price: d.price })
  } catch (e) {
    console.error('Cron error:', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
