/* ===== Gráficos SVG sin dependencias (estilo command-center) ===== */

export function Sparkline({ values, stroke = '#00A3FF', height = 36 }: { values: number[]; stroke?: string; height?: number }) {
  const w = 100, h = 32
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1           // escala min-max: amplifica la variación real
  const n = Math.max(values.length - 1, 1)
  const pts = values.map((v, i) => [
    (i / n) * w,
    h - 5 - ((v - min) / range) * (h - 12),
  ])
  const line = pts.map(p => p.join(',')).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height }} className="w-full">
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={stroke} opacity={0.12} />
      <polyline points={line} fill="none" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={1.5} fill={stroke} />
      ))}
    </svg>
  )
}

export function MiniBars({ values, color = 'rgba(255,255,255,0.5)', height = 40 }: { values: number[]; color?: string; height?: number }) {
  const max = Math.max(...values, 1)
  return (
    <svg viewBox={`0 0 ${values.length * 10} 32`} preserveAspectRatio="none" style={{ height }} className="w-full">
      {values.map((v, i) => {
        const bh = (v / max) * 28 + 2
        return <rect key={i} x={i * 10 + 2} y={32 - bh} width={6} height={bh} rx={1.5} fill={color} />
      })}
    </svg>
  )
}

export function Donut({ segments, size = 150 }: { segments: { value: number; color: string; label: string }[]; size?: number }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const R = 15.9155
  let acc = 0
  return (
    <svg viewBox="0 0 42 42" style={{ width: size, height: size }} className="shrink-0">
      <circle cx="21" cy="21" r={R} fill="none" stroke="currentColor" strokeWidth="5" className="text-line" opacity={0.35} />
      {segments.map((s, i) => {
        const frac = (s.value / total) * 100
        const el = (
          <circle
            key={i} cx="21" cy="21" r={R} fill="none" stroke={s.color} strokeWidth="5"
            strokeDasharray={`${frac} ${100 - frac}`} strokeDashoffset={-acc}
            transform="rotate(-90 21 21)"
          />
        )
        acc += frac
        return el
      })}
    </svg>
  )
}