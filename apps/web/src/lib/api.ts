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
  attemptsTaken?: number
  attemptNumber?: number
  clipSeconds?: number
  country?: { id: string; name: string; isoCode: string }
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

export interface CollectedCountry {
  countryId: string
  countryName: string
  isoCode: string
  songTitle: string
  artistName: string
  attemptsTaken: number
  collectedAt: string
}

export interface CollectionResponse {
  collectedCount: number
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
  collection: () => request<CollectionResponse>('/collection'),
  loginUrl: () => `${API_BASE_URL}/auth/spotify/login`,
}
