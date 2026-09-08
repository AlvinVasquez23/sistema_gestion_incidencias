import type { ReactNode } from 'react'
import { Eye, ClipboardCheck } from 'lucide-react'
import clsx from 'clsx'
import type { Incidencia } from '../../data/mock'
import { fmtMoney } from '../../data/mock'
import { Badge, statusTone, slaTone } from '../ui/Badge'
import { TIT_COLS, type ColKey } from '../../config/vistas'

interface Props {
  rows: Incidencia[]
  cols: ColKey[]
  onVer?: (id: string) => void   // si no viene, la tabla es solo lectura (Apilador/AFRAME)
}

export default function TablaIncidencias({ rows, cols, onVer }: Props) {
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

  return (
    <div className="max-h-[62vh] min-h-[240px] overflow-auto rounded-xl border border-line bg-surface shadow-card">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="text-left">
            {cols.map(c => (
              <th
                key={c}
                className="sticky top-0 z-10 whitespace-nowrap border-b border-line bg-surface2 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted"
              >
                {TIT_COLS[c]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr
              key={r.id}
              onClick={onVer ? () => onVer(r.id) : undefined}
              className={clsx(
                'border-b border-line/60 transition-colors last:border-0',
                onVer && 'cursor-pointer hover:bg-surface2',
              )}
            >
              {cols.map(c => (
                <td key={c} className="whitespace-nowrap px-4 py-3 align-middle">{celda(c, r)}</td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
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