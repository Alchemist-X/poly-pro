import { useMemo } from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import type { ClosedPosition } from '../../utils/polyApi'
import DataTable from './DataTable'
import { useI18n } from '../../i18n'

interface Props {
  data: ClosedPosition[]
  total: number
}

const col = createColumnHelper<ClosedPosition>()

function fmtUsd(v: number) {
  return v >= 0 ? `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `-$${Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

function PnlCell({ value }: { value: number }) {
  return <span className={value >= 0 ? 'text-dune-green' : 'text-dune-red'}>{fmtUsd(value)}</span>
}

function SideIndicator({ outcome }: { outcome: string }) {
  const isYes = outcome.toLowerCase() === 'yes'
  return <span>{isYes ? '🟢' : '🔴'}</span>
}

export default function FinishedTable({ data, total }: Props) {
  const { t } = useI18n()

  const sorted = useMemo(() =>
    [...data].sort((a, b) => b.totalBought - a.totalBought),
    [data]
  )

  const columns = useMemo(() => [
    col.accessor('title', {
      header: t('col.question'),
      cell: info => (
        <div className="flex items-center gap-1.5 max-w-[320px]">
          <SideIndicator outcome={info.row.original.outcome} />
          <span className="truncate">{info.getValue()}</span>
        </div>
      ),
    }),
    col.accessor('avgPrice', {
      header: t('col.avgPrice'),
      cell: info => info.getValue().toFixed(3),
    }),
    col.accessor('curPrice', {
      header: t('col.curPrice'),
      cell: info => info.getValue().toFixed(3),
    }),
    col.accessor('realizedPnl', {
      header: t('col.realizedPnl'),
      cell: info => <PnlCell value={info.getValue()} />,
    }),
    col.accessor('totalBought', {
      header: t('col.totalInvested'),
      cell: info => fmtUsd(info.getValue()),
    }),
    col.accessor(row => {
      if (!row.totalBought) return 0
      return row.realizedPnl
    }, {
      id: 'overallPnl',
      header: t('col.overallPnl'),
      cell: info => <PnlCell value={info.getValue() as number} />,
    }),
    col.accessor(row => {
      if (!row.totalBought) return 0
      return (row.realizedPnl / row.totalBought) * 100
    }, {
      id: 'overallPnlPct',
      header: t('col.overallPnlPct'),
      cell: info => {
        const v = info.getValue() as number
        return <span className={v >= 0 ? 'text-dune-green' : 'text-dune-red'}>{v.toFixed(2)}%</span>
      },
    }),
  ], [t])

  const note = total > 200
    ? `${t('table.showing')} 200 ${t('table.of')} ${total} ${t('table.records')}`
    : undefined

  return (
    <DataTable<ClosedPosition>
      title={t('table.finished')}
      note={note}
      data={sorted}
      columns={columns}
      maxRows={200}
      defaultSort={[{ id: 'totalBought', desc: true }]}
      previewRows={5}
    />
  )
}
