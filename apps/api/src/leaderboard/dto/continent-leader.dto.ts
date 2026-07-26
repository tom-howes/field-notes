import { ApiProperty } from '@nestjs/swagger'

export class ContinentLeaderDto {
  @ApiProperty()
  region!: string

  @ApiProperty()
  leaderDisplayName!: string

  @ApiProperty({ description: 'Countries collected within this region by the leader' })
  countriesInRegion!: number
}
