const express = require('express');
const router = express.Router();
const { runGridSearch } = require('../optimization/gridSearch');
const { runGeneticAlgorithm } = require('../optimization/geneticAlgorithm');
const OptimizationRun = require('../models/OptimizationRun');
const { checkIsFallback } = require('../config/db');
const memoryStore = require('../config/inMemoryStore');

// POST /api/optimization/grid
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

// POST /api/optimization/genetic
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
