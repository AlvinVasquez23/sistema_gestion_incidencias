import type { ReactNode } from 'react'
import clsx from 'clsx'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

type Tone = 'default' | 'danger' | 'warn' | 'ok' | 'info'

const ICON_TONES: Record<Tone, string> = {
  default: 'text-muted',
  danger: 'text-adecco dark:text-[#ff4d58]',
  warn: 'text-warn',
  ok: 'text-ok',
  info: 'text-info',
}

interface Props {
  label: string
  value: number | string
  icon: ReactNode
  tone?: Tone
  delta?: number | null
  className?: string
}

export default function KpiMini({ label, value, icon, tone = 'default', delta = null, className }: Props) {
  const up = (delta ?? 0) > 0
  const down = (delta ?? 0) < 0
  return (
    <div className={clsx(
      'flex items-start justify-between gap-2 rounded-xl border border-line bg-surface p-3 shadow-card',
      className,
    )}>
      <div className="min-w-0">
        {/* Label + delta en la MISMA línea (el badge ya no empuja el número hacia abajo) */}
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] font-bold uppercase leading-tight tracking-[0.08em] text-muted">
          <span>{label}</span>
          {delta !== null && (
            <span className={clsx(
              'flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-px font-mono text-[9px] font-bold tabular-nums',
              up ? 'bg-red-500/15 text-red-600 dark:text-[#ff4d58]'
                : down ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-surface2 text-muted',
            )}>
              {up ? <TrendingUp size={9} /> : down ? <TrendingDown size={9} /> : <Minus size={9} />}
              {delta > 0 ? '+' : ''}{delta}%
            </span>
          )}
        </p>
        <p className={clsx(
          'mt-1.5 font-mono text-xl font-bold tabular-nums leading-none',
          tone === 'danger' && 'text-adecco dark:text-[#ff4d58]',
        )}>
          {value}
        </p>
      </div>
      <span className={clsx('mt-0.5 shrink-0', ICON_TONES[tone])}>{icon}</span>
    </div>
  )
}