const mongoose = require('mongoose');

const simulationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  shelter: { type: mongoose.Schema.Types.Mixed, required: true },
  climateDataset: { type: mongoose.Schema.Types.Mixed, required: true },
  comfortSettings: {
    minComfortTemp: { type: Number, default: 18 }, // °C
    maxComfortTemp: { type: Number, default: 24 }  // °C
  },
  results: {
    timeSeries: [{
      timestamp: String,
      ambientTemperature: Number,
      indoorTemperature: Number,
      solarGain: Number,
      conductionLoss: Number,
      convectionLoss: Number,
      radiationLoss: Number,
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
      comfortPercentage: Number   // %
    },
    componentBreakdown: {
      wallConduction: Number,
      roofConduction: Number,
      floorConduction: Number,
      windowConduction: Number,
      doorConduction: Number,
      externalConvection: Number,
      skyRadiation: Number
    }
  },
  status: { type: String, enum: ['Completed', 'Failed', 'Processing'], default: 'Completed' },
  assumptions: [String],
  warnings: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Simulation', simulationSchema);
