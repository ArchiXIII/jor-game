(function () {
  'use strict';

  const CLOUD_KEY = 'jorSaveV2';
  const LOCAL_KEY = 'jor-save-v2';
  const VERSION = 2;
  let loaded = false;
  let loadPromise = null;
  let saveChain = Promise.resolve(true);
  let data = createEmptySave();

  function createEmptySave() {
    return { version: VERSION, campaign: null, shop: null, meta: null };
  }

  function copy(value) {
    if (value === undefined || value === null) return value ?? null;
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      return null;
    }
  }

  function normalize(value) {
    const source = value && typeof value === 'object' ? value : {};
    return {
      ...copy(source),
      version: VERSION,
      campaign: copy(source.campaign),
      shop: copy(source.shop),
      meta: copy(source.meta),
    };
  }

  function isAuthorized() {
    try {
      return !!App?.player?.isAuthorized?.();
    } catch (error) {
      return false;
    }
  }

  function playerId() {
    if (!isAuthorized()) return 'guest';
    try {
      return String(App.player.getUniqueID?.() || 'guest');
    } catch (error) {
      return 'guest';
    }
  }

  function localKey() {
    return `${LOCAL_KEY}:${isAuthorized() ? 'player:' : ''}${playerId()}`;
  }

  function readJson(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function readNumber(key) {
    try {
      return Math.max(0, Math.floor(Number(localStorage.getItem(key) || 0)));
    } catch (error) {
      return 0;
    }
  }

  function loadLocal() {
    const current = readJson(localKey());
    if (current) return normalize(current);
    if (typeof YaGames !== 'undefined') return createEmptySave();
    return normalize({
      campaign: readJson('jor-campaign-progress-v1'),
      shop: readJson('jor-shop-v1'),
      meta: {
        fullXp: readNumber('jor-full-xp'),
        bestEndlessScore: readNumber('jor-best-endless-score'),
      },
    });
  }

  function saveLocal() {
    try {
      localStorage.setItem(localKey(), JSON.stringify(data));
    } catch (error) {}
  }

  async function persist(flush = false) {
    saveLocal();
    if (!isAuthorized() || !App?.player?.setData) return true;
    const operation = saveChain.then(async () => {
      const snapshot = copy(data);
      try {
        await App.player.setData({ [CLOUD_KEY]: snapshot }, !!flush);
        return true;
      } catch (error) {
        console.warn('Player save error:', error);
        return false;
      }
    });
    saveChain = operation.catch(() => false);
    return operation;
  }

  async function load() {
    if (loaded) return true;
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
      if (!isAuthorized() || !App?.player?.getData) {
        data = loadLocal();
        loaded = true;
        return true;
      }
      try {
        const server = await App.player.getData([CLOUD_KEY, 'jorCampaign', 'jorShop']);
        const unified = server?.[CLOUD_KEY];
        if (unified && typeof unified === 'object') {
          data = normalize(unified);
        } else {
          data = normalize({ campaign: server?.jorCampaign, shop: server?.jorShop });
          await persist(true);
        }
        saveLocal();
        loaded = true;
        return true;
      } catch (error) {
        data = loadLocal();
        loaded = true;
        console.warn('Player load error:', error);
        return false;
      }
    })();
    return loadPromise;
  }

  function getSection(name, fallback = null) {
    const value = data?.[name];
    return copy(value === undefined || value === null ? fallback : value);
  }

  function setSection(name, value, flush = false) {
    data[name] = copy(value);
    return persist(flush);
  }

  function updateSection(name, updater, flush = false) {
    const current = getSection(name, {});
    const next = typeof updater === 'function' ? updater(current) : current;
    return setSection(name, next, flush);
  }

  if (typeof YaGames === 'undefined') {
    data = loadLocal();
    loaded = true;
  }

  window.JorSaveManager = { load, getSection, setSection, updateSection, persist, isLoaded: () => loaded };
})();
