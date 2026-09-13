import type { Context } from 'hono'
import { getDb, type Env } from '../db'
import { auth, TABLAS } from '../helpers'
import { leerModulo } from '../queries'

export const incidencias = async (c: Context<{ Bindings: Env }>) => {
  if (!(await auth(c))) return c.json({ ok: false, error: 'Sesión expirada' }, 401)
  const db = getDb(c.env)

  /* Los 5 módulos en paralelo: 1 ronda de red en vez de 5 secuenciales */
  const resultados = await Promise.all(
    Object.entries(TABLAS).map(([mod, tabla]) => leerModulo(db, mod, tabla)),
  )

  const all = resultados.flat().sort((a, b) => (b.ts || 0) - (a.ts || 0))
  return c.json({ ok: true, data: all })
}