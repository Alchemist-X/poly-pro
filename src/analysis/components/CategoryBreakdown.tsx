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
import { useI18n } from '../../i18n'

interface Props {
  data: CategoryStats[]
}

const COLORS = ['#4c9aff', '#00d395', '#f5a623', '#b18cfe', '#ff5c5c', '#06b6d4', '#ec4899', '#8a8f98']

function VolumeTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: CategoryStats }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="tooltip-box">
      <p className="font-medium text-dune-text">{d.category}</p>
      <p className="text-dune-muted">Trades: <span className="text-dune-text">{d.count}</span></p>
      <p className="text-dune-muted">Win Rate: <span className={d.winRate >= 0.5 ? 'text-dune-green' : 'text-dune-red'}>{(d.winRate * 100).toFixed(1)}%</span></p>
    </div>
  )
}

function WinRateTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: CategoryStats }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="tooltip-box">
      <p className="font-medium text-dune-text">{d.category}</p>
      <p className="text-dune-muted">Win Rate: <span className={d.winRate >= 0.5 ? 'text-dune-green' : 'text-dune-red'}>{(d.winRate * 100).toFixed(1)}%</span></p>
      <p className="text-dune-muted">{d.wins}W / {d.losses}L</p>
    </div>
  )
}

export default function CategoryBreakdown({ data }: Props) {
  const { t } = useI18n()
  if (data.length === 0) return null
  const top = data.slice(0, 8)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-dune-border bg-dune-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-dune-text">{t('chart.mostTraded')}</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={top} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3039" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#8a8f98', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis dataKey="category" type="category" width={64} tick={{ fill: '#8a8f98', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<VolumeTooltip />} cursor={{ fill: 'rgba(76,154,255,0.06)' }} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {top.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-dune-border bg-dune-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-dune-text">{t('chart.winRate')}</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={top} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3039" horizontal={false} />
            <XAxis type="number" domain={[0, 1]} tick={{ fill: '#8a8f98', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
            <YAxis dataKey="category" type="category" width={64} tick={{ fill: '#8a8f98', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<WinRateTooltip />} cursor={{ fill: 'rgba(76,154,255,0.06)' }} />
            <Bar dataKey="winRate" radius={[0, 4, 4, 0]}>
              {top.map((entry, i) => <Cell key={i} fill={entry.winRate >= 0.5 ? '#00d395' : '#ff5c5c'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
