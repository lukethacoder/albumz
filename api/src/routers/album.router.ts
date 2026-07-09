import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { router, protectedProcedure } from '../trpc/trpc'
import {
  createAlbumSchema,
  updateAlbumSchema,
  albumFilterSchema,
} from '../schemas/album.schema'
import { parseUrl } from '../services/url-import.service'
import { userConfig } from '../db/schema/navidrome.schema'
import { db } from '../db/database'
import type { Database } from '../db/database'
import { createImportPipeline } from '../import'
import { isEnabled } from '../import/user-config'

// Import pipeline bound to the standalone db instance, for background jobs that
// run outside a tRPC request context.
const importPipeline = createImportPipeline(db)

async function getNavidromeBaseUrl(
  db: Database,
  userId: string,
): Promise<string | null> {
  const [navRow] = await db
    .select({ navidromeUrl: userConfig.navidromeUrl })
    .from(userConfig)
    .where(eq(userConfig.userId, userId))
    .limit(1)
  return navRow?.navidromeUrl ?? null
}

function withNavidromeUrl<T extends { urlNavidrome: string | null }>(
  album: T,
  baseUrl: string,
): T {
  if (!album.urlNavidrome) return album
  return { ...album, urlNavidrome: `${baseUrl}${album.urlNavidrome}` }
}

