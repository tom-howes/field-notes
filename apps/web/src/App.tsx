import { NavLink, Route, Routes } from 'react-router-dom'
import { GamePage } from './pages/GamePage'
import { CollectionPage } from './pages/CollectionPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { Logo } from './components/Logo'
import './App.css'

function App() {
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
