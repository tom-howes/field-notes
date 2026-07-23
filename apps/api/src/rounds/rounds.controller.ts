import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { RoundsService } from './rounds.service'
import { SubmitGuessDto } from './dto/submit-guess.dto'
import { SessionAuthGuard } from '../auth/session-auth.guard'
import type { AuthenticatedRequest } from '../auth/session-auth.guard'

@ApiTags('rounds')
@Controller('rounds')
@UseGuards(SessionAuthGuard)
export class RoundsController {
  constructor(private readonly roundsService: RoundsService) {}

  @Post()
  @ApiOperation({ summary: 'Start a new round: picks a song and returns the first 5s clip to play' })
  start(@Req() req: AuthenticatedRequest) {
    return this.roundsService.startRound(req.userId)
  }

  @Post(':id/guess')
  @ApiOperation({ summary: 'Submit a country guess for the current attempt' })
  guess(@Req() req: AuthenticatedRequest, @Param('id') roundId: string, @Body() dto: SubmitGuessDto) {
    return this.roundsService.submitGuess(req.userId, roundId, dto.countryId)
  }
}
