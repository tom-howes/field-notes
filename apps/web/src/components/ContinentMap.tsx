import { CountryMap } from './CountryMap'
import type { Country } from '../lib/api'

const REGION_COLORS: Record<string, string> = {
  Africa: '#e67e22',
  Americas: '#3498db',
  Asia: '#e74c3c',
  Europe: '#9b59b6',
  Oceania: '#1abc9c',
}
const DEFAULT_FILL = '#3a3a3a'

interface ContinentMapProps {
  countries: Country[]
}

export function ContinentMap({ countries }: ContinentMapProps) {
  const regionByCountryId = new Map(countries.map((c) => [c.id, c.region]))

  return (
    <div>
      <CountryMap
        countries={countries}
        getFill={(countryId) => {
          if (!countryId) return DEFAULT_FILL
          const region = regionByCountryId.get(countryId)
          return (region && REGION_COLORS[region]) || DEFAULT_FILL
        }}
      />
      <div className="world-map-legend">
        {Object.entries(REGION_COLORS).map(([region, color]) => (
          <span key={region}>
            <i style={{ background: color }} /> {region}
          </span>
        ))}
      </div>
    </div>
  )
}
