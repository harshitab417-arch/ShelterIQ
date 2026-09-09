const express = require('express');
const router = express.Router();
const Simulation = require('../models/Simulation');
const { runThermalSimulation } = require('../physics/simulationEngine');
const { runAutoEvaluation, runOptimalAutoEvaluation, compareAllShapes } = require('../physics/materialEvaluator');
const { validateDimensions } = require('../physics/shapeCalculator');
const { checkIsFallback } = require('../config/db');
const memoryStore = require('../config/inMemoryStore');

// POST /api/simulation/run-auto — Automatic material evaluation + multi-shape optimization
router.post('/run-auto', async (req, res) => {
  try {
    const {
      name,
      shape = 'rectangle',
      dimensions,
      geometry,
      occupants = 4,
      openings,
      climateDataset,
      comfortSettings
    } = req.body;

    if (!climateDataset) {
      return res.status(400).json({ error: 'Climate dataset is required (Step 1).' });
    }

    // Support both direct dimensions or geometry object
    const activeDimensions = dimensions || geometry || { length: 6.0, width: 4.0, height: 2.8 };
    const normShape = (shape || 'rectangle').toLowerCase().trim();

    // Dimensional Validation
    const validationErrors = validateDimensions(normShape, activeDimensions);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join(' ') });
    }

    const confSettings = comfortSettings || { minComfortTemp: 18, maxComfortTemp: 24 };
    const shelterOpenings = openings || { windowCount: 2, windowArea: 2.5, doorCount: 1, openingOrientation: 180 };

    // Run optimal multi-shape & material evaluation (selects overall best shelter shape)
    const evalResult = runOptimalAutoEvaluation({
      shape: normShape,
      dimensions: activeDimensions,
      openings: shelterOpenings,
      occupants: Number(occupants) || 4,
      climateDataset,
      comfortSettings: confSettings
    });

    const {
      recommended,
      top3,
      totalCombinationsEvaluated,
      fullSimulationResult,
      bestShelter,
      geometry: calculatedGeometry,
      userSelectedShape,
      userShapeScore,
      shapeOptimized,
      shapeOptimizationNote,
      allShapeScores,
      shape: winningShape
    } = evalResult;

    const simName = name || `Simulation — ${winningShape.toUpperCase()} (${new Date().toLocaleDateString()})`;

    const simPayload = {
      name: simName,
      shape: winningShape,
      geometry: calculatedGeometry,
      dimensions: bestShelter.geometry || activeDimensions,
      shelter: bestShelter,
      climateDataset,
      comfortSettings: confSettings,
      results: fullSimulationResult,
      recommendation: recommended,
      topConfigurations: top3,
      totalCombinationsEvaluated,
      userSelectedShape,
      userShapeScore,
      shapeOptimized,
      shapeOptimizationNote,
      allShapeScores,
      status: 'Completed',
      assumptions: fullSimulationResult.assumptions,
      warnings: fullSimulationResult.warnings,
      createdAt: new Date().toISOString()
    };

    if (checkIsFallback()) {
      const record = { ...simPayload, _id: `sim_${Date.now()}` };
      memoryStore.simulations.push(record);
      return res.status(201).json(record);
    }

    const simDoc = new Simulation(simPayload);
    await simDoc.save();
    res.status(201).json(simDoc);
  } catch (err) {
    console.error('[Auto-Simulation Error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/simulation/compare-shapes — Fair comparison of all 4 shapes under normalized floor area
router.post('/compare-shapes', async (req, res) => {
  try {
    const {
      targetFloorArea = 24.0,
      occupants = 4,
      openings,
      climateDataset,
      comfortSettings
    } = req.body;

    if (!climateDataset) {
      return res.status(400).json({ error: 'Climate dataset is required for comparison.' });
    }

    const comparison = compareAllShapes({
      targetFloorArea: Number(targetFloorArea) || 24.0,
      occupants: Number(occupants) || 4,
      openings: openings || { windowCount: 2, windowArea: 2.5, doorCount: 1, openingOrientation: 180 },
      climateDataset,
      comfortSettings: comfortSettings || { minComfortTemp: 18, maxComfortTemp: 24 }
    });

    res.json(comparison);
  } catch (err) {
    console.error('[Compare Shapes Error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/simulation/run — Legacy direct simulation endpoint (Backward Compatibility)
router.post('/run', async (req, res) => {
  try {
    const { name, shelter, climateDataset, comfortSettings } = req.body;
    if (!shelter || !climateDataset) {
      return res.status(400).json({ error: 'Shelter design and Climate dataset are required.' });
    }

    const confSettings = comfortSettings || { minComfortTemp: 18, maxComfortTemp: 24 };

    const simulationResult = runThermalSimulation({
      shelter,
      climateDataset,
      comfortSettings: confSettings
    });

    const simName = name || `Simulation - ${shelter.name || 'Shelter'} (${new Date().toLocaleDateString()})`;

    const simPayload = {
      name: simName,
      shelter,
      climateDataset,
      comfortSettings: confSettings,
      results: simulationResult,
      status: 'Completed',
      assumptions: simulationResult.assumptions,
      warnings: simulationResult.warnings,
      createdAt: new Date().toISOString()
    };

    if (checkIsFallback()) {
      const record = { ...simPayload, _id: `sim_${Date.now()}` };
      memoryStore.simulations.push(record);
      return res.status(201).json(record);
    }

    const simDoc = new Simulation(simPayload);
    await simDoc.save();
    res.status(201).json(simDoc);
  } catch (err) {
    console.error('[Simulation Error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/simulation/user/history
router.get('/user/history', async (req, res) => {
  try {
    if (checkIsFallback()) return res.json(memoryStore.simulations);
    const sims = await Simulation.find().sort({ createdAt: -1 });
    res.json(sims.length > 0 ? sims : memoryStore.simulations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/simulation/:id
router.get('/:id', async (req, res) => {
  try {
    if (checkIsFallback()) {
      const sim = memoryStore.simulations.find(s => s._id === req.params.id);
      if (!sim) return res.status(404).json({ error: 'Simulation not found.' });
      return res.json(sim);
    }
    const sim = await Simulation.findById(req.params.id);
    if (!sim) return res.status(404).json({ error: 'Simulation not found.' });
    res.json(sim);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
