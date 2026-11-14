import { useState } from 'react'
export default function ThemeToggle() {
  const [dark, setDark] = useState(
    localStorage.getItem('civicshield-theme') === 'dark',
  )
  function toggle() {
    document.documentElement.classList.toggle('dark', !dark)
    localStorage.setItem('civicshield-theme', !dark ? 'dark' : 'light')
    setDark(!dark)
  }
  return (
    <button
      className="text-button"
      onClick={toggle}
      aria-label={dark ? 'Use light theme' : 'Use dark theme'}
    >
      {dark ? 'Light' : 'Dark'}
    </button>
  )
}
