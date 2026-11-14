export default function ProfilePage({ user }) {
  return (
    <>
      <a className="back-link" href="#incidents">
        ← Reports
      </a>
      <div className="page-heading">
        <h1>Your account</h1>
      </div>
      <section className="panel padded account-panel">
        <dl>
          <div>
            <dt>Username</dt>
            <dd>{user.username}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{user.role}</dd>
          </div>
          <div>
            <dt>Access</dt>
            <dd>
              {user.role === 'REPORTER'
                ? 'Submit and view your own reports'
                : 'Review reports and record decisions'}
            </dd>
          </div>
        </dl>
        <p className="muted">
          Operator access is managed by the administrator. Sign out when using a
          shared computer.
        </p>
      </section>
    </>
  )
}
