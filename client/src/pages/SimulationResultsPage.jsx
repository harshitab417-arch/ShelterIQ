import React, { useState } from 'react';
import api from '../services/api';
import {
  Thermometer,
  Sun,
  Flame,
  Activity,
  FileText,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

export default function SimulationResultsPage({ simulation, onBack }) {
  const [aiExplanation, setAiExplanation] = useState(simulation?.aiExplanation || '');
  const [loadingAi, setLoadingAi] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportMsg, setReportMsg] = useState('');

  if (!simulation || !simulation.results) {
    return (
      <div className="card-clean p-8 text-center text-slate-500">
        No simulation result dataset loaded.
      </div>
    );
  }

  const m = simulation.results.metrics;
  const timeSeries = simulation.results.timeSeries || [];
  const comp = simulation.results.componentBreakdown || {};

  const handleGenerateAI = async () => {
    setLoadingAi(true);
    try {
      const res = await api.post('/ai/explain', {
        shelterName: simulation.shelter?.name || simulation.name,
        climateLocation: simulation.climateDataset?.location || 'Ladakh Region',
        metrics: m,
        componentBreakdown: comp
      });
      setAiExplanation(res.data.explanation);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleGeneratePDF = async () => {
    const reportWindow = window.open('', '_blank');
    if (reportWindow) {
      reportWindow.document.write('<div style="font-family:sans-serif;padding:40px;text-align:center;color:#0284c7;"><h2>Generating DRDO Thermal Design PDF Report...</h2><p>Compiling thermal metrics and vector graphs...</p></div>');
    }
    setReportLoading(true);
    setReportMsg('');
    try {
      const res = await api.post('/reports/generate', { simulation });
      const fileUrl = res.data?.viewUrl || res.data?.report?.filePath || (res.data?.report?.filename ? `/uploads/reports/${res.data.report.filename}` : null);
      if (fileUrl) {
        const baseUrl = window.location.origin.includes('5173') ? 'http://localhost:5000' : window.location.origin;
        if (reportWindow) {
          reportWindow.location.href = `${baseUrl}${fileUrl}`;
        } else {
          window.location.href = `${baseUrl}${fileUrl}`;
        }
        setReportMsg('PDF Report opened in new tab!');
      } else if (reportWindow) {
        reportWindow.close();
      }
    } catch (err) {
      console.error('Report error:', err);
      if (reportWindow) reportWindow.close();
      setReportMsg('Failed to generate PDF report.');
    } finally {
      setReportLoading(false);
    }
  };

  const compData = [
    { component: 'Walls', loss: comp.wallConduction || 0 },
    { component: 'Roof', loss: comp.roofConduction || 0 },
    { component: 'Floor', loss: comp.floorConduction || 0 },
    { component: 'Windows', loss: comp.windowConduction || 0 },
    { component: 'Doors', loss: comp.doorConduction || 0 }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="card-clean p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          {onBack && (
            <button onClick={onBack} className="text-xs text-sky-600 font-semibold mb-2 inline-flex items-center gap-1 hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to History
            </button>
          )}
          <h1 className="text-2xl font-display font-bold text-slate-900">{simulation.name}</h1>
          <p className="text-xs text-slate-500">
            Shelter Model: {simulation.shelter?.name} | Location: {simulation.climateDataset?.location}
          </p>
        </div>

        <div className="flex gap-3">
          <button onClick={handleGenerateAI} disabled={loadingAi} className="btn-secondary">
            <Sparkles className="w-4 h-4 text-sky-600" /> {loadingAi ? 'Synthesizing...' : 'AI Explanation'}
          </button>
          <button onClick={handleGeneratePDF} disabled={reportLoading} className="btn-primary">
            <FileText className="w-4 h-4" /> {reportLoading ? 'Building PDF...' : 'Generate PDF Report'}
          </button>
        </div>
      </div>

      {reportMsg && <div className="p-3 bg-sky-50 border border-sky-200 text-sky-800 text-xs rounded-lg">{reportMsg}</div>}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-clean">
          <p className="text-xs font-semibold text-slate-500 uppercase">Avg Indoor Temp</p>
          <p className="text-3xl font-display font-bold text-sky-700 mt-1">{m.avgIndoorTemp} °C</p>
          <p className="text-[11px] text-slate-400 mt-1">Min {m.minIndoorTemp}°C / Max {m.maxIndoorTemp}°C</p>
        </div>

        <div className="card-clean">
          <p className="text-xs font-semibold text-slate-500 uppercase">Thermal Comfort Index</p>
          <p className="text-3xl font-display font-bold text-emerald-700 mt-1">{m.comfortPercentage} %</p>
          <p className="text-[11px] text-slate-400 mt-1">Hours in 18-24°C target</p>
        </div>

        <div className="card-clean">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Solar Gain</p>
          <p className="text-3xl font-display font-bold text-amber-700 mt-1">{m.totalSolarGain} kWh</p>
          <p className="text-[11px] text-slate-400 mt-1">Passive solar heat captured</p>
        </div>

        <div className="card-clean">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Heat Loss</p>
          <p className="text-3xl font-display font-bold text-red-700 mt-1">{m.totalHeatLoss} kWh</p>
          <p className="text-[11px] text-slate-400 mt-1">Peak Loss: {m.peakHeatLoss} W</p>
        </div>
      </div>

      {/* AI Explanation Box */}
      {aiExplanation && (
        <div className="card-clean border-l-4 border-l-sky-600 bg-sky-50/40">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-sky-600" /> DRDO Passive Architecture Specialist AI Report
          </h3>
          <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
            {aiExplanation}
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Indoor vs Ambient Temp Chart */}
        <div className="card-clean">
          <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">
            Indoor vs Ambient Temperature Profile (°C)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={9} tickFormatter={(t) => t.substr(11, 5)} />
                <YAxis stroke="#94a3b8" fontSize={10} unit="°C" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="indoorTemperature" name="Indoor Temp (°C)" stroke="#0284c7" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="ambientTemperature" name="Ambient Temp (°C)" stroke="#94a3b8" strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heat Loss vs Solar Gain Chart */}
        <div className="card-clean">
          <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">
            Instantaneous Solar Passive Gain vs Total Heat Loss (Watts)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={9} tickFormatter={(t) => t.substr(11, 5)} />
                <YAxis stroke="#94a3b8" fontSize={10} unit="W" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="solarGain" name="Solar Gain (W)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="totalHeatLoss" name="Heat Loss (W)" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Component Breakdown Bar Chart */}
        <div className="card-clean">
          <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">
            Envelope Heat Loss Component Breakdown (Average W)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="component" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} unit="W" />
                <Tooltip />
                <Bar dataKey="loss" name="Heat Loss (W)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Physics Assumptions List */}
        <div className="card-clean">
          <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">
            Physics Model Assumptions & Bounding Limitations
          </h3>
          <ul className="space-y-2 text-xs text-slate-600">
            {(simulation.assumptions || []).map((asm, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span>{asm}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
