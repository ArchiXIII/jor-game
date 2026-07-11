(function () {
  'use strict';

  const STORAGE_KEY = 'jor-shop-v1';
  const CLOUD_KEY = 'jorShop';
  const BEST_ENDLESS_SCORE_KEY = 'jor-best-endless-score';
  const state = {
    activeCategory: 'characters',
    owned: {},
    selected: { characters: '', effects: '', pets: '', icons: '' },
    timed: {},
    catalog: {},
    payments: null,
    pendingId: '',
    status: '',
    cloudLoaded: false,
    pages: {},
    previewFrame: 0,
  };
  const dom = {};

  function lang() { return typeof currentLang === 'string' && currentLang === 'en' ? 'en' : 'ru'; }
  function tr(ru, en) { return lang() === 'en' ? en : ru; }
  function products() { return window.JorShopData?.products || []; }
  function categories() { return window.JorShopData?.categories || []; }
  function byId(id) { return products().find((item) => item.id === id) || null; }
  function nowMs() { return Date.now(); }
  function timedUntil(id) { return Math.max(0, Number(state.timed?.[id] || 0)); }
  function isTimedActive(id) { return timedUntil(id) > nowMs(); }
  function bestEndlessScore() {
    let value = Math.max(0, Math.floor(Number(App?.bestEndlessScore || App?.lastLeaderboardScore || 0)));
    try {
      value = Math.max(value, Math.floor(Number(localStorage.getItem(BEST_ENDLESS_SCORE_KEY) || 0)));
    } catch (error) {}
    return value;
  }

  function isUnlockedByGameplay(item) {
    return !!item?.unlockEndlessScore && bestEndlessScore() >= Number(item.unlockEndlessScore || 0);
  }

  function isOwned(id) {
    const item = byId(id);
    return !!state.owned[id] || isTimedActive(id) || isUnlockedByGameplay(item);
  }
  function isSelectable(item) { return item && ['characters', 'effects', 'pets', 'icons'].includes(item.category); }
  function isAdItem(item) { return item?.category === 'ads' || !!item?.flags?.noRewardAd; }
  function isTimedAdItem(item) { return item?.category === 'ads' && Number(item?.flags?.noSideAdsDays || 0) > 0; }
  function isMobileLayout() {
    if (!window.matchMedia) return false;
    const vw = Math.floor(window.visualViewport?.width || window.innerWidth || 0);
    const vh = Math.floor(window.visualViewport?.height || window.innerHeight || 0);
    return window.matchMedia('(max-width: 820px), (max-height: 700px), (pointer: coarse)').matches || vw < 820 || vh < 700;
  }
  function isHorizontalShopLayout() {
    if (!window.matchMedia) return false;
    return window.matchMedia('(orientation: landscape) and (min-width: 560px)').matches;
  }
  function activeItems() { return products().filter((item) => item.category === state.activeCategory); }
  function activePage() { return Math.max(0, Math.floor(Number(state.pages[state.activeCategory]) || 0)); }
  function setActivePage(page) { state.pages[state.activeCategory] = Math.max(0, Math.floor(Number(page) || 0)); }

  function normalizeSave(data) {
    const src = data && typeof data === 'object' ? data : {};
    const owned = {};
    Object.keys(src.owned || {}).forEach((id) => {
      if (byId(id) && src.owned[id]) owned[id] = true;
    });
    const selected = { characters: '', effects: '', pets: '', icons: '' };
    Object.keys(selected).forEach((category) => {
      const id = src.selected?.[category] || '';
      const item = byId(id);
      if (id && item && (owned[id] || isUnlockedByGameplay(item))) selected[category] = id;
    });
    const timed = {};
    Object.keys(src.timed || {}).forEach((id) => {
      const until = Number(src.timed[id] || 0);
      if (byId(id) && until > nowMs()) timed[id] = until;
    });
    return { owned, selected, timed };
  }

  function loadLocal() {
    try {
      return normalizeSave(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
    } catch (error) {
      return normalizeSave({});
    }
  }

  function saveLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ owned: state.owned, selected: state.selected, timed: state.timed }));
    } catch (error) {}
  }

  async function saveCloud() {
    if (!App?.player?.setData) return false;
    try {
      await App.player.setData({ [CLOUD_KEY]: { owned: state.owned, selected: state.selected, timed: state.timed } }, false);
      return true;
    } catch (error) {
      console.warn('Shop cloud save error:', error);
      return false;
    }
  }

  async function loadCloud() {
    if (state.cloudLoaded || !App?.player?.getData) return;
    state.cloudLoaded = true;
    try {
      const data = await App.player.getData([CLOUD_KEY]);
      const cloud = normalizeSave(data?.[CLOUD_KEY]);
      state.owned = { ...state.owned, ...cloud.owned };
      Object.keys(cloud.timed).forEach((id) => {
        state.timed[id] = Math.max(timedUntil(id), cloud.timed[id]);
      });
      Object.keys(cloud.selected).forEach((category) => {
        if (cloud.selected[category]) state.selected[category] = cloud.selected[category];
      });
      saveLocal();
      await saveCloud();
      render();
    } catch (error) {
      console.warn('Shop cloud load error:', error);
    }
  }

  async function getPayments() {
    if (!App?.sdkReady || !App.ysdk?.getPayments) return null;
    if (state.payments) return state.payments;
    try {
      state.payments = await App.ysdk.getPayments();
      return state.payments;
    } catch (error) {
      state.payments = null;
      console.warn('Payments init error:', error);
      return null;
    }
  }

  async function refreshPayments() {
    await loadCloud();
    const payments = await getPayments();
    if (!payments?.getCatalog) {
      render();
      return;
    }
    try {
      const catalog = await payments.getCatalog();
      const list = Array.isArray(catalog) ? catalog : (catalog?.products || []);
      state.catalog = {};
      list.forEach((product) => {
        const id = product?.id || product?.productID || product?.productId;
        if (id) state.catalog[id] = product;
      });
      if (payments.getPurchases) {
        try {
          const purchases = await payments.getPurchases();
          await applyPurchaseList(purchases, payments);
        } catch (error) {
          console.warn('Payments purchases restore error:', error);
        }
      }
      render();
    } catch (error) {
      console.warn('Payments catalog error:', error);
    }
  }


  async function consumePurchase(payments, purchase) {
    if (!payments?.consumePurchase) return;
    const token = purchase?.purchaseToken || purchase?.token || purchase?.id;
    if (!token) return;
    try {
      await payments.consumePurchase(token);
    } catch (error) {
      console.warn('Payments consume error:', error);
    }
  }

  function grantTimed(item) {
    const days = Number(item?.flags?.noSideAdsDays || 0);
    if (days <= 0) return;
    const duration = days * 24 * 60 * 60 * 1000;
    const base = Math.max(nowMs(), timedUntil(item.id));
    state.timed[item.id] = base + duration;
    window.hideEvolutionBanner?.(true);
  }

  async function applyPurchaseList(list, payments = null) {
    let changed = false;
    const purchasesToConsume = [];
    for (const purchase of (Array.isArray(list) ? list : [])) {
      const id = purchase?.productID || purchase?.productId || purchase?.id;
      const item = byId(id);
      if (!item) continue;
      if (isTimedAdItem(item)) {
        if (!isTimedActive(item.id)) {
          grantTimed(item);
          changed = true;
        }
        purchasesToConsume.push(purchase);
        continue;
      }
      if (state.owned[item.id]) continue;
      state.owned[item.id] = true;
      if (isSelectable(item)) state.selected[item.category] = item.id;
      if (item.flags?.noRewardAd) state.selected.ads = item.id;
      changed = true;
    }
    if (changed || purchasesToConsume.length) {
      const saved = await persistShopState();
      if (saved) {
        for (const purchase of purchasesToConsume) await consumePurchase(payments, purchase);
      }
    }
    return changed;
  }

  function priceText(item) {
    if (item?.unlockEndlessScore) return '';
    const product = state.catalog[item.id];
    if (product?.price) return String(product.price);
    return lang() === 'en' ? `${item.priceYan} YAN` : `${item.priceYan} \u044f\u043d`;
  }

  function productTitle(item) { return lang() === 'en' ? item.en : item.ru; }
  function productDesc(item) { return lang() === 'en' ? item.descEn : item.descRu; }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function productDescHtml(item) {
    let text = productDesc(item);
    if (item?.bonuses && Object.keys(item.bonuses).length) {
      text = text
        .replace(/\s+(?=[+-]\d)/g, '\n')
        .replace(/,\s*(?=[+-]\d)/g, '\n')
        .replace(/\.\s+(?=[+-]\d)/g, '.\n')
        .replace(/,\s*(?=(?:\u0420\u044b\u0432\u043e\u043a|starts with dash))/i, '\n');
    }
    return escapeHtml(text).replace(/\n+/g, '<br>');
  }

  function formatDate(timestamp) {
    if (!timestamp) return '';
    try {
      return new Date(timestamp).toLocaleDateString(lang() === 'en' ? 'en-US' : 'ru-RU');
    } catch (error) {
      return '';
    }
  }
  function isCharacterItem(item) { return item?.category === 'characters'; }
  function isGrowthEffectItem(item) { return item?.category === 'effects'; }
  function isPetItem(item) { return item?.category === 'pets'; }
  function isIconItem(item) { return item?.category === 'icons'; }
  function hasImageIcon(item) { return !!item?.iconSrc; }
  function selectedCharacterSkinId() {
    const item = byId(state.selected.characters);
    return item?.skinId || item?.id || 'default';
  }

  function selectedPetId() {
    const item = byId(state.selected.pets);
    return item?.petId || item?.id || '';
  }

  function selectedProfileIconId() {
    const item = byId(state.selected.icons);
    return item?.iconId || item?.id || 'base';
  }

  function drawVisibleShopPreviews(time) {
    if (!dom.grid) return;
    if (window.JorPlayerSkins?.drawPreview) {
      dom.grid.querySelectorAll('canvas[data-character-preview]').forEach((canvas) => {
        const item = byId(canvas.dataset.itemId);
        if (item) window.JorPlayerSkins.drawPreview(canvas, item.skinId || item.id, time);
      });
    }
    if (window.JorPetSkins?.drawPreview) {
      dom.grid.querySelectorAll('canvas[data-pet-preview]').forEach((canvas) => {
        const item = byId(canvas.dataset.itemId);
        if (item) window.JorPetSkins.drawPreview(canvas, item.petId || item.id, time);
      });
    }
    if (window.JorGrowthEffects?.drawPreview) {
      const skinId = selectedCharacterSkinId();
      dom.grid.querySelectorAll('canvas[data-growth-preview]').forEach((canvas) => {
        const item = byId(canvas.dataset.itemId);
        if (item) window.JorGrowthEffects.drawPreview(canvas, item, skinId, time);
      });
    }
  }

  function startPreviewAnimation() {
    if (state.previewFrame || !dom.overlay?.classList.contains('visible')) return;
    const tick = (time) => {
      if (!dom.overlay?.classList.contains('visible')) {
        state.previewFrame = 0;
        return;
      }
      drawVisibleShopPreviews(time);
      state.previewFrame = requestAnimationFrame(tick);
    };
    state.previewFrame = requestAnimationFrame(tick);
  }

  function stopPreviewAnimation() {
    if (!state.previewFrame) return;
    cancelAnimationFrame(state.previewFrame);
    state.previewFrame = 0;
  }

  async function persistShopState() {
    saveLocal();
    return await saveCloud();
  }

  async function grant(item) {
    if (isTimedAdItem(item)) {
      grantTimed(item);
    } else {
      state.owned[item.id] = true;
      if (isSelectable(item)) state.selected[item.category] = item.id;
      if (item.category === 'icons') window.JorMetaUI?.refreshPlayer?.();
      if (item.flags?.noRewardAd) state.selected.ads = item.id;
    }
    return await persistShopState();
  }

  async function buy(item) {
    if (!item || state.pendingId) return;
    if (isOwned(item.id)) {
      await select(item);
      return;
    }
    const payments = await getPayments();
    if (!payments?.purchase) {
      state.status = '';
      render();
      return;
    }
    state.pendingId = item.id;
    state.status = '';
    render();
    try {
      const purchase = await payments.purchase({ id: item.id });
      const productId = purchase?.productID || purchase?.productId || purchase?.id || item.id;
      const bought = byId(productId) || item;
      const saved = await grant(bought);
      if (saved && bought.flags?.consumePurchase && payments.consumePurchase) await consumePurchase(payments, purchase);
      state.status = saved
        ? tr('\u041f\u043e\u043a\u0443\u043f\u043a\u0430 \u043f\u0440\u0438\u043c\u0435\u043d\u0435\u043d\u0430', 'Purchase applied')
        : tr('\u041f\u043e\u043a\u0443\u043f\u043a\u0430 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0430 \u043b\u043e\u043a\u0430\u043b\u044c\u043d\u043e', 'Purchase saved locally');
    } catch (error) {
      console.warn('Purchase error:', error);
      state.status = tr('\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043f\u0440\u0438\u043c\u0435\u043d\u0438\u0442\u044c \u043f\u043e\u043a\u0443\u043f\u043a\u0443', 'Purchase failed');
    } finally {
      state.pendingId = '';
      render();
    }
  }

  async function select(item) {
    if (!item || !isSelectable(item) || !isOwned(item.id)) return;
    state.selected[item.category] = item.id;
    await persistShopState();
    if (item.category === 'icons') window.JorMetaUI?.refreshPlayer?.();
    render();
  }

  function open() {
    dom.overlay?.classList.add('visible');
    dom.overlay?.setAttribute('aria-hidden', 'false');
    refreshPayments();
    render();
  }

  function close() {
    dom.overlay?.classList.remove('visible');
    dom.overlay?.setAttribute('aria-hidden', 'true');
    stopPreviewAnimation();
  }

  function renderTabs() {
    if (!dom.tabs) return;
    dom.tabs.replaceChildren();
    categories().forEach((category) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = category.id === state.activeCategory ? 'active' : '';
      button.textContent = lang() === 'en' ? category.en : category.ru;
      button.addEventListener('click', () => {
        state.activeCategory = category.id;
        setActivePage(0);
        render();
      });
      dom.tabs.appendChild(button);
    });
  }

  function createProductCard(item) {
    const owned = isOwned(item.id);
    const gameplayLocked = !!item.unlockEndlessScore && !owned;
    const selected = isSelectable(item) && state.selected[item.category] === item.id;
    const card = document.createElement('article');
    card.className = 'shopItem' + (isCharacterItem(item) || isGrowthEffectItem(item) || isPetItem(item) ? ' characterPreview' : '') + (isIconItem(item) ? ' profileIconPreview' : '') + (isAdItem(item) ? ' adPreview' : '') + (owned ? ' owned' : '') + (selected ? ' selected' : '') + (gameplayLocked ? ' gameplayLocked' : '');
    card.style.setProperty('--shop-accent', item.color || '#7af2ff');
    const activeUntil = isTimedAdItem(item) ? timedUntil(item.id) : 0;
    const action = owned
      ? (isTimedAdItem(item) ? tr('\u0410\u043a\u0442\u0438\u0432\u043d\u043e', 'Active') : (isAdItem(item) ? tr('\u041a\u0443\u043f\u043b\u0435\u043d\u043e', 'Owned') : (selected ? tr('\u0412\u044b\u0431\u0440\u0430\u043d\u043e', 'Selected') : tr('\u0412\u044b\u0431\u0440\u0430\u0442\u044c', 'Select'))))
      : (gameplayLocked ? '' : priceText(item));
    const unlockHint = gameplayLocked
      ? tr('\u041e\u0442\u043a\u0440\u044b\u0432\u0430\u0435\u0442\u0441\u044f \u0437\u0430 \u043d\u0430\u0431\u0440\u0430\u043d\u043d\u044b\u0435 70 000 \u043e\u043f\u044b\u0442\u0430 \u0432 \u0431\u0435\u0441\u043a\u043e\u043d\u0435\u0447\u043d\u043e\u043c \u0440\u0435\u0436\u0438\u043c\u0435', 'Unlocks at 70,000 endless mode score')
      : '';
    const descHtml = activeUntil > nowMs()
      ? `${productDescHtml(item)}<br>${tr('\u0410\u043a\u0442\u0438\u0432\u043d\u043e \u0434\u043e: ', 'Active until: ')}${escapeHtml(formatDate(activeUntil))}`
      : productDescHtml(item);
    const preview = isCharacterItem(item)
      ? `<canvas class="shopItemPreview" data-character-preview="1" data-item-id="${item.id}" aria-hidden="true"></canvas>`
      : isGrowthEffectItem(item)
        ? `<canvas class="shopItemPreview" data-growth-preview="1" data-item-id="${item.id}" aria-hidden="true"></canvas>`
        : isPetItem(item)
          ? `<canvas class="shopItemPreview" data-pet-preview="1" data-item-id="${item.id}" aria-hidden="true"></canvas>`
          : isIconItem(item)
            ? `<span class="shopProfileIconPreview" aria-hidden="true"><img src="${escapeHtml(window.JorProfileIcons?.getIcon?.(item.iconId || item.id)?.src || '')}" alt=""></span>`
            : hasImageIcon(item)
              ? `<span class="shopImageIconPreview" aria-hidden="true"><img src="${escapeHtml(item.iconSrc)}" alt=""></span>`
              : '<div class="shopItemIcon" aria-hidden="true"></div>';
    card.innerHTML = `
      ${preview}
      <div class="shopItemBody">
        <h3>${productTitle(item)}</h3>
        <p>${descHtml}</p>
      </div>
      ${gameplayLocked ? '' : `<button class="shopBuyBtn" type="button" ${((state.pendingId && state.pendingId !== item.id) || (owned && isAdItem(item))) ? 'disabled' : ''}>${state.pendingId === item.id ? tr('\u041f\u043e\u043a\u0443\u043f\u043a\u0430...', 'Purchasing...') : action}</button>`}
      ${unlockHint ? `<div class="shopUnlockHint">${escapeHtml(unlockHint)}</div>` : ''}
    `;
    const previewCanvas = card.querySelector('canvas[data-character-preview]');
    if (previewCanvas && window.JorPlayerSkins?.drawPreview) {
      window.JorPlayerSkins.drawPreview(previewCanvas, item.skinId || item.id, performance.now());
    }
    const petCanvas = card.querySelector('canvas[data-pet-preview]');
    if (petCanvas && window.JorPetSkins?.drawPreview) {
      window.JorPetSkins.drawPreview(petCanvas, item.petId || item.id, performance.now());
    }
    const effectCanvas = card.querySelector('canvas[data-growth-preview]');
    if (effectCanvas && window.JorGrowthEffects?.drawPreview) {
      window.JorGrowthEffects.drawPreview(effectCanvas, item, selectedCharacterSkinId(), performance.now());
    }
    const actionButton = card.querySelector('button');
    if (actionButton) {
      actionButton.addEventListener('click', async () => {
        if (owned) {
          if (!isAdItem(item)) await select(item);
          return;
        }
        await buy(item);
      });
    }
    return card;
  }

  function renderPager(totalPages, page) {
    if (!dom.pager) return;
    dom.pager.replaceChildren();
    if (!isMobileLayout() || totalPages <= 1) return;

    const prev = document.createElement('button');
    const next = document.createElement('button');
    const label = document.createElement('span');
    prev.type = 'button';
    next.type = 'button';
    prev.className = 'shopPageArrow';
    next.className = 'shopPageArrow';
    label.className = 'shopPageLabel';
    prev.textContent = '\u2039';
    next.textContent = '\u203a';
    label.textContent = `${page + 1}/${totalPages}`;
    prev.disabled = page <= 0;
    next.disabled = page >= totalPages - 1;
    prev.addEventListener('click', () => { setActivePage(page - 1); render(); });
    next.addEventListener('click', () => { setActivePage(page + 1); render(); });
    dom.pager.append(prev, label, next);
  }

  function renderProducts() {
    if (!dom.grid) return;
    dom.grid.replaceChildren();
    const items = activeItems();
    const compact = isMobileLayout();
    const paged = compact;
    const horizontal = paged && isHorizontalShopLayout();
    dom.panel?.classList.toggle('shopPaged', paged);
    dom.panel?.classList.toggle('shopPagedHorizontal', horizontal);
    const gridRect = dom.grid.getBoundingClientRect();
    const cardGap = 10;
    const cardAspect = 2.05;
    const twoColumnCardHeight = ((gridRect.width - cardGap) / 2) / cardAspect;
    const canFitFour = horizontal && gridRect.height >= twoColumnCardHeight * 2 + cardGap + 2;
    dom.panel?.classList.toggle('shopPagedFour', canFitFour);
    const perPage = paged ? (canFitFour ? 4 : 2) : items.length || 1;
    const totalPages = Math.max(1, Math.ceil(items.length / perPage));
    const page = Math.min(activePage(), totalPages - 1);
    if (page !== activePage()) setActivePage(page);
    const visibleItems = paged ? items.slice(page * perPage, page * perPage + perPage) : items;
    visibleItems.forEach((item) => dom.grid.appendChild(createProductCard(item)));
    renderPager(totalPages, page);
    startPreviewAnimation();
  }

  function render() {
    renderTabs();
    renderProducts();
    if (dom.title) dom.title.textContent = tr('\u041c\u0430\u0433\u0430\u0437\u0438\u043d', 'Shop');
    if (dom.status) dom.status.textContent = state.status || '';
  }

  function getBonuses() {
    const total = { speed: 0, growth: 0, defense: 0, hunt: 0, enemyGrowth: 0, startDashLevel: 0, xp: 0 };
    ['characters', 'effects', 'pets'].forEach((category) => {
      const item = byId(state.selected[category]);
      if (!item?.bonuses) return;
      Object.keys(total).forEach((key) => {
        total[key] += Number(item.bonuses[key] || 0);
      });
    });
    return total;
  }

  function getGrowthVisual() {
    const item = byId(state.selected.effects);
    if (item) return window.JorGrowthEffects?.resolveVisual?.(item) || null;
    return window.JorGrowthEffectSkins?.getEffect?.('default') || null;
  }

  function hasNoRewardAds() {
    return products().some((item) => item.flags?.noRewardAd && isOwned(item.id));
  }

  function hasNoSideAds() {
    return products().some((item) => isTimedAdItem(item) && isTimedActive(item.id));
  }

  function init() {
    Object.assign(state, loadLocal());
    dom.overlay = document.getElementById('shopOverlay');
    dom.panel = document.getElementById('shopPanel') || dom.overlay?.querySelector('.shopPanel');
    dom.close = document.getElementById('shopCloseBtn');
    dom.tabs = document.getElementById('shopTabs');
    dom.grid = document.getElementById('shopGrid');
    dom.status = document.getElementById('shopStatus');
    dom.title = document.getElementById('shopTitle');
    dom.pager = document.getElementById('shopPager');
    document.getElementById('startShopBtn')?.addEventListener('click', open);
    dom.close?.addEventListener('click', close);
    const resizeShopRender = () => { if (dom.overlay?.classList.contains('visible')) render(); };
    window.addEventListener('resize', resizeShopRender);
    window.addEventListener('orientationchange', resizeShopRender);
    render();
  }

  window.JorShopUI = { init, open, close, refreshPayments, getBonuses, getGrowthVisual, hasNoRewardAds, hasNoSideAds, selectedCharacterSkinId, selectedPetId, selectedProfileIconId, bestEndlessScore };
})();







