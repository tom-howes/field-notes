import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as jwt from 'jsonwebtoken'
import { PrismaService } from '../prisma/prisma.service'
import { deriveCodeChallenge } from './pkce.util'

const SPOTIFY_AUTHORIZE_URL = 'https://accounts.spotify.com/authorize'
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
const SPOTIFY_ME_URL = 'https://api.spotify.com/v1/me'
const SPOTIFY_SCOPES = ['streaming', 'user-read-email', 'user-read-private']

interface SpotifyTokenResponse {
  access_token: string
  token_type: string
  scope: string
  expires_in: number
  refresh_token?: string
}

interface SpotifyProfile {
  id: string
  display_name: string | null
  email: string | null
}

interface SessionPayload {
  sub: string // our internal user id
}

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  buildAuthorizeUrl(state: string, codeVerifier: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.getOrThrow('SPOTIFY_CLIENT_ID'),
      scope: SPOTIFY_SCOPES.join(' '),
      redirect_uri: this.config.getOrThrow('SPOTIFY_REDIRECT_URI'),
      state,
      code_challenge_method: 'S256',
      code_challenge: deriveCodeChallenge(codeVerifier),
    })
    return `${SPOTIFY_AUTHORIZE_URL}?${params.toString()}`
  }

  private basicAuthHeader(): string {
    const id = this.config.getOrThrow('SPOTIFY_CLIENT_ID')
    const secret = this.config.getOrThrow('SPOTIFY_CLIENT_SECRET')
    return `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`
  }

  async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<SpotifyTokenResponse> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.getOrThrow('SPOTIFY_REDIRECT_URI'),
      code_verifier: codeVerifier,
    })

    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: this.basicAuthHeader(),
      },
      body,
    })

    if (!response.ok) {
      throw new UnauthorizedException('Spotify rejected the authorization code')
    }

    return response.json() as Promise<SpotifyTokenResponse>
  }

  private async refreshTokens(refreshToken: string): Promise<SpotifyTokenResponse> {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    })

    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: this.basicAuthHeader(),
      },
      body,
    })

    if (!response.ok) {
      throw new UnauthorizedException('Failed to refresh Spotify access token')
    }

    return response.json() as Promise<SpotifyTokenResponse>
  }

  async fetchSpotifyProfile(accessToken: string): Promise<SpotifyProfile> {
    const response = await fetch(SPOTIFY_ME_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!response.ok) {
      throw new UnauthorizedException('Failed to fetch Spotify profile')
    }

    return response.json() as Promise<SpotifyProfile>
  }

  async upsertUserFromSpotify(profile: SpotifyProfile, tokens: SpotifyTokenResponse) {
    const accessTokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000)

    return this.prisma.user.upsert({
      where: { spotifyUserId: profile.id },
      update: {
        displayName: profile.display_name ?? profile.id,
        email: profile.email,
        accessToken: tokens.access_token,
        accessTokenExpiresAt,
        ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
      },
      create: {
        spotifyUserId: profile.id,
        displayName: profile.display_name ?? profile.id,
        email: profile.email,
        accessToken: tokens.access_token,
        accessTokenExpiresAt,
        refreshToken: tokens.refresh_token,
      },
    })
  }

  /** Returns a valid Spotify access token for the user, refreshing it first if it's expired or close to it. */
  async getValidSpotifyAccessToken(userId: string): Promise<{ accessToken: string; expiresAt: Date }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } })

    const isExpiringSoon =
      !user.accessTokenExpiresAt || user.accessTokenExpiresAt.getTime() - Date.now() < 60_000

    if (!isExpiringSoon && user.accessToken && user.accessTokenExpiresAt) {
      return { accessToken: user.accessToken, expiresAt: user.accessTokenExpiresAt }
    }

    if (!user.refreshToken) {
      throw new UnauthorizedException('No Spotify refresh token on file; user must re-authenticate')
    }

    const tokens = await this.refreshTokens(user.refreshToken)
    const accessTokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000)

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        accessToken: tokens.access_token,
        accessTokenExpiresAt,
        ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
      },
    })

    return { accessToken: tokens.access_token, expiresAt: accessTokenExpiresAt }
  }

  issueSessionToken(userId: string): string {
    const payload: SessionPayload = { sub: userId }
    const secret: string = this.config.getOrThrow('SESSION_JWT_SECRET')
    return jwt.sign(payload, secret, { expiresIn: '7d' })
  }

  verifySessionToken(token: string): SessionPayload {
    try {
      const secret: string = this.config.getOrThrow('SESSION_JWT_SECRET')
      return jwt.verify(token, secret) as SessionPayload
    } catch {
      throw new UnauthorizedException('Invalid or expired session')
    }
  }
}
