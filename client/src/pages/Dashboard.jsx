import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  PlusCircle,
  Activity,
  Box,
  Thermometer,
  Flame,
  Sun,
  ArrowUpRight,
  TrendingUp,
  FileCheck2
} from 'lucide-react';

export default function Dashboard() {
  const [simulations, setSimulations] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [climates, setClimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [simRes, shelterRes, climateRes] = await Promise.all([
          api.get('/simulation/user/history'),
          api.get('/shelters'),
          api.get('/climate')
        ]);
        setSimulations(simRes.data || []);
        setShelters(shelterRes.data || []);
        setClimates(climateRes.data || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const totalSims = simulations.length;
  const savedDesignsCount = shelters.length;
  
  // Calculate averages across simulations
  let avgIndoorTemp = '--';
  let avgHeatLoss = '--';
  let bestSim = null;

  if (simulations.length > 0) {
    const sumTemp = simulations.reduce((acc, s) => acc + (s.results?.metrics?.avgIndoorTemp || 0), 0);
    avgIndoorTemp = (sumTemp / simulations.length).toFixed(1);

    const sumLoss = simulations.reduce((acc, s) => acc + (s.results?.metrics?.totalHeatLoss || 0), 0);
    avgHeatLoss = (sumLoss / simulations.length).toFixed(1);

    // Best design has highest comfort percentage
    bestSim = [...simulations].sort((a, b) => (b.results?.metrics?.comfortPercentage || 0) - (a.results?.metrics?.comfortPercentage || 0))[0];
  }

  const latestClimate = climates.length > 0 ? climates[0] : null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white card-clean p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4 border-l-sky-600">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Engineering Control Dashboard</h1>
          <p className="text-sm text-slate-600">
            DRDO Passive Thermal Architecture & Transient Physics Performance Workspace
          </p>
        </div>
        <button
          onClick={() => navigate('/new-simulation')}
          className="btn-primary py-2.5 px-5 text-sm shadow-md"
        >
          <PlusCircle className="w-5 h-5" /> Create New Simulation
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card-clean">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Simulations</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-slate-900">{totalSims}</p>
          <p className="text-[11px] text-slate-500 mt-1">Ran on custom physics engine</p>
        </div>

        <div className="card-clean">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Indoor Temp</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Thermometer className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-slate-900">{avgIndoorTemp} °C</p>
          <p className="text-[11px] text-slate-500 mt-1">High-altitude winter average</p>
        </div>

        <div className="card-clean">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Heat Loss</span>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-slate-900">{avgHeatLoss} kWh</p>
          <p className="text-[11px] text-slate-500 mt-1">24-Hour thermal loss load</p>
        </div>

        <div className="card-clean">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saved Designs</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Box className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-slate-900">{savedDesignsCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Parametric shelter geometries</p>
        </div>
      </div>

      {/* Best Design Showcase & Climate Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Best Performing Design Card */}
        <div className="lg:col-span-2 card-clean border-t-4 border-t-emerald-600">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> Best Performing Shelter Design
            </h2>
            {bestSim && (
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold border border-emerald-200">
                {bestSim.results?.metrics?.comfortPercentage}% Thermal Comfort
              </span>
            )}
          </div>

          {bestSim ? (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500">Design Name</p>
                <p className="text-sm font-bold text-slate-800">{bestSim.shelter?.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Avg Indoor Temp</p>
                <p className="text-sm font-bold text-sky-700">{bestSim.results?.metrics?.avgIndoorTemp} °C</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Solar Gain</p>
                <p className="text-sm font-bold text-amber-700">{bestSim.results?.metrics?.totalSolarGain} kWh</p>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 text-sm">
              No completed simulations found yet. Click "Create New Simulation" to run your first passive shelter thermal analysis!
            </div>
          )}
        </div>

        {/* Climate Status */}
        <div className="card-clean">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-3">
            <Sun className="w-4 h-4 text-sky-600" /> Active Climate Profile
          </h2>
          {latestClimate ? (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Location:</span>
                <span className="font-semibold text-slate-800">{latestClimate.location}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Elevation:</span>
                <span className="font-semibold text-slate-800">{latestClimate.elevation || 3500} m</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Data Source:</span>
                <span className="font-semibold text-sky-700">{latestClimate.sourceType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time Series Points:</span>
                <span className="font-semibold text-slate-800">{latestClimate.dataPoints?.length || 0} Hours</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Loading climate dataset...</p>
          )}
        </div>
      </div>

      {/* Recent Simulations Table */}
      <div className="card-clean">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800">Recent Thermal Simulations</h2>
          <button onClick={() => navigate('/simulations')} className="text-xs text-sky-600 font-semibold hover:underline flex items-center gap-1">
            View All <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {simulations.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No simulations recorded. Click "Create New Simulation" to run your first thermal model.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="p-3">Simulation Name</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Avg Temp</th>
                  <th className="p-3">Heat Loss</th>
                  <th className="p-3">Comfort %</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {simulations.slice(0, 5).map((sim) => (
                  <tr key={sim._id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-semibold text-slate-800">{sim.name}</td>
                    <td className="p-3 text-slate-600">{sim.climateDataset?.location || 'Ladakh'}</td>
                    <td className="p-3 font-medium text-sky-700">{sim.results?.metrics?.avgIndoorTemp} °C</td>
                    <td className="p-3 text-slate-700">{sim.results?.metrics?.totalHeatLoss} kWh</td>
                    <td className="p-3 font-medium text-emerald-700">{sim.results?.metrics?.comfortPercentage} %</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded border border-emerald-200">
                        {sim.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => navigate(`/simulations?id=${sim._id}`)}
                        className="text-xs text-sky-600 font-semibold hover:underline"
                      >
                        View Results
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
