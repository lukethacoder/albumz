import { trpc } from '$lib/trpc/client'
import { invalidateAll } from '$app/navigation'

export type ImportStatus = 'pending' | 'processing' | 'complete' | 'error'

const STORAGE_KEY = 'albumz_import_job'
const POLL_INTERVAL_MS = 2000
const DISMISS_DELAY_MS = 3000

let jobId = $state<string | null>(null)
let status = $state<ImportStatus | null>(null)
let step = $state<string | null>(null)
let errorMsg = $state<string | null>(null)
let totalAlbums = $state<number | null>(null)
let processedAlbums = $state<number | null>(null)

let pollInterval: ReturnType<typeof setInterval> | null = null
let lastProcessedAlbums = 0

function stopPolling() {
  if (pollInterval !== null) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

async function poll() {
  if (!jobId) return
  try {
    const result = await trpc.albums.getImportStatus.query({ jobId: jobId! })
    status = result.status
    step = result.step
    errorMsg = result.error
    totalAlbums = result.totalAlbums ?? null
    const newProcessed = result.processedAlbums ?? 0
    if (newProcessed > lastProcessedAlbums) {
      lastProcessedAlbums = newProcessed
      void invalidateAll()
    }
    processedAlbums = newProcessed

    if (result.status === 'complete') {
      stopPolling()
      localStorage.removeItem(STORAGE_KEY)
      await invalidateAll()
      setTimeout(() => {
        jobId = null
        status = null
        step = null
        totalAlbums = null
        processedAlbums = null
      }, DISMISS_DELAY_MS)
    } else if (result.status === 'error') {
      stopPolling()
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // Silently ignore transient poll errors
  }
}

export const importStore = {
  get jobId() {
    return jobId
  },
  get status() {
    return status
  },
  get step() {
    return step
  },
  get error() {
    return errorMsg
  },
  get totalAlbums() {
    return totalAlbums
  },
  get processedAlbums() {
    return processedAlbums
  },

  start(id: string) {
    stopPolling()
    jobId = id
    status = 'pending'
    step = null
    errorMsg = null
    lastProcessedAlbums = 0
    localStorage.setItem(STORAGE_KEY, id)
    void poll()
    pollInterval = setInterval(() => void poll(), POLL_INTERVAL_MS)
  },

  restore() {
    if (typeof localStorage === 'undefined') return
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && !jobId) {
      this.start(saved)
    }
  },

  dismiss() {
    stopPolling()
    jobId = null
    status = null
    step = null
    errorMsg = null
    totalAlbums = null
    processedAlbums = null
    lastProcessedAlbums = 0
    localStorage.removeItem(STORAGE_KEY)
  },
}
