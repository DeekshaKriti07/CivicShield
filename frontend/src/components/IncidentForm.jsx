import { useState } from 'react'
import { api } from '../services/api'
import ReportLocationPicker from './ReportLocationPicker'
export default function IncidentForm({ onIncidentCreated }) {
  const [description, setDescription] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault()
    setError('')
    if (
      description.trim().length < 3 ||
      latitude === '' ||
      longitude === '' ||
      !Number.isFinite(Number(latitude)) ||
      !Number.isFinite(Number(longitude))
    ) {
      setError('Enter a description and valid coordinates.')
      return
    }
    setBusy(true)
    try {
      onIncidentCreated(
        await api.createIncident({
          description: description.trim(),
          latitude: Number(latitude),
          longitude: Number(longitude),
        }),
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="form-card">
      <span className="section-label">NEW INCIDENT</span>
      <h2>Report an incident</h2>
      <p className="muted">
        Describe what you observed and where it happened. Review the coordinates
        before submitting.
      </p>
      <form className="restore-incident-form" onSubmit={submit}>
        <label>
          Description
          <textarea
            name="description"
            rows={3}
            required
            minLength={3}
            maxLength={5000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={busy}
          />
        </label>
        <div className="location-fields">
          <ReportLocationPicker
            latitude={latitude}
            longitude={longitude}
            disabled={busy}
            onSelect={(nextLatitude, nextLongitude) => {
              setLatitude(String(nextLatitude))
              setLongitude(String(nextLongitude))
              setError('')
            }}
          />
          <div className="coordinate-inputs">
            <label>
              Latitude
              <input
                type="number"
                name="latitude"
                min={-90}
                max={90}
                step="any"
                required
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                disabled={busy}
              />
            </label>
            <label>
              Longitude
              <input
                type="number"
                name="longitude"
                min={-180}
                max={180}
                step="any"
                required
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                disabled={busy}
              />
            </label>
          </div>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button
          className="primary-button form-submit"
          disabled={busy}
        >
          {busy ? 'Saving report…' : 'Save report'}
        </button>
      </form>
    </section>
  )
}
