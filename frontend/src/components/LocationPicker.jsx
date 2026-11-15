import { useEffect, useState } from 'react'
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { Crosshair, LoaderCircle, MapPin, Search } from 'lucide-react'

const DEFAULT_POSITION = { latitude: 11.0168, longitude: 76.9558 }

function MapController({ position, onPick }) {
  const map = useMap()

  useEffect(() => {
    map.flyTo([position.latitude, position.longitude], Math.max(map.getZoom(), 15), {
      animate: true,
      duration: 0.65
    })
  }, [map, position.latitude, position.longitude])

  useMapEvents({
    click(event) {
      onPick({ latitude: event.latlng.lat, longitude: event.latlng.lng, label: 'Pinned location' })
    }
  })

  return null
}

export default function LocationPicker({ value = DEFAULT_POSITION, onChange }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [message, setMessage] = useState('Click the map to move the pin.')

  const selectLocation = location => {
    onChange(location)
    setResults([])
    setQuery(location.label || '')
    setMessage('Location pinned. Click the map again to adjust it.')
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setMessage('This browser does not support location access. Search or pin the location instead.')
      return
    }

    setLocating(true)
    setMessage('Waiting for your browser location…')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        selectLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          label: 'My current location'
        })
        setLocating(false)
      },
      error => {
        const errors = {
          1: 'Location permission was denied. Allow it in browser settings, or search/pin the place below.',
          2: 'Your location is currently unavailable. Search or pin the place below.',
          3: 'Location detection timed out. Try again, or search/pin the place below.'
        }
        setMessage(errors[error.code] || 'Could not detect your location. Search or pin it below.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    )
  }

  const search = async () => {
    if (query.trim().length < 3) {
      setMessage('Enter at least 3 characters to search for a place.')
      return
    }

    setSearching(true)
    setResults([])
    setMessage('Searching OpenStreetMap…')
    try {
      const params = new URLSearchParams({ q: query.trim(), format: 'jsonv2', limit: '5', addressdetails: '1' })
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { Accept: 'application/json' }
      })
      if (!response.ok) throw new Error('Search unavailable')
      const data = await response.json()
      const places = data.map(place => ({
        latitude: Number(place.lat),
        longitude: Number(place.lon),
        label: place.display_name
      }))
      setResults(places)
      setMessage(places.length ? 'Select a result, or click the map to pin the exact spot.' : 'No places found. Try a broader search.')
    } catch {
      setMessage('Place search is temporarily unavailable. You can still click the map to pin a location.')
    } finally {
      setSearching(false)
    }
  }

  const position = [value.latitude, value.longitude]

  return (
    <div className="location-picker">
      <div className="location-tools">
        <button className="location-button" type="button" onClick={useMyLocation} disabled={locating}>
          {locating ? <LoaderCircle className="spin" size={15} /> : <Crosshair size={15} />}
          {locating ? 'Locating…' : 'Use my location'}
        </button>
        <div className="location-search">
          <Search size={15} />
          <input
            aria-label="Search for a location"
            value={query}
            onChange={event => setQuery(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault()
                search()
              }
            }}
            placeholder="Search area, street or landmark"
          />
          <button type="button" onClick={search} disabled={searching}>{searching ? <LoaderCircle className="spin" size={14} /> : 'Search'}</button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="location-results">
          {results.map(result => (
            <button type="button" key={`${result.latitude}-${result.longitude}`} onClick={() => selectLocation(result)}>
              <MapPin size={14} /><span>{result.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="location-map">
        <MapContainer center={position} zoom={15} scrollWheelZoom className="location-leaflet-map">
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {value.accuracy && <Circle center={position} radius={value.accuracy} pathOptions={{ color: '#22d3ee', weight: 1, fillOpacity: 0.08 }} />}
          <Marker position={position} />
          <MapController position={value} onPick={selectLocation} />
        </MapContainer>
      </div>

      <div className="location-status" aria-live="polite">
        <span>{message}</span>
        <strong>{value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}</strong>
      </div>
    </div>
  )
}
