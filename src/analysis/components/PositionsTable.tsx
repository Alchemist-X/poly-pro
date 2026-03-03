import { useMemo } from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import type { Position } from '../../utils/polyApi'
import DataTable from './DataTable'
import { useI18n } from '../../i18n'

interface Props {
  data: Position[]
}

const col = createColumnHelper<Position>()

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

export default function PositionsTable({ data }: Props) {
  const { t } = useI18n()

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
    col.accessor('size', {
      header: t('col.position'),
      cell: info => info.getValue().toLocaleString(undefined, { maximumFractionDigits: 2 }),
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
    col.accessor(row => (row.currentValue ?? 0) - (row.initialValue ?? 0), {
      id: 'unrealizedPnl',
      header: t('col.unrealizedPnl'),
      cell: info => <PnlCell value={info.getValue() as number} />,
    }),
    col.accessor('cashPnl', {
      header: t('col.overallPnl'),
      cell: info => <PnlCell value={info.getValue() ?? 0} />,
    }),
    col.accessor('percentPnl', {
      header: t('col.overallPnlPct'),
      cell: info => {
        const v = info.getValue() ?? 0
        return <span className={v >= 0 ? 'text-dune-green' : 'text-dune-red'}>{(v * 100).toFixed(2)}%</span>
      },
    }),
  ], [t])

  return (
    <DataTable<Position>
      title={t('table.positions')}
      data={data}
      columns={columns}
      maxRows={200}
      defaultSort={[{ id: 'totalBought', desc: true }]}
      previewRows={5}
    />
  )
}
