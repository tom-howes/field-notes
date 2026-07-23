import { Module } from '@nestjs/common'
import { CollectionController } from './collection.controller'
import { CollectionService } from './collection.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [AuthModule],
  controllers: [CollectionController],
  providers: [CollectionService],
})
export class CollectionModule {}
