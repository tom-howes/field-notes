import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { CollectionMap } from '../components/CollectionMap'

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

  if (authLoading) return <div className="page">Loading...</div>

  if (!isAuthenticated) {
    return (
      <div className="page">
        <h1>Your Collection</h1>
        <p>Sign in to start collecting songs from around the world.</p>
      </div>
    )
  }

  const selected = data?.collected.find((c) => c.countryId === selectedCountryId)

  return (
    <div className="page">
      <h1>Your Collection</h1>
      {isLoading && <p>Loading...</p>}
      {data && (
        <>
          <p className="fine-print">
            {data.collectedCount} of {data.totalUnlockedCountries} available countries collected
          </p>
          {data.collected.length === 0 ? (
            <p>No countries collected yet &mdash; head to Play to get started.</p>
          ) : (
            <>
              <CollectionMap
                countries={countries}
                collected={data.collected}
                selectedCountryId={selectedCountryId}
                onSelect={setSelectedCountryId}
              />
              {selected && (
                <div className="collection-selected">
                  <span className="collection-country">{selected.countryName}</span>
                  <span className="collection-song">
                    {selected.songTitle} &mdash; {selected.artistName}
                  </span>
                  <span className="fine-print">
                    {selected.attemptsTaken} attempt{selected.attemptsTaken === 1 ? '' : 's'}
                  </span>
                </div>
              )}
              <ul className="collection-list">
                {data.collected.map((c) => (
                  <li
                    key={c.countryId}
                    className={c.countryId === selectedCountryId ? 'collection-item selected' : 'collection-item'}
                    onClick={() => setSelectedCountryId(c.countryId)}
                  >
                    <span className="collection-country">{c.countryName}</span>
                    <span className="collection-song">
                      {c.songTitle} &mdash; {c.artistName}
                    </span>
                    <span className="fine-print">
                      {c.attemptsTaken} attempt{c.attemptsTaken === 1 ? '' : 's'}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  )
}
