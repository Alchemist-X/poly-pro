# Poly-Pro 指标与公式文档

本文档说明 Dashboard 中每一个图表 / 指标背后的计算逻辑，并给出简单例子。

---

## 1. Trader Badges（徽章系统）

根据用户持仓特征自动判定，满足条件即授予。

| 徽章 | 条件 | 例子 |
|------|------|------|
| **Bagholder** | 100% 当前仓位的 `curPrice < avgPrice` | 你有 3 个仓位，全部现价低于买入均价 → 获得 |
| **Trend Follower** | ≥49% 当前仓位的 `avgPrice > 0.8` | 10 个仓位中 5 个均价 > 0.8 → 50% ≥ 49% → 获得 |
| **Contrarian** | ≥30% 当前仓位的 `avgPrice < 0.5` | 10 个仓位中 4 个均价 < 0.5 → 40% ≥ 30% → 获得 |
| **Lottery Ticket** | ≥5 个仓位满足 `avgPrice < 0.2` 且 `curPrice > 0.9` | 花 $0.15 买入，现在涨到 $0.95，有 6 个这样的 → 获得 |
| **Whale Splash** | 存在 `totalBought > $20,000` 的仓位 | 某市场一次投入 $25,000 → 获得 |
| **Millionaire Investor** | 所有仓位 `totalBought` 之和 ≥ $1,000,000 | 累计投入 $1.2M → 获得 |
| **Senior (1k+)** | 总仓位数（活跃 + 已结算）≥ 1000 | 有 1,200 个仓位 → 获得 |
| **Reverse Cramer** | ≥5 个仓位满足 `avgPrice > 0.8` 且 `curPrice < 0.1` | 花 $0.85 买入，跌到 $0.05，有 7 个这样的 → 获得 |

---

## 2. Summary Stats（概览统计）

| 指标 | 公式 | 例子 |
|------|------|------|
| **Total Positions** | `活跃仓位数 + 已结算仓位数` | 50 活跃 + 800 已结算 = 850 |
| **Active Since** | `min(所有 trades 和 closedPositions 的 timestamp)` | 最早交易是 2022-03-15 → 显示 "Mar 2022"，距今 1085 天 |
| **Total PnL** | `Σ(已结算.realizedPnl) + Σ(活跃.cashPnl)` | 已结算赚了 $5,000 + 活跃浮盈 $800 = $5,800 |

---

## 3. Sharpe Ratio

衡量风险调整后的收益，值越高越好。

**公式：**

```
dailyPnl[i] = 第 i 天所有结算事件的 PnL 之和
mean         = avg(dailyPnl)
stddev       = std(dailyPnl)        （样本标准差，N-1）
Sharpe       = (mean / stddev) × √252
```

`√252` 是年化因子（一年约 252 个交易日）。

**例子：**

假设 5 天的 daily PnL 分别为 `+$100, -$20, +$50, +$30, -$10`：

```
mean   = (100 - 20 + 50 + 30 - 10) / 5 = $30
var    = [(70² + 50² + 20² + 0² + 40²)] / 4 = 2350
stddev = √2350 ≈ $48.48
Sharpe = (30 / 48.48) × √252 ≈ 0.62 × 15.87 ≈ 9.82
```

| Sharpe 区间 | 评级 |
|-------------|------|
| ≥ 3 | Exceptional |
| ≥ 2 | Very Good |
| ≥ 1 | Good |
| ≥ 0 | Average |
| < 0 | Poor |

---

## 4. Historical PnL Curve（累计 PnL 曲线）

使用 **FIFO（先进先出）成本法** 从完整 trades 数据重建。

**算法：**

1. 按时间排序所有交易
2. 每个 `conditionId` 维护一个 FIFO 成本队列 `[(price, size), ...]`
3. 遇到 BUY → 入队 `(price, size)`
4. 遇到 SELL → 从队头消耗 lots，计算 `realizedPnl = sellRevenue - costConsumed`
5. 累加得到曲线

**例子：**

```
BUY  100 shares @ $0.40  → 队列: [(0.40, 100)]
BUY   50 shares @ $0.50  → 队列: [(0.40, 100), (0.50, 50)]
SELL 120 shares @ $0.70  → 消耗: 100×0.40 + 20×0.50 = $50
                           收入: 120×0.70 = $84
                           PnL = $84 - $50 = +$34
                           队列剩余: [(0.50, 30)]
```

---

## 5. Finished Trades Chart（散点图）

每个已结算市场（`conditionId`）计算一个点：

```
avgBuy  = mean(该市场所有 BUY 的 price)
avgSell = mean(该市场所有 SELL 的 price)
invested = Σ(buyPrice × buySize)      → 决定圆圈大小
```

- **X 轴** = avgBuy（买入均价）
- **Y 轴** = avgSell（卖出均价）
- 在 `y = x` 对角线上方 → 盈利（绿色）；下方 → 亏损（红色）

**例子：**

