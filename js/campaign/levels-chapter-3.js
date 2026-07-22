(function () {
  'use strict';

  const common = {
    shieldChance: 0,
    enemyPerks: false,
    allowSchool: true
  };

  const levels = [
    { ...common, n: 21, type: 'food', target: 50, stars: [50, 70, 90], timeLimit: 115, startGrowthStage: 1, enemyFactor: 1.08, foodFactor: 1.05, dnaFactor: 0.9, allowAmbush: false, cameraZoom: 0.84 },
    { ...common, n: 22, type: 'enemy', target: 5, stars: [5, 8, 11], timeLimit: 125, startGrowthStage: 2, enemyFactor: 1.1, foodFactor: 1.08, dnaFactor: 0.95, preyShare: 0.34, preyGrowthStage: 3, allowAmbush: true, cameraZoom: 0.82 },
    { ...common, n: 23, type: 'score', target: 3500, stars: [3500, 7000, 10500], timeLimit: 135, startGrowthStage: 1, startingMutations: ['tail'], enemyFactor: 1.12, foodFactor: 1, dnaFactor: 0.95, allowAmbush: true, cameraZoom: 0.82 },
    { ...common, n: 24, type: 'dna', target: 9, stars: [9, 14, 18], timeLimit: 115, startGrowthStage: 1, startingMutations: ['tentacle'], enemyFactor: 1.14, foodFactor: 1, dnaFactor: 1.5, allowAmbush: true, cameraZoom: 0.8 },
    { ...common, n: 25, type: 'growth', target: 4, stars: [2, 3, 4], timeLimit: 115, finishDelayFrames: 96, startGrowthStage: 2, startingMutations: ['tail'], enemyFactor: 1.16, foodFactor: 1.08, dnaFactor: 1, allowAmbush: true, cameraZoom: 0.84 },
    { ...common, n: 26, type: 'enemy', target: 6, stars: [6, 9, 12], timeLimit: 135, startGrowthStage: 1, startingMutations: ['spike'], enemyFactor: 1.18, foodFactor: 1.08, dnaFactor: 1, preyShare: 0.34, preyGrowthStage: 3, allowAmbush: true, cameraZoom: 0.8 },
    { ...common, n: 27, type: 'survive', target: 60, stars: [60, 80, 100], timeLimit: 100, startGrowthStage: 1, startingMutations: ['agility'], enemyFactor: 1.2, foodFactor: 0.95, dnaFactor: 0.9, allowAmbush: true, cameraZoom: 0.8 },
    { ...common, n: 28, type: 'score', target: 4500, stars: [4500, 8500, 12500], timeLimit: 145, startGrowthStage: 2, startingMutations: ['spike'], enemyFactor: 1.2, foodFactor: 1, dnaFactor: 0.95, allowAmbush: true, cameraZoom: 0.78 },
    { ...common, n: 29, type: 'food', target: 60, stars: [60, 85, 110], timeLimit: 130, startGrowthStage: 2, startingMutations: ['tentacle'], enemyFactor: 1.22, foodFactor: 1.05, dnaFactor: 1, allowAmbush: true, cameraZoom: 0.8 },
    { ...common, n: 30, type: 'enemy', target: 8, stars: [8, 12, 16], timeLimit: 150, startGrowthStage: 2, startingMutations: ['spike', 'tail'], enemyFactor: 1.28, foodFactor: 1.06, dnaFactor: 1, preyShare: 0.36, preyGrowthStage: 3, allowAmbush: true, cameraZoom: 0.78 }
  ];

  window.JorCampaignChapterLevels = window.JorCampaignChapterLevels || [];
  window.JorCampaignChapterLevels[2] = levels;
})();
