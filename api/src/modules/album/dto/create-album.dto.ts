import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  MaxLength,
  IsDateString,
} from 'class-validator'
import { Type } from 'class-transformer'

export class CreateAlbumDto {
  @ApiProperty({ example: 'The New Flesh', description: 'Album title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string

  @ApiProperty({ example: 'Sylosis', description: 'Artist or band name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  artist: string

  @ApiPropertyOptional({
    example: 'Groove Metal;Melodic Metalcore;Thrash Metal;Melodic Death Metal',
    description: 'Music genre, `;` separated for multiple genres',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  genre?: string

  @ApiPropertyOptional({
    example: '2026-02-20',
    description: 'Release date of the album',
    type: String,
    format: 'date',
  })
  @IsDateString()
  @IsOptional()
  @Type(() => Date)
  releaseDate?: string

  @ApiPropertyOptional({
    description: 'Optional description or notes about the album',
  })
  @IsString()
  @IsOptional()
  description?: string

  @ApiPropertyOptional({
    description: 'URL to the album cover image',
    example:
      'https://lastfm.freetls.fastly.net/i/u/770x0/60de1ccd3817a3c716ea0cc1e4494e12.jpg#60de1ccd3817a3c716ea0cc1e4494e12',
  })
  @IsUrl()
  @IsOptional()
  @MaxLength(500)
  coverUrl?: string
}
