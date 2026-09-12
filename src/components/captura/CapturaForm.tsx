import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ScanBarcode, Save, Info } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { api, apiActiva } from '../../services/api'
import { fmtMoney } from '../../data/mock'
import Escaner from './Escaner'
import { IconoModulo } from './IconosModulo'

const input = 'h-11 w-full rounded-lg border border-line bg-surface2 px-3 text-sm outline-none transition focus:border-adecco focus:ring-2 focus:ring-adecco/20'
const label = 'mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted'

const ESTACIONES = Array.from({ length: 22 }, (_, i) => `D${String(i + 1).padStart(2, '0')}`)
const MODULOS_POR_ROL: Record<string, string[]> = {
  decanting: ['AMR', 'API', 'AUX'], reabasto: ['AUD'], inventarios: ['API'], aframe: ['AFR'],
  sistema: ['AMR', 'AUD', 'API', 'AFR', 'AUX'],
}

interface Cfg {
  key: 'amr' | 'aud' | 'api' | 'afr' | 'aux'
  titulo: string
  area: string
  tipos: string[]
  campoId: 'lpn' | 'cubeta'
  labelId: string
  usaEstacion: boolean
  usaAuxiliar: boolean
  usaCodigo: boolean
  tipoSoloLpn?: string
  tiposCierreAuto: string[]
  codigoOpcionalTipo?: string
  conDescripcion: boolean
  usaLote: boolean
  tiposRemotos?: boolean  
}

const CFG: Record<string, Cfg> = {
  AMR: {
    key: 'amr', titulo: 'Incidencias AMR', area: 'Decanting',
    tipos: ['Faltante', 'Sobrante', 'Cruce SKU', 'Faltante de origen', 'Merma'],
    campoId: 'lpn', labelId: 'LPN', usaEstacion: true, usaAuxiliar: true, usaCodigo: true,
    tiposCierreAuto: ['Faltante de origen'], conDescripcion: true,
    usaLote: true,  
  },
  AUD: {
    key: 'aud', titulo: 'Auditorías Reaba', area: 'Reabasto',
    tipos: ['Faltante', 'Sobrante', 'Cruce SKU', 'Merma', 'Conforme'],
    campoId: 'lpn', labelId: 'LPN', usaEstacion: false, usaAuxiliar: true, usaCodigo: true,
    tipoSoloLpn: 'Conforme', tiposCierreAuto: ['Conforme'], conDescripcion: true,
    usaLote: true,
  },
  API: {
    key: 'api', titulo: 'Incidencias de Apilador', area: 'Apilador',
    tipos: ['Faltante', 'Sobrante', 'Merma', 'Con stock en IP6'],
    campoId: 'cubeta', labelId: 'N° Cubeta', usaEstacion: false, usaAuxiliar: false, usaCodigo: true,
    codigoOpcionalTipo: 'Con stock en IP6', tiposCierreAuto: [], conDescripcion: false,
    usaLote: false,
  },
  AFR: {
    key: 'afr', titulo: 'Incidencias de AFRAME', area: 'Aframe',
    tipos: ['Faltante', 'Sobrante', 'Merma', 'Con stock en IP6'],
    campoId: 'cubeta', labelId: 'N° Cubeta', usaEstacion: false, usaAuxiliar: false, usaCodigo: true,
    codigoOpcionalTipo: 'Con stock en IP6', tiposCierreAuto: [], conDescripcion: false,
    usaLote: false,
  },

  AUX: {
    key: 'aux', titulo: 'Incidencias de personal', area: 'Decanting',
    tipos: [], tiposRemotos: true,
    campoId: 'lpn', labelId: 'LPN', usaEstacion: false, usaAuxiliar: true, usaCodigo: true,
    usaLote: false, tiposCierreAuto: [], conDescripcion: true,
  },

}

const VACIO = {
  tipo: '', auxiliar: '', estacion: '', lpn: '', cubeta: '',
  codigo: '', lote: '', cantidad: '', observacion: '',
}

/* GS1/QR: inicia con AI (02)/02 o trae separadores FNC1 o paréntesis de AI */
function esGS1(txt: string) {
  const t = txt.replace(/\x1D/g, '')
  return t.startsWith('(02)') || t.startsWith('02') || t.includes('\x1D') || /\(\d{2}\)/.test(t)
}

/* ===== Parseo de QR GS1: (02)SKU (10)LOTE (37)CANT ===== */
function parsearQR(txt: string) {
  const t = txt.replace(/\x1D/g, '')
  const ai = (code: string) => {
    const m = t.match(new RegExp(`\\(?${code}\\)?([^()\\x1D]+)`))
    return m ? m[1].trim() : ''
  }
  const sku = ai('02')
  return { sku, lote: ai('10'), cant: ai('37') }
}

