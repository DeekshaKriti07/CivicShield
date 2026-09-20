import { useState } from 'react'
import { api } from '../services/api'
import { saveAuth } from '../auth/auth'

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await api.login(username, password)
      saveAuth(data)
      onLogin()
    } catch (err) {
      setError(err.message || 'Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-mark">CS</div>
          <div>
            <strong>CivicShield</strong>
            <span>CIVIC INCIDENT RESPONSE</span>
          </div>
        </div>

        <div className="auth-heading">
          <p>SECURE OPERATOR ACCESS</p>
          <h1>Welcome back.</h1>
          <span>
            Sign in to monitor incidents, coordinate response,
            and manage civic operations.
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter username"
              autoComplete="username"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'AUTHENTICATING...' : 'SIGN IN'}
          </button>
        </form>

        <div className="auth-footer">
          Authorized CivicShield operators only
        </div>
      </div>
    </main>
  )
}
