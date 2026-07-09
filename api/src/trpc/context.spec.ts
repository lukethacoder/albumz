// Stub the DB singleton so importing the context does not pull in varlock/env
// or open a real Postgres pool. These tests exercise identity derivation only,
// which since issue 06 performs no database access.
jest.mock('../db/database', () => ({ db: {}, pgPool: {} }))

import type { FastifyRequest, FastifyReply } from 'fastify'
import { createContext } from './context'

/**
 * Auth-identity tests. Since issue 06, `createContext` derives the caller's
 * identity straight from the verified JWT `sub` claim and performs no
 * per-request `users` SELECT. These tests pin that contract:
 *
 *  - a valid token yields `{ id: sub }`
 *  - an expired / garbage / absent token yields `null` (→ UNAUTHORIZED via
 *    `protectedProcedure`, see `guardIdentity` below)
 *  - a token for a since-deleted user still yields an identity — the recorded
 *    decision (identity-from-token) means deletion is not enforced until the
 *    token expires. The full-row fetch that would reject a deleted user now
 *    lives only in the `profile` procedure.
 */

const SUB = '11111111-1111-1111-1111-111111111111'

/** Build a fake Fastify request whose `jwtVerify` mimics @fastify/jwt. */
function fakeReq(verify: () => Promise<{ sub: string }>): FastifyRequest {
  return { jwtVerify: verify } as unknown as FastifyRequest
}

const res = {} as FastifyReply

describe('createContext — identity from token', () => {
  it('carries { id: sub } for a valid token, without a DB lookup', async () => {
    const ctx = await createContext({
      req: fakeReq(() => Promise.resolve({ sub: SUB })),
      res,
    })

    expect(ctx.user).toEqual({ id: SUB })
  })

  it('yields a null identity for an expired or garbage token', async () => {
    const ctx = await createContext({
      req: fakeReq(() =>
        Promise.reject(new Error('Authorization token expired')),
      ),
      res,
    })

    expect(ctx.user).toBeNull()
  })

  it('yields a null identity when no token is present', async () => {
    const ctx = await createContext({
      req: fakeReq(() =>
        Promise.reject(new Error('No Authorization was found')),
      ),
      res,
    })

    expect(ctx.user).toBeNull()
  })

  it('still carries an identity for a deleted user (deletion not enforced per request)', async () => {
    // The token verifies; whether the user row still exists is irrelevant here
    // because no SELECT is performed. This is the recorded semantic trade-off.
    const ctx = await createContext({
      req: fakeReq(() => Promise.resolve({ sub: SUB })),
      res,
    })

    expect(ctx.user).toEqual({ id: SUB })
  })
})
