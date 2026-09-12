/* Setup Turso: aplica schema.sql e importa los 4 catálogos desde CSV */
import { createClient } from '@libsql/client'
import { readFileSync, existsSync } from 'fs'
import { parse } from 'csv-parse/sync'
import { pbkdf2Sync, randomBytes } from 'crypto'
import 'dotenv/config'

const URL_DB = process.env.TURSO_DATABASE_URL
const TOKEN = process.env.TURSO_AUTH_TOKEN
if (!URL_DB || !TOKEN) { console.error('Faltan TURSO_DATABASE_URL / TURSO_AUTH_TOKEN en .env'); process.exit(1) }

const client = createClient({ url: URL_DB, authToken: TOKEN })
const norm = (s) => String(s ?? '').trim()
const precio = (s) => {
  const n = parseFloat(String(s).replace(/S\//i, '').replace(/,/g, '').trim())
  return isNaN(n) ? 0 : n
}
/* Hash PBKDF2 con salt aleatorio por usuario → formato "salt:hash" */
const hash = (pwd) => {
  const salt = randomBytes(16).toString('hex')
  return salt + ':' + pbkdf2Sync(String(pwd), salt, 100_000, 32, 'sha256').toString('hex')
}

/* ===== 1) Schema (sin PRAGMAs: Turso los gestiona server-side) ===== */
const schema = readFileSync('schema.sql', 'utf-8')
  .split('\n').filter(l => !l.trim().toUpperCase().startsWith('PRAGMA')).join('\n')
await client.executeMultiple(schema)
console.log('Schema aplicado (10 tablas)')

/* ===== 2) Import por lotes ===== */
async function importar(csvFile, label, mapper) {
  if (!existsSync(csvFile)) { console.warn(`⚠️ ${csvFile} no existe, se omite`); return }
  const filas = parse(readFileSync(csvFile, 'utf8'), { columns: true, skip_empty_lines: true, bom: true })
  const stmts = []
  for (const r of filas) { const s = mapper(r); if (s) stmts.push(s) }
  for (let i = 0; i < stmts.length; i += 500) await client.batch(stmts.slice(i, i + 500), 'write')
  console.log(` ${label}: ${stmts.length} filas`)
}

await importar('usuarios.csv', 'usuarios', r => norm(r.usuario) && ({
  sql: 'INSERT OR IGNORE INTO usuarios (usuario, password_hash, nombre, rol, activo) VALUES (?, ?, ?, ?, ?)',
  args: [norm(r.usuario).toLowerCase(), hash(r.password ?? ''), norm(r.nombre), norm(r.rol),
         norm(r.activo).toUpperCase() === 'TRUE' ? 1 : 0],
}))

await importar('usuarios_wms.csv', 'usuarios_wms', r => norm(r.conexion) && ({
  sql: 'INSERT OR IGNORE INTO usuarios_wms (conexion, nombre) VALUES (?, ?)',
  args: [norm(r.conexion), norm(r.nombre)],
}))

await importar('productos.csv', 'productos', r => norm(r.EAN) && ({
  sql: 'INSERT OR IGNORE INTO productos (ean, sku, descripcion, precio_unitario, proveedor) VALUES (?, ?, ?, ?, NULL)',
  args: [norm(r.EAN), norm(r.SKU), norm(r.descripcion) || null, precio(r.precio_unitario)],
}))

await importar('auxiliares.csv', 'auxiliares', r => norm(r.Nombres) && ({
  sql: 'INSERT OR IGNORE INTO auxiliares (nombre, area) VALUES (?, ?)',
  args: [norm(r.Nombres), norm(r.Area)],
}))

/* ===== 3) Verificación ===== */
for (const t of ['usuarios', 'usuarios_wms', 'productos', 'auxiliares']) {
  const q = await client.execute(`SELECT COUNT(*) AS n FROM ${t}`)
  console.log(`   ${t}: ${q.rows[0].n} filas en Turso`)
}
console.log('\nSetup completo. Tablas de incidencias vacías, listas para producción.')