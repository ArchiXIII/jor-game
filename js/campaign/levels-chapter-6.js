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
    { ...common, n: 51, type: 'survive', target: 65, stars: [65, 95, 125], timeLimit: 125, startGrowthStage: 2, startingMutations: ['agility'], enemyPerkChance: 0.24, enemyShooterShare: 0.1, enemyFactor: 1.52, foodFactor: 0.96, dnaFactor: 0.9, cameraZoom: 0.74 },
    { ...common, n: 52, type: 'food', target: 85, stars: [85, 130, 175], timeLimit: 150, startGrowthStage: 2, startingMutations: ['tail'], enemyPerkChance: 0.26, enemyShooterShare: 0.11, enemyFactor: 1.54, foodFactor: 1.08, dnaFactor: 0.95, cameraZoom: 0.74 },
    { ...common, n: 53, type: 'enemy', target: 10, stars: [10, 16, 23], timeLimit: 165, startGrowthStage: 3, startingMutations: ['spike'], enemyPerkChance: 0.28, enemyShooterShare: 0.12, enemyFactor: 1.56, foodFactor: 1.08, dnaFactor: 1, preyShare: 0.3, preyGrowthStage: 4, cameraZoom: 0.72 },
    { ...common, n: 54, type: 'score', target: 11500, stars: [11500, 18000, 25000], timeLimit: 175, startGrowthStage: 2, startingMutations: ['agility'], enemyPerkChance: 0.3, enemyShooterShare: 0.13, enemyFactor: 1.58, foodFactor: 1, dnaFactor: 0.95, cameraZoom: 0.72 },
    { ...common, n: 55, type: 'growth', target: 4, stars: [2, 3, 4], timeLimit: 145, finishDelayFrames: 96, startGrowthStage: 2, startingMutations: ['maw'], enemyPerkChance: 0.3, enemyShooterShare: 0.1, enemyFactor: 1.58, foodFactor: 1.15, dnaFactor: 1.05, cameraZoom: 0.76 },
    { ...common, n: 56, type: 'dna', target: 14, stars: [14, 22, 30], timeLimit: 150, startGrowthStage: 2, startingMutations: ['tentacle'], enemyPerkChance: 0.32, enemyShooterShare: 0.14, enemyFactor: 1.6, foodFactor: 1, dnaFactor: 1.85, cameraZoom: 0.72 },
    { ...common, n: 57, type: 'enemy', target: 12, stars: [12, 20, 28], timeLimit: 180, startGrowthStage: 3, startingMutations: ['spike', 'tail'], enemyPerkChance: 0.34, enemyShooterShare: 0.15, enemyFactor: 1.62, foodFactor: 1.08, dnaFactor: 1, preyShare: 0.29, preyGrowthStage: 4, cameraZoom: 0.7 },
    { ...common, n: 58, type: 'survive', target: 95, stars: [95, 135, 170], timeLimit: 170, startGrowthStage: 2, startingMutations: ['shell'], enemyPerkChance: 0.36, enemyShooterShare: 0.16, enemyFactor: 1.64, foodFactor: 0.92, dnaFactor: 0.9, cameraZoom: 0.7 },
    { ...common, n: 59, type: 'score', target: 12000, stars: [12000, 18500, 26000], timeLimit: 185, startGrowthStage: 3, startingMutations: ['tail'], enemyPerkChance: 0.38, enemyShooterShare: 0.18, enemyFactor: 1.66, foodFactor: 1, dnaFactor: 0.95, cameraZoom: 0.7 },
    { ...common, n: 60, type: 'enemy', target: 15, stars: [15, 24, 33], timeLimit: 190, startGrowthStage: 3, startingMutations: ['spike', 'agility'], enemyPerkChance: 0.4, enemyShooterShare: 0.2, enemyFactor: 1.68, foodFactor: 1.08, dnaFactor: 1, preyShare: 0.28, preyGrowthStage: 4, cameraZoom: 0.7 }
  ];

  window.JorCampaignChapterLevels = window.JorCampaignChapterLevels || [];
  window.JorCampaignChapterLevels[5] = levels;
})();
