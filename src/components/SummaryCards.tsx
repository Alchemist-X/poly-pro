import type { PositionRecord, SettledRecord } from '../types'

type AnyRecord = PositionRecord | SettledRecord

interface Props {
  data: AnyRecord[]
  mode: 'positions' | 'settled'
}

function fmt(v: number) {
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

interface CardProps {
  label: string
  value: string
  sub?: string
  positive?: boolean | null
}

function Card({ label, value, sub, positive }: CardProps) {
  const valueColor =
    positive === true ? 'text-emerald-400' :
    positive === false ? 'text-red-400' :
    'text-slate-100'

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${valueColor}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

export default function SummaryCards({ data, mode }: Props) {
  if (data.length === 0) return null

  const pnlKey = mode === 'positions' ? 'overallPnl' : 'realizedPnl'

  const pnlValues = data.map(r => r[pnlKey] as number)
  const realizedValues = data.map(r => r.realizedPnl)
  const unrealizedValues = data.map(r => r.unrealizedPnl)

  const totalRealized = realizedValues.reduce((s, v) => s + v, 0)
  const totalUnrealized = unrealizedValues.reduce((s, v) => s + v, 0)
  const winners = pnlValues.filter(v => v > 0).length
  const losers = pnlValues.filter(v => v < 0).length
  const winRate = data.length > 0 ? (winners / data.length) * 100 : 0
  const maxWin = Math.max(...pnlValues)
  const maxLoss = Math.min(...pnlValues)
  const maxWinQuestion = data.find(r => (r[pnlKey] as number) === maxWin)?.question ?? ''
  const maxLossQuestion = data.find(r => (r[pnlKey] as number) === maxLoss)?.question ?? ''

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <Card
        label="已实现总盈亏"
        value={(totalRealized >= 0 ? '+' : '') + fmt(totalRealized)}
        positive={totalRealized > 0 ? true : totalRealized < 0 ? false : null}
      />
      {mode === 'positions' && (
        <Card
          label="未实现总盈亏"
          value={(totalUnrealized >= 0 ? '+' : '') + fmt(totalUnrealized)}
          positive={totalUnrealized > 0 ? true : totalUnrealized < 0 ? false : null}
        />
      )}
      <Card
        label="胜率"
        value={`${winRate.toFixed(1)}%`}
        sub={`${winners}胜 / ${losers}负 / ${data.length}总`}
        positive={winRate >= 50 ? true : false}
      />
      <Card
        label="最大单笔盈利"
        value={'+' + fmt(maxWin)}
        sub={maxWinQuestion.length > 30 ? maxWinQuestion.slice(0, 30) + '…' : maxWinQuestion}
        positive={true}
      />
      <Card
        label="最大单笔亏损"
        value={fmt(maxLoss)}
        sub={maxLossQuestion.length > 30 ? maxLossQuestion.slice(0, 30) + '…' : maxLossQuestion}
        positive={false}
      />
      <Card
        label="总交易数"
        value={data.length.toString()}
        sub={`共 ${data.length} 条记录`}
        positive={null}
      />
    </div>
  )
}
