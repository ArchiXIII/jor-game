(function () {
  'use strict';

  const common = {
    enemyPerks: true,
    enemyMaxPerks: 2,
    enemyPerkPool: ['tail', 'shell', 'agility', 'maw', 'spike'],
    allowSchool: true,
    allowAmbush: true,
    allowEnemyShots: true,
    enemyConcurrentShooters: 2,
    enemyProjectileLimit: 4,
    currentSpacing: 1230,
    currentWidth: 300
  };

  const levels = [
    { ...common, n: 71, type: 'food', target: 110, stars: [110, 170, 230], timeLimit: 175, startGrowthStage: 3, startingMutations: ['tail', 'tentacle'], enemyPerkChance: 0.5, enemyShooterShare: 0.22, enemyFactor: 1.8, foodFactor: 1.04, dnaFactor: 0.92, cameraZoom: 0.66, currentStrength: 0.15, currentAngle: 0.12 },
    { ...common, n: 72, type: 'survive', target: 125, stars: [125, 170, 205], timeLimit: 205, startGrowthStage: 3, startingMutations: ['shell', 'agility'], enemyPerkChance: 0.52, enemyShooterShare: 0.23, enemyFactor: 1.84, foodFactor: 0.88, dnaFactor: 0.88, cameraZoom: 0.66, currentStrength: 0.17, currentAngle: 0.5 },
    { ...common, n: 73, type: 'score', target: 15000, stars: [15000, 22000, 31000], timeLimit: 200, startGrowthStage: 3, startingMutations: ['tail', 'spike'], enemyPerkChance: 0.54, enemyShooterShare: 0.24, enemyFactor: 1.86, foodFactor: 0.98, dnaFactor: 0.92, cameraZoom: 0.65, currentStrength: 0.18, currentAngle: -0.35 },
    { ...common, n: 74, type: 'dna', target: 19, stars: [19, 29, 40], timeLimit: 175, startGrowthStage: 2, startingMutations: ['tentacle', 'agility'], enemyPerkChance: 0.56, enemyShooterShare: 0.24, enemyFactor: 1.88, foodFactor: 0.96, dnaFactor: 1.75, cameraZoom: 0.65, currentStrength: 0.19, currentAngle: 0.82 },
    { ...common, n: 75, type: 'enemy', target: 18, stars: [18, 29, 40], timeLimit: 200, startGrowthStage: 4, startingMutations: ['maw', 'spike'], enemyPerkChance: 0.58, enemyShooterShare: 0.25, enemyFactor: 1.9, foodFactor: 1.04, dnaFactor: 0.95, preyShare: 0.25, preyGrowthStage: 5, cameraZoom: 0.64, currentStrength: 0.2, currentAngle: -0.7 },
    { ...common, n: 76, type: 'growth', target: 5, stars: [3, 4, 5], timeLimit: 175, finishDelayFrames: 96, startGrowthStage: 2, startingMutations: ['maw', 'tail'], enemyPerkChance: 0.6, enemyShooterShare: 0.25, enemyFactor: 1.92, foodFactor: 1.12, dnaFactor: 1.04, cameraZoom: 0.68, currentStrength: 0.21, currentAngle: 0.25 },
    { ...common, n: 77, type: 'score', target: 16000, stars: [16000, 23000, 32000], timeLimit: 210, startGrowthStage: 3, startingMutations: ['spike', 'shell'], enemyPerkChance: 0.62, enemyShooterShare: 0.26, enemyFactor: 1.96, foodFactor: 0.96, dnaFactor: 0.92, cameraZoom: 0.64, currentStrength: 0.22, currentAngle: 1.05 },
    { ...common, n: 78, type: 'food', target: 125, stars: [125, 190, 255], timeLimit: 190, startGrowthStage: 3, startingMutations: ['tentacle', 'agility'], enemyPerkChance: 0.64, enemyShooterShare: 0.27, enemyFactor: 1.98, foodFactor: 1.04, dnaFactor: 0.9, cameraZoom: 0.63, currentStrength: 0.23, currentAngle: -0.15 },
    { ...common, n: 79, type: 'survive', target: 135, stars: [135, 185, 220], timeLimit: 220, startGrowthStage: 3, startingMutations: ['shell', 'tail'], enemyPerkChance: 0.66, enemyShooterShare: 0.28, enemyFactor: 2, foodFactor: 0.86, dnaFactor: 0.86, cameraZoom: 0.63, currentStrength: 0.25, currentAngle: -0.95 },
    { ...common, n: 80, type: 'enemy', target: 20, stars: [20, 32, 44], timeLimit: 215, startGrowthStage: 4, startingMutations: ['maw', 'spike', 'tail'], enemyPerkChance: 0.68, enemyShooterShare: 0.29, enemyFactor: 2.04, foodFactor: 1.02, dnaFactor: 0.95, preyShare: 0.24, preyGrowthStage: 5, cameraZoom: 0.62, currentStrength: 0.26, currentAngle: 0.65 }
  ];

  window.JorCampaignChapterLevels = window.JorCampaignChapterLevels || [];
  window.JorCampaignChapterLevels[7] = levels;
})();
