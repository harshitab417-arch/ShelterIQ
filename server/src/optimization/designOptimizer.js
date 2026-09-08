/**
 * ShelterIQ — FEATURE 2: CLIMATE-ADAPTIVE DESIGN OPTIMIZATION ENGINE
 *
 * Material Evaluation stage determines the #1 winning material assembly.
 * Design Optimization keeps materials FIXED and optimizes only permitted DESIGN variables:
 * 1. Orientation (8 cardinal directions: 0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°)
 * 2. Window-to-Wall Ratio / Permitted Glazing Ratio (10%, 15%, 20%, 25% for Rectangle, A-Frame, Quonset; Fixed for Dome)
 * 3. Wall Insulation Thickness (Material-dependent valid thicknesses for selected insulation material)
 *
 * Uses deterministic exhaustive GRID SEARCH and existing transient physics solver runThermalSimulation().
 */

const { runThermalSimulation } = require('../physics/simulationEngine');
const { calculateGeometry } = require('../physics/shapeCalculator');
const { getMaterialThicknesses } = require('../physics/materialDatabase');

const ORIENTATIONS = [
  { deg: 0, label: 'North' },
  { deg: 45, label: 'North-East' },
  { deg: 90, label: 'East' },
  { deg: 135, label: 'South-East' },
  { deg: 180, label: 'South' },
  { deg: 225, label: 'South-West' },
  { deg: 270, label: 'West' },
  { deg: 315, label: 'North-West' }
];

const WWR_CANDIDATES = [0.10, 0.15, 0.20, 0.25];

/**
 * Calculates physically valid glazing window area based on shelter shape and WWR ratio
 */
