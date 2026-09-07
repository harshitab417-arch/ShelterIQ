/**
 * Physics Engine - 1D Multi-Layer Thermal Conduction Module
 * Single-Zone Lumped Model
 */

/**
 * Calculate total thermal resistance R_total (m²·K/W) for multi-layer assembly
 * @param {Array<{thickness: number, thermalConductivity: number}>} layers 
 * @param {number} hInt Internal surface film coefficient W/(m²·K)
 * @param {number} hExt External surface film coefficient W/(m²·K)
 */
function calculateThermalResistance(layers, hInt = 3.0, hExt = 15.0) {
  let rSolid = 0;
  for (const layer of layers) {
    if (layer.thermalConductivity > 0 && layer.thickness > 0) {
      rSolid += layer.thickness / layer.thermalConductivity;
    }
  }
  const rFilmInt = 1 / hInt;
  const rFilmExt = 1 / hExt;
  return rSolid + rFilmInt + rFilmExt; // m²·K/W
}

/**
 * Calculate heat conduction loss Q (Watts) across a surface area A (m²)
 * Q = (Tin - Tout) / R_total * A
 */
function calculateConductionLoss(Tin, Tout, Area, Rtotal) {
  if (Rtotal <= 0 || Area <= 0) return 0;
  return ((Tin - Tout) / Rtotal) * Area;
}

module.exports = {
  calculateThermalResistance,
  calculateConductionLoss
};
