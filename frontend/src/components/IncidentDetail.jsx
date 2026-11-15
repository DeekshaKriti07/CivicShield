import { lazy, Suspense, useEffect, useState } from 'react'
import { api } from '../services/api'
import { date, Status } from './RecordParts'
const LiveMap = lazy(() => import('./LiveMap'))

export default function IncidentDetail({ incidentId, user }) {
  const [record, setRecord] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [evidence, setEvidence] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [showMap, setShowMap] = useState(false)
  const operator = ['OPERATOR', 'ADMIN'].includes(user.role)
  async function load() {
    const [incident, result, attachedEvidence] = await Promise.all([
      api.incident(incidentId),
      api.analysis(incidentId),
      api.evidence(incidentId),
    ])
    setRecord(incident)
    setAnalysis(result)
    setEvidence(attachedEvidence)
  }
  useEffect(() => {
    let active = true
    Promise.all([api.incident(incidentId), api.analysis(incidentId), api.evidence(incidentId)])
      .then(([i, a, attachedEvidence]) => {
        if (active) {
          setRecord(i)
          setAnalysis(a)
          setEvidence(attachedEvidence)
        }
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [incidentId])
  async function action(fn) {
    setBusy(true)
    setError('')
    try {
      await fn()
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  if (loading) return <p role="status">Loading report…</p>
  if (!record)
    return (
      <>
        <a href="#incidents" className="back-link">
          ← Reports
        </a>
        <p role="alert" className="error">
          {error || 'Report unavailable.'}
        </p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </>
    )
  return (
    <>
      <a href="#incidents" className="back-link">
        ← Reports
      </a>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Report #{record.id}</p>
          <h1>Incident record</h1>
          <p className="muted">Created {date(record.created_at)}</p>
        </div>
        <Status value={record.status} />
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="detail-layout">
        <div className="detail-stack">
          <section className="panel padded">
            <h2>Reported observation</h2>
            <p className="report-description">{record.description}</p>
            <dl>
              <div>
                <dt>Coordinates</dt>
                <dd>
                  {record.latitude}, {record.longitude}
                </dd>
              </div>
              <div>
                <dt>Classification</dt>
                <dd>{record.incident_type || 'Not analyzed'}</dd>
              </div>
            </dl>
            <button
              className="text-button"
              onClick={() => setShowMap(!showMap)}
            >
              {showMap ? 'Hide map' : 'Show reported location'}
            </button>
            {showMap && (
              <Suspense fallback={<p>Loading map…</p>}>
                <LiveMap incident={record} />
              </Suspense>
            )}
            {evidence.length > 0 && (
              <div className="incident-evidence">
                <h3>Photo evidence</h3>
                {evidence.map((item) => (
                  <figure key={item.id}>
                    <img
                      src={api.evidenceImageUrl(record.id, item.id)}
                      alt={`Evidence attached to report ${record.id}`}
                    />
                    <figcaption>{item.filename}</figcaption>
                  </figure>
                ))}
              </div>
            )}
          </section>
          <section className="panel padded">
            <div className="panel-heading">
              <h2>Assessment</h2>
              {analysis && (
                <span className="muted">
                  {analysis.classification.source === 'ollama'
                    ? 'Model classification'
                    : 'Keyword rules'}
                </span>
              )}
            </div>
            {!analysis ? (
              <p className="muted">
                No saved assessment. Run analysis to classify the report and
                draft a plan for review.
              </p>
            ) : (
              <>
                <p className="field-help">
                  This assessment is a recommendation. It does not verify the
                  report or measure conditions on site.
                </p>
                <dl>
                  <div>
                    <dt>Rule score</dt>
                    <dd>
                      {analysis.risk.score}/100 · {analysis.risk.level}
                    </dd>
                  </div>
                  <div>
                    <dt>Suggested department</dt>
                    <dd>{analysis.routing.department}</dd>
                  </div>
                  <div>
                    <dt>Suggested team</dt>
                    <dd>{analysis.routing.response_team}</dd>
                  </div>
                </dl>
                <h3>Score factors</h3>
                {analysis.risk.reasons.length ? (
                  <ul className="plain-list">
                    {analysis.risk.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No configured risk factors matched.</p>
                )}
                <p className="field-help">
                  Nearby facility matches: {analysis.nearby_facilities.length}.
                  Only configured facility records are considered; this is not a
                  complete directory.
                </p>
              </>
            )}
          </section>
          {analysis && (
            <section className="panel padded">
              <div className="panel-heading">
                <h2>Draft response plan</h2>
                <span className="muted">
                  {analysis.response_plan.source === 'ollama'
                    ? 'Model draft'
                    : 'Rule template'}
                </span>
              </div>
              <p>{analysis.response_plan.summary}</p>
              <ol className="plan-list">
                {analysis.response_plan.actions.map((a, i) => (
                  <li key={i}>{a.action}</li>
                ))}
              </ol>
              {analysis.response_plan.safety_notes.map((n, i) => (
                <p key={i} className="field-help">
                  {n}
                </p>
              ))}
            </section>
          )}
        </div>
        <aside className="panel padded action-panel">
          <p className="eyebrow">Next decision</p>
          <h2>Review and record</h2>
          <p className="muted">
            Assignments are internal records. No responder or outside service is
            notified.
          </p>
          {!analysis &&
            ['RECEIVED', 'CLASSIFIED', 'ANALYZED'].includes(record.status) && (
              <button
                className="primary-button"
                disabled={busy}
                onClick={() => action(() => api.workflow(incidentId))}
              >
                {busy ? 'Analyzing report…' : 'Run analysis'}
              </button>
            )}
          {analysis &&
            record.status === 'ANALYZED' &&
            (operator ? (
              <button
                className="primary-button"
                disabled={busy}
                onClick={() => action(() => api.approve(incidentId))}
              >
                Approve reviewed plan
              </button>
            ) : (
              <p>Awaiting operator review.</p>
            ))}
          {record.status === 'APPROVED' && operator && (
            <button
              className="primary-button"
              disabled={busy}
              onClick={() => action(() => api.assign(incidentId))}
            >
              Record internal assignment
            </button>
          )}
          {record.status === 'ASSIGNED' && operator && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                action(() => api.resolve(incidentId, note))
              }}
            >
              <label>
                Resolution note
                <textarea
                  required
                  minLength={10}
                  maxLength={2000}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={busy}
                />
              </label>
              <p className="field-help">
                Record what was checked and how the report was resolved.
              </p>
              <button className="primary-button" disabled={busy}>
                Record resolution
              </button>
            </form>
          )}
          {record.status === 'RESOLVED' && (
            <p>Resolution recorded. See the history for the operator’s note.</p>
          )}
          {busy && (
            <p role="status" className="field-help">
              Saving…
            </p>
          )}
          <a
            className="secondary-button block-link"
            href={`#incident/${incidentId}/trace`}
          >
            View record history
          </a>
        </aside>
      </div>
    </>
  )
}
