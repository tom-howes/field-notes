import { ApiProperty } from '@nestjs/swagger'
import { IsUUID } from 'class-validator'

export class SubmitGuessDto {
  @ApiProperty({ description: 'The id of the country the player is guessing' })
  @IsUUID()
  countryId!: string
}
