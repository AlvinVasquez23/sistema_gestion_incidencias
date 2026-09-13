import type { Client } from '@libsql/client/web'
import { normalizarFila, type FilaRaw } from './normalizar'

/* Subconsultas LIMIT 1: evitan filas duplicadas por fan-out de JOINs */
const sqlDe = (tabla: string, modulo: string, donde = '') => {
  const clave = ['API', 'AFR', 'AUX'].includes(modulo) ? 'articulo' : 'codigo'
  const conWms = modulo === 'AMR' || modulo === 'AUD'
  const wms = conWms
    ? `, (SELECT w.nombre FROM usuarios_wms w WHERE w.conexion = i.usuario_picking LIMIT 1) AS nombre_wms`
    : `, NULL AS nombre_wms`
  return `
    SELECT i.*,
      (SELECT p.descripcion FROM productos p WHERE p.ean = i.${clave} OR p.sku = i.${clave} LIMIT 1) AS descripcion_sku,
      (SELECT p.precio_unitario FROM productos p WHERE p.ean = i.${clave} OR p.sku = i.${clave} LIMIT 1) AS precio_unitario
      ${wms}
    FROM ${tabla} i
    ${donde}
    ORDER BY i.ts DESC`
}

export async function leerModulo(db: Client, modulo: string, tabla: string) {
  const q = await db.execute(sqlDe(tabla, modulo))
  return q.rows.map(r => normalizarFila(r as FilaRaw, modulo))
}

export async function leerUna(db: Client, modulo: string, tabla: string, id: string) {
  const q = await db.execute({ sql: sqlDe(tabla, modulo, 'WHERE i.id = ?'), args: [id] })
  return q.rows[0] ? normalizarFila(q.rows[0] as FilaRaw, modulo) : null
}