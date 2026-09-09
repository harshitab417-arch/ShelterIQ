import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  Box,
  CloudSun,
  Layers,
  History,
  GitCompare,
  Cpu,
  CheckCircle2,
  FileText,
  Settings,
  ShieldAlert
} from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'New Simulation', path: '/new-simulation', icon: PlusCircle },
    { label: 'Shelter Designer', path: '/shelter-designer', icon: Box },
    { label: 'Climate Data', path: '/climate', icon: CloudSun },
    { label: 'Material Database', path: '/materials', icon: Layers },
    { label: 'Simulations', path: '/simulations', icon: History },
    { label: 'Compare Designs', path: '/compare', icon: GitCompare },
    { label: 'Optimization', path: '/optimization', icon: Cpu },
    { label: 'Model Validation', path: '/validation', icon: CheckCircle2 },
    { label: 'Reports', path: '/reports', icon: FileText }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            S
          </div>
          <div>
            <h1 className="font-display font-bold text-slate-800 text-sm tracking-tight leading-tight">
              SHELTER IQ
            </h1>
            <p className="text-[11px] text-sky-700 font-medium">Thermal Simulation System</p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 font-semibold border-l-4 border-sky-600 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
