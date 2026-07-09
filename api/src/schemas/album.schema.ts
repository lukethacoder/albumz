import { z } from 'zod'
import { createInsertSchema } from 'drizzle-zod'
import { albums } from '../db/schema/album.schema'
import { derivedString } from './drizzle-derive'

// The Drizzle `albums` table is the single source of truth for column
// constraints. `createInsertSchema` derives the base Zod shapes — crucially the
// `varchar` lengths (title/artist 255, coverUrl 500) — so those constraints
// live in exactly one place. We then layer on only the refinements the database
// can't express (non-empty, url, uuid, date coercion, rating bounds).
const table = createInsertSchema(albums)

// title/artist: drizzle length + non-empty. coverUrl: drizzle length + url.
const title = derivedString(table.shape.title).min(1)
const artist = derivedString(table.shape.artist).min(1)
const coverUrl = derivedString(table.shape.coverUrl).url()
// mbid/releaseDate are `text`/`date` (no length constraint) — pure refinements.
const mbid = z.string().uuid()
const releaseDate = z.string().datetime().or(z.string().date())

// Zod schema for creating an album.
export const createAlbumSchema = z.object({
  title,
  artist,
  genre: z.string().optional(),
  releaseDate: releaseDate.optional(),
  description: z.string().optional(),
  coverUrl: coverUrl.optional(),
  mbid: mbid.optional(),
})

// Zod schema for updating an album (all fields optional).
export const updateAlbumSchema = z.object({
  title: title.optional(),
  artist: artist.optional(),
  genre: z.string().optional(),
  releaseDate: releaseDate.optional(),
  description: z.string().optional(),
  coverUrl: coverUrl.optional(),
  mbid: mbid.optional(),
  urlLastFm: z.string().url().optional(),
  urlSpotify: z.string().url().optional(),
  urlAppleMusic: z.string().url().optional(),
  urlYoutube: z.string().url().optional(),
  urlYoutubeMusic: z.string().url().optional(),
  urlRateYourMusic: z.string().url().optional(),
  urlNavidrome: z.string().optional(),
  dateCompleted: z.string().datetime().or(z.date()).nullable().optional(),
  rating: z.number().min(0).max(5).multipleOf(0.5).nullable().optional(),
})

// Zod schema for filtering and sorting albums — not table-shaped, hand-written.
export const albumFilterSchema = z.object({
  artist: z.string().optional(),
  search: z.string().optional(),
  minYear: z.number().int().min(1900).max(2100).optional(),
  maxYear: z.number().int().min(1900).max(2100).optional(),
  genres: z.array(z.string()).optional(),
  completionFilter: z
    .enum(['all', 'backlog', 'listened'])
    .optional()
    .default('backlog'),
  sortBy: z
    .enum([
      'dateAddedDesc',
      'dateAddedAsc',
      'releaseDateDesc',
      'releaseDateAsc',
    ])
    .optional()
    .default('dateAddedDesc'),
})

// Inferred TypeScript types from Zod schemas
export type CreateAlbumInput = z.infer<typeof createAlbumSchema>
export type UpdateAlbumInput = z.infer<typeof updateAlbumSchema>
export type AlbumFilter = z.infer<typeof albumFilterSchema>
