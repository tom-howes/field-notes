import { PrismaClient } from '@prisma/client'
import { countries } from './seed-data/countries'

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
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
