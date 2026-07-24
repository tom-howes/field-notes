export const CORRECT_COLOR = '#1db954'

export function colorForDistance(distanceKm: number): string {
  if (distanceKm < 500) return '#2ecc71' // green
  if (distanceKm < 2000) return '#f1c40f' // yellow
  if (distanceKm < 5000) return '#e67e22' // orange
  return '#e74c3c' // red
}
