const mongoose = require('mongoose');

const shelterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  geometry: {
    length: { type: Number, required: true, default: 6.0 }, // meters
    width: { type: Number, required: true, default: 4.0 },  // meters
    height: { type: Number, required: true, default: 2.8 }, // meters
    wallThickness: { type: Number, required: true, default: 0.25 }, // meters
    roofThickness: { type: Number, required: true, default: 0.20 }, // meters
    floorThickness: { type: Number, required: true, default: 0.15 }  // meters
  },
  design: {
    shape: { type: String, enum: ['Rectangular', 'L-Shape', 'Octagonal', 'Dome'], default: 'Rectangular' },
    orientation: { type: Number, default: 180 }, // degrees (180 = South facing main facade)
    roofType: { type: String, enum: ['Gable', 'Flat', 'Shed', 'Vaulted'], default: 'Gable' },
    roofAngle: { type: Number, default: 25 } // degrees
  },
  openings: {
    windowCount: { type: Number, default: 2 },
    windowArea: { type: Number, default: 2.5 }, // total area m²
    doorCount: { type: Number, default: 1 },
    doorArea: { type: Number, default: 1.8 }, // total area m²
    openingOrientation: { type: Number, default: 180 } // degrees (South)
  },
  materials: {
    wallMaterial: { type: mongoose.Schema.Types.Mixed, required: true },
    roofMaterial: { type: mongoose.Schema.Types.Mixed, required: true },
    floorMaterial: { type: mongoose.Schema.Types.Mixed, required: true },
    insulationMaterial: { type: mongoose.Schema.Types.Mixed, required: true },
    windowMaterial: { type: mongoose.Schema.Types.Mixed, required: true },
    doorMaterial: { type: mongoose.Schema.Types.Mixed, required: true }
  },
  internalGains: {
    occupantsCount: { type: Number, default: 4 }, // 4 personnel
    heatPerOccupant: { type: Number, default: 80 }, // Watts per person
    equipmentPower: { type: Number, default: 100 } // Watts constant equipment
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Shelter', shelterSchema);
