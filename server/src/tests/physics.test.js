/**
 * Automated Test Suite for Custom Node.js Thermal Physics Engine & Shape Optimization
 */

const { calculateThermalResistance, calculateConductionLoss } = require('../physics/conduction');
const { getExternalConvectionCoefficient } = require('../physics/convection');
const { calculateLongwaveRadiationLoss } = require('../physics/radiation');
const { calculateSolarGain } = require('../physics/solar');
const { runThermalSimulation } = require('../physics/simulationEngine');
const { calculateGeometry, validateDimensions, createEquivalentDimensions } = require('../physics/shapeCalculator');
const { runAutoEvaluation, compareAllShapes } = require('../physics/materialEvaluator');
const { seedLehClimate } = require('../scripts/seedData');

console.log('====================================================');
console.log('RUNNING DRDO THERMAL PHYSICS & SHAPE OPTIMIZATION TESTS');
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

// ----------------------------------------------------
// 1. CONDUCTION & HEAT TRANSFER EQUATION TESTS
// ----------------------------------------------------
console.log('\n--- 1. Conduction & Heat Transfer Tests ---');
const layers = [
  { thickness: 0.25, thermalConductivity: 0.8 },
  { thickness: 0.10, thermalConductivity: 0.035 }
];
const Rtotal = calculateThermalResistance(layers, 3.0, 15.0);
assert(Math.abs(Rtotal - 3.57) < 0.05, `Conduction R_total calculation (Expected ~3.57, Got ${Rtotal.toFixed(3)})`);

const qCond = calculateConductionLoss(20, -15, 10, Rtotal);
assert(Math.abs(qCond - 98.04) < 2.0, `Conduction Heat Loss Q (Expected ~98.0W, Got ${qCond.toFixed(1)}W)`);

const hExt = getExternalConvectionCoefficient(5.0);
assert(Math.abs(hExt - 30.5) < 0.1, `External Convection Coefficient hExt (Expected 30.5, Got ${hExt})`);

const qRad = calculateLongwaveRadiationLoss(15, -10, 20, 0.9);
assert(qRad > 0 && !isNaN(qRad), `Longwave Sky Radiation Loss (Got ${qRad.toFixed(1)}W)`);

const solar = calculateSolarGain({
  globalSolarRadiation: 600,
  hour: 12,
  latitude: 34.15,
  shelterOrientation: 180,
  windowArea: 2.5,
  shgc: 0.7
});
assert(solar.totalSolarGain > 0, `Midday Solar Passive Gain (Got ${solar.totalSolarGain.toFixed(1)}W)`);

// ----------------------------------------------------
// 2. SHAPE CALCULATOR GEOMETRY TESTS
// ----------------------------------------------------
console.log('\n--- 2. Shape Calculator Geometry Tests ---');

// 2.1 Rectangle Geometry
const rectGeom = calculateGeometry('rectangle', { length: 6.0, width: 4.0, height: 2.8 });
assert(rectGeom.floorArea === 24.0, `Rectangle Floor Area = L*W = 24.0 m² (Got ${rectGeom.floorArea})`);
assert(rectGeom.volume > 67.2, `Rectangle Volume with Gable Roof > 67.2 m³ (Got ${rectGeom.volume})`);
assert(rectGeom.surfaceAreaToVolumeRatio > 0, `Rectangle A/V Ratio is positive (${rectGeom.surfaceAreaToVolumeRatio})`);

// 2.2 Dome (Spherical Cap) Geometry
const domeGeom = calculateGeometry('dome', { radius: 3.0, domeHeight: 2.8 });
const expectedDomeFloor = Number((Math.PI * 9).toFixed(2));
assert(Math.abs(domeGeom.floorArea - expectedDomeFloor) < 0.1, `Dome Floor Area = π*R² ≈ 28.27 m² (Got ${domeGeom.floorArea})`);
assert(domeGeom.curvedEnvelopeArea > 50, `Dome Curved Envelope Area > 50 m² (Got ${domeGeom.curvedEnvelopeArea})`);
assert(domeGeom.volume > 45, `Dome Spherical Cap Volume > 45 m³ (Got ${domeGeom.volume})`);

// 2.3 A-Frame (Triangular Prism) Geometry
const aframeGeom = calculateGeometry('a-frame', { length: 6.0, width: 5.0, ridgeHeight: 4.0 });
assert(aframeGeom.floorArea === 30.0, `A-Frame Floor Area = L*W = 30.0 m² (Got ${aframeGeom.floorArea})`);
assert(aframeGeom.volume === 60.0, `A-Frame Volume = 0.5*W*H*L = 60.0 m³ (Got ${aframeGeom.volume})`);
assert(aframeGeom.roofArea > 50, `A-Frame Sloping Roof Area > 50 m² (Got ${aframeGeom.roofArea})`);

// 2.4 Quonset (Semi-Cylindrical Arch) Geometry
const quonsetGeom = calculateGeometry('quonset', { length: 6.0, width: 4.0 });
assert(quonsetGeom.floorArea === 24.0, `Quonset Floor Area = L*W = 24.0 m² (Got ${quonsetGeom.floorArea})`);
const expectedQuonsetVol = Number((0.5 * Math.PI * 4 * 6).toFixed(2)); // 0.5*PI*R^2*L
assert(Math.abs(quonsetGeom.volume - expectedQuonsetVol) < 0.1, `Quonset Volume = 0.5*π*R²*L ≈ 37.70 m³ (Got ${quonsetGeom.volume})`);

