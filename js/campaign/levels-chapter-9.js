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
    enemyProjectileLimit: 5,
    enemyDoubleShotSpread: 0.18,
    currentSpacing: 1170,
    currentWidth: 310
  };

  const levels = [
    { ...common, n: 81, type: 'score', target: 17000, stars: [17000, 23500, 32000], timeLimit: 215, startGrowthStage: 3, startingMutations: ['tail', 'agility'], enemyPerkChance: 0.66, enemyShooterShare: 0.27, enemyDoubleShotChance: 0.12, enemyFactor: 2.02, foodFactor: 0.96, dnaFactor: 0.9, cameraZoom: 0.62, currentStrength: 0.22, currentAngle: 0.35 },
    { ...common, n: 82, type: 'enemy', target: 20, stars: [20, 33, 46], timeLimit: 215, startGrowthStage: 4, startingMutations: ['maw', 'spike'], enemyPerkChance: 0.68, enemyShooterShare: 0.28, enemyDoubleShotChance: 0.14, enemyFactor: 2.06, foodFactor: 1.02, dnaFactor: 0.94, preyShare: 0.23, preyGrowthStage: 5, cameraZoom: 0.62, currentStrength: 0.23, currentAngle: -0.55 },
    { ...common, n: 83, type: 'dna', target: 21, stars: [21, 33, 45], timeLimit: 185, startGrowthStage: 3, startingMutations: ['tentacle', 'shell'], enemyPerkChance: 0.69, enemyShooterShare: 0.28, enemyDoubleShotChance: 0.16, enemyFactor: 2.08, foodFactor: 0.94, dnaFactor: 1.7, cameraZoom: 0.61, currentStrength: 0.24, currentAngle: 0.95 },
    { ...common, n: 84, type: 'survive', target: 145, stars: [145, 195, 230], timeLimit: 230, startGrowthStage: 3, startingMutations: ['shell', 'agility'], enemyPerkChance: 0.7, enemyShooterShare: 0.29, enemyDoubleShotChance: 0.18, enemyFactor: 2.1, foodFactor: 0.84, dnaFactor: 0.84, cameraZoom: 0.61, currentStrength: 0.25, currentAngle: -0.2 },
    { ...common, n: 85, type: 'growth', target: 6, stars: [4, 5, 6], timeLimit: 190, finishDelayFrames: 96, startGrowthStage: 2, startingMutations: ['maw', 'tail'], enemyPerkChance: 0.72, enemyShooterShare: 0.29, enemyDoubleShotChance: 0.19, enemyFactor: 2.12, foodFactor: 1.1, dnaFactor: 1.02, cameraZoom: 0.65, currentStrength: 0.26, currentAngle: 0.7 },
    { ...common, n: 86, type: 'food', target: 135, stars: [135, 205, 275], timeLimit: 200, startGrowthStage: 3, startingMutations: ['tentacle', 'tail'], enemyPerkChance: 0.73, enemyShooterShare: 0.3, enemyDoubleShotChance: 0.21, enemyFactor: 2.14, foodFactor: 1.02, dnaFactor: 0.88, cameraZoom: 0.61, currentStrength: 0.27, currentAngle: -0.85 },
    { ...common, n: 87, type: 'score', target: 18500, stars: [18500, 24500, 33000], timeLimit: 225, startGrowthStage: 4, startingMutations: ['spike', 'tail'], enemyPerkChance: 0.74, enemyShooterShare: 0.31, enemyDoubleShotChance: 0.23, enemyFactor: 2.16, foodFactor: 0.94, dnaFactor: 0.9, cameraZoom: 0.6, currentStrength: 0.28, currentAngle: 0.15 },
    { ...common, n: 88, type: 'enemy', target: 23, stars: [23, 37, 51], timeLimit: 225, startGrowthStage: 4, startingMutations: ['maw', 'spike', 'agility'], enemyPerkChance: 0.76, enemyShooterShare: 0.31, enemyDoubleShotChance: 0.25, enemyFactor: 2.18, foodFactor: 1, dnaFactor: 0.93, preyShare: 0.22, preyGrowthStage: 5, cameraZoom: 0.6, currentStrength: 0.29, currentAngle: 1.1 },
    { ...common, n: 89, type: 'survive', target: 155, stars: [155, 210, 240], timeLimit: 240, startGrowthStage: 3, startingMutations: ['shell', 'tail'], enemyPerkChance: 0.77, enemyShooterShare: 0.32, enemyDoubleShotChance: 0.27, enemyFactor: 2.2, foodFactor: 0.82, dnaFactor: 0.82, cameraZoom: 0.6, currentStrength: 0.3, currentAngle: -0.45 },
    { ...common, n: 90, type: 'score', target: 20000, stars: [20000, 26000, 35000], timeLimit: 235, startGrowthStage: 4, startingMutations: ['spike', 'tail', 'shell'], enemyPerkChance: 0.79, enemyShooterShare: 0.33, enemyDoubleShotChance: 0.3, enemyFactor: 2.24, foodFactor: 0.92, dnaFactor: 0.88, cameraZoom: 0.59, currentStrength: 0.31, currentAngle: 0.8 }
  ];

  window.JorCampaignChapterLevels = window.JorCampaignChapterLevels || [];
  window.JorCampaignChapterLevels[8] = levels;
})();
