import { ApiProperty } from '@nestjs/swagger'

export class CurrentUserDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  displayName!: string

  @ApiProperty({ nullable: true })
  email!: string | null
}
