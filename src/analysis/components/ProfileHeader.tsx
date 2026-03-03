import type { TraderProfile } from '../../utils/polyApi'
import { useI18n } from '../../i18n'

interface Props {
  profile: TraderProfile
}

export default function ProfileHeader({ profile }: Props) {
  const { t } = useI18n()
  const initial = (profile.name || '?').charAt(0).toUpperCase()

  return (
    <div className="rounded-xl border border-dune-border bg-dune-card p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="shrink-0">
          {profile.profileImage ? (
            <img src={profile.profileImage} alt={profile.name}
              className="h-20 w-20 rounded-full object-cover ring-2 ring-dune-border" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-dune-blue to-dune-purple text-3xl font-bold text-white ring-2 ring-dune-border">
              {initial}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-dune-text">@{profile.name}</h2>
            {profile.pseudonym && (
              <span className="text-sm text-dune-muted">({profile.pseudonym})</span>
            )}
          </div>
          {profile.bio && <p className="mt-1 text-sm text-dune-muted">{profile.bio}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <a href={`https://polymarket.com/@${profile.name}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-dune-blue/15 px-3 py-1.5 text-xs font-medium text-dune-blue ring-1 ring-dune-blue/30 transition hover:bg-dune-blue/25">
              {t('profile.viewPoly')} →
            </a>
            <span className="font-mono text-xs text-dune-muted">
              {profile.walletAddress.slice(0, 10)}…{profile.walletAddress.slice(-8)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
