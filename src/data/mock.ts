/* ===== Datos mock con la MISMA forma que devolverá Apps Script en el Paso 5 ===== */
export interface Usuario {
  usuario: string; password: string; nombre: string; rol: string; esSupervisor: boolean
}
export const USUARIOS: Usuario[] = [
  { usuario: 'decanting01', password: 'decanting01', nombre: 'Auxiliar de decanting', rol: 'decanting_operario', esSupervisor: false },
  { usuario: 'decanting02', password: 'decanting02', nombre: 'Supervisor de decanting', rol: 'decanting_supervisor', esSupervisor: true },
  { usuario: 'reabasto02', password: 'reabasto02', nombre: 'Supervisor de reabasto', rol: 'reabasto_supervisor', esSupervisor: true },
]

/* ===== Usuarios WMS mock: el detalle busca el nombre por código ===== */
export const WMS_USERS: Record<string, string> = {
  'WMS-4412': 'Rojas Medina Luis',
  'WMS-1087': 'Campos Torres Ana',
  'WMS-2231': 'Vilca Quispe Jorge',
  'WMS-3305': 'Salas Herrera Rosa',
}

export type Modulo = 'AMR' | 'AUD' | 'API' | 'AFR'
export type Status = 'Pendiente' | 'Revisado' | 'Cerrado'
export type Sla = 'Normal' | 'Alerta' | 'Crítico'

export interface Incidencia {
  id: string; modulo: Modulo; fecha: string; hora: string; area: string
  lpn?: string; cubeta?: string; tipo: string; reportado?: string; estacion?: string
  codigo: string; descripcion: string; lote?: string; cantidad: number; um?: string
  observacion?: string; status: Status; sla?: Sla; valorizado: number
  /* Campos de revisión */
  turno_picking?: string; usuario_picking?: string; nombre_picking?: string
  ubicacion_picking?: string; fecha_modific_wms?: string; ubicacion_hallazgo?: string
  obs_revision?: string; usuario_revision?: string; fecha_revision?: string; hora_revision?: string
  /* Campos de cierre */
  causa_raiz?: string; usuario_cierre?: string; fecha_cierre?: string; hora_cierre?: string
}

