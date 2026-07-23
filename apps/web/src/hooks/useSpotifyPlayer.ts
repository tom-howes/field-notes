import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'

const SDK_SCRIPT_SRC = 'https://sdk.scdn.co/spotify-player.js'

export function useSpotifyPlayer(enabled: boolean) {
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const playerRef = useRef<SpotifyPlayerInstance | null>(null)
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled) return

    function initPlayer() {
      const player = new window.Spotify.Player({
        name: 'Field Notes',
        getOAuthToken: (cb) => {
          api
            .spotifyToken()
            .then(({ accessToken }) => cb(accessToken))
            .catch(() => setError('Could not get a Spotify access token'))
        },
        volume: 0.7,
      })

      player.addListener('ready', ({ device_id }) => setDeviceId(device_id))
      player.addListener('not_ready', () => setDeviceId(null))
      player.addListener('initialization_error', ({ message }) => setError(message))
      player.addListener('authentication_error', ({ message }) => setError(message))
      player.addListener('account_error', () =>
        setError('Spotify Premium is required to play clips in Field Notes.'),
      )

      player.connect()
      playerRef.current = player
    }

    if (window.Spotify) {
      initPlayer()
    } else {
      const existing = document.querySelector(`script[src="${SDK_SCRIPT_SRC}"]`)
      if (!existing) {
        const script = document.createElement('script')
        script.src = SDK_SCRIPT_SRC
        script.async = true
        document.body.appendChild(script)
      }
      window.onSpotifyWebPlaybackSDKReady = initPlayer
    }

    return () => {
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current)
      playerRef.current?.disconnect()
      playerRef.current = null
    }
  }, [enabled])

  async function playClip(spotifyTrackId: string, clipSeconds: number) {
    if (!deviceId) {
      setError('Player is not ready yet')
      return
    }
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current)

    const { accessToken } = await api.spotifyToken()
    const res = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uris: [`spotify:track:${spotifyTrackId}`], position_ms: 0 }),
    })

    if (!res.ok && res.status !== 204) {
      setError('Failed to start playback')
      return
    }

    pauseTimeoutRef.current = setTimeout(() => {
      playerRef.current?.pause().catch(() => {})
    }, clipSeconds * 1000)
  }

  return { deviceId, error, playClip, isReady: deviceId !== null }
}
