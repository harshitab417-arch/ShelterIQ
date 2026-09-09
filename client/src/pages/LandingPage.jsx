import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sun, Thermometer, Cpu, BarChart3, CheckCircle2, ShieldCheck } from 'lucide-react';
import Shelter3DViewer from '../three/Shelter3DViewer';

export default function LandingPage() {
  const navigate = useNavigate();

  const dummyShelter = {
    geometry: { length: 6.0, width: 4.0, height: 2.8, wallThickness: 0.30 },
    design: { orientation: 180, roofAngle: 25 },
    openings: { windowCount: 2, windowArea: 2.5, doorArea: 1.8 }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-lg">
            S
          </div>
          <div>
            <h1 className="font-display font-bold text-slate-900 text-base">SHELTER IQ</h1>
            <p className="text-xs text-sky-700 font-medium">Area-Specific Thermal Engineering Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/login')} className="btn-secondary">
            Sign In
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Launch Platform <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-sky-100 text-sky-800 text-xs font-semibold rounded-full mb-4">
            <ShieldCheck className="w-3.5 h-3.5" /> High-Altitude Sub-Zero Passive Protection
          </span>
          <h1 className="text-4xl sm:text-5xl font-display font-extrabold text-slate-900 leading-tight tracking-tight mb-6">
            Area-Specific Passive Shelter <span className="text-sky-600">Thermal Design</span>
          </h1>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            Simulate, compare, and optimize passive shelter designs for extreme climatic conditions such as Leh, Ladakh. Engineered with a custom Node.js transient heat-transfer physics engine.
          </p>

          <div className="flex flex-wrap gap-4 mb-10">
            <button onClick={() => navigate('/new-simulation')} className="btn-primary text-base px-6 py-3">
              Start Simulation <ArrowRight className="w-5 h-5" />
            </button>
            <button onClick={() => navigate('/validation')} className="btn-secondary text-base px-6 py-3">
              Explore Physics Validation
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200">
            <div>
              <p className="text-2xl font-bold text-slate-900">3500m+</p>
              <p className="text-xs text-slate-500">Altitude Optimized</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-sky-600">0.05°C</p>
              <p className="text-xs text-slate-500">Numerical Precision</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">2 Algos</p>
              <p className="text-xs text-slate-500">Grid Search & GA</p>
            </div>
          </div>
        </div>

        {/* 3D Visual Preview */}
        <div className="card-clean shadow-lg p-2">
          <div className="px-4 py-3 bg-slate-100 rounded-t-lg border-b border-slate-200 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700">Parametric 3D Shelter Visualizer</span>
            <span className="text-[11px] text-sky-700 font-semibold bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              Interactive View
            </span>
          </div>
          <Shelter3DViewer geometry={dummyShelter.geometry} design={dummyShelter.design} openings={dummyShelter.openings} />
        </div>
      </section>

      {/* Engineering Workflow Section */}
      <section className="bg-white py-16 px-8 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-display font-bold text-slate-900 mb-3">Systematic Design Workflow</h2>
            <p className="text-slate-600">From raw climate data to verified optimal thermal comfort in six clear steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {[
              { step: '01', title: 'Climate Data', desc: 'Open-Meteo API or CSV weather import', icon: Sun },
              { step: '02', title: 'Shelter Design', desc: 'Parametric 3D & 2D geometry definition', icon: Thermometer },
              { step: '03', title: 'Thermal Simulation', desc: '1D Transient lumped physics solver', icon: Cpu },
              { step: '04', title: 'Comparison', desc: 'Side-by-side thermal envelope analysis', icon: BarChart3 },
              { step: '05', title: 'Optimization', desc: 'Grid Search & Genetic Algorithm', icon: CheckCircle2 },
              { step: '06', title: 'Recommended Design', desc: 'PDF Report & AI physics explanation', icon: ShieldCheck }
            ].map((wf, idx) => {
              const Icon = wf.icon;
              return (
                <div key={idx} className="card-clean text-center p-4 relative">
                  <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded mb-2 inline-block">
                    {wf.step}
                  </span>
                  <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-700 mb-3">
                    <Icon className="w-5 h-5 text-sky-600" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-800 mb-1">{wf.title}</h3>
                  <p className="text-[11px] text-slate-500 leading-tight">{wf.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-100 py-8 px-8 border-t border-slate-200 mt-auto text-center text-xs text-slate-500">
        <p>© 2026 Defence Research & Development Organisation (DRDO). Passive Thermal Simulation System.</p>
      </footer>
    </div>
  );
}
