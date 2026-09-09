const express = require('express');
const router = express.Router();
const { runGridSearch } = require('../optimization/gridSearch');
const { runGeneticAlgorithm } = require('../optimization/geneticAlgorithm');
const { runDesignOptimization } = require('../optimization/designOptimizer');
const { runStressTest } = require('../physics/stressTestEngine');
const OptimizationRun = require('../models/OptimizationRun');
const Simulation = require('../models/Simulation');
const { checkIsFallback } = require('../config/db');
const memoryStore = require('../config/inMemoryStore');

// Helper to retrieve simulation by ID from Mongo or in-memory store
async function getSimulationById(id) {
  if (checkIsFallback()) {
    return memoryStore.simulations.find(s => s._id === id) || null;
  }
  return await Simulation.findById(id);
}

// Helper to update simulation document or memory store
// IMPORTANT: Mongoose documents require .set(key, val) + .markModified(key) for Mixed fields
// Object.assign() bypasses Mongoose's change tracking and does NOT persist new fields
async function updateSimulationDoc(simDoc, updateFields) {
  if (checkIsFallback()) {
    Object.assign(simDoc, updateFields);
    return simDoc;
  }
  // Use simDoc.set() to ensure Mongoose tracks the field assignment properly
  Object.entries(updateFields).forEach(([key, value]) => {
    simDoc.set(key, value);
    simDoc.markModified(key);
  });
  await simDoc.save();
  return simDoc;
}

