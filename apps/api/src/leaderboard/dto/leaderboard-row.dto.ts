import { ApiProperty } from '@nestjs/swagger'

export class LeaderboardRowDto {
  @ApiProperty()
  userId!: string

  @ApiProperty()
  displayName!: string

  @ApiProperty()
  countriesCollected!: number

  @ApiProperty({ nullable: true, description: 'Average attempts per correct guess; null if no correct guesses yet' })
  avgAttempts!: number | null

  @ApiProperty({ description: 'Rank via SQL RANK() OVER(...), ties share a rank' })
  rank!: number
}
