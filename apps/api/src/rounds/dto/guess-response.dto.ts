import { ApiProperty } from '@nestjs/swagger'

export class GuessedCountryDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  name!: string

  @ApiProperty()
  isoCode!: string
}

export class RevealedSongDto {
  @ApiProperty()
  title!: string

  @ApiProperty()
  artistName!: string

  @ApiProperty()
  spotifyTrackId!: string

  @ApiProperty()
  spotifyUrl!: string
}

export class GuessResponseDto {
  @ApiProperty()
  correct!: boolean

  @ApiProperty({ description: 'True once the round has ended, whether won or out of attempts' })
  roundComplete!: boolean

  @ApiProperty({ required: false, description: 'Great-circle distance in km between the guess and the answer; omitted on a correct guess' })
  distanceKm?: number

  @ApiProperty({ required: false, description: 'Present only when roundComplete && correct' })
  attemptsTaken?: number

  @ApiProperty({ required: false, description: 'The next attempt number; present only when the round continues' })
  attemptNumber?: number

  @ApiProperty({ required: false, description: 'The next clip length in seconds; present only when the round continues' })
  clipSeconds?: number

  @ApiProperty({ required: false, type: GuessedCountryDto, description: 'The actual answer; only revealed once roundComplete is true' })
  country?: GuessedCountryDto

  @ApiProperty({ required: false, type: RevealedSongDto, description: 'Only present on a correct guess' })
  song?: RevealedSongDto
}
