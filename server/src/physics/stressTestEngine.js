/**
 * ShelterIQ — FEATURE 3: EXTREME CLIMATE RESILIENCE / STRESS TEST ENGINE
 *
 * Inherits the FINAL OPTIMIZED SHELTER from Feature 2 and FREEZES the design completely.
 * Across stress test scenarios, NOTHING about the shelter changes (shape, dimensions, materials,
 * orientation, WWR, insulation thickness, openings, occupancy are 100% frozen).
 *
 * ONLY CLIMATE INPUTS (Ambient Temperature Profile) are varied across location-aware scenarios:
 * - Cold-Dominant: Baseline (0°C), Severe Cold (-5°C), Extreme Cold (-10°C)
 * - Hot-Dominant: Baseline (0°C), Heatwave (+5°C), Extreme Heat (+10°C)
 * - Mixed: Baseline (0°C), Cold Stress (-7.5°C), Heat Stress (+7.5°C)
 *
 * Calls the SAME runThermalSimulation() physics engine for each scenario.
 */

const { runThermalSimulation } = require('./simulationEngine');

// Centralized status classification threshold constants
const STATUS_THRESHOLDS = {
  COMFORT_STABLE_MIN: 60.0,       // %
  COMFORT_MODERATE_MIN: 35.0,     // %
  ENERGY_ESCALATION_MODERATE: 1.30, // 30% increase vs baseline
  ENERGY_ESCALATION_CRITICAL: 1.70  // 70% increase vs baseline
};

/**
 * Classifies climate based on mean ambient temperature
 */
function classifyClimate(climateDataset) {
  const dataPoints = climateDataset?.dataPoints || [];
  if (dataPoints.length === 0) return { classification: 'Cold-Dominant', meanAmbient: -5.0 };

  const ambSum = dataPoints.reduce((sum, dp) => sum + (dp.ambientTemperature || 0), 0);
  const meanAmbient = Number((ambSum / dataPoints.length).toFixed(1));

  let classification = 'Mixed';
  if (meanAmbient < 10.0) {
    classification = 'Cold-Dominant';
  } else if (meanAmbient > 25.0) {
    classification = 'Hot-Dominant';
  }

  return {
    classification,
    meanAmbient,
    description: 'ShelterIQ Thermal Stress Classification'
  };
}

/**
 * Computes degree-hours for cold and hot indoor temperature excursions
 */
function computeDegreeHours(timeSeries, minComfort = 18, maxComfort = 24) {
  let coldDegreeHours = 0;
  let hotDegreeHours = 0;
  let hoursTooCold = 0;
  let hoursTooHot = 0;
  let hoursComfortable = 0;

  timeSeries.forEach(point => {
    const Tin = point.indoorTemperature;
    if (Tin < minComfort) {
      hoursTooCold++;
      coldDegreeHours += (minComfort - Tin);
    } else if (Tin > maxComfort) {
      hoursTooHot++;
      hotDegreeHours += (Tin - maxComfort);
    } else {
      hoursComfortable++;
    }
  });

  return {
    hoursTooCold,
    hoursTooHot,
    hoursComfortable,
    coldDegreeHours: Number(coldDegreeHours.toFixed(1)),
    hotDegreeHours: Number(hotDegreeHours.toFixed(1))
  };
}

/**
 * Computes Status Classification (STABLE, MODERATE RISK, CRITICAL) using centralized thresholds
 */
