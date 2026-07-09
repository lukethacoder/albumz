import { z } from 'zod'
import { createInsertSchema } from 'drizzle-zod'
import { users } from '../db/schema/user.schema'
import { derivedString } from './drizzle-derive'

// The Drizzle `users` table is the source of truth for column lengths
// (email/password 255, username 100). `createInsertSchema` derives the base
// shapes; we layer on only the refinements the database can't express
// (email format, minimum password length).
const table = createInsertSchema(users)

const email = derivedString(table.shape.email).email()
const username = derivedString(table.shape.username)

// Zod schema for user registration
export const registerSchema = z.object({
  email,
  password: derivedString(table.shape.password).min(8),
  username: username.optional(),
})

// Zod schema for user login
export const loginSchema = z.object({
  email,
  password: derivedString(table.shape.password).min(1),
})

// Inferred TypeScript types from Zod schemas
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>

// Auth response type (not validated as input, only as output)
export type AuthResponse = {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: {
    id: string
    email: string
    username?: string
  }
}
