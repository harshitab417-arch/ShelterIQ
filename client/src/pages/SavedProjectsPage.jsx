import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Box, PlusCircle } from 'lucide-react';

export default function SavedProjectsPage() {
  const [shelters, setShelters] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadShelters() {
      try {
        const res = await api.get('/shelters');
        setShelters(res.data || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadShelters();
  }, []);

  return (
    <div className="space-y-6">
      <div className="card-clean p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Saved Shelter Projects</h1>
          <p className="text-xs text-slate-500">Stored parametric building designs and envelope material selections</p>
        </div>
        <button onClick={() => navigate('/shelter-designer')} className="btn-primary">
          <PlusCircle className="w-4 h-4" /> Create New Design
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {shelters.map((s) => (
          <div key={s._id} className="card-clean space-y-3">
            <div className="flex items-center gap-2 text-sky-600 font-bold text-sm">
              <Box className="w-4 h-4" /> {s.name}
            </div>
            <p className="text-xs text-slate-500">
              Geometry: {s.geometry?.length}m x {s.geometry?.width}m x {s.geometry?.height}m
            </p>
            <div className="text-[11px] text-slate-600 space-y-1 pt-2 border-t border-slate-100">
              <p>Wall Material: <span className="font-semibold text-slate-800">{s.materials?.wallMaterial?.name}</span></p>
              <p>Roof Material: <span className="font-semibold text-slate-800">{s.materials?.roofMaterial?.name}</span></p>
              <p>Orientation: <span className="font-semibold text-slate-800">{s.design?.orientation}° South</span></p>
            </div>
            <button
              onClick={() => navigate('/new-simulation')}
              className="btn-secondary w-full py-1.5 text-xs mt-2"
            >
              Simulate This Design
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
