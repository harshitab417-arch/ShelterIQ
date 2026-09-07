import React from 'react';
import { User, LogOut, Sliders, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('drdo_token');
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded">
          Defence Research & Development Organisation
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/settings')}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          title="Settings"
        >
          <Sliders className="w-4 h-4" />
        </button>

        <div className="h-5 w-[1px] bg-slate-200"></div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs border border-sky-200">
            DE
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold text-slate-800">DRDO Engineer</p>
            <p className="text-[10px] text-slate-500">Thermal Systems Division</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
