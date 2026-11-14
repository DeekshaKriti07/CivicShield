import { useEffect, useState } from 'react'
import { BrainCircuit, CheckCircle2 } from 'lucide-react'
import { api } from '../services/api'
import { date, Status } from './RecordParts'
export default function AgentTrace({ incidentId }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    Promise.all([api.timeline(incidentId), api.incident(incidentId)])
      .then(([timeline, incident]) => {
        if (active) setData({ events: timeline.events, incident })
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
      <div className="detail-head page-heading">
        <div>
          <span className="section-label">CIVICSHIELD / RECORD HISTORY</span>
          <h1>Record history</h1>
          <p>Actions recorded for report #{incidentId}, in order.</p>
        </div>
        {data && <Status value={data.incident.status} />}
      </div>
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : data === null ? (
        <p role="status">Loading history…</p>
      ) : (
        <div className="trace-layout">
          <section className="panel timeline-panel">
            <div className="panel-title">
              <div>
                <span className="section-label">RECORDED WORKFLOW</span>
                <h2>Incident decision timeline</h2>
              </div>
              <BrainCircuit size={18} aria-hidden="true" />
            </div>
            {data.events.length === 0 ? (
              <p className="empty">No events recorded.</p>
            ) : (
              <ol className="timeline saved-timeline">
                {data.events.map((event) => (
                  <li className="timeline-item" key={event.id}>
                    <time className="time">{date(event.timestamp)}</time>
                    <div className="timeline-icon done">
                      <CheckCircle2 size={15} aria-hidden="true" />
                    </div>
                    <div className="timeline-copy">
                      <span>{event.agent}</span>
                      <h2>{event.event_type.replaceAll('_', ' ')}</h2>
                      <p>{event.summary}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
          <aside className="trace-side">
            <section className="panel trace-result">
              <span className="section-label">CURRENT RECORD</span>
              <div className="result-icon">
                <BrainCircuit size={25} aria-hidden="true" />
              </div>
              <h2>Report #{incidentId}</h2>
              <Status value={data.incident.status} />
              <div>
                <span>SAVED EVENTS</span>
                <strong>{data.events.length}</strong>
              </div>
              <p>
                Events reflect recorded actions. An internal assignment does not
                contact outside services.
              </p>
            </section>
          </aside>
        </div>
      )}
    </>
  )
}
