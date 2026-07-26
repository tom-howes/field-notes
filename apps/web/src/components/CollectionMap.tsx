import { CountryMap } from './CountryMap'
import type { Country, CollectedCountry } from '../lib/api'

interface CollectionMapProps {
  countries: Country[]
  collected: CollectedCountry[]
  selectedCountryId: string | null
  onSelect: (countryId: string) => void
  focusCenter?: [number, number]
  focusZoom?: number
}

const COLLECTED_FILL = '#1db954'
const SELECTED_FILL = '#5ee08a'
// Locked and unlocked-but-uncollected share one color deliberately — showing
// which countries are currently guessable would give away the answer space.
const NOT_COLLECTED_FILL = '#3a3a3a'
const HOVER_FILL = '#2ecc71'

export function CollectionMap({ countries, collected, selectedCountryId, onSelect, focusCenter, focusZoom }: CollectionMapProps) {
  const collectedIds = new Set(collected.map((c) => c.countryId))

  return (
    <div>
      <CountryMap
        countries={countries}
        getFill={(countryId) => {
          if (!countryId) return NOT_COLLECTED_FILL
          if (countryId === selectedCountryId) return SELECTED_FILL
          return collectedIds.has(countryId) ? COLLECTED_FILL : NOT_COLLECTED_FILL
        }}
        getHoverFill={(countryId, defaultFill) => (countryId && collectedIds.has(countryId) ? HOVER_FILL : defaultFill)}
        isClickable={(countryId) => collectedIds.has(countryId)}
        onCountryClick={onSelect}
        focusCenter={focusCenter}
        focusZoom={focusZoom}
      />
      <div className="world-map-legend">
        <span>
          <i style={{ background: COLLECTED_FILL }} /> collected
        </span>
        <span>
          <i style={{ background: NOT_COLLECTED_FILL }} /> not yet collected
        </span>
      </div>
    </div>
  )
}
