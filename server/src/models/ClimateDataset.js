const mongoose = require('mongoose');

const dataPointSchema = new mongoose.Schema({
  timestamp: { type: String, required: true },
  ambientTemperature: { type: Number, required: true }, // °C
  solarRadiation: { type: Number, required: true },     // W/m²
  windSpeed: { type: Number, required: true },          // m/s
  humidity: { type: Number, required: true }            // %
}, { _id: false });

const climateDatasetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  elevation: { type: Number, default: 3500 }, // meters (high altitude default e.g. Leh)
  sourceType: { type: String, enum: ['Open-Meteo API', 'CSV Upload', 'Reference Dataset'], default: 'Reference Dataset' },
  timePeriod: { type: String, default: '24 Hours' },
  dataPoints: [dataPointSchema],
  isDefault: { type: Boolean, default: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ClimateDataset', climateDatasetSchema);
