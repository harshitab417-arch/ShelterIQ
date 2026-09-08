const mongoose = require('mongoose');

const validationCaseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  referenceSource: { type: String, required: true }, // e.g., 'Analytical Transient Solution', 'DRDO High-Altitude Hut Field Data'
  dataType: { type: String, enum: ['Analytical', 'Reference Standard', 'Field Measurement'], default: 'Analytical' },
  dataPoints: [{
    timestamp: String,
    ambientTemp: Number,
    expectedTemp: Number,
    predictedTemp: Number,
    absoluteError: Number,
    percentageError: Number
  }],
  metrics: {
    mae: Number,       // Mean Absolute Error (°C)
    rmse: Number,      // Root Mean Square Error (°C)
    maxError: Number,  // Max Error (°C)
    meanPercentageError: Number // %
  },
  assumptions: [String],
  limitations: [String],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ValidationCase', validationCaseSchema);