// 2.5 Dimensional Validation
const valErrs = validateDimensions('dome', { radius: -2, domeHeight: 0 });
assert(valErrs.length > 0, `Validation correctly catches negative/zero dimensions (${valErrs.join('; ')})`);

// ----------------------------------------------------
// 3. MULTI-SHAPE THERMAL SIMULATION INTEGRATION
// ----------------------------------------------------
console.log('\n--- 3. Multi-Shape Thermal Simulation Runs ---');

const shapes = ['rectangle', 'dome', 'a-frame', 'quonset'];
const testDims = {
  rectangle: { length: 6, width: 4, height: 2.8 },
  dome: { radius: 3, domeHeight: 2.8 },
  'a-frame': { length: 6, width: 5, ridgeHeight: 3.8 },
  quonset: { length: 6, width: 4.5 }
};

for (const s of shapes) {
  const geom = calculateGeometry(s, testDims[s]);
  const shelter = {
    name: `Test ${s.toUpperCase()}`,
    shape: s,
    geometry: testDims[s],
    calculatedGeometry: geom,
    design: { shape: s, orientation: 180 },
    openings: { windowCount: 2, windowArea: 2.5, doorCount: 1, doorArea: 1.8, openingOrientation: 180 },
    materials: {
      wallMaterial: { name: 'Rammed Earth', thermalConductivity: 0.85, density: 1900, specificHeat: 880, solarAbsorptivity: 0.72 },
      roofMaterial: { name: 'GI Sheet + Insulation', thermalConductivity: 0.35, density: 1200, specificHeat: 900, solarAbsorptivity: 0.75 },
      floorMaterial: { name: 'Insulated Concrete', thermalConductivity: 1.10, density: 2200, specificHeat: 950, solarAbsorptivity: 0.65 },
      insulationMaterial: { name: 'PUF', thermalConductivity: 0.024, density: 40, specificHeat: 1400, solarAbsorptivity: 0.40 },
      windowMaterial: { name: 'Double Low-E', thermalConductivity: 1.20, density: 2500, specificHeat: 840, solarAbsorptivity: 0.75 },
      doorMaterial: { name: 'Timber Door', thermalConductivity: 0.13, density: 600, specificHeat: 1600, solarAbsorptivity: 0.60 }
    }
  };

  const res = runThermalSimulation({ shelter, climateDataset: seedLehClimate });
  assert(res.timeSeries.length === 24, `${s.toUpperCase()} 24h Time Series Simulated (Length: ${res.timeSeries.length})`);
  assert(res.metrics.avgIndoorTemp > -15, `${s.toUpperCase()} Thermal Damping Effect (Avg Indoor Temp: ${res.metrics.avgIndoorTemp}°C)`);
  assert(res.metrics.totalHeatLoss > 0, `${s.toUpperCase()} Total Heat Loss Computed (${res.metrics.totalHeatLoss} kWh)`);
}

// ----------------------------------------------------
// 4. AUTOMATIC MATERIAL EVALUATION & RANKING TESTS
// ----------------------------------------------------
console.log('\n--- 4. Auto Material Evaluation & Ranking Tests ---');

for (const s of shapes) {
  const evalRes = runAutoEvaluation({
    shape: s,
    dimensions: testDims[s],
    occupants: 4,
    climateDataset: seedLehClimate
  });

  assert(evalRes.totalCombinationsEvaluated > 0, `${s.toUpperCase()}: Evaluated ${evalRes.totalCombinationsEvaluated} material combinations`);
  assert(evalRes.top3.length === 3, `${s.toUpperCase()}: Top 3 rankings generated`);
  assert(evalRes.top3[0].score >= evalRes.top3[1].score, `${s.toUpperCase()}: Rank #1 score (${evalRes.top3[0].score}) >= Rank #2 score (${evalRes.top3[1].score})`);
  assert(evalRes.recommended.materials.wallMaterial !== undefined, `${s.toUpperCase()}: Recommended Wall Material (${evalRes.recommended.materials.wallMaterial})`);
  assert(evalRes.recommended.explanation.length > 50, `${s.toUpperCase()}: Deterministic physics explanation generated`);
}

// ----------------------------------------------------
// 5. FAIR MULTI-SHAPE COMPARISON TEST
// ----------------------------------------------------
console.log('\n--- 5. Fair Multi-Shape Comparison Test ---');
const compRes = compareAllShapes({
  targetFloorArea: 24.0,
  occupants: 4,
  climateDataset: seedLehClimate
});

assert(compRes.comparisonResults.length === 4, `All 4 shapes compared (Results count: ${compRes.comparisonResults.length})`);
assert(compRes.winner !== undefined, `Winning shape identified: ${compRes.winner.shapeTitle} (Score: ${compRes.winner.score})`);

// ----------------------------------------------------
// SUMMARY
// ----------------------------------------------------
console.log('\n====================================================');
console.log(`ALL TEST SUITES COMPLETED: ${passes} PASSED, ${fails} FAILED`);
console.log('====================================================');

if (fails > 0) process.exit(1);
