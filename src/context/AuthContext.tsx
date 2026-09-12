import { createContext, useContext, useState, type ReactNode } from 'react'
import { USUARIOS } from '../data/mock'
import { apiActiva, loginApi } from '../services/api'

export interface SessionUser {
  usuario: string; nombre: string; rol: string; esSupervisor: boolean; esAdmin: boolean
}

interface AuthCtx {
  user: SessionUser | null
  login: (u: string, p: string) => Promise<SessionUser | null>
  logout: () => void
}
const Ctx = createContext<AuthCtx>(null!)

function cargarSesion(): SessionUser | null {
  try {
    const raw = localStorage.getItem('ims_session')
    return raw ? (JSON.parse(raw) as SessionUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(cargarSesion)

  const login = async (u: string, p: string): Promise<SessionUser | null> => {
    /* Con API activa: valida contra la hoja usuarios de Google Sheets */
    if (apiActiva()) {
      let r: Awaited<ReturnType<typeof loginApi>> | null = null
      try {
        r = await loginApi(u, p)
      } catch {
        r = null   // red caída: fallback a mock
      }
      if (r) {
        if (!r.ok) return null
        const ses: SessionUser = {
          usuario: r.usuario ?? u,
          nombre: r.nombre ?? u,
          rol: r.rol ?? '',
          esSupervisor: !!r.esSupervisor, esAdmin: !!r.esAdmin,
        }
        localStorage.setItem('ims_token', r.token ?? ses.usuario)
        localStorage.setItem('ims_session', JSON.stringify(ses))
        setUser(ses)
        return ses
      }
    }
    /* Sin API o red caída: usuarios mock locales */
    const found = USUARIOS.find(x => x.usuario === u.trim().toLowerCase() && x.password === p)
    if (!found) return null
    const ses: SessionUser = {
      usuario: found.usuario, nombre: found.nombre, rol: found.rol, esSupervisor: found.esSupervisor, esAdmin: false,
    }
    localStorage.setItem('ims_token', ses.usuario)
    localStorage.setItem('ims_session', JSON.stringify(ses))
    setUser(ses)
    return ses
  }

  const logout = () => {
    localStorage.removeItem('ims_session')
    localStorage.removeItem('ims_token')
    setUser(null)
  }

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>
}
export const useAuth = () => useContext(Ctx)