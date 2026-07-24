import { useState } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import { isoNumericToAlpha2 } from '../lib/isoNumericToAlpha2'
import type { Country } from '../lib/api'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
const MIN_ZOOM = 1
const MAX_ZOOM = 8

export interface CountryMapProps {
  countries: Country[]
  getFill: (countryId: string | undefined) => string
  getHoverFill?: (countryId: string | undefined, defaultFill: string) => string
  isClickable?: (countryId: string) => boolean
  onCountryClick?: (countryId: string) => void
}

export function CountryMap({ countries, getFill, getHoverFill, isClickable, onCountryClick }: CountryMapProps) {
  const countryIdByIsoCode = new Map(countries.map((c) => [c.isoCode, c.id]))
  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [0, 0],
    zoom: 1,
  })

  function zoomBy(factor: number) {
    setPosition((prev) => ({ ...prev, zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev.zoom * factor)) }))
  }

  return (
    <div className="world-map">
      <div className="world-map-zoom-controls">
        <button type="button" onClick={() => zoomBy(1.5)} aria-label="Zoom in">
          +
        </button>
        <button type="button" onClick={() => zoomBy(1 / 1.5)} aria-label="Zoom out">
          &minus;
        </button>
      </div>
      <ComposableMap projection="geoMercator" projectionConfig={{ scale: 110 }} width={800} height={420}>
        <ZoomableGroup
          center={position.coordinates}
          zoom={position.zoom}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          onMoveEnd={setPosition}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const numericId = String(parseInt(geo.id as string, 10))
                const isoCode = isoNumericToAlpha2[numericId]
                const countryId = isoCode ? countryIdByIsoCode.get(isoCode) : undefined

                const fill = getFill(countryId)
                const hoverFill = getHoverFill ? getHoverFill(countryId, fill) : fill
                const clickable = !!countryId && !!isClickable?.(countryId)

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => clickable && countryId && onCountryClick?.(countryId)}
                    style={{
                      default: { fill, stroke: '#1a1a1a', strokeWidth: 0.5, outline: 'none' },
                      hover: { fill: hoverFill, stroke: '#1a1a1a', strokeWidth: 0.5, outline: 'none' },
                      pressed: { fill, stroke: '#1a1a1a', strokeWidth: 0.5, outline: 'none' },
                    }}
                    className={clickable ? 'world-map-country clickable' : 'world-map-country'}
                  />
                )
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  )
}
