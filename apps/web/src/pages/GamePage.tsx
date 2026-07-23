import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../lib/api'
import type { GuessResponse, StartRoundResponse } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer'
import { CountryPicker } from '../components/CountryPicker'
import { WorldMap } from '../components/WorldMap'
import type { GuessMarker } from '../components/WorldMap'

export function GamePage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const { error: playerError, playClip, isReady } = useSpotifyPlayer(isAuthenticated)
  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: api.countries,
    enabled: isAuthenticated,
  })

  const [round, setRound] = useState<StartRoundResponse | null>(null)
  const [result, setResult] = useState<GuessResponse | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isBusy, setIsBusy] = useState(false)
  const [guesses, setGuesses] = useState<Record<string, GuessMarker>>({})

  if (authLoading) {
    return <div className="page">Loading...</div>
  }

  if (!isAuthenticated) {
    return (
      <div className="page">
        <h1>Field Notes</h1>
        <p>A song plays. You guess the country. Guess wrong and the clip gets longer.</p>
        <a className="spotify-login-button" href={api.loginUrl()}>
          Sign in with Spotify
        </a>
        <p className="fine-print">Requires Spotify Premium to play clips.</p>
      </div>
    )
  }

  async function handleStartRound() {
    setIsBusy(true)
    setResult(null)
    setGuesses({})
    try {
      const newRound = await api.startRound()
      setRound(newRound)
      await handlePlay(newRound.spotifyTrackId, newRound.clipSeconds)
    } finally {
      setIsBusy(false)
    }
  }

  async function handlePlay(spotifyTrackId: string, clipSeconds: number) {
    setIsPlaying(true)
    await playClip(spotifyTrackId, clipSeconds)
    setTimeout(() => setIsPlaying(false), clipSeconds * 1000)
  }

  async function handleGuess(countryId: string) {
    if (!round) return
    setIsBusy(true)
    try {
      const res = await api.guess(round.roundId, countryId)
      setResult(res)
      setGuesses((prev) => ({ ...prev, [countryId]: { distanceKm: res.distanceKm ?? 0, correct: res.correct } }))
      if (!res.roundComplete && res.attemptNumber && res.clipSeconds) {
        setRound({ ...round, attemptNumber: res.attemptNumber, clipSeconds: res.clipSeconds })
      }
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <div className="page">
      <h1>Field Notes</h1>
      <p className="fine-print">Signed in as {user?.displayName}</p>

      {playerError && <p className="error-banner">{playerError}</p>}

      {!round && (
        <button type="button" onClick={handleStartRound} disabled={!isReady || isBusy}>
          {isReady ? 'Start round' : 'Connecting to Spotify...'}
        </button>
      )}

      {round && !result?.roundComplete && (
        <div className="round-panel">
          <p>
            Attempt {round.attemptNumber} of {round.maxAttempts} &mdash; {round.clipSeconds}s clip
          </p>
          <button
            type="button"
            onClick={() => handlePlay(round.spotifyTrackId, round.clipSeconds)}
            disabled={isPlaying || isBusy}
          >
            {isPlaying ? 'Playing...' : 'Play clip again'}
          </button>
          <WorldMap countries={countries} guesses={guesses} onGuess={handleGuess} disabled={isBusy || isPlaying} />
          <CountryPicker countries={countries} onGuess={handleGuess} disabled={isBusy || isPlaying} />
          {result && !result.correct && (
            <p className="feedback">
              Not quite{result.distanceKm !== undefined ? ` — about ${result.distanceKm.toLocaleString()} km away` : ''} — clip is extending, try again.
            </p>
          )}
        </div>
      )}

      {result?.roundComplete && (
        <div className="round-panel">
          {result.correct ? (
            <>
              <p className="feedback success">
                Congratulations! It was {result.country?.name} ({result.attemptsTaken} attempt
                {result.attemptsTaken === 1 ? '' : 's'}). Added to your collection.
              </p>
              {result.song && (
                <iframe
                  className="spotify-embed"
                  src={`https://open.spotify.com/embed/track/${result.song.spotifyTrackId}?utm_source=generator`}
                  width="100%"
                  height="152"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  title={`${result.song.title} by ${result.song.artistName} on Spotify`}
                />
              )}
            </>
          ) : (
            <p className="feedback">Out of attempts — it was {result.country?.name}.</p>
          )}
          <button
            type="button"
            onClick={() => {
              setRound(null)
              setResult(null)
            }}
          >
            Next round
          </button>
        </div>
      )}
    </div>
  )
}
