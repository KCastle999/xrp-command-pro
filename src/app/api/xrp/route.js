export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ── Helpers ───────────────────────────────────────────────────────────────────
function calcRSI(prices, period = 14) {
  if (prices.length < period + 1) return null
  let gains = 0, losses = 0
  for (let i = 1; i <= period; i++) {
    const d = prices[i] - prices[i - 1]
    if (d > 0) gains += d; else losses -= d
  }
  let ag = gains / period, al = losses / period
  for (let i = period + 1; i < prices.length; i++) {
    const d = prices[i] - prices[i - 1]
    ag = (ag * (period - 1) + Math.max(0, d)) / period
    al = (al * (period - 1) + Math.max(0, -d)) / period
  }
  return al === 0 ? 100 : Math.round(100 - 100 / (1 + ag / al))
}

function calcMA(prices, period) {
  if (prices.length < period) return null
  return prices.slice(-period).reduce((a, b) => a + b, 0) / period
}

function calcBollingerBands(prices, period = 20) {
  if (prices.length < period) return null
  const slice = prices.slice(-period)
  const ma = slice.reduce((a, b) => a + b, 0) / period
  const variance = slice.reduce((a, b) => a + Math.pow(b - ma, 2), 0) / period
  const std = Math.sqrt(variance)
  return { upper: ma + 2 * std, middle: ma, lower: ma - 2 * std, width: ((4 * std) / ma) * 100 }
}

function calcFibLevels(high, low) {
  const diff = high - low
  return {
    r236: high - diff * 0.236,
    r382: high - diff * 0.382,
    r500: high - diff * 0.500,
    r618: high - diff * 0.618,
    r786: high - diff * 0.786,
    r1000: low,
    ext1272: high + diff * 0.272,
    ext1618: high + diff * 0.618,
  }
}

