import { useRef, useState } from 'react'
import {
  AlertTriangle,
  ImagePlus,
  MapPin,
  Send,
  CheckCircle2
} from 'lucide-react'
import { api } from '../services/api'

export default function IncidentForm({ onIncidentCreated }) {
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('11.0168, 76.9558')
  const [image, setImage] = useState(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const ref = useRef()

  const submit = async e => {
    e.preventDefault()

    if (!description.trim()) return

    setBusy(true)
    setError('')

    try {
      const [lat, lon] = location.split(',').map(Number)

      const incident = await api.createIncident({
        description: description.trim(),
        latitude: Number.isFinite(lat) ? lat : 11.0168,
        longitude: Number.isFinite(lon) ? lon : 76.9558
      })

      const normalizedIncident = {
        id: incident.id || `INC-${String(Date.now()).slice(-4)}`,
        title: incident.title || 'New civic incident',
        type: incident.type || 'Pending analysis',
        description: incident.description || description.trim(),
        location: incident.location || 'Citizen reported location · Coimbatore',
        latitude: incident.latitude ?? (Number.isFinite(lat) ? lat : 11.0168),
        longitude: incident.longitude ?? (Number.isFinite(lon) ? lon : 76.9558),
        score: incident.score ?? incident.risk_score ?? 0,
        level: incident.level || 'ANALYZING',
        department: incident.department || 'AI ROUTING PENDING',
        team: incident.team || 'Pending',
        reports: incident.reports ?? 1,
        facility: incident.facility || 'Context analysis pending',
        confidence: incident.confidence ?? 0,
        status: incident.status || 'ANALYZING'
      }

      onIncidentCreated?.(normalizedIncident)

      try {
        const workflow = await api.workflow(incident.id)

        const result = workflow.incident || workflow

        onIncidentCreated?.({
          ...normalizedIncident,
          id: result.id || normalizedIncident.id,
          type: result.incident_type || normalizedIncident.type,
          score: result.risk_score ?? normalizedIncident.score,
          level: result.risk_level || normalizedIncident.level,
          department: result.department || normalizedIncident.department,
          team: result.response_team || normalizedIncident.team,
          status: result.status || normalizedIncident.status
        })
      } catch (workflowError) {
        console.error('Workflow analysis failed:', workflowError)
      }

      setDescription('')
      setImage(null)

      if (ref.current) {
        ref.current.value = ''
      }

      setDone(true)

      setTimeout(() => {
        setDone(false)
      }, 2200)
    } catch (err) {
      setError(err.message || 'Unable to submit incident')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="form-card">
      <div className="card-heading">
        <div>
          <span className="section-label">NEW INCIDENT</span>
          <h2>Report a civic incident</h2>
          <p>
            Provide a description, location and optional image evidence.
          </p>
        </div>

        <div className="icon-box">
          <AlertTriangle size={19} />
        </div>
      </div>

      {done ? (
        <div className="form-success">
          <CheckCircle2 size={28} />
          <strong>Incident received</strong>
          <span>
            Incident submitted to the CivicShield backend.
          </span>
        </div>
      ) : (
        <form onSubmit={submit}>
          <label>
            <span>Description</span>

            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Example: The road near the hospital is flooded..."
              rows={4}
            />
          </label>

          <label>
            <span>Location</span>

            <div className="input-icon">
              <MapPin size={15} />

              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Latitude, Longitude"
              />
            </div>
          </label>

          <label className="file-drop">
            <input
              ref={ref}
              type="file"
              accept="image/*"
              onChange={e =>
                setImage(e.target.files?.[0] || null)
              }
            />

            <ImagePlus size={19} />

            <div>
              <strong>
                {image
                  ? image.name
                  : 'Attach image evidence'}
              </strong>

              <small>
                {image
                  ? 'Evidence selected'
                  : 'JPG, PNG or WEBP'}
              </small>
            </div>
          </label>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <button
            className="primary-button form-submit"
            disabled={busy || !description.trim()}
            type="submit"
          >
            {busy ? (
              <>
                <span className="spinner" />
                Submitting...
              </>
            ) : (
              <>
                <Send size={15} />
                Submit incident
              </>
            )}
          </button>
        </form>
      )}
    </div>
  )
}
