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
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-brand">
          <div className="auth-mark" aria-hidden="true">
            CS
          </div>
          <div>
            <strong>CivicShield</strong>
            <span>CIVIC INCIDENT RESPONSE</span>
          </div>
        </div>
        <div className="auth-heading">
          <p>{register ? 'REPORTER REGISTRATION' : 'ACCOUNT ACCESS'}</p>
          <h1 id="auth-title">
            {register ? 'Create an account' : 'Welcome back.'}
          </h1>
          <span>
            {register
              ? 'Create an account to submit and track your reports.'
              : 'Sign in to monitor incidents and review civic reports.'}
          </span>
        </div>
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
            {loading ? 'Please wait…' : register ? 'Create account' : 'Sign in'}
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
        <div className="auth-footer">
          Public accounts submit reports. Operator access is managed separately.
        </div>
      </section>
    </main>
  )
}
