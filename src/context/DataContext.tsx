import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { INCIDENCIAS, type Incidencia } from '../data/mock'
import { useAuth } from './AuthContext'
import { api, apiActiva } from '../services/api'

export interface RevisionPayload {
  turno_picking: string; usuario_picking: string; nombre_picking?: string
  ubicacion_picking: string; fecha_modific_wms: string; ubicacion_hallazgo: string; obs_revision: string
}

interface DataCtx {
  rows: Incidencia[]
  fuente: 'mock' | 'apps-script'
  cargando: boolean
  error: string | null
  recargar: () => Promise<void>
  refrescarModulo: (modulo: string) => Promise<void>
  guardarRevision: (id: string, p: RevisionPayload) => Promise<void>
  cerrarIncidencia: (id: string, causa: string) => Promise<void>
  registrar: (modulo: string, datos: Record<string, unknown>) => Promise<{ id: string }>
  corregir: (modulo: string, id: string, datos: Record<string, unknown>) => Promise<void>
  usarMockManual: () => void
}
const Ctx = createContext<DataCtx>(null!)

const ahora = () => {
  const d = new Date()
  return {
    f: d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    h: d.toLocaleTimeString('es-PE', { hour12: false }),
  }
}

/* Detecta el módulo a partir del prefijo del id */
const moduloDeId = (id: string): string => {
  const s = String(id || '')
  if (s.startsWith('AUD')) return 'AUD'
  if (s.startsWith('API')) return 'API'
  if (s.startsWith('AFR')) return 'AFR'
  if (s.startsWith('AUX')) return 'AUX'
  return 'AMR'
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [rows, setRows] = useState<Incidencia[]>(() => (apiActiva() ? [] : INCIDENCIAS))
  const [fuente, setFuente] = useState<'mock' | 'apps-script'>('mock')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const token = () => localStorage.getItem('ims_token') ?? user?.usuario ?? ''

  /* Carga completa (login, botón actualizar manual, fallback) */
  const recargar = useCallback(async () => {
    if (!apiActiva()) {
      setFuente('mock'); setRows(INCIDENCIAS); return
    }
    setCargando(true); setError(null)
    try {
      const data = await api.incidencias(token()) as Incidencia[]
      setRows(data)
      setFuente('apps-script')
    } catch (e) {
      console.error('[DataContext] API falló:', e)
      setError(e instanceof Error ? e.message : 'Error de conexión')
      setFuente('mock')
      setRows([])
    } finally {
      setCargando(false)
    }
  }, [])

  /* Refetch de UN solo módulo y fusión en rows (sin tocar los demás) */
  const refrescarModulo = useCallback(async (modulo: string) => {
    if (!apiActiva()) return
    try {
      const nuevas = (await api.obtenerModulo(token(), modulo)) as Incidencia[]
      setRows(rs => {
        const otras = rs.filter(r => r.modulo !== modulo)
        return [...otras, ...nuevas].sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0))
      })
    } catch (e) {
      console.error('[DataContext] refrescarModulo falló:', e)
    }
  }, [])

  useEffect(() => { if (user) void recargar() }, [user, recargar])

  /* ===== GUARDAR REVISIÓN: optimista + refetch incremental ===== */
  /* ===== GUARDAR REVISIÓN: optimismo + confirmación con fila del servidor ===== */
  const guardarRevision = async (id: string, p: RevisionPayload) => {
    const t = ahora()
    const modulo = moduloDeId(id)
    const usuario = user?.usuario ?? 'mock'
    // Optimismo: actualizar al instante
    setRows(rs => rs.map(r => r.id === id ? {
      ...r, ...p,
      status: 'Revisado' as const,
      usuario_revision: usuario,
      fecha_revision: t.f,
      hora_revision: t.h,
    } : r))
    if (apiActiva()) {
      try {
        const filaNorm = await api.guardarRevision(token(), id, p)
        if (filaNorm) {
          // Confirmación con la fila real del servidor
          setRows(rs => rs.map(r => r.id === id ? filaNorm : r))
        }
      } catch (e) {
        console.error('[DataContext] guardarRevision falló:', e)
        // Fallback: refetch después de pequeño delay
        setTimeout(() => void refrescarModulo(modulo), 500)
      }
    }
  }

  /* ===== CERRAR INCIDENCIA: optimismo + confirmación con fila del servidor ===== */
  const cerrarIncidencia = async (id: string, causa: string) => {
    const t = ahora()
    const modulo = moduloDeId(id)
    const usuario = user?.usuario ?? 'mock'
    // Optimismo: cerrar al instante
    setRows(rs => rs.map(r => r.id === id ? {
      ...r,
      status: 'Cerrado' as const,
      causa_raiz: causa,
      usuario_cierre: usuario,
      fecha_cierre: t.f,
      hora_cierre: t.h,
    } : r))
    if (apiActiva()) {
      try {
        const filaNorm = await api.cerrar(token(), id, causa)
        if (filaNorm) {
          // Confirmación con la fila real del servidor
          setRows(rs => rs.map(r => r.id === id ? filaNorm : r))
        }
      } catch (e) {
        console.error('[DataContext] cerrarIncidencia falló:', e)
        // Fallback: refetch después de pequeño delay
        setTimeout(() => void refrescarModulo(modulo), 500)
      }
    }
  }
  /* ===== REGISTRAR NUEVA CAPTURA: optimista + refetch del módulo ===== */
  const registrar = async (modulo: string, datos: Record<string, unknown>) => {
    if (!apiActiva()) {
      // Mock: crear fila local
      const t = ahora()
      const mockRow: Incidencia = {
        id: `${modulo}-mock-${Date.now()}`,
        modulo,
        fecha: t.f, hora: t.h, ts: Date.now(),
        area: String(datos.area || ''),
        tipo: String(datos.tipo || ''),
        lpn: String(datos.lpn || ''), cubeta: String(datos.cubeta || ''),
        estacion: String(datos.estacion || ''),
        codigo: String(datos.codigo || ''), descripcion: '',
        lote: String(datos.lote || ''),
        cantidad: Number(datos.cantidad) || 0, um: 'Unidad',
        observacion: String(datos.observacion || ''),
        reportado: String(datos.reportado || user?.nombre || ''),
        auxiliar_persona: String(datos.reportado || user?.nombre || ''),
        status: 'Pendiente', sla: 'Normal', valorizado: 0,
        usuario_registro: user?.usuario ?? 'mock',
      } as Incidencia
      setRows(rs => [mockRow, ...rs])
      return { id: mockRow.id }
    }
    const { id } = await api.registrar(token(), modulo, datos)
    await refrescarModulo(modulo)
    return { id }
  }

  /* ===== CORREGIR CAPTURA: optimista + refetch del módulo ===== */
  const corregir = async (modulo: string, id: string, datos: Record<string, unknown>) => {

    // Optimismo: actualizar al instante con los nuevos datos
    setRows(rs => rs.map(r => r.id === id ? {
      ...r,
      tipo: String(datos.tipo || r.tipo),
      lpn: String(datos.lpn || r.lpn),
      cubeta: String(datos.cubeta || r.cubeta),
      estacion: String(datos.estacion || r.estacion),
      codigo: String(datos.codigo || r.codigo),
      lote: String(datos.lote || r.lote),
      cantidad: Number(datos.cantidad) || r.cantidad,
      observacion: String(datos.observacion ?? r.observacion ?? ''),
      reportado: String(datos.reportado || r.reportado || ''),
    } : r))
    if (apiActiva()) {
      try {
        await api.corregir(token(), modulo, id, datos)
        await refrescarModulo(modulo)
      } catch (e) {
        console.error('[DataContext] corregir falló:', e)
        throw e
      }
    }
  }

  const usarMockManual = () => { setRows(INCIDENCIAS); setFuente('mock'); setError(null) }

  return (
    <Ctx.Provider value={{
      rows, fuente, cargando, error,
      recargar, refrescarModulo,
      guardarRevision, cerrarIncidencia,
      registrar, corregir,
      usarMockManual,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export const useData = () => useContext(Ctx)