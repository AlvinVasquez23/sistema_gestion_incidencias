/* src/context/DataContext.tsx — Estado global de incidencias (Worker Cloudflare + Turso) */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { api, apiActiva } from '../services/api'
import { INCIDENCIAS, type Incidencia } from '../data/mock'
import { useAuth } from './AuthContext'

export interface RevisionPayload {
  turno_picking?: string
  usuario_picking?: string
  ubicacion_picking?: string
  fecha_modific_wms?: string
  ubicacion_hallazgo?: string
  obs_revision?: string
  /** Legacy de la UI: en Turso el nombre WMS se deriva por JOIN; el worker lo ignora */
  nombre_picking?: string
}

interface DataCtx {
  rows: Incidencia[]
  cargando: boolean
  error: string | null
  ultimaActualizacion: Date | null
  fuente: 'worker' | 'mock'
  usarMockManual: () => void
  recargar: () => Promise<void>
  refrescarModulo: (modulo: string) => Promise<void>
  guardarRevision: (id: string, payload: RevisionPayload) => Promise<void>
  cerrarIncidencia: (id: string, causa: string) => Promise<void>
  cerrar: (id: string, causa: string) => Promise<void>
  corregir: (modulo: string, id: string, datos: Record<string, unknown>) => Promise<void>
  registrar: (modulo: string, datos: Record<string, unknown>) => Promise<string>
  registrarAux: (datos: Record<string, unknown>) => Promise<string>
}

const Ctx = createContext<DataCtx>(null!)

const MODULO_DE_ID = (id: string): string => {
  const s = String(id || '')
  if (s.startsWith('AUD')) return 'AUD'
  if (s.startsWith('API')) return 'API'
  if (s.startsWith('AFR')) return 'AFR'
  if (s.startsWith('AUX')) return 'AUX'
  return 'AMR'
}

/* Hora de Perú (UTC-5) para updates optimistas */
const ahoraPE = () => {
  const iso = new Date(Date.now() - 5 * 3600 * 1000).toISOString()
  return { fecha: iso.slice(0, 10).split('-').reverse().join('/'), hora: iso.slice(11, 19) }
}

