import { getUser, logout } from '../auth/auth'

export default function ProfilePage({ onBack, onLogout }) {
  const user = getUser()

  function handleLogout() {
    logout()
    onLogout()
  }

  return (
    <main className="profile-page">
      <section className="profile-card">
        <button className="profile-back" onClick={onBack}>
          ← Back
        </button>

        <div className="profile-avatar">
          {(user?.username || 'OP').slice(0, 2).toUpperCase()}
        </div>

        <p className="profile-label">OPERATOR PROFILE</p>

        <h1>{user?.username || 'Operator'}</h1>

        <p className="profile-role">
          {user?.role || 'OPERATOR'}
        </p>

        <div className="profile-details">
          <div>
            <span>USERNAME</span>
            <strong>{user?.username || '—'}</strong>
          </div>

          <div>
            <span>ROLE</span>
            <strong>{user?.role || '—'}</strong>
          </div>

          <div>
            <span>SESSION</span>
            <strong>AUTHENTICATED</strong>
          </div>

          <div>
            <span>ACCESS</span>
            <strong>CIVIC OPERATIONS</strong>
          </div>
        </div>

        <button className="profile-logout" onClick={handleLogout}>
          SIGN OUT
        </button>
      </section>
    </main>
  )
}
