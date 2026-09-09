import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export interface Prefs {
  densidad: 'comoda' | 'compacta'
  porPagina: 8 | 15 | 30
  moduloInicio: '/' | '/pool'
  sidebarColapsada: boolean
}

const DEFAULTS: Prefs = {
  densidad: 'comoda',
  porPagina: 8,
  moduloInicio: '/',
  sidebarColapsada: false,
}

const KEY = 'ims_prefs'

function cargar(): Prefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Prefs>) }
    /* Migra la preferencia vieja de sidebar si existe */
    const legacy = localStorage.getItem('ims_sidebar')
    if (legacy !== null) return { ...DEFAULTS, sidebarColapsada: legacy === '1' }
    return DEFAULTS
  } catch {
    return DEFAULTS
  }
}

interface SettingsCtx {
  prefs: Prefs
  actualizar: (patch: Partial<Prefs>) => void
}
const Ctx = createContext<SettingsCtx>(null!)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(cargar)
  const actualizar = (patch: Partial<Prefs>) => {
    setPrefs(p => {
      const next = { ...p, ...patch }
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }
  const value = useMemo(() => ({ prefs, actualizar }), [prefs])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export const useSettings = () => useContext(Ctx)