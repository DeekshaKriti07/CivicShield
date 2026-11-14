import { lazy, Suspense, useEffect, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  MapPin,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { api } from '../services/api'
import IncidentForm from './IncidentForm'
import { Status, title, date } from './RecordParts'
const LiveMap = lazy(() => import('./LiveMap'))

export default function CommandCenter({ user }) {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [offset, setOffset] = useState(0)
  const [more, setMore] = useState(false)
  const [selected, setSelected] = useState(null)
  const [context, setContext] = useState(null)
  const [contextError, setContextError] = useState('')
  const [showMap, setShowMap] = useState(false)
  async function load(page = 0) {
    setLoading(true)
    setError('')
    try {
      const rows = await api.incidents(page)
      setIncidents(rows)
      setOffset(page)
      setMore(rows.length === 100)
      setSelected((previous) =>
        rows.some((i) => i.id === previous) ? previous : (rows[0]?.id ?? null),
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])
  useEffect(() => {
    let active = true
    setContext(null)
    setContextError('')
    setShowMap(false)
    if (selected !== null) {
      Promise.all([api.analysis(selected), api.timeline(selected)])
        .then(([analysis, timeline]) => {
          if (active) setContext({ analysis, events: timeline.events })
        })
        .catch((err) => {
          if (active) setContextError(err.message)
        })
    }
    return () => {
      active = false
    }
  }, [selected])
  const operator = ['OPERATOR', 'ADMIN'].includes(user.role)
  const item = incidents.find((i) => i.id === selected)
  const analysis = context?.analysis
  const counts = [
    ['REPORTS SHOWN', incidents.length, AlertTriangle],
    [
      'AWAITING REVIEW',
      incidents.filter((i) => i.status === 'ANALYZED').length,
      Clock3,
    ],
    [
      'ASSIGNED',
      incidents.filter((i) => i.status === 'ASSIGNED').length,
      Users,
    ],
    [
      'RESOLVED',
      incidents.filter((i) => i.status === 'RESOLVED').length,
      CheckCircle2,
    ],
  ]
  return (
    <>
      <section className="console-intro">
        <div>
          <span className="section-label">
            {operator ? 'OPERATOR WORKSPACE' : 'YOUR REPORTS'}
          </span>
          <h1>Command Center</h1>
          <p>
            {operator
              ? 'Review reports, inspect assessments, and record the next decision.'
              : 'Submit a report and follow its recorded status.'}
          </p>
        </div>
        <button
          className="secondary-button"
          disabled={loading}
          onClick={() => load(offset)}
        >
          Refresh records
        </button>
      </section>
      <section
        className="metric-grid"
        aria-label="Counts for reports on the current page"
      >
        {counts.map(([label, count, Icon], index) => (
          <div className="metric" key={label}>
            <div className={`metric-icon m${index}`}>
              <Icon size={18} aria-hidden="true" />
            </div>
            <div>
              <span>{label}</span>
              <strong>{loading || error ? '—' : count}</strong>
            </div>
            <small>Current page</small>
          </div>
        ))}
      </section>
      <IncidentForm
        onIncidentCreated={(i) => {
          window.location.hash = `incident/${i.id}`
        }}
      />
      {error && (
        <p className="error" role="alert">
          {error}{' '}
          <button className="text-button" onClick={() => load(offset)}>
            Try again
          </button>
        </p>
      )}
      <section className="workspace">
        <aside className="panel queue" aria-label="Saved incidents">
          <div className="panel-title">
            <div>
              <span className="section-label">INCIDENT QUEUE</span>
              <h2>Saved reports</h2>
            </div>
            <b>{loading ? '…' : incidents.length}</b>
          </div>
          {loading ? (
            <p className="empty" role="status">
              Loading records…
            </p>
          ) : incidents.length === 0 ? (
            <div className="empty">
              <h3>No reports yet</h3>
              <p>Saved reports will appear here after you submit one.</p>
            </div>
          ) : (
            <div className="queue-list">
              {incidents.map((i) => (
                <button
                  key={i.id}
                  className={`queue-item ${selected === i.id ? 'selected' : ''}`}
                  onClick={() => setSelected(i.id)}
                  aria-pressed={selected === i.id}
                >
                  <div className="queue-top">
                    <span>Report #{i.id}</span>
                    <Status value={i.status} />
                  </div>
                  <strong>{title(i)}</strong>
                  <span>
                    <MapPin size={12} aria-hidden="true" /> {i.latitude},{' '}
                    {i.longitude}
                  </span>
                  <footer>
                    <small>{i.incident_type || 'Not classified'}</small>
                    <small>{date(i.created_at)}</small>
                  </footer>
                </button>
              ))}
            </div>
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
          <div className="queue-sync">
            <Clock3 size={13} aria-hidden="true" /> Saved database records ·
            current page
          </div>
        </aside>
        <section className="panel analysis" aria-label="Selected report">
          <div className="panel-title">
            <div>
              <span className="section-label">ASSESSMENT</span>
              <h2>{item ? title(item) : 'Incident context'}</h2>
            </div>
            {item && <b className="mono">#{item.id}</b>}
          </div>
          {!item ? (
            <div className="empty">
              <h3>Select a report</h3>
              <p>
                Its saved description, assessment, and review actions will
                appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="analysis-hero">
                <div className="risk-number">
                  <span>RULE SCORE</span>
                  <strong>{analysis ? analysis.risk.score : '—'}</strong>
                  {analysis && <small>/100</small>}
                </div>
                <div>
                  <Status value={item.status} />
                  <h3>{item.incident_type || 'Pending classification'}</h3>
                  <p>{item.description}</p>
                  <div className="analysis-meta">
                    <span>
                      <MapPin size={13} aria-hidden="true" /> {item.latitude},{' '}
                      {item.longitude}
                    </span>
                    {analysis && (
                      <span>
                        <BrainCircuit size={13} aria-hidden="true" />{' '}
                        {analysis.classification.source === 'ollama'
                          ? 'Model classification'
                          : 'Keyword rules'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {contextError && (
                <p className="error" role="alert">
                  {contextError}
                </p>
              )}
              {context === null && !contextError && (
                <p className="context-loading" role="status">
                  Loading saved assessment…
                </p>
              )}
              {analysis && (
                <>
                  <div className="subsection">
                    <div className="subhead">
                      <span>WHY THIS SCORE?</span>
                      <small>Recorded rule factors</small>
                    </div>
                    <ul className="plain-list">
                      {analysis.risk.reasons.length ? (
                        analysis.risk.reasons.map((reason, i) => (
                          <li key={i}>{reason}</li>
                        ))
                      ) : (
                        <li>No configured risk factors matched.</li>
                      )}
                    </ul>
                  </div>
                  <div className="subsection">
                    <div className="subhead">
                      <span>SUGGESTED ROUTING</span>
                      <small>For operator review</small>
                    </div>
                    <div className="route-card">
                      <div className="icon-box">
                        <ShieldCheck size={17} aria-hidden="true" />
                      </div>
                      <div>
                        <strong>{analysis.routing.department}</strong>
                        <span>{analysis.routing.response_team}</span>
                      </div>
                    </div>
                  </div>
                  <div className="subsection">
                    <div className="subhead">
                      <span>DRAFT RESPONSE PLAN</span>
                      <small>
                        {analysis.response_plan.source === 'ollama'
                          ? 'Model draft'
                          : 'Rule template'}
                      </small>
                    </div>
                    <div className="recommendation">
                      <BrainCircuit size={17} aria-hidden="true" />
                      <div>
                        <strong>{analysis.response_plan.summary}</strong>
                        <p>
                          Review the saved actions and source before recording a
                          decision.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
              <div className="human-bar">
                <div>
                  <span className="section-label">HUMAN CONTROL</span>
                  <strong>
                    {analysis
                      ? 'Saved assessment available for review'
                      : 'Report received · assessment pending'}
                  </strong>
                  <p>
                    Internal assignment does not contact a responder or outside
                    service.
                  </p>
                </div>
                <a className="primary-button" href={`#incident/${item.id}`}>
                  Review incident <ArrowRight size={15} aria-hidden="true" />
                </a>
              </div>
            </>
          )}
        </section>
        <aside className="side-stack">
          <section className="panel map-panel">
            <div className="panel-title">
              <div>
                <span className="section-label">REPORTED LOCATION</span>
                <h2>Incident context</h2>
              </div>
              <MapPin size={17} aria-hidden="true" />
            </div>
            <div className="map-content">
              {item ? (
                <>
                  {showMap ? (
                    <Suspense fallback={<p role="status">Loading map…</p>}>
                      <LiveMap incident={item} />
                    </Suspense>
                  ) : (
                    <>
                      <p className="mono">
                        {item.latitude}, {item.longitude}
                      </p>
                      <p className="field-help">
                        Coordinates provided in the report.
                      </p>
                    </>
                  )}
                  <button
                    className="text-button"
                    onClick={() => setShowMap(!showMap)}
                  >
                    {showMap ? 'Hide map' : 'Show reported location'}
                  </button>
                </>
              ) : (
                <p className="field-help">
                  Select a report to see its location.
                </p>
              )}
            </div>
          </section>
          <section className="panel activity-panel">
            <div className="panel-title">
              <div>
                <span className="section-label">SAVED HISTORY</span>
                <h2>Decision trace</h2>
              </div>
              <BrainCircuit size={17} aria-hidden="true" />
            </div>
            <div className="activity-list">
              {context?.events?.length ? (
                context.events.slice(-4).map((event) => (
                  <div className="activity-item" key={event.id}>
                    <CheckCircle2
                      className="done"
                      size={16}
                      aria-hidden="true"
                    />
                    <div>
                      <strong>{event.event_type.replaceAll('_', ' ')}</strong>
                      <span>{event.summary}</span>
                      <small>{date(event.timestamp)}</small>
                    </div>
                  </div>
                ))
              ) : (
                <p className="field-help">
                  {item
                    ? 'No history loaded.'
                    : 'Select a report to see its recorded events.'}
                </p>
              )}
            </div>
            {item && (
              <a className="trace-button" href={`#incident/${item.id}/trace`}>
                <BrainCircuit size={15} aria-hidden="true" /> Open full record
                history
              </a>
            )}
          </section>
        </aside>
      </section>
    </>
  )
}
