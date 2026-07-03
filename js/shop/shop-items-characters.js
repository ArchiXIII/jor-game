(function () {
  'use strict';

  const products = [
    { id: 'jor_char_shellback', category: 'characters', skinId: 'jor_char_shellback', priceYan: 50, ru: '\u041f\u0430\u043d\u0446\u0438\u0440\u043d\u0438\u043a', en: 'Shellback', descRu: '-5% \u043f\u043e\u043b\u0443\u0447\u0430\u0435\u043c\u043e\u0433\u043e \u0443\u0440\u043e\u043d\u0430.', descEn: '-5% incoming damage.', color: '#9ef0c6', bonuses: { defense: 0.05 } },
    { id: 'jor_char_swifttail', category: 'characters', skinId: 'jor_char_swifttail', priceYan: 120, ru: '\u0411\u044b\u0441\u0442\u0440\u043e\u0445\u0432\u043e\u0441\u0442', en: 'Swifttail', descRu: '+5% \u043a \u0441\u043a\u043e\u0440\u043e\u0441\u0442\u0438.', descEn: '+5% speed.', color: '#7af2ff', bonuses: { speed: 0.05 } },
    { id: 'jor_char_glutton', category: 'characters', skinId: 'jor_char_glutton', priceYan: 200, ru: '\u0413\u043b\u043e\u0442\u0430\u0442\u0435\u043b\u044c', en: 'Glutton', descRu: '+7% \u0440\u043e\u0441\u0442\u0430 \u043e\u0442 \u0432\u0441\u0435\u0433\u043e.', descEn: '+7% growth from everything.', color: '#b5ff87', bonuses: { growth: 0.07 } },
    { id: 'jor_char_hunter', category: 'characters', skinId: 'jor_char_hunter', priceYan: 350, ru: '\u041e\u0445\u043e\u0442\u043d\u0438\u043a', en: 'Hunter', descRu: '+5% \u0441\u043a\u043e\u0440\u043e\u0441\u0442\u0438 \u0438 +7% \u0440\u043e\u0441\u0442\u0430 \u0437\u0430 \u0432\u0440\u0430\u0433\u043e\u0432.', descEn: '+5% speed and +7% growth from enemies.', color: '#ff9f8e', bonuses: { speed: 0.05, enemyGrowth: 0.07 } },
    { id: 'jor_char_abyssal', category: 'characters', skinId: 'jor_char_abyssal', priceYan: 500, ru: '\u0413\u043b\u0443\u0431\u0438\u043d\u043d\u044b\u0439', en: 'Abyssal', descRu: '-5% \u043f\u043e\u043b\u0443\u0447\u0430\u0435\u043c\u043e\u0433\u043e \u0443\u0440\u043e\u043d\u0430, +7% \u0440\u043e\u0441\u0442\u0430 \u043e\u0442 \u0432\u0441\u0435\u0433\u043e, \u0420\u044b\u0432\u043e\u043a \u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d \u0441\u0440\u0430\u0437\u0443', descEn: '-5% incoming damage, +7% growth from everything, starts with dash.', color: '#c69cff', bonuses: { defense: 0.05, growth: 0.07, startDashLevel: 1 } }
  ];

  window.JorShopCharacterItems = products;
})();




