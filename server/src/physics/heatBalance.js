/**
 * Physics Engine - Overall Instantaneous Heat Balance Module
 *
 * Integrates shape-specific thermal geometry (Rectangle, Dome, A-Frame, Quonset)
 * with multi-layer conduction, infiltration/ventilation loss, longwave sky radiation,
 * passive solar gains, and occupant internal heat gains.
 *
 * Thermodynamic Energy Balance:
 * C_eff * dTin/dt = Q_solar + Q_internal - Q_transmission - Q_ventilation - Q_skyRadiation
 */

const { calculateThermalResistance, calculateConductionLoss } = require('./conduction');
const { getExternalConvectionCoefficient, getInternalConvectionCoefficient } = require('./convection');
const { calculateLongwaveRadiationLoss } = require('./radiation');
const { calculateSolarGain } = require('./solar');
const { calculateGeometry } = require('./shapeCalculator');

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
  internalGainsWatts = shelter._internalGainsWatts || (shelter.occupants ? shelter.occupants * 80 + 100 : 420),
  ach = 0.5, // Air Changes per Hour (tight passive shelter standard)
  altitudeMeters = 3500
}) {
  const { geometry = {}, design = {}, openings = {}, materials = {} } = shelter;
  const shape = (shelter.shape || design.shape || 'rectangle').toLowerCase();

  // Standardized geometry calculations
  const geom = shelter.calculatedGeometry || calculateGeometry(shape, geometry, openings);

  const opaqueWallArea = geom.opaqueWallArea || 0;
  const roofArea = geom.roofArea || 0;
  const curvedArea = geom.curvedEnvelopeArea || 0;
  const floorArea = geom.floorArea || 24;
  const windowArea = geom.glazingArea || openings.windowArea || 0;
  const doorArea = geom.doorArea || (openings.doorCount ? openings.doorCount * 1.8 : 1.8);
  const volume = geom.volume || 60;

  // Surface film convection coefficients
  const hExt = getExternalConvectionCoefficient(windSpeed);
  const hInt = getInternalConvectionCoefficient();

  // Multi-layer thermal resistances (R-values in m²·K/W)
  const wallThickness = geometry.wallThickness || materials.wallMaterial?.thicknessDefault || 0.25;
  const roofThickness = geometry.roofThickness || materials.roofMaterial?.thicknessDefault || 0.20;
  const floorThickness = geometry.floorThickness || materials.floorMaterial?.thicknessDefault || 0.15;

  const wallLayers = [
    { thickness: wallThickness, thermalConductivity: materials.wallMaterial?.thermalConductivity || 0.85 },
    { thickness: 0.10, thermalConductivity: materials.insulationMaterial?.thermalConductivity || 0.035 }
  ];
  const rWall = calculateThermalResistance(wallLayers, hInt, hExt);

  const roofLayers = [
    { thickness: roofThickness, thermalConductivity: materials.roofMaterial?.thermalConductivity || 0.35 },
    { thickness: 0.12, thermalConductivity: materials.insulationMaterial?.thermalConductivity || 0.035 }
  ];
  const rRoof = calculateThermalResistance(roofLayers, hInt, hExt);

  const floorLayers = [
    { thickness: floorThickness, thermalConductivity: materials.floorMaterial?.thermalConductivity || 1.10 },
    { thickness: 0.08, thermalConductivity: materials.insulationMaterial?.thermalConductivity || 0.035 }
  ];
  const rFloor = calculateThermalResistance(floorLayers, hInt, hExt / 2);

  const windowLayers = [
    { thickness: 0.024, thermalConductivity: materials.windowMaterial?.thermalConductivity || 1.20 }
  ];
  const rWindow = calculateThermalResistance(windowLayers, hInt, hExt);

  const doorLayers = [
    { thickness: 0.05, thermalConductivity: materials.doorMaterial?.thermalConductivity || 0.13 }
  ];
  const rDoor = calculateThermalResistance(doorLayers, hInt, hExt);

  // 1. Conduction Heat Losses (Watts): Q = (Tin - Tout) / R * Area
  const qWallCond = calculateConductionLoss(Tin, Tambient, opaqueWallArea, rWall);
  const qRoofCond = calculateConductionLoss(Tin, Tambient, roofArea, rRoof);
  
  // Curved envelope conduction:
  // For Dome: curved shell uses wall/insulation composite resistance
  // For Quonset: curved arch uses roof/insulation composite resistance
  const rCurved = shape === 'quonset' ? rRoof : rWall;
  const qCurvedCond = curvedArea > 0 ? calculateConductionLoss(Tin, Tambient, curvedArea, rCurved) : 0;

  // Ground contact floor conduction:
  const Tground = Math.max(-10, Tambient + 3);
  const qFloorCond = calculateConductionLoss(Tin, Tground, floorArea, rFloor);
  
  const qWindowCond = calculateConductionLoss(Tin, Tambient, windowArea, rWindow);
  const qDoorCond = calculateConductionLoss(Tin, Tambient, doorArea, rDoor);

  const totalConductionLoss = qWallCond + qRoofCond + qCurvedCond + qFloorCond + qWindowCond + qDoorCond;

  // 2. Ventilation / Infiltration Heat Loss:
  // Q_vent = rho_air * V * (ACH / 3600) * cp_air * (Tin - Tambient)
  const rhoAir = 1.225 * Math.exp(-altitudeMeters / 8400); // ~0.80 kg/m³ at 3500m
  const cpAir = 1005; // J/(kg·K)
  const massFlowRateKgPerSec = (rhoAir * volume * (ach / 3600));
  const qVentilation = Math.max(0, massFlowRateKgPerSec * cpAir * (Tin - Tambient));

  // 3. Exterior sky longwave radiation (Roof and upward curved surfaces face cold sky)
  const skyRadiatingArea = roofArea + (curvedArea > 0 ? curvedArea * 0.70 : 0);
  const TsurfExt = Tambient + 1.2;
  const roofEmissivity = (materials.roofMaterial?.emissivity || materials.wallMaterial?.emissivity || 0.88);
  const qSkyRadiation = skyRadiatingArea > 0 
    ? calculateLongwaveRadiationLoss(TsurfExt, Tambient, skyRadiatingArea, roofEmissivity) * 0.08 
    : 0;

  // 4. Passive Solar Gains across glazing and opaque envelope
  const solarEffectiveRoofArea = roofArea + (curvedArea > 0 ? curvedArea * 0.55 : 0);
  const solarEffectiveWallArea = opaqueWallArea + (curvedArea > 0 ? curvedArea * 0.45 : 0);

  const solarRes = calculateSolarGain({
    globalSolarRadiation,
    hour,
    latitude,
    shelterOrientation: design.orientation || 180,
    windowArea,
    openingOrientation: openings.openingOrientation || 180,
    shgc: materials.windowMaterial?.solarAbsorptivity || 0.70,
    wallArea: solarEffectiveWallArea,
    wallAbsorptivity: materials.wallMaterial?.solarAbsorptivity || 0.7,
    roofArea: solarEffectiveRoofArea,
    roofAbsorptivity: materials.roofMaterial?.solarAbsorptivity || 0.7,
    roofAngle: design.roofAngle || 25,
    uWall: 1 / rWall,
    uRoof: 1 / rRoof,
    hExt
  });

  const totalSolarGain = solarRes.totalSolarGain;
  const totalHeatLoss = Math.max(0, totalConductionLoss + qVentilation + Math.max(0, qSkyRadiation));
  
  // Net Heat Flow (Watts) = Gains - Losses
  const netHeatWatts = totalSolarGain + internalGainsWatts - totalHeatLoss;

  return {
    netHeatWatts,
    totalSolarGain,
    totalHeatLoss,
    conductionLoss: totalConductionLoss,
    ventilationLoss: qVentilation,
    skyRadiationLoss: Math.max(0, qSkyRadiation),
    internalGainsWatts,
    componentBreakdown: {
      wallConduction: qWallCond,
      roofConduction: qRoofCond,
      curvedEnvelopeConduction: qCurvedCond,
      floorConduction: qFloorCond,
      windowConduction: qWindowCond,
      doorConduction: qDoorCond,
      ventilationLoss: qVentilation,
      skyRadiation: Math.max(0, qSkyRadiation)
    }
  };
}

module.exports = {
  computeInstantaneousHeatBalance
};
