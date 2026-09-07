/**
 * Physics Engine - Solar Irradiance & Passive Gain Calculation Module
 */

/**
 * Calculate directional solar irradiance factor on wall/roof orientation
 * @param {number} globalRadiation Global horizontal irradiance (W/m²)
 * @param {number} surfaceOrientation Orientation angle in degrees (0=N, 90=E, 180=S, 270=W)
 * @param {number} hour Hour of day (0 - 23)
 * @param {number} latitude Latitude in degrees (e.g. 34.15 for Leh/Ladakh)
 */
function getOrientationSolarFactor(surfaceOrientation, hour, latitude = 34.15) {
  // Approximate solar solar position for high altitude winter conditions (peak solar at midday facing South)
  const solarNoonHour = 12.0;
  const hourAngle = (hour - solarNoonHour) * 15.0; // 15 degrees per hour
  
  // Solar elevation approximation
  const declination = -20.0; // Winter declination (degrees)
  const latRad = (latitude * Math.PI) / 180;
  const decRad = (declination * Math.PI) / 180;
  const hrRad = (hourAngle * Math.PI) / 180;

  const sinElev = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(hrRad);
  const elevation = Math.asin(Math.max(-1, Math.min(1, sinElev)));
  
  if (elevation <= 0) return 0; // Sun below horizon

  // Solar azimuth approximation
  const cosAz = (Math.sin(decRad) * Math.cos(latRad) - Math.cos(decRad) * Math.sin(latRad) * Math.cos(hrRad)) / Math.cos(elevation);
  let solarAzimuth = (Math.acos(Math.max(-1, Math.min(1, cosAz))) * 180) / Math.PI;
  if (hourAngle > 0) solarAzimuth = 360 - solarAzimuth; // Afternoon

  // Incidence angle on surface
  const surfRad = (surfaceOrientation * Math.PI) / 180;
  const azRad = (solarAzimuth * Math.PI) / 180;
  const cosIncidence = Math.cos(elevation) * Math.cos(azRad - surfRad);

  return Math.max(0, cosIncidence);
}

/**
 * Calculate passive solar thermal heat gain Q_solar (Watts)
 * Q_solar = Glazing direct solar gain + Opaque envelope absorbed solar heat
 */
function calculateSolarGain({
  globalSolarRadiation, // W/m²
  hour,
  latitude = 34.15,
  shelterOrientation = 180, // South
  windowArea = 2.5,
  openingOrientation = 180,
  shgc = 0.70, // Solar Heat Gain Coefficient for double glazing
  wallArea = 40.0,
  wallAbsorptivity = 0.7,
  roofArea = 24.0,
  roofAbsorptivity = 0.7,
  roofAngle = 25
}) {
  if (globalSolarRadiation <= 0) return { totalSolarGain: 0, windowGain: 0, opaqueGain: 0 };

  // Window solar gain
  const windowSolarFactor = getOrientationSolarFactor(openingOrientation, hour, latitude);
  const windowDirectRadiation = globalSolarRadiation * windowSolarFactor;
  const windowGain = Math.max(0, windowArea * shgc * windowDirectRadiation);

  // Roof solar gain (Roof tilted towards South)
  const roofSolarFactor = Math.max(0.3, Math.cos((roofAngle * Math.PI) / 180));
  const roofGain = Math.max(0, roofArea * wallAbsorptivity * globalSolarRadiation * roofSolarFactor * 0.15); // Envelope conduction transfer fraction

  // Opaque Wall solar gain (South facing wall gets max solar absorption)
  const southWallFactor = getOrientationSolarFactor(shelterOrientation, hour, latitude);
  const opaqueWallGain = Math.max(0, wallArea * wallAbsorptivity * globalSolarRadiation * southWallFactor * 0.10);

  const totalSolarGain = windowGain + roofGain + opaqueWallGain;

  return {
    totalSolarGain,
    windowGain,
    opaqueGain: roofGain + opaqueWallGain
  };
}

module.exports = {
  getOrientationSolarFactor,
  calculateSolarGain
};
