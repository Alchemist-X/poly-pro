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
  topN?: number
}

interface ChartItem {
  label: string
  pnl: number
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: ChartItem }> }) => {
  if (!active || !payload?.length) return null
  const item = payload[0]
  const val = item.value
  const color = val >= 0 ? '#34d399' : '#f87171'
  return (
    <div className="rounded-lg border border-slate-600 bg-slate-800 p-3 text-xs shadow-xl">
      <p className="mb-1 max-w-[200px] text-slate-300">{item.payload.label}</p>
      <p style={{ color }} className="font-semibold">
        {val >= 0 ? '+' : ''}{val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  )
}

export default function PnLBarChart({ data, mode, topN = 10 }: Props) {
  const pnlKey = mode === 'positions' ? 'overallPnl' : 'realizedPnl'

  const sorted = [...data].sort((a, b) => (b[pnlKey] as number) - (a[pnlKey] as number))
  const topWinners = sorted.slice(0, topN)
  const topLosers = sorted.slice(-topN).reverse()

  const toChartItem = (r: AnyRecord): ChartItem => ({
    label: r.question.length > 40 ? r.question.slice(0, 40) + '…' : r.question,
    pnl: r[pnlKey] as number,
  })

  const winnersData = topWinners.map(toChartItem)
  const losersData = topLosers.map(toChartItem)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
        <h3 className="mb-4 text-sm font-semibold text-emerald-400">
          🏆 Top {topN} 盈利
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={winnersData} layout="vertical" margin={{ left: 0, right: 24, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => v.toLocaleString()}
            />
            <YAxis
              dataKey="label"
              type="category"
              width={160}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
            <ReferenceLine x={0} stroke="#475569" />
            <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
              {winnersData.map((entry, i) => (
                <Cell key={i} fill={entry.pnl >= 0 ? '#34d399' : '#f87171'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
        <h3 className="mb-4 text-sm font-semibold text-red-400">
          💸 Top {topN} 亏损
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={losersData} layout="vertical" margin={{ left: 0, right: 24, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => v.toLocaleString()}
            />
            <YAxis
              dataKey="label"
              type="category"
              width={160}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
            <ReferenceLine x={0} stroke="#475569" />
            <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
              {losersData.map((entry, i) => (
                <Cell key={i} fill={entry.pnl >= 0 ? '#34d399' : '#f87171'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
