/* Panel de administración (drawer estilo Ajustes/Detalle) — solo sistema_admin */
import { useState, type ChangeEvent } from 'react'
import { X, UserCog, Package, UserPlus, Search, Save, Upload, Download } from 'lucide-react'
import clsx from 'clsx'
import { api } from '../../services/api'
import { parseCsv, descargarPlantilla } from '../../utils/csv'

const input = 'h-10 w-full rounded-lg border border-line bg-surface2 px-3 text-sm outline-none transition focus:border-adecco focus:ring-2 focus:ring-adecco/20 disabled:cursor-not-allowed disabled:opacity-60'
const label = 'mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted'
const btnPrim = 'flex h-10 items-center justify-center gap-2 rounded-lg bg-adecco px-4 text-sm font-bold text-white transition hover:bg-adecco-hover disabled:opacity-50'
const btnSec = 'flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-line px-4 text-sm font-bold text-muted transition hover:bg-surface2 hover:text-ink disabled:opacity-50'

type Tab = 'usuarios' | 'productos' | 'auxiliares'
type AvisoT = { tipo: 'ok' | 'error'; texto: string } | null
const tok = () => localStorage.getItem('ims_token') ?? ''

const TABS: { k: Tab; label: string; icon: typeof UserCog }[] = [
  { k: 'usuarios', label: 'Usuarios', icon: UserCog },
  { k: 'productos', label: 'Productos', icon: Package },
  { k: 'auxiliares', label: 'Auxiliares', icon: UserPlus },
]

