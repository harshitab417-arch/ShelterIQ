/**
 * Physics Engine - Thermal Mass & Lumped Capacitance Storage Module
 */

const { calculateGeometry } = require('./shapeCalculator');

/**
 * Calculate total lumped thermal capacity C_thermal (Joules / Kelvin)
 * C_thermal = m_air * cp_air + sum(m_envelope * cp_envelope * f_participation)
 */
function calculateThermalCapacitance({
  length = 6.0,
  width = 4.0,
  height = 2.8,
  shape = 'rectangle',
  calculatedGeometry = null,
  wallThickness = 0.25,
  roofThickness = 0.20,
  wallMaterial = { density: 1800, specificHeat: 900 },
  roofMaterial = { density: 1200, specificHeat: 900 },
  altitudeMeters = 3500 // Leh altitude default
}) {
  const geom = calculatedGeometry || calculateGeometry(shape, { length, width, height });
  const volume = geom.volume || (length * width * height);

  // Air density decreases with high altitude: rho_air = 1.225 * exp(-alt / 8400)
  const rhoAir = 1.225 * Math.exp(-altitudeMeters / 8400); // ~0.80 kg/m³ at 3500m
  const cpAir = 1005; // J/(kg·K)
  const mAir = volume * rhoAir;
  const cAir = mAir * cpAir; // J/K for indoor air volume

  // Wall / vertical envelope mass
  const wallArea = (geom.opaqueWallArea || 0) + (geom.shape === 'dome' ? (geom.curvedEnvelopeArea || 0) : 0);
  const wallDensity = wallMaterial.density || 1800;
  const wallCp = wallMaterial.specificHeat || 900;
  const wallMass = wallArea * (wallThickness || 0.25) * wallDensity;

  // Roof / overhead envelope mass
  const roofArea = (geom.roofArea || 0) + (geom.shape === 'quonset' ? (geom.curvedEnvelopeArea || 0) : 0);
  const roofDensity = roofMaterial.density || 1200;
  const roofCp = roofMaterial.specificHeat || 900;
  const roofMass = roofArea * (roofThickness || 0.20) * roofDensity;

  // Participation factor for internal lumped thermal mass transient response (typically 0.20 to 0.35)
  const fParticipation = 0.25;
  const cEnvelope = (wallMass * wallCp + roofMass * roofCp) * fParticipation;

  const totalCapacitance = cAir + cEnvelope; // Total Joules per Kelvin

  return {
    totalCapacitance,
    cAir,
    cEnvelope,
    airMassKg: mAir,
    envelopeMassKg: wallMass + roofMass,
    volume
  };
}

module.exports = {
  calculateThermalCapacitance
};
