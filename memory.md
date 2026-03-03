# Poly-Pro 开发回顾

## 项目时间线

1. **CSV 本地分析阶段** — 搭建 Vite + React + TypeScript + TanStack Table + Recharts 基础架构，实现对导出 CSV（当前仓位 / 已结算）的排序、筛选、PnL 可视化。
2. **实时 API 分析阶段** — 接入 Polymarket Data API（positions / closed-positions / trades），实现并发分片拉取（6 路并发，最多 13000 笔交易），完成 FIFO 成本法 PnL 曲线重建、Sharpe Ratio、Badge 系统等。
3. **用户名解析** — 通过解析 Polymarket 页面 SSR 数据（`__NEXT_DATA__`）实现用户名 → 钱包地址映射，同时支持 Vite dev middleware 和 Vercel Serverless Function。
4. **Vercel 部署** — 配置 vercel.json rewrites 代理 API 请求，解决生产环境 CORS。
5. **HashDive 1:1 复刻 + Dune Analytics 重构** — 全面重写 UI 为 Dune 暗色主题，新增 6 个组件（PositionsTable / FinishedTable / RecentTrades / PnlByQuestion / BadgeGrid / SummaryStats），实现 i18n 中英文切换，按 HashDive 15 section 布局重组页面。

## 技术选型心得

- **Vite** 启动极快，HMR 几乎无感；配合 TypeScript 严格模式能在编译期捕获大量类型错误。
- **TanStack Table v8** 的 headless 设计非常灵活，但 `ColumnDef` 的泛型类型推断需要 `createColumnHelper` 才能获得良好 DX。
- **Recharts** 适合快速出图，自定义 Tooltip 的体验远好于默认样式；但对于复杂交互（缩放、平移、多系列联动）不如 Plotly/ECharts。
- **Tailwind CSS** 用 CSS 变量 + `extend.colors` 的方式做主题很优雅，一套 Dune 配色可以全局统一。

## Polymarket API 踩坑记录

1. **CORS** — 浏览器直接请求 data-api.polymarket.com 会被拒绝，必须走代理（dev: Vite proxy, prod: Vercel rewrites）。
2. **trades offset 上限 3000** — `offset` 参数超过 3000 直接返回 400；解决方案是分片并发 + 大块拼接 + transactionHash 去重。
3. **closed-positions 硬限 ~50 条** — 无论怎么设置 limit/offset，最多返回约 50 条；PnL 曲线必须从 trades 数据用 FIFO 重算。
4. **用户名接口不公开** — Gamma API 的 `/profiles` 端点缺乏文档且不稳定，最终采用 SSR 页面解析方案。

## Vercel 部署经验

- `vercel.json` 中 rewrites 的 `(.*)` 捕获必须放在最后，否则会吞掉 API 路由。
- Serverless Function 放在 `/api` 目录下会自动识别，但必须加 `@vercel/node` 类型依赖。
- 前端 SPA 需要一条 `"/(.*)" → "/index.html"` 的 fallback rewrite。

## UI 风格迁移感悟

从 slate 系到 Dune Analytics 暗色系的迁移中，发现用 CSS 变量 + Tailwind 的 `dune-*` 命名空间可以做到「改一处、全局生效」。卡片的微弱 hover 发光（`bg-dune-card-hover`）和一致的 `#2d3039` 边框让整体视觉非常统一。

数据密集型页面的可读性核心在于：
- 数字用 `tabular-nums` 等宽
- 正负用颜色区分（green/red）而非 +/- 号
- 表头用大写字母 + 小字号 + muted 色

## 改进方向展望

- **虚拟滚动** — 200 条表格目前用原生 DOM 渲染，数据量更大时应引入 `@tanstack/react-virtual`。
- **数据缓存** — 同一用户重复查询可用 localStorage / IndexedDB 缓存，减少 API 调用。
- **更丰富的图表** — 使用 ECharts 或 Plotly 替换部分 Recharts，支持缩放、框选、数据导出。
- **移动端适配** — 当前表格在小屏上需要横滑，可考虑折叠列或卡片布局。
- **实时推送** — 对接 Polymarket WebSocket 实时更新仓位和交易。
