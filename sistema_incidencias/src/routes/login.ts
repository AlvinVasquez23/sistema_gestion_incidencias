import type { Context } from 'hono'
import { getDb, type Env } from '../db'
import { signToken } from '../auth'
import { verificarPassword, body } from '../helpers'

export const login = async (c: Context<{ Bindings: Env }>) => {
  const b = await body<Record<string, unknown>>(c)
  const usuario = String(b.usuario ?? '').trim().toLowerCase()
  const password = String(b.password ?? '')
  if (!usuario || !password) return c.json({ ok: false, mensaje: 'Usuario y contraseña requeridos' }, 400)

  const q = await getDb(c.env).execute({
    sql: 'SELECT usuario, nombre, rol, password_hash, activo FROM usuarios WHERE usuario = ?',
    args: [usuario],
  })
  const row = q.rows[0]
  if (!row) return c.json({ ok: false, mensaje: 'Usuario no encontrado' }, 401)
  if (Number(row.activo) !== 1) return c.json({ ok: false, mensaje: 'Usuario inactivo' }, 403)
  if (!(await verificarPassword(password, String(row.password_hash))))
    return c.json({ ok: false, mensaje: 'Contraseña incorrecta' }, 401)

  const rol = String(row.rol)
  const esSupervisor = /sistema_admin|supervisor/i.test(rol)
  const esAdmin = /sistema_admin/i.test(rol)
  const token = await signToken(
    { usuario: String(row.usuario), nombre: String(row.nombre), rol, esSupervisor, esAdmin },
    c.env.JWT_SECRET,
  )
  return c.json({ ok: true, usuario: row.usuario, nombre: row.nombre, rol, esSupervisor, esAdmin, token })
}