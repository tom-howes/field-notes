import { ApiProperty } from '@nestjs/swagger'

export class SpotifyTokenDto {
  @ApiProperty({ description: 'Short-lived Spotify access token for the Web Playback SDK' })
  accessToken!: string

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt!: Date
}
