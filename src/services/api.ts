/* ===== Capa API contra Apps Script (Paso 5) =====
   Apps Script no soporta preflight CORS con Content-Type json,
   por eso el POST viaja como text/plain y el JSON va en el body.
   Si VITE_API_URL está vacío, la app opera en modo mock. */

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

export const apiActiva = () => API_URL.trim() !== ''

console.log('[api.ts] VITE_API_URL leída:', JSON.stringify(API_URL), '| apiActiva:', apiActiva())

async function llamar<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...payload }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = (await res.json()) as { ok: boolean; data?: T; error?: string }
  if (!json.ok) throw new Error(json.error ?? 'Error desconocido del servidor')
  return json.data as T
}

export const api = {
  login: (usuario: string, password: string) =>
    llamar<{ usuario: string; nombre: string; rol: string; esSupervisor: boolean; token: string }>('login', { usuario, password }),
  incidencias: (token: string) => llamar<unknown[]>('incidencias', { token }),
  guardarRevision: (token: string, id: string, payload: unknown) =>
    llamar<unknown>('guardar_revision', { token, id, payload }),
  cerrar: (token: string, id: string, causa: string) =>
    llamar<unknown>('cerrar', { token, id, causa }),
  nombreWms: (token: string, codigo: string) => llamar<string>('nombre_wms', { token, codigo }),
  cambiarPassword: (token: string, actual: string, nueva: string) =>
    llamar<unknown>('cambiar_password', { token, actual, nueva }),
  registrar: (token: string, modulo: string, datos: Record<string, unknown>) =>
    llamar<{ id: string }>('registrar', { token, modulo, datos }),
  corregir: (token: string, modulo: string, id: string, datos: Record<string, unknown>) =>
    llamar<unknown>('corregir', { token, modulo, id, datos }),
  buscarSku: (token: string, codigo: string) =>
    llamar<{ d: string; p: number | null } | null>('buscar_sku', { token, codigo }),

  buscarAuxiliares: (token: string, area: string) =>
    llamar<string[]>('buscar_auxiliares', { token, area }),  

  registrarAux: (token: string, datos: Record<string, unknown>) =>
    llamar<{ id: string }>('registrar_aux', { token, datos }),
  tiposAux: (token: string) => llamar<string[]>('tipos_aux', { token }),  
  
}

/* Login en crudo: devuelve el JSON tal cual para distinguir
   credenciales incorrectas (ok:false) de fallo de red (throw) */
export async function loginApi(usuario: string, password: string) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'login', usuario, password }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as {
    ok: boolean
    mensaje?: string
    usuario?: string; nombre?: string; rol?: string; esSupervisor?: boolean; token?: string
  }
}