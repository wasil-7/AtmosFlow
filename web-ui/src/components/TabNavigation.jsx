import React from 'react';
import { motion } from 'framer-motion';
import { Map, BarChart3, Route, Server, Activity } from 'lucide-react';

const tabs = [
  { id: 0, label: 'Tactical Airspace', icon: Map },
  { id: 1, label: 'Telemetry Analytics', icon: BarChart3 },
  { id: 2, label: 'Route Optimizer', icon: Route },
  { id: 3, label: 'MLOps Status', icon: Server },
];

const TabNavigation = ({ activeTab, setActiveTab }) => (
  <header className="glass-panel px-5 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-sm">
        <Activity className="text-white" size={20} />
      </div>
      <div>
        <h1 className="text-base font-bold tracking-widest text-[#0F172A] uppercase font-trademark leading-tight">
          Weather Alerts System
        </h1>
        <p className="text-[#64748B] text-[10px] tracking-widest uppercase font-trademark">
          Tactical Aviation & Airspace Management — By Wasil
        </p>
      </div>
    </div>

    <nav className="flex items-center gap-1 bg-[#F1F5F9] rounded-xl p-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-colors duration-200 cursor-pointer ${
              isActive ? 'text-[#0F172A]' : 'text-[#94A3B8] hover:text-[#64748B]'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="tab-bg"
                className="absolute inset-0 bg-white rounded-lg shadow-sm border border-slate-200/80"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.45 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </span>
          </button>
        );
      })}
    </nav>
  </header>
);

export default TabNavigation;
