import { useEffect, useState } from 'react'
import './App.css'

import LandingPage from './components/LandingPage'
import CommandCenter from './components/CommandCenter'
import IncidentDetail from './components/IncidentDetail'
import AgentTrace from './components/AgentTrace'
import ProfilePage from './components/ProfilePage'
import LoginPage from './components/LoginPage'

import {
  getUser,
  isAuthenticated,
  logout,
} from './auth/auth'

export default function App() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated())
  const [view, setView] = useState('landing')
  const [selectedIncident, setSelectedIncident] = useState('INC-001')
  const [user, setUser] = useState(getUser())

  useEffect(() => {
    const saved = localStorage.getItem('civicshield-theme') || 'dark'

    document.documentElement.classList.toggle(
      'dark',
      saved === 'dark'
    )

    document.documentElement.classList.toggle(
      'light',
      saved === 'light'
    )
  }, [])

  function handleLogin() {
    setUser(getUser())
    setAuthenticated(true)
    setView('landing')
  }

  function handleLogout() {
    logout()
    setAuthenticated(false)
    setUser(null)
    setView('landing')
  }

  const openIncident = (id = 'INC-001') => {
    setSelectedIncident(id)
    setView('incident')
  }

  const openCommand = () => setView('command')

  const openTrace = () => setView('trace')
  const openProfile = () => setView('profile')

  if (!authenticated) {
    return <LoginPage onLogin={handleLogin} />
  }

  if (view === 'command') {
    return (
      <CommandCenter
        onBack={() => setView('landing')}
        onOpenIncident={() => openIncident()}
        onOpenTrace={openTrace}
        onOpenProfile={openProfile}
        user={user}
        onLogout={handleLogout}
      />
    )
  }

  if (view === 'incident') {
    return (
      <IncidentDetail
        incidentId={selectedIncident}
        onBack={openCommand}
        onOpenTrace={openTrace}
      />
    )
  }

  if (view === 'trace') {
    return (
      <AgentTrace
        incidentId={selectedIncident}
        onBack={openCommand}
      />
    )
  }

  if (view === 'profile') {
    return (
      <ProfilePage
        onBack={openCommand}
        onLogout={handleLogout}
      />
    )
  }

  return <LandingPage onLaunch={openCommand} />
}
