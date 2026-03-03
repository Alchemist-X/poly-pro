import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import { useState } from 'react'
import type { PositionRecord, SettledRecord } from '../types'

type AnyRecord = PositionRecord | SettledRecord

function fmtNum(v: number, decimals = 2): string {
  return v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function PnLCell({ value }: { value: number }) {
  const color = value > 0 ? 'text-emerald-400' : value < 0 ? 'text-red-400' : 'text-slate-400'
  return <span className={`font-mono font-semibold ${color}`}>{value >= 0 ? '+' : ''}{fmtNum(value)}</span>
}

function PctCell({ value }: { value: number }) {
  const color = value > 0 ? 'text-emerald-400' : value < 0 ? 'text-red-400' : 'text-slate-400'
  return <span className={`font-mono ${color}`}>{value >= 0 ? '+' : ''}{fmtNum(value, 2)}%</span>
}

const posColumnHelper = createColumnHelper<PositionRecord>()
const sttColumnHelper = createColumnHelper<SettledRecord>()

const posColumns = [
  posColumnHelper.accessor('question', {
    header: 'Question',
    cell: info => (
      <span className="block max-w-xs truncate text-slate-200" title={info.getValue()}>
        {info.getValue()}
      </span>
    ),
  }),
  posColumnHelper.accessor('position', {
    header: 'Position',
    cell: info => <span className="font-mono text-slate-300">{fmtNum(info.getValue())}</span>,
  }),
  posColumnHelper.accessor('avgPrice', {
    header: 'Avg Price',
    cell: info => <span className="font-mono text-slate-300">{fmtNum(info.getValue(), 4)}</span>,
  }),
  posColumnHelper.accessor('currentPrice', {
    header: 'Cur Price',
    cell: info => <span className="font-mono text-slate-300">{fmtNum(info.getValue(), 4)}</span>,
  }),
  posColumnHelper.accessor('realizedPnl', {
    header: 'Realized PnL',
    cell: info => <PnLCell value={info.getValue()} />,
  }),
  posColumnHelper.accessor('unrealizedPnl', {
    header: 'Unrealized PnL',
    cell: info => <PnLCell value={info.getValue()} />,
  }),
  posColumnHelper.accessor('overallPnl', {
    header: 'Overall PnL',
    cell: info => <PnLCell value={info.getValue()} />,
  }),
  posColumnHelper.accessor('overallPnlPct', {
    header: 'PnL %',
    cell: info => <PctCell value={info.getValue()} />,
  }),
  posColumnHelper.accessor('totalInvested', {
    header: 'Invested',
    cell: info => <span className="font-mono text-slate-400">{fmtNum(info.getValue())}</span>,
  }),
]

const sttColumns = [
  sttColumnHelper.accessor('question', {
    header: 'Question',
    cell: info => (
      <span className="block max-w-xs truncate text-slate-200" title={info.getValue()}>
        {info.getValue()}
      </span>
    ),
  }),
  sttColumnHelper.accessor('avgPrice', {
    header: 'Avg Price',
    cell: info => <span className="font-mono text-slate-300">{fmtNum(info.getValue(), 4)}</span>,
  }),
  sttColumnHelper.accessor('currentPrice', {
    header: 'Cur Price',
    cell: info => <span className="font-mono text-slate-300">{fmtNum(info.getValue(), 4)}</span>,
  }),
  sttColumnHelper.accessor('realizedPnl', {
    header: 'Realized PnL',
    cell: info => <PnLCell value={info.getValue()} />,
  }),
  sttColumnHelper.accessor('unrealizedPnl', {
    header: 'Unrealized PnL',
    cell: info => <PnLCell value={info.getValue()} />,
  }),
  sttColumnHelper.accessor('overallPnl', {
    header: 'Overall PnL',
    cell: info => <PnLCell value={info.getValue()} />,
  }),
  sttColumnHelper.accessor('overallPnlPct', {
    header: 'PnL %',
    cell: info => <PctCell value={info.getValue()} />,
  }),
  sttColumnHelper.accessor('totalInvested', {
    header: 'Invested',
    cell: info => <span className="font-mono text-slate-400">{fmtNum(info.getValue())}</span>,
  }),
]

interface Props {
  data: AnyRecord[]
  mode: 'positions' | 'settled'
}

export default function TradeTable({ data, mode }: Props) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data: data as PositionRecord[],
    columns: (mode === 'positions' ? posColumns : sttColumns) as typeof posColumns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="space-y-3">
      <input
        value={globalFilter}
        onChange={e => setGlobalFilter(e.target.value)}
        placeholder="搜索 Question..."
        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
      />
      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} className="border-b border-slate-700 bg-slate-800">
                {hg.headers.map(header => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 ${
                      header.column.getCanSort() ? 'cursor-pointer select-none hover:text-slate-200' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' && <span className="text-indigo-400">↑</span>}
                      {header.column.getIsSorted() === 'desc' && <span className="text-indigo-400">↓</span>}
                      {!header.column.getIsSorted() && header.column.getCanSort() && (
                        <span className="text-slate-600">↕</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, i) => (
              <tr
                key={row.id}
                className={`border-b border-slate-700/50 transition-colors hover:bg-slate-700/30 ${
                  i % 2 === 0 ? 'bg-slate-900' : 'bg-slate-800/40'
                }`}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-2.5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {table.getRowModel().rows.length === 0 && (
          <div className="py-12 text-center text-slate-500">暂无数据</div>
        )}
      </div>
      <div className="text-right text-xs text-slate-500">
        共 {table.getFilteredRowModel().rows.length} 条记录
      </div>
    </div>
  )
}
