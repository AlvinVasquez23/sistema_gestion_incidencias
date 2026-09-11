import { useEffect, useState, type ChangeEvent } from 'react'
import { X, Save, CheckCircle2, ClipboardCheck } from 'lucide-react'
import clsx from 'clsx'
import { useData, type RevisionPayload } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import { Badge, statusTone, slaTone } from '../ui/Badge'
import { fmtMoney, WMS_USERS } from '../../data/mock'
import { api, apiActiva } from '../../services/api'

const input = 'h-10 w-full rounded-lg border border-line bg-surface2 px-3 text-sm outline-none transition focus:border-adecco focus:ring-2 focus:ring-adecco/20 disabled:cursor-not-allowed disabled:opacity-60'
const label = 'mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted'

export default function DetalleIncidencia({ id, onClose }: { id: string; onClose: () => void }) {
  const { rows, guardarRevision, cerrarIncidencia } = useData()
  const { user } = useAuth()
  const r = rows.find(x => x.id === id)

  const [form, setForm] = useState<RevisionPayload>({
    turno_picking: r?.turno_picking ?? '',
    usuario_picking: r?.usuario_picking ?? '',
    ubicacion_picking: r?.ubicacion_picking ?? '',
    fecha_modific_wms: r?.fecha_modific_wms ?? '',
    ubicacion_hallazgo: r?.ubicacion_hallazgo ?? '',
    obs_revision: r?.obs_revision ?? '',
  })
  const [causa, setCausa] = useState('')
  const [mostrarCerrar, setMostrarCerrar] = useState(false)
  const [aviso, setAviso] = useState<null | { texto: string }>(null)
  const [editando, setEditando] = useState(() => r?.status !== 'Revisado')

  if (!r) return null

  const editable = !!user?.esSupervisor && (r.modulo === 'AMR' || r.modulo === 'AUD') && r.status !== 'Cerrado'
  const yaRevisado = r.status === 'Revisado'
  const esAux = r.modulo === 'AUX'
  const [nombreWms, setNombreWms] = useState('')
  useEffect(() => {
    const cod = form.usuario_picking.trim()
    if (!cod) { setNombreWms(''); return }
    if (!apiActiva()) { setNombreWms(WMS_USERS[cod] ?? ''); return }
    const t = setTimeout(() => {
      api.nombreWms(localStorage.getItem('ims_token') ?? user?.usuario ?? '', cod)
        .then(n => setNombreWms(n || ''))
        .catch(() => setNombreWms(''))
    }, 350)
    return () => clearTimeout(t)
  }, [form.usuario_picking, user])

  const set = (k: keyof RevisionPayload) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const guardar = () => {
    void guardarRevision(r.id, { ...form, nombre_picking: nombreWms })
    if (yaRevisado) setEditando(false)
    setAviso({ texto: yaRevisado ? 'Modificación guardada · registrada en el historial' : 'Revisión guardada · status Revisado' })
  }
  const cerrar = () => {
    if (!causa) { setAviso({ texto: 'Selecciona una causa raíz para cerrar' }); return }
    void cerrarIncidencia(r.id, causa)
    setMostrarCerrar(false)
    setAviso({ texto: 'Incidencia cerrada correctamente' })
  }

  /* ===== Captura + revisión + cierre (los que tengan valor) ===== */
  const captura: [string, string][] = esAux ? [
    ['Fecha', r.fecha], ['Hora', r.hora],
    ['Auxiliar', r.auxiliar_persona ?? ''],
    ['LPN', r.lpn ?? ''],
    ['Tipo', r.tipo],
    ['Artículo', r.codigo],
    ['Descripción', r.descripcion],
    ['Cantidad', String(r.cantidad ?? '')],
    ['Observación', r.observacion ?? ''],
    ['Registró', r.usuario_registro ?? ''],
  ] : [
    ['Área', r.area], ['Fecha', r.fecha], ['Hora', r.hora],
    ['LPN', r.lpn ?? ''], ['Cubeta', r.cubeta ?? ''], ['Estación', r.estacion ?? ''],
    ['Tipo', r.tipo], ['Código', r.codigo], ['Descripción', r.descripcion],
    ['Lote', r.lote ?? ''], ['Cantidad', `${r.cantidad} ${r.um ?? ''}`.trim()],
    ['Valorizado', fmtMoney(r.valorizado)],
    [r.modulo === 'AUD' ? 'Auditor' : 'Reportado', r.reportado ?? ''],
    ['Observación', r.observacion ?? ''],
  ]
  const extra: [string, string][] = esAux ? [] : [
    ['Turno picking', r.turno_picking ?? ''], ['Usuario picking', r.usuario_picking ?? ''],
    ['Nombre WMS', r.nombre_picking ?? (r.usuario_picking ? (WMS_USERS[r.usuario_picking] ?? '') : '')],
    ['Ubicación picking', r.ubicacion_picking ?? ''], ['Fecha mod. WMS', r.fecha_modific_wms ?? ''],
    ['Ubicación hallazgo', r.ubicacion_hallazgo ?? ''], ['Obs. revisión', r.obs_revision ?? ''],
    ['Revisado por', r.usuario_revision ?? ''],
    ['Fecha revisión', r.fecha_revision ? `${r.fecha_revision} ${r.hora_revision}` : ''],
    ['Causa raíz', r.causa_raiz ?? ''], ['Cerrado por', r.usuario_cierre ?? ''],
    ['Fecha cierre', r.fecha_cierre ? `${r.fecha_cierre} ${r.hora_cierre}` : ''],
  ]
  const campos = [...captura, ...extra].filter(([, v]) => v && v.trim() !== '')

  const hist = esAux ? [
    { f: `${r.fecha} ${r.hora}`, t: `Registrado por ${r.usuario_registro || '—'} · Auxiliar: ${r.auxiliar_persona || '—'}` },
  ] : [
    { f: `${r.fecha} ${r.hora}`, t: `Registrado por ${r.reportado || '—'}` },
    ...(r.fecha_revision ? [{ f: `${r.fecha_revision} ${r.hora_revision}`, t: `Revisado por ${r.usuario_revision || '—'}` }] : []),
    ...(r.hist_mod ? String(r.hist_mod).split('\n').filter(Boolean).map(linea => ({
      f: linea.slice(0, 19),
      t: `Modificación · ${linea.slice(20)}`,
    })) : []),
    ...(r.fecha_cierre ? [{ f: `${r.fecha_cierre} ${r.hora_cierre}`, t: `Cerrado por ${r.usuario_cierre || '—'}${r.causa_raiz ? ` · Causa: ${r.causa_raiz}` : ''}` }] : []),
  ]

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className={clsx(
        'relative flex h-full w-full flex-col overflow-y-auto border-l border-line bg-surface shadow-card',
        editable ? 'sm:max-w-4xl' : 'sm:max-w-2xl',
      )}>
        {/* Cabecera */}
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-surface/90 px-6 py-4 backdrop-blur">
          <div>
            <p className="font-mono text-sm font-bold">{r.id}</p>
            <div className="mt-1 flex gap-2">
              {esAux ? (
                <Badge solid tone={statusTone(r.status)}>Sin seguimiento</Badge>
              ) : (
                <>
                  <Badge solid tone={statusTone(r.status)}>{r.status}</Badge>
                  {r.sla && <Badge solid tone={slaTone(r.sla)} pulse={r.sla === 'Crítico'}>{r.sla}</Badge>}
                </>
              )}
            </div>
          </div>
          <button onClick={onClose} className="ml-auto grid h-9 w-9 place-items-center rounded-lg border border-line text-muted hover:text-ink">
            <X size={17} />
          </button>
        </div>

        {/* Aviso: auditoría conforme se cierra sola al registrarse */}
        {r.modulo === 'AUD' && r.tipo.toLowerCase() === 'conforme' && (
          <div className="mx-6 mt-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            Auditoría conforme: cerrada automáticamente al registrarse.
          </div>
        )}        

        {/* Cuerpo: 2 columnas si está abierta / 1 columna si está cerrada */}
        <div className={clsx('grid gap-6 p-6', editable && 'lg:grid-cols-2')}>
          {/* Detalle de incidencia */}
          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Detalle de incidencia</h3>
            <div className="divide-y divide-line/60 rounded-xl border border-line bg-surface2/50">
              {campos.map(([k, v]) => (
                <div key={k} className="flex gap-3 px-4 py-2 text-sm">
                  <span className="w-32 shrink-0 font-semibold text-muted">{k}</span>
                  <span className={clsx(['Valorizado', 'Código', 'Artículo', 'LPN', 'Fecha revisión', 'Fecha cierre'].includes(k) && 'font-mono text-xs font-semibold')}>{v}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Columna derecha: revisión + cierre (solo si está abierta) */}
          {editable && (
            <section className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Revisión de incidencia</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={label}>Turno picking</label>
                    <select className={input} value={form.turno_picking} onChange={set('turno_picking')} disabled={!editando}>
                      <option value="">Seleccionar</option>
                      <option>Turno 1</option><option>Turno 2</option><option>Turno 3</option>
                    </select>
                  </div>
                  <div>
                    <label className={label}>Usuario picking</label>
                    <input className={input} placeholder="Código WMS" value={form.usuario_picking} onChange={set('usuario_picking')} disabled={!editando}/>
                  </div>
                </div>
                <div>
                  <label className={label}>Nombre de Usuario WMS</label>
                  <input className={`${input} opacity-70`} readOnly placeholder="—" value={nombreWms} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={label}>Ubicación picking</label>
                    <input className={input} value={form.ubicacion_picking} onChange={set('ubicacion_picking')} disabled={!editando}/>
                  </div>
                  <div>
                    <label className={label}>Fecha mod. WMS</label>
                    <input className={input} placeholder="dd/MM/yyyy HH:mm:ss" value={form.fecha_modific_wms} onChange={set('fecha_modific_wms')} disabled={!editando}/>
                  </div>
                </div>
                <div>
                  <label className={label}>Ubicación hallazgo</label>
                  <input className={input} value={form.ubicacion_hallazgo} onChange={set('ubicacion_hallazgo')} disabled={!editando}/>
                </div>
                <div>
                  <label className={label}>Observaciones revisión</label>
                  <textarea className={`${input} h-20 py-2`} value={form.obs_revision} onChange={set('obs_revision')} disabled={!editando} />
                </div>
                {editando ? (
                  <button onClick={guardar} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-ok text-sm font-bold text-white transition hover:brightness-110">
                    <Save size={15} /> {yaRevisado ? 'Guardar cambios' : 'Guardar revisión'}
                  </button>
                ) : (
                  <button onClick={() => setEditando(true)} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-info/40 bg-info/10 text-sm font-bold text-info transition hover:bg-info/20">
                    <ClipboardCheck size={15} /> Modificar revisión
                  </button>
                )}
              </div>

              {user?.esSupervisor && (
                <div className="space-y-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-[#ff4d58]">Cerrar incidencia</h3>
                  {!mostrarCerrar ? (
                    <button onClick={() => setMostrarCerrar(true)} className="h-10 w-full rounded-lg border border-red-500/40 text-sm font-bold text-red-600 transition hover:bg-red-500/10 dark:text-[#ff4d58]">
                      Iniciar cierre
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className={label}>Causa raíz</label>
                        <select className={input} value={causa} onChange={e => setCausa(e.target.value)}>
                          <option value="">Seleccionar</option>
                          <option>Mala Recepción</option><option>Mal Almacenamiento</option>
                          <option>Mal Reabasto</option><option>Mal Decanting</option>
                        </select>
                      </div>
                      <button onClick={cerrar} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-adecco text-sm font-bold text-white transition hover:bg-adecco-hover">
                        <CheckCircle2 size={15} /> Confirmar cierre
                      </button>
                    </div>
                  )}
                </div>
              )}


            </section>
          )}

          {/* Historial a lo ancho */}
          <section className={clsx(editable && 'lg:col-span-2')}>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Historial</h3>
            <ul>
              {hist.map((h, i) => (
                <li key={i} className="relative pb-4 pl-6 text-sm last:pb-0">
                  <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-adecco" />
                  {i < hist.length - 1 && <span className="absolute left-[4px] top-5 h-full w-0.5 bg-line" />}
                  <span className="font-mono text-[11px] text-muted">{h.f}</span>
                  <p className="font-medium">{h.t}</p>
                </li>
              ))}
            </ul>
          </section>

        {aviso && (
            <div className="fixed inset-0 z-[60] grid place-items-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAviso(null)} />
            <div className="relative w-full max-w-sm rounded-xl border border-line bg-surface p-6 text-center shadow-card">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-ok/15 text-ok">
                <CheckCircle2 size={24} />
                </span>
                <p className="mt-3 text-sm font-bold">{aviso.texto}</p>
                <button
                onClick={() => setAviso(null)}
                className="mt-4 h-10 w-full rounded-lg bg-adecco text-sm font-bold text-white transition hover:bg-adecco-hover"
                >
                Aceptar
                </button>
          </div>
        </div>
      )}          
        </div>
      </div>
    </div>
  )
}