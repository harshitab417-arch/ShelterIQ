/**
 * Optimization Engine - Grid Search Module
 * Climate-sensitive fitness with shape and material prediction
 */

const { runThermalSimulation } = require('../physics/simulationEngine');

/**
 * Climate-driven fitness evaluator:
 * Evaluates candidate performance based on climate zone characteristics
 */
function calculateClimateFitness(metrics, testShelter, climateDataset) {
  const dataPoints = climateDataset?.dataPoints || [];
  const temps = dataPoints.map(p => p.ambientTemperature);
  const avgAmbient = temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 0;
  const minAmbient = temps.length > 0 ? Math.min(...temps) : -10;
  const maxAmbient = temps.length > 0 ? Math.max(...temps) : 25;

  const { avgIndoorTemp, minIndoorTemp, maxIndoorTemp, totalHeatLoss, totalSolarGain, comfortPercentage } = metrics;
  const wallMat = testShelter.materials.wallMaterial;
  const roofMat = testShelter.materials.roofMaterial;
  const insMat = testShelter.materials.insulationMaterial;
  const shape = testShelter.design.shape;

  let score = 0;

  if (avgAmbient < 5) {
    // === ZONE 1: EXTREME COLD HIGH-ALTITUDE (e.g., Leh, Kargil, Gulmarg, Siachen) ===
    // Goal: Raise indoor temp, minimize envelope heat loss, maximize passive solar heat
    score += (avgIndoorTemp - avgAmbient) * 4.0;
    score += (minIndoorTemp - minAmbient) * 2.5;
    score -= totalHeatLoss * 0.35;
    score += totalSolarGain * 0.7;
    score += comfortPercentage * 1.5;

    // Shape preference: Dome or Octagonal reduce thermal envelope area
    if (shape === 'Dome') score += 25;
    else if (shape === 'Octagonal') score += 18;
    else if (shape === 'Rectangular') score += 10;

    // Material thermal resistance preference (lower k is better in cold)
    score += (0.1 / Math.max(0.01, wallMat.thermalConductivity || 0.5)) * 3;
    score += (0.1 / Math.max(0.01, roofMat.thermalConductivity || 0.5)) * 3;
    score += (0.1 / Math.max(0.01, insMat.thermalConductivity || 0.035)) * 3;

  } else if (avgAmbient >= 5 && avgAmbient < 18) {
    // === ZONE 2: COOL / MOUNTAIN TEMPERATE (e.g., Shimla, Manali, Srinagar, Shillong) ===
    const tempDev = Math.abs(avgIndoorTemp - 20);
    score += (20 - tempDev) * 4.0;
    score += comfortPercentage * 1.0;
    score -= totalHeatLoss * 0.15;
    score += totalSolarGain * 0.4;

    if (shape === 'Rectangular') score += 20;
    else if (shape === 'Octagonal') score += 15;
    else if (shape === 'Dome') score += 12;

  } else if (avgAmbient >= 18 && avgAmbient < 28) {
    // === ZONE 3: TEMPERATE / MODERATE (e.g., Pune, Bangalore, Dehradun) ===
    const tempDev = Math.abs(avgIndoorTemp - 22);
    score += (25 - tempDev) * 5.0;
    score += comfortPercentage * 1.2;

    if (shape === 'Rectangular') score += 22;
    else if (shape === 'L-Shape') score += 18;

  } else {
    // === ZONE 4: HOT-DRY / TROPICAL (e.g., Jaisalmer, Delhi, Chennai, Nagpur) ===
    // Goal: Keep indoor cool, penalize solar overheating, reward thermal mass & low absorptivity
    score += (35 - avgIndoorTemp) * 4.5;
    score -= Math.max(0, maxIndoorTemp - 26) * 3.5;
    score -= totalSolarGain * 0.5;

    // Reward high thermal mass (density * specific heat)
    const wallMass = (wallMat.density || 1000) * (wallMat.specificHeat || 900);
    score += (wallMass / 1e6) * 8.0;

    // Reward low solar absorptivity (reflective roofs/walls):
    score += (1.0 - (roofMat.solarAbsorptivity || 0.7)) * 20;

    if (shape === 'L-Shape') score += 25;
    else if (shape === 'Rectangular') score += 20;
  }

  return Number(score.toFixed(2));
}

/**
 * Perform Grid Search Optimization over parameter design space
 */