```
市场 A: BUY @ 0.30, 0.35 → avgBuy = 0.325
        SELL @ 0.80      → avgSell = 0.80
        → 点 (0.325, 0.80) 绿色，invested=$325
```

---

## 6. PnL by Question（按市场盈亏柱状图）

将所有仓位（活跃 + 已结算）按 `title`（市场名称）分组：

```
每个市场的 PnL = Σ(活跃仓位.cashPnl) + Σ(已结算.realizedPnl)
```

- **Profit 图**：取 PnL > 0 的 Top 15，降序
- **Loss 图**：取 PnL < 0 的 Top 15，升序（亏最多在上）

**例子：**

```
"Will Trump win?" → 活跃 PnL $0 + 已结算 PnL +$2,000 = +$2,000 → 进 Profit 图
"BTC > 100k?"     → 已结算 PnL -$500                   = -$500  → 进 Loss 图
```

---

## 7. Most Traded Categories（分类交易次数）

从每笔 BUY trade 的 `title` 中匹配关键词归类：

| 分类 | 关键词示例 |
|------|-----------|
| Politics | election, trump, biden, war, ukraine... |
| Sport | nba, nfl, soccer, world cup... |
| Crypto | bitcoin, btc, ethereum, defi... |
| Music | grammy, billboard, spotify... |
| Culture | oscar, emmy, netflix... |
| Weather | hurricane, earthquake, storm... |
| Other | 未匹配到任何关键词 |

`count` = 该分类下的 BUY 交易笔数。

---

## 8. Win Rate by Category（分类胜率）

对于每个分类中的 BUY 交易：

```
avgSellPrice = mean(同一 conditionId 下所有 SELL 的 price)
如果 avgSellPrice > buyPrice → win
否则 → loss

winRate = wins / (wins + losses)
```

**例子：**

```
Politics 类 BUY 10 笔，其中 7 笔的 avgSell > buyPrice
winRate = 7 / 10 = 70%
```

---

## 9. ROI Distribution（ROI 分布）

对每个已结算仓位：

```
ROI = (realizedPnl / totalBought) × 100%
```

按 ROI 区间分桶 `[-100%, -50%, -25%, -10%, 0%, 10%, 25%, 50%, 100%, 200%, 500%, ∞)`，Y 轴为该桶内 `totalBought` 之和（资金加权）。

**例子：**

```
仓位 A: invested $1,000, PnL +$250 → ROI = 25% → 落入 [25%, 50%) 桶
仓位 B: invested $500,  PnL -$200 → ROI = -40% → 落入 [-50%, -25%) 桶
[25%, 50%) 桶的 Y 值 = $1,000
[-50%, -25%) 桶的 Y 值 = $500
```

---

## 10. Price Bucket Distribution（价格区间成交分布）

将所有 BUY 交易按 `price` 分入 10 个等宽桶 `[0.0-0.1, 0.1-0.2, ..., 0.9-1.0]`：

```
volume = Σ(size × price)   （USDC 成交金额）
```

**例子：**

```
BUY 200 shares @ $0.35 → 落入 [0.3-0.4) 桶, volume += 200×0.35 = $70
BUY 100 shares @ $0.72 → 落入 [0.7-0.8) 桶, volume += 100×0.72 = $72
```

颜色：成交量最高的桶用蓝色高亮，其余为灰色。

---

## 11. Recent Trades（最近交易表）

取所有 trades 按 `timestamp` 降序排列，显示最近 20 笔。

**Comment 列逻辑：**

```
avgBuySize = mean(所有 BUY 交易的 size × price)
当前交易 usdAmount = size × price

usdAmount < avgBuySize × 0.3 → 💧 "小于平常"
usdAmount > avgBuySize × 3   → 🔥 "大于平常"
```

---

## 12. Finished Positions（已结算仓位重建）

API 只返回约 50 条已结算仓位。为获得完整数据，从 trades（最多 13,000 笔）重建：

1. 按 `conditionId` 分组所有交易
2. 排除仍在活跃的仓位
3. 优先使用 API 返回的 `ClosedPosition`（数据更准确）
4. 对 API 未覆盖的 conditionId，用 FIFO 成本法计算：

```
totalBought = Σ(buySize × buyPrice)
avgPrice    = totalBought / Σ(buySize)
realizedPnl = Σ(sellSize × sellPrice) - FIFO成本消耗
```

**例子：**

```
conditionId "abc":
  BUY  50 @ $0.40 = $20
  BUY  30 @ $0.50 = $15
  SELL 60 @ $0.80 = $48

totalBought = $35
avgPrice = $35 / 80 = $0.4375
FIFO 成本 = 50×0.40 + 10×0.50 = $25
realizedPnl = $48 - $25 = +$23
```

---

## 13. Best / Worst Trade

- **Best Trade** = `allFinished` 中 `realizedPnl` 最大的（> 0）
- **Worst Trade** = `allFinished` 中 `realizedPnl` 最小的（< 0）

直接按金额排序，不使用百分比。
