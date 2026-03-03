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

const PRESET_TRADERS = [
  { label: '🏛️ 政治交易大师', labelEn: '🏛️ Politics Master', value: 'Car', desc: 'PredictFolio 创始人', descEn: 'PredictFolio founder' },
  { label: '🐋 Whale 鲸鱼', labelEn: '🐋 Whale', value: '0x53345eF79ee5499a9EDF94F5a7cD7964A72ea8D6', desc: '大额交易者', descEn: 'High-volume trader' },
  { label: '🎲 Domer', labelEn: '🎲 Domer', value: 'Domer', desc: 'Polymarket 活跃用户', descEn: 'Active Polymarket user' },
  { label: '📊 Fredi', labelEn: '📊 Fredi', value: 'Fredi', desc: 'Polymarket OG', descEn: 'Polymarket OG' },
]

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
  const { t, locale } = useI18n()
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

  const handleReset = () => {
    setData(null)
    setStage('idle')
    setError(null)
    setInput('')
    setResolvedAddress(null)
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

  // --- Idle state: Claude-style landing ---
  if (stage === 'idle' && !data) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center">
        <div className="w-full max-w-2xl space-y-8 text-center">
          <div>
            <h2 className="text-3xl font-bold text-dune-text">{t('home.title')}</h2>
            <p className="mt-2 text-sm text-dune-muted">{t('home.subtitle')}</p>
          </div>

          <form onSubmit={onSubmit} className="relative">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={t('search.placeholder')}
              className="w-full rounded-2xl border border-dune-border bg-dune-card px-5 py-4 pr-24 text-base text-dune-text placeholder-dune-muted shadow-lg focus:border-dune-blue focus:outline-none focus:ring-1 focus:ring-dune-blue/50"
              autoFocus
            />
            <button type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-dune-blue px-5 py-2 text-sm font-medium text-white transition hover:opacity-90">
              {t('search.analyze')}
            </button>
          </form>

          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-dune-muted">{t('home.presets')}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PRESET_TRADERS.map(p => (
                <button key={p.value}
                  onClick={() => { setInput(p.value); handleAnalyze(p.value) }}
                  className="group rounded-xl border border-dune-border bg-dune-card p-4 text-left transition hover:border-dune-blue/40 hover:bg-dune-card-hover"
                >
                  <p className="text-sm font-semibold text-dune-text group-hover:text-dune-blue">
                    {locale === 'zh' ? p.label : p.labelEn}
                  </p>
                  <p className="mt-1 text-[11px] text-dune-muted truncate">{locale === 'zh' ? p.desc : p.descEn}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- Loading / Error / Report ---
  return (
    <div className="space-y-6">
      {/* Compact search bar when analyzing */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={onSubmit} className="flex flex-1 gap-2">
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
        </form>
        <button onClick={handleReset}
          className="rounded-lg border border-dune-border bg-dune-card px-4 py-2.5 text-sm text-dune-muted transition hover:text-dune-text">
          {locale === 'zh' ? '新查询' : 'New Query'}
        </button>
      </div>

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

          <ProfileHeader profile={data.profile} />
          <BadgeGrid badges={badges} />

          <SummaryStats
            totalPositions={data.positions.length + allFinished.length}
            activeSince={activeSinceInfo.display}
            daysSinceActive={activeSinceInfo.days}
            totalPnl={totalPnl}
          />

          <div className="rounded-xl border border-dune-border bg-dune-card p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-dune-muted">Sharpe Ratio</p>
            <p className={`mt-2 text-3xl font-bold tabular-nums ${
              sharpe.ratio >= 2 ? 'text-dune-green' : sharpe.ratio >= 1 ? 'text-dune-blue' : sharpe.ratio >= 0 ? 'text-dune-orange' : 'text-dune-red'
            }`}>{sharpe.ratio}</p>
            <p className="mt-1 text-sm text-dune-muted">{sharpe.level}</p>
          </div>

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

          <PositionsTable data={data.positions} />
          <FinishedTable data={allFinished} total={allFinished.length} />
          <TradeScatter data={scatterPoints} />
          <PnlByQuestion profits={pnlByQ.profits} losses={pnlByQ.losses} />
          <CategoryBreakdown data={categoryStats} />
          <PnlCurveChart data={pnlCurve} />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <RoiDistribution data={roiBuckets} />
            <PriceBucketChart data={priceBuckets} />
          </div>

          <RecentTrades trades={data.trades} />
        </div>
      )}
    </div>
  )
}
