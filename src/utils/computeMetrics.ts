import type { Position, ClosedPosition, Trade } from './polyApi'

export interface Badge {
  id: string
  label: string
  description: string
  count?: number
}

export function computeBadges(positions: Position[], closedPositions: ClosedPosition[]): Badge[] {
  const badges: Badge[] = []
  const allPositions = [...positions, ...closedPositions]
  const totalPositions = allPositions.length

  const totalInvested = allPositions.reduce((s, p) => s + ('totalBought' in p ? p.totalBought : 0), 0)

  const activeBelowEntry = positions.filter(p => p.curPrice < p.avgPrice).length
  if (positions.length > 0 && activeBelowEntry === positions.length) {
    badges.push({ id: 'bagholder', label: 'Bagholder', description: '100% of current positions are below entry' })
  }

  const trendFollowerCount = positions.filter(p => p.avgPrice > 0.8).length
  const trendFollowerPct = positions.length > 0 ? trendFollowerCount / positions.length : 0
  if (trendFollowerPct >= 0.49) {
    badges.push({ id: 'trend-follower', label: 'Trend Follower', description: `${(trendFollowerPct * 100).toFixed(1)}% of entries priced >0.8` })
  }

  const contrarian = positions.filter(p => p.avgPrice < 0.5).length
  const contrarianPct = positions.length > 0 ? contrarian / positions.length : 0
  if (contrarianPct >= 0.3) {
    badges.push({ id: 'contrarian', label: 'Contrarian', description: `${(contrarianPct * 100).toFixed(1)}% of entries priced <0.5` })
  }

  const lotteryTickets = positions.filter(p => p.avgPrice < 0.2 && p.curPrice > 0.9).length
  if (lotteryTickets >= 5) {
    badges.push({ id: 'lottery-ticket', label: 'Lottery Ticket', description: 'Entries placed <0.2 now trading >0.9', count: lotteryTickets })
  }

  const whaleSplash = positions.filter(p => p.totalBought > 20000).length
  if (whaleSplash > 0) {
    badges.push({ id: 'whale-splash', label: 'Whale Splash', description: 'Positions with >$20k invested', count: whaleSplash })
  }

  if (totalInvested >= 1_000_000) {
    badges.push({ id: 'millionaire', label: 'Millionaire Investor', description: `Total invested ≥ $1M` })
  }

  if (totalPositions >= 1000) {
    badges.push({ id: 'senior', label: 'Senior (1k+)', description: `Total positions: ${totalPositions}` })
  }

  const reversePositions = positions.filter(p => p.avgPrice > 0.8 && p.curPrice < 0.1).length
  if (reversePositions >= 5) {
    badges.push({ id: 'reverse-cramer', label: 'Reverse Cramer', description: 'Entries placed >0.8 now trading <0.1', count: reversePositions })
  }

  return badges
}

export interface PnlPoint {
  date: string
  cumPnl: number
  pnl: number
}

// Build PnL curve from SELL trades (revenue) minus paired BUY cost.
// For each SELL event: realized gain ≈ usdcSize_received - avg_cost_basis_for_tokens_sold.
// We use per-conditionId FIFO cost tracking via the full trade list.
export function computePnlCurveFromTrades(trades: Trade[]): PnlPoint[] {
  // Sort ascending by timestamp
  const sorted = [...trades].sort((a, b) => a.timestamp - b.timestamp)

  // Track cost basis per conditionId using FIFO queue of (price, size) lots
  const costBasis = new Map<string, Array<{ price: number; size: number }>>()

  const events: Array<{ timestamp: number; pnl: number }> = []

  for (const t of sorted) {
    const id = t.conditionId
    if (t.side === 'BUY') {
      const lots = costBasis.get(id) ?? []
      lots.push({ price: t.price, size: t.size })
      costBasis.set(id, lots)
    } else {
      // SELL: match against oldest BUY lots (FIFO)
      const lots = costBasis.get(id) ?? []
      let remaining = t.size
      let costConsumed = 0

      while (remaining > 0 && lots.length > 0) {
        const lot = lots[0]
        const used = Math.min(lot.size, remaining)
        costConsumed += used * lot.price
        lot.size -= used
        remaining -= used
        if (lot.size <= 0) lots.shift()
      }
      costBasis.set(id, lots)

      const revenue = t.size * t.price
      const pnl = revenue - costConsumed
      events.push({ timestamp: t.timestamp, pnl })
    }
  }

  // Sort events and build cumulative curve
  events.sort((a, b) => a.timestamp - b.timestamp)
  let cum = 0
  return events.map(e => {
    cum += e.pnl
    return {
      date: new Date(e.timestamp * 1000).toISOString().split('T')[0],
      cumPnl: Math.round(cum * 100) / 100,
      pnl: Math.round(e.pnl * 100) / 100,
    }
  })
}

