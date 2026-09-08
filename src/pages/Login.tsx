import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Sun, Moon, Lock, User, Warehouse, ScanBarcode, ClipboardCheck, Forklift } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Login() {
  const { user, login } = useAuth()
  const { theme, toggle } = useTheme()
  const nav = useNavigate()
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [err, setErr] = useState('')
  const [olvido, setOlvido] = useState(false)

  if (user) return <Navigate to="/" replace />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setErr('')
    if (login(u, p)) nav('/')
    else setErr('Usuario o contraseña incorrectos')
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Toggle de tema flotante */}
      <button
        onClick={toggle}
        title="Cambiar tema"
        className="fixed right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-lg border border-line bg-surface text-muted transition-colors hover:text-ink"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <main className="flex flex-1 items-center justify-center px-4">
        {/* Tarjeta principal: viewport completo sin scroll */}
        <div className="grid w-[min(1200px,96vw)] overflow-hidden rounded-2xl border border-line bg-surface shadow-card lg:grid-cols-[1.1fr_1fr]" style={{ maxHeight: '92vh' }}>

          {/* ===== Panel de marca (rojo Adecco) ===== */}
          <div className="relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-adecco via-[#b8050f] to-[#7a030a] p-8 text-white sm:p-10">
            {/* Decoración de fondo */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-black/20 blur-2xl" />

            {/* Logo + identificador de planta */}
            <div className="relative flex items-center gap-4">
              <div className="grid h-[88px] w-[88px] shrink-0 place-items-center rounded-2xl bg-white text-[22px] font-extrabold tracking-tight text-adecco shadow-lg">
                Adecco
              </div>
              <div className="text-[11px] font-bold uppercase leading-relaxed tracking-[0.18em] text-white/85">
                Proyecto Titan
                <br />
                Farmacias Peruanas
                <br />
                CD Punta Negra
              </div>
            </div>

            {/* Títulos centrados */}
            <div className="relative mt-8 text-center">
              <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl lg:text-4xl">
                Sistema de Gestión de Incidencias
              </h1>
              <h2 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl lg:text-4xl">
                Automatizado
              </h2>
              <p className="mt-3 text-lg font-normal text-white/85 sm:text-xl lg:text-2xl">
                Adecco Industrial &amp; Logistics
              </p>
            </div>

            {/* Íconos representativos centrados */}
            <div className="relative mt-8 flex items-center justify-center gap-6">
              {[
                { icon: Warehouse, label: '' },
                { icon: ScanBarcode, label: '' },
                { icon: ClipboardCheck, label: '' },
                { icon: Forklift, label: '' },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-1.5">
                  <div className="grid h-14 w-14 place-items-center rounded-xl border border-white/25 bg-white/10 backdrop-blur-sm">
                    <item.icon size={26} strokeWidth={1.8} />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/70">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ===== Panel de formulario ===== */}
          <div className="flex flex-col justify-center p-8 sm:p-12">
            <h3 className="text-center text-2xl font-extrabold">Login</h3>
            <p className="text-center mb-7 mt-1 text-sm text-muted">Ingresa tu usuario y contraseña</p>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Usuario</label>
                <div className="relative">
                  <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    value={u}
                    onChange={(e) => setU(e.target.value)}
                    autoComplete="username"
                    placeholder="Ingresa tu usuario"
                    className="h-12 w-full rounded-lg border border-line bg-surface2 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-adecco focus:ring-2 focus:ring-adecco/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Contraseña</label>
                <div className="relative">
                  <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="password"
                    value={p}
                    onChange={(e) => setP(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Ingresa tu contraseña"
                    className="h-12 w-full rounded-lg border border-line bg-surface2 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-adecco focus:ring-2 focus:ring-adecco/20"
                  />
                </div>
              </div>

              {err && (
                <p className="rounded-lg border border-adecco/30 bg-adecco/10 px-3 py-2.5 text-xs font-semibold text-adecco">
                  {err}
                </p>
              )}

              <button
                type="submit"
                className="h-12 w-full rounded-lg bg-adecco text-sm font-bold uppercase tracking-widest text-white transition hover:bg-adecco-hover active:bg-adecco-pressed"
              >
                Ingresar
              </button>
            </form>

            {/* Olvidé mi contraseña (decorativo) */}
            <button
              type="button"
              onClick={() => setOlvido((v) => !v)}
              className="mx-auto mt-5 block text-sm font-semibold text-adecco hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
            {olvido && (
              <p className="mt-2 text-center text-xs text-muted">
                Para restablecerla, contacta al administrador del sistema.
              </p>
            )}

            {/* Footer dentro de la tarjeta */}
            <p className="mt-6 text-center text-[11px] font-medium text-muted">
              © 2026 All rights Reserved | Developed by ALHV
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}