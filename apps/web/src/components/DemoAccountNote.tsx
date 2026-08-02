import { useRef, useState } from 'react'

const DEMO_EMAIL = import.meta.env.VITE_DEMO_SPOTIFY_EMAIL as string | undefined
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_SPOTIFY_PASSWORD as string | undefined

// Falls back to selecting the text (so Ctrl/Cmd+C still works) if the async
// Clipboard API is unavailable or blocked — some browser/embed contexts deny
// clipboard-write even on a genuine click.
function selectText(node: HTMLElement) {
  const range = document.createRange()
  range.selectNodeContents(node)
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  const valueRef = useRef<HTMLElement>(null)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      if (valueRef.current) selectText(valueRef.current)
    }
  }

  return (
    <div className="demo-account-field">
      <span className="demo-account-label">{label}</span>
      <code className="demo-account-value" ref={valueRef}>
        {value}
      </code>
      <button type="button" className="demo-account-copy" onClick={handleCopy}>
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}

// Only rendered when a demo Spotify account has actually been provisioned and
// added to the app's (5-user-max, as of Spotify's Feb 2026 Development Mode
// rules) allowlist — lets recruiters try the app without spending one of
// those slots on their own account.
export function DemoAccountNote() {
  const [expanded, setExpanded] = useState(false)

  if (!DEMO_EMAIL || !DEMO_PASSWORD) return null

  return (
    <div className="demo-account">
      <button type="button" className="demo-account-toggle" onClick={() => setExpanded((v) => !v)}>
        Recruiter? Use a demo account instead of your own {expanded ? '▲' : '▼'}
      </button>
      {expanded && (
        <div className="demo-account-fields">
          <CopyField label="Email" value={DEMO_EMAIL} />
          <CopyField label="Password" value={DEMO_PASSWORD} />
        </div>
      )}
    </div>
  )
}
