import type { Context } from 'hono'
import type { InValue } from '@libsql/client/web'
import { getDb, type Env } from '../db'
import { auth, TABLAS, moduloDeId, ahoraPE, body } from '../helpers'
import { leerUna } from '../queries'

type Ctx = Context<{ Bindings: Env }>
const soloSeguimiento = (m: string) => m === 'AMR' || m === 'AUD'
const S = (v: unknown) => String(v ?? '')

export const guardarRevision = async (c: Ctx) => {
  const user = await auth(c); if (!user) return c.json({ ok: false, error: 'Sesión expirada' }, 401)
  const b = await body<Record<string, unknown>>(c)
  const id = String(b.id ?? ''); const modulo = moduloDeId(id); const tabla = TABLAS[modulo]
  if (!soloSeguimiento(modulo)) return c.json({ ok: false, error: 'Módulo sin seguimiento' }, 400)
  const db = getDb(c.env)
  const cur = await db.execute({ sql: `SELECT * FROM ${tabla} WHERE id = ?`, args: [id] })
  if (!cur.rows[0]) return c.json({ ok: false, error: 'No encontrado' }, 404)
  const prevStatus = String(cur.rows[0].status || '').toLowerCase()
  if (prevStatus === 'cerrado')
    return c.json({ ok: false, error: 'La incidencia ya está cerrada' }, 400)

  const t = ahoraPE()
  await db.execute({
    sql: `UPDATE ${tabla} SET fecha_revision=?, hora_revision=?, usuario_revision=?, turno_picking=?,
          usuario_picking=?, ubicacion_picking=?, fecha_modific_wms=?, ubicacion_hallazgo=?, obs_revision=?,
          status='Revisado' WHERE id=?`,
    args: [t.fecha, t.hora, user.usuario, S(b.turno_picking), S(b.usuario_picking),
      S(b.ubicacion_picking), S(b.fecha_modific_wms), S(b.ubicacion_hallazgo),
      S(b.obs_revision), id],
  })

  /* Si YA estaba Revisado → es modificación de revisión: auditoría solo de campos cambiados */
  if (prevStatus === 'revisado') {
    const fila = cur.rows[0] as Record<string, unknown>
    const nuevos: Record<string, unknown> = {
      turno_picking: S(b.turno_picking), usuario_picking: S(b.usuario_picking),
      ubicacion_picking: S(b.ubicacion_picking), fecha_modific_wms: S(b.fecha_modific_wms),
      ubicacion_hallazgo: S(b.ubicacion_hallazgo), obs_revision: S(b.obs_revision),
    }
    const antes: Record<string, unknown> = {}
    const despues: Record<string, unknown> = {}
    for (const k of Object.keys(nuevos)) {
      if (String(fila[k] ?? '') !== String(nuevos[k] ?? '')) { antes[k] = fila[k] ?? ''; despues[k] = nuevos[k] }
    }
    if (Object.keys(despues).length) {
      await db.execute({
        sql: `INSERT INTO historial_modificaciones (incidencia_id, modulo, tipo_operacion, fecha, hora, ts, usuario, datos_anteriores, datos_nuevos) VALUES (?, ?, 'mod_revision', ?, ?, ?, ?, ?, ?)`,
        args: [id, modulo, t.fecha, t.hora, Date.now(), user.usuario, JSON.stringify(antes), JSON.stringify(despues)] as InValue[],
      })
    }
  }
  /* 1ª revisión: sin auditoría (se muestra desde los campos de la fila, como siempre) */

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

export const historial = async (c: Ctx) => {
  const user = await auth(c); if (!user) return c.json({ ok: false, error: 'Sesión expirada' }, 401)
  const b = await body<Record<string, unknown>>(c)
  const id = String(b.id ?? '')
  if (!id) return c.json({ ok: false, error: 'ID requerido' }, 400)
  const db = getDb(c.env)
  const q = await db.execute({
    sql: `SELECT id, incidencia_id, modulo, tipo_operacion, fecha, hora, ts, usuario, datos_anteriores, datos_nuevos
          FROM historial_modificaciones WHERE incidencia_id = ? ORDER BY ts ASC, id ASC`,
    args: [id],
  })
  return c.json({ ok: true, data: q.rows })
}