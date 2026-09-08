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
}