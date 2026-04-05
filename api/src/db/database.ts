import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { ENV } from '../env'
import * as schema from './schema'

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: ENV.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Create Drizzle client
export const db = drizzle(pool, { schema })

// Export pool for graceful shutdown
export const pgPool = pool

// Type export for use in other files
export type Database = typeof db
