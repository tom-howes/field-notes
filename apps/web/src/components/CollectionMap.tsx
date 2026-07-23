import { CountryMap } from './CountryMap'
import type { Country, CollectedCountry } from '../lib/api'

interface CollectionMapProps {
  countries: Country[]
  collected: CollectedCountry[]
  selectedCountryId: string | null
  onSelect: (countryId: string) => void
}

const COLLECTED_FILL = '#1db954'
const SELECTED_FILL = '#5ee08a'
const UNLOCKED_FILL = '#4a4a4a'
const LOCKED_FILL = '#2a2a2a'
const HOVER_FILL = '#2ecc71'

export function CollectionMap({ countries, collected, selectedCountryId, onSelect }: CollectionMapProps) {
  const collectedIds = new Set(collected.map((c) => c.countryId))
  const countryById = new Map(countries.map((c) => [c.id, c]))

  return (
    <div>
      <CountryMap
        countries={countries}
        getFill={(countryId) => {
          if (!countryId) return LOCKED_FILL
          if (countryId === selectedCountryId) return SELECTED_FILL
          if (collectedIds.has(countryId)) return COLLECTED_FILL
          return countryById.get(countryId)?.status === 'UNLOCKED' ? UNLOCKED_FILL : LOCKED_FILL
        }}
        getHoverFill={(countryId, defaultFill) => (countryId && collectedIds.has(countryId) ? HOVER_FILL : defaultFill)}
        isClickable={(countryId) => collectedIds.has(countryId)}
        onCountryClick={onSelect}
      />
      <div className="world-map-legend">
        <span>
          <i style={{ background: COLLECTED_FILL }} /> collected
        </span>
        <span>
          <i style={{ background: UNLOCKED_FILL }} /> not yet collected
        </span>
        <span>
          <i style={{ background: LOCKED_FILL }} /> locked
        </span>
      </div>
    </div>
  )
}
