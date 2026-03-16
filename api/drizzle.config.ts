import type { Config } from 'drizzle-kit'
import { ENV } from 'varlock/env'

export default {
  schema: './src/db/schema/*.schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: ENV.DATABASE_URL,
  },
} satisfies Config
