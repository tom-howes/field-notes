import { ApiProperty } from '@nestjs/swagger'

export class CountryDto {
  @ApiProperty()
  id!: string

  @ApiProperty({ description: 'ISO 3166-1 alpha-2 code' })
  isoCode!: string

  @ApiProperty()
  name!: string

  @ApiProperty({ nullable: true })
  region!: string | null

  @ApiProperty({ enum: ['LOCKED', 'UNLOCKED'] })
  status!: 'LOCKED' | 'UNLOCKED'
}
