import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  date,
} from 'drizzle-orm/pg-core'
import { users } from './user.schema'
import { relations } from 'drizzle-orm'

export const albums = pgTable('albums', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  artist: varchar('artist', { length: 255 }).notNull(),
  genre: varchar('genre', { length: 100 }),
  releaseDate: date('release_date'),
  description: text('description'),
  coverUrl: varchar('cover_url', { length: 500 }),
  dateCompleted: timestamp('date_completed'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  // Musicbrainz Album Id
  mbid: text('mbid'),
  // External URLs
  urlLastFm: text('url_last_fm'),
  urlSpotify: text('url_spotify'),
  urlAppleMusic: text('url_apple_music'),
  urlYoutube: text('url_youtube'),
  urlYoutubeMusic: text('url_youtube_music'),
  urlRateYourMusic: text('url_rate_your_music'),
  urlNavidrome: text('url_navidrome'),
})

export const albumsRelations = relations(albums, ({ one }) => ({
  user: one(users, {
    fields: [albums.userId],
    references: [users.id],
  }),
}))

// Inferred types — used throughout the module instead of manually defined interfaces
export type Album = typeof albums.$inferSelect
export type NewAlbum = typeof albums.$inferInsert
