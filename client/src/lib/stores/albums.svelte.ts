import { trpc } from '$lib/trpc/client'
import { goto } from '$app/navigation'
import { invalidateAll } from '$app/navigation'
import { resolve } from '$app/paths'

interface Album {
  id: string
  title: string
  artist: string
  genre?: string | null
  releaseDate?: string | null
  description?: string | null
  coverUrl?: string | null
}

interface UpdateAlbumData {
  title?: string
  artist?: string
  genre?: string
  releaseDate?: string
  description?: string
  coverUrl?: string
}

interface AlbumOperation {
  loading: boolean
  error: string | null
}

// Track operations per album ID
const operations = $state<Record<string, AlbumOperation>>({})

function getOrCreateOperation(id: string): AlbumOperation {
  if (!operations[id]) {
    operations[id] = { loading: false, error: null }
  }
  return operations[id]
}

function getOperationSafe(id: string): AlbumOperation {
  return operations[id] || { loading: false, error: null }
}

export const albumsStore = {
  /**
   * Check if an album operation is in progress
   */
  isLoading(id: string): boolean {
    return getOperationSafe(id).loading
  },

  /**
   * Get error for an album operation
   */
  getError(id: string): string | null {
    return getOperationSafe(id).error
  },

  /**
   * Clear error for an album
   */
  clearError(id: string) {
    const op = getOrCreateOperation(id)
    op.error = null
  },

  /**
   * Update an album
   */
  async update(id: string, data: UpdateAlbumData): Promise<Album | null> {
    const op = getOrCreateOperation(id)
    op.loading = true
    op.error = null

    try {
      const updated = await trpc.albums.update.mutate({ id, data })

      // Refresh page data to show updated album
      await invalidateAll()

      return updated
    } catch (err) {
      const error = err as { message?: string }
      op.error = error.message || 'Failed to update album'
      console.error('Update album error:', err)
      return null
    } finally {
      op.loading = false
    }
  },

  /**
   * Delete an album
   * @param id Album ID to delete
   * @param redirectAfter Whether to redirect to home page after deletion (default: false)
   */
  async delete(id: string, redirectAfter = false): Promise<boolean> {
    const op = getOrCreateOperation(id)
    op.loading = true
    op.error = null

    try {
      await trpc.albums.delete.mutate({ id })

      if (redirectAfter) {
        // Redirect to home page
        goto(resolve('/'))
      } else {
        // Just refresh the current page data
        await invalidateAll()
      }

      return true
    } catch (err) {
      const error = err as { message?: string }
      op.error = error.message || 'Failed to delete album'
      console.error('Delete album error:', err)
      return false
    } finally {
      op.loading = false
    }
  },

  /**
   * Delete with confirmation dialog
   */
  async deleteWithConfirm(id: string, albumTitle: string, redirectAfter = false): Promise<boolean> {
    const confirmed = confirm(
      `Are you sure you want to delete "${albumTitle}"? This action cannot be undone.`,
    )

    if (!confirmed) return false

    return this.delete(id, redirectAfter)
  },

  /**
   * Mark album as complete or incomplete
   * @param id Album ID
   * @param completed Whether the album should be marked as complete
   */
  async markComplete(id: string, completed: boolean): Promise<Album | null> {
    const op = getOrCreateOperation(id)
    op.loading = true
    op.error = null

    try {
      const updated = await trpc.albums.markComplete.mutate({ id, completed })

      // Refresh page data to show updated status
      await invalidateAll()

      return updated
    } catch (err) {
      const error = err as { message?: string }
      op.error = error.message || 'Failed to update completion status'
      console.error('Mark complete error:', err)
      return null
    } finally {
      op.loading = false
    }
  },

  /**
   * Toggle completion status
   * @param id Album ID
   * @param currentlyCompleted Current completion status
   */
  async toggleComplete(id: string, currentlyCompleted: boolean): Promise<Album | null> {
    return this.markComplete(id, !currentlyCompleted)
  },
}
