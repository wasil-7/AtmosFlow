import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import TabNavigation from './components/TabNavigation';
import Dashboard from './components/Dashboard';
import ForecastCharts from './components/ForecastCharts';
import RouteOptimizer from './components/RouteOptimizer';
import MLOpsStatus from './components/MLOpsStatus';
import { allCityCoords, cities } from './constants';
import './App.css';

/* ── Geo Utilities (unchanged) ── */
const isPointInPolygon = (point, vs) => {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

const isPointInGeoJSON = (lon, lat, geoJson) => {
  if (!geoJson || !geoJson.features) return false;
  for (const feature of geoJson.features) {
    const geom = feature.geometry;
    if (geom.type === 'Polygon') {
      if (isPointInPolygon([lon, lat], geom.coordinates[0])) return true;
    } else if (geom.type === 'MultiPolygon') {
      for (const polygon of geom.coordinates) {
        if (isPointInPolygon([lon, lat], polygon[0])) return true;
      }
    }
  }
  return false;
};

/* ── App Shell ── */
const App = () => {
  /* Existing state — UNCHANGED */
  const [forecastData, setForecastData] = useState(null);
  const [selectedCity, setSelectedCity] = useState('Karachi');
  const [destinationCity, setDestinationCity] = useState('Lahore');
  const [routeData, setRouteData] = useState(null);
  const [liveFlights, setLiveFlights] = useState([]);
  const [loadingForecast, setLoadingForecast] = useState(true);
  const [loadingRoute, setLoadingRoute] = useState(true);
  const [error, setError] = useState(null);
  const [geoData, setGeoData] = useState(null);

  /* New UI-only state */
  const [activeTab, setActiveTab] = useState(0);
  const [timeIndex, setTimeIndex] = useState(0);
  const [altitudeFL, setAltitudeFL] = useState(250);
  const [radarRange, setRadarRange] = useState(150);

  /* ── Existing useEffects — ALL VERBATIM ── */
  useEffect(() => {
    fetch('/pakistan.geojson')
      .then((res) => res.json())
      .then((json) => setGeoData(json))
      .catch((err) => console.warn('Spatial Layer Notice:', err));
  }, []);

  useEffect(() => {
    const fetchForecast = async () => {
      setLoadingForecast(true);
      setError(null);
      try {
        const res = await fetch(`http://127.0.0.1:8000/predict/${selectedCity}`);
        if (!res.ok) throw new Error('AI backend server offline');
        const json = await res.json();
        setForecastData(json);
      } catch (err) {
        setError(`Telemetry Uplink Failed: ${err.message}`);
      } finally {
        setLoadingForecast(false);
      }
    };
    fetchForecast();
  }, [selectedCity]);

  useEffect(() => {
    if (selectedCity === destinationCity) return;
    const fetchRoute = async () => {
      setLoadingRoute(true);
      try {
        const res = await fetch(`http://127.0.0.1:8000/route/${selectedCity}/${destinationCity}`);
        const json = await res.json();
        setRouteData(json);
      } catch (err) {
        setRouteData({ status: "ERROR", path: [selectedCity], message: "Unable to reach routing service." });
      } finally {
        setLoadingRoute(false);
      }
    };
    fetchRoute();
  }, [selectedCity, destinationCity]);

  useEffect(() => {
    const fetchLiveAircraft = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/aircraft/live');
        const json = await res.json();
        if (json.flights && geoData) {
          const filtered = json.flights.filter(flight =>
            isPointInGeoJSON(flight.longitude, flight.latitude, geoData)
          );
          setLiveFlights(filtered);
        } else if (json.flights) {
          setLiveFlights(json.flights);
        } else {
          setLiveFlights([]);
        }
      } catch (err) {
        setLiveFlights([]);
      }
    };

    fetchLiveAircraft();
    const interval = setInterval(fetchLiveAircraft, 10000);
    return () => clearInterval(interval);
  }, [geoData]);

  /* ── Derived: Nowcast derivatives from hourly forecast ── */
  const nowcastData = useMemo(() => {
    if (!forecastData?.forecast || forecastData.forecast.length < 2) return null;
    const f = forecastData.forecast;
    const idx = Math.min(timeIndex, f.length - 2);
    const curr = f[idx];
    const next = f[idx + 1];
    return {
      deltaTemp: +(next.temperature - curr.temperature).toFixed(1),
      deltaWind: +(next.wind_speed - curr.wind_speed).toFixed(2),
      deltaPrecip: +(next.precipitation - curr.precipitation).toFixed(2),
      deltaHumidity: +((next.humidity || 0) - (curr.humidity || 0)).toFixed(1),
      currentTemp: curr.temperature,
      currentWind: curr.wind_speed,
      currentPrecip: curr.precipitation,
      currentHumidity: curr.humidity || 0,
      time: curr.time,
      hazard: curr.hazard,
      hazard_type: curr.hazard_type
    };
  }, [forecastData, timeIndex]);

  /* Reset time index when city changes */
  useEffect(() => { setTimeIndex(0); }, [selectedCity]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Tab Navigation */}
      <div className="p-4 pb-0">
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-4 tab-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 0 && (
              <Dashboard
                selectedCity={selectedCity} setSelectedCity={setSelectedCity}
                destinationCity={destinationCity} setDestinationCity={setDestinationCity}
                routeData={routeData} liveFlights={liveFlights} geoData={geoData}
                forecastData={forecastData} loadingForecast={loadingForecast}
                loadingRoute={loadingRoute} error={error}
                timeIndex={timeIndex} setTimeIndex={setTimeIndex}
                altitudeFL={altitudeFL} setAltitudeFL={setAltitudeFL}
                radarRange={radarRange} setRadarRange={setRadarRange}
                nowcastData={nowcastData}
              />
            )}
            {activeTab === 1 && (
              <ForecastCharts
                forecastData={forecastData} selectedCity={selectedCity}
                setSelectedCity={setSelectedCity} loadingForecast={loadingForecast} error={error}
              />
            )}
            {activeTab === 2 && (
              <RouteOptimizer
                routeData={routeData} selectedCity={selectedCity}
                destinationCity={destinationCity} setSelectedCity={setSelectedCity}
                setDestinationCity={setDestinationCity} forecastData={forecastData}
              />
            )}
            {activeTab === 3 && <MLOpsStatus />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;