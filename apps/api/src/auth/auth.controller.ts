import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import type { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { generateCodeVerifier, generateState } from './pkce.util'
import { SessionAuthGuard } from './session-auth.guard'
import type { AuthenticatedRequest } from './session-auth.guard'
import { PrismaService } from '../prisma/prisma.service'

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

  @Get('spotify/login')
  @ApiOperation({ summary: 'Start Spotify OAuth 2.0 authorization code + PKCE flow' })
  login(@Res() res: Response) {
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

    const sessionToken = this.authService.issueSessionToken(user.id)
    res.cookie('session', sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.isSecureCookies(),
      maxAge: SESSION_COOKIE_MAX_AGE_MS,
    })

    res.redirect(this.config.getOrThrow('WEB_APP_URL'))
  }

  @Post('logout')
  @ApiOperation({ summary: 'Clear the session cookie' })
  logout(@Res() res: Response) {
    res.clearCookie('session')
    res.status(204).send()
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: 'Return the currently authenticated user' })
  async me(@Req() req: AuthenticatedRequest) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: req.userId } })
    return { id: user.id, displayName: user.displayName, email: user.email }
  }

  @Get('spotify/token')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({
    summary: 'Return a short-lived Spotify access token for the Web Playback SDK',
    description:
      'The Spotify refresh token never leaves the server; the client only ever receives a short-lived access token on demand.',
  })
  async spotifyToken(@Req() req: AuthenticatedRequest) {
    return this.authService.getValidSpotifyAccessToken(req.userId)
  }
}
