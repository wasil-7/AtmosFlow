import React, { useState } from 'react';
import { Navigation, Plane, ShieldAlert, ChevronUp, Crosshair } from 'lucide-react';
import TacticalMap from './Map';
import RadarNowcastPanel from './RadarNowcastPanel';
import { TimeSlider, AltitudeSlider, RadarRangeSlider } from './Sliders';
import { cities, allCityCoords, haversineDistance } from '../constants';

const Dashboard = ({
  selectedCity, setSelectedCity, destinationCity, setDestinationCity,
  routeData, liveFlights, geoData, forecastData,
  loadingForecast, loadingRoute, error,
  timeIndex, setTimeIndex, altitudeFL, setAltitudeFL,
  radarRange, setRadarRange, nowcastData
}) => {
  const [trayExpanded, setTrayExpanded] = useState(true);

  const directDist = (allCityCoords[selectedCity] && allCityCoords[destinationCity])
    ? haversineDistance(
        allCityCoords[selectedCity][0], allCityCoords[selectedCity][1],
        allCityCoords[destinationCity][0], allCityCoords[destinationCity][1]
      ) : 0;

  return (
    <div className="space-y-4">
      {/* Hazard Banner */}
      {routeData?.hazard_detected && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5]">
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-[#DC2626] flex-shrink-0" size={22} />
            <div>
              <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider font-trademark">
                Operational Alert: Hazard Detected
              </h3>
              <p className="text-[10px] text-[#64748B]">
                Direct corridor <span className="text-[#DC2626] font-bold">{selectedCity} ➔ {destinationCity}</span> breached.
                Rerouted <span className="text-[#0F172A] font-bold">via {routeData.evacuation_node || 'safe sector'}</span>
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-[#DC2626] px-3 py-1 rounded-lg text-white tracking-widest font-data flex-shrink-0">
            {routeData.path?.join(' ➔ ')}
          </span>
        </div>
      )}

      {/* Main Map Layout */}
      <div className="dashboard-map-container glass-panel overflow-hidden">
        {loadingRoute ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-[#64748B] font-data z-10">
            Calculating Tactical Vector...
          </div>
        ) : (
          <TacticalMap
            selectedCity={selectedCity} destinationCity={destinationCity}
            routeData={routeData} liveFlights={liveFlights}
            geoData={geoData} forecastData={forecastData} radarRange={radarRange}
          />
        )}

        {/* Left Sidebar — Route Planner */}
        <div className="floating-sidebar">
          <div className="glass-panel p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Crosshair size={14} className="text-[#1E293B]" />
              <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-widest font-trademark">Flight Route Planner</span>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-[9px] text-[#64748B] uppercase font-bold tracking-wider block mb-1">Origin</label>
                <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full bg-[#F8FAFC] text-[#0F172A] text-xs font-bold px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400/40 cursor-pointer">
                  {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex justify-center"><Navigation size={14} className="text-[#94A3B8] rotate-90" /></div>
              <div>
                <label className="text-[9px] text-[#64748B] uppercase font-bold tracking-wider block mb-1">Destination</label>
                <select value={destinationCity} onChange={(e) => setDestinationCity(e.target.value)}
                  className="w-full bg-[#F8FAFC] text-[#0F172A] text-xs font-bold px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400/40 cursor-pointer">
                  {cities.map((c) => <option key={c} value={c} disabled={c === selectedCity}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] px-2 py-1.5 bg-[#F1F5F9] rounded-lg">
              <span className="text-[#64748B]">Direct Distance</span>
              <span className="font-bold text-[#0F172A] font-data">{directDist} km</span>
            </div>

            <AltitudeSlider value={altitudeFL} onChange={setAltitudeFL} />
            <RadarRangeSlider value={radarRange} onChange={setRadarRange} />

            <div className="flex items-center gap-2 text-[10px] text-[#64748B]">
              <Plane size={12} />
              <span><strong className="text-[#0F172A]">{liveFlights.length}</strong> active transponders</span>
            </div>
          </div>
        </div>

        {/* Top-Right — Nowcast Panel */}
        <div className="floating-nowcast">
          <RadarNowcastPanel nowcastData={nowcastData} selectedCity={selectedCity} radarRange={radarRange} />
        </div>

        {/* Bottom Tray — Forecast Scrubber */}
        <div className="floating-bottom-tray">
          <div className="glass-panel overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 cursor-pointer select-none"
              onClick={() => setTrayExpanded(!trayExpanded)}>
              <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-widest font-trademark">
                12-Hour Macro Forecast Timeline
              </span>
              <ChevronUp size={14} className={`text-[#64748B] transition-transform duration-300 ${trayExpanded ? '' : 'rotate-180'}`} />
            </div>

            <div className="tray-content px-4 pb-3" style={{ maxHeight: trayExpanded ? '200px' : '0px' }}>
              <TimeSlider value={timeIndex} onChange={setTimeIndex} max={forecastData?.forecast ? forecastData.forecast.length - 1 : 11} />

              {forecastData?.forecast && (
                <div className="grid grid-cols-6 md:grid-cols-12 gap-1.5 mt-2">
                  {forecastData.forecast.map((hour, idx) => (
                    <div key={idx} onClick={() => setTimeIndex(idx)}
                      className={`p-1.5 rounded-lg text-center cursor-pointer transition-all duration-150 text-[9px] font-data border ${
                        idx === timeIndex
                          ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-sm'
                          : hour.hazard
                            ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#DC2626]'
                            : 'bg-white border-slate-200 text-[#64748B] hover:border-slate-300'
                      }`}>
                      <div className="font-bold">{hour.time}</div>
                      <div>{hour.wind_speed}m/s</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
