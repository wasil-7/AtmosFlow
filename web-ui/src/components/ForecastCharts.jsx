import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3, AlertTriangle } from 'lucide-react';
import { cities } from '../constants';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel p-3 text-[10px] min-w-[140px]" style={{background:'rgba(255,255,255,0.95)'}}>
      <p className="font-bold text-[#0F172A] mb-1 font-data">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex justify-between gap-3">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-bold font-data">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const ChartPanel = ({ title, data, dataKey, color, unit, secondaryKeys }) => (
  <div className="glass-panel p-4 flex flex-col h-[320px]">
    <h3 className="text-[10px] font-semibold text-[#64748B] uppercase tracking-widest font-trademark mb-3">{title}</h3>
    <div className="flex-1">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="time" stroke="#94A3B8" tick={{ fill: '#64748B', fontSize: 9 }} />
          <YAxis stroke="#94A3B8" tick={{ fill: '#64748B', fontSize: 9 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 2.5, fill: color }} name={`XGBoost ${title}`} />
          {secondaryKeys?.map((sk) => (
            <Line key={sk.key} type="monotone" dataKey={sk.key} stroke={sk.color} strokeWidth={1.5} strokeDasharray={sk.dash} dot={false} name={sk.name} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const ForecastCharts = ({ forecastData, selectedCity, setSelectedCity, loadingForecast, error }) => {
  const [showBenchmarks, setShowBenchmarks] = useState(true);

  const chartData = useMemo(() => {
    if (!forecastData?.forecast) return [];
    return forecastData.forecast.map((h) => ({
      ...h,
      tft_wind: +(h.wind_speed * (1 + Math.sin(parseInt(h.time) * 0.5) * 0.12)).toFixed(2),
      tft_temp: +(h.temperature + Math.cos(parseInt(h.time) * 0.3) * 1.2).toFixed(1),
      tft_humidity: +(h.humidity + Math.sin(parseInt(h.time) * 0.4) * 2.5).toFixed(1),
      tft_precip: +Math.max(0, h.precipitation + Math.cos(parseInt(h.time) * 0.6) * 0.3).toFixed(2),
      xgb_wind: +(h.wind_speed * (1 - Math.cos(parseInt(h.time) * 0.7) * 0.08)).toFixed(2),
      xgb_temp: +(h.temperature - Math.sin(parseInt(h.time) * 0.4) * 1.8).toFixed(1),
      xgb_humidity: +(h.humidity - Math.cos(parseInt(h.time) * 0.5) * 3.0).toFixed(1),
      xgb_precip: +Math.max(0, h.precipitation - Math.sin(parseInt(h.time) * 0.8) * 0.2).toFixed(2),
    }));
  }, [forecastData]);

  const bm = (key, unit) => showBenchmarks ? [
    { key: `tft_${key}`, color: '#2563EB', dash: '6 3', name: 'TFT' },
    { key: `xgb_${key}`, color: '#7C3AED', dash: '3 3', name: 'LSTM' },
  ] : [];

  if (error) return (
    <div className="glass-panel p-8 flex flex-col items-center justify-center gap-3 h-[400px]">
      <AlertTriangle size={32} className="text-[#DC2626]" />
      <span className="text-sm text-[#DC2626] font-data">{error}</span>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="glass-panel px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BarChart3 size={16} className="text-[#1E293B]" />
          <span className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider font-trademark">Multi-Sector Analytics — {selectedCity}</span>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}
            className="bg-[#F8FAFC] text-[#0F172A] text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer">
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <label className="flex items-center gap-2 text-[10px] text-[#64748B] cursor-pointer select-none">
            <input type="checkbox" checked={showBenchmarks} onChange={(e) => setShowBenchmarks(e.target.checked)} className="w-3.5 h-3.5" />
            Benchmarks
          </label>
        </div>
      </div>

      {loadingForecast ? (
        <div className="chart-grid">{[1,2,3,4].map(i => <div key={i} className="skeleton h-[320px]" />)}</div>
      ) : (
        <div className="chart-grid">
          <ChartPanel title="Temperature (°C)" data={chartData} dataKey="temperature" color="#D97706" unit="°C" secondaryKeys={bm('temp','°C')} />
          <ChartPanel title="Wind Speed (m/s)" data={chartData} dataKey="wind_speed" color="#0F172A" unit="m/s" secondaryKeys={bm('wind','m/s')} />
          <ChartPanel title="Humidity (%)" data={chartData} dataKey="humidity" color="#059669" unit="%" secondaryKeys={bm('humidity','%')} />
          <ChartPanel title="Precipitation (mm)" data={chartData} dataKey="precipitation" color="#DC2626" unit="mm" secondaryKeys={bm('precip','mm')} />
        </div>
      )}
      {showBenchmarks && <p className="text-center text-[9px] text-[#94A3B8] font-data">* TFT/LSTM are simulated benchmarks from XGBoost variance offsets</p>}
    </div>
  );
};

export default ForecastCharts;
