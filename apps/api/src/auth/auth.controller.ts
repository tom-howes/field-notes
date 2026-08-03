import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import { ApiCookieAuth, ApiConflictResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import { Throttle } from '@nestjs/throttler'
import type { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { generateCodeVerifier, generateState } from './pkce.util'
import { SessionAuthGuard } from './session-auth.guard'
import type { AuthenticatedRequest } from './session-auth.guard'
import { PrismaService } from '../prisma/prisma.service'
import { CurrentUserDto } from './dto/current-user.dto'
import { SpotifyTokenDto } from './dto/spotify-token.dto'
import { SignupDto } from './dto/signup.dto'
import { LoginDto } from './dto/login.dto'

const OAUTH_COOKIE_MAX_AGE_MS = 5 * 60 * 1000
const SESSION_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private isSecureCookies(): boolean {
    return this.config.get('NODE_ENV') === 'production'
  }

  private startSession(res: Response, userId: string) {
    const sessionToken = this.authService.issueSessionToken(userId)
    // Frontend and API are served from the same CloudFront distribution (this API
    // is mounted under /api on it), so the cookie is always same-origin — Lax is
    // both sufficient and the safer default. Previously this needed SameSite=None
    // for a genuinely cross-site setup, which browsers increasingly block as a
    // third-party cookie (Safari's ITP, Chrome's cross-site cookie restrictions)
    // regardless of how correctly it's configured.
    res.cookie('session', sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.isSecureCookies(),
      maxAge: SESSION_COOKIE_MAX_AGE_MS,
    })
  }

  @Get('spotify/login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Start Spotify OAuth 2.0 authorization code + PKCE flow' })
  spotifyLogin(@Res() res: Response) {
    const state = generateState()
    const codeVerifier = generateCodeVerifier()

    res.cookie('spotify_oauth_state', state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.isSecureCookies(),
      maxAge: OAUTH_COOKIE_MAX_AGE_MS,
    })
    res.cookie('spotify_pkce_verifier', codeVerifier, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.isSecureCookies(),
      maxAge: OAUTH_COOKIE_MAX_AGE_MS,
    })

    res.redirect(this.authService.buildAuthorizeUrl(state, codeVerifier))
  }

  @Get('spotify/callback')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Spotify OAuth redirect target: exchanges code for tokens and starts a session' })
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const expectedState = req.cookies?.['spotify_oauth_state'] as string | undefined
    const codeVerifier = req.cookies?.['spotify_pkce_verifier'] as string | undefined

    res.clearCookie('spotify_oauth_state')
    res.clearCookie('spotify_pkce_verifier')

    if (error) {
      throw new BadRequestException(`Spotify authorization failed: ${error}`)
    }
    if (!code || !state || !expectedState || !codeVerifier || state !== expectedState) {
      throw new BadRequestException('Invalid or missing OAuth state/code')
    }

    const tokens = await this.authService.exchangeCodeForTokens(code, codeVerifier)
    const profile = await this.authService.fetchSpotifyProfile(tokens.access_token)
    const user = await this.authService.upsertUserFromSpotify(profile, tokens)

    this.startSession(res, user.id)
    res.redirect(this.config.getOrThrow('WEB_APP_URL'))
  }

  @Post('signup')
  @HttpCode(201)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Create a username/password account — an alternative to Spotify sign-in that still saves a collection' })
  @ApiConflictResponse({ description: 'Username already taken' })
  async signup(@Body() dto: SignupDto, @Res() res: Response) {
    const user = await this.authService.signup(dto.username, dto.password)
    this.startSession(res, user.id)
    res.status(201).send()
  }

  @Post('login')
  @HttpCode(204)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Sign in to a username/password account' })
  @ApiUnauthorizedResponse({ description: 'Invalid username or password' })
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const user = await this.authService.validateUsernamePassword(dto.username, dto.password)
    this.startSession(res, user.id)
    res.status(204).send()
  }

  @Post('logout')
  @ApiOperation({ summary: 'Clear the session cookie' })
  logout(@Res() res: Response) {
    // Must match the sameSite/secure options the cookie was set with (startSession),
    // or the browser won't recognize this as the same cookie to overwrite/expire.
    res.clearCookie('session', {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.isSecureCookies(),
    })
    res.status(204).send()
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Return the currently authenticated user' })
  @ApiOkResponse({ type: CurrentUserDto })
  @ApiUnauthorizedResponse({ description: 'No valid session cookie' })
  async me(@Req() req: AuthenticatedRequest): Promise<CurrentUserDto> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: req.userId } })
    return {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      isPremium: user.spotifyProduct === 'premium',
    }
  }

  @Get('spotify/token')
  @UseGuards(SessionAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Return a short-lived Spotify access token for the Web Playback SDK',
    description:
      'The Spotify refresh token never leaves the server; the client only ever receives a short-lived access token on demand.',
  })
  @ApiOkResponse({ type: SpotifyTokenDto })
  @ApiUnauthorizedResponse({ description: 'No valid session cookie, or Spotify refresh failed and re-auth is required' })
  async spotifyToken(@Req() req: AuthenticatedRequest): Promise<SpotifyTokenDto> {
    return this.authService.getValidSpotifyAccessToken(req.userId)
  }
}
