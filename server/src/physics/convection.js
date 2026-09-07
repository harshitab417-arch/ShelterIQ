/**
 * Physics Engine - Convection Heat Transfer Module
 */

/**
 * Calculate external convection coefficient hExt (W/m²·K) based on wind speed (m/s)
 * Empirical relationship: h = 10.0 + 4.1 * v_wind (McAdams model for building exterior)
 */
function getExternalConvectionCoefficient(windSpeed = 2.0) {
  const v = Math.max(0, windSpeed);
  return 10.0 + 4.1 * v;
}

/**
 * Calculate internal natural convection coefficient hInt (W/m²·K)
 * Standard indoor calm air coefficient ~3.0 to 4.0 W/m²·K
 */
function getInternalConvectionCoefficient() {
  return 3.5;
}

/**
 * Calculate convective heat transfer rate Q_conv (Watts)
 * Q_conv = h * A * (Tsurface - Tair)
 */
function calculateConvectiveHeatTransfer(h, Area, Tsurface, Tair) {
  if (Area <= 0 || h <= 0) return 0;
  return h * Area * (Tsurface - Tair);
}

module.exports = {
  getExternalConvectionCoefficient,
  getInternalConvectionCoefficient,
  calculateConvectiveHeatTransfer
};
