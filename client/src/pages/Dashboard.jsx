import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import api from '../services/api';
import heroBg from '../assets/dashboard/dashboard-hero.png';
import mountainFooterBg from '../assets/dashboard/dashboard-mountain-footer.png';

import {
  PlusCircle,
  Box,
  Sun,
  Shield,
  ArrowRight,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  Layers,
  MapPin,
  Wind,
  Thermometer,
  Cpu,
  GitCompare,
  Calendar,
  Clock,
  Sparkles,
  Mountain,
  ChevronRight
} from 'lucide-react';

// Fix Leaflet marker icon paths for React / Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom custom marker icon for simulated sites
const customSiteIcon = new L.DivIcon({
  className: 'custom-map-pin',
  html: `
    <div style="
      background-color: #0284c7;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: 3px solid #ffffff;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    ">
      <div style="width: 8px; height: 8px; background-color: #ffffff; border-radius: 50%;"></div>
    </div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -14],
});

export default function Dashboard() {
  const [simulations, setSimulations] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [simRes, shelterRes] = await Promise.all([
          api.get('/simulation/user/history'),
          api.get('/shelters').catch(() => ({ data: [] }))
        ]);
        setSimulations(simRes.data || []);
        setShelters(shelterRes.data || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // Compute Real KPIs
  const totalSims = simulations.length;
  const completedSims = simulations.filter(
    (s) => (s.status || '').toLowerCase() === 'completed'
  ).length;
  const savedDesignsCount = shelters.length;

  // Extract unique locations and coordinates from real simulations
  const uniqueLocationsMap = new Map();
  simulations.forEach((sim) => {
    const climate = sim.climateDataset || {};
    const locName = climate.location || climate.cityName || sim.location || 'High Altitude Site';
    let lat = climate.latitude;
    let lng = climate.longitude;

    if ((lat === undefined || lng === undefined) && climate.coordinates) {
      if (Array.isArray(climate.coordinates) && climate.coordinates.length >= 2) {
        // [lng, lat] or [lat, lng]
        lat = climate.coordinates[1] || climate.coordinates[0];
        lng = climate.coordinates[0] || climate.coordinates[1];
      }
    }

    if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
      const key = `${Number(lat).toFixed(3)}_${Number(lng).toFixed(3)}`;
      if (!uniqueLocationsMap.has(key)) {
        uniqueLocationsMap.set(key, {
          name: locName,
          lat: Number(lat),
          lng: Number(lng),
          simCount: 0,
          shapes: new Set(),
          lastDate: sim.createdAt || sim.date || null,
          lastSimId: sim._id
        });
      }
      const item = uniqueLocationsMap.get(key);
      item.simCount += 1;
      const shapeType = sim.shape || sim.shelter?.shape || 'rectangle';
      item.shapes.add(shapeType);
      if (new Date(sim.createdAt) > new Date(item.lastDate)) {
        item.lastDate = sim.createdAt;
        item.lastSimId = sim._id;
      }
    }
  });

  const uniqueLocations = Array.from(uniqueLocationsMap.values());
  const uniqueLocationsCount = uniqueLocations.length > 0 ? uniqueLocations.length : 0;

  // Total material combinations evaluated across real completed runs
  const totalCombinationsEvaluated = simulations.reduce((acc, s) => {
    return acc + (s.totalCombinationsEvaluated || (s.topConfigurations?.length ? s.topConfigurations.length : 1));
  }, 0);

  // Shape usage counts from real simulations
  const getShapeCount = (shapeKey) => {
    return simulations.filter((s) => {
      const sh = (s.shape || s.shelter?.shape || '').toLowerCase();
      if (shapeKey === 'a-frame') return sh.includes('a-frame') || sh.includes('aframe');
      return sh === shapeKey;
    }).length;
  };

  const shapesData = [
    {
      id: 'rectangle',
      name: 'Rectangular Shelter',
      tagline: 'Standard High-Density Modular',
      desc: 'Proven modular footprint with optimal internal living volume and direct south-facing glazing aperture.',
      count: getShapeCount('rectangle'),
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      id: 'dome',
      name: 'Geodesic Dome',
      tagline: 'Aerodynamic Envelope',
      desc: 'Low wind resistance profile with omnidirectional solar interception and uniform envelope heat retention.',
      count: getShapeCount('dome'),
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      id: 'a-frame',
      name: 'A-Frame Shelter',
      tagline: 'Alpine Snow-Shedding',
      desc: 'Steep pitch angles engineered to prevent high-altitude snow accumulation and maximize vertical solar capture.',
      count: getShapeCount('a-frame'),
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    {
      id: 'quonset',
      name: 'Quonset Arch',
      tagline: 'High Volume Efficiency',
      desc: 'Continuous semi-cylindrical curved envelope minimizing corner thermal bridges and turbulent wind shear.',
      count: getShapeCount('quonset'),
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
    }
  ];

  // Center map on first real location or Leh Ladakh default
  const mapCenter = uniqueLocations.length > 0
    ? [uniqueLocations[0].lat, uniqueLocations[0].lng]
    : [34.1526, 77.5771];

  const recentSimulations = simulations.slice(0, 4);

  return (
    <div className="space-y-8 pb-4">
      {/* 1. HERO / HEADER BANNER */}
      <div
        className="relative overflow-hidden rounded-2xl shadow-sm border border-slate-200 bg-slate-900 min-h-[300px] flex items-center"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Left readable gradient overlay */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.94) 32%, rgba(255,255,255,0.72) 55%, rgba(255,255,255,0.20) 78%, rgba(255,255,255,0.00) 100%)'
          }}
        />

        {/* Hero Content */}
        <div className="relative z-10 p-6 sm:p-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-[11px] font-bold uppercase tracking-wider mb-3">
            <Shield className="w-3.5 h-3.5 text-sky-600" />
            Engineering for a Safer Tomorrow
          </div>

          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
            Design. Simulate.{' '}
            <span className="text-sky-600">Optimize.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-700 font-normal leading-relaxed mb-6">
            Explore climate-responsive passive shelter designs engineered for extreme high-altitude cold environments.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/new-simulation')}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-sm font-semibold rounded-xl shadow-md transition-all duration-150 inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              New Simulation
            </button>

            <button
              onClick={() => navigate('/compare')}
              className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl border border-slate-300 shadow-sm transition-all duration-150 inline-flex items-center gap-2"
            >
              <GitCompare className="w-4 h-4 text-slate-500" />
              Compare Designs
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* Conceptual Highlights Tags */}
          <div className="mt-6 flex flex-wrap items-center gap-2 pt-4 border-t border-slate-200/60">
            <span className="text-[11px] font-medium bg-white/90 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200/80 shadow-2xs">
              ❄️ Extreme Cold Environments
            </span>
            <span className="text-[11px] font-medium bg-white/90 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200/80 shadow-2xs">
              🏔️ High-Altitude Physics
            </span>
            <span className="text-[11px] font-medium bg-white/90 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200/80 shadow-2xs">
              ☀️ Sol-Air Solar Gains
            </span>
            <span className="text-[11px] font-medium bg-white/90 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200/80 shadow-2xs">
              ⚡ Multi-Material Optimization
            </span>
          </div>
        </div>
      </div>

      {/* 2. REAL METRICS / KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white card-clean">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Simulations</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-display font-bold text-slate-900">{totalSims}</p>
          <p className="text-[11px] text-slate-500 mt-1">Recorded thermal simulations</p>
        </div>

        <div className="bg-white card-clean">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Runs</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-display font-bold text-slate-900">{completedSims}</p>
          <p className="text-[11px] text-slate-500 mt-1">Full 24h transient physics solved</p>
        </div>

        <div className="bg-white card-clean">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saved Geometries</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Box className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-display font-bold text-slate-900">{savedDesignsCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Custom shelter blueprints</p>
        </div>

        <div className="bg-white card-clean">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Locations Explored</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-display font-bold text-slate-900">{uniqueLocationsCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Distinct high-altitude sites</p>
        </div>
      </div>

      {/* 3. CLIMATE EXPLORATION MAP & RECENT RUNS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Real Climate Exploration Map */}
        <div className="lg:col-span-2 bg-white card-clean flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-600" />
                  Climate Exploration Map
                </h2>
                <p className="text-xs text-slate-500">
                  Geographic locations simulated with real climate data
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                {uniqueLocations.length} {uniqueLocations.length === 1 ? 'Site Active' : 'Sites Active'}
              </span>
            </div>

            {/* Map Container */}
            <div className="relative rounded-xl overflow-hidden border border-slate-200 h-[320px] bg-slate-100">
              <MapContainer
                center={mapCenter}
                zoom={uniqueLocations.length > 0 ? 6 : 5}
                className="w-full h-full"
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {uniqueLocations.map((loc, idx) => (
                  <Marker
                    key={idx}
                    position={[loc.lat, loc.lng]}
                    icon={customSiteIcon}
                  >
                    <Popup>
                      <div className="p-1 text-xs">
                        <p className="font-bold text-slate-800 text-sm">{loc.name}</p>
                        <p className="text-slate-500 mt-0.5">
                          Coordinates: {loc.lat.toFixed(3)}°N, {loc.lng.toFixed(3)}°E
                        </p>
                        <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                          <p className="text-slate-700">
                            <strong>Simulations Run:</strong> {loc.simCount}
                          </p>
                          <p className="text-slate-700">
                            <strong>Shapes:</strong> {Array.from(loc.shapes).join(', ')}
                          </p>
                        </div>
                        {loc.lastSimId && (
                          <button
                            onClick={() => navigate(`/simulations?id=${loc.lastSimId}`)}
                            className="mt-2 w-full text-center py-1 bg-sky-600 text-white rounded font-medium text-[11px] hover:bg-sky-700"
                          >
                            View Simulation →
                          </button>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              {/* Empty State Banner if 0 Locations */}
              {uniqueLocations.length === 0 && (
                <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] z-[400] flex items-center justify-center p-6">
                  <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-5 max-w-md text-center">
                    <div className="w-10 h-10 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">No Simulated Locations Yet</h3>
                    <p className="text-xs text-slate-500 mt-1 mb-4">
                      Create your first simulation by picking any high-altitude location (Leh, Dras, Siachen) to plot climate sites on this interactive map.
                    </p>
                    <button
                      onClick={() => navigate('/new-simulation')}
                      className="btn-primary py-1.5 px-4 text-xs mx-auto"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Start First Simulation
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Recent Simulations Card */}
        <div className="bg-white card-clean flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-600" />
                Recent Simulations
              </h2>
              <button
                onClick={() => navigate('/simulations')}
                className="text-xs text-sky-600 hover:text-sky-700 font-semibold inline-flex items-center gap-1"
              >
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentSimulations.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <Activity className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-700">No Simulations Recorded</p>
                <p className="text-[11px] text-slate-400 mt-1 mb-4">
                  Run a thermal analysis to see recent engineering outputs here.
                </p>
                <button
                  onClick={() => navigate('/new-simulation')}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  Create Simulation
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSimulations.map((sim) => (
                  <div
                    key={sim._id}
                    onClick={() => navigate(`/simulations?id=${sim._id}`)}
                    className="p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50/80 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate group-hover:text-sky-600 transition-colors">
                          {sim.name || 'Transient Shelter Run'}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <span className="capitalize font-medium text-slate-700">
                            {sim.shape || sim.shelter?.shape || 'Rectangle'}
                          </span>
                          <span>•</span>
                          <span className="truncate">
                            {sim.climateDataset?.location || sim.climateDataset?.cityName || 'Ladakh'}
                          </span>
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                          (sim.status || '').toLowerCase() === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {sim.status || 'Completed'}
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{sim.createdAt ? new Date(sim.createdAt).toLocaleDateString() : 'Recent'}</span>
                      <span className="text-sky-600 font-semibold group-hover:underline flex items-center gap-0.5">
                        Inspect <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Compare CTA Prompt */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => navigate('/compare')}
              className="w-full py-2 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-between transition"
            >
              <span className="flex items-center gap-1.5">
                <GitCompare className="w-3.5 h-3.5 text-sky-600" />
                Compare Parametric Geometries
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. EXPLORE SHELTER GEOMETRIES */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Explore Shelter Geometries</h2>
            <p className="text-xs text-slate-500">
              Parametric shapes calibrated for high-altitude wind resistance, thermal mass, and solar gain
            </p>
          </div>
          <button
            onClick={() => navigate('/shelter-designer')}
            className="text-xs text-sky-600 hover:text-sky-700 font-semibold inline-flex items-center gap-1"
          >
            Shelter Designer <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {shapesData.map((shape) => (
            <div
              key={shape.id}
              onClick={() => navigate('/new-simulation', { state: { preselectedShape: shape.id } })}
              className="bg-white card-clean flex flex-col justify-between hover:shadow-md cursor-pointer group transition-all"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold group-hover:bg-sky-50 group-hover:text-sky-600 transition-colors">
                    <Box className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${shape.badgeColor}`}>
                    {shape.count} {shape.count === 1 ? 'Simulation' : 'Simulations'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-800 group-hover:text-sky-600 transition-colors">
                  {shape.name}
                </h3>
                <p className="text-[11px] font-medium text-sky-700 mb-2">{shape.tagline}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{shape.desc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-sky-600 font-semibold group-hover:underline">
                <span>Configure Geometry</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. DESIGN SPACE & PHYSICS CAPABILITIES */}
      <div className="bg-white card-clean">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-800">Design Space & Transient Physics Capabilities</h2>
            <p className="text-xs text-slate-500">
              Integrated engineering modules operating behind every simulation run
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">Physics Engine v2.4</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-bold text-slate-800">Sol-Air Radiation Solver</h4>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Calculates surface solar absorption, long-wave radiation to sky, and exterior film conductance dynamically per surface tilt.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Wind className="w-4 h-4 text-sky-500" />
              <h4 className="text-xs font-bold text-slate-800">Infiltration & ACH Control</h4>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Standardized 0.5 ACH high-altitude air exchange modeling cold air ingress and latent occupant internal heat generation.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-purple-500" />
              <h4 className="text-xs font-bold text-slate-800">Automated Material Ranking</h4>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Evaluates candidate cladding, insulation, and lining configurations, outputting Top-3 ranked recommendations based on thermal score.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Thermometer className="w-4 h-4 text-emerald-500" />
              <h4 className="text-xs font-bold text-slate-800">24h Cyclic Warm-Up</h4>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Executes dual-pass thermal stabilization cycle to eliminate cold-start bias and accurately capture envelope thermal mass damping.
            </p>
          </div>
        </div>
      </div>

      {/* 6. CINEMATIC MOUNTAIN FOOTER (BLENDED SEAMLESSLY INTO DASHBOARD) */}
      <div className="relative w-full sm:-mx-6 sm:w-[calc(100%+48px)] -mb-6 mt-2 sm:mt-4 overflow-hidden pointer-events-none select-none">
        <div
          className="relative w-full h-[175px] sm:h-[210px] lg:h-[240px] flex items-end justify-center text-center pb-6 sm:pb-8 px-4"
          style={{
            backgroundImage: `url(${mountainFooterBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center bottom',
            backgroundRepeat: 'no-repeat',
            maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.05) 8%, rgba(0,0,0,0.20) 18%, rgba(0,0,0,0.55) 32%, black 52%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.05) 8%, rgba(0,0,0,0.20) 18%, rgba(0,0,0,0.55) 32%, black 52%, black 100%)'
          }}
        >
          {/* Top seamless blend matching dashboard background (#f8fafc) */}
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, #f8fafc 0%, rgba(248,250,252,0.95) 8%, rgba(248,250,252,0.70) 20%, rgba(248,250,252,0.25) 36%, transparent 55%)'
            }}
          />

          {/* Localized lower text contrast gradient that preserves rich mountain colors */}
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, transparent 35%, rgba(5,35,70,0.08) 55%, rgba(5,35,70,0.35) 100%)'
            }}
          />

          {/* Text Section */}
          <div className="relative z-10 max-w-xl mx-auto pointer-events-auto">
            <div className="flex items-center justify-center gap-3 mb-1">
              <div className="h-[1px] w-6 sm:w-12 bg-white/40" />
              <h3
                className="text-base sm:text-lg md:text-xl font-display font-bold tracking-wide text-white"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.30)' }}
              >
                Towards a Warmer &amp; Safer Tomorrow
              </h3>
              <div className="h-[1px] w-6 sm:w-12 bg-white/40" />
            </div>
            <p
              className="text-[11px] sm:text-xs text-white/80 font-medium tracking-wider"
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.25)' }}
            >
              Passive Design • Climate Intelligence • Engineering Decisions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
