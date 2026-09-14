import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env } from './db'
import { login } from './routes/login'
import { incidencias, sync } from './routes/incidencias'
import { obtenerModulo } from './routes/modulo'
import { guardarRevision, cerrar, historial } from './routes/seguimiento'
import { registrar, corregir, registrarAux } from './routes/capturas'
import { tiposAux, buscarAuxiliares, buscarSku, nombreWms, cambiarPassword } from './routes/catalogos'
import {
  usuarioBuscar, usuarioGuardar,
  productoBuscar, productoGuardar, productosMasivo,
  auxiliarBuscar, auxiliarGuardar, auxiliaresMasivo,
} from './routes/admin'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors({
  origin: (origin, c) => {
    const lista = (c.env.ALLOWED_ORIGIN ?? '').split(',').map((s: string) => s.trim()).filter(Boolean)
    if (origin && lista.includes(origin)) return origin
    // Dev local: cualquier puerto de localhost / 127.0.0.1
    if (origin && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin
    return ''
  },
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

app.get('/', (c) => c.json({ ok: true, message: 'Sistema de Incidencias API' }))

app.post('/api/login', login)
app.post('/api/incidencias', incidencias)
app.post('/api/modulo', obtenerModulo)
app.post('/api/revision', guardarRevision)
app.post('/api/cierre', cerrar)
app.post('/api/registrar', registrar)
app.post('/api/corregir', corregir)
app.post('/api/registrar-aux', registrarAux)
app.post('/api/tipos-aux', tiposAux)
app.post('/api/auxiliares', buscarAuxiliares)
app.post('/api/sku', buscarSku)
app.post('/api/wms', nombreWms)
app.post('/api/password', cambiarPassword)
app.post('/api/historial', historial)
app.post('/api/sync', sync)
app.post('/api/admin/usuario-buscar', usuarioBuscar)
app.post('/api/admin/usuario-guardar', usuarioGuardar)
app.post('/api/admin/producto-buscar', productoBuscar)
app.post('/api/admin/producto-guardar', productoGuardar)
app.post('/api/admin/productos-masivo', productosMasivo)
app.post('/api/admin/auxiliar-buscar', auxiliarBuscar)
app.post('/api/admin/auxiliar-guardar', auxiliarGuardar)
app.post('/api/admin/auxiliares-masivo', auxiliaresMasivo)

export default app


