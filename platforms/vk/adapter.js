(function () {
  'use strict';

  const config = window.JorPlatformConfig || {};
  const TOP_SCORE = 'topScore';
  const CACHE_KEY = 'jor-ok-endless-top10-v1';
  const BEST_KEY = 'jor-endless-best-v1';
  const SUBMITTED_KEY = 'jor-endless-submitted-v1';
  const FULL_TTL = 6 * 60 * 60 * 1000;
  const PARTIAL_TTL = 10 * 60 * 1000;
  const EMPTY_TTL = 2 * 60 * 1000;

  const adapter = {
    name: 'vk',
    bridge: null,
    launchParams: null,
    rawLaunchParams: '',
    user: null,
    backend: null,
    cloudData: null,
    cloudLoadPromise: null,
    leaderboardCache: null,
    leaderboardCacheAt: 0,
    leaderboardLoadPromise: null,
    vkToken: '',
    submitPromise: null,
    purchasePromise: null,
    adInFlight: false,

    async init(handlers) {
      this.rawLaunchParams = String(window.location.search || '').replace(/^\?/, '');
      const source = window.vkBridge && (window.vkBridge.default || window.vkBridge);
      this.bridge = source && typeof source.send === 'function' ? source : null;
      if (!this.bridge) return { ready: false, language: '' };
      await this.bridge.send('VKWebAppInit');
      try {
        this.launchParams = await this.bridge.send('VKWebAppGetLaunchParams');
      } catch (error) {
        this.launchParams = null;
      }
      this.name = this.isOk() ? 'ok' : 'vk';
      await this.ensurePlayer();
      this.backend = window.JorVkBackendClient ? new window.JorVkBackendClient({
        baseUrl: config.backendUrl,
        clientVersion: config.backendClientVersion,
        timeout: 6000,
        getLaunchParams: () => this.rawLaunchParams
      }) : null;
      if (typeof this.bridge.subscribe === 'function') {
        this.bridge.subscribe((event) => {
          const type = event?.detail?.type || '';
          if (type === 'VKWebAppViewHide') handlers?.onPause?.();
          else if (type === 'VKWebAppViewRestore') handlers?.onResume?.();
        });
      }
      return { ready: true, language: this.getLanguage() };
    },

    isOk() {
      const query = new URLSearchParams(window.location.search || '');
      return String(this.launchParams?.vk_client || query.get('vk_client') || '').toLowerCase() === 'ok';
    },

    getLanguage() {
      const query = new URLSearchParams(window.location.search || '');
      return String(this.launchParams?.vk_language || query.get('vk_language') || query.get('lang') || '');
    },

    async ensurePlayer() {
      if (this.user || !this.bridge) return this.user;
      try {
        this.user = await this.bridge.send('VKWebAppGetUserInfo');
      } catch (error) {
        this.user = null;
      }
      return this.user;
    },

    isAuthorized() {
      return !!this.getPlayerId();
    },

    getPlayerId() {
      const query = new URLSearchParams(window.location.search || '');
      if (this.isOk()) {
        return String(this.launchParams?.vk_ok_user_id || query.get('vk_ok_user_id') || '');
      }
      return String(this.user?.id || this.launchParams?.vk_user_id || query.get('vk_user_id') || '');
    },

    getPlayerName() {
      const name = [this.user?.first_name, this.user?.last_name].filter(Boolean).join(' ').trim();
      return name || this.getPlayerId();
    },

    hasCloudStorage() {
      return !!this.bridge && this.isAuthorized();
    },

    async readCloud() {
      if (this.cloudData) return this.cloudData;
      if (this.cloudLoadPromise) return this.cloudLoadPromise;
      this.cloudLoadPromise = this.bridge.send('VKWebAppStorageGet', { keys: [config.storageKey] })
        .then((response) => {
          const raw = response?.keys?.[0]?.value || '';
          try {
            this.cloudData = raw ? JSON.parse(raw) : {};
          } catch (error) {
            this.cloudData = {};
          }
          return this.cloudData;
        })
        .finally(() => {
          this.cloudLoadPromise = null;
        });
      return this.cloudLoadPromise;
    },

    async loadData(keys) {
      const data = await this.readCloud();
      const result = {};
      (keys || []).forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(data, key)) result[key] = data[key];
      });
      return result;
    },

    async saveData(payload) {
      const data = await this.readCloud();
      Object.assign(data, payload || {});
      await this.bridge.send('VKWebAppStorageSet', {
        key: config.storageKey,
        value: JSON.stringify(data)
      });
      return true;
    },

    gameplayStart() {},
    gameplayStop() {},
    notifyGameReady() { return true; },

    playerStorageKey(base) {
      return `${base}:${this.name}:${this.getPlayerId() || 'guest'}`;
    },

    loadNumber(base) {
      try {
        return Math.max(0, Math.floor(Number(localStorage.getItem(this.playerStorageKey(base))) || 0));
      } catch (error) {
        return 0;
      }
    },

    saveNumber(base, value) {
      try {
        localStorage.setItem(this.playerStorageKey(base), String(Math.max(0, Math.floor(Number(value) || 0))));
      } catch (error) {}
    },

    loadStoredCache() {
      if (!this.isOk()) return null;
      try {
        const source = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
        if (!source || !Array.isArray(source.entries)) return null;
        return { entries: source.entries.slice(0, 10), savedAt: Math.max(0, Number(source.savedAt) || 0) };
      } catch (error) {
        return null;
      }
    },

    saveStoredCache(entries) {
      if (!this.isOk()) return;
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: this.leaderboardCacheAt, entries: entries.slice(0, 10) }));
      } catch (error) {}
    },

    cacheTtl(entries) {
      if (!entries.length) return EMPTY_TTL;
      return entries.length < 10 ? PARTIAL_TTL : FULL_TTL;
    },

    normalizeBackendEntries(payload) {
      return (payload?.entries || []).slice(0, 10).map((entry, index) => ({
        rank: Math.max(1, Math.floor(Number(entry.rank) || index + 1)),
        userId: String(entry.userId || ''),
        name: String(entry.playerName || entry.userId || ''),
        score: Math.max(0, Math.floor(Number(entry.score ?? entry.bestScore) || 0))
      }));
    },

    async refreshOkLeaderboard() {
      if (this.leaderboardLoadPromise) return this.leaderboardLoadPromise;
      this.leaderboardLoadPromise = this.backend.getOkLeaderboard()
        .then((payload) => {
          this.leaderboardCache = this.normalizeBackendEntries(payload);
          this.leaderboardCacheAt = Date.now();
          this.saveStoredCache(this.leaderboardCache);
          return this.leaderboardCache.slice();
        })
        .finally(() => {
          this.leaderboardLoadPromise = null;
        });
      return this.leaderboardLoadPromise;
    },

    async loadOkLeaderboard(force) {
      if (!this.leaderboardCache) {
        const stored = this.loadStoredCache();
        if (stored) {
          this.leaderboardCache = stored.entries;
          this.leaderboardCacheAt = stored.savedAt;
        }
      }
      const entries = this.leaderboardCache;
      const fresh = entries && Date.now() - this.leaderboardCacheAt < this.cacheTtl(entries);
      if (!force && fresh) return entries.slice();
      if (!force && entries) {
        this.refreshOkLeaderboard().catch(() => {});
        return entries.slice();
      }
      return this.refreshOkLeaderboard();
    },

    isTopCandidate(entries, score) {
      const userId = this.getPlayerId();
      const own = entries.find((entry) => entry.userId === userId);
      if (own) return score > own.score;
      return entries.length < 10 || score > entries[entries.length - 1].score;
    },

    async getVkToken() {
      if (this.vkToken) return this.vkToken;
      const appId = Math.max(0, Math.floor(Number(config.appId || this.launchParams?.vk_app_id) || 0));
      if (!appId) throw new Error('VK_APP_ID_UNAVAILABLE');
      const response = await this.bridge.send('VKWebAppGetAuthToken', { app_id: appId, scope: '' });
      this.vkToken = String(response?.access_token || '');
      if (!this.vkToken) throw new Error('VK_TOKEN_UNAVAILABLE');
      return this.vkToken;
    },

    async loadVkLeaderboard() {
      const token = await this.getVkToken();
      const response = await this.bridge.send('VKWebAppCallAPIMethod', {
        method: 'apps.getLeaderboard',
        params: {
          type: 'score',
          global: 1,
          extended: 1,
          access_token: token,
          v: String(config.apiVersion || '5.199')
        }
      });
      const source = response?.response || response || {};
      const names = new Map();
      (source.profiles || []).forEach((profile) => {
        names.set(String(profile.id || ''), [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim());
      });
      return (source.items || []).map((item, index) => {
        const userId = String(item.user_id || '');
        return {
          rank: Math.max(1, Math.floor(Number(item.rank || item.place) || index + 1)),
          userId,
          name: names.get(userId) || userId,
          score: Math.max(0, Math.floor(Number(item.points ?? item.score) || 0))
        };
      }).filter((entry) => entry.rank <= 10 || entry.userId === this.getPlayerId());
    },

    toPlatformEntries(entries) {
      const userId = this.getPlayerId();
      const top = entries.filter((entry) => Number.isFinite(entry.rank) && entry.rank <= 10).slice(0, 10);
      const own = entries.find((entry) => entry.userId === userId && !top.includes(entry));
      const rows = top.map((entry) => ({
        rank: entry.rank,
        score: entry.score,
        isUser: entry.userId === userId,
        player: { uniqueID: entry.userId, publicName: entry.name || entry.userId }
      }));
      if (own) {
        rows.push({
          rank: own.rank,
          score: own.score,
          isUser: true,
          player: { uniqueID: own.userId, publicName: own.name || this.getPlayerName() }
        });
      }
      const localBest = this.loadNumber(BEST_KEY);
      if (localBest > 0 && !rows.some((entry) => entry.isUser)) {
        rows.push({
          rank: null,
          score: localBest,
          isUser: true,
          player: { uniqueID: userId, publicName: this.getPlayerName() }
        });
      }
      return { entries: rows };
    },

    async getLeaderboardPlayerEntry(name) {
      if (name !== TOP_SCORE) throw new Error('LEADERBOARD_UNAVAILABLE');
      return { score: this.loadNumber(BEST_KEY) };
    },

    async setLeaderboardScore(name, value) {
      if (name !== TOP_SCORE || !this.backend) return false;
      const score = Math.max(this.loadNumber(BEST_KEY), Math.floor(Number(value) || 0));
      this.saveNumber(BEST_KEY, score);
      if (!score || score <= this.loadNumber(SUBMITTED_KEY)) return true;
      if (this.submitPromise) return this.submitPromise;
      this.submitPromise = (async () => {
        if (this.isOk()) {
          const entries = await this.loadOkLeaderboard(false);
          if (!this.isTopCandidate(entries, score)) return true;
          const payload = await this.backend.submitOkScore(score, this.getPlayerName());
          this.leaderboardCache = this.normalizeBackendEntries(payload);
          this.leaderboardCacheAt = Date.now();
          this.saveStoredCache(this.leaderboardCache);
          const serverBest = Math.max(score, Math.floor(Number(payload?.bestScore) || 0));
          this.saveNumber(BEST_KEY, serverBest);
          this.saveNumber(SUBMITTED_KEY, serverBest);
        } else {
          await this.backend.submitVkScore(score);
          this.saveNumber(SUBMITTED_KEY, score);
        }
        return true;
      })().finally(() => {
        this.submitPromise = null;
      });
      return this.submitPromise;
    },

    async getLeaderboardEntries(name) {
      if (name !== TOP_SCORE) throw new Error('LEADERBOARD_UNAVAILABLE');
      const entries = this.isOk() ? await this.loadOkLeaderboard(false) : await this.loadVkLeaderboard();
      return this.toPlatformEntries(entries);
    },

    getCatalog() {
      const suffix = this.isOk() ? ' \u041e\u041a' : (this.getLanguage().toLowerCase().startsWith('ru') ? ' \u0433\u043e\u043b\u043e\u0441\u043e\u0432' : ' votes');
      const source = config.products || {};
      return Object.keys(source).map((id) => ({
        id,
        price: String(this.isOk() ? source[id].okPrice : source[id].votes) + suffix
      }));
    },

    getPurchases() {
      if (!this.backend || !this.isAuthorized()) return Promise.resolve({ purchases: [], authoritative: false });
      return this.backend.getPurchases(this.isOk() ? 'ok' : 'vk');
    },

    async purchase(options) {
      const id = String(options?.id || '');
      if (!id || !config.products?.[id] || !this.bridge || !this.backend || this.purchasePromise) {
        throw new Error('PURCHASE_UNAVAILABLE');
      }
      this.purchasePromise = (async () => {
        const language = this.getLanguage().toLowerCase();
        const localizedId = `${id}__${language && !language.startsWith('ru') ? 'en' : 'ru'}`;
        try {
          await this.bridge.send('VKWebAppShowOrderBox', { type: 'item', item: localizedId });
        } catch (error) {
          if (!this.isOk()) throw error;
        }
        const delays = [300, 1500, 4000];
        for (const delay of delays) {
          await new Promise((resolve) => window.setTimeout(resolve, delay));
          const payload = await this.getPurchases();
          const purchase = (payload?.purchases || []).find((entry) => entry?.productId === id);
          if (purchase) return purchase;
        }
        throw new Error('PURCHASE_CONFIRMATION_PENDING');
      })().finally(() => {
        this.purchasePromise = null;
      });
      return this.purchasePromise;
    },

    consumePurchase() {
      return Promise.resolve(true);
    },

    async showRewarded(handlers) {
      if (!this.bridge || this.adInFlight) {
        handlers?.onError?.(new Error('REWARDED_AD_UNAVAILABLE'));
        return false;
      }
      this.adInFlight = true;
      handlers?.onOpen?.();
      try {
        const response = await this.bridge.send('VKWebAppShowNativeAds', { ad_format: 'reward' });
        const rewarded = !!response?.result;
        if (rewarded) handlers?.onRewarded?.();
        handlers?.onClose?.(rewarded);
        return rewarded;
      } catch (error) {
        handlers?.onError?.(error);
        return false;
      } finally {
        this.adInFlight = false;
      }
    },

    async showInterstitial(handlers) {
      if (!this.bridge || this.adInFlight) {
        handlers?.onError?.(new Error('INTERSTITIAL_AD_UNAVAILABLE'));
        return false;
      }
      this.adInFlight = true;
      handlers?.onOpen?.();
      try {
        const response = await this.bridge.send('VKWebAppShowNativeAds', { ad_format: 'interstitial' });
        const shown = !!response?.result;
        handlers?.onClose?.(shown);
        return shown;
      } catch (error) {
        handlers?.onError?.(error);
        return false;
      } finally {
        this.adInFlight = false;
      }
    }
  };

  window.JorPlatform?.registerAdapter(adapter);
})();
