import { Injectable, NotFoundException } from '@nestjs/common'

import { Album } from 'src/db/schema/album.schema'
import { AlbumRepository } from './album.repository'
import { CreateAlbumDto } from './dto/create-album.dto'
import { UpdateAlbumDto } from './dto/update-album.dto'

@Injectable()
export class AlbumService {
  constructor(private readonly albumRepository: AlbumRepository) {}

  async findAll(userId: string): Promise<Album[]> {
    return this.albumRepository.findAll(userId)
  }

  async findById(id: string, userId: string): Promise<Album> {
    const album = await this.albumRepository.findById(id, userId)

    if (!album) {
      throw new NotFoundException(`Album with id "${id}" not found`)
    }

    return album
  }

  async findByArtist(artist: string, userId: string): Promise<Album[]> {
    return this.albumRepository.findByArtist(artist, userId)
  }

  async create(dto: CreateAlbumDto, userId: string): Promise<Album> {
    return this.albumRepository.create({ ...dto, userId })
  }

  async update(id: string, userId: string, dto: UpdateAlbumDto): Promise<Album> {
    // Confirm the album exists before attempting update
    await this.findById(id, userId)

    const updated = await this.albumRepository.update(id, userId, dto)

    if (!updated) {
      throw new NotFoundException(`Album with id "${id}" not found`)
    }

    return updated
  }

  async delete(id: string, userId: string): Promise<void> {
    // Confirm the album exists before attempting delete
    await this.findById(id, userId)

    const deleted = await this.albumRepository.delete(id, userId)

    if (!deleted) {
      throw new NotFoundException(`Album with id "${id}" not found`)
    }
  }
}
