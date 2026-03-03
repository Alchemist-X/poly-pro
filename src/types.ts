export interface PositionRecord {
  question: string
  position: number
  avgPrice: number
  currentPrice: number
  realizedPnl: number
  totalInvested: number
  unrealizedPnl: number
  overallPnl: number
  overallPnlPct: number
}

export interface SettledRecord {
  question: string
  avgPrice: number
  currentPrice: number
  realizedPnl: number
  totalInvested: number
  unrealizedPnl: number
  overallPnl: number
  overallPnlPct: number
}

export type TabType = 'positions' | 'settled'
