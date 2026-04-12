import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('[migrate] DATABASE_URL is required')
  process.exit(1)
}

const pool = new Pool({ connectionString })
const db = drizzle(pool)

migrate(db, { migrationsFolder: './drizzle/migrations' })
  .then(() => {
    console.log('[migrate] Migrations complete')
    return pool.end()
  })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[migrate] Migration failed:', err)
    process.exit(1)
  })
