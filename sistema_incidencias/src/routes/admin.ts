import type { Context } from 'hono'
import { getDb, type Env } from '../db'
import { auth, body, hashPassword } from '../helpers'

type Ctx = Context<{ Bindings: Env }>
const S = (v: unknown) => String(v ?? '').trim()
const N = (v: unknown) => parseFloat(String(v ?? '0').replace(',', '.')) || 0

/* Guard doble: sesión válida + rol sistema_admin */
const admin = async (c: Ctx) => {
  const user = await auth(c)
  if (!user) { return null }
  if (!user.esAdmin) return null
  return user
}
const noAdmin = (c: Ctx, user: Awaited<ReturnType<typeof admin>>) =>
  user ? c.json({ ok: false, error: 'Solo administradores' }, 403) : c.json({ ok: false, error: 'Sesión expirada' }, 401)

/* ================= USUARIOS ================= */
export const usuarioBuscar = async (c: Ctx) => {
  const user = await admin(c); if (!user) return noAdmin(c, user)
  const b = await body<Record<string, unknown>>(c)
  const usuario = S(b.usuario).toLowerCase()
  if (!usuario) return c.json({ ok: false, error: 'Indica el usuario' }, 400)
  const q = await getDb(c.env).execute({ sql: 'SELECT usuario, nombre, rol, activo FROM usuarios WHERE usuario = ?', args: [usuario] })
  return c.json({ ok: true, data: q.rows[0] ?? null })
}

export const usuarioGuardar = async (c: Ctx) => {
  const user = await admin(c); if (!user) return noAdmin(c, user)
  const b = await body<Record<string, unknown>>(c)
  const usuario = S(b.usuario).toLowerCase()
  const nombre = S(b.nombre); const rol = S(b.rol)
  const activo = Number(b.activo ?? 1) === 1 ? 1 : 0
  const password = String(b.password ?? '')
  if (!usuario || !nombre || !rol) return c.json({ ok: false, error: 'Usuario, nombre y rol son obligatorios' }, 400)
  const db = getDb(c.env)
  const q = await db.execute({ sql: 'SELECT usuario FROM usuarios WHERE usuario = ?', args: [usuario] })
  if (q.rows[0]) {
    if (password) {
      const hash = await hashPassword(password)
      await db.execute({ sql: 'UPDATE usuarios SET nombre=?, rol=?, activo=?, password_hash=? WHERE usuario=?', args: [nombre, rol, activo, hash, usuario] })
    } else {
      await db.execute({ sql: 'UPDATE usuarios SET nombre=?, rol=?, activo=? WHERE usuario=?', args: [nombre, rol, activo, usuario] })
    }
    return c.json({ ok: true, data: { actualizado: true } })
  }
  if (password.length < 6) return c.json({ ok: false, error: 'Usuario nuevo: contraseña mínima de 6 caracteres' }, 400)
  const hash = await hashPassword(password)
  await db.execute({ sql: 'INSERT INTO usuarios (usuario, password_hash, nombre, rol, activo) VALUES (?, ?, ?, ?, ?)', args: [usuario, hash, nombre, rol, activo] })
  return c.json({ ok: true, data: { creado: true } })
}

/* ================= PRODUCTOS ================= */
const UPSERT_PROD = `INSERT INTO productos (ean, sku, descripcion, precio_unitario, proveedor) VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(ean) DO UPDATE SET sku=excluded.sku, descripcion=excluded.descripcion,
  precio_unitario=excluded.precio_unitario, proveedor=excluded.proveedor`

export const productoBuscar = async (c: Ctx) => {
  const user = await admin(c); if (!user) return noAdmin(c, user)
  const b = await body<Record<string, unknown>>(c)
  const clave = S(b.ean)
  if (!clave) return c.json({ ok: false, error: 'Indica EAN o SKU' }, 400)
  const q = await getDb(c.env).execute({ sql: 'SELECT ean, sku, descripcion, precio_unitario, proveedor FROM productos WHERE ean = ? OR sku = ? LIMIT 1', args: [clave, clave] })
  return c.json({ ok: true, data: q.rows[0] ?? null })
}

export const productoGuardar = async (c: Ctx) => {
  const user = await admin(c); if (!user) return noAdmin(c, user)
  const b = await body<Record<string, unknown>>(c)
  const ean = S(b.ean); const sku = S(b.sku)
  if (!ean || !sku) return c.json({ ok: false, error: 'EAN y SKU son obligatorios' }, 400)
  try {
    await getDb(c.env).execute({ sql: UPSERT_PROD, args: [ean, sku, S(b.descripcion), N(b.precio_unitario), S(b.proveedor)] })
  } catch { return c.json({ ok: false, error: 'El SKU ya pertenece a otro producto' }, 400) }
  return c.json({ ok: true })
}

