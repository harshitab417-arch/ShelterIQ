import React from 'react';
import {
  Flame, Sun, Wind, Thermometer, ShieldCheck,
  Layers, Compass, Info, CheckCircle2
} from 'lucide-react';
import { getComfortStatus, getThermalColor } from './timeMachineAdapter';

export default function ThermalMetricsPanel({
  currentHourData = null,
  currentHour = 12,
  metrics = {},
  componentLosses = {},
  optimizedConfig = {},
  comfortSettings = { minComfortTemp: 18, maxComfortTemp: 24 }
}) {
  const indoorT = currentHourData?.indoorTemperature !== undefined && currentHourData?.indoorTemperature !== null
    ? `${Number(currentHourData.indoorTemperature).toFixed(1)} °C`
    : (metrics.avgIndoorTemp !== undefined ? `${metrics.avgIndoorTemp} °C (24h Avg)` : 'N/A');

  const outdoorT = currentHourData?.ambientTemperature !== undefined && currentHourData?.ambientTemperature !== null
    ? `${Number(currentHourData.ambientTemperature).toFixed(1)} °C`
    : 'N/A';

  const solarRad = currentHourData?.solarRadiation !== undefined && currentHourData?.solarRadiation !== null
    ? `${Math.round(currentHourData.solarRadiation)} W/m²`
    : 'N/A';

  const windSpd = currentHourData?.windSpeed !== undefined && currentHourData?.windSpeed !== null
    ? `${Number(currentHourData.windSpeed).toFixed(1)} m/s`
    : 'N/A';

  const hourlySolarGain = currentHourData?.solarGain !== undefined && currentHourData?.solarGain !== null
    ? `${Math.round(currentHourData.solarGain)} W`
    : 'N/A';

  const hourlyConductionLoss = currentHourData?.conductionLoss !== undefined && currentHourData?.conductionLoss !== null
    ? `${Math.round(currentHourData.conductionLoss)} W`
    : 'N/A';

  const comfortInfo = getComfortStatus(
    currentHourData?.indoorTemperature,
    comfortSettings.minComfortTemp,
    comfortSettings.maxComfortTemp
  );

  const compPct = componentLosses.percentages || {};
  const compNorm = componentLosses.normalized || {};
  const compRaw = componentLosses.raw || {};

  const componentsList = [
    { key: 'roof', label: 'Roof Structure', pct: compPct.roof || 0, norm: compNorm.roof || 0, raw: compRaw.roof },
    { key: 'walls', label: 'Exterior Walls', pct: compPct.walls || 0, norm: compNorm.walls || 0, raw: compRaw.walls },
    { key: 'windows', label: 'Window Glazing', pct: compPct.windows || 0, norm: compNorm.windows || 0, raw: compRaw.windows },
    { key: 'doors', label: 'Doors & Portals', pct: compPct.doors || 0, norm: compNorm.doors || 0, raw: compRaw.doors },
    { key: 'floor', label: 'Floor Foundation', pct: compPct.floor || 0, norm: compNorm.floor || 0, raw: compRaw.floor }
  ];

  // Sort components by highest share of loss
  componentsList.sort((a, b) => b.pct - a.pct);

  const orientDeg = optimizedConfig.orientation !== undefined && optimizedConfig.orientation !== null
    ? `${optimizedConfig.orientation}°`
    : 'N/A';

  const wwrText = optimizedConfig.wwr !== undefined && optimizedConfig.wwr !== null
    ? `${Math.round(optimizedConfig.wwr * 100)}%`
    : (optimizedConfig.windowArea ? `${optimizedConfig.windowArea} m²` : 'N/A');

  const insThicknessText = optimizedConfig.insulationThickness !== undefined && optimizedConfig.insulationThickness !== null
    ? `${Math.round(optimizedConfig.insulationThickness * 1000)} mm`
    : 'N/A';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-5 text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700">
            <Flame className="w-4 h-4 text-sky-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Thermal Performance
            </h3>
            <span className="text-[10px] text-slate-500 block">
              Physics-Calculated Digital Twin Telemetry
            </span>
          </div>
        </div>

        <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${comfortInfo.statusClass}`}>
          {comfortInfo.label}
        </span>
      </div>

      {/* Primary Telemetry Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-sans">
            <Thermometer className="w-3.5 h-3.5 text-slate-400" /> Outdoor Amb:
          </div>
          <span className="text-base font-bold text-slate-800 block mt-0.5">{outdoorT}</span>
        </div>

        <div className="bg-sky-50 p-2.5 rounded-xl border border-sky-200">
          <div className="flex items-center gap-1 text-[10px] text-sky-700 font-sans">
            <Thermometer className="w-3.5 h-3.5 text-sky-500" /> Simulated Indoor:
          </div>
          <span className="text-base font-bold text-sky-800 block mt-0.5">{indoorT}</span>
        </div>
      </div>

      {/* Real Climate Inputs vs Physics Outputs */}
      <div className="space-y-2 text-xs">
        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Real Climate Inputs & Heat Transfers
        </h4>
        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 font-sans block flex items-center gap-1">
              <Sun className="w-3 h-3 text-amber-500" /> Solar Radiation
            </span>
            <span className="font-bold text-slate-800">{solarRad}</span>
          </div>
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 font-sans block flex items-center gap-1">
              <Wind className="w-3 h-3 text-sky-500" /> Wind Speed
            </span>
            <span className="font-bold text-slate-800">{windSpd}</span>
          </div>
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 font-sans block">Instant. Conduction</span>
            <span className="font-bold text-slate-800">{hourlyConductionLoss}</span>
          </div>
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 font-sans block">Instant. Solar Gain</span>
            <span className="font-bold text-amber-600">{hourlySolarGain}</span>
          </div>
        </div>
      </div>

      {/* Envelope Component Contributions */}
      <div className="space-y-2.5 border-t border-slate-100 pt-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-sky-600" /> Component Contributions
          </h4>
          <span className="text-[9px] text-slate-400 font-sans font-medium">Conductive Loss %</span>
        </div>

        <div className="space-y-2 text-xs">
          {componentsList.map((comp) => {
            const barColor = getThermalColor(comp.norm);
            return (
              <div key={comp.key} className="space-y-1">
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <span className="font-sans font-medium text-slate-700">{comp.label}</span>
                  <div className="flex items-center gap-2">
                    {comp.raw !== undefined && (
                      <span className="text-[10px] text-slate-400">({Math.round(comp.raw)} W)</span>
                    )}
                    <span className="font-bold text-slate-900">{comp.pct}%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${comp.pct}%`, backgroundColor: barColor }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-[10px] text-slate-500 font-sans leading-tight">
          <span className="font-semibold text-slate-700 block mb-0.5">24-Hour Conductive Heat-Loss Contribution</span>
          Percentages reflect cumulative conduction heat loss across envelope components. Passive solar gain is reported separately.
        </div>
      </div>

      {/* Winning Parameters Summary */}
      <div className="border-t border-slate-100 pt-3 space-y-2">
        <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Optimized Parameters
        </h4>
        <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-center">
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[9px] text-slate-400 font-sans uppercase block">Orientation</span>
            <span className="font-bold text-slate-800">{orientDeg}</span>
          </div>
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[9px] text-slate-400 font-sans uppercase block">WWR</span>
            <span className="font-bold text-slate-800">{wwrText}</span>
          </div>
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[9px] text-slate-400 font-sans uppercase block">Insulation</span>
            <span className="font-bold text-sky-700">{insThicknessText}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
