const express = require('express');
const router = express.Router();
const ValidationCase = require('../models/ValidationCase');
const { checkIsFallback } = require('../config/db');
const memoryStore = require('../config/inMemoryStore');

// GET /api/validation
router.get('/', async (req, res) => {
  try {
    if (checkIsFallback()) return res.json(memoryStore.validationCases);
    const cases = await ValidationCase.find();
    res.json(cases.length > 0 ? cases : memoryStore.validationCases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/validation (Submit reference/measured comparison validation)
router.post('/', async (req, res) => {
  try {
    const { title, description, referenceSource, dataType, dataPoints, assumptions, limitations } = req.body;

    if (!title || !referenceSource || !dataPoints || dataPoints.length === 0) {
      return res.status(400).json({ error: 'Title, reference source, and non-empty data points are required.' });
    }

    // Compute MAE, RMSE, Percentage Error
    let sumAbsError = 0;
    let sumSqError = 0;
    let maxError = 0;
    let sumPctError = 0;

    const processedDataPoints = dataPoints.map(dp => {
      const exp = Number(dp.expectedTemp);
      const pred = Number(dp.predictedTemp);
      const absErr = Math.abs(pred - exp);
      const pctErr = exp !== 0 ? (absErr / Math.abs(exp)) * 100 : 0;

      sumAbsError += absErr;
      sumSqError += absErr * absErr;
      if (absErr > maxError) maxError = absErr;
      sumPctError += pctErr;

      return {
        timestamp: dp.timestamp || 'N/A',
        ambientTemp: Number(dp.ambientTemp || 0),
        expectedTemp: exp,
        predictedTemp: pred,
        absoluteError: Number(absErr.toFixed(2)),
        percentageError: Number(pctErr.toFixed(2))
      };
    });

    const count = processedDataPoints.length;
    const mae = Number((sumAbsError / count).toFixed(2));
    const rmse = Number((Math.sqrt(sumSqError / count)).toFixed(2));
    const meanPercentageError = Number((sumPctError / count).toFixed(2));

    const valPayload = {
      title,
      description: description || '',
      referenceSource,
      dataType: dataType || 'Reference Standard',
      dataPoints: processedDataPoints,
      metrics: {
        mae,
        rmse,
        maxError: Number(maxError.toFixed(2)),
        meanPercentageError
      },
      assumptions: assumptions || ['1D multi-layer thermal conduction assumption.'],
      limitations: limitations || ['Air infiltration fixed at 0.5 ACH.'],
      createdAt: new Date().toISOString()
    };

    if (checkIsFallback()) {
      const record = { ...valPayload, _id: `val_${Date.now()}` };
      memoryStore.validationCases.push(record);
      return res.status(201).json(record);
    }

    const valDoc = new ValidationCase(valPayload);
    await valDoc.save();
    res.status(201).json(valDoc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
