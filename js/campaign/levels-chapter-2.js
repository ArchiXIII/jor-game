(function () {
  'use strict';

  const common = {
    shieldChance: 0,
    enemyPerks: false,
    enemySpeedScale: 0.95,
    allowSchool: false
  };

  const levels = [
    { ...common, n: 11, type: 'food', target: 25, stars: [25, 38, 50], timeLimit: 90, enemyFactor: 0.72, foodFactor: 1.1, dnaFactor: 0.9, allowAmbush: false, cameraZoom: 0.94 },
    { ...common, n: 12, type: 'enemy', target: 3, stars: [3, 5, 7], timeLimit: 90, enemyFactor: 0.82, foodFactor: 1.12, dnaFactor: 1, preyShare: 0.4, preyGrowthStage: 1, allowAmbush: true, cameraZoom: 0.9 },
    { ...common, n: 13, type: 'survive', target: 50, stars: [50, 70, 90], timeLimit: 90, startGrowthStage: 1, enemyFactor: 0.9, foodFactor: 1, dnaFactor: 0.9, allowAmbush: true, cameraZoom: 0.88 },
    { ...common, n: 14, type: 'score', target: 1800, stars: [1800, 3600, 6000], timeLimit: 120, startGrowthStage: 1, startingMutations: ['tail'], enemyFactor: 0.86, foodFactor: 1, dnaFactor: 0.9, allowAmbush: true, cameraZoom: 0.86 },
    { ...common, n: 15, type: 'growth', target: 4, stars: [2, 3, 4], timeLimit: 110, finishDelayFrames: 96, startGrowthStage: 1, startingMutations: ['tail'], enemyFactor: 0.92, foodFactor: 1.2, dnaFactor: 1.15, allowAmbush: true, cameraZoom: 0.9 },
    { ...common, n: 16, type: 'dna', target: 5, stars: [5, 8, 11], timeLimit: 110, startGrowthStage: 1, startingMutations: ['tentacle'], enemyFactor: 0.96, foodFactor: 1, dnaFactor: 1.65, allowAmbush: true, cameraZoom: 0.84 },
    { ...common, n: 17, type: 'enemy', target: 4, stars: [4, 7, 10], timeLimit: 125, startGrowthStage: 1, startingMutations: ['spike'], enemyFactor: 1.02, foodFactor: 1.08, dnaFactor: 1, preyShare: 0.44, preyGrowthStage: 2, allowAmbush: true, cameraZoom: 0.84 },
    { ...common, n: 18, type: 'score', target: 3000, stars: [3000, 6000, 9000], timeLimit: 145, startGrowthStage: 1, startingMutations: ['agility'], enemyFactor: 1.04, foodFactor: 1, dnaFactor: 0.95, allowAmbush: true, cameraZoom: 0.82 },
    { ...common, n: 19, type: 'food', target: 45, stars: [45, 60, 75], timeLimit: 120, startGrowthStage: 2, startingMutations: ['tentacle'], enemyFactor: 1.08, foodFactor: 1.12, dnaFactor: 1.05, allowAmbush: true, cameraZoom: 0.84 },
    { ...common, n: 20, type: 'enemy', target: 6, stars: [6, 9, 12], timeLimit: 140, startGrowthStage: 2, startingMutations: ['spike', 'tail'], enemyFactor: 1.15, foodFactor: 1.1, dnaFactor: 1.05, preyShare: 0.48, preyGrowthStage: 3, allowAmbush: true, cameraZoom: 0.82 }
  ];

  window.JorCampaignChapterLevels = window.JorCampaignChapterLevels || [];
  window.JorCampaignChapterLevels[1] = levels;
})();
