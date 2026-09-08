const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const materialRoutes = require('./routes/materialRoutes');
const shelterRoutes = require('./routes/shelterRoutes');
const climateRoutes = require('./routes/climateRoutes');
const simulationRoutes = require('./routes/simulationRoutes');
const optimizationRoutes = require('./routes/optimizationRoutes');
const validationRoutes = require('./routes/validationRoutes');
const aiRoutes = require('./routes/aiRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads folder for generated PDF reports
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mounting API Routes
app.use('/api/auth', authRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/shelters', shelterRoutes);
app.use('/api/climate', climateRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/optimization', optimizationRoutes);
app.use('/api/validation', validationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', system: 'DRDO Thermal Physics Engine API Online', timestamp: new Date() });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('[Centralized Error Handler]:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    path: req.originalUrl
  });
});

module.exports = app;
