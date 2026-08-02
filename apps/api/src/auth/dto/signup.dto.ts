import { ApiProperty } from '@nestjs/swagger'
import { IsString, Length, Matches } from 'class-validator'

export class SignupDto {
  @ApiProperty({ description: 'Also used as the display name shown on leaderboards' })
  @IsString()
  @Length(3, 24)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'username may only contain letters, numbers, and underscores' })
  username!: string

  @ApiProperty()
  @IsString()
  @Length(8, 72) // bcrypt silently truncates beyond 72 bytes
  password!: string
}
