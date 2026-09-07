const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const ClimateDataset = require('../models/ClimateDataset');
const { fetchOpenMeteoClimate } = require('../services/openMeteoService');
const { parseClimateCSV } = require('../services/csvParser');
const { checkIsFallback } = require('../config/db');
const memoryStore = require('../config/inMemoryStore');

// GET /api/climate
router.get('/', async (req, res) => {
  try {
    if (checkIsFallback()) return res.json(memoryStore.climateDatasets);
    const datasets = await ClimateDataset.find();
    res.json(datasets.length > 0 ? datasets : memoryStore.climateDatasets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/climate/import (Open-Meteo API query)
router.post('/import', async (req, res) => {
  try {
    const { latitude, longitude, days } = req.body;
    const dataset = await fetchOpenMeteoClimate(latitude, longitude, days || 7);

    if (checkIsFallback()) {
      const record = { ...dataset, _id: `climate_om_${Date.now()}` };
      memoryStore.climateDatasets.push(record);
      return res.status(201).json(record);
    }

    const climateDoc = new ClimateDataset(dataset);
    await climateDoc.save();
    res.status(201).json(climateDoc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/climate/csv (CSV Upload)
router.post('/csv', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No CSV file uploaded.' });

    const csvText = req.file.buffer.toString('utf-8');
    const { dataPoints, warnings } = parseClimateCSV(csvText);

    const name = req.body.name || `Uploaded CSV (${new Date().toLocaleDateString()})`;
    const location = req.body.location || 'Custom Location';

    const datasetObj = {
      name,
      location,
      latitude: parseFloat(req.body.latitude || 34.15),
      longitude: parseFloat(req.body.longitude || 77.58),
      elevation: parseFloat(req.body.elevation || 3500),
      sourceType: 'CSV Upload',
      timePeriod: `${dataPoints.length} Hours`,
      dataPoints
    };

    if (checkIsFallback()) {
      const record = { ...datasetObj, _id: `climate_csv_${Date.now()}` };
      memoryStore.climateDatasets.push(record);
      return res.status(201).json({ dataset: record, warnings });
    }

    const climateDoc = new ClimateDataset(datasetObj);
    await climateDoc.save();
    res.status(201).json({ dataset: climateDoc, warnings });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
