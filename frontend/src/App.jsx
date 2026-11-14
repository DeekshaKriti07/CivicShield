import { useEffect, useState } from 'react'
import './App.css'
import './restore.css'
import { api } from './services/api'
import LoginPage from './components/LoginPage'
import CommandCenter from './components/CommandCenter'
import IncidentDetail from './components/IncidentDetail'
import AgentTrace from './components/AgentTrace'
import ProfilePage from './components/ProfilePage'
import ThemeToggle from './components/ThemeToggle'
import LandingPage from './components/LandingPage'
import { ShieldCheck } from 'lucide-react'

export default function App() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const [route, setRoute] = useState(window.location.hash.slice(1) || 'home')
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle(
      'dark',
      localStorage.getItem('civicshield-theme') !== 'light',
    )
    document.documentElement.classList.toggle(
      'light',
      localStorage.getItem('civicshield-theme') === 'light',
    )
    const navigate = () => {
      setRoute(window.location.hash.slice(1) || 'home')
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
      window.location.hash = 'home'
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

  if (route === 'home')
    return (
      <LandingPage
        error={error}
        user={user}
        onLogout={signOut}
        signingOut={signingOut}
      />
    )

  const match = route.match(/^incident\/(\d+)(\/trace)?$/)
  return (
    <div className="app-shell">
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
      <header className="console-topbar site-header">
        <a className="brand" href="#home">
          <div className="brand-mark">
            <ShieldCheck size={18} aria-hidden="true" />
          </div>
          <div>
            <strong>CivicShield</strong>
            <span>CIVIC OPERATIONS</span>
          </div>
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
      <main
        id="main-content"
        tabIndex={-1}
        className="console-main restore-page"
      >
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
    </div>
  )
}
