// Minimal ambient types for Spotify's Embed IFrame API (loaded via <script> at
// runtime). Used as the non-Premium playback engine — it plays the same 30s
// preview content the public embed widget uses, which isn't gated behind our
// app's restricted API access the way the raw preview_url field is.
// https://developer.spotify.com/documentation/embeds/tutorials/using-the-iframe-api
export {}

declare global {
  interface Window {
    onSpotifyIframeApiReady: (IFrameAPI: SpotifyIFrameAPI) => void
  }

  interface SpotifyIFrameAPI {
    createController(
      element: HTMLElement,
      options: { uri: string; width?: string | number; height?: string | number },
      callback: (controller: SpotifyEmbedController) => void,
    ): void
  }

  interface SpotifyEmbedPlaybackUpdate {
    isPaused: boolean
    isBuffering: boolean
    duration: number
    position: number
    playingURI: string
  }

  interface SpotifyEmbedController {
    play(): void
    pause(): void
    resume(): void
    togglePlay(): void
    seek(seconds: number): void
    loadUri(uri: string): void
    addListener(event: 'ready' | 'not_ready', cb: () => void): void
    addListener(event: 'playback_update', cb: (e: { data: SpotifyEmbedPlaybackUpdate }) => void): void
    destroy(): void
  }
}
