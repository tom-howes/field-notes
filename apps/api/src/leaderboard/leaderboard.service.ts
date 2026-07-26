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

export interface StreakRow {
  userId: string
  displayName: string
  currentStreak: number
  rank: number
}

export interface ContinentLeaderRow {
  region: string
  leaderDisplayName: string
  countriesInRegion: number
}

export interface CountryLeaderRow {
  countryId: string
  countryName: string
  isoCode: string
  region: string | null
  leaderDisplayName: string
  attemptsTaken: number
  songCount: number
}

const MIN_COUNTRIES_FOR_EFFICIENCY_RANKING = 3

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

  /** Ranked by guess efficiency (fewest attempts per correct guess); requires a minimum
   *  sample size so a single lucky first-attempt guess can't top the board. */
  async getEfficiency(limit = 50): Promise<LeaderboardRow[]> {
    const rows = await this.prisma.$queryRaw<
      { user_id: string; display_name: string; countries_collected: number; avg_attempts: number | null; rank: number }[]
    >(Prisma.sql`
      WITH ranked AS (
        SELECT
          u.id AS user_id,
          u.display_name,
          COUNT(uc.id)::int AS countries_collected,
          ROUND(AVG(uc.attempts_taken)::numeric, 2)::float8 AS avg_attempts,
          RANK() OVER (ORDER BY AVG(uc.attempts_taken) ASC)::int AS rank
        FROM users u
        JOIN user_collections uc ON uc.user_id = u.id
        GROUP BY u.id, u.display_name
        HAVING COUNT(uc.id) >= ${MIN_COUNTRIES_FOR_EFFICIENCY_RANKING}
      )
      SELECT * FROM ranked ORDER BY rank ASC LIMIT ${limit}
    `)

    return rows.map((r) => ({
      userId: r.user_id,
      displayName: r.display_name,
      countriesCollected: r.countries_collected,
      avgAttempts: r.avg_attempts,
      rank: r.rank,
    }))
  }

  /** Current streak = consecutive WON rounds counting back from the player's most recent
   *  round. A player with no losses at all has a streak equal to their total rounds played. */
  async getStreaks(limit = 50): Promise<StreakRow[]> {
    const rows = await this.prisma.$queryRaw<{ user_id: string; display_name: string; current_streak: number; rank: number }[]>(
      Prisma.sql`
        WITH ordered AS (
          SELECT user_id, status,
            ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
          FROM rounds
          WHERE status IN ('WON', 'LOST')
        ),
        first_loss AS (
          SELECT user_id, MIN(rn) AS first_loss_rn
          FROM ordered
          WHERE status = 'LOST'
          GROUP BY user_id
        ),
        totals AS (
          SELECT user_id, COUNT(*)::int AS total
          FROM ordered
          GROUP BY user_id
        ),
        streaks AS (
          SELECT
            u.id AS user_id,
            u.display_name,
            COALESCE(fl.first_loss_rn - 1, t.total, 0)::int AS current_streak,
            RANK() OVER (ORDER BY COALESCE(fl.first_loss_rn - 1, t.total, 0) DESC)::int AS rank
          FROM users u
          JOIN totals t ON t.user_id = u.id
          LEFT JOIN first_loss fl ON fl.user_id = u.id
        )
        SELECT * FROM streaks WHERE current_streak > 0 ORDER BY rank ASC LIMIT ${limit}
      `,
    )

    return rows.map((r) => ({
      userId: r.user_id,
      displayName: r.display_name,
      currentStreak: r.current_streak,
      rank: r.rank,
    }))
  }

  /** The top player within each continent/region, by countries collected in that region. */
  async getContinentLeaders(): Promise<ContinentLeaderRow[]> {
    const rows = await this.prisma.$queryRaw<{ region: string; display_name: string; countries_in_region: number }[]>(
      Prisma.sql`
        WITH per_region AS (
          SELECT
            c.region,
            u.display_name,
            COUNT(uc.id)::int AS countries_in_region,
            RANK() OVER (PARTITION BY c.region ORDER BY COUNT(uc.id) DESC) AS region_rank
          FROM user_collections uc
          JOIN countries c ON c.id = uc.country_id
          JOIN users u ON u.id = uc.user_id
          WHERE c.region IS NOT NULL
          GROUP BY c.region, u.id, u.display_name
        )
        SELECT region, display_name, countries_in_region
        FROM per_region
        WHERE region_rank = 1
        ORDER BY region ASC
      `,
    )

    return rows.map((r) => ({
      region: r.region,
      leaderDisplayName: r.display_name,
      countriesInRegion: r.countries_in_region,
    }))
  }

  /** The player with the fewest attempts for each unlocked country (a per-country "best guess" board). */
  async getCountryLeaders(): Promise<CountryLeaderRow[]> {
    const rows = await this.prisma.$queryRaw<
      {
        country_id: string
        country_name: string
        iso_code: string
        region: string | null
        display_name: string
        attempts_taken: number
        song_count: number
      }[]
    >(Prisma.sql`
      WITH per_country AS (
        SELECT
          c.id AS country_id,
          c.name AS country_name,
          c.iso_code,
          c.region,
          u.display_name,
          uc.attempts_taken,
          RANK() OVER (PARTITION BY c.id ORDER BY uc.attempts_taken ASC, uc.collected_at ASC) AS country_rank
        FROM user_collections uc
        JOIN countries c ON c.id = uc.country_id
        JOIN users u ON u.id = uc.user_id
      ),
      song_counts AS (
        SELECT country_id, COUNT(*)::int AS song_count
        FROM songs
        GROUP BY country_id
      )
      SELECT pc.country_id, pc.country_name, pc.iso_code, pc.region, pc.display_name, pc.attempts_taken, sc.song_count
      FROM per_country pc
      JOIN song_counts sc ON sc.country_id = pc.country_id
      WHERE pc.country_rank = 1
      ORDER BY pc.country_name ASC
    `)

    return rows.map((r) => ({
      countryId: r.country_id,
      countryName: r.country_name,
      isoCode: r.iso_code,
      region: r.region,
      leaderDisplayName: r.display_name,
      attemptsTaken: r.attempts_taken,
      songCount: r.song_count,
    }))
  }
}
