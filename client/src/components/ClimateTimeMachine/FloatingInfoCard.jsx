import React from 'react';
import { Clock, Thermometer, Sun, ShieldCheck, Layers } from 'lucide-react';
import { formatHourLabel, getComfortStatus } from './timeMachineAdapter';

export default function FloatingInfoCard({
  currentHourData = null,
  currentHour = 12,
  optimizedConfig = {},
  comfortSettings = { minComfortTemp: 18, maxComfortTemp: 24 }
}) {
  const hourLabel = formatHourLabel(currentHourData?.timestamp, currentHour);
  const outdoorTemp = currentHourData?.ambientTemperature !== undefined && currentHourData?.ambientTemperature !== null
    ? `${Number(currentHourData.ambientTemperature).toFixed(1)} °C`
    : 'N/A';

  const indoorTemp = currentHourData?.indoorTemperature !== undefined && currentHourData?.indoorTemperature !== null
    ? `${Number(currentHourData.indoorTemperature).toFixed(1)} °C`
    : 'N/A';

  const solarRad = currentHourData?.solarRadiation !== undefined && currentHourData?.solarRadiation !== null
    ? `${Math.round(currentHourData.solarRadiation)} W/m²`
    : (currentHourData?.solarGain !== undefined ? `${Math.round(currentHourData.solarGain)} W (Gain)` : 'N/A');

  const comfortInfo = getComfortStatus(
    currentHourData?.indoorTemperature,
    comfortSettings.minComfortTemp,
    comfortSettings.maxComfortTemp
  );

  const wwrText = optimizedConfig.wwr !== undefined && optimizedConfig.wwr !== null
    ? `${Math.round(optimizedConfig.wwr * 100)}% (${optimizedConfig.windowArea || 'N/A'} m²)`
    : (optimizedConfig.windowArea ? `${optimizedConfig.windowArea} m²` : 'N/A');

  const insThicknessText = optimizedConfig.insulationThickness !== undefined && optimizedConfig.insulationThickness !== null
    ? `${Math.round(optimizedConfig.insulationThickness * 1000)} mm`
    : 'N/A';

  return (
    <div className="bg-slate-950/80 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 text-white shadow-2xl space-y-2.5 max-w-[280px]">
      {/* Header with Hour & Comfort */}
      <div className="flex items-center justify-between border-b border-slate-700/70 pb-2">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-mono font-bold text-sm tracking-wide text-white">{hourLabel}</span>
        </div>
        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${comfortInfo.statusClass}`}>
          {comfortInfo.label}
        </span>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 font-sans block">Outdoor Temp</span>
          <span className="font-bold text-slate-200">{outdoorTemp}</span>
        </div>
        <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
          <span className="text-[10px] text-sky-300 font-sans block">Simulated Indoor</span>
          <span className="font-bold text-sky-400">{indoorTemp}</span>
        </div>
      </div>

      {/* Solar & Envelope Summary */}
      <div className="space-y-1.5 text-[11px] font-mono pt-0.5">
        <div className="flex justify-between items-center text-slate-300">
          <span className="flex items-center gap-1 text-[10px] font-sans text-slate-400">
            <Sun className="w-3 h-3 text-amber-400" /> Solar Irradiance:
          </span>
          <span className="font-bold text-amber-300">{solarRad}</span>
        </div>
        <div className="flex justify-between items-center text-slate-300">
          <span className="flex items-center gap-1 text-[10px] font-sans text-slate-400">
            <Layers className="w-3 h-3 text-indigo-400" /> WWR / Glazing:
          </span>
          <span className="font-bold text-slate-200">{wwrText}</span>
        </div>
        <div className="flex justify-between items-center text-slate-300">
          <span className="flex items-center gap-1 text-[10px] font-sans text-slate-400">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Insulation:
          </span>
          <span className="font-bold text-emerald-400">{insThicknessText}</span>
        </div>
      </div>
    </div>
  );
}
