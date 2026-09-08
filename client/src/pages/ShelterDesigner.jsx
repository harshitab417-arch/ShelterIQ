import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Shelter3DViewer from '../three/Shelter3DViewer';
import { Box, Save, CircleDot, Triangle, Layers } from 'lucide-react';

// ─── Shelter Shape SVG Architectural Previews ───
function PreviewRectangle() {
  return (
    <svg viewBox="0 0 80 56" fill="none" className="w-full h-full">
      <rect x="2" y="52" width="76" height="3" rx="1" fill="#567a3c"/>
      <rect x="11" y="49" width="58" height="3" rx="1" fill="#9e9e9e"/>
      <rect x="13" y="29" width="54" height="20" fill="#d4c5a0"/>
      <polygon points="8,29 40,10 72,29" fill="#8a9496"/>
      <polygon points="8,29 40,10 72,29" fill="none" stroke="#6e7c7c" strokeWidth="0.6"/>
      <rect x="34" y="36" width="10" height="13" rx="0.5" fill="#f3f3f3"/>
      <rect x="35" y="37" width="8" height="12" fill="#4a2910"/>
      <circle cx="37.5" cy="43" r="0.9" fill="#c8920a"/>
      <rect x="32" y="49" width="14" height="2" rx="0.5" fill="#9e9e9e"/>
      <rect x="16" y="34" width="13" height="9" rx="0.5" fill="#f3f3f3"/>
      <rect x="17" y="35" width="11" height="7" fill="#a8d8ea" fillOpacity="0.78"/>
      <line x1="16" y1="38.5" x2="29" y2="38.5" stroke="#e0e0e0" strokeWidth="0.7"/>
      <line x1="22.5" y1="34" x2="22.5" y2="43" stroke="#e0e0e0" strokeWidth="0.7"/>
      <circle cx="11" cy="49" r="3.5" fill="#2e7d32"/>
      <circle cx="69" cy="49" r="2.8" fill="#388e3c"/>
      <circle cx="7" cy="50" r="2" fill="#33691e"/>
    </svg>
  );
}

function PreviewDome() {
  return (
    <svg viewBox="0 0 80 56" fill="none" className="w-full h-full">
      <rect x="2" y="52" width="76" height="3" rx="1" fill="#567a3c"/>
      <ellipse cx="40" cy="51" rx="28" ry="2.5" fill="#9e9e9e"/>
      <rect x="12" y="37" width="56" height="13" fill="#d4c5a0"/>
      <path d="M12,37 Q12,7 40,7 Q68,7 68,37" fill="#e8e0d0"/>
      <path d="M12,37 Q12,7 40,7 Q68,7 68,37" fill="none" stroke="#b0a898" strokeWidth="0.8"/>
      <path d="M17,37 Q17,15 40,15 Q63,15 63,37" fill="none" stroke="#a8d8ea" strokeWidth="2.5" strokeOpacity="0.7"/>
      <rect x="33" y="38" width="14" height="12" rx="0.5" fill="#f3f3f3"/>
      <rect x="34" y="39" width="12" height="11" fill="#4a2910"/>
      <circle cx="37" cy="44" r="0.9" fill="#c8920a"/>
      <rect x="31" y="49" width="18" height="2" rx="0.5" fill="#9e9e9e"/>
      <circle cx="10" cy="50" r="3" fill="#2e7d32"/>
      <circle cx="70" cy="50" r="2.5" fill="#388e3c"/>
    </svg>
  );
}

function PreviewAFrame() {
  return (
    <svg viewBox="0 0 80 56" fill="none" className="w-full h-full">
      <rect x="2" y="52" width="76" height="3" rx="1" fill="#567a3c"/>
      <rect x="10" y="49" width="60" height="3" rx="1" fill="#9e9e9e"/>
      <polygon points="10,49 40,8 70,49" fill="#6b4c2a"/>
      <rect x="16" y="37" width="48" height="12" fill="#c4a882"/>
      <rect x="34" y="38" width="12" height="12" rx="0.5" fill="#f3f3f3"/>
      <rect x="35" y="39" width="10" height="11" fill="#4a2910"/>
      <circle cx="38" cy="44" r="0.9" fill="#c8920a"/>
      <rect x="32" y="49" width="16" height="2" rx="0.5" fill="#9e9e9e"/>
      <rect x="34" y="21" width="12" height="8" rx="0.5" fill="#a8d8ea" fillOpacity="0.78"/>
      <circle cx="13" cy="49" r="3" fill="#2e7d32"/>
      <circle cx="67" cy="49" r="2.5" fill="#388e3c"/>
    </svg>
  );
}

