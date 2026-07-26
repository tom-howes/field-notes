import { ApiProperty } from '@nestjs/swagger'

export class CountryLeaderDto {
  @ApiProperty()
  countryId!: string

  @ApiProperty()
  countryName!: string

  @ApiProperty()
  isoCode!: string

  @ApiProperty({ nullable: true })
  region!: string | null

  @ApiProperty()
  leaderDisplayName!: string

  @ApiProperty({ description: "The leader's attempts taken for this country's best-collected song" })
  attemptsTaken!: number
}
