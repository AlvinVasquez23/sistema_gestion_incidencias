import { useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'

const MINUTOS_INACTIVIDAD = 10

/* Cierra la sesión tras 10 min sin actividad del usuario.
   Al volver a entrar, los datos se recargan frescos de Apps Script. */
export default function AutoLogout() {
  const { user, logout } = useAuth()
  const timer = useRef<number | null>(null)
  const ultimo = useRef<number>(Date.now())

  useEffect(() => {
    if (!user) return

    const programar = () => {
      if (timer.current) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => {
        logout()
        window.location.assign('/login')
      }, MINUTOS_INACTIVIDAD * 60 * 1000)
    }

    const reiniciar = () => {
      const ahora = Date.now()
      if (ahora - ultimo.current < 30_000) return   // throttle: máx. 1 reset cada 30 s
      ultimo.current = ahora
      programar()
    }

    const evs = ['click', 'keydown', 'touchstart', 'scroll', 'visibilitychange'] as const
    evs.forEach(e => window.addEventListener(e, reiniciar, { passive: true }))
    ultimo.current = Date.now()
    programar()

    return () => {
      evs.forEach(e => window.removeEventListener(e, reiniciar))
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [user, logout])

  return null
}