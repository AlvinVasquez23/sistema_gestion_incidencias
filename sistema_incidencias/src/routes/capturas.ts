import type { Context } from 'hono'
import type { Client, InValue } from '@libsql/client'
import { getDb, type Env } from '../db'
import { auth, TABLAS, ahoraPE, body } from '../helpers'

type Ctx = Context<{ Bindings: Env }>
const pad = (n: number, w: number) => String(n).padStart(w, '0')
const S = (v: unknown) => String(v ?? '')
const N = (v: unknown) => parseFloat(String(v ?? '0').replace(',', '.')) || 0

const insertar = (tabla: string, cols: Record<string, unknown>) => {
  const k = Object.keys(cols)
  return {
    sql: `INSERT INTO ${tabla} (${k.join(',')}) VALUES (${k.map(() => '?').join(',')})`,
    args: k.map(x => cols[x]) as InValue[],
  }
}

const datosDe = (b: Record<string, unknown>): Record<string, unknown> =>
  (typeof b.datos === 'object' && b.datos !== null ? (b.datos as Record<string, unknown>) : b)

async function nuevoId(db: Client, key: string, tabla: string): Promise<string> {
  if (key === 'API') return 'API-' + crypto.randomUUID().replace(/-/g, '').slice(0, 8)
  if (key === 'AFR' || key === 'AUX') {
    const q = await db.execute(`SELECT id FROM ${tabla}`)
    let max = 0
    for (const r of q.rows) { const m = String(r.id).match(new RegExp(`^${key}-(\\d+)$`)); if (m) max = Math.max(max, +m[1]) }
    return `${key}-${pad(max + 1, key === 'AUX' ? 6 : 8)}`
  }
  const d = new Date()
  return `${key === 'AUD' ? 'AUD' : 'INC'}${d.getFullYear()}${pad(d.getMonth() + 1, 2)}${pad(d.getDate(), 2)}${pad(d.getHours(), 2)}${pad(d.getMinutes(), 2)}`
}

export const registrar = async (c: Ctx) => {
  const user = await auth(c); if (!user) return c.json({ ok: false, error: 'Sesión expirada' }, 401)
  const b = await body<Record<string, unknown>>(c)
  const modulo = S(b.modulo); const tabla = TABLAS[modulo]
  if (!tabla || modulo === 'AUX') return c.json({ ok: false, error: 'Módulo inválido' }, 400)
  const d = datosDe(b)
  const db = getDb(c.env); const t = ahoraPE()
  const id = await nuevoId(db, modulo, tabla)
  const codigo = S(d.codigo); const cant = N(d.cantidad)
  const pq = await db.execute({ sql: 'SELECT precio_unitario FROM productos WHERE ean = ? OR sku = ? LIMIT 1', args: [codigo, codigo] })
  const precio = pq.rows[0] ? Number(pq.rows[0].precio_unitario ?? 0) : 0
  const esApi = modulo === 'API' || modulo === 'AFR'

  const cols: Record<string, unknown> = {
    id, fecha: t.fecha, hora: t.hora, ts: Date.now(),
    area: S(d.area), tipo_incidencia: S(d.tipo), cantidad: cant,
    observacion: S(d.observacion), origen: 'PWA', usuario_registro: user.usuario,
  }
  if (esApi) {
    cols.cubeta = S(d.cubeta); cols.articulo = codigo
  } else {
    cols.lpn = S(d.lpn); cols.estacion = S(d.estacion); cols.articulo = S(d.articulo)
    cols.codigo = codigo; cols.lote = S(d.lote); cols.um = 'Unidad'
    cols.valorizado = Math.round(precio * cant * 100) / 100
    cols[modulo === 'AUD' ? 'auditor' : 'reportado'] = S(d.reportado) || user.nombre
    const cierra = (modulo === 'AMR' && S(d.tipo) === 'Faltante de origen') || (modulo === 'AUD' && S(d.tipo) === 'Conforme')
    if (cierra) {
      cols.status = 'Cerrado'; cols.fecha_cierre = t.fecha; cols.hora_cierre = t.hora
      cols.usuario_cierre = user.usuario
      cols.causa_raiz = modulo === 'AMR' ? 'Faltante de origen - sin seguimiento' : 'Conforme - sin seguimiento'
      cols.tiempo_solucion = '0 h'
    } else cols.status = 'Pendiente'
  }
  await db.execute(insertar(tabla, cols))
  return c.json({ ok: true, data: { id } })
}

export const corregir = async (c: Ctx) => {
  const user = await auth(c); if (!user) return c.json({ ok: false, error: 'Sesión expirada' }, 401)
  const b = await body<Record<string, unknown>>(c)
  const modulo = S(b.modulo); const tabla = TABLAS[modulo]; const id = S(b.id)
  if (!tabla) return c.json({ ok: false, error: 'Módulo inválido' }, 400)
  const d = datosDe(b)
  const db = getDb(c.env)
  const cur = await db.execute({ sql: `SELECT status, usuario_registro FROM ${tabla} WHERE id = ?`, args: [id] })
  if (!cur.rows[0]) return c.json({ ok: false, error: 'No encontrado' }, 404)
  if (String(cur.rows[0].usuario_registro || '') !== user.usuario)
    return c.json({ ok: false, error: 'Solo puedes corregir tus propias capturas' }, 403)
  if (String(cur.rows[0].status || '').toLowerCase() !== 'pendiente')
    return c.json({ ok: false, error: 'Solo se corrigen capturas pendientes' }, 400)
  const esApi = modulo === 'API' || modulo === 'AFR'
  await db.execute({
    sql: `UPDATE ${tabla} SET tipo_incidencia=?, ${esApi ? 'cubeta=?, articulo=?' : 'lpn=?, estacion=?, codigo=?, lote=?'}, cantidad=?, observacion=? WHERE id=?`,
    args: (esApi
      ? [S(d.tipo), S(d.cubeta), S(d.codigo), N(d.cantidad), S(d.observacion), id]
      : [S(d.tipo), S(d.lpn), S(d.estacion), S(d.codigo), S(d.lote), N(d.cantidad), S(d.observacion), id]) as InValue[],
  })
  return c.json({ ok: true })
}

export const registrarAux = async (c: Ctx) => {
  const user = await auth(c); if (!user) return c.json({ ok: false, error: 'Sesión expirada' }, 401)
  if (!/decanting|sistema_admin/i.test(user.rol))
    return c.json({ ok: false, error: 'Solo personal de decanting' }, 403)
  const b = await body<Record<string, unknown>>(c)
  const d = datosDe(b)
  const db = getDb(c.env); const t = ahoraPE()
  const id = await nuevoId(db, 'AUX', 'incidencias_auxiliar')
  await db.execute(insertar('incidencias_auxiliar', {
    id, fecha: t.fecha, hora: t.hora, ts: Date.now(),
    auxiliar: S(d.auxiliar), lpn: S(d.lpn), tipo_incidencia: S(d.tipo),
    articulo: S(d.articulo), cantidad: N(d.cantidad), observacion: S(d.observacion),
    origen: 'PWA', usuario_registro: user.usuario,
  }))
  return c.json({ ok: true, data: { id } })
}