const mongoose = require('mongoose');

const optimizationRunSchema = new mongoose.Schema({
  name: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  method: { type: String, enum: ['Grid Search', 'Genetic Algorithm'], required: true },
  objectiveWeights: {
    comfortWeight: { type: Number, default: 0.5 },
    heatLossWeight: { type: Number, default: 0.3 },
    solarGainWeight: { type: Number, default: 0.2 }
  },
  parameters: { type: mongoose.Schema.Types.Mixed },
  status: { type: String, enum: ['Completed', 'Running', 'Failed'], default: 'Completed' },
  evaluatedCount: { type: Number, default: 0 },
  topCandidates: [{
    rank: Number,
    fitnessScore: Number,
    comfortPercentage: Number,
    avgIndoorTemp: Number,
    totalHeatLoss: Number,
    totalSolarGain: Number,
    shelterConfig: mongoose.Schema.Types.Mixed
  }],
  bestCandidate: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('OptimizationRun', optimizationRunSchema);
