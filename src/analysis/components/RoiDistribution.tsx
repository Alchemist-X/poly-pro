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
import { useI18n } from '../../i18n'

interface Props {
  data: RoiBucket[]
}

function fmtY(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`
  return `$${v.toFixed(0)}`
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: RoiBucket }> }) {
  if (!active || !payload?.length) return null
  const b = payload[0].payload
  return (
    <div className="tooltip-box">
      <p className="text-dune-muted">ROI: <span className="text-dune-text">{b.label} ~ {b.hi === Infinity ? '∞' : `${b.hi}%`}</span></p>
      <p className="text-dune-muted">Invested: <span className="font-semibold text-dune-text">{fmtY(b.totalInvested)}</span></p>
      <p className="text-dune-muted">Count: <span className="text-dune-text">{b.count}</span></p>
    </div>
  )
}

export default function RoiDistribution({ data }: Props) {
  const { t } = useI18n()
  const nonEmpty = data.filter(d => d.totalInvested > 0)
  if (nonEmpty.length === 0) return null

  return (
    <div className="rounded-xl border border-dune-border bg-dune-card p-5">
      <h3 className="mb-1 text-sm font-semibold text-dune-text">{t('chart.roiDist')}</h3>
      <p className="mb-4 text-xs text-dune-muted">{t('chart.roiDistDesc')}</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ left: 8, right: 8, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2d3039" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#8a8f98', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#8a8f98', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtY} width={56} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(76,154,255,0.06)' }} />
          <ReferenceLine x="0%" stroke="#2d3039" strokeDasharray="4 4" />
          <Bar dataKey="totalInvested" radius={[3, 3, 0, 0]}>
            {data.map((entry, i) => <Cell key={i} fill={entry.lo >= 0 ? '#00d395' : '#ff5c5c'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