function PreviewQuonset() {
  return (
    <svg viewBox="0 0 80 56" fill="none" className="w-full h-full">
      <rect x="2" y="52" width="76" height="3" rx="1" fill="#567a3c"/>
      <rect x="7" y="49" width="66" height="3" rx="1" fill="#9e9e9e"/>
      <path d="M7,49 Q7,9 40,9 Q73,9 73,49" fill="#8fa8a8"/>
      <path d="M7,49 Q7,9 40,9 Q73,9 73,49" fill="none" stroke="#6e8888" strokeWidth="0.8"/>
      <rect x="4" y="46" width="5" height="4" rx="0.5" fill="#a09060"/>
      <rect x="71" y="46" width="5" height="4" rx="0.5" fill="#a09060"/>
      <rect x="33" y="33" width="14" height="16" rx="0.5" fill="#f3f3f3"/>
      <rect x="34" y="34" width="12" height="15" fill="#3a3a3a"/>
      <circle cx="37" cy="41" r="0.9" fill="#c0c0c0"/>
      <rect x="31" y="49" width="18" height="2" rx="0.5" fill="#9e9e9e"/>
      <rect x="13" y="26" width="11" height="9" rx="0.5" fill="#f3f3f3"/>
      <rect x="14" y="27" width="9" height="7" fill="#a8d8ea" fillOpacity="0.78"/>
      <rect x="56" y="26" width="11" height="9" rx="0.5" fill="#f3f3f3"/>
      <rect x="57" y="27" width="9" height="7" fill="#a8d8ea" fillOpacity="0.78"/>
      <circle cx="8" cy="49" r="2.5" fill="#2e7d32"/>
      <circle cx="72" cy="49" r="2" fill="#388e3c"/>
    </svg>
  );
}

const SHAPE_CONFIGS = [
  {
    id: 'rectangle',
    name: 'Rectangular',
    icon: Box,
    Preview: PreviewRectangle,
    badge: 'Conventional',
    color: 'sky'
  },
  {
    id: 'dome',
    name: 'Dome',
    icon: CircleDot,
    Preview: PreviewDome,
    badge: 'Aerodynamic',
    color: 'violet'
  },
  {
    id: 'a-frame',
    name: 'A-Frame',
    icon: Triangle,
    Preview: PreviewAFrame,
    badge: 'Snow-Shed',
    color: 'amber'
  },
  {
    id: 'quonset',
    name: 'Quonset',
    icon: Layers,
    Preview: PreviewQuonset,
    badge: 'Rapid Deploy',
    color: 'emerald'
  }
];