function determineScenarioStatus(metrics, dh, baselineEnergy, climateClassification) {
  const comfort = metrics.comfortPercentage || 0;
  const minT = metrics.minIndoorTemp;
  const maxT = metrics.maxIndoorTemp;
  const currentEnergy = metrics.heatingRequirement + (metrics.coolingRequirement || 0);
  const energyEscalation = baselineEnergy > 0 ? currentEnergy / baselineEnergy : 1.0;

  const reasons = [];

  // Critical conditions
  if (comfort < STATUS_THRESHOLDS.COMFORT_MODERATE_MIN) {
    reasons.push(`Severe comfort loss (retained comfort ${comfort}% is below ${STATUS_THRESHOLDS.COMFORT_MODERATE_MIN}% threshold).`);
  }
  if (climateClassification === 'Cold-Dominant' && minT < 0) {
    reasons.push(`Sub-zero indoor freezing hazard (minimum indoor temperature dropped to ${minT}°C).`);
  }
  if (climateClassification === 'Hot-Dominant' && maxT > 40) {
    reasons.push(`Extreme heat exposure hazard (maximum indoor temperature reached ${maxT}°C).`);
  }
  if (energyEscalation > STATUS_THRESHOLDS.ENERGY_ESCALATION_CRITICAL) {
    reasons.push(`Critical energy demand escalation (${Math.round((energyEscalation - 1) * 100)}% increase over baseline).`);
  }

  if (reasons.length > 0) {
    return { status: 'CRITICAL', statusReasons: reasons };
  }

  // Moderate Risk conditions
  if (comfort < STATUS_THRESHOLDS.COMFORT_STABLE_MIN) {
    reasons.push(`Moderate comfort reduction (comfort level at ${comfort}%).`);
  }
  if (energyEscalation > STATUS_THRESHOLDS.ENERGY_ESCALATION_MODERATE) {
    reasons.push(`Moderate energy demand escalation (${Math.round((energyEscalation - 1) * 100)}% increase over baseline).`);
  }
  if (dh.coldDegreeHours > 50 || dh.hotDegreeHours > 50) {
    reasons.push(`Elevated thermal deficit degree-hours (Cold: ${dh.coldDegreeHours} DH, Hot: ${dh.hotDegreeHours} DH).`);
  }

  if (reasons.length > 0) {
    return { status: 'MODERATE RISK', statusReasons: reasons };
  }

  return {
    status: 'STABLE',
    statusReasons: ['Shelter maintains safe indoor temperature stability and high comfort retention.']
  };
}

/**
 * Computes 100-point Climate Resilience Score for a scenario
 */
function calculateScenarioResilienceScore(metrics, dh, baselineMetrics, climateClassification) {
  const baseComfort = Math.max(1, baselineMetrics.comfortPercentage || 1);
  const stressComfort = metrics.comfortPercentage || 0;

  // 1. Comfort Retention (40 Points)
  const comfortRetentionScore = Math.min(40, Math.max(0, 40 * (stressComfort / baseComfort)));

  // 2. Temperature Safety (25 Points)
  let tempSafetyScore = 25;
  if (climateClassification === 'Cold-Dominant') {
    tempSafetyScore = Math.min(25, Math.max(0, 25 * ((metrics.minIndoorTemp + 15) / 25)));
  } else if (climateClassification === 'Hot-Dominant') {
    tempSafetyScore = Math.min(25, Math.max(0, 25 * ((45 - metrics.maxIndoorTemp) / 20)));
  } else {
    const coldSafety = Math.min(25, Math.max(0, 25 * ((metrics.minIndoorTemp + 15) / 25)));
    const hotSafety = Math.min(25, Math.max(0, 25 * ((45 - metrics.maxIndoorTemp) / 20)));
    tempSafetyScore = (coldSafety + hotSafety) / 2;
  }

  // 3. Energy Robustness (20 Points)
  const baseEnergy = Math.max(1, baselineMetrics.heatingRequirement + (baselineMetrics.coolingRequirement || 0));
  const stressEnergy = metrics.heatingRequirement + (metrics.coolingRequirement || 0);
  const escalation = stressEnergy / baseEnergy;
  const energyRobustnessScore = Math.min(20, Math.max(0, 20 * (1 - Math.max(0, escalation - 1) / 1.5)));

  // 4. Thermal Stability (15 Points)
  const baseRange = baselineMetrics.maxIndoorTemp - baselineMetrics.minIndoorTemp;
  const stressRange = metrics.maxIndoorTemp - metrics.minIndoorTemp;
  const stabilityDeterioration = Math.max(0, stressRange - baseRange);
  const thermalStabilityScore = Math.min(15, Math.max(0, 15 * (1 - stabilityDeterioration / 20)));

  const resilienceScore = Number((comfortRetentionScore + tempSafetyScore + energyRobustnessScore + thermalStabilityScore).toFixed(1));

  return {
    resilienceScore,
    breakdown: {
      comfortRetentionScore: Number(comfortRetentionScore.toFixed(1)),
      tempSafetyScore: Number(tempSafetyScore.toFixed(1)),
      energyRobustnessScore: Number(energyRobustnessScore.toFixed(1)),
      thermalStabilityScore: Number(thermalStabilityScore.toFixed(1))
    }
  };
}

