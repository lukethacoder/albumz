import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './user.schema'

export const userConfig = pgTable('user_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  // Navidrome config — empty string means not configured (DB has NOT NULL constraint)
  navidromeUrl: text('navidrome_url').$default(() => ''),
  navidromeUsername: text('navidrome_username').$default(() => ''),
  // AES-256-GCM encrypted: iv:ciphertext:authTag (all hex-encoded)
  navidromePassword: text('navidrome_password').$default(() => ''),
  // Enabled external services — empty array means all services are shown
  enabledExternalServices: text('enabled_external_services')
    .array()
    .notNull()
    .default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const userConfigRelations = relations(userConfig, ({ one }) => ({
  user: one(users, {
    fields: [userConfig.userId],
    references: [users.id],
  }),
}))

export type UserConfigRow = typeof userConfig.$inferSelect
