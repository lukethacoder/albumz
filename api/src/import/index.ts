import type { Database } from '../db/database'
import { createJob, updateJob, getJob } from '../services/job-store'
import { ImportPipeline, type JobStore } from './import-pipeline'
import { DbAlbumStore } from './album-store'
import { loadUserImportConfig } from './load-user-config'
import {
  productionMetadataAdapter,
  productionEnrichmentAdapter,
  productionNavidromeAdapter,
} from './adapters.production'

export { ImportPipeline } from './import-pipeline'
export type { ImportStatus, JobStore } from './import-pipeline'
export type {
  MetadataAdapter,
  EnrichmentAdapter,
  NavidromeAdapter,
  AlbumStore,
} from './adapters'

const productionJobStore: JobStore = { createJob, updateJob, getJob }

/**
 * Build an import pipeline wired to the real fetchers and job store, bound to
 * the given database handle.
 */
export function createImportPipeline(db: Database): ImportPipeline {
  return new ImportPipeline({
    db,
    albums: new DbAlbumStore(db),
    metadata: productionMetadataAdapter,
    enrichment: productionEnrichmentAdapter,
    navidrome: productionNavidromeAdapter,
    jobs: productionJobStore,
    loadConfig: loadUserImportConfig,
  })
}
