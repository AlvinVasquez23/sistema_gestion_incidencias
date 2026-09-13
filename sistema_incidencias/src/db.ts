import { createClient, type Client } from '@libsql/client/web'

export interface Env {
  TURSO_DATABASE_URL: string
  TURSO_AUTH_TOKEN: string
  JWT_SECRET: string
  ALLOWED_ORIGIN: string
}

export const getDb = (env: Env): Client =>
  createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN })