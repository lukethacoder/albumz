/// <reference types="@fastify/jwt" />
import type { FastifyRequest, FastifyReply } from 'fastify'
import { db } from '../db/database'
import { AlbumModule } from '../repositories/album.repository'

/**
 * The verified caller identity, taken directly from the signed JWT's `sub`
 * claim. We do not re-fetch the user row per request: the token already asserts
 * this identity. Procedures that need the full user record fetch it explicitly
 * (see `auth.router` `profile`), making that cost visible at the call site.
 */
export interface Identity {
  id: string
}

export interface Context {
  req: FastifyRequest
  res: FastifyReply
  db: typeof db
  user: Identity | null
  albums: AlbumModule
}

export async function createContext({
  req,
  res,
}: {
  req: FastifyRequest
  res: FastifyReply
}): Promise<Context> {
  let user: Identity | null = null

  // Verify the JWT if present. The `sub` claim is the trusted identity;
  // no database lookup is performed here.
  try {
    const decoded = await req.jwtVerify<{ sub: string }>()

    if (decoded?.sub) {
      user = { id: decoded.sub }
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
