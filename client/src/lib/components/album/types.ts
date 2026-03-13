export type RootProps = {
  albumId: string
  title: string
  artist: string
  coverUrl: string
  releaseDate: string
  onDeleteAlbum: (albumId: string) => Promise<void>
}
