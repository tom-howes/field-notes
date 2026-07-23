import { Module } from '@nestjs/common'
import { RoundsController } from './rounds.controller'
import { RoundsService } from './rounds.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [AuthModule],
  controllers: [RoundsController],
  providers: [RoundsService],
})
export class RoundsModule {}
