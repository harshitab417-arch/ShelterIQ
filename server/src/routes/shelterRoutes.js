const express = require('express');
const router = express.Router();
const Shelter = require('../models/Shelter');
const { checkIsFallback } = require('../config/db');
const memoryStore = require('../config/inMemoryStore');

// GET /api/shelters
router.get('/', async (req, res) => {
  try {
    if (checkIsFallback()) return res.json(memoryStore.shelters);
    const shelters = await Shelter.find();
    res.json(shelters.length > 0 ? shelters : memoryStore.shelters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/shelters/:id
router.get('/:id', async (req, res) => {
  try {
    if (checkIsFallback()) {
      const shelter = memoryStore.shelters.find(s => s._id === req.params.id);
      if (!shelter) return res.status(404).json({ error: 'Shelter design not found.' });
      return res.json(shelter);
    }
    const shelter = await Shelter.findById(req.params.id);
    if (!shelter) return res.status(404).json({ error: 'Shelter design not found.' });
    res.json(shelter);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/shelters
router.post('/', async (req, res) => {
  try {
    const { name, geometry, design, openings, materials } = req.body;
    if (!name || !geometry || !materials) {
      return res.status(400).json({ error: 'Name, geometry and materials are required.' });
    }

    if (checkIsFallback()) {
      const newShelter = {
        _id: `shelter_${Date.now()}`,
        name,
        geometry,
        design: design || { shape: 'Rectangular', orientation: 180, roofType: 'Gable', roofAngle: 25 },
        openings: openings || { windowCount: 2, windowArea: 2.5, doorCount: 1, doorArea: 1.8, openingOrientation: 180 },
        materials,
        createdAt: new Date().toISOString()
      };
      memoryStore.shelters.push(newShelter);
      return res.status(201).json(newShelter);
    }

    const shelter = new Shelter({ name, geometry, design, openings, materials });
    await shelter.save();
    res.status(201).json(shelter);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
