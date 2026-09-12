import { SignJWT, jwtVerify } from 'jose'

export interface SessionPayload {
  usuario: string
  nombre: string
  rol: string
  esSupervisor: boolean
  esAdmin: boolean
}

const key = (secret: string) => new TextEncoder().encode(secret)

export async function signToken(p: SessionPayload, secret: string): Promise<string> {
  return new SignJWT({ ...p } as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key(secret))
}

export async function verifyToken(token: string, secret: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key(secret))
    return {
      usuario: String(payload.usuario ?? ''),
      nombre: String(payload.nombre ?? ''),
      rol: String(payload.rol ?? ''),
      esSupervisor: Boolean(payload.esSupervisor),
      esAdmin: Boolean(payload.esAdmin),
    }
  } catch {
    return null
  }
}