/**
 * High-Performance In-Memory Data Store Fallback
 * Used when local MongoDB service is offline
 */

const { seedMaterials, seedLehClimate, seedValidationCases } = require('../scripts/seedData');

class InMemoryStore {
  constructor() {
    this.users = [];
    this.materials = seedMaterials.map((m, idx) => ({ ...m, _id: `mat_${idx + 1}` }));
    this.climateDatasets = [{ ...seedLehClimate, _id: 'climate_leh_1' }];
    this.shelters = [
      {
        _id: 'shelter_default_1',
        name: 'DRDO High-Altitude Passive Shelter Alpha',
        geometry: { length: 6.0, width: 4.0, height: 2.8, wallThickness: 0.30, roofThickness: 0.20, floorThickness: 0.15 },
        design: { shape: 'Rectangular', orientation: 180, roofType: 'Gable', roofAngle: 25 },
        openings: { windowCount: 2, windowArea: 2.5, doorCount: 1, doorArea: 1.8, openingOrientation: 180 },
        materials: {
          wallMaterial: this.materials[0], // Rammed Earth
          roofMaterial: this.materials[8], // Galvanized + Insulation Roof
          floorMaterial: this.materials[7], // Insulated Concrete
          insulationMaterial: this.materials[1], // PUF Insulation
          windowMaterial: this.materials[5], // Double Low-E
          doorMaterial: this.materials[6]  // Timber Door
        },
        createdAt: new Date().toISOString()
      }
    ];
    this.simulations = [];
    this.optimizationRuns = [];
    this.validationCases = seedValidationCases.map((vc, idx) => ({ ...vc, _id: `val_${idx + 1}` }));
    this.reports = [];
  }
}

const memoryStore = new InMemoryStore();
module.exports = memoryStore;
