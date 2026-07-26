import { ApiProperty } from '@nestjs/swagger'

export class CountryUserStatDto {
  @ApiProperty()
  userId!: string

  @ApiProperty()
  displayName!: string

  @ApiProperty({ description: 'Songs this player has collected for this country' })
  songsCollected!: number

  @ApiProperty({ description: "This player's average attempts per song collected here" })
  avgAttempts!: number

  @ApiProperty({ description: 'Rank within this country (1 = most songs, ties broken by efficiency)' })
  rank!: number
}

export class CountryLeaderboardDto {
  @ApiProperty()
  countryId!: string

  @ApiProperty()
  countryName!: string

  @ApiProperty()
  isoCode!: string

  @ApiProperty({ nullable: true })
  region!: string | null

  @ApiProperty({ description: 'Total curated songs available for this country' })
  totalSongs!: number

  @ApiProperty({ type: [CountryUserStatDto] })
  leaders!: CountryUserStatDto[]
}
