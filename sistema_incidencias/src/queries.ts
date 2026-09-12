import type { Client } from '@libsql/client'
import { normalizarFila, type FilaRaw } from './normalizar'

const sqlDe = (tabla: string, modulo: string, donde = '') => {
  const clave = ['API', 'AFR', 'AUX'].includes(modulo) ? 'articulo' : 'codigo'
  const conWms = modulo === 'AMR' || modulo === 'AUD'
  const select = conWms
    ? 'i.*, p.descripcion AS descripcion_sku, p.precio_unitario, w.nombre AS nombre_wms'
    : 'i.*, p.descripcion AS descripcion_sku, p.precio_unitario, NULL AS nombre_wms'
  const joins = `LEFT JOIN productos p ON p.ean = i.${clave} OR p.sku = i.${clave}`
    + (conWms ? ' LEFT JOIN usuarios_wms w ON w.conexion = i.usuario_picking' : '')
  return `SELECT ${select} FROM ${tabla} i ${joins} ${donde} ORDER BY i.ts DESC`
}

export async function leerModulo(db: Client, modulo: string, tabla: string) {
  const q = await db.execute(sqlDe(tabla, modulo))
  return q.rows.map(r => normalizarFila(r as FilaRaw, modulo))
}

export async function leerUna(db: Client, modulo: string, tabla: string, id: string) {
  const q = await db.execute({ sql: sqlDe(tabla, modulo, 'WHERE i.id = ?'), args: [id] })
  return q.rows[0] ? normalizarFila(q.rows[0] as FilaRaw, modulo) : null
}