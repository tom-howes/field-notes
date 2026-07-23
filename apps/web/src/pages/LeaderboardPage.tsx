import { useQuery } from '@tanstack/react-query'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

export function LeaderboardPage() {
  const { isAuthenticated } = useAuth()
  const { data: top, isLoading } = useQuery({ queryKey: ['leaderboard'], queryFn: api.leaderboard })
  const { data: mine } = useQuery({
    queryKey: ['leaderboard', 'me'],
    queryFn: api.myRank,
    enabled: isAuthenticated,
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  })

  const mineIsInTop = mine && top?.some((row) => row.userId === mine.userId)

  return (
    <div className="page">
      <h1>Leaderboard</h1>
      {isLoading && <p>Loading...</p>}
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
    </div>
  )
}
