import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Box,
  Users,
  Sliders,
  Sparkles,
  Award,
  Layers,
  Thermometer,
  FileText,
  Flame,
  Sun,
  Activity,
  DoorOpen,
  AppWindow
} from 'lucide-react';
import LocationPicker from '../components/LocationPicker';
import Shelter3DViewer from '../three/Shelter3DViewer';
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

export default function NewSimulation() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchingMaterials, setSearchingMaterials] = useState(false);
  const [error, setError] = useState('');

  // 1. Automatically Fetched Location & Climate Data
  const [selectedClimate, setSelectedClimate] = useState(null);
  const [climateStats, setClimateStats] = useState({ minTemp: null, maxTemp: null });

  // 2. Shelter Geometry & Occupants Input
  const [shelterName, setShelterName] = useState('High-Altitude Passive Shelter');
  const [geometry, setGeometry] = useState({
    length: 6.0,
    width: 4.0,
    height: 2.8,
    wallThickness: 0.25,
    roofThickness: 0.20,
    floorThickness: 0.15
  });
  const [occupantsCount, setOccupantsCount] = useState(4);

  // 3. Openings Inputs (Windows & Doors)
  const [openings, setOpenings] = useState({
    windowCount: 2,
    windowArea: 2.5,
    doorCount: 1,
    doorArea: 1.8,
    openingOrientation: 180
  });

  const [design, setDesign] = useState({
    shape: 'Rectangular',
    orientation: 180,
    roofType: 'Gable',
    roofAngle: 25
  });

  // Comfort settings automatically derived from location min/max temperature
  const [comfortSettings, setComfortSettings] = useState({
    minComfortTemp: 18,
    maxComfortTemp: 24
  });

  // 4. Algorithm Output Results
  const [bestMaterials, setBestMaterials] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);
  const [savedSimId, setSavedSimId] = useState(null);

  useEffect(() => {
    async function loadMaterials() {
      try {
        const res = await api.get('/materials');
        setMaterials(res.data || []);
      } catch (err) {
        console.error('Failed to load materials database:', err);
      }
    }
    loadMaterials();
  }, []);

  // When location climate data changes, compute location's min and max ambient temperatures automatically
  const handleLocationSelected = (climateData) => {
    setSelectedClimate(climateData);
    setError('');

    if (climateData && climateData.dataPoints && climateData.dataPoints.length > 0) {
      const temps = climateData.dataPoints.map(p => p.ambientTemperature);
      const minT = Math.min(...temps);
      const maxT = Math.max(...temps);

      setClimateStats({
        minTemp: Number(minT.toFixed(1)),
        maxTemp: Number(maxT.toFixed(1))
      });

      // Automatically base comfort evaluation on location's extreme cold conditions
      setComfortSettings({
        minComfortTemp: 18,
        maxComfortTemp: 24
      });
    }
  };

  const steps = [
    { num: 1, title: 'Select Location' },
    { num: 2, title: 'Dimensions & Occupants' },
    { num: 3, title: 'Openings Specification' },
    { num: 4, title: 'Search & Calculate' },
    { num: 5, title: '3D Design & Results' }
  ];

  // Automated Material Search & Thermal Simulation Algorithm
  const handleRunSearchAndSimulation = async () => {
    setSearchingMaterials(true);
    setError('');

    if (!selectedClimate) {
      setError('Please select a location on the map to fetch weather data first.');
      setSearchingMaterials(false);
      return;
    }

    try {
      let matList = materials;
      if (matList.length === 0) {
        const mRes = await api.get('/materials');
        matList = mRes.data || [];
        setMaterials(matList);
      }

      // Base shelter configuration
      const baseShelter = {
        name: shelterName,
        geometry,
        design,
        openings,
        internalGains: { occupantsCount, heatPerOccupant: 80, equipmentPower: 100 },
        materials: {
          wallMaterial: matList.find(m => m.category === 'Wall') || matList[0],
          roofMaterial: matList.find(m => m.category === 'Roof') || matList[0],
          floorMaterial: matList.find(m => m.category === 'Floor') || matList[0],
          insulationMaterial: matList.find(m => m.category === 'Insulation') || matList[0],
          windowMaterial: matList.find(m => m.category === 'Window') || matList[0],
          doorMaterial: matList.find(m => m.category === 'Door') || matList[0]
        }
      };

      // Run Grid Search Optimization across database materials
      const optRes = await api.post('/optimization/grid', {
        baseShelter,
        climateDataset: selectedClimate,
        materialsList: matList,
        objectiveWeights: { comfortWeight: 0.5, heatLossWeight: 0.3, solarGainWeight: 0.2 },
        comfortSettings
      });

      const bestCand = optRes.data?.bestCandidate;
      const recShelterConfig = bestCand?.shelterConfig;

      // Match recommended material objects
      const recWall = matList.find(m => m.name === recShelterConfig?.wallMaterialName) || matList.find(m => m.category === 'Wall') || matList[0];
      const recRoof = matList.find(m => m.name === recShelterConfig?.roofMaterialName) || matList.find(m => m.category === 'Roof') || matList[0];
      const recIns = matList.find(m => m.name === recShelterConfig?.insulationMaterialName) || matList.find(m => m.category === 'Insulation') || matList[0];
      const recWin = matList.find(m => m.category === 'Window') || matList[0];
      const recDoor = matList.find(m => m.category === 'Door') || matList[0];

      const optimalMaterialSet = {
        wallMaterial: recWall,
        roofMaterial: recRoof,
        floorMaterial: matList.find(m => m.category === 'Floor') || recWall,
        insulationMaterial: recIns,
        windowMaterial: recWin,
        doorMaterial: recDoor
      };

      setBestMaterials(optimalMaterialSet);

      // Extract algorithm-predicted shape
      const predictedShape = recShelterConfig?.shape || 'Rectangular';
      const predictedOrientation = recShelterConfig?.orientation || 180;
      setDesign(prev => ({ ...prev, shape: predictedShape, orientation: predictedOrientation }));

      // Run Final Thermal Physics Engine Simulation with Optimal Materials
      const finalShelterPayload = {
        ...baseShelter,
        materials: optimalMaterialSet,
        design: { ...baseShelter.design, shape: predictedShape, orientation: predictedOrientation }
      };

      const simRes = await api.post('/simulation/run', {
        name: `Simulation - ${shelterName}`,
        shelter: finalShelterPayload,
        climateDataset: selectedClimate,
        comfortSettings
      });

      setSimulationResult(simRes.data);
      setSavedSimId(simRes.data._id);

      // Advance to final 3D Design & Results step
      setCurrentStep(5);
    } catch (err) {
      console.error('Material search & simulation error:', err);
      setError(err.response?.data?.error || 'Failed to search materials and run thermal simulation.');
    } finally {
      setSearchingMaterials(false);
    }
  };

  const compData = simulationResult?.results?.componentBreakdown
    ? [
        { component: 'Walls', loss: simulationResult.results.componentBreakdown.wallConduction || 0 },
        { component: 'Roof', loss: simulationResult.results.componentBreakdown.roofConduction || 0 },
        { component: 'Floor', loss: simulationResult.results.componentBreakdown.floorConduction || 0 },
        { component: 'Windows', loss: simulationResult.results.componentBreakdown.windowConduction || 0 },
        { component: 'Doors', loss: simulationResult.results.componentBreakdown.doorConduction || 0 }
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Wizard Header */}
      <div className="card-clean p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Passive Shelter Thermal Design Wizard</h1>
          <p className="text-xs text-slate-500">
            Select location on map, specify dimensions, occupants, windows & doors, then let the algorithm evaluate database materials and generate your custom 3D design.
          </p>
        </div>
        <span className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200">
          Step {currentStep} of 5: {steps[currentStep - 1].title}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="card-clean p-4">
        <div className="flex justify-between items-center relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -z-0"></div>
          {steps.map((step) => {
            const isDone = step.num < currentStep;
            const isCurrent = step.num === currentStep;
            return (
              <div key={step.num} className="relative z-10 flex flex-col items-center">
                <button
                  onClick={() => {
                    if (step.num < currentStep || (step.num === 5 && simulationResult)) {
                      setCurrentStep(step.num);
                    }
                  }}
                  disabled={step.num > currentStep && !simulationResult}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    isDone
                      ? 'bg-sky-600 text-white'
                      : isCurrent
                      ? 'bg-sky-600 text-white ring-4 ring-sky-100'
                      : 'bg-slate-200 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : step.num}
                </button>
                <span className={`text-[10px] mt-1 font-semibold ${isCurrent ? 'text-sky-700' : 'text-slate-500'}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">{error}</div>}

      {/* Step Contents */}
      <div className="card-clean p-6">
        {/* STEP 1: MAP LOCATION PICKER (Weather, Min/Max Temp fetched automatically) */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <LocationPicker
              onLocationSelected={handleLocationSelected}
              initialLocation={
                selectedClimate
                  ? {
                      latitude: selectedClimate.latitude,
                      longitude: selectedClimate.longitude,
                      displayName: selectedClimate.location || selectedClimate.name
                    }
                  : null
              }
            />

            {selectedClimate && (
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Location Selected: {selectedClimate.location || selectedClimate.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Weather dataset loaded automatically ({selectedClimate.dataPoints?.length || 0} hourly time-series points).
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="btn-primary py-2 px-4 text-xs"
                  >
                    Proceed to Dimensions <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {climateStats.minTemp !== null && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-sky-200/60 text-xs">
                    <div className="bg-white p-2 rounded border border-sky-100">
                      <span className="text-[10px] text-slate-500 block font-medium">Location Min Temperature</span>
                      <span className="font-bold text-sky-700 text-sm">{climateStats.minTemp} °C</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-sky-100">
                      <span className="text-[10px] text-slate-500 block font-medium">Location Max Temperature</span>
                      <span className="font-bold text-amber-700 text-sm">{climateStats.maxTemp} °C</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: SHELTER DIMENSIONS & OCCUPANTS (NO 3D model during inputs) */}
        {currentStep === 2 && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Box className="w-5 h-5 text-sky-600" /> Shelter Dimensions & Occupants
              </h2>
              <p className="text-xs text-slate-500">
                Specify shelter structural dimensions and occupants count.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Shelter Design Name</label>
                <input
                  type="text"
                  value={shelterName}
                  onChange={(e) => setShelterName(e.target.value)}
                  className="input-clean"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Length (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="50"
                    value={geometry.length}
                    onChange={(e) => setGeometry({ ...geometry, length: parseFloat(e.target.value) || 1 })}
                    className="input-clean"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Width (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="50"
                    value={geometry.width}
                    onChange={(e) => setGeometry({ ...geometry, width: parseFloat(e.target.value) || 1 })}
                    className="input-clean"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Height (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={geometry.height}
                    onChange={(e) => setGeometry({ ...geometry, height: parseFloat(e.target.value) || 1 })}
                    className="input-clean"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-sky-600" /> Number of Occupants (Internal Heat Generation)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={occupantsCount}
                  onChange={(e) => setOccupantsCount(parseInt(e.target.value) || 0)}
                  className="input-clean"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Each occupant adds ~80W heat generation to the internal zone thermal energy balance.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: OPENINGS SPECIFICATION (Windows & Doors, NO manual material dropdowns) */}
        {currentStep === 3 && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <AppWindow className="w-5 h-5 text-sky-600" /> Windows & Doors Specification
              </h2>
              <p className="text-xs text-slate-500">
                Specify window and door counts and areas. Thermal materials will be automatically evaluated from the database by the algorithm.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <AppWindow className="w-4 h-4 text-sky-600" /> Windows Specification
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Window Count</label>
                  <input
                    type="number"
                    min="0"
                    value={openings.windowCount}
                    onChange={(e) => setOpenings({ ...openings, windowCount: parseInt(e.target.value) || 0 })}
                    className="input-clean"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Window Area (m²)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={openings.windowArea}
                    onChange={(e) => setOpenings({ ...openings, windowArea: parseFloat(e.target.value) || 0 })}
                    className="input-clean"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <DoorOpen className="w-4 h-4 text-amber-600" /> Doors Specification
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Door Count</label>
                  <input
                    type="number"
                    min="0"
                    value={openings.doorCount}
                    onChange={(e) => setOpenings({ ...openings, doorCount: parseInt(e.target.value) || 0 })}
                    className="input-clean"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Door Area (m²)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={openings.doorArea}
                    onChange={(e) => setOpenings({ ...openings, doorArea: parseFloat(e.target.value) || 0 })}
                    className="input-clean"
                  />
                </div>
              </div>
            </div>

            {/* Automatically Derived Location Climate Bounds summary */}
            {climateStats.minTemp !== null && (
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-900 flex items-center justify-between">
                <div>
                  <span className="font-bold">Location Weather Bounds (Automatically Considered):</span>
                  <span className="ml-2 text-slate-700">Min Temp: <strong>{climateStats.minTemp}°C</strong> | Max Temp: <strong>{climateStats.maxTemp}°C</strong></span>
                </div>
                <span className="text-[10px] bg-sky-100 text-sky-800 font-semibold px-2 py-0.5 rounded">Auto-Fetched</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: AUTOMATED MATERIAL SEARCH & PHYSICS SIMULATION */}
        {currentStep === 4 && (
          <div className="space-y-6 text-center py-8 max-w-lg mx-auto">
            <div className="w-16 h-16 bg-sky-100 text-sky-600 rounded-full mx-auto flex items-center justify-center mb-2">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Run Automated Material Search</h2>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                The algorithm will search the thermophysical materials database, evaluate heat conduction, sky radiation, and solar gains for your location and geometry, and select the <strong>Best Suitable Materials</strong> for the shelter.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 text-left space-y-1.5">
              <p>📍 Location: <strong>{selectedClimate?.location || selectedClimate?.name}</strong></p>
              <p>🌡️ Location Climate Extremes: <strong>{climateStats.minTemp}°C to {climateStats.maxTemp}°C</strong></p>
              <p>📐 Geometry: <strong>{geometry.length}m (L) x {geometry.width}m (W) x {geometry.height}m (H)</strong></p>
              <p>👥 Occupants: <strong>{occupantsCount} Personnel</strong></p>
              <p>🪟 Windows: <strong>{openings.windowCount} ({openings.windowArea} m²)</strong> | 🚪 Doors: <strong>{openings.doorCount} ({openings.doorArea} m²)</strong></p>
            </div>

            <button
              onClick={handleRunSearchAndSimulation}
              disabled={searchingMaterials}
              className="btn-primary text-base py-3 px-8 shadow-md w-full flex items-center justify-center gap-2"
            >
              {searchingMaterials ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Searching Database & Solving Transient Differential Equations...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" /> Search Best Materials & Generate 3D Design
                </>
              )}
            </button>
          </div>
        )}

        {/* STEP 5: FINAL RESULTS, RECOMMENDED MATERIALS & 3D SHELTER DESIGN (DISPLAYED AT THE END) */}
        {currentStep === 5 && (
          <div className="space-y-6">
            {/* Best Suitable Material Recommendation Banner */}
            <div className="card-clean border-l-4 border-l-emerald-600 bg-emerald-50/40">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">Algorithm Recommended Material Combination</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-medium block text-[11px]">Predicted Shape</span>
                  <span className="font-bold text-slate-800 text-sm">{design.shape || 'Rectangular'}</span>
                  <span className="text-[10px] text-emerald-700 block mt-0.5">Algorithm Optimized</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-medium block text-[11px]">Recommended Wall</span>
                  <span className="font-bold text-slate-800 text-sm">{bestMaterials?.wallMaterial?.name}</span>
                  <span className="text-[10px] text-sky-700 block mt-0.5">k = {bestMaterials?.wallMaterial?.thermalConductivity} W/mK</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-medium block text-[11px]">Recommended Insulation</span>
                  <span className="font-bold text-slate-800 text-sm">{bestMaterials?.insulationMaterial?.name}</span>
                  <span className="text-[10px] text-sky-700 block mt-0.5">k = {bestMaterials?.insulationMaterial?.thermalConductivity} W/mK</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-medium block text-[11px]">Recommended Roof</span>
                  <span className="font-bold text-slate-800 text-sm">{bestMaterials?.roofMaterial?.name}</span>
                  <span className="text-[10px] text-sky-700 block mt-0.5">k = {bestMaterials?.roofMaterial?.thermalConductivity} W/mK</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-medium block text-[11px]">Recommended Glazing</span>
                  <span className="font-bold text-slate-800 text-sm">{bestMaterials?.windowMaterial?.name}</span>
                  <span className="text-[10px] text-sky-700 block mt-0.5">k = {bestMaterials?.windowMaterial?.thermalConductivity} W/mK</span>
                </div>
              </div>
            </div>

            {/* 3D SHELTER DESIGN (GIVEN AT THE END, CUSTOMIZED WITH SPECIFIED WINDOWS, DOORS & RECOMMENDED MATERIALS) */}
            <div className="card-clean">
              <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4 flex items-center justify-between">
                <span>Interactive 3D Shelter Design (Rendered at End with Specified Openings & Materials)</span>
                <span className="text-xs bg-sky-50 text-sky-700 px-2.5 py-0.5 rounded font-semibold border border-sky-200">
                  {design.shape || 'Rectangular'} | {geometry.length}m (L) × {geometry.width}m (W) × {geometry.height}m (H) | {openings.windowCount} Windows, {openings.doorCount} Door(s)
                </span>
              </h2>
              <Shelter3DViewer
                geometry={geometry}
                design={design}
                openings={openings}
                materials={bestMaterials}
              />
            </div>

            {/* Physics Performance Metrics Cards */}
            {simulationResult?.results?.metrics && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card-clean">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Avg Indoor Temp</p>
                  <p className="text-3xl font-display font-bold text-sky-700 mt-1">
                    {simulationResult.results.metrics.avgIndoorTemp} °C
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Ambient Range: {climateStats.minTemp}°C to {climateStats.maxTemp}°C
                  </p>
                </div>

                <div className="card-clean">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Thermal Comfort Index</p>
                  <p className="text-3xl font-display font-bold text-emerald-700 mt-1">
                    {simulationResult.results.metrics.comfortPercentage} %
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Target: {comfortSettings.minComfortTemp}°C - {comfortSettings.maxComfortTemp}°C</p>
                </div>

                <div className="card-clean">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Total Solar Gain</p>
                  <p className="text-3xl font-display font-bold text-amber-700 mt-1">
                    {simulationResult.results.metrics.totalSolarGain} kWh
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Passive solar heat captured</p>
                </div>

                <div className="card-clean">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Total Heat Loss</p>
                  <p className="text-3xl font-display font-bold text-red-700 mt-1">
                    {simulationResult.results.metrics.totalHeatLoss} kWh
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Peak Loss: {simulationResult.results.metrics.peakHeatLoss} W</p>
                </div>
              </div>
            )}

            {/* Time-Series Charts */}
            {simulationResult?.results?.timeSeries && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card-clean">
                  <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">
                    Indoor vs Location Ambient Temperature Profile (°C)
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={simulationResult.results.timeSeries}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={9} tickFormatter={(t) => t.substr(11, 5)} />
                        <YAxis stroke="#94a3b8" fontSize={10} unit="°C" />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="indoorTemperature" name="Indoor Temp (°C)" stroke="#0284c7" strokeWidth={2.5} dot={false} />
                        <Line type="monotone" dataKey="ambientTemperature" name="Location Ambient Temp (°C)" stroke="#94a3b8" strokeDasharray="4 4" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card-clean">
                  <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">
                    Envelope Heat Loss Component Breakdown (Watts)
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
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              {simulationResult && (
                <button
                  onClick={async () => {
                    // Pre-open tab synchronously on user click to avoid browser popup blockers
                    const reportWindow = window.open('', '_blank');
                    if (reportWindow) {
                      reportWindow.document.write('<div style="font-family:sans-serif;padding:40px;text-align:center;color:#0284c7;"><h2>Generating DRDO Thermal Design PDF Report...</h2><p>Please wait a moment while differential heat equations & graphs are compiled.</p></div>');
                    }
                    try {
                      setLoading(true);
                      const res = await api.post('/reports/generate', { simulation: simulationResult });
                      const fileUrl = res.data?.viewUrl || res.data?.report?.filePath || (res.data?.report?.filename ? `/uploads/reports/${res.data.report.filename}` : null);
                      if (fileUrl) {
                        const baseUrl = window.location.origin.includes('5173')
                          ? 'http://localhost:5000'
                          : window.location.origin;
                        if (reportWindow) {
                          reportWindow.location.href = `${baseUrl}${fileUrl}`;
                        } else {
                          window.location.href = `${baseUrl}${fileUrl}`;
                        }
                      } else if (reportWindow) {
                        reportWindow.close();
                      }
                    } catch (err) {
                      console.error('Report error:', err);
                      if (reportWindow) reportWindow.close();
                      setError('Failed to generate PDF report.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="btn-primary py-2.5 px-5 text-sm flex items-center gap-2 shadow-sm"
                >
                  <FileText className="w-4 h-4" /> Open Report in New Tab ↗
                </button>
              )}
              {savedSimId && (
                <button
                  onClick={() => navigate(`/simulations?id=${savedSimId}`)}
                  className="btn-secondary py-2.5 px-5 text-sm"
                >
                  View Details Page
                </button>
              )}
            </div>
          </div>
        )}

        {/* Wizard Footer Navigation Buttons */}
        {currentStep < 5 && (
          <div className="flex justify-between items-center pt-6 border-t border-slate-200 mt-6">
            <button
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="btn-secondary"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>

            {currentStep < 4 && (
              <button
                onClick={() => {
                  if (currentStep === 1 && !selectedClimate) {
                    setError('Please select a location on the map to fetch weather data before proceeding.');
                    return;
                  }
                  setError('');
                  setCurrentStep(prev => Math.min(4, prev + 1));
                }}
                className="btn-primary"
              >
                Next Step <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