function calculateShapeWindowArea(shape, WWR, dimensions = {}, openings = {}) {
  const normShape = (shape || 'rectangle').toLowerCase().trim();

  if (normShape === 'rectangle' || normShape === 'rectangular') {
    const L = Number(dimensions.length || dimensions.L || 6.0);
    const W = Number(dimensions.width || dimensions.W || 4.0);
    const H = Number(dimensions.height || dimensions.wallHeight || dimensions.H || 2.8);
    const roofAngle = Number(dimensions.roofAngle || 25);
    const grossWallArea = 2 * (L + W) * H;
    const ridgeH = (W / 2) * Math.tan((roofAngle * Math.PI) / 180);
    const gableTriangleArea = 2 * (0.5 * W * ridgeH);
    const totalVerticalWallArea = grossWallArea + gableTriangleArea;

    return Number((WWR * totalVerticalWallArea).toFixed(2));
  } else if (normShape === 'a-frame' || normShape === 'aframe') {
    const W = Number(dimensions.width || dimensions.W || 5.0);
    const H = Number(dimensions.ridgeHeight || dimensions.height || dimensions.H || 4.0);
    const endWallGrossArea = W * H; // 2 triangular end walls = W * H

    return Number((WWR * endWallGrossArea).toFixed(2));
  } else if (normShape === 'quonset') {
    const W = Number(dimensions.width || dimensions.W || 4.5);
    const R = W / 2;
    const endWallsGrossArea = Math.PI * R * R; // 2 semicircular end walls = PI * R^2

    return Number((WWR * endWallsGrossArea).toFixed(2));
  } else if (normShape === 'dome') {
    // Dome geometry does not support variable vertical wall WWR safely in current model
    return Number(openings.windowArea || 2.5);
  }

  return Number(openings.windowArea || 2.5);
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
 * Normalizes multi-objective metrics into a transparent 100-point Design Optimization Score
 */
function calculateDesignOptimizationScore(candidates, comfortSettings) {
  // Extract ranges across all candidates for min-max normalization
  const totalEnergies = candidates.map(c => c.metrics.heatingRequirement + (c.metrics.coolingRequirement || 0));
  const tempRanges = candidates.map(c => c.metrics.maxIndoorTemp - c.metrics.minIndoorTemp);
  const solarGains = candidates.map(c => c.metrics.totalSolarGain);

  const minEnergy = Math.min(...totalEnergies);
  const maxEnergy = Math.max(...totalEnergies);

  const minRange = Math.min(...tempRanges);
  const maxRange = Math.max(...tempRanges);

  const minSolar = Math.min(...solarGains);
  const maxSolar = Math.max(...solarGains);

  return candidates.map(cand => {
    const m = cand.metrics;
    const dh = cand.degreeHours;

    // 1. Thermal Comfort (50 Points)
    const comfortScore = Math.min(50, Math.max(0, (m.comfortPercentage / 100) * 50));

    // 2. Energy Performance (25 Points) - Relative normalization (lower demand = higher score)
    const totalEnergy = m.heatingRequirement + (m.coolingRequirement || 0);
    let energyScore = 25;
    if (maxEnergy > minEnergy) {
      energyScore = Math.min(25, Math.max(0, 25 * (1 - (totalEnergy - minEnergy) / (maxEnergy - minEnergy))));
    }

    // 3. Temperature Stability (15 Points) - Lower indoor temp fluctuation = higher score
    const candRange = m.maxIndoorTemp - m.minIndoorTemp;
    let stabilityScore = 15;
    if (maxRange > minRange) {
      stabilityScore = Math.min(15, Math.max(0, 15 * (1 - (candRange - minRange) / (maxRange - minRange))));
    }

    // 4. Useful Passive Solar (10 Points) - Reward passive solar, penalized if causing overheating
    let rawSolarScore = 10;
    if (maxSolar > minSolar) {
      rawSolarScore = Math.min(10, Math.max(0, 10 * ((m.totalSolarGain - minSolar) / (maxSolar - minSolar))));
    }
    // Overheating penalty factor
    const overheatingPenalty = dh.hoursTooHot > 0 ? Math.max(0, 1 - (dh.hoursTooHot / 24)) : 1.0;
    const solarScore = Math.min(10, Math.max(0, rawSolarScore * overheatingPenalty));

    const designScore = Number((comfortScore + energyScore + stabilityScore + solarScore).toFixed(1));

    return {
      ...cand,
      scoreBreakdown: {
        comfortScore: Number(comfortScore.toFixed(1)),
        energyScore: Number(energyScore.toFixed(1)),
        stabilityScore: Number(stabilityScore.toFixed(1)),
        solarScore: Number(solarScore.toFixed(1)),
        designScore
      },
      fitnessScore: designScore
    };
  });
}

/**
 * Generates deterministic engineering justification text for the winning design
 */
function generateOptimizationExplanation(winning, baseline, shape) {
  const wConfig = winning.config;
  const bConfig = baseline.config;
  const wMetrics = winning.metrics;
  const bMetrics = baseline.metrics;
  const wDH = winning.degreeHours;

  let explanation = `The climate-adaptive optimizer identified an optimal design configuration with a Relative Design Score of ${winning.fitnessScore}/100. `;

  const orientationText = `${wConfig.orientation}° (${ORIENTATIONS.find(o => o.deg === wConfig.orientation)?.label || 'South'})`;
  explanation += `Orienting the shelter towards ${orientationText} `;

  if (wMetrics.totalSolarGain > bMetrics.totalSolarGain && wDH.hoursTooHot === 0) {
    explanation += `enhanced useful passive solar heat capture by ${(wMetrics.totalSolarGain - bMetrics.totalSolarGain).toFixed(1)} kWh without triggering summer/midday overheating. `;
  } else if (wDH.hoursTooHot < baseline.degreeHours.hoursTooHot) {
    explanation += `mitigated excessive solar radiation exposure, reducing overheating by ${baseline.degreeHours.hoursTooHot - wDH.hoursTooHot} hours. `;
  } else {
    explanation += `optimized directional solar radiation alignment across seasonal sun vectors. `;
  }

  if (shape === 'dome') {
    explanation += `WWR optimization was kept fixed for the dome archetype. `;
  } else {
    const WWRPercent = Math.round(wConfig.wwr * 100);
    explanation += `A Window-to-Wall Ratio (WWR) of ${WWRPercent}% (${wConfig.windowArea} m²) balanced daylighting requirements with envelope thermal conduction. `;
  }

  const thickMM = Math.round(wConfig.insulationThickness * 1000);
  explanation += `Selecting a ${thickMM} mm wall insulation layer yielded a total thermal resistance R-insulation of ${(wConfig.insulationThickness / (wConfig.insulationConductivity || 0.035)).toFixed(2)} m²·K/W, `;

  if (wMetrics.comfortPercentage > bMetrics.comfortPercentage) {
    const diff = (wMetrics.comfortPercentage - bMetrics.comfortPercentage).toFixed(1);
    explanation += `improving thermal comfort by +${diff}% over the baseline design.`;
  } else if (wMetrics.heatingRequirement < bMetrics.heatingRequirement) {
    const diff = (bMetrics.heatingRequirement - wMetrics.heatingRequirement).toFixed(1);
    explanation += `reducing 24-hour heating energy demand by ${diff} kWh.`;
  } else {
    explanation += `maintaining stable interior thermal equilibrium.`;
  }

  return explanation;
}

/**
 * Main Climate-Adaptive Design Optimizer entry point
 */
function runDesignOptimization({
  baseSimulation,
  shelter,
  climateDataset,
  comfortSettings = { minComfortTemp: 18, maxComfortTemp: 24 },
  io = null,
  socketId = null
}) {
  const activeShelter = shelter || baseSimulation?.shelter;
  const activeClimate = climateDataset || baseSimulation?.climateDataset;

  if (!activeShelter || !activeClimate) {
    throw new Error('Base shelter design and target climate dataset are required for design optimization.');
  }

  const shape = (activeShelter.shape || activeShelter.design?.shape || 'rectangle').toLowerCase().trim();
  const dimensions = activeShelter.geometry || activeShelter.dimensions || {};
  const openings = activeShelter.openings || {};
  const materials = activeShelter.materials || {};
  const winningInsulation = materials.insulationMaterial;

  // 1. Determine Wall Insulation Thickness Candidates
  const thicknessOptions = getMaterialThicknesses(winningInsulation);

  // 2. Determine WWR Candidates based on shape validity
  const isWWRSupported = (shape !== 'dome');
  const wwrList = isWWRSupported ? WWR_CANDIDATES : [openings.windowArea ? openings.windowArea / (dimensions.width * dimensions.height || 20) : 0.15];

  const candidateCombinations = [];

  ORIENTATIONS.forEach(orient => {
    wwrList.forEach(wwrVal => {
      thicknessOptions.forEach(thickVal => {
        const calculatedWinArea = isWWRSupported
          ? calculateShapeWindowArea(shape, wwrVal, dimensions, openings)
          : (openings.windowArea || 2.5);

        candidateCombinations.push({
          orientation: orient.deg,
          orientationLabel: orient.label,
          wwr: isWWRSupported ? wwrVal : null,
          windowArea: calculatedWinArea,
          insulationThickness: thickVal,
          insulationConductivity: winningInsulation?.thermalConductivity || 0.035
        });
      });
    });
  });

  const totalCandidates = candidateCombinations.length;
  console.log(`[Design Optimizer] Evaluating ${totalCandidates} climate-adaptive variants for ${shape.toUpperCase()}...`);

  // Evaluate Baseline candidate first
  const baseInsThick = activeShelter.geometry?.insulationThickness || winningInsulation?.thicknessDefault || 0.10;
  const baseOrientation = activeShelter.design?.orientation || 180;
  const baseWinArea = openings.windowArea || 2.5;

  const baselineCandidateShelter = {
    ...activeShelter,
    design: { ...activeShelter.design, orientation: baseOrientation },
    openings: { ...activeShelter.openings, windowArea: baseWinArea, openingOrientation: baseOrientation },
    geometry: { ...activeShelter.geometry, insulationThickness: baseInsThick }
  };

  const baselineSim = runThermalSimulation({
    shelter: baselineCandidateShelter,
    climateDataset: activeClimate,
    comfortSettings
  });
  const baselineDH = computeDegreeHours(baselineSim.timeSeries, comfortSettings.minComfortTemp, comfortSettings.maxComfortTemp);

  const baselineRecord = {
    config: {
      orientation: baseOrientation,
      wwr: isWWRSupported && dimensions.length ? Number((baseWinArea / (2 * (dimensions.length + dimensions.width) * dimensions.height)).toFixed(2)) : 0.15,
      windowArea: baseWinArea,
      insulationThickness: baseInsThick,
      insulationConductivity: winningInsulation?.thermalConductivity || 0.035
    },
    metrics: baselineSim.metrics,
    degreeHours: baselineDH
  };

  // Evaluate all candidates
  const evaluatedCandidates = [];

  candidateCombinations.forEach((cand, idx) => {
    // Clone shelter and mutate ONLY permitted design variables
    const testShelter = {
      ...activeShelter,
      design: {
        ...activeShelter.design,
        orientation: cand.orientation
      },
      openings: {
        ...activeShelter.openings,
        windowArea: cand.windowArea,
        openingOrientation: cand.orientation
      },
      insulationThickness: cand.insulationThickness,
      geometry: {
        ...activeShelter.geometry,
        insulationThickness: cand.insulationThickness,
        wallThickness: activeShelter.geometry?.wallThickness || materials.wallMaterial?.thicknessDefault || 0.25,
        roofThickness: activeShelter.geometry?.roofThickness || materials.roofMaterial?.thicknessDefault || 0.20,
        floorThickness: activeShelter.geometry?.floorThickness || materials.floorMaterial?.thicknessDefault || 0.15
      }
    };
    delete testShelter.calculatedGeometry;

    const simRes = runThermalSimulation({
      shelter: testShelter,
      climateDataset: activeClimate,
      comfortSettings
    });

    const dh = computeDegreeHours(simRes.timeSeries, comfortSettings.minComfortTemp, comfortSettings.maxComfortTemp);

    // Calculate cooling requirement if interior gets warm
    const estimatedCoolingRequirement = dh.hotDegreeHours > 0 ? Number((dh.hotDegreeHours * 0.05).toFixed(2)) : 0;

    const record = {
      candidateIndex: idx + 1,
      config: cand,
      metrics: {
        ...simRes.metrics,
        coolingRequirement: estimatedCoolingRequirement
      },
      degreeHours: dh,
      componentBreakdown: simRes.componentBreakdown,
      testShelter
    };

    evaluatedCandidates.push(record);

    if (io && socketId && (idx % Math.max(1, Math.floor(totalCandidates / 10)) === 0 || idx === totalCandidates - 1)) {
      const progressPercent = Math.round(((idx + 1) / totalCandidates) * 100);
      io.to(socketId).emit('optimization:progress', {
        method: 'Grid Search',
        progressPercent,
        evaluatedCount: idx + 1,
        totalCandidates,
        currentOrientation: cand.orientation,
        currentWWR: cand.wwr,
        currentThickness: cand.insulationThickness
      });
    }
  });

  // Calculate scores
  const scoredCandidates = calculateDesignOptimizationScore(evaluatedCandidates, comfortSettings);
  scoredCandidates.sort((a, b) => b.fitnessScore - a.fitnessScore);

  const winner = scoredCandidates[0];

  // Calculate baseline score using same formula
  const scoredBaselineList = calculateDesignOptimizationScore([baselineRecord, ...evaluatedCandidates], comfortSettings);
  const scoredBaseline = scoredBaselineList[0];

  const explanation = generateOptimizationExplanation(winner, baselineRecord, shape);

  const beforeAfter = {
    before: {
      orientation: `${baselineRecord.config.orientation}°`,
      wwr: baselineRecord.config.wwr ? `${Math.round(baselineRecord.config.wwr * 100)}%` : 'Fixed',
      windowArea: `${baselineRecord.config.windowArea} m²`,
      insulationThickness: `${Math.round(baselineRecord.config.insulationThickness * 1000)} mm`,
      insulationRValue: `${(baselineRecord.config.insulationThickness / baselineRecord.config.insulationConductivity).toFixed(2)} m²K/W`,
      comfortPercentage: `${baselineRecord.metrics.comfortPercentage}%`,
      minIndoorTemp: `${baselineRecord.metrics.minIndoorTemp} °C`,
      maxIndoorTemp: `${baselineRecord.metrics.maxIndoorTemp} °C`,
      avgIndoorTemp: `${baselineRecord.metrics.avgIndoorTemp} °C`,
      hoursTooCold: baselineRecord.degreeHours.hoursTooCold,
      hoursTooHot: baselineRecord.degreeHours.hoursTooHot,
      coldDegreeHours: baselineRecord.degreeHours.coldDegreeHours,
      hotDegreeHours: baselineRecord.degreeHours.hotDegreeHours,
      totalHeatLoss: `${baselineRecord.metrics.totalHeatLoss} kWh`,
      heatingRequirement: `${baselineRecord.metrics.heatingRequirement} kWh`,
      coolingRequirement: `${baselineRecord.metrics.coolingRequirement || 0} kWh`,
      score: scoredBaseline.scoreBreakdown.designScore
    },
    after: {
      orientation: `${winner.config.orientation}° (${winner.config.orientationLabel})`,
      wwr: winner.config.wwr ? `${Math.round(winner.config.wwr * 100)}%` : 'Fixed',
      windowArea: `${winner.config.windowArea} m²`,
      insulationThickness: `${Math.round(winner.config.insulationThickness * 1000)} mm`,
      insulationRValue: `${(winner.config.insulationThickness / winner.config.insulationConductivity).toFixed(2)} m²K/W`,
      comfortPercentage: `${winner.metrics.comfortPercentage}%`,
      minIndoorTemp: `${winner.metrics.minIndoorTemp} °C`,
      maxIndoorTemp: `${winner.metrics.maxIndoorTemp} °C`,
      avgIndoorTemp: `${winner.metrics.avgIndoorTemp} °C`,
      hoursTooCold: winner.degreeHours.hoursTooCold,
      hoursTooHot: winner.degreeHours.hoursTooHot,
      coldDegreeHours: winner.degreeHours.coldDegreeHours,
      hotDegreeHours: winner.degreeHours.hotDegreeHours,
      totalHeatLoss: `${winner.metrics.totalHeatLoss} kWh`,
      heatingRequirement: `${winner.metrics.heatingRequirement} kWh`,
      coolingRequirement: `${winner.metrics.coolingRequirement || 0} kWh`,
      score: winner.scoreBreakdown.designScore
    }
  };

  return {
    inheritedConfiguration: {
      wallMaterial: materials.wallMaterial?.name,
      insulationMaterial: materials.insulationMaterial?.name,
      roofMaterial: materials.roofMaterial?.name,
      windowMaterial: materials.windowMaterial?.name,
      doorMaterial: materials.doorMaterial?.name,
      floorMaterial: materials.floorMaterial?.name,
      shape,
      dimensions
    },
    variables: {
      orientations: ORIENTATIONS.map(o => o.deg),
      wwrs: isWWRSupported ? WWR_CANDIDATES : ['Fixed'],
      selectedMaterialThicknessOptions: thicknessOptions,
      wwrSupported: isWWRSupported
    },
    evaluatedCount: totalCandidates,
    baseline: baselineRecord,
    winner,
    topCandidates: scoredCandidates.slice(0, 5).map((cand, i) => ({ ...cand, rank: i + 1 })),
    scoreBreakdown: winner.scoreBreakdown,
    beforeAfter,
    explanation
  };
}

module.exports = {
  runDesignOptimization,
  calculateShapeWindowArea,
  ORIENTATIONS,
  WWR_CANDIDATES
};
