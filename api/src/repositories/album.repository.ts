import { eq, and, or, like, gte, lte, isNull, desc, asc, sql } from 'drizzle-orm'
import type { Database } from '../db/database'
import { albums } from '../db/schema/album.schema'
import type { Album, NewAlbum } from '../db/schema/album.schema'
import type { UpdateAlbumInput, AlbumFilter } from '../schemas/album.schema'

export class AlbumRepository {
  constructor(private readonly db: Database) {}

  async findAll(userId: string, filters?: AlbumFilter): Promise<Album[]> {
    const conditions = [eq(albums.userId, userId)]

    // Filter by completion status
    if (filters && !filters.showCompleted) {
      conditions.push(isNull(albums.dateCompleted))
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
    let query = this.db.select().from(albums).where(and(...conditions)).$dynamic()

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

  async findById(id: string, userId: string): Promise<Album | undefined> {
    const [album] = await this.db
      .select()
      .from(albums)
      .where(and(eq(albums.id, id), eq(albums.userId, userId)))
      .limit(1)

    return album
  }

  async findByArtist(artist: string, userId: string): Promise<Album[]> {
    return this.db
      .select()
      .from(albums)
      .where(and(eq(albums.artist, artist), eq(albums.userId, userId)))
      .orderBy(albums.releaseDate)
  }

  async create(data: NewAlbum): Promise<Album> {
    const [album] = await this.db.insert(albums).values(data).returning()

    return album
  }

  async update(
    id: string,
    userId: string,
    data: UpdateAlbumInput,
  ): Promise<Album | undefined> {
    const { dateCompleted, ...rest } = data
    const [album] = await this.db
      .update(albums)
      .set({
        ...rest,
        dateCompleted: dateCompleted != null ? new Date(dateCompleted) : dateCompleted,
        updatedAt: new Date(),
      })
      .where(and(eq(albums.id, id), eq(albums.userId, userId)))
      .returning()

    return album
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.db
      .delete(albums)
      .where(and(eq(albums.id, id), eq(albums.userId, userId)))
      .returning({ id: albums.id })

    return result.length > 0
  }
}
