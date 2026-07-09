import { eq } from 'drizzle-orm'
import type { Database } from '../db/database'
import { userConfig } from '../db/schema/navidrome.schema'
import { decrypt } from '../services/encryption.service'
import { isEnabled, type UserImportConfig } from './user-config'

/**
 * Reads a user's import config from the database, decrypting the Navidrome
 * password. Wired into the pipeline by the production factory so the pipeline
 * core never imports `userConfig`, `decrypt`, or `env` (which would drag ESM
 * runtime config into unit tests).
 */
export async function loadUserImportConfig(
  db: Database,
  userId: string,
): Promise<UserImportConfig> {
  const [configRow] = await db
    .select()
    .from(userConfig)
    .where(eq(userConfig.userId, userId))
    .limit(1)

  const enabledServices = configRow?.enabledExternalServices ?? []

  const navidrome =
    configRow?.navidromeUrl && isEnabled(enabledServices, 'navidrome')
      ? {
          url: configRow.navidromeUrl,
          username: configRow.navidromeUsername!,
          password: decrypt(configRow.navidromePassword!),
        }
      : undefined

  return {
    enabledServices,
    navidrome,
    navidromeUrl: configRow?.navidromeUrl || undefined,
  }
}
