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
  computePnlByQuestion,
  computeFinishedFromTrades,
} from '../utils/computeMetrics'
import { useI18n } from '../i18n'
import ProfileHeader from './components/ProfileHeader'
import BadgeGrid from './components/BadgeGrid'
import SummaryStats from './components/SummaryStats'
import PositionsTable from './components/PositionsTable'
import FinishedTable from './components/FinishedTable'
import PnlCurveChart from './components/PnlCurveChart'
import TradeScatter from './components/TradeScatter'
import RoiDistribution from './components/RoiDistribution'
import CategoryBreakdown from './components/CategoryBreakdown'
import PriceBucketChart from './components/PriceBucketChart'
import PnlByQuestion from './components/PnlByQuestion'
import RecentTrades from './components/RecentTrades'

interface TraderData {
  profile: TraderProfile
  positions: Position[]
  closedPositions: ClosedPosition[]
  trades: Trade[]
}

type LoadStage = 'idle' | 'loading' | 'done' | 'error'

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
  const { t } = useI18n()
  const [input, setInput] = useState('')
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null)
  const [stage, setStage] = useState<LoadStage>('idle')
  const [statusMsg, setStatusMsg] = useState('')
  const [data, setData] = useState<TraderData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = useCallback(async (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) return

    setError(null)
    setData(null)
    setResolvedAddress(null)
    setStage('loading')

    const isAddr = isWalletAddress(trimmed.replace(/^@/, ''))
    setStatusMsg(isAddr ? t('loading.fetching') : t('loading.resolving'))

    try {
      const address = await resolveToAddress(trimmed)
      setResolvedAddress(address)
      setStatusMsg(t('loading.requesting'))
      const result = await fetchTraderData(address)
      setStatusMsg(`${t('loading.done')} ${result.trades.length} ${t('loading.trades')}`)
      setStage('done')
      setData(result)
    } catch (e) {
      setError(String(e))
      setStage('error')
    }
  }, [t])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleAnalyze(input)
  }

  const activeConditionIds = new Set(data?.positions.map(p => p.conditionId) ?? [])
  const allFinished = data
    ? computeFinishedFromTrades(data.trades, data.closedPositions, activeConditionIds)
    : []

  const badges = data ? computeBadges(data.positions, allFinished) : []
  const pnlCurve = data ? computePnlCurveFromTrades(data.trades) : []
  const sharpe = data ? computeSharpe(allFinished, data.trades) : { ratio: 0, level: '' }
  const roiBuckets = computeRoiBuckets(allFinished)
  const categoryStats = data ? computeCategoryStats(data.trades) : []
  const priceBuckets = data ? computePriceBuckets(data.trades) : []
  const scatterPoints = data ? computeTradeScatter(data.trades) : []
  const pnlByQ = data ? computePnlByQuestion(data.positions, allFinished) : { profits: [], losses: [] }

  const totalPnl = data
    ? allFinished.reduce((s, p) => s + p.realizedPnl, 0) +
      data.positions.reduce((s, p) => s + (p.cashPnl ?? 0), 0)
    : 0

  const activeSinceInfo = (() => {
    const allTs = [
      ...data?.trades.map(t => t.timestamp) ?? [],
      ...data?.closedPositions.map(p => p.timestamp) ?? [],
    ]
    if (allTs.length === 0) return { display: undefined, days: undefined }
    const minTs = allTs.reduce((m, v) => (v < m ? v : m), allTs[0])
    const display = new Date(minTs * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    const days = Math.floor((Date.now() - minTs * 1000) / 86_400_000)
    return { display, days }
  })()

  const bestTrade = allFinished.filter(p => p.realizedPnl > 0).sort((a, b) => b.realizedPnl - a.realizedPnl)[0] ?? null
  const worstTrade = allFinished.filter(p => p.realizedPnl < 0).sort((a, b) => a.realizedPnl - b.realizedPnl)[0] ?? null

  const fmtUsd = (v: number) => {
    if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
    if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(1)}k`
    return `$${v.toFixed(2)}`
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={t('search.placeholder')}
          className="flex-1 rounded-lg border border-dune-border bg-dune-card px-4 py-2.5 text-sm text-dune-text placeholder-dune-muted focus:border-dune-blue focus:outline-none"
        />
        <button type="submit" disabled={stage === 'loading'}
          className="rounded-lg bg-dune-blue px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50">
          {stage === 'loading' ? t('search.loading') : t('search.analyze')}
        </button>
        <button type="button"
          onClick={() => { setInput('Car'); handleAnalyze('Car') }}
          disabled={stage === 'loading'}
          className="rounded-lg border border-dune-border bg-dune-card px-4 py-2.5 text-sm text-dune-muted transition hover:text-dune-text disabled:opacity-50">
          {t('search.example')}
        </button>
      </form>

      {resolvedAddress && !isWalletAddress(input.trim().replace(/^@/, '')) && (
        <div className="rounded-lg border border-dune-border bg-dune-card/40 px-4 py-2 text-xs text-dune-muted">
          {t('search.resolved')} <span className="font-mono text-dune-text">{resolvedAddress}</span>
        </div>
      )}

      {stage === 'loading' && (
        <div className="flex items-center gap-3 rounded-xl border border-dune-border bg-dune-card p-4 text-sm text-dune-muted">
          <svg className="h-4 w-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          {statusMsg}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-dune-red/40 bg-dune-red/10 p-4 text-sm text-dune-red">{error}</div>
      )}

      {data && (
        <div className="space-y-6">
          <div className="text-xs text-dune-muted">
            {t('stats.loaded')} {data.trades.length} {t('stats.trades')} · {data.positions.length} {t('stats.active')} · {allFinished.length} {t('stats.settled')}
          </div>

          {/* 2. Profile Header */}
          <ProfileHeader profile={data.profile} />

          {/* 3. Badges */}
          <BadgeGrid badges={badges} />

          {/* 4–5. Summary Stats */}
          <SummaryStats
            totalPositions={data.positions.length + allFinished.length}
            activeSince={activeSinceInfo.display}
            daysSinceActive={activeSinceInfo.days}
            totalPnl={totalPnl}
          />

          {/* Sharpe Ratio */}
          <div className="rounded-xl border border-dune-border bg-dune-card p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-dune-muted">Sharpe Ratio</p>
            <p className={`mt-2 text-3xl font-bold tabular-nums ${
              sharpe.ratio >= 2 ? 'text-dune-green' : sharpe.ratio >= 1 ? 'text-dune-blue' : sharpe.ratio >= 0 ? 'text-dune-orange' : 'text-dune-red'
            }`}>{sharpe.ratio}</p>
            <p className="mt-1 text-sm text-dune-muted">{sharpe.level}</p>
          </div>

          {/* Best / Worst trade */}
          {(bestTrade || worstTrade) && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {bestTrade && (
                <div className="rounded-xl border border-dune-green/20 bg-dune-green/5 p-4">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-dune-green">{t('trade.bestRoi')}</p>
                  <p className="text-lg font-bold tabular-nums text-dune-green">+{fmtUsd(bestTrade.realizedPnl)}</p>
                  <p className="mt-1 truncate text-xs text-dune-muted" title={bestTrade.title}>{bestTrade.title}</p>
                </div>
              )}
              {worstTrade && (
                <div className="rounded-xl border border-dune-red/20 bg-dune-red/5 p-4">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-dune-red">{t('trade.worstRoi')}</p>
                  <p className="text-lg font-bold tabular-nums text-dune-red">-{fmtUsd(Math.abs(worstTrade.realizedPnl))}</p>
                  <p className="mt-1 truncate text-xs text-dune-muted" title={worstTrade.title}>{worstTrade.title}</p>
                </div>
              )}
            </div>
          )}

          {/* 6. Current Positions — preview 5 rows, expand for all */}
          <PositionsTable data={data.positions} />

          {/* 7. Finished Positions — preview 5 rows, expand for all */}
          <FinishedTable data={allFinished} total={allFinished.length} />

          {/* 8. Finished Trades Chart */}
          <TradeScatter data={scatterPoints} />

          {/* 9–10. PnL by Question */}
          <PnlByQuestion profits={pnlByQ.profits} losses={pnlByQ.losses} />

          {/* 11–12. Categories */}
          <CategoryBreakdown data={categoryStats} />

          {/* 13. PnL Curve */}
          <PnlCurveChart data={pnlCurve} />

          {/* 14. ROI Distribution + Price Buckets */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <RoiDistribution data={roiBuckets} />
            <PriceBucketChart data={priceBuckets} />
          </div>

          {/* 15. Recent Trades */}
          <RecentTrades trades={data.trades} />
        </div>
      )}
    </div>
  )
}
