import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Check, ArrowRight, ArrowLeft, Sun, Box, Layers, Sliders, Play, Thermometer } from 'lucide-react';
import Shelter3DViewer from '../three/Shelter3DViewer';

export default function NewSimulation() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [materials, setMaterials] = useState([]);
  const [climates, setClimates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Wizard Form State
  const [selectedClimateId, setSelectedClimateId] = useState('');
  const [shelterName, setShelterName] = useState('New Passive Shelter');
  const [geometry, setGeometry] = useState({
    length: 6.0,
    width: 4.0,
    height: 2.8,
    wallThickness: 0.25,
    roofThickness: 0.20,
    floorThickness: 0.15
  });
  const [design, setDesign] = useState({
    shape: 'Rectangular',
    orientation: 180,
    roofType: 'Gable',
    roofAngle: 25
  });
  const [openings, setOpenings] = useState({
    windowCount: 2,
    windowArea: 2.5,
    doorCount: 1,
    doorArea: 1.8,
    openingOrientation: 180
  });

  // Selected Material References
  const [selectedWallMat, setSelectedWallMat] = useState(null);
  const [selectedRoofMat, setSelectedRoofMat] = useState(null);
  const [selectedFloorMat, setSelectedFloorMat] = useState(null);
  const [selectedInsulationMat, setSelectedInsulationMat] = useState(null);
  const [selectedWindowMat, setSelectedWindowMat] = useState(null);
  const [selectedDoorMat, setSelectedDoorMat] = useState(null);

  const [comfortSettings, setComfortSettings] = useState({
    minComfortTemp: 18,
    maxComfortTemp: 24
  });

  useEffect(() => {
    async function loadOptions() {
      try {
        const [mRes, cRes] = await Promise.all([api.get('/materials'), api.get('/climate')]);
        const matList = mRes.data || [];
        setMaterials(matList);

        const climList = cRes.data || [];
        setClimates(climList);
        if (climList.length > 0) setSelectedClimateId(climList[0]._id);

        // Set default materials
        const wall = matList.find(m => m.category === 'Wall') || matList[0];
        const roof = matList.find(m => m.category === 'Roof') || matList[0];
        const floor = matList.find(m => m.category === 'Floor') || matList[0];
        const ins = matList.find(m => m.category === 'Insulation') || matList[0];
        const win = matList.find(m => m.category === 'Window') || matList[0];
        const door = matList.find(m => m.category === 'Door') || matList[0];

        setSelectedWallMat(wall);
        setSelectedRoofMat(roof);
        setSelectedFloorMat(floor);
        setSelectedInsulationMat(ins);
        setSelectedWindowMat(win);
        setSelectedDoorMat(door);
      } catch (err) {
        console.error('Failed to load simulation wizard options:', err);
      }
    }
    loadOptions();
  }, []);

  const steps = [
    { num: 1, title: 'Location & Climate' },
    { num: 2, title: 'Shelter Geometry' },
    { num: 3, title: 'Materials' },
    { num: 4, title: 'Openings' },
    { num: 5, title: 'Thermal Settings' },
    { num: 6, title: 'Run Physics Engine' }
  ];

  const handleRunSimulation = async () => {
    setLoading(true);
    setError('');

    const chosenClimate = climates.find(c => c._id === selectedClimateId) || climates[0];

    const shelterPayload = {
      name: shelterName,
      geometry,
      design,
      openings,
      materials: {
        wallMaterial: selectedWallMat,
        roofMaterial: selectedRoofMat,
        floorMaterial: selectedFloorMat,
        insulationMaterial: selectedInsulationMat,
        windowMaterial: selectedWindowMat,
        doorMaterial: selectedDoorMat
      }
    };

    try {
      const res = await api.post('/simulation/run', {
        name: `Simulation - ${shelterName}`,
        shelter: shelterPayload,
        climateDataset: chosenClimate,
        comfortSettings
      });

      navigate(`/simulations?id=${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to execute thermal simulation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Wizard Header */}
      <div className="card-clean p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">New Thermal Simulation Wizard</h1>
          <p className="text-xs text-slate-500">Configure parameters for transient thermal balance simulation</p>
        </div>
        <span className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200">
          Step {currentStep} of 6: {steps[currentStep - 1].title}
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
                  onClick={() => setCurrentStep(step.num)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    isDone
                      ? 'bg-sky-600 text-white'
                      : isCurrent
                      ? 'bg-sky-600 text-white ring-4 ring-sky-100'
                      : 'bg-slate-200 text-slate-600'
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
        {/* STEP 1: CLIMATE */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Sun className="w-5 h-5 text-sky-600" /> Select Climate Profile
            </h2>
            <p className="text-xs text-slate-500">Choose environmental dataset (Open-Meteo live API or reference Leh/Ladakh winter dataset).</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {climates.map((c) => (
                <div
                  key={c._id}
                  onClick={() => setSelectedClimateId(c._id)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    selectedClimateId === c._id
                      ? 'bg-sky-50 border-sky-500 ring-2 ring-sky-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-bold text-slate-800">{c.name}</h3>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">{c.sourceType}</span>
                  </div>
                  <p className="text-xs text-slate-500">{c.location} | Elev: {c.elevation || 3500}m</p>
                  <p className="text-xs text-slate-500 mt-1">Data Points: {c.dataPoints?.length || 0} Hours</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: GEOMETRY */}
        {currentStep === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Box className="w-5 h-5 text-sky-600" /> Shelter Name & Geometry
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Shelter Design Name</label>
                <input
                  type="text"
                  value={shelterName}
                  onChange={(e) => setShelterName(e.target.value)}
                  className="input-clean"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Length (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={geometry.length}
                    onChange={(e) => setGeometry({ ...geometry, length: parseFloat(e.target.value) || 1 })}
                    className="input-clean"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Width (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={geometry.width}
                    onChange={(e) => setGeometry({ ...geometry, width: parseFloat(e.target.value) || 1 })}
                    className="input-clean"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Height (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={geometry.height}
                    onChange={(e) => setGeometry({ ...geometry, height: parseFloat(e.target.value) || 1 })}
                    className="input-clean"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Wall Thickness (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={geometry.wallThickness}
                    onChange={(e) => setGeometry({ ...geometry, wallThickness: parseFloat(e.target.value) || 0.1 })}
                    className="input-clean"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Roof Thickness (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={geometry.roofThickness}
                    onChange={(e) => setGeometry({ ...geometry, roofThickness: parseFloat(e.target.value) || 0.1 })}
                    className="input-clean"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Orientation (°)</label>
                  <input
                    type="number"
                    step="5"
                    value={design.orientation}
                    onChange={(e) => setDesign({ ...design, orientation: parseInt(e.target.value) || 180 })}
                    className="input-clean"
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-700 mb-2">3D Parametric Preview</p>
              <Shelter3DViewer geometry={geometry} design={design} openings={openings} />
            </div>
          </div>
        )}

        {/* STEP 3: MATERIALS */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-600" /> Select Envelope Materials
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Wall Core Material</label>
                <select
                  value={selectedWallMat?._id || ''}
                  onChange={(e) => setSelectedWallMat(materials.find(m => m._id === e.target.value))}
                  className="input-clean"
                >
                  {materials.filter(m => m.category === 'Wall').map(m => (
                    <option key={m._id} value={m._id}>{m.name} (k = {m.thermalConductivity} W/mK)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Insulation Material</label>
                <select
                  value={selectedInsulationMat?._id || ''}
                  onChange={(e) => setSelectedInsulationMat(materials.find(m => m._id === e.target.value))}
                  className="input-clean"
                >
                  {materials.filter(m => m.category === 'Insulation').map(m => (
                    <option key={m._id} value={m._id}>{m.name} (k = {m.thermalConductivity} W/mK)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Roof Material</label>
                <select
                  value={selectedRoofMat?._id || ''}
                  onChange={(e) => setSelectedRoofMat(materials.find(m => m._id === e.target.value))}
                  className="input-clean"
                >
                  {materials.filter(m => m.category === 'Roof').map(m => (
                    <option key={m._id} value={m._id}>{m.name} (k = {m.thermalConductivity} W/mK)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Window Glazing</label>
                <select
                  value={selectedWindowMat?._id || ''}
                  onChange={(e) => setSelectedWindowMat(materials.find(m => m._id === e.target.value))}
                  className="input-clean"
                >
                  {materials.filter(m => m.category === 'Window').map(m => (
                    <option key={m._id} value={m._id}>{m.name} (k = {m.thermalConductivity} W/mK)</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: OPENINGS */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Box className="w-5 h-5 text-sky-600" /> Windows & Doors Specification
            </h2>

            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Door Area (m²)</label>
                <input
                  type="number"
                  step="0.1"
                  value={openings.doorArea}
                  onChange={(e) => setOpenings({ ...openings, doorArea: parseFloat(e.target.value) || 1.8 })}
                  className="input-clean"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Opening Orientation (°)</label>
                <input
                  type="number"
                  value={openings.openingOrientation}
                  onChange={(e) => setOpenings({ ...openings, openingOrientation: parseInt(e.target.value) || 180 })}
                  className="input-clean"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: THERMAL SETTINGS */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-sky-600" /> Thermal Comfort Settings
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Minimum Comfort Temp (°C)</label>
                <input
                  type="number"
                  value={comfortSettings.minComfortTemp}
                  onChange={(e) => setComfortSettings({ ...comfortSettings, minComfortTemp: parseFloat(e.target.value) || 18 })}
                  className="input-clean"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Maximum Comfort Temp (°C)</label>
                <input
                  type="number"
                  value={comfortSettings.maxComfortTemp}
                  onChange={(e) => setComfortSettings({ ...comfortSettings, maxComfortTemp: parseFloat(e.target.value) || 24 })}
                  className="input-clean"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: SIMULATION RUN CONFIRMATION */}
        {currentStep === 6 && (
          <div className="space-y-4 text-center py-6">
            <div className="w-16 h-16 bg-sky-100 text-sky-600 rounded-full mx-auto flex items-center justify-center mb-2">
              <Play className="w-8 h-8 ml-1" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Ready to Execute Thermal Physics Engine</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              The custom Node.js transient thermal solver will simulate 24-hour heat balance, passive solar gains, conduction, and sky radiation for <strong>{shelterName}</strong>.
            </p>

            <button
              onClick={handleRunSimulation}
              disabled={loading}
              className="btn-primary text-base py-3 px-8 shadow-md mt-4"
            >
              {loading ? 'Executing Transient Differential Solver...' : 'Run Physics Simulation Now'}
            </button>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-slate-200 mt-6">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="btn-secondary"
          >
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>

          {currentStep < 6 && (
            <button
              onClick={() => setCurrentStep(prev => Math.min(6, prev + 1))}
              className="btn-primary"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
