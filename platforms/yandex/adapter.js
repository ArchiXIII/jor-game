(function () {
  'use strict';

  const adapter = {
    name: 'yandex',
    sdk: null,
    player: null,
    payments: null,
    leaderboards: null,

    async init(handlers) {
      if (typeof YaGames === 'undefined') return { ready: false, language: '' };
      this.sdk = window.jorYandexSdkPromise ? await window.jorYandexSdkPromise : await YaGames.init();
      if (!this.sdk) throw window.jorYandexSdkInitError || new Error('Yandex SDK initialization failed');
      if (typeof this.sdk.on === 'function') {
        this.sdk.on('game_api_pause', () => handlers?.onPause?.());
        this.sdk.on('game_api_resume', () => handlers?.onResume?.());
      }
      await this.ensurePlayer();
      return { ready: true, language: this.getLanguage() };
    },

    getLanguage() {
      return String(this.sdk?.environment?.i18n?.lang || '');
    },

    async ensurePlayer() {
      if (this.player || !this.sdk?.getPlayer) return this.player;
      try {
        this.player = await this.sdk.getPlayer();
      } catch (error) {
        this.player = null;
      }
      return this.player;
    },

    hasCloudStorage() {
      return !!this.player;
    },

    isAuthorized() {
      try {
        return !!this.player?.isAuthorized?.();
      } catch (error) {
        return false;
      }
    },

    getPlayerId() {
      try {
        return String(this.player?.getUniqueID?.() || '');
      } catch (error) {
        return '';
      }
    },

    getPlayerName() {
      try {
        return String(this.player?.getName?.() || this.getPlayerId() || '');
      } catch (error) {
        return this.getPlayerId();
      }
    },

    loadData(keys) {
      return this.player?.getData ? this.player.getData(keys) : Promise.resolve({});
    },

    saveData(payload, flush) {
      return this.player?.setData ? this.player.setData(payload, !!flush).then(() => true) : Promise.resolve(false);
    },

    gameplayStart() {
      this.sdk?.features?.GameplayAPI?.start?.();
    },

    gameplayStop() {
      this.sdk?.features?.GameplayAPI?.stop?.();
    },

    notifyGameReady() {
      if (window.jorLoadingReadySent) return true;
      const api = this.sdk?.features?.LoadingAPI;
      if (typeof api?.ready !== 'function') return false;
      api.ready();
      window.jorLoadingReadySent = true;
      return true;
    },

    async showStickyBanner() {
      const adv = this.sdk?.adv;
      if (!adv?.showBannerAdv) return false;
      if (adv.getBannerAdvStatus) {
        const status = await adv.getBannerAdvStatus();
        if (status?.stickyAdvIsShowing) return true;
      }
      const result = await adv.showBannerAdv();
      return Boolean(result?.stickyAdvIsShowing ?? true);
    },

    async hideStickyBanner() {
      if (!this.sdk?.adv?.hideBannerAdv) return false;
      await this.sdk.adv.hideBannerAdv();
      return true;
    },

    showInterstitial(handlers) {
      return new Promise((resolve) => {
        if (!this.sdk?.adv?.showFullscreenAdv) {
          resolve(false);
          return;
        }
        let settled = false;
        const finish = (shown) => {
          if (settled) return;
          settled = true;
          resolve(shown);
        };
        try {
          this.sdk.adv.showFullscreenAdv({
            callbacks: {
              onOpen: () => handlers?.onOpen?.(),
              onClose: () => {
                handlers?.onClose?.();
                finish(true);
              },
              onError: (error) => {
                handlers?.onError?.(error);
                finish(false);
              }
            }
          });
        } catch (error) {
          handlers?.onError?.(error);
          finish(false);
        }
      });
    },

    showRewarded(handlers) {
      return new Promise((resolve) => {
        if (!this.sdk?.adv?.showRewardedVideo) {
          resolve(false);
          return;
        }
        let rewarded = false;
        try {
          this.sdk.adv.showRewardedVideo({
            callbacks: {
              onOpen: () => handlers?.onOpen?.(),
              onRewarded: () => {
                rewarded = true;
                handlers?.onRewarded?.();
              },
              onClose: () => {
                handlers?.onClose?.(rewarded);
                resolve(rewarded);
              },
              onError: (error) => {
                handlers?.onError?.(error);
                resolve(false);
              }
            }
          });
        } catch (error) {
          handlers?.onError?.(error);
          resolve(false);
        }
      });
    },

    async getDeveloperGamesUrl() {
      const api = this.sdk?.features?.GamesAPI;
      if (!api?.getAllGames) return '';
      const result = await api.getAllGames();
      return String(result?.developerURL || result?.games?.[0]?.url || '');
    },

    async getLeaderboards() {
      if (this.leaderboards) return this.leaderboards;
      if (this.sdk?.leaderboards) this.leaderboards = this.sdk.leaderboards;
      else if (this.sdk?.getLeaderboards) this.leaderboards = await this.sdk.getLeaderboards();
      return this.leaderboards;
    },

    async getLeaderboardPlayerEntry(name) {
      const api = await this.getLeaderboards();
      if (!api) throw new Error('Leaderboards unavailable');
      if (api.getPlayerEntry) return api.getPlayerEntry(name);
      if (api.getLeaderboardPlayerEntry) return api.getLeaderboardPlayerEntry(name);
      throw new Error('Player leaderboard entry unavailable');
    },

    async setLeaderboardScore(name, score) {
      const api = await this.getLeaderboards();
      if (!api) return false;
      if (this.sdk?.isAvailableMethod) {
        const available = await this.sdk.isAvailableMethod('leaderboards.setScore');
        if (!available) return false;
      }
      if (api.setScore) await api.setScore(name, score);
      else if (api.setLeaderboardScore) await api.setLeaderboardScore(name, score);
      else return false;
      return true;
    },

    async getLeaderboardEntries(name, options) {
      const api = await this.getLeaderboards();
      if (!api) throw new Error('Leaderboards unavailable');
      if (api.getEntries) return api.getEntries(name, options);
      if (api.getLeaderboardEntries) return api.getLeaderboardEntries(name, options);
      throw new Error('Leaderboard entries unavailable');
    },

    async getPayments() {
      if (this.payments) return this.payments;
      if (!this.sdk?.getPayments) return null;
      this.payments = await this.sdk.getPayments();
      return this.payments;
    },

    async getCatalog() {
      const payments = await this.getPayments();
      return payments?.getCatalog ? payments.getCatalog() : [];
    },

    async getPurchases() {
      const payments = await this.getPayments();
      return payments?.getPurchases ? payments.getPurchases() : [];
    },

    async purchase(options) {
      const payments = await this.getPayments();
      if (!payments?.purchase) throw new Error('Payments unavailable');
      return payments.purchase(options);
    },

    async consumePurchase(token) {
      const payments = await this.getPayments();
      if (!payments?.consumePurchase) return false;
      await payments.consumePurchase(token);
      return true;
    }
  };

  window.JorPlatform?.registerAdapter(adapter);
})();
