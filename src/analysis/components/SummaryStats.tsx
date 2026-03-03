import { useI18n } from '../../i18n'

interface Props {
  totalPositions: number
  activeSince?: string
  daysSinceActive?: number
  totalPnl: number
}

function fmt(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}k`
  return `$${n.toFixed(2)}`
}

export default function SummaryStats({ totalPositions, activeSince, daysSinceActive, totalPnl }: Props) {
  const { t } = useI18n()
  const pnlColor = totalPnl >= 0 ? 'text-dune-green' : 'text-dune-red'

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-dune-green/20 bg-dune-green/5 p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-dune-muted">{t('summary.totalPositions')}</p>
        <p className="mt-2 text-3xl font-bold tabular-nums text-dune-text">{totalPositions.toLocaleString()}</p>
      </div>

      <div className="rounded-xl border border-dune-purple/20 bg-dune-purple/5 p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-dune-muted">{t('summary.activeSince')}</p>
        <p className="mt-2 text-3xl font-bold text-dune-text">{activeSince ?? '—'}</p>
        {daysSinceActive !== undefined && (
          <p className="mt-1 text-xs text-dune-muted">{daysSinceActive} {t('summary.days')}</p>
        )}
      </div>

      <div className="rounded-xl border border-dune-border bg-dune-card p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-dune-muted">{t('summary.totalPnl')}</p>
        <p className={`mt-2 text-3xl font-bold tabular-nums ${pnlColor}`}>
          {totalPnl >= 0 ? '+' : ''}{fmt(totalPnl)}
        </p>
      </div>
    </div>
  )
}
