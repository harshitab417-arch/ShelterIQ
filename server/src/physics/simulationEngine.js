/**
 * Physics Engine - Main Transient Simulation Coordinator
 */

const { stepIndoorTemperature } = require('./temperatureSolver');

/**
 * Execute full time-series thermal simulation with warm-up stabilization
 */
function runThermalSimulation({
  shelter,
  climateDataset,
  comfortSettings = { minComfortTemp: 18, maxComfortTemp: 24 },
  initialIndoorTemp = null // Null auto-initializes with 24h warm-up
}) {
  const dataPoints = climateDataset?.dataPoints || [];
  if (dataPoints.length === 0) {
    throw new Error('Climate dataset contains no valid weather data points.');
  }

  // 1. Warm-Up Cycle: Run through the first 24h cycle to initialize thermal mass state
  const first24 = dataPoints.slice(0, Math.min(24, dataPoints.length));
  let currentIndoorTemp = initialIndoorTemp !== null 
    ? initialIndoorTemp 
    : (dataPoints[0].ambientTemperature > 10 ? dataPoints[0].ambientTemperature : dataPoints[0].ambientTemperature + 6);

  // Warm-up iteration (stabilizing lumped thermal capacitance)
  first24.forEach((dp, index) => {
    const hour = index % 24;
    const res = stepIndoorTemperature({
      Tcurrent: currentIndoorTemp,
      Tambient: dp.ambientTemperature,
      globalSolarRadiation: dp.solarRadiation,
      windSpeed: dp.windSpeed,
      hour,
      latitude: climateDataset.latitude || 34.15,
      shelter
    });
    currentIndoorTemp = res.NextTin;
  });

  // 2. Production Simulation Time-Series
  const timeSeries = [];
  let totalSolarGainJ = 0;
  let totalHeatLossJ = 0;
  let peakHeatLossWatts = 0;

  let sumIndoorTemp = 0;
  let minIndoorTemp = Infinity;
  let maxIndoorTemp = -Infinity;

  let comfortableStepsCount = 0;
  let totalHeatingDeficitJoules = 0;

  const componentSum = {
    wallConduction: 0,
    roofConduction: 0,
    curvedEnvelopeConduction: 0,
    floorConduction: 0,
    windowConduction: 0,
    doorConduction: 0,
    ventilationLoss: 0,
    skyRadiation: 0
  };

  dataPoints.forEach((dp, index) => {
    const hour = index % 24;
    const res = stepIndoorTemperature({
      Tcurrent: currentIndoorTemp,
      Tambient: dp.ambientTemperature,
      globalSolarRadiation: dp.solarRadiation,
      windSpeed: dp.windSpeed,
      hour,
      latitude: climateDataset.latitude || 34.15,
      shelter
    });

    currentIndoorTemp = res.NextTin;
    const hb = res.heatBalance;
    const Cth = res.thermalCapacitanceJPerK || 1e6;

    // Energy accumulations (Watts * 3600 seconds = Joules)
    const dtSec = 3600;
    totalSolarGainJ += hb.totalSolarGain * dtSec;
    totalHeatLossJ += hb.totalHeatLoss * dtSec;

    if (hb.totalHeatLoss > peakHeatLossWatts) {
      peakHeatLossWatts = hb.totalHeatLoss;
    }

    sumIndoorTemp += currentIndoorTemp;
    if (currentIndoorTemp < minIndoorTemp) minIndoorTemp = currentIndoorTemp;
    if (currentIndoorTemp > maxIndoorTemp) maxIndoorTemp = currentIndoorTemp;

    // Thermal comfort evaluation
    if (currentIndoorTemp >= comfortSettings.minComfortTemp && currentIndoorTemp <= comfortSettings.maxComfortTemp) {
      comfortableStepsCount++;
    } else if (currentIndoorTemp < comfortSettings.minComfortTemp) {
      // Energy needed to heat interior up to minimum comfort boundary
      const deltaT = comfortSettings.minComfortTemp - currentIndoorTemp;
      const qLossWatts = hb.totalHeatLoss;
      totalHeatingDeficitJoules += (deltaT * Cth * 0.10) + (qLossWatts * dtSec * 0.40);
    }

    // Component tracking
    const cb = hb.componentBreakdown || {};
    componentSum.wallConduction += cb.wallConduction || 0;
    componentSum.roofConduction += cb.roofConduction || 0;
    componentSum.curvedEnvelopeConduction += cb.curvedEnvelopeConduction || 0;
    componentSum.floorConduction += cb.floorConduction || 0;
    componentSum.windowConduction += cb.windowConduction || 0;
    componentSum.doorConduction += cb.doorConduction || 0;
    componentSum.ventilationLoss += cb.ventilationLoss || 0;
    componentSum.skyRadiation += cb.skyRadiation || 0;

    timeSeries.push({
      timestamp: dp.timestamp,
      ambientTemperature: Number(dp.ambientTemperature.toFixed(1)),
      indoorTemperature: Number(currentIndoorTemp.toFixed(1)),
      solarGain: Number(hb.totalSolarGain.toFixed(1)), // Watts
      conductionLoss: Number(hb.conductionLoss.toFixed(1)), // Watts
      ventilationLoss: Number((hb.ventilationLoss || 0).toFixed(1)), // Watts
      radiationLoss: Number(hb.skyRadiationLoss.toFixed(1)), // Watts
      totalHeatLoss: Number(hb.totalHeatLoss.toFixed(1)), // Watts
      netHeat: Number(hb.netHeatWatts.toFixed(1)) // Watts
    });
  });

  const numPoints = dataPoints.length;
  const avgIndoorTemp = Number((sumIndoorTemp / numPoints).toFixed(1));
  const comfortPercentage = Number(((comfortableStepsCount / numPoints) * 100).toFixed(1));
  const totalSolarGainKWh = Number((totalSolarGainJ / 3.6e6).toFixed(2));
  const totalHeatLossKWh = Number((totalHeatLossJ / 3.6e6).toFixed(2));
  const heatingRequirementKWh = Number((totalHeatingDeficitJoules / 3.6e6).toFixed(2));

  return {
    timeSeries,
    metrics: {
      avgIndoorTemp,
      minIndoorTemp: Number(minIndoorTemp.toFixed(1)),
      maxIndoorTemp: Number(maxIndoorTemp.toFixed(1)),
      totalSolarGain: totalSolarGainKWh,
      totalHeatLoss: totalHeatLossKWh,
      peakHeatLoss: Number(peakHeatLossWatts.toFixed(1)),
      comfortPercentage,
      heatingRequirement: heatingRequirementKWh
    },
    componentBreakdown: {
      wallConduction: Number((componentSum.wallConduction / numPoints).toFixed(1)),
      roofConduction: Number((componentSum.roofConduction / numPoints).toFixed(1)),
      curvedEnvelopeConduction: Number((componentSum.curvedEnvelopeConduction / numPoints).toFixed(1)),
      floorConduction: Number((componentSum.floorConduction / numPoints).toFixed(1)),
      windowConduction: Number((componentSum.windowConduction / numPoints).toFixed(1)),
      doorConduction: Number((componentSum.doorConduction / numPoints).toFixed(1)),
      ventilationLoss: Number((componentSum.ventilationLoss / numPoints).toFixed(1)),
      skyRadiation: Number((componentSum.skyRadiation / numPoints).toFixed(1))
    },
    assumptions: [
      'Single-zone transient lumped-capacitance thermal model with shape-specific geometry',
      'High-altitude atmospheric air density correction applied (Leh elevation 3500m)',
      'McAdams empirical exterior convection model (h_ext = 10.0 + 4.1 * v_wind)',
      'Swinbank longwave clear-sky radiation model',
      'Infiltration & ventilation heat transfer (0.5 ACH)',
      'Sol-air conductive transfer for opaque envelope surfaces',
      `Configurable indoor thermal comfort range set to ${comfortSettings.minComfortTemp}°C - ${comfortSettings.maxComfortTemp}°C`
    ],
    warnings: minIndoorTemp < 5 ? ['Indoor temperature drops below 5°C during cold night hours; auxiliary heat or additional insulation recommended.'] : []
  };
}

module.exports = {
  runThermalSimulation
};
