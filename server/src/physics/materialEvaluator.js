/**
 * Automatic Material Evaluator & Multi-Criteria Decision Support Engine
 */

const { runThermalSimulation } = require('./simulationEngine');
const { calculateGeometry, createEquivalentDimensions } = require('./shapeCalculator');
const {
  WALL_MATERIALS,
  INSULATION_MATERIALS,
  ROOF_MATERIALS,
  WINDOW_MATERIALS,
  FLOOR_MATERIAL_DEFAULT,
  DOOR_MATERIAL_DEFAULT
} = require('./materialDatabase');

/**
 * Normalizes thermal metrics to a 0–100 scale for multi-criteria scoring.
 */
function calculateNormalizedScores(metrics, comfortSettings = { minComfortTemp: 18, maxComfortTemp: 24 }) {
  // 1. Comfort Hours Score (0 to 100%)
  const comfortScore = Math.max(0, Math.min(100, metrics.comfortPercentage || 0));

  // 2. Heat Loss Score: Lower is better. 0 kWh -> 100pts, 200+ kWh -> 0pts
  const maxLossBaseline = 200; // kWh
  const heatLossScore = Math.max(0, Math.min(100, ((maxLossBaseline - (metrics.totalHeatLoss || 0)) / maxLossBaseline) * 100));

  // 3. Night Minimum Temperature Score: Higher min temp is safer in sub-zero climates.
  // Scale: -25°C -> 0pts, +15°C -> 100pts
  const minTemp = metrics.minIndoorTemp !== undefined ? metrics.minIndoorTemp : -10;
  const nightTempScore = Math.max(0, Math.min(100, ((minTemp + 25) / 40) * 100));

  // 4. Heating Requirement Score: Lower heating demand -> higher score
  const maxHeatingBaseline = 250; // kWh
  const heatingScore = Math.max(0, Math.min(100, ((maxHeatingBaseline - (metrics.heatingRequirement || 0)) / maxHeatingBaseline) * 100));

  // Weighted multi-criteria composite score (Prioritizing cold climate thermal retention & comfort)
  // 35% Comfort Hours, 25% Heat Loss reduction, 25% Night Cold Protection, 15% Auxiliary Energy Savings
  const compositeScore = Number((
    comfortScore * 0.35 +
    heatLossScore * 0.25 +
    nightTempScore * 0.25 +
    heatingScore * 0.15
  ).toFixed(1));

  return {
    compositeScore,
    comfortScore: Number(comfortScore.toFixed(1)),
    heatLossScore: Number(heatLossScore.toFixed(1)),
    nightTempScore: Number(nightTempScore.toFixed(1)),
    heatingScore: Number(heatingScore.toFixed(1))
  };
}

/**
 * Deterministically generates an engineering justification from simulation metrics.
 */
function generateDeterministicExplanation({ shape, geometry, best, runnerUp, climateDataset }) {
  const wall = best.wallMaterial.name;
  const ins = best.insulationMaterial.name;
  const roof = best.roofMaterial.name;
  const win = best.windowMaterial.name;
  const m = best.metrics;
  const s = best.scoreBreakdown;

  const loc = climateDataset?.location || climateDataset?.name || 'High-Altitude Region';
  const shapeTitle = shape.charAt(0).toUpperCase() + shape.slice(1);

  let explanation = `This ${shapeTitle} configuration was selected as the optimal thermal solution for ${loc} with an overall thermal score of ${s.compositeScore}/100. `;

  explanation += `During sub-zero night hours, it maintained a minimum indoor temperature of ${m.minIndoorTemp}°C and achieved ${m.comfortPercentage}% comfort hours inside the shelter. `;

  if (shape === 'dome') {
    explanation += `For the spherical curved envelope (${geometry.curvedEnvelopeArea} m²), ${wall} paired with ${ins} reduces radiative and convective heat loss while preventing thermal stratification. `;
  } else if (shape === 'a-frame') {
    explanation += `With steep roof planes dominating the exposed envelope (${geometry.roofArea} m²), ${roof} backed by ${ins} suppresses overhead heat dissipation into the cold sky. `;
  } else if (shape === 'quonset') {
    explanation += `The semi-cylindrical arch (${geometry.curvedEnvelopeArea} m²) insulated with ${ins} combined with ${wall} end-walls yields an optimal balance of thermal storage and low air infiltration. `;
  } else {
    explanation += `${wall} provides high volumetric thermal mass to store daytime solar gains and release heat after sunset, while ${ins} effectively suppresses conductive losses through the walls and roof. `;
  }

  explanation += `${win} captures high passive solar irradiance during daylight hours while minimizing conductive back-radiation. `;

  if (runnerUp) {
    const delta = (s.compositeScore - runnerUp.scoreBreakdown.compositeScore).toFixed(1);
    explanation += `This configuration reduced total 24-hour heat loss to ${m.totalHeatLoss} kWh, outperforming the #2 alternative by ${delta} score points.`;
  }

  return explanation;
}

