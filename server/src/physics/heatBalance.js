/**
 * Physics Engine - Overall Instantaneous Heat Balance Module
 */

const { calculateThermalResistance, calculateConductionLoss } = require('./conduction');
const { getExternalConvectionCoefficient, getInternalConvectionCoefficient } = require('./convection');
const { calculateLongwaveRadiationLoss } = require('./radiation');
const { calculateSolarGain } = require('./solar');

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
  internalGainsWatts = 420 // 4 personnel (320W) + equipment (100W)
}) {
  const { geometry, design, openings, materials } = shelter;

  // Extract dimensions
  const L = geometry.length;
  const W = geometry.width;
  const H = geometry.height;

  // Surface areas
  const wallAreaTotal = 2 * (L + W) * H;
  const doorArea = openings.doorArea || 1.8;
  const windowArea = openings.windowArea || 2.5;
  const wallAreaNet = Math.max(0, wallAreaTotal - windowArea - doorArea);
  const roofArea = L * W;
  const floorArea = L * W;

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
  const netHeatWatts = totalSolarGain + internalGainsWatts - totalHeatLoss;

  return {
    netHeatWatts,
    totalSolarGain,
    totalHeatLoss,
    conductionLoss: totalConductionLoss,
    skyRadiationLoss: Math.max(0, qRoofSkyRadiation),
    internalGainsWatts,
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
  computeInstantaneousHeatBalance
};
