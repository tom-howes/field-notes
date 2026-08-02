import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '../lib/api'

type Mode = 'signup' | 'login'

export function GuestAuthForm() {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [mode, setMode] = useState<Mode>('signup')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      if (mode === 'signup') {
        await api.signup(username, password)
      } else {
        await api.login(username, password)
      }
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!expanded) {
    return (
      <button type="button" className="guest-auth-toggle" onClick={() => setExpanded(true)}>
        Or play as a guest, no Spotify needed
      </button>
    )
  }

  return (
    <form className="guest-auth-form" onSubmit={handleSubmit}>
      <div className="guest-auth-tabs">
        <button
          type="button"
          className={mode === 'signup' ? 'guest-auth-tab active' : 'guest-auth-tab'}
          onClick={() => setMode('signup')}
        >
          Sign up
        </button>
        <button
          type="button"
          className={mode === 'login' ? 'guest-auth-tab active' : 'guest-auth-tab'}
          onClick={() => setMode('login')}
        >
          Log in
        </button>
      </div>
      <input
        className="guest-auth-input"
        type="text"
        placeholder="Username"
        autoComplete="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        className="guest-auth-input"
        type="password"
        placeholder="Password"
        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={mode === 'signup' ? 8 : undefined}
      />
      {error && <p className="error-banner">{error}</p>}
      <button type="submit" className="button-primary" disabled={isSubmitting}>
        {isSubmitting ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Log in'}
      </button>
    </form>
  )
}
