import { createContext, useContext, useState, type ReactNode } from 'react'
import { USUARIOS, type Usuario } from '../data/mock'

const Ctx = createContext<{ user: Usuario | null; login: (u: string, p: string) => boolean; logout: () => void }>(
  { user: null, login: () => false, logout: () => {} },
)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(() => {
    try { const raw = localStorage.getItem('ims_session'); return raw ? JSON.parse(raw) : null } catch { return null }
  })

  const login = (u: string, p: string) => {
    const found = USUARIOS.find(x => x.usuario === u.trim().toLowerCase() && x.password === p)
    if (!found) return false
    localStorage.setItem('ims_session', JSON.stringify(found))
    setUser(found)
    return true
  }
  const logout = () => { localStorage.removeItem('ims_session'); setUser(null) }

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>
}
export const useAuth = () => useContext(Ctx)