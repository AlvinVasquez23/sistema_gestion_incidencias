import { useState, type FormEvent } from 'react'
import { X, User, KeyRound, Palette, Database, PanelLeft } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../context/AuthContext'
import { useSettings, type Prefs } from '../../context/SettingsContext'
import { api, apiActiva } from '../../services/api'

const input = 'h-10 w-full rounded-lg border border-line bg-surface2 px-3 text-sm outline-none transition focus:border-adecco focus:ring-2 focus:ring-adecco/20'
const label = 'mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted'
const seccion = 'flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted'

function Seg<T extends string | number>({ opciones, valor, onPick }: {
  opciones: [T, string][]
  valor: T
  onPick: (v: T) => void
}) {
  return (
    <div className="flex rounded-lg border border-line bg-surface2 p-0.5">
      {opciones.map(([v, l]) => (
        <button
          key={String(v)}
          onClick={() => onPick(v)}
          className={clsx(
            'flex-1 rounded-md px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors',
            valor === v ? 'bg-adecco text-white' : 'text-muted hover:text-ink',
          )}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

export default function SettingsPanel({ abierto, onClose }: { abierto: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const { prefs, actualizar } = useSettings()
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirma, setConfirma] = useState('')
  const [msg, setMsg] = useState<null | { tipo: 'ok' | 'error'; texto: string }>(null)
  const [guardando, setGuardando] = useState(false)

  if (!abierto) return null

  const cambiar = async (e: FormEvent) => {
    e.preventDefault()
    if (nueva !== confirma) { setMsg({ tipo: 'error', texto: 'La confirmación no coincide con la nueva contraseña' }); return }
    if (nueva.length < 6) { setMsg({ tipo: 'error', texto: 'La nueva contraseña debe tener al menos 6 caracteres' }); return }
    setGuardando(true); setMsg(null)
    try {
      await api.cambiarPassword(localStorage.getItem('ims_token') ?? user?.usuario ?? '', actual, nueva)
      setMsg({ tipo: 'ok', texto: 'Contraseña actualizada correctamente' })
      setActual(''); setNueva(''); setConfirma('')
    } catch (err) {
      setMsg({ tipo: 'error', texto: err instanceof Error ? err.message : 'Error al cambiar la contraseña' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-line bg-surface shadow-card">
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-surface/90 px-6 py-4 backdrop-blur">
          <h2 className="text-base font-extrabold">Ajustes</h2>
          <button onClick={onClose} className="ml-auto grid h-9 w-9 place-items-center rounded-lg border border-line text-muted hover:text-ink">
            <X size={17} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* ===== 1 · Mi perfil ===== */}
          <section className="space-y-3">
            <h3 className={seccion}><User size={13} /> Mi perfil</h3>
            <div className="flex items-center gap-3 rounded-xl border border-line bg-surface2/60 p-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-adecco font-mono text-sm font-bold text-white">
                {user?.nombre.slice(0, 2)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{user?.nombre}</p>
                <p className="font-mono text-[11px] text-muted">{user?.usuario}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted">
                    {user?.rol}
                  </span>
                  {user?.esSupervisor && (
                    <span className="rounded-full border border-adecco/30 bg-adecco/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-adecco">
                      Supervisor
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ===== 2 · Cambiar contraseña ===== */}
          <section className="space-y-3">
            <h3 className={seccion}><KeyRound size={13} /> Cambiar contraseña</h3>
            {!apiActiva() ? (
              <p className="rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-xs font-semibold text-warn">
                Disponible solo con conexión a Apps Script activa.
              </p>
            ) : (
              <form onSubmit={cambiar} className="space-y-3">
                <div>
                  <label className={label}>Contraseña actual</label>
                  <input type="password" className={input} value={actual} onChange={e => setActual(e.target.value)} required />
                </div>
                <div>
                  <label className={label}>Nueva contraseña</label>
                  <input type="password" className={input} value={nueva} onChange={e => setNueva(e.target.value)} required />
                </div>
                <div>
                  <label className={label}>Confirmar nueva</label>
                  <input type="password" className={input} value={confirma} onChange={e => setConfirma(e.target.value)} required />
                </div>
                {msg && (
                  <p className={clsx(
                    'rounded-lg border px-3 py-2 text-xs font-semibold',
                    msg.tipo === 'ok'
                      ? 'border-ok/30 bg-ok/10 text-ok'
                      : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-[#ff4d58]',
                  )}>
                    {msg.texto}
                  </p>
                )}
                <button type="submit" disabled={guardando} className="h-10 w-full rounded-lg bg-adecco text-sm font-bold text-white transition hover:bg-adecco-hover disabled:opacity-50">
                  {guardando ? 'Guardando…' : 'Actualizar contraseña'}
                </button>
              </form>
            )}
          </section>

          {/* ===== 5 · Densidad de tablas ===== */}
          <section className="space-y-2">
            <h3 className={seccion}><Palette size={13} /> Apariencia</h3>
            <p className="text-[11px] text-muted">Densidad de las tablas</p>
            <Seg
              opciones={[['comoda', 'Cómoda'], ['compacta', 'Compacta']] as [Prefs['densidad'], string][]}
              valor={prefs.densidad}
              onPick={v => actualizar({ densidad: v })}
            />
          </section>

          {/* ===== 6 y 7 · Datos ===== */}
          <section className="space-y-3">
            <h3 className={seccion}><Database size={13} /> Datos</h3>
            <div className="space-y-2">
              <p className="text-[11px] text-muted">Filas por página en módulos</p>
              <Seg
                opciones={[[8, '8'], [15, '15'], [30, '30']] as [Prefs['porPagina'], string][]}
                valor={prefs.porPagina}
                onPick={v => actualizar({ porPagina: v })}
              />
            </div>
            <div className="space-y-2">
              <p className="text-[11px] text-muted">Módulo de inicio al entrar</p>
              <Seg
                opciones={[['/', 'Dashboard'], ['/pool', 'Pool']] as [Prefs['moduloInicio'], string][]}
                valor={prefs.moduloInicio}
                onPick={v => actualizar({ moduloInicio: v })}
              />
            </div>
          </section>

          {/* ===== 8 · Sidebar ===== */}
          <section className="space-y-2">
            <h3 className={seccion}><PanelLeft size={13} /> Navegación</h3>
            <button
              onClick={() => actualizar({ sidebarColapsada: !prefs.sidebarColapsada })}
              className="flex w-full items-center justify-between rounded-xl border border-line bg-surface2/60 px-4 py-3 text-left"
            >
              <span className="text-xs font-semibold">Iniciar con sidebar colapsada</span>
              <span className={clsx('relative h-5 w-9 shrink-0 rounded-full transition-colors', prefs.sidebarColapsada ? 'bg-adecco' : 'bg-line')}>
                <span className={clsx('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', prefs.sidebarColapsada ? 'left-[18px]' : 'left-0.5')} />
              </span>
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}