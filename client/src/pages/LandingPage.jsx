import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  Sun,
  Thermometer,
  Cpu,
  BarChart3,
  CheckCircle2,
  Layers,
  Activity,
  Zap,
  Compass,
  FileText,
  Shield,
  ChevronRight,
  Sliders,
  Sparkles
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeSector, setActiveSector] = useState(0);

  // High-Altitude Deployment Telemetry Profiles
  const deployments = [
    {
      name: 'Leh Sector',
      altitude: '3,524 m',
      temp: '-38 °C',
      coordinates: '34.15° N, 77.58° E',
      wind: '12.4 m/s',
      solar: '840 W/m²'
    },
    {
      name: 'Siachen Base Camp',
      altitude: '5,400 m',
      temp: '-50 °C',
      coordinates: '35.42° N, 77.10° E',
      wind: '18.6 m/s',
      solar: '910 W/m²'
    },
    {
      name: 'Dras Extreme Cold Zone',
      altitude: '3,230 m',
      temp: '-45 °C',
      coordinates: '34.43° N, 75.76° E',
      wind: '14.2 m/s',
      solar: '780 W/m²'
    }
  ];

  const currentDeploy = deployments[activeSector];

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-sky-100 selection:text-sky-800">
      {/* ─── TOP NAVIGATION HEADER ─── */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sm:px-12 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        {/* Logo Branding */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-sky-600/20 group-hover:bg-sky-700 transition-colors">
            S
          </div>
          <div>
            <h1 className="font-display font-extrabold text-slate-900 text-lg tracking-tight">ShelterIQ</h1>
            <p className="text-[11px] text-sky-700 font-medium">Area-Specific Thermal Engineering Platform</p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="btn-secondary text-xs"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary text-xs"
          >
            Launch Platform <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ─── HERO SECTION WITH UPLOADED MOUNTAIN DOME BACKGROUND ─── */}
      <section className="relative overflow-hidden py-24 px-6 sm:px-12 border-b border-slate-200">
        {/* User-Uploaded Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/hero_bg.jpg"
            alt="Geodesic Dome Shelter in Sub-Zero Himalayan Mountains"
            className="w-full h-full object-cover object-center scale-105"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          {/* Subtle Gradient Overlay Aligned with Light Website Theme */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/75 to-slate-900/50" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Main Hero Headline & Copy */}
          <div className="lg:col-span-8 space-y-6">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-200 text-xs font-semibold backdrop-blur-md">
              <ShieldCheck className="w-4 h-4 text-sky-300" /> Area-Specific Sub-Zero Passive Protection
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-white tracking-tight leading-[1.15]">
              Area-Specific Passive Shelter <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-sky-200 to-white">
                Thermal Design & Optimization
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-200 max-w-2xl font-normal leading-relaxed">
              Simulate, compare, and optimize passive shelter archetypes for extreme climates like Leh, Siachen, and Dras. Engineered with a custom 1D transient heat-transfer physics solver.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => navigate('/new-simulation')}
                className="btn-primary text-sm px-6 py-3.5 shadow-lg shadow-sky-600/30"
              >
                Start Simulation <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => navigate('/validation')}
                className="btn-secondary text-sm px-6 py-3.5 bg-white/90 hover:bg-white text-slate-800 border-white/40 backdrop-blur-md"
              >
                Explore Physics Validation <Activity className="w-4 h-4 text-sky-600" />
              </button>
            </div>

            {/* Key Metrics Stats */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/20 max-w-lg">
              <div>
                <p className="text-2xl font-extrabold text-white">3500m+</p>
                <p className="text-xs text-slate-300 font-medium">Altitude Optimized</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-sky-300">0.05°C</p>
                <p className="text-xs text-slate-300 font-medium">Numerical Precision</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-white">4 Archetypes</p>
                <p className="text-xs text-slate-300 font-medium">Rectangle, Dome, A-Frame, Quonset</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── IMPROVED PLATFORM CAPABILITIES SECTION ─── */}
      <section id="platform" className="py-20 px-6 sm:px-12 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="px-3 py-1 bg-sky-100 text-sky-800 text-xs font-semibold rounded-full uppercase tracking-wider border border-sky-200">
            Platform Capabilities
          </span>
          <h2 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">
            Engineered for Sub-Zero Thermal Protection
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Comprehensive passive design tool set built specifically for high-altitude defense outposts and sub-zero civilian shelters.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Transient Physics Solver',
              desc: '1D lumped thermal capacitance engine integrating Fourier conduction, McAdams empirical convection, and Swinbank sky radiation.',
              icon: Thermometer,
              badge: '0.05°C Precision',
              features: ['Lumped Thermal Capacitance', 'McAdams Convection Model', 'Clear-Sky Longwave Radiation']
            },
            {
              title: 'Sol-Air Solar Integration',
              desc: 'Hour-by-hour solar angle, surface incidence, shading, and glazing transmissivity calculation for south-facing irradiance.',
              icon: Sun,
              badge: 'Leh Coordinates',
              features: ['South-Facing Orientation', 'Hourly Angle Tracking', 'Double Low-E Argon Glazing']
            },
            {
              title: 'Multi-Shape Optimization',
              desc: 'Fair comparison across Rectangle, Dome, A-Frame, and Quonset geometries normalized to equivalent usable floor area.',
              icon: Layers,
              badge: '4 Archetypes',
              features: ['Normalized Usable Area', 'Surface-to-Volume Ratio', 'Curved Cap Spherical Area']
            },
            {
              title: 'PDF Engineering Reports',
              desc: 'Automated 3-page DRDO compliance PDF report with heat loss breakdown charts, stress scenarios, and 3D CAD specs.',
              icon: FileText,
              badge: 'Automated PDF',
              features: ['3-Page DRDO Specification', 'Heat Loss Breakdown Bar', 'Resilience Score Summary']
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-xl hover:border-sky-400 hover:-translate-y-1.5 transition-all duration-300 relative group overflow-hidden flex flex-col justify-between space-y-5"
              >
                {/* Hover Top Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-blue-600 to-sky-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100 text-sky-600 border border-sky-200/60 flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-sky-600 group-hover:to-sky-700 group-hover:text-white group-hover:border-transparent group-hover:shadow-md group-hover:shadow-sky-600/30 transition-all duration-300">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold tracking-wider text-sky-800 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200/80 shadow-2xs">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                {/* Feature Bullet Highlights */}
                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  {item.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 text-[11px] text-slate-500">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── IMPROVED SYSTEMATIC WORKFLOW SECTION ─── */}
      <section className="bg-gradient-to-b from-white via-sky-50/40 to-slate-50 py-20 px-6 sm:px-12 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="px-3 py-1 bg-sky-100 text-sky-800 text-xs font-semibold rounded-full uppercase tracking-wider border border-sky-200">
              Structured Pipeline
            </span>
            <h2 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">Systematic Design Workflow</h2>
            <p className="text-slate-600 text-sm">From raw climate data to verified optimal thermal comfort in six clear steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-5 relative">
            {[
              { step: '01', title: 'Climate Data', desc: 'Open-Meteo API or CSV weather import', icon: Sun },
              { step: '02', title: 'Shelter Design', desc: 'Parametric shape & envelope definition', icon: Thermometer },
              { step: '03', title: 'Thermal Simulation', desc: '1D Transient lumped physics solver', icon: Cpu },
              { step: '04', title: 'Fair Comparison', desc: 'Side-by-side thermal envelope analysis', icon: BarChart3 },
              { step: '05', title: 'Optimization', desc: 'Grid Search & Genetic Algorithm', icon: CheckCircle2 },
              { step: '06', title: 'Optimal Design', desc: 'PDF Report & AI physics explanation', icon: ShieldCheck }
            ].map((wf, idx) => {
              const Icon = wf.icon;
              const isLast = idx === 5;
              return (
                <div key={idx} className="relative group">
                  <div className="h-full bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-lg hover:border-sky-400 hover:-translate-y-1 transition-all duration-300 text-center flex flex-col items-center justify-between space-y-3">
                    <div className="w-full flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-sky-600 to-sky-700 text-white font-extrabold text-xs flex items-center justify-center shadow-md shadow-sky-600/30 mb-3">
                        {wf.step}
                      </div>

                      <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center mb-3 group-hover:bg-sky-600 group-hover:text-white transition-colors duration-300 shadow-2xs">
                        <Icon className="w-5 h-5" />
                      </div>

                      <h3 className="text-xs font-extrabold text-slate-900 group-hover:text-sky-700 transition-colors mb-1">
                        {wf.title}
                      </h3>

                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {wf.desc}
                      </p>
                    </div>
                  </div>

                  {/* Connecting Arrow for Desktop */}
                  {!isLast && (
                    <div className="hidden lg:flex absolute top-1/2 -right-3 z-20 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-sky-200 text-sky-600 shadow-xs items-center justify-center pointer-events-none">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-slate-100 py-8 px-6 sm:px-12 border-t border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row justify-between items-center gap-4 mt-auto">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-sky-600 text-white font-bold flex items-center justify-center text-xs">
            S
          </div>
          <span className="font-bold text-slate-900">ShelterIQ</span>
          <span>© 2026 Defence Research & Development Organisation (DRDO). Passive Thermal Simulation System.</span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/validation')} className="hover:text-sky-600 transition-colors cursor-pointer">Validation</button>
          <button onClick={() => navigate('/dashboard')} className="hover:text-sky-600 transition-colors cursor-pointer">Dashboard</button>
          <button onClick={() => navigate('/login')} className="hover:text-sky-600 transition-colors cursor-pointer">Portal Login</button>
        </div>
      </footer>
    </div>
  );
}
