import { useEffect, useState } from 'react'
import { api } from '../services/api'
import IncidentForm from './IncidentForm'
import { Status, title, date } from './RecordParts'

export default function CommandCenter({ user }) {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [offset, setOffset] = useState(0)
  const [more, setMore] = useState(false)
  async function load(page = 0) {
    setLoading(true)
    setError('')
    try {
      const rows = await api.incidents(page)
      setIncidents(rows)
      setOffset(page)
      setMore(rows.length === 100)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])
  const operator = ['OPERATOR', 'ADMIN'].includes(user.role)
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            {operator ? 'Operator workspace' : 'Your reports'}
          </p>
          <h1>Incident register</h1>
          <p className="muted">
            {operator
              ? 'Review submitted reports and record the next decision.'
              : 'Submit a report with its location. You can return here to check its status.'}
          </p>
        </div>
        <button
          className="secondary-button"
          onClick={() => load(offset)}
          disabled={loading}
        >
          Refresh records
        </button>
      </div>
      <div className="register-layout">
        <section className="panel register-list" aria-label="Saved incidents">
          <div className="panel-heading">
            <h2>Saved reports</h2>
            <span className="muted">
              {loading ? 'Loading…' : `${incidents.length} shown`}
            </span>
          </div>
          {error ? (
            <div className="error" role="alert">
              {error} <button onClick={() => load(offset)}>Try again</button>
            </div>
          ) : loading ? (
            <p className="empty" role="status">
              Loading records…
            </p>
          ) : incidents.length === 0 ? (
            <div className="empty">
              <h3>No reports yet</h3>
              <p>Saved reports will appear here after you submit one.</p>
            </div>
          ) : (
            <ul className="record-list">
              {incidents.map((i) => (
                <li key={i.id}>
                  <a href={`#incident/${i.id}`}>
                    <div className="record-top">
                      <span className="record-id">Report #{i.id}</span>
                      <Status value={i.status} />
                    </div>
                    <h3>{title(i)}</h3>
                    <p>{i.description}</p>
                    <div className="record-meta">
                      <span>{i.incident_type || 'Not classified'}</span>
                      <span>{date(i.created_at)}</span>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}
          <div className="pagination">
            <button
              className="text-button"
              disabled={loading || offset === 0}
              onClick={() => load(Math.max(0, offset - 100))}
            >
              Previous
            </button>
            <button
              className="text-button"
              disabled={loading || !more}
              onClick={() => load(offset + 100)}
            >
              Next
            </button>
          </div>
        </section>
        <aside>
          <IncidentForm
            onIncidentCreated={(i) => {
              window.location.hash = `incident/${i.id}`
            }}
          />
        </aside>
      </div>
    </>
  )
}
