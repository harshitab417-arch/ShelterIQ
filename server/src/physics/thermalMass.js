/**
 * Physics Engine - Thermal Mass & Lumped Capacitance Storage Module
 */

/**
 * Calculate total lumped thermal capacity C_thermal (Joules / Kelvin)
 * C_thermal = m_air * cp_air + sum(m_envelope * cp_envelope * f_participation)
 */
function calculateThermalCapacitance({
  length = 6.0,
  width = 4.0,
  height = 2.8,
  wallThickness = 0.25,
  roofThickness = 0.20,
  wallMaterial = { density: 1800, specificHeat: 900 },
  roofMaterial = { density: 1200, specificHeat: 900 },
  altitudeMeters = 3500 // Leh altitude default
}) {
  const volume = length * width * height;
  
  // Air density decreases with high altitude: rho_air = 1.225 * exp(-alt / 8400)
  const rhoAir = 1.225 * Math.exp(-altitudeMeters / 8400); // ~0.80 kg/m³ at 3500m
  const cpAir = 1005; // J/(kg·K)
  const mAir = volume * rhoAir;
  const cAir = mAir * cpAir; // J/K for indoor air volume

  // Wall mass calculation (outer perimeter * height * thickness)
  const perimeter = 2 * (length + width);
  const wallArea = perimeter * height;
  const wallVolume = wallArea * wallThickness;
  const wallDensity = wallMaterial.density || 1800;
  const wallCp = wallMaterial.specificHeat || 900;
  const wallMass = wallVolume * wallDensity;

  // Roof mass calculation
  const roofArea = length * width;
  const roofVolume = roofArea * roofThickness;
  const roofDensity = roofMaterial.density || 1200;
  const roofCp = roofMaterial.specificHeat || 900;
  const roofMass = roofVolume * roofDensity;

  // Participation factor for internal lumped thermal mass transient response (typically 0.20 to 0.35)
  const fParticipation = 0.25;

  const cEnvelope = (wallMass * wallCp + roofMass * roofCp) * fParticipation;

  const totalCapacitance = cAir + cEnvelope; // Total Joules per Kelvin

  return {
    totalCapacitance,
    cAir,
    cEnvelope,
    airMassKg: mAir,
    envelopeMassKg: wallMass + roofMass
  };
}

module.exports = {
  calculateThermalCapacitance
};