function Aviso({ a }: { a: AvisoT }) {
  if (!a) return null
  return (
    <div className={clsx('rounded-lg border px-4 py-3 text-xs font-semibold',
      a.tipo === 'ok' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
        : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-[#ff4d58]')}>
      {a.texto}
    </div>
  )
}

/* ================= USUARIOS (individual) ================= */
function FormUsuarios() {
  const [usuario, setUsuario] = useState('')
  const [nombre, setNombre] = useState('')
  const [rol, setRol] = useState('decanting_operario')
  const [activo, setActivo] = useState('1')
  const [password, setPassword] = useState('')
  const [existe, setExiste] = useState(false)
  const [busy, setBusy] = useState(false)
  const [a, setA] = useState<AvisoT>(null)

  const buscar = async () => {
    if (!usuario.trim()) { setA({ tipo: 'error', texto: 'Escribe el usuario a buscar' }); return }
    setBusy(true); setA(null)
    try {
      const r = await api.adminUsuarioBuscar(tok(), usuario.trim().toLowerCase())
      if (r) {
        setNombre(r.nombre); setRol(r.rol); setActivo(String(Number(r.activo))); setExiste(true); setPassword('')
        setA({ tipo: 'ok', texto: 'Usuario encontrado: edita y guarda. Contraseña en blanco = no cambiarla.' })
      } else {
        setExiste(false); setNombre(''); setPassword('')
        setA({ tipo: 'ok', texto: 'El usuario no existe: se creará nuevo al guardar.' })
      }
    } catch (e) { setA({ tipo: 'error', texto: e instanceof Error ? e.message : 'Error al buscar' }) }
    finally { setBusy(false) }
  }

  const guardar = async () => {
    setBusy(true); setA(null)
    try {
      await api.adminUsuarioGuardar(tok(), { usuario: usuario.trim().toLowerCase(), nombre: nombre.trim(), rol, activo: Number(activo), password })
      setA({ tipo: 'ok', texto: existe ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente' })
      setPassword('')
    } catch (e) { setA({ tipo: 'error', texto: e instanceof Error ? e.message : 'Error al guardar' }) }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-4">
      <Aviso a={a} />
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className={label}>Usuario (login)</label>
          <input className={input} value={usuario} onChange={e => setUsuario(e.target.value)} placeholder="ej. jperez" disabled={existe} />
        </div>
        <button onClick={buscar} disabled={busy} className={btnSec}><Search size={15} /> Buscar</button>
      </div>
      <div>
        <label className={label}>Nombre completo</label>
        <input className={input} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre y apellidos" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Rol</label>
          <select className={input} value={rol} onChange={e => setRol(e.target.value)}>
            <option value="decanting_operario">Operario / auxiliar</option>
            <option value="decanting_supervisor">Supervisor</option>
            <option value="sistema_admin">Administrador</option>
          </select>
        </div>
        <div>
          <label className={label}>Estado</label>
          <select className={input} value={activo} onChange={e => setActivo(e.target.value)}>
            <option value="1">Activo</option>
            <option value="0">Inactivo</option>
          </select>
        </div>
      </div>
      <div>
        <label className={label}>{existe ? 'Nueva contraseña (vacío = no cambiar)' : 'Contraseña inicial (mínimo 6)'}</label>
        <input type="password" className={input} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" />
      </div>
      <button onClick={guardar} disabled={busy} className={clsx(btnPrim, 'w-full')}>
        <Save size={15} /> {existe ? 'Actualizar usuario' : 'Crear usuario'}
      </button>
    </div>
  )
}

/* ================= PRODUCTOS (individual + masivo) ================= */
function FormProductos() {
  const [ean, setEan] = useState('')
  const [sku, setSku] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState('')
  const [proveedor, setProveedor] = useState('')
  const [existe, setExiste] = useState(false)
  const [busy, setBusy] = useState(false)
  const [a, setA] = useState<AvisoT>(null)
  const [filas, setFilas] = useState<Record<string, string>[] | null>(null)
  const [errCsv, setErrCsv] = useState<string[]>([])

  const buscar = async () => {
    if (!ean.trim()) { setA({ tipo: 'error', texto: 'Escribe EAN o SKU a buscar' }); return }
    setBusy(true); setA(null)
    try {
      const r = await api.adminProductoBuscar(tok(), ean.trim())
      if (r) {
        setEan(r.ean); setSku(r.sku); setDescripcion(r.descripcion ?? ''); setPrecio(r.precio_unitario != null ? String(r.precio_unitario) : ''); setProveedor(r.proveedor ?? '')
        setExiste(true)
        setA({ tipo: 'ok', texto: 'Producto encontrado: edita y guarda para sobrescribir.' })
      } else {
        setExiste(false); setSku(''); setDescripcion(''); setPrecio(''); setProveedor('')
        setA({ tipo: 'ok', texto: 'Producto no existe: se creará nuevo al guardar.' })
      }
    } catch (e) { setA({ tipo: 'error', texto: e instanceof Error ? e.message : 'Error al buscar' }) }
    finally { setBusy(false) }
  }

  const guardar = async () => {
    setBusy(true); setA(null)
    try {
      await api.adminProductoGuardar(tok(), { ean: ean.trim(), sku: sku.trim(), descripcion: descripcion.trim(), precio_unitario: precio, proveedor: proveedor.trim() })
      setA({ tipo: 'ok', texto: existe ? 'Producto actualizado correctamente' : 'Producto creado correctamente' })
    } catch (e) { setA({ tipo: 'error', texto: e instanceof Error ? e.message : 'Error al guardar' }) }
    finally { setBusy(false) }
  }

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    setA(null); setErrCsv([]); setFilas(null)
    const reader = new FileReader()
    reader.onload = () => {
      const matriz = parseCsv(String(reader.result ?? ''))
      if (matriz.length < 2) { setErrCsv(['El archivo no tiene filas de datos']); return }
      const head = matriz[0].map(h => h.trim().toLowerCase())
      const iEan = head.indexOf('ean'), iSku = head.indexOf('sku'), iDesc = head.indexOf('descripcion'), iPre = head.indexOf('precio_unitario'), iProv = head.indexOf('proveedor')
      if (iEan < 0 || iSku < 0) { setErrCsv(['Faltan columnas obligatorias: ean, sku']); return }
      const out: Record<string, string>[] = []; const errs: string[] = []
      matriz.slice(1).forEach((r, n) => {
        const fean = (r[iEan] ?? '').trim(), fsku = (r[iSku] ?? '').trim()
        if (!fean || !fsku) { errs.push(`Fila ${n + 2}: EAN o SKU vacío`); return }
        out.push({
          ean: fean, sku: fsku,
          descripcion: iDesc >= 0 ? (r[iDesc] ?? '').trim() : '',
          precio_unitario: iPre >= 0 ? (r[iPre] ?? '').trim() : '0',
          proveedor: iProv >= 0 ? (r[iProv] ?? '').trim() : '',
        })
      })
      setErrCsv(errs); setFilas(out)
    }
    reader.readAsText(f, 'utf-8')
    e.target.value = ''
  }

  const cargar = async () => {
    if (!filas?.length) return
    setBusy(true); setA(null)
    try {
      const r = await api.adminProductosMasivo(tok(), filas)
      setA({ tipo: 'ok', texto: `Carga completada: ${r.insertados} nuevos, ${r.actualizados} actualizados.${r.errores.length ? ` Con errores: ${r.errores.slice(0, 3).join(' | ')}` : ''}` })
      setFilas(null)
    } catch (e) { setA({ tipo: 'error', texto: e instanceof Error ? e.message : 'Error en carga masiva' }) }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Individual</h4>
        <Aviso a={a} />
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className={label}>EAN o SKU</label>
            <input className={input} value={ean} onChange={e => setEan(e.target.value)} placeholder="Escanea o escribe el EAN" disabled={existe} />
          </div>
          <button onClick={buscar} disabled={busy} className={btnSec}><Search size={15} /> Buscar</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>SKU</label>
            <input className={input} value={sku} onChange={e => setSku(e.target.value)} />
          </div>
          <div>
            <label className={label}>Precio unitario</label>
            <input className={input} value={precio} onChange={e => setPrecio(e.target.value)} placeholder="0.00" />
          </div>
        </div>
        <div>
          <label className={label}>Descripción</label>
          <input className={input} value={descripcion} onChange={e => setDescripcion(e.target.value)} />
        </div>
        <div>
          <label className={label}>Proveedor</label>
          <input className={input} value={proveedor} onChange={e => setProveedor(e.target.value)} />
        </div>
        <button onClick={guardar} disabled={busy} className={clsx(btnPrim, 'w-full')}>
          <Save size={15} /> {existe ? 'Sobrescribir producto' : 'Crear producto'}
        </button>
      </div>

      <div className="space-y-3 border-t border-line pt-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Carga masiva (CSV)</h4>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => descargarPlantilla('plantilla_productos.csv', ['ean', 'sku', 'descripcion', 'precio_unitario', 'proveedor'], ['8806718031938', '100001', 'SPARKLING WATER', '13.48', 'AJE'])} className={btnSec}>
            <Download size={15} /> Plantilla
          </button>
          <label className={btnSec}>
            <Upload size={15} /> Seleccionar CSV
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
          </label>
        </div>
        {errCsv.length > 0 && (
          <div className="rounded-lg border border-warn/30 bg-warn/10 px-4 py-3 text-xs font-semibold text-warn">
            {errCsv.slice(0, 5).join(' · ')}{errCsv.length > 5 ? ` · +${errCsv.length - 5} más` : ''}
          </div>
        )}
        {filas && filas.length > 0 && (
          <div className="space-y-2 rounded-lg border border-line bg-surface2/50 px-4 py-3">
            <p className="text-xs font-bold tabular-nums">{filas.length} filas listas para cargar</p>
            <button onClick={cargar} disabled={busy} className={clsx(btnPrim, 'w-full')}>
              <Upload size={15} /> Confirmar carga masiva
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ================= AUXILIARES (individual + masivo) ================= */
function FormAuxiliares() {
  const [id, setId] = useState<number | null>(null)
  const [nombre, setNombre] = useState('')
  const [area, setArea] = useState('Decanting')
  const [busy, setBusy] = useState(false)
  const [a, setA] = useState<AvisoT>(null)
  const [filas, setFilas] = useState<Record<string, string>[] | null>(null)
  const [errCsv, setErrCsv] = useState<string[]>([])

  const buscar = async () => {
    if (!nombre.trim()) { setA({ tipo: 'error', texto: 'Escribe el nombre a buscar' }); return }
    setBusy(true); setA(null)
    try {
      const r = await api.adminAuxiliarBuscar(tok(), nombre.trim(), area)
      if (r) { setId(r.id); setNombre(r.nombre); setArea(r.area); setA({ tipo: 'ok', texto: 'Auxiliar encontrado: edita y guarda.' }) }
      else { setId(null); setA({ tipo: 'ok', texto: 'No existe en esa área: se creará al guardar.' }) }
    } catch (e) { setA({ tipo: 'error', texto: e instanceof Error ? e.message : 'Error al buscar' }) }
    finally { setBusy(false) }
  }

  const guardar = async () => {
    setBusy(true); setA(null)
    try {
      await api.adminAuxiliarGuardar(tok(), { id, nombre: nombre.trim(), area })
      setA({ tipo: 'ok', texto: id ? 'Auxiliar actualizado correctamente' : 'Auxiliar creado correctamente' })
    } catch (e) { setA({ tipo: 'error', texto: e instanceof Error ? e.message : 'Error al guardar' }) }
    finally { setBusy(false) }
  }

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    setA(null); setErrCsv([]); setFilas(null)
    const reader = new FileReader()
    reader.onload = () => {
      const matriz = parseCsv(String(reader.result ?? ''))
      if (matriz.length < 2) { setErrCsv(['El archivo no tiene filas de datos']); return }
      const head = matriz[0].map(h => h.trim().toLowerCase())
      const iNom = head.indexOf('nombre'), iArea = head.indexOf('area')
      if (iNom < 0 || iArea < 0) { setErrCsv(['Faltan columnas obligatorias: nombre, area']); return }
      const out: Record<string, string>[] = []; const errs: string[] = []
      matriz.slice(1).forEach((r, n) => {
        const fn = (r[iNom] ?? '').trim(), fa = (r[iArea] ?? '').trim()
        if (!fn || !fa) { errs.push(`Fila ${n + 2}: nombre o área vacío`); return }
        out.push({ nombre: fn, area: fa })
      })
      setErrCsv(errs); setFilas(out)
    }
    reader.readAsText(f, 'utf-8')
    e.target.value = ''
  }

  const cargar = async () => {
    if (!filas?.length) return
    setBusy(true); setA(null)
    try {
      const r = await api.adminAuxiliaresMasivo(tok(), filas)
      setA({ tipo: 'ok', texto: `Carga completada: ${r.insertados} nuevos, ${r.omitidos} ya existían.${r.errores.length ? ` Con errores: ${r.errores.slice(0, 3).join(' | ')}` : ''}` })
      setFilas(null)
    } catch (e) { setA({ tipo: 'error', texto: e instanceof Error ? e.message : 'Error en carga masiva' }) }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Individual</h4>
        <Aviso a={a} />
        <div>
          <label className={label}>Nombre completo</label>
          <input className={input} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre y apellidos" />
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className={label}>Área</label>
            <select className={input} value={area} onChange={e => setArea(e.target.value)}>
              <option>Decanting</option><option>Reabasto</option>
            </select>
          </div>
          <button onClick={buscar} disabled={busy} className={btnSec}><Search size={15} /> Buscar</button>
        </div>
        <button onClick={guardar} disabled={busy} className={clsx(btnPrim, 'w-full')}>
          <Save size={15} /> {id ? 'Actualizar auxiliar' : 'Crear auxiliar'}
        </button>
      </div>

      <div className="space-y-3 border-t border-line pt-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Carga masiva (CSV)</h4>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => descargarPlantilla('plantilla_auxiliares.csv', ['nombre', 'area'], ['Lister Huaman Vasquez', 'Decanting'])} className={btnSec}>
            <Download size={15} /> Plantilla
          </button>
          <label className={btnSec}>
            <Upload size={15} /> Seleccionar CSV
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
          </label>
        </div>
        {errCsv.length > 0 && (
          <div className="rounded-lg border border-warn/30 bg-warn/10 px-4 py-3 text-xs font-semibold text-warn">
            {errCsv.slice(0, 5).join(' · ')}{errCsv.length > 5 ? ` · +${errCsv.length - 5} más` : ''}
          </div>
        )}
        {filas && filas.length > 0 && (
          <div className="space-y-2 rounded-lg border border-line bg-surface2/50 px-4 py-3">
            <p className="text-xs font-bold tabular-nums">{filas.length} filas listas para cargar</p>
            <button onClick={cargar} disabled={busy} className={clsx(btnPrim, 'w-full')}>
              <Upload size={15} /> Confirmar carga masiva
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ================= PANEL (drawer) ================= */
export default function AdminPanel({ tab, onClose }: { tab: Tab; onClose: () => void }) {
  const [t, setT] = useState<Tab>(tab)
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full w-full flex-col overflow-y-auto border-l border-line bg-surface shadow-card sm:max-w-2xl">
        <div className="sticky top-0 z-10 border-b border-line bg-surface/90 backdrop-blur">
          <div className="flex items-center gap-3 px-6 py-4">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wide">Administración</p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Solo administradores</p>
            </div>
            <button onClick={onClose} className="ml-auto grid h-9 w-9 place-items-center rounded-lg border border-line text-muted hover:text-ink">
              <X size={17} />
            </button>
          </div>
          <div className="flex gap-1 px-6 pb-2">
            {TABS.map(x => (
              <button key={x.k} onClick={() => setT(x.k)}
                className={clsx('flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors',
                  t === x.k ? 'bg-adecco text-white shadow-card' : 'text-muted hover:bg-surface2 hover:text-ink')}>
                <x.icon size={14} /> {x.label}
              </button>
            ))}
          </div>
        </div>
        <div className="p-6">
          {t === 'usuarios' && <FormUsuarios />}
          {t === 'productos' && <FormProductos />}
          {t === 'auxiliares' && <FormAuxiliares />}
        </div>
      </div>
    </div>
  )
}