// Fallback: build from closed-positions (limited to ~50 records from API)
export function computePnlCurve(closedPositions: ClosedPosition[]): PnlPoint[] {
  const sorted = [...closedPositions].sort((a, b) => a.timestamp - b.timestamp)
  let cum = 0
  const points: PnlPoint[] = []
  for (const pos of sorted) {
    cum += pos.realizedPnl
    points.push({
      date: new Date(pos.timestamp * 1000).toISOString().split('T')[0],
      cumPnl: Math.round(cum * 100) / 100,
      pnl: pos.realizedPnl,
    })
  }
  return points
}

export interface SharpeResult {
  ratio: number
  level: string
}

export function computeSharpe(closedPositions: ClosedPosition[], trades?: Trade[]): SharpeResult {
  // Prefer trades-based daily PnL (more data points) over closed-positions (~50 max from API)
  const pnlCurve = trades && trades.length > 0
    ? computePnlCurveFromTrades(trades)
    : closedPositions.map(p => ({
        date: new Date(p.timestamp * 1000).toISOString().split('T')[0],
        pnl: p.realizedPnl,
        cumPnl: 0,
      }))

  if (pnlCurve.length < 2) return { ratio: 0, level: 'Insufficient data' }

  const byDay = new Map<string, number>()
  for (const pt of pnlCurve) {
    byDay.set(pt.date, (byDay.get(pt.date) ?? 0) + pt.pnl)
  }
  const dailyPnls = Array.from(byDay.values())
  if (dailyPnls.length < 2) return { ratio: 0, level: 'Insufficient data' }

  const mean = dailyPnls.reduce((s, v) => s + v, 0) / dailyPnls.length
  const variance = dailyPnls.reduce((s, v) => s + (v - mean) ** 2, 0) / (dailyPnls.length - 1)
  const stddev = Math.sqrt(variance)
  if (stddev === 0) return { ratio: 0, level: 'N/A' }

  const ratio = Math.round(((mean / stddev) * Math.sqrt(252)) * 100) / 100

  let level = 'Poor'
  if (ratio >= 3) level = 'Exceptional'
  else if (ratio >= 2) level = 'Very Good'
  else if (ratio >= 1) level = 'Good'
  else if (ratio >= 0) level = 'Average'

  return { ratio, level }
}

export interface RoiBucket {
  label: string
  lo: number
  hi: number
  totalInvested: number
  count: number
}

export function computeRoiBuckets(closedPositions: ClosedPosition[]): RoiBucket[] {
  const boundaries = [-100, -50, -25, -10, 0, 10, 25, 50, 100, 200, 500]
  const buckets: RoiBucket[] = []
  for (let i = 0; i < boundaries.length - 1; i++) {
    buckets.push({
      label: `${boundaries[i]}%`,
      lo: boundaries[i],
      hi: boundaries[i + 1],
      totalInvested: 0,
      count: 0,
    })
  }
  buckets.push({ label: '>500%', lo: 500, hi: Infinity, totalInvested: 0, count: 0 })

  for (const pos of closedPositions) {
    if (!pos.totalBought || pos.totalBought === 0) continue
    const roi = (pos.realizedPnl / pos.totalBought) * 100
    const bucket = buckets.find(b => roi >= b.lo && roi < b.hi)
    if (bucket) {
      bucket.totalInvested += pos.totalBought
      bucket.count++
    }
  }
  return buckets
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Politics: ['election', 'president', 'congress', 'senate', 'vote', 'trump', 'biden', 'harris', 'democrat', 'republican', 'political', 'minister', 'government', 'war', 'iran', 'ukraine', 'russia', 'nato', 'sanctions', 'nuclear', 'ceasefire', 'invasion'],
  Sport: ['nfl', 'nba', 'mlb', 'nhl', 'soccer', 'football', 'basketball', 'baseball', 'tennis', 'golf', 'olympic', 'championship', 'super bowl', 'world cup', 'match', 'game', 'win', 'league', 'cup', 'tournament', 'grand prix', 'formula', 'ufc', 'boxing'],
  Crypto: ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'blockchain', 'defi', 'nft', 'solana', 'dogecoin', 'doge', 'coinbase', 'binance', 'usdc', 'stablecoin', 'token'],
  Music: ['grammy', 'music', 'album', 'song', 'artist', 'billboard', 'tour', 'concert', 'spotify', 'taylor swift', 'beyonce'],
  Culture: ['oscar', 'emmy', 'movie', 'film', 'netflix', 'disney', 'celebrity', 'tv', 'show', 'award'],
  Weather: ['hurricane', 'earthquake', 'storm', 'climate', 'weather', 'flood', 'wildfire', 'tornado'],
  Mentions: ['mention', 'tweet', 'post', 'social media', 'elon', 'musk'],
}

