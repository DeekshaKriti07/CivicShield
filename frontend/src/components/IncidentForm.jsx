import { useEffect, useRef, useState } from 'react'
import exifr from 'exifr'
import { api } from '../services/api'
import ReportLocationPicker from './ReportLocationPicker'
export default function IncidentForm({ onIncidentCreated }) {
  const [description, setDescription] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [evidence, setEvidence] = useState(null)
  const [evidencePreview, setEvidencePreview] = useState('')
  const [photoLocation, setPhotoLocation] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const cameraInput = useRef(null)
  const galleryInput = useRef(null)

  useEffect(() => () => {
    if (evidencePreview) URL.revokeObjectURL(evidencePreview)
  }, [evidencePreview])

  function captureLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Location is not supported.'))
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude, source: 'camera' }),
        reject,
        { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 },
      )
    })
  }

  async function selectEvidence(event, source) {
    const file = event.target.files?.[0]
    setPhotoLocation(null)
    setError('')
    if (!file) {
      setEvidence(null)
      setEvidencePreview('')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Evidence must be a JPG, PNG, or WEBP image.')
      event.target.value = ''
      return
    }
    if (file.size > 5_000_000) {
      setError('Evidence image must be 5 MB or smaller.')
      event.target.value = ''
      return
    }
    setEvidence(file)
    setEvidencePreview(URL.createObjectURL(file))
    if (source === 'camera') {
      try {
        const capturedLocation = await captureLocation()
        setPhotoLocation(capturedLocation)
        setLatitude(String(capturedLocation.latitude))
        setLongitude(String(capturedLocation.longitude))
      } catch {
        setError('Photo captured, but its geotag could not be recorded. Enable device location and try the camera again, or use the map pin.')
      }
      return
    }
    try {
      const gps = await exifr.gps(file)
      if (Number.isFinite(gps?.latitude) && Number.isFinite(gps?.longitude)) {
        setPhotoLocation({ latitude: gps.latitude, longitude: gps.longitude, source: 'exif' })
      }
    } catch {
      setPhotoLocation(null)
    }
  }
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
      const payload = {
        description: description.trim(),
        latitude: Number(latitude),
        longitude: Number(longitude),
      }
      const incident = evidence
        ? await api.createIncidentWithEvidence(payload, evidence, photoLocation)
        : await api.createIncident(payload)
      onIncidentCreated(incident)
      setDescription('')
      setEvidence(null)
      setEvidencePreview('')
      setPhotoLocation(null)
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
        <div className="incident-copy-column">
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
          <div className="evidence-picker">
            <span>Photo evidence <em>Optional</em></span>
            <input
              ref={cameraInput}
              className="evidence-native-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={(event) => selectEvidence(event, 'camera')}
              disabled={busy}
            />
            <input
              ref={galleryInput}
              className="evidence-native-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => selectEvidence(event, 'gallery')}
              disabled={busy}
            />
            <div className="evidence-source-actions">
              <button type="button" onClick={() => cameraInput.current?.click()} disabled={busy}>Take geotagged photo</button>
              <button type="button" onClick={() => galleryInput.current?.click()} disabled={busy}>Choose from gallery</button>
            </div>
            <div className="evidence-picker-body">
              {evidencePreview ? (
                <img src={evidencePreview} alt="Selected incident evidence preview" />
              ) : (
                <div className="evidence-placeholder-compact">Choose a geotagged photo or any incident image</div>
              )}
              <div>
                <strong>{evidence?.name || 'Attach evidence image'}</strong>
                <small>JPG, PNG or WEBP · maximum 5 MB</small>
                {evidence && (
                  <small className={photoLocation ? 'geotag-found' : ''}>
                    {photoLocation
                      ? `${photoLocation.source === 'camera' ? 'Capture location recorded' : 'Photo geotag found'}: ${photoLocation.latitude.toFixed(6)}, ${photoLocation.longitude.toFixed(6)}`
                      : 'No GPS geotag found; the image can still be submitted.'}
                  </small>
                )}
              </div>
            </div>
          </div>
          {photoLocation && (
            <button
              type="button"
              className="use-photo-location"
              onClick={() => {
                setLatitude(String(photoLocation.latitude))
                setLongitude(String(photoLocation.longitude))
              }}
              disabled={busy}
            >
              Use photo geotag as incident location
            </button>
          )}
        </div>
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
