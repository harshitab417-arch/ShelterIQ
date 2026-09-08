import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Sun, CloudSun, Upload, RefreshCw, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function ClimatePage() {
  const [climates, setClimates] = useState([]);
  const [selectedClimate, setSelectedClimate] = useState(null);
  const [activeTab, setActiveTab] = useState('open-meteo'); // 'open-meteo' | 'csv'

  // Open-Meteo State
  const [lat, setLat] = useState('34.15'); // Leh/Ladakh
  const [lng, setLng] = useState('77.58');
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cityName, setCityName] = useState('');

  // CSV Upload State
  const [csvFile, setCsvFile] = useState(null);
  const [csvText, setCsvText] = useState('');

  useEffect(() => {
    loadClimates();
  }, []);

  async function loadClimates() {
    try {
      const res = await api.get('/climate');
      const list = res.data || [];
      setClimates(list);
      if (list.length > 0 && !selectedClimate) {
        setSelectedClimate(list[0]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  const handleOpenMeteoFetch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/climate/import', { 
        latitude: lat, 
        longitude: lng, 
        days,
        cityName: cityName || `Open-Meteo (${lat}, ${lng})`
      });
      setSelectedClimate(res.data);
      await loadClimates();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch Open-Meteo climate data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    const rawText = csvText.trim();
    if (!rawText) {
      setError('Please upload a CSV file or paste CSV data into the text area.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/climate/csv', { csvText: rawText, location: 'IMD Station Data' }, {
        headers: { 'Content-Type': 'application/json' }
      });
      setSelectedClimate(res.data.dataset);
      await loadClimates();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to parse CSV data.');
    } finally {
      setLoading(false);
    }
  };

  // Recharts formatted chart data
  const chartData = selectedClimate?.dataPoints
    ? selectedClimate.dataPoints.map((dp, i) => ({
        time: `H${i + 1}`,
        temp: dp.ambientTemperature,
        solar: dp.solarRadiation,
        wind: dp.windSpeed
      }))
    : [];

  return (
    <div className="space-y-6">
      <div className="card-clean p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Climate Data Management</h1>
          <p className="text-xs text-slate-500">Fetch live weather via Open-Meteo API or upload CSV weather profiles</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-clean space-y-4">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('open-meteo')}
              className={`flex-1 py-2 text-xs font-bold text-center transition ${
                activeTab === 'open-meteo' ? 'text-sky-700 border-b-2 border-sky-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Open-Meteo API
            </button>
            <button
              onClick={() => setActiveTab('csv')}
              className={`flex-1 py-2 text-xs font-bold text-center transition ${
                activeTab === 'csv' ? 'text-sky-700 border-b-2 border-sky-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              CSV Upload
            </button>
          </div>

          {activeTab === 'open-meteo' ? (
            <form onSubmit={handleOpenMeteoFetch} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location Name (optional)</label>
                <input 
                  type="text" 
                  value={cityName} 
                  onChange={(e) => setCityName(e.target.value)} 
                  className="input-clean" 
                  placeholder="e.g. Leh, Ladakh"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude (°)</label>
                <input type="number" step="0.01" value={lat} onChange={(e) => setLat(e.target.value)} className="input-clean" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude (°)</label>
                <input type="number" step="0.01" value={lng} onChange={(e) => setLng(e.target.value)} className="input-clean" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Forecast Period (Days)</label>
                <input type="number" min="1" max="14" value={days} onChange={(e) => setDays(e.target.value)} className="input-clean" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-2">
                <CloudSun className="w-4 h-4" /> {loading ? 'Fetching API...' : 'Fetch Open-Meteo Data'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCsvUpload} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Upload CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files[0])}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-slate-500">OR paste CSV data</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Paste CSV Data</label>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={"timestamp,temperature,solarRadiation,windSpeed,humidity\n2024-01-01T00:00,-12.5,0,3.2,45\n2024-01-01T01:00,-13.0,0,2.8,47"}
                  className="input-clean font-mono text-xs h-32 resize-y"
                />
              </div>

              <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg">
                <p className="text-[11px] font-semibold text-sky-800 mb-1">IMD CSV Format</p>
                <p className="text-[10px] text-sky-700">Required columns: timestamp, temperature (°C), solarRadiation (W/m²), windSpeed (m/s), humidity (%)</p>
                <p className="text-[10px] text-sky-600 mt-1">Header row is auto-detected. Missing columns use defaults: solar=0, wind=2.0, humidity=50.</p>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-2">
                <Upload className="w-4 h-4" /> {loading ? 'Parsing...' : 'Upload & Validate CSV'}
              </button>
            </form>
          )}

          {/* Dataset Selector List */}
          <div className="pt-4 border-t border-slate-200">
            <label className="block text-xs font-semibold text-slate-700 mb-2">Available Datasets</label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {climates.map((c) => (
                <div
                  key={c._id}
                  onClick={() => setSelectedClimate(c)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                    selectedClimate?._id === c._id ? 'bg-sky-50 border-sky-500 font-semibold' : 'bg-white border-slate-200'
                  }`}
                >
                  <p className="text-slate-800 font-medium">{c.name}</p>
                  <p className="text-[10px] text-slate-400">{c.sourceType} • {c.dataPoints?.length || 0} Hours</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Climate Visual Charts */}
        <div className="lg:col-span-2 space-y-6">
          {selectedClimate ? (
            <>
              {/* Temp vs Time */}
              <div className="card-clean">
                <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">
                  Ambient Temperature Time Series (°C) - {selectedClimate.name}
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} unit="°C" />
                      <Tooltip />
                      <Area type="monotone" dataKey="temp" stroke="#0284c7" fill="#e0f2fe" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Solar Radiation vs Time */}
              <div className="card-clean">
                <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">
                  Global Solar Irradiance (W/m²)
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} unit="W/m²" />
                      <Tooltip />
                      <Area type="monotone" dataKey="solar" stroke="#f59e0b" fill="#fef3c7" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div className="card-clean p-12 text-center text-slate-500 text-sm">
              Select or fetch a climate dataset to view weather graphs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