/**
 * Main auto-evaluation function for a specific shelter shape and dimensions.
 */
function runAutoEvaluation({
  shape = 'rectangle',
  dimensions = {},
  openings = {},
  occupants = 4,
  climateDataset,
  comfortSettings = { minComfortTemp: 18, maxComfortTemp: 24 }
}) {
  const normShape = (shape || 'rectangle').toLowerCase().trim();

  // 1. Calculate Geometry ONCE for this shape and dimension set
  const calculatedGeometry = calculateGeometry(normShape, dimensions, openings);

  // Internal gains: 80W sensible heat per person + 100W baseline equipment
  const internalGainsWatts = (Number(occupants) || 4) * 80 + 100;

  const evaluatedConfigurations = [];

  // 2. Iterate through candidate material configurations
  for (const wallMat of WALL_MATERIALS) {
    for (const insMat of INSULATION_MATERIALS) {
      for (const roofMat of ROOF_MATERIALS) {
        for (const winMat of WINDOW_MATERIALS) {
          const shelterCandidate = {
            name: `${normShape.toUpperCase()} - ${wallMat.name}`,
            shape: normShape,
            geometry: { ...dimensions },
            calculatedGeometry,
            design: {
              shape: normShape,
              orientation: 180,
              roofType: normShape === 'rectangle' ? 'Gable' : normShape,
              roofAngle: dimensions.roofAngle || 25
            },
            openings: {
              windowCount: openings.windowCount || 2,
              windowArea: openings.windowArea || calculatedGeometry.glazingArea,
              doorCount: openings.doorCount || 1,
              doorArea: calculatedGeometry.doorArea,
              openingOrientation: openings.openingOrientation || 180
            },
            occupants: Number(occupants) || 4,
            _internalGainsWatts: internalGainsWatts,
            materials: {
              wallMaterial: wallMat,
              insulationMaterial: insMat,
              roofMaterial: roofMat,
              windowMaterial: winMat,
              doorMaterial: DOOR_MATERIAL_DEFAULT,
              floorMaterial: FLOOR_MATERIAL_DEFAULT
            }
          };

          try {
            const simResult = runThermalSimulation({
              shelter: shelterCandidate,
              climateDataset,
              comfortSettings
            });

            const scoreBreakdown = calculateNormalizedScores(simResult.metrics, comfortSettings);

            evaluatedConfigurations.push({
              wallMaterial: wallMat,
              insulationMaterial: insMat,
              roofMaterial: roofMat,
              windowMaterial: winMat,
              doorMaterial: DOOR_MATERIAL_DEFAULT,
              floorMaterial: FLOOR_MATERIAL_DEFAULT,
              metrics: simResult.metrics,
              componentBreakdown: simResult.componentBreakdown,
              scoreBreakdown,
              score: scoreBreakdown.compositeScore,
              _fullResult: simResult,
              shelterCandidate
            });
          } catch (err) {
            console.warn(`[AutoEval] Error on combination: ${err.message}`);
          }
        }
      }
    }
  }

  if (evaluatedConfigurations.length === 0) {
    throw new Error('Material auto-evaluation could not produce valid results. Check climate dataset and geometry.');
  }

  // 3. Rank configurations descending by composite score
  evaluatedConfigurations.sort((a, b) => b.score - a.score);

  const best = evaluatedConfigurations[0];
  const runnerUp = evaluatedConfigurations[1] || null;

  // Format Top 3 with complete aliases to prevent frontend-backend field mismatches
  const top3 = evaluatedConfigurations.slice(0, 3).map((item, idx) => ({
    rank: idx + 1,
    envelope: item.wallMaterial.name,
    wallMaterial: item.wallMaterial.name,
    insulation: item.insulationMaterial.name,
    insulationMaterial: item.insulationMaterial.name,
    roofMaterial: item.roofMaterial.name,
    glazing: item.windowMaterial.name,
    windowMaterial: item.windowMaterial.name,
    minNightTemp: item.metrics.minIndoorTemp,
    maxIndoorTemp: item.metrics.maxIndoorTemp,
    avgIndoorTemp: item.metrics.avgIndoorTemp,
    heatLoss: item.metrics.totalHeatLoss,
    totalHeatLoss: item.metrics.totalHeatLoss,
    heatingRequirement: item.metrics.heatingRequirement,
    comfortPercent: item.metrics.comfortPercentage,
    comfortPercentage: item.metrics.comfortPercentage,
    score: item.score,
    compositeScore: item.score,
    scoreBreakdown: item.scoreBreakdown
  }));

  const explanation = generateDeterministicExplanation({
    shape: normShape,
    geometry: calculatedGeometry,
    best,
    runnerUp,
    climateDataset
  });

  return {
    shape: normShape,
    geometry: calculatedGeometry,
    recommended: {
      rank: 1,
      materials: {
        wallMaterial: best.wallMaterial.name,
        insulationMaterial: best.insulationMaterial.name,
        roofMaterial: best.roofMaterial.name,
        windowMaterial: best.windowMaterial.name,
        doorMaterial: best.doorMaterial.name,
        floorMaterial: best.floorMaterial.name
      },
      materialObjects: {
        wallMaterial: best.wallMaterial,
        insulationMaterial: best.insulationMaterial,
        roofMaterial: best.roofMaterial,
        windowMaterial: best.windowMaterial,
        doorMaterial: best.doorMaterial,
        floorMaterial: best.floorMaterial
      },
      metrics: best.metrics,
      componentBreakdown: best.componentBreakdown,
      scoreBreakdown: best.scoreBreakdown,
      score: best.score,
      explanation,
      top3
    },
    top3,
    topConfigurations: top3,
    totalCombinationsEvaluated: evaluatedConfigurations.length,
    fullSimulationResult: best._fullResult,
    bestShelter: best.shelterCandidate
  };
}

