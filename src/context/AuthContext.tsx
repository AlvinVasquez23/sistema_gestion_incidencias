import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, apiActiva } from '../services/api'

export interface User {
  usuario: string; nombre: string; rol: string
  esSupervisor: boolean; esAdmin: boolean
}
interface AuthCtx {
  user: User | null
  cargando: boolean
  login: (usuario: string, password: string) => Promise<User>
  logout: () => void
}
const Ctx = createContext<AuthCtx>(null!)

const USER_KEY = 'ims_user'
const TOKEN_KEY = 'ims_token'

function jwtValido(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now()
  } catch { return false }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    const saved = localStorage.getItem(USER_KEY)
    if (token && jwtValido(token) && saved) {
      try { setUser(JSON.parse(saved) as User) } catch { /* ignorar */ }
    } else {
      localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY)
    }
    setCargando(false)
  }, [])

  useEffect(() => {
    const onExpired = () => { localStorage.removeItem(USER_KEY); setUser(null) }
    window.addEventListener('ims:session-expirada', onExpired)
    return () => window.removeEventListener('ims:session-expirada', onExpired)
  }, [])

  const login = useCallback(async (usuario: string, password: string): Promise<User> => {
    if (!apiActiva()) throw new Error('API no configurada (falta VITE_WORKER_URL)')
    const r = await api.login(usuario, password)
    localStorage.setItem(TOKEN_KEY, r.token)
    const u: User = { 
      usuario: r.usuario, 
      nombre: r.nombre, 
      rol: r.rol, 
      esSupervisor: r.esSupervisor, 
      esAdmin: r.esAdmin 
    }
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    setUser(u)
    return u  // ← Retornar el usuario para que Login.tsx pueda usarlo
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  return <Ctx.Provider value={{ user, cargando, login, logout }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)