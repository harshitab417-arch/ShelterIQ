import React, { useEffect } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { formatHourLabel } from './timeMachineAdapter';

export default function SimulationTimeline({
  timeSeries = [],
  currentHourIndex = 0,
  onSelectHour,
  isPlaying = false,
  onTogglePlay,
  onResetToNoon
}) {
  const count = timeSeries.length > 0 ? timeSeries.length : 24;

  // Auto-advance playback loop (1 hour every ~1.2s)
  useEffect(() => {
    let interval = null;
    if (isPlaying && count > 0) {
      interval = setInterval(() => {
        onSelectHour((prev) => (prev + 1) % count);
      }, 1200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, count, onSelectHour]);

  const handleStepBack = () => {
    onSelectHour((prev) => (prev - 1 + count) % count);
  };

  const handleStepForward = () => {
    onSelectHour((prev) => (prev + 1) % count);
  };

  const currentPoint = timeSeries[currentHourIndex] || null;
  const currentLabel = formatHourLabel(currentPoint?.timestamp, currentHourIndex);

  // Derive tick indices (e.g., every 3 hours: 0, 3, 6, 9, 12, 15, 18, 21, 23)
  const ticks = [];
  for (let i = 0; i < count; i += Math.max(1, Math.floor(count / 8))) {
    ticks.push(i);
  }
  if (!ticks.includes(count - 1)) {
    ticks.push(count - 1);
  }

  // Find min/max for sparkline scaling
  const outdoorTemps = timeSeries.map((d) => (d.ambientTemperature !== undefined ? d.ambientTemperature : null)).filter((v) => v !== null);
  const indoorTemps = timeSeries.map((d) => (d.indoorTemperature !== undefined ? d.indoorTemperature : null)).filter((v) => v !== null);
  const solarGains = timeSeries.map((d) => (d.solarGain !== undefined ? d.solarGain : (d.solarRadiation !== undefined ? d.solarRadiation : 0)));

  const allTemps = [...outdoorTemps, ...indoorTemps];
  const minT = allTemps.length > 0 ? Math.min(...allTemps) - 2 : -10;
  const maxT = allTemps.length > 0 ? Math.max(...allTemps) + 2 : 25;
  const tempRange = Math.max(1, maxT - minT);

  const maxSolar = solarGains.length > 0 ? Math.max(...solarGains, 100) : 1000;

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 shadow-xl text-white space-y-3">
      {/* Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <button
            onClick={handleStepBack}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Step Back 1 Hour"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onTogglePlay}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-900/40'
                : 'bg-sky-600 hover:bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-900/40'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Play 24h'}</span>
          </button>
          <button
            onClick={handleStepForward}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Step Forward 1 Hour"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {onResetToNoon && (
            <button
              onClick={onResetToNoon}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition"
              title="Jump to Solar Noon (12:00)"
            >
              <RotateCcw className="w-3 h-3" />
              <span>12:00</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700">
            <span className="text-[11px] font-sans text-slate-400">Simulation Hour:</span>
            <span className="font-bold text-sky-400 text-sm">{currentLabel}</span>
          </div>

          {/* Mini Legend for traces */}
          <div className="hidden sm:flex items-center gap-3 text-[10px]">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-slate-400 rounded"></span>
              <span className="text-slate-400">Outdoor T</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-sky-400 rounded"></span>
              <span className="text-sky-300 font-semibold">Indoor T</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-amber-400 rounded"></span>
              <span className="text-amber-300">Solar Gain</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mini 24h Temperature & Solar Traces */}
      {timeSeries.length > 1 && (
        <div className="relative h-12 w-full bg-slate-950/60 rounded-lg overflow-hidden border border-slate-800/80 px-1 py-1">
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox={`0 0 ${count - 1} 100`}>
            {/* Solar Gain Fill Area */}
            <path
              d={timeSeries.reduce((acc, d, i) => {
                const s = d.solarGain || d.solarRadiation || 0;
                const y = 100 - (s / maxSolar) * 80;
                return `${acc} ${i === 0 ? 'M' : 'L'} ${i} ${y}`;
              }, '') + ` L ${count - 1} 100 L 0 100 Z`}
              fill="rgba(245, 158, 11, 0.15)"
            />

            {/* Outdoor Temp Line (Slate/White) */}
            <path
              d={timeSeries.reduce((acc, d, i) => {
                const t = d.ambientTemperature !== undefined ? d.ambientTemperature : minT;
                const y = 100 - ((t - minT) / tempRange) * 85;
                return `${acc} ${i === 0 ? 'M' : 'L'} ${i} ${y}`;
              }, '')}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />

            {/* Indoor Temp Line (Sky Blue) */}
            <path
              d={timeSeries.reduce((acc, d, i) => {
                const t = d.indoorTemperature !== undefined ? d.indoorTemperature : minT;
                const y = 100 - ((t - minT) / tempRange) * 85;
                return `${acc} ${i === 0 ? 'M' : 'L'} ${i} ${y}`;
              }, '')}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
            />

            {/* Current Hour Indicator Marker Line */}
            <line
              x1={currentHourIndex}
              y1="0"
              x2={currentHourIndex}
              y2="100"
              stroke="#f59e0b"
              strokeWidth="1.5"
            />
            {/* Marker Circle */}
            <circle
              cx={currentHourIndex}
              cy={
                currentPoint?.indoorTemperature !== undefined
                  ? 100 - ((currentPoint.indoorTemperature - minT) / tempRange) * 85
                  : 50
              }
              r="3"
              fill="#f59e0b"
              stroke="#ffffff"
              strokeWidth="1"
            />
          </svg>
        </div>
      )}

      {/* Scrubber Range Slider & Ticks */}
      <div className="space-y-1.5">
        <input
          type="range"
          min="0"
          max={count - 1}
          value={currentHourIndex}
          onChange={(e) => onSelectHour(Number(e.target.value))}
          className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-400 transition"
        />

        {/* Dynamic Hour Ticks */}
        <div className="flex justify-between text-[10px] font-mono text-slate-400 px-0.5">
          {ticks.map((idx) => {
            const pt = timeSeries[idx];
            const lbl = formatHourLabel(pt?.timestamp, idx);
            const isSelected = idx === currentHourIndex;
            return (
              <button
                key={`tick-${idx}`}
                onClick={() => onSelectHour(idx)}
                className={`transition-colors ${
                  isSelected ? 'font-bold text-amber-300 underline' : 'hover:text-white text-slate-400'
                }`}
              >
                {lbl}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
