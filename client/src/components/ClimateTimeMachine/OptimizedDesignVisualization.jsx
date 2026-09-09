import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../services/api';
import {
  Cpu, RotateCw, AlertCircle, Eye, Flame, Activity,
  Sparkles, CheckCircle2, RefreshCw
} from 'lucide-react';
import Shelter3DViewer from '../../three/Shelter3DViewer';
import VisualizationModeSelector from './VisualizationModeSelector';
import SimulationTimeline from './SimulationTimeline';
import ThermalMetricsPanel from './ThermalMetricsPanel';
import ThermalLegend from './ThermalLegend';
import FloatingInfoCard from './FloatingInfoCard';
import { extractComponentLosses, formatHourLabel } from './timeMachineAdapter';

export default function OptimizedDesignVisualization({ currentSim = null, optResult = null }) {
  const [viewMode, setViewMode] = useState('normal'); // 'normal' | 'thermal' | 'heatflow'
  const [selectedHour, setSelectedHour] = useState(12); // Default to midday 12:00
  const [isPlaying, setIsPlaying] = useState(false);

  // Local visualization-only simulation state
  const [visualizationData, setVisualizationData] = useState(null);
  const [loadingViz, setLoadingViz] = useState(false);
  const [errorViz, setErrorViz] = useState(null);

  // Derived metadata from inherited simulation
  const inheritedShelter = currentSim?.shelter || {};
  const inheritedClimate = currentSim?.climateDataset || {};
  const inheritedComfort = currentSim?.comfortSettings || { minComfortTemp: 18, maxComfortTemp: 24 };
  const shape = (currentSim?.shape || inheritedShelter?.shape || 'rectangle').toLowerCase();

  // Extract winning shelter configuration
  const winner = optResult?.winner;
  const optimizedConfig = useMemo(() => {
    if (winner?.config) {
      return {
        orientation: winner.config.orientation,
        orientationLabel: winner.config.orientationLabel,
        wwr: winner.config.wwr,
        windowArea: winner.config.windowArea,
        insulationThickness: winner.config.insulationThickness
      };
    }
    return {
      orientation: inheritedShelter?.design?.orientation !== undefined ? inheritedShelter.design.orientation : 180,
      wwr: null,
      windowArea: inheritedShelter?.openings?.windowArea || 2.5,
      insulationThickness: inheritedShelter?.geometry?.insulationThickness || 0.10
    };
  }, [winner, inheritedShelter]);

  // Construct optimized shelter object for simulation and rendering
  const activeOptimizedShelter = useMemo(() => {
    if (winner?.testShelter) {
      return winner.testShelter;
    }
    return {
      ...inheritedShelter,
      design: {
        ...inheritedShelter.design,
        orientation: optimizedConfig.orientation
      },
      openings: {
        ...inheritedShelter.openings,
        windowArea: optimizedConfig.windowArea,
        openingOrientation: optimizedConfig.orientation
      },
      geometry: {
        ...inheritedShelter.geometry,
        insulationThickness: optimizedConfig.insulationThickness
      }
    };
  }, [winner, inheritedShelter, optimizedConfig]);

  // Fetch or execute 24-hour visualization simulation for the optimized winner
  const runVisualizationSimulation = useCallback(async () => {
    if (!currentSim || !inheritedClimate?.dataPoints) {
      // Fall back to existing simulation results if present
      if (currentSim?.results) {
        setVisualizationData(currentSim.results);
      }
      return;
    }

    setLoadingViz(true);
    setErrorViz(null);

    try {
      // If we have a winner, run a 24h transient simulation for the winner
      if (optResult?.winner) {
        const res = await api.post('/simulation/run', {
          name: `Visualization — ${currentSim.name || 'Optimized Shelter'}`,
          shelter: activeOptimizedShelter,
          climateDataset: inheritedClimate,
          comfortSettings: inheritedComfort
        });
        if (res.data?.results) {
          setVisualizationData(res.data.results);
        } else {
          setVisualizationData(currentSim.results);
        }
      } else if (currentSim.results) {
        // Feature 2 hasn't run yet, use baseline simulation results directly
        setVisualizationData(currentSim.results);
      }
    } catch (err) {
      console.warn('[Climate Time Machine] Simulation fetch notice:', err?.message);
      // Gracefully fall back to inherited simulation results
      if (currentSim?.results) {
        setVisualizationData(currentSim.results);
      } else {
        setErrorViz('Unable to load 24-hour simulation data for visualization.');
      }
    } finally {
      setLoadingViz(false);
    }
  }, [currentSim, inheritedClimate, inheritedComfort, optResult, activeOptimizedShelter]);

  useEffect(() => {
    runVisualizationSimulation();
  }, [runVisualizationSimulation]);

  // Active time series and frame data
  const activeTimeSeries = useMemo(() => {
    if (visualizationData?.timeSeries && visualizationData.timeSeries.length > 0) {
      return visualizationData.timeSeries;
    }
    if (currentSim?.results?.timeSeries && currentSim.results.timeSeries.length > 0) {
      return currentSim.results.timeSeries;
    }
    return [];
  }, [visualizationData, currentSim]);

  const currentHourPoint = useMemo(() => {
    if (activeTimeSeries.length === 0) return null;
    return activeTimeSeries[selectedHour % activeTimeSeries.length] || activeTimeSeries[0];
  }, [activeTimeSeries, selectedHour]);

  // Heat flow direction based on real simulated temperatures
  const flowDirection = useMemo(() => {
    if (currentHourPoint?.indoorTemperature !== undefined && currentHourPoint?.ambientTemperature !== undefined) {
      return currentHourPoint.indoorTemperature >= currentHourPoint.ambientTemperature ? 'OUTWARD' : 'INWARD';
    }
    return 'OUTWARD';
  }, [currentHourPoint]);

  // Component breakdown extraction
  const componentLosses = useMemo(() => {
    const cb = visualizationData?.componentBreakdown || currentSim?.results?.componentBreakdown || {};
    return extractComponentLosses(cb);
  }, [visualizationData, currentSim]);

  const activeMetrics = visualizationData?.metrics || currentSim?.results?.metrics || {};

  return (
    <div className="space-y-4">
      {/* Top Header & Mode Selector Bar */}
      <div className="card-clean p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-950 text-sky-400 border border-sky-800">
              <Cpu className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Climate Time Machine
              </h2>
              <span className="text-[11px] text-sky-400 font-mono">
                Interactive Thermal Digital Twin
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Explore how the optimized shelter responds to climate, solar exposure and envelope heat transfer.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <VisualizationModeSelector
            viewMode={viewMode}
            onChangeViewMode={setViewMode}
          />

          <button
            onClick={runVisualizationSimulation}
            disabled={loadingViz}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Re-run 24-Hour Visualization Simulation"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingViz ? 'animate-spin text-sky-400' : ''}`} />
            <span className="hidden lg:inline">{loadingViz ? 'Simulating...' : 'Refresh 24h'}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: 3D Viewport & 24h Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-xl">
            {/* Top-Left Floating HUD Card */}
            <div className="absolute top-3 left-3 z-10">
              <FloatingInfoCard
                currentHourData={currentHourPoint}
                currentHour={selectedHour}
                optimizedConfig={optimizedConfig}
                comfortSettings={inheritedComfort}
              />
            </div>

            {/* Bottom-Left Mode Legend */}
            <div className="absolute bottom-3 left-3 z-10 pointer-events-auto">
              <ThermalLegend
                viewMode={viewMode}
                flowDirection={flowDirection}
              />
            </div>

            {/* Top-Center Mode Status Pill */}
            <div className="absolute top-3 right-28 z-10 hidden sm:flex items-center gap-1.5 bg-slate-900/80 backdrop-blur border border-slate-700 px-3 py-1 rounded-full text-[10px] font-mono text-slate-300 shadow">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
              <span>MODE: <strong className="text-white uppercase">{viewMode}</strong></span>
              <span className="text-slate-600">|</span>
              <span>SHELTER: <strong className="text-emerald-400 uppercase">{optResult ? 'OPTIMIZED' : 'BASELINE'}</strong></span>
            </div>

            {/* Single Persistent 3D Three.js Viewport */}
            <Shelter3DViewer
              shape={shape}
              dimensions={inheritedShelter.geometry || inheritedShelter.dimensions}
              design={{ ...inheritedShelter.design, orientation: optimizedConfig.orientation }}
              openings={{
                windowArea: optimizedConfig.windowArea,
                windowCount: inheritedShelter.openings?.windowCount || 2,
                doorCount: inheritedShelter.openings?.doorCount || 1
              }}
              orientation={optimizedConfig.orientation}
              viewMode={viewMode}
              componentLosses={componentLosses}
              flowDirection={flowDirection}
              timeSeriesPoint={currentHourPoint}
              currentHour={selectedHour}
              height={520}
              showCompass={true}
            />
          </div>

          {/* 24-Hour Interactive Timeline Scrubber */}
          <SimulationTimeline
            timeSeries={activeTimeSeries}
            currentHourIndex={selectedHour}
            onSelectHour={setSelectedHour}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying((prev) => !prev)}
            onResetToNoon={() => setSelectedHour(12)}
          />
        </div>

        {/* Right Column: Thermal Performance Engineering Panel */}
        <div className="lg:col-span-1">
          <ThermalMetricsPanel
            currentHourData={currentHourPoint}
            currentHour={selectedHour}
            metrics={activeMetrics}
            componentLosses={componentLosses}
            optimizedConfig={optimizedConfig}
            comfortSettings={inheritedComfort}
          />
        </div>
      </div>
    </div>
  );
}
