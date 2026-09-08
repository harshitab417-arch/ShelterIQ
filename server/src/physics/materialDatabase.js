/**
 * Internal Material Database — Passive Shelter Thermal Platform
 *
 * This module provides the authoritative material property library
 * used exclusively by the automatic material evaluator.
 * Users do NOT select materials — the physics engine picks the best combo.
 */

const WALL_MATERIALS = [
  {
    id: 'wall_rammed_earth',
    name: 'Rammed Earth (Local Ladakh Soil)',
    category: 'Wall',
    thermalConductivity: 0.85, // W/(m·K)
    density: 1900,             // kg/m³
    specificHeat: 880,         // J/(kg·K)
    emissivity: 0.90,
    solarAbsorptivity: 0.72,
    thicknessDefault: 0.30,    // m
    notes: 'Traditional high thermal mass wall. Excellent heat storage for cold nights.'
  },
  {
    id: 'wall_himalayan_stone',
    name: 'Himalayan Stone Masonry',
    category: 'Wall',
    thermalConductivity: 1.80,
    density: 2400,
    specificHeat: 900,
    emissivity: 0.92,
    solarAbsorptivity: 0.65,
    thicknessDefault: 0.35,
    notes: 'Heavy structural stone — very high thermal mass, slow heat transfer.'
  },
  {
    id: 'wall_straw_clay',
    name: 'Straw-Clay Composite',
    category: 'Wall',
    thermalConductivity: 0.22,
    density: 650,
    specificHeat: 1200,
    emissivity: 0.88,
    solarAbsorptivity: 0.70,
    thicknessDefault: 0.25,
    notes: 'Eco-friendly bio-based insulating wall — low conductivity.'
  },
  {
    id: 'wall_aac_block',
    name: 'Autoclaved Aerated Concrete (AAC) Block',
    category: 'Wall',
    thermalConductivity: 0.20,
    density: 550,
    specificHeat: 1000,
    emissivity: 0.88,
    solarAbsorptivity: 0.60,
    thicknessDefault: 0.20,
    notes: 'Lightweight cellular concrete — good insulating properties.'
  }
];

const INSULATION_MATERIALS = [
  {
    id: 'ins_puf',
    name: 'Polyurethane Foam (PUF) Insulation',
    category: 'Insulation',
    thermalConductivity: 0.024,
    density: 40,
    specificHeat: 1400,
    emissivity: 0.80,
    solarAbsorptivity: 0.40,
    thicknessDefault: 0.10,
    notes: 'High-performance rigid thermal insulation — best R-value per mm.'
  },
  {
    id: 'ins_eps',
    name: 'Expanded Polystyrene (EPS)',
    category: 'Insulation',
    thermalConductivity: 0.035,
    density: 30,
    specificHeat: 1300,
    emissivity: 0.85,
    solarAbsorptivity: 0.45,
    thicknessDefault: 0.12,
    notes: 'Lightweight low-conductivity insulation board.'
  },
  {
    id: 'ins_mineral_wool',
    name: 'Mineral Wool (Rock Wool)',
    category: 'Insulation',
    thermalConductivity: 0.038,
    density: 100,
    specificHeat: 1030,
    emissivity: 0.90,
    solarAbsorptivity: 0.50,
    thicknessDefault: 0.10,
    notes: 'Fire-resistant mineral fiber insulation batt.'
  }
];

const ROOF_MATERIALS = [
  {
    id: 'roof_gi_insulated',
    name: 'Galvanized Iron Sheet + Insulation Roof',
    category: 'Roof',
    thermalConductivity: 0.35,
    density: 1200,
    specificHeat: 900,
    emissivity: 0.85,
    solarAbsorptivity: 0.75,
    thicknessDefault: 0.20,
    notes: 'Pitched metallic roofing with underside thermal insulation layer.'
  },
  {
    id: 'roof_rcc_insulated',
    name: 'RCC Flat Roof + PUF Board',
    category: 'Roof',
    thermalConductivity: 0.28,
    density: 1400,
    specificHeat: 920,
    emissivity: 0.88,
    solarAbsorptivity: 0.70,
    thicknessDefault: 0.22,
    notes: 'Reinforced concrete flat roof with top-mounted PUF insulation board.'
  },
  {
    id: 'roof_sandwich_panel',
    name: 'Insulated Sandwich Panel Roof',
    category: 'Roof',
    thermalConductivity: 0.22,
    density: 900,
    specificHeat: 950,
    emissivity: 0.85,
    solarAbsorptivity: 0.65,
    thicknessDefault: 0.18,
    notes: 'Factory-assembled metal-foam-metal sandwich panel — lowest U-value roof.'
  }
];

const WINDOW_MATERIALS = [
  {
    id: 'win_double_lowe',
    name: 'Double Low-E Argon Glazing',
    category: 'Window',
    thermalConductivity: 1.20,
    density: 2500,
    specificHeat: 840,
    emissivity: 0.84,
    solarAbsorptivity: 0.75, // High SHGC — captures maximum solar gain
    thicknessDefault: 0.024,
    notes: 'High solar gain double glazing with low-emissivity coating. Best for cold climates.'
  },
  {
    id: 'win_triple_glaze',
    name: 'Triple Glazing Unit',
    category: 'Window',
    thermalConductivity: 0.90,
    density: 2500,
    specificHeat: 840,
    emissivity: 0.80,
    solarAbsorptivity: 0.60,
    thicknessDefault: 0.036,
    notes: 'Three-pane glass unit — very low conductance, moderate solar gain.'
  }
];

// Fixed defaults for floor and door (not varied in auto-evaluation)
const FLOOR_MATERIAL_DEFAULT = {
  id: 'floor_insulated_concrete',
  name: 'Insulated Concrete Floor Slab',
  category: 'Floor',
  thermalConductivity: 1.10,
  density: 2200,
  specificHeat: 950,
  emissivity: 0.90,
  solarAbsorptivity: 0.65,
  thicknessDefault: 0.15,
  notes: 'Concrete floor slab with underfloor insulation.'
};

const DOOR_MATERIAL_DEFAULT = {
  id: 'door_timber_insulated',
  name: 'Insulated Solid Timber Door',
  category: 'Door',
  thermalConductivity: 0.13,
  density: 600,
  specificHeat: 1600,
  emissivity: 0.90,
  solarAbsorptivity: 0.60,
  thicknessDefault: 0.05,
  notes: 'Hardwood insulated entrance door — standard for high-altitude shelters.'
};

module.exports = {
  WALL_MATERIALS,
  INSULATION_MATERIALS,
  ROOF_MATERIALS,
  WINDOW_MATERIALS,
  FLOOR_MATERIAL_DEFAULT,
  DOOR_MATERIAL_DEFAULT
};
