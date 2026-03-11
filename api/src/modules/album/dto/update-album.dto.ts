import { PartialType } from '@nestjs/swagger'
import { CreateAlbumDto } from './create-album.dto'

// PartialType makes all CreateAlbumDto fields optional and inherits all validators/swagger decorators
export class UpdateAlbumDto extends PartialType(CreateAlbumDto) {}
