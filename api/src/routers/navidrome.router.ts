import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { router, protectedProcedure } from '../trpc/trpc'
import { userConfig } from '../db/schema/navidrome.schema'
import { encrypt } from '../services/encryption.service'

export const EXTERNAL_SERVICES = [
  { key: 'lastfm', label: 'Last.fm' },
  { key: 'spotify', label: 'Spotify' },
  { key: 'applemusic', label: 'Apple Music' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'musicbrainz', label: 'MusicBrainz' },
  { key: 'rateyourmusic', label: 'Rate Your Music' },
  { key: 'navidrome', label: 'Navidrome' },
] as const

export type ExternalServiceKey = (typeof EXTERNAL_SERVICES)[number]['key']

export const navidromeRouter = router({
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db
      .select({
        url: userConfig.navidromeUrl,
        username: userConfig.navidromeUsername,
      })
      .from(userConfig)
      .where(eq(userConfig.userId, ctx.user.id))
      .limit(1)

    if (!row?.url) return null
    return { url: row.url, username: row.username ?? '' }
  }),

  saveConfig: protectedProcedure
    .input(
      z.object({
        url: z.string().url(),
        username: z.string().min(1),
        password: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const encryptedPassword = encrypt(input.password)
      const url = input.url.replace(/\/+$/, '')

      await ctx.db
        .insert(userConfig)
        .values({
          userId: ctx.user.id,
          navidromeUrl: url,
          navidromeUsername: input.username,
          navidromePassword: encryptedPassword,
        })
        .onConflictDoUpdate({
          target: userConfig.userId,
          set: {
            navidromeUrl: url,
            navidromeUsername: input.username,
            navidromePassword: encryptedPassword,
            updatedAt: new Date(),
          },
        })

      return { success: true }
    }),

  deleteConfig: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(userConfig)
      .set({
        navidromeUrl: '',
        navidromeUsername: '',
        navidromePassword: '',
        updatedAt: new Date(),
      })
      .where(eq(userConfig.userId, ctx.user.id))

    return { success: true }
  }),

  testConfig: protectedProcedure
    .input(
      z.object({
        url: z.string().url(),
        username: z.string().min(1),
        password: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const url = input.url.replace(/\/+$/, '')
        const res = await fetch(`${url}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: input.username,
            password: input.password,
          }),
        })
        return { ok: res.ok }
      } catch {
        return { ok: false }
      }
    }),

  getAvailableServices: protectedProcedure.query(() => {
    // Returns only services whose required server-side credentials are configured.
    // Services with no server-side requirements are always included.
    const available = EXTERNAL_SERVICES.map((s) => s.key).filter((key) => {
      if (key === 'lastfm') return !!process.env.LASTFM_API_KEY
      if (key === 'spotify') {
        return !!(
          process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET
        )
      }
      return true
    })
    return available
  }),

  getEnabledServices: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db
      .select({ enabledExternalServices: userConfig.enabledExternalServices })
      .from(userConfig)
      .where(eq(userConfig.userId, ctx.user.id))
      .limit(1)

    const DEFAULT_SERVICES = [
      !!process.env.LASTFM_API_KEY && 'lastfm',
      !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) &&
        'spotify',
      'applemusic',
      'youtube',
      'musicbrainz',
      'rateyourmusic',
      'navidrome',
    ].filter(Boolean) as string[]

    const saved = row?.enabledExternalServices
    return saved?.length ? saved : DEFAULT_SERVICES
  }),

  saveEnabledServices: protectedProcedure
    .input(z.object({ services: z.array(z.string()) }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .insert(userConfig)
        .values({
          userId: ctx.user.id,
          enabledExternalServices: input.services,
        })
        .onConflictDoUpdate({
          target: userConfig.userId,
          set: {
            enabledExternalServices: input.services,
            updatedAt: new Date(),
          },
        })

      return { success: true }
    }),
})
