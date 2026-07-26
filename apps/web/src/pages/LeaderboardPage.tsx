import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

type Tab = 'overall' | 'efficiency' | 'streaks' | 'continents' | 'countries'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overall', label: 'Overall' },
  { id: 'efficiency', label: 'Efficiency' },
  { id: 'streaks', label: 'Streaks' },
  { id: 'continents', label: 'By Continent' },
  { id: 'countries', label: 'By Country' },
]

export function LeaderboardPage() {
  const { isAuthenticated } = useAuth()
  const [tab, setTab] = useState<Tab>('overall')
  const [selectedContinent, setSelectedContinent] = useState<string | null>(null)

  const { data: top, isLoading: topLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: api.leaderboard,
    enabled: tab === 'overall',
  })
  const { data: mine } = useQuery({
    queryKey: ['leaderboard', 'me'],
    queryFn: api.myRank,
    enabled: isAuthenticated && tab === 'overall',
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  })
  const { data: efficiency, isLoading: efficiencyLoading } = useQuery({
    queryKey: ['leaderboard', 'efficiency'],
    queryFn: api.leaderboardEfficiency,
    enabled: tab === 'efficiency',
  })
  const { data: streaks, isLoading: streaksLoading } = useQuery({
    queryKey: ['leaderboard', 'streaks'],
    queryFn: api.leaderboardStreaks,
    enabled: tab === 'streaks',
  })
  const { data: continents, isLoading: continentsLoading } = useQuery({
    queryKey: ['leaderboard', 'continents'],
    queryFn: api.leaderboardContinents,
    enabled: tab === 'continents',
  })
  const { data: countries, isLoading: countriesLoading } = useQuery({
    queryKey: ['leaderboard', 'countries'],
    queryFn: api.leaderboardCountries,
    enabled: tab === 'countries',
  })

  const mineIsInTop = mine && top?.some((row) => row.userId === mine.userId)

  const continentOptions = useMemo(
    () => Array.from(new Set((countries ?? []).map((c) => c.region).filter((r): r is string => !!r))).sort(),
    [countries],
  )
  const filteredCountries = (countries ?? []).filter((c) => !selectedContinent || c.region === selectedContinent)

  return (
    <div className="page">
      <h1>Leaderboard</h1>

      <div className="continent-filters">
        {TABS.map((t) => (
          <button
            type="button"
            key={t.id}
            className={tab === t.id ? 'continent-filter active' : 'continent-filter'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overall' && (
        <>
          {topLoading && <p>Loading...</p>}
          {top && top.length === 0 && <p>No players yet &mdash; be the first to collect a country.</p>}
          {top && top.length > 0 && (
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Countries</th>
                  <th>Avg attempts</th>
                </tr>
              </thead>
              <tbody>
                {top.map((row) => (
                  <tr key={row.userId} className={row.userId === mine?.userId ? 'leaderboard-row-mine' : ''}>
                    <td>{row.rank}</td>
                    <td>{row.displayName}</td>
                    <td>{row.countriesCollected}</td>
                    <td>{row.avgAttempts ?? '—'}</td>
                  </tr>
                ))}
                {mine && !mineIsInTop && (
                  <>
                    <tr>
                      <td colSpan={4}>...</td>
                    </tr>
                    <tr className="leaderboard-row-mine">
                      <td>{mine.rank}</td>
                      <td>{mine.displayName}</td>
                      <td>{mine.countriesCollected}</td>
                      <td>{mine.avgAttempts ?? '—'}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          )}
        </>
      )}

      {tab === 'efficiency' && (
        <>
          {efficiencyLoading && <p>Loading...</p>}
          {efficiency && efficiency.length === 0 && <p>No players have collected at least 3 countries yet.</p>}
          {efficiency && efficiency.length > 0 && (
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Avg attempts</th>
                  <th>Countries</th>
                </tr>
              </thead>
              <tbody>
                {efficiency.map((row) => (
                  <tr key={row.userId}>
                    <td>{row.rank}</td>
                    <td>{row.displayName}</td>
                    <td>{row.avgAttempts}</td>
                    <td>{row.countriesCollected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {tab === 'streaks' && (
        <>
          {streaksLoading && <p>Loading...</p>}
          {streaks && streaks.length === 0 && <p>No active streaks yet.</p>}
          {streaks && streaks.length > 0 && (
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Current streak</th>
                </tr>
              </thead>
              <tbody>
                {streaks.map((row) => (
                  <tr key={row.userId}>
                    <td>{row.rank}</td>
                    <td>{row.displayName}</td>
                    <td>{row.currentStreak}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {tab === 'continents' && (
        <>
          {continentsLoading && <p>Loading...</p>}
          {continents && continents.length === 0 && <p>No countries collected yet.</p>}
          {continents && continents.length > 0 && (
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Continent</th>
                  <th>Leader</th>
                  <th>Countries</th>
                </tr>
              </thead>
              <tbody>
                {continents.map((row) => (
                  <tr key={row.region}>
                    <td>{row.region}</td>
                    <td>{row.leaderDisplayName}</td>
                    <td>{row.countriesInRegion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {tab === 'countries' && (
        <>
          <div className="continent-filters">
            <button
              type="button"
              className={selectedContinent === null ? 'continent-filter active' : 'continent-filter'}
              onClick={() => setSelectedContinent(null)}
            >
              All
            </button>
            {continentOptions.map((region) => (
              <button
                type="button"
                key={region}
                className={selectedContinent === region ? 'continent-filter active' : 'continent-filter'}
                onClick={() => setSelectedContinent(region)}
              >
                {region}
              </button>
            ))}
          </div>
          {countriesLoading && <p>Loading...</p>}
          {countries && countries.length === 0 && <p>No countries collected yet.</p>}
          {countries && countries.length > 0 && (
            <div className="collection-accordion">
              {filteredCountries.map((c) => (
                <div key={c.countryId} className="collection-country-card">
                  <div className="collection-country-header">
                    <img
                      className="collection-country-flag"
                      src={`https://flagcdn.com/h40/${c.isoCode.toLowerCase()}.png`}
                      alt={`Flag of ${c.countryName}`}
                    />
                    <span className="collection-country-name">{c.countryName}</span>
                    <span className="collection-country-meta">
                      {c.leaderDisplayName} &middot; {c.attemptsTaken} attempt{c.attemptsTaken === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
