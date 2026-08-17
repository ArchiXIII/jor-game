(function () {
  'use strict';

  const config = window.JorPlatformConfig && typeof window.JorPlatformConfig === 'object'
    ? window.JorPlatformConfig
    : { name: 'local', features: {} };
  let adapter = null;
  let initPromise = null;
  let initialized = false;
  let ready = false;
  let language = '';

  function call(method, ...args) {
    const fn = adapter && adapter[method];
    return typeof fn === 'function' ? fn.apply(adapter, args) : null;
  }

  const leaderboardApi = {
    getPlayerEntry(name) {
      return call('getLeaderboardPlayerEntry', name);
    },
    setScore(name, score) {
      return call('setLeaderboardScore', name, score);
    },
    getEntries(name, options) {
      return call('getLeaderboardEntries', name, options);
    }
  };

  const Platform = {
    name: String(config.name || 'local'),
    features: config.features && typeof config.features === 'object' ? config.features : {},

    registerAdapter(source) {
      adapter = source && typeof source === 'object' ? source : null;
      if (adapter?.name) this.name = String(adapter.name);
      return this;
    },

    init(handlers = {}) {
      if (initPromise) return initPromise;
      initPromise = Promise.resolve(call('init', handlers)).then((result) => {
        const state = result && typeof result === 'object' ? result : {};
        initialized = true;
        ready = !!state.ready;
        if (state.name || adapter?.name) this.name = String(state.name || adapter.name);
        language = String(state.language || call('getLanguage') || '');
        return state;
      }).catch((error) => {
        initialized = true;
        ready = false;
        throw error;
      });
      return initPromise;
    },

    isInitialized() {
      return initialized;
    },

    whenInitialized() {
      return initPromise || Promise.resolve(null);
    },

    isReady() {
      return ready;
    },

    getLanguage() {
      return language || String(call('getLanguage') || '');
    },

    hasFeature(name) {
      return this.features[name] !== false;
    },

    ensurePlayer() {
      return Promise.resolve(call('ensurePlayer'));
    },

    isAuthorized() {
      return !!call('isAuthorized');
    },

    getPlayerId() {
      return String(call('getPlayerId') || '');
    },

    getPlayerName() {
      return String(call('getPlayerName') || '');
    },

    hasCloudStorage() {
      if (this.features.cloudStorage === false || typeof adapter?.loadData !== 'function' || typeof adapter?.saveData !== 'function') return false;
      return typeof adapter?.hasCloudStorage === 'function' ? !!adapter.hasCloudStorage() : ready;
    },

    loadData(keys) {
      return Promise.resolve(call('loadData', keys) || {});
    },

    saveData(payload, flush) {
      return Promise.resolve(call('saveData', payload, flush) ?? false);
    },

    gameplayStart() {
      call('gameplayStart');
    },

    gameplayStop() {
      call('gameplayStop');
    },

    notifyGameReady() {
      return Promise.resolve(call('notifyGameReady') ?? false);
    },

    showStickyBanner() {
      return Promise.resolve(call('showStickyBanner') ?? false);
    },

    hideStickyBanner() {
      return Promise.resolve(call('hideStickyBanner') ?? false);
    },

    showInterstitial(handlers) {
      return Promise.resolve(call('showInterstitial', handlers) ?? false);
    },

    showRewarded(handlers) {
      return Promise.resolve(call('showRewarded', handlers) ?? false);
    },

    getDeveloperGamesUrl() {
      return Promise.resolve(call('getDeveloperGamesUrl'));
    },

    getLeaderboardApi() {
      if (!ready || this.features.leaderboards === false || typeof adapter?.getLeaderboardEntries !== 'function') return null;
      return leaderboardApi;
    },

    getCatalog() {
      return Promise.resolve(call('getCatalog') || []);
    },

    getPurchases() {
      return Promise.resolve(call('getPurchases') || []);
    },

    purchase(options) {
      return Promise.resolve(call('purchase', options));
    },

    consumePurchase(token) {
      return Promise.resolve(call('consumePurchase', token));
    }
  };

  window.JorPlatform = Platform;
})();
