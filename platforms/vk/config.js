(function () {
  'use strict';

  const query = new URLSearchParams(window.location.search || '');
  const language = String(query.get('vk_language') || query.get('lang') || '').toLowerCase();

  function product(votes, okPrice) {
    return { votes, okPrice };
  }

  window.JorPlatformConfig = {
    name: 'vk',
    documentTitle: language && !language.startsWith('ru') ? 'Gulp' : '\u0416\u043e\u0440',
    appId: 54698499,
    apiVersion: '5.199',
    backendUrl: 'https://d5dl7q0eh16ojp505u1v.6brbn2wz.apigw.yandexcloud.net',
    backendClientVersion: 1,
    storageKey: 'jorSaveV3',
    features: {
      cloudStorage: true,
      leaderboards: true,
      purchases: true,
      rewardedAds: true,
      interstitialAds: false,
      stickyBanner: false,
      developerGames: false,
      singleEndlessLeaderboard: true,
      profileXpLeaderboard: false,
      campaignLeaderboard: false
    },
    products: {
      jor_char_shellback: product(5, 19),
      jor_char_swifttail: product(10, 49),
      jor_char_glutton: product(16, 79),
      jor_char_hunter: product(27, 139),
      jor_char_abyssal: product(38, 199),
      jor_growth_bubbles: product(5, 19),
      jor_growth_pulse: product(13, 59),
      jor_growth_deepglow: product(27, 139),
      jor_growth_abyssrings: product(52, 279),
      jor_growth_legendary: product(75, 399),
      jor_pet_medusa: product(20, 99),
      jor_pet_kaplik: product(35, 179),
      jor_pet_toothlet: product(60, 319),
      jor_pet_pink_glutton: product(90, 479),
      jor_pet_ancient: product(125, 679),
      jor_icon_orange_eye: product(5, 19),
      jor_icon_red_fish: product(7, 29),
      jor_icon_aqua_shell: product(9, 39),
      jor_icon_dark_eye: product(13, 59),
      jor_icon_gold_shell: product(18, 89),
      jor_icon_ancient_eye: product(23, 119),
      jor_no_side_ads_30d: product(10, 49),
      jor_no_reward_ads: product(45, 239)
    }
  };
})();
