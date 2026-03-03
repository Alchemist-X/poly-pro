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

interface Props {
  data: ScatterPoint[]
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: ScatterPoint }>
}) => {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  const profit = p.avgSell > p.avgBuy
  return (
    <div className="rounded-lg border border-slate-600 bg-slate-800 p-3 text-xs shadow-xl max-w-[240px]">
      <p className="mb-1 truncate text-slate-300">{p.title}</p>
      <p className="text-slate-400">买入均价: <span className="text-slate-200">{p.avgBuy.toFixed(3)}</span></p>
      <p className="text-slate-400">卖出均价: <span className="text-slate-200">{p.avgSell.toFixed(3)}</span></p>
      <p className={`mt-1 font-semibold ${profit ? 'text-emerald-400' : 'text-red-400'}`}>
        {profit ? '盈利' : '亏损'}
      </p>
    </div>
  )
}

export default function TradeScatter({ data }: Props) {
  if (data.length === 0) return null

  const profits = data.filter(d => d.avgSell > d.avgBuy)
  const losses = data.filter(d => d.avgSell <= d.avgBuy)

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
      <h3 className="mb-1 text-sm font-semibold text-slate-300">已结算交易散点图</h3>
      <p className="mb-4 text-xs text-slate-500">
        X轴=买入均价，Y轴=卖出均价，绿点=盈利，红点=亏损（{data.length} 笔）
      </p>
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="avgBuy"
            type="number"
            name="买入价"
            domain={[0, 1]}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            label={{ value: 'Buy Price', position: 'insideBottom', offset: -4, fill: '#64748b', fontSize: 11 }}
          />
          <YAxis
            dataKey="avgSell"
            type="number"
            name="卖出价"
            domain={[0, 1]}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            label={{ value: 'Sell Price', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
          />
          <ZAxis dataKey="invested" range={[20, 300]} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <ReferenceLine
            segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]}
            stroke="#475569"
            strokeDasharray="4 4"
          />
          <Scatter data={profits} fill="#34d399" fillOpacity={0.6} />
          <Scatter data={losses} fill="#f87171" fillOpacity={0.5} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
