import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger'

import { AlbumService } from './album.service'
import { CreateAlbumDto } from './dto/create-album.dto'
import { UpdateAlbumDto } from './dto/update-album.dto'
import { AlbumResponseDto } from './dto/album-response.dto'

@ApiTags('Albums')
@ApiBearerAuth()
@Controller('albums')
export class AlbumController {
  constructor(private readonly albumService: AlbumService) {}

  // ─── GET /albums ──────────────────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'List all albums, optionally filtered by artist' })
  @ApiQuery({
    name: 'artist',
    required: false,
    description: 'Filter by artist name',
  })
  @ApiResponse({ status: 200, type: [AlbumResponseDto] })
  async findAll(@Query('artist') artist?: string): Promise<AlbumResponseDto[]> {
    if (artist) {
      return this.albumService.findByArtist(artist)
    }

    return this.albumService.findAll()
  }

  // ─── GET /albums/:id ──────────────────────────────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Get a single album by ID' })
  @ApiParam({ name: 'id', description: 'Album UUID' })
  @ApiResponse({ status: 200, type: AlbumResponseDto })
  @ApiResponse({ status: 404, description: 'Album not found' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AlbumResponseDto> {
    return this.albumService.findById(id)
  }

  // ─── POST /albums ─────────────────────────────────────────────────────────
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new album' })
  @ApiResponse({ status: 201, type: AlbumResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(@Body() dto: CreateAlbumDto): Promise<AlbumResponseDto> {
    return this.albumService.create(dto)
  }

  // ─── PATCH /albums/:id ────────────────────────────────────────────────────
  @Patch(':id')
  @ApiOperation({ summary: 'Update an album (partial update)' })
  @ApiParam({ name: 'id', description: 'Album UUID' })
  @ApiResponse({ status: 200, type: AlbumResponseDto })
  @ApiResponse({ status: 404, description: 'Album not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAlbumDto,
  ): Promise<AlbumResponseDto> {
    return this.albumService.update(id, dto)
  }

  // ─── DELETE /albums/:id ───────────────────────────────────────────────────
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an album' })
  @ApiParam({ name: 'id', description: 'Album UUID' })
  @ApiResponse({ status: 204, description: 'Album deleted' })
  @ApiResponse({ status: 404, description: 'Album not found' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.albumService.delete(id)
  }
}
