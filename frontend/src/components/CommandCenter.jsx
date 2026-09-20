import { useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  MapPin,
  ShieldCheck,
  Users,
  Zap,
  UserCircle
} from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import IncidentForm from './IncidentForm'
import LiveMap from './LiveMap'
import { demoIncidents } from '../services/demoIncidents'

const initial = { ...demoIncidents }

export default function CommandCenter({
  onBack,
  onOpenIncident,
  onOpenTrace,
  onOpenProfile
}) {
  const [selected, setSelected] = useState('INC-001')
  const [incidents, setIncidents] = useState(initial)

  const item = incidents[selected] || incidents['INC-001']

  const add = i => {
    setIncidents(v => ({ ...v, [i.id]: i }))
    setSelected(i.id)
  }

  return (
    <div className="app-shell">
      <header className="console-topbar">
        <div className="brand">
          <button className="icon-button" onClick={onBack}>
            <ArrowLeft size={16} />
          </button>

          <div className="brand-mark">
            <ShieldCheck size={18} />
          </div>

          <div>
            <strong>CivicShield</strong>
            <span>AI CIVIC OPERATIONS</span>
          </div>
        </div>

        <div className="top-actions">
          <ThemeToggle />

          <span className="online">
            <i /> AI SYSTEM ONLINE
          </span>

          <button
            className="icon-button"
            onClick={onOpenProfile}
            title="Operator Profile"
          >
            <UserCircle size={18} />
          </button>
        </div>
      </header>

      <div className="console-main">
        <section className="console-intro">
          <div>
            <span className="section-label">AUTONOMOUS CIVIC RESPONSE</span>
            <h1>Command Center</h1>
            <p>
              Monitor incidents, understand AI decisions and keep humans in
              control of every response.
            </p>
          </div>

          <div className="live-badge">
            <Activity size={15} /> LIVE OPERATIONS
          </div>
        </section>

        <section className="metric-grid">
          {[
            ['ACTIVE INCIDENTS', '12', AlertTriangle, '+3 today'],
            ['HIGH RISK', '04', Zap, '2 critical'],
            ['UNDER RESPONSE', '06', Users, 'Teams active'],
            ['RESOLVED', '28', CheckCircle2, 'Today']
          ].map(([a, b, I, c], n) => (
            <div className="metric" key={a}>
              <div className={`metric-icon m${n}`}>
                <I size={18} />
              </div>

              <div>
                <span>{a}</span>
                <strong>{b}</strong>
              </div>

              <small>{c}</small>
            </div>
          ))}
        </section>

        <IncidentForm onIncidentCreated={add} />

        <section className="workspace">
          <aside className="panel queue">
            <div className="panel-title">
              <div>
                <span className="section-label">INCIDENT QUEUE</span>
                <h2>Active reports</h2>
              </div>

              <b>{String(Object.keys(incidents).length).padStart(2, '0')}</b>
            </div>

            <div className="queue-list">
              {Object.values(incidents).map(i => (
                <button
                  key={i.id}
                  className={`queue-item ${
                    selected === i.id ? 'selected' : ''
                  }`}
                  onClick={() => setSelected(i.id)}
                >
                  <div className="queue-top">
                    <span>{i.id}</span>
                    <em className={i.level.toLowerCase()}>{i.level}</em>
                  </div>

                  <strong>{i.title}</strong>

                  <span>
                    <MapPin size={12} />
                    {i.location}
                  </span>

                  <footer>
                    <small>
                      {i.reports} report{i.reports !== 1 ? 's' : ''}
                    </small>
                    <small>{i.department}</small>
                  </footer>
                </button>
              ))}
            </div>

            <div className="queue-sync">
              <Clock3 size={13} /> Local demo data · ready for backend integration
            </div>
          </aside>

          <main className="panel analysis">
            <div className="panel-title">
              <div>
                <span className="section-label">AI ANALYSIS</span>
                <h2>{item.title}</h2>
              </div>

              <b className="mono">{item.id}</b>
            </div>

            <div className="analysis-hero">
              <div className="risk-number">
                <span>RISK SCORE</span>
                <strong>{item.score}</strong>
                <small>/100</small>
              </div>

              <div>
                <em className={`level ${item.level.toLowerCase()}`}>
                  {item.level}
                </em>

                <h3>{item.location}</h3>
                <p>{item.description}</p>

                <div className="analysis-meta">
                  <span>
                    <BrainCircuit size={13} /> {item.confidence || 0}% AI
                    confidence
                  </span>

                  <span>
                    <MapPin size={13} /> {item.facility}
                  </span>

                  <span>
                    <Users size={13} /> {item.reports} reports fused
                  </span>
                </div>
              </div>
            </div>

            {item.score > 0 && (
              <>
                <div className="subsection">
                  <div className="subhead">
                    <span>WHY THIS SCORE?</span>
                    <small>Deterministic risk engine</small>
                  </div>

                  <div className="factors">
                    <div><span>Hospital nearby</span><b>+30</b></div>
                    <div><span>Road blocked</span><b>+15</b></div>
                    <div><span>Multiple reports</span><b>+10</b></div>
                    <div><span>Strong evidence</span><b>+05</b></div>
                  </div>
                </div>

                <div className="subsection">
                  <div className="subhead">
                    <span>RECOMMENDED ROUTING</span>
                    <small>Routing agent</small>
                  </div>

                  <div className="route-card">
                    <div className="icon-box">
                      <ShieldCheck size={17} />
                    </div>

                    <div>
                      <strong>{item.department} Department</strong>
                      <span>
                        Selected from the civic operations knowledge base.
                      </span>
                    </div>

                    <b>{item.team}</b>
                  </div>
                </div>

                <div className="subsection">
                  <div className="subhead">
                    <span>RESPONSE RECOMMENDATION</span>
                    <small>Response agent</small>
                  </div>

                  <div className="recommendation">
                    <Zap size={17} />

                    <div>
                      <strong>Emergency response plan generated</strong>
                      <p>
                        Inspect the affected infrastructure, secure the area,
                        deploy the appropriate team and monitor the incident
                        until resolution is confirmed.
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
                  {item.score
                    ? 'AI recommendation ready for review'
                    : 'Awaiting AI analysis'}
                </strong>

                <p>
                  CivicShield recommends the action but does not dispatch a
                  team without human authorization.
                </p>
              </div>

              <button
                className="primary-button"
                onClick={() => onOpenIncident(item.id)}
              >
                Review incident
                <ArrowLeft
                  size={15}
                  style={{ transform: 'rotate(180deg)' }}
                />
              </button>
            </div>
          </main>

          <aside className="side-stack">
            <div className="panel map-panel">
              <div className="panel-title">
                <div>
                  <span className="section-label">LIVE MAP</span>
                  <h2>Incident context</h2>
                </div>

                <MapPin size={17} />
              </div>

              <LiveMap />
            </div>

            <div className="panel activity-panel">
              <div className="panel-title">
                <div>
                  <span className="section-label">AGENT ACTIVITY</span>
                  <h2>Decision trace</h2>
                </div>

                <BrainCircuit size={17} />
              </div>

              <div className="activity-list">
                {[
                  ['Triage Agent', 'Incident classified', CheckCircle2, 'done'],
                  ['Verification Agent', 'Evidence checked', CheckCircle2, 'done'],
                  ['Risk Engine', 'Risk score calculated', AlertTriangle, 'warn'],
                  ['Routing Agent', 'Drainage · Team B', CheckCircle2, 'done'],
                  ['Human Approval', 'Awaiting authorization', Clock3, 'wait']
                ].map(([a, b, I, s]) => (
                  <div className="activity-item" key={a}>
                    <I className={s} />

                    <div>
                      <strong>{a}</strong>
                      <span>{b}</span>
                    </div>

                    <small>NOW</small>
                  </div>
                ))}
              </div>

              <button
                className="trace-button"
                onClick={() => onOpenTrace()}
              >
                <BrainCircuit size={15} />
                Open full agent trace
              </button>
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}
