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
          attribution="Tiles &copy; Esri &mdash; Esri, HERE, Garmin, USGS, Intermap, INCREMENT P, NRCan, Esri Japan, METI"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />
        <CircleMarker center={position} radius={8}>
          <Popup>Reported location · #{incident.id}</Popup>
        </CircleMarker>
      </MapContainer>
      <p className="field-help">
        Reported coordinates, not a verified location. Map tiles are provided by
        Esri.
      </p>
    </div>
  )
}