export const productosMasivo = async (c: Ctx) => {
  const user = await admin(c); if (!user) return noAdmin(c, user)
  const b = await body<Record<string, unknown>>(c)
  const filas = (Array.isArray(b.filas) ? b.filas : []) as Record<string, unknown>[]
  const errores: string[] = []
  const validas: { ean: string; sku: string; descripcion: string; precio: number; proveedor: string }[] = []
  filas.forEach((f, i) => {
    const ean = S(f.ean); const sku = S(f.sku)
    if (!ean || !sku) { errores.push(`Fila ${i + 1}: EAN o SKU vacío`); return }
    validas.push({ ean, sku, descripcion: S(f.descripcion), precio: N(f.precio_unitario), proveedor: S(f.proveedor) })
  })
  if (!validas.length) return c.json({ ok: false, error: errores.join(' · ') || 'Sin filas válidas' }, 400)
  const db = getDb(c.env)
  const marcas = validas.map(() => '?').join(',')
  const prev = await db.execute({ sql: `SELECT ean FROM productos WHERE ean IN (${marcas})`, args: validas.map(v => v.ean) })
  const setPrev = new Set(prev.rows.map(r => String(r.ean)))
  try {
    await db.batch(validas.map(v => ({ sql: UPSERT_PROD, args: [v.ean, v.sku, v.descripcion, v.precio, v.proveedor] })))
  } catch { return c.json({ ok: false, error: 'Error en carga masiva: revisa SKU duplicados entre productos distintos' }, 400) }
  const actualizados = validas.filter(v => setPrev.has(v.ean)).length
  return c.json({ ok: true, data: { insertados: validas.length - actualizados, actualizados, errores } })
}

/* ================= AUXILIARES ================= */
export const auxiliarBuscar = async (c: Ctx) => {
  const user = await admin(c); if (!user) return noAdmin(c, user)
  const b = await body<Record<string, unknown>>(c)
  const q = await getDb(c.env).execute({ sql: 'SELECT id, nombre, area FROM auxiliares WHERE nombre = ? AND area = ? LIMIT 1', args: [S(b.nombre), S(b.area)] })
  return c.json({ ok: true, data: q.rows[0] ?? null })
}

export const auxiliarGuardar = async (c: Ctx) => {
  const user = await admin(c); if (!user) return noAdmin(c, user)
  const b = await body<Record<string, unknown>>(c)
  const nombre = S(b.nombre); const area = S(b.area)
  if (!nombre || !area) return c.json({ ok: false, error: 'Nombre y área son obligatorios' }, 400)
  const db = getDb(c.env)
  const id = b.id ? Number(b.id) : null
  if (id) {
    await db.execute({ sql: 'UPDATE auxiliares SET nombre=?, area=? WHERE id=?', args: [nombre, area, id] })
    return c.json({ ok: true, data: { actualizado: true } })
  }
  await db.execute({ sql: 'INSERT INTO auxiliares (nombre, area) VALUES (?, ?) ON CONFLICT(nombre, area) DO UPDATE SET nombre=excluded.nombre', args: [nombre, area] })
  return c.json({ ok: true, data: { creado: true } })
}

export const auxiliaresMasivo = async (c: Ctx) => {
  const user = await admin(c); if (!user) return noAdmin(c, user)
  const b = await body<Record<string, unknown>>(c)
  const filas = (Array.isArray(b.filas) ? b.filas : []) as Record<string, unknown>[]
  const errores: string[] = []
  const validas: { nombre: string; area: string }[] = []
  filas.forEach((f, i) => {
    const nombre = S(f.nombre); const area = S(f.area)
    if (!nombre || !area) { errores.push(`Fila ${i + 1}: nombre o área vacío`); return }
    validas.push({ nombre, area })
  })
  if (!validas.length) return c.json({ ok: false, error: errores.join(' · ') || 'Sin filas válidas' }, 400)
  const res = await getDb(c.env).batch(
    validas.map(v => ({ sql: 'INSERT INTO auxiliares (nombre, area) VALUES (?, ?) ON CONFLICT(nombre, area) DO NOTHING', args: [v.nombre, v.area] })),
  )
  const insertados = res.reduce((s, r) => s + (r.rowsAffected ?? 0), 0)
  return c.json({ ok: true, data: { insertados, omitidos: validas.length - insertados, errores } })
}