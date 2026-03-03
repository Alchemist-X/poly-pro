import { useMemo } from 'react'
import type { Trade } from '../../utils/polyApi'
import { useI18n } from '../../i18n'

interface Props {
  trades: Trade[]
}

export default function RecentTrades({ trades }: Props) {
  const { t } = useI18n()

  const recent = useMemo(() => {
    const sorted = [...trades].sort((a, b) => b.timestamp - a.timestamp)
    return sorted.slice(0, 20)
  }, [trades])

  const avgBuySize = useMemo(() => {
    const buys = trades.filter(t => t.side === 'BUY')
    if (buys.length === 0) return 0
    return buys.reduce((s, t) => s + t.size * t.price, 0) / buys.length
  }, [trades])

  if (recent.length === 0) return null

  return (
    <div className="rounded-xl border border-dune-border bg-dune-card">
      <div className="border-b border-dune-border p-4">
        <h3 className="text-sm font-semibold text-dune-text">{t('table.recentTrades')}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-dune-border">
              <th className="px-4 py-3 text-left font-medium uppercase tracking-wider text-dune-muted">{t('col.timestamp')}</th>
              <th className="px-4 py-3 text-left font-medium uppercase tracking-wider text-dune-muted">{t('col.question')}</th>
              <th className="px-4 py-3 text-left font-medium uppercase tracking-wider text-dune-muted">{t('col.side')}</th>
              <th className="px-4 py-3 text-right font-medium uppercase tracking-wider text-dune-muted">{t('col.price')}</th>
              <th className="px-4 py-3 text-right font-medium uppercase tracking-wider text-dune-muted">{t('col.usdAmount')}</th>
              <th className="px-4 py-3 text-right font-medium uppercase tracking-wider text-dune-muted">{t('col.shares')}</th>
              <th className="px-4 py-3 text-left font-medium uppercase tracking-wider text-dune-muted">{t('col.comment')}</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((trade, i) => {
              const usdAmount = trade.size * trade.price
              const isSmall = avgBuySize > 0 && usdAmount < avgBuySize * 0.3
              const isLarge = avgBuySize > 0 && usdAmount > avgBuySize * 3

              return (
                <tr key={`${trade.transactionHash}-${i}`} className="border-b border-dune-border/50 transition hover:bg-dune-card-hover">
                  <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-dune-muted">
                    {new Date(trade.timestamp * 1000).toISOString().replace('T', ' ').slice(0, 19)}
                  </td>
                  <td className="max-w-[260px] truncate px-4 py-2.5 text-dune-text">{trade.title}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
                      trade.side === 'BUY' ? 'bg-dune-green/15 text-dune-green' : 'bg-dune-red/15 text-dune-red'
                    }`}>{trade.side}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-dune-text">{trade.price.toFixed(4)}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-dune-text">${usdAmount.toFixed(2)}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-dune-text">{trade.size.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-dune-muted">
                    {isSmall && <span className="text-dune-blue">💧 {t('trade.smallerThanUsual')}</span>}
                    {isLarge && <span className="text-dune-orange">🔥 {t('trade.largerThanUsual')}</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
