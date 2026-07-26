import { ApiProperty } from '@nestjs/swagger'

export class CurrentUserDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  displayName!: string

  @ApiProperty({ nullable: true })
  email!: string | null

  @ApiProperty({ description: 'Whether this account has Spotify Premium — determines which playback engine the client uses' })
  isPremium!: boolean
}
