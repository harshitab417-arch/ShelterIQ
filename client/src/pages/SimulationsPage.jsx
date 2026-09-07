import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import SimulationResultsPage from './SimulationResultsPage';
import { History, Eye, PlusCircle } from 'lucide-react';

export default function SimulationsPage() {
  const [searchParams] = useSearchParams();
  const simId = searchParams.get('id');
  const navigate = useNavigate();

  const [simulations, setSimulations] = useState([]);
  const [selectedSim, setSelectedSim] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSims() {
      try {
        const res = await api.get('/simulation/user/history');
        const list = res.data || [];
        setSimulations(list);

        if (simId) {
          const found = list.find(s => s._id === simId);
          if (found) setSelectedSim(found);
          else if (list.length > 0) setSelectedSim(list[0]);
        } else if (list.length > 0) {
          setSelectedSim(list[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSims();
  }, [simId]);

  if (simId && selectedSim) {
    return <SimulationResultsPage simulation={selectedSim} onBack={() => navigate('/simulations')} />;
  }

  return (
    <div className="space-y-6">
      <div className="card-clean p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Thermal Simulation History</h1>
          <p className="text-xs text-slate-500">History of all executed Node.js transient thermal physics simulations</p>
        </div>
        <button onClick={() => navigate('/new-simulation')} className="btn-primary">
          <PlusCircle className="w-4 h-4" /> Run New Simulation
        </button>
      </div>

      <div className="card-clean p-0 overflow-hidden">
        {simulations.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No simulations found. Click "Run New Simulation" to generate your first thermal model.
          </div>
        ) : (
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <th className="p-3.5">Simulation Name</th>
                <th className="p-3.5">Shelter Model</th>
                <th className="p-3.5">Location</th>
                <th className="p-3.5">Avg Indoor Temp</th>
                <th className="p-3.5">Heat Loss</th>
                <th className="p-3.5">Solar Gain</th>
                <th className="p-3.5">Comfort %</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {simulations.map((sim) => (
                <tr key={sim._id} className="hover:bg-slate-50 transition">
                  <td className="p-3.5 font-bold text-slate-800">{sim.name}</td>
                  <td className="p-3.5 text-slate-600">{sim.shelter?.name || 'Passive Shelter'}</td>
                  <td className="p-3.5 text-slate-600">{sim.climateDataset?.location || 'Ladakh'}</td>
                  <td className="p-3.5 font-semibold text-sky-700">{sim.results?.metrics?.avgIndoorTemp} °C</td>
                  <td className="p-3.5 text-slate-700">{sim.results?.metrics?.totalHeatLoss} kWh</td>
                  <td className="p-3.5 text-amber-700 font-semibold">{sim.results?.metrics?.totalSolarGain} kWh</td>
                  <td className="p-3.5 font-semibold text-emerald-700">{sim.results?.metrics?.comfortPercentage} %</td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => navigate(`/simulations?id=${sim._id}`)}
                      className="btn-secondary py-1 px-2 text-[11px]"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Results
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
