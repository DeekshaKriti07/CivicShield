import { useState } from 'react'
import { Sun, Moon } from 'lucide-react'
export default function ThemeToggle() {
  const [dark, setDark] = useState(
    localStorage.getItem('civicshield-theme') !== 'light',
  )
  function toggle() {
    document.documentElement.classList.toggle('dark', !dark)
    document.documentElement.classList.toggle('light', dark)
    localStorage.setItem('civicshield-theme', !dark ? 'dark' : 'light')
    setDark(!dark)
  }
  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      aria-label={dark ? 'Use light theme' : 'Use dark theme'}
    >
      <span className={!dark ? 'theme-active' : ''}>
        <Sun size={12} aria-hidden="true" /> Light
      </span>
      <span className={dark ? 'theme-active' : ''}>
        <Moon size={12} aria-hidden="true" /> Dark
      </span>
    </button>
  )
}
