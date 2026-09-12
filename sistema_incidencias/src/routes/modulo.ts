import type { Context } from 'hono'
import { getDb, type Env } from '../db'
import { auth, TABLAS, body } from '../helpers'
import { leerModulo } from '../queries'

export const obtenerModulo = async (c: Context<{ Bindings: Env }>) => {
  if (!(await auth(c))) return c.json({ ok: false, error: 'Sesión expirada' }, 401)
  const b = await body<Record<string, unknown>>(c)
  const modulo = String(b.modulo ?? '')
  const tabla = TABLAS[modulo]
  if (!tabla) return c.json({ ok: false, error: 'Módulo inválido' }, 400)
  return c.json({ ok: true, data: await leerModulo(getDb(c.env), modulo, tabla) })
}