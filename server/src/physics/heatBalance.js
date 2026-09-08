/**
 * Physics Engine - Overall Instantaneous Heat Balance Module
 */

const { calculateThermalResistance, calculateConductionLoss } = require('./conduction');
const { getExternalConvectionCoefficient, getInternalConvectionCoefficient } = require('./convection');
const { calculateLongwaveRadiationLoss } = require('./radiation');
const { calculateSolarGain } = require('./solar');

/**
 * Compute shape-dependent surface areas for the shelter envelope.
 * Supports: Rectangular (default), Dome, Octagonal, L-Shape
 */
function getShapeAreas(L, W, H, shape) {
  const shapeLower = (shape || 'Rectangular').toLowerCase();

  if (shapeLower === 'dome') {
    // Dome modelled as a hemisphere with equivalent floor area = L * W
    const floorArea = L * W;
    const radius = Math.sqrt(floorArea / Math.PI);
    const wallAreaTotal = 2 * Math.PI * radius * radius; // hemisphere curved surface = 2πr²
    const roofArea = floorArea; // dome roof projected area equals floor
    return { wallAreaTotal, roofArea, floorArea };
  }

  if (shapeLower === 'octagonal') {
    // Regular octagonal prism; side length derived from equivalent floor area ≈ L*W
    const floorArea = L * W;
    // Octagon area = 2(1+√2)s² → s = √(A / (2(1+√2)))
    const s = Math.sqrt(floorArea / (2 * (1 + Math.SQRT2)));
    const perimeter = 8 * s;
    const wallAreaTotal = perimeter * H;
    const roofArea = floorArea;
    return { wallAreaTotal, roofArea, floorArea };
  }

  if (shapeLower === 'l-shape') {
    // L-Shape: two joined rectangles sharing one wall
    // Main block: L × (W * 0.6), wing: (L * 0.5) × (W * 0.4)
    const mainL = L;
    const mainW = W * 0.6;
    const wingL = L * 0.5;
    const wingW = W * 0.4;
    const floorArea = mainL * mainW + wingL * wingW;
    const roofArea = floorArea;
    // Perimeter of L-shape (external perimeter only)
    const perimeter = 2 * mainL + mainW + (mainW - wingW) + wingL + wingW + (mainL - wingL) + 0; // simplified external
    const wallAreaTotal = (2 * (mainL + mainW) * H) + (2 * (wingL + wingW) * H) - (2 * wingW * H); // subtract shared wall
    return { wallAreaTotal, roofArea, floorArea };
  }

  // Default: Rectangular
  const wallAreaTotal = 2 * (L + W) * H;
  const roofArea = L * W;
  const floorArea = L * W;
  return { wallAreaTotal, roofArea, floorArea };
}

/**
 * Compute instantaneous heat balance for a given state timestep
 */