export const INCIDENCIAS: Incidencia[] = [
  { id: 'INC2026-08051341', modulo: 'AMR', fecha: '05/08/2026', hora: '13:41:01', area: 'Decanting', lpn: 'CJPN00000872642', tipo: 'Diferencia de MP', reportado: 'Pizarro Quispe Mayte', estacion: 'D12', codigo: '7702425808058', descripcion: 'KOTEX PROT DIARIO INDICAD PH CJA 150UND', lote: '2630402815', cantidad: 6, um: 'Caja', observacion: 'La caja llegó 12 pero en sistema figura 24', status: 'Pendiente', sla: 'Crítico', valorizado: 1284.5 },
  { id: 'INC2026-08051340', modulo: 'AMR', fecha: '05/08/2026', hora: '13:40:22', area: 'Decanting', lpn: 'CJPN00000880466', tipo: 'Faltante de plataforma', reportado: 'Martinez Luyo Giannina', estacion: 'D16', codigo: '7702045955682', descripcion: 'KONZIL AC FCOX375ML COLAGENO C VIT B12', lote: 'H513367969', cantidad: 2, um: 'Caja', status: 'Pendiente', sla: 'Alerta', valorizado: 24.34 },
  { id: 'INC2026-08051339', modulo: 'AMR', fecha: '05/08/2026', hora: '13:39:57', area: 'Decanting', lpn: 'CJPN00000878029', tipo: 'Faltante de origen', reportado: 'Garcia Catashunga Gissela', estacion: 'D22', codigo: '7750000070086', descripcion: 'PRODUCTO DEMO 7750000070086', lote: '0309826M', cantidad: 1, um: 'Caja', status: 'Cerrado', valorizado: 42.75, turno_picking: 'Turno 1', usuario_picking: 'WMS-4412', ubicacion_picking: 'D22-08', obs_revision: 'Validado contra WMS', usuario_revision: 'decanting02', fecha_revision: '05/08/2026', hora_revision: '16:20:41', causa_raiz: 'Mal Reabasto', usuario_cierre: 'decanting02', fecha_cierre: '05/08/2026', hora_cierre: '18:02:11' },
  { id: 'INC2026-08041201', modulo: 'AMR', fecha: '04/08/2026', hora: '12:01:44', area: 'Reabasto', lpn: 'CJPN00000876120', tipo: 'Producto mal decantado', reportado: 'Quispe Ramos Luis', estacion: 'R12', codigo: '7750443210', descripcion: 'ACEITE VEGETAL PREMIUM 1L X12', cantidad: 4, um: 'Caja', status: 'Pendiente', sla: 'Normal', valorizado: 156.0 },
  { id: 'INC2026-08041155', modulo: 'AMR', fecha: '04/08/2026', hora: '11:55:10', area: 'Decanting', lpn: 'CJPN00000876088', tipo: 'Diferencia de MP', reportado: 'Pizarro Quispe Mayte', estacion: 'D16', codigo: '7702045955682', descripcion: 'KONZIL AC FCOX375ML COLAGENO C VIT B12', cantidad: 12, um: 'Caja', status: 'Revisado', sla: 'Normal', valorizado: 320.4, turno_picking: 'Turno 1', usuario_picking: 'WMS-4412', ubicacion_picking: 'D16-04', obs_revision: 'Se validó conteo con WMS', usuario_revision: 'decanting02', fecha_revision: '04/08/2026', hora_revision: '15:12:03' },
  { id: 'INC2026-08031045', modulo: 'AMR', fecha: '03/08/2026', hora: '10:45:31', area: 'Decanting', lpn: 'CJPN00000874501', tipo: 'Faltante de origen', reportado: 'Garcia Catashunga Gissela', estacion: 'D21', codigo: '7750000070062', descripcion: 'PRODUCTO DEMO 7750000070062', cantidad: 2, um: 'Caja', status: 'Cerrado', valorizado: 37.8, usuario_revision: 'decanting01', fecha_revision: '03/08/2026', hora_revision: '12:00:00', causa_raiz: 'Mala Recepción', usuario_cierre: 'decanting02', fecha_cierre: '03/08/2026', hora_cierre: '19:41:22' },
  { id: 'INC2026-08021322', modulo: 'AMR', fecha: '02/08/2026', hora: '13:22:08', area: 'Reabasto', lpn: 'CJPN00000872014', tipo: 'Producto mal decantado', reportado: 'Quispe Ramos Luis', estacion: 'R12', codigo: '7756719010931', descripcion: 'SMOLL PR CR TIN TBX60ML 7 4CH CHOC ME', cantidad: 8, um: 'Caja', status: 'Pendiente', sla: 'Crítico', valorizado: 2456.8 },
  { id: 'INC2026-08011512', modulo: 'AMR', fecha: '01/08/2026', hora: '15:12:50', area: 'Decanting', lpn: 'CJPN00000870122', tipo: 'Diferencia de MP', reportado: 'Martinez Luyo Giannina', estacion: 'D18', codigo: '4005900998385', descripcion: 'NIV MICELAR MATE PIEL MIXT A GRASA 400ML', cantidad: 10, um: 'Caja', status: 'Revisado', sla: 'Alerta', valorizado: 890.2, usuario_revision: 'decanting02', fecha_revision: '01/08/2026', hora_revision: '17:05:12' },
  { id: 'INC2026-07311801', modulo: 'AMR', fecha: '31/07/2026', hora: '18:01:12', area: 'Decanting', lpn: 'CJPN00000868740', tipo: 'Faltante de plataforma', reportado: 'Pizarro Quispe Mayte', estacion: 'D16', codigo: '7750000070048', descripcion: 'PRODUCTO DEMO 7750000070048', cantidad: 3, um: 'Caja', status: 'Cerrado', valorizado: 49.8, causa_raiz: 'Mal Decanting', usuario_cierre: 'decanting02', fecha_cierre: '01/08/2026', hora_cierre: '08:15:00' },
  { id: 'INC2026-07301201', modulo: 'AMR', fecha: '30/07/2026', hora: '12:01:03', area: 'Reabasto', lpn: 'CJPN00000866215', tipo: 'Producto mal decantado', reportado: 'Quispe Ramos Luis', estacion: 'R12', codigo: '7751523000581', descripcion: 'WAWASANA CJAX20UND TE VERDE & PIA', cantidad: 5, um: 'Caja', status: 'Cerrado', valorizado: 16.0, causa_raiz: 'Mal Almacenamiento', usuario_cierre: 'reabasto02', fecha_cierre: '30/07/2026', hora_cierre: '20:10:45' },
  { id: 'AUD2026-08051400', modulo: 'AUD', fecha: '05/08/2026', hora: '14:00:19', area: 'Reabasto', lpn: 'CJPN00000878179', tipo: 'Sobrante', reportado: 'Pedro Chirinos', codigo: '7750000070062', descripcion: 'PRODUCTO DEMO 7750000070062', lote: '0807026M', cantidad: 1, um: 'Caja', status: 'Pendiente', sla: 'Normal', valorizado: 18.9 },
  { id: 'AUD2026-08051401', modulo: 'AUD', fecha: '05/08/2026', hora: '14:01:33', area: 'Reabasto', lpn: 'CJPN00000878221', tipo: 'Conforme', reportado: 'Pedro Chirinos', codigo: '', descripcion: '', cantidad: 0, status: 'Cerrado', valorizado: 0, causa_raiz: 'Mal Reabasto', usuario_cierre: 'reabasto02', fecha_cierre: '05/08/2026', hora_cierre: '15:00:00' },
  { id: 'AUD2026-08041230', modulo: 'AUD', fecha: '04/08/2026', hora: '12:30:27', area: 'Reabasto', lpn: 'CJPN00000876450', tipo: 'Merma', reportado: 'Maria Lopez', codigo: '7751523000581', descripcion: 'WAWASANA CJAX20UND TE VERDE & PIA', cantidad: 3, um: 'Caja', status: 'Revisado', sla: 'Alerta', valorizado: 145.6, usuario_revision: 'reabasto02', fecha_revision: '04/08/2026', hora_revision: '14:22:10' },
  { id: 'AUD2026-08031115', modulo: 'AUD', fecha: '03/08/2026', hora: '11:15:44', area: 'Reabasto', lpn: 'CJPN00000874880', tipo: 'Sobrante', reportado: 'Pedro Chirinos', codigo: '7756719010931', descripcion: 'SMOLL PR CR TIN TBX60ML 7 4CH CHOC ME', cantidad: 2, um: 'Caja', status: 'Pendiente', sla: 'Normal', valorizado: 614.2 },
  { id: 'API-aa0bc7c5', modulo: 'API', fecha: '05/08/2026', hora: '13:54:58', area: 'Apilador', cubeta: '30013725', tipo: 'Sobrante', codigo: '7750000070048', descripcion: 'PRODUCTO DEMO 7750000070048', cantidad: 2, status: 'Pendiente', valorizado: 33.2 },
  { id: 'API-8b6645e8', modulo: 'API', fecha: '05/08/2026', hora: '13:55:13', area: 'Apilador', cubeta: '10031569', tipo: 'Sobrante', codigo: '4005900998385', descripcion: 'NIV MICELAR MATE PIEL MIXT A GRASA 400ML', cantidad: 2, status: 'Pendiente', valorizado: 21.4 },
  { id: 'API-7c21d3a9', modulo: 'API', fecha: '04/08/2026', hora: '09:12:40', area: 'Apilador', cubeta: '20045511', tipo: 'Merma', codigo: '7750443210', descripcion: 'ACEITE VEGETAL PREMIUM 1L X12', cantidad: 5, status: 'Pendiente', valorizado: 210.0 },
  { id: 'AFR-00000001', modulo: 'AFR', fecha: '05/08/2026', hora: '12:10:44', area: 'Aframe', cubeta: 'AF-100233', tipo: 'Sobrante', codigo: '7756719010931', descripcion: 'SMOLL PR CR TIN TBX60ML 7 4CH CHOC ME', cantidad: 4, status: 'Pendiente', valorizado: 2456.8 },
  { id: 'AFR-00000002', modulo: 'AFR', fecha: '05/08/2026', hora: '11:02:10', area: 'Aframe', cubeta: 'AF-100234', tipo: 'Merma', codigo: '7751523000581', descripcion: 'WAWASANA CJAX20UND TE VERDE & PIA', cantidad: 3, status: 'Pendiente', valorizado: 9.6 },
  { id: 'AFR-00000003', modulo: 'AFR', fecha: '04/08/2026', hora: '16:40:02', area: 'Aframe', cubeta: 'AF-100240', tipo: 'Con sistémico', codigo: '7702425808058', descripcion: 'KOTEX PROT DIARIO INDICAD PH CJA 150UND', cantidad: 1, status: 'Pendiente', valorizado: 214.08 },
]

export const fmtMoney = (n: number) =>
  'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })