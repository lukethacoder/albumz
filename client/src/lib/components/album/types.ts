export type RootProps = {
  albumId: string
  title: string
  artist: string
  coverUrl: string | null
  releaseDate: string | null
  dateCompleted?: Date | string | null
  selected?: boolean
  onToggleSelect?: (albumId: string, shiftKey: boolean) => void
  onDeleteAlbum?: (albumId: string, title: string) => Promise<void>
}
