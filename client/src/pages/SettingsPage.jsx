import React, { useState } from 'react';
import { Sliders, Save, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
  const [minComfort, setMinComfort] = useState('18');
  const [maxComfort, setMaxComfort] = useState('24');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="card-clean p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">System Preferences & Settings</h1>
          <p className="text-xs text-slate-500">Configure global physical constants, thermal comfort bounds, and API keys</p>
        </div>
      </div>

      {saved && <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg">Settings saved successfully.</div>}

      <form onSubmit={handleSave} className="card-clean space-y-6">
        <div>
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 mb-3">Thermal Comfort Standard Bounds</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Minimum Comfort Temperature (°C)</label>
              <input type="number" value={minComfort} onChange={(e) => setMinComfort(e.target.value)} className="input-clean" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Maximum Comfort Temperature (°C)</label>
              <input type="number" value={maxComfort} onChange={(e) => setMaxComfort(e.target.value)} className="input-clean" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Comfort percentage is evaluated as the proportion of timesteps where indoor temperature falls strictly within this configurable range.
          </p>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-200">
          <button type="submit" className="btn-primary">
            <Save className="w-4 h-4" /> Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
