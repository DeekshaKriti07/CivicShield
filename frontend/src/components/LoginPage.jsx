import { useState } from 'react'
import { api } from '../services/api'

export default function LoginPage({ onLogin, connectionError, onRetry }) {
  const [register, setRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)
    try {
      if (register) {
        await api.register(username.trim(), password)
        setRegister(false)
        setPassword('')
        setNotice('Account created. Sign in with your new password.')
      } else {
        onLogin(await api.login(username.trim(), password))
        setPassword('')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  return (
    <main className="auth-layout">
      <section className="auth-intro">
        <a className="brand" href="#">
          <span className="brand-mark">CS</span>
          <strong>CivicShield</strong>
        </a>
        <div>
          <p className="eyebrow">Civic incident records</p>
          <h1>A report is the starting point.</h1>
          <p>
            Record the location, review the assessment, and keep a record of
            what happens next.
          </p>
        </div>
        <p className="muted">
          Public accounts can submit and track their own reports. Operators
          review plans and record assignments. External dispatch is not
          connected.
        </p>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <p className="eyebrow">
            {register ? 'Reporter account' : 'Account access'}
          </p>
          <h2>{register ? 'Create an account' : 'Sign in'}</h2>
          <p className="muted">
            {register
              ? 'Use 3–50 letters, numbers, dots, underscores or hyphens for your username.'
              : 'Enter your CivicShield username and password.'}
          </p>
          {connectionError && (
            <div role="alert" className="error">
              {connectionError}{' '}
              <button className="text-button" onClick={onRetry}>
                Retry connection
              </button>
            </div>
          )}
          {notice && (
            <p className="notice" role="status">
              {notice}
            </p>
          )}
          <form onSubmit={submit}>
            <label>
              Username
              <input
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={50}
                pattern={register ? '[A-Za-z0-9_.-]+' : undefined}
                disabled={loading}
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete={register ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={register ? 12 : 1}
                maxLength={128}
                disabled={loading}
              />
            </label>
            {register && (
              <p className="field-help">
                Use at least 12 characters. Keep this password somewhere safe;
                password recovery is not available.
              </p>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="primary-button" disabled={loading}>
              {loading
                ? 'Please wait…'
                : register
                  ? 'Create account'
                  : 'Sign in'}
            </button>
          </form>
          <button
            className="text-button auth-switch"
            disabled={loading}
            onClick={() => {
              setRegister(!register)
              setError('')
              setNotice('')
              setPassword('')
            }}
          >
            {register
              ? 'Already have an account? Sign in'
              : 'Create a reporter account'}
          </button>
        </div>
      </section>
    </main>
  )
}
