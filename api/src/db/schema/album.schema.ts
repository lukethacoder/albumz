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
