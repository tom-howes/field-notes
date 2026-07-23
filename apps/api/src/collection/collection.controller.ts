import { Controller, Get, Req, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { CollectionService } from './collection.service'
import { SessionAuthGuard } from '../auth/session-auth.guard'
import type { AuthenticatedRequest } from '../auth/session-auth.guard'

@ApiTags('collection')
@Controller('collection')
@UseGuards(SessionAuthGuard)
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Get()
  @ApiOperation({ summary: "The current player's collected countries and overall progress" })
  getMine(@Req() req: AuthenticatedRequest) {
    return this.collectionService.getForUser(req.userId)
  }
}
