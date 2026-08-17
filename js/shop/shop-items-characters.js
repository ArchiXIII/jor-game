(function () {
  'use strict';

  const products = [
    { id: 'jor_char_shellback', category: 'characters', skinId: 'jor_char_shellback', priceYan: 49, ru: '\u041f\u0430\u043d\u0446\u0438\u0440\u043d\u0438\u043a', en: 'Shellback', descRu: '+5% \u0437\u0430\u0449\u0438\u0442\u044b', descEn: '+5% defense', color: '#9ef0c6', bonuses: { defense: 0.05 } },
    { id: 'jor_char_swifttail', category: 'characters', skinId: 'jor_char_swifttail', priceYan: 119, ru: '\u0411\u044b\u0441\u0442\u0440\u043e\u0445\u0432\u043e\u0441\u0442', en: 'Swifttail', descRu: '+5% \u043a \u0441\u043a\u043e\u0440\u043e\u0441\u0442\u0438', descEn: '+5% speed', color: '#7af2ff', bonuses: { speed: 0.05 } },
    { id: 'jor_char_glutton', category: 'characters', skinId: 'jor_char_glutton', priceYan: 189, ru: '\u0413\u043b\u043e\u0442\u0430\u0442\u0435\u043b\u044c', en: 'Glutton', descRu: '+7% \u0440\u043e\u0441\u0442\u0430', descEn: '+7% growth', color: '#b5ff87', bonuses: { growth: 0.07 } },
    { id: 'jor_char_hunter', category: 'characters', skinId: 'jor_char_hunter', priceYan: 349, ru: '\u041e\u0445\u043e\u0442\u043d\u0438\u043a', en: 'Hunter', descRu: '+5% \u0441\u043a\u043e\u0440\u043e\u0441\u0442\u0438 \u0438 +7% \u0440\u043e\u0441\u0442\u0430 \u0437\u0430 \u0432\u0440\u0430\u0433\u043e\u0432', descEn: '+5% speed and +7% growth from enemies', color: '#ff9f8e', bonuses: { speed: 0.05, enemyGrowth: 0.07 } },
    { id: 'jor_char_abyssal', category: 'characters', skinId: 'jor_char_abyssal', priceYan: 489, ru: '\u0413\u043b\u0443\u0431\u0438\u043d\u043d\u044b\u0439', en: 'Abyssal', descRu: '+5% \u0437\u0430\u0449\u0438\u0442\u044b +7% \u0440\u043e\u0441\u0442\u0430\n\u0420\u044b\u0432\u043e\u043a \u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d \u0441\u0440\u0430\u0437\u0443', descEn: '+5% defense +7% growth\nStarts with dash', color: '#c69cff', bonuses: { defense: 0.05, growth: 0.07, startDashLevel: 1 } },
    { id: 'jor_char_goldfish', category: 'characters', skinId: 'jor_char_goldfish', unlockEndlessScore: 50000, ru: '\u0417\u043e\u043b\u043e\u0442\u0430\u044f \u0440\u044b\u0431\u043a\u0430', en: 'Goldfish', descRu: '+4% \u0441\u043a\u043e\u0440\u043e\u0441\u0442\u0438 +5% \u0440\u043e\u0441\u0442\u0430 +10% \u043e\u043f\u044b\u0442\u0430', descEn: '+4% speed +5% growth +10% XP', color: '#ffd95b', bonuses: { speed: 0.04, growth: 0.05, xp: 0.10 } }
  ];

  window.JorShopCharacterItems = products;
})();