async function runGridSearch({
  baseShelter,
  climateDataset,
  materialsList = [],
  objectiveWeights = { comfortWeight: 0.5, heatLossWeight: 0.3, solarGainWeight: 0.2 },
  comfortSettings = { minComfortTemp: 18, maxComfortTemp: 24 },
  searchSpace = {
    orientations: [180],
    insulationThicknesses: [0.10, 0.15],
    windowAreas: [baseShelter?.openings?.windowArea || 2.5],
    shapes: ['Rectangular', 'Dome', 'L-Shape', 'Octagonal']
  },
  io = null,
  socketId = null
}) {
  const wallMaterials = materialsList.filter(m => m.category === 'Wall');
  const roofMaterials = materialsList.filter(m => m.category === 'Roof');
  const insMaterials = materialsList.filter(m => m.category === 'Insulation');

  const wallMatList = wallMaterials.length > 0 ? wallMaterials : [baseShelter.materials.wallMaterial];
  const roofMatList = roofMaterials.length > 0 ? roofMaterials : [baseShelter.materials.roofMaterial];
  const insMatList = insMaterials.length > 0 ? insMaterials : [baseShelter.materials.insulationMaterial];

  const shapes = searchSpace.shapes || ['Rectangular', 'Dome', 'L-Shape', 'Octagonal'];

  const candidateCombinations = [];

  wallMatList.forEach(wMat => {
    roofMatList.forEach(rMat => {
      insMatList.forEach(iMat => {
        shapes.forEach(shape => {
          searchSpace.orientations.forEach(orient => {
            searchSpace.insulationThicknesses.forEach(insThick => {
              searchSpace.windowAreas.forEach(wArea => {
                candidateCombinations.push({
                  wallMaterial: wMat,
                  roofMaterial: rMat,
                  insulationMaterial: iMat,
                  shape,
                  orientation: orient,
                  insulationThickness: insThick,
                  windowArea: wArea
                });
              });
            });
          });
        });
      });
    });
  });

  const totalCandidates = candidateCombinations.length;
  console.log(`[Grid Search] Evaluating ${totalCandidates} design candidate combinations...`);

  const evaluatedResults = [];
  let bestFitness = -Infinity;
  let bestCandidate = null;

  for (let idx = 0; idx < totalCandidates; idx++) {
    const candidate = candidateCombinations[idx];

    // Construct test shelter candidate
    const testShelter = {
      ...baseShelter,
      design: {
        ...baseShelter.design,
        orientation: candidate.orientation,
        shape: candidate.shape
      },
      openings: {
        ...baseShelter.openings,
        windowArea: candidate.windowArea
      },
      geometry: {
        ...baseShelter.geometry,
        wallThickness: candidate.insulationThickness + 0.15
      },
      materials: {
        ...baseShelter.materials,
        wallMaterial: candidate.wallMaterial,
        roofMaterial: candidate.roofMaterial,
        insulationMaterial: candidate.insulationMaterial
      }
    };

    const simRes = runThermalSimulation({
      shelter: testShelter,
      climateDataset,
      comfortSettings
    });

    const fitness = calculateClimateFitness(simRes.metrics, testShelter, climateDataset);

    const record = {
      candidateIndex: idx + 1,
      fitnessScore: fitness,
      comfortPercentage: simRes.metrics.comfortPercentage,
      avgIndoorTemp: simRes.metrics.avgIndoorTemp,
      totalHeatLoss: simRes.metrics.totalHeatLoss,
      totalSolarGain: simRes.metrics.totalSolarGain,
      shelterConfig: {
        wallMaterial: candidate.wallMaterial,
        roofMaterial: candidate.roofMaterial,
        insulationMaterial: candidate.insulationMaterial,
        wallMaterialName: candidate.wallMaterial.name,
        roofMaterialName: candidate.roofMaterial.name,
        insulationMaterialName: candidate.insulationMaterial.name,
        insulationThickness: candidate.insulationThickness,
        orientation: candidate.orientation,
        windowArea: candidate.windowArea,
        shape: candidate.shape
      }
    };

    evaluatedResults.push(record);

    if (fitness > bestFitness) {
      bestFitness = fitness;
      bestCandidate = record;
    }

    if (io && socketId && (idx % Math.max(1, Math.floor(totalCandidates / 10)) === 0 || idx === totalCandidates - 1)) {
      const progressPercent = Math.round(((idx + 1) / totalCandidates) * 100);
      io.to(socketId).emit('optimization:progress', {
        method: 'Grid Search',
        progressPercent,
        evaluatedCount: idx + 1,
        totalCandidates,
        currentBestScore: bestFitness,
        currentBestDesign: bestCandidate
      });
    }
  }

  // Rank top candidates
  evaluatedResults.sort((a, b) => b.fitnessScore - a.fitnessScore);

  return {
    method: 'Grid Search',
    totalEvaluated: totalCandidates,
    topCandidates: evaluatedResults.slice(0, 5).map((item, idx) => ({ ...item, rank: idx + 1 })),
    bestCandidate: evaluatedResults[0]
  };
}

module.exports = {
  runGridSearch,
  calculateClimateFitness
};
