import { useState } from 'react'
import { Sun, Moon } from 'lucide-react'
export default function ThemeToggle() {
  const [dark, setDark] = useState(
    localStorage.getItem('civicshield-theme') !== 'light',
  )
  function setTheme(nextDark) {
    document.documentElement.classList.toggle('dark', nextDark)
    document.documentElement.classList.toggle('light', !nextDark)
    localStorage.setItem('civicshield-theme', nextDark ? 'dark' : 'light')
    setDark(nextDark)
  }
  return (
    <div className="theme-toggle" role="group" aria-label="Color theme">
      <button
        className={`theme-option ${!dark ? 'theme-active' : ''}`}
        onClick={() => setTheme(false)}
        aria-label="Use light theme"
        aria-pressed={!dark}
      >
        <Sun size={12} aria-hidden="true" /> Light
      </button>
      <button
        className={`theme-option ${dark ? 'theme-active' : ''}`}
        onClick={() => setTheme(true)}
        aria-label="Use dark theme"
        aria-pressed={dark}
      >
        <Moon size={12} aria-hidden="true" /> Dark
      </button>
    </div>
  )
}
