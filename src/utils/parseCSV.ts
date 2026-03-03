import Papa from 'papaparse'
import type { PositionRecord, SettledRecord } from '../types'

type RawRow = Record<string, string>

function num(v: string): number {
  const n = parseFloat(v)
  return isNaN(n) ? 0 : n
}

export async function fetchPositions(): Promise<PositionRecord[]> {
  const text = await fetch('/positions.csv').then(r => r.text())
  const result = Papa.parse<RawRow>(text, { header: true, skipEmptyLines: true })
  return result.data.map(r => ({
    question: r['Question'] ?? '',
    position: num(r['Position']),
    avgPrice: num(r['Average Price']),
    currentPrice: num(r['Current Price']),
    realizedPnl: num(r['Realized PnL']),
    totalInvested: num(r['Total Invested']),
    unrealizedPnl: num(r['Unrealized PnL']),
    overallPnl: num(r['Overall PnL']),
    overallPnlPct: num(r['Overall PnL (%)']) * 100,
  }))
}

export async function fetchSettled(): Promise<SettledRecord[]> {
  const text = await fetch('/settled.csv').then(r => r.text())
  const result = Papa.parse<RawRow>(text, { header: true, skipEmptyLines: true })
  return result.data.map(r => ({
    question: r['Question'] ?? '',
    avgPrice: num(r['Average Price']),
    currentPrice: num(r['Current Price']),
    realizedPnl: num(r['Realized PnL']),
    totalInvested: num(r['Total Invested']),
    unrealizedPnl: num(r['Unrealized PnL']),
    overallPnl: num(r['Overall PnL']),
    overallPnlPct: num(r['Overall PnL (%)']) * 100,
  }))
}
