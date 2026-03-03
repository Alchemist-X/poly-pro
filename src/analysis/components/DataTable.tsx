import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useI18n } from '../../i18n'

interface Props<T> {
  title: string
  note?: string
  data: T[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[]
  maxRows: number
  defaultSort?: SortingState
  previewRows?: number
}

function downloadCSV<T>(data: T[], columns: ColumnDef<T, unknown>[], filename: string) {
  const headers = columns.map(c => String((c as { header?: string }).header ?? c.id ?? ''))
  const accessors = columns.map(c => {
    if ('accessorKey' in c) return String(c.accessorKey)
    if ('accessorFn' in c && c.id) return c.id
    return String(c.id ?? '')
  })

  const rows = data.map(row =>
    accessors.map(key => {
      const val = (row as Record<string, unknown>)[key]
      return typeof val === 'number' ? String(val) : `"${String(val ?? '').replace(/"/g, '""')}"`
    }).join(',')
  )

  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
}

export default function DataTable<T>({ title, note, data, columns, maxRows, defaultSort, previewRows }: Props<T>) {
  const { t } = useI18n()
  const [sorting, setSorting] = useState<SortingState>(defaultSort ?? [])
  const [globalFilter, setGlobalFilter] = useState('')
  const [expanded, setExpanded] = useState(!previewRows)

  const sliced = useMemo(() => data.slice(0, maxRows), [data, maxRows])

  const table = useReactTable({
    data: sliced,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const allRows = table.getRowModel().rows
  const visibleRows = expanded ? allRows : allRows.slice(0, previewRows ?? allRows.length)
  const hasMore = !expanded && previewRows !== undefined && allRows.length > previewRows

  return (
    <div className="rounded-xl border border-dune-border bg-dune-card">
      <div className="flex flex-col gap-3 border-b border-dune-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-dune-text">{title}</h3>
          {note && <p className="mt-0.5 text-xs text-dune-muted">{note}</p>}
        </div>
        <div className="flex items-center gap-2">
          <input
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder={t('table.search')}
            className="rounded-lg border border-dune-border bg-dune-bg px-3 py-1.5 text-xs text-dune-text placeholder-dune-muted focus:border-dune-blue focus:outline-none"
          />
          <button
            onClick={() => downloadCSV(sliced, columns, `${title.replace(/\s+/g, '_')}.csv`)}
            className="rounded-lg border border-dune-border bg-dune-bg px-3 py-1.5 text-xs text-dune-muted transition hover:text-dune-text"
          >
            {t('table.csv')}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} className="border-b border-dune-border">
                {hg.headers.map(h => (
                  <th
                    key={h.id}
                    onClick={h.column.getToggleSortingHandler()}
                    className="cursor-pointer whitespace-nowrap px-4 py-3 text-left font-medium uppercase tracking-wider text-dune-muted transition hover:text-dune-text"
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {{ asc: ' ↑', desc: ' ↓' }[h.column.getIsSorted() as string] ?? ''}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {visibleRows.map(row => (
              <tr key={row.id} className="border-b border-dune-border/50 transition hover:bg-dune-card-hover">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="whitespace-nowrap px-4 py-2.5 tabular-nums text-dune-text">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expand / Collapse bar */}
      {hasMore && (
        <button
          onClick={() => setExpanded(true)}
          className="flex w-full items-center justify-center gap-2 border-t border-dune-border bg-dune-card-hover/50 px-4 py-3 text-xs font-medium text-dune-blue transition hover:bg-dune-card-hover"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          {t('table.showing')} {visibleRows.length} {t('table.of')} {allRows.length} — {t('table.expandAll')}
        </button>
      )}

      {expanded && previewRows !== undefined && allRows.length > previewRows && (
        <button
          onClick={() => setExpanded(false)}
          className="flex w-full items-center justify-center gap-2 border-t border-dune-border bg-dune-card-hover/50 px-4 py-3 text-xs font-medium text-dune-muted transition hover:bg-dune-card-hover hover:text-dune-text"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
          {t('table.collapsePreview')}
        </button>
      )}

      <div className="border-t border-dune-border px-4 py-2 text-xs text-dune-muted">
        {t('table.showing')} {visibleRows.length} {t('table.of')} {data.length} {t('table.records')}
      </div>
    </div>
  )
}
