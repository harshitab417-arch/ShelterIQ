import React, { useState, useEffect } from 'react';
import api, { socket } from '../services/api';
import { Cpu, Play, CheckCircle2, Sliders, Zap } from 'lucide-react';

export default function OptimizationPage() {
  const [method, setMethod] = useState('grid'); // 'grid' | 'genetic'
  const [shelters, setShelters] = useState([]);
  const [climates, setClimates] = useState([]);
  const [materials, setMaterials] = useState([]);

  const [selectedShelterId, setSelectedShelterId] = useState('');
  const [selectedClimateId, setSelectedClimateId] = useState('');

  // Configurable Objective Weights
  const [comfortWeight, setComfortWeight] = useState(0.5);
  const [heatLossWeight, setHeatLossWeight] = useState(0.3);
  const [solarGainWeight, setSolarGainWeight] = useState(0.2);

  // GA Params
  const [popSize, setPopSize] = useState(16);
  const [generations, setGenerations] = useState(10);

  // Status & Socket Progress
  const [running, setRunning] = useState(false);
  const [progressData, setProgressData] = useState(null);
  const [optimizationResult, setOptimizationResult] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [sRes, cRes, mRes] = await Promise.all([
          api.get('/shelters'),
          api.get('/climate'),
          api.get('/materials')
        ]);
        setShelters(sRes.data || []);
        if (sRes.data?.length > 0) setSelectedShelterId(sRes.data[0]._id);

        setClimates(cRes.data || []);
        if (cRes.data?.length > 0) setSelectedClimateId(cRes.data[0]._id);

        setMaterials(mRes.data || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadData();

    // Listen to Socket.IO progress
    socket.on('optimization:progress', (data) => {
      setProgressData(data);
    });

    return () => {
      socket.off('optimization:progress');
    };
  }, []);

  const handleStartOptimization = async () => {
    setRunning(true);
    setProgressData(null);
    setOptimizationResult(null);

    const baseShelter = shelters.find(s => s._id === selectedShelterId) || shelters[0];
    const climateDataset = climates.find(c => c._id === selectedClimateId) || climates[0];

    const endpoint = method === 'grid' ? '/optimization/grid' : '/optimization/genetic';
    const payload = {
      baseShelter,
      climateDataset,
      materialsList: materials,
      objectiveWeights: { comfortWeight, heatLossWeight, solarGainWeight },
      popSize: parseInt(popSize),
      generations: parseInt(generations),
      socketId: socket.id
    };

    try {
      const res = await api.post(endpoint, payload);
      setOptimizationResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card-clean p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Shelter Design Optimization</h1>
          <p className="text-xs text-slate-500">
            Multi-variable automated search (Grid Search baseline & Genetic Algorithm) for optimal passive thermal performance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Column */}
        <div className="card-clean space-y-4">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">Optimization Settings</h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Optimization Algorithm</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMethod('grid')}
                className={`py-2 text-xs font-bold rounded-lg border transition ${
                  method === 'grid' ? 'bg-sky-50 border-sky-600 text-sky-700' : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                1. Grid Search
              </button>
              <button
                type="button"
                onClick={() => setMethod('genetic')}
                className={`py-2 text-xs font-bold rounded-lg border transition ${
                  method === 'genetic' ? 'bg-sky-50 border-sky-600 text-sky-700' : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                2. Genetic Algorithm
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Base Shelter Design</label>
            <select value={selectedShelterId} onChange={(e) => setSelectedShelterId(e.target.value)} className="input-clean">
              {shelters.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Climate Profile</label>
            <select value={selectedClimateId} onChange={(e) => setSelectedClimateId(e.target.value)} className="input-clean">
              {climates.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          {/* Configurable Objective Weights Formula */}
          <div className="pt-2 border-t border-slate-200">
            <p className="text-xs font-bold text-slate-700 mb-2">Objective Scoring Formula Weights</p>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-500">Thermal Comfort Weight: {comfortWeight}</span>
                <input type="range" min="0" max="1" step="0.1" value={comfortWeight} onChange={(e) => setComfortWeight(parseFloat(e.target.value))} className="w-full" />
              </div>
              <div>
                <span className="text-slate-500">Heat Loss Penalty Weight: {heatLossWeight}</span>
                <input type="range" min="0" max="1" step="0.1" value={heatLossWeight} onChange={(e) => setHeatLossWeight(parseFloat(e.target.value))} className="w-full" />
              </div>
              <div>
                <span className="text-slate-500">Solar Gain Reward Weight: {solarGainWeight}</span>
                <input type="range" min="0" max="1" step="0.1" value={solarGainWeight} onChange={(e) => setSolarGainWeight(parseFloat(e.target.value))} className="w-full" />
              </div>
            </div>
          </div>

          <button onClick={handleStartOptimization} disabled={running} className="btn-primary w-full py-2.5">
            <Zap className="w-4 h-4" /> {running ? 'Optimizing Space...' : `Run ${method === 'grid' ? 'Grid Search' : 'Genetic Algorithm'}`}
          </button>
        </div>

        {/* Real-time Progress & Results Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Socket.IO Real-time Progress Card */}
          {running && (
            <div className="card-clean border-l-4 border-l-sky-600 bg-sky-50/40">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Real-Time Socket.IO Progress ({progressData?.method || 'Processing'})
              </h3>

              <div className="w-full bg-slate-200 rounded-full h-3 mb-2 overflow-hidden">
                <div
                  className="bg-sky-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progressData?.progressPercent || 5}%` }}
                ></div>
              </div>

              <div className="flex justify-between text-xs text-slate-600 font-medium">
                <span>Progress: {progressData?.progressPercent || 0}%</span>
                <span>Evaluated: {progressData?.evaluatedCount || 0} designs</span>
                <span>Current Best Score: {progressData?.currentBestScore || '--'}</span>
              </div>
            </div>
          )}

          {/* Optimal Candidate Showcase */}
          {optimizationResult && (
            <div className="card-clean border-t-4 border-t-emerald-600">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Best Configuration Found by Search
                </h3>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded">
                  Fitness Score: {optimizationResult.bestCandidate?.fitnessScore}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <p className="text-[11px] text-slate-500">Wall Material</p>
                  <p className="text-xs font-bold text-slate-800">{optimizationResult.bestCandidate?.shelterConfig?.wallMaterialName}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Roof Material</p>
                  <p className="text-xs font-bold text-slate-800">{optimizationResult.bestCandidate?.shelterConfig?.roofMaterialName}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Insulation Thickness</p>
                  <p className="text-xs font-bold text-sky-700">{optimizationResult.bestCandidate?.shelterConfig?.insulationThickness} m</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Orientation</p>
                  <p className="text-xs font-bold text-slate-800">{optimizationResult.bestCandidate?.shelterConfig?.orientation}° (South)</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 mb-2">Top 5 Evaluated Configurations</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead>
                      <tr className="bg-slate-100 font-semibold border-b border-slate-200">
                        <th className="p-2">Rank</th>
                        <th className="p-2">Wall / Roof Material</th>
                        <th className="p-2">Insulation</th>
                        <th className="p-2">Comfort %</th>
                        <th className="p-2">Heat Loss</th>
                        <th className="p-2 text-right">Fitness Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(optimizationResult.topCandidates || []).map((cand) => (
                        <tr key={cand.rank} className="hover:bg-slate-50">
                          <td className="p-2 font-bold text-slate-800">#{cand.rank}</td>
                          <td className="p-2">{cand.shelterConfig?.wallMaterialName} / {cand.shelterConfig?.roofMaterialName}</td>
                          <td className="p-2">{cand.shelterConfig?.insulationThickness}m</td>
                          <td className="p-2 font-semibold text-emerald-700">{cand.comfortPercentage}%</td>
                          <td className="p-2 text-red-600">{cand.totalHeatLoss} kWh</td>
                          <td className="p-2 text-right font-bold text-sky-700">{cand.fitnessScore}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
