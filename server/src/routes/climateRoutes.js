const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const axios = require('axios');

const ClimateDataset = require('../models/ClimateDataset');
const { fetchOpenMeteoClimate } = require('../services/openMeteoService');
const { parseClimateCSV } = require('../services/csvParser');
const { checkIsFallback } = require('../config/db');
const memoryStore = require('../config/inMemoryStore');

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

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
    const { latitude, longitude, days, cityName } = req.body;
    const dataset = await fetchOpenMeteoClimate(latitude, longitude, days || 7, cityName);

    if (checkIsFallback()) {
      const existing = memoryStore.climateDatasets.find(d =>
        d.sourceType === 'Open-Meteo API' &&
        Math.abs(d.latitude - latitude) < 0.01 &&
        Math.abs(d.longitude - longitude) < 0.01
      );
      if (existing) {
        Object.assign(existing, dataset, { _id: existing._id });
        return res.json(existing);
      }
      const record = { ...dataset, _id: `climate_om_${Date.now()}` };
      memoryStore.climateDatasets.push(record);
      return res.status(201).json(record);
    }

    const existing = await ClimateDataset.findOne({
      sourceType: 'Open-Meteo API',
      latitude: { $gte: latitude - 0.01, $lte: latitude + 0.01 },
      longitude: { $gte: longitude - 0.01, $lte: longitude + 0.01 }
    });

    if (existing) {
      existing.name = dataset.name;
      existing.location = dataset.location;
      existing.elevation = dataset.elevation;
      existing.timePeriod = dataset.timePeriod;
      existing.dataPoints = dataset.dataPoints;
      await existing.save();
      return res.json(existing);
    }

    const climateDoc = new ClimateDataset(dataset);
    await climateDoc.save();
    res.status(201).json(climateDoc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/climate/csv (CSV Upload via multipart/form-data)
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
      const existing = memoryStore.climateDatasets.find(d =>
        d.sourceType === 'CSV Upload' &&
        d.name === name &&
        Math.abs(d.latitude - parseFloat(req.body.latitude || 34.15)) < 0.01 &&
        Math.abs(d.longitude - parseFloat(req.body.longitude || 77.58)) < 0.01
      );
      if (existing) {
        Object.assign(existing, datasetObj, { _id: existing._id });
        return res.status(201).json({ dataset: existing, warnings });
      }
      const record = { ...datasetObj, _id: `climate_csv_${Date.now()}` };
      memoryStore.climateDatasets.push(record);
      return res.status(201).json({ dataset: record, warnings });
    }

    const existing = await ClimateDataset.findOne({
      sourceType: 'CSV Upload',
      name: name,
      latitude: { $gte: parseFloat(req.body.latitude || 34.15) - 0.01, $lte: parseFloat(req.body.latitude || 34.15) + 0.01 },
      longitude: { $gte: parseFloat(req.body.longitude || 77.58) - 0.01, $lte: parseFloat(req.body.longitude || 77.58) + 0.01 }
    });

    if (existing) {
      existing.location = datasetObj.location;
      existing.elevation = datasetObj.elevation;
      existing.timePeriod = datasetObj.timePeriod;
      existing.dataPoints = datasetObj.dataPoints;
      await existing.save();
      return res.status(201).json({ dataset: existing, warnings });
    }

    const climateDoc = new ClimateDataset(datasetObj);
    await climateDoc.save();
    res.status(201).json({ dataset: climateDoc, warnings });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/climate/csv-text (CSV data pasted as JSON text)
