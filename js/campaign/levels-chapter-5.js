(function () {
  'use strict';

  const common = {
    enemyPerks: true,
    enemyMaxPerks: 1,
    enemyPerkPool: ['tail', 'shell', 'agility'],
    allowSchool: true,
    allowAmbush: true
  };

  const levels = [
    { ...common, n: 41, type: 'survive', target: 70, stars: [70, 100, 130], timeLimit: 130, startGrowthStage: 2, startingMutations: ['shell'], enemyPerkChance: 0.18, enemyFactor: 1.46, foodFactor: 0.96, dnaFactor: 0.9, cameraZoom: 0.76 },
    { ...common, n: 42, type: 'food', target: 80, stars: [80, 120, 160], timeLimit: 145, startGrowthStage: 2, startingMutations: ['tail'], enemyPerkChance: 0.2, enemyFactor: 1.48, foodFactor: 1.08, dnaFactor: 0.95, cameraZoom: 0.76 },
    { ...common, n: 43, type: 'enemy', target: 9, stars: [9, 15, 21], timeLimit: 160, startGrowthStage: 2, startingMutations: ['spike'], enemyPerkChance: 0.22, enemyFactor: 1.5, foodFactor: 1.08, dnaFactor: 1, preyShare: 0.32, preyGrowthStage: 4, cameraZoom: 0.74 },
    { ...common, n: 44, type: 'score', target: 10000, stars: [10000, 16000, 22000], timeLimit: 170, startGrowthStage: 2, startingMutations: ['agility'], enemyPerkChance: 0.24, enemyFactor: 1.52, foodFactor: 1, dnaFactor: 0.95, cameraZoom: 0.74 },
    { ...common, n: 45, type: 'growth', target: 4, stars: [2, 3, 4], timeLimit: 140, finishDelayFrames: 96, startGrowthStage: 2, startingMutations: ['maw'], enemyPerkChance: 0.26, enemyFactor: 1.52, foodFactor: 1.15, dnaFactor: 1.05, cameraZoom: 0.78 },
    { ...common, n: 46, type: 'dna', target: 13, stars: [13, 20, 27], timeLimit: 140, startGrowthStage: 2, startingMutations: ['tentacle'], enemyPerkChance: 0.28, enemyFactor: 1.54, foodFactor: 1, dnaFactor: 1.75, cameraZoom: 0.74 },
    { ...common, n: 47, type: 'enemy', target: 11, stars: [11, 18, 25], timeLimit: 175, startGrowthStage: 3, startingMutations: ['spike'], enemyPerkChance: 0.3, enemyFactor: 1.56, foodFactor: 1.08, dnaFactor: 1, preyShare: 0.31, preyGrowthStage: 4, cameraZoom: 0.72 },
    { ...common, n: 48, type: 'survive', target: 90, stars: [90, 125, 160], timeLimit: 160, startGrowthStage: 2, startingMutations: ['shell', 'agility'], enemyPerkChance: 0.32, enemyFactor: 1.58, foodFactor: 0.92, dnaFactor: 0.9, cameraZoom: 0.72 },
    { ...common, n: 49, type: 'score', target: 11000, stars: [11000, 17000, 24000], timeLimit: 180, startGrowthStage: 2, startingMutations: ['tail'], enemyPerkChance: 0.35, enemyFactor: 1.6, foodFactor: 1, dnaFactor: 0.95, cameraZoom: 0.72 },
    { ...common, n: 50, type: 'enemy', target: 13, stars: [13, 21, 29], timeLimit: 185, startGrowthStage: 3, startingMutations: ['spike', 'tail'], enemyPerkChance: 0.38, enemyFactor: 1.62, foodFactor: 1.08, dnaFactor: 1, preyShare: 0.3, preyGrowthStage: 4, cameraZoom: 0.72 }
  ];

  window.JorCampaignChapterLevels = window.JorCampaignChapterLevels || [];
  window.JorCampaignChapterLevels[4] = levels;
})();
