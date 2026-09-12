import type { Context } from 'hono'
import { getDb, type Env } from '../db'
import { auth, verificarPassword, hashPassword, body } from '../helpers'

type Ctx = Context<{ Bindings: Env }>

export const tiposAux = async (c: Ctx) => {
  if (!(await auth(c))) return c.json({ ok: false, error: 'Sesión expirada' }, 401)
  const q = await getDb(c.env).execute('SELECT tipo FROM tipos_auxiliar ORDER BY tipo')
  return c.json({ ok: true, data: q.rows.map(r => String(r.tipo)) })
}

export const buscarAuxiliares = async (c: Ctx) => {
  if (!(await auth(c))) return c.json({ ok: false, error: 'Sesión expirada' }, 401)
  const b = await body<Record<string, unknown>>(c)
  const q = await getDb(c.env).execute({
    sql: 'SELECT nombre FROM auxiliares WHERE LOWER(area) = LOWER(?) ORDER BY nombre',
    args: [String(b.area ?? '')],
  })
  return c.json({ ok: true, data: q.rows.map(r => String(r.nombre)) })
}

export const buscarSku = async (c: Ctx) => {
  if (!(await auth(c))) return c.json({ ok: false, error: 'Sesión expirada' }, 401)
  const b = await body<Record<string, unknown>>(c)
  const cod = String(b.codigo ?? '').trim()
  const q = await getDb(c.env).execute({
    sql: 'SELECT descripcion, precio_unitario FROM productos WHERE ean = ? OR sku = ? LIMIT 1',
    args: [cod, cod],
  })
  if (!q.rows[0]) return c.json({ ok: true, data: null })
  return c.json({ ok: true, data: { d: String(q.rows[0].descripcion ?? ''), p: Number(q.rows[0].precio_unitario ?? 0) } })
}

export const nombreWms = async (c: Ctx) => {
  if (!(await auth(c))) return c.json({ ok: false, error: 'Sesión expirada' }, 401)
  const b = await body<Record<string, unknown>>(c)
  const q = await getDb(c.env).execute({
    sql: 'SELECT nombre FROM usuarios_wms WHERE conexion = ? LIMIT 1', args: [String(b.codigo ?? '')],
  })
  return c.json({ ok: true, data: q.rows[0] ? String(q.rows[0].nombre) : '' })
}

export const cambiarPassword = async (c: Ctx) => {
  const user = await auth(c); if (!user) return c.json({ ok: false, error: 'Sesión expirada' }, 401)
  const b = await body<Record<string, unknown>>(c)
  const actual = String(b.actual ?? ''); const nueva = String(b.nueva ?? '')
  if (nueva.length < 6) return c.json({ ok: false, error: 'La nueva contraseña debe tener al menos 6 caracteres' }, 400)
  const db = getDb(c.env)
  const q = await db.execute({ sql: 'SELECT password_hash FROM usuarios WHERE usuario = ?', args: [user.usuario] })
  if (!q.rows[0]) return c.json({ ok: false, error: 'Usuario no encontrado' }, 404)
  if (!(await verificarPassword(actual, String(q.rows[0].password_hash))))
    return c.json({ ok: false, error: 'Contraseña actual incorrecta' }, 401)
  await db.execute({ sql: 'UPDATE usuarios SET password_hash = ? WHERE usuario = ?', args: [await hashPassword(nueva), user.usuario] })
  return c.json({ ok: true })
}