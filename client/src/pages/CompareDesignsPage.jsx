import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { GitCompare, Trophy, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

export default function CompareDesignsPage() {
  const [simulations, setSimulations] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    async function loadSims() {
      try {
        const res = await api.get('/simulation/user/history');
        const list = res.data || [];
        setSimulations(list);
        if (list.length >= 2) {
          setSelectedIds([list[0]._id, list[1]._id]);
        } else if (list.length > 0) {
          setSelectedIds([list[0]._id]);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadSims();
  }, []);

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectedSims = simulations.filter(s => selectedIds.includes(s._id));

  // Rank designs by comfort percentage
  const rankedSims = [...selectedSims].sort((a, b) => (b.results?.metrics?.comfortPercentage || 0) - (a.results?.metrics?.comfortPercentage || 0));

  return (
    <div className="space-y-6">
      <div className="card-clean p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Shelter Design Comparison</h1>
          <p className="text-xs text-slate-500">Compare thermal performance, heat loss, and passive comfort across multiple configurations</p>
        </div>
      </div>

      {/* Select Simulations to Compare */}
      <div className="card-clean">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Select Designs to Compare</h2>
        <div className="flex flex-wrap gap-3">
          {simulations.map((sim) => (
            <button
              key={sim._id}
              onClick={() => toggleSelect(sim._id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                selectedIds.includes(sim._id)
                  ? 'bg-sky-50 border-sky-600 text-sky-800 ring-1 ring-sky-300'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {sim.name}
            </button>
          ))}
        </div>
      </div>

      {/* Performance Ranking */}
      {rankedSims.length > 0 && (
        <div className="card-clean border-t-4 border-t-sky-600">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-amber-500" /> Thermal Performance Ranking
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rankedSims.map((sim, idx) => (
              <div key={sim._id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative">
                <span className={`absolute top-3 right-3 text-xs font-extrabold px-2 py-0.5 rounded ${
                  idx === 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-200 text-slate-700'
                }`}>
                  Rank #{idx + 1}
                </span>
                <p className="text-xs font-bold text-slate-800">{sim.name}</p>
                <p className="text-[11px] text-slate-500">{sim.shelter?.name}</p>
                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Comfort Factor:</span>
                    <span className="font-bold text-emerald-700">{sim.results?.metrics?.comfortPercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Avg Indoor Temp:</span>
                    <span className="font-bold text-sky-700">{sim.results?.metrics?.avgIndoorTemp}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Heat Loss:</span>
                    <span className="font-bold text-red-600">{sim.results?.metrics?.totalHeatLoss} kWh</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison Table */}
      {selectedSims.length > 0 && (
        <div className="card-clean overflow-hidden p-0">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <th className="p-3.5">Parameter / Metric</th>
                {selectedSims.map(s => (
                  <th key={s._id} className="p-3.5 font-bold text-slate-800">{s.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-3.5 font-semibold text-slate-600 bg-slate-50/50">Wall Material</td>
                {selectedSims.map(s => (
                  <td key={s._id} className="p-3.5">{s.shelter?.materials?.wallMaterial?.name}</td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-slate-600 bg-slate-50/50">Roof Material</td>
                {selectedSims.map(s => (
                  <td key={s._id} className="p-3.5">{s.shelter?.materials?.roofMaterial?.name}</td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-slate-600 bg-slate-50/50">Orientation</td>
                {selectedSims.map(s => (
                  <td key={s._id} className="p-3.5">{s.shelter?.design?.orientation}° (South)</td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-slate-600 bg-slate-50/50">Avg Indoor Temp (°C)</td>
                {selectedSims.map(s => (
                  <td key={s._id} className="p-3.5 font-bold text-sky-700">{s.results?.metrics?.avgIndoorTemp}°C</td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-slate-600 bg-slate-50/50">Total Heat Loss (kWh)</td>
                {selectedSims.map(s => (
                  <td key={s._id} className="p-3.5 font-bold text-red-600">{s.results?.metrics?.totalHeatLoss} kWh</td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-slate-600 bg-slate-50/50">Total Solar Gain (kWh)</td>
                {selectedSims.map(s => (
                  <td key={s._id} className="p-3.5 font-bold text-amber-600">{s.results?.metrics?.totalSolarGain} kWh</td>
                ))}
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-slate-600 bg-slate-50/50">Comfort Index (%)</td>
                {selectedSims.map(s => (
                  <td key={s._id} className="p-3.5 font-bold text-emerald-700">{s.results?.metrics?.comfortPercentage}%</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
