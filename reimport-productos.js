/* reimport-productos.js — UPSERT robusto de productos (delimitador ; , o tab) */
import { createClient } from '@libsql/client'
import { readFileSync, existsSync, writeFileSync } from 'fs'
import { parse } from 'csv-parse/sync'
import 'dotenv/config'

const client = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })

const file = 'productos.csv'
if (!existsSync(file)) { console.error('❌ No existe productos.csv en la raíz'); process.exit(1) }

/* Detecta el separador mirando el encabezado */
const raw = readFileSync(file, 'utf8')
const primeraLinea = raw.split(/\r?\n/)[0]
const delimiter = [';', '\t', ','].sort((a, b) => primeraLinea.split(b).length - primeraLinea.split(a).length)[0]
console.log(`🔎 Delimitador detectado: ${JSON.stringify(delimiter)}`)

/* Sin columns:true → arrays crudos (tolera largos inconsistentes) */
const registros = parse(raw, { delimiter, skip_empty_lines: true, bom: true, quote: '"' })

const norm = (s) => String(s ?? '').trim()

/* Precio tolerante: S/, miles con punto, decimal con coma o punto */
const precio = (s) => {
  let t = norm(s).replace(/S\//gi, '').trim()
  if (!t || t === '-') return { v: 0, ok: true }
  const dots = (t.match(/\./g) || []).length
  if (dots > 1) {
    // formato es-PE válido: 1.234,56 → 1234.56
    if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(t)) t = t.replace(/\./g, '').replace(',', '.')
    else return { v: 0, ok: false }          // ej. "1.457.771" → sospechoso
  }
  if (/^\d+,\d+$/.test(t)) t = t.replace(',', '.')
  const n = parseFloat(t)
  if (isNaN(n) || n < 0 || n > 20000) return { v: 0, ok: false }
  return { v: Math.round(n * 100) / 100, ok: true }
}

const stmts = []
const sospechosos = []
let saltadas = 0

for (const f of registros) {
  if (!f.length) continue
  const ean = norm(f[0])
  if (!ean || ean.toUpperCase() === 'EAN') continue   // salta encabezados repetidos
  let sku, desc, pRaw, prov
  if (f.length >= 5) {
    // EAN ; SKU ; descripcion… ; precio ; proveedor  (la descripción se reconstruye si trae separadores dentro)
    sku = norm(f[1])
    prov = norm(f[f.length - 1])
    pRaw = f[f.length - 2]
    desc = f.slice(2, f.length - 2).join(delimiter)
  } else if (f.length === 4) {
    sku = norm(f[1]); desc = norm(f[2]); pRaw = f[3]; prov = ''
  } else { saltadas++; continue }

  const { v, ok } = precio(pRaw)
  if (!ok) sospechosos.push(`${ean};${norm(pRaw)}`)
  stmts.push({
    sql: `INSERT INTO productos (ean, sku, descripcion, precio_unitario, proveedor)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(ean) DO UPDATE SET
            sku = excluded.sku,
            descripcion = excluded.descripcion,
            precio_unitario = excluded.precio_unitario,
            proveedor = excluded.proveedor`,
    args: [ean, sku, norm(desc) || null, v, prov || null],
  })
}

console.log(`📦 Aplicando UPSERT de ${stmts.length} productos…`)
for (let i = 0; i < stmts.length; i += 500) await client.batch(stmts.slice(i, i + 500), 'write')

if (sospechosos.length) {
  writeFileSync('productos_pendientes.csv', 'ean;precio_crudo\n' + sospechosos.join('\n'), 'utf8')
  console.log(`⚠️ ${sospechosos.length} precios no parseables → insertados en 0 y listados en productos_pendientes.csv`)
}
if (saltadas) console.log(`⚠️ ${saltadas} filas saltadas por formato insuficiente`)

const q = await client.execute(`SELECT COUNT(*) AS total,
    SUM(precio_unitario > 0) AS con_precio,
    SUM(proveedor IS NOT NULL AND proveedor != '') AS con_proveedor
  FROM productos`)
console.log('✅ Estado final en Turso:', q.rows[0])

const muestra = await client.execute(`SELECT * FROM productos WHERE ean = '8806718031938'`)
console.log('🔎 Muestra (3-GEL):', muestra.rows[0])