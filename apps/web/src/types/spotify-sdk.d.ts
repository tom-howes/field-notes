// Minimal ambient types for the Spotify Web Playback SDK (loaded via <script> at runtime).
// https://developer.spotify.com/documentation/web-playback-sdk
export {}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void
    Spotify: {
      Player: new (options: {
        name: string
        getOAuthToken: (cb: (token: string) => void) => void
        volume?: number
      }) => SpotifyPlayerInstance
    }
  }

  interface SpotifyPlayerInstance {
    connect(): Promise<boolean>
    disconnect(): void
    pause(): Promise<void>
    addListener(event: 'ready' | 'not_ready', cb: (data: { device_id: string }) => void): void
    addListener(
      event: 'initialization_error' | 'authentication_error' | 'account_error' | 'playback_error',
      cb: (data: { message: string }) => void,
    ): void
  }
}
