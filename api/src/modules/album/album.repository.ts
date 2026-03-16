import { Inject, Injectable } from '@nestjs/common'
import { eq, and } from 'drizzle-orm'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'

import { DRIZZLE_CLIENT } from 'src/db/database.constants'
import { albums, Album, NewAlbum } from 'src/db/schema/album.schema'
import * as schema from 'src/db/schema'
import { UpdateAlbumDto } from './dto/update-album.dto'

@Injectable()
export class AlbumRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(userId: string): Promise<Album[]> {
    return this.db
      .select()
      .from(albums)
      .where(eq(albums.userId, userId))
      .orderBy(albums.createdAt)
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
    data: UpdateAlbumDto,
  ): Promise<Album | undefined> {
    const [album] = await this.db
      .update(albums)
      .set({ ...data, updatedAt: new Date() })
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
