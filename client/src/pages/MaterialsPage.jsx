import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Layers, Plus, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New Material Form
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Wall');
  const [k, setK] = useState('0.8');
  const [density, setDensity] = useState('1800');
  const [cp, setCp] = useState('900');
  const [emissivity, setEmissivity] = useState('0.9');
  const [solarAbsorptivity, setSolarAbsorptivity] = useState('0.7');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMaterials();
  }, []);

  async function fetchMaterials() {
    try {
      const res = await api.get('/materials');
      setMaterials(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/materials', {
        name,
        category,
        thermalConductivity: parseFloat(k),
        density: parseFloat(density),
        specificHeat: parseFloat(cp),
        emissivity: parseFloat(emissivity),
        solarAbsorptivity: parseFloat(solarAbsorptivity),
        notes
      });
      setShowModal(false);
      setName('');
      fetchMaterials();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add custom material.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/materials/${id}`);
      fetchMaterials();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card-clean p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Thermophysical Material Database</h1>
          <p className="text-xs text-slate-500">
            Standard reference thermophysical properties for envelope materials (Conductivity k, Density ρ, Specific Heat c_p).
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Custom Material
        </button>
      </div>

      <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600" />
        <span>
          <strong>Reference Data Notice:</strong> Default materials are provided with standard thermophysical property estimates for building physics calculations. Custom materials can be created or edited below.
        </span>
      </div>

      {/* Materials Database Table */}
      <div className="card-clean overflow-hidden p-0">
        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
              <th className="p-3.5">Material Name</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5">Conductivity k (W/m·K)</th>
              <th className="p-3.5">Density ρ (kg/m³)</th>
              <th className="p-3.5">Specific Heat c_p (J/kg·K)</th>
              <th className="p-3.5">Solar Absorptivity</th>
              <th className="p-3.5">Emissivity</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {materials.map((mat) => (
              <tr key={mat._id} className="hover:bg-slate-50 transition">
                <td className="p-3.5 font-bold text-slate-800">
                  {mat.name}
                  {mat.isCustom && <span className="ml-2 px-1.5 py-0.5 text-[9px] bg-sky-50 text-sky-700 border border-sky-200 rounded font-semibold">Custom</span>}
                </td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                    {mat.category}
                  </span>
                </td>
                <td className="p-3.5 font-mono font-semibold text-sky-700">{mat.thermalConductivity}</td>
                <td className="p-3.5 font-mono">{mat.density}</td>
                <td className="p-3.5 font-mono">{mat.specificHeat}</td>
                <td className="p-3.5 font-mono">{mat.solarAbsorptivity}</td>
                <td className="p-3.5 font-mono">{mat.emissivity}</td>
                <td className="p-3.5 text-right">
                  {mat.isCustom && (
                    <button onClick={() => handleDelete(mat._id)} className="text-red-500 hover:text-red-700 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Custom Material Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h2 className="text-base font-bold text-slate-900">Add Custom Material</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">{error}</div>}

            <form onSubmit={handleAddMaterial} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Material Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-clean" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-clean">
                    {['Wall', 'Roof', 'Floor', 'Insulation', 'Window', 'Door', 'Thermal Mass'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Thermal Cond. k (W/mK)</label>
                  <input type="number" step="0.001" value={k} onChange={(e) => setK(e.target.value)} className="input-clean" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Density ρ (kg/m³)</label>
                  <input type="number" value={density} onChange={(e) => setDensity(e.target.value)} className="input-clean" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Specific Heat c_p (J/kgK)</label>
                  <input type="number" value={cp} onChange={(e) => setCp(e.target.value)} className="input-clean" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Solar Absorptivity (0-1)</label>
                  <input type="number" step="0.05" value={solarAbsorptivity} onChange={(e) => setSolarAbsorptivity(e.target.value)} className="input-clean" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Emissivity (0-1)</label>
                  <input type="number" step="0.05" value={emissivity} onChange={(e) => setEmissivity(e.target.value)} className="input-clean" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Material</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
