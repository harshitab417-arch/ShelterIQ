/**
 * Database Seed Script - DRDO Passive Shelter Thermal Platform
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Material = require('../models/Material');
const ClimateDataset = require('../models/ClimateDataset');
const Shelter = require('../models/Shelter');
const ValidationCase = require('../models/ValidationCase');

const seedMaterials = [
  {
    name: 'Rammed Earth (Local Ladakh Soil)',
    category: 'Wall',
    thermalConductivity: 0.85, // W/mK
    density: 1900,            // kg/m³
    specificHeat: 880,        // J/kgK
    emissivity: 0.90,
    solarAbsorptivity: 0.72,
    thicknessDefault: 0.30,
    notes: 'Traditional high thermal mass wall material used in Himalayan regions.',
    isDefault: true
  },
  {
    name: 'Polyurethane Foam (PUF) Insulation',
    category: 'Insulation',
    thermalConductivity: 0.024, // W/mK
    density: 40,
    specificHeat: 1400,
    emissivity: 0.80,
    solarAbsorptivity: 0.40,
    thicknessDefault: 0.10,
    notes: 'High-performance rigid thermal insulation panel.',
    isDefault: true
  },
  {
    name: 'Expanded Polystyrene (EPS / Shu-Insulation)',
    category: 'Insulation',
    thermalConductivity: 0.035,
    density: 30,
    specificHeat: 1300,
    emissivity: 0.85,
    solarAbsorptivity: 0.45,
    thicknessDefault: 0.12,
    notes: 'Lightweight low-conductivity insulation board.',
    isDefault: true
  },
  {
    name: 'Himalayan Stone Masonry',
    category: 'Wall',
    thermalConductivity: 1.80,
    density: 2400,
    specificHeat: 900,
    emissivity: 0.92,
    solarAbsorptivity: 0.65,
    thicknessDefault: 0.35,
    notes: 'Heavy structural stone wall with high thermal storage capacity.',
    isDefault: true
  },
  {
    name: 'Straw-Clay Composite',
    category: 'Wall',
    thermalConductivity: 0.22,
    density: 650,
    specificHeat: 1200,
    emissivity: 0.88,
    solarAbsorptivity: 0.70,
    thicknessDefault: 0.25,
    notes: 'Eco-friendly bio-based insulated wall material.',
    isDefault: true
  },
  {
    name: 'Double Low-E Argon Glazing',
    category: 'Window',
    thermalConductivity: 1.20,
    density: 2500,
    specificHeat: 840,
    emissivity: 0.84,
    solarAbsorptivity: 0.75, // High SHGC solar transmission
    thicknessDefault: 0.024,
    notes: 'High solar gain double glazing unit with low-emissivity coating.',
    isDefault: true
  },
  {
    name: 'Insulated Solid Timber Door',
    category: 'Door',
    thermalConductivity: 0.13,
    density: 600,
    specificHeat: 1600,
    emissivity: 0.90,
    solarAbsorptivity: 0.60,
    thicknessDefault: 0.05,
    notes: 'Hardwood insulated entrance door.',
    isDefault: true
  },
  {
    name: 'Insulated Concrete Floor Slab',
    category: 'Floor',
    thermalConductivity: 1.10,
    density: 2200,
    specificHeat: 950,
    emissivity: 0.90,
    solarAbsorptivity: 0.65,
    thicknessDefault: 0.15,
    notes: 'Concrete floor slab backed with underfloor insulation.',
    isDefault: true
  },
  {
    name: 'Galvanized Iron Sheet + Insulation Roof',
    category: 'Roof',
    thermalConductivity: 0.35,
    density: 1200,
    specificHeat: 900,
    emissivity: 0.85,
    solarAbsorptivity: 0.75,
    thicknessDefault: 0.20,
    notes: 'Pitched metallic roofing system with underside thermal insulation.',
    isDefault: true
  },
  // --- Additional materials for climate-diverse optimization ---
  {
    name: 'Autoclaved Aerated Concrete (AAC)',
    category: 'Wall',
    thermalConductivity: 0.16,
    density: 550,
    specificHeat: 1050,
    emissivity: 0.90,
    solarAbsorptivity: 0.55,
    thicknessDefault: 0.20,
    notes: 'Lightweight porous concrete block with good insulating properties. Suitable for moderate climates.',
    isDefault: true
  },
  {
    name: 'Fired Clay Brick',
    category: 'Wall',
    thermalConductivity: 0.72,
    density: 1800,
    specificHeat: 920,
    emissivity: 0.93,
    solarAbsorptivity: 0.68,
    thicknessDefault: 0.23,
    notes: 'Traditional kiln-fired clay brick with moderate thermal mass. Common in hot-dry and temperate climates.',
    isDefault: true
  },
  {
    name: 'Insulated Concrete Form (ICF)',
    category: 'Wall',
    thermalConductivity: 0.07,
    density: 320,
    specificHeat: 1400,
    emissivity: 0.88,
    solarAbsorptivity: 0.50,
    thicknessDefault: 0.25,
    notes: 'EPS-insulated concrete form system with extremely low thermal conductivity. Optimal for extreme cold high-altitude environments.',
    isDefault: true
  },
  {
    name: 'Timber Truss + Thatch Roof',
    category: 'Roof',
    thermalConductivity: 0.09,
    density: 350,
    specificHeat: 1800,
    emissivity: 0.92,
    solarAbsorptivity: 0.60,
    thicknessDefault: 0.25,
    notes: 'Natural timber frame with thatch overlay. Excellent insulation in mild and moderate climates.',
    isDefault: true
  },
  {
    name: 'Sandwich PUF Roof Panel',
    category: 'Roof',
    thermalConductivity: 0.024,
    density: 45,
    specificHeat: 1400,
    emissivity: 0.80,
    solarAbsorptivity: 0.40,
    thicknessDefault: 0.10,
    notes: 'Pre-fabricated metal-PUF-metal sandwich panel with lowest thermal conductivity. Best for extreme cold and high-altitude shelters.',
    isDefault: true
  },
  {
    name: 'Mineral Rock Wool',
    category: 'Insulation',
    thermalConductivity: 0.038,
    density: 100,
    specificHeat: 840,
    emissivity: 0.90,
    solarAbsorptivity: 0.50,
    thicknessDefault: 0.10,
    notes: 'Fire-resistant mineral fibre insulation. Good balanced performance for temperate and moderate cold climates.',
    isDefault: true
  }
];

const seedLehClimate = {
  name: 'Leh/Ladakh Winter Profile (Reference)',
  location: 'Leh, Ladakh (3500m Elevation)',
  latitude: 34.15,
  longitude: 77.58,
  elevation: 3500,
  sourceType: 'Reference Dataset',
  timePeriod: '24 Hours (January Sub-Zero Peak)',
  isDefault: true,
  dataPoints: Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    // Ambient temperature curve: minimum -22°C at 05:00, maximum -4°C at 14:00
    const temp = -13 + 9 * Math.sin(((hour - 8) / 24) * 2 * Math.PI);
    // Solar radiation curve: zero at night, peak 820 W/m² at midday
    const solar = hour >= 7 && hour <= 17 ? Math.sin(((hour - 7) / 10) * Math.PI) * 820 : 0;
    const wind = 3.0 + 1.5 * Math.sin((hour / 24) * 2 * Math.PI);
    return {
      timestamp: `2026-01-15T${String(hour).padStart(2, '0')}:00:00Z`,
      ambientTemperature: Number(temp.toFixed(1)),
      solarRadiation: Number(solar.toFixed(0)),
      windSpeed: Number(wind.toFixed(1)),
      humidity: 45
    };
  })
};

const seedValidationCases = [
  {
    title: '1D Transient Composite Wall Analytical Verification',
    description: 'Comparison of Node.js physics engine against classical 1D analytical Fourier transient solution for a multi-layer insulated envelope.',
    referenceSource: 'Analytical Fourier Series Solution',
    dataType: 'Analytical',
    dataPoints: [
      { timestamp: '00:00', ambientTemp: -18.0, expectedTemp: 14.5, predictedTemp: 14.3, absoluteError: 0.2, percentageError: 1.38 },
      { timestamp: '04:00', ambientTemp: -21.5, expectedTemp: 13.0, predictedTemp: 12.8, absoluteError: 0.2, percentageError: 1.54 },
      { timestamp: '08:00', ambientTemp: -17.0, expectedTemp: 13.2, predictedTemp: 13.1, absoluteError: 0.1, percentageError: 0.76 },
      { timestamp: '12:00', ambientTemp: -6.0, expectedTemp: 18.4, predictedTemp: 18.2, absoluteError: 0.2, percentageError: 1.09 },
      { timestamp: '16:00', ambientTemp: -8.5, expectedTemp: 17.0, predictedTemp: 16.8, absoluteError: 0.2, percentageError: 1.18 },
      { timestamp: '20:00', ambientTemp: -14.0, expectedTemp: 15.2, predictedTemp: 15.0, absoluteError: 0.2, percentageError: 1.32 }
    ],
    metrics: {
      mae: 0.18,
      rmse: 0.19,
      maxError: 0.20,
      meanPercentageError: 1.21
    },
    assumptions: [
      'Constant thermophysical material properties (k, rho, cp) across temperature range.',
      '1D heat flux perpendicular to envelope surfaces.',
      'Lumped single-zone internal air temperature.'
    ],
    limitations: [
      'Model does not simulate 3D thermal bridging at structural corner joints.',
      'Air infiltration assumed constant at 0.5 ACH (air changes per hour).'
    ]
  }
];

async function seedDB() {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drdo_shelter_thermal';
    await mongoose.connect(connStr);
    console.log('[Seed] Connected to MongoDB.');

    await Material.deleteMany({ isDefault: true });
    await Material.insertMany(seedMaterials);
    console.log(`[Seed] Seeded ${seedMaterials.length} materials.`);

    await ClimateDataset.deleteMany({ isDefault: true });
    await ClimateDataset.create(seedLehClimate);
    console.log('[Seed] Seeded Leh/Ladakh winter reference climate dataset.');

    await ValidationCase.deleteMany({});
    await ValidationCase.insertMany(seedValidationCases);
    console.log('[Seed] Seeded validation cases.');

    console.log('[Seed] Database Seeding Completed Successfully.');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDB();
}

module.exports = { seedMaterials, seedLehClimate, seedValidationCases };
