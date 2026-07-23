import { Controller, Get, NotFoundException, Req, UseGuards } from '@nestjs/common'
import { ApiCookieAuth, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { LeaderboardService } from './leaderboard.service'
import { LeaderboardRowDto } from './dto/leaderboard-row.dto'
import { SessionAuthGuard } from '../auth/session-auth.guard'
import type { AuthenticatedRequest } from '../auth/session-auth.guard'

@ApiTags('leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  @ApiOperation({ summary: 'Top players ranked by countries collected (window function, ties broken by guess efficiency)' })
  @ApiOkResponse({ type: [LeaderboardRowDto] })
  getTop(): Promise<LeaderboardRowDto[]> {
    return this.leaderboardService.getTop()
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "The current player's own rank, even if outside the top of the leaderboard" })
  @ApiOkResponse({ type: LeaderboardRowDto })
  @ApiNotFoundResponse({ description: 'No ranking available yet' })
  async getMine(@Req() req: AuthenticatedRequest): Promise<LeaderboardRowDto> {
    const row = await this.leaderboardService.getRankForUser(req.userId)
    if (!row) {
      throw new NotFoundException('No ranking available yet')
    }
    return row
  }
}
