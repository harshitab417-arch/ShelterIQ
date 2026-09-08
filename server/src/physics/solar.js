/**
 * Physics Engine - Solar Irradiance & Passive Gain Calculation Module
 */

/**
 * Calculate directional solar irradiance factor on wall/roof orientation
 * @param {number} surfaceOrientation Orientation angle in degrees (0=N, 90=E, 180=S, 270=W)
 * @param {number} hour Hour of day (0 - 23)
 * @param {number} latitude Latitude in degrees (e.g. 34.15 for Leh/Ladakh)
 */
function getOrientationSolarFactor(surfaceOrientation, hour, latitude = 34.15) {
  const solarNoonHour = 12.0;
  const hourAngle = (hour - solarNoonHour) * 15.0; // 15 degrees per hour
  
  // Solar elevation approximation for high altitude winter
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
 * Q_solar = Direct Glazing Solar Gain + Opaque Envelope Sol-Air Conduction
 *
 * Direct Glazing: Q_win = A_win * SHGC * I_direct
 * Opaque Sol-Air Conduction: Q_opaque = A * U * (alpha * I_surf / h_ext)
 */
function calculateSolarGain({
  globalSolarRadiation = 0, // W/m²
  hour = 12,
  latitude = 34.15,
  shelterOrientation = 180, // South
  windowArea = 2.5,
  openingOrientation = 180,
  shgc = 0.70, // Solar Heat Gain Coefficient for double glazing
  wallArea = 40.0,
  wallAbsorptivity = 0.72,
  roofArea = 24.0,
  roofAbsorptivity = 0.75,
  roofAngle = 25,
  uWall = 0.35, // W/(m²·K)
  uRoof = 0.30, // W/(m²·K)
  hExt = 15.0   // W/(m²·K)
}) {
  if (globalSolarRadiation <= 0) {
    return { totalSolarGain: 0, windowGain: 0, opaqueGain: 0 };
  }

  // 1. Window Solar Gain (Direct + Diffuse radiation through glazing)
  const windowSolarFactor = getOrientationSolarFactor(openingOrientation, hour, latitude);
  // Direct radiation factor + diffuse fraction (~20% diffuse radiation)
  const effectiveWindowRadiation = globalSolarRadiation * (0.80 * windowSolarFactor + 0.20);
  const windowGain = Math.max(0, windowArea * shgc * effectiveWindowRadiation);

  // 2. Opaque Roof Solar Gain via Sol-Air Conduction:
  // Sol-air temperature elevation deltaT_solair = (alpha * I_roof) / h_ext
  // Q_roof_solar = A_roof * U_roof * deltaT_solair
  const roofSolarFactor = Math.max(0.4, Math.cos((roofAngle * Math.PI) / 180));
  const roofIncidentRadiation = globalSolarRadiation * roofSolarFactor;
  const solAirDeltaTRoof = (roofAbsorptivity * roofIncidentRadiation) / Math.max(5.0, hExt);
  const roofGain = Math.max(0, roofArea * uRoof * solAirDeltaTRoof);

  // 3. Opaque Wall Solar Gain via Sol-Air Conduction:
  const southWallFactor = getOrientationSolarFactor(shelterOrientation, hour, latitude);
  const wallIncidentRadiation = globalSolarRadiation * (0.80 * southWallFactor + 0.20 * 0.5);
  const solAirDeltaTWall = (wallAbsorptivity * wallIncidentRadiation) / Math.max(5.0, hExt);
  const opaqueWallGain = Math.max(0, wallArea * uWall * solAirDeltaTWall);

  const opaqueGain = roofGain + opaqueWallGain;
  const totalSolarGain = windowGain + opaqueGain;

  return {
    totalSolarGain,
    windowGain,
    opaqueGain
  };
}

module.exports = {
  getOrientationSolarFactor,
  calculateSolarGain
};
