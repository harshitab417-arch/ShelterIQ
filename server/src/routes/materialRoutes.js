const express = require('express');
const router = express.Router();
const Material = require('../models/Material');
const { checkIsFallback } = require('../config/db');
const memoryStore = require('../config/inMemoryStore');

// GET /api/materials
router.get('/', async (req, res) => {
  try {
    if (checkIsFallback()) {
      return res.json(memoryStore.materials);
    }
    const materials = await Material.find();
    if (materials.length === 0) {
      return res.json(memoryStore.materials);
    }
    res.json(materials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/materials
router.post('/', async (req, res) => {
  try {
    const { name, category, thermalConductivity, density, specificHeat, emissivity, solarAbsorptivity, notes } = req.body;
    if (!name || !category || !thermalConductivity || !density || !specificHeat) {
      return res.status(400).json({ error: 'Missing required material property fields.' });
    }

    if (checkIsFallback()) {
      const newMat = {
        _id: `mat_custom_${Date.now()}`,
        name,
        category,
        thermalConductivity: Number(thermalConductivity),
        density: Number(density),
        specificHeat: Number(specificHeat),
        emissivity: Number(emissivity || 0.9),
        solarAbsorptivity: Number(solarAbsorptivity || 0.7),
        notes: notes || '',
        isCustom: true,
        createdAt: new Date().toISOString()
      };
      memoryStore.materials.push(newMat);
      return res.status(201).json(newMat);
    }

    const material = new Material({
      name,
      category,
      thermalConductivity: Number(thermalConductivity),
      density: Number(density),
      specificHeat: Number(specificHeat),
      emissivity: Number(emissivity || 0.9),
      solarAbsorptivity: Number(solarAbsorptivity || 0.7),
      notes,
      isCustom: true
    });
    await material.save();
    res.status(201).json(material);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/materials/:id
router.put('/:id', async (req, res) => {
  try {
    if (checkIsFallback()) {
      const idx = memoryStore.materials.findIndex(m => m._id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Material not found.' });
      memoryStore.materials[idx] = { ...memoryStore.materials[idx], ...req.body };
      return res.json(memoryStore.materials[idx]);
    }
    const material = await Material.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(material);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/materials/:id
router.delete('/:id', async (req, res) => {
  try {
    if (checkIsFallback()) {
      memoryStore.materials = memoryStore.materials.filter(m => m._id !== req.params.id);
      return res.json({ message: 'Material deleted.' });
    }
    await Material.findByIdAndDelete(req.params.id);
    res.json({ message: 'Material deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
