import { INCIDENCIAS, fmtMoney } from '../data/mock'
import { AlertTriangle, Clock, CheckCircle2, PackageX } from 'lucide-react'

export default function Dashboard() {
  const abiertas = INCIDENCIAS.filter(i => i.status !== 'Cerrado')
  const valorizado = abiertas.reduce((s, i) => s + i.valorizado, 0)
  const kpis = [
    { label: 'Abiertas', value: abiertas.length, icon: PackageX, tone: 'text-ink' },
    { label: 'Pendientes', value: abiertas.filter(i => i.status === 'Pendiente').length, icon: Clock, tone: 'text-warn' },
    { label: 'Revisados', value: abiertas.filter(i => i.status === 'Revisado').length, icon: CheckCircle2, tone: 'text-info' },
    { label: 'Críticas >8h', value: abiertas.filter(i => i.sla === 'Crítico').length, icon: AlertTriangle, tone: 'text-adecco' },
  ]

  return (
    <div className="space-y-4">
      {/* Hero valorizado (estilo boceto command-center) */}
      <div className="rounded-2xl bg-gradient-to-br from-[#10131a] to-[#272a31] p-6 text-white shadow-card dark:border dark:border-line">
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/60">
          Valorizado total de incidencias abiertas
        </p>
        <p className="mt-2 font-mono text-4xl font-bold tracking-tight sm:text-5xl">{fmtMoney(valorizado)}</p>
        <p className="mt-2 text-xs text-white/60">
          {abiertas.length} incidencias AMR + Auditorías sin cerrar · Punta Negra DC
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {kpis.map(k => (
          <div key={k.label} className="rounded-xl border border-line bg-surface p-4 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{k.label}</p>
              <k.icon size={16} className={k.tone} />
            </div>
            <p className="mt-2 font-mono text-3xl font-bold">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-line bg-surface p-8 text-center">
        <p className="text-sm font-bold">Paso 1 completado ✅</p>
        <p className="mt-1 text-xs text-muted">
          En el Paso 2 construimos las tablas de los módulos con filtros + botón Limpiar y detalle.
        </p>
      </div>
    </div>
  )
}