import { TRPCError } from '@trpc/server'
import type { Album } from '../db/schema/album.schema'
import { AlbumRepository } from '../repositories/album.repository'
import type {
  CreateAlbumInput,
  UpdateAlbumInput,
  AlbumFilter,
} from '../schemas/album.schema'

export class AlbumService {
  constructor(private readonly albumRepository: AlbumRepository) {}

  async findAll(userId: string, filters?: AlbumFilter): Promise<Album[]> {
    return this.albumRepository.findAll(userId, filters)
  }

  async findById(id: string, userId: string): Promise<Album> {
    const album = await this.albumRepository.findById(id, userId)

    if (!album) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Album with id "${id}" not found`,
      })
    }

    return album
  }

  async findByArtist(artist: string, userId: string): Promise<Album[]> {
    return this.albumRepository.findByArtist(artist, userId)
  }

  async create(dto: CreateAlbumInput, userId: string): Promise<Album> {
    return this.albumRepository.create({ ...dto, userId })
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateAlbumInput,
  ): Promise<Album> {
    // Confirm the album exists before attempting update
    await this.findById(id, userId)

    const updated = await this.albumRepository.update(id, userId, dto)

    if (!updated) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Album with id "${id}" not found`,
      })
    }

    return updated
  }

  async delete(id: string, userId: string): Promise<void> {
    // Confirm the album exists before attempting delete
    await this.findById(id, userId)

    const deleted = await this.albumRepository.delete(id, userId)

    if (!deleted) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Album with id "${id}" not found`,
      })
    }
  }
}
