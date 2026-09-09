import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, User, Menu, X, Shield, Sparkles } from 'lucide-react';

const navItems = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'features', label: 'Features' },
  { id: 'dashboard', label: 'Dashboard' }
];

export default function LandingNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedTab, setSelectedTab] = useState('home');
  const [hoveredTab, setHoveredTab] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      // Simple scroll spy
      const featuresEl = document.getElementById('visualizer');
      const workflowEl = document.getElementById('workflow');
      const metricsEl = document.getElementById('metrics');

      const scrollPos = window.scrollY + 180;
      if (workflowEl && scrollPos >= workflowEl.offsetTop) {
        setSelectedTab('about');
      } else if (featuresEl && scrollPos >= featuresEl.offsetTop) {
        setSelectedTab('features');
      } else if (metricsEl && scrollPos >= metricsEl.offsetTop) {
        setSelectedTab('about');
      } else {
        setSelectedTab('home');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTabClick = (id) => {
    setSelectedTab(id);
    setMobileMenuOpen(false);

    if (id === 'dashboard') {
      navigate('/dashboard');
      return;
    }

    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (id === 'about') {
      const el = document.getElementById('workflow') || document.getElementById('metrics');
      if (el) {
        const yOffset = -90;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
      return;
    }

    if (id === 'features') {
      const el = document.getElementById('visualizer');
      if (el) {
        const yOffset = -90;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
      return;
    }
  };

  return (
    <header className="sticky top-4 z-50 px-4 sm:px-6 w-full max-w-7xl mx-auto transition-all duration-300">
      <nav
        className={`rounded-2xl sm:rounded-[22px] px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-200/90'
            : 'bg-white/80 backdrop-blur-md shadow-[0_4px_24px_-4px_rgba(15,27,61,0.06)] border border-slate-200/70'
        }`}
      >
        {/* LEFT: DRDO Brand Logo & Title */}
        <div
          onClick={() => handleTabClick('home')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#008BD2] to-[#006ca8] flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-md shadow-[#008BD2]/20 group-hover:scale-105 transition-transform duration-200">
            D
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-slate-900 text-sm sm:text-base tracking-tight leading-tight group-hover:text-[#008BD2] transition-colors">
                DRDO PASSIVE SHELTER
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-sky-800/80 font-medium tracking-wide">
              Area-Specific Thermal Engineering Platform
            </p>
          </div>
        </div>

        {/* CENTER: Shift Highlight Tabs (Hover.dev inspired) */}
        <div className="hidden md:flex items-center bg-slate-100/80 backdrop-blur p-1 rounded-full border border-slate-200/70 relative">
          {navItems.map((tab) => {
            const isSelected = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                onMouseEnter={() => setHoveredTab(tab.id)}
                onMouseLeave={() => setHoveredTab(null)}
                className={`relative px-4 py-1.5 text-xs sm:text-sm font-medium transition-colors duration-200 rounded-full select-none ${
                  isSelected
                    ? 'text-sky-800 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {/* Active Shift Pill Animation */}
                {isSelected && (
                  <motion.span
                    layoutId="shift-tab-pill"
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 30,
                      mass: 0.8
                    }}
                    className="absolute inset-0 z-0 rounded-full bg-white shadow-sm border border-sky-200/70"
                  />
                )}

                {/* Subtle Hover Glow on non-active item */}
                {!isSelected && hoveredTab === tab.id && (
                  <motion.span
                    layoutId="shift-tab-hover"
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 z-0 rounded-full bg-slate-200/60"
                  />
                )}

                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* RIGHT: Actions */}
        <div className="hidden sm:flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => navigate('/login')}
            className="px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:text-sky-700 hover:bg-slate-100/80 rounded-xl transition-all duration-150 flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5 text-slate-500" />
            Sign In
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 sm:px-5 py-2 sm:py-2.5 bg-[#008BD2] hover:bg-[#0077b5] active:bg-[#006399] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm hover:shadow-md shadow-[#008BD2]/25 transition-all duration-200 flex items-center gap-1.5 group"
          >
            Launch Platform
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* MOBILE HAMBURGER BUTTON */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* MOBILE EXPANDED DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden mt-2 p-4 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl space-y-3"
          >
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1.5 rounded-xl">
              {navItems.map((tab) => {
                const isSelected = selectedTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                      isSelected
                        ? 'bg-white text-[#008BD2] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/login');
                }}
                className="w-full py-2.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center gap-1.5 border border-slate-200"
              >
                <User className="w-3.5 h-3.5" />
                Sign In
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/dashboard');
                }}
                className="w-full py-2.5 text-xs font-semibold text-white bg-[#008BD2] hover:bg-[#0077b5] rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
              >
                Launch Platform
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
