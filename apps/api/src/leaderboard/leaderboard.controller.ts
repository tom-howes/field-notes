import { Controller, Get, NotFoundException, Req, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { LeaderboardService } from './leaderboard.service'
import { SessionAuthGuard } from '../auth/session-auth.guard'
import type { AuthenticatedRequest } from '../auth/session-auth.guard'

@ApiTags('leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  @ApiOperation({ summary: 'Top players ranked by countries collected (window function, ties broken by guess efficiency)' })
  getTop() {
    return this.leaderboardService.getTop()
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: "The current player's own rank, even if outside the top of the leaderboard" })
  async getMine(@Req() req: AuthenticatedRequest) {
    const row = await this.leaderboardService.getRankForUser(req.userId)
    if (!row) {
      throw new NotFoundException('No ranking available yet')
    }
    return row
  }
}
