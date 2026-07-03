(function () {
  'use strict';

  const categories = Array.isArray(window.JorShopCategories) ? window.JorShopCategories : [];
  const products = [
    ...(window.JorShopCharacterItems || []),
    ...(window.JorShopGrowthEffectItems || []),
    ...(window.JorShopPetItems || []),
    ...(window.JorShopIconItems || []),
    ...(window.JorShopAdItems || [])
  ];

  window.JorShopData = { categories, products };
})();
