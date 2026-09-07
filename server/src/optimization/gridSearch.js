/**
 * Optimization Engine - Grid Search Module
 */

const { runThermalSimulation } = require('../physics/simulationEngine');

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
    orientations: [90, 135, 180, 225], // deg (180=South)
    insulationThicknesses: [0.05, 0.10, 0.15, 0.20], // meters
    windowAreas: [1.5, 2.5, 4.0] // m²
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

  const candidateCombinations = [];

  wallMatList.forEach(wMat => {
    roofMatList.forEach(rMat => {
      insMatList.forEach(iMat => {
        searchSpace.orientations.forEach(orient => {
          searchSpace.insulationThicknesses.forEach(insThick => {
            searchSpace.windowAreas.forEach(wArea => {
              candidateCombinations.push({
                wallMaterial: wMat,
                roofMaterial: rMat,
                insulationMaterial: iMat,
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
        orientation: candidate.orientation
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

    const m = simRes.metrics;
    
    // Fitness multi-objective scoring formula
    // Higher comfort %, lower heat loss, higher solar gain
    const comfortScore = m.comfortPercentage; // 0 to 100
    const heatLossPenalty = (m.totalHeatLoss / 200) * 100; // normalized penalty
    const solarScore = (m.totalSolarGain / 50) * 100; // normalized reward

    const fitness = Number((
      objectiveWeights.comfortWeight * comfortScore -
      objectiveWeights.heatLossWeight * heatLossPenalty +
      objectiveWeights.solarGainWeight * solarScore
    ).toFixed(2));

    const record = {
      candidateIndex: idx + 1,
      fitnessScore: fitness,
      comfortPercentage: m.comfortPercentage,
      avgIndoorTemp: m.avgIndoorTemp,
      totalHeatLoss: m.totalHeatLoss,
      totalSolarGain: m.totalSolarGain,
      shelterConfig: {
        wallMaterialName: candidate.wallMaterial.name,
        roofMaterialName: candidate.roofMaterial.name,
        insulationMaterialName: candidate.insulationMaterial.name,
        insulationThickness: candidate.insulationThickness,
        orientation: candidate.orientation,
        windowArea: candidate.windowArea
      }
    };

    evaluatedResults.push(record);

    if (fitness > bestFitness) {
      bestFitness = fitness;
      bestCandidate = record;
    }

    // Socket.IO progress update every 10% or at key milestones
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
    objectiveWeights,
    topCandidates: evaluatedResults.slice(0, 5).map((item, idx) => ({ ...item, rank: idx + 1 })),
    bestCandidate: evaluatedResults[0]
  };
}

module.exports = {
  runGridSearch
};
