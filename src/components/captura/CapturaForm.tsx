import { useEffect, useState, type ChangeEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ScanBarcode, Save } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { api, apiActiva } from '../../services/api'
import { fmtMoney } from '../../data/mock'
import Escaner from './Escaner'

const input = 'h-11 w-full rounded-lg border border-line bg-surface2 px-3 text-sm outline-none transition focus:border-adecco focus:ring-2 focus:ring-adecco/20'
const label = 'mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted'

interface Cfg {
  titulo: string
  areas: string[]
  tiposPorArea: Record<string, string[]>
  campoId: 'lpn' | 'cubeta'
  labelId: string
  usaEstacion: boolean
  usaCodigo: boolean
}

const CFG: Record<string, Cfg> = {
  AMR: {
    titulo: 'Incidencia AMR',
    areas: ['Decanting', 'Reabasto'],
    tiposPorArea: {
      Decanting: ['Faltante', 'Sobrante', 'Cruce SKU', 'Faltante de origen', 'Merma'],
      Reabasto: ['Faltante', 'Sobrante', 'Cruce SKU', 'Merma', 'Conforme'],
    },
    campoId: 'lpn', labelId: 'LPN', usaEstacion: true, usaCodigo: true,
  },
  AUD: {
    titulo: 'Auditoría Reaba',
    areas: ['Reabasto'],
    tiposPorArea: { Reabasto: ['Faltante', 'Sobrante', 'Cruce SKU', 'Merma', 'Conforme'] },
    campoId: 'lpn', labelId: 'LPN', usaEstacion: false, usaCodigo: true,
  },
  API: {
    titulo: 'Incidencia Apilador',
    areas: ['Apilador'],
    tiposPorArea: { Apilador: ['Faltante', 'Sobrante', 'Merma', 'Con stock en IP6'] },
    campoId: 'cubeta', labelId: 'Cubeta', usaEstacion: false, usaCodigo: true,
  },
  AFR: {
    titulo: 'Incidencia AFRAME',
    areas: ['Aframe'],
    tiposPorArea: { Aframe: ['Faltante', 'Sobrante', 'Merma', 'Con stock en IP6'] },
    campoId: 'cubeta', labelId: 'Cubeta', usaEstacion: false, usaCodigo: true,
  },
}

const VACIO = {
  area: '', tipo: '', lpn: '', cubeta: '', estacion: '',
  codigo: '', lote: '', cantidad: '', um: 'Caja', observacion: '',
}

