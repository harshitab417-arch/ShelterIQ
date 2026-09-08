import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FileText, Download, ExternalLink, RefreshCw } from 'lucide-react';

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

  const getBaseUrl = () => {
    return window.location.origin.includes('5173') ? 'http://localhost:5000' : window.location.origin;
  };

  const handleOpenReportInNewTab = async (sim) => {
    const reportWindow = window.open('', '_blank');
    if (reportWindow) {
      reportWindow.document.write('<div style="font-family:sans-serif;padding:40px;text-align:center;color:#0284c7;"><h2>Opening DRDO Thermal Design PDF Report...</h2><p>Loading document graphs and overview...</p></div>');
    }
    setGeneratingId(sim._id);
    try {
      const res = await api.post('/reports/generate', { simulation: sim });
      const fileUrl = res.data?.viewUrl || res.data?.report?.filePath || (res.data?.report?.filename ? `/uploads/reports/${res.data.report.filename}` : null);
      if (fileUrl) {
        if (reportWindow) {
          reportWindow.location.href = `${getBaseUrl()}${fileUrl}`;
        } else {
          window.location.href = `${getBaseUrl()}${fileUrl}`;
        }
      } else if (reportWindow) {
        reportWindow.close();
      }
    } catch (err) {
      console.error('Report error:', err);
      if (reportWindow) reportWindow.close();
    } finally {
      setGeneratingId(null);
    }
  };

  const handleDownloadPDF = async (sim) => {
    setGeneratingId(sim._id);
    try {
      const res = await api.post('/reports/generate', { simulation: sim });
      const filename = res.data?.report?.filename;
      if (filename) {
        window.open(`${getBaseUrl()}/api/reports/download/${filename}`, '_self');
      }
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card-clean p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">PDF Report Generation Center</h1>
          <p className="text-xs text-slate-500">Generate, view in a new tab, and download official PDF design reports for DRDO evaluation</p>
        </div>
      </div>

      <div className="card-clean p-0 overflow-hidden">
        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
              <th className="p-3.5">Report Title</th>
              <th className="p-3.5">Shelter Shape & Model</th>
              <th className="p-3.5">Comfort Index</th>
              <th className="p-3.5">Heat Loss</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {simulations.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-400">
                  No simulation reports generated yet. Run a simulation from the Thermal Design Wizard.
                </td>
              </tr>
            ) : (
              simulations.map((sim) => (
                <tr key={sim._id} className="hover:bg-slate-50 transition">
                  <td className="p-3.5 font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sky-600" /> {sim.name}
                  </td>
                  <td className="p-3.5 text-slate-600">
                    <span className="font-semibold text-slate-800">{sim.shelter?.design?.shape || 'Rectangular'}</span> — {sim.shelter?.name}
                  </td>
                  <td className="p-3.5 font-semibold text-emerald-700">{sim.results?.metrics?.comfortPercentage}%</td>
                  <td className="p-3.5 font-semibold text-red-600">{sim.results?.metrics?.totalHeatLoss} kWh</td>
                  <td className="p-3.5 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenReportInNewTab(sim)}
                        disabled={generatingId === sim._id}
                        className="btn-primary py-1 px-3 text-xs flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {generatingId === sim._id ? 'Opening...' : 'Open in New Tab'}
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(sim)}
                        disabled={generatingId === sim._id}
                        className="btn-secondary py-1 px-3 text-xs flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
