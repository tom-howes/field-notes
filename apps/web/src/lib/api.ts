const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }))
    throw new ApiError(res.status, body.message ?? res.statusText)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export interface Country {
  id: string
  isoCode: string
  name: string
  region: string | null
  status: 'LOCKED' | 'UNLOCKED'
}

export interface CurrentUser {
  id: string
  displayName: string
  email: string | null
  isPremium: boolean
}

export interface StartRoundResponse {
  roundId: string
  spotifyTrackId: string
  attemptNumber: number
  clipSeconds: number
  maxAttempts: number
}

export interface GuessResponse {
  correct: boolean
  roundComplete: boolean
  distanceKm?: number
  attemptsTaken?: number
  attemptNumber?: number
  clipSeconds?: number
  country?: { id: string; name: string; isoCode: string }
  song?: { title: string; artistName: string; spotifyTrackId: string; spotifyUrl: string }
}

export interface SpotifyTokenResponse {
  accessToken: string
  expiresAt: string
}

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

export interface ContinentLeader {
  region: string
  leaderDisplayName: string
  countriesInRegion: number
}

export interface CountryLeader {
  countryId: string
  countryName: string
  isoCode: string
  region: string | null
  leaderDisplayName: string
  attemptsTaken: number
}

export interface CollectedSong {
  songId: string
  title: string
  artistName: string
  spotifyTrackId: string
  spotifyUrl: string
  attemptsTaken: number
  collectedAt: string
}

export interface CollectedCountry {
  countryId: string
  countryName: string
  isoCode: string
  region: string | null
  songs: CollectedSong[]
}

export interface CollectionResponse {
  collectedCount: number
  songsCollectedCount: number
  continentsCollectedCount: number
  totalUnlockedCountries: number
  collected: CollectedCountry[]
}

export const api = {
  me: () => request<CurrentUser>('/auth/me'),
  spotifyToken: () => request<SpotifyTokenResponse>('/auth/spotify/token'),
  countries: () => request<Country[]>('/countries'),
  startRound: () => request<StartRoundResponse>('/rounds', { method: 'POST' }),
  guess: (roundId: string, countryId: string) =>
    request<GuessResponse>(`/rounds/${roundId}/guess`, {
      method: 'POST',
      body: JSON.stringify({ countryId }),
    }),
  leaderboard: () => request<LeaderboardRow[]>('/leaderboard'),
  myRank: () => request<LeaderboardRow>('/leaderboard/me'),
  leaderboardEfficiency: () => request<LeaderboardRow[]>('/leaderboard/efficiency'),
  leaderboardStreaks: () => request<StreakRow[]>('/leaderboard/streaks'),
  leaderboardContinents: () => request<ContinentLeader[]>('/leaderboard/continents'),
  leaderboardCountries: () => request<CountryLeader[]>('/leaderboard/countries'),
  collection: () => request<CollectionResponse>('/collection'),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  loginUrl: () => `${API_BASE_URL}/auth/spotify/login`,
}
