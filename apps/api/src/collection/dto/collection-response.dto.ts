import { ApiProperty } from '@nestjs/swagger'

export class CollectedSongDto {
  @ApiProperty()
  songId!: string

  @ApiProperty()
  title!: string

  @ApiProperty()
  artistName!: string

  @ApiProperty()
  spotifyTrackId!: string

  @ApiProperty()
  spotifyUrl!: string

  @ApiProperty()
  attemptsTaken!: number

  @ApiProperty({ type: String, format: 'date-time' })
  collectedAt!: Date
}

export class CollectedCountryDto {
  @ApiProperty()
  countryId!: string

  @ApiProperty()
  countryName!: string

  @ApiProperty()
  isoCode!: string

  @ApiProperty({ nullable: true })
  region!: string | null

  @ApiProperty({ type: [CollectedSongDto], description: 'Every song collected from this country so far' })
  songs!: CollectedSongDto[]
}

export class CollectionResponseDto {
  @ApiProperty({ description: 'Distinct countries with at least one song collected' })
  collectedCount!: number

  @ApiProperty({ description: 'Total songs collected across all countries (can exceed collectedCount)' })
  songsCollectedCount!: number

  @ApiProperty({ description: 'Distinct continents/regions represented among collected countries' })
  continentsCollectedCount!: number

  @ApiProperty({ description: 'Total countries currently unlocked (not the full 195 — only what has real songs)' })
  totalUnlockedCountries!: number

  @ApiProperty({ type: [CollectedCountryDto] })
  collected!: CollectedCountryDto[]
}
