import { randomUUID } from 'node:crypto'

export type JobStatus = 'pending' | 'processing' | 'complete' | 'error'

export interface ImportJob {
  status: JobStatus
  step: string | null
  albumId: string | null
  error: string | null
  createdAt: Date
  // Playlist-specific progress
  totalAlbums: number | null
  processedAlbums: number | null
}

const jobs = new Map<string, ImportJob>()

export function createJob(): string {
  const id = randomUUID()
  jobs.set(id, {
    status: 'pending',
    step: null,
    albumId: null,
    error: null,
    createdAt: new Date(),
    totalAlbums: null,
    processedAlbums: null,
  })
  return id
}

export function updateJob(
  id: string,
  update: Partial<Omit<ImportJob, 'createdAt'>>,
): void {
  const job = jobs.get(id)
  if (job) Object.assign(job, update)
}

export function getJob(id: string): ImportJob | undefined {
  return jobs.get(id)
}

// Clean up jobs older than 1 hour
setInterval(
  () => {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000)
    for (const [id, job] of jobs) {
      if (job.createdAt < cutoff) jobs.delete(id)
    }
  },
  5 * 60 * 1000,
)
