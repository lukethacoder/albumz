import { newDb } from 'pg-mem'
import { replaceQueryArgs$ } from 'pg-mem'
import { drizzle } from 'drizzle-orm/pg-proxy'
import { TRPCError } from '@trpc/server'
import * as schema from '../db/schema'
import { AlbumModule } from './album.repository'
import type { Database } from '../db/database'

/**
 * Album module tests, backed by an in-memory Postgres (pg-mem) so filter SQL,
 * ownership scoping and not-found semantics are exercised for real — no live DB.
 */

const USER_A = '11111111-1111-1111-1111-111111111111'
const USER_B = '22222222-2222-2222-2222-222222222222'

interface SeedAlbum {
  title: string
  artist: string
  genre?: string | null
  releaseDate?: string | null
  dateCompleted?: Date | null
  createdAt?: Date
  userId?: string
}

function createTestDb(): { module: AlbumModule; db: Database } {
  const mem = newDb()

  // pg-mem lacks gen_random_uuid / uuid_generate_v4 — register a stub.
  let uuidCounter = 0
  mem.public.registerFunction({
    name: 'gen_random_uuid',
    returns: 'uuid' as never,
    implementation: () => {
      uuidCounter += 1
      return `00000000-0000-0000-0000-${uuidCounter
        .toString()
        .padStart(12, '0')}`
    },
    impure: true,
  })

  mem.public.none(`
    CREATE TABLE users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email varchar(255) NOT NULL UNIQUE,
      password varchar(255) NOT NULL,
      username varchar(100),
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    );

    CREATE TABLE albums (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title varchar(255) NOT NULL,
      artist varchar(255) NOT NULL,
      genre text,
      release_date date,
      description text,
      cover_url varchar(500),
      date_completed timestamp,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now(),
      mbid text,
      url_last_fm text,
      url_spotify text,
      url_apple_music text,
      url_youtube text,
      url_youtube_music text,
      url_rate_your_music text,
      url_navidrome text,
      rating real
    );

    INSERT INTO users (id, email, password) VALUES
      ('${USER_A}', 'a@example.com', 'pw'),
      ('${USER_B}', 'b@example.com', 'pw');
  `)

  // Drive Drizzle through its pg-proxy driver: we own query execution and
  // adapt pg-mem's object rows into the array shape the proxy expects for
  // `all`. This avoids the node-postgres driver's `types.getTypeParser` and
  // array `rowMode`, neither of which pg-mem supports.
  const db = drizzle(
    (sql: string, params: unknown[], method: 'all' | 'execute') => {
      // pg-mem's `public.query` accepts no bind params, so inline them.
      const inlined = replaceQueryArgs$(sql, params)
      const result = mem.public.query(inlined)

      if (method === 'all') {
        const cols = result.fields.map((f) => f.name)
        const rows = (result.rows as Record<string, unknown>[]).map((row) =>
          cols.map((c) => row[c]),
        )
        return Promise.resolve({ rows })
      }

      return Promise.resolve({ rows: result.rows })
    },
    { schema },
  ) as unknown as Database

  return { module: new AlbumModule(db), db }
}

async function seed(module: AlbumModule, rows: SeedAlbum[]): Promise<void> {
  for (const row of rows) {
    await module.insert({
      userId: row.userId ?? USER_A,
      title: row.title,
      artist: row.artist,
      genre: row.genre ?? null,
      releaseDate: row.releaseDate ?? null,
      dateCompleted: row.dateCompleted ?? null,
      ...(row.createdAt ? { createdAt: row.createdAt } : {}),
    })
  }
}

