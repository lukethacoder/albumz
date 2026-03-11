import { Global, Module, OnApplicationShutdown } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { DRIZZLE_CLIENT, PG_POOL } from './database.constants'
import * as schema from './schema/index'
import { ModuleRef } from '@nestjs/core'

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Pool({
          connectionString: config.getOrThrow<string>('DATABASE_URL'),
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        }),
    },
    {
      provide: DRIZZLE_CLIENT,
      inject: [PG_POOL],
      useFactory: (pool: Pool) => drizzle(pool, { schema }),
    },
  ],
  exports: [DRIZZLE_CLIENT],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(private readonly moduleRef: ModuleRef) {}

  async onApplicationShutdown() {
    const pool = this.moduleRef.get<Pool>(PG_POOL)
    await pool.end() // Drain all connections cleanly before the process exits
  }
}
