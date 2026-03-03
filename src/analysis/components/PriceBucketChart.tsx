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
import type { PriceBucket } from '../../utils/computeMetrics'
import { useI18n } from '../../i18n'

interface Props {
  data: PriceBucket[]
}

function fmtY(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`
  return `$${v.toFixed(0)}`
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: PriceBucket }> }) {
  if (!active || !payload?.length) return null
  const b = payload[0].payload
  return (
    <div className="tooltip-box">
      <p className="text-dune-muted">Range: <span className="text-dune-text">{b.label}</span></p>
      <p className="text-dune-muted">Volume: <span className="font-semibold text-dune-text">{fmtY(b.volume)}</span></p>
    </div>
  )
}

export default function PriceBucketChart({ data }: Props) {
  const { t } = useI18n()
  const maxIdx = data.reduce((mi, b, i) => (b.volume > data[mi].volume ? i : mi), 0)

  return (
    <div className="rounded-xl border border-dune-border bg-dune-card p-5">
      <h3 className="mb-1 text-sm font-semibold text-dune-text">{t('chart.priceBucket')}</h3>
      <p className="mb-4 text-xs text-dune-muted">{t('chart.priceBucketDesc')}</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ left: 8, right: 8, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2d3039" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#8a8f98', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#8a8f98', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtY} width={52} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(76,154,255,0.06)' }} />
          <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={i === maxIdx ? '#4c9aff' : '#2d3039'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