export default function CapturaForm({ modulo }: { modulo: string }) {
  const cfg = CFG[modulo]
  const nav = useNavigate()
  const [params] = useSearchParams()
  const editId = params.get('edit')
  const { user } = useAuth()
  const { rows, recargar } = useData()
  const [f, setF] = useState({ ...VACIO, area: cfg.areas[0] })
  const [desc, setDesc] = useState('')
  const [precio, setPrecio] = useState<number | null>(null)
  const [scan, setScan] = useState<null | 'id' | 'codigo'>(null)
  const [msg, setMsg] = useState<null | { tipo: 'ok' | 'error'; texto: string }>(null)
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState<string | null>(null)

  /* Modo corrección: precarga la captura propia */
  useEffect(() => {
    if (!editId) return
    const r = rows.find(x => x.id === editId)
    if (!r) return
    setF({
      area: r.area || cfg.areas[0], tipo: r.tipo || '',
      lpn: r.lpn || '', cubeta: r.cubeta || '', estacion: r.estacion || '',
      codigo: r.codigo || '', lote: r.lote || '', cantidad: String(r.cantidad || ''),
      um: r.um || 'Caja', observacion: r.observacion || '',
    })
  }, [editId, rows, cfg])

  const set = (k: keyof typeof VACIO) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setF(p => ({ ...p, [k]: e.target.value }))

  const tipos = cfg.tiposPorArea[f.area] ?? []

  /* Autocompletado desde el catálogo de productos */
  const buscarSku = async (cod: string) => {
    if (!apiActiva() || !cod.trim()) { setDesc(''); setPrecio(null); return }
    try {
      const sku = await api.buscarSku(localStorage.getItem('ims_token') ?? user?.usuario ?? '', cod.trim())
      setDesc(sku?.d ?? ''); setPrecio(sku?.p ?? null)
    } catch { setDesc(''); setPrecio(null) }
  }

  const cant = parseFloat(String(f.cantidad).replace(',', '.')) || 0
  const valorizado = precio != null ? Math.round(precio * cant * 100) / 100 : null

  const enviar = async () => {
    setMsg(null)
    if (!f.tipo) { setMsg({ tipo: 'error', texto: 'Selecciona el tipo de incidencia' }); return }
    if (!f[cfg.campoId].trim()) { setMsg({ tipo: 'error', texto: `Escanea o escribe el ${cfg.labelId}` }); return }
    if (cant <= 0) { setMsg({ tipo: 'error', texto: 'La cantidad debe ser mayor a 0' }); return }
    if (cfg.usaCodigo && f.tipo !== 'Conforme' && !f.codigo.trim()) { setMsg({ tipo: 'error', texto: 'Escanea o escribe el SKU' }); return }
    setGuardando(true)
    const datos = {
      area: f.area, tipo: f.tipo, lpn: f.lpn, cubeta: f.cubeta, estacion: f.estacion,
      codigo: f.codigo, lote: f.lote, cantidad: cant, um: f.um, observacion: f.observacion,
    }
    try {
      const tok = localStorage.getItem('ims_token') ?? user?.usuario ?? ''
      if (editId) {
        await api.corregir(tok, modulo, editId, datos)
        setExito(editId)
      } else {
        const r = await api.registrar(tok, modulo, datos)
        setExito(r.id)
      }
      await recargar()
    } catch (e) {
      setMsg({ tipo: 'error', texto: e instanceof Error ? e.message : 'Error al guardar' })
    } finally {
      setGuardando(false)
    }
  }

  /* ===== Pantalla de éxito ===== */
  if (exito) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-ok/30 bg-ok/10 p-6 text-center">
          <p className="text-sm font-bold text-ok">{editId ? 'Corrección guardada' : 'Captura registrada'}</p>
          <p className="mt-1 font-mono text-xs font-bold">{exito}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { setExito(null); setF({ ...VACIO, area: cfg.areas[0] }); setDesc(''); setPrecio(null); setMsg(null) }}
            className="h-11 rounded-lg bg-adecco text-sm font-bold text-white transition hover:bg-adecco-hover"
          >
            Capturar otra
          </button>
          <button onClick={() => nav('/captura/mis')} className="h-11 rounded-lg border border-line text-sm font-bold text-muted">
            Mis capturas
          </button>
        </div>
      </div>
    )
  }

  /* ===== Formulario ===== */
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => nav(-1)} className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted">
          <ChevronLeft size={16} />
        </button>
        <h2 className="text-lg font-extrabold tracking-tight">{cfg.titulo}</h2>
        {editId && (
          <span className="rounded-full border border-warn/30 bg-warn/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warn">
            Corrección
          </span>
        )}
      </div>

      <div className="space-y-3 rounded-xl border border-line bg-surface p-4 shadow-card">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Área</label>
            <select className={input} value={f.area} onChange={set('area')} disabled={!!editId}>
              {cfg.areas.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Tipo</label>
            <select className={input} value={f.tipo} onChange={set('tipo')}>
              <option value="">Selecciona…</option>
              {tipos.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={label}>{cfg.labelId}</label>
          <div className="flex gap-2">
            <input className={input} value={f[cfg.campoId]} onChange={set(cfg.campoId)} placeholder={`Escribe o escanea ${cfg.labelId}`} />
            <button type="button" onClick={() => setScan('id')} title={`Escanear ${cfg.labelId}`}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-adecco text-white transition hover:bg-adecco-hover">
              <ScanBarcode size={20} />
            </button>
          </div>
        </div>

        {cfg.usaEstacion && (
          <div>
            <label className={label}>Estación</label>
            <input className={input} value={f.estacion} onChange={set('estacion')} placeholder="Ej. D12 / R12" />
          </div>
        )}

        {cfg.usaCodigo && (
          <div>
            <label className={label}>SKU / EAN</label>
            <div className="flex gap-2">
              <input className={input} value={f.codigo} onChange={set('codigo')} onBlur={e => void buscarSku(e.target.value)} placeholder="Escanea el código" />
              <button type="button" onClick={() => setScan('codigo')} title="Escanear SKU"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-adecco text-white transition hover:bg-adecco-hover">
                <ScanBarcode size={20} />
              </button>
            </div>
            {desc && <p className="mt-1 truncate text-[11px] font-semibold text-muted">{desc}</p>}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={label}>Lote</label>
            <input className={input} value={f.lote} onChange={set('lote')} />
          </div>
          <div>
            <label className={label}>Cantidad</label>
            <input className={input} inputMode="numeric" value={f.cantidad} onChange={set('cantidad')} />
          </div>
          <div>
            <label className={label}>UM</label>
            <select className={input} value={f.um} onChange={set('um')}>
              <option>Caja</option>
              <option>Unidad</option>
            </select>
          </div>
        </div>

        {valorizado != null && valorizado > 0 && (
          <p className="rounded-lg border border-line bg-surface2 px-3 py-2 font-mono text-xs font-bold tabular-nums">
            Valorizado estimado: {fmtMoney(valorizado)}
          </p>
        )}

        <div>
          <label className={label}>Observación</label>
          <textarea className={`${input} h-20 py-2`} value={f.observacion} onChange={set('observacion')} />
        </div>

        {msg && (
          <p className={clsx(
            'rounded-lg border px-3 py-2 text-xs font-semibold',
            msg.tipo === 'ok' ? 'border-ok/30 bg-ok/10 text-ok' : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-[#ff4d58]',
          )}>
            {msg.texto}
          </p>
        )}

        <button
          onClick={() => void enviar()}
          disabled={guardando || !apiActiva()}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-adecco text-sm font-bold uppercase tracking-widest text-white transition hover:bg-adecco-hover disabled:opacity-50"
        >
          <Save size={16} /> {guardando ? 'Guardando…' : editId ? 'Guardar corrección' : 'Registrar captura'}
        </button>
        {!apiActiva() && (
          <p className="text-center text-[11px] font-semibold text-warn">La captura requiere conexión a Apps Script.</p>
        )}
      </div>

      {scan && (
        <Escaner
          onDetect={txt => {
            if (scan === 'id') setF(p => ({ ...p, [cfg.campoId]: txt }))
            else { setF(p => ({ ...p, codigo: txt })); void buscarSku(txt) }
            setScan(null)
          }}
          onClose={() => setScan(null)}
        />
      )}
    </div>
  )
}