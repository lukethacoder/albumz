import { z } from 'zod'

// Zod schema for user registration
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().optional(),
})

// Zod schema for user login
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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
