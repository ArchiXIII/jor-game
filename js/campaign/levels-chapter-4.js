(function () {
  'use strict';

  const common = {
    shieldChance: 0,
    enemyPerks: false,
    allowSchool: true,
    allowAmbush: true
  };

  const levels = [
    { ...common, n: 31, type: 'score', target: 5000, stars: [5000, 10000, 15000], timeLimit: 135, startGrowthStage: 2, startingMutations: ['tail'], enemyFactor: 1.3, foodFactor: 1, dnaFactor: 0.95, cameraZoom: 0.78 },
    { ...common, n: 32, type: 'survive', target: 65, stars: [65, 90, 115], timeLimit: 115, startGrowthStage: 2, startingMutations: ['agility'], enemyFactor: 1.34, foodFactor: 0.96, dnaFactor: 0.9, cameraZoom: 0.78 },
    { ...common, n: 33, type: 'enemy', target: 7, stars: [7, 12, 17], timeLimit: 145, startGrowthStage: 2, startingMutations: ['spike'], enemyFactor: 1.36, foodFactor: 1.08, dnaFactor: 1, preyShare: 0.34, preyGrowthStage: 3, cameraZoom: 0.78 },
    { ...common, n: 34, type: 'food', target: 70, stars: [70, 105, 140], timeLimit: 130, startGrowthStage: 2, startingMutations: ['tentacle'], enemyFactor: 1.38, foodFactor: 1.08, dnaFactor: 0.95, cameraZoom: 0.78 },
    { ...common, n: 35, type: 'growth', target: 4, stars: [2, 3, 4], timeLimit: 130, finishDelayFrames: 96, startGrowthStage: 1, startingMutations: ['maw'], enemyFactor: 1.4, foodFactor: 1.16, dnaFactor: 1.05, cameraZoom: 0.8 },
    { ...common, n: 36, type: 'score', target: 7000, stars: [7000, 13500, 20000], timeLimit: 150, startGrowthStage: 2, startingMutations: ['tail'], enemyFactor: 1.42, foodFactor: 1, dnaFactor: 0.95, cameraZoom: 0.76 },
    { ...common, n: 37, type: 'dna', target: 11, stars: [11, 17, 23], timeLimit: 130, startGrowthStage: 2, startingMutations: ['tentacle'], enemyFactor: 1.44, foodFactor: 1, dnaFactor: 1.65, cameraZoom: 0.76 },
    { ...common, n: 38, type: 'enemy', target: 9, stars: [9, 14, 20], timeLimit: 155, startGrowthStage: 3, startingMutations: ['spike'], enemyFactor: 1.46, foodFactor: 1.08, dnaFactor: 1, preyShare: 0.33, preyGrowthStage: 4, cameraZoom: 0.76 },
    { ...common, n: 39, type: 'survive', target: 75, stars: [75, 105, 135], timeLimit: 135, startGrowthStage: 2, startingMutations: ['shell'], enemyFactor: 1.5, foodFactor: 0.94, dnaFactor: 0.9, cameraZoom: 0.76 },
    { ...common, n: 40, type: 'score', target: 9500, stars: [9500, 17500, 26000], timeLimit: 175, startGrowthStage: 2, startingMutations: ['spike', 'tail'], enemyFactor: 1.54, foodFactor: 1.02, dnaFactor: 1, cameraZoom: 0.74 }
  ];

  window.JorCampaignChapterLevels = window.JorCampaignChapterLevels || [];
  window.JorCampaignChapterLevels[3] = levels;
})();
