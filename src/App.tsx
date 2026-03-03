import { useState, useMemo } from 'react'
import AnalysisPage from './analysis/AnalysisPage'
import MetricsDoc from './MetricsDoc'
import { I18nContext, createT, type Locale } from './i18n'

type Page = 'home' | 'docs'

export default function App() {
  const [locale, setLocale] = useState<Locale>('zh')
  const i18n = useMemo(() => ({ locale, setLocale, t: createT(locale) }), [locale])
  const [page, setPage] = useState<Page>('home')

  return (
    <I18nContext.Provider value={i18n}>
      <div className="min-h-screen bg-dune-bg text-dune-text">
        <header className="border-b border-dune-border bg-dune-card/80 px-6 py-3 backdrop-blur sticky top-0 z-50">
          <div className="mx-auto flex max-w-screen-2xl items-center justify-between">
            <button onClick={() => setPage('home')} className="flex items-center gap-2 transition hover:opacity-80">
              <span className="text-lg font-bold text-dune-text">Poly-Pro</span>
              <span className="hidden sm:inline text-xs text-dune-muted">Polymarket Analytics</span>
            </button>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(page === 'docs' ? 'home' : 'docs')}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  page === 'docs'
                    ? 'border-dune-blue bg-dune-blue/10 text-dune-blue'
                    : 'border-dune-border text-dune-muted hover:text-dune-text'
                }`}>
                {i18n.t('nav.docs')}
              </button>
              <button onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
                className="rounded-lg border border-dune-border px-3 py-1.5 text-xs font-medium text-dune-muted transition hover:text-dune-text">
                {locale === 'zh' ? 'EN' : '中文'}
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-screen-2xl px-6 py-6">
          {page === 'docs' ? (
            <MetricsDoc onBack={() => setPage('home')} />
          ) : (
            <AnalysisPage />
          )}
        </div>
      </div>
    </I18nContext.Provider>
  )
}
