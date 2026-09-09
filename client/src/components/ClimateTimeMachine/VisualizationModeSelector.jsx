import React from 'react';
import { Eye, Flame, Activity } from 'lucide-react';

export default function VisualizationModeSelector({ viewMode, onChangeViewMode }) {
  const modes = [
    {
      id: 'normal',
      label: 'Normal View',
      icon: Eye,
      description: 'Realistic architectural rendering & diurnal solar illumination'
    },
    {
      id: 'thermal',
      label: 'Thermal Performance',
      icon: Flame,
      description: 'Thermal loss map derived from envelope conduction breakdown'
    },
    {
      id: 'heatflow',
      label: 'Heat Flow / X-Ray',
      icon: Activity,
      description: 'Semi-transparent envelope with animated heat transfer pathways'
    }
  ];

  return (
    <div className="bg-slate-900/90 backdrop-blur p-1.5 rounded-xl border border-slate-700/80 inline-flex flex-wrap sm:flex-nowrap gap-1 shadow-md">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = viewMode === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => onChangeViewMode(mode.id)}
            title={mode.description}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all duration-200 ${
              isActive
                ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-900/40 border border-sky-400/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
            <span>{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}
