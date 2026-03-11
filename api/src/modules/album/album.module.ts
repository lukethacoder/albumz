import { Module } from '@nestjs/common'

import { AlbumController } from './album.controller'
import { AlbumService } from './album.service'
import { AlbumRepository } from './album.repository'

@Module({
  controllers: [AlbumController],
  providers: [AlbumService, AlbumRepository],
  exports: [AlbumService], // Export service if other modules need to query albums
})
export class AlbumModule {}
