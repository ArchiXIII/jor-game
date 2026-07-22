(function () {
  'use strict';

  const common = {
    enemyPerks: true,
    enemyMaxPerks: 2,
    enemyPerkPool: ['tail', 'shell', 'agility', 'maw', 'spike'],
    allowSchool: true,
    allowAmbush: true,
    allowEnemyShots: true,
    enemyProjectileLimit: 6,
    enemyDoubleShotSpread: 0.2,
    currentSpacing: 1125,
    currentWidth: 320
  };

  const levels = [
    { ...common, n: 91, type: 'food', target: 145, stars: [145, 220, 295], timeLimit: 210, startGrowthStage: 3, startingMutations: ['tentacle', 'tail'], enemyPerkChance: 0.78, enemyShooterShare: 0.31, enemyConcurrentShooters: 2, enemyDoubleShotChance: 0.28, enemyAlarmRadius: 270, enemyAlarmCount: 1, enemyAlarmDuration: 240, enemyFactor: 2.2, foodFactor: 1, dnaFactor: 0.86, cameraZoom: 0.6, currentStrength: 0.32, currentAngle: 0.55 },
    { ...common, n: 92, type: 'enemy', target: 24, stars: [24, 39, 54], timeLimit: 230, startGrowthStage: 4, startingMutations: ['maw', 'spike'], enemyPerkChance: 0.79, enemyShooterShare: 0.32, enemyConcurrentShooters: 2, enemyDoubleShotChance: 0.3, enemyAlarmRadius: 285, enemyAlarmCount: 1, enemyAlarmDuration: 255, enemyFactor: 2.24, foodFactor: 0.98, dnaFactor: 0.92, preyShare: 0.21, preyGrowthStage: 5, cameraZoom: 0.59, currentStrength: 0.33, currentAngle: -0.7 },
    { ...common, n: 93, type: 'survive', target: 160, stars: [160, 215, 245], timeLimit: 245, startGrowthStage: 3, startingMutations: ['shell', 'agility'], enemyPerkChance: 0.8, enemyShooterShare: 0.33, enemyConcurrentShooters: 2, enemyDoubleShotChance: 0.32, enemyAlarmRadius: 300, enemyAlarmCount: 2, enemyAlarmDuration: 270, enemyFactor: 2.28, foodFactor: 0.8, dnaFactor: 0.8, cameraZoom: 0.59, currentStrength: 0.34, currentAngle: 0.2 },
    { ...common, n: 94, type: 'dna', target: 24, stars: [24, 37, 50], timeLimit: 200, startGrowthStage: 3, startingMutations: ['tentacle', 'tail'], enemyPerkChance: 0.81, enemyShooterShare: 0.34, enemyConcurrentShooters: 2, enemyDoubleShotChance: 0.33, enemyAlarmRadius: 310, enemyAlarmCount: 2, enemyAlarmDuration: 280, enemyFactor: 2.3, foodFactor: 0.92, dnaFactor: 1.65, cameraZoom: 0.59, currentStrength: 0.35, currentAngle: 0.95 },
    { ...common, n: 95, type: 'score', target: 22000, stars: [22000, 28000, 37000], timeLimit: 240, startGrowthStage: 4, startingMutations: ['spike', 'agility'], enemyPerkChance: 0.83, enemyShooterShare: 0.35, enemyConcurrentShooters: 2, enemyDoubleShotChance: 0.35, enemyAlarmRadius: 325, enemyAlarmCount: 2, enemyAlarmDuration: 295, enemyFactor: 2.34, foodFactor: 0.9, dnaFactor: 0.86, cameraZoom: 0.58, currentStrength: 0.36, currentAngle: -0.35 },
    { ...common, n: 96, type: 'growth', target: 7, stars: [5, 6, 7], timeLimit: 200, finishDelayFrames: 96, startGrowthStage: 2, startingMutations: ['maw', 'shell'], enemyPerkChance: 0.84, enemyShooterShare: 0.35, enemyConcurrentShooters: 2, enemyDoubleShotChance: 0.37, enemyAlarmRadius: 335, enemyAlarmCount: 2, enemyAlarmDuration: 305, enemyFactor: 2.36, foodFactor: 1.08, dnaFactor: 1, cameraZoom: 0.62, currentStrength: 0.37, currentAngle: 0.72 },
    { ...common, n: 97, type: 'enemy', target: 27, stars: [27, 43, 59], timeLimit: 240, startGrowthStage: 4, startingMutations: ['maw', 'spike', 'tail'], enemyPerkChance: 0.86, enemyShooterShare: 0.36, enemyConcurrentShooters: 2, enemyDoubleShotChance: 0.39, enemyAlarmRadius: 345, enemyAlarmCount: 2, enemyAlarmDuration: 320, enemyFactor: 2.4, foodFactor: 0.96, dnaFactor: 0.9, preyShare: 0.15, preyGrowthStage: 5, cameraZoom: 0.58, currentStrength: 0.38, currentAngle: -0.92 },
    { ...common, n: 98, type: 'score', target: 24500, stars: [24500, 31000, 40000], timeLimit: 250, startGrowthStage: 4, startingMutations: ['tail', 'spike', 'tentacle'], enemyPerkChance: 0.88, enemyShooterShare: 0.37, enemyConcurrentShooters: 2, enemyDoubleShotChance: 0.41, enemyAlarmRadius: 355, enemyAlarmCount: 3, enemyAlarmDuration: 330, enemyFactor: 2.44, foodFactor: 0.88, dnaFactor: 0.84, cameraZoom: 0.58, currentStrength: 0.39, currentAngle: 0.1 },
    { ...common, n: 99, type: 'survive', target: 175, stars: [175, 230, 260], timeLimit: 260, startGrowthStage: 3, startingMutations: ['shell', 'tail', 'agility'], enemyPerkChance: 0.9, enemyShooterShare: 0.38, enemyConcurrentShooters: 3, enemyDoubleShotChance: 0.43, enemyAlarmRadius: 370, enemyAlarmCount: 3, enemyAlarmDuration: 345, enemyFactor: 2.48, foodFactor: 0.78, dnaFactor: 0.78, cameraZoom: 0.57, currentStrength: 0.4, currentAngle: 1.02 },
    { ...common, n: 100, type: 'score', target: 27000, stars: [27000, 34000, 43000], timeLimit: 270, startGrowthStage: 4, startingMutations: ['spike', 'tail', 'shell'], enemyPerkChance: 0.92, enemyShooterShare: 0.4, enemyConcurrentShooters: 3, enemyDoubleShotChance: 0.46, enemyAlarmRadius: 390, enemyAlarmCount: 3, enemyAlarmDuration: 360, enemyFactor: 2.55, foodFactor: 0.86, dnaFactor: 0.82, cameraZoom: 0.56, currentStrength: 0.41, currentAngle: -0.58 }
  ];

  window.JorCampaignChapterLevels = window.JorCampaignChapterLevels || [];
  window.JorCampaignChapterLevels[9] = levels;
})();
