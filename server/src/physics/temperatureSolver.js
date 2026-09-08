/**
 * Physics Engine - Single-Zone Numerical Temperature Solver
 * Explicit sub-stepped numerical integration with energy balance
 */

const { computeInstantaneousHeatBalance } = require('./heatBalance');
const { calculateThermalCapacitance } = require('./thermalMass');

/**
 * Solve single timestep (e.g., 1 hour = 3600s) temperature evolution
 */
function stepIndoorTemperature({
  Tcurrent,
  Tambient,
  globalSolarRadiation,
  windSpeed,
  hour,
  latitude = 34.15,
  shelter,
  timeStepSeconds = 3600,
  subSteps = 60 // 60 sub-steps per hour (dt = 60 seconds)
}) {
  const shape = (shelter.shape || shelter.design?.shape || 'rectangle').toLowerCase();
  
  const capInfo = calculateThermalCapacitance({
    length: shelter.geometry?.length,
    width: shelter.geometry?.width,
    height: shelter.geometry?.height,
    shape,
    calculatedGeometry: shelter.calculatedGeometry,
    wallThickness: shelter.geometry?.wallThickness || shelter.materials?.wallMaterial?.thicknessDefault || 0.25,
    roofThickness: shelter.geometry?.roofThickness || shelter.materials?.roofMaterial?.thicknessDefault || 0.20,
    wallMaterial: shelter.materials?.wallMaterial,
    roofMaterial: shelter.materials?.roofMaterial
  });

  // Effective thermal capacitance C_eff (J/K)
  const Cth = Math.max(5e5, capInfo.totalCapacitance);
  const dt = timeStepSeconds / subSteps; // seconds

  let Tin = Tcurrent;
  let lastBalance = null;

  for (let i = 0; i < subSteps; i++) {
    lastBalance = computeInstantaneousHeatBalance({
      Tin,
      Tambient,
      globalSolarRadiation,
      windSpeed,
      hour,
      latitude,
      shelter
    });

    const dTdt = lastBalance.netHeatWatts / Cth; // K/s (Watts / (J/K))
    Tin += dTdt * dt;
  }

  // Numerical validity assertion
  if (!Number.isFinite(Tin)) {
    throw new Error(`Thermal numerical solver produced non-finite indoor temperature (${Tin}) at hour ${hour}`);
  }

  return {
    NextTin: Tin,
    heatBalance: lastBalance,
    thermalCapacitanceJPerK: Cth
  };
}

module.exports = {
  stepIndoorTemperature
};
