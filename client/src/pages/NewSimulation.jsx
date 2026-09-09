import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Sun,
  Box,
  Sliders,
  Play,
  Users,
  DoorOpen,
  CircleDot,
  Triangle,
  Layers,
  AlertCircle,
  Sparkles,
  Info,
  Activity
} from 'lucide-react';
import Shelter3DViewer from '../three/Shelter3DViewer';
import LocationPicker from '../components/LocationPicker';

// ─── Shelter Shape SVG Architectural Previews ───
function PreviewRectangle() {
  return (
    <svg viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Ground */}
      <rect x="2" y="52" width="76" height="3" rx="1" fill="#567a3c"/>
      {/* Foundation */}
      <rect x="11" y="49" width="58" height="3" rx="1" fill="#9e9e9e"/>
      {/* Walls */}
      <rect x="13" y="29" width="54" height="20" fill="#d4c5a0"/>
      {/* Roof */}
      <polygon points="8,29 40,10 72,29" fill="#8a9496"/>
      <polygon points="8,29 40,10 72,29" fill="none" stroke="#6e7c7c" strokeWidth="0.6"/>
      {/* Door frame */}
      <rect x="34" y="36" width="10" height="13" rx="0.5" fill="#f3f3f3"/>
      {/* Door */}
      <rect x="35" y="37" width="8" height="12" fill="#4a2910"/>
      <circle cx="37.5" cy="43" r="0.9" fill="#c8920a"/>
      {/* Step */}
      <rect x="32" y="49" width="14" height="2" rx="0.5" fill="#9e9e9e"/>
      {/* Left window frame */}
      <rect x="16" y="34" width="13" height="9" rx="0.5" fill="#f3f3f3"/>
      <rect x="17" y="35" width="11" height="7" fill="#a8d8ea" fillOpacity="0.78"/>
      <line x1="16" y1="38.5" x2="29" y2="38.5" stroke="#e0e0e0" strokeWidth="0.7"/>
      <line x1="22.5" y1="34" x2="22.5" y2="43" stroke="#e0e0e0" strokeWidth="0.7"/>
      {/* Bushes */}
      <circle cx="11" cy="49" r="3.5" fill="#2e7d32"/>
      <circle cx="69" cy="49" r="2.8" fill="#388e3c"/>
      <circle cx="7" cy="50" r="2" fill="#33691e"/>
    </svg>
  );
}

function PreviewDome() {
  return (
    <svg viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Ground */}
      <rect x="2" y="52" width="76" height="3" rx="1" fill="#567a3c"/>
      {/* Circular foundation */}
      <ellipse cx="40" cy="51" rx="28" ry="2.5" fill="#9e9e9e"/>
      {/* Ring wall */}
      <rect x="12" y="37" width="56" height="13" fill="#d4c5a0"/>
      {/* Dome cap */}
      <path d="M12,37 Q12,7 40,7 Q68,7 68,37" fill="#e8e0d0"/>
      <path d="M12,37 Q12,7 40,7 Q68,7 68,37" fill="none" stroke="#b0a898" strokeWidth="0.8"/>
      {/* Clerestory glazing band */}
      <path d="M17,37 Q17,15 40,15 Q63,15 63,37" fill="none" stroke="#a8d8ea" strokeWidth="2.5" strokeOpacity="0.7"/>
      {/* Door frame */}
      <rect x="33" y="38" width="14" height="12" rx="0.5" fill="#f3f3f3"/>
      <rect x="34" y="39" width="12" height="11" fill="#4a2910"/>
      <circle cx="37" cy="44" r="0.9" fill="#c8920a"/>
      {/* Step */}
      <rect x="31" y="49" width="18" height="2" rx="0.5" fill="#9e9e9e"/>
      {/* Bushes */}
      <circle cx="10" cy="50" r="3" fill="#2e7d32"/>
      <circle cx="70" cy="50" r="2.5" fill="#388e3c"/>
      <circle cx="16" cy="51" r="2" fill="#33691e"/>
    </svg>
  );
}

function PreviewAFrame() {
  return (
    <svg viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Ground */}
      <rect x="2" y="52" width="76" height="3" rx="1" fill="#567a3c"/>
      {/* Base platform */}
      <rect x="10" y="49" width="60" height="3" rx="1" fill="#9e9e9e"/>
      {/* A-frame main structure */}
      <polygon points="10,49 40,8 70,49" fill="#6b4c2a"/>
      {/* Lower lighter band */}
      <rect x="16" y="37" width="48" height="12" fill="#c4a882"/>
      {/* Door frame */}
      <rect x="34" y="38" width="12" height="12" rx="0.5" fill="#f3f3f3"/>
      <rect x="35" y="39" width="10" height="11" fill="#4a2910"/>
      <circle cx="38" cy="44" r="0.9" fill="#c8920a"/>
      {/* Step */}
      <rect x="32" y="49" width="16" height="2" rx="0.5" fill="#9e9e9e"/>
      {/* Upper gable window */}
      <rect x="34" y="21" width="12" height="8" rx="0.5" fill="#a8d8ea" fillOpacity="0.78"/>
      {/* Bushes */}
      <circle cx="13" cy="49" r="3" fill="#2e7d32"/>
      <circle cx="67" cy="49" r="2.5" fill="#388e3c"/>
    </svg>
  );
}

