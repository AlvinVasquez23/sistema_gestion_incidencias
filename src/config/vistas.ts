/* ===== Configuración de columnas por módulo (espejo de la webapp Apps Script) ===== */
export type ColKey =
  | 'fecha' | 'area' | 'tipo' | 'lpn' | 'cubeta' | 'auxiliar' | 'codigo'
  | 'cantidad' | 'valorizado' | 'status' | 'sla' | 'observacion' | 'acc'

export interface VistaCfg {
  titulo: string
  cols: ColKey[]
  conStatus: boolean
  conValorizado: boolean
}

export const VISTAS: Record<string, VistaCfg> = {
  pool: { titulo: 'Pool de Incidencias', cols: ['fecha', 'sla', 'area', 'tipo', 'lpn', 'codigo', 'valorizado', 'status', 'acc'], conStatus: true, conValorizado: true },
  amr:  { titulo: 'Incidencias AMR',      cols: ['fecha', 'sla', 'tipo', 'lpn', 'codigo', 'valorizado', 'status', 'acc'], conStatus: true, conValorizado: true },
  aud:  { titulo: 'Auditorías Reaba',     cols: ['fecha', 'sla', 'tipo', 'lpn', 'codigo', 'valorizado', 'status', 'acc'], conStatus: true, conValorizado: true },
  api:  { titulo: 'Incidencias Apilador', cols: ['fecha', 'cubeta', 'tipo', 'codigo', 'cantidad', 'observacion'], conStatus: false, conValorizado: false },
  afr:  { titulo: 'Incidencias AFRAME',   cols: ['fecha', 'cubeta', 'tipo', 'codigo', 'cantidad', 'observacion'], conStatus: false, conValorizado: false },
  auxp: { titulo: 'Incidencias de personal', cols: ['fecha', 'auxiliar', 'lpn', 'tipo', 'codigo', 'cantidad', 'observacion'], conStatus: false, conValorizado: false },
}

export const TIT_COLS: Record<ColKey, string> = {
  fecha: 'Fecha', area: 'Área', tipo: 'Tipo', lpn: 'LPN', cubeta: 'Cubeta', auxiliar: 'Auxiliar',
  codigo: 'SKU / Descripción', cantidad: 'Cant.', valorizado: 'Valorizado',
  status: 'Status', sla: 'Estado', observacion: 'Observación', acc: 'Acciones',
}

/* ===== Columnas del CSV por módulo (encabezados iguales a las hojas) ===== */
const CSV_LARGO = [
  { key: 'id', head: 'id' }, { key: 'fecha', head: 'fecha' }, { key: 'hora', head: 'hora' },
  { key: 'lpn', head: 'lpn' }, { key: 'tipo', head: 'tipo_incidencia' }, { key: 'reportado', head: 'reportado' },
  { key: 'estacion', head: 'estacion' }, { key: 'codigo', head: 'codigo' }, { key: 'lote', head: 'lote' },
  { key: 'cantidad', head: 'cantidad' }, { key: 'um', head: 'um' }, { key: 'observacion', head: 'observacion' },
  { key: 'status', head: 'status' }, { key: 'fecha_revision', head: 'fecha_revision' },
  { key: 'hora_revision', head: 'hora_revision' }, { key: 'usuario_revision', head: 'usuario_revision' },
  { key: 'turno_picking', head: 'turno_picking' }, { key: 'usuario_picking', head: 'usuario_picking' },
  { key: 'ubicacion_picking', head: 'ubicacion_picking' }, { key: 'fecha_modific_wms', head: 'fecha_modific_wms' },
  { key: 'ubicacion_hallazgo', head: 'ubicacion_hallazgo' }, { key: 'obs_revision', head: 'obs_revision' },
  { key: 'valorizado', head: 'valorizado' }, { key: 'usuario_cierre', head: 'usuario_cierre' },
  { key: 'causa_raiz', head: 'causa_raiz' }, { key: 'fecha_cierre', head: 'fecha_cierre' },
  { key: 'hora_cierre', head: 'hora_cierre' },
]
const CSV_CORTO = [
  { key: 'fecha', head: 'fecha' }, { key: 'hora', head: 'hora' }, { key: 'cubeta', head: 'cubeta' },
  { key: 'tipo', head: 'tipo_incidencia' }, { key: 'codigo', head: 'articulo' },
  { key: 'cantidad', head: 'cantidad' }, { key: 'observacion', head: 'observacion' },
]
const CSV_AUX = [
  { key: 'id', head: 'id' }, { key: 'fecha', head: 'fecha' }, { key: 'hora', head: 'hora' },
  { key: 'auxiliar_persona', head: 'auxiliar' }, { key: 'lpn', head: 'lpn' },
  { key: 'tipo', head: 'tipo_incidencia' }, { key: 'codigo', head: 'articulo' },
  { key: 'cantidad', head: 'cantidad' }, { key: 'observacion', head: 'observacion' },
  { key: 'origen', head: 'origen' }, { key: 'usuario_registro', head: 'usuario_registro' },
]
export const CSV_DE_VISTA: Record<string, { key: string; head: string }[]> = {
  pool: CSV_LARGO, amr: CSV_LARGO, aud: CSV_LARGO, api: CSV_CORTO, afr: CSV_CORTO, auxp: CSV_AUX,
}