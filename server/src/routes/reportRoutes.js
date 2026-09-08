const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { generateSimulationPDF } = require('../services/pdfGenerator');
const Report = require('../models/Report');
const { checkIsFallback } = require('../config/db');
const memoryStore = require('../config/inMemoryStore');

// POST /api/reports/generate
router.post('/generate', async (req, res) => {
  try {
    const { simulation } = req.body;
    if (!simulation || !simulation.results) {
      return res.status(400).json({ error: 'Valid simulation object is required.' });
    }

    const reportsDir = path.join(__dirname, '../../uploads/reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filename = `DRDO_Shelter_Report_${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, filename);

    await generateSimulationPDF(simulation, filePath);

    const title = `Thermal Design Report - ${simulation.shelter?.name || 'Shelter'}`;
    const reportPayload = {
      title,
      simulationId: simulation._id,
      filename,
      filePath: `/uploads/reports/${filename}`,
      viewUrl: `/uploads/reports/${filename}`,
      downloadUrl: `/api/reports/download/${filename}`,
      createdAt: new Date().toISOString()
    };

    if (checkIsFallback()) {
      const record = { ...reportPayload, _id: `rep_${Date.now()}` };
      memoryStore.reports.push(record);
      return res.json({ message: 'Report generated successfully.', report: record, downloadUrl: `/api/reports/download/${filename}`, viewUrl: `/uploads/reports/${filename}` });
    }

    const reportDoc = new Report(reportPayload);
    await reportDoc.save();
    res.json({ message: 'Report generated successfully.', report: reportDoc, downloadUrl: `/api/reports/download/${filename}`, viewUrl: `/uploads/reports/${filename}` });
  } catch (err) {
    console.error('[Report Error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/view/:filename (Inline viewing in browser tab)
router.get('/view/:filename', (req, res) => {
  try {
    const filePath = path.join(__dirname, '../../uploads/reports', req.params.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Report file not found.' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${req.params.filename}"`);
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/download/:filename
router.get('/download/:filename', (req, res) => {
  try {
    const filePath = path.join(__dirname, '../../uploads/reports', req.params.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Report file not found.' });
    }
    res.download(filePath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
