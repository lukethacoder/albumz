import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core'

export const albums = pgTable('albums', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  artist: varchar('artist', { length: 255 }).notNull(),
  genre: varchar('genre', { length: 100 }),
  releaseDate: timestamp('release_date'),
  description: text('description'),
  coverUrl: varchar('cover_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Inferred types — used throughout the module instead of manually defined interfaces
export type Album = typeof albums.$inferSelect
export type NewAlbum = typeof albums.$inferInsert
