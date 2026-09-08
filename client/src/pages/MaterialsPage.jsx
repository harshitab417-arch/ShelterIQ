import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Layers, Plus, Trash2, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New Material Form
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Insulation');
  const [k, setK] = useState('0.035');
  const [density, setDensity] = useState('30');
  const [cp, setCp] = useState('1300');
  const [emissivity, setEmissivity] = useState('0.85');
  const [solarAbsorptivity, setSolarAbsorptivity] = useState('0.45');
  const [thicknessDefaultMm, setThicknessDefaultMm] = useState('100');
  const [isOptimizable, setIsOptimizable] = useState(false);
  const [validThicknessesStr, setValidThicknessesStr] = useState('50, 75, 100, 125, 150, 200');
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

    const defaultThickMeters = parseFloat(thicknessDefaultMm) ? parseFloat(thicknessDefaultMm) / 1000 : 0.10;
    let parsedValidThicknesses = undefined;

    if (isOptimizable && validThicknessesStr.trim()) {
      parsedValidThicknesses = validThicknessesStr
        .split(',')
        .map(v => parseFloat(v.trim()))
        .filter(v => !isNaN(v) && v > 0)
        .map(v => (v > 2 ? v / 1000 : v)); // convert mm to m if entered in mm
    }

    try {
      await api.post('/materials', {
        name,
        category,
        thermalConductivity: parseFloat(k),
        density: parseFloat(density),
        specificHeat: parseFloat(cp),
        emissivity: parseFloat(emissivity),
        solarAbsorptivity: parseFloat(solarAbsorptivity),
        thicknessDefault: defaultThickMeters,
        validThicknesses: parsedValidThicknesses,
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

  const formatThicknessDefault = (mat) => {
    const defaultM = mat.thicknessDefault || 0.10;
    const defaultMm = Math.round(defaultM * 1000);
    return `${defaultMm} mm (${defaultM.toFixed(2)} m)`;
  };

  const formatThicknessRange = (mat) => {
    if (Array.isArray(mat.validThicknesses) && mat.validThicknesses.length > 0) {
      const formattedMm = mat.validThicknesses.map(t => Math.round(t * 1000)).join(', ');
      return `${formattedMm} mm`;
    }
    if (mat.minThickness !== undefined && mat.maxThickness !== undefined && mat.thicknessStep) {
      const minMm = Math.round(mat.minThickness * 1000);
      const maxMm = Math.round(mat.maxThickness * 1000);
      const stepMm = Math.round(mat.thicknessStep * 1000);
      return `${minMm} – ${maxMm} mm (step ${stepMm} mm)`;
    }
    return <span className="text-slate-400 italic">Fixed / default only</span>;
  };

  const calculateUValue = (mat) => {
    const kVal = mat.thermalConductivity;
    const LVal = mat.thicknessDefault || 0.10;
    if (!kVal || !LVal) return '--';
    const uVal = kVal / LVal;
    return uVal.toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="card-clean p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Thermophysical Material Library</h1>
          <p className="text-xs text-slate-500">
            Material properties database with material-specific thickness options and passive shelter building physics values.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Custom Material
        </button>
      </div>

      <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600" />
        <span>
          <strong>Engineering Notice:</strong> Insulation materials define component-specific valid thickness ranges used directly during design optimization sweeps. Standard structural wall, roof, and door elements report <em>Fixed / default only</em>.
        </span>
      </div>

      {/* Materials Database Table */}
      <div className="card-clean overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <th className="p-3.5">Material</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">k / U-value</th>
                <th className="p-3.5">Default Thickness L</th>
                <th className="p-3.5">Valid Thickness Range / Options</th>
                <th className="p-3.5">Density ρ / Sp. Heat c_p</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {materials.map((mat) => {
                const isOptimizableMat = (Array.isArray(mat.validThicknesses) && mat.validThicknesses.length > 0) ||
                  (mat.minThickness !== undefined && mat.maxThickness !== undefined);

                return (
                  <tr key={mat._id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-bold text-slate-800">
                      {mat.name}
                      {mat.isCustom && <span className="ml-2 px-1.5 py-0.5 text-[9px] bg-sky-50 text-sky-700 border border-sky-200 rounded font-semibold">Custom</span>}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        mat.category === 'Insulation' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {mat.category}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono">
                      <span className="font-semibold text-sky-700">k = {mat.thermalConductivity} W/m·K</span>
                      <div className="text-[10px] text-slate-400">U ≈ {calculateUValue(mat)} W/m²·K</div>
                    </td>
                    <td className="p-3.5 font-mono font-medium text-slate-800">
                      {formatThicknessDefault(mat)}
                    </td>
                    <td className="p-3.5 font-mono">
                      {isOptimizableMat ? (
                        <span className="text-emerald-700 font-semibold bg-emerald-50/70 border border-emerald-200/60 px-2 py-1 rounded inline-block">
                          {formatThicknessRange(mat)}
                        </span>
                      ) : (
                        formatThicknessRange(mat)
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-500">
                      {mat.density} kg/m³ | {mat.specificHeat} J/kg·K
                    </td>
                    <td className="p-3.5 text-right">
                      {mat.isCustom && (
                        <button onClick={() => handleDelete(mat._id)} className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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

            <form onSubmit={handleAddMaterial} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Material Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-clean" required placeholder="e.g. Rigid Aerogel Insulation Board" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-clean">
                    {['Wall', 'Roof', 'Floor', 'Insulation', 'Window', 'Door', 'Thermal Mass'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Thermal Cond. k (W/m·K)</label>
                  <input type="number" step="0.001" value={k} onChange={(e) => setK(e.target.value)} className="input-clean" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default Thickness L (mm)</label>
                  <input type="number" value={thicknessDefaultMm} onChange={(e) => setThicknessDefaultMm(e.target.value)} className="input-clean" required placeholder="100" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Density ρ (kg/m³)</label>
                  <input type="number" value={density} onChange={(e) => setDensity(e.target.value)} className="input-clean" required />
                </div>
              </div>

              {/* Material-based Thickness Options Input */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isOptimizableCheck"
                    checked={isOptimizable}
                    onChange={(e) => setIsOptimizable(e.target.checked)}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <label htmlFor="isOptimizableCheck" className="font-bold text-slate-800">
                    Enable Dynamic Thickness Optimization Range
                  </label>
                </div>

                {isOptimizable ? (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Valid Thickness Options (comma-separated in mm)
                    </label>
                    <input
                      type="text"
                      value={validThicknessesStr}
                      onChange={(e) => setValidThicknessesStr(e.target.value)}
                      className="input-clean"
                      placeholder="50, 75, 100, 125, 150, 200"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      These specific values will be evaluated during design optimization sweeps.
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    Material will be marked as "Fixed / default only" and evaluated strictly at default thickness.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Specific Heat c_p (J/kg·K)</label>
                  <input type="number" value={cp} onChange={(e) => setCp(e.target.value)} className="input-clean" required />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Solar Absorptivity (0-1)</label>
                  <input type="number" step="0.05" value={solarAbsorptivity} onChange={(e) => setSolarAbsorptivity(e.target.value)} className="input-clean" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
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
