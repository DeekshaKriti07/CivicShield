import { useState } from 'react'
import { api } from '../services/api'
export default function IncidentForm({ onIncidentCreated }) {
  const [description, setDescription] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [busy, setBusy] = useState(false)
  const [locating, setLocating] = useState(false)
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
  function locate() {
    if (!navigator.geolocation) {
      setError(
        'Location is unavailable in this browser. Enter coordinates below.',
      )
      return
    }
    setLocating(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(String(position.coords.latitude))
        setLongitude(String(position.coords.longitude))
        setLocating(false)
      },
      () => {
        setError('Location could not be read. Enter coordinates below.')
        setLocating(false)
      },
      { timeout: 10_000, maximumAge: 0 },
    )
  }
  return (
    <section className="panel form-panel">
      <p className="eyebrow">New record</p>
      <h2>Report an incident</h2>
      <p className="muted">
        Describe what you observed and where it happened. Review the coordinates
        before submitting.
      </p>
      <form onSubmit={submit}>
        <label>
          Description
          <textarea
            name="description"
            rows={5}
            required
            minLength={3}
            maxLength={5000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={busy}
          />
        </label>
        <button
          type="button"
          className="text-button"
          onClick={locate}
          disabled={busy || locating}
        >
          {locating ? 'Reading location…' : 'Use my current location'}
        </button>
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
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="primary-button" disabled={busy || locating}>
          {busy ? 'Saving report…' : 'Save report'}
        </button>
      </form>
    </section>
  )
}
