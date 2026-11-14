import { useEffect, useState } from 'react'
import './App.css'
import { api } from './services/api'
import LoginPage from './components/LoginPage'
import CommandCenter from './components/CommandCenter'
import IncidentDetail from './components/IncidentDetail'
import AgentTrace from './components/AgentTrace'
import ProfilePage from './components/ProfilePage'
import ThemeToggle from './components/ThemeToggle'

export default function App() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const [route, setRoute] = useState(
    window.location.hash.slice(1) || 'incidents',
  )
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle(
      'dark',
      localStorage.getItem('civicshield-theme') === 'dark',
    )
    const navigate = () => {
      setRoute(window.location.hash.slice(1) || 'incidents')
      window.scrollTo(0, 0)
    }
    const expire = () => {
      setUser(null)
      setError('Your session expired. Sign in to continue.')
    }
    window.addEventListener('hashchange', navigate)
    window.addEventListener('session-expired', expire)
    return () => {
      window.removeEventListener('hashchange', navigate)
      window.removeEventListener('session-expired', expire)
    }
  }, [])

  async function checkSession() {
    setChecking(true)
    setError('')
    try {
      setUser(await api.me())
    } catch (err) {
      if (err.status !== 401) setError(err.message)
    } finally {
      setChecking(false)
    }
  }
  useEffect(() => {
    checkSession()
  }, [])

  async function signOut() {
    setSigningOut(true)
    try {
      await api.logout()
      setUser(null)
      setError('')
      window.location.hash = 'incidents'
    } catch (err) {
      setError(err.message)
    } finally {
      setSigningOut(false)
    }
  }

  if (checking)
    return (
      <main className="loading-page" role="status">
        Connecting to CivicShield…
      </main>
    )
  if (!user)
    return (
      <LoginPage
        onLogin={(data) => {
          setUser(data)
          setError('')
        }}
        connectionError={error}
        onRetry={checkSession}
      />
    )

  const match = route.match(/^incident\/(\d+)(\/trace)?$/)
  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('main-content')?.focus()
        }}
      >
        Skip to content
      </a>
      <header className="site-header">
        <a className="brand" href="#incidents">
          <span className="brand-mark" aria-hidden="true">
            CS
          </span>
          <span>
            <strong>CivicShield</strong>
            <small>Incident records</small>
          </span>
        </a>
        <nav aria-label="Main navigation">
          <a
            href="#incidents"
            aria-current={route === 'incidents' ? 'page' : undefined}
          >
            Reports
          </a>
          <a href="#profile">{user.username}</a>
          <ThemeToggle />
          <button
            className="text-button"
            disabled={signingOut}
            onClick={signOut}
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </nav>
      </header>
      <main id="main-content" tabIndex={-1} className="page">
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {match ? (
          match[2] ? (
            <AgentTrace key={route} incidentId={Number(match[1])} />
          ) : (
            <IncidentDetail
              key={route}
              incidentId={Number(match[1])}
              user={user}
            />
          )
        ) : route === 'profile' ? (
          <ProfilePage user={user} />
        ) : (
          <CommandCenter user={user} />
        )}
      </main>
      <footer className="site-footer">
        CivicShield records reports and internal decisions. It does not contact
        emergency services.
      </footer>
    </>
  )
}
