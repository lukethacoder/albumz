import { createAlbumSchema, updateAlbumSchema } from './album.schema'
import { registerSchema } from './auth.schema'
import { albums } from '../db/schema/album.schema'
import { users } from '../db/schema/user.schema'

// These tests lock the drizzle-zod derivation in place: the accepted input
// length must track the `varchar` length declared on the Drizzle table, with no
// hand-written literal in the schema files. If a column's length changes in the
// Drizzle schema, these boundary assertions move with it automatically.
// `length` is a runtime property of a PgVarchar column, not surfaced on the
// public column type — read it through the runtime shape.
const varcharLength = (column: unknown): number =>
  (column as { length: number }).length

const TITLE_MAX = varcharLength(albums.title)
const COVER_MAX = varcharLength(albums.coverUrl)
const EMAIL_MAX = varcharLength(users.email)

describe('album schema derived from Drizzle', () => {
  describe('createAlbumSchema.title', () => {
    it('rejects a title one character over the derived length', () => {
      const result = createAlbumSchema.safeParse({
        title: 'a'.repeat(TITLE_MAX + 1),
        artist: 'Artist',
      })
      expect(result.success).toBe(false)
    })

    it('accepts a title at exactly the derived boundary length', () => {
      const result = createAlbumSchema.safeParse({
        title: 'a'.repeat(TITLE_MAX),
        artist: 'Artist',
      })
      expect(result.success).toBe(true)
    })

    it('still applies the non-empty refinement', () => {
      const result = createAlbumSchema.safeParse({ title: '', artist: 'A' })
      expect(result.success).toBe(false)
    })
  })

  describe('updateAlbumSchema.coverUrl', () => {
    it('rejects a cover url one character over the derived length', () => {
      const longUrl = 'https://x.test/' + 'a'.repeat(COVER_MAX)
      const result = updateAlbumSchema.safeParse({ coverUrl: longUrl })
      expect(result.success).toBe(false)
    })

    it('accepts a cover url at exactly the derived boundary length', () => {
      const prefix = 'https://x.test/'
      const url = prefix + 'a'.repeat(COVER_MAX - prefix.length)
      expect(url.length).toBe(COVER_MAX)
      const result = updateAlbumSchema.safeParse({ coverUrl: url })
      expect(result.success).toBe(true)
    })
  })
})

describe('auth schema derived from Drizzle', () => {
  it('rejects an email one character over the derived length', () => {
    const local = 'a'.repeat(EMAIL_MAX)
    const result = registerSchema.safeParse({
      email: `${local}@x.co`,
      password: 'password1',
    })
    expect(result.success).toBe(false)
  })

  it('accepts an email at exactly the derived boundary length', () => {
    const domain = '@x.co'
    const local = 'a'.repeat(EMAIL_MAX - domain.length)
    const email = `${local}${domain}`
    expect(email.length).toBe(EMAIL_MAX)
    const result = registerSchema.safeParse({ email, password: 'password1' })
    expect(result.success).toBe(true)
  })
})
