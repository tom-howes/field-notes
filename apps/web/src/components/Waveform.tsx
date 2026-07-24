import { useMemo } from 'react'

interface WaveformProps {
  seed: string
  progress: number // 0 to 1
  isPlaying: boolean
  onPlayClick: () => void
  disabled: boolean
  barCount?: number
}

// Deterministic per-round bar heights so the waveform doesn't reshuffle on
// every re-render, but still looks different round to round.
function seededHeights(seed: string, count: number): number[] {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0

  const heights: number[] = []
  for (let i = 0; i < count; i++) {
    h = (h * 1103515245 + 12345) >>> 0
    heights.push(0.25 + ((h >>> 8) % 1000) / 1000 / 1.4)
  }
  return heights
}

export function Waveform({ seed, progress, isPlaying, onPlayClick, disabled, barCount = 70 }: WaveformProps) {
  const heights = useMemo(() => seededHeights(seed, barCount), [seed, barCount])
  const playedBars = Math.round(progress * barCount)

  return (
    <div className="waveform">
      <button
        type="button"
        className="waveform-play-button"
        onClick={onPlayClick}
        disabled={disabled}
        aria-label={isPlaying ? 'Playing' : 'Play clip'}
      >
        {isPlaying ? '❚❚' : '▶'}
      </button>
      <div className="waveform-bars">
        {heights.map((h, i) => (
          <div
            key={i}
            className={`waveform-bar${i < playedBars ? ' played' : ''}`}
            style={{ height: `${h * 100}%` }}
          />
        ))}
      </div>
    </div>
  )
}
