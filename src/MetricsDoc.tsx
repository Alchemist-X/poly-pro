import { useI18n } from './i18n'

interface Section {
  title: string
  content: string[]
  example?: string
  table?: { headers: string[]; rows: string[][] }
}

const SECTIONS_ZH: Section[] = [
  {
    title: '1. Trader Badges（徽章系统）',
    content: ['根据用户持仓特征自动判定，满足条件即授予。'],
    table: {
      headers: ['徽章', '条件', '例子'],
      rows: [
        ['Bagholder', '100% 当前仓位的现价低于买入均价', '3 个仓位全部亏损 → 获得'],
        ['Trend Follower', '≥49% 仓位均价 > 0.8', '10 个仓位中 5 个均价 > 0.8 → 获得'],
        ['Contrarian', '≥30% 仓位均价 < 0.5', '10 个仓位中 4 个均价 < 0.5 → 获得'],
        ['Lottery Ticket', '≥5 个仓位：均价 < 0.2 且现价 > 0.9', '花 $0.15 买，涨到 $0.95，6 个 → 获得'],
        ['Whale Splash', '存在投入 > $20,000 的仓位', '某市场投入 $25k → 获得'],
        ['Millionaire', '总投入 ≥ $1,000,000', '累计投入 $1.2M → 获得'],
        ['Senior (1k+)', '总仓位数 ≥ 1000', '1,200 个仓位 → 获得'],
        ['Reverse Cramer', '≥5 个仓位：均价 > 0.8 且现价 < 0.1', '花 $0.85 买，跌到 $0.05，7 个 → 获得'],
      ],
    },
  },
  {
    title: '2. Summary Stats（概览统计）',
    content: [
      'Total Positions = 活跃仓位数 + 已结算仓位数',
      'Active Since = 最早一笔交易的时间',
      'Total PnL = Σ(已结算.realizedPnl) + Σ(活跃.cashPnl)',
    ],
    example: '50 活跃 + 800 已结算 = 850 总仓位\n已结算赚 $5,000 + 活跃浮盈 $800 = Total PnL $5,800',
  },
  {
    title: '3. Sharpe Ratio',
    content: [
      '衡量风险调整后的收益，值越高越好。',
      '公式：Sharpe = (mean(dailyPnl) / stddev(dailyPnl)) × √252',
      '√252 是年化因子（一年约 252 个交易日）。',
    ],
    example: '5 天 PnL: +$100, -$20, +$50, +$30, -$10\nmean = $30, stddev ≈ $48.48\nSharpe = (30/48.48) × √252 ≈ 9.82',
    table: {
      headers: ['Sharpe 区间', '评级'],
      rows: [['≥ 3', 'Exceptional'], ['≥ 2', 'Very Good'], ['≥ 1', 'Good'], ['≥ 0', 'Average'], ['< 0', 'Poor']],
    },
  },
  {
    title: '4. PnL Curve（累计 PnL 曲线）',
    content: [
      '使用 FIFO（先进先出）成本法从完整 trades 数据重建。',
      '每笔 SELL 时：PnL = 卖出收入 - FIFO 成本消耗',
      '逐笔累加得到历史曲线。',
    ],
    example: 'BUY 100 @ $0.40, BUY 50 @ $0.50\nSELL 120 @ $0.70\n成本 = 100×0.40 + 20×0.50 = $50\n收入 = 120×0.70 = $84\nPnL = +$34',
  },
  {
    title: '5. Finished Trades 散点图',
    content: [
      'X 轴 = 买入均价，Y 轴 = 卖出均价',
      '圆圈大小 = 投入金额（USD）',
      '对角线上方 = 盈利（绿），下方 = 亏损（红）',
    ],
    example: '市场 A: BUY @ 0.30, 0.35 → avgBuy = 0.325\nSELL @ 0.80 → avgSell = 0.80\n→ 点(0.325, 0.80) 绿色',
  },
  {
    title: '6. PnL by Question',
    content: [
      '按市场名称分组，汇总所有仓位的 PnL。',
      'Profit 图：PnL > 0 的 Top 15',
      'Loss 图：PnL < 0 的 Top 15',
    ],
    example: '"Will Trump win?" PnL = +$2,000 → 进 Profit 图\n"BTC > 100k?" PnL = -$500 → 进 Loss 图',
  },
  {
    title: '7. Categories（分类分析）',
    content: [
      '从 BUY trade 的标题匹配关键词归类（Politics / Sport / Crypto / Music / Culture / Weather）。',
      '交易次数 = 该分类下的 BUY 笔数',
      '胜率 = 卖出均价 > 买入价的比例',
    ],
    example: 'Politics 类 BUY 10 笔，7 笔 avgSell > buyPrice\nWin Rate = 7/10 = 70%',
  },
  {
    title: '8. ROI Distribution（ROI 分布）',
    content: [
      'ROI = (realizedPnl / totalBought) × 100%',
      '按区间分桶，Y 轴为该桶内 totalBought 之和（资金加权）。',
    ],
    example: '仓位 A: 投 $1,000, 赚 $250 → ROI 25% → [25%,50%) 桶\n仓位 B: 投 $500, 亏 $200 → ROI -40% → [-50%,-25%) 桶',
  },
  {
    title: '9. Price Bucket Distribution（价格区间）',
    content: [
      '所有 BUY 按价格分入 10 个桶 [0.0-0.1, 0.1-0.2, ..., 0.9-1.0]',
      'volume = Σ(size × price) 即 USDC 成交金额',
      '成交量最高的桶蓝色高亮',
    ],
    example: 'BUY 200 shares @ $0.35 → [0.3-0.4) 桶 += $70\nBUY 100 shares @ $0.72 → [0.7-0.8) 桶 += $72',
  },
  {
    title: '10. Recent Trades（最近交易）',
    content: [
      '取最近 20 笔交易，按时间倒序。',
      'Comment 列：金额 < 平均×0.3 → 💧小于平常；金额 > 平均×3 → 🔥大于平常',
    ],
  },
  {
    title: '11. Finished Positions 重建',
    content: [
      'API 只返回约 50 条。从 trades（最多 13,000 笔）用 FIFO 成本法重建完整列表。',
      'totalBought = Σ(buySize × buyPrice)',
      'realizedPnl = Σ(sellRevenue) - FIFO 成本消耗',
    ],
    example: 'BUY 50@$0.40 + BUY 30@$0.50 = 投入$35\nSELL 60@$0.80 = 收入$48\nFIFO成本 = 50×0.40+10×0.50 = $25\nPnL = $48 - $25 = +$23',
  },
  {
    title: '12. Best / Worst Trade',
    content: [
      'Best = 已结算中 realizedPnl 最大的那笔',
      'Worst = 已结算中 realizedPnl 最小的那笔（负数）',
      '直接按金额排序。',
    ],
  },
]

