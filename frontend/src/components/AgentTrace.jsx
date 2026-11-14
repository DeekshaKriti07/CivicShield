import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { date } from './RecordParts'
export default function AgentTrace({ incidentId }) {
  const [events, setEvents] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    api
      .timeline(incidentId)
      .then((data) => {
        if (active) setEvents(data.events)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
    return () => {
      active = false
    }
  }, [incidentId])
  return (
    <>
      <a className="back-link" href={`#incident/${incidentId}`}>
        ← Report #{incidentId}
      </a>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Saved events</p>
          <h1>Record history</h1>
          <p className="muted">
            Actions recorded for report #{incidentId}, in order.
          </p>
        </div>
      </div>
      <section className="panel padded">
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : events === null ? (
          <p role="status">Loading history…</p>
        ) : events.length === 0 ? (
          <p>No events recorded.</p>
        ) : (
          <ol className="history-list">
            {events.map((event) => (
              <li key={event.id}>
                <time>{date(event.timestamp)}</time>
                <div>
                  <h2>{event.event_type.replaceAll('_', ' ')}</h2>
                  <p>{event.summary}</p>
                  <small className="muted">Recorded by {event.agent}</small>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  )
}
