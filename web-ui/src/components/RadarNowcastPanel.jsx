import React from 'react';
import { Radio, TrendingUp, TrendingDown, Minus, ShieldAlert, ShieldCheck } from 'lucide-react';

const Indicator = ({ label, value, delta, unit }) => {
  const trend = delta > 0.01 ? 'up' : delta < -0.01 ? 'down' : 'stable';
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? '#DC2626' : trend === 'down' ? '#2563EB' : '#64748B';
  const trendLabel = trend === 'up' ? 'RISING' : trend === 'down' ? 'FALLING' : 'STABLE';

  return (
    <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-[#F8FAFC] border border-slate-100">
      <span className="text-[9px] font-semibold text-[#64748B] uppercase tracking-wider">{label}</span>
      <div className="flex items-end justify-between">
        <span className="text-sm font-bold text-[#0F172A] font-data">{value}<span className="text-[10px] text-[#64748B] ml-0.5">{unit}</span></span>
        <div className="flex items-center gap-1">
          <TrendIcon size={11} style={{ color: trendColor }} />
          <span className="text-[8px] font-bold tracking-wider" style={{ color: trendColor }}>{trendLabel}</span>
        </div>
      </div>
      <span className="text-[9px] font-data text-[#94A3B8]">Δ {delta > 0 ? '+' : ''}{delta}{unit}/hr</span>
    </div>
  );
};

const RadarNowcastPanel = ({ nowcastData, selectedCity, radarRange }) => {
  if (!nowcastData) {
    return (
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <Radio size={14} className="text-[#2563EB]" />
          <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-widest font-trademark">60-Min Active Radar</span>
        </div>
        <div className="skeleton h-24 w-full" />
      </div>
    );
  }

  const isHazard = nowcastData.hazard;
  const StatusIcon = isHazard ? ShieldAlert : ShieldCheck;
  const statusClass = isHazard ? 'status-hazard' : 'status-safe';
  const statusText = isHazard ? nowcastData.hazard_type : 'ALL CLEAR';

  return (
    <div className="glass-panel p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio size={14} className="text-[#2563EB]" />
          <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-widest font-trademark">60-Min Active Radar</span>
        </div>
        <span className="text-[9px] font-data text-[#94A3B8]">{radarRange}km</span>
      </div>

      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${statusClass}`}>
        <StatusIcon size={13} />
        {statusText}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Indicator label="Temperature" value={nowcastData.currentTemp} delta={nowcastData.deltaTemp} unit="°C" />
        <Indicator label="Wind Speed" value={nowcastData.currentWind} delta={nowcastData.deltaWind} unit="m/s" />
        <Indicator label="Precipitation" value={nowcastData.currentPrecip} delta={nowcastData.deltaPrecip} unit="mm" />
        <Indicator label="Humidity" value={nowcastData.currentHumidity} delta={nowcastData.deltaHumidity} unit="%" />
      </div>

      <div className="text-[9px] text-[#94A3B8] text-center font-data">
        Sector: {selectedCity?.toUpperCase()} · Nowcast Window: t → t+60min
      </div>
    </div>
  );
};

export default RadarNowcastPanel;