/**
 * Fair Shape Comparison:
 * Evaluates all 4 shapes normalized to an equivalent usable floor area under identical climate.
 */
function compareAllShapes({
  targetFloorArea = 24.0,
  occupants = 4,
  openings = { windowCount: 2, windowArea: 2.5, doorCount: 1, openingOrientation: 180 },
  climateDataset,
  comfortSettings = { minComfortTemp: 18, maxComfortTemp: 24 }
}) {
  const shapes = ['rectangle', 'dome', 'a-frame', 'quonset'];
  const eqDimensions = createEquivalentDimensions(targetFloorArea);

  const comparisonResults = [];

  for (const shapeKey of shapes) {
    const dim = eqDimensions[shapeKey === 'a-frame' ? 'aframe' : shapeKey];
    const evalRes = runAutoEvaluation({
      shape: shapeKey,
      dimensions: dim,
      openings,
      occupants,
      climateDataset,
      comfortSettings
    });

    comparisonResults.push({
      shape: shapeKey,
      shapeTitle: shapeKey === 'a-frame' ? 'A-Frame' : shapeKey.charAt(0).toUpperCase() + shapeKey.slice(1),
      dimensions: dim,
      geometry: evalRes.geometry,
      recommendedMaterials: evalRes.recommended.materials,
      metrics: evalRes.recommended.metrics,
      score: evalRes.recommended.score,
      scoreBreakdown: evalRes.recommended.scoreBreakdown,
      explanation: evalRes.recommended.explanation
    });
  }

  // Sort comparison results by score descending
  comparisonResults.sort((a, b) => b.score - a.score);

  return {
    targetFloorArea,
    occupants,
    comparisonResults,
    winner: comparisonResults[0]
  };
}

module.exports = {
  runAutoEvaluation,
  compareAllShapes,
  calculateNormalizedScores
};
