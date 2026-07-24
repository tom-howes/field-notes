import { useQuery } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { api } from '../lib/api'
import type { GuessResponse, StartRoundResponse } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer'
import { CountryPicker } from '../components/CountryPicker'
import { WorldMap } from '../components/WorldMap'
import type { GuessMarker } from '../components/WorldMap'
import { Waveform } from '../components/Waveform'
import { Logo } from '../components/Logo'
import { CORRECT_COLOR, colorForDistance } from '../lib/distanceColor'

const PROGRESS_TICK_MS = 100

interface GuessHistoryEntry {
  countryId: string
  countryName: string
  isoCode: string
  distanceKm: number
  correct: boolean
}

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
  const [playProgress, setPlayProgress] = useState(0)
  const [isBusy, setIsBusy] = useState(false)
  const [guesses, setGuesses] = useState<Record<string, GuessMarker>>({})
  const [guessHistory, setGuessHistory] = useState<GuessHistoryEntry[]>([])
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  if (authLoading) {
    return <div className="page">Loading...</div>
  }

  if (!isAuthenticated) {
    return (
      <div className="page">
        <div className="game-header">
          <h1>
            <Logo size={22} />
          </h1>
        </div>
        <div className="game-intro">
          <p>A song plays. You guess the country. Guess wrong and the clip gets longer.</p>
          <a className="spotify-login-button" href={api.loginUrl()}>
            Sign in with Spotify
          </a>
          <p className="fine-print">Requires Spotify Premium to play clips.</p>
        </div>
      </div>
    )
  }

  async function handleStartRound() {
    setIsBusy(true)
    setResult(null)
    setGuesses({})
    setGuessHistory([])
    setSelectedCountryId(null)
    try {
      const newRound = await api.startRound()
      setRound(newRound)
      await handlePlay(newRound.spotifyTrackId, newRound.clipSeconds)
    } finally {
      setIsBusy(false)
    }
  }

  async function handlePlay(spotifyTrackId: string, clipSeconds: number) {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)

    setIsPlaying(true)
    setPlayProgress(0)
    await playClip(spotifyTrackId, clipSeconds)

    const startedAt = Date.now()
    const totalMs = clipSeconds * 1000
    progressIntervalRef.current = setInterval(() => {
      const pct = Math.min(1, (Date.now() - startedAt) / totalMs)
      setPlayProgress(pct)
      if (pct >= 1) {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
        setIsPlaying(false)
      }
    }, PROGRESS_TICK_MS)
  }

  async function handleSubmitGuess() {
    if (!round || !selectedCountryId) return
    const countryId = selectedCountryId
    const country = countries.find((c) => c.id === countryId)
    setIsBusy(true)
    try {
      const res = await api.guess(round.roundId, countryId)
      setResult(res)
      setSelectedCountryId(null)
      setGuesses((prev) => ({ ...prev, [countryId]: { distanceKm: res.distanceKm ?? 0, correct: res.correct } }))
      if (country) {
        setGuessHistory((prev) => [
          { countryId, countryName: country.name, isoCode: country.isoCode, distanceKm: res.distanceKm ?? 0, correct: res.correct },
          ...prev,
        ])
      }
      if (!res.roundComplete && res.attemptNumber && res.clipSeconds) {
        setRound({ ...round, attemptNumber: res.attemptNumber, clipSeconds: res.clipSeconds })
      }
    } finally {
      setIsBusy(false)
    }
  }

  const selectedCountry = countries.find((c) => c.id === selectedCountryId)

  return (
    <div className="page">
      <div className="game-header">
        <h1>
          <Logo size={22} />
        </h1>
        <p className="fine-print">Signed in as {user?.displayName}</p>
      </div>

      {playerError && <p className="error-banner">{playerError}</p>}

      {!round && (
        <div className="game-intro">
          <button type="button" className="button-primary" onClick={handleStartRound} disabled={!isReady || isBusy}>
            {isReady ? 'Start round' : 'Connecting to Spotify...'}
          </button>
        </div>
      )}

      {round && !result?.roundComplete && (
        <div className="round-panel">
          <div className="round-status">
            <span className="round-status-badge">
              Attempt {round.attemptNumber} <span className="round-status-muted">/ {round.maxAttempts}</span>
            </span>
            <span className="round-status-muted">{round.clipSeconds}s clip</span>
          </div>

          <Waveform
            seed={round.roundId}
            progress={playProgress}
            isPlaying={isPlaying}
            onPlayClick={() => handlePlay(round.spotifyTrackId, round.clipSeconds)}
            disabled={isBusy}
          />

          <WorldMap
            countries={countries}
            guesses={guesses}
            selectedCountryId={selectedCountryId}
            onSelect={setSelectedCountryId}
            disabled={isBusy || isPlaying}
          />

          <div className="guess-bar">
            <CountryPicker countries={countries} onSelect={setSelectedCountryId} disabled={isBusy || isPlaying} />
            <div className="guess-bar-selected">{selectedCountry ? selectedCountry.name : 'Select a country on the map or search'}</div>
            <button type="button" className="button-primary" onClick={handleSubmitGuess} disabled={isBusy || !selectedCountryId}>
              Submit Guess
            </button>
          </div>

          {guessHistory.length > 0 && (
            <div className="guess-history-row">
              {guessHistory.map((g, i) => (
                <span
                  key={i}
                  className="guess-chip"
                  style={{ borderColor: g.correct ? CORRECT_COLOR : colorForDistance(g.distanceKm) }}
                >
                  <strong>{g.isoCode}</strong> {g.correct ? 'Correct!' : `${g.distanceKm.toLocaleString()} km`}
                </span>
              ))}
            </div>
          )}

          {result && !result.correct && (
            <p className="feedback">
              Not quite{result.distanceKm !== undefined ? ` — about ${result.distanceKm.toLocaleString()} km away` : ''} — clip is extending, try again.
            </p>
          )}
        </div>
      )}

      {result?.roundComplete && (
        <div className="round-panel round-complete">
          {result.correct ? (
            <>
              <div className="celebration">
                {result.country && (
                  <img
                    className="celebration-flag"
                    src={`https://flagcdn.com/h120/${result.country.isoCode.toLowerCase()}.png`}
                    alt={`Flag of ${result.country.name}`}
                  />
                )}
                <h2 className="celebration-headline">Nailed it!</h2>
                <p className="celebration-detail">
                  It was {result.country?.name} &mdash; {result.attemptsTaken} attempt
                  {result.attemptsTaken === 1 ? '' : 's'}. Added to your collection.
                </p>
              </div>
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
            className="button-primary"
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
