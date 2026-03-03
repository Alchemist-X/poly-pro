import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import type { PnlPoint } from '../../utils/computeMetrics'

interface Props {
  data: PnlPoint[]
}

function fmtY(v: number) {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}k`
  return `$${v.toFixed(0)}`
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) => {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  const color = val >= 0 ? '#34d399' : '#f87171'
  return (
    <div className="rounded-lg border border-slate-600 bg-slate-800 p-3 text-xs shadow-xl">
      <p className="text-slate-400">{label}</p>
      <p style={{ color }} className="font-semibold">
        {val >= 0 ? '+' : ''}{fmtY(val)}
      </p>
    </div>
  )
}

export default function PnlCurveChart({ data }: Props) {
  if (data.length === 0) return null

  const downsampled = data.length > 500
    ? data.filter((_, i) => i % Math.ceil(data.length / 500) === 0 || i === data.length - 1)
    : data

  const maxVal = Math.max(...downsampled.map(d => d.cumPnl))
  const minVal = Math.min(...downsampled.map(d => d.cumPnl))
  const gradientId = 'pnlGradient'

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
      <h3 className="mb-1 text-sm font-semibold text-slate-300">历史 PnL 曲线</h3>
      <p className="mb-4 text-xs text-slate-500">累计已实现盈亏（按结算时间排序）</p>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={downsampled} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={maxVal >= 0 ? '#34d399' : '#f87171'} stopOpacity={0.2} />
              <stop offset="95%" stopColor={maxVal >= 0 ? '#34d399' : '#f87171'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={fmtY}
            domain={[Math.min(minVal * 1.05, 0), Math.max(maxVal * 1.05, 0)]}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 4" />
          <Area
            type="monotone"
            dataKey="cumPnl"
            stroke={maxVal >= 0 ? '#34d399' : '#f87171'}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, fill: '#6366f1' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
