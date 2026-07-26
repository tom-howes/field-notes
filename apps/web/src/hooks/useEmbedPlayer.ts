import { useEffect, useRef, useState } from 'react'

const IFRAME_API_SRC = 'https://open.spotify.com/embed/iframe-api/v1'

// Module-level cache: the iframe_api script calls window.onSpotifyIframeApiReady
// exactly once, ever, when it finishes loading. If a component mounts, unmounts,
// and remounts after that (React's dev-mode double-invoke, or just navigating
// away and back), a later mount overwriting that callback would never see it
// fire again. Caching the resolved API (and queueing callbacks that arrive
// before it resolves) makes every mount — first or later — resolve correctly.
let cachedIFrameApi: SpotifyIFrameAPI | null = null
let pendingCallbacks: ((api: SpotifyIFrameAPI) => void)[] = []

function loadIFrameApi(onReady: (api: SpotifyIFrameAPI) => void) {
  if (cachedIFrameApi) {
    onReady(cachedIFrameApi)
    return
  }

  pendingCallbacks.push(onReady)

  if (document.querySelector(`script[src="${IFRAME_API_SRC}"]`)) return

  window.onSpotifyIframeApiReady = (api) => {
    cachedIFrameApi = api
    pendingCallbacks.forEach((cb) => cb(api))
    pendingCallbacks = []
  }

  const script = document.createElement('script')
  script.src = IFRAME_API_SRC
  script.async = true
  document.body.appendChild(script)
}

// Non-Premium playback engine: Spotify's Embed IFrame API plays the same ~30s
// preview content the public embed widget uses. This isn't subject to the
// preview_url restriction our app's own API access hits, since it's Spotify's
// own first-party embed surface rather than a call made with our credentials.
export function useEmbedPlayer(enabled: boolean) {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const apiRef = useRef<SpotifyIFrameAPI | null>(null)
  const controllerRef = useRef<SpotifyEmbedController | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.width = '1px'
    container.style.height = '1px'
    container.style.opacity = '0'
    container.style.pointerEvents = 'none'
    document.body.appendChild(container)
    containerRef.current = container

    loadIFrameApi((api) => {
      if (cancelled) return
      apiRef.current = api
      setIsReady(true)
    })

    return () => {
      cancelled = true
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current)
      controllerRef.current?.destroy()
      controllerRef.current = null
      container.remove()
    }
  }, [enabled])

  function playClip(spotifyTrackId: string, clipSeconds: number) {
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current)

    if (!controllerRef.current) {
      if (!apiRef.current || !containerRef.current) {
        setError('Player is not ready yet')
        return
      }
      apiRef.current.createController(
        containerRef.current,
        { uri: `spotify:track:${spotifyTrackId}`, width: 1, height: 1 },
        (controller) => {
          controllerRef.current = controller
          controller.addListener('not_ready', () => setError('Preview player disconnected'))
          controller.play()
        },
      )
    } else {
      controllerRef.current.loadUri(`spotify:track:${spotifyTrackId}`)
      controllerRef.current.play()
    }

    pauseTimeoutRef.current = setTimeout(() => controllerRef.current?.pause(), clipSeconds * 1000)
  }

  return { error, playClip, isReady }
}
