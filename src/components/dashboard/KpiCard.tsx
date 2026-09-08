import type { ReactNode } from 'react'
import clsx from 'clsx'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Props {
  label: string
  value: string | number
  sub?: string
  delta?: number | null   // % vs día anterior
  goodWhenUp?: boolean    // en incidencias, subir suele ser malo
  children?: ReactNode
  className?: string
}

export default function KpiCard({ label, value, sub, delta = null, goodWhenUp = false, children, className }: Props) {
  const up = (delta ?? 0) > 0
  const down = (delta ?? 0) < 0
  const good = up ? goodWhenUp : down ? !goodWhenUp : true

  return (
    <div className={clsx('flex flex-col rounded-xl border border-line bg-surface p-4 shadow-card', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</p>
        {delta !== null && (
          <span className={clsx(
            'flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold tabular-nums',
            good ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                 : 'bg-red-500/15 text-red-600 dark:text-[#ff4d58]',
          )}>
            {up ? <TrendingUp size={11} /> : down ? <TrendingDown size={11} /> : <Minus size={11} />}
            {delta > 0 ? '+' : ''}{delta}%
          </span>
        )}
      </div>
      <p className="mt-2 font-mono text-3xl font-bold tabular-nums tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  )
}