function PreviewQuonset() {
  return (
    <svg viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Ground */}
      <rect x="2" y="52" width="76" height="3" rx="1" fill="#567a3c"/>
      {/* Concrete pad */}
      <rect x="7" y="49" width="66" height="3" rx="1" fill="#9e9e9e"/>
      {/* Arch shell */}
      <path d="M7,49 Q7,9 40,9 Q73,9 73,49" fill="#8fa8a8"/>
      <path d="M7,49 Q7,9 40,9 Q73,9 73,49" fill="none" stroke="#6e8888" strokeWidth="0.8"/>
      {/* Sandbag strips */}
      <rect x="4" y="46" width="5" height="4" rx="0.5" fill="#a09060"/>
      <rect x="71" y="46" width="5" height="4" rx="0.5" fill="#a09060"/>
      {/* Door frame */}
      <rect x="33" y="33" width="14" height="16" rx="0.5" fill="#f3f3f3"/>
      <rect x="34" y="34" width="12" height="15" fill="#3a3a3a"/>
      <circle cx="37" cy="41" r="0.9" fill="#c0c0c0"/>
      {/* Step */}
      <rect x="31" y="49" width="18" height="2" rx="0.5" fill="#9e9e9e"/>
      {/* Left window */}
      <rect x="13" y="26" width="11" height="9" rx="0.5" fill="#f3f3f3"/>
      <rect x="14" y="27" width="9" height="7" fill="#a8d8ea" fillOpacity="0.78"/>
      {/* Right window */}
      <rect x="56" y="26" width="11" height="9" rx="0.5" fill="#f3f3f3"/>
      <rect x="57" y="27" width="9" height="7" fill="#a8d8ea" fillOpacity="0.78"/>
      {/* Bushes */}
      <circle cx="8" cy="49" r="2.5" fill="#2e7d32"/>
      <circle cx="72" cy="49" r="2" fill="#388e3c"/>
    </svg>
  );
}

const SHAPE_OPTIONS = [
  {
    id: 'rectangle',
    name: 'Rectangular Shelter',
    icon: Box,
    Preview: PreviewRectangle,
    badge: 'Conventional Living',
    advantage: 'High Usable Floor Efficiency',
    description: 'Conventional orthogonal shelter suitable for general living quarters, headquarters, and field hospital units.'
  },
  {
    id: 'dome',
    name: 'Dome Shelter',
    icon: CircleDot,
    Preview: PreviewDome,
    badge: 'Aerodynamic / Low A/V',
    advantage: 'Minimal Heat Loss Exposure',
    description: 'Spherical cap / geodesic geometry providing low surface-area-to-volume ratio and superior aerodynamic deflection of Himalayan gales.'
  },
  {
    id: 'a-frame',
    name: 'A-Frame Shelter',
    icon: Triangle,
    Preview: PreviewAFrame,
    badge: 'Snow-Shedding',
    advantage: 'Prevents Heavy Snowdrift Load',
    description: 'Triangular prism geometry with steep sloping roof planes engineered for self-shedding snow loads in high-altitude mountain passes.'
  },
  {
    id: 'quonset',
    name: 'Quonset / Arch Shelter',
    icon: Layers,
    Preview: PreviewQuonset,
    badge: 'Modular Rapid Deployment',
    advantage: 'High Arch Structural Rigidity',
    description: 'Semi-cylindrical continuous arch shelter offering structural simplicity, high strength-to-weight ratio, and rapid deployment.'
  }
];

