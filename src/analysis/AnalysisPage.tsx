import { useState, useCallback } from 'react'
import { fetchTraderData } from '../utils/polyApi'
import type { Position, ClosedPosition, Trade, TraderProfile } from '../utils/polyApi'
import {
  computeBadges,
  computePnlCurveFromTrades,
  computeSharpe,
  computeRoiBuckets,
  computeCategoryStats,
  computePriceBuckets,
  computeTradeScatter,
} from '../utils/computeMetrics'
import ProfileHeader from './components/ProfileHeader'
import PnlCurveChart from './components/PnlCurveChart'
import ActiveVsFinished from './components/ActiveVsFinished'
import TradeScatter from './components/TradeScatter'
import RoiDistribution from './components/RoiDistribution'
import CategoryBreakdown from './components/CategoryBreakdown'
import PriceBucketChart from './components/PriceBucketChart'

interface TraderData {
  profile: TraderProfile
  positions: Position[]
  closedPositions: ClosedPosition[]
  trades: Trade[]
}

type LoadStage = 'idle' | 'loading' | 'done' | 'error'

interface LoadProgress {
  stage: LoadStage
  message: string
}

function isWalletAddress(s: string) {
  return /^0x[0-9a-fA-F]{40,42}$/.test(s)
}

async function resolveToAddress(raw: string): Promise<string> {
  const trimmed = raw.trim().replace(/^@/, '')
  if (isWalletAddress(trimmed)) return trimmed

  const res = await fetch(`/api/resolve-username?username=${encodeURIComponent(trimmed)}`)
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Username not found')
  return json.address as string
}

export default function AnalysisPage() {
  const [input, setInput] = useState('')
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null)
  const [progress, setProgress] = useState<LoadProgress>({ stage: 'idle', message: '' })
  const [data, setData] = useState<TraderData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = useCallback(async (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) return

    setError(null)
    setData(null)
    setResolvedAddress(null)

    const isAddr = isWalletAddress(trimmed.replace(/^@/, ''))
    setProgress({ stage: 'loading', message: isAddr ? '并发拉取链上数据中…' : `正在解析用户名 "@${trimmed.replace(/^@/, '')}"…` })

    try {
      const address = await resolveToAddress(trimmed)
      setResolvedAddress(address)
      setProgress({ stage: 'loading', message: '并发请求 positions / closed-positions / trades…' })
      const result = await fetchTraderData(address)
      setProgress({ stage: 'done', message: `已加载 ${result.trades.length} 笔交易` })
      setData(result)
    } catch (e) {
      setError(String(e))
      setProgress({ stage: 'error', message: '加载失败' })
    }
  }, [])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleAnalyze(input)
  }

  const badges = data ? computeBadges(data.positions, data.closedPositions) : []
  // Use trades-based PnL curve (covers full trade history vs ~50 from closed-positions)
  const pnlCurve = data ? computePnlCurveFromTrades(data.trades) : []
  const sharpe = data ? computeSharpe(data.closedPositions, data.trades) : { ratio: 0, level: '' }
  const roiBuckets = data ? computeRoiBuckets(data.closedPositions) : []
  const categoryStats = data ? computeCategoryStats(data.trades) : []
  const priceBuckets = data ? computePriceBuckets(data.trades) : []
  const scatterPoints = data ? computeTradeScatter(data.trades) : []

  const totalPnl = data
    ? data.closedPositions.reduce((s, p) => s + p.realizedPnl, 0) +
      data.positions.reduce((s, p) => s + (p.cashPnl ?? 0), 0)
    : 0

  const activeSince = (() => {
    const allTs = [
      ...data?.trades.map(t => t.timestamp) ?? [],
      ...data?.closedPositions.map(p => p.timestamp) ?? [],
    ]
    if (allTs.length === 0) return undefined
    const minTs = allTs.reduce((m, v) => (v < m ? v : m), allTs[0])
    return new Date(minTs * 1000).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' })
  })()

  const bestTrade = data?.closedPositions.length
    ? data.closedPositions.reduce((best, p) =>
        p.totalBought > 0 && p.realizedPnl / p.totalBought > (best.realizedPnl / best.totalBought)
          ? p : best
      )
    : null

  const worstTrade = data?.closedPositions.length
    ? data.closedPositions.reduce((worst, p) =>
        p.totalBought > 0 && p.realizedPnl / p.totalBought < (worst.realizedPnl / worst.totalBought)
          ? p : worst
      )
    : null

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="输入用户名 (Car / @Car) 或钱包地址 (0x...)"
          className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={progress.stage === 'loading'}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {progress.stage === 'loading' ? '加载中…' : '分析'}
        </button>
        <button
          type="button"
          onClick={() => { setInput('Car'); handleAnalyze('Car') }}
          disabled={progress.stage === 'loading'}
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
        >
          示例: @Car
        </button>
      </form>

      {/* Resolved address hint */}
      {resolvedAddress && !isWalletAddress(input.trim().replace(/^@/, '')) && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-4 py-2 text-xs text-slate-400">
          已解析用户名 → <span className="font-mono text-slate-300">{resolvedAddress}</span>
        </div>
      )}

      {/* Progress / error */}
      {progress.stage === 'loading' && (
        <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/60 p-4 text-sm text-slate-400">
          <svg className="h-4 w-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          {progress.message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-700 bg-red-900/20 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Report */}
      {data && (
        <div className="space-y-6">
          <div className="text-xs text-slate-500">
            已加载 {data.trades.length} 笔交易 · {data.positions.length} 活跃仓位 · {data.closedPositions.length} 已结算
          </div>

          <ProfileHeader
            profile={data.profile}
            badges={badges}
            totalPositions={data.positions.length + data.closedPositions.length}
            totalPnl={totalPnl}
            activeSince={activeSince}
          />

          <ActiveVsFinished
            positions={data.positions}
            closedPositions={data.closedPositions}
            sharpe={sharpe}
          />

          {/* Best / Worst trade */}
          {(bestTrade || worstTrade) && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {bestTrade && (
                <div className="rounded-xl border border-emerald-700/40 bg-emerald-900/10 p-4">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-emerald-500">最佳交易（ROI）</p>
                  <p className="text-sm font-semibold text-emerald-300">
                    +{((bestTrade.realizedPnl / bestTrade.totalBought) * 100).toFixed(2)}%
                    <span className="ml-2 font-normal text-emerald-400">(+${bestTrade.realizedPnl.toFixed(2)})</span>
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-400" title={bestTrade.title}>{bestTrade.title}</p>
                </div>
              )}
              {worstTrade && (
                <div className="rounded-xl border border-red-700/40 bg-red-900/10 p-4">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-red-500">最差交易（ROI）</p>
                  <p className="text-sm font-semibold text-red-300">
                    {((worstTrade.realizedPnl / worstTrade.totalBought) * 100).toFixed(2)}%
                    <span className="ml-2 font-normal text-red-400">(${worstTrade.realizedPnl.toFixed(2)})</span>
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-400" title={worstTrade.title}>{worstTrade.title}</p>
                </div>
              )}
            </div>
          )}

          <PnlCurveChart data={pnlCurve} />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <TradeScatter data={scatterPoints} />
            <RoiDistribution data={roiBuckets} />
          </div>

          <CategoryBreakdown data={categoryStats} />

          <PriceBucketChart data={priceBuckets} />
        </div>
      )}
    </div>
  )
}
