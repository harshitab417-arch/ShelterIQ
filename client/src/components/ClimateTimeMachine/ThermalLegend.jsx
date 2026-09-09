import React from 'react';
import { Flame, ArrowUpRight, Sun, Info } from 'lucide-react';

export default function ThermalLegend({ viewMode, flowDirection = 'OUTWARD' }) {
  if (viewMode === 'normal') {
    return (
      <div className="bg-slate-900/85 backdrop-blur border border-slate-700/70 p-2.5 rounded-lg text-white text-[11px] font-sans shadow-lg max-w-xs space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-sky-300">
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span>Physical Environment & Solar Vector</span>
        </div>
        <p className="text-[10px] text-slate-300 leading-tight">
          Visualizes true physical geometry, window/door placements, Cardinal orientation, and diurnal sun vector response.
        </p>
      </div>
    );
  }

  if (viewMode === 'thermal') {
    return (
      <div className="bg-slate-900/90 backdrop-blur border border-slate-700/80 p-3 rounded-xl text-white text-[11px] font-sans shadow-xl max-w-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-amber-300">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Thermal Performance Map</span>
          </div>
          <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
            24h Loss Share
          </span>
        </div>

        {/* Gradient Colormap Bar */}
        <div className="space-y-1">
          <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-blue-700 via-sky-500 via-emerald-500 via-amber-400 to-red-600 shadow-inner"></div>
          <div className="flex justify-between text-[9px] font-mono font-bold text-slate-300">
            <span>LOW LOSS</span>
            <span>MODERATE</span>
            <span className="text-red-400">HIGH LOSS</span>
          </div>
        </div>

        {/* Explicit scientific disclaimer */}
        <div className="p-1.5 bg-slate-800/80 rounded border border-slate-700/60 text-[9px] text-slate-300 flex items-start gap-1">
          <Info className="w-3 h-3 text-sky-400 shrink-0 mt-0.5" />
          <span>Colors represent relative conductive heat-transfer contribution, not surface temperature.</span>
        </div>
      </div>
    );
  }

  if (viewMode === 'heatflow') {
    return (
      <div className="bg-slate-900/90 backdrop-blur border border-slate-700/80 p-3 rounded-xl text-white text-[11px] font-sans shadow-xl max-w-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-sky-300">
            <ArrowUpRight className="w-4 h-4 text-sky-400" />
            <span>Heat Flow / X-Ray Pathways</span>
          </div>
          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
            flowDirection === 'OUTWARD'
              ? 'bg-red-950/80 text-red-300 border-red-800'
              : 'bg-amber-950/80 text-amber-300 border-amber-800'
          }`}>
            {flowDirection === 'OUTWARD' ? 'Inside → Outside (Loss)' : 'Outside → Inside (Gain)'}
          </span>
        </div>

        <div className="space-y-1 text-[10px] text-slate-300 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-red-500 rounded"></span>
            <span>Arrow Direction: Conductive heat transfer</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1.5 bg-amber-400 rounded"></span>
            <span>Arrow Thickness: Relative heat magnitude</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-amber-300 rounded"></span>
            <span>Golden Ray: Passive solar irradiance</span>
          </div>
        </div>

        <p className="text-[9px] text-slate-400 leading-tight">
          Magnitude scaled from real component heat losses. Normalized magnitude has no physical unit.
        </p>
      </div>
    );
  }

  return null;
}
