export type FilaRaw = Record<string, unknown>
const str = (v: unknown) => (v == null ? '' : String(v))
const num = (v: unknown) => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isNaN(n) ? 0 : n }

const turnoDe = (hora: string): string => {
  const m = hora.match(/(\d{1,2}):(\d{2})/)
  if (!m) return '—'
  const hr = +m[1] + +m[2] / 60
  if (hr >= 7 && hr < 13) return 'Turno 1'
  if (hr >= 13 && hr < 22) return 'Turno 2'
  return 'Turno 3'
}

export function normalizarFila(r: FilaRaw, modulo: string) {
  const esApi = modulo === 'API' || modulo === 'AFR'
  const esAux = modulo === 'AUX'
  const codigo = esApi || esAux ? str(r.articulo) : str(r.codigo)
  const precio = r.precio_unitario == null ? null : num(r.precio_unitario)
  const cantidad = num(r.cantidad)
  const valorizado = num(r.valorizado) > 0 ? num(r.valorizado)
    : precio != null ? Math.round(precio * cantidad * 100) / 100 : 0
  const status = esApi || esAux ? '' : str(r.status)
  const ts = r.ts == null ? 0 : Number(r.ts)
  const horas = ts ? (Date.now() - ts) / 3600000 : 0
  const sla = status.toLowerCase() === 'cerrado' ? '—'
    : valorizado > 2000 ? 'Crítico' : horas > 8 ? 'Crítico' : horas >= 4 ? 'Alerta' : 'Normal'

  return {
    modulo, id: str(r.id), fecha: str(r.fecha), hora: str(r.hora), ts,
    n_semana: r.n_semana == null ? '' : Number(r.n_semana),
    area: str(r.area), tipo: str(r.tipo_incidencia), lpn: str(r.lpn),
    cubeta: str(r.cubeta), estacion: str(r.estacion), articulo: str(r.articulo),
    codigo, descripcion: str(r.descripcion_sku), lote: str(r.lote),
    cantidad, um: str(r.um) || 'Unidad', observacion: str(r.observacion),
    reportado: modulo === 'AUD' ? str(r.auditor) : str(r.reportado),
    status, sla: esApi ? '' : sla, valorizado,
    usuario_picking: str(r.usuario_picking), nombre_picking: str(r.nombre_wms),
    ubicacion_picking: str(r.ubicacion_picking), fecha_modific_wms: str(r.fecha_modific_wms),
    turno_picking: str(r.turno_picking), turno_reg: turnoDe(str(r.hora)),
    ubicacion_hallazgo: str(r.ubicacion_hallazgo), obs_revision: str(r.obs_revision),
    hist_mod: str(r.hist_mod), auxiliar_persona: str(r.auxiliar),
    fecha_revision: str(r.fecha_revision), hora_revision: str(r.hora_revision),
    usuario_revision: str(r.usuario_revision), tiempo_solucion: str(r.tiempo_solucion),
    usuario_cierre: str(r.usuario_cierre), causa_raiz: str(r.causa_raiz),
    fecha_cierre: str(r.fecha_cierre), hora_cierre: str(r.hora_cierre),
    origen: str(r.origen) || 'PWA', usuario_registro: str(r.usuario_registro),
  }
}