export const albumRouter = router({
  list: protectedProcedure
    .input(albumFilterSchema)
    .query(async ({ input, ctx }) => {
      const albums = await ctx.albums.findAll(ctx.user.id, input)

      if (albums.some((a) => a.urlNavidrome)) {
        const baseUrl = await getNavidromeBaseUrl(ctx.db, ctx.user.id)
        if (baseUrl) return albums.map((a) => withNavidromeUrl(a, baseUrl))
      }

      return albums
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const album = await ctx.albums.findById(input.id, ctx.user.id)

      if (album.urlNavidrome) {
        const baseUrl = await getNavidromeBaseUrl(ctx.db, ctx.user.id)
        if (baseUrl) return withNavidromeUrl(album, baseUrl)
      }

      return album
    }),

  create: protectedProcedure
    .input(createAlbumSchema)
    .mutation(async ({ input, ctx }) => {
      return ctx.albums.create(input, ctx.user.id)
    }),

  createFromUrl: protectedProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ input, ctx }) => {
      const { kind, id } = parseUrl(input.url)

      if (kind === 'unsupported') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'UNSUPPORTED_URL',
        })
      }

      // Check the service for this URL is enabled
      const urlService =
        kind === 'youtube'
          ? 'youtube'
          : kind === 'apple_music'
            ? 'applemusic'
            : 'spotify'
      const [configRow] = await ctx.db
        .select({ enabledExternalServices: userConfig.enabledExternalServices })
        .from(userConfig)
        .where(eq(userConfig.userId, ctx.user.id))
        .limit(1)
      const enabled = configRow?.enabledExternalServices ?? []
      if (!isEnabled(enabled, urlService)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'SERVICE_DISABLED',
        })
      }

      if (kind === 'spotify_playlist') {
        return importPipeline.importPlaylist(id, ctx.user.id)
      }
      return importPipeline.importFromUrl(input.url, ctx.user.id)
    }),

  getImportStatus: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(({ input }) => importPipeline.status(input.jobId)),

  update: protectedProcedure
    .input(z.object({ id: z.string().uuid(), data: updateAlbumSchema }))
    .mutation(async ({ input, ctx }) => {
      return ctx.albums.update(input.id, ctx.user.id, input.data)
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.albums.delete(input.id, ctx.user.id)
      return { success: true }
    }),

  refreshMetadata: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const album = await ctx.albums.findById(input.id, ctx.user.id)

      // Validate that enrichment is possible before delegating
      if (!album.mbid) {
        const [configRow] = await ctx.db
          .select({
            navidromeUrl: userConfig.navidromeUrl,
            enabledExternalServices: userConfig.enabledExternalServices,
          })
          .from(userConfig)
          .where(eq(userConfig.userId, ctx.user.id))
          .limit(1)
        const enabled = configRow?.enabledExternalServices ?? []

        if (!configRow?.navidromeUrl || !isEnabled(enabled, 'navidrome')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'NO_MBID',
          })
        }
      }

      await importPipeline.enrichAlbum(input.id, ctx.user.id, true)
      return ctx.albums.findById(input.id, ctx.user.id)
    }),

  markComplete: protectedProcedure
    .input(z.object({ id: z.string().uuid(), completed: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const dateCompleted = input.completed ? new Date() : null

      return ctx.albums.update(input.id, ctx.user.id, { dateCompleted })
    }),

  findArtwork: protectedProcedure
    .input(z.object({ artist: z.string().min(1), album: z.string().min(1) }))
    .mutation(({ input, ctx }) =>
      importPipeline.findArtwork(input.artist, input.album, ctx.user.id),
    ),

  exportCsv: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.albums.findAll(ctx.user.id, {
      completionFilter: 'all',
      sortBy: 'dateAddedDesc',
    })

    const COLUMNS = [
      'id',
      'title',
      'artist',
      'genre',
      'releaseDate',
      'description',
      'coverUrl',
      'rating',
      'dateCompleted',
      'createdAt',
      'updatedAt',
      'mbid',
      'urlLastFm',
      'urlSpotify',
      'urlAppleMusic',
      'urlYoutube',
      'urlYoutubeMusic',
      'urlRateYourMusic',
      'urlNavidrome',
    ] as const

    function escapeCsv(value: unknown): string {
      if (value === null || value === undefined) return ''
      let str: string
      if (value instanceof Date) {
        str = value.toISOString()
      } else if (typeof value === 'object') {
        str = JSON.stringify(value)
      } else {
        str = String(value as string | number | boolean | bigint | symbol)
      }
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const header = COLUMNS.join(',')
    const body = rows
      .map((row) =>
        COLUMNS.map((col) => escapeCsv(row[col as keyof typeof row])).join(','),
      )
      .join('\n')

    return `${header}\n${body}`
  }),

  importCsv: protectedProcedure
    .input(z.object({ csv: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const lines = input.csv
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim()
        .split('\n')
      if (lines.length < 2) return { created: 0, skipped: 0 }

      function parseCsvLine(line: string): string[] {
        const fields: string[] = []
        let current = ''
        let inQuotes = false
        for (let i = 0; i < line.length; i++) {
          const ch = line[i]
          if (inQuotes) {
            if (ch === '"' && line[i + 1] === '"') {
              current += '"'
              i++
            } else if (ch === '"') inQuotes = false
            else current += ch
          } else {
            if (ch === '"') inQuotes = true
            else if (ch === ',') {
              fields.push(current)
              current = ''
            } else current += ch
          }
        }
        fields.push(current)
        return fields
      }

      const headers = parseCsvLine(lines[0])
      let created = 0
      let skipped = 0

      for (const line of lines.slice(1)) {
        if (!line.trim()) continue
        const values = parseCsvLine(line)
        const row: Record<string, string> = {}
        headers.forEach((h, i) => {
          row[h] = values[i] ?? ''
        })

        const title = row.title?.trim()
        const artist = row.artist?.trim()
        if (!title || !artist) {
          skipped++
          continue
        }

        const existing = await ctx.albums.findByTitleAndArtist(
          title,
          artist,
          ctx.user.id,
        )
        if (existing) {
          skipped++
          continue
        }

        try {
          await ctx.albums.insert({
            userId: ctx.user.id,
            title,
            artist,
            genre: row.genre || null,
            releaseDate: row.releaseDate || null,
            description: row.description || null,
            coverUrl: row.coverUrl || null,
            rating: row.rating ? parseFloat(row.rating) : null,
            dateCompleted: row.dateCompleted
              ? new Date(row.dateCompleted)
              : null,
            mbid: row.mbid || null,
            urlLastFm: row.urlLastFm || null,
            urlSpotify: row.urlSpotify || null,
            urlAppleMusic: row.urlAppleMusic || null,
            urlYoutube: row.urlYoutube || null,
            urlYoutubeMusic: row.urlYoutubeMusic || null,
            urlRateYourMusic: row.urlRateYourMusic || null,
            urlNavidrome: row.urlNavidrome || null,
            ...(row.createdAt ? { createdAt: new Date(row.createdAt) } : {}),
          })
          created++
        } catch {
          skipped++
        }
      }

      return { created, skipped }
    }),
})
