export default function ProfilePage({ user }) {
  return (
    <div className="profile-workspace">
      <section className="profile-card" aria-labelledby="profile-title">
        <a className="profile-back" href="#incidents">
          ← Reports
        </a>
        <div className="profile-avatar" aria-hidden="true">
          {user.username.slice(0, 2).toUpperCase()}
        </div>
        <p className="profile-label">ACCOUNT PROFILE</p>
        <h1 id="profile-title">Your account</h1>
        <p className="profile-role">{user.role}</p>
        <div className="profile-details">
          <div>
            <span>USERNAME</span>
            <strong>{user.username}</strong>
          </div>
          <div>
            <span>ROLE</span>
            <strong>{user.role}</strong>
          </div>
          <div>
            <span>ACCESS</span>
            <strong>
              {user.role === 'REPORTER'
                ? 'Your own reports'
                : 'Civic operations'}
            </strong>
          </div>
        </div>
        <p className="field-help">
          Operator access is managed by the administrator. Sign out when using a
          shared computer.
        </p>
      </section>
    </div>
  )
}
