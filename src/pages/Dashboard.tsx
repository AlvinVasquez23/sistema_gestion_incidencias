import { useMemo, useState } from 'react'
import { CalendarDays, Clock3, PackageOpen, ClipboardCheck, CheckCircle2, Flame, BellRing } from 'lucide-react'
import clsx from 'clsx'
import { useData } from '../context/DataContext'
import { fmtMoney, TIPOS_MAT } from '../data/mock'
import KpiMini from '../components/dashboard/KpiMini'
import { Sparkline, Donut } from '../components/dashboard/charts'

const toISO = (f: string) => { const [d, m, y] = f.split('/'); return `${y}-${m}-${d}` }
const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
const tsDe = (f: string, h: string) => {
  const [d, mo, y] = f.split('/')
  const [hh, mm, ss] = (h || '00:00:00').split(':')
  return new Date(+y, +mo - 1, +d, +hh, +mm, +ss || 0).getTime()
}
const card = 'rounded-xl border border-line bg-surface p-4 shadow-card'
const tit = 'text-xs font-bold uppercase tracking-wider text-muted'
const C = { pend: '#E30613', rev: '#F59E0B', cerr: '#059669' }
const AREAS_MAT = ['Decanting', 'Reabasto']

function LabelRow({ values }: { values: number[] }) {
  return (
    <div className="mb-1 flex justify-between font-mono text-[9px] font-bold tabular-nums text-muted">
      {values.map((v, i) => <span key={i}>{v}</span>)}
    </div>
  )
}

