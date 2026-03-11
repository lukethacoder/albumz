import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Album } from 'src/db/schema/album.schema'

export class AlbumResponseDto implements Album {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string

  @ApiProperty({ example: 'Images and Words' })
  title: string

  @ApiProperty({ example: 'Dream Theater' })
  artist: string

  @ApiPropertyOptional({ example: 'Progressive Metal;Progressive Rock;Metal' })
  genre: string | null

  @ApiPropertyOptional()
  releaseDate: string | null

  @ApiPropertyOptional({ example: 'A classic album from 1977.' })
  description: string | null

  @ApiPropertyOptional({ example: 'https://example.com/covers/rumours.jpg' })
  coverUrl: string | null

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date
}