export interface CategoryStats {
  category: string
  count: number
  wins: number
  losses: number
  winRate: number
  totalVolume: number
}

export function computeCategoryStats(trades: Trade[]): CategoryStats[] {
  const stats = new Map<string, { count: number; wins: number; losses: number; totalVolume: number }>()

  const buys = new Map<string, Trade[]>()
  const sells = new Map<string, Trade[]>()

  for (const t of trades) {
    if (t.side === 'BUY') {
      const arr = buys.get(t.conditionId) ?? []
      arr.push(t)
      buys.set(t.conditionId, arr)
    } else {
      const arr = sells.get(t.conditionId) ?? []
      arr.push(t)
      sells.set(t.conditionId, arr)
    }
  }

  for (const t of trades) {
    if (t.side !== 'BUY') continue
    const titleLower = t.title.toLowerCase()
    let cat = 'Other'
    for (const [name, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(kw => titleLower.includes(kw))) {
        cat = name
        break
      }
    }

    const s = stats.get(cat) ?? { count: 0, wins: 0, losses: 0, totalVolume: 0 }
    s.count++
    s.totalVolume += t.size * t.price

    const sellList = sells.get(t.conditionId)
    if (sellList && sellList.length > 0) {
      const avgSell = sellList.reduce((a, x) => a + x.price, 0) / sellList.length
      const avgBuy = t.price
      if (avgSell > avgBuy) s.wins++
      else s.losses++
    }

    stats.set(cat, s)
  }

  return Array.from(stats.entries())
    .map(([category, s]) => ({
      category,
      count: s.count,
      wins: s.wins,
      losses: s.losses,
      winRate: s.wins + s.losses > 0 ? s.wins / (s.wins + s.losses) : 0,
      totalVolume: s.totalVolume,
    }))
    .sort((a, b) => b.count - a.count)
}

export interface PriceBucket {
  label: string
  volume: number
}

export function computePriceBuckets(trades: Trade[]): PriceBucket[] {
  const buckets: PriceBucket[] = Array.from({ length: 10 }, (_, i) => ({
    label: `${(i * 0.1).toFixed(1)}-${((i + 1) * 0.1).toFixed(1)}`,
    volume: 0,
  }))

  for (const t of trades) {
    if (t.side !== 'BUY') continue
    const idx = Math.min(Math.floor(t.price * 10), 9)
    buckets[idx].volume += t.size * t.price
  }
  return buckets
}

export interface ScatterPoint {
  conditionId: string
  title: string
  avgBuy: number
  avgSell: number
  invested: number
}

export function computeTradeScatter(trades: Trade[]): ScatterPoint[] {
  const buys = new Map<string, { prices: number[]; sizes: number[]; title: string }>()
  const sells = new Map<string, { prices: number[] }>()

  for (const t of trades) {
    if (t.side === 'BUY') {
      const e = buys.get(t.conditionId) ?? { prices: [], sizes: [], title: t.title }
      e.prices.push(t.price)
      e.sizes.push(t.size)
      buys.set(t.conditionId, e)
    } else {
      const e = sells.get(t.conditionId) ?? { prices: [] }
      e.prices.push(t.price)
      sells.set(t.conditionId, e)
    }
  }

  const points: ScatterPoint[] = []
  for (const [id, buyData] of buys.entries()) {
    const sellData = sells.get(id)
    if (!sellData || sellData.prices.length === 0) continue
    const avgBuy = buyData.prices.reduce((s, v) => s + v, 0) / buyData.prices.length
    const avgSell = sellData.prices.reduce((s, v) => s + v, 0) / sellData.prices.length
    const invested = buyData.prices.reduce((s, v, i) => s + v * (buyData.sizes[i] ?? 0), 0)
    points.push({ conditionId: id, title: buyData.title, avgBuy, avgSell, invested })
  }

  return points
}
