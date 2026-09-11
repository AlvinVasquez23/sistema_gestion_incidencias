import { useMemo, useState, type ReactNode } from 'react'
import { Eye, ClipboardCheck, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import clsx from 'clsx'
import type { Incidencia } from '../../data/mock'
import { fmtMoney } from '../../data/mock'
import { Badge, statusTone, slaTone } from '../ui/Badge'
import { TIT_COLS, type ColKey } from '../../config/vistas'
import { useSettings } from '../../context/SettingsContext'

interface Props {
  rows: Incidencia[]
  cols: ColKey[]
  onVer?: (id: string) => void
}

type SortDir = 'asc' | 'desc' | null
const SORTABLES: ColKey[] = ['fecha', 'valorizado', 'cantidad']

export default function TablaIncidencias({ rows, cols, onVer }: Props) {
  const { prefs } = useSettings()
  const padHead = prefs.densidad === 'compacta' ? 'px-3 py-2' : 'px-4 py-3'
  const padCelda = prefs.densidad === 'compacta' ? 'px-3 py-1.5' : 'px-4 py-3'

  const [sortCol, setSortCol] = useState<ColKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)

  const toggleSort = (col: ColKey) => {
    if (sortCol !== col) { setSortCol(col); setSortDir('asc'); return }
    if (sortDir === 'asc') { setSortDir('desc'); return }
    setSortCol(null); setSortDir(null)
  }

  const sorted = useMemo(() => {
    if (!sortCol || !sortDir) return rows
    const m = sortDir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      if (sortCol === 'fecha') {
        return m * ((a.ts ?? 0) - (b.ts ?? 0))
      }
      if (sortCol === 'valorizado') {
        return m * ((a.valorizado ?? 0) - (b.valorizado ?? 0))
      }
      if (sortCol === 'cantidad') {
        return m * ((a.cantidad ?? 0) - (b.cantidad ?? 0))
      }
      return 0
    })
  }, [rows, sortCol, sortDir])

  const celda = (c: ColKey, r: Incidencia): ReactNode => {
    switch (c) {
      case 'fecha':
        return (
          <div>
            <p className="font-mono text-xs font-semibold tabular-nums">{r.fecha}</p>
            <p className="font-mono text-[10px] text-muted tabular-nums">{r.hora}</p>
          </div>
        )
      case 'codigo':
        return (
          <div>
            <p className="font-mono text-xs font-semibold">{r.codigo || '—'}</p>
            {r.descripcion && (
              <p className="max-w-[220px] truncate text-xs text-muted" title={r.descripcion}>{r.descripcion}</p>
            )}
          </div>
        )
      case 'lpn':    return <span className="font-mono text-xs">{r.lpn || '—'}</span>
      case 'cubeta': return <span className="font-mono text-xs">{r.cubeta || '—'}</span>
      case 'auxiliar': return <span className="text-xs font-semibold">{(r as any).auxiliar_persona || '—'}</span>
      case 'cantidad': return <span className="font-mono text-xs font-semibold tabular-nums">{r.cantidad}</span>
      case 'valorizado': return <span className="font-mono text-xs font-bold tabular-nums">{fmtMoney(r.valorizado)}</span>
      case 'status': return <Badge solid tone={statusTone(r.status)}>{r.status}</Badge>
      case 'sla':
        return r.sla
          ? <Badge solid tone={slaTone(r.sla)} pulse={r.sla === 'Crítico'}>{r.sla}</Badge>
          : <span className="text-muted">—</span>
      case 'observacion':
        return <span className="block max-w-[240px] truncate text-xs text-muted" title={r.observacion}>{r.observacion || '—'}</span>
      case 'acc': {
        const cerrado = r.status === 'Cerrado'
        return (
          <button
            onClick={e => { e.stopPropagation(); onVer?.(r.id) }}
            className={clsx(
              'flex items-center gap-1 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-colors',
              cerrado
                ? 'border-line text-muted hover:text-ink'
                : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400',
            )}
          >
            {cerrado ? <Eye size={13} /> : <ClipboardCheck size={13} />}
            {cerrado ? 'Ver' : 'Revisar'}
          </button>
        )
      }
      default: {
        const v = (r as unknown as Record<string, unknown>)[c]
        return <span className="text-xs font-medium">{String(v || '—')}</span>
      }
    }
  }

  const sortIcon = (col: ColKey) => {
    if (sortCol !== col) return <ArrowUpDown size={12} className="text-muted/50" />
    if (sortDir === 'asc') return <ArrowUp size={12} className="text-adecco" />
    return <ArrowDown size={12} className="text-adecco" />
  }

  return (
    <div className="max-h-[62vh] min-h-[240px] overflow-auto rounded-xl border border-line bg-surface shadow-card">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="text-left">
            {cols.map(c => {
              const sortable = SORTABLES.includes(c) && cols.includes(c)
              return (
                <th
                  key={c}
                  onClick={sortable ? () => toggleSort(c) : undefined}
                  className={clsx(
                    'sticky top-0 z-10 whitespace-nowrap border-b border-line bg-surface2 text-[11px] font-bold uppercase tracking-wider text-muted',
                    padHead,
                    sortable && 'cursor-pointer select-none transition-colors hover:text-ink',
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {TIT_COLS[c]}
                    {sortable && sortIcon(c)}
                  </span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map(r => (
            <tr
              key={r.id}
              onClick={onVer ? () => onVer(r.id) : undefined}
              className={clsx(
                'border-b border-line/60 transition-colors last:border-0',
                onVer && 'cursor-pointer hover:bg-surface2',
              )}
            >
              {cols.map(c => (
                <td key={c} className={clsx('whitespace-nowrap align-middle', padCelda)}>{celda(c, r)}</td>
              ))}
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={cols.length} className="px-4 py-14 text-center text-sm text-muted">
                Filtros sin resultados
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}