/* ===== Cubeta: 10-003649 o 10003649 → 3649 ===== */
function parsearCubeta(txt: string) {
  const t = txt.trim()
  if (t.includes('-')) return String(parseInt(t.split('-')[1], 10) || t)
  const d = t.replace(/\D/g, '')
  if (d.length === 8) return String(parseInt(d.slice(2), 10))
  if (d.length === 6) return String(parseInt(d, 10))
  return t
}

export default function CapturaForm({ modulo }: { modulo: string }) {
  const cfg = CFG[modulo]
  const nav = useNavigate()
  const [params] = useSearchParams()
  const editId = params.get('edit')
  const { user } = useAuth()
  const { rows, recargar } = useData()
  const [f, setF] = useState({ ...VACIO })
  const [desc, setDesc] = useState('')
  const [precio, setPrecio] = useState<number | null>(null)
  const [auxiliares, setAuxiliares] = useState<string[]>([])
  const [showAux, setShowAux] = useState(false)
  const [scan, setScan] = useState<null | 'id' | 'codigo'>(null)
  const [msg, setMsg] = useState<null | { tipo: 'ok' | 'error'; texto: string }>(null)
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState<string | null>(null)
  const [tiposRem, setTiposRem] = useState<string[]>([])
  useEffect(() => {
    if (!cfg.tiposRemotos || !apiActiva()) return
    api.tiposAux(localStorage.getItem('ims_token') ?? user?.usuario ?? '')
      .then(setTiposRem).catch(() => setTiposRem([]))
  }, [cfg, user])


  const esSoloLpn = !!cfg.tipoSoloLpn && f.tipo === cfg.tipoSoloLpn
  const cierreAuto = cfg.tiposCierreAuto.includes(f.tipo)
  const muestraCodigo = cfg.usaCodigo && !esSoloLpn
  const codigoOpcional = cfg.codigoOpcionalTipo === f.tipo
  const tipos = cfg.tiposRemotos ? tiposRem : cfg.tipos

  /* Autocomplete de auxiliares del área del módulo */
  useEffect(() => {
    if (!cfg.usaAuxiliar || !apiActiva()) return
    api.buscarAuxiliares(localStorage.getItem('ims_token') ?? user?.usuario ?? '', cfg.area)
      .then(list => {
        setAuxiliares(list)
        setF(p => ({ ...p, auxiliar: list.includes(user?.nombre ?? '') ? (user?.nombre ?? '') : p.auxiliar }))
      })
      .catch(() => setAuxiliares([]))
  }, [cfg, user])

  /* Modo corrección */
  useEffect(() => {
    if (!editId) return
    const r = rows.find(x => x.id === editId)
    if (!r) return
    setF({
      tipo: r.tipo || '', auxiliar: r.reportado || '', estacion: r.estacion || '',
      lpn: r.lpn || '', cubeta: r.cubeta || '', codigo: r.codigo || '',
      lote: r.lote || '', cantidad: String(r.cantidad || ''), observacion: r.observacion || '',
    })
  }, [editId, rows])

  const set = (k: keyof typeof VACIO) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setF(p => ({ ...p, [k]: e.target.value }))

  const buscarSku = async (cod: string) => {
    if (!apiActiva() || !cod.trim() || !cfg.conDescripcion) { setDesc(''); setPrecio(null); return }
    try {
      const sku = await api.buscarSku(localStorage.getItem('ims_token') ?? user?.usuario ?? '', cod.trim())
      setDesc(sku?.d ?? 'SKU no encontrado en catálogo'); setPrecio(sku?.p ?? null)
    } catch { setDesc(''); setPrecio(null) }
  }

  const cant = parseFloat(String(f.cantidad).replace(',', '.')) || 0
  const valorizado = precio != null ? Math.round(precio * cant * 100) / 100 : null
  const sugeridos = useMemo(() => {
    const t = f.auxiliar.trim().toLowerCase()
    if (!t) return auxiliares.slice(0, 10)
    return auxiliares.filter(n => n.toLowerCase().includes(t)).slice(0, 10)
  }, [f.auxiliar, auxiliares])

  const enviar = async () => {
    setMsg(null)
    if (!f.tipo) { setMsg({ tipo: 'error', texto: 'Selecciona el tipo de incidencia' }); return }
    let auxiliarFinal = ''
    if (cfg.usaAuxiliar && !esSoloLpn) {
      if (auxiliares.length === 0) { setMsg({ tipo: 'error', texto: 'No se pudo cargar el personal del área; verifica tu conexión' }); return }
      const match = auxiliares.find(n => n.trim().toLowerCase() === f.auxiliar.trim().toLowerCase())
      if (!match) { setMsg({ tipo: 'error', texto: 'Selecciona un auxiliar válido' }); return }
      auxiliarFinal = match
    }
    if (cfg.usaEstacion && !esSoloLpn && !f.estacion) { setMsg({ tipo: 'error', texto: 'Selecciona la estación' }); return }
    if (!f[cfg.campoId].trim()) { setMsg({ tipo: 'error', texto: `Escanea o escribe el ${cfg.labelId}` }); return }
    if (!esSoloLpn) {
      if (muestraCodigo && !codigoOpcional && !f.codigo.trim()) { setMsg({ tipo: 'error', texto: 'Escanea el código del artículo' }); return }
      if (cfg.usaLote && !f.lote.trim()) { setMsg({ tipo: 'error', texto: 'El lote es obligatorio (auto con QR o manual con código de barras)' }); return }
      if (cant <= 0) { setMsg({ tipo: 'error', texto: 'La cantidad debe ser mayor a 0 (en unidades)' }); return }
    }
    setGuardando(true)
    const datos = {
      area: cfg.area, tipo: f.tipo, reportado: auxiliarFinal || f.auxiliar, estacion: f.estacion,
      lpn: f.lpn, cubeta: f.cubeta, codigo: f.codigo, lote: f.lote,
      cantidad: esSoloLpn ? 0 : cant, um: 'Unidad', observacion: f.observacion,
    }
    try {
      const tok = localStorage.getItem('ims_token') ?? user?.usuario ?? ''
      if (modulo === 'AUX') {
        const r = await api.registrarAux(tok, {
          auxiliar: auxiliarFinal || f.auxiliar, lpn: f.lpn, tipo: f.tipo,
          articulo: f.codigo, cantidad: cant, observacion: f.observacion,
        })
        setExito(r.id)
      } else if (editId) {
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

  /* Guardia por área: solo el módulo del rol del usuario */
  const permitidos = MODULOS_POR_ROL[(user?.rol ?? '').split('_')[0]]
  if (permitidos && !permitidos.includes(modulo)) {
    return (
      <div className="mx-auto w-full max-w-xl space-y-3">
        <button onClick={() => nav('/captura')} className="flex items-center gap-1 text-xs font-bold text-muted hover:text-ink">
          <ChevronLeft size={14} /> Volver
        </button>
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="text-sm font-bold text-red-600 dark:text-[#ff4d58]">Módulo no habilitado para tu área</p>
          <p className="mt-1 text-xs text-muted">Solo puedes capturar en los módulos de tu área asignada.</p>
        </div>
      </div>
    )
  }


  if (exito) {
    return (
      <div className="mx-auto w-full max-w-xl space-y-3">
        <div className="rounded-xl border border-ok/30 bg-ok/10 p-6 text-center">
          <p className="text-sm font-bold text-ok">{editId ? 'Corrección guardada' : cierreAuto ? 'Captura registrada y cerrada automáticamente' : 'Captura registrada'}</p>
          <p className="mt-1 font-mono text-xs font-bold">{exito}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { setExito(null); setF({ ...VACIO }); setDesc(''); setPrecio(null); setMsg(null) }}
            className="h-11 rounded-lg bg-adecco text-sm font-bold text-white transition hover:bg-adecco-hover"
          >
            Capturar otra
          </button>
          <button onClick={() => nav('/captura/mis')} className="h-11 rounded-lg border border-line text-sm font-bold text-muted">
            Mis capturas
          </button>
          <button
            onClick={() => nav('/captura')}
            className="col-span-2 h-11 rounded-lg border border-line bg-surface2 text-sm font-bold text-ink transition hover:opacity-80"
          >
            Terminar y volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      {/* Encabezado con ícono del módulo */}
      <div className="flex items-center gap-3">
        <button onClick={() => nav(-1)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-muted">
          <ChevronLeft size={16} />
        </button>
        <IconoModulo k={cfg.key} className="h-11 w-11 shrink-0" />
        <div className="min-w-0">
          <h2 className="truncate text-lg font-extrabold leading-tight tracking-tight">{cfg.titulo}</h2>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Área {cfg.area} · Llenar todos los campos requeridos</p>
        </div>
        {editId && (
          <span className="ml-auto shrink-0 rounded-full border border-warn/30 bg-warn/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warn">
            Corrección
          </span>
        )}
      </div>

      <div className="space-y-3 rounded-xl border border-line bg-surface p-4 shadow-card">
        {/* Tipo */}
        <div>
          <label className={label}>Tipo de incidencia *</label>
          <select className={input} value={f.tipo} onChange={set('tipo')} disabled={!!editId}>
            <option value="">Selecciona…</option>
            {tipos.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        {cierreAuto && (
          <p className="flex items-start gap-2 rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-[11px] font-semibold text-info">
            <Info size={14} className="mt-0.5 shrink-0" />
            Este tipo de incidencia se cierra automáticamente al registrarse: no requiere seguimiento.
          </p>
        )}

        {!esSoloLpn && cfg.usaAuxiliar && (
          <div className="relative">
            <label className={label}>Auxiliar que reporta *</label>
            <input
              className={input}
              value={f.auxiliar}
              onChange={set('auxiliar')}
              onFocus={() => setShowAux(true)}
              onBlur={() => setTimeout(() => setShowAux(false), 150)}
              placeholder="Escribe o selecciona el nombre"
            />
            {showAux && sugeridos.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-line bg-surface shadow-card">
                {sugeridos.map(n => (
                  <li key={n}>
                    <button
                      type="button"
                      onMouseDown={() => setF(p => ({ ...p, auxiliar: n }))}
                      className="w-full px-3 py-2 text-left text-xs font-semibold hover:bg-surface2"
                    >
                      {n}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {!esSoloLpn && cfg.usaEstacion && (
          <div>
            <label className={label}>Estación *</label>
            <select className={input} value={f.estacion} onChange={set('estacion')}>
              <option value="">Selecciona…</option>
              {ESTACIONES.map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
        )}

        {/* LPN / Cubeta */}
        <div>
          <label className={label}>{cfg.labelId} *</label>
          <div className="flex gap-2">
            <input className={input} value={f[cfg.campoId]} onChange={set(cfg.campoId)} placeholder={`Escanea o escribe ${cfg.labelId}`} />
            <button
              type="button"
              onClick={() => setScan('id')}
              title={`Escanear ${cfg.labelId}`}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-adecco text-white transition hover:bg-adecco-hover"
            >
              <ScanBarcode size={20} />
            </button>
          </div>
        </div>

        {/* SKU / Artículo */}
        {muestraCodigo && (
          <div>
            <label className={label}>
              {cfg.conDescripcion ? 'QR o EAN *' : `Artículo${codigoOpcional ? ' (opcional)' : ' *'}`}
            </label>
            <div className="flex gap-2">
              <input className={input} value={f.codigo} onChange={set('codigo')} onBlur={e => void buscarSku(e.target.value)} placeholder="Escanea QR o código de barras" />
              <button
                type="button"
                onClick={() => setScan('codigo')}
                title="Escanear código"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-adecco text-white transition hover:bg-adecco-hover"
              >
                <ScanBarcode size={20} />
              </button>
            </div>
            {cfg.conDescripcion && desc && (
              <p className="mt-1 truncate text-[11px] font-semibold text-muted">{desc}</p>
            )}
          </div>
        )}

        {!esSoloLpn && cfg.usaLote && (
          <div>
            <label className={label}>Lote *</label>
            <input className={input} value={f.lote} onChange={set('lote')} placeholder="Auto con QR · manual con código de barras" />
          </div>
        )}

        {!esSoloLpn && (
          <div>
            <label className={label}>Cantidad total en unidades *</label>
            <input className={input} inputMode="numeric" value={f.cantidad} onChange={set('cantidad')} placeholder="0" />
          </div>
        )}

        {!esSoloLpn && cfg.conDescripcion && valorizado != null && valorizado > 0 && (
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
          <Save size={16} /> {guardando ? 'Guardando…' : editId ? 'Guardar corrección' : 'Guardar'}
        </button>
        {!apiActiva() && (
          <p className="text-center text-[11px] font-semibold text-warn">La captura requiere conexión a Apps Script.</p>
        )}
      </div>

      {scan && (
        <Escaner
          onDetect={txt => {
            if (scan === 'id') {
              const v = cfg.campoId === 'cubeta' ? parsearCubeta(txt) : txt
              setF(p => ({ ...p, [cfg.campoId]: v }))
            } else if (esGS1(txt)) {
              /* QR GS1: SKU + lote + cantidad autocompletados (cantidad editable) */
              const qr = parsearQR(txt)
              setF(p => ({
                ...p,
                codigo: qr.sku || txt,
                lote: qr.lote || p.lote,
                cantidad: qr.cant || p.cantidad,
              }))
              void buscarSku(qr.sku || txt)
            } else {
              /* Código de barras: TODO el dato se compara con la hoja productos */
              setF(p => ({ ...p, codigo: txt }))
              void buscarSku(txt)
            }
            setScan(null)
          }}
          onClose={() => setScan(null)}
        />
      )}
    </div>
  )
}