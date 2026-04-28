import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { count, eq } from 'drizzle-orm'
import * as schema from './schema'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as bcrypt from 'bcrypt'

type DbType = NodePgDatabase<typeof schema> & {
  $client: Pool
}

const ALBUMS_MOCK_DATA = [
  {
    id: 'c8601925-4bb0-4d43-94c5-c75c0d8f4a3c',
    title: 'Conclusion of an Age',
    artist: 'Sylosis',
    genre: 'Thrash Metal',
    releaseDate: '2008-10-24',
    description: '',
    coverUrl:
      'https://lastfm.freetls.fastly.net/i/u/300x300/b5d2caeae0d0aa053512f82500bb77aa.jpg',
    rating: '',
    dateCompleted: '',
    createdAt: '2026-04-28T10:10:15.000Z',
    updatedAt: '2026-04-28T10:10:58.506Z',
    mbid: '1347faed-6499-4400-a3a4-206c14945605',
    urlLastFm: 'https://www.last.fm/music/Sylosis/Conclusion+Of+An+Age',
    urlSpotify: 'https://open.spotify.com/album/0D1nYOLQ825KzIEHoqiDLZ',
    urlAppleMusic: 'https://music.apple.com/gb/album/1556851558',
    urlYoutube: '',
    urlYoutubeMusic: '',
    urlNavidrome: '/app/#/album/5mftawbxU7CLSqZ6UR9vZB/show',
  },
  {
    id: 'ec2a81b2-e0b6-4e1e-abc1-abca8469208d',
    title: 'Chocolate Starfish And The Hot Dog Flavored Water',
    artist: 'Limp Bizkit',
    genre: 'Nu Metal',
    releaseDate: '2000-10-17',
    description: '',
    coverUrl:
      'https://lastfm.freetls.fastly.net/i/u/300x300/9939a159279a21306d8d48a8562a5207.png',
    rating: '',
    dateCompleted: '',
    createdAt: '2026-04-28T10:09:10.000Z',
    updatedAt: '2026-04-28T10:10:58.137Z',
    mbid: '94341c22-13a2-3ef7-a6e1-38caf9bc8f5a',
    urlLastFm:
      'https://www.last.fm/music/Limp+Bizkit/Chocolate+Starfish+and+the+Hot+Dog+Flavored+Water',
    urlSpotify: 'https://open.spotify.com/album/5mi7FKaWE5CtcOjdyxScA7',
    urlAppleMusic:
      'https://music.apple.com/au/album/chocolate-starfish-and-the-hot-dog-flavored-water/1440842682',
    urlYoutube: '',
    urlYoutubeMusic: '',
    urlNavidrome: '/app/#/album/5e9egnXmT4p6mI3IZAo1JA/show',
  },
  {
    id: '487353cf-d755-4fa4-9bd9-d34baf98378f',
    title: 'Sempiternal (Expanded Edition)',
    artist: 'Bring Me The Horizon',
    genre: 'Metalcore;Alternative Metal;Alternative Rock;Post-Hardcore',
    releaseDate: '2013-04-01',
    description: '',
    coverUrl:
      'https://lastfm.freetls.fastly.net/i/u/300x300/bb2d860a26f50afdce45f482dd754b1c.png',
    rating: '',
    dateCompleted: '',
    createdAt: '2026-04-18T05:17:03.000Z',
    updatedAt: '2026-04-28T10:10:53.323Z',
    mbid: '4a39c597-6901-4c44-8a93-92d2f65ce2d8',
    urlLastFm:
      'https://www.last.fm/music/Bring+Me+the+Horizon/Sempiternal+(Expanded+Edition)',
    urlSpotify: 'https://open.spotify.com/album/6IYPmM3xsOPL2XPSvf1ZAz',
    urlAppleMusic: 'https://music.apple.com/au/album/sempiternal/598282638',
    urlYoutube: '',
    urlYoutubeMusic: '',
    urlNavidrome: '',
  },
  {
    id: 'f86d0807-a973-4e02-89e2-73641aebf824',
    title: 'Paranoid (2009 Remastered Version)',
    artist: 'Black Sabbath',
    genre: 'Heavy Metal;Hard Rock;Classic Rock;Metal',
    releaseDate: '1970-09-18',
    description: '',
    coverUrl:
      'https://lastfm.freetls.fastly.net/i/u/300x300/b9a0bf244aef80f2947e2c64776f3d9b.png',
    rating: '',
    dateCompleted: '',
    createdAt: '2026-04-18T05:16:42.000Z',
    updatedAt: '2026-04-28T10:10:53.635Z',
    mbid: '188fb66b-2fd9-41a7-8d81-088e20714ad1',
    urlLastFm:
      'https://www.last.fm/music/Black+Sabbath/Paranoid+(2009+Remastered+Version)',
    urlSpotify: 'https://open.spotify.com/album/7LGVdC9fFwgWYaIrZwsSv6',
    urlAppleMusic: 'https://music.apple.com/au/album/paranoid/1533659667',
    urlYoutube: '',
    urlYoutubeMusic: '',
    urlNavidrome: '',
  },
  {
    id: 'd89abfd6-adbe-4ce7-8a90-eab562e8c0ae',
    title: 'Ventura',
    artist: 'Anderson .Paak',
    genre: 'Funk',
    releaseDate: '2019-04-12',
    description: '',
    coverUrl:
      'https://lastfm.freetls.fastly.net/i/u/300x300/ea83c736ad1bafd445031abfabc55fb9.jpg',
    rating: '',
    dateCompleted: '',
    createdAt: '2026-04-18T05:16:15.000Z',
    updatedAt: '2026-04-28T10:10:58.017Z',
    mbid: 'f30e9f19-f0da-4eb5-bea4-0dfd75f5cae2',
    urlLastFm: 'https://www.last.fm/music/Anderson+.Paak/Ventura',
    urlSpotify:
      'https://open.spotify.com/album/0YF8PfcGbsKg5IaFyPnlyY?si=CSqlmx1qSUiW4HhQj1tbcg',
    urlAppleMusic: 'https://music.apple.com/au/album/ventura/1456218234',
    urlYoutube: '',
    urlYoutubeMusic: '',
    urlNavidrome: '/app/#/album/6SSIowjjAO7mZQZKBcCnpx/show',
  },
  {
    id: 'caeba804-133b-43e2-932b-4ae82e42fc07',
    title: 'Rust In Peace',
    artist: 'Megadeth',
    genre: 'Thrash Metal',
    releaseDate: '1990-01-01',
    description: '',
    coverUrl:
      'https://lastfm.freetls.fastly.net/i/u/300x300/95f90daf3aecb78c029dcf8bacb502c2.png',
    rating: '',
    dateCompleted: '',
    createdAt: '2026-04-18T05:15:39.000Z',
    updatedAt: '2026-04-28T10:10:56.798Z',
    mbid: '6e3fff02-141d-48f7-92ec-2bd23128d396',
    urlLastFm: 'https://www.last.fm/music/Megadeth/Rust+In+Peace',
    urlSpotify: 'https://open.spotify.com/album/4e6ML9RBhDyyKTaTwbiRZv',
    urlAppleMusic: 'https://music.apple.com/au/album/rust-in-peace/724648893',
    urlYoutube: '',
    urlYoutubeMusic: '',
    urlRateYourMusic:
      'https://rateyourmusic.com/release/album/megadeth/rust_in_peace/',
    urlNavidrome: '/app/#/album/28UnuC9C26d1SXxhcHPVB8/show',
  },
  {
    id: 'bb8aafba-e277-49bc-aa83-787dc89c7753',
    title: 'Alfredo',
    artist: 'Freddie Gibbs; The Alchemist',
    genre: 'Hip Hop',
    releaseDate: '2020-05-29',
    description: '',
    coverUrl:
      'https://lastfm.freetls.fastly.net/i/u/300x300/943f180f89e5ce5cff90d5371c25dc27.jpg',
    rating: '',
    dateCompleted: '',
    createdAt: '2026-04-18T05:15:23.000Z',
    updatedAt: '2026-04-28T10:10:57.924Z',
    mbid: '011334c4-6946-46e7-9e18-84dfabe8beca',
    urlLastFm: 'https://www.last.fm/music/Freddie+Gibbs;+The+Alchemist/Alfredo',
    urlSpotify: 'https://open.spotify.com/album/3znl1qe13kyjQv7KcR685N',
    urlAppleMusic: 'https://music.apple.com/fr/album/alfredo/1513978902',
    urlYoutube:
      'https://www.youtube.com/playlist?list=OLAK5uy_nxrLMCTf1MNMmqe-AJCGa2YJygwfFM5gI',
    urlYoutubeMusic:
      'https://music.youtube.com/playlist?list=OLAK5uy_nxrLMCTf1MNMmqe-AJCGa2YJygwfFM5gI',
    urlNavidrome: '/app/#/album/5P3Hy55oE0Yx68Eccu7sAn/show',
  },
  {
    id: '95937335-6c09-4611-b7c6-097729f17f38',
    title: 'The Poison',
    artist: 'Bullet For My Valentine',
    genre: 'Metalcore',
    releaseDate: '2005-01-01',
    description: '',
    coverUrl:
      'https://lastfm.freetls.fastly.net/i/u/300x300/91136e05c4064d699064bff81a6e5c79.png',
    rating: '',
    dateCompleted: '',
    createdAt: '2026-04-18T05:15:00.000Z',
    updatedAt: '2026-04-28T10:10:57.927Z',
    mbid: 'edf254d1-4f54-4d04-96de-ca8c4591ddec',
    urlLastFm: 'https://www.last.fm/music/Bullet+for+My+Valentine/The+Poison',
    urlSpotify: 'https://open.spotify.com/album/58TQcPpRD9XcXhUDWF5P27',
    urlAppleMusic: 'https://music.apple.com/au/album/the-poison/362420407',
    urlYoutube: '',
    urlYoutubeMusic: '',
    urlNavidrome: '/app/#/album/3DYOyZT0ae7n4QIW79zVt3/show',
  },
  {
    id: '995d5c7d-9a4d-48ff-b0b0-47f4742047fc',
    title: 'Wings of Fire',
    artist: 'Brymir',
    genre: 'Epic Metal',
    releaseDate: '2019-03-08',
    description: '',
    coverUrl:
      'https://lastfm.freetls.fastly.net/i/u/300x300/47ad50484a578e6fd129cf518abbed5f.jpg',
    rating: '',
    dateCompleted: '',
    createdAt: '2026-04-18T05:14:30.000Z',
    updatedAt: '2026-04-28T10:10:57.942Z',
    mbid: '018dce92-244a-4f5e-acdf-13ae3e433fb4',
    urlLastFm: 'https://www.last.fm/music/Brymir/Wings+of+Fire',
    urlSpotify: 'https://open.spotify.com/album/5NxQnhIKRliz2poq0knWgn',
    urlAppleMusic: 'https://music.apple.com/au/album/wings-of-fire/1785257439',
    urlYoutube: '',
    urlYoutubeMusic: '',
    urlNavidrome: '/app/#/album/1G8txSKk0EOfRkhqkwGUOa/show',
  },
  {
    id: 'f36d5137-1525-490c-9eaf-b50828a1fd40',
    title: 'Hybrid Theory',
    artist: 'Linkin Park',
    genre: 'Alternative Metal',
    releaseDate: '2000-10-24',
    description: '',
    coverUrl:
      'https://lastfm.freetls.fastly.net/i/u/300x300/c21b3923a4d3ff5629996f3f8e178140.jpg',
    rating: '',
    dateCompleted: '',
    createdAt: '2026-04-18T05:14:07.000Z',
    updatedAt: '2026-04-28T10:10:56.787Z',
    mbid: '68876be8-3943-46b4-9c39-14a6cd18dd83',
    urlLastFm: 'https://www.last.fm/music/Linkin+Park/Hybrid+Theory',
    urlSpotify: 'https://open.spotify.com/album/2pKw6GERJVAD61449B1EEM',
    urlAppleMusic: 'https://music.apple.com/au/album/hybrid-theory/528436018',
    urlYoutube: '',
    urlYoutubeMusic: '',
    urlRateYourMusic:
      'https://rateyourmusic.com/release/album/linkin_park/hybrid_theory/',
    urlNavidrome: '/app/#/album/6l5GNUHcjCTWEzh797gqQR/show',
  },
  {
    id: 'e85a5cb1-dc0b-4028-b4db-9b042b7423f3',
    title: 'Mellon Collie And The Infinite Sadness (Deluxe Edition)',
    artist: 'The Smashing Pumpkins',
    genre: 'Alternative Rock;Rock;Alternative;Grunge',
    releaseDate: '1995-01-01',
    description: '',
    coverUrl:
      'https://lastfm.freetls.fastly.net/i/u/300x300/2a453e940a8945b4c5b2766f76ece94a.jpg',
    rating: '',
    dateCompleted: '',
    createdAt: '2026-04-18T05:13:32.000Z',
    updatedAt: '2026-04-28T10:10:51.863Z',
    mbid: 'a5ab3120-e5db-4ed9-a966-80bc9698528d',
    urlLastFm:
      'https://www.last.fm/music/The+Smashing+Pumpkins/Mellon+Collie+and+the+Infinite+Sadness+(Deluxe+Edition)',
    urlSpotify: 'https://open.spotify.com/album/55RhFRyQFihIyGf61MgcfV',
    urlAppleMusic:
      'https://music.apple.com/au/album/mellon-collie-and-the-infinite-sadness-2012-remastered/721224313',
    urlYoutube: '',
    urlYoutubeMusic: '',
    urlNavidrome: '',
  },
  {
    id: 'febec91c-0bac-446b-af72-f798029370f0',
    title: 'Powerslave (2015 Remaster)',
    artist: 'Iron Maiden',
    genre: 'Heavy Metal;Albums;Favourite Albums;Heavy Metal Albums',
    releaseDate: '1984-01-01',
    description: '',
    coverUrl:
      'https://lastfm.freetls.fastly.net/i/u/300x300/bbda3f24cb510ee8237f0ad474cbe81f.png',
    rating: '',
    dateCompleted: '',
    createdAt: '2026-04-18T05:12:58.000Z',
    updatedAt: '2026-04-28T10:10:52.384Z',
    mbid: '8d38a676-8ebd-40ea-8425-038feb264ad0',
    urlLastFm:
      'https://www.last.fm/music/Iron+Maiden/Powerslave+(2015+Remaster)',
    urlSpotify: 'https://open.spotify.com/album/309KOMEivisMmBuzk09635',
    urlAppleMusic: 'https://music.apple.com/au/album/powerslave/980112277',
    urlYoutube: '',
    urlYoutubeMusic: '',
    urlNavidrome: '',
  },
  {
    id: '86779f26-5122-46f4-a580-828f6ebde934',
    title: 'Alien',
    artist: 'Northlane',
    genre: 'Hardcore Punk',
    releaseDate: '2019-08-02',
    description: '',
    coverUrl:
      'https://lastfm.freetls.fastly.net/i/u/300x300/ed5485fc219186d873b03552d604f64d.jpg',
    rating: '',
    dateCompleted: '',
    createdAt: '2026-04-18T05:12:45.000Z',
    updatedAt: '2026-04-28T10:10:58.016Z',
    mbid: 'fc610978-1a6a-43c9-845f-2cbd47dba210',
    urlLastFm: 'https://www.last.fm/music/Northlane/Alien',
    urlSpotify: 'https://open.spotify.com/album/1R8fmRme77vO50WNxygKJF',
    urlAppleMusic: 'https://music.apple.com/au/album/alien/1761394682',
    urlYoutube: '',
    urlYoutubeMusic: '',
    urlNavidrome: '/app/#/album/1lsjVCyCaQxp2TXEPiP4kz/show',
  },
  {
    id: '19d652b7-6496-447b-9559-71eaa7a3e121',
    title: 'Themata',
    artist: 'Karnivool',
    genre: 'Post-Grunge',
    releaseDate: '2005-01-01',
    description: '',
    coverUrl:
      'https://lastfm.freetls.fastly.net/i/u/300x300/abfc2e77ffa04c0a9516005335386cf1.png',
    rating: '',
    dateCompleted: '',
    createdAt: '2026-04-18T05:12:34.000Z',
    updatedAt: '2026-04-28T10:10:58.023Z',
    mbid: 'c9f364c9-aedd-44db-b73b-51c6081d3837',
    urlLastFm: 'https://www.last.fm/music/Karnivool/Themata',
    urlSpotify: 'https://open.spotify.com/album/4XeudemanAeaNBBWIukwhK',
    urlAppleMusic: 'https://music.apple.com/au/album/themata/85100562',
    urlYoutube: '',
    urlYoutubeMusic: '',
    urlNavidrome: '/app/#/album/1r8oaP2V0iRbPCprJqA3Az/show',
  },
  {
    id: '7253b2e6-12e0-4c12-815b-e7fe285a4f06',
    title: 'A Whisp of the Atlantic',
    artist: 'Soilwork',
    genre: 'Melodic Death Metal',
    releaseDate: '2020-12-04',
    description: '',
    coverUrl:
      'https://lastfm.freetls.fastly.net/i/u/300x300/56462ecbb24e2bff5c9ddc21d9819e31.jpg',
    rating: '',
    dateCompleted: '',
    createdAt: '2026-04-18T05:12:22.000Z',
    updatedAt: '2026-04-28T10:10:58.376Z',
    mbid: '609d08aa-4237-4d87-92b9-15fdc31a1417',
    urlLastFm: 'https://www.last.fm/music/Soilwork/A+Whisp+of+the+Atlantic',
    urlSpotify: 'https://open.spotify.com/album/2kfEp1njqSlg9hS1A0fXW7',
    urlAppleMusic:
      'https://music.apple.com/au/album/a-whisp-of-the-atlantic/1586780518',
    urlYoutube: '',
    urlYoutubeMusic: '',
    urlNavidrome: '/app/#/album/6barGyKGIWhA7qbkvQrLlV/show',
  },
  {
    id: '67fac92e-b221-482c-9c24-a4198421b214',
    title: 'Ashes of the Wake',
    artist: 'Lamb of God',
    genre: 'Death Metal;Heavy Metal;Alternative Metal;Rock;Thrash Metal',
    releaseDate: '2004-08-26',
    description: '',
    coverUrl:
      'https://lastfm.freetls.fastly.net/i/u/300x300/983c30e627814cf04ddd5db4e697deb0.png',
    rating: '',
    dateCompleted: '',
    createdAt: '2026-04-18T05:11:50.000Z',
    updatedAt: '2026-04-28T10:10:51.470Z',
    mbid: '1cef6a09-0ae9-4283-96e0-8cb1861970d7',
    urlLastFm:
      'https://www.last.fm/music/Lamb+of+God/Ashes+of+the+Wake+(15th+Anniversary)',
    urlSpotify: 'https://open.spotify.com/album/7CwtVHoJ9cl6YEQjsSeEca',
    urlAppleMusic:
      'https://music.apple.com/au/album/ashes-of-the-wake-20th-anniversary-edition/1749340898',
    urlYoutube: '',
    urlYoutubeMusic: '',
    urlNavidrome: '',
  },
  {
    id: '3369af9b-0d75-42dd-90af-6b37c0154cb7',
    title: 'Tana Talk 3',
    artist: 'Benny The Butcher',
    genre: 'Hip Hop',
    releaseDate: '2018-11-23',
    description: '',
    coverUrl:
      'https://lastfm.freetls.fastly.net/i/u/300x300/8a94892b239de2c62a6a6f41ce4e6dea.png',
    rating: '',
    dateCompleted: '',
    createdAt: '2026-04-18T05:11:39.000Z',
    updatedAt: '2026-04-28T10:10:58.549Z',
    mbid: '20233c95-f9c3-472e-94bc-a00c585833ee',
    urlLastFm: 'https://www.last.fm/music/Benny+the+Butcher/Tana+Talk+3',
    urlSpotify: 'https://open.spotify.com/album/5OsHMGOg6lRV9REoVxbcWA',
    urlAppleMusic: 'https://itunes.apple.com/sk/album/id1443668291',
    urlYoutube: '',
    urlYoutubeMusic: '',
    urlNavidrome: '/app/#/album/3B2WAO7ricKkAnWTGPTJB7/show',
  },
  {
    id: 'c2cac2ae-f800-4d6a-aa89-c1109fcef3e8',
    title: 'Images and Words',
    artist: 'Dream Theater',
    genre: 'Progressive Metal',
    releaseDate: '1992-06-30',
    description: '',
    coverUrl:
      'https://lastfm.freetls.fastly.net/i/u/300x300/cf47afa9760249238e3269e61b5facb4.png',
    rating: '',
    dateCompleted: '',
    createdAt: '2026-04-18T05:11:13.000Z',
    updatedAt: '2026-04-28T10:10:57.983Z',
    mbid: 'f20971f2-c8ad-4d26-91ab-730f6dedafb2',
    urlLastFm: 'https://www.last.fm/music/Dream+Theater/Images+and+Words',
    urlSpotify: 'https://open.spotify.com/album/2QgGoL5VSQhPHudTObS7zK',
    urlAppleMusic:
      'https://music.apple.com/au/album/images-and-words/282703578',
    urlYoutube: '',
    urlYoutubeMusic: '',
    urlRateYourMusic:
      'https://rateyourmusic.com/release/album/dream-theater/images-and-words/',
    urlNavidrome: '/app/#/album/218n0TjHKamTGSTdHd725W/show',
  },
  {
    id: '80d05da7-186c-4fe5-9e30-d95d27980e62',
    title: 'Fortitude',
    artist: 'Gojira',
    genre: 'Death Metal',
    releaseDate: '2021-04-30',
    description: '',
    coverUrl:
      'https://lastfm.freetls.fastly.net/i/u/300x300/4750c900c8b7b9e945e020e7400396f1.jpg',
    rating: '',
    dateCompleted: '',
    createdAt: '2026-04-18T05:11:05.000Z',
    updatedAt: '2026-04-28T10:10:57.923Z',
    mbid: '626ac662-c4e1-4d58-b2d5-23bc87c39db3',
    urlLastFm: 'https://www.last.fm/music/Gojira/Fortitude',
    urlSpotify: 'https://open.spotify.com/album/3bmdzJRZ4DLRTiA6yBBQcI',
    urlAppleMusic: 'https://music.apple.com/au/album/fortitude/1553446829',
    urlYoutube: '',
    urlYoutubeMusic: '',
    urlNavidrome: '/app/#/album/3O0sD8reaLEioNR12FpusQ/show',
  },
  {
    id: '5b9384c0-4c0a-4d16-b7ee-4bd0979a9841',
    title: 'City of Evil',
    artist: 'Avenged Sevenfold',
    genre: 'Heavy Metal',
    releaseDate: '2005-06-06',
    description: '',
    coverUrl:
      'https://lastfm.freetls.fastly.net/i/u/300x300/50f59fc2dcff4345c3d492e1a71f634f.png',
    rating: '',
    dateCompleted: '',
    createdAt: '2026-04-18T05:10:41.000Z',
    updatedAt: '2026-04-28T10:10:58.513Z',
    mbid: 'd48cd5fa-190c-33a2-a1cd-c4417d0ef96b',
    urlLastFm: 'https://www.last.fm/music/Avenged+Sevenfold/City+of+Evil',
    urlSpotify: 'https://open.spotify.com/album/55tK4Ab7XHTOKkw0xDz3AA',
    urlAppleMusic: 'https://music.apple.com/au/album/city-of-evil/65621096',
    urlYoutube: '',
    urlYoutubeMusic: '',
    urlNavidrome: '/app/#/album/2iE95qOTqcs0LJbAM4ZzWh/show',
  },
  {
    id: '346a582f-e9a5-4394-abfc-f4a4a522ba6e',
    title: 'What The Dead Men Say',
    artist: 'Trivium',
    genre: 'Alternative Metal',
    releaseDate: '2020-04-24',
    description: '',
    coverUrl:
      'https://lastfm.freetls.fastly.net/i/u/300x300/2d6e4cca65e5d4631c4b4f142fa1a60d.png',
    rating: '',
    dateCompleted: '',
    createdAt: '2026-04-18T05:10:19.000Z',
    updatedAt: '2026-04-28T10:10:58.353Z',
    mbid: 'd5a3e463-6746-4f0b-9e72-bb0635f583e4',
    urlLastFm: 'https://www.last.fm/music/Trivium/What+The+Dead+Men+Say',
    urlSpotify: 'https://open.spotify.com/album/0aXIJYbWk4u41iJmoJmp8y',
    urlAppleMusic:
      'https://music.apple.com/au/album/what-the-dead-men-say/1499575032',
    urlYoutube: '',
    urlYoutubeMusic: '',
    urlNavidrome: '/app/#/album/6c4cjcQsQVLNP7IOOmVVBP/show',
  },
  {
    id: 'd45f621e-16a7-4514-8698-27fa5294a73c',
    title: 'Shogun (Special Edition)',
    artist: 'Trivium',
    genre: 'Thrash Metal;Metalcore;Metal;Heavy Metal;Trivium',
    releaseDate: '2008-09-24',
    description: '',
    coverUrl:
      'https://lastfm.freetls.fastly.net/i/u/300x300/739de6381f0638d2283e6b0402a752f0.jpg',
    rating: '',
    dateCompleted: '',
    createdAt: '2026-04-18T05:10:12.000Z',
    updatedAt: '2026-04-28T10:10:52.768Z',
    mbid: '305d6441-ffab-4ead-9af0-5185a67e5bca',
    urlLastFm: 'https://www.last.fm/music/Trivium/Shogun+(Special+Edition)',
    urlSpotify: 'https://open.spotify.com/album/0kIXzVzbFuUf5kxM8US67m',
    urlAppleMusic: 'https://music.apple.com/au/album/shogun/291308413',
    urlYoutube: '',
    urlYoutubeMusic: '',
    urlNavidrome: '',
  },
  {
    id: 'beb4c8c5-079b-4f98-95e9-8877d85bafc0',
    title: 'In The Court Of The Dragon',
    artist: 'Trivium',
    genre: 'Heavy Metal',
    releaseDate: '2021-10-08',
    description: '',
    coverUrl:
      'https://lastfm.freetls.fastly.net/i/u/300x300/d118186d9e8ceea459b640883eeaabf1.jpg',
    rating: '',
    dateCompleted: '',
    createdAt: '2026-04-18T05:10:05.000Z',
    updatedAt: '2026-04-28T10:10:58.344Z',
    mbid: '0e79db43-c688-4fc0-8859-7aa13696ae5d',
    urlLastFm: 'https://www.last.fm/music/Trivium/In+The+Court+Of+The+Dragon',
    urlSpotify: 'https://open.spotify.com/album/0mrtkWYrUzTuFwyiiQPdQs',
    urlAppleMusic: 'https://music.apple.com/us/album/1580064968',
    urlYoutube:
      'https://www.youtube.com/playlist?list=OLAK5uy_k6Jj-bNBv2Sm9vPMk6-URYZAga8GRM45o',
    urlYoutubeMusic:
      'https://music.youtube.com/playlist?list=OLAK5uy_lLMyiXCretRv0nkf7Evk4GJnFNxqVil9I',
    urlNavidrome: '/app/#/album/37tQYy9OcJyaFv08RVxKcy/show',
  },
  {
    id: 'e7c4cfc3-8936-4fad-873d-1fed8af1d6ac',
    title: 'The New Flesh',
    artist: 'Sylosis',
    genre: 'Melodic Death Metal',
    releaseDate: '2026-02-20',
    description: '',
    coverUrl:
      'https://lastfm.freetls.fastly.net/i/u/300x300/c1295f52f13ce895ce816895b2daf763.jpg',
    rating: '',
    dateCompleted: '',
    createdAt: '2026-04-18T05:09:32.000Z',
    updatedAt: '2026-04-28T10:10:58.513Z',
    mbid: '8bd344f0-2a2a-4767-9b60-4c184c11d136',
    urlLastFm: 'https://www.last.fm/music/Sylosis/The+New+Flesh',
    urlSpotify: 'https://open.spotify.com/album/1cTxv3R4nOPQnR7et4cFkz',
    urlAppleMusic: 'https://music.apple.com/gb/album/1850926780',
    urlYoutube: '',
    urlYoutubeMusic: '',
    urlNavidrome: '/app/#/album/2aeGkMm5UV5Vh7bCz1ONo5/show',
  },
]

