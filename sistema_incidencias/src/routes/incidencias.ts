import type { Context } from 'hono'
import { getDb, type Env } from '../db'
import { auth, TABLAS } from '../helpers'
import { leerModulo } from '../queries'

export const incidencias = async (c: Context<{ Bindings: Env }>) => {
  if (!(await auth(c))) return c.json({ ok: false, error: 'Sesión expirada' }, 401)
  const db = getDb(c.env)
  const all: any[] = []
  for (const [mod, tabla] of Object.entries(TABLAS)) all.push(...await leerModulo(db, mod, tabla))
  all.sort((a, b) => (b.ts || 0) - (a.ts || 0))
  return c.json({ ok: true, data: all })
}