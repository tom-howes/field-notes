import { PrismaClient } from '@prisma/client'
import { countries } from './seed-data/countries'
import { songs } from './seed-data/songs'

const prisma = new PrismaClient()

async function main() {
  for (const country of countries) {
    await prisma.country.upsert({
      where: { isoCode: country.isoCode },
      update: {
        name: country.name,
        region: country.region,
        latitude: country.latitude,
        longitude: country.longitude,
      },
      create: {
        isoCode: country.isoCode,
        name: country.name,
        region: country.region,
        latitude: country.latitude,
        longitude: country.longitude,
        status: 'LOCKED',
      },
    })
  }
  console.log(`Seeded ${countries.length} countries (all LOCKED).`)

  for (const song of songs) {
    const country = await prisma.country.findUniqueOrThrow({ where: { isoCode: song.isoCode } })

    let artist = await prisma.artist.findFirst({ where: { name: song.artist } })
    if (!artist) {
      artist = await prisma.artist.create({ data: { name: song.artist } })
    }

    await prisma.song.upsert({
      where: { spotifyTrackId: song.spotifyTrackId },
      update: { title: song.title, artistId: artist.id, countryId: country.id },
      create: {
        title: song.title,
        artistId: artist.id,
        countryId: country.id,
        spotifyTrackId: song.spotifyTrackId,
      },
    })

    if (country.status !== 'UNLOCKED') {
      await prisma.country.update({ where: { id: country.id }, data: { status: 'UNLOCKED' } })
    }
  }
  console.log(`Seeded ${songs.length} songs, unlocking their countries.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