// POST /api/optimization/climate-adaptive — FEATURE 2: Climate-Adaptive Design Optimization
router.post('/climate-adaptive', async (req, res) => {
  try {
    const { simulationId, shelter, climateDataset, comfortSettings, socketId } = req.body;

    let targetSimulation = null;
    if (simulationId) {
      targetSimulation = await getSimulationById(simulationId);
      if (!targetSimulation) {
        return res.status(404).json({ error: `Simulation with ID ${simulationId} not found.` });
      }
    }

    const activeShelter = shelter || targetSimulation?.shelter;
    const activeClimate = climateDataset || targetSimulation?.climateDataset;

    if (!activeShelter || !activeClimate) {
      return res.status(400).json({ error: 'Base shelter design and target climate dataset are required.' });
    }

    const io = req.app.get('io');
    const optResult = runDesignOptimization({
      baseSimulation: targetSimulation,
      shelter: activeShelter,
      climateDataset: activeClimate,
      comfortSettings: comfortSettings || targetSimulation?.comfortSettings || { minComfortTemp: 18, maxComfortTemp: 24 },
      io,
      socketId
    });

    if (targetSimulation) {
      await updateSimulationDoc(targetSimulation, {
        designOptimization: optResult
      });
    }

    res.json({
      simulationId: targetSimulation?._id,
      ...optResult
    });
  } catch (err) {
    console.error('[Design Optimization Error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/optimization/stress-test — FEATURE 3: Extreme Climate Resilience Test
router.post('/stress-test', async (req, res) => {
  try {
    const { simulationId, optimizedShelter, climateDataset, comfortSettings } = req.body;
    console.log('[stress-test] request received', { simulationId, hasOptimizedShelter: !!optimizedShelter });

    let targetSimulation = null;
    if (simulationId) {
      targetSimulation = await getSimulationById(simulationId);
      if (!targetSimulation) {
        return res.status(404).json({ error: `Simulation with ID ${simulationId} not found.` });
      }
      console.log('[stress-test] simulation found, has designOptimization:', !!targetSimulation.designOptimization);
    }

    // Require Feature 2 to have been completed before Feature 3
    if (!optimizedShelter && targetSimulation && !targetSimulation.designOptimization) {
      return res.status(400).json({ error: 'Climate resilience testing requires a completed optimized design. Please run Feature 2 (Climate-Adaptive Design Optimization) first.' });
    }

    // Build the optimized shelter to pass to the stress engine
    // Priority: explicitly provided > winner.testShelter (full mutated shelter) > reconstruct from winner config > original shelter
    let activeShelter = optimizedShelter;
    if (!activeShelter && targetSimulation?.designOptimization) {
      const winner = targetSimulation.designOptimization.winner;
      if (winner?.testShelter) {
        // Best path: use the fully-mutated shelter from Feature 2 winner
        activeShelter = winner.testShelter;
        console.log('[stress-test] using winner.testShelter, orientation:', activeShelter?.design?.orientation, 'insulationThickness:', activeShelter?.geometry?.insulationThickness);
      } else if (winner?.config && targetSimulation.shelter) {
        // Fallback: reconstruct from winner config + base shelter
        const baseShelter = targetSimulation.shelter;
        activeShelter = {
          ...baseShelter,
          design: {
            ...baseShelter.design,
            orientation: winner.config.orientation
          },
          openings: {
            ...baseShelter.openings,
            windowArea: winner.config.windowArea,
            openingOrientation: winner.config.orientation
          },
          insulationThickness: winner.config.insulationThickness,
          geometry: {
            ...baseShelter.geometry,
            insulationThickness: winner.config.insulationThickness
          }
        };
        console.log('[stress-test] reconstructed shelter from winner.config, orientation:', winner.config.orientation, 'insulationThickness:', winner.config.insulationThickness);
      } else {
        activeShelter = targetSimulation.shelter;
        console.log('[stress-test] falling back to base shelter');
      }
    } else if (!activeShelter) {
      activeShelter = targetSimulation?.shelter;
    }

    const activeClimate = climateDataset || targetSimulation?.climateDataset;

    if (!activeShelter || !activeClimate) {
      return res.status(400).json({ error: 'Optimized shelter design and climate dataset are required for stress testing.' });
    }

    const activeComfortSettings = comfortSettings || targetSimulation?.comfortSettings || { minComfortTemp: 18, maxComfortTemp: 24 };

    console.log('[stress-test] climate dataPoints count:', activeClimate?.dataPoints?.length || 0);
    console.log('[stress-test] running stress test for shelter shape:', activeShelter?.shape || activeShelter?.design?.shape || 'unknown');

    const stressResult = runStressTest({
      optimizedShelter: activeShelter,
      baseSimulation: targetSimulation,
      climateDataset: activeClimate,
      comfortSettings: activeComfortSettings
    });

    console.log('[stress-test] stress test completed, scenarios:', stressResult.scenarios?.length, 'finalScore:', stressResult.finalResilienceScore);

    if (targetSimulation) {
      await updateSimulationDoc(targetSimulation, {
        stressTest: stressResult
      });
      console.log('[stress-test] result persisted to simulation', simulationId);
    }

    res.json({
      simulationId: targetSimulation?._id,
      ...stressResult
    });
  } catch (err) {
    console.error('[Stress Test Error]:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/optimization/grid — Legacy Grid Search endpoint (Backward Compatibility)
router.post('/grid', async (req, res) => {
  try {
    const { baseShelter, climateDataset, materialsList, objectiveWeights, comfortSettings, socketId } = req.body;
    if (!baseShelter || !climateDataset) {
      return res.status(400).json({ error: 'Base shelter and climate dataset are required.' });
    }

    const io = req.app.get('io');
    const result = await runGridSearch({
      baseShelter,
      climateDataset,
      materialsList: materialsList || memoryStore.materials,
      objectiveWeights: objectiveWeights || { comfortWeight: 0.5, heatLossWeight: 0.3, solarGainWeight: 0.2 },
      comfortSettings: comfortSettings || { minComfortTemp: 18, maxComfortTemp: 24 },
      io,
      socketId
    });

    const optName = `Grid Search Optimization (${new Date().toLocaleTimeString()})`;
    const optPayload = {
      name: optName,
      method: 'Grid Search',
      objectiveWeights: objectiveWeights || { comfortWeight: 0.5, heatLossWeight: 0.3, solarGainWeight: 0.2 },
      status: 'Completed',
      evaluatedCount: result.totalEvaluated,
      topCandidates: result.topCandidates,
      bestCandidate: result.bestCandidate,
      createdAt: new Date().toISOString()
    };

    if (checkIsFallback()) {
      const record = { ...optPayload, _id: `opt_${Date.now()}` };
      memoryStore.optimizationRuns.push(record);
      return res.status(201).json(record);
    }

    const optDoc = new OptimizationRun(optPayload);
    await optDoc.save();
    res.status(201).json(optDoc);
  } catch (err) {
    console.error('[Optimization Error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/optimization/genetic — Legacy Genetic Algorithm endpoint (Backward Compatibility)
router.post('/genetic', async (req, res) => {
  try {
    const { baseShelter, climateDataset, materialsList, objectiveWeights, comfortSettings, popSize, generations, socketId } = req.body;
    if (!baseShelter || !climateDataset) {
      return res.status(400).json({ error: 'Base shelter and climate dataset are required.' });
    }

    const io = req.app.get('io');
    const result = await runGeneticAlgorithm({
      baseShelter,
      climateDataset,
      materialsList: materialsList || memoryStore.materials,
      objectiveWeights: objectiveWeights || { comfortWeight: 0.5, heatLossWeight: 0.3, solarGainWeight: 0.2 },
      comfortSettings: comfortSettings || { minComfortTemp: 18, maxComfortTemp: 24 },
      popSize: popSize || 16,
      generations: generations || 10,
      io,
      socketId
    });

    const optName = `Genetic Algorithm Optimization (${new Date().toLocaleTimeString()})`;
    const optPayload = {
      name: optName,
      method: 'Genetic Algorithm',
      objectiveWeights: objectiveWeights || { comfortWeight: 0.5, heatLossWeight: 0.3, solarGainWeight: 0.2 },
      status: 'Completed',
      evaluatedCount: result.totalEvaluated,
      topCandidates: result.topCandidates,
      bestCandidate: result.bestCandidate,
      createdAt: new Date().toISOString()
    };

    if (checkIsFallback()) {
      const record = { ...optPayload, _id: `opt_ga_${Date.now()}` };
      memoryStore.optimizationRuns.push(record);
      return res.status(201).json(record);
    }

    const optDoc = new OptimizationRun(optPayload);
    await optDoc.save();
    res.status(201).json(optDoc);
  } catch (err) {
    console.error('[GA Error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/optimization/:id
router.get('/:id', async (req, res) => {
  try {
    if (checkIsFallback()) {
      const opt = memoryStore.optimizationRuns.find(o => o._id === req.params.id);
      if (!opt) return res.status(404).json({ error: 'Optimization run not found.' });
      return res.json(opt);
    }
    const opt = await OptimizationRun.findById(req.params.id);
    res.json(opt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
