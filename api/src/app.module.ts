import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AlbumModule } from './modules/album/album.module'
import { DatabaseModule } from './db/database.module'

@Module({
  imports: [DatabaseModule, AlbumModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
