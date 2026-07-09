import type { Database } from '../db/database'
import { AlbumModule } from '../repositories/album.repository'
import type { Album, NewAlbum } from '../db/schema/album.schema'
import type {
  CreateAlbumInput,
  UpdateAlbumInput,
} from '../schemas/album.schema'
import type { AlbumStore } from './adapters'

/**
 * Production `AlbumStore` — delegates to `AlbumModule` for a given database (or
 * transaction) handle. `transaction` opens a real Drizzle transaction and
 * hands the pipeline a store bound to the transaction handle, so create-then-
 * update sequences commit or roll back atomically.
 */
export class DbAlbumStore implements AlbumStore {
  private readonly module: AlbumModule

  constructor(private readonly db: Database) {
    this.module = new AlbumModule(db)
  }

  create(dto: CreateAlbumInput, userId: string): Promise<Album> {
    return this.module.create(dto, userId)
  }

  insert(data: NewAlbum): Promise<Album> {
    return this.module.insert(data)
  }

  update(id: string, userId: string, data: UpdateAlbumInput): Promise<Album> {
    return this.module.update(id, userId, data)
  }

  findById(id: string, userId: string): Promise<Album> {
    return this.module.findById(id, userId)
  }

  transaction<T>(fn: (tx: AlbumStore) => Promise<T>): Promise<T> {
    return this.db.transaction((tx) =>
      fn(new DbAlbumStore(tx as unknown as Database)),
    )
  }
}
