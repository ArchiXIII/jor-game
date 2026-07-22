(function () {
  'use strict';

  const common = {
    enemyPerks: true,
    enemyMaxPerks: 1,
    enemyPerkPool: ['tail', 'shell', 'agility'],
    allowSchool: true,
    allowAmbush: true,
    allowEnemyShots: true
  };

  const levels = [
    { ...common, n: 61, type: 'food', target: 95, stars: [95, 145, 195], timeLimit: 160, startGrowthStage: 2, startingMutations: ['tail'], enemyPerkChance: 0.34, enemyShooterShare: 0.16, enemyFactor: 1.6, foodFactor: 1.08, dnaFactor: 0.95, cameraZoom: 0.7 },
    { ...common, n: 62, type: 'score', target: 12500, stars: [12500, 19000, 27000], timeLimit: 180, startGrowthStage: 2, startingMutations: ['agility'], enemyPerkChance: 0.36, enemyShooterShare: 0.17, enemyFactor: 1.62, foodFactor: 1, dnaFactor: 0.95, cameraZoom: 0.7 },
    { ...common, n: 63, type: 'enemy', target: 13, stars: [13, 21, 29], timeLimit: 180, startGrowthStage: 3, startingMutations: ['spike'], enemyPerkChance: 0.38, enemyShooterShare: 0.18, enemyFactor: 1.64, foodFactor: 1.08, dnaFactor: 1, preyShare: 0.28, preyGrowthStage: 4, cameraZoom: 0.68 },
    { ...common, n: 64, type: 'survive', target: 105, stars: [105, 145, 180], timeLimit: 180, startGrowthStage: 2, startingMutations: ['shell'], enemyPerkChance: 0.4, enemyShooterShare: 0.19, enemyFactor: 1.66, foodFactor: 0.92, dnaFactor: 0.9, cameraZoom: 0.68 },
    { ...common, n: 65, type: 'growth', target: 5, stars: [3, 4, 5], timeLimit: 165, finishDelayFrames: 96, startGrowthStage: 1, startingMutations: ['maw', 'tail'], enemyPerkChance: 0.4, enemyShooterShare: 0.16, enemyFactor: 1.66, foodFactor: 1.16, dnaFactor: 1.08, cameraZoom: 0.74 },
    { ...common, n: 66, type: 'dna', target: 16, stars: [16, 25, 34], timeLimit: 160, startGrowthStage: 2, startingMutations: ['tentacle'], enemyPerkChance: 0.42, enemyShooterShare: 0.2, enemyFactor: 1.68, foodFactor: 1, dnaFactor: 1.95, cameraZoom: 0.68 },
    { ...common, n: 67, type: 'score', target: 13500, stars: [13500, 20000, 28000], timeLimit: 190, startGrowthStage: 3, startingMutations: ['tail', 'spike'], enemyPerkChance: 0.44, enemyShooterShare: 0.21, enemyFactor: 1.7, foodFactor: 1, dnaFactor: 0.95, cameraZoom: 0.68 },
    { ...common, n: 68, type: 'enemy', target: 16, stars: [16, 26, 36], timeLimit: 190, startGrowthStage: 3, startingMutations: ['spike', 'shell'], enemyPerkChance: 0.46, enemyShooterShare: 0.22, enemyConcurrentShooters: 2, enemyFactor: 1.72, foodFactor: 1.08, dnaFactor: 1, preyShare: 0.27, preyGrowthStage: 4, cameraZoom: 0.66 },
    { ...common, n: 69, type: 'survive', target: 120, stars: [120, 165, 200], timeLimit: 200, startGrowthStage: 2, startingMutations: ['agility', 'shell'], enemyPerkChance: 0.48, enemyShooterShare: 0.23, enemyConcurrentShooters: 2, enemyFactor: 1.74, foodFactor: 0.9, dnaFactor: 0.9, cameraZoom: 0.66 },
    { ...common, n: 70, type: 'score', target: 14500, stars: [14500, 21500, 30000], timeLimit: 200, startGrowthStage: 3, startingMutations: ['spike', 'tail'], enemyPerkChance: 0.5, enemyShooterShare: 0.24, enemyConcurrentShooters: 2, enemyFactor: 1.78, foodFactor: 1, dnaFactor: 1, cameraZoom: 0.66 }
  ];

  window.JorCampaignChapterLevels = window.JorCampaignChapterLevels || [];
  window.JorCampaignChapterLevels[6] = levels;
})();
