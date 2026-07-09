import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto'
import { ENV } from '../env'

/** Derive a stable 32-byte key from the JWT secret. */
function getKey(): Buffer {
  return createHash('sha256').update(ENV.JWT_SECRET).digest()
}

/**
 * Encrypt a plaintext string with AES-256-GCM.
 * Returns `iv:ciphertext:authTag` (all hex-encoded).
 */
export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${encrypted.toString('hex')}:${authTag.toString('hex')}`
}

/**
 * Decrypt a value produced by `encrypt`.
 */
export function decrypt(ciphertext: string): string {
  const key = getKey()
  const [ivHex, encryptedHex, authTagHex] = ciphertext.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8')
}
