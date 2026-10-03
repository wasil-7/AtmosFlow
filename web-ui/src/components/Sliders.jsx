import React from 'react';

export const TimeSlider = ({ value, onChange, max = 11 }) => {
  const progress = (value / max) * 100;
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Forecast Hour</span>
        <span className="text-[10px] font-bold text-[#0F172A] bg-[#F1F5F9] px-2 py-0.5 rounded font-data">t+{value}h</span>
      </div>
      <input type="range" min={0} max={max} step={1} value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="slider-track w-full" style={{ '--progress': `${progress}%` }} />
      <div className="flex justify-between mt-1">
        {Array.from({ length: max + 1 }, (_, i) => (
          <span key={i} className={`text-[8px] ${i === value ? 'text-[#1E293B] font-bold' : 'text-[#CBD5E1]'}`}>{i}</span>
        ))}
      </div>
    </div>
  );
};

export const AltitudeSlider = ({ value, onChange }) => {
  const progress = ((value - 100) / 300) * 100;
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Flight Level</span>
        <span className="text-[10px] font-bold text-[#0F172A] bg-[#F1F5F9] px-2 py-0.5 rounded font-data">FL{value}</span>
      </div>
      <input type="range" min={100} max={400} step={50} value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="slider-track w-full" style={{ '--progress': `${progress}%` }} />
      <div className="flex justify-between mt-1">
        {[100, 200, 300, 400].map((fl) => (
          <span key={fl} className={`text-[8px] ${fl === value ? 'text-[#1E293B] font-bold' : 'text-[#CBD5E1]'}`}>FL{fl}</span>
        ))}
      </div>
    </div>
  );
};

export const RadarRangeSlider = ({ value, onChange }) => {
  const progress = ((value - 30) / 270) * 100;
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Radar Range</span>
        <span className="text-[10px] font-bold text-[#0F172A] bg-[#F1F5F9] px-2 py-0.5 rounded font-data">{value} km</span>
      </div>
      <input type="range" min={30} max={300} step={10} value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="slider-track w-full" style={{ '--progress': `${progress}%` }} />
      <div className="flex justify-between mt-1">
        {[30, 100, 200, 300].map((r) => (
          <span key={r} className={`text-[8px] ${r === value ? 'text-[#1E293B] font-bold' : 'text-[#CBD5E1]'}`}>{r}km</span>
        ))}
      </div>
    </div>
  );
};
