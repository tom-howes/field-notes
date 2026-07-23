import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

export interface LeaderboardRow {
  userId: string
  displayName: string
  countriesCollected: number
  avgAttempts: number | null
  rank: number
}

// Ranks every player by countries collected (more = better), tie-broken by average
// attempts per correct guess (fewer = better, i.e. more efficient guessing).
const RANKED_USERS_CTE = Prisma.sql`
  WITH ranked AS (
    SELECT
      u.id AS user_id,
      u.display_name,
      COUNT(uc.id)::int AS countries_collected,
      ROUND(AVG(uc.attempts_taken)::numeric, 2)::float8 AS avg_attempts,
      RANK() OVER (
        ORDER BY COUNT(uc.id) DESC, COALESCE(AVG(uc.attempts_taken), 999999) ASC
      )::int AS rank
    FROM users u
    LEFT JOIN user_collections uc ON uc.user_id = u.id
    GROUP BY u.id, u.display_name
  )
`

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getTop(limit = 50): Promise<LeaderboardRow[]> {
    const rows = await this.prisma.$queryRaw<
      { user_id: string; display_name: string; countries_collected: number; avg_attempts: number | null; rank: number }[]
    >(Prisma.sql`${RANKED_USERS_CTE} SELECT * FROM ranked ORDER BY rank ASC LIMIT ${limit}`)

    return rows.map((r) => ({
      userId: r.user_id,
      displayName: r.display_name,
      countriesCollected: r.countries_collected,
      avgAttempts: r.avg_attempts,
      rank: r.rank,
    }))
  }

  async getRankForUser(userId: string): Promise<LeaderboardRow | null> {
    const rows = await this.prisma.$queryRaw<
      { user_id: string; display_name: string; countries_collected: number; avg_attempts: number | null; rank: number }[]
    >(Prisma.sql`${RANKED_USERS_CTE} SELECT * FROM ranked WHERE user_id = ${userId}`)

    if (rows.length === 0) return null
    const r = rows[0]
    return {
      userId: r.user_id,
      displayName: r.display_name,
      countriesCollected: r.countries_collected,
      avgAttempts: r.avg_attempts,
      rank: r.rank,
    }
  }
}
