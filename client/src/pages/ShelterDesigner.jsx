import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Shelter3DViewer from '../three/Shelter3DViewer';
import { Box, Save, RefreshCw } from 'lucide-react';

export default function ShelterDesigner() {
  const [shelterName, setShelterName] = useState('High-Altitude Research Hut');
  const [geometry, setGeometry] = useState({
    length: 6.0,
    width: 4.0,
    height: 2.8,
    wallThickness: 0.30,
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

  const [materials, setMaterials] = useState([]);
  const [selectedWallMat, setSelectedWallMat] = useState(null);
  const [selectedRoofMat, setSelectedRoofMat] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

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
        geometry,
        design,
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
      setMsg('Shelter design saved successfully to database!');
    } catch (err) {
      setMsg('Error saving shelter design.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card-clean p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">3D Parametric Shelter Designer</h1>
          <p className="text-xs text-slate-500">Define building envelope geometry, orientation, and openings</p>
        </div>
        <button onClick={handleSaveShelter} disabled={saving} className="btn-primary">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Design'}
        </button>
      </div>

      {msg && <div className="p-3 bg-sky-50 border border-sky-200 text-sky-800 text-xs rounded-lg">{msg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parametric Form Controls */}
        <div className="space-y-4 card-clean">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">Envelope Dimensions</h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Design Name</label>
            <input
              type="text"
              value={shelterName}
              onChange={(e) => setShelterName(e.target.value)}
              className="input-clean"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
          </div>

          <div className="grid grid-cols-2 gap-3">
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
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Window Area (m²)</label>
              <input
                type="number"
                step="0.1"
                value={openings.windowArea}
                onChange={(e) => setOpenings({ ...openings, windowArea: parseFloat(e.target.value) || 0 })}
                className="input-clean"
              />
            </div>
          </div>
        </div>

        {/* 3D Visualizer Canvas */}
        <div className="lg:col-span-2 card-clean">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">
            Interactive Three.js Parametric Rendering
          </h2>
          <Shelter3DViewer geometry={geometry} design={design} openings={openings} />
        </div>
      </div>
    </div>
  );
}
