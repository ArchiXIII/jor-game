(function () {
  'use strict';

const levels = [
    { n: 1, type: 'food', target: 10, stars: [10, 16, 22], enemyFactor: 0.35, dnaFactor: 0.4 },
    { n: 2, type: 'size', target: 2, stars: [2, 3, 4], enemyFactor: 0.45, dnaFactor: 0.55 },
    { n: 3, type: 'food', target: 18, stars: [18, 26, 34], enemyFactor: 0.55, dnaFactor: 0.65 },
    { n: 4, type: 'enemy', target: 2, stars: [2, 3, 4], enemyFactor: 0.75, dnaFactor: 0.7 },
    { n: 5, type: 'dna', target: 3, stars: [3, 5, 7], enemyFactor: 0.75, dnaFactor: 1.35 },
    { n: 6, type: 'size', target: 4, stars: [4, 5, 6], enemyFactor: 0.85, dnaFactor: 0.9 },
    { n: 7, type: 'enemy', target: 4, stars: [4, 6, 8], enemyFactor: 1.0, dnaFactor: 0.95 },
    { n: 8, type: 'food', target: 36, stars: [36, 48, 60], enemyFactor: 1.05, dnaFactor: 0.85 },
    { n: 9, type: 'survive', target: 60, stars: [60, 75, 90], enemyFactor: 1.15, dnaFactor: 0.9 },
    { n: 10, type: 'enemy', target: 8, stars: [8, 10, 12], enemyFactor: 1.25, dnaFactor: 1.0 }
  ];

  window.JorCampaignChapterLevels = window.JorCampaignChapterLevels || [];
  window.JorCampaignChapterLevels[0] = levels;
})();
