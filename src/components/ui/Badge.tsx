import type { ReactNode } from 'react'
import clsx from 'clsx'

export type Tone = 'red' | 'amber' | 'emerald' | 'cyan' | 'gray'

/* Variante suave (tinte 15%) */
const TONES: Record<Tone, string> = {
  red:     'border-red-500/30 bg-red-500/15 text-red-600 dark:text-[#ff4d58]',
  amber:   'border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400',
  emerald: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  cyan:    'border-sky-500/30 bg-sky-500/15 text-sky-600 dark:text-sky-400',
  gray:    'border-slate-400/30 bg-slate-400/15 text-slate-600 dark:text-slate-400',
}

/* Variante SÓLIDA: fondo de color + letra blanca (Status y Semáforo SLA) */
const SOLID: Record<Tone, string> = {
  red:     'bg-[#E30613] text-white',
  amber:   'bg-[#F59E0B] text-white',
  emerald: 'bg-[#059669] text-white',
  cyan:    'bg-[#0284C7] text-white',
  gray:    'bg-[#64748B] text-white',
}

export function Badge({ tone, children, pulse, solid }: { tone: Tone; children: ReactNode; pulse?: boolean; solid?: boolean }) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider',
      solid ? SOLID[tone] : clsx('border', TONES[tone]),
    )}>
      <span className={clsx('h-1.5 w-1.5 rounded-full', solid ? 'bg-white' : 'bg-current', pulse && 'animate-pulse')} />
      {children}
    </span>
  )
}

/* Status sólido: Pendiente=ámbar · Revisado=cian · Cerrado=esmeralda */
export const statusTone = (s: string): Tone =>
  s === 'Pendiente' ? 'amber' : s === 'Revisado' ? 'cyan' : 'emerald'

/* Semáforo SLA sólido: Normal=verde · Alerta=amarillo · Crítico=rojo */
export const slaTone = (s: string): Tone =>
  s === 'Crítico' ? 'red' : s === 'Alerta' ? 'amber' : 'emerald'