import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class CollectionService {
  constructor(private readonly prisma: PrismaService) {}

  async getForUser(userId: string) {
    const [collected, totalUnlockedCountries] = await Promise.all([
      this.prisma.userCollection.findMany({
        where: { userId },
        orderBy: { collectedAt: 'desc' },
        include: {
          country: { select: { id: true, name: true, isoCode: true } },
          song: { select: { title: true, artist: { select: { name: true } } } },
        },
      }),
      this.prisma.country.count({ where: { status: 'UNLOCKED' } }),
    ])

    return {
      collectedCount: collected.length,
      totalUnlockedCountries,
      collected: collected.map((c) => ({
        countryId: c.country.id,
        countryName: c.country.name,
        isoCode: c.country.isoCode,
        songTitle: c.song.title,
        artistName: c.song.artist.name,
        attemptsTaken: c.attemptsTaken,
        collectedAt: c.collectedAt,
      })),
    }
  }
}
