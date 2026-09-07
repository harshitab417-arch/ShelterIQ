import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FileText, Download, RefreshCw } from 'lucide-react';

export default function ReportsPage() {
  const [simulations, setSimulations] = useState([]);
  const [generatingId, setGeneratingId] = useState(null);

  useEffect(() => {
    async function loadSims() {
      try {
        const res = await api.get('/simulation/user/history');
        setSimulations(res.data || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadSims();
  }, []);

  const handleDownloadPDF = async (sim) => {
    setGeneratingId(sim._id);
    try {
      const res = await api.post('/reports/generate', { simulation: sim });
      if (res.data.downloadUrl) {
        window.open(res.data.downloadUrl, '_blank');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card-clean p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">PDF Report Generation Center</h1>
          <p className="text-xs text-slate-500">Generate and download official PDF design reports for DRDO evaluation</p>
        </div>
      </div>

      <div className="card-clean p-0 overflow-hidden">
        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
              <th className="p-3.5">Report Title</th>
              <th className="p-3.5">Shelter Model</th>
              <th className="p-3.5">Comfort Index</th>
              <th className="p-3.5">Heat Loss</th>
              <th className="p-3.5 text-right">PDF Download</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {simulations.map((sim) => (
              <tr key={sim._id} className="hover:bg-slate-50 transition">
                <td className="p-3.5 font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-600" /> {sim.name}
                </td>
                <td className="p-3.5 text-slate-600">{sim.shelter?.name}</td>
                <td className="p-3.5 font-semibold text-emerald-700">{sim.results?.metrics?.comfortPercentage}%</td>
                <td className="p-3.5 font-semibold text-red-600">{sim.results?.metrics?.totalHeatLoss} kWh</td>
                <td className="p-3.5 text-right">
                  <button
                    onClick={() => handleDownloadPDF(sim)}
                    disabled={generatingId === sim._id}
                    className="btn-primary py-1 px-3 text-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {generatingId === sim._id ? 'Generating PDF...' : 'Download PDF'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
