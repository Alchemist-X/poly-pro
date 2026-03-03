import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { PositionRecord, SettledRecord } from '../types'

type AnyRecord = PositionRecord | SettledRecord

interface Props {
  data: AnyRecord[]
  mode: 'positions' | 'settled'
  bins?: number
}

interface BinItem {
  range: string
  count: number
  midpoint: number
}

function buildHistogram(values: number[], bins: number): BinItem[] {
  if (values.length === 0) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (min === max) return [{ range: min.toFixed(0), count: values.length, midpoint: min }]

  const step = (max - min) / bins
  const buckets: BinItem[] = Array.from({ length: bins }, (_, i) => {
    const lo = min + i * step
    const hi = lo + step
    const midpoint = (lo + hi) / 2
    return {
      range: `${lo >= 0 ? '+' : ''}${lo.toFixed(0)}`,
      count: 0,
      midpoint,
    }
  })

  for (const v of values) {
    const idx = Math.min(Math.floor((v - min) / step), bins - 1)
    buckets[idx].count++
  }
  return buckets
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ value: number; payload: BinItem }>
}) => {
  if (!active || !payload?.length) return null
  const { range, count, midpoint } = payload[0].payload
  return (
    <div className="rounded-lg border border-slate-600 bg-slate-800 p-3 text-xs shadow-xl">
      <p className="text-slate-400">起始值: {range}</p>
      <p className={`font-semibold ${midpoint >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {count} 笔交易
      </p>
    </div>
  )
}

export default function PnLDistribution({ data, mode, bins = 30 }: Props) {
  const pnlKey = mode === 'positions' ? 'overallPnl' : 'realizedPnl'
  const values = data.map(r => r[pnlKey] as number)
  const buckets = buildHistogram(values, bins)

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
      <h3 className="mb-1 text-sm font-semibold text-slate-300">PnL 分布直方图</h3>
      <p className="mb-4 text-xs text-slate-500">
        {mode === 'positions' ? 'Overall PnL' : 'Realized PnL'} — {data.length} 笔交易
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={buckets} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="range"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
          <ReferenceLine x="0" stroke="#475569" strokeDasharray="4 4" />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            {buckets.map((entry, i) => (
              <Cell key={i} fill={entry.midpoint >= 0 ? '#34d399' : '#f87171'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
