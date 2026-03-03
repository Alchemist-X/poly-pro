import type { Badge } from '../../utils/computeMetrics'

interface Props {
  badges: Badge[]
}

const BADGE_STYLE: Record<string, { emoji: string; bg: string; border: string; text: string }> = {
  bagholder:        { emoji: '🛍️', bg: 'bg-red-500/10',    border: 'border-red-500/30',    text: 'text-red-400' },
  'reverse-cramer': { emoji: '🙁', bg: 'bg-red-500/10',    border: 'border-red-500/30',    text: 'text-red-400' },
  contrarian:       { emoji: '📉', bg: 'bg-dune-blue/10',  border: 'border-dune-blue/30',  text: 'text-dune-blue' },
  'lottery-ticket': { emoji: '🎰', bg: 'bg-dune-green/10', border: 'border-dune-green/30', text: 'text-dune-green' },
  'trend-follower': { emoji: '📈', bg: 'bg-dune-orange/10', border: 'border-dune-orange/30', text: 'text-dune-orange' },
  senior:           { emoji: '🏆', bg: 'bg-dune-blue/10',  border: 'border-dune-blue/30',  text: 'text-dune-blue' },
  'whale-splash':   { emoji: '💦', bg: 'bg-dune-blue/10',  border: 'border-dune-blue/30',  text: 'text-dune-blue' },
  millionaire:      { emoji: '💵', bg: 'bg-dune-green/10', border: 'border-dune-green/30', text: 'text-dune-green' },
}

export default function BadgeGrid({ badges }: Props) {
  if (badges.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {badges.map(b => {
        const s = BADGE_STYLE[b.id] ?? { emoji: '🔖', bg: 'bg-dune-card', border: 'border-dune-border', text: 'text-dune-muted' }
        return (
          <div key={b.id} className={`rounded-xl border p-4 ${s.bg} ${s.border}`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{s.emoji}</span>
              <span className={`text-sm font-semibold ${s.text}`}>
                {b.label}{b.count !== undefined ? ` (${b.count})` : ''}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-dune-muted leading-relaxed">{b.description}</p>
          </div>
        )
      })}
    </div>
  )
}
