import { useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Home, ClipboardList, Search, LogOut, Sun, Moon,
  PackageOpen, ClipboardCheck, Forklift, Layers, Lock, Users, LayoutDashboard,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { LogoAdecco } from '../ui/LogoAdecco'
import DetalleIncidencia from '../detalle/DetalleIncidencia'
import { useTheme } from '../../context/ThemeContext'
import InstalarApp from '../pwa/InstalarApp'


const RUTA_MODULO: Record<string, string> = { AMR: 'amr', AUD: 'aud', API: 'api', AFR: 'afr', AUX: 'aux' }


/* Pill de status local (independiente del Badge del design system) */
function Pill({ status }: { status: string }) {
  const s = status || 'Pendiente'
  const cls = s === 'Cerrado'
    ? 'bg-emerald-600 text-white'
    : s === 'Revisado'
      ? 'bg-sky-600 text-white'
      : 'bg-amber-500 text-white'
  return (
    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cls}`}>
      {s}
    </span>
  )
}

export default function CaptureShell() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const { theme, toggle } = useTheme()

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-surface/80 px-4 backdrop-blur">
        <LogoAdecco className="h-8 w-8 rounded-lg text-[7px]" />
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold leading-tight">Registro de incidencias</p>
          <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted">{user?.nombre}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <InstalarApp />
          {user?.esAdmin && (
            <button
              onClick={() => nav('/')}
              title="Módulo consulta"
              className="flex h-9 items-center gap-2 rounded-lg border border-adecco/40 bg-adecco/10 px-2.5 text-adecco transition-colors hover:bg-adecco/20"
            >
              <LayoutDashboard size={16} />
              <span className="hidden text-xs font-bold sm:inline">Módulo consulta</span>
            </button>
          )}
          <button
            onClick={toggle}
            title="Cambiar tema"
            className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted transition-colors hover:bg-surface2 hover:text-ink"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={() => { logout(); nav('/login') }}
            title="Cerrar sesión"
            className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted transition-colors hover:bg-surface2 hover:text-ink"
          >
            <LogOut size={16} />
          </button>
        </div>  
      </header>

      <main className="flex-1 px-4 pb-24 pt-4">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t border-line bg-surface/90 backdrop-blur">
        {([
          { to: '/captura', icon: Home, label: 'Registrar incidencia' },
          { to: '/captura/mis', icon: ClipboardList, label: 'Mis registros' },
          { to: '/captura/consulta', icon: Search, label: 'Consulta' },
        ] as const).map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/captura'}
            className={({ isActive }) => clsx(
              'flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors',
              isActive ? 'text-adecco' : 'text-muted',
            )}
          >
            <n.icon size={18} />
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export function CapturaHome() {
  const { user } = useAuth()
  const [aviso, setAviso] = useState<string | null>(null)
  const TODOS = [
    { key: 'AMR', to: '/captura/amr', icon: PackageOpen, t: 'Incidencias AMR', d: 'Decanting' },
    { key: 'AUD', to: '/captura/aud', icon: ClipboardCheck, t: 'Auditorías Reaba', d: 'Reabasto' },
    { key: 'API', to: '/captura/api', icon: Forklift, t: 'Incidencias de Apilador', d: 'Decanting' },
    { key: 'AFR', to: '/captura/afr', icon: Layers, t: 'Incidencias de AFRAME', d: 'AFRAME' },
    { key: 'AUX', to: '/captura/aux', icon: Users, t: 'Incidencias de personal', d: 'Decanting' },  
  ]
  const POR_ROL: Record<string, string[]> = {
    decanting: ['AMR', 'API', 'AUX'], reabasto: ['AUD'], inventarios: ['API'], aframe: ['AFR'],
    sistema: ['AMR', 'AUD', 'API', 'AFR', 'AUX'],  
  }
  const permitidos = POR_ROL[(user?.rol ?? '').split('_')[0]] ?? TODOS.map(t => t.key)
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-extrabold tracking-tight">¿Qué vas a registrar?</h2>
      <div className="grid grid-cols-2 gap-3">
        {TODOS.map(m => {
          const ok = permitidos.includes(m.key)
          return ok ? (
            <NavLink
              key={m.to}
              to={m.to}
              className="flex flex-col items-start gap-2 rounded-xl border border-line bg-surface p-4 shadow-card transition hover:border-adecco"
            >
              <m.icon size={22} className="text-adecco" />
              <p className="text-sm font-bold leading-tight">{m.t}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{m.d}</p>
            </NavLink>
          ) : (
            <button
              key={m.to}
              type="button"
              onClick={() => setAviso(`No tiene acceso a ${m.t}`)}
              className="relative flex flex-col items-start gap-2 rounded-xl border border-line bg-surface p-4 opacity-50 shadow-card"
            >
              <Lock size={14} className="absolute right-3 top-3 text-muted" />
              <m.icon size={22} className="text-muted" />
              <p className="text-sm font-bold leading-tight text-muted">{m.t}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{m.d}</p>
            </button>
          )
        })}
      </div>
      {aviso && (
        <p className="rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-xs font-semibold text-warn">
          {aviso}
        </p>
      )}
    </div>
  )
}

export function MisCapturas() {
  const nav = useNavigate()
  const { user } = useAuth()
  const { rows } = useData()
  const [detalle, setDetalle] = useState<string | null>(null)
  const esMia = (r: { usuario_registro?: string; reportado?: string }) =>
    (r.usuario_registro || '') === (user?.usuario ?? '') ||
    (!r.usuario_registro && (r.reportado || '') === (user?.nombre ?? ''))
  const mias = useMemo(() => rows.filter(esMia).slice(0, 30), [rows, user])
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-extrabold tracking-tight">Mis capturas recientes</h2>
      {mias.length === 0 && (
        <p className="rounded-xl border border-line bg-urface p-4 text-sm text-muted">
          Aún no tienes incidencias registradas.
        </p>
      )}
      <ul className="space-y-2">
        {mias.map(r => (
          <li key={r.id}>
            <div className="rounded-xl border border-line bg-surface p-3 shadow-card">
              <button onClick={() => setDetalle(r.id)} className="w-full text-left">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold">{r.id}</span>
                  <Pill status={r.status || 'Pendiente'} />
                </div>
                <p className="mt-1 truncate text-xs font-semibold">{r.descripcion || r.codigo || r.cubeta || r.tipo}</p>
                <p className="mt-0.5 font-mono text-[10px] text-muted">{r.fecha} {r.hora} · {r.area} · {r.tipo}</p>
              </button>
              {r.modulo !== 'AUX' && r.status === 'Pendiente' && esMia(r) && (
                <button
                  onClick={() => nav(`/captura/${RUTA_MODULO[r.modulo] ?? 'amr'}?edit=${r.id}`)}
                  className="mt-2 h-8 w-full rounded-lg border border-warn/40 bg-warn/10 text-[11px] font-bold uppercase tracking-wider text-warn transition hover:bg-warn/20"
                >
                  Corregir captura
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {detalle && <DetalleIncidencia id={detalle} onClose={() => setDetalle(null)} />}
    </div>
  )
}

export function ConsultaIncidencias() {
  const { rows } = useData()
  const [q, setQ] = useState('')
  const [detalle, setDetalle] = useState<string | null>(null)
  const res = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return []
    return rows
      .filter(r => String(r.status || '').toLowerCase() !== 'cerrado')
      .filter(r => [r.id, r.lpn, r.cubeta, r.codigo, r.descripcion].some(v => (v || '').toLowerCase().includes(t)))
      .slice(0, 20)
  }, [q, rows])
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-extrabold tracking-tight">Consultar incidencia</h2>
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="ID, LPN, cubeta, SKU o descripción…"
        className="h-11 w-full rounded-lg border border-line bg-surface2 px-4 text-sm outline-none transition focus:border-adecco"
      />
      {q.trim() && res.length === 0 && <p className="text-xs text-muted">Sin coincidencias.</p>}
      <ul className="space-y-2">
        {res.map(r => (
          <li key={r.id}>
            <button onClick={() => setDetalle(r.id)} className="w-full rounded-xl border border-line bg-surface p-3 text-left shadow-card">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] font-bold">{r.id}</span>
                <Pill status={r.status || 'Pendiente'} />
              </div>
              <p className="mt-1 truncate text-xs font-semibold">{r.descripcion || r.codigo || r.cubeta || r.tipo}</p>
              <p className="mt-0.5 font-mono text-[10px] text-muted">{r.fecha} {r.hora} · {r.area} · {r.modulo}</p>
            </button>
          </li>
        ))}
      </ul>
      {detalle && <DetalleIncidencia id={detalle} onClose={() => setDetalle(null)} />}
    </div>
  )
}

export { default as CapturaForm } from '../captura/CapturaForm'