function calcVWAP(ohlcv) {
  if (!ohlcv || ohlcv.length === 0) return null
  let tpv = 0, vol = 0
  for (const c of ohlcv) {
    const tp = (c[1] + c[2] + c[3]) / 3 // high, low, close
    tpv += tp * c[4]
    vol += c[4]
  }
  return vol > 0 ? tpv / vol : null
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const opts = { headers: { 'Accept': 'application/json' } }

    // Parallel fetches
    const [xrpCoin, xrpChart, xrpOhlc, btcCoin, btcDominance, fearGreed, globalMacro] = await Promise.allSettled([
      // XRP full data
      fetch('https://api.coingecko.com/api/v3/coins/ripple?localization=false&tickers=false&market_data=true&community_data=true', opts),
      // XRP 30d price history
      fetch('https://api.coingecko.com/api/v3/coins/ripple/market_chart?vs_currency=usd&days=30', opts),
      // XRP OHLC 14 days
      fetch('https://api.coingecko.com/api/v3/coins/ripple/ohlc?vs_currency=usd&days=14', opts),
      // BTC data for correlation/dominance context
      fetch('https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&market_data=true', opts),
      // Global crypto market (BTC dominance)
      fetch('https://api.coingecko.com/api/v3/global', opts),
      // Fear & Greed Index
      fetch('https://api.alternative.me/fng/?limit=2', opts),
      // Crypto global market data
      fetch('https://api.coingecko.com/api/v3/global/decentralized_finance_defi', opts),
    ])

    // Parse results safely
    const xrpData = xrpCoin.status === 'fulfilled' && xrpCoin.value.ok ? await xrpCoin.value.json() : null
    const chartData = xrpChart.status === 'fulfilled' && xrpChart.value.ok ? await xrpChart.value.json() : null
    const ohlcData = xrpOhlc.status === 'fulfilled' && xrpOhlc.value.ok ? await xrpOhlc.value.json() : null
    const btcData = btcCoin.status === 'fulfilled' && btcCoin.value.ok ? await btcCoin.value.json() : null
    const globalData = btcDominance.status === 'fulfilled' && btcDominance.value.ok ? await btcDominance.value.json() : null
    const fngData = fearGreed.status === 'fulfilled' && fearGreed.value.ok ? await fearGreed.value.json() : null

    const md = xrpData?.market_data
    const btcMd = btcData?.market_data

    // Price arrays
    const allPrices = (chartData?.prices || []).map(p => p[1])
    const prices7d = allPrices.slice(-96)   // ~7 days of hourly-ish points
    const prices14d = allPrices.slice(-192)
    const prices30d = allPrices

    // Step down to ~30 points for chart display
    const step = Math.max(1, Math.floor(prices30d.length / 30))
    const chartPrices = prices30d.filter((_, i) => i % step === 0).slice(0, 30)

    // Technical indicators
    const rsi14 = calcRSI(prices14d)
    const rsi7 = calcRSI(prices7d, 7)
    const ma7 = calcMA(allPrices, Math.min(50, allPrices.length))
    const ma25 = calcMA(allPrices, Math.min(175, allPrices.length))
    const ma99 = calcMA(allPrices, Math.min(693, allPrices.length))
    const bb = calcBollingerBands(allPrices.slice(-140))
    const vwap = ohlcData ? calcVWAP(ohlcData) : null

    // Fibonacci levels (using 30d high/low)
    const thirtyDHigh = md?.high_24h?.usd ? Math.max(md.high_24h.usd, ...prices30d.slice(-720)) : null
    const thirtyDLow = md?.low_24h?.usd ? Math.min(md.low_24h.usd, ...prices30d.slice(-720)) : null
    const fib = thirtyDHigh && thirtyDLow ? calcFibLevels(thirtyDHigh, thirtyDLow) : null

    // Current price
    const price = md?.current_price?.usd
    const change24h = md?.price_change_percentage_24h
    const change7d = md?.price_change_percentage_7d
    const change30d = md?.price_change_percentage_30d
    const volume24h = md?.total_volume?.usd
    const marketCap = md?.market_cap?.usd
    const high24h = md?.high_24h?.usd
    const low24h = md?.low_24h?.usd
    const ath = md?.ath?.usd
    const athPct = md?.ath_change_percentage?.usd
    const circulatingSupply = md?.circulating_supply
    const totalSupply = md?.total_supply

    // BTC context
    const btcPrice = btcMd?.current_price?.usd
    const btcChange24h = btcMd?.price_change_percentage_24h
    const btcDom = globalData?.data?.market_cap_percentage?.btc

    // XRP vs BTC correlation signal
    const xrpVsBtc = change24h != null && btcChange24h != null
      ? change24h - btcChange24h
      : null

    // Fear & Greed
    const fng = fngData?.data?.[0]
    const fngValue = fng ? parseInt(fng.value) : null
    const fngLabel = fng?.value_classification || null
    const fngYesterday = fngData?.data?.[1] ? parseInt(fngData.data[1].value) : null

    // Vol/MCap ratio
    const volMcapRatio = volume24h && marketCap ? (volume24h / marketCap) * 100 : null

    // 24h range width %
    const rangeWidth = high24h && low24h ? ((high24h - low24h) / low24h) * 100 : null

    // Bollinger squeeze (width < 3% = squeeze)
    const bbSqueeze = bb ? bb.width < 3 : null

    // Price vs bands
    const bbPosition = bb && price ? price > bb.upper ? 'above_upper' : price < bb.lower ? 'below_lower' : 'inside' : null

    // Momentum signals
    const maSignal = ma7 && ma25 ? (ma7 > ma25 ? 'bullish' : 'bearish') : 'neutral'
    const vwapSignal = vwap && price ? (price > vwap ? 'bullish' : 'bearish') : 'neutral'
    const rsiSignal = rsi14 ? (rsi14 < 30 ? 'oversold' : rsi14 > 70 ? 'overbought' : rsi14 < 45 ? 'bearish' : rsi14 > 55 ? 'bullish' : 'neutral') : 'neutral'

    // Composite score (0-100)
    let score = 50
    if (change24h > 0) score += 7; else score -= 7
    if (change7d > 0) score += 9; else score -= 9
    if (change30d > 0) score += 5; else score -= 5
    if (rsi14) { if (rsi14 < 35) score += 10; else if (rsi14 > 70) score -= 10; else if (rsi14 > 55) score += 4; else score -= 2 }
    if (maSignal === 'bullish') score += 8; else score -= 8
    if (vwapSignal === 'bullish') score += 5; else score -= 5
    if (fngValue) { if (fngValue > 60) score += 5; else if (fngValue < 30) score -= 5 }
    if (bbPosition === 'below_lower') score += 6
    if (bbPosition === 'above_upper') score -= 6
    score = Math.max(5, Math.min(95, Math.round(score)))

    const sentiment = score >= 62 ? 'bullish' : score <= 38 ? 'bearish' : 'neutral'

    return Response.json({
      // Core price
      price, change24h, change7d, change30d,
      volume24h, marketCap, high24h, low24h,
      ath, athPct, circulatingSupply, totalSupply,

      // Chart
      chartPrices,

      // Technicals
      rsi14, rsi7, ma7, ma25, ma99, bb, vwap, fib,
      bbPosition, bbSqueeze,
      maSignal, vwapSignal, rsiSignal,

      // BTC / Macro
      btcPrice, btcChange24h, btcDom,
      xrpVsBtc,

      // Sentiment
      fngValue, fngLabel, fngYesterday,
      volMcapRatio, rangeWidth,

      // Summary
      score, sentiment,
      fetchedAt: new Date().toISOString(),
    })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
