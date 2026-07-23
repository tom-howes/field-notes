import { ApiProperty } from '@nestjs/swagger'

export class StartRoundResponseDto {
  @ApiProperty()
  roundId!: string

  @ApiProperty({ description: "The Spotify track id to play via the Web Playback SDK — never the song's country" })
  spotifyTrackId!: string

  @ApiProperty({ description: 'Which attempt this is, 1-indexed' })
  attemptNumber!: number

  @ApiProperty({ description: 'How long a clip to play, in seconds' })
  clipSeconds!: number

  @ApiProperty()
  maxAttempts!: number
}
