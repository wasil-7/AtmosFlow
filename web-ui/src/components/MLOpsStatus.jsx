import React, { useState, useEffect } from 'react';
import { Server, Wifi, WifiOff, Database, Cpu, Clock, RefreshCw } from 'lucide-react';

const HealthCard = ({ label, url, onResult }) => {
  const [status, setStatus] = useState('CHECKING');
  const [latency, setLatency] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);

  const check = async () => {
    setStatus('CHECKING');
    const start = performance.now();
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const ms = Math.round(performance.now() - start);
      setLatency(ms);
      setStatus(res.ok ? 'ONLINE' : 'DEGRADED');
      setLastCheck(new Date().toLocaleTimeString());
      onResult?.(res.ok ? 'ONLINE' : 'DEGRADED', ms);
    } catch {
      setLatency(null);
      setStatus('OFFLINE');
      setLastCheck(new Date().toLocaleTimeString());
      onResult?.('OFFLINE', null);
    }
  };

  useEffect(() => { check(); const iv = setInterval(check, 30000); return () => clearInterval(iv); }, []);

  const pulseClass = status === 'ONLINE' ? 'pulse-online' : status === 'OFFLINE' ? 'pulse-offline' : 'pulse-standby';
  const StatusIcon = status === 'ONLINE' ? Wifi : WifiOff;

  return (
    <div className="glass-panel p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">{label}</span>
        <div className={pulseClass} />
      </div>
      <div className="flex items-center gap-2">
        <StatusIcon size={16} className={status === 'ONLINE' ? 'text-[#059669]' : 'text-[#DC2626]'} />
        <span className={`text-sm font-bold ${status === 'ONLINE' ? 'text-[#059669]' : status === 'OFFLINE' ? 'text-[#DC2626]' : 'text-[#D97706]'}`}>{status}</span>
      </div>
      {latency !== null && (
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[#64748B]">Latency</span>
          <span className="font-bold font-data text-[#0F172A]">{latency}ms</span>
        </div>
      )}
      <div className="flex items-center justify-between text-[9px] text-[#94A3B8]">
        <span>Last: {lastCheck || '—'}</span>
        <button onClick={check} className="hover:text-[#0F172A] transition-colors cursor-pointer"><RefreshCw size={10} /></button>
      </div>
      <div className="text-[8px] text-[#CBD5E1] font-data truncate">{url}</div>
    </div>
  );
};

const ModelCard = ({ name, status, type, file }) => (
  <div className="glass-panel p-4 space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">{name}</span>
      <div className={status === 'ACTIVE' ? 'pulse-online' : status === 'ARCHIVED' ? 'bg-[#94A3B8] w-2.5 h-2.5 rounded-full' : 'pulse-standby'} />
    </div>
    <div className="flex items-center gap-2">
      <Cpu size={14} className="text-[#1E293B]" />
      <span className={`text-xs font-bold ${status === 'ACTIVE' ? 'text-[#059669]' : status === 'ARCHIVED' ? 'text-[#64748B]' : 'text-[#D97706]'}`}>{status}</span>
    </div>
    <div className="space-y-1 text-[10px]">
      <div className="flex justify-between"><span className="text-[#64748B]">Type</span><span className="font-data text-[#0F172A]">{type}</span></div>
      <div className="flex justify-between"><span className="text-[#64748B]">File</span><span className="font-data text-[#94A3B8] truncate ml-2">{file}</span></div>
    </div>
  </div>
);

const MLOpsStatus = () => {
  const [apiResults, setApiResults] = useState({});

  return (
    <div className="space-y-4">
      <div className="glass-panel px-5 py-3 flex items-center gap-3">
        <Server size={16} className="text-[#1E293B]" />
        <span className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider font-trademark">MLOps Pipeline Status</span>
      </div>

      {/* API Health */}
      <div>
        <h3 className="text-[10px] font-semibold text-[#64748B] uppercase tracking-widest font-trademark mb-3 px-1">API Endpoint Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <HealthCard label="Forecast Engine" url="http://127.0.0.1:8000/predict/Karachi"
            onResult={(s, ms) => setApiResults(p => ({ ...p, forecast: { s, ms } }))} />
          <HealthCard label="Aircraft Radar" url="http://127.0.0.1:8000/aircraft/live"
            onResult={(s, ms) => setApiResults(p => ({ ...p, aircraft: { s, ms } }))} />
          <HealthCard label="Route Calculator" url="http://127.0.0.1:8000/route/Karachi/Lahore"
            onResult={(s, ms) => setApiResults(p => ({ ...p, route: { s, ms } }))} />
        </div>
      </div>

      {/* Model Registry */}
      <div>
        <h3 className="text-[10px] font-semibold text-[#64748B] uppercase tracking-widest font-trademark mb-3 px-1">Model Registry</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ModelCard name="Primary Forecast" status="ACTIVE" type="XGBoost Regressor" file="nastp_xgb_production.pkl" />
          <ModelCard name="LSTM Legacy" status="ARCHIVED" type="LSTM-RNN (Darts)" file="nastp_lstm_5city_model.pt" />
          <ModelCard name="Radar Lag-Corrected" status="STANDBY" type="XGBoost + Lag Features" file="nastp_radar_xgb_lag_corrected.pkl" />
        </div>
      </div>

      {/* System Info */}
      <div className="glass-panel p-5">
        <h3 className="text-[10px] font-semibold text-[#64748B] uppercase tracking-widest font-trademark mb-3">System Configuration</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px]">
          {[
            { label: 'Backend', value: 'FastAPI + Uvicorn', icon: Server },
            { label: 'Cache TTL', value: '600s (Forecast) / 12s (Radar)', icon: Clock },
            { label: 'CORS', value: 'Allow All Origins (*)', icon: Wifi },
            { label: 'Data Source', value: 'Open-Meteo + OpenSky', icon: Database },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-start gap-2 p-3 rounded-lg bg-[#F8FAFC]">
              <Icon size={14} className="text-[#94A3B8] mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-[#64748B] font-semibold uppercase tracking-wider">{label}</div>
                <div className="text-[#0F172A] font-data mt-0.5">{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MLOpsStatus;
