export interface Position {
  proxyWallet: string
  asset: string
  conditionId: string
  size: number
  avgPrice: number
  initialValue: number
  currentValue: number
  cashPnl: number
  percentPnl: number
  totalBought: number
  realizedPnl: number
  percentRealizedPnl: number
  curPrice: number
  redeemable: boolean
  mergeable: boolean
  title: string
  slug: string
  icon: string
  eventSlug: string
  outcome: string
  outcomeIndex: number
  endDate: string
}

export interface ClosedPosition {
  proxyWallet: string
  asset: string
  conditionId: string
  avgPrice: number
  totalBought: number
  realizedPnl: number
  curPrice: number
  title: string
  slug: string
  icon: string
  eventSlug: string
  outcome: string
  outcomeIndex: number
  endDate: string
  timestamp: number
}

export interface Trade {
  proxyWallet: string
  side: 'BUY' | 'SELL'
  asset: string
  conditionId: string
  size: number
  price: number
  timestamp: number
  title: string
  slug: string
  icon: string
  eventSlug: string
  outcome: string
  outcomeIndex: number
  name: string
  pseudonym: string
  bio: string
  profileImage: string
  profileImageOptimized: string
  transactionHash: string
}

export interface TraderProfile {
  name: string
  pseudonym: string
  bio: string
  profileImage: string
  walletAddress: string
}

// Polymarket Data API hard limits:
//   /trades:          max offset = 3000, max limit = 10000
//   /closed-positions: returns at most ~50 records regardless of pagination
//
// Strategy for /trades:
//   6 concurrent requests covering up to 13000 unique records:
//   - 5 shards: offsets [0, 600, 1200, 1800, 2400] × limit 600  (covers records 0–2999)
//   - 1 big chunk: offset 3000 × limit 10000                     (covers records 3000–12999)
const SHARD_COUNT = 5
const SHARD_LIMIT = 600   // 5 × 600 = 3000, fits within max offset
const BIG_LIMIT = 10000
const MAX_OFFSET = 3000

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path)
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

export async function fetchPositions(user: string): Promise<Position[]> {
  return get<Position[]>(`/api/data/positions?user=${user}&limit=10000`)
}

export async function fetchClosedPositions(user: string): Promise<ClosedPosition[]> {
  // API returns at most ~50 records; just fetch once
  return get<ClosedPosition[]>(`/api/data/closed-positions?user=${user}&limit=10000`)
}

async function fetchTradesPage(user: string, limit: number, offset: number): Promise<Trade[]> {
  return get<Trade[]>(
    `/api/data/trades?user=${user}&limit=${limit}&offset=${offset}&takerOnly=false`
  )
}

export async function fetchAllTrades(user: string): Promise<Trade[]> {
  // Fire all 6 requests concurrently
  const shardOffsets = Array.from({ length: SHARD_COUNT }, (_, i) => i * SHARD_LIMIT)

  const [shards, bigChunk] = await Promise.all([
    Promise.all(shardOffsets.map(offset => fetchTradesPage(user, SHARD_LIMIT, offset))),
    fetchTradesPage(user, BIG_LIMIT, MAX_OFFSET),
  ])

  // Merge and deduplicate by transactionHash
  const all = [...shards.flat(), ...bigChunk]
  const seen = new Set<string>()
  return all.filter(t => {
    const key = t.transactionHash || `${t.conditionId}:${t.timestamp}:${t.side}:${t.size}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function fetchTraderData(user: string): Promise<{
  profile: TraderProfile
  positions: Position[]
  closedPositions: ClosedPosition[]
  trades: Trade[]
}> {
  const [positions, closedPositions, trades] = await Promise.all([
    fetchPositions(user),
    fetchClosedPositions(user),
    fetchAllTrades(user),
  ])

  // Profile info comes from the first trade record
  const firstTrade = trades.find(t => t.name)
  const profile: TraderProfile = {
    name: firstTrade?.name ?? user.slice(0, 10),
    pseudonym: firstTrade?.pseudonym ?? '',
    bio: firstTrade?.bio ?? '',
    profileImage: firstTrade?.profileImage ?? '',
    walletAddress: user,
  }

  return { profile, positions, closedPositions, trades }
}
