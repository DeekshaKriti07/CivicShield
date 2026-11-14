import {
  ArrowRight,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  GitBranch,
  MapPin,
  ShieldCheck,
  Users,
  Clock3,
} from 'lucide-react'
import ThemeToggle from './ThemeToggle'

export default function LandingPage({
  user,
  onLaunch,
  onLogout,
  signingOut,
  error,
}) {
  const workflow = [
    [
      '01',
      'REPORT',
      'Record the observation',
      'Save a description and the reported coordinates.',
      MapPin,
    ],
    [
      '02',
      'CLASSIFY',
      'Assess the report',
      'Run classification and inspect the recorded source.',
      Cpu,
    ],
    [
      '03',
      'RISK',
      'Review the score',
      'Read the rule factors used in the assessment.',
      AlertTriangle,
    ],
    [
      '04',
      'REVIEW',
      'Approve the plan',
      'An operator reviews the draft before assignment.',
      ShieldCheck,
    ],
    [
      '05',
      'HISTORY',
      'Record what follows',
      'Keep assignment and resolution decisions in the history.',
      Clock3,
    ],
  ]
  const launch = () => {
    window.location.hash = 'incidents'
    onLaunch?.()
  }
  return (
    <div className="landing-page">
      <header className="landing-nav">
        <a href="#home" className="brand">
          <div className="brand-mark">
            <ShieldCheck size={19} aria-hidden="true" />
          </div>
          <div>
            <strong>CivicShield</strong>
            <span>CIVIC OPERATIONS</span>
          </div>
        </a>
        <nav aria-label="Landing navigation">
          <a href="#incidents">Reports</a>
          <a href="#profile">{user.username}</a>
        </nav>
        <div className="nav-actions">
          <ThemeToggle />
          <button className="nav-launch" onClick={launch}>
            Open Console <ArrowRight size={15} aria-hidden="true" />
          </button>
          <button
            className="text-button"
            disabled={signingOut}
            onClick={onLogout}
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </header>
      <main id="main-content" className="landing-main">
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <section className="hero-section hero-3d-section">
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-copy">
            <span className="eyebrow">CIVIC INCIDENT RESPONSE</span>
            <h1>
              Civic<span>Shield</span>
            </h1>
            <h2>
              Report an incident.<span>Review the response.</span>
            </h2>
            <p>
              Record civic reports, review their assessments, and keep the
              operator’s decisions in one place.
            </p>
            <div className="hero-actions">
              <button className="primary-button" onClick={launch}>
                Enter Command Center <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="hero-proof">
              <span>
                <CheckCircle2 size={14} aria-hidden="true" /> Saved reports
              </span>
              <span>
                <CheckCircle2 size={14} aria-hidden="true" /> Operator review
              </span>
              <span>
                <CheckCircle2 size={14} aria-hidden="true" /> Record history
              </span>
            </div>
          </div>
          <div className="hero-visual civic-3d-scene" aria-hidden="true">
            <div className="scene-glow" />
            <div className="orbit orbit-a">
              <span className="orbit-node node-a" />
            </div>
            <div className="orbit orbit-b">
              <span className="orbit-node node-b" />
            </div>
            <div className="orbit orbit-c">
              <span className="orbit-node node-c" />
            </div>
            <div className="orbit-plane" />
            <div className="shield-3d-wrap">
              <div className="shield-depth shield-depth-back" />
              <div className="shield-depth shield-depth-mid" />
              <div className="shield-3d">
                <div className="shield-face">
                  <div className="shield-scan" />
                  <ShieldCheck size={65} strokeWidth={1.4} />
                  <span>CS</span>
                  <small>CIVIC OPERATIONS</small>
                </div>
              </div>
              <div className="shield-base" />
            </div>
            <div className="float-card card-one">
              <span>
                <MapPin size={10} /> REPORT
              </span>
              <strong>Record the location</strong>
              <small>CITIZEN OBSERVATION</small>
            </div>
            <div className="float-card card-two">
              <span>
                <Activity size={10} /> ASSESSMENT
              </span>
              <strong>Review the factors</strong>
              <small>RULE-BASED SCORE</small>
            </div>
            <div className="float-card card-three">
              <span>
                <GitBranch size={10} /> REVIEW
              </span>
              <strong>Operator decision</strong>
              <small>HUMAN CHECKPOINT</small>
            </div>
            <div className="signal-ring">WORKFLOW ILLUSTRATION</div>
          </div>
        </section>
        <section className="content-section">
          <div className="section-label">REPORT WORKFLOW</div>
          <div className="section-heading">
            <h2>
              From report<span>to recorded decision.</span>
            </h2>
            <p>
              Assessments are recommendations for review. Internal assignments
              do not contact emergency services.
            </p>
          </div>
          <div className="workflow-grid">
            {workflow.map(([n, tag, heading, description, Icon]) => (
              <div className="workflow-card" key={n}>
                <span className="workflow-number">{n}</span>
                <Icon size={18} aria-hidden="true" />
                <span className="mono">{tag}</span>
                <h3>{heading}</h3>
                <p>{description}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="control-section">
          <div className="control-copy">
            <div className="section-label">HUMAN CONTROL</div>
            <h2>
              Review the recommendation.<span>Record the decision.</span>
            </h2>
            <p>
              Operators approve saved plans, record internal assignments, and
              add a note when resolving a report.
            </p>
            <div className="control-pills">
              <span>
                <CheckCircle2 size={15} aria-hidden="true" /> Assessment source
                and score factors
              </span>
              <span>
                <CheckCircle2 size={15} aria-hidden="true" /> Approval before
                internal assignment
              </span>
              <span>
                <CheckCircle2 size={15} aria-hidden="true" /> Saved operator
                history
              </span>
            </div>
          </div>
          <div className="control-visual human-3d" aria-hidden="true">
            <div className="human-core">
              <Users size={36} />
              <span>OPERATOR</span>
            </div>
            <div className="human-orbit h1" />
            <div className="human-orbit h2" />
            <span className="human-tag ai">ASSESSMENT</span>
            <span className="human-tag approve">HUMAN REVIEW</span>
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <span>CIVICSHIELD · CIVIC OPERATIONS</span>
        <span>
          Reports and internal decisions · external dispatch is not connected
        </span>
      </footer>
    </div>
  )
}
