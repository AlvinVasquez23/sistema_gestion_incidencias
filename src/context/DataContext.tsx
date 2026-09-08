import { createContext, useContext, useState, type ReactNode } from 'react'
import { INCIDENCIAS, type Incidencia } from '../data/mock'
import { useAuth } from './AuthContext'

export interface RevisionPayload {
  turno_picking: string; usuario_picking: string; nombre_picking?: string
  ubicacion_picking: string; fecha_modific_wms: string; ubicacion_hallazgo: string; obs_revision: string
}

interface DataCtx {
  rows: Incidencia[]
  guardarRevision: (id: string, p: RevisionPayload) => void
  cerrarIncidencia: (id: string, causa: string) => void
}
const Ctx = createContext<DataCtx>(null!)

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [rows, setRows] = useState<Incidencia[]>(INCIDENCIAS)
  const ahora = () => {
    const d = new Date()
    return {
      f: d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      h: d.toLocaleTimeString('es-PE', { hour12: false }),
    }
  }

  /* ===== Guardar revisión: pasa a status Revisado ===== */
  const guardarRevision = (id: string, p: RevisionPayload) => {
    const t = ahora()
    setRows(rs => rs.map(r => r.id === id ? {
      ...r, ...p,
      status: 'Revisado',
      usuario_revision: user?.usuario ?? 'mock',
      fecha_revision: t.f,
      hora_revision: t.h,
    } : r))
  }

  /* ===== Cerrar incidencia: solo supervisores, con causa raíz ===== */
  const cerrarIncidencia = (id: string, causa: string) => {
    const t = ahora()
    setRows(rs => rs.map(r => r.id === id ? {
      ...r,
      status: 'Cerrado',
      causa_raiz: causa,
      usuario_cierre: user?.usuario ?? 'mock',
      fecha_cierre: t.f,
      hora_cierre: t.h,
    } : r))
  }

  return <Ctx.Provider value={{ rows, guardarRevision, cerrarIncidencia }}>{children}</Ctx.Provider>
}
export const useData = () => useContext(Ctx)