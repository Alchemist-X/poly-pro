import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  ZAxis,
} from 'recharts'
import type { ScatterPoint } from '../../utils/computeMetrics'
import { useI18n } from '../../i18n'

interface Props {
  data: ScatterPoint[]
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ScatterPoint }> }) => {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  const profit = p.avgSell > p.avgBuy
  return (
    <div className="tooltip-box max-w-[260px]">
      <p className="mb-1 truncate text-dune-text">{p.title}</p>
      <p className="text-dune-muted">Buy: <span className="text-dune-text">{p.avgBuy.toFixed(3)}</span></p>
      <p className="text-dune-muted">Sell: <span className="text-dune-text">{p.avgSell.toFixed(3)}</span></p>
      <p className="text-dune-muted">USD: <span className="text-dune-text">${p.invested.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></p>
      <p className={`mt-1 font-semibold ${profit ? 'text-dune-green' : 'text-dune-red'}`}>
        {profit ? 'Profit' : 'Loss'}
      </p>
    </div>
  )
}

export default function TradeScatter({ data }: Props) {
  const { t } = useI18n()
  if (data.length === 0) return null

  const profits = data.filter(d => d.avgSell > d.avgBuy)
  const losses = data.filter(d => d.avgSell <= d.avgBuy)

  return (
    <div className="rounded-xl border border-dune-border bg-dune-card p-5">
      <h3 className="mb-1 text-sm font-semibold text-dune-text">{t('chart.finishedTrades')} 🍉</h3>
      <p className="mb-4 text-xs text-dune-muted">{t('chart.finishedTradesDesc')} ({data.length})</p>
      <ResponsiveContainer width="100%" height={360}>
        <ScatterChart margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2d3039" />
          <XAxis dataKey="avgBuy" type="number" name="Buy" domain={[0, 1]}
            tick={{ fill: '#8a8f98', fontSize: 11 }} axisLine={false} tickLine={false}
            label={{ value: 'Buy Price', position: 'insideBottom', offset: -4, fill: '#8a8f98', fontSize: 11 }} />
          <YAxis dataKey="avgSell" type="number" name="Sell" domain={[0, 1]}
            tick={{ fill: '#8a8f98', fontSize: 11 }} axisLine={false} tickLine={false}
            label={{ value: 'Sell Price', angle: -90, position: 'insideLeft', fill: '#8a8f98', fontSize: 11 }} />
          <ZAxis dataKey="invested" range={[30, 500]} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke="#2d3039" strokeDasharray="4 4" />
          <Scatter data={profits} fill="#00d395" fillOpacity={0.65} />
          <Scatter data={losses} fill="#ff5c5c" fillOpacity={0.55} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
