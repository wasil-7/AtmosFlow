import React, { useMemo } from 'react';
import { Route, AlertTriangle, CheckCircle, ArrowRight, Fuel } from 'lucide-react';
import { cities, allCityCoords, haversineDistance, CITY_CODES } from '../constants';

const RouteOptimizer = ({ routeData, selectedCity, destinationCity, setSelectedCity, setDestinationCity, forecastData }) => {
  const directDist = useMemo(() => {
    if (!allCityCoords[selectedCity] || !allCityCoords[destinationCity]) return 0;
    return haversineDistance(
      allCityCoords[selectedCity][0], allCityCoords[selectedCity][1],
      allCityCoords[destinationCity][0], allCityCoords[destinationCity][1]
    );
  }, [selectedCity, destinationCity]);

  const rerouteDist = useMemo(() => {
    if (!routeData?.waypoints || routeData.waypoints.length < 2) return directDist;
    let total = 0;
    for (let i = 0; i < routeData.waypoints.length - 1; i++) {
      total += haversineDistance(
        routeData.waypoints[i].lat, routeData.waypoints[i].lon,
        routeData.waypoints[i + 1].lat, routeData.waypoints[i + 1].lon
      );
    }
    return total;
  }, [routeData, directDist]);

  const fuelDelta = rerouteDist - directDist;
  const directTime = Math.round(directDist / 850 * 60);
  const rerouteTime = Math.round(rerouteDist / 850 * 60);

  // Risk scores from forecast data
  const riskScores = useMemo(() => {
    if (!forecastData?.forecast) return {};
    const scores = {};
    const waypoints = routeData?.path || [selectedCity, destinationCity];
    waypoints.forEach(city => {
      let score = 0;
      forecastData.forecast.forEach(h => {
        if (h.wind_speed >= 10) score += 4;
        if (h.temperature >= 45) score += 3;
        if (h.precipitation >= 5) score += 3;
      });
      scores[city] = Math.min(100, score);
    });
    return scores;
  }, [forecastData, routeData, selectedCity, destinationCity]);

  const getRiskClass = (score) => score > 60 ? 'risk-high' : score > 30 ? 'risk-med' : 'risk-low';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-panel px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Route size={16} className="text-[#1E293B]" />
          <span className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider font-trademark">
            Route Optimizer — {selectedCity} to {destinationCity}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}
            className="bg-[#F8FAFC] text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer">
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ArrowRight size={14} className="text-[#94A3B8]" />
          <select value={destinationCity} onChange={(e) => setDestinationCity(e.target.value)}
            className="bg-[#F8FAFC] text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer">
            {cities.map(c => <option key={c} value={c} disabled={c === selectedCity}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Route Comparison Table */}
        <div className="lg:col-span-2 glass-panel p-5">
          <h3 className="text-[10px] font-semibold text-[#64748B] uppercase tracking-widest font-trademark mb-4">Route Comparison Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200">
                  {['Route', 'Status', 'Path', 'Distance', 'Est. Time', 'Fuel Index'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-[10px] text-[#64748B] uppercase tracking-wider font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-3 font-bold text-[#0F172A]">Direct</td>
                  <td className="py-3 px-3">
                    {routeData?.hazard_detected
                      ? <span className="status-hazard text-[9px] font-bold px-2 py-0.5 rounded-full">BLOCKED</span>
                      : <span className="status-safe text-[9px] font-bold px-2 py-0.5 rounded-full">CLEAR</span>}
                  </td>
                  <td className="py-3 px-3 font-data text-[#64748B]">{selectedCity} → {destinationCity}</td>
                  <td className="py-3 px-3 font-data font-bold">{directDist} km</td>
                  <td className="py-3 px-3 font-data">{directTime} min</td>
                  <td className="py-3 px-3 font-data">1.00×</td>
                </tr>
                {routeData?.hazard_detected && (
                  <tr className="bg-[#ECFDF5]/50">
                    <td className="py-3 px-3 font-bold text-[#059669]">Evasion</td>
                    <td className="py-3 px-3"><span className="status-safe text-[9px] font-bold px-2 py-0.5 rounded-full">SAFE</span></td>
                    <td className="py-3 px-3 font-data text-[#0F172A] font-bold">{routeData.path?.join(' → ')}</td>
                    <td className="py-3 px-3 font-data font-bold">{rerouteDist} km</td>
                    <td className="py-3 px-3 font-data">{rerouteTime} min</td>
                    <td className="py-3 px-3 font-data">{(rerouteDist / Math.max(directDist, 1)).toFixed(2)}×</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fuel Delta Card */}
        <div className="glass-panel p-5 flex flex-col justify-between">
          <h3 className="text-[10px] font-semibold text-[#64748B] uppercase tracking-widest font-trademark mb-4">Fuel & Time Delta</h3>
          <div className="space-y-4">
            <div className="text-center p-4 rounded-xl bg-[#F8FAFC]">
              <Fuel size={20} className="mx-auto mb-2 text-[#64748B]" />
              <div className="text-2xl font-bold font-data text-[#0F172A]">
                {fuelDelta > 0 ? '+' : ''}{fuelDelta} km
              </div>
              <div className="text-[10px] text-[#64748B] mt-1">Distance Overhead</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-[#F8FAFC]">
              <div className="text-2xl font-bold font-data text-[#0F172A]">
                {fuelDelta > 0 ? '+' : ''}{rerouteTime - directTime} min
              </div>
              <div className="text-[10px] text-[#64748B] mt-1">Time Overhead</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sector Risk Matrix */}
      <div className="glass-panel p-5">
        <h3 className="text-[10px] font-semibold text-[#64748B] uppercase tracking-widest font-trademark mb-4">Sector Risk Index (0–100)</h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
          {(routeData?.path || [selectedCity, destinationCity]).map(city => (
            <div key={city} className={`risk-cell ${getRiskClass(riskScores[city] || 0)}`}>
              <span className="font-bold text-[11px]">{CITY_CODES[city] || city}</span>
              <span className="text-lg font-bold font-data">{riskScores[city] || 0}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RouteOptimizer;
