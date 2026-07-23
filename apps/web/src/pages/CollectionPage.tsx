import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

export function CollectionPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['collection'],
    queryFn: api.collection,
    enabled: isAuthenticated,
  })

  if (authLoading) return <div className="page">Loading...</div>

  if (!isAuthenticated) {
    return (
      <div className="page">
        <h1>Your Collection</h1>
        <p>Sign in to start collecting songs from around the world.</p>
      </div>
    )
  }

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
            <ul className="collection-list">
              {data.collected.map((c) => (
                <li key={c.countryId} className="collection-item">
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
          )}
        </>
      )}
    </div>
  )
}