const POLL_MS = 15_000

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [mockManual, setMockManual] = useState(false)
  const [rows, setRows] = useState<Incidencia[]>(() => (apiActiva() ? [] : INCIDENCIAS))
  const [cargando, setCargando] = useState(() => apiActiva())
  const [error, setError] = useState<string | null>(null)
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null)
  const enVuelo = useRef(false)

  const fuente: 'worker' | 'mock' = mockManual || !apiActiva() ? 'mock' : 'worker'
  const token = () => localStorage.getItem('ims_token') ?? ''

  /* ===== Carga total (5 módulos) ===== */
  const recargar = useCallback(async () => {
    if (!apiActiva() || mockManual || !token()) return
    if (enVuelo.current) return
    enVuelo.current = true
    try {
      const data = await api.incidencias(token())
      setRows(data)
      setUltimaActualizacion(new Date())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de sincronización')
    } finally {
      enVuelo.current = false
      setCargando(false)
    }
  }, [mockManual])

  /* ===== Refetch de un solo módulo (tras mutaciones) ===== */
  const refrescarModulo = useCallback(async (modulo: string) => {
    if (!apiActiva() || mockManual || !token()) return
    try {
      const data = await api.obtenerModulo(token(), modulo)
      setRows(rs => [...rs.filter(r => r.modulo !== modulo), ...data]
        .sort((a, b) => (b.ts || 0) - (a.ts || 0)))
      setUltimaActualizacion(new Date())
    } catch { /* el polling lo retoma en el siguiente tick */ }
  }, [mockManual])

  /* ===== Modo demo legacy (botón de la top bar): congela datos mock ===== */
  const usarMockManual = useCallback(() => {
    setMockManual(true)
    setRows(INCIDENCIAS)
    setCargando(false)
    setError(null)
  }, [])

  /* ===== Carga inicial al autenticar / limpieza al salir ===== */
  useEffect(() => {
    if (user) {
      setCargando(true)
      void recargar()
    } else {
      setRows(apiActiva() ? [] : INCIDENCIAS)
      setUltimaActualizacion(null)
      setError(null)
      setCargando(false)  
    }
  }, [user, recargar])

  /* ===== Polling 15 s: sincroniza móvil ↔ desktop sin F5 ===== */
  useEffect(() => {
    if (!user || !apiActiva() || mockManual) return
    let interval: ReturnType<typeof setInterval> | null = setInterval(() => void recargar(), POLL_MS)
    const onVisibility = () => {
      if (interval) { clearInterval(interval); interval = null }
      if (!document.hidden) {
        void recargar()
        interval = setInterval(() => void recargar(), POLL_MS)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      if (interval) clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [user, recargar, mockManual])

  /* ===== Revisar (optimista + confirmación del servidor) ===== */
  const guardarRevision = useCallback(async (id: string, payload: RevisionPayload) => {
    if (!apiActiva()) throw new Error('API no configurada (falta VITE_WORKER_URL)')
    const modulo = MODULO_DE_ID(id)
    const t = ahoraPE()
    setRows(rs => rs.map(r => r.id === id ? {
      ...r,
      status: 'Revisado' as const,
      fecha_revision: t.fecha,
      hora_revision: t.hora,
      usuario_revision: user?.usuario ?? '',
      turno_picking: payload.turno_picking ?? r.turno_picking,
      usuario_picking: payload.usuario_picking ?? r.usuario_picking,
      ubicacion_picking: payload.ubicacion_picking ?? r.ubicacion_picking,
      fecha_modific_wms: payload.fecha_modific_wms ?? r.fecha_modific_wms,
      ubicacion_hallazgo: payload.ubicacion_hallazgo ?? r.ubicacion_hallazgo,
      obs_revision: payload.obs_revision ?? r.obs_revision,
    } : r))
    const fila = await api.guardarRevision(token(), id, payload)
    setRows(rs => rs.map(r => r.id === id ? fila : r))
    void refrescarModulo(modulo)
  }, [user, refrescarModulo])

  /* ===== Cerrar (optimista + confirmación; el SLA lo trae el refetch) ===== */
  const cerrarIncidencia = useCallback(async (id: string, causa: string) => {
    if (!apiActiva()) throw new Error('API no configurada (falta VITE_WORKER_URL)')
    const modulo = MODULO_DE_ID(id)
    const t = ahoraPE()
    setRows(rs => rs.map(r => r.id === id ? {
      ...r,
      status: 'Cerrado' as const,
      causa_raiz: causa,
      usuario_cierre: user?.usuario ?? '',
      fecha_cierre: t.fecha,
      hora_cierre: t.hora,
    } : r))
    const fila = await api.cerrar(token(), id, causa)
    setRows(rs => rs.map(r => r.id === id ? fila : r))
    void refrescarModulo(modulo)
  }, [user, refrescarModulo])

  /* ===== Corregir captura pendiente (optimista + refetch) ===== */
  const corregir = useCallback(async (modulo: string, id: string, datos: Record<string, unknown>) => {
    if (!apiActiva()) throw new Error('API no configurada (falta VITE_WORKER_URL)')
    setRows(rs => rs.map(r => r.id === id ? {
      ...r,
      tipo: String(datos.tipo ?? r.tipo),
      lpn: String(datos.lpn ?? r.lpn),
      cubeta: String(datos.cubeta ?? r.cubeta),
      codigo: String(datos.codigo ?? r.codigo),
      lote: String(datos.lote ?? r.lote),
      cantidad: Number(datos.cantidad ?? r.cantidad),
      observacion: String(datos.observacion ?? r.observacion),
    } : r))
    await api.corregir(token(), modulo, id, datos)
    void refrescarModulo(modulo)
  }, [refrescarModulo])

  /* ===== Registrar captura (AMR/AUD/API/AFR) ===== */
  const registrar = useCallback(async (modulo: string, datos: Record<string, unknown>) => {
    if (!apiActiva()) throw new Error('API no configurada (falta VITE_WORKER_URL)')
    const { id } = await api.registrar(token(), modulo, datos)
    await refrescarModulo(modulo)
    return id
  }, [refrescarModulo])

  /* ===== Registrar captura AUX ===== */
  const registrarAux = useCallback(async (datos: Record<string, unknown>) => {
    if (!apiActiva()) throw new Error('API no configurada (falta VITE_WORKER_URL)')
    const { id } = await api.registrarAux(token(), datos)
    await refrescarModulo('AUX')
    return id
  }, [refrescarModulo])

  return (
    <Ctx.Provider value={{
      rows, cargando, error, ultimaActualizacion, fuente, usarMockManual,
      recargar, refrescarModulo,
      guardarRevision, cerrarIncidencia, cerrar: cerrarIncidencia,
      corregir, registrar, registrarAux,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export const useData = () => useContext(Ctx)