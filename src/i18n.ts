import { createContext, useContext } from 'react'

export type Locale = 'zh' | 'en'

const dict: Record<string, Record<Locale, string>> = {
  'app.title': { zh: 'Trader PnL Dashboard', en: 'Trader PnL Dashboard' },
  'app.subtitle': { zh: 'Polymarket 交易分析', en: 'Polymarket Trading Analysis' },
  'mode.local': { zh: '本地数据', en: 'Local Data' },
  'mode.live': { zh: '实时分析', en: 'Live Analysis' },

  'search.placeholder': { zh: '输入用户名 (Car / @Car) 或钱包地址 (0x...)', en: 'Enter username (Car / @Car) or wallet (0x...)' },
  'search.analyze': { zh: '分析', en: 'Analyze' },
  'search.loading': { zh: '加载中…', en: 'Loading…' },
  'search.example': { zh: '示例: @Car', en: 'Example: @Car' },
  'search.resolved': { zh: '已解析用户名 →', en: 'Resolved username →' },

  'loading.fetching': { zh: '并发拉取链上数据中…', en: 'Fetching on-chain data concurrently…' },
  'loading.resolving': { zh: '正在解析用户名…', en: 'Resolving username…' },
  'loading.requesting': { zh: '并发请求 positions / closed-positions / trades…', en: 'Requesting positions / closed-positions / trades…' },
  'loading.done': { zh: '已加载', en: 'Loaded' },
  'loading.trades': { zh: '笔交易', en: 'trades' },
  'loading.failed': { zh: '加载失败', en: 'Failed to load' },

  'stats.loaded': { zh: '已加载', en: 'Loaded' },
  'stats.trades': { zh: '笔交易', en: 'trades' },
  'stats.active': { zh: '活跃仓位', en: 'active positions' },
  'stats.settled': { zh: '已结算', en: 'settled' },

  'profile.wallet': { zh: '钱包地址', en: 'Wallet Address' },
  'profile.viewPoly': { zh: '在 Polymarket 上查看', en: 'View on Polymarket' },

  'summary.totalPositions': { zh: '总仓位', en: 'Total Positions' },
  'summary.activeSince': { zh: '活跃自', en: 'Active Since' },
  'summary.days': { zh: '天', en: 'days' },
  'summary.totalPnl': { zh: '总 PnL', en: 'Total PnL' },

  'badge.bagholder': { zh: 'Bagholder', en: 'Bagholder' },
  'badge.trend-follower': { zh: 'Trend Follower', en: 'Trend Follower' },
  'badge.contrarian': { zh: 'Contrarian', en: 'Contrarian' },
  'badge.lottery-ticket': { zh: 'Lottery Ticket', en: 'Lottery Ticket' },
  'badge.whale-splash': { zh: 'Whale Splash', en: 'Whale Splash' },
  'badge.millionaire': { zh: 'Millionaire Investor', en: 'Millionaire Investor' },
  'badge.senior': { zh: 'Senior (1k+)', en: 'Senior (1k+)' },
  'badge.reverse-cramer': { zh: 'Reverse Cramer', en: 'Reverse Cramer' },

  'table.positions': { zh: '当前仓位', en: 'Current Positions' },
  'table.finished': { zh: '已结算仓位', en: 'Finished Positions' },
  'table.recentTrades': { zh: '最近交易', en: 'Recent Trades' },
  'table.search': { zh: '搜索市场…', en: 'Search markets…' },
  'table.csv': { zh: '导出 CSV', en: 'Export CSV' },
  'table.showing': { zh: '显示', en: 'Showing' },
  'table.of': { zh: '/ 共', en: 'of' },
  'table.records': { zh: '条', en: 'records' },
  'table.expandAll': { zh: '点击展开全部', en: 'Click to expand all' },
  'table.collapsePreview': { zh: '收起', en: 'Collapse' },

  'col.question': { zh: '市场问题', en: 'Question' },
  'col.position': { zh: '持仓量', en: 'Position' },
  'col.avgPrice': { zh: '均价', en: 'Avg Price' },
  'col.curPrice': { zh: '现价', en: 'Current Price' },
  'col.realizedPnl': { zh: '已实现 PnL', en: 'Realized PnL' },
  'col.totalInvested': { zh: '总投入', en: 'Total Invested' },
  'col.unrealizedPnl': { zh: '未实现 PnL', en: 'Unrealized PnL' },
  'col.overallPnl': { zh: '总 PnL', en: 'Overall PnL' },
  'col.overallPnlPct': { zh: 'PnL (%)', en: 'PnL (%)' },
  'col.timestamp': { zh: '时间', en: 'Timestamp' },
  'col.side': { zh: '方向', en: 'Side' },
  'col.price': { zh: '价格', en: 'Price' },
  'col.usdAmount': { zh: '金额 (USD)', en: 'USD Amount' },
  'col.shares': { zh: '份额', en: 'Shares' },
  'col.comment': { zh: '备注', en: 'Comment' },

  'chart.pnlCurve': { zh: '历史 PnL 曲线', en: 'Historical PnL Curve' },
  'chart.pnlCurveDesc': { zh: '累计已实现盈亏（按结算时间排序）', en: 'Cumulative realized PnL (by settlement time)' },
  'chart.finishedTrades': { zh: '已结算交易', en: 'Finished Trades' },
  'chart.finishedTradesDesc': { zh: '绿区=盈利，红区=亏损，圆圈大小=交易金额', en: 'Green = profit, Red = loss, Circle size = USD value' },
  'chart.pnlProfit': { zh: 'PnL by Question - Profit', en: 'PnL by Question - Profit' },
  'chart.pnlLoss': { zh: 'PnL by Question - Loss', en: 'PnL by Question - Loss' },
  'chart.mostTraded': { zh: '最多交易分类', en: 'Most Traded Categories' },
  'chart.winRate': { zh: '各分类胜率', en: 'Win Rate by Category' },
  'chart.roiDist': { zh: 'ROI 分布（资金加权）', en: 'ROI Distribution (Capital Weighted)' },
  'chart.roiDistDesc': { zh: 'X轴=投资回报率区间，Y轴=对应区间总投入', en: 'X = ROI range, Y = total invested in range' },
  'chart.priceBucket': { zh: '价格区间成交分布', en: 'Price Bucket Distribution' },
  'chart.priceBucketDesc': { zh: '按买入价格分布的 USDC 成交量', en: 'USDC volume by buy price range' },

  'trade.bestRoi': { zh: '最佳交易', en: 'Best Trade' },
  'trade.worstRoi': { zh: '最差交易', en: 'Worst Trade' },
  'trade.smallerThanUsual': { zh: '小于平常', en: 'Smaller than usual' },
  'trade.largerThanUsual': { zh: '大于平常', en: 'Larger than usual' },

  'section.badges': { zh: 'Trader 徽章', en: 'Trader Badges' },
  'section.summary': { zh: '概览统计', en: 'Summary Stats' },
  'section.sharpe': { zh: 'Sharpe Ratio & 最佳/最差交易', en: 'Sharpe Ratio & Best/Worst Trades' },
  'section.positions': { zh: '当前仓位', en: 'Current Positions' },
  'section.finished': { zh: '已结算仓位', en: 'Finished Positions' },
  'section.scatter': { zh: '已结算交易散点图', en: 'Finished Trades Chart' },
  'section.pnlByQ': { zh: 'PnL by Question', en: 'PnL by Question' },
  'section.categories': { zh: '分类分析', en: 'Category Breakdown' },
  'section.pnlCurve': { zh: '历史 PnL 曲线', en: 'Historical PnL Curve' },
  'section.roiPrice': { zh: 'ROI 分布 & 价格区间', en: 'ROI Distribution & Price Buckets' },
  'section.recentTrades': { zh: '最近交易', en: 'Recent Trades' },
  'section.expandAll': { zh: '全部展开', en: 'Expand All' },
  'section.collapseAll': { zh: '全部收起', en: 'Collapse All' },

  'nav.docs': { zh: '指标文档', en: 'Metrics Docs' },
  'nav.back': { zh: '返回分析', en: 'Back to Analysis' },
  'home.title': { zh: '分析任意 Polymarket Trader', en: 'Analyze Any Polymarket Trader' },
  'home.subtitle': { zh: '输入用户名或钱包地址，查看完整的交易分析报告', en: 'Enter a username or wallet address for a full trading analysis report' },
  'home.presets': { zh: '或者试试这些 Trader', en: 'Or try one of these traders' },
}

export interface I18nContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string) => string
}

function createT(locale: Locale) {
  return (key: string): string => dict[key]?.[locale] ?? key
}

export const I18nContext = createContext<I18nContextValue>({
  locale: 'zh',
  setLocale: () => {},
  t: createT('zh'),
})

export function useI18n() {
  return useContext(I18nContext)
}

export { createT }
