import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { CategoryStats } from '../../utils/computeMetrics'

interface Props {
  data: CategoryStats[]
}

const CATEGORY_COLORS: Record<string, string> = {
  Politics: '#6366f1',
  Sport: '#f59e0b',
  Crypto: '#f97316',
  Music: '#ec4899',
  Culture: '#8b5cf6',
  Weather: '#06b6d4',
  Mentions: '#84cc16',
  Other: '#64748b',
}

const VolumeTooltip = ({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: CategoryStats }>
}) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border border-slate-600 bg-slate-800 p-3 text-xs shadow-xl">
      <p className="font-medium text-slate-200">{d.category}</p>
      <p className="text-slate-400">成交次数: <span className="text-slate-100">{d.count}</span></p>
      <p className="text-slate-400">胜率: <span className={d.winRate >= 0.5 ? 'text-emerald-400' : 'text-red-400'}>{(d.winRate * 100).toFixed(1)}%</span></p>
    </div>
  )
}

const WinRateTooltip = ({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: CategoryStats }>
}) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border border-slate-600 bg-slate-800 p-3 text-xs shadow-xl">
      <p className="font-medium text-slate-200">{d.category}</p>
      <p className="text-slate-400">胜率: <span className={d.winRate >= 0.5 ? 'text-emerald-400' : 'text-red-400'}>{(d.winRate * 100).toFixed(1)}%</span></p>
      <p className="text-slate-400">{d.wins}胜 / {d.losses}负</p>
    </div>
  )
}

export default function CategoryBreakdown({ data }: Props) {
  if (data.length === 0) return null

  const top = data.slice(0, 8)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-300">最多交易分类</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={top} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              dataKey="category"
              type="category"
              width={64}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<VolumeTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {top.map((entry, i) => (
                <Cell key={i} fill={CATEGORY_COLORS[entry.category] ?? '#64748b'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-300">各分类胜率</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={top} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 1]}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${(v * 100).toFixed(0)}%`}
            />
            <YAxis
              dataKey="category"
              type="category"
              width={64}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<WinRateTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
            <Bar dataKey="winRate" radius={[0, 4, 4, 0]}>
              {top.map((entry, i) => (
                <Cell key={i} fill={entry.winRate >= 0.5 ? '#34d399' : '#f87171'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
