const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Wall', 'Roof', 'Floor', 'Insulation', 'Window', 'Door', 'Thermal Mass'],
    required: true 
  },
  thermalConductivity: { type: Number, required: true }, // W/(m·K)
  density: { type: Number, required: true }, // kg/m³
  specificHeat: { type: Number, required: true }, // J/(kg·K)
  emissivity: { type: Number, required: true, default: 0.9 }, // 0 - 1
  solarAbsorptivity: { type: Number, required: true, default: 0.7 }, // 0 - 1
  thicknessDefault: { type: Number, default: 0.15 }, // meters
  validThicknesses: { type: [Number], default: undefined }, // Array of valid thicknesses in meters
  minThickness: { type: Number, default: undefined },
  maxThickness: { type: Number, default: undefined },
  thicknessStep: { type: Number, default: undefined },
  notes: { type: String, default: '' },
  isDefault: { type: Boolean, default: false },
  isCustom: { type: Boolean, default: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Material', materialSchema);