const SECTIONS_EN: Section[] = [
  {
    title: '1. Trader Badges',
    content: ['Automatically assigned based on position characteristics.'],
    table: {
      headers: ['Badge', 'Condition', 'Example'],
      rows: [
        ['Bagholder', '100% positions below entry price', '3 positions all underwater → earned'],
        ['Trend Follower', '≥49% positions avg price > 0.8', '5/10 positions priced > 0.8 → earned'],
        ['Contrarian', '≥30% positions avg price < 0.5', '4/10 positions priced < 0.5 → earned'],
        ['Lottery Ticket', '≥5 positions: avg < 0.2, cur > 0.9', 'Bought @ $0.15, now $0.95, 6 of them → earned'],
        ['Whale Splash', 'Any position > $20,000 invested', '$25k in one market → earned'],
        ['Millionaire', 'Total invested ≥ $1,000,000', '$1.2M total → earned'],
        ['Senior (1k+)', 'Total positions ≥ 1000', '1,200 positions → earned'],
        ['Reverse Cramer', '≥5 positions: avg > 0.8, cur < 0.1', 'Bought @ $0.85, dropped to $0.05, 7 of them → earned'],
      ],
    },
  },
  {
    title: '2. Summary Stats',
    content: [
      'Total Positions = active + finished count',
      'Active Since = earliest trade timestamp',
      'Total PnL = Σ(finished.realizedPnl) + Σ(active.cashPnl)',
    ],
    example: '50 active + 800 finished = 850 total\nFinished earned $5,000 + active float $800 = $5,800',
  },
  {
    title: '3. Sharpe Ratio',
    content: [
      'Measures risk-adjusted returns. Higher is better.',
      'Sharpe = (mean(dailyPnl) / stddev(dailyPnl)) × √252',
      '√252 annualizes (~252 trading days/year).',
    ],
    example: '5-day PnL: +$100, -$20, +$50, +$30, -$10\nmean = $30, stddev ≈ $48.48\nSharpe ≈ 9.82',
    table: {
      headers: ['Sharpe Range', 'Rating'],
      rows: [['≥ 3', 'Exceptional'], ['≥ 2', 'Very Good'], ['≥ 1', 'Good'], ['≥ 0', 'Average'], ['< 0', 'Poor']],
    },
  },
  {
    title: '4. PnL Curve',
    content: [
      'Rebuilt from full trades using FIFO cost basis.',
      'On each SELL: PnL = sell revenue - FIFO cost consumed',
      'Cumulative sum over time produces the curve.',
    ],
    example: 'BUY 100@$0.40, BUY 50@$0.50\nSELL 120@$0.70\nCost = 100×0.40 + 20×0.50 = $50\nRevenue = $84 → PnL = +$34',
  },
  {
    title: '5. Finished Trades Scatter',
    content: [
      'X = avg buy price, Y = avg sell price',
      'Circle size = USD invested',
      'Above diagonal = profit (green), below = loss (red)',
    ],
    example: 'Market A: BUY@0.30,0.35 → avgBuy=0.325\nSELL@0.80 → avgSell=0.80\n→ point (0.325, 0.80) green',
  },
  {
    title: '6. PnL by Question',
    content: ['Group all positions by market title, sum PnL.', 'Top 15 profit / Top 15 loss displayed.'],
    example: '"Will Trump win?" PnL = +$2,000 → Profit chart\n"BTC > 100k?" PnL = -$500 → Loss chart',
  },
  {
    title: '7. Categories',
    content: [
      'Classify BUY trades by title keywords (Politics/Sport/Crypto/Music/Culture/Weather).',
      'Trade count = BUY trades in category',
      'Win rate = proportion where avgSell > buyPrice',
    ],
    example: 'Politics: 10 BUYs, 7 profitable → Win Rate = 70%',
  },
  {
    title: '8. ROI Distribution',
    content: ['ROI = (realizedPnl / totalBought) × 100%', 'Bucketed, Y-axis = sum of totalBought (capital-weighted).'],
    example: 'Position A: $1k invested, +$250 → ROI 25% → [25%,50%) bucket\nPosition B: $500 invested, -$200 → ROI -40% → [-50%,-25%) bucket',
  },
  {
    title: '9. Price Bucket Distribution',
    content: ['BUY trades split into 10 price buckets [0.0-0.1 ... 0.9-1.0]', 'volume = Σ(size × price) in USDC', 'Highest volume bucket highlighted blue.'],
    example: 'BUY 200@$0.35 → [0.3-0.4) += $70\nBUY 100@$0.72 → [0.7-0.8) += $72',
  },
  {
    title: '10. Recent Trades',
    content: ['Latest 20 trades by timestamp desc.', 'Comment: amount < avg×0.3 → 💧 smaller; amount > avg×3 → 🔥 larger'],
  },
  {
    title: '11. Finished Positions Rebuild',
    content: [
      'API returns ~50 records. Full list rebuilt from trades (up to 13k) using FIFO.',
      'totalBought = Σ(buySize × buyPrice)',
      'realizedPnl = Σ(sellRevenue) - FIFO cost consumed',
    ],
    example: 'BUY 50@$0.40 + BUY 30@$0.50 = $35 invested\nSELL 60@$0.80 = $48 revenue\nFIFO cost = $25 → PnL = +$23',
  },
  {
    title: '12. Best / Worst Trade',
    content: ['Best = highest realizedPnl among finished', 'Worst = lowest realizedPnl (negative)', 'Ranked by absolute dollar amount.'],
  },
]

