import { CountryMap } from './CountryMap'
import type { Country } from '../lib/api'

export interface GuessMarker {
  distanceKm: number
  correct: boolean
}

interface WorldMapProps {
  countries: Country[]
  guesses: Record<string, GuessMarker> // keyed by countryId
  onGuess: (countryId: string) => void
  disabled: boolean
}

const UNGUESSED_FILL = '#3a3a3a'
const HOVER_FILL = '#555'
const CORRECT_FILL = '#1db954'

function fillForDistance(distanceKm: number): string {
  if (distanceKm < 500) return '#2ecc71' // green
  if (distanceKm < 2000) return '#f1c40f' // yellow
  if (distanceKm < 5000) return '#e67e22' // orange
  return '#e74c3c' // red
}

export function WorldMap({ countries, guesses, onGuess, disabled }: WorldMapProps) {
  return (
    <>
      <CountryMap
        countries={countries}
        getFill={(countryId) => {
          const guess = countryId ? guesses[countryId] : undefined
          return guess ? (guess.correct ? CORRECT_FILL : fillForDistance(guess.distanceKm)) : UNGUESSED_FILL
        }}
        getHoverFill={(countryId, defaultFill) => {
          const guess = countryId ? guesses[countryId] : undefined
          return !disabled && countryId && !guess ? HOVER_FILL : defaultFill
        }}
        isClickable={(countryId) => !disabled && !guesses[countryId]}
        onCountryClick={onGuess}
      />
      <div className="world-map-legend">
        <span>
          <i style={{ background: '#2ecc71' }} /> &lt;500km
        </span>
        <span>
          <i style={{ background: '#f1c40f' }} /> &lt;2000km
        </span>
        <span>
          <i style={{ background: '#e67e22' }} /> &lt;5000km
        </span>
        <span>
          <i style={{ background: '#e74c3c' }} /> further
        </span>
      </div>
    </>
  )
}
