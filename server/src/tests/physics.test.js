/**
 * Automated Test Suite for Custom Node.js Thermal Physics Engine
 */

const { calculateThermalResistance, calculateConductionLoss } = require('../physics/conduction');
const { getExternalConvectionCoefficient } = require('../physics/convection');
const { calculateLongwaveRadiationLoss } = require('../physics/radiation');
const { calculateSolarGain } = require('../physics/solar');
const { runThermalSimulation } = require('../physics/simulationEngine');

console.log('====================================================');
console.log('RUNNING DRDO THERMAL PHYSICS ENGINE VERIFICATION TESTS');
console.log('====================================================\n');

let passes = 0;
let fails = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passes++;
  } else {
    console.error(`[FAIL] ${testName}`);
    fails++;
  }
}

// 1. Test Conduction Resistance (1D Composite Wall)
// Layer 1: Brick 0.25m, k=0.8 W/mK -> R1 = 0.3125
// Layer 2: PUF Insulation 0.10m, k=0.035 W/mK -> R2 = 2.857
// hInt = 3.0 (R_int = 0.333), hExt = 15.0 (R_ext = 0.0667)
// Expected R_total = 0.3125 + 2.8571 + 0.3333 + 0.0667 = 3.5696 m²K/W
const layers = [
  { thickness: 0.25, thermalConductivity: 0.8 },
  { thickness: 0.10, thermalConductivity: 0.035 }
];
const Rtotal = calculateThermalResistance(layers, 3.0, 15.0);
assert(Math.abs(Rtotal - 3.57) < 0.05, `Conduction R_total calculation (Expected ~3.57, Got ${Rtotal.toFixed(3)})`);

// 2. Test Conduction Loss Q
// Tin = 20°C, Tout = -15°C -> DeltaT = 35 K. Area = 10 m².
// Q = 35 / 3.5696 * 10 = 98.04 W
const qCond = calculateConductionLoss(20, -15, 10, Rtotal);
assert(Math.abs(qCond - 98.04) < 2.0, `Conduction Heat Loss Q (Expected ~98.0W, Got ${qCond.toFixed(1)}W)`);

// 3. Test Wind Convection Coefficient
const hExt = getExternalConvectionCoefficient(5.0); // 5 m/s wind -> 10 + 4.1*5 = 30.5
assert(Math.abs(hExt - 30.5) < 0.1, `External Convection Coefficient hExt (Expected 30.5, Got ${hExt})`);

// 4. Test Radiation Loss (Swinbank model)
const qRad = calculateLongwaveRadiationLoss(15, -10, 20, 0.9);
assert(qRad > 0 && !isNaN(qRad), `Longwave Sky Radiation Loss (Got ${qRad.toFixed(1)}W)`);

// 5. Test Solar Gain
const solar = calculateSolarGain({
  globalSolarRadiation: 600,
  hour: 12,
  latitude: 34.15, // Leh
  shelterOrientation: 180, // South
  windowArea: 2.5,
  shgc: 0.7
});
assert(solar.totalSolarGain > 0, `Midday Solar Passive Gain Calculation (Got ${solar.totalSolarGain.toFixed(1)}W)`);

// 6. Test Full 24-Hour Simulation Engine Run
const dummyShelter = {
  name: 'Test High Altitude Shelter',
  geometry: { length: 6.0, width: 4.0, height: 2.8, wallThickness: 0.25, roofThickness: 0.20, floorThickness: 0.15 },
  design: { shape: 'Rectangular', orientation: 180, roofType: 'Gable', roofAngle: 25 },
  openings: { windowCount: 2, windowArea: 2.5, doorCount: 1, doorArea: 1.8, openingOrientation: 180 },
  materials: {
    wallMaterial: { name: 'Rammed Earth', thermalConductivity: 0.8, density: 1800, specificHeat: 900, solarAbsorptivity: 0.7 },
    roofMaterial: { name: 'Metal Roof + Insulation', thermalConductivity: 0.4, density: 1200, specificHeat: 900, solarAbsorptivity: 0.7 },
    floorMaterial: { name: 'Insulated Concrete', thermalConductivity: 1.2, density: 2200, specificHeat: 1000, solarAbsorptivity: 0.6 },
    insulationMaterial: { name: 'PUF Insulation', thermalConductivity: 0.035, density: 40, specificHeat: 1400, solarAbsorptivity: 0.5 },
    windowMaterial: { name: 'Double Low-E Glazing', thermalConductivity: 1.4, density: 2500, specificHeat: 840, solarAbsorptivity: 0.7 },
    doorMaterial: { name: 'Insulated Solid Timber', thermalConductivity: 0.15, density: 600, specificHeat: 1600, solarAbsorptivity: 0.6 }
  }
};

const dummyClimate = {
  latitude: 34.15,
  dataPoints: Array.from({ length: 24 }, (_, i) => ({
    timestamp: `2026-01-15T${String(i).padStart(2, '0')}:00:00Z`,
    ambientTemperature: -15 + 10 * Math.sin(((i - 6) / 24) * 2 * Math.PI), // -25°C to -5°C range
    solarRadiation: i >= 7 && i <= 17 ? Math.sin(((i - 7) / 10) * Math.PI) * 750 : 0, // Peak 750 W/m²
    windSpeed: 3.5,
    humidity: 45
  }))
};

const simResult = runThermalSimulation({ shelter: dummyShelter, climateDataset: dummyClimate });
assert(simResult.timeSeries.length === 24, `24-Hour Simulation Time-Series Length (${simResult.timeSeries.length})`);
assert(simResult.metrics.avgIndoorTemp > -15, `Thermal Insulation Effect (Avg Indoor Temp ${simResult.metrics.avgIndoorTemp}°C > Ambient)`);
assert(!isNaN(simResult.metrics.comfortPercentage), `Comfort Percentage (${simResult.metrics.comfortPercentage}%)`);

console.log('\n====================================================');
console.log(`TEST RESULTS: ${passes} PASSED, ${fails} FAILED`);
console.log('====================================================');

if (fails > 0) process.exit(1);