export default function Dashboard() {
  const { rows } = useData()
  const [rangoMat, setRangoMat] = useState<'7d' | '30d' | 'todo'>('todo')

  const m = useMemo(() => {
    const amrAud = rows.filter(r => r.modulo === 'AMR' || r.modulo === 'AUD')
    const abiertas = amrAud.filter(r => r.status !== 'Cerrado')
    const pad2 = (n: number) => String(n).padStart(2, '0')
    const isoDe = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
    const ahora = new Date()
    const hoyRealIso = isoDe(ahora)
    const ayerRealIso = isoDe(new Date(ahora.getTime() - 86400000))
    const hoyReal = ahora.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const countDay = (iso: string) => amrAud.filter(r => toISO(r.fecha) === iso).length
    const pct = (a: number, b: number) => (b === 0 ? null : Math.round(((a - b) / b) * 100))

    /* Últimos 7 días naturales contados desde la fecha actual */
    const ult7 = Array.from({ length: 7 }, (_, i) => isoDe(new Date(ahora.getTime() - (6 - i) * 86400000)))
    const serie = ult7.map(countDay)

    const porArea = ['Decanting', 'Reabasto'].map(a => {
      const rs = rows.filter(r => r.area === a)
      return {
        area: a, total: rs.length,
        pend: rs.filter(r => r.status === 'Pendiente').length,
        rev: rs.filter(r => r.status === 'Revisado').length,
        cerr: rs.filter(r => r.status === 'Cerrado').length,
      }
    }).filter(x => x.total > 0)

    /* Solo AMR + Auditorías, recortado por rango de fecha */
    const corteMat = rangoMat === 'todo' ? amrAud : amrAud.filter(r => {
      const [d, mo, y] = String(r.fecha).split('/')
      const ts = new Date(+y, +mo - 1, +d).getTime()
      return ts >= ahora.getTime() - (rangoMat === '7d' ? 7 : 30) * 86400000
    })
    const matTipo = TIPOS_MAT.map(t => {
      const celdas = AREAS_MAT.map(a => corteMat.filter(r => r.tipo === t && r.area === a).length)
      return { tipo: t, celdas, total: celdas.reduce((x, y) => x + y, 0) }
    })

    const topSkus = Object.entries(
      amrAud.reduce<Record<string, { n: number; q: number; d: string }>>((acc, r) => {
        if (!r.codigo) return acc
        const e = acc[r.codigo] ?? { n: 0, q: 0, d: r.descripcion }
        e.n += 1; e.q += parseFloat(String(r.cantidad).replace(',', '.')) || 0
        acc[r.codigo] = e
        return acc
      }, {}),
    ).map(([codigo, v]) => ({ codigo, ...v })).sort((a, b) => b.n - a.n).slice(0, 4)

    const ranking = Object.entries(
      rows.reduce<Record<string, { v: number; d: string }>>((acc, r) => {
        if (!r.codigo || !r.valorizado || r.status === 'Cerrado') return acc
        const e = acc[r.codigo] ?? { v: 0, d: r.descripcion }
        e.v += r.valorizado
        acc[r.codigo] = e
        return acc
      }, {}),
    ).map(([codigo, v]) => ({ codigo, ...v })).sort((a, b) => b.v - a.v).slice(0, 5)

    const cerradas = amrAud.filter(r => r.status === 'Cerrado' && r.fecha_cierre)
    const horasCierre = cerradas.map(r => (tsDe(r.fecha_cierre as string, r.hora_cierre || '') - tsDe(r.fecha, r.hora)) / 3600000)
    const mttr = horasCierre.length
      ? (horasCierre.reduce((a, b) => a + b, 0) / horasCierre.length).toFixed(1) + ' h'
      : '—'
    const pctSLA = cerradas.length
      ? Math.round((horasCierre.filter(h => h <= 8).length / cerradas.length) * 100)
      : null
    const edad = abiertas.length
      ? (abiertas.reduce((s, r) => s + (Date.now() - tsDe(r.fecha, r.hora)) / 3600000, 0) / abiertas.length).toFixed(1) + ' h'
      : '—'

    return {
      amrAud,
      nAbiertas: abiertas.length,
      nPend: abiertas.filter(r => r.status === 'Pendiente').length,
      nRev: abiertas.filter(r => r.status === 'Revisado').length,
      nCrit: abiertas.filter(r => r.sla === 'Crítico').length,
      nAlert: abiertas.filter(r => r.sla === 'Alerta').length,
      regHoy: countDay(hoyRealIso),
      deltaReg: pct(countDay(hoyRealIso), countDay(ayerRealIso)),
      valorizado: abiertas.reduce((s, r) => s + r.valorizado, 0),
      unidades: abiertas.reduce((s, r) => s + (parseFloat(String(r.cantidad).replace(',', '.')) || 0), 0),
      skus: new Set(abiertas.map(r => r.codigo).filter(Boolean)).size,
      ult7, serie, porArea, matTipo, topSkus, ranking,
      totArea: {
        pend: porArea.reduce((s, a) => s + a.pend, 0),
        rev: porArea.reduce((s, a) => s + a.rev, 0),
        cerr: porArea.reduce((s, a) => s + a.cerr, 0),
      },
      mttr, pctSLA, edad,
      hoyReal,
      pool: {
        pend: amrAud.filter(r => r.status === 'Pendiente').length,
        rev: amrAud.filter(r => r.status === 'Revisado').length,
      },
    }
}, [rows, rangoMat])

  const maxSku = m.topSkus[0]?.n ?? 1
  const maxRank = m.ranking[0]?.v ?? 1

  return (
    <div className="space-y-4">
      {/* ===== Cabecera ===== */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Indicadores de Gestión</h2>
          <p className="text-xs text-muted">Sistema de Gestión de Incidencias · CD Punta Negra</p>
        </div>
      </div>

      {/* ===== FILA 1: 7 minis en una línea, ancho según contenido ===== */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:flex xl:flex-nowrap xl:gap-3">
        <KpiMini className="xl:flex-auto" label="Abiertas" value={m.nAbiertas} icon={<PackageOpen size={16} />} tone="info" />
        <KpiMini className="xl:flex-auto" label="Pendientes" value={m.nPend} icon={<Clock3 size={16} />} tone="warn" />
        <KpiMini className="xl:flex-auto" label="Revisados" value={m.nRev} icon={<ClipboardCheck size={16} />} tone="info" />
        <KpiMini className="xl:flex-auto" label="Registradas hoy" value={m.regHoy} icon={<CalendarDays size={16} />} delta={m.deltaReg} />
        <KpiMini className="xl:flex-auto" label="Críticas >8h" value={m.nCrit} icon={<Flame size={16} />} tone="danger" />
        <KpiMini className="xl:flex-auto" label="En alerta" value={m.nAlert} icon={<BellRing size={16} />} tone="warn" />
        <KpiMini className="xl:flex-auto" label="SLA <8h" value={m.pctSLA === null ? '—' : `${m.pctSLA}%`} icon={<CheckCircle2 size={16} />} tone="ok" />
      </div>

      {/* ===== FILA 2: valorizado total + tiempos operativos ===== */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="grid overflow-hidden rounded-xl border border-line shadow-card md:grid-cols-2 lg:col-span-8">
          {/* Zona roja: valorizado */}
          <div className="relative bg-gradient-to-br from-adecco via-[#b8050f] to-[#7a030a] p-5 text-white">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-white/70">
              Valorizado total de incidencias abiertas
            </p>
            <p className="mt-2 whitespace-nowrap font-mono text-3xl font-bold tabular-nums tracking-tight xl:text-4xl">{fmtMoney(m.valorizado)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[`${m.unidades} und`, `${m.skus} SKUs`, `${m.nCrit} críticas >8h`].map(t => (
                <span key={t} className="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                  {t}
                </span>
              ))}
            </div>
          </div>
          {/* Estado del pool: distribución original (dona izquierda + leyenda derecha) */}
          <div className="flex items-center gap-4 bg-surface p-5">
            <div className="relative shrink-0">
              <Donut
                size={110}
                segments={[
                  { value: m.pool.pend, color: C.pend, label: 'Pendientes' },
                  { value: m.pool.rev, color: C.rev, label: 'Revisadas' },
                ]}
              />
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <p className="font-mono text-xl font-bold tabular-nums">{m.nAbiertas}</p>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-muted">abiertas</p>
                </div>
              </div>
            </div>
            <ul className="min-w-0 flex-1 space-y-2">
              <li className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted">Incidencias abiertas por Estado</li>
              {([['Pendientes', m.pool.pend, C.pend], ['Revisadas', m.pool.rev, C.rev]] as [string, number, string][]).map(([label, v, color]) => (
                <li key={label} className="flex items-center gap-2 text-xs font-semibold">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
                  <span className="flex-1 truncate">{label}</span>
                  <span className="font-mono tabular-nums">{v}</span>
                  <span className="w-9 text-right font-mono tabular-nums text-muted">
                    {Math.round((v / (m.nAbiertas || 1)) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tiempos operativos */}
        <div className={`${card} lg:col-span-4`}>
          <h3 className={tit}>Tiempos de solución de Incidencias</h3>
          <p className="mt-0.5 text-[11px] text-muted">Eficiencia de resolución</p>
          <div className="mt-4 grid grid-cols-3 divide-x divide-line">
            <div className="pr-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted">Horas de cierre</p>
              <p className="mt-1 font-mono text-xl font-bold tabular-nums">{m.mttr}</p>
              <p className="mt-0.5 text-[10px] leading-tight text-muted">promedio de cierre</p>
            </div>
            <div className="px-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted">SLA &lt;8h</p>
              <p className={clsx(
                'mt-1 font-mono text-xl font-bold tabular-nums',
                m.pctSLA === null ? 'text-muted'
                  : m.pctSLA >= 90 ? 'text-ok'
                  : m.pctSLA >= 70 ? 'text-warn'
                  : 'text-adecco dark:text-[#ff4d58]',
              )}>
                {m.pctSLA === null ? '—' : `${m.pctSLA}%`}
              </p>
              <p className="mt-0.5 text-[10px] leading-tight text-muted">cerradas a tiempo</p>
            </div>
            <div className="pl-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted">Horas Abiertas</p>
              <p className="mt-1 font-mono text-xl font-bold tabular-nums">{m.edad}</p>
              <p className="mt-0.5 text-[10px] leading-tight text-muted">promedio sin cerrar</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== FILA 3: áreas + top SKUs + ranking valorizado ===== */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className={card}>
          <h3 className={tit}>Incidencias por área y estado</h3>
          <p className="mt-0.5 text-[11px] text-muted">Decanting / Reabasto</p>
          <div className="mt-4 space-y-3">
            {m.porArea.map(a => (
              <div key={a.area}>
                <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                  <span>{a.area}</span>
                  <span className="font-mono tabular-nums text-muted">{a.total}</span>
                </div>
                <div className="flex h-2.5 overflow-hidden rounded-full bg-surface2">
                  <div className="bg-[#E30613]" style={{ width: `${(a.pend / a.total) * 100}%` }} title={`Pendiente: ${a.pend}`} />
                  <div className="bg-[#F59E0B]" style={{ width: `${(a.rev / a.total) * 100}%` }} title={`Revisado: ${a.rev}`} />
                  <div className="bg-[#059669]" style={{ width: `${(a.cerr / a.total) * 100}%` }} title={`Cerrado: ${a.cerr}`} />
                </div>
                <div className="mt-1 flex gap-3 font-mono text-[10px] font-bold tabular-nums text-muted">
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#E30613]" />{a.pend}</span>
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />{a.rev}</span>
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#059669]" />{a.cerr}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-4 text-[10px] font-bold uppercase tracking-wider text-muted">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#E30613]" /> Pendiente</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#F59E0B]" /> Revisado</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#059669]" /> Cerrado</span>
          </div>
        </div>

        <div className={card}>
          <h3 className={tit}>Top SKUs</h3>
          <p className="mt-0.5 text-[11px] text-muted">SKUs con mayor tasa de incidencias</p>
          <ul className="mt-4 space-y-3">
            {m.topSkus.map(s => (
              <li key={s.codigo}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-semibold" title={s.d}>{s.d || s.codigo}</span>
                  <span className="shrink-0 rounded-full border border-line bg-surface2 px-2 py-0.5 font-mono text-[10px] font-bold tabular-nums">
                    {s.n} inc
                  </span>
                </div>
                <p className="font-mono text-[10px] text-muted">{s.codigo} · {Math.round(s.q)} und</p>
                <div className="mt-1 h-1.5 rounded-full bg-surface2">
                  <div className="h-1.5 rounded-full bg-adecco" style={{ width: `${(s.n / maxSku) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className={card}>
          <h3 className={tit}>Ranking de SKUs</h3>
          <p className="mt-0.5 text-[11px] text-muted">Incidencias pendientes de cierre</p>
          <ol className="mt-4 space-y-3">
            {m.ranking.map((p, i) => (
              <li key={p.codigo}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-surface2 font-mono text-[10px] font-bold text-muted">
                      {i + 1}
                    </span>
                    <span className="truncate font-semibold" title={p.d}>{p.d || p.codigo}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[11px] font-bold tabular-nums text-adecco dark:text-[#ff4d58]">
                    {fmtMoney(p.v)}
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-surface2">
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-adecco to-[#ff2e3b]" style={{ width: `${(p.v / maxRank) * 100}%` }} />
                </div>
              </li>
            ))}
            {m.ranking.length === 0 && <li className="text-xs text-muted">Sin valorizado abierto actualmente.</li>}
          </ol>
        </div>
      </div>

      {/* ===== FILA 4: tendencia + matriz tipo × área ===== */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={card}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={tit}>Tendencia de incidencias · 7 días</h3>
              <p className="mt-0.5 text-[11px] text-muted">Incidencias registradas por dia</p>
            </div>

          </div>
          <div className="mt-4">
            <LabelRow values={m.serie} />
            <Sparkline values={m.serie} height={140} />
            <div className="mt-1 flex justify-between font-mono text-[9px] font-bold uppercase tracking-wider text-muted">
              {m.ult7.map(iso => <span key={iso}>{ddmm(iso)}</span>)}
            </div>
          </div>
        </div>

        <div className={card}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className={tit}>Incidencias por tipo y área</h3>
              <p className="mt-0.5 text-[11px] text-muted">Cantidad Historica de Incidencias</p>
            </div>
            <div className="flex rounded-lg border border-line bg-surface2 p-0.5">
              {([['7d', '7 días'], ['30d', '30 días'], ['todo', 'Total']] as const).map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setRangoMat(k)}
                  className={clsx(
                    'rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors',
                    rangoMat === k ? 'bg-adecco text-white' : 'text-muted hover:text-ink',
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[340px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="py-2 pr-2 text-[10px] font-bold uppercase tracking-[0.08em] text-muted">Tipo</th>
                  {['Decant', 'Reabasto'].map(h => (
                    <th key={h} className="px-2 py-2 text-center text-[10px] font-bold uppercase tracking-[0.08em] text-muted">{h}</th>
                  ))}
                  <th className="py-2 pl-2 text-center text-[10px] font-bold uppercase tracking-[0.08em] text-muted">Total</th>
                </tr>
              </thead>
              <tbody>
                {m.matTipo.map(f => (
                  <tr key={f.tipo} className="border-b border-line/60 last:border-0">
                    <td className="py-2 pr-2 font-semibold">{f.tipo}</td>
                    {f.celdas.map((c, i) => (
                      <td key={i} className="px-2 py-2 text-center font-mono tabular-nums">
                        {c === 0 ? <span className="text-muted">·</span> : c}
                      </td>
                    ))}
                    <td className="py-2 pl-2 text-center font-mono font-bold tabular-nums">{f.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}