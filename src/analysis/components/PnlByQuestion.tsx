import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { PnlByQuestionItem } from '../../utils/computeMetrics'
import { useI18n } from '../../i18n'

interface Props {
  profits: PnlByQuestionItem[]
  losses: PnlByQuestionItem[]
}

function fmtUsd(v: number) {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}k`
  return `$${v.toFixed(0)}`
}

function PnlTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: PnlByQuestionItem }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="tooltip-box max-w-[260px]">
      <p className="text-dune-text truncate">{d.question}</p>
      <p className={d.pnl >= 0 ? 'text-dune-green' : 'text-dune-red'}>PnL: {fmtUsd(d.pnl)}</p>
      <p className="text-dune-muted">Invested: {fmtUsd(d.invested)}</p>
    </div>
  )
}

function Chart({ data, color, title }: { data: PnlByQuestionItem[]; color: string; title: string }) {
  if (data.length === 0) return null

  return (
    <div className="rounded-xl border border-dune-border bg-dune-card p-5">
      <h3 className="mb-4 text-sm font-semibold text-dune-text">{title}</h3>
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 32)}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 16, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2d3039" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#8a8f98', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtUsd} />
          <YAxis dataKey="question" type="category" width={200} tick={{ fill: '#8a8f98', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<PnlTooltip />} cursor={{ fill: 'rgba(76,154,255,0.06)' }} />
          <Bar dataKey="pnl" fill={color} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function PnlByQuestion({ profits, losses }: Props) {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <Chart data={profits} color="#00d395" title={`${t('chart.pnlProfit')} 🟢`} />
      <Chart data={losses} color="#ff5c5c" title={`${t('chart.pnlLoss')} 🔴`} />
    </div>
  )
}
