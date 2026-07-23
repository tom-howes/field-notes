import { ApiProperty } from '@nestjs/swagger'

export class CollectedCountryDto {
  @ApiProperty()
  countryId!: string

  @ApiProperty()
  countryName!: string

  @ApiProperty()
  isoCode!: string

  @ApiProperty()
  songTitle!: string

  @ApiProperty()
  artistName!: string

  @ApiProperty()
  attemptsTaken!: number

  @ApiProperty({ type: String, format: 'date-time' })
  collectedAt!: Date
}

export class CollectionResponseDto {
  @ApiProperty()
  collectedCount!: number

  @ApiProperty({ description: 'Total countries currently unlocked (not the full 195 — only what has real songs)' })
  totalUnlockedCountries!: number

  @ApiProperty({ type: [CollectedCountryDto] })
  collected!: CollectedCountryDto[]
}
