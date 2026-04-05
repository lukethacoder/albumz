import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import type { ContextType } from './context'

// Initialize tRPC with context type
const t = initTRPC.context<ContextType>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape
  },
})

// Export reusable router and procedure helpers
export const router = t.router
export const publicProcedure = t.procedure

// Protected procedure - requires authentication
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    })
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // user is now guaranteed to be non-null
    },
  })
})
