import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { Users, AlertTriangle, Activity, CalendarDays } from 'lucide-react'
import type { Incidencia } from '../../data/mock'

const parseFecha = (f: string) => {
  const [d, m, y] = String(f).split('/')
  return new Date(+y, +m - 1, +d).getTime()
}

/* ===== KPIs de incidencias de personal (hoja incidencias_auxiliar) ===== */
export default function KpiPersonal({ rows }: { rows: Incidencia[] }) {
  const [rango, setRango] = useState<'7' | '30' | 'todo'>('30')
  const aux = useMemo(() => rows.filter(r => r.modulo === 'AUX'), [rows])

  const data = useMemo(() => {
    if (rango === 'todo') return aux
    const corte = Date.now() - Number(rango) * 86400000
    return aux.filter(r => parseFecha(r.fecha) >= corte)
  }, [aux, rango])

  const topAux = useMemo(() => {
    const m: Record<string, { n: number; dias: Set<string> }> = {}
    data.forEach(r => {
      const k = r.auxiliar_persona || '—'
      const e = m[k] ?? { n: 0, dias: new Set() }
      e.n += 1; e.dias.add(r.fecha)
      m[k] = e
    })
    return Object.entries(m)
      .map(([k, v]) => ({ k, n: v.n, reincidente: v.dias.size >= 3 }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 5)
  }, [data])

  const topTipos = useMemo(() => {
    const m: Record<string, number> = {}
    data.forEach(r => { const k = r.tipo || '—'; m[k] = (m[k] || 0) + 1 })
    return Object.entries(m).map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v).slice(0, 5)
  }, [data])

  const tend14 = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(Date.now() - (13 - i) * 86400000)
      const f = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
      return { f, n: data.filter(r => r.fecha === f).length }
    })
  }, [data])

  const total = data.length
  const diasPeriodo = rango === 'todo' ? Math.max(1, Math.ceil((Date.now() - Math.min(...data.map(r => parseFecha(r.fecha)), Date.now() - 86400000)) / 86400000)) : Number(rango)
  const promedio = total / diasPeriodo
  const personas = new Set(data.map(r => r.auxiliar_persona).filter(Boolean)).size
  const reincidentes = topAux.filter(a => a.reincidente).length
  const maxAux = topAux[0]?.n ?? 1
  const maxTipo = topTipos[0]?.v ?? 1
  const maxT = Math.max(...tend14.map(t => t.n), 1)
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0)

  const minis = [
    { icon: Activity, label: 'Total del período', valor: total.toFixed(0) },
    { icon: CalendarDays, label: 'Promedio por día', valor: promedio.toFixed(1) },
    { icon: Users, label: 'Personas con incidencias', valor: String(personas) },
    { icon: AlertTriangle, label: 'Reincidentes (3+ días)', valor: String(reincidentes) },
  ]

  return (
    <section className="rounded-xl border border-line bg-surface p-4 shadow-card">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Incidencias de personal</h3>
          <p className="mt-0.5 text-[11px] text-muted">Reporte de incidencias y causales del personal de decanting</p>
        </div>
        <div className="flex rounded-lg border border-line bg-surface2 p-0.5">
          {([['7', '7 días'], ['30', '30 días'], ['todo', 'Total']] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setRango(k)}
              className={clsx(
                'rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors',
                rango === k ? 'bg-adecco text-white' : 'text-muted hover:text-ink',
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Métricas resumen */}
      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {minis.map(m => (
          <div key={m.label} className="rounded-lg border border-line bg-surface2/60 px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
              <m.icon size={12} className="text-adecco" /> {m.label}
            </p>
            <p className="mt-1 font-mono text-xl font-extrabold tabular-nums">{m.valor}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Top auxiliares con barras etiquetadas */}
        <div className="space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Top auxiliares con incidencias</p>
          {topAux.length === 0 && <p className="text-xs text-muted">Sin registros en el período.</p>}
          {topAux.map((a, i) => (
            <div key={a.k} className="flex items-center gap-2.5">
              <span className={clsx(
                'grid h-6 w-6 shrink-0 place-items-center rounded-md font-mono text-[10px] font-extrabold',
                i === 0 ? 'bg-adecco text-white' : 'bg-surface2 text-muted',
              )}>
                {i + 1}
              </span>
              <span className="w-36 shrink-0 truncate text-xs font-semibold" title={a.k}>
                {a.reincidente && (
                  <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#E30613]" title="Incidencias en 3+ días distintos" />
                )}
                {a.k}
              </span>
              <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-surface2">
                <div
                  className={clsx('h-full rounded-full', i === 0 ? 'bg-[#E30613]' : 'bg-[#E30613]/60')}
                  style={{ width: `${Math.max((a.n / maxAux) * 100, 6)}%` }}
                />
              </div>
              <span className="w-14 shrink-0 text-right font-mono text-xs font-bold tabular-nums">
                {a.n} <span className="font-semibold text-muted">({pct(a.n)}%)</span>
              </span>
            </div>
          ))}
          <p className="text-[10px] text-muted">
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#E30613]" />
            reincidente: errores registrados en 3+ días distintos
          </p>
        </div>

        {/* Top tipos con barras etiquetadas */}
        <div className="space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Incidencias más recurrentes</p>
          {topTipos.length === 0 && <p className="text-xs text-muted">Sin registros en el período.</p>}
          {topTipos.map((t, i) => (
            <div key={t.k} className="flex items-center gap-2.5">
              <span className="w-36 shrink-0 truncate text-xs font-semibold" title={t.k}>{t.k}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface2">
                <div
                  className={clsx('h-full rounded-full', i === 0 ? 'bg-adecco' : 'bg-adecco/50')}
                  style={{ width: `${Math.max((t.v / maxTipo) * 100, 6)}%` }}
                />
              </div>
              <span className="w-14 shrink-0 text-right font-mono text-xs font-bold tabular-nums">
                {t.v} <span className="font-semibold text-muted">({pct(t.v)}%)</span>
              </span>
            </div>
          ))}
        </div>
      </div>


    </section>
  )
}