import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NewSimulation from './pages/NewSimulation';
import ShelterDesigner from './pages/ShelterDesigner';
import ClimatePage from './pages/ClimatePage';
import MaterialsPage from './pages/MaterialsPage';
import SimulationsPage from './pages/SimulationsPage';
import CompareDesignsPage from './pages/CompareDesignsPage';
import OptimizationPage from './pages/OptimizationPage';
import ValidationPage from './pages/ValidationPage';
import SavedProjectsPage from './pages/SavedProjectsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Authenticated Dashboard Routes */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/new-simulation" element={<NewSimulation />} />
          <Route path="/shelter-designer" element={<ShelterDesigner />} />
          <Route path="/climate" element={<ClimatePage />} />
          <Route path="/materials" element={<MaterialsPage />} />
          <Route path="/simulations" element={<SimulationsPage />} />
          <Route path="/compare" element={<CompareDesignsPage />} />
          <Route path="/optimization" element={<OptimizationPage />} />
          <Route path="/validation" element={<ValidationPage />} />
          <Route path="/saved-projects" element={<SavedProjectsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