export default function ShelterDesigner() {
  const [shelterName, setShelterName] = useState('High-Altitude Research Hut');
  const [selectedShape, setSelectedShape] = useState('rectangle');

  // Shape-specific dimension states
  const [rectangleDims, setRectangleDims] = useState({ length: 6.0, width: 4.0, height: 2.8, wallThickness: 0.30 });
  const [domeDims, setDomeDims]           = useState({ radius: 3.0, domeHeight: 2.8 });
  const [aframeDims, setAframeDims]       = useState({ length: 6.0, width: 5.0, ridgeHeight: 3.8 });
  const [quonsetDims, setQuonsetDims]     = useState({ length: 6.0, width: 4.5 });

  const [design, setDesign] = useState({ orientation: 180 });
  const [openings, setOpenings] = useState({ windowCount: 2, windowArea: 2.5, doorCount: 1, openingOrientation: 180 });

  const [materials, setMaterials] = useState([]);
  const [selectedWallMat, setSelectedWallMat] = useState(null);
  const [selectedRoofMat, setSelectedRoofMat] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Derive active dimensions from selected shape
  const currentDimensions = (() => {
    switch (selectedShape) {
      case 'dome':    return domeDims;
      case 'a-frame': return aframeDims;
      case 'quonset': return quonsetDims;
      default:        return rectangleDims;
    }
  })();

  useEffect(() => {
    async function fetchMats() {
      try {
        const res = await api.get('/materials');
        const list = res.data || [];
        setMaterials(list);
        setSelectedWallMat(list.find(m => m.category === 'Wall') || list[0]);
        setSelectedRoofMat(list.find(m => m.category === 'Roof') || list[0]);
      } catch (err) {
        console.error(err);
      }
    }
    fetchMats();
  }, []);

  const handleSaveShelter = async () => {
    setSaving(true);
    setMsg('');
    try {
      await api.post('/shelters', {
        name: shelterName,
        geometry: currentDimensions,
        design: { ...design, shape: selectedShape },
        openings,
        materials: {
          wallMaterial: selectedWallMat,
          roofMaterial: selectedRoofMat,
          floorMaterial: materials.find(m => m.category === 'Floor') || selectedWallMat,
          insulationMaterial: materials.find(m => m.category === 'Insulation') || selectedWallMat,
          windowMaterial: materials.find(m => m.category === 'Window') || selectedWallMat,
          doorMaterial: materials.find(m => m.category === 'Door') || selectedWallMat
        }
      });
      setMsg('Shelter design saved successfully!');
    } catch (err) {
      setMsg('Error saving shelter design.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-clean p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">3D Parametric Shelter Designer</h1>
          <p className="text-xs text-slate-500">Select a shelter archetype and tune its dimensions — the 3D view updates live</p>
        </div>
        <button onClick={handleSaveShelter} disabled={saving} className="btn-primary">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Design'}
        </button>
      </div>

      {msg && (
        <div className={`p-3 text-xs rounded-lg border ${msg.startsWith('Error') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-sky-50 border-sky-200 text-sky-800'}`}>
          {msg}
        </div>
      )}

      {/* ── Shape Selector ── */}
      <div className="card-clean p-5">
        <h2 className="text-sm font-bold text-slate-800 mb-1">Choose Shelter Archetype</h2>
        <p className="text-xs text-slate-500 mb-4">Each shape uses a dedicated physics model with accurate surface-area and volume calculations.</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {SHAPE_CONFIGS.map((cfg) => {
            const Icon = cfg.icon;
            const isSelected = selectedShape === cfg.id;
            return (
              <button
                key={cfg.id}
                onClick={() => setSelectedShape(cfg.id)}
                className={`rounded-xl border-2 p-3 flex flex-col items-center text-center transition cursor-pointer ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/80 shadow-md ring-2 ring-sky-100'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                {/* SVG preview */}
                <div className={`w-full rounded-lg overflow-hidden flex items-end justify-center px-1 pt-1 mb-2 ${
                  isSelected ? 'bg-gradient-to-b from-sky-100/60 to-green-50/80' : 'bg-gradient-to-b from-slate-50 to-green-50/60'
                }`} style={{ height: '72px' }}>
                  <cfg.Preview />
                </div>
                <span className="text-xs font-bold text-slate-800">{cfg.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded mt-1 font-semibold ${
                  isSelected ? 'bg-sky-200 text-sky-800' : 'bg-slate-100 text-slate-500'
                }`}>{cfg.badge}</span>
                {isSelected && (
                  <span className="text-[10px] text-sky-600 font-bold mt-1">✓ Active</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Controls + 3D Viewer ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Dimension Form */}
        <div className="space-y-4 card-clean">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">
            Envelope Dimensions
            <span className="ml-2 text-[10px] font-normal text-slate-400 uppercase tracking-wide">
              {selectedShape}
            </span>
          </h2>

          {/* Design Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Design Name</label>
            <input
              type="text"
              value={shelterName}
              onChange={(e) => setShelterName(e.target.value)}
              className="input-clean"
            />
          </div>

          {/* ── RECTANGLE DIMS ── */}
          {selectedShape === 'rectangle' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Length (m)</label>
                  <input type="number" step="0.1" min="1"
                    value={rectangleDims.length}
                    onChange={(e) => setRectangleDims({ ...rectangleDims, length: parseFloat(e.target.value) || 1 })}
                    className="input-clean" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Width (m)</label>
                  <input type="number" step="0.1" min="1"
                    value={rectangleDims.width}
                    onChange={(e) => setRectangleDims({ ...rectangleDims, width: parseFloat(e.target.value) || 1 })}
                    className="input-clean" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Wall Height (m)</label>
                  <input type="number" step="0.1" min="1"
                    value={rectangleDims.height}
                    onChange={(e) => setRectangleDims({ ...rectangleDims, height: parseFloat(e.target.value) || 1 })}
                    className="input-clean" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Wall Thickness (m)</label>
                  <input type="number" step="0.01" min="0.05"
                    value={rectangleDims.wallThickness}
                    onChange={(e) => setRectangleDims({ ...rectangleDims, wallThickness: parseFloat(e.target.value) || 0.1 })}
                    className="input-clean" />
                </div>
              </div>
            </>
          )}

          {/* ── DOME DIMS ── */}
          {selectedShape === 'dome' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Base Radius (m)</label>
                <input type="number" step="0.1" min="1"
                  value={domeDims.radius}
                  onChange={(e) => setDomeDims({ ...domeDims, radius: parseFloat(e.target.value) || 1 })}
                  className="input-clean" />
                <p className="text-[10px] text-slate-400 mt-1">Diameter: {(domeDims.radius * 2).toFixed(1)}m</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dome Peak Height (m)</label>
                <input type="number" step="0.1" min="0.5"
                  value={domeDims.domeHeight}
                  onChange={(e) => setDomeDims({ ...domeDims, domeHeight: parseFloat(e.target.value) || 0.5 })}
                  className="input-clean" />
              </div>
            </div>
          )}

          {/* ── A-FRAME DIMS ── */}
          {selectedShape === 'a-frame' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Length (m)</label>
                <input type="number" step="0.1" min="1"
                  value={aframeDims.length}
                  onChange={(e) => setAframeDims({ ...aframeDims, length: parseFloat(e.target.value) || 1 })}
                  className="input-clean" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Width (m)</label>
                <input type="number" step="0.1" min="1"
                  value={aframeDims.width}
                  onChange={(e) => setAframeDims({ ...aframeDims, width: parseFloat(e.target.value) || 1 })}
                  className="input-clean" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ridge Height (m)</label>
                <input type="number" step="0.1" min="1"
                  value={aframeDims.ridgeHeight}
                  onChange={(e) => setAframeDims({ ...aframeDims, ridgeHeight: parseFloat(e.target.value) || 1 })}
                  className="input-clean" />
              </div>
            </div>
          )}

          {/* ── QUONSET DIMS ── */}
          {selectedShape === 'quonset' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Length (m)</label>
                <input type="number" step="0.1" min="1"
                  value={quonsetDims.length}
                  onChange={(e) => setQuonsetDims({ ...quonsetDims, length: parseFloat(e.target.value) || 1 })}
                  className="input-clean" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Arch Span / Width (m)</label>
                <input type="number" step="0.1" min="1"
                  value={quonsetDims.width}
                  onChange={(e) => setQuonsetDims({ ...quonsetDims, width: parseFloat(e.target.value) || 1 })}
                  className="input-clean" />
                <p className="text-[10px] text-slate-400 mt-1">Peak height ≈ {(quonsetDims.width / 2).toFixed(1)}m</p>
              </div>
            </div>
          )}

          {/* ── SHARED: Orientation + Doors + Windows ── */}
          <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Orientation (°)</label>
              <input type="number" step="5" min="0" max="360"
                value={design.orientation}
                onChange={(e) => setDesign({ ...design, orientation: parseInt(e.target.value) || 180 })}
                className="input-clean" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Doors</label>
              <input type="number" min="1" max="10"
                value={openings.doorCount ?? 1}
                onChange={(e) => setOpenings({ ...openings, doorCount: parseInt(e.target.value) || 1 })}
                className="input-clean" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Window Count</label>
              <input type="number" min="0" max="20"
                value={openings.windowCount ?? 2}
                onChange={(e) => setOpenings({ ...openings, windowCount: parseInt(e.target.value) || 0 })}
                className="input-clean" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Window Area (m²)</label>
              <input type="number" step="0.1" min="0"
                value={openings.windowArea}
                onChange={(e) => setOpenings({ ...openings, windowArea: parseFloat(e.target.value) || 0 })}
                className="input-clean" />
            </div>
          </div>
        </div>

        {/* Right: 3D Viewer */}
        <div className="lg:col-span-2 card-clean">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">
            Interactive 3D Parametric Rendering
            <span className="ml-2 text-[10px] font-normal text-sky-600">Live Preview</span>
          </h2>
          <Shelter3DViewer
            shape={selectedShape}
            dimensions={currentDimensions}
            design={design}
            openings={openings}
            height={400}
          />
        </div>
      </div>
    </div>
  );
}