export default function MetricsDoc({ onBack }: { onBack: () => void }) {
  const { locale, t } = useI18n()
  const sections = locale === 'zh' ? SECTIONS_ZH : SECTIONS_EN

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dune-border bg-dune-card px-3 py-1.5 text-xs text-dune-muted transition hover:text-dune-text">
        ← {t('nav.back')}
      </button>

      <h2 className="text-2xl font-bold text-dune-text">{t('nav.docs')}</h2>
      <p className="text-sm text-dune-muted">{locale === 'zh' ? '所有图表背后的指标和公式，附简单例子。' : 'All metrics and formulas behind every chart, with simple examples.'}</p>

      {sections.map((s, i) => (
        <div key={i} className="rounded-xl border border-dune-border bg-dune-card p-5 space-y-3">
          <h3 className="text-base font-semibold text-dune-text">{s.title}</h3>
          {s.content.map((line, j) => (
            <p key={j} className="text-sm text-dune-muted leading-relaxed">{line}</p>
          ))}
          {s.table && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-dune-border">
                    {s.table.headers.map((h, j) => (
                      <th key={j} className="px-3 py-2 text-left font-medium uppercase tracking-wider text-dune-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {s.table.rows.map((row, j) => (
                    <tr key={j} className="border-b border-dune-border/50">
                      {row.map((cell, k) => (
                        <td key={k} className="px-3 py-2 text-dune-text">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {s.example && (
            <pre className="rounded-lg bg-dune-bg p-3 text-xs text-dune-muted leading-relaxed whitespace-pre-wrap font-mono">{s.example}</pre>
          )}
        </div>
      ))}
    </div>
  )
}
