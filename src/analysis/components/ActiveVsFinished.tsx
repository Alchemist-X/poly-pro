import type { Position, ClosedPosition } from '../../utils/polyApi'
import type { SharpeResult } from '../../utils/computeMetrics'

interface Props {
  positions: Position[]
  closedPositions: ClosedPosition[]
  sharpe: SharpeResult
}

function fmt(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}k`
  return `$${n.toFixed(2)}`
}

function PnlColor({ v }: { v: number }) {
  const color = v > 0 ? 'text-emerald-400' : v < 0 ? 'text-red-400' : 'text-slate-400'
  return <span className={`font-bold tabular-nums ${color}`}>{v >= 0 ? '+' : ''}{fmt(v)}</span>
}

export default function ActiveVsFinished({ positions, closedPositions, sharpe }: Props) {
  const activeBetsValue = positions.reduce((s, p) => s + (p.initialValue ?? 0), 0)
  const activePnl = positions.reduce((s, p) => s + (p.cashPnl ?? 0) + (p.realizedPnl ?? 0), 0)

  const finishedBetsValue = closedPositions.reduce((s, p) => s + (p.totalBought ?? 0), 0)
  const finishedPnl = closedPositions.reduce((s, p) => s + (p.realizedPnl ?? 0), 0)

  const sharpeColor =
    sharpe.ratio >= 2 ? 'text-emerald-400' :
    sharpe.ratio >= 1 ? 'text-blue-400' :
    sharpe.ratio >= 0 ? 'text-yellow-400' :
    'text-red-400'

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Active Bets</p>
        <p className="mt-1 text-xl font-bold text-slate-100">{fmt(activeBetsValue)}</p>
        <p className="mt-1 text-sm text-slate-400">
          PnL: <PnlColor v={activePnl} />
        </p>
        <p className="mt-1 text-xs text-slate-500">{positions.length} 个活跃仓位</p>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Finished Bets</p>
        <p className="mt-1 text-xl font-bold text-slate-100">{fmt(finishedBetsValue)}</p>
        <p className="mt-1 text-sm text-slate-400">
          PnL: <PnlColor v={finishedPnl} />
        </p>
        <p className="mt-1 text-xs text-slate-500">{closedPositions.length} 个已结算仓位</p>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Sharpe Ratio</p>
        <p className={`mt-1 text-3xl font-bold tabular-nums ${sharpeColor}`}>{sharpe.ratio}</p>
        <p className="mt-1 text-sm text-slate-400">{sharpe.level}</p>
        <p className="mt-1 text-xs text-slate-500">年化（√252）</p>
      </div>
    </div>
  )
}
