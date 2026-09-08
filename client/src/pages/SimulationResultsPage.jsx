import React, { useState, useMemo, useRef } from 'react';
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
  AlertTriangle,
  Award,
  Layers,
  Box,
  CircleDot,
  Triangle,
  Sliders,
  Play,
  Clock,
  Zap,
  Info,
  ChevronRight,
  TrendingUp,
  RefreshCw
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
  CartesianGrid,
  Cell,
  ReferenceArea
} from 'recharts';
import Shelter3DViewer from '../three/Shelter3DViewer';

export default function SimulationResultsPage({ simulation, onBack }) {
  const [selectedHour, setSelectedHour] = useState(14); // Default to midday 14:00
  const [reportLoading, setReportLoading] = useState(false);
  const [reportMsg, setReportMsg] = useState('');

  // Shape Comparison State
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);
  const comparisonRef = useRef(null);

  if (!simulation || !simulation.results) {
    return (
      <div className="card-clean p-8 text-center text-slate-500">
        No simulation result dataset loaded.
      </div>
    );
  }

  const m = simulation.results.metrics || {};
  const timeSeries = simulation.results.timeSeries || [];
  const comp = simulation.results.componentBreakdown || {};
  const rec = simulation.recommendation || {};

  // Extract Top 3 configurations safely with full fallback compatibility
  const top3 = useMemo(() => {
    const list = simulation.topConfigurations || rec.top3 || rec.topConfigurations || [];
    if (Array.isArray(list) && list.length > 0) return list;

    // If single recommendation exists, wrap it into rank 1
    if (rec.materials || rec.wallMaterial) {
      return [{
        rank: 1,
        envelope: rec.materials?.wallMaterial || rec.wallMaterial,
        wallMaterial: rec.materials?.wallMaterial || rec.wallMaterial,
        insulation: rec.materials?.insulationMaterial || rec.insulationMaterial,
        insulationMaterial: rec.materials?.insulationMaterial || rec.insulationMaterial,
        roofMaterial: rec.materials?.roofMaterial || rec.roofMaterial,
        glazing: rec.materials?.windowMaterial || rec.windowMaterial,
        windowMaterial: rec.materials?.windowMaterial || rec.windowMaterial,
        minNightTemp: m.minIndoorTemp,
        maxIndoorTemp: m.maxIndoorTemp,
        avgIndoorTemp: m.avgIndoorTemp,
        heatLoss: m.totalHeatLoss,
        totalHeatLoss: m.totalHeatLoss,
        heatingRequirement: m.heatingRequirement || 0,
        comfortPercent: m.comfortPercentage,
        comfortPercentage: m.comfortPercentage,
        score: rec.score || 85.0,
        compositeScore: rec.score || 85.0
      }];
    }
    return [];
  }, [simulation, rec, m]);

  const geometry = simulation.geometry || simulation.shelter?.calculatedGeometry || {};
  const shape = (simulation.shape || simulation.shelter?.shape || 'rectangle').toLowerCase();

  // Active time-series data point for selected hour
  const currentHourData = useMemo(() => {
    if (timeSeries.length === 0) return null;
    return timeSeries[selectedHour % timeSeries.length];
  }, [timeSeries, selectedHour]);

  // Dynamic Y-axis temperature bounds from actual data
  const tempDomain = useMemo(() => {
    if (timeSeries.length === 0) return [-25, 30];
    let minT = Infinity;
    let maxT = -Infinity;
    timeSeries.forEach(p => {
      if (p.indoorTemperature < minT) minT = p.indoorTemperature;
      if (p.ambientTemperature < minT) minT = p.ambientTemperature;
      if (p.indoorTemperature > maxT) maxT = p.indoorTemperature;
      if (p.ambientTemperature > maxT) maxT = p.ambientTemperature;
    });
    return [Math.floor(minT - 3), Math.ceil(maxT + 3)];
  }, [timeSeries]);

  // Heat loss breakdown data formatted for bar chart
  const heatLossBreakdownData = useMemo(() => {
    const wallLoss = comp.wallConduction || 0;
    const roofLoss = comp.roofConduction || 0;
    const curvedLoss = comp.curvedEnvelopeConduction || 0;
    const floorLoss = comp.floorConduction || 0;
    const winLoss = comp.windowConduction || 0;
    const doorLoss = comp.doorConduction || 0;
    const ventLoss = comp.ventilationLoss || 0;
    const skyLoss = comp.skyRadiation || 0;

    const total = wallLoss + roofLoss + curvedLoss + floorLoss + winLoss + doorLoss + ventLoss + skyLoss || 1;

    const items = [];
    if (curvedLoss > 0) {
      items.push({ name: 'Curved Shell', watts: curvedLoss, pct: ((curvedLoss / total) * 100).toFixed(1), fill: '#0284c7' });
    }
    if (roofLoss > 0) {
      items.push({ name: 'Roof Conduction', watts: roofLoss, pct: ((roofLoss / total) * 100).toFixed(1), fill: '#0369a1' });
    }
    if (wallLoss > 0) {
      items.push({ name: 'Opaque Walls', watts: wallLoss, pct: ((wallLoss / total) * 100).toFixed(1), fill: '#38bdf8' });
    }
    if (winLoss > 0) {
      items.push({ name: 'Window Glazing', watts: winLoss, pct: ((winLoss / total) * 100).toFixed(1), fill: '#f59e0b' });
    }
    if (ventLoss > 0) {
      items.push({ name: 'Infiltration / Vent', watts: ventLoss, pct: ((ventLoss / total) * 100).toFixed(1), fill: '#10b981' });
    }
    if (doorLoss > 0) {
      items.push({ name: 'Entrance Doors', watts: doorLoss, pct: ((doorLoss / total) * 100).toFixed(1), fill: '#d97706' });
    }
    if (floorLoss > 0) {
      items.push({ name: 'Floor / Ground', watts: floorLoss, pct: ((floorLoss / total) * 100).toFixed(1), fill: '#94a3b8' });
    }
    if (skyLoss > 0) {
      items.push({ name: 'Sky Radiation', watts: skyLoss, pct: ((skyLoss / total) * 100).toFixed(1), fill: '#6366f1' });
    }

    return items;
  }, [comp]);

  const handleGeneratePDF = async () => {
    setReportLoading(true);
    setReportMsg('');
    const win = window.open('about:blank', '_blank');
    try {
      const res = await api.post('/reports/generate', { simulation });
      setReportMsg('PDF Report generated successfully!');
      if (res.data.downloadUrl) {
        if (win) win.location.href = res.data.downloadUrl;
        else window.open(res.data.downloadUrl, '_blank');
      } else {
        if (win) win.close();
      }
    } catch (err) {
      if (win) win.close();
      setReportMsg('Failed to generate PDF report.');
    } finally {
      setReportLoading(false);
    }
  };

  const scrollToComparison = () => {
    setTimeout(() => {
      comparisonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleRunShapeComparison = async () => {
    setShowComparison(true);
    scrollToComparison();

    if (comparisonData) return;

    setComparisonLoading(true);
    try {
      const res = await api.post('/simulation/compare-shapes', {
        targetFloorArea: geometry.floorArea || 24.0,
        occupants: simulation.shelter?.occupants || 4,
        openings: simulation.shelter?.openings,
        climateDataset: simulation.climateDataset,
        comfortSettings: simulation.comfortSettings
      });
      setComparisonData(res.data);
      scrollToComparison();
    } catch (err) {
      console.error('Failed to run shape comparison:', err);
    } finally {
      setComparisonLoading(false);
    }
  };

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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-bold text-slate-900">{simulation.name}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-sky-100 text-sky-800 border border-sky-200">
              {shape}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Location: {simulation.climateDataset?.location || 'High-Altitude Region'} | Evaluated {simulation.totalCombinationsEvaluated || rec.totalCombinationsEvaluated || 72} Material Combinations
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button onClick={handleRunShapeComparison} className="btn-secondary text-xs">
            <Layers className="w-4 h-4 text-sky-600" /> Compare Shelter Shapes
          </button>
          <button onClick={handleGeneratePDF} disabled={reportLoading} className="btn-primary text-xs">
            <FileText className="w-4 h-4" /> {reportLoading ? 'Building PDF...' : 'Download Report'}
          </button>
        </div>
      </div>

      {reportMsg && <div className="p-3 bg-sky-50 border border-sky-200 text-sky-800 text-xs rounded-lg">{reportMsg}</div>}

      {/* ─── 1. RECOMMENDED MATERIAL CONFIGURATION CARD ─── */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white shadow-xl border border-sky-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Award className="w-64 h-64 text-sky-400" />
        </div>

        <div className="relative z-10 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-800/60 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-sky-300">Physics Solver Recommendation</span>
                <h2 className="text-lg font-bold text-white">Recommended Material Configuration</h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full font-bold">
                Rank #1 Score: {rec.score || 85.0}/100
              </span>
              <span className="text-xs bg-sky-500/20 text-sky-300 border border-sky-500/30 px-3 py-1 rounded-full">
                {simulation.totalCombinationsEvaluated || 72} Tested
              </span>
            </div>
          </div>

          {/* Recommended Material Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <p className="text-[10px] text-sky-300 font-semibold uppercase">Envelope Core</p>
              <p className="text-sm font-bold text-white mt-1">{rec.materials?.wallMaterial || rec.wallMaterial || 'Rammed Earth (Local Ladakh Soil)'}</p>
              <p className="text-[10px] text-slate-300 mt-1">High thermal storage mass</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <p className="text-[10px] text-sky-300 font-semibold uppercase">Thermal Insulation</p>
              <p className="text-sm font-bold text-white mt-1">{rec.materials?.insulationMaterial || rec.insulationMaterial || 'PUF Insulation (0.024 W/mK)'}</p>
              <p className="text-[10px] text-slate-300 mt-1">Conductive resistance barrier</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <p className="text-[10px] text-sky-300 font-semibold uppercase">Roof / Arch System</p>
              <p className="text-sm font-bold text-white mt-1">{rec.materials?.roofMaterial || rec.roofMaterial || 'Galvanized Iron + Insulation Roof'}</p>
              <p className="text-[10px] text-slate-300 mt-1">Overhead sky radiation shield</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <p className="text-[10px] text-sky-300 font-semibold uppercase">Window Glazing</p>
              <p className="text-sm font-bold text-white mt-1">{rec.materials?.windowMaterial || rec.windowMaterial || 'Double Low-E Argon Glazing'}</p>
              <p className="text-[10px] text-slate-300 mt-1">High passive solar gain capture</p>
            </div>
          </div>

          {/* Performance KPIs Row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
              <span className="text-[10px] text-slate-300 uppercase block">Min Night Temp</span>
              <span className="text-xl font-bold text-sky-300">{m.minIndoorTemp} °C</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
              <span className="text-[10px] text-slate-300 uppercase block">Peak Day Temp</span>
              <span className="text-xl font-bold text-amber-300">{m.maxIndoorTemp} °C</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
              <span className="text-[10px] text-slate-300 uppercase block">Comfort Hours</span>
              <span className="text-xl font-bold text-emerald-300">{m.comfortPercentage} %</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
              <span className="text-[10px] text-slate-300 uppercase block">24h Heat Loss</span>
              <span className="text-xl font-bold text-rose-300">{m.totalHeatLoss} kWh</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-300 uppercase block">Heating Required</span>
              <span className="text-xl font-bold text-orange-300">{m.heatingRequirement || 0} kWh</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. WHY THIS CONFIGURATION? ─── */}
      <div className="card-clean border-l-4 border-l-sky-600 bg-sky-50/40">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-sky-600" />
          Why was this configuration recommended?
        </h3>
        <p className="text-xs text-slate-700 leading-relaxed">
          {rec.explanation || rec.reason || (
            `This configuration was recommended because it produced the lowest overnight heat loss while maintaining indoor temperature for the longest period after sunset. High thermal mass envelope dampens extreme Himalayan outdoor temperature swings, while the high-performance insulation layer reduces conductive heat loss through the shelter envelope.`
          )}
        </p>
      </div>

      {/* ─── 3. GEOMETRY ANALYSIS & 3D VISUALIZATION ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Geometry Analysis Card */}
        <div className="card-clean space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Box className="w-4 h-4 text-sky-600" />
              Thermodynamic Geometry Analysis
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Archetype Shape</span>
                <span className="text-sm font-bold text-slate-800 capitalize">{shape}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Usable Floor Area</span>
                <span className="text-sm font-bold text-slate-800">{geometry.floorArea || 24.0} m²</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Enclosed Air Volume</span>
                <span className="text-sm font-bold text-slate-800">{geometry.volume || 60.0} m³</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Exposed Envelope Area</span>
                <span className="text-sm font-bold text-slate-800">{geometry.exposedEnvelopeArea || 75.0} m²</span>
              </div>
              <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl">
                <span className="text-[10px] text-amber-700 uppercase font-bold block">🚪 Doors</span>
                <span className="text-sm font-bold text-amber-900">
                  {simulation.shelter?.openings?.doorCount ?? 1} Door{(simulation.shelter?.openings?.doorCount ?? 1) > 1 ? 's' : ''}
                </span>
                <span className="text-[10px] text-amber-600 block">
                  ≈ {((simulation.shelter?.openings?.doorCount ?? 1) * 1.8).toFixed(1)} m² timber
                </span>
              </div>
              <div className="p-3 bg-sky-50/60 border border-sky-200/80 rounded-xl">
                <span className="text-[10px] text-sky-700 uppercase font-bold block">🪟 Windows & Glazing</span>
                <span className="text-sm font-bold text-sky-900">
                  {simulation.shelter?.openings?.windowCount ?? 2} Window{(simulation.shelter?.openings?.windowCount ?? 2) > 1 ? 's' : ''}
                </span>
                <span className="text-[10px] text-sky-600 block">
                  {simulation.shelter?.openings?.windowArea ?? 2.5} m² total
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-sky-50 border border-sky-100 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-sky-900">Surface-Area-to-Volume (A/V) Ratio:</span>
                <span className="text-sm font-mono font-bold text-sky-700">{geometry.surfaceAreaToVolumeRatio || 1.15} m⁻¹</span>
              </div>
              <p className="text-[11px] text-sky-800 leading-relaxed">
                A lower surface-area-to-volume ratio reduces the relative area exposed to harsh sub-zero ambient air per unit of heated living space. Thermal performance also depends on orientation, insulation thickness, solar gains, and thermal mass participation.
              </p>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-3">
            Description: {geometry.description || `${shape.toUpperCase()} shelter architecture`}
          </div>
        </div>

        {/* 3D Parametric Visualization with Thermal Tinting */}
        <div className="card-clean space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-sky-600" />
              3D Thermal State CAD Viewer
            </h3>
            {currentHourData && (
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                Simulated Hour: {String(selectedHour).padStart(2, '0')}:00
              </span>
            )}
          </div>

          <Shelter3DViewer
            shape={shape}
            geometry={simulation.shelter?.geometry}
            dimensions={simulation.dimensions || simulation.shelter?.geometry}
            design={simulation.shelter?.design}
            openings={simulation.shelter?.openings}
            thermalHourData={currentHourData}
            height={300}
          />
        </div>
      </div>

      {/* ─── 4. 24-HOUR TEMPERATURE TIMELINE & TIME SCRUBBER ─── */}
      <div className="card-clean space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              24-Hour Thermal Performance Timeline (°C)
            </h3>
            <p className="text-[11px] text-slate-400">
              Solid Blue: Indoor Temperature | Dashed Slate: Outdoor Ambient Temperature | Shaded Green Band: 18–24°C Comfort Zone
            </p>
          </div>

          {currentHourData && (
            <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700">{String(selectedHour).padStart(2, '0')}:00</span>
              <span className="text-sky-700 font-semibold">Indoor: {currentHourData.indoorTemperature}°C</span>
              <span className="text-slate-500">Outdoor: {currentHourData.ambientTemperature}°C</span>
              <span className="text-amber-600 font-semibold">Solar Gain: {currentHourData.solarGain}W</span>
            </div>
          )}
        </div>

        {/* Time Scrubber Slider */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-4">
          <Clock className="w-4 h-4 text-sky-600 shrink-0" />
          <input
            type="range"
            min="0"
            max="23"
            step="1"
            value={selectedHour}
            onChange={(e) => setSelectedHour(parseInt(e.target.value))}
            className="w-full accent-sky-600 cursor-pointer"
          />
          <span className="text-xs font-mono font-bold text-slate-700 shrink-0 w-12 text-right">
            {String(selectedHour).padStart(2, '0')}:00
          </span>
        </div>

        {/* Main Line Chart with Comfort Band */}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              {/* Comfort Zone Reference Area */}
              <ReferenceArea y1={18} y2={24} fill="#10b981" fillOpacity={0.08} />
              <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={10} tickFormatter={(t) => t.substr(11, 5)} />
              <YAxis stroke="#94a3b8" fontSize={10} unit="°C" domain={tempDomain} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="indoorTemperature" name="Indoor Temp (°C)" stroke="#0284c7" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="ambientTemperature" name="Outdoor Ambient (°C)" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── 5. HEAT LOSS BREAKDOWN ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-clean space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Where is Heat Being Lost? (Component Heat Flux)
          </h3>
          <p className="text-[11px] text-slate-400">
            Calculated percentage and average conductive/radiative/ventilation heat flux across envelope assemblies.
          </p>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={heatLossBreakdownData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} unit="W" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={90} />
                <Tooltip formatter={(value) => [`${value} Watts`, 'Average Loss']} />
                <Bar dataKey="watts" radius={[0, 4, 4, 0]}>
                  {heatLossBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-clean space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Envelope Thermal Loss Distribution (%)
            </h3>
            <div className="space-y-2">
              {heatLossBreakdownData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }}></span>
                    <span className="font-semibold text-slate-700">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">{item.watts} W</span>
                    <span className="font-bold text-slate-900 w-12 text-right">{item.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl text-xs text-amber-800">
            <strong>Thermal Insight:</strong> In {shape} shelters, prioritizing the highest loss component with high-performance insulation yields the highest marginal reduction in nighttime cooling.
          </div>
        </div>
      </div>

      {/* ─── 6. TOP 3 MATERIAL CONFIGURATIONS TABLE (FIXED) ─── */}
      <div className="card-clean space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Top 3 Evaluated Material Configurations (Transparent Ranking)
            </h3>
            <p className="text-[11px] text-slate-400">
              Evaluated with identical climate conditions and geometry. Configuration #1 is selected as optimal.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            Multi-Criteria Scoring
          </span>
        </div>

        <div className="overflow-x-auto">
          {top3.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
              No top configurations recorded for this simulation run.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="p-3">Rank</th>
                  <th className="p-3">Envelope Core</th>
                  <th className="p-3">Insulation</th>
                  <th className="p-3">Glazing</th>
                  <th className="p-3 text-center">Min Night T</th>
                  <th className="p-3 text-center">Heat Loss</th>
                  <th className="p-3 text-center">Heating Req</th>
                  <th className="p-3 text-center">Comfort %</th>
                  <th className="p-3 text-right">Composite Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {top3.map((cfg, idx) => {
                  const isWinner = cfg.rank === 1 || idx === 0;
                  const envelopeName = cfg.envelope || cfg.wallMaterial || 'Rammed Earth';
                  const insName = cfg.insulation || cfg.insulationMaterial || 'PUF Insulation';
                  const winName = cfg.glazing || cfg.windowMaterial || 'Double Low-E';
                  const minT = cfg.minNightTemp !== undefined ? cfg.minNightTemp : m.minIndoorTemp;
                  const loss = cfg.heatLoss !== undefined ? cfg.heatLoss : m.totalHeatLoss;
                  const heatReq = cfg.heatingRequirement !== undefined ? cfg.heatingRequirement : 0;
                  const comf = cfg.comfortPercent !== undefined ? cfg.comfortPercent : (cfg.comfortPercentage !== undefined ? cfg.comfortPercentage : m.comfortPercentage);
                  const scoreVal = cfg.compositeScore !== undefined ? cfg.compositeScore : (cfg.score !== undefined ? cfg.score : 85.0);

                  return (
                    <tr key={idx} className={isWinner ? 'bg-sky-50/70 font-medium' : 'hover:bg-slate-50'}>
                      <td className="p-3 font-bold">
                        {isWinner ? (
                          <span className="inline-flex items-center gap-1 bg-sky-600 text-white px-2 py-0.5 rounded text-[11px]">
                            #1 Winner
                          </span>
                        ) : (
                          <span className="text-slate-500">#{cfg.rank || idx + 1}</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-800 font-semibold">{envelopeName}</td>
                      <td className="p-3 text-slate-600">{insName}</td>
                      <td className="p-3 text-slate-600">{winName}</td>
                      <td className="p-3 text-center font-bold text-sky-700">{minT} °C</td>
                      <td className="p-3 text-center text-rose-700">{loss} kWh</td>
                      <td className="p-3 text-center text-orange-700">{heatReq} kWh</td>
                      <td className="p-3 text-center font-bold text-emerald-700">{comf} %</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 text-sm">
                        {scoreVal}/100
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ─── 7. FAIR SHAPE COMPARISON MODAL / DRAWER ─── */}
      {showComparison && (
        <div ref={comparisonRef} className="card-clean border-2 border-sky-500 space-y-4 bg-sky-50/20 scroll-mt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-600" />
                Fair Multi-Shape Performance Comparison (Normalized to {geometry.floorArea || 24}m² Floor Area)
              </h3>
              <p className="text-xs text-slate-500">
                Evaluating all 4 geometric archetypes under equal usable floor area, identical climate data, and material optimization.
              </p>
            </div>
            <button
              onClick={() => setShowComparison(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              ✕ Close
            </button>
          </div>

          {comparisonLoading ? (
            <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
              Running multi-shape thermodynamic simulations...
            </div>
          ) : comparisonData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {comparisonData.comparisonResults.map((item, idx) => {
                  const isTop = idx === 0;
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border ${
                        isTop ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-100' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <h4 className="text-xs font-bold text-slate-800">{item.shapeTitle}</h4>
                        {isTop && (
                          <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">
                            Top Shape
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">A/V Ratio: {item.geometry.surfaceAreaToVolumeRatio} m⁻¹</p>
                      <div className="mt-2 pt-2 border-t border-slate-100 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Min Night T:</span>
                          <span className="font-bold text-sky-700">{item.metrics.minIndoorTemp}°C</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">24h Heat Loss:</span>
                          <span className="font-bold text-rose-700">{item.metrics.totalHeatLoss} kWh</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Comfort:</span>
                          <span className="font-bold text-emerald-700">{item.metrics.comfortPercentage}%</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-100 font-bold">
                          <span className="text-slate-700">Score:</span>
                          <span className="text-slate-900">{item.score}/100</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ─── 8. PHYSICS ASSUMPTIONS & LIMITATIONS ─── */}
      <div className="card-clean space-y-3">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Info className="w-4 h-4 text-slate-500" />
          Simulation Assumptions & Bounding Physics
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600">
          {(simulation.assumptions || []).map((asm, idx) => (
            <li key={idx} className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
              <span>{asm}</span>
            </li>
          ))}
          <li className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
            <span>Multi-shape thermodynamic surface area integration (shapeCalculator module).</span>
          </li>
          <li className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
            <span>24-hour warm-up cycle stabilization for lumped capacitance periodic steady state.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
