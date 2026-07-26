import { ApiProperty } from '@nestjs/swagger'

export class StreakRowDto {
  @ApiProperty()
  userId!: string

  @ApiProperty()
  displayName!: string

  @ApiProperty({ description: 'Consecutive rounds won, counting back from the most recent round' })
  currentStreak!: number

  @ApiProperty({ description: 'Rank via SQL RANK() OVER(...), ties share a rank' })
  rank!: number
}
