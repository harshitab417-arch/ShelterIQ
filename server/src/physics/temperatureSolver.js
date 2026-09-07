/**
 * Physics Engine - Single-Zone Numerical Temperature Solver
 * Explicit sub-stepped numerical integration (Runge-Kutta / Euler)
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
  const capInfo = calculateThermalCapacitance({
    length: shelter.geometry.length,
    width: shelter.geometry.width,
    height: shelter.geometry.height,
    wallThickness: shelter.geometry.wallThickness,
    roofThickness: shelter.geometry.roofThickness,
    wallMaterial: shelter.materials.wallMaterial,
    roofMaterial: shelter.materials.roofMaterial
  });

  const Cth = capInfo.totalCapacitance; // J/K
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

    const dTdt = lastBalance.netHeatWatts / Cth; // K/s
    Tin += dTdt * dt;
  }

  // Prevent physical unreality (indoor temp bounded reasonably)
  Tin = Math.max(-40, Math.min(60, Tin));

  return {
    NextTin: Tin,
    heatBalance: lastBalance,
    thermalCapacitanceJPerK: Cth
  };
}

module.exports = {
  stepIndoorTemperature
};
