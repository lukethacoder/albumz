import { eq, and, or, isNull, desc, asc, sql } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import type { Database } from '../db/database'
import { albums } from '../db/schema/album.schema'
import type { Album, NewAlbum } from '../db/schema/album.schema'
import type {
  CreateAlbumInput,
  UpdateAlbumInput,
  AlbumFilter,
} from '../schemas/album.schema'

/**
 * Album module — owns all album persistence, ownership scoping, and
 * not-found semantics. Every query is scoped by `userId`, so ownership is
 * enforced by the `WHERE id AND userId` clause rather than a separate check.
 */
export class AlbumModule {
  constructor(private readonly db: Database) {}

  async findAll(userId: string, filters?: AlbumFilter): Promise<Album[]> {
    const conditions = [eq(albums.userId, userId)]

    // Filter by exact artist
    if (filters?.artist) {
      conditions.push(eq(albums.artist, filters.artist))
    }

    // Filter by completion status
    if (!filters || filters.completionFilter === 'backlog') {
      conditions.push(isNull(albums.dateCompleted))
    } else if (filters.completionFilter === 'listened') {
      conditions.push(sql`${albums.dateCompleted} IS NOT NULL`)
    }

    // Filter by search query (title or artist)
    if (filters?.search) {
      const searchLower = `%${filters.search.toLowerCase()}%`
      conditions.push(
        or(
          sql`LOWER(${albums.title}) LIKE ${searchLower}`,
          sql`LOWER(${albums.artist}) LIKE ${searchLower}`,
        )!,
      )
    }

    // Filter by genres (OR logic — album matches if it contains any of the selected genres)
    if (filters?.genres?.length) {
      const genreConditions = filters.genres.map(
        (g) => sql`LOWER(${albums.genre}) LIKE ${'%' + g.toLowerCase() + '%'}`,
      )
      conditions.push(or(...genreConditions)!)
    }

    // Filter by release year range
    if (filters?.minYear || filters?.maxYear) {
      if (filters.minYear) {
        conditions.push(
          sql`EXTRACT(YEAR FROM ${albums.releaseDate}) >= ${filters.minYear}`,
        )
      }
      if (filters.maxYear) {
        conditions.push(
          sql`EXTRACT(YEAR FROM ${albums.releaseDate}) <= ${filters.maxYear}`,
        )
      }
    }

    // Build query
    let query = this.db
      .select()
      .from(albums)
      .where(and(...conditions))
      .$dynamic()

    // Apply sorting
    const sortBy = filters?.sortBy || 'dateAddedDesc'
    switch (sortBy) {
      case 'dateAddedAsc':
        query = query.orderBy(asc(albums.createdAt))
        break
      case 'releaseDateDesc':
        query = query.orderBy(desc(albums.releaseDate))
        break
      case 'releaseDateAsc':
        query = query.orderBy(asc(albums.releaseDate))
        break
      case 'dateAddedDesc':
      default:
        query = query.orderBy(desc(albums.createdAt))
        break
    }

    return query
  }

  /**
   * Fetch a single album owned by `userId`. Throws NOT_FOUND when the album
   * does not exist or belongs to another user.
   */
  async findById(id: string, userId: string): Promise<Album> {
    const [album] = await this.db
      .select()
      .from(albums)
      .where(and(eq(albums.id, id), eq(albums.userId, userId)))
      .limit(1)

    if (!album) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Album with id "${id}" not found`,
      })
    }

    return album
  }

  async findByTitleAndArtist(
    title: string,
    artist: string,
    userId: string,
  ): Promise<Album | undefined> {
    const [album] = await this.db
      .select()
      .from(albums)
      .where(
        and(
          eq(albums.title, title),
          eq(albums.artist, artist),
          eq(albums.userId, userId),
        ),
      )
      .limit(1)

    return album
  }

  async create(dto: CreateAlbumInput, userId: string): Promise<Album> {
    const [album] = await this.db
      .insert(albums)
      .values({ ...dto, userId })
      .returning()

    return album
  }

  /**
   * Insert a fully-formed album row. Used by bulk import paths that build the
   * row directly (e.g. CSV / playlist import) rather than from a create DTO.
   */
  async insert(data: NewAlbum): Promise<Album> {
    const [album] = await this.db.insert(albums).values(data).returning()

    return album
  }

  /**
   * Update an album owned by `userId`. Not-found is derived from the affected
   * row of the update itself — a single round-trip, no pre-check.
   */
  async update(
    id: string,
    userId: string,
    data: UpdateAlbumInput,
  ): Promise<Album> {
    const { dateCompleted, ...rest } = data
    const [album] = await this.db
      .update(albums)
      .set({
        ...rest,
        dateCompleted:
          dateCompleted != null ? new Date(dateCompleted) : dateCompleted,
        updatedAt: new Date(),
      })
      .where(and(eq(albums.id, id), eq(albums.userId, userId)))
      .returning()

    if (!album) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Album with id "${id}" not found`,
      })
    }

    return album
  }

  /**
   * Delete an album owned by `userId`. Not-found is derived from the affected
   * row of the delete itself — a single round-trip, no pre-check.
   */
  async delete(id: string, userId: string): Promise<void> {
    const result = await this.db
      .delete(albums)
      .where(and(eq(albums.id, id), eq(albums.userId, userId)))
      .returning({ id: albums.id })

    if (result.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Album with id "${id}" not found`,
      })
    }
  }
}
