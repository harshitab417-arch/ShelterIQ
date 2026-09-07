import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { CheckCircle2, ShieldAlert, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

export default function ValidationPage() {
  const [validationCases, setValidationCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);

  useEffect(() => {
    async function loadValidationData() {
      try {
        const res = await api.get('/validation');
        const list = res.data || [];
        setValidationCases(list);
        if (list.length > 0) setSelectedCase(list[0]);
      } catch (err) {
        console.error(err);
      }
    }
    loadValidationData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="card-clean p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Thermal Model Validation Module</h1>
          <p className="text-xs text-slate-500">
            Rigorous verification against 1D analytical Fourier series solutions and legitimate reference datasets
          </p>
        </div>
      </div>

      <div className="p-4 bg-sky-50 border border-sky-200 text-sky-900 text-xs rounded-xl flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold">Validation Authenticity Disclosure</h3>
          <p className="mt-0.5 text-sky-800">
            Because ANSYS is not used, thermal model validation is performed using classical 1D analytical transient Fourier heat conduction solutions and verified reference standards. Field measurements are only evaluated when legitimate verified dataset files are supplied.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Case Selector */}
        <div className="card-clean space-y-3">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Validation Benchmarks</h2>
          {validationCases.map((vc) => (
            <div
              key={vc._id}
              onClick={() => setSelectedCase(vc)}
              className={`p-3 rounded-lg border text-xs cursor-pointer transition ${
                selectedCase?._id === vc._id ? 'bg-sky-50 border-sky-600 font-semibold' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-800">{vc.title}</span>
                <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded font-semibold text-slate-600">{vc.dataType}</span>
              </div>
              <p className="text-[11px] text-slate-500">{vc.referenceSource}</p>
            </div>
          ))}
        </div>

        {/* Selected Case Results */}
        <div className="lg:col-span-2 space-y-6">
          {selectedCase && (
            <>
              {/* Error KPI Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="card-clean">
                  <p className="text-xs font-semibold text-slate-500 uppercase">MAE (Mean Abs Error)</p>
                  <p className="text-2xl font-bold text-sky-700 mt-1">{selectedCase.metrics?.mae} °C</p>
                </div>
                <div className="card-clean">
                  <p className="text-xs font-semibold text-slate-500 uppercase">RMSE (Root Sq Error)</p>
                  <p className="text-2xl font-bold text-sky-700 mt-1">{selectedCase.metrics?.rmse} °C</p>
                </div>
                <div className="card-clean">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Max Error</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{selectedCase.metrics?.maxError} °C</p>
                </div>
                <div className="card-clean">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Mean % Error</p>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">{selectedCase.metrics?.meanPercentageError} %</p>
                </div>
              </div>

              {/* Chart: Expected vs Predicted */}
              <div className="card-clean">
                <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">
                  Analytical Fourier Expected vs Node.js Model Predicted Temperature (°C)
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedCase.dataPoints}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} unit="°C" />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="expectedTemp" name="Analytical Solution (°C)" stroke="#0284c7" strokeWidth={2.5} />
                      <Line type="monotone" dataKey="predictedTemp" name="Node.js Physics Engine (°C)" stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Model Assumptions & Limitations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card-clean">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Model Physics Assumptions</h4>
                  <ul className="space-y-1 text-xs text-slate-600 list-disc list-inside">
                    {(selectedCase.assumptions || []).map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
                <div className="card-clean">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Physics Limitations</h4>
                  <ul className="space-y-1 text-xs text-slate-600 list-disc list-inside">
                    {(selectedCase.limitations || []).map((l, i) => <li key={i}>{l}</li>)}
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
