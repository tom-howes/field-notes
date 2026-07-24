interface LogoProps {
  size?: number
  showText?: boolean
}

export function Logo({ size = 22, showText = true }: LogoProps) {
  return (
    <span className="logo">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {/* globe */}
        <circle cx="10" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.4" />
        <ellipse cx="10" cy="12" rx="3.6" ry="8.5" stroke="currentColor" strokeWidth="1.1" />
        <line x1="1.5" y1="12" x2="18.5" y2="12" stroke="currentColor" strokeWidth="1.1" />
        {/* music note badge */}
        <circle cx="18" cy="18" r="5.5" fill="#1db954" />
        <path
          d="M16.3 20.3a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6zm1.3-1.3v-4.3l2.6-.6v1.1l-1.7.4v3.4"
          stroke="#fff"
          strokeWidth="0.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      {showText && (
        <span className="logo-text">
          Field<span className="logo-text-accent">Notes</span>
        </span>
      )}
    </span>
  )
}
