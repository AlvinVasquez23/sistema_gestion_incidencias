export interface Usuario {
  usuario: string; password: string; nombre: string; rol: string; esSupervisor: boolean
}
export const USUARIOS: Usuario[] = [
  { usuario: 'decanting01', password: 'decanting01', nombre: 'Auxiliar de decanting', rol: 'decanting_operario', esSupervisor: false },
  { usuario: 'decanting02', password: 'decanting02', nombre: 'Supervisor de decanting', rol: 'decanting_supervisor', esSupervisor: true },
  { usuario: 'reabasto02', password: 'reabasto02', nombre: 'Supervisor de reabasto', rol: 'reabasto_supervisor', esSupervisor: true },
]

export type Modulo = 'AMR' | 'AUD' | 'API' | 'AFR'
export type Status = 'Pendiente' | 'Revisado' | 'Cerrado'
export type Sla = 'Normal' | 'Alerta' | 'Crítico'

export interface Incidencia {
  id: string; modulo: Modulo; fecha: string; hora: string; area: string
  lpn?: string; cubeta?: string; tipo: string; reportado?: string; estacion?: string
  codigo: string; descripcion: string; lote?: string; cantidad: number; um?: string
  observacion?: string; status: Status; sla?: Sla; valorizado: number
}

export const INCIDENCIAS: Incidencia[] = [
  { id: 'INC2026-08051341', modulo: 'AMR', fecha: '05/08/2026', hora: '13:41:01', area: 'Decanting', lpn: 'CJPN00000872642', tipo: 'Diferencia de MP', reportado: 'Pizarro Quispe Mayte', estacion: 'D12', codigo: '7702425808058', descripcion: 'KOTEX PROT DIARIO INDICAD PH CJA 150UND', lote: '2630402815', cantidad: 6, um: 'Caja', observacion: 'La caja llegó 12 pero en sistema figura 24', status: 'Pendiente', sla: 'Crítico', valorizado: 1284.5 },
  { id: 'INC2026-08051340', modulo: 'AMR', fecha: '05/08/2026', hora: '13:40:22', area: 'Decanting', lpn: 'CJPN00000880466', tipo: 'Faltante de plataforma', reportado: 'Martinez Luyo Giannina', estacion: 'D16', codigo: '7702045955682', descripcion: 'KONZIL AC FCOX375ML COLAGENO C VIT B12', lote: 'H513367969', cantidad: 2, um: 'Caja', status: 'Pendiente', sla: 'Alerta', valorizado: 24.34 },
  { id: 'AUD2026-08051400', modulo: 'AUD', fecha: '05/08/2026', hora: '14:00:19', area: 'Reabasto', lpn: 'CJPN00000878179', tipo: 'Sobrante', reportado: 'Pedro Chirinos', codigo: '7750000070062', descripcion: 'PRODUCTO DEMO 7750000070062', lote: '0807026M', cantidad: 1, um: 'Caja', status: 'Pendiente', sla: 'Normal', valorizado: 18.9 },
  { id: 'API-aa0bc7c5', modulo: 'API', fecha: '05/08/2026', hora: '13:54:58', area: 'Apilador', cubeta: '30013725', tipo: 'Sobrante', codigo: '7750000070048', descripcion: 'PRODUCTO DEMO 7750000070048', cantidad: 2, status: 'Pendiente', valorizado: 33.2 },
  { id: 'AFR-00000001', modulo: 'AFR', fecha: '05/08/2026', hora: '12:10:44', area: 'Aframe', cubeta: 'AF-100233', tipo: 'Sobrante', codigo: '7756719010931', descripcion: 'SMOLL PR CR TIN TBX60ML 7 4CH CHOC ME', cantidad: 4, status: 'Pendiente', sla: 'Crítico', valorizado: 2456.8 },
]

export const fmtMoney = (n: number) =>
  'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })