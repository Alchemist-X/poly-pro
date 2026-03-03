import { useEffect, useState, useMemo } from 'react'
import type { PositionRecord, SettledRecord, TabType } from './types'
import { fetchPositions, fetchSettled } from './utils/parseCSV'
import SummaryCards from './components/SummaryCards'
import TradeTable from './components/TradeTable'
import PnLBarChart from './components/PnLBarChart'
import PnLDistribution from './components/PnLDistribution'
import AnalysisPage from './analysis/AnalysisPage'
import { I18nContext, createT, type Locale } from './i18n'

type ViewSection = 'overview' | 'table' | 'charts'
type AppMode = 'local' | 'live'

export default function App() {
  const [locale, setLocale] = useState<Locale>('zh')
  const i18nValue = useMemo(() => ({
    locale,
    setLocale,
    t: createT(locale),
  }), [locale])

  const [appMode, setAppMode] = useState<AppMode>('live')
  const [tab, setTab] = useState<TabType>('positions')
  const [section, setSection] = useState<ViewSection>('overview')
  const [positions, setPositions] = useState<PositionRecord[]>([])
  const [settled, setSettled] = useState<SettledRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchPositions(), fetchSettled()])
      .then(([pos, stt]) => { setPositions(pos); setSettled(stt) })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  const activeData = tab === 'positions' ? positions : settled

  return (
    <I18nContext.Provider value={i18nValue}>
      <div className="min-h-screen bg-dune-bg text-dune-text">
        <header className="border-b border-dune-border bg-dune-card/80 px-6 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-dune-text">{i18nValue.t('app.title')}</h1>
              <p className="mt-0.5 text-xs text-dune-muted">{i18nValue.t('app.subtitle')}</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Language toggle */}
              <button
                onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
                className="rounded-lg border border-dune-border bg-dune-bg px-3 py-1.5 text-xs font-medium text-dune-muted transition hover:text-dune-text"
              >
                {locale === 'zh' ? 'EN' : '中文'}
              </button>

              {/* Mode toggle */}
              <div className="flex items-center gap-1 rounded-xl border border-dune-border bg-dune-bg p-1">
                {(['local', 'live'] as AppMode[]).map(m => (
                  <button key={m} onClick={() => setAppMode(m)}
                    className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
                      appMode === m ? 'bg-dune-blue text-white shadow' : 'text-dune-muted hover:text-dune-text'
                    }`}>
                    {i18nValue.t(`mode.${m}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-screen-2xl px-6 py-6">
          {appMode === 'live' ? (
            <AnalysisPage />
          ) : (
            <>
              <div className="mb-6 flex w-fit items-center gap-1 rounded-xl border border-dune-border bg-dune-bg p-1">
                {(['positions', 'settled'] as TabType[]).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${
                      tab === t ? 'bg-dune-blue text-white shadow' : 'text-dune-muted hover:text-dune-text'
                    }`}>
                    {i18nValue.t(`local.${t}`)}
                  </button>
                ))}
              </div>

              {loading && (
                <div className="flex h-64 items-center justify-center text-dune-muted">
                  <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Loading…
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-dune-red/40 bg-dune-red/10 p-4 text-dune-red">
                  {error}
                </div>
              )}

              {!loading && !error && (
                <div className="space-y-6">
                  <div className="flex gap-2">
                    {(['overview', 'table', 'charts'] as ViewSection[]).map(s => (
                      <button key={s} onClick={() => setSection(s)}
                        className={`rounded-lg px-4 py-1.5 text-sm transition-all ${
                          section === s ? 'bg-dune-card text-dune-text font-medium border border-dune-border' : 'text-dune-muted hover:text-dune-text'
                        }`}>
                        {i18nValue.t(`local.${s}`)}
                      </button>
                    ))}
                  </div>

                  {section === 'overview' && (
                    <div className="space-y-8">
                      <SummaryCards data={activeData} mode={tab} />
                      <PnLBarChart data={activeData} mode={tab} topN={10} />
                      <PnLDistribution data={activeData} mode={tab} bins={30} />
                    </div>
                  )}
                  {section === 'table' && <TradeTable data={activeData} mode={tab} />}
                  {section === 'charts' && (
                    <div className="space-y-8">
                      <PnLBarChart data={activeData} mode={tab} topN={15} />
                      <PnLDistribution data={activeData} mode={tab} bins={40} />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </I18nContext.Provider>
  )
}
