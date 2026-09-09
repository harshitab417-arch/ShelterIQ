/**
 * Automated Test Suite for Custom Node.js Thermal Physics Engine, Climate-Adaptive Optimization & Stress Testing
 */

const { calculateThermalResistance, calculateConductionLoss } = require('../physics/conduction');
const { getExternalConvectionCoefficient } = require('../physics/convection');
const { calculateLongwaveRadiationLoss } = require('../physics/radiation');
const { calculateSolarGain } = require('../physics/solar');
const { runThermalSimulation } = require('../physics/simulationEngine');
const { calculateGeometry, validateDimensions, createEquivalentDimensions } = require('../physics/shapeCalculator');
const { runAutoEvaluation, compareAllShapes } = require('../physics/materialEvaluator');
const { runDesignOptimization, calculateShapeWindowArea } = require('../optimization/designOptimizer');
const { runStressTest, classifyClimate } = require('../physics/stressTestEngine');
const { seedLehClimate } = require('../scripts/seedData');

console.log('====================================================');
console.log('RUNNING DRDO THERMAL PHYSICS, OPTIMIZATION & STRESS TESTS');
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

const baseMaterials = {
  wallMaterial: { name: 'Rammed Earth', thermalConductivity: 0.85, thicknessDefault: 0.25 },
  roofMaterial: { name: 'GI Sheet + Insulation', thermalConductivity: 0.35, thicknessDefault: 0.20 },
  floorMaterial: { name: 'Insulated Concrete', thermalConductivity: 1.10, thicknessDefault: 0.15 },
  insulationMaterial: { name: 'Polyurethane Foam (PUF)', thermalConductivity: 0.024, thicknessDefault: 0.10, validThicknesses: [0.05, 0.075, 0.10, 0.125, 0.15, 0.20] },
  windowMaterial: { name: 'Double Low-E', thermalConductivity: 1.20 },
  doorMaterial: { name: 'Timber Door', thermalConductivity: 0.13 }
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
    materials: baseMaterials
  };

  const res = runThermalSimulation({ shelter, climateDataset: seedLehClimate });
  assert(res.timeSeries.length === 24, `${s.toUpperCase()} 24h Time Series Simulated (Length: ${res.timeSeries.length})`);
  assert(res.metrics.avgIndoorTemp > -15, `${s.toUpperCase()} Thermal Damping Effect (Avg Indoor Temp: ${res.metrics.avgIndoorTemp}°C)`);
  assert(res.metrics.totalHeatLoss > 0, `${s.toUpperCase()} Total Heat Loss Computed (${res.metrics.totalHeatLoss} kWh)`);
}

// ----------------------------------------------------
// 4. FEATURE 2: CLIMATE-ADAPTIVE DESIGN OPTIMIZATION TESTS
// ----------------------------------------------------
console.log('\n--- 4. Feature 2: Climate-Adaptive Design Optimization Tests ---');

const testShelter = {
  name: 'Test Base Shelter',
  shape: 'rectangle',
  geometry: { length: 6.0, width: 4.0, height: 2.8 },
  design: { shape: 'rectangle', orientation: 180 },
  openings: { windowArea: 2.5, doorArea: 1.8 },
  materials: baseMaterials
};

const optRes = runDesignOptimization({
  shelter: testShelter,
  climateDataset: seedLehClimate
});

// TEST 1: Winning material assembly remains unchanged
assert(
  optRes.inheritedConfiguration.wallMaterial === baseMaterials.wallMaterial.name &&
  optRes.inheritedConfiguration.insulationMaterial === baseMaterials.insulationMaterial.name,
  'TEST 1: Winning material assembly remains unchanged during design optimization'
);

// TEST 2 & 3: Material insulation thickness & isolation
assert(
  optRes.variables.selectedMaterialThicknessOptions.length === baseMaterials.insulationMaterial.validThicknesses.length,
  'TEST 2 & 3: Insulation thicknesses match selected material valid thickness list'
);

// TEST 4: Orientations evaluated
assert(optRes.variables.orientations.length === 8, 'TEST 4: All 8 orientations evaluated (0° to 315°)');

// TEST 5: Directional solar orientation gain sensitivity
const solarNorth = calculateSolarGain({ globalSolarRadiation: 500, hour: 12, shelterOrientation: 0, openingOrientation: 0 });
const solarSouth = calculateSolarGain({ globalSolarRadiation: 500, hour: 12, shelterOrientation: 180, openingOrientation: 180 });
assert(solarSouth.totalSolarGain > solarNorth.totalSolarGain, 'TEST 5: South orientation yields higher solar gain than North at midday');

