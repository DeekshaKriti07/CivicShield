import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
export default function LiveMap({ incident }) {
  const position = [incident.latitude, incident.longitude]
  return (
    <div className="map-wrap">
      <MapContainer
        key={incident.id}
        center={position}
        zoom={15}
        className="leaflet-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker center={position} radius={8}>
          <Popup>Reported location · #{incident.id}</Popup>
        </CircleMarker>
      </MapContainer>
      <p className="field-help">
        Reported coordinates, not a verified location. Map tiles are provided by
        OpenStreetMap.
      </p>
    </div>
  )
}