describe('AlbumModule', () => {
  describe('ownership scoping', () => {
    it('findAll only returns albums owned by the given user', async () => {
      const { module } = createTestDb()
      await seed(module, [
        { title: 'Mine', artist: 'A', userId: USER_A },
        { title: 'Theirs', artist: 'B', userId: USER_B },
      ])

      const result = await module.findAll(USER_A, {
        completionFilter: 'all',
        sortBy: 'dateAddedDesc',
      })

      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Mine')
    })

    it("findById throws NOT_FOUND for another user's album", async () => {
      const { module } = createTestDb()
      await seed(module, [{ title: 'Theirs', artist: 'B', userId: USER_B }])
      const [theirs] = await module.findAll(USER_B, {
        completionFilter: 'all',
        sortBy: 'dateAddedDesc',
      })

      await expect(module.findById(theirs.id, USER_A)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    })
  })

  describe('findById', () => {
    it('returns the album when owned by the user', async () => {
      const { module } = createTestDb()
      await seed(module, [{ title: 'Mine', artist: 'A' }])
      const [mine] = await module.findAll(USER_A, {
        completionFilter: 'all',
        sortBy: 'dateAddedDesc',
      })

      const found = await module.findById(mine.id, USER_A)
      expect(found.title).toBe('Mine')
    })

    it('throws NOT_FOUND when the album does not exist', async () => {
      const { module } = createTestDb()
      await expect(
        module.findById('99999999-9999-9999-9999-999999999999', USER_A),
      ).rejects.toBeInstanceOf(TRPCError)
    })
  })

  describe('update', () => {
    it('updates an owned album in a single query', async () => {
      const { module } = createTestDb()
      await seed(module, [{ title: 'Old', artist: 'A' }])
      const [row] = await module.findAll(USER_A, {
        completionFilter: 'all',
        sortBy: 'dateAddedDesc',
      })

      const updated = await module.update(row.id, USER_A, { title: 'New' })
      expect(updated.title).toBe('New')
    })

    it('throws NOT_FOUND (derived from affected rows) when not owned', async () => {
      const { module } = createTestDb()
      await seed(module, [{ title: 'Theirs', artist: 'B', userId: USER_B }])
      const [theirs] = await module.findAll(USER_B, {
        completionFilter: 'all',
        sortBy: 'dateAddedDesc',
      })

      await expect(
        module.update(theirs.id, USER_A, { title: 'Hijack' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })
  })

  describe('delete', () => {
    it('deletes an owned album', async () => {
      const { module } = createTestDb()
      await seed(module, [{ title: 'Doomed', artist: 'A' }])
      const [row] = await module.findAll(USER_A, {
        completionFilter: 'all',
        sortBy: 'dateAddedDesc',
      })

      await expect(module.delete(row.id, USER_A)).resolves.toBeUndefined()
      await expect(module.findById(row.id, USER_A)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    })

    it('throws NOT_FOUND (derived from affected rows) when not owned', async () => {
      const { module } = createTestDb()
      await seed(module, [{ title: 'Theirs', artist: 'B', userId: USER_B }])
      const [theirs] = await module.findAll(USER_B, {
        completionFilter: 'all',
        sortBy: 'dateAddedDesc',
      })

      await expect(module.delete(theirs.id, USER_A)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    })
  })

  describe('filters', () => {
    it('defaults to backlog (only albums without a completion date)', async () => {
      const { module } = createTestDb()
      await seed(module, [
        { title: 'Backlog', artist: 'A' },
        { title: 'Listened', artist: 'A', dateCompleted: new Date() },
      ])

      const result = await module.findAll(USER_A)
      expect(result.map((a) => a.title)).toEqual(['Backlog'])
    })

    it('completionFilter=listened returns only completed albums', async () => {
      const { module } = createTestDb()
      await seed(module, [
        { title: 'Backlog', artist: 'A' },
        { title: 'Listened', artist: 'A', dateCompleted: new Date() },
      ])

      const result = await module.findAll(USER_A, {
        completionFilter: 'listened',
        sortBy: 'dateAddedDesc',
      })
      expect(result.map((a) => a.title)).toEqual(['Listened'])
    })

    it('search matches title or artist, case-insensitively', async () => {
      const { module } = createTestDb()
      await seed(module, [
        { title: 'Kind of Blue', artist: 'Miles Davis' },
        { title: 'Blue Train', artist: 'John Coltrane' },
        { title: 'Giant Steps', artist: 'John Coltrane' },
      ])

      const byTitle = await module.findAll(USER_A, {
        search: 'blue',
        completionFilter: 'all',
        sortBy: 'dateAddedDesc',
      })
      expect(byTitle.map((a) => a.title).sort()).toEqual([
        'Blue Train',
        'Kind of Blue',
      ])

      const byArtist = await module.findAll(USER_A, {
        search: 'coltrane',
        completionFilter: 'all',
        sortBy: 'dateAddedDesc',
      })
      expect(byArtist).toHaveLength(2)
    })

    it('filters by exact artist', async () => {
      const { module } = createTestDb()
      await seed(module, [
        { title: 'A1', artist: 'Radiohead' },
        { title: 'B1', artist: 'Portishead' },
      ])

      const result = await module.findAll(USER_A, {
        artist: 'Radiohead',
        completionFilter: 'all',
        sortBy: 'dateAddedDesc',
      })
      expect(result.map((a) => a.title)).toEqual(['A1'])
    })

    it('filters by release-year range', async () => {
      const { module } = createTestDb()
      await seed(module, [
        { title: 'Old', artist: 'A', releaseDate: '1995-01-01' },
        { title: 'Mid', artist: 'A', releaseDate: '2005-01-01' },
        { title: 'New', artist: 'A', releaseDate: '2015-01-01' },
      ])

      const result = await module.findAll(USER_A, {
        minYear: 2000,
        maxYear: 2010,
        completionFilter: 'all',
        sortBy: 'dateAddedDesc',
      })
      expect(result.map((a) => a.title)).toEqual(['Mid'])
    })

    it('filters by genres with OR logic', async () => {
      const { module } = createTestDb()
      await seed(module, [
        { title: 'Rock1', artist: 'A', genre: 'Rock;Indie' },
        { title: 'Jazz1', artist: 'A', genre: 'Jazz' },
        { title: 'Pop1', artist: 'A', genre: 'Pop' },
      ])

      const result = await module.findAll(USER_A, {
        genres: ['rock', 'jazz'],
        completionFilter: 'all',
        sortBy: 'dateAddedDesc',
      })
      expect(result.map((a) => a.title).sort()).toEqual(['Jazz1', 'Rock1'])
    })
  })

  describe('sorting', () => {
    it('sorts by date added descending by default', async () => {
      const { module } = createTestDb()
      await seed(module, [
        { title: 'First', artist: 'A', createdAt: new Date('2020-01-01') },
        { title: 'Second', artist: 'A', createdAt: new Date('2021-01-01') },
        { title: 'Third', artist: 'A', createdAt: new Date('2022-01-01') },
      ])

      const result = await module.findAll(USER_A, {
        completionFilter: 'all',
        sortBy: 'dateAddedDesc',
      })
      expect(result.map((a) => a.title)).toEqual(['Third', 'Second', 'First'])
    })

    it('sorts by date added ascending', async () => {
      const { module } = createTestDb()
      await seed(module, [
        { title: 'First', artist: 'A', createdAt: new Date('2020-01-01') },
        { title: 'Second', artist: 'A', createdAt: new Date('2021-01-01') },
      ])

      const result = await module.findAll(USER_A, {
        completionFilter: 'all',
        sortBy: 'dateAddedAsc',
      })
      expect(result.map((a) => a.title)).toEqual(['First', 'Second'])
    })

    it('sorts by release date descending and ascending', async () => {
      const { module } = createTestDb()
      await seed(module, [
        { title: 'Old', artist: 'A', releaseDate: '1990-01-01' },
        { title: 'New', artist: 'A', releaseDate: '2020-01-01' },
      ])

      const desc = await module.findAll(USER_A, {
        completionFilter: 'all',
        sortBy: 'releaseDateDesc',
      })
      expect(desc.map((a) => a.title)).toEqual(['New', 'Old'])

      const asc = await module.findAll(USER_A, {
        completionFilter: 'all',
        sortBy: 'releaseDateAsc',
      })
      expect(asc.map((a) => a.title)).toEqual(['Old', 'New'])
    })
  })

  describe('findByTitleAndArtist', () => {
    it('finds an existing owned album and ignores other users', async () => {
      const { module } = createTestDb()
      await seed(module, [
        { title: 'Dup', artist: 'A', userId: USER_A },
        { title: 'Dup', artist: 'A', userId: USER_B },
      ])

      const found = await module.findByTitleAndArtist('Dup', 'A', USER_A)
      expect(found?.userId).toBe(USER_A)

      const missing = await module.findByTitleAndArtist('Nope', 'A', USER_A)
      expect(missing).toBeUndefined()
    })
  })
})
