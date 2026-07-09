/// <reference types="@fastify/jwt" />
import { TRPCError } from '@trpc/server'
import { router, publicProcedure, protectedProcedure } from '../trpc/trpc'
import { registerSchema, loginSchema } from '../schemas/auth.schema'
import { AuthService } from '../services/auth.service'
import { UserRepository } from '../repositories/user.repository'
import { passwordService } from '../services/password.service'

export const authRouter = router({
  hasUsers: publicProcedure.query(async ({ ctx }) => {
    const userRepo = new UserRepository(ctx.db)
    return userRepo.hasUsers()
  }),

  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input, ctx }) => {
      const userRepo = new UserRepository(ctx.db)
      const authService = new AuthService(
        userRepo,
        passwordService,
        (payload) => ctx.req.server.jwt.sign(payload),
      )
      return authService.register(input)
    }),

  login: publicProcedure.input(loginSchema).mutation(async ({ input, ctx }) => {
    const userRepo = new UserRepository(ctx.db)
    const authService = new AuthService(userRepo, passwordService, (payload) =>
      ctx.req.server.jwt.sign(payload),
    )

    const user = await authService.validateUser(input.email, input.password)

    if (!user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'INVALID_CREDENTIALS',
      })
    }

    return authService.login(user)
  }),

  profile: protectedProcedure.query(({ ctx }) => {
    // ctx.user is guaranteed to be non-null in protectedProcedure
    const { password: _password, ...userWithoutPassword } = ctx.user
    return userWithoutPassword
  }),
})
