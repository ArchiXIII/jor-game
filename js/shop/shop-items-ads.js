(function () {
  'use strict';

  const products = [
    { id: 'jor_no_side_ads_30d', category: 'ads', priceYan: 119, ru: '\u0411\u043e\u043b\u044c\u0448\u0435 \u043c\u0435\u0441\u0442\u0430 \u043d\u0430 30 \u0434\u043d\u0435\u0439', en: 'More space for 30 days', descRu: '\u0423\u0431\u0438\u0440\u0430\u0435\u0442 \u0431\u043e\u043a\u043e\u0432\u0443\u044e \u0440\u0435\u043a\u043b\u0430\u043c\u0443 \u043d\u0430 30 \u0434\u043d\u0435\u0439 \u0438 \u0440\u0430\u0441\u0448\u0438\u0440\u044f\u0435\u0442 \u043c\u0435\u0441\u0442\u043e \u043f\u043e\u0434 \u0438\u0433\u0440\u0443', descEn: 'Removes the side banner for 30 days and gives the game more space', color: '#8fffd6', iconSrc: 'sprites/shop-icons/no-side-ads-30d.png', bonuses: {}, flags: { noSideAdsDays: 30, consumePurchase: true } },
    { id: 'jor_no_reward_ads', category: 'ads', priceYan: 590, ru: '\u0422\u0440\u0435\u0442\u0438\u0439 \u0432\u044b\u0431\u043e\u0440 \u0431\u0435\u0437 \u0440\u0435\u043a\u043b\u0430\u043c\u044b', en: 'Ad-free third choice', descRu: '\u041d\u0430\u0432\u0441\u0435\u0433\u0434\u0430 \u043e\u0442\u043a\u0440\u044b\u0432\u0430\u0435\u0442 \u0442\u0440\u0435\u0442\u0438\u0439 \u0432\u0430\u0440\u0438\u0430\u043d\u0442 \u043c\u0443\u0442\u0430\u0446\u0438\u0438 \u0431\u0435\u0437 \u043f\u0440\u043e\u0441\u043c\u043e\u0442\u0440\u0430 \u0440\u0435\u043a\u043b\u0430\u043c\u044b', descEn: 'Permanently unlocks the third mutation option without watching an ad', color: '#ffe27a', iconSrc: 'sprites/shop-icons/no-reward-ads.png', bonuses: {}, flags: { noRewardAd: true } }
  ];

  window.JorShopAdItems = products;
})();

