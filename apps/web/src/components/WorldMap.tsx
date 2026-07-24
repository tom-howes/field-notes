import { CountryMap } from './CountryMap'
import type { Country } from '../lib/api'
import { CORRECT_COLOR, colorForDistance } from '../lib/distanceColor'

export interface GuessMarker {
  distanceKm: number
  correct: boolean
}

interface WorldMapProps {
  countries: Country[]
  guesses: Record<string, GuessMarker> // keyed by countryId
  selectedCountryId: string | null
  onSelect: (countryId: string) => void
  disabled: boolean
}

const UNGUESSED_FILL = '#3a3a3a'
const HOVER_FILL = '#555'
const SELECTED_FILL = '#4a9eff'

export function WorldMap({ countries, guesses, selectedCountryId, onSelect, disabled }: WorldMapProps) {
  return (
    <>
      <CountryMap
        countries={countries}
        getFill={(countryId) => {
          const guess = countryId ? guesses[countryId] : undefined
          if (guess) return guess.correct ? CORRECT_COLOR : colorForDistance(guess.distanceKm)
          if (countryId && countryId === selectedCountryId) return SELECTED_FILL
          return UNGUESSED_FILL
        }}
        getHoverFill={(countryId, defaultFill) => {
          const guess = countryId ? guesses[countryId] : undefined
          return !disabled && countryId && !guess ? HOVER_FILL : defaultFill
        }}
        isClickable={(countryId) => !disabled && !guesses[countryId]}
        onCountryClick={onSelect}
      />
      <div className="world-map-legend">
        <span>
          <i style={{ background: SELECTED_FILL }} /> selected
        </span>
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
