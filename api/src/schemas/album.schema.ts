import { z } from 'zod'

// Zod schema for creating an album
export const createAlbumSchema = z.object({
  title: z.string().min(1).max(255),
  artist: z.string().min(1).max(255),
  genre: z.string().optional(),
  releaseDate: z.string().datetime().or(z.string().date()).optional(),
  description: z.string().optional(),
  coverUrl: z.string().url().max(500).optional(),
  mbid: z.string().uuid().optional(),
})

// Zod schema for updating an album (all fields optional)
export const updateAlbumSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  artist: z.string().min(1).max(255).optional(),
  genre: z.string().optional(),
  releaseDate: z.string().datetime().or(z.string().date()).optional(),
  description: z.string().optional(),
  coverUrl: z.string().url().max(500).optional(),
  mbid: z.string().uuid().optional(),
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

// Zod schema for filtering and sorting albums
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