router.post('/csv-text', async (req, res) => {
  try {
    const { csvText, name, location, latitude, longitude, elevation } = req.body;
    if (!csvText || typeof csvText !== 'string') {
      return res.status(400).json({ error: 'csvText field is required.' });
    }

    const { dataPoints, warnings } = parseClimateCSV(csvText);

    const datasetObj = {
      name: name || `Pasted CSV (${new Date().toLocaleDateString()})`,
      location: location || 'Custom Location',
      latitude: parseFloat(latitude || 34.15),
      longitude: parseFloat(longitude || 77.58),
      elevation: parseFloat(elevation || 3500),
      sourceType: 'CSV Upload',
      timePeriod: `${dataPoints.length} Hours`,
      dataPoints
    };

    if (checkIsFallback()) {
      const existing = memoryStore.climateDatasets.find(d =>
        d.sourceType === 'CSV Upload' &&
        d.name === (name || `Pasted CSV (${new Date().toLocaleDateString()})`) &&
        Math.abs(d.latitude - parseFloat(latitude || 34.15)) < 0.01 &&
        Math.abs(d.longitude - parseFloat(longitude || 77.58)) < 0.01
      );
      if (existing) {
        Object.assign(existing, datasetObj, { _id: existing._id });
        return res.status(201).json({ dataset: existing, warnings });
      }
      const record = { ...datasetObj, _id: `climate_csv_txt_${Date.now()}` };
      memoryStore.climateDatasets.push(record);
      return res.status(201).json({ dataset: record, warnings });
    }

    const existing = await ClimateDataset.findOne({
      sourceType: 'CSV Upload',
      name: name || `Pasted CSV (${new Date().toLocaleDateString()})`,
      latitude: { $gte: parseFloat(latitude || 34.15) - 0.01, $lte: parseFloat(latitude || 34.15) + 0.01 },
      longitude: { $gte: parseFloat(longitude || 77.58) - 0.01, $lte: parseFloat(longitude || 77.58) + 0.01 }
    });

    if (existing) {
      existing.location = datasetObj.location;
      existing.elevation = datasetObj.elevation;
      existing.timePeriod = datasetObj.timePeriod;
      existing.dataPoints = datasetObj.dataPoints;
      await existing.save();
      return res.status(201).json({ dataset: existing, warnings });
    }

    const climateDoc = new ClimateDataset(datasetObj);
    await climateDoc.save();
    res.status(201).json({ dataset: climateDoc, warnings });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/climate/geocode - Search places by name (Nominatim)
router.get('/geocode', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Query parameter "q" (min 2 chars) is required.' });
    }

    const response = await axios.get(`${NOMINATIM_BASE}/search`, {
      params: {
        q,
        format: 'json',
        limit,
        addressdetails: 1,
        'accept-language': 'en'
      },
      headers: { 'User-Agent': 'ShelterIQ/1.0 (DRDO Thermal Simulation)' },
      timeout: 8000
    });

    const results = response.data.map(item => ({
      placeId: item.place_id,
      displayName: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      type: item.type,
      class: item.class,
      importance: item.importance,
      address: item.address,
      boundingBox: item.boundingbox ? item.boundingbox.map(parseFloat) : null
    }));

    res.json(results);
  } catch (err) {
    console.error('[Geocode Error]:', err.message);
    res.status(500).json({ error: 'Failed to search locations. Please try again.' });
  }
});

// GET /api/climate/reverse-geocode - Get place name from lat/lng (Nominatim)
router.get('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'Valid lat/lon parameters required.' });
    }

    const response = await axios.get(`${NOMINATIM_BASE}/reverse`, {
      params: {
        lat: latitude,
        lon: longitude,
        format: 'json',
        addressdetails: 1,
        'accept-language': 'en'
      },
      headers: { 'User-Agent': 'ShelterIQ/1.0 (DRDO Thermal Simulation)' },
      timeout: 8000
    });

    const data = response.data;
    res.json({
      placeId: data.place_id,
      displayName: data.display_name,
      latitude,
      longitude,
      type: data.type,
      class: data.class,
      address: data.address
    });
  } catch (err) {
    console.error('[Reverse Geocode Error]:', err.message);
    res.status(500).json({ error: 'Failed to get location name. Please try again.' });
  }
});

module.exports = router;
