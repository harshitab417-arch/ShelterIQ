/**
 * Optimization Engine - Genetic Algorithm Module
 */

const { runThermalSimulation } = require('../physics/simulationEngine');
const { getMaterialThicknesses } = require('../physics/materialDatabase');

/**
 * Execute Genetic Algorithm design search
 */
async function runGeneticAlgorithm({
  baseShelter,
  climateDataset,
  materialsList = [],
  objectiveWeights = { comfortWeight: 0.5, heatLossWeight: 0.3, solarGainWeight: 0.2 },
  comfortSettings = { minComfortTemp: 18, maxComfortTemp: 24 },
  popSize = 16,
  generations = 10,
  mutationRate = 0.15,
  io = null,
  socketId = null
}) {
  const wallMaterials = materialsList.filter(m => m.category === 'Wall');
  const roofMaterials = materialsList.filter(m => m.category === 'Roof');
  const insMaterials = materialsList.filter(m => m.category === 'Insulation');

  const wallMatList = wallMaterials.length > 0 ? wallMaterials : [baseShelter.materials.wallMaterial];
  const roofMatList = roofMaterials.length > 0 ? roofMaterials : [baseShelter.materials.roofMaterial];
  const insMatList = insMaterials.length > 0 ? insMaterials : [baseShelter.materials.insulationMaterial];

  const orientations = [90, 135, 180, 225, 270];
  const windowAreas = [1.5, 2.0, 2.5, 3.5, 4.5];

  // Helper to create random chromosome
  const createRandomChromosome = () => {
    const insMatIdx = Math.floor(Math.random() * insMatList.length);
    const insMat = insMatList[insMatIdx];
    const thicknesses = getMaterialThicknesses(insMat);
    return {
      wallMatIdx: Math.floor(Math.random() * wallMatList.length),
      roofMatIdx: Math.floor(Math.random() * roofMatList.length),
      insMatIdx,
      orientIdx: Math.floor(Math.random() * orientations.length),
      thickIdx: Math.floor(Math.random() * thicknesses.length),
      winIdx: Math.floor(Math.random() * windowAreas.length)
    };
  };

  // Evaluate chromosome fitness
  const evaluateChromosome = (chromo) => {
    const wallMat = wallMatList[chromo.wallMatIdx % wallMatList.length];
    const roofMat = roofMatList[chromo.roofMatIdx % roofMatList.length];
    const insMat = insMatList[chromo.insMatIdx % insMatList.length];
    const orient = orientations[chromo.orientIdx % orientations.length];
    const windowArea = windowAreas[chromo.winIdx % windowAreas.length];

    const matThicknesses = getMaterialThicknesses(insMat);
    const thick = matThicknesses[chromo.thickIdx % matThicknesses.length];

    const testShelter = {
      ...baseShelter,
      design: { ...baseShelter.design, orientation: orient },
      openings: { ...baseShelter.openings, windowArea },
      geometry: {
        ...baseShelter.geometry,
        insulationThickness: thick,
        wallThickness: wallMat?.thicknessDefault || baseShelter.geometry?.wallThickness || 0.25,
        roofThickness: roofMat?.thicknessDefault || baseShelter.geometry?.roofThickness || 0.20
      },
      materials: {
        ...baseShelter.materials,
        wallMaterial: wallMat,
        roofMaterial: roofMat,
        insulationMaterial: insMat
      }
    };

    const simRes = runThermalSimulation({ shelter: testShelter, climateDataset, comfortSettings });
    const m = simRes.metrics;

    const comfortScore = m.comfortPercentage;
    const heatLossPenalty = (m.totalHeatLoss / 200) * 100;
    const solarScore = (m.totalSolarGain / 50) * 100;

    const fitness = Number((
      objectiveWeights.comfortWeight * comfortScore -
      objectiveWeights.heatLossWeight * heatLossPenalty +
      objectiveWeights.solarGainWeight * solarScore
    ).toFixed(2));

    return {
      chromosome: chromo,
      fitnessScore: fitness,
      comfortPercentage: m.comfortPercentage,
      avgIndoorTemp: m.avgIndoorTemp,
      totalHeatLoss: m.totalHeatLoss,
      totalSolarGain: m.totalSolarGain,
      shelterConfig: {
        wallMaterialName: wallMat.name,
        roofMaterialName: roofMat.name,
        insulationMaterialName: insMat.name,
        insulationThickness: thick,
        orientation: orient,
        windowArea: winArea
      }
    };
  };

  // Initialize Population
  let population = Array.from({ length: popSize }, () => createRandomChromosome());
  let globalBest = null;

  for (let gen = 1; gen <= generations; gen++) {
    const evaluated = population.map(c => evaluateChromosome(c));
    evaluated.sort((a, b) => b.fitnessScore - a.fitnessScore);

    if (!globalBest || evaluated[0].fitnessScore > globalBest.fitnessScore) {
      globalBest = evaluated[0];
    }

    if (io && socketId) {
      const progressPercent = Math.round((gen / generations) * 100);
      io.to(socketId).emit('optimization:progress', {
        method: 'Genetic Algorithm',
        generation: gen,
        maxGenerations: generations,
        progressPercent,
        evaluatedCount: gen * popSize,
        currentBestScore: globalBest.fitnessScore,
        currentBestDesign: globalBest
      });
    }

    // Selection & Next Generation Crossover/Mutation
    const newPop = [evaluated[0].chromosome, evaluated[1].chromosome]; // Elitism (keep top 2)

    while (newPop.length < popSize) {
      // Tournament selection
      const parentA = evaluated[Math.floor(Math.random() * (popSize / 2))].chromosome;
      const parentB = evaluated[Math.floor(Math.random() * (popSize / 2))].chromosome;

      // Single-point Crossover
      const child = {
        wallMatIdx: Math.random() > 0.5 ? parentA.wallMatIdx : parentB.wallMatIdx,
        roofMatIdx: Math.random() > 0.5 ? parentA.roofMatIdx : parentB.roofMatIdx,
        insMatIdx: Math.random() > 0.5 ? parentA.insMatIdx : parentB.insMatIdx,
        orientIdx: Math.random() > 0.5 ? parentA.orientIdx : parentB.orientIdx,
        thickIdx: Math.random() > 0.5 ? parentA.thickIdx : parentB.thickIdx,
        winIdx: Math.random() > 0.5 ? parentA.winIdx : parentB.winIdx
      };

      // Mutation
      if (Math.random() < mutationRate) child.wallMatIdx = Math.floor(Math.random() * wallMatList.length);
      if (Math.random() < mutationRate) child.orientIdx = Math.floor(Math.random() * orientations.length);
      if (Math.random() < mutationRate) child.thickIdx = Math.floor(Math.random() * thicknesses.length);

      newPop.push(child);
    }

    population = newPop;
  }

  // Final evaluation of best population
  const finalEvaluated = population.map(c => evaluateChromosome(c));
  finalEvaluated.sort((a, b) => b.fitnessScore - a.fitnessScore);

  return {
    method: 'Genetic Algorithm',
    generationsRun: generations,
    populationSize: popSize,
    totalEvaluated: generations * popSize,
    topCandidates: finalEvaluated.slice(0, 5).map((item, idx) => ({ ...item, rank: idx + 1 })),
    bestCandidate: finalEvaluated[0]
  };
}

module.exports = {
  runGeneticAlgorithm
};
