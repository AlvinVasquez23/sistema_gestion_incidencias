import type { Context } from 'hono'
import type { Env } from './db'
import { verifyToken, type SessionPayload } from './auth'

type Ctx = Context<{ Bindings: Env }>

export const TABLAS: Record<string, string> = {
  AMR: 'incidencias_amr',
  AUD: 'auditorias',
  API: 'incidencias_apilador',
  AFR: 'incidencias_aframe',
  AUX: 'incidencias_auxiliar',
}

export const moduloDeId = (id: string): string => {
  const s = String(id || '')
  if (s.startsWith('AUD')) return 'AUD'
  if (s.startsWith('API')) return 'API'
  if (s.startsWith('AFR')) return 'AFR'
  if (s.startsWith('AUX')) return 'AUX'
  return 'AMR'
}

export async function auth(c: Ctx): Promise<SessionPayload | null> {
  const h = c.req.header('Authorization') ?? ''
  if (!h.startsWith('Bearer ')) return null
  return verifyToken(h.slice(7), c.env.JWT_SECRET)
}

/* Body JSON seguro: siempre devuelve T, nunca la unión T | {} */
export async function body<T extends Record<string, unknown>>(c: Ctx): Promise<T> {
  try { return await c.req.json<T>() } catch { return {} as T }
}

export const ahoraPE = () => {
  const iso = new Date(Date.now() - 5 * 3600 * 1000).toISOString()
  return { fecha: iso.slice(0, 10).split('-').reverse().join('/'), hora: iso.slice(11, 19) }
}

export async function pbkdf2Hex(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder()
  const km = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' }, km, 256)
  return [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function hashPassword(password: string): Promise<string> {
  const salt = [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('')
  return `${salt}:${await pbkdf2Hex(password, salt)}`
}

export async function verificarPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = String(stored).split(':')
  if (!salt || !hash) return false
  return (await pbkdf2Hex(password, salt)) === hash
}