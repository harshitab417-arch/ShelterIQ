/**
 * Physics Engine - Longwave Sky & Ambient Radiation Heat Transfer Module
 */

const STEFAN_BOLTZMANN = 5.670374e-8; // W/(m²·K⁴)

/**
 * Calculate effective sky temperature (Kelvin) from ambient temperature (°C)
 * Swinbank model: T_sky = 0.0552 * (T_amb_K)^1.5
 */
function calculateSkyTemperatureKelvin(TambientC) {
  const TambK = TambientC + 273.15;
  return 0.0552 * Math.pow(TambK, 1.5);
}

/**
 * Calculate longwave radiation heat loss Q_rad (Watts) to sky and surroundings
 * Q_rad = epsilon * sigma * A * (Tsurface_K^4 - Tsky_K^4)
 */
function calculateLongwaveRadiationLoss(TsurfaceC, TambientC, Area, emissivity = 0.9) {
  if (Area <= 0 || emissivity <= 0) return 0;
  const TsurfK = TsurfaceC + 273.15;
  const TskyK = calculateSkyTemperatureKelvin(TambientC);
  
  const qRad = emissivity * STEFAN_BOLTZMANN * Area * (Math.pow(TsurfK, 4) - Math.pow(TskyK, 4));
  return qRad;
}

module.exports = {
  STEFAN_BOLTZMANN,
  calculateSkyTemperatureKelvin,
  calculateLongwaveRadiationLoss
};
