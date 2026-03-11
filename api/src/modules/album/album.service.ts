import { Injectable, NotFoundException } from '@nestjs/common'

import { Album } from 'src/db/schema/album.schema'
import { AlbumRepository } from './album.repository'
import { CreateAlbumDto } from './dto/create-album.dto'
import { UpdateAlbumDto } from './dto/update-album.dto'

@Injectable()
export class AlbumService {
  constructor(private readonly albumRepository: AlbumRepository) {}

  async findAll(): Promise<Album[]> {
    return this.albumRepository.findAll()
  }

  async findById(id: string): Promise<Album> {
    const album = await this.albumRepository.findById(id)

    if (!album) {
      throw new NotFoundException(`Album with id "${id}" not found`)
    }

    return album
  }

  async findByArtist(artist: string): Promise<Album[]> {
    return this.albumRepository.findByArtist(artist)
  }

  async create(dto: CreateAlbumDto): Promise<Album> {
    return this.albumRepository.create(dto)
  }

  async update(id: string, dto: UpdateAlbumDto): Promise<Album> {
    // Confirm the album exists before attempting update
    await this.findById(id)

    const updated = await this.albumRepository.update(id, dto)

    if (!updated) {
      throw new NotFoundException(`Album with id "${id}" not found`)
    }

    return updated
  }

  async delete(id: string): Promise<void> {
    // Confirm the album exists before attempting delete
    await this.findById(id)

    const deleted = await this.albumRepository.delete(id)

    if (!deleted) {
      throw new NotFoundException(`Album with id "${id}" not found`)
    }
  }
}