function computeInstantaneousHeatBalance({
  Tin,
  Tambient,
  globalSolarRadiation,
  windSpeed,
  hour,
  latitude = 34.15,
  shelter,
  internalGainsWatts = null
}) {
  const { geometry, design, openings, materials } = shelter;

  // Calculate dynamic internal heat gains from occupants if not explicitly overridden
  const occupantsCount = shelter.internalGains?.occupantsCount !== undefined ? shelter.internalGains.occupantsCount : 4;
  const heatPerOccupant = shelter.internalGains?.heatPerOccupant !== undefined ? shelter.internalGains.heatPerOccupant : 80;
  const equipmentPower = shelter.internalGains?.equipmentPower !== undefined ? shelter.internalGains.equipmentPower : 100;
  const calculatedInternalGains = occupantsCount * heatPerOccupant + equipmentPower;
  const effectiveInternalGains = internalGainsWatts !== null ? internalGainsWatts : calculatedInternalGains;

  // Extract dimensions
  const L = geometry.length;
  const W = geometry.width;
  const H = geometry.height;

  // Shape-dependent surface areas
  const { wallAreaTotal, roofArea, floorArea } = getShapeAreas(L, W, H, design.shape);
  const doorArea = openings.doorArea || 1.8;
  const windowArea = openings.windowArea || 2.5;
  const wallAreaNet = Math.max(0, wallAreaTotal - windowArea - doorArea);

  // Convection coefficients
  const hExt = getExternalConvectionCoefficient(windSpeed);
  const hInt = getInternalConvectionCoefficient();

  // Multi-layer thermal resistances
  const wallLayers = [
    { thickness: geometry.wallThickness, thermalConductivity: materials.wallMaterial.thermalConductivity || 0.8 },
    { thickness: 0.10, thermalConductivity: materials.insulationMaterial.thermalConductivity || 0.035 }
  ];
  const rWall = calculateThermalResistance(wallLayers, hInt, hExt);

  const roofLayers = [
    { thickness: geometry.roofThickness, thermalConductivity: materials.roofMaterial.thermalConductivity || 0.5 },
    { thickness: 0.12, thermalConductivity: materials.insulationMaterial.thermalConductivity || 0.035 }
  ];
  const rRoof = calculateThermalResistance(roofLayers, hInt, hExt);

  const floorLayers = [
    { thickness: geometry.floorThickness, thermalConductivity: materials.floorMaterial.thermalConductivity || 1.2 },
    { thickness: 0.08, thermalConductivity: materials.insulationMaterial.thermalConductivity || 0.035 }
  ];
  const rFloor = calculateThermalResistance(floorLayers, hInt, hExt / 2);

  const windowLayers = [
    { thickness: 0.012, thermalConductivity: materials.windowMaterial.thermalConductivity || 1.4 }
  ];
  const rWindow = calculateThermalResistance(windowLayers, hInt, hExt);

  const doorLayers = [
    { thickness: 0.04, thermalConductivity: materials.doorMaterial.thermalConductivity || 0.15 }
  ];
  const rDoor = calculateThermalResistance(doorLayers, hInt, hExt);

  // Conduction heat losses (Watts)
  const qWallCond = calculateConductionLoss(Tin, Tambient, wallAreaNet, rWall);
  const qRoofCond = calculateConductionLoss(Tin, Tambient, roofArea, rRoof);
  // Ground temperature in high altitude winter is slightly warmer than air (e.g. Tambient + 5°C or fixed sub-zero)
  const Tground = Math.max(-10, Tambient + 3);
  const qFloorCond = calculateConductionLoss(Tin, Tground, floorArea, rFloor);
  const qWindowCond = calculateConductionLoss(Tin, Tambient, windowArea, rWindow);
  const qDoorCond = calculateConductionLoss(Tin, Tambient, doorArea, rDoor);

  const totalConductionLoss = qWallCond + qRoofCond + qFloorCond + qWindowCond + qDoorCond;

  // Exterior skin surface radiation (Roof faces sky F_sky = 1.0; exterior skin temperature T_surf ~ Tambient + small delta)
  const TsurfExtRoof = Tambient + 1.5;
  const qRoofSkyRadiation = calculateLongwaveRadiationLoss(TsurfExtRoof, Tambient, roofArea, materials.roofMaterial.emissivity || 0.88) * 0.10; // Fraction affecting envelope skin loss

  // Solar Gains
  const solarRes = calculateSolarGain({
    globalSolarRadiation,
    hour,
    latitude,
    shelterOrientation: design.orientation || 180,
    windowArea,
    openingOrientation: openings.openingOrientation || 180,
    shgc: materials.windowMaterial.solarAbsorptivity || 0.70,
    wallArea: wallAreaNet,
    wallAbsorptivity: materials.wallMaterial.solarAbsorptivity || 0.7,
    roofArea,
    roofAbsorptivity: materials.roofMaterial.solarAbsorptivity || 0.7,
    roofAngle: design.roofAngle || 25
  });

  const totalSolarGain = solarRes.totalSolarGain;
  const totalHeatLoss = Math.max(0, totalConductionLoss + Math.max(0, qRoofSkyRadiation));
  
  // Net Heat (Watts)
  const netHeatWatts = totalSolarGain + effectiveInternalGains - totalHeatLoss;

  return {
    netHeatWatts,
    totalSolarGain,
    totalHeatLoss,
    conductionLoss: totalConductionLoss,
    skyRadiationLoss: Math.max(0, qRoofSkyRadiation),
    internalGainsWatts: effectiveInternalGains,
    componentBreakdown: {
      wallConduction: qWallCond,
      roofConduction: qRoofCond,
      floorConduction: qFloorCond,
      windowConduction: qWindowCond,
      doorConduction: qDoorCond
    }
  };
}

module.exports = {
  computeInstantaneousHeatBalance,
  getShapeAreas
};