export default function NewSimulation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [climates, setClimates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Location & Climate
  const [selectedClimate, setSelectedClimate] = useState(null);
  const [climateRegion, setClimateRegion] = useState(null);

  // Step 2: Shelter Design
  const [shelterName, setShelterName] = useState('DRDO High-Altitude Passive Shelter');
  const [selectedShape, setSelectedShape] = useState(location.state?.preselectedShape || 'rectangle');

  // Shape-specific dynamic dimensions
  const [rectangleDims, setRectangleDims] = useState({ length: 6.0, width: 4.0, height: 2.8, roofAngle: 25 });
  const [domeDims, setDomeDims] = useState({ radius: 3.0, domeHeight: 2.8 });
  const [aframeDims, setAframeDims] = useState({ length: 6.0, width: 5.0, ridgeHeight: 3.8 });
  const [quonsetDims, setQuonsetDims] = useState({ length: 6.0, width: 4.5 });

  // Step 3: Occupancy & Openings
  const [occupants, setOccupants] = useState(4);
  const [doorCount, setDoorCount] = useState(1);
  const [openings, setOpenings] = useState({
    windowCount: 2,
    windowArea: 2.5,
    openingOrientation: 180
  });

  // System-derived Location-Based Optimal Indoor Comfort Range
  const detectedComfort = useMemo(() => {
    if (!selectedClimate) {
      return {
        minComfortTemp: 18.0,
        maxComfortTemp: 24.0,
        neutralTemp: 21.0,
        climateType: 'Moderate / Standard (Default)',
        meanAmbient: 12.0,
        reason: 'Standard ASHRAE / NBC India baseline range for temperate occupancy.'
      };
    }

    const dataPoints = selectedClimate.dataPoints || [];
    let avgAmb = 10;
    if (dataPoints.length > 0) {
      const sum = dataPoints.reduce((acc, dp) => acc + (Number(dp.ambientTemperature) || 0), 0);
      avgAmb = sum / dataPoints.length;
    } else if (typeof selectedClimate.elevation === 'number' && selectedClimate.elevation > 2500) {
      avgAmb = -5; // High altitude cold default
    }

    // Adaptive Thermal Comfort Model (ASHRAE Standard 55 & NBC 2016 adaptive comfort for naturally ventilated & passive shelters):
    // Neutral comfort temperature: T_comf = 17.8 + 0.31 * T_outdoor_mean
    // Bounded for extreme sub-zero Himalayan stations (DRDO winter survival standard: 16°C–22°C)
    // up to hot tropical plains (22°C–28°C)
    let neutral = 17.8 + 0.31 * avgAmb;
    let minT = Math.round((neutral - 3.0) * 10) / 10;
    let maxT = Math.round((neutral + 3.0) * 10) / 10;

    let climateType = 'Moderate Himalayan Valley';
    let reason = '';

    if (avgAmb <= 0) {
      // Extreme High-Altitude Cold (e.g. Siachen, Leh, Dras, Nyoma, Lahaul)
      minT = 16.0;
      maxT = 21.0;
      neutral = 18.5;
      climateType = 'Extreme Sub-Zero / High-Altitude (DRDO Cold Standard)';
      reason = `Location experiences sub-zero conditions (mean outdoor: ${avgAmb.toFixed(1)}°C). System calibrated the optimal indoor band to 16.0°C–21.0°C (metabolic rate 80W/person with military thermal gear/bedding) to prevent hypothermia while avoiding excessive envelope heat loss.`;
    } else if (avgAmb <= 15) {
      // Cold / Temperate Mountainous
      minT = Math.max(16.5, minT);
      maxT = Math.min(23.0, maxT);
      neutral = (minT + maxT) / 2;
      climateType = 'Cold Alpine / Highland';
      reason = `Highland climate (mean outdoor: ${avgAmb.toFixed(1)}°C). Adaptive comfort target set to ${minT.toFixed(1)}°C–${maxT.toFixed(1)}°C to maximize passive solar retention and thermal mass damping.`;
    } else if (avgAmb <= 26) {
      // Composite / Moderate
      minT = 18.0;
      maxT = 25.0;
      neutral = 21.5;
      climateType = 'Composite / Moderate';
      reason = `Moderate climate (mean outdoor: ${avgAmb.toFixed(1)}°C). Optimal comfort band auto-calibrated to 18.0°C–25.0°C following ASHRAE 55 standard comfort criteria.`;
    } else {
      // Hot / Tropical / Arid
      minT = Math.max(22.0, minT);
      maxT = Math.min(28.0, maxT);
      neutral = (minT + maxT) / 2;
      climateType = 'Hot / Semi-Arid';
      reason = `Warm ambient profile (mean outdoor: ${avgAmb.toFixed(1)}°C). Indoor upper tolerance expanded to ${maxT.toFixed(1)}°C with nighttime ventilation cooling.`;
    }

    return {
      minComfortTemp: Number(minT.toFixed(1)),
      maxComfortTemp: Number(maxT.toFixed(1)),
      neutralTemp: Number(neutral.toFixed(1)),
      climateType,
      meanAmbient: Number(avgAmb.toFixed(1)),
      reason
    };
  }, [selectedClimate]);

  // Keep comfortSettings synchronized with detected comfort band for the chosen location
  const comfortSettings = useMemo(() => ({
    minComfortTemp: detectedComfort.minComfortTemp,
    maxComfortTemp: detectedComfort.maxComfortTemp
  }), [detectedComfort]);

  useEffect(() => {
    async function loadOptions() {
      try {
        const cRes = await api.get('/climate');
        setClimates(cRes.data || []);
      } catch (err) {
        console.error('Failed to load climate datasets:', err);
      }
    }
    loadOptions();
  }, []);

  // Active dimensions object based on selected shape
  const currentDimensions = useMemo(() => {
    switch (selectedShape) {
      case 'dome':
        return domeDims;
      case 'a-frame':
        return aframeDims;
      case 'quonset':
        return quonsetDims;
      case 'rectangle':
      default:
        return rectangleDims;
    }
  }, [selectedShape, rectangleDims, domeDims, aframeDims, quonsetDims]);

  // Live calculation of exact engineering values for display in Step 2
  const liveEngineeringMetrics = useMemo(() => {
    const winA = Number(openings.windowArea) || 0;
    const doorA = (Number(doorCount) || 1) * 1.8;
    const totOpenings = winA + doorA;

    let floorArea = 0;
    let grossWallArea = 0;
    let roofArea = 0;
    let curvedArea = 0;
    let volume = 0;

    if (selectedShape === 'rectangle') {
      const L = Number(rectangleDims.length || 6);
      const W = Number(rectangleDims.width || 4);
      const H = Number(rectangleDims.height || 2.8);
      const angleRad = ((rectangleDims.roofAngle || 25) * Math.PI) / 180;
      const ridgeH = (W / 2) * Math.tan(angleRad);
      floorArea = L * W;
      grossWallArea = 2 * (L + W) * H + W * ridgeH;
      roofArea = (2 * L * (W / 2)) / Math.cos(angleRad);
      volume = (L * W * H) + (0.5 * W * ridgeH * L);
    } else if (selectedShape === 'dome') {
      const R = Number(domeDims.radius || 3);
      const H = Number(domeDims.domeHeight || 2.8);
      const rSph = (R * R + H * H) / (2 * H);
      floorArea = Math.PI * R * R;
      curvedArea = 2 * Math.PI * rSph * H;
      volume = (Math.PI * H / 6) * (3 * R * R + H * H);
    } else if (selectedShape === 'a-frame') {
      const L = Number(aframeDims.length || 6);
      const W = Number(aframeDims.width || 5);
      const H = Number(aframeDims.ridgeHeight || 3.8);
      const slope = Math.sqrt(Math.pow(W / 2, 2) + Math.pow(H, 2));
      floorArea = L * W;
      grossWallArea = W * H; // 2 triangular ends
      roofArea = 2 * L * slope;
      volume = 0.5 * W * H * L;
    } else if (selectedShape === 'quonset') {
      const L = Number(quonsetDims.length || 6);
      const W = Number(quonsetDims.width || 4.5);
      const R = W / 2;
      floorArea = L * W;
      curvedArea = Math.PI * R * L;
      grossWallArea = Math.PI * R * R; // 2 semicircles
      volume = 0.5 * Math.PI * R * R * L;
    }

    const opaqueWall = Math.max(0, grossWallArea - totOpenings);
    const exposedEnvelope = opaqueWall + roofArea + curvedArea + totOpenings;
    const avRatio = volume > 0 ? (exposedEnvelope / volume) : 0;

    return {
      floorArea: floorArea.toFixed(1),
      volume: volume.toFixed(1),
      exposedEnvelope: exposedEnvelope.toFixed(1),
      roofShellArea: (roofArea + curvedArea).toFixed(1),
      avRatio: avRatio.toFixed(2)
    };
  }, [selectedShape, rectangleDims, domeDims, aframeDims, quonsetDims, openings, doorCount]);

  // Dimension Validation
  const dimensionValidation = useMemo(() => {
    const errs = [];
    const check = (name, val, min = 0.5, max = 50) => {
      const n = parseFloat(val);
      if (isNaN(n) || n <= 0) errs.push(`${name} must be a positive number greater than 0.`);
      else if (n < min) errs.push(`${name} is unrealistically small (minimum ${min}m).`);
      else if (n > max) errs.push(`${name} exceeds realistic shelter dimensions (maximum ${max}m).`);
    };

    if (selectedShape === 'rectangle') {
      check('Length', rectangleDims.length);
      check('Width', rectangleDims.width);
      check('Wall Height', rectangleDims.height);
    } else if (selectedShape === 'dome') {
      check('Base Radius', domeDims.radius, 1.0, 20);
      check('Dome Height', domeDims.domeHeight, 1.0, 15);
    } else if (selectedShape === 'a-frame') {
      check('Length', aframeDims.length);
      check('Width', aframeDims.width);
      check('Ridge Height', aframeDims.ridgeHeight, 1.5, 20);
    } else if (selectedShape === 'quonset') {
      check('Length', quonsetDims.length);
      check('Arch Span / Width', quonsetDims.width, 1.5, 20);
    }
    return errs;
  }, [selectedShape, rectangleDims, domeDims, aframeDims, quonsetDims]);

  const steps = [
    { num: 1, title: 'Location & Climate', icon: Sun },
    { num: 2, title: 'Shelter Design',    icon: Box },
    { num: 3, title: 'Occupancy & Openings', icon: DoorOpen },
    { num: 4, title: 'Review & Comfort',  icon: Sliders },
    { num: 5, title: 'Run Simulation',    icon: Play }
  ];

  const handleRunSimulation = async () => {
    setLoading(true);
    setError('');

    if (!selectedClimate) {
      setError('Please select a location and fetch climate data first (Step 1).');
      setLoading(false);
      return;
    }

    if (dimensionValidation.length > 0) {
      setError(dimensionValidation[0]);
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/simulation/run-auto', {
        name: `Simulation — ${shelterName} (${selectedShape.toUpperCase()})`,
        shape: selectedShape,
        dimensions: currentDimensions,
        occupants: Number(occupants) || 4,
        openings: {
          windowCount: Number(openings.windowCount) || 2,
          windowArea: Number(openings.windowArea) || 2.5,
          doorCount: Number(doorCount) || 1,
          openingOrientation: Number(openings.openingOrientation) || 180
        },
        climateDataset: selectedClimate,
        comfortSettings
      });

      navigate(`/simulations?id=${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to execute thermal simulation. Please check server logs.');
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
          <p className="text-xs text-slate-500">Intelligent DRDO High-Altitude Passive Shelter Design & Thermal Decision Support</p>
        </div>
        <span className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200">
          Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="card-clean px-6 pt-5 pb-7">
        <div className="relative flex justify-between items-start">
          {/* Connector line — sits at top-4 = center of 32px (h-8) circles */}
          <div className="absolute left-0 right-0 top-4 h-[2px] bg-slate-200 z-0" />
          {/* Completed portion overlay */}
          <div
            className="absolute left-0 top-4 h-[2px] bg-sky-500 z-0 transition-all duration-500"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
          {steps.map((step) => {
            const isDone = step.num < currentStep;
            const isCurrent = step.num === currentStep;
            const Icon = step.icon;
            return (
              <div key={step.num} className="relative z-10 flex flex-col items-center">
                <button
                  onClick={() => setCurrentStep(step.num)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition shadow-sm ${
                    isDone
                      ? 'bg-sky-600 text-white'
                      : isCurrent
                      ? 'bg-sky-600 text-white ring-4 ring-sky-100'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </button>
                <span className={`text-[10px] mt-2 font-semibold text-center max-w-[72px] leading-tight ${isCurrent ? 'text-sky-700' : isDone ? 'text-slate-600' : 'text-slate-400'}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>


      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step Contents */}
      <div className="card-clean p-6">

        {/* ─── STEP 1: LOCATION & CLIMATE (PRESERVED 100% UNCHANGED) ─── */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <LocationPicker
              onLocationSelected={setSelectedClimate}
              initialLocation={selectedClimate ? {
                latitude: selectedClimate.latitude,
                longitude: selectedClimate.longitude,
                displayName: selectedClimate.location || selectedClimate.name
              } : null}
            />

            {/* Saved Climate Datasets Selection */}
            {climates.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Or choose from saved datasets</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                  {climates.map((c) => (
                    <button
                      key={c._id}
                      onClick={() => setSelectedClimate(c)}
                      className={`p-3 rounded-xl border cursor-pointer transition text-left ${
                        selectedClimate?._id === c._id
                          ? 'bg-sky-50 border-sky-500 ring-2 ring-sky-200'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-bold text-slate-800">{c.name}</h4>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">{c.sourceType}</span>
                      </div>
                      <p className="text-xs text-slate-500">{c.location} | Elev: {c.elevation || 3500}m</p>
                      <p className="text-xs text-slate-500 mt-0.5">Data Points: {c.dataPoints?.length || 0} Hours</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── STEP 2: SHELTER DESIGN & PARAMETRIC SHAPE SELECTION ─── */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-1">Choose Shelter Shape</h2>
              <p className="text-xs text-slate-500 mb-4">
                Select an architectural archetype. The thermal physics solver automatically integrates shape-specific boundary areas and volume.
              </p>

              {/* 4 Selectable Shape Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {SHAPE_OPTIONS.map((shapeOpt) => {
                  const Icon = shapeOpt.icon;
                  const isSelected = selectedShape === shapeOpt.id;
                  return (
                    <div
                      key={shapeOpt.id}
                      onClick={() => setSelectedShape(shapeOpt.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-sky-50/80 border-sky-600 shadow-md ring-2 ring-sky-200'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isSelected ? 'bg-sky-200 text-sky-900' : 'bg-slate-100 text-slate-600'}`}>
                            {shapeOpt.badge}
                          </span>
                        </div>

                        {/* SVG Architectural Preview */}
                        <div className={`my-2.5 rounded-lg overflow-hidden flex items-end justify-center px-2 pt-2 pb-0 ${
                          isSelected ? 'bg-gradient-to-b from-sky-100/60 to-green-50/80' : 'bg-gradient-to-b from-slate-50 to-green-50/60'
                        }`} style={{ height: '88px' }}>
                          <shapeOpt.Preview />
                        </div>

                        <h3 className="text-sm font-bold text-slate-800">{shapeOpt.name}</h3>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{shapeOpt.description}</p>
                        <p className="text-[10px] text-sky-700 font-semibold mt-2">Advantage: {shapeOpt.advantage}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-600">
                          {isSelected ? '✓ Selected' : 'Select'}
                        </span>
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center">
                          {isSelected && <span className="w-2 h-2 rounded-full bg-sky-600"></span>}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Dimensions & 3D Live Preview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Box className="w-4 h-4 text-sky-600" />
                  Parametric Dimensions ({selectedShape.toUpperCase()})
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Shelter Design Name</label>
                  <input
                    type="text"
                    value={shelterName}
                    onChange={(e) => setShelterName(e.target.value)}
                    className="input-clean"
                  />
                </div>

                {/* 1. RECTANGLE INPUTS */}
                {selectedShape === 'rectangle' && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Length (m)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        value={rectangleDims.length}
                        onChange={(e) => setRectangleDims({ ...rectangleDims, length: parseFloat(e.target.value) || 0 })}
                        className="input-clean"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Width (m)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        value={rectangleDims.width}
                        onChange={(e) => setRectangleDims({ ...rectangleDims, width: parseFloat(e.target.value) || 0 })}
                        className="input-clean"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Wall Height (m)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        value={rectangleDims.height}
                        onChange={(e) => setRectangleDims({ ...rectangleDims, height: parseFloat(e.target.value) || 0 })}
                        className="input-clean"
                      />
                    </div>
                  </div>
                )}

                {/* 2. DOME INPUTS */}
                {selectedShape === 'dome' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Base Radius (m)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        value={domeDims.radius}
                        onChange={(e) => setDomeDims({ ...domeDims, radius: parseFloat(e.target.value) || 0 })}
                        className="input-clean"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Floor Diameter: {(domeDims.radius * 2).toFixed(1)}m</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Dome Peak Height (m)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        value={domeDims.domeHeight}
                        onChange={(e) => setDomeDims({ ...domeDims, domeHeight: parseFloat(e.target.value) || 0 })}
                        className="input-clean"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Spherical cap geometry</p>
                    </div>
                  </div>
                )}

                {/* 3. A-FRAME INPUTS */}
                {selectedShape === 'a-frame' && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Length (m)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        value={aframeDims.length}
                        onChange={(e) => setAframeDims({ ...aframeDims, length: parseFloat(e.target.value) || 0 })}
                        className="input-clean"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Base Width (m)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        value={aframeDims.width}
                        onChange={(e) => setAframeDims({ ...aframeDims, width: parseFloat(e.target.value) || 0 })}
                        className="input-clean"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Ridge Height (m)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1.5"
                        value={aframeDims.ridgeHeight}
                        onChange={(e) => setAframeDims({ ...aframeDims, ridgeHeight: parseFloat(e.target.value) || 0 })}
                        className="input-clean"
                      />
                    </div>
                  </div>
                )}

                {/* 4. QUONSET INPUTS */}
                {selectedShape === 'quonset' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Length (m)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        value={quonsetDims.length}
                        onChange={(e) => setQuonsetDims({ ...quonsetDims, length: parseFloat(e.target.value) || 0 })}
                        className="input-clean"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Arch Span / Width (m)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1.5"
                        value={quonsetDims.width}
                        onChange={(e) => setQuonsetDims({ ...quonsetDims, width: parseFloat(e.target.value) || 0 })}
                        className="input-clean"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Derived Arch Height: {(quonsetDims.width / 2).toFixed(1)}m</p>
                    </div>
                  </div>
                )}

                {/* Validation warnings */}
                {dimensionValidation.length > 0 && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{dimensionValidation[0]}</span>
                  </div>
                )}

                {/* Live Engineering Metrics Calculation Display */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-sky-600" />
                      Live Calculated Geometry Properties
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                      Live Solver Inputs
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Floor Area</span>
                      <span className="font-bold text-slate-800">{liveEngineeringMetrics.floorArea} m²</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Air Volume</span>
                      <span className="font-bold text-slate-800">{liveEngineeringMetrics.volume} m³</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Envelope Area</span>
                      <span className="font-bold text-slate-800">{liveEngineeringMetrics.exposedEnvelope} m²</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Roof/Shell Area</span>
                      <span className="font-bold text-slate-800">{liveEngineeringMetrics.roofShellArea} m²</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-100 col-span-2">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Surface-to-Volume (A/V)</span>
                      <span className="font-bold text-sky-700">{liveEngineeringMetrics.avRatio} m⁻¹</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3D Parametric Live Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs font-bold text-slate-700">3D Parametric CAD View</p>
                    <p className="text-[10px] text-slate-400">Environment auto-defaults from selected climate</p>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                    {[
                      { id: 'snowy', icon: '❄️', title: 'Snowy' },
                      { id: 'sunny', icon: '☀️', title: 'Sunny' },
                      { id: 'coastal', icon: '🌊', title: 'Coastal' },
                      { id: 'rainy', icon: '🌧️', title: 'Rainy' },
                      { id: 'forest', icon: '🌲', title: 'Forest' },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setClimateRegion(c.id)}
                        title={c.title}
                        className={`px-1.5 py-0.5 rounded text-xs transition ${
                          climateRegion === c.id
                            ? 'bg-white text-sky-700 shadow-sm font-bold border border-slate-200'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {c.icon}
                      </button>
                    ))}
                  </div>
                </div>
                <Shelter3DViewer
                  shape={selectedShape}
                  dimensions={currentDimensions}
                  openings={{ ...openings, doorCount }}
                  climate={selectedClimate}
                  environment={climateRegion}
                  onEnvironmentChange={setClimateRegion}
                  height={340}
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 3: OCCUPANCY & OPENINGS ─── */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-1">Occupancy & Openings</h2>
              <p className="text-xs text-slate-500">
                Specify personnel count and door/window dimensions. Openings subtract from opaque envelope area and admit passive solar radiation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personnel & Access */}
              <div className="p-4 border border-slate-200 rounded-xl space-y-4 bg-slate-50/50">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-sky-600" /> Personnel & Doors
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Occupants</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={occupants}
                    onChange={(e) => setOccupants(parseInt(e.target.value) || 1)}
                    className="input-clean"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Metabolic sensible heat gain: <strong>{occupants * 80} Watts</strong> (80 W/person)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Doors</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={doorCount}
                    onChange={(e) => setDoorCount(parseInt(e.target.value) || 1)}
                    className="input-clean"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Door area: {(doorCount * 1.8).toFixed(1)} m² (Insulated timber door)
                  </p>
                </div>
              </div>

              {/* Windows & Solar Glazing */}
              <div className="p-4 border border-slate-200 rounded-xl space-y-4 bg-slate-50/50">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-500" /> Windows & Passive Solar Glazing
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Window Count</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
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
                      max="50"
                      value={openings.windowArea}
                      onChange={(e) => setOpenings({ ...openings, windowArea: parseFloat(e.target.value) || 0 })}
                      className="input-clean"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Opening Orientation (°) — 0° N, 90° E, 180° S, 270° W
                  </label>
                  <input
                    type="number"
                    step="5"
                    min="0"
                    max="360"
                    value={openings.openingOrientation}
                    onChange={(e) => setOpenings({ ...openings, openingOrientation: parseInt(e.target.value) || 180 })}
                    className="input-clean"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    South-facing (180°) orientation captures optimal solar irradiance in Ladakh winters.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 4: REVIEW & THERMAL COMFORT SETTINGS ─── */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-1">Review & Thermal Comfort Criteria</h2>
              <p className="text-xs text-slate-500">
                Verify shelter design parameters and set indoor comfort boundaries before running multi-material evaluation.
              </p>
            </div>

            {/* Location-Based Auto-Detected Comfort Settings Card */}
            <div className="p-5 border border-sky-200 rounded-xl bg-gradient-to-br from-sky-50/70 via-white to-blue-50/50 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sky-100 pb-3">
                <h3 className="text-xs font-bold text-sky-950 uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-sky-600" />
                  System-Detected Thermal Comfort Boundary
                </h3>
                <span className="text-[11px] font-bold text-sky-700 bg-sky-100/80 border border-sky-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit">
                  <Sparkles className="w-3 h-3 text-sky-600" /> Auto-Calibrated by Location
                </span>
              </div>

              {/* Climate & Location Context */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white/80 backdrop-blur p-3 rounded-lg border border-sky-100/80">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Selected Location</span>
                  <span className="font-bold text-slate-800 truncate block">
                    {selectedClimate?.location || selectedClimate?.name || 'No location selected'}
                  </span>
                </div>
                <div className="bg-white/80 backdrop-blur p-3 rounded-lg border border-sky-100/80">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Climate Classification</span>
                  <span className="font-bold text-sky-900 block">
                    {detectedComfort.climateType}
                  </span>
                </div>
                <div className="bg-white/80 backdrop-blur p-3 rounded-lg border border-sky-100/80">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Mean Outdoor Ambient</span>
                  <span className={`font-bold font-mono text-sm block ${detectedComfort.meanAmbient <= 0 ? 'text-blue-600' : 'text-slate-800'}`}>
                    {detectedComfort.meanAmbient}°C
                  </span>
                </div>
              </div>

              {/* System Detected Min and Max Temperature Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Min Comfort Temp */}
                <div className="p-4 bg-white rounded-xl border border-sky-200/80 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">System Detected Min Temp</span>
                    <span className="text-xs text-slate-600 font-medium">Lower Thermal Comfort Threshold</span>
                    <p className="text-[10px] text-sky-600 mt-1">Prevents hypothermia & condensation</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold font-mono text-sky-700">
                      {detectedComfort.minComfortTemp}°C
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 block">Auto-Locked</span>
                  </div>
                </div>

                {/* Max Comfort Temp */}
                <div className="p-4 bg-white rounded-xl border border-sky-200/80 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">System Detected Max Temp</span>
                    <span className="text-xs text-slate-600 font-medium">Upper Thermal Comfort Threshold</span>
                    <p className="text-[10px] text-sky-600 mt-1">Limits overheating & ventilation loss</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold font-mono text-sky-700">
                      {detectedComfort.maxComfortTemp}°C
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 block">Auto-Locked</span>
                  </div>
                </div>
              </div>

              {/* Physical / Engineering Explanation */}
              <div className="p-3 bg-white/70 rounded-lg border border-sky-100 text-[11px] text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-800">Adaptive Comfort Criterion: </span>
                {detectedComfort.reason}
              </div>
            </div>

            {/* Design Summary Card */}
            <div className="p-4 bg-sky-50/40 border border-sky-200 rounded-xl space-y-3">
              <h3 className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-600" /> Configuration Summary Ready for Simulation
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-sky-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Selected Shape</span>
                  <span className="font-bold text-slate-800 capitalize">{selectedShape}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-sky-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Floor Area / Vol</span>
                  <span className="font-bold text-slate-800">{liveEngineeringMetrics.floorArea} m² / {liveEngineeringMetrics.volume} m³</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-sky-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Occupants</span>
                  <span className="font-bold text-slate-800">{occupants} persons ({occupants * 80}W)</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-sky-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Climate Location</span>
                  <span className="font-bold text-slate-800 truncate block">{selectedClimate?.location || selectedClimate?.name || 'Selected'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 5: RUN SIMULATION & AUTO EVALUATION ─── */}
        {currentStep === 5 && (
          <div className="space-y-4 text-center py-6">
            <div className="w-16 h-16 bg-sky-100 text-sky-600 rounded-full mx-auto flex items-center justify-center mb-2 animate-bounce">
              <Play className="w-8 h-8 ml-1" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Execute Multi-Material Thermal Optimization</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              The physics engine will test candidate material combinations (Rammed Earth, Stone, Straw-Clay, AAC, PUF, EPS, Low-E Glazing) for your <strong>{selectedShape.toUpperCase()}</strong> shelter and rank the best-performing solution.
            </p>

            <div className="max-w-md mx-auto p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Shape:</span>
                <span className="font-bold text-slate-800 capitalize">{selectedShape}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Floor Area & Volume:</span>
                <span className="font-bold text-slate-800">{liveEngineeringMetrics.floorArea} m² / {liveEngineeringMetrics.volume} m³</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Location:</span>
                <span className="font-bold text-slate-800">{selectedClimate?.location || selectedClimate?.name || 'Not selected'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Auto Comfort Target:</span>
                <span className="font-bold text-sky-700 font-mono">{detectedComfort.minComfortTemp}°C – {detectedComfort.maxComfortTemp}°C</span>
              </div>
            </div>

            <button
              onClick={handleRunSimulation}
              disabled={loading || !selectedClimate}
              className="btn-primary text-base py-3 px-8 shadow-md mt-4"
            >
              {loading ? 'Evaluating Material Configurations…' : 'Run Thermal Physics Engine Now'}
            </button>

            {!selectedClimate && (
              <p className="text-xs text-red-500 mt-2">⚠ Please return to Step 1 and select a location/climate dataset.</p>
            )}
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

          {currentStep < steps.length && (
            <button
              onClick={() => {
                if (currentStep === 2 && dimensionValidation.length > 0) {
                  setError(dimensionValidation[0]);
                  return;
                }
                setError('');
                setCurrentStep(prev => Math.min(steps.length, prev + 1));
              }}
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
