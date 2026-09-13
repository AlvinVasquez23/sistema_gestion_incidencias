// test-turso.mjs
import { createClient } from '@libsql/client'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.dev.vars', 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()] })
)

console.log('URL:', env.TURSO_DATABASE_URL)
const tok = env.TURSO_AUTH_TOKEN || ''
console.log('Token length:', tok.length, '| empieza con:', tok.slice(0, 12), '| termina con:', tok.slice(-6))

const db = createClient({ url: env.TURSO_DATABASE_URL, authToken: tok })
const r = await db.execute('SELECT COUNT(*) AS n FROM usuarios')
console.log('Conexión OK. usuarios:', r.rows[0].n)