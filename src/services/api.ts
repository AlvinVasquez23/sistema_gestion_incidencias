/* Adapter al Worker de Cloudflare + Turso (reemplaza Apps Script) */
import type { Incidencia } from '../data/mock'

const WORKER = (import.meta.env.VITE_WORKER_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export const apiActiva = () => WORKER.length > 0

export interface LoginResult {
  ok: true
  usuario: string; nombre: string; rol: string
  esSupervisor: boolean; esAdmin: boolean
  token: string
}

export interface HistRow {
  id: number
  incidencia_id: string
  modulo: string
  tipo_operacion: string
  fecha: string
  hora: string
  ts: number
  usuario: string
  datos_anteriores: string
  datos_nuevos: string
}

async function llamar<T>(path: string, token: string, body?: unknown): Promise<T> {
  const res = await fetch(`${WORKER}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  })
  const json = await res.json().catch(() => null)
  if (res.status === 401) {
    localStorage.removeItem('ims_token')
    window.dispatchEvent(new Event('ims:session-expirada'))
  }
  if (!res.ok || !json || json.ok === false) {
    throw new Error(json?.error || json?.mensaje || `Error de conexión (${res.status})`)
  }
  return json.data as T
}

export const api = {
  login: async (usuario: string, password: string): Promise<LoginResult> => {
    const res = await fetch(`${WORKER}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password }),
    })
    const json = await res.json().catch(() => null)
    if (!res.ok || !json?.ok) throw new Error(json?.mensaje || `Error de conexión (${res.status})`)
    return json as LoginResult

    

  },

  incidencias: (token: string) => llamar<Incidencia[]>('/api/incidencias', token),
  obtenerModulo: (token: string, modulo: string) => llamar<Incidencia[]>('/api/modulo', token, { modulo }),

  guardarRevision: (token: string, id: string, payload: unknown) =>
    llamar<Incidencia>('/api/revision', token, { id, ...(payload as object) }),

  cerrar: (token: string, id: string, causa: string) =>
    llamar<Incidencia>('/api/cierre', token, { id, causa }),

  registrar: (token: string, modulo: string, datos: Record<string, unknown>) =>
    llamar<{ id: string }>('/api/registrar', token, { modulo, datos }),

  corregir: (token: string, modulo: string, id: string, datos: Record<string, unknown>) =>
    llamar<unknown>('/api/corregir', token, { modulo, id, datos }),

  registrarAux: (token: string, datos: Record<string, unknown>) =>
    llamar<{ id: string }>('/api/registrar-aux', token, { datos }),

  tiposAux: (token: string) => llamar<string[]>('/api/tipos-aux', token),
  buscarAuxiliares: (token: string, area: string) => llamar<string[]>('/api/auxiliares', token, { area }),
  buscarSku: (token: string, codigo: string) => llamar<{ d: string; p: number } | null>('/api/sku', token, { codigo }),
  nombreWms: (token: string, codigo: string) => llamar<string>('/api/wms', token, { codigo }),
  buscarNombreWms: (token: string, codigo: string) => llamar<string>('/api/wms', token, { codigo }),
  cambiarPassword: (token: string, actual: string, nueva: string) =>
    llamar<unknown>('/api/password', token, { actual, nueva }),
  historial: (token: string, id: string) => llamar<HistRow[]>('/api/historial', token, { id }),

  sync: (token: string) => llamar<{ fp: string }>('/api/sync', token),  

}