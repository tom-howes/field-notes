import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { RoundsService } from './rounds.service'
import { SubmitGuessDto } from './dto/submit-guess.dto'
import { StartRoundResponseDto } from './dto/start-round-response.dto'
import { GuessResponseDto } from './dto/guess-response.dto'
import { SessionAuthGuard } from '../auth/session-auth.guard'
import type { AuthenticatedRequest } from '../auth/session-auth.guard'

@ApiTags('rounds')
@Controller('rounds')
@UseGuards(SessionAuthGuard)
@ApiCookieAuth()
export class RoundsController {
  constructor(private readonly roundsService: RoundsService) {}

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Start a new round: picks a song and returns the first 5s clip to play' })
  @ApiOkResponse({ type: StartRoundResponseDto })
  @ApiNotFoundResponse({ description: 'No songs are available to play yet' })
  start(@Req() req: AuthenticatedRequest): Promise<StartRoundResponseDto> {
    return this.roundsService.startRound(req.userId)
  }

  @Post(':id/guess')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Submit a country guess for the current attempt' })
  @ApiParam({ name: 'id', description: 'Round id returned by POST /rounds' })
  @ApiOkResponse({ type: GuessResponseDto })
  @ApiBadRequestResponse({ description: 'Round is already complete, or the guessed country id is unknown' })
  @ApiForbiddenResponse({ description: 'This round belongs to a different player' })
  @ApiNotFoundResponse({ description: 'Round not found' })
  guess(
    @Req() req: AuthenticatedRequest,
    @Param('id') roundId: string,
    @Body() dto: SubmitGuessDto,
  ): Promise<GuessResponseDto> {
    return this.roundsService.submitGuess(req.userId, roundId, dto.countryId)
  }
}
