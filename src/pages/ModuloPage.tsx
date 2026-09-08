import { useMemo, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { FilterX, Search, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { useData } from '../context/DataContext'
import { VISTAS, CSV_DE_VISTA } from '../config/vistas'
import TablaIncidencias from '../components/tabla/TablaIncidencias'
import DetalleIncidencia from '../components/detalle/DetalleIncidencia'
import { fmtMoney } from '../data/mock'

const MODULO_DE_VISTA: Record<string, 'AMR' | 'AUD' | 'API' | 'AFR' | null> = {
  pool: null, amr: 'AMR', aud: 'AUD', api: 'API', afr: 'AFR',
}
const toISO = (f: string) => { const [d, m, y] = f.split('/'); return `${y}-${m}-${d}` }
const POR_PAG = 8
const select = 'h-10 shrink-0 rounded-lg border border-line bg-surface2 px-3 text-sm outline-none transition focus:border-adecco'

/* Campo de filtro con label superior (label-caps del design system) */
function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={clsx('flex flex-col gap-1', className)}>
      <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted">{label}</span>
      {children}
    </label>
  )
}

export default function ModuloPage({ vista }: { vista: string }) {
  const cfg = VISTAS[vista]
  const { rows } = useData()

  const [estado, setEstado] = useState('Todos')
  const [area, setArea] = useState('Todas')
  const [sla, setSla] = useState('Todos')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [q, setQ] = useState('')
  const [pag, setPag] = useState(1)
  const [detalle, setDetalle] = useState<string | null>(null)

  /* ===== Filtrado (Pool = SOLO AMR + Auditorías Reaba) ===== */
  const filtradas = useMemo(() => rows.filter(r => {
    const mod = MODULO_DE_VISTA[vista]
    if (mod) { if (r.modulo !== mod) return false }
    else if (r.modulo !== 'AMR' && r.modulo !== 'AUD') return false
    if (vista === 'pool' && r.status === 'Cerrado') return false
    if (cfg.conStatus) {
      if (estado !== 'Todos' && r.status !== estado) return false
      if (sla !== 'Todos' && r.sla !== sla) return false
    }
    if (area !== 'Todas' && r.area !== area) return false
    if (desde && toISO(r.fecha) < desde) return false
    if (hasta && toISO(r.fecha) > hasta) return false
    if (q) {
      const t = q.toLowerCase()
      if (![r.id, r.lpn, r.cubeta, r.codigo, r.descripcion, r.tipo, r.reportado].join(' ').toLowerCase().includes(t)) return false
    }
    return true
  }), [rows, vista, cfg, estado, area, sla, desde, hasta, q])

  /* ===== Orden descendente: fecha + hora ===== */
  const ordenadas = useMemo(() => [...filtradas].sort((a, b) =>
    (toISO(b.fecha) + b.hora).localeCompare(toISO(a.fecha) + a.hora)
  ), [filtradas])

  const totalPag = Math.max(1, Math.ceil(ordenadas.length / POR_PAG))
  const page = Math.min(pag, totalPag)
  const corte = ordenadas.slice((page - 1) * POR_PAG, page * POR_PAG)

  const nPend = filtradas.filter(r => r.status === 'Pendiente').length
  const nRev = filtradas.filter(r => r.status === 'Revisado').length
  const valorizado = filtradas.filter(r => r.status !== 'Cerrado').reduce((s, r) => s + r.valorizado, 0)

  const hayFiltros = estado !== 'Todos' || area !== 'Todas' || sla !== 'Todos' || desde !== '' || hasta !== '' || q !== ''
  const limpiar = () => { setEstado('Todos'); setArea('Todas'); setSla('Todos'); setDesde(''); setHasta(''); setQ(''); setPag(1) }

  /* ===== Exportar CSV (respeta filtros y orden) ===== */
  const exportarCSV = () => {
    const cols = CSV_DE_VISTA[vista]
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const lines = [cols.map(c => esc(c.head)).join(';')]
    ordenadas.forEach(r => lines.push(cols.map(c => esc((r as unknown as Record<string, unknown>)[c.key])).join(';')))
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${cfg.titulo.replace(/ /g, '_')}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="space-y-4">
      {/* Resumen: solo módulos con status (Pool/AMR/AUD); Apilador y AFRAME son solo registro */}
      {(cfg.conStatus || cfg.conValorizado) && (
        <div className="flex flex-wrap items-center gap-3">
          {cfg.conStatus && (
            <span className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-bold tabular-nums">
              {nPend} incidencias pendientes / {nRev} incidencias revisadas
            </span>
          )}
          {cfg.conValorizado && (
            <span className="rounded-full border border-adecco/30 bg-adecco/10 px-3 py-1 font-mono text-xs font-bold tabular-nums text-adecco">
              Valorizado incidendias pendientes de cierre: {fmtMoney(valorizado)}
            </span>
          )}
        </div>
      )}

      {/* Filtros etiquetados + Limpiar + CSV */}
      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-3 shadow-card">
        {cfg.conStatus && (
          <>
            <Field label="Status">
              <select className={select} value={estado} onChange={e => { setEstado(e.target.value); setPag(1) }}>
                <option>Todos</option><option>Pendiente</option><option>Revisado</option><option>Cerrado</option>
              </select>
            </Field>
            <Field label="Estado">
              <select className={select} value={sla} onChange={e => { setSla(e.target.value); setPag(1) }}>
                <option>Todos</option><option>Normal</option><option>Alerta</option><option>Crítico</option>
              </select>
            </Field>
          </>
        )}
        {vista !== 'api' && vista !== 'afr' && (
          <Field label="Área">
            <select className={select} value={area} onChange={e => { setArea(e.target.value); setPag(1) }}>
              <option>Todas</option><option>Decanting</option><option>Reabasto</option>
            </select>
          </Field>
        )}
        <Field label="Desde">
          <input type="date" className={select} value={desde} onChange={e => { setDesde(e.target.value); setPag(1) }} />
        </Field>
        <Field label="Hasta">
          <input type="date" className={select} value={hasta} onChange={e => { setHasta(e.target.value); setPag(1) }} />
        </Field>
        <Field label="Buscar" className="min-w-[160px] flex-1">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={e => { setQ(e.target.value); setPag(1) }}
              placeholder="ID, LPN, SKU…"
              className="h-10 w-full rounded-lg border border-line bg-surface2 pl-9 pr-3 text-sm outline-none transition focus:border-adecco"
            />
          </div>
        </Field>
        <button
          onClick={limpiar}
          disabled={!hayFiltros}
          className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-line px-3 text-sm font-bold text-muted transition enabled:hover:border-adecco enabled:hover:text-adecco disabled:opacity-40"
        >
          <FilterX size={15} /> Limpiar
        </button>
        <button
          onClick={exportarCSV}
          className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-adecco/40 bg-adecco/10 px-3 text-sm font-bold text-adecco transition hover:bg-adecco/20"
        >
          <Download size={15} /> CSV
        </button>
      </div>

      {/* Tabla (Apilador/AFRAME: solo lectura, sin detalle) */}
      <TablaIncidencias rows={corte} cols={cfg.cols} onVer={cfg.conStatus ? setDetalle : undefined} />

      {/* Paginación */}
      <div className="flex items-center justify-between text-xs font-semibold text-muted">
        <span className="tabular-nums">
          Mostrando {ordenadas.length === 0 ? 0 : (page - 1) * POR_PAG + 1}–{Math.min(page * POR_PAG, ordenadas.length)} de {ordenadas.length}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={() => setPag(p => Math.max(1, p - 1))} disabled={page === 1}
            className="grid h-8 w-8 place-items-center rounded-lg border border-line disabled:opacity-40 enabled:hover:text-adecco">
            <ChevronLeft size={15} />
          </button>
          <span className="font-mono tabular-nums">{page} / {totalPag}</span>
          <button onClick={() => setPag(p => Math.min(totalPag, p + 1))} disabled={page === totalPag}
            className="grid h-8 w-8 place-items-center rounded-lg border border-line disabled:opacity-40 enabled:hover:text-adecco">
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {detalle && <DetalleIncidencia id={detalle} onClose={() => setDetalle(null)} />}
    </div>
  )
}