import { router } from './trpc'
import { authRouter } from '../routers/auth.router'
import { albumRouter } from '../routers/album.router'
import { navidromeRouter } from '../routers/navidrome.router'

export const appRouter = router({
  auth: authRouter,
  albums: albumRouter,
  navidrome: navidromeRouter,
})

// Export type definition for the client
export type AppRouter = typeof appRouter
