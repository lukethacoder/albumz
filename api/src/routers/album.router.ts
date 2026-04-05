import { z } from 'zod'
import { router, protectedProcedure } from '../trpc/trpc'
import {
  createAlbumSchema,
  updateAlbumSchema,
  albumFilterSchema,
} from '../schemas/album.schema'
import { AlbumService } from '../services/album.service'
import { AlbumRepository } from '../repositories/album.repository'

export const albumRouter = router({
  list: protectedProcedure
    .input(albumFilterSchema)
    .query(async ({ input, ctx }) => {
      const albumRepo = new AlbumRepository(ctx.db)
      const albumService = new AlbumService(albumRepo)

      // If filtering by specific artist, use the dedicated method
      if (input.artist) {
        return albumService.findByArtist(input.artist, ctx.user.id)
      }

      // Otherwise use findAll with filters
      return albumService.findAll(ctx.user.id, input)
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const albumRepo = new AlbumRepository(ctx.db)
      const albumService = new AlbumService(albumRepo)
      return albumService.findById(input.id, ctx.user.id)
    }),

  create: protectedProcedure
    .input(createAlbumSchema)
    .mutation(async ({ input, ctx }) => {
      const albumRepo = new AlbumRepository(ctx.db)
      const albumService = new AlbumService(albumRepo)
      return albumService.create(input, ctx.user.id)
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string().uuid(), data: updateAlbumSchema }))
    .mutation(async ({ input, ctx }) => {
      const albumRepo = new AlbumRepository(ctx.db)
      const albumService = new AlbumService(albumRepo)
      return albumService.update(input.id, ctx.user.id, input.data)
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const albumRepo = new AlbumRepository(ctx.db)
      const albumService = new AlbumService(albumRepo)
      await albumService.delete(input.id, ctx.user.id)
      return { success: true }
    }),

  markComplete: protectedProcedure
    .input(z.object({ id: z.string().uuid(), completed: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const albumRepo = new AlbumRepository(ctx.db)
      const albumService = new AlbumService(albumRepo)

      const dateCompleted = input.completed ? new Date() : null

      return albumService.update(input.id, ctx.user.id, { dateCompleted })
    }),
})
