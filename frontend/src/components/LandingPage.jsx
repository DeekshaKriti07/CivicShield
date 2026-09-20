import { useEffect, useRef, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Eye,
  GitBranch,
  Layers,
  MapPin,
  Radio,
  ShieldCheck,
  Users,
  Workflow,
  Zap,
} from 'lucide-react'
import ThemeToggle from './ThemeToggle'

export default function LandingPage({ onLaunch }) {
  const [scrollY, setScrollY] = useState(0)
  const heroRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const tilt = Math.min(scrollY * 0.035, 12)
  const opacity = Math.max(1 - scrollY / 650, 0.15)

  const workflow = [
    ['01', 'TRIAGE', 'Understand the report', 'Classify text, image and location.', Cpu],
    ['02', 'VERIFY', 'Check the evidence', 'Fuse duplicates and validate evidence.', Eye],
    ['03', 'RISK', 'Understand impact', 'Combine severity and critical infrastructure.', AlertTriangle],
    ['04', 'ROUTE', 'Find the responder', 'Select a controlled department and team.', GitBranch],
    ['05', 'RESPOND', 'Prepare the action', 'Generate a plan for human approval.', ShieldCheck],
  ]

  return (
    <div className="landing-page" ref={heroRef}>
      <header className="landing-nav">
        <div className="brand">
          <div className="brand-mark"><ShieldCheck size={19} /></div>
          <div><strong>CivicShield</strong><span>AI CIVIC OPERATIONS</span></div>
        </div>
        <nav>
          <a href="#how">How it works</a>
          <a href="#intelligence">Intelligence</a>
          <a href="#control">Human control</a>
        </nav>
        <div className="nav-actions">
          <ThemeToggle />
          <button className="nav-launch" onClick={onLaunch}>Open Console <ArrowRight size={15} /></button>
        </div>
      </header>

      <main>
        <section className="hero-section hero-3d-section">
          <div className="hero-grid" />
          <div className="hero-copy">
            <span className="eyebrow"><i /> MULTI-AGENT AI CIVIC RESPONSE SYSTEM</span>
            <h1>Civic<span>Shield</span></h1>
            <h2>When something goes wrong, <span>CivicShield helps the right people respond.</span></h2>
            <p>AI agents detect, verify, assess, route and prepare civic responses — with a human approval checkpoint before action.</p>
            <div className="hero-actions">
              <button className="primary-button" onClick={onLaunch}>Enter Command Center <ArrowRight size={16} /></button>
              <a className="ghost-button" href="#how">Explore workflow <Activity size={16} /></a>
            </div>
            <div className="hero-proof">
              <span><CheckCircle2 size={14} /> Multimodal evidence</span>
              <span><CheckCircle2 size={14} /> 5 specialized agents</span>
              <span><CheckCircle2 size={14} /> Human approval</span>
            </div>
          </div>

          <div className="hero-visual civic-3d-scene" style={{ transform: `perspective(1000px) rotateX(${tilt}deg)`, opacity }}>
            <div className="scene-glow" />
            <div className="orbit orbit-a"><span className="orbit-node node-a" /></div>
            <div className="orbit orbit-b"><span className="orbit-node node-b" /></div>
            <div className="orbit orbit-c"><span className="orbit-node node-c" /></div>
            <div className="orbit-plane" />

            <div className="shield-3d-wrap">
              <div className="shield-depth shield-depth-back" />
              <div className="shield-depth shield-depth-mid" />
              <div className="shield-3d">
                <div className="shield-face">
                  <div className="shield-scan" />
                  <ShieldCheck size={65} strokeWidth={1.4} />
                  <span>CS</span>
                  <small>AI OPS</small>
                </div>
              </div>
              <div className="shield-base" />
            </div>

            <div className="float-card card-one">
              <span><Radio size={10} /> INCIDENT SIGNAL</span>
              <strong>3 REPORTS FUSED</strong>
              <small>VERIFIED</small>
            </div>
            <div className="float-card card-two">
              <span><AlertTriangle size={10} /> RISK ENGINE</span>
              <strong>91 / 100</strong>
              <small>CRITICAL</small>
            </div>
            <div className="float-card card-three">
              <span><GitBranch size={10} /> ROUTING</span>
              <strong>DRAINAGE · TEAM B</strong>
              <small>HUMAN CHECKPOINT</small>
            </div>
            <div className="signal-ring"><span className="live-dot-3d" /> LOCAL AI ONLINE</div>
            <div className="coordinate-card"><MapPin size={12} /><span>11.0168° N · 76.9558° E</span></div>
          </div>
        </section>

        <section className="stat-strip">
          <div><strong>01</strong><span>Incident → resolution workflow</span></div>
          <div><strong>05</strong><span>Specialized AI agents</span></div>
          <div><strong>01</strong><span>Human approval checkpoint</span></div>
          <div><strong>100%</strong><span>Traceable decisions</span></div>
        </section>

        <section id="how" className="content-section">
          <div className="section-label">01 / HOW IT WORKS</div>
          <div className="section-heading"><h2>Not just detection.<span>A complete response loop.</span></h2><p>CivicShield connects perception, verification, context, risk, routing, planning, approval and monitoring into one visible workflow.</p></div>
          <div className="workflow-grid">
            {workflow.map(([n, t, h, d, Icon]) => <div className="workflow-card" key={n}><span className="workflow-number">{n}</span><Icon size={18} /><span className="mono">{t}</span><h3>{h}</h3><p>{d}</p></div>)}
          </div>
        </section>

        <section id="intelligence" className="decision-section">
          <div className="decision-visual decision-3d">
            <div className="decision-glow" />
            <div className="decision-orbit" />
            <div className="decision-card">
              <div className="decision-top"><span>AI DECISION</span><b>INC-001</b></div>
              <div className="decision-risk"><strong>91</strong><span>/100<br />CRITICAL</span></div>
              <div className="factor"><span>Hospital nearby</span><b>+30</b></div>
              <div className="factor"><span>Road blocked</span><b>+15</b></div>
              <div className="factor"><span>Multiple reports</span><b>+10</b></div>
              <div className="route-line"><ShieldCheck size={16} /><div><small>RECOMMENDED RESPONSE</small><strong>DRAINAGE · TEAM B</strong></div></div>
              <div className="approval-chip"><Users size={14} /> Waiting for human approval</div>
            </div>
          </div>
          <div className="decision-copy"><div className="section-label">02 / DECISION INTELLIGENCE</div><h2>Every decision has <span>visible evidence.</span></h2><p>Instead of hiding the model behind a chat response, CivicShield exposes why an incident was prioritized and where the recommendation came from.</p><div className="point-list"><div><Activity size={17} /><span>Deterministic risk engine for numeric scoring</span></div><div><MapPin size={17} /><span>Critical infrastructure awareness</span></div><div><GitBranch size={17} /><span>Department routing from a controlled knowledge base</span></div></div></div>
        </section>

        <section id="control" className="control-section">
          <div className="control-copy"><div className="section-label">03 / HUMAN CONTROL</div><h2>AI can move fast.<span>People make the final call.</span></h2><p>The system can reason, recommend and monitor. It pauses before consequential action so a human can approve, modify or reject the response.</p><div className="control-pills"><span><CheckCircle2 size={15} /> Clear decision context</span><span><CheckCircle2 size={15} /> Approval before action</span><span><CheckCircle2 size={15} /> Full agent trace</span></div><div className="accountability">CivicShield automates reasoning, not accountability.</div></div>
          <div className="control-visual human-3d"><div className="human-core"><ShieldCheck size={36} /><span>HUMAN</span></div><div className="human-orbit h1" /><div className="human-orbit h2" /><div className="human-orbit h3" /><span className="human-tag ai"><Zap size={12} /> AI RECOMMENDS</span><span className="human-tag approve"><CheckCircle2 size={12} /> HUMAN APPROVES</span></div>
        </section>

        <section className="launch-section"><div><span className="section-label">04 / COMMAND CENTER</span><h2>See one incident move <span>from signal to resolution.</span></h2><p>Open the operational console and follow the complete CivicShield demo workflow.</p><button className="primary-button" onClick={onLaunch}>Launch Command Center <ArrowRight size={16} /></button></div></section>
      </main>
      <footer className="landing-footer"><span>CIVICSHIELD · CIVIC OPERATIONS 2026</span><span>AI-POWERED · HUMAN-CONTROLLED</span></footer>
    </div>
  )
}
