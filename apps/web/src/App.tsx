import { NavLink, Route, Routes } from 'react-router-dom'
import { GamePage } from './pages/GamePage'
import { CollectionPage } from './pages/CollectionPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { Logo } from './components/Logo'
import { useAuth } from './hooks/useAuth'
import { api } from './lib/api'
import './App.css'

function App() {
  const { isAuthenticated } = useAuth()

  async function handleSignOut() {
    await api.logout()
    window.location.href = '/'
  }

  return (
    <div className="app">
      <nav className="nav">
        <span className="brand">
          <Logo size={20} />
        </span>
        <NavLink to="/" end>
          Play
        </NavLink>
        <NavLink to="/collection">Collection</NavLink>
        <NavLink to="/leaderboard">Leaderboard</NavLink>
        {isAuthenticated && (
          <button type="button" className="nav-signout" onClick={handleSignOut}>
            Sign out
          </button>
        )}
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<GamePage />} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
