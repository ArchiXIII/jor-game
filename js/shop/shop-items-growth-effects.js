(function () {
  'use strict';

  const products = [
    { id: 'jor_growth_bubbles', category: 'effects', priceYan: 50, ru: '\u041f\u0443\u0437\u044b\u0440\u044c\u043a\u043e\u0432\u044b\u0439 \u0441\u043a\u0430\u0447\u043e\u043a', en: 'Bubble Burst', descRu: '+1% \u0440\u043e\u0441\u0442\u0430.', descEn: '+1% growth.', color: '#9af7ff', bonuses: { growth: 0.01 }, effectId: 'jor_growth_bubbles' },
    { id: 'jor_growth_pulse', category: 'effects', priceYan: 150, ru: '\u0413\u043e\u043b\u0443\u0431\u043e\u0439 \u0438\u043c\u043f\u0443\u043b\u044c\u0441', en: 'Cyan Pulse', descRu: '+2% \u0440\u043e\u0441\u0442\u0430.', descEn: '+2% growth.', color: '#65e6ff', bonuses: { growth: 0.02 }, effectId: 'jor_growth_pulse' },
    { id: 'jor_growth_deepglow', category: 'effects', priceYan: 500, ru: '\u0413\u043b\u0443\u0431\u0438\u043d\u043d\u043e\u0435 \u0441\u0438\u044f\u043d\u0438\u0435', en: 'Deep Glow', descRu: '+3% \u0440\u043e\u0441\u0442\u0430.', descEn: '+3% growth.', color: '#69ffc8', bonuses: { growth: 0.03 }, effectId: 'jor_growth_deepglow' },
    { id: 'jor_growth_abyssrings', category: 'effects', priceYan: 1500, ru: '\u041a\u043e\u043b\u044c\u0446\u0430 \u0431\u0435\u0437\u0434\u043d\u044b', en: 'Abyss Rings', descRu: '+4% \u0440\u043e\u0441\u0442\u0430.', descEn: '+4% growth.', color: '#a883ff', bonuses: { growth: 0.04 }, effectId: 'jor_growth_abyssrings' },
    { id: 'jor_growth_legendary', category: 'effects', priceYan: 5000, ru: '\u041b\u0435\u0433\u0435\u043d\u0434\u0430\u0440\u043d\u0430\u044f \u044d\u0432\u043e\u043b\u044e\u0446\u0438\u044f', en: 'Legendary Evolution', descRu: '+5% \u0440\u043e\u0441\u0442\u0430.', descEn: '+5% growth.', color: '#ffe27a', bonuses: { growth: 0.05 }, effectId: 'jor_growth_legendary' }
  ];

  window.JorShopGrowthEffectItems = products;
})();
