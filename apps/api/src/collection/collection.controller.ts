import { Controller, Get, Req, UseGuards } from '@nestjs/common'
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CollectionService } from './collection.service'
import { CollectionResponseDto } from './dto/collection-response.dto'
import { SessionAuthGuard } from '../auth/session-auth.guard'
import type { AuthenticatedRequest } from '../auth/session-auth.guard'

@ApiTags('collection')
@Controller('collection')
@UseGuards(SessionAuthGuard)
@ApiCookieAuth()
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Get()
  @ApiOperation({ summary: "The current player's collected countries and overall progress" })
  @ApiOkResponse({ type: CollectionResponseDto })
  getMine(@Req() req: AuthenticatedRequest): Promise<CollectionResponseDto> {
    return this.collectionService.getForUser(req.userId)
  }
}
