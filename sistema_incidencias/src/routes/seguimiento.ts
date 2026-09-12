import type { Context } from 'hono'
import { getDb, type Env } from '../db'
import { auth, TABLAS, moduloDeId, ahoraPE, body } from '../helpers'
import { leerUna } from '../queries'

type Ctx = Context<{ Bindings: Env }>
const soloSeguimiento = (m: string) => m === 'AMR' || m === 'AUD'

export const guardarRevision = async (c: Ctx) => {
  const user = await auth(c); if (!user) return c.json({ ok: false, error: 'Sesión expirada' }, 401)
  const b = await body<Record<string, unknown>>(c)
  const id = String(b.id ?? ''); const modulo = moduloDeId(id); const tabla = TABLAS[modulo]
  if (!soloSeguimiento(modulo)) return c.json({ ok: false, error: 'Módulo sin seguimiento' }, 400)
  const db = getDb(c.env)
  const cur = await db.execute({ sql: `SELECT status FROM ${tabla} WHERE id = ?`, args: [id] })
  if (!cur.rows[0]) return c.json({ ok: false, error: 'No encontrado' }, 404)
  if (String(cur.rows[0].status || '').toLowerCase() === 'cerrado')
    return c.json({ ok: false, error: 'La incidencia ya está cerrada' }, 400)
  const t = ahoraPE()
  await db.execute({
    sql: `UPDATE ${tabla} SET fecha_revision=?, hora_revision=?, usuario_revision=?, turno_picking=?,
          usuario_picking=?, ubicacion_picking=?, fecha_modific_wms=?, ubicacion_hallazgo=?, obs_revision=?,
          status='Revisado' WHERE id=?`,
    args: [t.fecha, t.hora, user.usuario, String(b.turno_picking ?? ''), String(b.usuario_picking ?? ''),
      String(b.ubicacion_picking ?? ''), String(b.fecha_modific_wms ?? ''), String(b.ubicacion_hallazgo ?? ''),
      String(b.obs_revision ?? ''), id],
  })
  return c.json({ ok: true, data: await leerUna(db, modulo, tabla, id) })
}

export const cerrar = async (c: Ctx) => {
  const user = await auth(c); if (!user) return c.json({ ok: false, error: 'Sesión expirada' }, 401)
  if (!user.esSupervisor) return c.json({ ok: false, error: 'Solo supervisores pueden cerrar' }, 403)
  const b = await body<Record<string, unknown>>(c)
  const id = String(b.id ?? ''); const modulo = moduloDeId(id); const tabla = TABLAS[modulo]
  if (!soloSeguimiento(modulo)) return c.json({ ok: false, error: 'Módulo sin seguimiento' }, 400)
  const db = getDb(c.env)
  const cur = await db.execute({ sql: `SELECT status FROM ${tabla} WHERE id = ?`, args: [id] })
  if (!cur.rows[0]) return c.json({ ok: false, error: 'No encontrado' }, 404)
  if (String(cur.rows[0].status || '').toLowerCase() === 'cerrado')
    return c.json({ ok: false, error: 'Ya está cerrada' }, 400)
  const t = ahoraPE()
  await db.execute({
    sql: `UPDATE ${tabla} SET status='Cerrado', fecha_cierre=?, hora_cierre=?, causa_raiz=?, usuario_cierre=? WHERE id=?`,
    args: [t.fecha, t.hora, String(b.causa_raiz ?? b.causa ?? ''), user.usuario, id],
  })
  return c.json({ ok: true, data: await leerUna(db, modulo, tabla, id) })
}