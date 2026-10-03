import React from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Polyline, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CAPITAL, PROVINCIAL_CAPITALS, CITY_CODES, allCityCoords } from '../constants';

const createCapitalIcon = () => L.divIcon({
  className: 'capital-marker-wrapper',
  html: `<div class="capital-marker-container">
    <div class="capital-outer-ring"></div>
    <div class="capital-inner-ring"></div>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B" stroke="#1E293B" stroke-width="1.5">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
    </svg>
  </div>`,
  iconSize: [40, 40], iconAnchor: [20, 20]
});

const createProvincialIcon = (code, hasHazard) => L.divIcon({
  className: 'provincial-marker-wrapper',
  html: `<div style="display:flex;align-items:center;gap:5px;background:white;border:1.5px solid #1E293B;border-radius:14px;padding:3px 10px 3px 7px;font-size:10px;font-weight:700;color:#1E293B;font-family:'Inter',sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.1);white-space:nowrap;">
    <span style="width:7px;height:7px;border-radius:50%;background:${hasHazard ? '#DC2626' : '#059669'};flex-shrink:0;"></span>
    ${code}
  </div>`,
  iconSize: [56, 24], iconAnchor: [28, 12]
});

const createJetIcon = (heading = 0) => L.divIcon({
  className: 'custom-jet-icon',
  html: `<div style="transform:rotate(${heading}deg);transition:transform 0.5s ease;">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E293B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.7 5.2c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/>
    </svg>
  </div>`,
  iconSize: [22, 22], iconAnchor: [11, 11]
});

const TacticalMap = ({ selectedCity, destinationCity, routeData, liveFlights, geoData, forecastData, radarRange }) => {
  const center = allCityCoords[selectedCity] || [30.3753, 69.3451];

  const directPathPositions = (selectedCity !== destinationCity && allCityCoords[selectedCity] && allCityCoords[destinationCity])
    ? [allCityCoords[selectedCity], allCityCoords[destinationCity]] : [];

  const safeRoutePositions = routeData?.waypoints
    ? routeData.waypoints.map((wp) => [wp.lat, wp.lon]) : [];

  // Check hazard for the selected city from forecast
  const selectedHasHazard = forecastData?.forecast?.some(h => h.hazard) || false;

  return (
    <MapContainer
      key={`${selectedCity}-${destinationCity}`}
      center={center} zoom={5}
      style={{ height: '100%', width: '100%', backgroundColor: '#F8FAFC' }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
      />

      {geoData && (
        <GeoJSON data={geoData} style={{ color: '#94A3B8', weight: 1.5, fillColor: '#F1F5F9', fillOpacity: 0.35 }} />
      )}

      {/* Radar Range Circle */}
      {radarRange && allCityCoords[selectedCity] && (
        <Circle
          center={allCityCoords[selectedCity]}
          radius={radarRange * 1000}
          pathOptions={{ color: '#2563EB', weight: 1, fillColor: '#2563EB', fillOpacity: 0.04, dashArray: '6, 4' }}
        />
      )}

      {/* Hazardous direct path (dashed crimson) */}
      {routeData?.hazard_detected && directPathPositions.length === 2 && (
        <Polyline positions={directPathPositions}
          pathOptions={{ color: '#DC2626', weight: 2.5, dashArray: '8, 8', opacity: 0.7 }} />
      )}

      {/* Safe evasion route (solid navy with emerald shadow) */}
      {safeRoutePositions.length > 0 && selectedCity !== destinationCity && (
        <>
          <Polyline positions={safeRoutePositions}
            pathOptions={{ color: '#10B981', weight: 7, opacity: 0.2 }} />
          <Polyline positions={safeRoutePositions}
            pathOptions={{ color: '#0F172A', weight: 3, opacity: 0.95 }} />
        </>
      )}

      {/* 21-City Markers */}
      {Object.entries(allCityCoords).map(([name, coords]) => {
        if (name === CAPITAL) {
          return (
            <Marker key={name} position={coords} icon={createCapitalIcon()}>
              <Popup><span className="text-xs font-bold text-[#0F172A]">★ {name} — Federal Capital</span></Popup>
            </Marker>
          );
        }
        if (PROVINCIAL_CAPITALS.includes(name)) {
          const isActive = name === selectedCity || name === destinationCity;
          return (
            <Marker key={name} position={coords}
              icon={createProvincialIcon(CITY_CODES[name], isActive ? selectedHasHazard : false)}>
              <Popup><span className="text-xs font-bold text-[#0F172A]">{CITY_CODES[name]} — {name} Sector</span></Popup>
            </Marker>
          );
        }
        // Regional hub — minimal dot
        const isActive = name === selectedCity || name === destinationCity;
        return (
          <CircleMarker key={name} center={coords}
            radius={isActive ? 5 : 3}
            pathOptions={{
              color: isActive ? '#1E293B' : '#94A3B8',
              fillColor: isActive ? '#1E293B' : '#CBD5E1',
              fillOpacity: 0.7, weight: isActive ? 2 : 1
            }}>
            <Popup>
              <div className="text-xs text-[#0F172A]">
                <strong>{CITY_CODES[name]}</strong> — {name}
                <br /><span className="text-[#64748B]">Regional Waypoint</span>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}

      {/* Live Aircraft */}
      {liveFlights.map((f) => (
        <Marker key={f.icao24} position={[f.latitude, f.longitude]} icon={createJetIcon(f.heading)}>
          <Popup>
            <div className="text-xs font-data text-[#0F172A]">
              <strong>CALLSIGN:</strong> {f.callsign}<br />
              <strong>ALT:</strong> {f.altitude_m}m &nbsp; <strong>SPD:</strong> {f.velocity_ms}m/s
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default TacticalMap;
