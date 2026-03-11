import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsUrl,
  MaxLength,
} from 'class-validator'

export class CreateAlbumDto {
  @ApiProperty({ example: 'Images and Words', description: 'Album title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string

  @ApiProperty({ example: 'Dream Theater', description: 'Artist or band name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  artist: string

  @ApiPropertyOptional({
    example: 'Progressive Metal',
    description: 'Music genre, `;` separated for multiple genres',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  genre?: string

  @ApiPropertyOptional({
    example: '1992-06-29',
    description: 'Release date of the album',
  })
  @IsInt()
  @IsOptional()
  releaseDate?: Date

  @ApiPropertyOptional({
    description: 'Optional description or notes about the album',
  })
  @IsString()
  @IsOptional()
  description?: string

  @ApiPropertyOptional({ description: 'URL to the album cover image' })
  @IsUrl()
  @IsOptional()
  @MaxLength(500)
  coverUrl?: string
}
