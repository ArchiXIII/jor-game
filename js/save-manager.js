(function () {
  'use strict';

  const CLOUD_KEY = 'jorSaveV2';
  const LOCAL_KEY = 'jor-save-v2';
  const VERSION = 2;
  let loaded = false;
  let dataOwner = '';
  let cloudOwner = '';
  let loadPromise = null;
  let loadPromiseOwner = '';
  let saveChain = Promise.resolve(true);
  let dirtyOwner = '';
  let dirtySections = Object.create(null);
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
      meta: copy(source.meta)
    };
  }

  function isAuthorized() {
    return !!window.JorPlatform?.isAuthorized?.();
  }

  function hasSdkManagedStorage() {
    return window.JorPlatform?.features?.sdkManagedStorage === true;
  }

  function canUseCloudStorage() {
    return (isAuthorized() || hasSdkManagedStorage()) && !!window.JorPlatform?.hasCloudStorage?.();
  }

  function playerId() {
    if (!isAuthorized()) return 'guest';
    return String(window.JorPlatform?.getPlayerId?.() || 'authorized');
  }

  function ownerId() {
    if (hasSdkManagedStorage()) return `sdk:${window.JorPlatform?.name || 'platform'}`;
    return isAuthorized() ? `player:${playerId()}` : 'guest';
  }

  function localKey(owner = ownerId()) {
    return `${LOCAL_KEY}:${owner}`;
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

  function loadLocal(owner = ownerId()) {
    if (hasSdkManagedStorage()) return createEmptySave();
    const current = readJson(localKey(owner));
    if (current) return normalize(current);
    if (window.JorPlatform?.hasCloudStorage?.()) return createEmptySave();
    return normalize({
      campaign: readJson('jor-campaign-progress-v1'),
      shop: readJson('jor-shop-v1'),
      meta: {
        fullXp: readNumber('jor-full-xp'),
        bestEndlessScore: readNumber('jor-best-endless-score')
      }
    });
  }

  function ensureOwnerData() {
    const owner = ownerId();
    if (dataOwner !== owner) {
      data = loadLocal(owner);
      dataOwner = owner;
      loaded = true;
    }
    return owner;
  }

  function saveLocal(owner = dataOwner || ownerId()) {
    if (hasSdkManagedStorage()) return;
    try {
      localStorage.setItem(localKey(owner), JSON.stringify(data));
    } catch (error) {}
  }

  function objectSource(value) {
    return value && typeof value === 'object' ? value : null;
  }

  function mergeTruthyMap(target, source) {
    if (Array.isArray(source)) {
      for (let i = 0; i < source.length; i += 1) target[String(source[i])] = true;
      return;
    }
    if (!source || typeof source !== 'object') return;
    Object.keys(source).forEach((key) => {
      if (source[key]) target[String(key)] = true;
    });
  }

  function mergeCampaign(local, legacy, unified) {
    const sources = [objectSource(local), objectSource(legacy), objectSource(unified)].filter(Boolean);
    if (!sources.length) return null;
    const primary = objectSource(unified) || objectSource(legacy) || objectSource(local) || {};
    const result = { ...copy(primary), stars: {}, unlockedLevels: {}, chapterTrophies: {} };
    let highest = 1;
    for (let i = 0; i < sources.length; i += 1) {
      const source = sources[i];
      highest = Math.max(highest, Math.floor(Number(source.highestUnlockedLevel) || 1));
      Object.keys(source.stars || {}).forEach((key) => {
        result.stars[key] = Math.max(Math.floor(Number(result.stars[key]) || 0), Math.floor(Number(source.stars[key]) || 0));
      });
      mergeTruthyMap(result.unlockedLevels, source.unlockedLevels);
      mergeTruthyMap(result.chapterTrophies, source.chapterTrophies);
    }
    result.highestUnlockedLevel = highest;
    result.pendingChapterTrophies = copy(primary.pendingChapterTrophies || {});
    return result;
  }

  function mergeShop(local, legacy, unified) {
    const sources = [objectSource(local), objectSource(legacy), objectSource(unified)].filter(Boolean);
    if (!sources.length) return null;
    const primary = objectSource(unified) || objectSource(legacy) || objectSource(local) || {};
    const result = { ...copy(primary), owned: {}, selected: {}, timed: {} };
    for (let i = 0; i < sources.length; i += 1) {
      const source = sources[i];
      mergeTruthyMap(result.owned, source.owned);
      Object.keys(source.timed || {}).forEach((key) => {
        result.timed[key] = Math.max(Number(result.timed[key]) || 0, Number(source.timed[key]) || 0);
      });
    }
    const selections = [objectSource(local)?.selected, objectSource(legacy)?.selected, objectSource(unified)?.selected];
    for (let i = 0; i < selections.length; i += 1) {
      const selected = selections[i];
      if (!selected || typeof selected !== 'object') continue;
      Object.keys(selected).forEach((key) => {
        if (selected[key]) result.selected[key] = selected[key];
      });
    }
    return result;
  }

  function mergeMeta(local, unified) {
    const localMeta = objectSource(local);
    const serverMeta = objectSource(unified);
    if (!localMeta && !serverMeta) return null;
    const result = { ...copy(serverMeta || localMeta || {}) };
    result.fullXp = Math.max(Number(localMeta?.fullXp) || 0, Number(serverMeta?.fullXp) || 0);
    result.bestEndlessScore = Math.max(Number(localMeta?.bestEndlessScore) || 0, Number(serverMeta?.bestEndlessScore) || 0);
    result.tutorialVersion = Math.max(Number(localMeta?.tutorialVersion) || 0, Number(serverMeta?.tutorialVersion) || 0);
    return result;
  }

  function resolveSave(server, local) {
    const unified = objectSource(server?.[CLOUD_KEY]);
    const result = normalize(unified || {});
    result.campaign = mergeCampaign(local?.campaign, server?.jorCampaign, unified?.campaign);
    result.shop = mergeShop(local?.shop, server?.jorShop, unified?.shop);
    result.meta = mergeMeta(local?.meta, unified?.meta);
    return result;
  }

  function sameSave(left, right) {
    try {
      return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));
    } catch (error) {
      return false;
    }
  }

  function queueCloudSave(snapshot, flush) {
    const saved = copy(snapshot);
    const operation = saveChain.then(async () => {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const success = await window.JorPlatform.saveData({ [CLOUD_KEY]: saved }, !!flush);
          if (!success) throw new Error('Cloud save unavailable');
          return true;
        } catch (error) {
          if (attempt > 0) {
            console.warn('Player save error:', error);
            return false;
          }
          await new Promise((resolve) => window.setTimeout(resolve, 250));
        }
      }
      return false;
    });
    saveChain = operation.catch(() => false);
    return operation;
  }

  async function persist(flush = false) {
    const owner = ensureOwnerData();
    saveLocal(owner);
    if (!canUseCloudStorage()) return true;
    if (cloudOwner !== owner) return load();
    return queueCloudSave(data, flush);
  }

  async function load() {
    const owner = ownerId();
    if (!canUseCloudStorage()) {
      ensureOwnerData();
      return true;
    }
    if (cloudOwner === owner) return true;
    if (loadPromise) {
      if (loadPromiseOwner === owner) return loadPromise;
      await loadPromise;
      return load();
    }

    loadPromiseOwner = owner;
    loadPromise = (async () => {
      const local = loadLocal(owner);
      try {
        const server = await window.JorPlatform.loadData([CLOUD_KEY, 'jorCampaign', 'jorShop']);
        if (ownerId() !== owner) return false;
        const unified = objectSource(server?.[CLOUD_KEY]);
        const resolved = resolveSave(server, local);
        if (dirtyOwner === owner) {
          Object.keys(dirtySections).forEach((name) => {
            if (name === 'campaign') resolved.campaign = mergeCampaign(resolved.campaign, null, dirtySections[name]);
            else if (name === 'shop') resolved.shop = mergeShop(resolved.shop, null, dirtySections[name]);
            else if (name === 'meta') resolved.meta = mergeMeta(resolved.meta, dirtySections[name]);
            else resolved[name] = copy(dirtySections[name]);
          });
          dirtyOwner = '';
          dirtySections = Object.create(null);
        }
        data = resolved;
        dataOwner = owner;
        cloudOwner = owner;
        loaded = true;
        saveLocal(owner);
        if (!unified || !sameSave(unified, resolved)) {
          await queueCloudSave(resolved, true);
        }
        return true;
      } catch (error) {
        if (ownerId() === owner) {
          data = local;
          dataOwner = owner;
          loaded = true;
          saveLocal(owner);
        }
        console.warn('Player load error:', error);
        return false;
      }
    })();

    try {
      return await loadPromise;
    } finally {
      if (loadPromiseOwner === owner) {
        loadPromise = null;
        loadPromiseOwner = '';
      }
    }
  }

  function getSection(name, fallback = null) {
    ensureOwnerData();
    const value = data?.[name];
    return copy(value === undefined || value === null ? fallback : value);
  }

  function setSection(name, value, flush = false) {
    const owner = ensureOwnerData();
    data[name] = copy(value);
    if ((isAuthorized() || hasSdkManagedStorage()) && cloudOwner !== owner) {
      if (dirtyOwner !== owner) {
        dirtyOwner = owner;
        dirtySections = Object.create(null);
      }
      dirtySections[name] = copy(value);
    }
    return persist(flush);
  }

  function updateSection(name, updater, flush = false) {
    const current = getSection(name, {});
    const next = typeof updater === 'function' ? updater(current) : current;
    return setSection(name, next, flush);
  }

  if (!window.JorPlatform?.hasCloudStorage?.()) {
    dataOwner = ownerId();
    data = loadLocal(dataOwner);
    loaded = true;
  }

  window.JorSaveManager = {
    load,
    getSection,
    setSection,
    updateSection,
    persist,
    isLoaded: () => loaded,
    isCloudLoaded: () => cloudOwner === ownerId()
  };
})();
