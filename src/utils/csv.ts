/* Parser CSV mínimo: BOM, separador ; o ,, campos entre comillas */
export function parseCsv(texto: string): string[][] {
  const t = texto.replace(/^\uFEFF/, '')
  const primera = t.split(/\r?\n/)[0] ?? ''
  const delim = (primera.match(/;/g)?.length ?? 0) >= (primera.match(/,/g)?.length ?? 0) ? ';' : ','
  const rows: string[][] = []
  let row: string[] = [], campo = '', comillas = false
  for (let i = 0; i < t.length; i++) {
    const ch = t[i]
    if (comillas) {
      if (ch === '"') { if (t[i + 1] === '"') { campo += '"'; i++ } else comillas = false }
      else campo += ch
    } else if (ch === '"') comillas = true
    else if (ch === delim) { row.push(campo); campo = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && t[i + 1] === '\n') i++
      row.push(campo); campo = ''
      if (row.some(c => c.trim() !== '')) rows.push(row)
      row = []
    } else campo += ch
  }
  row.push(campo)
  if (row.some(c => c.trim() !== '')) rows.push(row)
  return rows
}

/* Plantilla descargable con el mismo formato del export de la app (; + BOM) */
export function descargarPlantilla(nombre: string, encabezados: string[], ejemplo: string[]) {
  const blob = new Blob(['\uFEFF' + [encabezados.join(';'), ejemplo.join(';')].join('\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = nombre
  a.click()
  URL.revokeObjectURL(a.href)
}