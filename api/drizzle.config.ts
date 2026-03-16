import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema/*.schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // runs within the drizzle-kit context, unable to use varlock here?
    url: process.env.DATABASE_URL!,
  },
} satisfies Config
