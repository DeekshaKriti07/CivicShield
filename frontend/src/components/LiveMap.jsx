import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
const pos=[11.0168,76.9558]
const icon=L.divIcon({className:'cs-marker',html:'<span></span>',iconSize:[30,30],iconAnchor:[15,15]})
function Focus(){const map=useMap();useEffect(()=>{map.setView(pos,15,{animate:false})},[map]);return null}
export default function LiveMap(){return <div className="live-map"><MapContainer center={pos} zoom={15} className="leaflet-map" zoomControl={true}><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><Focus/><Circle center={pos} radius={180} pathOptions={{color:'#22d3ee',fillColor:'#22d3ee',fillOpacity:.08,weight:1}}/><Marker position={pos} icon={icon}><Popup><b>INC-001</b><br/>Road waterlogging<br/>Critical · 91/100</Popup></Marker></MapContainer><div className="map-caption"><span className="mono">LIVE LOCATION</span><strong>Hospital Access Road</strong><small>Coimbatore · 11.0168° N, 76.9558° E</small></div></div>}
