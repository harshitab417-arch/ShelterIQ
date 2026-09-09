const mongoose = require('mongoose');

const simulationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  shape: { type: String, default: 'rectangle' },
  geometry: { type: mongoose.Schema.Types.Mixed, default: {} },
  dimensions: { type: mongoose.Schema.Types.Mixed, default: {} },
  shelter: { type: mongoose.Schema.Types.Mixed, required: true },
  climateDataset: { type: mongoose.Schema.Types.Mixed, required: true },
  comfortSettings: {
    minComfortTemp: { type: Number, default: 18 }, // °C
    maxComfortTemp: { type: Number, default: 24 }  // °C
  },
  recommendation: { type: mongoose.Schema.Types.Mixed, default: {} },
  topConfigurations: [{ type: mongoose.Schema.Types.Mixed }],
  totalCombinationsEvaluated: { type: Number, default: 0 },
  results: {
    timeSeries: [{
      timestamp: String,
      ambientTemperature: Number,
      indoorTemperature: Number,
      solarGain: Number,
      conductionLoss: Number,
      convectionLoss: Number,
      radiationLoss: Number,
      ventilationLoss: Number,
      totalHeatLoss: Number,
      netHeat: Number
    }],
    metrics: {
      avgIndoorTemp: Number,
      minIndoorTemp: Number,
      maxIndoorTemp: Number,
      totalSolarGain: Number,     // kWh
      totalHeatLoss: Number,      // kWh
      peakHeatLoss: Number,       // Watts
      comfortPercentage: Number,  // %
      heatingRequirement: Number  // kWh
    },
    componentBreakdown: {
      wallConduction: Number,
      roofConduction: Number,
      curvedEnvelopeConduction: Number,
      floorConduction: Number,
      windowConduction: Number,
      doorConduction: Number,
      ventilationLoss: Number,
      skyRadiation: Number
    }
  },
  userSelectedShape: { type: String, default: 'rectangle' },
  shapeOptimized: { type: Boolean, default: false },
  shapeOptimizationNote: { type: String, default: '' },
  allShapeScores: [{ type: mongoose.Schema.Types.Mixed }],
  status: { type: String, enum: ['Completed', 'Failed', 'Processing'], default: 'Completed' },
  assumptions: [String],
  warnings: [String],
  createdAt: { type: Date, default: Date.now }
}, {
  strict: false // Allow schema flexibility so no properties are stripped
});

module.exports = mongoose.model('Simulation', simulationSchema);
