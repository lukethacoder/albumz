import type { NavidromeConfig } from '../services/navidrome.service'
import type { Database } from '../db/database'

/**
 * The slice of a user's configuration the import pipeline needs: which external
 * services are enabled, and (optionally) decrypted Navidrome credentials.
 *
 * `enabledServices` empty means "all services enabled" (see `isEnabled`).
 */
export interface UserImportConfig {
  enabledServices: string[]
  navidrome?: NavidromeConfig
  /** Present regardless of the navidrome enabled flag — used for link building. */
  navidromeUrl?: string
}

export function isEnabled(enabledServices: string[], key: string): boolean {
  return enabledServices.length === 0 || enabledServices.includes(key)
}

export type LoadUserImportConfig = (
  db: Database,
  userId: string,
) => Promise<UserImportConfig>
