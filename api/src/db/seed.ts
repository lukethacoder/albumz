import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { count, eq } from 'drizzle-orm'
import * as schema from './schema'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as bcrypt from 'bcrypt'

type DbType = NodePgDatabase<typeof schema> & {
  $client: Pool
}

async function seedUser(db: DbType): Promise<string> {
  // Check if admin user already exists
  const [existingUser] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.username, 'admin'))
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
      email: 'admin@albumz.local',
      username: 'admin',
      password: hashedPassword,
      isActive: true,
    })
    .returning()

  console.log('✅ Created admin user (username: admin, password: password)')
  return user.id
}

async function seedAlbums(db: DbType, userId: string) {
  // Check if database already has albums
  const [result] = await db.select({ count: count() }).from(schema.albums)
  const albumCount = Number(result.count)

  if (albumCount > 0) {
    console.log(
      `ℹ️  Database already has ${albumCount} albums. Skipping album seed.`,
    )
    return
  }

  console.log('🌱 Seeding albums...')

  // Add your seed data here
  const albums = await db
    .insert(schema.albums)
    .values(
      [
        {
          title: 'The New Flesh',
          artist: 'Sylosis',
          releaseDate: '2026-02-20',
          genre: 'Metalcore;Thrash Metal;Melodic Death Metal',
          coverUrl:
            'https://lastfm.freetls.fastly.net/i/u/770x0/c1295f52f13ce895ce816895b2daf763.jpg#c1295f52f13ce895ce816895b2daf763',
        },
        {
          title: 'Ashes of the Wake',
          artist: 'Lamb of God',
          releaseDate: '2004-08-26',
          genre: 'Groove Metal;Metalcore;Thrash Metal',
          coverUrl:
            'https://lastfm.freetls.fastly.net/i/u/770x0/d67e2fa73dbd9aec069e2f27c1b8a992.jpg#d67e2fa73dbd9aec069e2f27c1b8a992',
        },
        {
          title: 'Mellon Collie and the Infinite Sadness',
          artist: 'Smashing Pumpkins',
          releaseDate: '1995-10-23',
          genre: 'Alternative Rock;Grunge;Rock',
          coverUrl:
            'https://lastfm.freetls.fastly.net/i/u/770x0/2a453e940a8945b4c5b2766f76ece94a.jpg#2a453e940a8945b4c5b2766f76ece94a',
        },
        {
          title: 'Chocolate Starfish and the Hot Dog Flavored Water',
          artist: 'Limp Bizkit',
          releaseDate: '2000-01-01',
          genre: 'Nu Metal;Rapcore;Metal;Alternative Metal',
          coverUrl:
            'https://lastfm.freetls.fastly.net/i/u/770x0/9939a159279a21306d8d48a8562a5207.jpg#9939a159279a21306d8d48a8562a5207',
        },
        {
          title:
            'PetroDragonic Apocalypse; or, Dawn of Eternal Night: An Annihilation of Planet Earth and the Beginning of Merciless Damnation',
          artist: 'King Gizzard & The Lizard Wizard',
          releaseDate: '2023-06-16',
          genre: 'Thrash Metal;Progressive Metal;Stoner Metal;Speed Metal',
          coverUrl:
            'https://lastfm.freetls.fastly.net/i/u/770x0/c82a8fb339ad4906f1195fec753cef1f.jpg#c82a8fb339ad4906f1195fec753cef1f',
        },
        {
          title: 'In The Court Of The Dragon',
          artist: 'Trivium',
          releaseDate: '2021-10-08',
          genre: 'Thrash Metal;Metalcore;Heavy Metal',
          coverUrl:
            'https://lastfm.freetls.fastly.net/i/u/770x0/d118186d9e8ceea459b640883eeaabf1.jpg#d118186d9e8ceea459b640883eeaabf1',
        },
        {
          title: 'Images and Words',
          artist: 'Dream Theater',
          releaseDate: '1992-06-29',
          genre: 'Progressive Metal;Progressive Rock;Metal',
          coverUrl:
            'https://lastfm.freetls.fastly.net/i/u/770x0/cf47afa9760249238e3269e61b5facb4.jpg#cf47afa9760249238e3269e61b5facb4',
        },
        {
          title: 'Alfredo',
          artist: 'Freddie Gibbs',
          releaseDate: '2020-05-29',
          genre: 'Hip Hop;Rap;Gangsta Rap',
          coverUrl:
            'https://lastfm.freetls.fastly.net/i/u/770x0/df8bf63dd6640d93dff01ba6133064f5.jpg#df8bf63dd6640d93dff01ba6133064f5',
        },
        {
          title: 'Fortitude',
          artist: 'Gojira',
          releaseDate: '2021-04-29',
          genre: 'Progressive Metal;Groove Metal;Alternative Metal',
          coverUrl:
            'https://lastfm.freetls.fastly.net/i/u/770x0/4750c900c8b7b9e945e020e7400396f1.jpg#4750c900c8b7b9e945e020e7400396f1',
        },
        {
          title: 'A Whisp of the Atlantic',
          artist: 'Soilwork',
          releaseDate: '2020-12-04',
          genre: 'Melodic Death Metal;Metal',
          coverUrl:
            'https://lastfm.freetls.fastly.net/i/u/770x0/10c6d2937edd86d132cf5002e2a1bed3.jpg#10c6d2937edd86d132cf5002e2a1bed3',
        },
        {
          title: 'City of Evil',
          artist: 'Avenged Sevenfold',
          releaseDate: '2025-06-05',
          genre: 'Metalcore;Hard Rock;Heavy Metal',
          coverUrl:
            'https://lastfm.freetls.fastly.net/i/u/770x0/50f59fc2dcff4345c3d492e1a71f634f.jpg#50f59fc2dcff4345c3d492e1a71f634f',
        },
        {
          title: 'Themata',
          artist: 'Karnivool',
          releaseDate: '2005-01-01',
          genre: 'Progressive Rock;Progressive Metal;Alternative Rock',
          coverUrl:
            'https://lastfm.freetls.fastly.net/i/u/770x0/abfc2e77ffa04c0a9516005335386cf1.jpg#abfc2e77ffa04c0a9516005335386cf1',
        },
        {
          title: 'Powerslave',
          artist: 'Iron Maiden',
          releaseDate: '1984-07-23',
          genre: 'Progressive Rock;Progressive Metal;Alternative Rock',
          coverUrl:
            'https://lastfm.freetls.fastly.net/i/u/770x0/bbda3f24cb510ee8237f0ad474cbe81f.jpg#bbda3f24cb510ee8237f0ad474cbe81f',
        },
        {
          title: 'Conclusion Of An Age',
          artist: 'Sylosis',
          releaseDate: '2008-10-24',
          genre: 'Melodic Death Metal;Thrash Metal;Metalcore',
          coverUrl:
            'https://lastfm.freetls.fastly.net/i/u/770x0/b5d2caeae0d0aa053512f82500bb77aa.jpg#b5d2caeae0d0aa053512f82500bb77aa',
        },
        {
          title: 'Shogun',
          artist: 'Trivium',
          releaseDate: '2008-09-24',
          genre: 'Metalcore;Thrash Metal;Heavy Metal;Melodic Death Metal',
          coverUrl:
            'https://lastfm.freetls.fastly.net/i/u/770x0/739de6381f0638d2283e6b0402a752f0.jpg#739de6381f0638d2283e6b0402a752f0',
        },
        {
          title: 'Oxnard',
          artist: 'Anderson .Paak',
          releaseDate: '2018-11-15',
          genre: 'Hip Hop;Rap;Funk',
          coverUrl:
            'https://lastfm.freetls.fastly.net/i/u/770x0/c77009e4bb113806b0cca55cec31dad3.jpg#c77009e4bb113806b0cca55cec31dad3',
        },
      ].map((item) => ({ ...item, userId })),
    )
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

  await pool.end()
  process.exit(0)
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error)
  process.exit(1)
})