async function seedUser(db: DbType, username = 'admin'): Promise<string> {
  // Check if admin user already exists
  const [existingUser] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.username, username))
    .limit(1)

  if (existingUser) {
    console.log('ℹ️  Admin user already exists')
    return existingUser.id
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash('password', 10)

  // Create admin user
  const [user] = await db
    .insert(schema.users)
    .values({
      email: `${username}@albumz.local`,
      username: username,
      password: hashedPassword,
      isActive: true,
    })
    .returning()

  console.log('✅ Created admin user (username: admin, password: password)')
  return user.id
}

async function seedAlbums(db: DbType, userId: string) {
  // Check if user already has albums
  const [result] = await db
    .select({ count: count() })
    .from(schema.albums)
    .where(eq(schema.albums.userId, userId))
  const albumCount = Number(result.count)

  if (albumCount > 0) {
    console.log(
      `ℹ️  User already has ${albumCount} albums. Skipping album seed.`,
    )
    return
  }

  console.log('🌱 Seeding albums...')

  // Add your seed data here
  const albums = await db
    .insert(schema.albums)
    .values(ALBUMS_MOCK_DATA.map((item) => ({ ...item, userId })))
    .returning()

  console.log(`✅ Seeded ${albums.length} albums`)
}

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  const db = drizzle(pool, { schema })

  console.log(
    '🌱 Checking database...seeding with initial data if not provided',
  )

  // Seed user first
  const userId = await seedUser(db)

  // Then seed albums with the user's ID
  await seedAlbums(db, userId)

  // Seed second user
  const userId2 = await seedUser(db, 'user2')

  // seed albums for second user
  await seedAlbums(db, userId2)

  await pool.end()
  process.exit(0)
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error)
  process.exit(1)
})
