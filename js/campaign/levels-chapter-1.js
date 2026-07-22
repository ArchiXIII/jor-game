(function () {
  'use strict';

  const common = {
    shieldChance: 0,
    enemyPerks: false,
    enemySpeedScale: 0.9,
    allowAmbush: false,
    allowSchool: false
  };

  const levels = [
    { ...common, n: 1, type: 'food', target: 8, stars: [8, 14, 20], timeLimit: 70, enemyFactor: 0.3, foodFactor: 1.15, dnaFactor: 0.5, cameraZoom: 0.98 },
    { ...common, n: 2, type: 'growth', target: 2, stars: [0, 1, 2], timeLimit: 80, finishDelayFrames: 96, enemyFactor: 0.35, foodFactor: 1.25, dnaFactor: 0.8, cameraZoom: 0.96 },
    { ...common, n: 3, type: 'dna', target: 2, stars: [2, 4, 6], timeLimit: 85, enemyFactor: 0.45, foodFactor: 1.05, dnaFactor: 1.3, cameraZoom: 0.94 },
    { ...common, n: 4, type: 'enemy', target: 1, stars: [1, 2, 3], timeLimit: 100, enemyFactor: 0.65, foodFactor: 1.15, dnaFactor: 0.9, preyShare: 0.55, preyGrowthStage: 1, cameraZoom: 0.92 },
    { ...common, n: 5, type: 'food', target: 20, stars: [20, 30, 40], timeLimit: 90, enemyFactor: 0.7, foodFactor: 1.05, dnaFactor: 1, cameraZoom: 0.94 },
    { ...common, n: 6, type: 'growth', target: 3, stars: [1, 2, 3], timeLimit: 105, finishDelayFrames: 96, startGrowthStage: 1, startingMutations: ['tail'], enemyFactor: 0.75, foodFactor: 1.2, dnaFactor: 1, cameraZoom: 0.9 },
    { ...common, n: 7, type: 'enemy', target: 2, stars: [2, 4, 6], timeLimit: 115, enemyFactor: 0.85, foodFactor: 1.1, dnaFactor: 1, preyShare: 0.58, preyGrowthStage: 1, allowAmbush: true, cameraZoom: 0.88 },
    { ...common, n: 8, type: 'survive', target: 45, stars: [45, 60, 75], timeLimit: 75, enemyFactor: 0.95, foodFactor: 1, dnaFactor: 0.95, allowAmbush: true, allowSchool: true, cameraZoom: 0.88 },
    { ...common, n: 9, type: 'dna', target: 4, stars: [4, 6, 8], timeLimit: 100, enemyFactor: 1, foodFactor: 1, dnaFactor: 1.55, allowAmbush: true, allowSchool: true, cameraZoom: 0.86 },
    { ...common, n: 10, type: 'enemy', target: 4, stars: [4, 6, 8], timeLimit: 125, startGrowthStage: 1, startingMutations: ['spike'], enemyFactor: 1.08, foodFactor: 1.1, dnaFactor: 1.05, preyShare: 0.6, preyGrowthStage: 2, allowAmbush: true, allowSchool: true, cameraZoom: 0.84 }
  ];

  window.JorCampaignChapterLevels = window.JorCampaignChapterLevels || [];
  window.JorCampaignChapterLevels[0] = levels;
})();
