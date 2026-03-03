import type { TraderProfile } from '../../utils/polyApi'
import type { Badge } from '../../utils/computeMetrics'

interface Props {
  profile: TraderProfile
  badges: Badge[]
  totalPositions: number
  totalPnl: number
  activeSince?: string
}

const BADGE_COLORS: Record<string, string> = {
  bagholder: 'bg-orange-900/40 text-orange-300 ring-orange-700/40',
  'trend-follower': 'bg-blue-900/40 text-blue-300 ring-blue-700/40',
  contrarian: 'bg-purple-900/40 text-purple-300 ring-purple-700/40',
  'lottery-ticket': 'bg-yellow-900/40 text-yellow-300 ring-yellow-700/40',
  'whale-splash': 'bg-cyan-900/40 text-cyan-300 ring-cyan-700/40',
  millionaire: 'bg-emerald-900/40 text-emerald-300 ring-emerald-700/40',
  senior: 'bg-slate-700/60 text-slate-300 ring-slate-600/40',
  'reverse-cramer': 'bg-red-900/40 text-red-300 ring-red-700/40',
}

function fmt(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}k`
  return `$${n.toFixed(2)}`
}

export default function ProfileHeader({ profile, badges, totalPositions, totalPnl, activeSince }: Props) {
  const pnlColor = totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
  const initial = (profile.name || '?').charAt(0).toUpperCase()

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="shrink-0">
          {profile.profileImage ? (
            <img
              src={profile.profileImage}
              alt={profile.name}
              className="h-20 w-20 rounded-full object-cover ring-2 ring-slate-600"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-3xl font-bold text-white ring-2 ring-slate-600">
              {initial}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-white">@{profile.name}</h2>
            {profile.pseudonym && (
              <span className="text-sm text-slate-500">({profile.pseudonym})</span>
            )}
            <a
              href={`https://polymarket.com/@${profile.name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-indigo-600/20 px-2.5 py-1 text-xs font-medium text-indigo-400 ring-1 ring-indigo-500/30 hover:bg-indigo-600/30"
            >
              Polymarket →
            </a>
          </div>

          {profile.bio && (
            <p className="mt-1 text-sm text-slate-400">{profile.bio}</p>
          )}

          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <span className="text-slate-400">
              总仓位 <span className="font-semibold text-slate-200">{totalPositions.toLocaleString()}</span>
            </span>
            {activeSince && (
              <span className="text-slate-400">
                活跃自 <span className="font-semibold text-slate-200">{activeSince}</span>
              </span>
            )}
            <span className="text-slate-400">
              总 PnL{' '}
              <span className={`font-bold tabular-nums ${pnlColor}`}>
                {totalPnl >= 0 ? '+' : ''}{fmt(totalPnl)}
              </span>
            </span>
          </div>

          {badges.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {badges.map(badge => (
                <span
                  key={badge.id}
                  title={badge.description + (badge.count ? ` (${badge.count})` : '')}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${BADGE_COLORS[badge.id] ?? 'bg-slate-700/60 text-slate-300 ring-slate-600/40'}`}
                >
                  {badge.label}
                  {badge.count !== undefined && (
                    <span className="opacity-70">({badge.count})</span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xs text-slate-500">钱包地址</p>
          <p className="mt-0.5 font-mono text-xs text-slate-400">
            {profile.walletAddress.slice(0, 10)}…{profile.walletAddress.slice(-8)}
          </p>
        </div>
      </div>
    </div>
  )
}