/**
 * Conducts Envelope Heat-Transfer Vulnerability Analysis on the worst-case stress scenario
 */
function analyzeThermalVulnerabilities(worstScenarioResult) {
  const cb = worstScenarioResult.componentBreakdown || {};

  const wallsCond = cb.wallConduction || cb.wallsConduction || cb.curvedEnvelopeConduction || 0;
  const roofCond = cb.roofConduction || 0;
  const floorCond = cb.floorConduction || 0;
  const winCond = cb.windowConduction || cb.windowsConduction || 0;
  const doorCond = cb.doorConduction || cb.doorsConduction || 0;

  const totalConductiveLoss = wallsCond + roofCond + floorCond + winCond + doorCond;

  const getSharePct = (loss) => totalConductiveLoss > 0 ? Number(((loss / totalConductiveLoss) * 100).toFixed(1)) : 0;
  const getRiskLevel = (sharePct) => sharePct >= 30.0 ? 'HIGH' : (sharePct >= 15.0 ? 'MEDIUM' : 'LOW');

  const components = [
    { component: 'Walls', lossWatts: Number(wallsCond.toFixed(1)), sharePct: getSharePct(wallsCond), riskLevel: getRiskLevel(getSharePct(wallsCond)) },
    { component: 'Roof', lossWatts: Number(roofCond.toFixed(1)), sharePct: getSharePct(roofCond), riskLevel: getRiskLevel(getSharePct(roofCond)) },
    { component: 'Floor', lossWatts: Number(floorCond.toFixed(1)), sharePct: getSharePct(floorCond), riskLevel: getRiskLevel(getSharePct(floorCond)) },
    { component: 'Windows', lossWatts: Number(winCond.toFixed(1)), sharePct: getSharePct(winCond), riskLevel: getRiskLevel(getSharePct(winCond)) },
    { component: 'Doors', lossWatts: Number(doorCond.toFixed(1)), sharePct: getSharePct(doorCond), riskLevel: getRiskLevel(getSharePct(doorCond)) }
  ];

  components.sort((a, b) => b.sharePct - a.sharePct);

  // Group 2: Solar / Overheating Exposure (Reported separately, NOT in conductive share)
  const solarExposure = {
    totalSolarGainKWh: worstScenarioResult.metrics.totalSolarGain,
    hoursTooHot: worstScenarioResult.degreeHours.hoursTooHot,
    hotDegreeHours: worstScenarioResult.degreeHours.hotDegreeHours
  };

  // Generate deterministic engineering recommendations
  const topVulnerability = components[0];
  const recommendations = [];

  if (topVulnerability.sharePct >= 30.0) {
    recommendations.push(`${topVulnerability.component} conduction accounts for ${topVulnerability.sharePct}% of envelope heat loss under extreme stress and is the primary structural vulnerability.`);
  }

  if (solarExposure.hoursTooHot > 0) {
    recommendations.push(`High solar irradiance through glazing contributes to ${solarExposure.hoursTooHot} hours of indoor overheating during peak solar hours.`);
  } else if (worstScenarioResult.degreeHours.hoursTooCold > 12) {
    recommendations.push(`Extended cold stress causes ${worstScenarioResult.degreeHours.hoursTooCold} hours below comfort boundaries; supplemental thermal shading or thermal mass recommended.`);
  }

  return {
    envelopeConductiveVulnerabilities: components,
    totalConductiveLossWatts: Number(totalConductiveLoss.toFixed(1)),
    solarExposure,
    recommendations
  };
}

