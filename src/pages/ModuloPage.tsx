import { useState } from 'react'
import { FilterX, Search, Inbox } from 'lucide-react'
import { NAV } from '../components/layout/AppShell'

export default function ModuloPage({ vista }: { vista: string }) {
  const [estado, setEstado] = useState('Todos')
  const [area, setArea] = useState('Todas')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [q, setQ] = useState('')

  const titulo = NAV.find(n => n.to === '/' + vista)?.label ?? vista
  const limpiar = () => { setEstado('Todos'); setArea('Todas'); setDesde(''); setHasta(''); setQ('') }
  const hayFiltros = estado !== 'Todos' || area !== 'Todas' || desde || hasta || q

  const select = 'h-10 rounded-lg border border-line bg-surface2 px-3 text-sm outline-none focus:border-adecco'

  return (
    <div className="space-y-4">
      {/* Barra de filtros con botón Limpiar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-3 shadow-card">
        <select value={estado} onChange={e => setEstado(e.target.value)} className={select} disabled={vista === 'api' || vista === 'afr'}>
          <option>Todos</option><option>Pendiente</option><option>Revisado</option><option>Cerrado</option>
        </select>
        <select value={area} onChange={e => setArea(e.target.value)} className={select}>
          <option>Todas</option><option>Decanting</option><option>Reabasto</option><option>Apilador</option><option>Aframe</option>
        </select>
        <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className={select} />
        <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className={select} />
        <div className="relative min-w-[160px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar ID, LPN, SKU…"
            className="h-10 w-full rounded-lg border border-line bg-surface2 pl-9 pr-3 text-sm outline-none focus:border-adecco" />
        </div>
        <button onClick={limpiar} disabled={!hayFiltros}
          className="flex h-10 items-center gap-2 rounded-lg border border-line px-4 text-sm font-bold text-muted transition enabled:hover:border-adecco enabled:hover:text-adecco disabled:opacity-40">
          <FilterX size={15} /> Limpiar
        </button>
      </div>

      <div className="grid place-items-center rounded-xl border border-dashed border-line bg-surface p-16 text-center">
        <Inbox size={40} className="text-muted" />
        <p className="mt-3 text-sm font-extrabold">{titulo}</p>
        <p className="mt-1 max-w-sm text-xs text-muted">
          Estructura y filtros listos. La tabla con datos, el detalle y las acciones se construyen en el Paso 2.
        </p>
      </div>
    </div>
  )
}