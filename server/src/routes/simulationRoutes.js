const express = require('express');
const router = express.Router();
const Simulation = require('../models/Simulation');
const { runThermalSimulation } = require('../physics/simulationEngine');
const { checkIsFallback } = require('../config/db');
const memoryStore = require('../config/inMemoryStore');

// POST /api/simulation/run
router.post('/run', async (req, res) => {
  try {
    const { name, shelter, climateDataset, comfortSettings } = req.body;
    if (!shelter || !climateDataset) {
      return res.status(400).json({ error: 'Shelter design and Climate dataset are required.' });
    }

    const confSettings = comfortSettings || { minComfortTemp: 18, maxComfortTemp: 24 };

    // EXECUTE CUSTOM NODE.JS THERMAL PHYSICS ENGINE
    const simulationResult = runThermalSimulation({
      shelter,
      climateDataset,
      comfortSettings: confSettings
    });

    const simName = name || `Simulation - ${shelter.name} (${new Date().toLocaleDateString()})`;

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
