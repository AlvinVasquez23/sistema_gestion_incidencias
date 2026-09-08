import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Inbox, Bot, ClipboardCheck, Forklift, Layers,
  Sun, Moon, LogOut, Bell, Settings, Menu, X, ChevronsLeft, ChevronsRight,
} from 'lucide-react'
import clsx from 'clsx'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'

export const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/pool', label: 'Pool de Incidencias', icon: Inbox, end: false },
  { to: '/amr', label: 'Incidencias AMR', icon: Bot, end: false },
  { to: '/aud', label: 'Auditorías Reaba', icon: ClipboardCheck, end: false },
  { to: '/api', label: 'Incidencias Apilador', icon: Forklift, end: false },
  { to: '/afr', label: 'Incidencias AFRAME', icon: Layers, end: false },
]

function LogoAdecco({ className }: { className?: string }) {
  return (
    <div className={clsx('grid shrink-0 place-items-center rounded-2xl bg-white font-extrabold tracking-tight text-adecco shadow-lg', className)}>
      Adecco
    </div>
  )
}

export default function AppShell() {
  const { theme, toggle } = useTheme()
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const [sheet, setSheet] = useState<null | 'modulos' | 'ajustes'>(null)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('ims_sidebar') === '1')

  const toggleSidebar = () => {
    setCollapsed(c => {
      localStorage.setItem('ims_sidebar', c ? '0' : '1')
      return !c
    })
  }

  const titulo = NAV.find(n => (n.end ? pathname === n.to : pathname.startsWith(n.to)))?.label ?? 'Indicadores'
  const salir = () => { logout(); nav('/login') }
  const pad = collapsed ? 'lg:pl-24' : 'lg:pl-80'

  return (
    <div className="min-h-full">
      {/* ===== SIDEBAR DESKTOP COLAPSABLE (compacta, sin scroll) ===== */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line bg-surface transition-[width] duration-300 lg:flex',
        collapsed ? 'w-20' : 'w-72',
      )}>
        <button
          onClick={toggleSidebar}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
                    className="absolute -right-3 top-20 z-40 grid h-7 w-7 place-items-center rounded-full border border-line bg-surface text-muted shadow-card transition-colors hover:text-adecco"
        >
          {collapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
        </button>

        {/* Logo + leyendas centradas (compacto) */}
        <div className={clsx('flex flex-col items-center gap-2.5 px-4 pb-4 pt-5', collapsed && 'px-2')}>
          <LogoAdecco className={collapsed ? 'h-11 w-11 rounded-xl text-[9px]' : 'h-14 w-14 text-sm'} />
          {!collapsed && (
            <div className="text-center leading-tight">
              <p className="text-[13px] font-extrabold uppercase tracking-wide">Gestión de Incidencias</p>
              <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">Adecco - Punta Negra</p>
            </div>
          )}
        </div>

        {/* Navegación compacta */}
        <nav className={clsx('min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 py-1.5', collapsed && 'px-2')}>
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              title={collapsed ? n.label : undefined}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                collapsed && 'justify-center px-0',
                isActive ? 'bg-adecco text-white shadow-card' : 'text-muted hover:bg-surface2 hover:text-ink',
              )}
            >
              <n.icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{n.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Pie: ajustes + tema + salir + footer (compacto) */}
        <div className={clsx('space-y-0.5 border-t border-line px-3 pb-2.5 pt-2.5', collapsed && 'px-2')}>
          <button
            title="Ajustes (decorativo)"
            className={clsx(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-surface2 hover:text-ink',
              collapsed && 'justify-center px-0',
            )}
          >
            <Settings size={18} className="shrink-0" />
            {!collapsed && <span>Ajustes</span>}
          </button>

          <button
            onClick={toggle}
            title="Cambiar tema"
            className={clsx(
              'flex w-full items-center gap-3 rounded-lg bg-surface2 px-3 py-2 text-sm font-semibold text-muted transition-colors hover:text-ink',
              collapsed && 'justify-center px-0',
            )}
          >
            {theme === 'dark' ? <Moon size={18} className="shrink-0" /> : <Sun size={18} className="shrink-0" />}
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                <span className={clsx('relative h-5 w-9 shrink-0 rounded-full transition-colors', theme === 'dark' ? 'bg-adecco' : 'bg-line')}>
                  <span className={clsx('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', theme === 'dark' ? 'left-[18px]' : 'left-0.5')} />
                </span>
              </>
            )}
          </button>

          <button
            onClick={salir}
            title="Cerrar sesión"
            className={clsx(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-adecco/10 hover:text-adecco',
              collapsed && 'justify-center px-0',
            )}
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>

          {!collapsed && (
            <p className="px-1 pb-0.5 pt-2 text-center text-[9px] font-medium leading-snug text-muted">
              © 2026 All rights Reserved · Developed by ALHV
            </p>
          )}
        </div>
      </aside>

      {/* ===== TOPBAR (sin botón de tema) ===== */}
      <header className={clsx(
        'sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-surface/80 px-4 backdrop-blur transition-[padding] duration-300',
        pad,
      )}>
        <div className="flex items-center gap-2 lg:hidden">
          <LogoAdecco className="h-8 w-8 rounded-lg text-[7px]" />
        </div>
        <h1 className="hidden text-base font-extrabold sm:block lg:text-lg">{titulo}</h1>
        <div className="ml-auto flex items-center gap-1.5">
          <button className="relative grid h-9 w-9 place-items-center rounded-lg border border-line text-muted transition-colors hover:bg-surface2 hover:text-ink">
            <Bell size={17} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-adecco" />
          </button>
          <button onClick={() => setSheet('ajustes')}
            className="ml-1 grid h-9 w-9 place-items-center rounded-full bg-surface2 font-mono text-xs font-bold uppercase lg:hidden">
            {user?.nombre.slice(0, 2)}
          </button>
          <div className="ml-1 hidden items-center gap-2 rounded-full bg-surface2 py-1.5 pl-2 pr-4 lg:flex">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-adecco font-mono text-[10px] font-bold text-white">
              {user?.nombre.slice(0, 2)}
            </span>
            <span className="max-w-[160px] truncate text-xs font-semibold">{user?.nombre}</span>
          </div>
        </div>
      </header>

      {/* ===== CONTENIDO ===== */}
      <main className={clsx('px-4 pb-24 pt-5 transition-[padding] duration-300 lg:pb-8 lg:pr-8 lg:pt-7', pad)}>
        <Outlet />
      </main>

      {/* ===== BOTTOM NAV MÓVIL ===== */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
        {[
          { to: '/', label: 'Inicio', icon: LayoutDashboard, end: true },
          { to: '/pool', label: 'Pool', icon: Inbox, end: false },
        ].map(n => (
          <NavLink key={n.to} to={n.to} end={n.end}
            className={({ isActive }) => clsx('flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold',
              isActive ? 'text-adecco' : 'text-muted')}>
            <n.icon size={20} /> {n.label}
          </NavLink>
        ))}
        <button onClick={() => setSheet('modulos')} className="flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold text-muted">
          <Menu size={20} /> Módulos
        </button>
        <button onClick={() => setSheet('ajustes')} className="flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold text-muted">
          <Settings size={20} /> Ajustes
        </button>
      </nav>

      {/* ===== SHEET MÓVIL ===== */}
      {sheet && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSheet(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-line bg-surface p-4 pb-8" onClick={e => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
            {sheet === 'modulos' ? (
              <div className="grid grid-cols-2 gap-2">
                {NAV.slice(2).map(n => (
                  <NavLink key={n.to} to={n.to} onClick={() => setSheet(null)}
                    className="flex items-center gap-3 rounded-xl border border-line bg-surface2 p-3 text-sm font-semibold">
                    <n.icon size={18} className="text-adecco" /> {n.label}
                  </NavLink>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-line bg-surface2 p-3">
                  <div>
                    <p className="text-sm font-bold">{user?.nombre}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted">{user?.rol}</p>
                  </div>
                  <button onClick={toggle} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-bold">
                    {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />} {theme === 'dark' ? 'Light' : 'Dark'}
                  </button>
                </div>
                <button onClick={salir} className="flex w-full items-center justify-center gap-2 rounded-xl bg-adecco py-3 text-sm font-bold text-white">
                  <LogOut size={16} /> Cerrar sesión
                </button>
                <p className="text-center font-mono text-[10px] text-muted">© 2026 All rights Reserved | Developed by ALHV</p>
              </div>
            )}
            <button onClick={() => setSheet(null)} className="mx-auto mt-4 flex items-center gap-1 text-xs font-bold text-muted">
              <X size={14} /> Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}