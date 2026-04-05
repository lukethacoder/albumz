export type RootProps = {
  albumId: string
  title: string
  artist: string
  coverUrl: string | null
  releaseDate: string | null
  onDeleteAlbum?: (albumId: string, title: string) => Promise<void>
}
