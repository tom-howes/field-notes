import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class CollectionService {
  constructor(private readonly prisma: PrismaService) {}

  async getForUser(userId: string) {
    const [rows, totalUnlockedCountries] = await Promise.all([
      this.prisma.userCollection.findMany({
        where: { userId },
        orderBy: { collectedAt: 'desc' },
        include: {
          country: { select: { id: true, name: true, isoCode: true, region: true } },
          song: { select: { id: true, title: true, spotifyTrackId: true, artist: { select: { name: true } } } },
        },
      }),
      this.prisma.country.count({ where: { status: 'UNLOCKED' } }),
    ])

    const byCountry = new Map<
      string,
      {
        countryId: string
        countryName: string
        isoCode: string
        region: string | null
        songs: {
          songId: string
          title: string
          artistName: string
          spotifyTrackId: string
          spotifyUrl: string
          attemptsTaken: number
          collectedAt: Date
        }[]
      }
    >()

    for (const row of rows) {
      let entry = byCountry.get(row.countryId)
      if (!entry) {
        entry = {
          countryId: row.country.id,
          countryName: row.country.name,
          isoCode: row.country.isoCode,
          region: row.country.region,
          songs: [],
        }
        byCountry.set(row.countryId, entry)
      }
      entry.songs.push({
        songId: row.song.id,
        title: row.song.title,
        artistName: row.song.artist.name,
        spotifyTrackId: row.song.spotifyTrackId,
        spotifyUrl: `https://open.spotify.com/track/${row.song.spotifyTrackId}`,
        attemptsTaken: row.attemptsTaken,
        collectedAt: row.collectedAt,
      })
    }

    const collected = Array.from(byCountry.values())
    const continentsCollectedCount = new Set(collected.map((c) => c.region).filter((region): region is string => !!region))
      .size

    return {
      collectedCount: collected.length,
      songsCollectedCount: rows.length,
      continentsCollectedCount,
      totalUnlockedCountries,
      collected,
    }
  }
}
