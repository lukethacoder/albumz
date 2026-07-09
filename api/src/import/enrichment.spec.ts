import {
  isNumericGenre,
  toTitleCase,
  GenreSet,
  resolveCoverArt,
  isSpotifySource,
} from './enrichment'

describe('enrichment rules', () => {
  describe('isNumericGenre', () => {
    it.each(['1990', '80s', '  2000  ', '70s'])(
      'treats %p as a numeric (junk) genre',
      (g) => {
        expect(isNumericGenre(g)).toBe(true)
      },
    )

    it.each(['Rock', 'Hip Hop', 'Jazz', '', undefined])(
      'treats %p as a real genre',
      (g) => {
        expect(isNumericGenre(g)).toBe(false)
      },
    )
  })

  describe('toTitleCase', () => {
    it('capitalises the first letter of each word', () => {
      expect(toTitleCase('hip hop')).toBe('Hip Hop')
      expect(toTitleCase('progressive rock')).toBe('Progressive Rock')
    })
  })

  describe('GenreSet', () => {
    it('drops numeric genres and title-cases new additions', () => {
      const set = new GenreSet()
      set.add('rock;1990;hip hop;80s')
      expect(set.toValue()).toBe('Rock;Hip Hop')
    })

    it('deduplicates case-insensitively', () => {
      const set = new GenreSet('Rock')
      set.add('rock;ROCK;metal')
      expect(set.toValue()).toBe('Rock;Metal')
    })

    it('preserves initial genres verbatim', () => {
      const set = new GenreSet('electronic dance')
      expect(set.toValue()).toBe('electronic dance')
    })

    it('returns undefined when empty', () => {
      expect(new GenreSet().toValue()).toBeUndefined()
      expect(new GenreSet('').toValue()).toBeUndefined()
    })

    it('tracks size as genres are added', () => {
      const set = new GenreSet()
      expect(set.size).toBe(0)
      set.add('rock')
      expect(set.size).toBe(1)
      set.add('1990') // numeric — ignored
      expect(set.size).toBe(1)
    })
  })

  describe('resolveCoverArt', () => {
    it('prefers the Spotify source image for Spotify sources', () => {
      expect(
        resolveCoverArt({
          isSpotify: true,
          sourceCover: 'spotify.jpg',
          lastFmCover: 'lastfm.jpg',
          caaCover: 'caa.jpg',
        }),
      ).toBe('spotify.jpg')
    })

    it('falls back to LastFM then CAA when a Spotify source has no image', () => {
      expect(
        resolveCoverArt({
          isSpotify: true,
          sourceCover: undefined,
          lastFmCover: 'lastfm.jpg',
          caaCover: 'caa.jpg',
        }),
      ).toBe('lastfm.jpg')
      expect(
        resolveCoverArt({
          isSpotify: true,
          sourceCover: undefined,
          lastFmCover: undefined,
          caaCover: 'caa.jpg',
        }),
      ).toBe('caa.jpg')
    })

    it('prefers LastFM > CAA > source image for non-Spotify sources', () => {
      expect(
        resolveCoverArt({
          isSpotify: false,
          sourceCover: 'youtube-thumb.jpg',
          lastFmCover: 'lastfm.jpg',
          caaCover: 'caa.jpg',
        }),
      ).toBe('lastfm.jpg')
      expect(
        resolveCoverArt({
          isSpotify: false,
          sourceCover: 'youtube-thumb.jpg',
          lastFmCover: undefined,
          caaCover: 'caa.jpg',
        }),
      ).toBe('caa.jpg')
      expect(
        resolveCoverArt({
          isSpotify: false,
          sourceCover: 'youtube-thumb.jpg',
          lastFmCover: undefined,
          caaCover: undefined,
        }),
      ).toBe('youtube-thumb.jpg')
    })
  })

  describe('isSpotifySource', () => {
    it.each(['spotify_album', 'spotify_track'])('is true for %s', (k) => {
      expect(isSpotifySource(k)).toBe(true)
    })
    it.each(['spotify_playlist', 'youtube', 'apple_music', 'unsupported'])(
      'is false for %s',
      (k) => {
        expect(isSpotifySource(k)).toBe(false)
      },
    )
  })
})
