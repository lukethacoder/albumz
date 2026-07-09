/// <reference types="@fastify/jwt" />
import type { FastifyRequest, FastifyReply } from 'fastify'
import { db } from '../db/database'
import type { User } from '../db/schema'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { AlbumModule } from '../repositories/album.repository'

export interface Context {
  req: FastifyRequest
  res: FastifyReply
  db: typeof db
  user: User | null
  albums: AlbumModule
}

export async function createContext({
  req,
  res,
}: {
  req: FastifyRequest
  res: FastifyReply
}): Promise<Context> {
  let user: User | null = null

  // Try to verify JWT and fetch user if token is present
  try {
    const decoded = await req.jwtVerify<{ sub: string }>()

    if (decoded?.sub) {
      // Fetch user from database
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, decoded.sub))
        .limit(1)

      user = dbUser || null
    }
  } catch {
    // JWT verification failed or no token present - user remains null
  }

  return {
    req,
    res,
    db,
    user,
    albums: new AlbumModule(db),
  }
}

export type ContextType = Awaited<ReturnType<typeof createContext>>
