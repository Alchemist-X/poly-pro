import {
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
import { useI18n } from '../../i18n'

interface Props {
  data: PnlPoint[]
}

function fmtY(v: number) {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}k`
  return `$${v.toFixed(0)}`
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  return (
    <div className="tooltip-box">
      <p className="text-dune-muted">{label}</p>
      <p className={`font-semibold ${val >= 0 ? 'text-dune-green' : 'text-dune-red'}`}>
        {val >= 0 ? '+' : ''}{fmtY(val)}
      </p>
    </div>
  )
}

export default function PnlCurveChart({ data }: Props) {
  const { t } = useI18n()
  if (data.length === 0) return null

  const downsampled = data.length > 500
    ? data.filter((_, i) => i % Math.ceil(data.length / 500) === 0 || i === data.length - 1)
    : data

  const maxVal = Math.max(...downsampled.map(d => d.cumPnl))
  const minVal = Math.min(...downsampled.map(d => d.cumPnl))

  return (
    <div className="rounded-xl border border-dune-border bg-dune-card p-5">
      <h3 className="mb-1 text-sm font-semibold text-dune-text">{t('chart.pnlCurve')}</h3>
      <p className="mb-4 text-xs text-dune-muted">{t('chart.pnlCurveDesc')}</p>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={downsampled} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={maxVal >= 0 ? '#00d395' : '#ff5c5c'} stopOpacity={0.2} />
              <stop offset="95%" stopColor={maxVal >= 0 ? '#00d395' : '#ff5c5c'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2d3039" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#8a8f98', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fill: '#8a8f98', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtY}
            domain={[Math.min(minVal * 1.05, 0), Math.max(maxVal * 1.05, 0)]} width={60} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#2d3039" strokeDasharray="4 4" />
          <Area type="monotone" dataKey="cumPnl" stroke={maxVal >= 0 ? '#00d395' : '#ff5c5c'} strokeWidth={2}
            fill="url(#pnlGrad)" dot={false} activeDot={{ r: 4, fill: '#4c9aff' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
