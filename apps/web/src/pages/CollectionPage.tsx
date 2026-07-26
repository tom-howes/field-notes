import { useQuery } from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { CollectionMap } from '../components/CollectionMap'

const WORLD_FOCUS: { center: [number, number]; zoom: number } = { center: [0, 0], zoom: 1 }

const REGION_FOCUS: Record<string, { center: [number, number]; zoom: number }> = {
  Africa: { center: [20, 3], zoom: 2.2 },
  Americas: { center: [-75, 10], zoom: 1.5 },
  Asia: { center: [90, 30], zoom: 1.8 },
  Europe: { center: [15, 52], zoom: 2.6 },
  Oceania: { center: [140, -25], zoom: 2.2 },
}

export function CollectionPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['collection'],
    queryFn: api.collection,
    enabled: isAuthenticated,
  })
  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: api.countries,
    enabled: isAuthenticated,
  })
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null)
  const [selectedContinent, setSelectedContinent] = useState<string | null>(null)
  const [expandedCountryIds, setExpandedCountryIds] = useState<Set<string>>(new Set())
  const accordionRef = useRef<HTMLDivElement | null>(null)

  function selectContinent(region: string | null) {
    setSelectedContinent(region)
    accordionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const continents = useMemo(
    () => Array.from(new Set(countries.map((c) => c.region).filter((r): r is string => !!r))).sort(),
    [countries],
  )

  function toggleExpanded(countryId: string) {
    setExpandedCountryIds((prev) => {
      const next = new Set(prev)
      if (next.has(countryId)) next.delete(countryId)
      else next.add(countryId)
      return next
    })
  }

  function handleMapSelect(countryId: string) {
    setSelectedCountryId(countryId)
    setExpandedCountryIds((prev) => new Set(prev).add(countryId))
  }

  if (authLoading) return <div className="page">Loading...</div>

  if (!isAuthenticated) {
    return (
      <div className="page">
        <h1>Your Collection</h1>
        <p>Sign in to start collecting songs from around the world.</p>
      </div>
    )
  }

  const filteredCollected = data?.collected.filter((c) => !selectedContinent || c.region === selectedContinent) ?? []
  const coveragePct = data && data.totalUnlockedCountries > 0 ? (data.collectedCount / data.totalUnlockedCountries) * 100 : 0
  const mapFocus = (selectedContinent && REGION_FOCUS[selectedContinent]) || WORLD_FOCUS

  return (
    <div className="page">
      <h1>Your Collection</h1>
      {isLoading && <p>Loading...</p>}
      {data && (
        <>
          <div className="collection-stats">
            <div className="stat-card">
              <span className="stat-value">{data.collectedCount}</span>
              <span className="stat-label">Countries</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{data.songsCollectedCount}</span>
              <span className="stat-label">Songs Found</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{data.continentsCollectedCount}</span>
              <span className="stat-label">Continents</span>
            </div>
          </div>

          <div className="world-coverage">
            <div className="world-coverage-label">
              <span>World Coverage</span>
              <span>
                {data.collectedCount} / {data.totalUnlockedCountries}
              </span>
            </div>
            <div className="world-coverage-bar">
              <div className="world-coverage-fill" style={{ width: `${coveragePct}%` }} />
            </div>
          </div>

          <div className="continent-filters">
            <button
              type="button"
              className={selectedContinent === null ? 'continent-filter active' : 'continent-filter'}
              onClick={() => selectContinent(null)}
            >
              All
            </button>
            {continents.map((region) => (
              <button
                type="button"
                key={region}
                className={selectedContinent === region ? 'continent-filter active' : 'continent-filter'}
                onClick={() => selectContinent(region)}
              >
                {region}
              </button>
            ))}
          </div>

          {data.collected.length === 0 ? (
            <p>No countries collected yet &mdash; head to Play to get started.</p>
          ) : (
            <>
              <CollectionMap
                countries={countries}
                collected={data.collected}
                selectedCountryId={selectedCountryId}
                onSelect={handleMapSelect}
                focusCenter={mapFocus.center}
                focusZoom={mapFocus.zoom}
              />

              <div className="collection-accordion" ref={accordionRef}>
                {filteredCollected.map((c) => {
                  const expanded = expandedCountryIds.has(c.countryId)
                  return (
                    <div key={c.countryId} className="collection-country-card">
                      <button
                        type="button"
                        className="collection-country-header"
                        onClick={() => toggleExpanded(c.countryId)}
                      >
                        <img
                          className="collection-country-flag"
                          src={`https://flagcdn.com/h40/${c.isoCode.toLowerCase()}.png`}
                          alt={`Flag of ${c.countryName}`}
                        />
                        <span className="collection-country-name">{c.countryName}</span>
                        <span className="collection-country-meta">
                          {c.songs.length} song{c.songs.length === 1 ? '' : 's'}
                          {c.region ? ` · ${c.region}` : ''}
                        </span>
                        <span className="collection-chevron">{expanded ? '▲' : '▼'}</span>
                      </button>
                      {expanded && (
                        <ul className="collection-song-list">
                          {c.songs.map((song) => (
                            <li key={song.songId} className="collection-song-item">
                              <span className="collection-song-title">
                                {song.title} <span className="fine-print">&mdash; {song.artistName}</span>
                              </span>
                              <a
                                className="collection-song-link"
                                href={song.spotifyUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Spotify
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
