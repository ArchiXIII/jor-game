(function () {
  'use strict';

  const products = [
    { id: 'jor_pet_medusa', category: 'pets', petId: 'jor_pet_medusa', priceYan: 289, ru: '\u041b\u0443\u043d\u043d\u0430\u044f \u043c\u0435\u0434\u0443\u0437\u0430', en: 'Moon Jelly', descRu: '+1% \u0440\u043e\u0441\u0442\u0430 \u043e\u0442 \u0432\u0441\u0435\u0433\u043e\n+3% \u043e\u043f\u044b\u0442\u0430', descEn: '+1% growth from everything\n+3% XP', color: '#91eaff', bonuses: { growth: 0.01, xp: 0.03 } },
    { id: 'jor_pet_reef_clown', category: 'pets', petId: 'jor_pet_reef_clown', unlockCampaignLevel: 50, ru: '\u0420\u0438\u0444\u043e\u0432\u044b\u0439 \u043a\u043b\u043e\u0443\u043d', en: 'Reef Clown', descRu: '+2% \u0441\u043a\u043e\u0440\u043e\u0441\u0442\u0438', descEn: '+2% speed', color: '#ff8b2a', bonuses: { speed: 0.02 } },
    { id: 'jor_pet_kaplik', category: 'pets', petId: 'jor_pet_kaplik', priceYan: 590, ru: '\u041a\u0430\u043f\u043b\u0438\u043a', en: 'Droplet', descRu: '-2% \u043f\u043e\u043b\u0443\u0447\u0430\u0435\u043c\u043e\u0433\u043e \u0443\u0440\u043e\u043d\u0430\n+3% \u043e\u043f\u044b\u0442\u0430', descEn: '-2% incoming damage\n+3% XP', color: '#8cff62', bonuses: { defense: 0.02, xp: 0.03 } },
    { id: 'jor_pet_toothlet', category: 'pets', petId: 'jor_pet_toothlet', priceYan: 1150, ru: '\u0417\u0443\u0431\u0430\u0441\u0442\u0438\u043a', en: 'Toothlet', descRu: '+3% \u0440\u043e\u0441\u0442\u0430 \u043e\u0442 \u0432\u0440\u0430\u0433\u043e\u0432\n+3% \u043e\u043f\u044b\u0442\u0430', descEn: '+3% enemy growth\n+3% XP', color: '#cf4a55', bonuses: { enemyGrowth: 0.03, xp: 0.03 } },
    { id: 'jor_pet_pink_glutton', category: 'pets', petId: 'jor_pet_pink_glutton', priceYan: 1690, ru: '\u0420\u043e\u0437\u043e\u0432\u044b\u0439 \u041e\u0431\u0436\u043e\u0440\u043a\u0430', en: 'Pink Glutton', descRu: '+4% \u0440\u043e\u0441\u0442\u0430 \u043e\u0442 \u0432\u0441\u0435\u0433\u043e\n+2% \u0441\u043a\u043e\u0440\u043e\u0441\u0442\u0438\n-2% \u043f\u043e\u043b\u0443\u0447\u0430\u0435\u043c\u043e\u0433\u043e \u0443\u0440\u043e\u043d\u0430', descEn: '+4% growth from everything\n+2% speed\n-2% incoming damage', color: '#ff7fbd', bonuses: { growth: 0.04, speed: 0.02, defense: 0.02 } },
    { id: 'jor_pet_ancient', category: 'pets', petId: 'jor_pet_ancient', priceYan: 2290, ru: '\u0414\u0440\u0435\u0432\u043d\u0438\u0439 \u041e\u0431\u0436\u043e\u0440\u0430', en: 'Ancient Glutton', descRu: '+5% \u0440\u043e\u0441\u0442\u0430 \u043e\u0442 \u0432\u0441\u0435\u0433\u043e\n+3% \u0441\u043a\u043e\u0440\u043e\u0441\u0442\u0438\n-3% \u043f\u043e\u043b\u0443\u0447\u0430\u0435\u043c\u043e\u0433\u043e \u0443\u0440\u043e\u043d\u0430', descEn: '+5% growth from everything\n+3% speed\n-3% incoming damage', color: '#ffd83d', bonuses: { growth: 0.05, speed: 0.03, defense: 0.03 } }
  ];

  window.JorShopPetItems = products;
})();