/**
 * Main Extreme Climate Resilience Test entry point
 */
function runStressTest({
  optimizedShelter,
  baseSimulation,
  climateDataset,
  comfortSettings = { minComfortTemp: 18, maxComfortTemp: 24 }
}) {
  const activeShelter = optimizedShelter || baseSimulation?.designOptimization?.winner?.testShelter || baseSimulation?.shelter;
  const activeClimate = climateDataset || baseSimulation?.climateDataset;

  if (!activeShelter || !activeClimate) {
    throw new Error('Optimized shelter design and target climate dataset are required for climate resilience stress testing.');
  }

  // 1. FREEZE ALL SHELTER PARAMETERS
  const frozenDesign = {
    shape: activeShelter.shape || activeShelter.design?.shape || 'rectangle',
    dimensions: activeShelter.geometry || activeShelter.dimensions || {},
    orientation: activeShelter.design?.orientation !== undefined ? activeShelter.design.orientation : 180,
    windowArea: activeShelter.openings?.windowArea || 2.5,
    doorArea: activeShelter.openings?.doorArea || 1.8,
    wallMaterial: activeShelter.materials?.wallMaterial?.name,
    insulationMaterial: activeShelter.materials?.insulationMaterial?.name,
    insulationThickness: activeShelter.geometry?.insulationThickness || activeShelter.insulationThickness || activeShelter.materials?.insulationMaterial?.thicknessDefault || 0.10,
    roofMaterial: activeShelter.materials?.roofMaterial?.name,
    floorMaterial: activeShelter.materials?.floorMaterial?.name,
    glazingMaterial: activeShelter.materials?.windowMaterial?.name,
    doorMaterial: activeShelter.materials?.doorMaterial?.name,
    occupants: activeShelter.occupants || 4
  };

  // 2. Classify Climate
  const climateInfo = classifyClimate(activeClimate);
  const climateClass = climateInfo.classification;

  // 3. Define Location-Aware Stress Scenarios
  let scenarioDefinitions = [];
  if (climateClass === 'Cold-Dominant') {
    scenarioDefinitions = [
      { id: 'baseline', name: 'Baseline Climate', deltaT: 0 },
      { id: 'severe', name: 'Severe Cold Stress', deltaT: -5.0 },
      { id: 'extreme', name: 'Extreme Cold Stress', deltaT: -10.0 }
    ];
  } else if (climateClass === 'Hot-Dominant') {
    scenarioDefinitions = [
      { id: 'baseline', name: 'Baseline Climate', deltaT: 0 },
      { id: 'severe', name: 'Heatwave Stress', deltaT: 5.0 },
      { id: 'extreme', name: 'Extreme Heat Stress', deltaT: 10.0 }
    ];
  } else {
    scenarioDefinitions = [
      { id: 'baseline', name: 'Baseline Climate', deltaT: 0 },
      { id: 'severe', name: 'Cold Stress Scenario', deltaT: -7.5 },
      { id: 'extreme', name: 'Heat Stress Scenario', deltaT: 7.5 }
    ];
  }

  // 4. Run Physics Engine for Each Stress Scenario
  const scenarioResults = [];
  let baselineSimResult = null;
  let baselineMetrics = null;

  scenarioDefinitions.forEach(scen => {
    // Perturb ONLY the ambient temperature profile
    const perturbedDataPoints = (activeClimate.dataPoints || []).map(dp => ({
      ...dp,
      ambientTemperature: Number((dp.ambientTemperature + scen.deltaT).toFixed(1))
    }));

    const perturbedClimate = {
      ...activeClimate,
      dataPoints: perturbedDataPoints
    };

    const simResult = runThermalSimulation({
      shelter: activeShelter,
      climateDataset: perturbedClimate,
      comfortSettings
    });

    const dh = computeDegreeHours(simResult.timeSeries, comfortSettings.minComfortTemp, comfortSettings.maxComfortTemp);
    const coolingReq = dh.hotDegreeHours > 0 ? Number((dh.hotDegreeHours * 0.05).toFixed(2)) : 0;
    const metrics = { ...simResult.metrics, coolingRequirement: coolingReq };

    if (scen.id === 'baseline') {
      baselineSimResult = simResult;
      baselineMetrics = metrics;
    }

    const baseEnergy = baselineMetrics ? baselineMetrics.heatingRequirement + (baselineMetrics.coolingRequirement || 0) : metrics.heatingRequirement;
    const statusRes = determineScenarioStatus(metrics, dh, baseEnergy, climateClass);
    const scoreRes = calculateScenarioResilienceScore(metrics, dh, baselineMetrics || metrics, climateClass);

    // Calculate outdoor range
    const ambTemps = perturbedDataPoints.map(dp => dp.ambientTemperature);
    const minAmb = Math.min(...ambTemps);
    const maxAmb = Math.max(...ambTemps);

    scenarioResults.push({
      scenarioId: scen.id,
      scenarioName: scen.name,
      deltaT: scen.deltaT,
      outdoorRange: `${minAmb.toFixed(1)}°C to ${maxAmb.toFixed(1)}°C`,
      minOutdoorTemp: minAmb,
      maxOutdoorTemp: maxAmb,
      metrics,
      degreeHours: dh,
      componentBreakdown: simResult.componentBreakdown,
      status: statusRes.status,
      statusReasons: statusRes.statusReasons,
      resilienceScore: scoreRes.resilienceScore,
      resilienceBreakdown: scoreRes.breakdown
    });
  });

  // 5. Select Worst-Case Scenario for Final Resilience Score & Vulnerabilities
  let worstCase = scenarioResults[scenarioResults.length - 1]; // Extreme scenario default
  if (climateClass === 'Mixed') {
    const coldScen = scenarioResults.find(s => s.scenarioId === 'severe');
    const heatScen = scenarioResults.find(s => s.scenarioId === 'extreme');
    if (coldScen && heatScen) {
      worstCase = coldScen.resilienceScore < heatScen.resilienceScore ? coldScen : heatScen;
    }
  }

  const finalResilienceScore = worstCase.resilienceScore;
  const finalResilienceBreakdown = worstCase.resilienceBreakdown;

  // Determine overall status across scenarios
  let overallStatus = 'STABLE';
  if (scenarioResults.some(s => s.status === 'CRITICAL')) {
    overallStatus = 'CRITICAL';
  } else if (scenarioResults.some(s => s.status === 'MODERATE RISK')) {
    overallStatus = 'MODERATE RISK';
  }

  // 6. Perform Vulnerability Analysis
  const vulnerabilityAnalysis = analyzeThermalVulnerabilities(worstCase);

  return {
    climateClassification: climateInfo,
    frozenDesign,
    assumptions: [
      'Shelter design parameters remain 100% frozen during stress testing.',
      'Only ambient outdoor temperature profiles are perturbed by location-aware deltaT offsets.',
      'Transient thermal solver recalculates dynamic heat balance for each stress scenario.'
    ],
    scenarios: scenarioResults,
    worstCaseScenario: worstCase.scenarioName,
    finalResilienceScore,
    finalResilienceBreakdown,
    overallStatus,
    vulnerabilities: vulnerabilityAnalysis
  };
}

module.exports = {
  runStressTest,
  classifyClimate,
  STATUS_THRESHOLDS
};
