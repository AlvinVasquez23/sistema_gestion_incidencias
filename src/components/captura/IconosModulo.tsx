/* Íconos ilustrativos por módulo (SVG inline, sin dependencias) */
export function IconoModulo({ k, className }: { k: 'amr' | 'aud' | 'api' | 'afr'; className?: string }) {
  const c = className ?? 'h-12 w-12'
  if (k === 'amr') {
    return (
      <svg viewBox="0 0 48 48" className={c} fill="none">
        <rect x="6" y="14" width="26" height="22" rx="3" fill="#E30613" />
        <rect x="6" y="14" width="26" height="7" rx="3" fill="#b8050f" />
        <path d="M19 21v15M6 25h26" stroke="#fff" strokeWidth="1.6" strokeDasharray="3 2" />
        <circle cx="34" cy="30" r="8" stroke="#E30613" strokeWidth="3" fill="#fff" />
        <path d="M40 36l6 6" stroke="#E30613" strokeWidth="3" strokeLinecap="round" />
      </svg>
    )
  }
  if (k === 'aud') {
    return (
      <svg viewBox="0 0 48 48" className={c} fill="none">
        <rect x="9" y="6" width="30" height="36" rx="4" fill="#fff" stroke="#E30613" strokeWidth="3" />
        <rect x="17" y="3" width="14" height="8" rx="2" fill="#E30613" />
        <path d="M16 20h16M16 27h16" stroke="#b8050f" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M17 34l4 4 9-9" stroke="#059669" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (k === 'api') {
    return (
      <svg viewBox="0 0 48 48" className={c} fill="none">
        <path d="M8 40h32" stroke="#b8050f" strokeWidth="3" strokeLinecap="round" />
        <rect x="10" y="18" width="16" height="14" rx="2" fill="#E30613" />
        <path d="M30 40V14l8 6v20" stroke="#E30613" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="16" cy="42" r="3.5" fill="#b8050f" />
        <circle cx="32" cy="42" r="3.5" fill="#b8050f" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 48 48" className={c} fill="none">
      <path d="M8 6v36M40 6v36" stroke="#E30613" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M8 16h32M8 28h32" stroke="#b8050f" strokeWidth="3" strokeLinecap="round" />
      <rect x="15" y="9" width="8" height="7" rx="1.5" fill="#E30613" />
      <rect x="26" y="21" width="8" height="7" rx="1.5" fill="#E30613" />
      <rect x="15" y="33" width="8" height="7" rx="1.5" fill="#b8050f" />
    </svg>
  )
}