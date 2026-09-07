/**
 * Physics Engine - Main Simulation Engine Coordinator
 */

const { stepIndoorTemperature } = require('./temperatureSolver');

/**
 * Execute full time-series thermal simulation
 */
function runThermalSimulation({
  shelter,
  climateDataset,
  comfortSettings = { minComfortTemp: 18, maxComfortTemp: 24 },
  initialIndoorTemp = 12.0 // Initial starting indoor temperature °C
}) {
  const dataPoints = climateDataset.dataPoints || [];
  if (dataPoints.length === 0) {
    throw new Error('Climate dataset contains no valid weather data points.');
  }

  const timeSeries = [];
  let currentIndoorTemp = initialIndoorTemp;

  let totalSolarGainJ = 0;
  let totalHeatLossJ = 0;
  let peakHeatLossWatts = 0;

  let sumIndoorTemp = 0;
  let minIndoorTemp = Infinity;
  let maxIndoorTemp = -Infinity;

  let comfortableStepsCount = 0;

  const componentConductionSum = {
    wallConduction: 0,
    roofConduction: 0,
    floorConduction: 0,
    windowConduction: 0,
    doorConduction: 0
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
    }

    // Component tracking
    componentConductionSum.wallConduction += hb.componentBreakdown.wallConduction;
    componentConductionSum.roofConduction += hb.componentBreakdown.roofConduction;
    componentConductionSum.floorConduction += hb.componentBreakdown.floorConduction;
    componentConductionSum.windowConduction += hb.componentBreakdown.windowConduction;
    componentConductionSum.doorConduction += hb.componentBreakdown.doorConduction;

    timeSeries.push({
      timestamp: dp.timestamp,
      ambientTemperature: Number(dp.ambientTemperature.toFixed(1)),
      indoorTemperature: Number(currentIndoorTemp.toFixed(1)),
      solarGain: Number(hb.totalSolarGain.toFixed(1)), // Watts
      conductionLoss: Number(hb.conductionLoss.toFixed(1)), // Watts
      convectionLoss: Number((hb.conductionLoss * 0.15).toFixed(1)), // Watts
      radiationLoss: Number(hb.skyRadiationLoss.toFixed(1)), // Watts
      totalHeatLoss: Number(hb.totalHeatLoss.toFixed(1)), // Watts
      netHeat: Number(hb.netHeatWatts.toFixed(1)) // Watts
    });
  });

  const avgIndoorTemp = Number((sumIndoorTemp / dataPoints.length).toFixed(1));
  const comfortPercentage = Number(((comfortableStepsCount / dataPoints.length) * 100).toFixed(1));
  const totalSolarGainKWh = Number((totalSolarGainJ / 3.6e6).toFixed(2));
  const totalHeatLossKWh = Number((totalHeatLossJ / 3.6e6).toFixed(2));

  return {
    timeSeries,
    metrics: {
      avgIndoorTemp,
      minIndoorTemp: Number(minIndoorTemp.toFixed(1)),
      maxIndoorTemp: Number(maxIndoorTemp.toFixed(1)),
      totalSolarGain: totalSolarGainKWh,
      totalHeatLoss: totalHeatLossKWh,
      peakHeatLoss: Number(peakHeatLossWatts.toFixed(1)),
      comfortPercentage
    },
    componentBreakdown: {
      wallConduction: Number((componentConductionSum.wallConduction / dataPoints.length).toFixed(1)),
      roofConduction: Number((componentConductionSum.roofConduction / dataPoints.length).toFixed(1)),
      floorConduction: Number((componentConductionSum.floorConduction / dataPoints.length).toFixed(1)),
      windowConduction: Number((componentConductionSum.windowConduction / dataPoints.length).toFixed(1)),
      doorConduction: Number((componentConductionSum.doorConduction / dataPoints.length).toFixed(1))
    },
    assumptions: [
      'Single-zone transient lumped-capacitance thermal model',
      'High-altitude atmospheric air density correction applied (Leh elevation 3500m)',
      'McAdams empirical exterior convection model (h_ext = 10.0 + 4.1 * v_wind)',
      'Swinbank longwave clear-sky radiation model',
      'Configurable indoor thermal comfort range set to ' + comfortSettings.minComfortTemp + '°C - ' + comfortSettings.maxComfortTemp + '°C'
    ],
    warnings: minIndoorTemp < 5 ? ['Indoor temperature drops below 5°C during cold night hours; auxiliary heat or additional insulation recommended.'] : []
  };
}

module.exports = {
  runThermalSimulation
};
