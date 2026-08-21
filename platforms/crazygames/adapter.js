(function () {
  'use strict';

  const adapter = {
    name: 'crazygames',
    sdk: null,
    language: '',
    dataAvailable: false,
    settingsListener: null,
    loadingStarted: false,
    loadingStopped: false,

    async init(handlers) {
      const sdk = window.CrazyGames?.SDK;
      if (!sdk?.init) return { ready: false, language: '' };
      try {
        await sdk.init();
        const environment = String(sdk.environment || '');
        if (environment && environment !== 'local' && environment !== 'crazygames') {
          return { ready: false, language: '' };
        }
        this.sdk = sdk;
        this.dataAvailable = !!(
          sdk.data
          && typeof sdk.data.getItem === 'function'
          && typeof sdk.data.setItem === 'function'
        );
        this.language = String(sdk.user?.systemInfo?.locale || '');
        const applySettings = (settings) => handlers?.onAudioMuteChange?.(settings?.muteAudio === true);
        applySettings(sdk.game?.settings);
        if (typeof sdk.game?.addSettingsChangeListener === 'function') {
          this.settingsListener = applySettings;
          sdk.game.addSettingsChangeListener(this.settingsListener);
        }
        if (typeof sdk.game?.loadingStart === 'function') {
          sdk.game.loadingStart();
          this.loadingStarted = true;
        }
        return { ready: true, language: this.language };
      } catch (error) {
        this.sdk = null;
        this.dataAvailable = false;
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

    hasCloudStorage() {
      return this.dataAvailable;
    },

    loadData(keys) {
      if (!this.dataAvailable) return Promise.resolve({});
      const result = {};
      const source = Array.isArray(keys) ? keys : [];
      for (let i = 0; i < source.length; i += 1) {
        const key = String(source[i] || '');
        if (!key) continue;
        const raw = this.sdk.data.getItem(key);
        if (raw === null || raw === undefined || raw === '') continue;
        try {
          result[key] = JSON.parse(String(raw));
        } catch (error) {
          console.warn('[Jor CrazyGames] Progress data is invalid');
        }
      }
      return Promise.resolve(result);
    },

    saveData(payload) {
      if (!this.dataAvailable || !payload || typeof payload !== 'object') return Promise.resolve(false);
      const keys = Object.keys(payload);
      try {
        for (let i = 0; i < keys.length; i += 1) {
          const key = keys[i];
          const value = JSON.stringify(payload[key]);
          if (value !== undefined) this.sdk.data.setItem(key, value);
        }
        return Promise.resolve(true);
      } catch (error) {
        console.warn('[Jor CrazyGames] Progress save failed');
        return Promise.resolve(false);
      }
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
