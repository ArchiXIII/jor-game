(function () {
  'use strict';

  const adapter = {
    name: 'crazygames',
    sdk: null,
    language: '',
    loadingStarted: false,
    loadingStopped: false,

    async init() {
      const sdk = window.CrazyGames?.SDK;
      if (!sdk?.init) return { ready: false, language: '' };
      try {
        await sdk.init();
        const environment = String(sdk.environment || '');
        if (environment && environment !== 'local' && environment !== 'crazygames') {
          return { ready: false, language: '' };
        }
        this.sdk = sdk;
        this.language = String(sdk.user?.systemInfo?.locale || '');
        if (typeof sdk.game?.loadingStart === 'function') {
          sdk.game.loadingStart();
          this.loadingStarted = true;
        }
        return { ready: true, language: this.language };
      } catch (error) {
        this.sdk = null;
        console.warn('[Jor CrazyGames] SDK initialization failed');
        return { ready: false, language: '' };
      }
    },

    getLanguage() {
      return this.language;
    },

    isAuthorized() {
      return false;
    },

    getPlayerId() {
      return 'guest';
    },

    getPlayerName() {
      return '';
    },

    gameplayStart() {
      try {
        this.sdk?.game?.gameplayStart?.();
      } catch (error) {
        console.warn('[Jor CrazyGames] Gameplay start failed');
      }
    },

    gameplayStop() {
      try {
        this.sdk?.game?.gameplayStop?.();
      } catch (error) {
        console.warn('[Jor CrazyGames] Gameplay stop failed');
      }
    },

    notifyGameReady() {
      if (!this.sdk || this.loadingStopped) return this.loadingStopped;
      try {
        if (this.loadingStarted && typeof this.sdk.game?.loadingStop === 'function') {
          this.sdk.game.loadingStop();
        }
        this.loadingStopped = true;
        return true;
      } catch (error) {
        console.warn('[Jor CrazyGames] Loading stop failed');
        return false;
      }
    }
  };

  window.JorPlatform?.registerAdapter(adapter);
})();
