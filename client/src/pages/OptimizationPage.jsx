import React, { useState, useEffect } from 'react';
import api, { socket } from '../services/api';
import {
  Cpu, Play, CheckCircle2, Sliders, Zap, Info, ShieldAlert, Lock,
  ArrowRight, Activity, Flame, Snowflake, AlertTriangle, Layers, BarChart2, Eye
} from 'lucide-react';
import Shelter3DViewer from '../three/Shelter3DViewer';
import OptimizedDesignVisualization from '../components/ClimateTimeMachine/OptimizedDesignVisualization';

export default function OptimizationPage() {
  const [simulations, setSimulations] = useState([]);
  const [selectedSimulationId, setSelectedSimulationId] = useState('');
  const [activeTab, setActiveTab] = useState('optimization'); // 'optimization' | 'stresstest' | '3d'
  const [showScoreModal, setShowScoreModal] = useState(false);

  // Stage 1: Design Optimization States
  const [runningOpt, setRunningOpt] = useState(false);
  const [optProgress, setOptProgress] = useState(null);
  const [optResult, setOptResult] = useState(null);

  // Stage 2: Stress Test States
  const [runningStress, setRunningStress] = useState(false);
  const [stressResult, setStressResult] = useState(null);
  const [stressError, setStressError] = useState(null);

  useEffect(() => {
    async function loadSimulations() {
      try {
        const res = await api.get('/simulation/user/history');
        const list = res.data || [];
        setSimulations(list);
        if (list.length > 0) {
          const latest = list[0];
          setSelectedSimulationId(latest._id);
          if (latest.designOptimization) setOptResult(latest.designOptimization);
          if (latest.stressTest) setStressResult(latest.stressTest);
        }
      } catch (err) {
        console.error('Error loading simulation history:', err);
      }
    }
    loadSimulations();

    socket.on('optimization:progress', (data) => {
      setOptProgress(data);
    });

    return () => {
      socket.off('optimization:progress');
    };
  }, []);

  const currentSim = simulations.find(s => s._id === selectedSimulationId) || simulations[0];

  const handleSimulationChange = (id) => {
    setSelectedSimulationId(id);
    const selected = simulations.find(s => s._id === id);
    setOptResult(selected?.designOptimization || null);
    setStressResult(selected?.stressTest || null);
    setStressError(null);
    setOptProgress(null);
  };

  // Run Stage 1: Climate-Adaptive Design Optimization
  const handleRunOptimization = async () => {
    if (!currentSim) return;
    setRunningOpt(true);
    setOptProgress(null);

    try {
      const res = await api.post('/optimization/climate-adaptive', {
        simulationId: currentSim._id,
        socketId: socket.id
      });
      setOptResult(res.data);
      // Update local simulation cache
      setSimulations(prev => prev.map(s => s._id === currentSim._id ? { ...s, designOptimization: res.data } : s));
    } catch (err) {
      console.error('Optimization error:', err);
    } finally {
      setRunningOpt(false);
    }
  };

  // Run Stage 2: Extreme Climate Resilience Test
  const handleRunStressTest = async () => {
    if (!currentSim) return;
    setRunningStress(true);
    setStressError(null);

    console.log('[Feature 3] Stress test clicked');
    console.log('[Feature 3] simulationId', currentSim._id);
    console.log('[Feature 3] designOptimization', currentSim.designOptimization || optResult);
    console.log('[Feature 3] optResult winner', optResult?.winner?.config);

    try {
      const payload = { simulationId: currentSim._id };
      console.log('[Feature 3] Stress request payload:', payload);

      const res = await api.post('/optimization/stress-test', payload);
      console.log('[Feature 3] Stress test response:', res.data);
      setStressResult(res.data);
      // Update local simulation cache
      setSimulations(prev => prev.map(s => s._id === currentSim._id ? { ...s, stressTest: res.data, designOptimization: s.designOptimization || optResult } : s));
    } catch (err) {
      console.error('[Feature 3] Stress test error full:', err);
      const errMsg = err?.response?.data?.error || err?.message || 'Unknown error occurred during stress test.';
      console.error('[Feature 3] Stress test error message:', errMsg);
      setStressError(errMsg);
    } finally {
      setRunningStress(false);
    }
  };

  // Derived metadata from inherited simulation
  const inheritedShelter = currentSim?.shelter || {};
  const inheritedClimate = currentSim?.climateDataset || {};
  const inheritedMaterials = inheritedShelter?.materials || {};
  const winningWall = inheritedMaterials?.wallMaterial?.name || 'Straw-Clay Composite';
  const winningIns = inheritedMaterials?.insulationMaterial?.name || 'PUF Insulation';
  const winningRoof = inheritedMaterials?.roofMaterial?.name || 'Sandwich PUF Roof';
  const winningGlazing = inheritedMaterials?.windowMaterial?.name || 'Double Low-E Glazing';
  const shape = (currentSim?.shape || inheritedShelter?.shape || 'rectangle').toLowerCase();

  // Dynamic candidate count calculation
  const validThicknesses = inheritedMaterials?.insulationMaterial?.validThicknesses || [inheritedMaterials?.insulationMaterial?.thicknessDefault || 0.10];
  const thicknessCount = validThicknesses.length;
  const orientationCount = 8;
  const isWWRSupported = shape !== 'dome';
  const wwrCount = isWWRSupported ? 4 : 1;
  const dynamicCandidateCount = orientationCount * wwrCount * thicknessCount;

  return (
    <div className="space-y-6">
      {/* Header Banner & Simulation Selector */}
      <div className="card-clean p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white rounded-2xl shadow-lg border border-slate-700">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-6 h-6 text-sky-400" />
            <h1 className="text-2xl font-display font-bold text-white">Climate-Adaptive & Stress Resilience Hub</h1>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Stage 2: Design Parameter Optimization | Stage 3: Extreme Climate Stress Testing (Physics Solver Engine)
          </p>
        </div>

        {simulations.length > 0 && (
          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 w-full md:w-auto">
            <label className="block text-[11px] font-bold text-sky-300 uppercase tracking-wider mb-1">
              Inherited Thermal Simulation
            </label>
            <select
              value={selectedSimulationId}
              onChange={(e) => handleSimulationChange(e.target.value)}
              className="bg-slate-900 border border-slate-600 text-white text-xs font-semibold rounded-lg px-3 py-1.5 w-full focus:ring-2 focus:ring-sky-500"
            >
              {simulations.map(s => (
                <option key={s._id} value={s._id}>
                  {s.name || `Simulation ${s._id.slice(-6)}`} — {s.shape?.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('optimization')}
          className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'optimization'
              ? 'border-sky-600 text-sky-700 bg-sky-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" /> Feature 2: Climate-Adaptive Design Optimization
        </button>
        <button
          onClick={() => setActiveTab('stresstest')}
          className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'stresstest'
              ? 'border-red-600 text-red-700 bg-red-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> Feature 3: Extreme Climate Resilience Test
        </button>
        <button
          onClick={() => setActiveTab('3d')}
          className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
            activeTab === '3d'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Eye className="w-4 h-4" /> View Optimized Design in 3D
        </button>
      </div>

      {/* STAGE 1: FEATURE 2 — CLIMATE-ADAPTIVE DESIGN OPTIMIZATION */}
      {activeTab === 'optimization' && (
        <div className="space-y-6">
          {/* Inherited Winner Material Assembly Card (Read-Only) */}
          <div className="card-clean border-l-4 border-l-sky-600 bg-sky-50/40 p-5">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Winning Material Assembly
                </h3>
              </div>
              <span className="text-[11px] font-bold bg-sky-100 text-sky-800 px-2.5 py-1 rounded-full border border-sky-200">
                Automatically inherited from Thermal Simulation
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-[11px]">
              <div className="bg-white p-2.5 rounded-lg border border-sky-100">
                <span className="text-[10px] text-slate-400 block font-sans uppercase">Wall Material</span>
                <span className="font-bold text-slate-800">{winningWall}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-sky-100">
                <span className="text-[10px] text-slate-400 block font-sans uppercase">Wall Insulation</span>
                <span className="font-bold text-sky-700">{winningIns}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-sky-100">
                <span className="text-[10px] text-slate-400 block font-sans uppercase">Roof Structure</span>
                <span className="font-bold text-slate-800">{winningRoof}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-sky-100">
                <span className="text-[10px] text-slate-400 block font-sans uppercase">Glazing Windows</span>
                <span className="font-bold text-slate-800">{winningGlazing}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-sky-100">
                <span className="text-[10px] text-slate-400 block font-sans uppercase">Shelter Archetype</span>
                <span className="font-bold text-slate-800 uppercase">{shape}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-sky-100">
                <span className="text-[10px] text-slate-400 block font-sans uppercase">Climate Location</span>
                <span className="font-bold text-slate-800 truncate block">{inheritedClimate.name || 'High-Altitude'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Optimization Controls & Search Space */}
            <div className="card-clean space-y-4">
              <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">
                Design Search Space (Fixed Materials)
              </h2>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2 font-mono">
                <div className="flex justify-between border-b pb-1 text-slate-600 font-sans">
                  <span>Permitted Variable</span>
                  <span className="font-bold">Search Space</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Orientations:</span>
                  <span className="font-bold text-slate-800">8 Cardinal (0° to 315°)</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>WWR Options:</span>
                  <span className="font-bold text-slate-800">
                    {isWWRSupported ? '4 Ratios (10%, 15%, 20%, 25%)' : 'Fixed — N/A for Dome'}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Wall Insulation Thickness:</span>
                  <span className="font-bold text-sky-700">
                    {thicknessCount} Options ({validThicknesses.map(t => `${Math.round(t*1000)}mm`).join(', ')})
                  </span>
                </div>
              </div>

              {!isWWRSupported && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0 text-amber-600" />
                  WWR optimization is unavailable for this shelter archetype.
                </div>
              )}

              {/* Dynamic Candidate Count Display */}
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-center">
                <span className="text-[11px] text-slate-500 font-semibold block uppercase">Total Variants Evaluated</span>
                <span className="text-2xl font-bold font-mono text-sky-800">{dynamicCandidateCount} Candidate Variants</span>
                <span className="text-[10px] text-slate-500 block mt-0.5 font-sans">
                  {orientationCount} Orientations × {wwrCount} WWR × {thicknessCount} Insulation Thicknesses
                </span>
              </div>

              <button
                onClick={handleRunOptimization}
                disabled={runningOpt}
                className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                {runningOpt ? 'Evaluating Candidates across Physics Solver...' : `Run Climate-Adaptive Optimization (${dynamicCandidateCount} Variants)`}
              </button>
            </div>

            {/* Results Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Real-time Socket.IO Progress Card */}
              {runningOpt && (
                <div className="card-clean border-l-4 border-l-sky-600 bg-sky-50/40">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Socket.IO Progress Monitor (Exhaustive Grid Search)
                  </h3>
                  <div className="w-full bg-slate-200 rounded-full h-3 mb-2 overflow-hidden">
                    <div
                      className="bg-sky-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${optProgress?.progressPercent || 5}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs font-mono text-slate-600">
                    <span>Progress: <strong>{optProgress?.progressPercent || 0}%</strong></span>
                    <span>Evaluated: <strong>{optProgress?.evaluatedCount || 0}</strong> / <strong>{dynamicCandidateCount}</strong></span>
                    <span>Current: {optProgress?.currentOrientation}° | {Math.round((optProgress?.currentThickness || 0)*1000)}mm</span>
                  </div>
                </div>
              )}

              {/* Optimization Results */}
              {optResult && (
                <div className="card-clean border-t-4 border-t-emerald-600 space-y-6">
                  {/* Score & Winning Config Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Final Climate-Optimized Shelter
                      </h3>
                      <p className="text-xs text-slate-500">
                        Evaluated {optResult.evaluatedCount} design candidates via transient lumped-capacitance solver.
                      </p>
                    </div>
                    <div className="text-right bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
                      <span className="text-[10px] text-emerald-800 font-bold uppercase block">Design Optimization Score</span>
                      <span className="text-2xl font-bold font-mono text-emerald-700">{optResult.winner?.scoreBreakdown?.designScore} / 100</span>
                      <span className="text-[9px] text-slate-400 block">Relative to evaluated alternatives</span>
                    </div>
                  </div>

                  {/* Winner Parameters Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-sans block">Optimal Orientation</span>
                      <span className="font-bold text-slate-800">{optResult.winner?.config?.orientation}° ({optResult.winner?.config?.orientationLabel})</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-sans block">Optimal WWR / Glazing</span>
                      <span className="font-bold text-slate-800">
                        {optResult.winner?.config?.wwr ? `${Math.round(optResult.winner?.config?.wwr * 100)}% (${optResult.winner?.config?.windowArea} m²)` : 'Fixed'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-sans block">Opt. Wall Insulation</span>
                      <span className="font-bold text-sky-700">{Math.round((optResult.winner?.config?.insulationThickness || 0)*1000)} mm</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-sans block">Thermal Comfort</span>
                      <span className="font-bold text-emerald-700">{optResult.winner?.metrics?.comfortPercentage}%</span>
                    </div>
                  </div>

                  {/* Before vs After Table */}
                  {optResult.beforeAfter && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Before vs After Optimization Comparison</h4>
                      <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                            <tr>
                              <th className="p-2.5">Design Variable / KPI Metric</th>
                              <th className="p-2.5">Before (Original Design)</th>
                              <th className="p-2.5 text-sky-800">After (Climate-Optimized)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                            <tr>
                              <td className="p-2 font-sans font-medium text-slate-700">Orientation</td>
                              <td className="p-2 text-slate-500">{optResult.beforeAfter.before.orientation}</td>
                              <td className="p-2 font-bold text-sky-700">{optResult.beforeAfter.after.orientation}</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-sans font-medium text-slate-700">WWR / Window Area</td>
                              <td className="p-2 text-slate-500">{optResult.beforeAfter.before.wwr} ({optResult.beforeAfter.before.windowArea})</td>
                              <td className="p-2 font-bold text-sky-700">{optResult.beforeAfter.after.wwr} ({optResult.beforeAfter.after.windowArea})</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-sans font-medium text-slate-700">Wall Insulation Thickness</td>
                              <td className="p-2 text-slate-500">{optResult.beforeAfter.before.insulationThickness}</td>
                              <td className="p-2 font-bold text-sky-700">{optResult.beforeAfter.after.insulationThickness}</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-sans font-medium text-slate-700">Thermal Comfort %</td>
                              <td className="p-2 text-slate-500">{optResult.beforeAfter.before.comfortPercentage}</td>
                              <td className="p-2 font-bold text-emerald-700">{optResult.beforeAfter.after.comfortPercentage}</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-sans font-medium text-slate-700">Min / Max Indoor Temp</td>
                              <td className="p-2 text-slate-500">{optResult.beforeAfter.before.minIndoorTemp} to {optResult.beforeAfter.before.maxIndoorTemp}</td>
                              <td className="p-2 text-slate-800">{optResult.beforeAfter.after.minIndoorTemp} to {optResult.beforeAfter.after.maxIndoorTemp}</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-sans font-medium text-slate-700">Heating Requirement</td>
                              <td className="p-2 text-slate-500">{optResult.beforeAfter.before.heatingRequirement}</td>
                              <td className="p-2 font-bold text-sky-700">{optResult.beforeAfter.after.heatingRequirement}</td>
                            </tr>
                            <tr className="bg-sky-50/50">
                              <td className="p-2 font-sans font-bold text-slate-900">Relative Optimization Score</td>
                              <td className="p-2 font-bold text-slate-500">{optResult.beforeAfter.before.score} / 100</td>
                              <td className="p-2 font-bold text-emerald-700">{optResult.beforeAfter.after.score} / 100</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Why This Design? Card */}
                  {optResult.explanation && (
                    <div className="p-4 bg-sky-50/60 border border-sky-200 rounded-xl space-y-1 text-xs">
                      <h4 className="font-bold text-sky-900 flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-sky-600" /> Why This Design? (Deterministic Physics Rationale)
                      </h4>
                      <p className="text-slate-700 leading-relaxed font-sans">{optResult.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STAGE 2: FEATURE 3 — EXTREME CLIMATE RESILIENCE TEST */}
      {activeTab === 'stresstest' && (
        <div className="space-y-6">
          {/* Frozen Design Lock Banner */}
          <div className="card-clean border-l-4 border-l-indigo-600 bg-indigo-50/40 p-5">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Shelter Design 100% Frozen
                </h3>
              </div>
              <span className="text-[11px] font-bold bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full border border-indigo-200">
                Shelter design is fixed. Only climate conditions are varied.
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 font-mono text-[11px]">
              <div className="bg-white p-2 rounded border border-indigo-100">
                <span className="text-[10px] text-slate-400 block font-sans">Orientation</span>
                <span className="font-bold text-slate-800">{optResult?.winner?.config?.orientation || 180}°</span>
              </div>
              <div className="bg-white p-2 rounded border border-indigo-100">
                <span className="text-[10px] text-slate-400 block font-sans">WWR / Window Area</span>
                <span className="font-bold text-slate-800">{optResult?.winner?.config?.windowArea || 2.5} m²</span>
              </div>
              <div className="bg-white p-2 rounded border border-indigo-100">
                <span className="text-[10px] text-slate-400 block font-sans">Insulation Thickness</span>
                <span className="font-bold text-indigo-700">{Math.round((optResult?.winner?.config?.insulationThickness || 0.10)*1000)} mm</span>
              </div>
              <div className="bg-white p-2 rounded border border-indigo-100">
                <span className="text-[10px] text-slate-400 block font-sans">Wall Material</span>
                <span className="font-bold text-slate-800 truncate block">{winningWall}</span>
              </div>
              <div className="bg-white p-2 rounded border border-indigo-100">
                <span className="text-[10px] text-slate-400 block font-sans">Roof Material</span>
                <span className="font-bold text-slate-800 truncate block">{winningRoof}</span>
              </div>
              <div className="bg-white p-2 rounded border border-indigo-100">
                <span className="text-[10px] text-slate-400 block font-sans">Glazing</span>
                <span className="font-bold text-slate-800 truncate block">{winningGlazing}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stress Test Controls */}
            <div className="card-clean space-y-4">
              <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">
                Climate Stress Test Parameters
              </h2>

              <p className="text-xs text-slate-500">
                Perturbs the target location's hourly ambient outdoor temperature profile across location-aware stress scenarios while keeping all shelter physical properties locked.
              </p>

              <button
                onClick={handleRunStressTest}
                disabled={runningStress || !optResult}
                className="btn-primary w-full py-3 text-xs font-bold bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 flex items-center justify-center gap-2"
              >
                <ShieldAlert className="w-4 h-4 text-white" />
                {runningStress ? 'Running Stress Scenarios across Solver...' : 'Execute Extreme Climate Resilience Test'}
              </button>

              {!optResult && (
                <p className="text-[11px] text-amber-700 font-semibold text-center">
                  ⚠️ Please run Climate-Adaptive Optimization (Feature 2) first to lock the optimal design.
                </p>
              )}

              {/* Visible error display */}
              {stressError && (
                <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-xs text-red-800 font-semibold flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span>Stress test failed: {stressError}</span>
                </div>
              )}

              {/* Loading indicator */}
              {runningStress && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-800 font-semibold text-center animate-pulse">
                  Running Climate Resilience Test across physics solver... please wait.
                </div>
              )}
            </div>

            {/* Stress Test Results Column */}
            <div className="lg:col-span-2 space-y-6">
              {stressResult && (
                <div className="card-clean border-t-4 border-t-red-600 space-y-6">
                  {/* Climate Classification & Overall Status Banner */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold bg-slate-900 text-white px-2.5 py-1 rounded">
                          {stressResult.climateClassification?.classification} Climate
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          ({stressResult.climateClassification?.description})
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        Extreme Climate Resilience Test Results
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold block">Resilience Score</span>
                        <span className="text-2xl font-bold font-mono text-slate-900">
                          {stressResult.finalResilienceScore} / 100
                        </span>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                        stressResult.overallStatus === 'STABLE'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : (stressResult.overallStatus === 'MODERATE RISK'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-red-100 text-red-800 border-red-300')
                      }`}>
                        {stressResult.overallStatus}
                      </span>
                    </div>
                  </div>

                  {/* Scenario Results Table */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Location-Aware Stress Scenarios Performance
                    </h4>
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-2.5">Scenario</th>
                            <th className="p-2.5">Outdoor Range</th>
                            <th className="p-2.5">Indoor Range</th>
                            <th className="p-2.5">Comfort %</th>
                            <th className="p-2.5">Degree-Hours</th>
                            <th className="p-2.5 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                          {(stressResult.scenarios || []).map((scen) => (
                            <tr key={scen.scenarioId} className="hover:bg-slate-50">
                              <td className="p-2.5 font-bold font-sans text-slate-800">{scen.scenarioName}</td>
                              <td className="p-2.5 text-slate-500">{scen.outdoorRange}</td>
                              <td className="p-2.5 font-semibold text-slate-800">
                                {scen.metrics?.minIndoorTemp}°C to {scen.metrics?.maxIndoorTemp}°C
                              </td>
                              <td className="p-2.5 font-bold text-emerald-700">{scen.metrics?.comfortPercentage}%</td>
                              <td className="p-2.5 text-slate-600">
                                Cold: {scen.degreeHours?.coldDegreeHours} DH | Hot: {scen.degreeHours?.hotDegreeHours} DH
                              </td>
                              <td className="p-2.5 text-right">
                                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                  scen.status === 'STABLE'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : (scen.status === 'MODERATE RISK' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800')
                                }`}>
                                  {scen.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Thermal Vulnerability Analysis */}
                  {stressResult.vulnerabilities && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Worst-Case Thermal Vulnerability Analysis ({stressResult.worstCaseScenario})
                      </h4>

                      <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                            <tr>
                              <th className="p-2">Envelope Component</th>
                              <th className="p-2">Average Conduction Loss</th>
                              <th className="p-2">Share of Total Envelope Loss (%)</th>
                              <th className="p-2 text-right">Vulnerability Level</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                            {(stressResult.vulnerabilities.envelopeConductiveVulnerabilities || []).map((v) => (
                              <tr key={v.component}>
                                <td className="p-2 font-sans font-medium text-slate-800">{v.component}</td>
                                <td className="p-2 text-slate-600">{v.lossWatts} W</td>
                                <td className="p-2 font-bold text-sky-700">{v.sharePct}%</td>
                                <td className="p-2 text-right">
                                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                    v.riskLevel === 'HIGH'
                                      ? 'bg-red-100 text-red-800'
                                      : (v.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')
                                  }`}>
                                    {v.riskLevel}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Deterministic Engineering Observations */}
                      {(stressResult.vulnerabilities.recommendations || []).map((rec, idx) => (
                        <div key={idx} className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-slate-700 font-sans">
                          <strong>Engineering Observation:</strong> {rec}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STAGE 3: CLIMATE TIME MACHINE / VIEW OPTIMIZED DESIGN IN 3D */}
      {activeTab === '3d' && (
        <OptimizedDesignVisualization
          currentSim={currentSim}
          optResult={optResult}
        />
      )}
    </div>
  );
}
