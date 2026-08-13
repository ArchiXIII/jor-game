(function () {
  'use strict';

  const query = new URLSearchParams(window.location.search || '');
  const language = String(query.get('vk_language') || query.get('lang') || '').toLowerCase();

  window.JorPlatformConfig = {
    name: 'vk',
    documentTitle: language && !language.startsWith('ru') ? 'Gulp' : '\u0416\u043e\u0440',
    appId: 0,
    apiVersion: '5.199',
    backendUrl: 'https://d5dl7q0eh16ojp505u1v.6brbn2wz.apigw.yandexcloud.net',
    backendClientVersion: 1,
    storageKey: 'jorSaveV3',
    features: {
      cloudStorage: true,
      leaderboards: true,
      purchases: false,
      rewardedAds: false,
      interstitialAds: false,
      stickyBanner: false,
      developerGames: false,
      singleEndlessLeaderboard: true,
      profileXpLeaderboard: false,
      campaignLeaderboard: false
    }
  };
})();