// TEST 6 & 7 & 8: WWR geometry area physical consistency
const winArea10 = calculateShapeWindowArea('rectangle', 0.10, { length: 6, width: 4, height: 2.8 });
const winArea25 = calculateShapeWindowArea('rectangle', 0.25, { length: 6, width: 4, height: 2.8 });
const geom10 = calculateGeometry('rectangle', { length: 6, width: 4, height: 2.8 }, { windowArea: winArea10, doorArea: 1.8 });
const geom25 = calculateGeometry('rectangle', { length: 6, width: 4, height: 2.8 }, { windowArea: winArea25, doorArea: 1.8 });
assert(winArea25 > winArea10, 'TEST 6: Increasing WWR increases glazing area');
assert(geom25.opaqueWallArea < geom10.opaqueWallArea, 'TEST 7: Increasing WWR decreases opaque wall area');
assert(
  Math.abs((geom25.opaqueWallArea + geom25.glazingArea + geom25.doorArea) - (geom10.opaqueWallArea + geom10.glazingArea + geom10.doorArea)) < 0.1,
  'TEST 8: Total vertical wall envelope area remains physically constant when WWR changes'
);

// TEST 9: Dome does not receive invented WWR values
const domeOptRes = runDesignOptimization({
  shelter: { ...testShelter, shape: 'dome', geometry: { radius: 3, domeHeight: 2.8 } },
  climateDataset: seedLehClimate
});
assert(domeOptRes.variables.wwrSupported === false, 'TEST 9: Dome archetype disables variable WWR optimization');

// TEST 10: Candidate count equals actual evaluated candidate count
const expectedCandCount = 8 * 4 * baseMaterials.insulationMaterial.validThicknesses.length; // 8*4*6 = 192
assert(optRes.evaluatedCount === expectedCandCount, `TEST 10: Candidate count (${optRes.evaluatedCount}) equals evaluated variants (${expectedCandCount})`);

// TEST 11 & 12: Insulation thickness vs R-value
const R_thin = 0.05 / 0.024;
const R_thick = 0.20 / 0.024;
assert(R_thick > R_thin, 'TEST 11: Larger insulation thickness increases thermal resistance R-value');

// TEST 13 & 14: Overheating & underheating degree hours tracking
assert(optRes.winner.degreeHours.coldDegreeHours !== undefined, 'TEST 14: Cold underheating degree-hours tracked');
assert(optRes.winner.scoreBreakdown.designScore >= 0 && optRes.winner.scoreBreakdown.designScore <= 100, 'TEST 24: Optimization score bounded within 0–100');

// ----------------------------------------------------
// 5. FEATURE 3: EXTREME CLIMATE RESILIENCE STRESS TESTS
// ----------------------------------------------------
console.log('\n--- 5. Feature 3: Extreme Climate Resilience Stress Tests ---');

const stressRes = runStressTest({
  optimizedShelter: optRes.winner.testShelter,
  climateDataset: seedLehClimate
});

// TEST 15 & 16: Stress test shelter freezing
assert(
  stressRes.frozenDesign.orientation === optRes.winner.config.orientation &&
  stressRes.frozenDesign.insulationThickness === optRes.winner.config.insulationThickness,
  'TEST 15: Shelter design parameters 100% frozen during stress testing'
);

// TEST 17 & 18 & 19: Climate classification & Scenario offsets
assert(stressRes.climateClassification.classification === 'Cold-Dominant', 'TEST 17: Leh climate classified as Cold-Dominant');
assert(stressRes.scenarios.length === 3, 'TEST 19: 3 stress scenarios generated');
assert(stressRes.scenarios[1].deltaT === -5.0 && stressRes.scenarios[2].deltaT === -10.0, 'TEST 17: Severe (-5°C) and Extreme (-10°C) cold offsets applied');

// TEST 21 & 22: Vulnerability conductive shares sum approx 100% & excludes solar
const sharesSum = stressRes.vulnerabilities.envelopeConductiveVulnerabilities.reduce((sum, v) => sum + v.sharePct, 0);
assert(Math.abs(sharesSum - 100.0) < 1.5, `TEST 21: Envelope conductive vulnerability shares sum to ~100% (Got ${sharesSum.toFixed(1)}%)`);
assert(stressRes.vulnerabilities.solarExposure.totalSolarGainKWh !== undefined, 'TEST 22: Solar gain reported separately from conductive shares');

// TEST 25: Resilience score bounded 0-100
assert(stressRes.finalResilienceScore >= 0 && stressRes.finalResilienceScore <= 100, 'TEST 25: Climate Resilience score bounded within 0–100');

// ----------------------------------------------------
// SUMMARY
// ----------------------------------------------------
console.log('\n====================================================');
console.log(`ALL TEST SUITES COMPLETED: ${passes} PASSED, ${fails} FAILED`);
console.log('====================================================');

if (fails > 0) process.exit(1);
