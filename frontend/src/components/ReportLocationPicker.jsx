import { useEffect, useState } from 'react'
import { Circle, CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const FALLBACK = [11.0168, 76.9558]

function MapInteraction({ position, onSelect }) {
  const map = useMap()

  useEffect(() => {
    map.flyTo(position, Math.max(map.getZoom(), 15), { duration: 0.6 })
  }, [map, position[0], position[1]])

  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

export default function ReportLocationPicker({ latitude, longitude, onSelect, disabled }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [accuracy, setAccuracy] = useState(null)
  const [message, setMessage] = useState('Search for a place or click the map to pin the incident.')

  const lat = Number(latitude)
  const lon = Number(longitude)
  const position = Number.isFinite(lat) && Number.isFinite(lon) ? [lat, lon] : FALLBACK

  function locate() {
    if (!navigator.geolocation) {
      setMessage('Location access is unavailable. Search or click the map instead.')
      return
    }
    setLocating(true)
    setMessage('Waiting for your browser location…')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        onSelect(coords.latitude, coords.longitude)
        setAccuracy(coords.accuracy)
        setMessage('Current location pinned. Click the map to fine-tune it.')
        setLocating(false)
      },
      (error) => {
        const reasons = {
          1: 'Location permission is blocked. Allow it in browser settings, or search/pin the place.',
          2: 'Your device could not determine its location. Search or pin the place instead.',
          3: 'Location detection timed out. Try again, or search/pin the place.',
        }
        setMessage(reasons[error.code] || 'Location could not be read. Search or pin the place instead.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 30_000 },
    )
  }

  async function search() {
    if (query.trim().length < 3) {
      setMessage('Enter at least three characters to search.')
      return
    }
    setSearching(true)
    setResults([])
    setMessage('Searching OpenStreetMap…')
    try {
      const params = new URLSearchParams({
        q: query.trim(),
        format: 'jsonv2',
        limit: '5',
      })
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) throw new Error('Search unavailable')
      const places = (await response.json()).map((place) => ({
        latitude: Number(place.lat),
        longitude: Number(place.lon),
        label: place.display_name,
      }))
      setResults(places)
      setMessage(places.length ? 'Choose a result, then click the map to adjust the pin.' : 'No places found. Try a broader search.')
    } catch {
      setMessage('Place search is temporarily unavailable. You can still click the map.')
    } finally {
      setSearching(false)
    }
  }

  function choose(place) {
    onSelect(place.latitude, place.longitude)
    setQuery(place.label)
    setResults([])
    setAccuracy(null)
    setMessage('Location pinned. Click the map to adjust the exact spot.')
  }

  return (
    <div className="report-location-picker">
      <div className="report-location-tools">
        <button type="button" className="location-action" onClick={locate} disabled={disabled || locating}>
          {locating ? 'Reading location…' : 'Use my current location'}
        </button>
        <div className="report-location-search">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                search()
              }
            }}
            placeholder="Search area, street or landmark"
            aria-label="Search for a location"
            disabled={disabled}
          />
          <button type="button" onClick={search} disabled={disabled || searching}>
            {searching ? 'Searching…' : 'Search'}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="report-location-results">
          {results.map((place) => (
            <button type="button" key={`${place.latitude}-${place.longitude}`} onClick={() => choose(place)}>
              {place.label}
            </button>
          ))}
        </div>
      )}

      <div className="report-location-map">
        <MapContainer center={position} zoom={15} scrollWheelZoom>
          <TileLayer
            attribution="&copy; OpenStreetMap contributors &copy; CARTO"
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={20}
          />
          {accuracy && <Circle center={position} radius={accuracy} pathOptions={{ color: '#22d3ee', weight: 1, fillOpacity: 0.08 }} />}
          <CircleMarker center={position} radius={8} pathOptions={{ color: '#fff', weight: 3, fillColor: '#22d3ee', fillOpacity: 1 }} />
          <MapInteraction position={position} onSelect={(nextLat, nextLon) => {
            onSelect(nextLat, nextLon)
            setAccuracy(null)
            setMessage('Location pinned from the map.')
          }} />
        </MapContainer>
      </div>
      <div className="report-location-status" aria-live="polite">
        <span>{message}</span>
        <strong>{position[0].toFixed(6)}, {position[1].toFixed(6)}</strong>
      </div>
    </div>
  )
}
