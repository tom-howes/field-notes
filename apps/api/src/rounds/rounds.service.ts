import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { haversineDistanceKm } from './distance.util'

const MAX_ATTEMPTS = 6 // 5, 10, 15, 20, 25, 30 seconds
const CLIP_SECONDS_STEP = 5

@Injectable()
export class RoundsService {
  constructor(private readonly prisma: PrismaService) {}

  async startRound(userId: string) {
    const collectedCountryIds = (
      await this.prisma.userCollection.findMany({
        where: { userId },
        select: { countryId: true },
      })
    ).map((c) => c.countryId)

    // Prefer songs from countries the player hasn't collected yet, to drive toward full coverage.
    let candidates = await this.prisma.song.findMany({
      where: {
        country: { status: 'UNLOCKED' },
        countryId: { notIn: collectedCountryIds },
      },
      select: { id: true, spotifyTrackId: true },
    })

    // Once every unlocked country is collected, fall back to any unlocked-country song for replay.
    if (candidates.length === 0) {
      candidates = await this.prisma.song.findMany({
        where: { country: { status: 'UNLOCKED' } },
        select: { id: true, spotifyTrackId: true },
      })
    }

    if (candidates.length === 0) {
      throw new NotFoundException('No songs are available to play yet')
    }

    const chosen = candidates[Math.floor(Math.random() * candidates.length)]

    const round = await this.prisma.round.create({
      data: { userId, songId: chosen.id },
    })

    return {
      roundId: round.id,
      spotifyTrackId: chosen.spotifyTrackId,
      attemptNumber: round.currentAttempt,
      clipSeconds: round.currentAttempt * CLIP_SECONDS_STEP,
      maxAttempts: MAX_ATTEMPTS,
    }
  }

  async submitGuess(userId: string, roundId: string, guessedCountryId: string) {
    const round = await this.prisma.round.findUnique({
      where: { id: roundId },
      include: { song: { include: { country: true, artist: true } } },
    })

    if (!round) {
      throw new NotFoundException('Round not found')
    }
    if (round.userId !== userId) {
      throw new ForbiddenException('This round belongs to a different player')
    }
    if (round.status !== 'IN_PROGRESS') {
      throw new BadRequestException('This round is already complete')
    }

    const correct = guessedCountryId === round.song.countryId
    const clipSeconds = round.currentAttempt * CLIP_SECONDS_STEP
    const isFinalAttempt = round.currentAttempt >= MAX_ATTEMPTS

    const distanceKm = correct
      ? 0
      : await (async () => {
          const guessedCountry = await this.prisma.country.findUnique({
            where: { id: guessedCountryId },
            select: { latitude: true, longitude: true },
          })
          if (!guessedCountry) throw new BadRequestException('Unknown country')
          return haversineDistanceKm(guessedCountry, round.song.country)
        })()

    await this.prisma.guessAttempt.create({
      data: {
        userId,
        roundId: round.id,
        songId: round.songId,
        attemptNumber: round.currentAttempt,
        clipSeconds,
        guessedCountryId,
        correct,
      },
    })

    if (correct) {
      await this.prisma.$transaction([
        this.prisma.round.update({
          where: { id: round.id },
          data: { status: 'WON', completedAt: new Date() },
        }),
        this.prisma.userCollection.upsert({
          where: { userId_countryId: { userId, countryId: round.song.countryId } },
          update: {},
          create: {
            userId,
            countryId: round.song.countryId,
            songId: round.songId,
            attemptsTaken: round.currentAttempt,
          },
        }),
      ])

      const country = await this.prisma.country.findUniqueOrThrow({ where: { id: round.song.countryId } })
      return {
        correct: true,
        roundComplete: true,
        attemptsTaken: round.currentAttempt,
        country: { id: country.id, name: country.name, isoCode: country.isoCode },
        song: {
          title: round.song.title,
          artistName: round.song.artist.name,
          spotifyTrackId: round.song.spotifyTrackId,
          spotifyUrl: `https://open.spotify.com/track/${round.song.spotifyTrackId}`,
        },
      }
    }

    if (isFinalAttempt) {
      await this.prisma.round.update({
        where: { id: round.id },
        data: { status: 'LOST', completedAt: new Date() },
      })

      const country = await this.prisma.country.findUniqueOrThrow({ where: { id: round.song.countryId } })
      return {
        correct: false,
        roundComplete: true,
        distanceKm,
        country: { id: country.id, name: country.name, isoCode: country.isoCode },
      }
    }

    const nextAttempt = round.currentAttempt + 1
    await this.prisma.round.update({
      where: { id: round.id },
      data: { currentAttempt: nextAttempt },
    })

    return {
      correct: false,
      roundComplete: false,
      distanceKm,
      attemptNumber: nextAttempt,
      clipSeconds: nextAttempt * CLIP_SECONDS_STEP,
    }
  }
}
