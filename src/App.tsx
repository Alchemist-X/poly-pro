import { useEffect, useState } from 'react'
import type { PositionRecord, SettledRecord, TabType } from './types'
import { fetchPositions, fetchSettled } from './utils/parseCSV'
import SummaryCards from './components/SummaryCards'
import TradeTable from './components/TradeTable'
import PnLBarChart from './components/PnLBarChart'
import PnLDistribution from './components/PnLDistribution'
import AnalysisPage from './analysis/AnalysisPage'

type ViewSection = 'overview' | 'table' | 'charts'
type AppMode = 'local' | 'live'

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('local')
  const [tab, setTab] = useState<TabType>('positions')
  const [section, setSection] = useState<ViewSection>('overview')
  const [positions, setPositions] = useState<PositionRecord[]>([])
  const [settled, setSettled] = useState<SettledRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchPositions(), fetchSettled()])
      .then(([pos, stt]) => {
        setPositions(pos)
        setSettled(stt)
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  const activeData = tab === 'positions' ? positions : settled

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="border-b border-slate-800 bg-slate-900/80 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Trader PnL Dashboard</h1>
            <p className="mt-0.5 text-xs text-slate-500">Polymarket 成交记录可视化分析</p>
          </div>

          {/* App mode toggle */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/40 p-1">
            {(['local', 'live'] as AppMode[]).map(m => (
              <button
                key={m}
                onClick={() => setAppMode(m)}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
                  appMode === m
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m === 'local' ? '本地数据' : '实时分析'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-screen-2xl px-6 py-6">
        {appMode === 'live' ? (
          <AnalysisPage />
        ) : (
          <>
            {/* Data source tabs */}
            <div className="mb-6 flex w-fit items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/40 p-1">
              {(['positions', 'settled'] as TabType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${
                    tab === t
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t === 'positions' ? '当前仓位' : '已结算'}
                </button>
              ))}
            </div>

            {loading && (
              <div className="flex h-64 items-center justify-center text-slate-500">
                <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                加载数据中…
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-700 bg-red-900/20 p-4 text-red-400">
                数据加载失败：{error}
              </div>
            )}

            {!loading && !error && (
              <div className="space-y-6">
                <div className="flex gap-2">
                  {(['overview', 'table', 'charts'] as ViewSection[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setSection(s)}
                      className={`rounded-lg px-4 py-1.5 text-sm transition-all ${
                        section === s
                          ? 'bg-slate-700 text-slate-100 font-medium'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {s === 'overview' ? '汇总概览' : s === 'table' ? '明细表格' : '可视化分析'}
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
  )
}
