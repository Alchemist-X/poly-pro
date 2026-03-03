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
import type { RoiBucket } from '../../utils/computeMetrics'

interface Props {
  data: RoiBucket[]
}

function fmtY(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`
  return `$${v.toFixed(0)}`
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: RoiBucket }>
}) => {
  if (!active || !payload?.length) return null
  const b = payload[0].payload
  return (
    <div className="rounded-lg border border-slate-600 bg-slate-800 p-3 text-xs shadow-xl">
      <p className="text-slate-400">ROI 区间: <span className="text-slate-200">{b.label} ~ {b.hi === Infinity ? '∞' : `${b.hi}%`}</span></p>
      <p className="text-slate-400">总投入: <span className="font-semibold text-slate-100">{fmtY(b.totalInvested)}</span></p>
      <p className="text-slate-400">笔数: <span className="text-slate-200">{b.count}</span></p>
    </div>
  )
}

export default function RoiDistribution({ data }: Props) {
  const nonEmpty = data.filter(d => d.totalInvested > 0)
  if (nonEmpty.length === 0) return null

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
      <h3 className="mb-1 text-sm font-semibold text-slate-300">ROI 分布（资金加权）</h3>
      <p className="mb-4 text-xs text-slate-500">X轴=投资回报率区间，Y轴=对应区间总投入</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ left: 8, right: 8, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={fmtY}
            width={56}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
          <ReferenceLine x="0%" stroke="#475569" strokeDasharray="4 4" />
          <Bar dataKey="totalInvested" radius={[3, 3, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.lo >= 0 ? '#34d399' : '#f87171'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
