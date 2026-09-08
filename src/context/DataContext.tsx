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
  guardarRevision: (id: string, p: RevisionPayload) => Promise<void>
  cerrarIncidencia: (id: string, causa: string) => Promise<void>
}
const Ctx = createContext<DataCtx>(null!)

const ahora = () => {
  const d = new Date()
  return {
    f: d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    h: d.toLocaleTimeString('es-PE', { hour12: false }),
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [rows, setRows] = useState<Incidencia[]>(INCIDENCIAS)
  const [fuente, setFuente] = useState<'mock' | 'apps-script'>('mock')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const token = () => localStorage.getItem('ims_token') ?? ''

  /* Al entrar: intenta leer de Apps Script; si no hay URL o falla, usa mock */
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
      setError(e instanceof Error ? e.message : 'Error de conexión')
      setFuente('mock')
      setRows(INCIDENCIAS)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { if (user) void recargar() }, [user, recargar])

  const guardarRevision = async (id: string, p: RevisionPayload) => {
    if (apiActiva()) {
      await api.guardarRevision(token(), id, p)
      await recargar()
      return
    }
    const t = ahora()
    setRows(rs => rs.map(r => r.id === id ? {
      ...r, ...p,
      status: 'Revisado' as const,
      usuario_revision: user?.usuario ?? 'mock',
      fecha_revision: t.f,
      hora_revision: t.h,
    } : r))
  }

  const cerrarIncidencia = async (id: string, causa: string) => {
    if (apiActiva()) {
      await api.cerrar(token(), id, causa)
      await recargar()
      return
    }
    const t = ahora()
    setRows(rs => rs.map(r => r.id === id ? {
      ...r,
      status: 'Cerrado' as const,
      causa_raiz: causa,
      usuario_cierre: user?.usuario ?? 'mock',
      fecha_cierre: t.f,
      hora_cierre: t.h,
    } : r))
  }

  return (
    <Ctx.Provider value={{ rows, fuente, cargando, error, recargar, guardarRevision, cerrarIncidencia }}>
      {children}
    </Ctx.Provider>
  )
}
export const useData = () => useContext(Ctx)