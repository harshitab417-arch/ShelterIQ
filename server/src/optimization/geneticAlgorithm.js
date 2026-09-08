/**
 * Optimization Engine - Genetic Algorithm Module
 * Climate-sensitive fitness with shape prediction
 */

const { runThermalSimulation } = require('../physics/simulationEngine');

/**
 * Compute climate-adaptive objective weights from climate dataset
 */
function getClimateAdaptiveWeights(climateDataset, baseWeights) {
  const dataPoints = climateDataset?.dataPoints || [];
  if (dataPoints.length === 0) return baseWeights;

  const temps = dataPoints.map(p => p.ambientTemperature);
  const avgAmbient = temps.reduce((a, b) => a + b, 0) / temps.length;

  let comfortW = baseWeights.comfortWeight;
  let heatLossW = baseWeights.heatLossWeight;
  let solarW = baseWeights.solarGainWeight;

  if (avgAmbient < -15) {
    heatLossW = 0.55; comfortW = 0.35; solarW = 0.10;
  } else if (avgAmbient < -5) {
    heatLossW = 0.45; comfortW = 0.40; solarW = 0.15;
  } else if (avgAmbient < 10) {
    heatLossW = 0.35; comfortW = 0.45; solarW = 0.20;
  } else if (avgAmbient > 25) {
    heatLossW = 0.15; comfortW = 0.55; solarW = 0.30;
  }

  return { comfortWeight: comfortW, heatLossWeight: heatLossW, solarGainWeight: solarW };
}

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
  const thicknesses = [0.05, 0.10, 0.15, 0.20, 0.25];
  const windowAreas = [1.5, 2.0, 2.5, 3.5, 4.5];
  const shapes = ['Rectangular', 'Dome', 'L-Shape', 'Octagonal'];

  // Climate-adaptive weights
  const adaptiveWeights = getClimateAdaptiveWeights(climateDataset, objectiveWeights);

  // Dynamic normalization factors
  const dataPoints = climateDataset?.dataPoints || [];
  const temps = dataPoints.map(p => p.ambientTemperature);
  const avgAmbient = temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 0;
  const heatLossNormFactor = Math.max(100, 50 + Math.abs(avgAmbient) * 10);
  const solarNormFactor = Math.max(20, 50 - Math.abs(avgAmbient) * 0.5);

  // Helper to create random chromosome
  const createRandomChromosome = () => ({
    wallMatIdx: Math.floor(Math.random() * wallMatList.length),
    roofMatIdx: Math.floor(Math.random() * roofMatList.length),
    insMatIdx: Math.floor(Math.random() * insMatList.length),
    orientIdx: Math.floor(Math.random() * orientations.length),
    thickIdx: Math.floor(Math.random() * thicknesses.length),
    winIdx: Math.floor(Math.random() * windowAreas.length),
    shapeIdx: Math.floor(Math.random() * shapes.length)
  });

const { calculateClimateFitness } = require('./gridSearch');

  // Evaluate chromosome fitness
  const evaluateChromosome = (chromo) => {
    const wallMat = wallMatList[chromo.wallMatIdx];
    const roofMat = roofMatList[chromo.roofMatIdx];
    const insMat = insMatList[chromo.insMatIdx];
    const orient = orientations[chromo.orientIdx];
    const thick = thicknesses[chromo.thickIdx];
    const winArea = windowAreas[chromo.winIdx];
    const shape = shapes[chromo.shapeIdx];

    const testShelter = {
      ...baseShelter,
      design: { ...baseShelter.design, orientation: orient, shape },
      openings: { ...baseShelter.openings, windowArea: winArea },
      geometry: { ...baseShelter.geometry, wallThickness: thick + 0.15 },
      materials: {
        ...baseShelter.materials,
        wallMaterial: wallMat,
        roofMaterial: roofMat,
        insulationMaterial: insMat
      }
    };

    const simRes = runThermalSimulation({ shelter: testShelter, climateDataset, comfortSettings });
    const fitness = calculateClimateFitness(simRes.metrics, testShelter, climateDataset);

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
        wallMaterial: wallMat,
        roofMaterial: roofMat,
        insulationMaterial: insMat,
        insulationThickness: thick,
        orientation: orient,
        windowArea: winArea,
        shape
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
        winIdx: Math.random() > 0.5 ? parentA.winIdx : parentB.winIdx,
        shapeIdx: Math.random() > 0.5 ? parentA.shapeIdx : parentB.shapeIdx
      };

      // Mutation
      if (Math.random() < mutationRate) child.wallMatIdx = Math.floor(Math.random() * wallMatList.length);
      if (Math.random() < mutationRate) child.roofMatIdx = Math.floor(Math.random() * roofMatList.length);
      if (Math.random() < mutationRate) child.orientIdx = Math.floor(Math.random() * orientations.length);
      if (Math.random() < mutationRate) child.thickIdx = Math.floor(Math.random() * thicknesses.length);
      if (Math.random() < mutationRate) child.shapeIdx = Math.floor(Math.random() * shapes.length);

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
