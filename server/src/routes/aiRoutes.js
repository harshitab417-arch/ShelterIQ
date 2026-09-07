const express = require('express');
const router = express.Router();
const { generateAIExplanation } = require('../services/openaiService');

// POST /api/ai/explain
router.post('/explain', async (req, res) => {
  try {
    const { shelterName, climateLocation, metrics, componentBreakdown } = req.body;
    if (!metrics || !componentBreakdown) {
      return res.status(400).json({ error: 'Simulation metrics and component breakdown are required.' });
    }

    const aiRes = await generateAIExplanation({
      shelterName: shelterName || 'DRDO Passive Shelter',
      climateLocation: climateLocation || 'Ladakh Region',
      metrics,
      componentBreakdown
    });

    res.json(aiRes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
