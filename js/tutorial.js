(() => {
  'use strict';

  const VERSION = 1;
  const TARGET = 3;
  const level = {
    n: 0,
    type: 'enemy',
    target: TARGET,
    stars: [TARGET, TARGET, TARGET],
    timeLimit: 0,
    finishDelayFrames: 36,
    startGrowthStage: 4,
    startingMutations: ['tail', 'tail', 'maw', 'maw', 'dash'],
    enemyFactor: 0.78,
    enemySpeedScale: 0.78,
    foodFactor: 0.55,
    dnaFactor: 0.35,
    tomatoMaxCount: 0,
    shieldChance: 0,
    enemyPerks: false,
    allowAmbush: false,
    allowSchool: true,
    cameraZoom: 0.86
  };
  const texts = {
    ru: {
      title: 'ЗНАКОМСТВО',
      moveMouse: 'Веди мышью — золотая рыбка поплывёт за курсором',
      moveTouch: 'Используй джойстик, чтобы управлять золотой рыбкой',
      hunt: 'Съешь любых трёх противников — все они меньше тебя',
      dashMouse: 'Нажми левую кнопку мыши, чтобы сделать рывок',
      dashTouch: 'Нажми кнопку рывка, чтобы быстро догнать добычу',
      finishHunt: 'Отлично! Осталось съесть любых трёх противников',
      skip: 'Пропустить\nобучение',
      completeTitle: 'ОТЛИЧНОЕ НАЧАЛО!',
      completeText: 'Ты освоил движение, охоту и рывок. Теперь можно отправляться в настоящее приключение.',
      continue: 'ПРОДОЛЖИТЬ',
      progress: (value) => `Противников: ${Math.min(value, TARGET)}/${TARGET}`
    },
    en: {
      title: 'WELCOME',
      moveMouse: 'Guide the mouse — the goldfish follows the cursor',
      moveTouch: 'Use the joystick to steer the goldfish',
      hunt: 'Eat any three opponents — they are all smaller than you',
      dashMouse: 'Press the left mouse button to dash',
      dashTouch: 'Press the dash button to catch your prey',
      finishHunt: 'Great! Now eat any three opponents',
      skip: 'Skip\ntutorial',
      completeTitle: 'GREAT START!',
      completeText: 'You have learned movement, hunting, and dashing. Now the real adventure can begin.',
      continue: 'CONTINUE',
      progress: (value) => `Opponents: ${Math.min(value, TARGET)}/${TARGET}`
    }
  };
  const state = {
    active: false,
    completed: false,
    moved: false,
    dashShown: false,
    dashed: false,
    startX: 0,
    startY: 0,
    lastHint: '',
    enemySpawnIndex: 0,
    savePromise: null
  };
  let dom = null;

  function tr(key, ...args) {
    const lang = typeof currentLang === 'string' && currentLang === 'en' ? 'en' : 'ru';
    const value = texts[lang][key];
    return typeof value === 'function' ? value(...args) : value;
  }

  function cacheDom() {
    if (dom) return dom;
    dom = {
      root: document.getElementById('tutorialGuide'),
      title: document.getElementById('tutorialGuideTitle'),
      text: document.getElementById('tutorialGuideText'),
      skip: document.getElementById('tutorialSkipBtn')
    };
    dom.skip?.addEventListener('click', skip);
    return dom;
  }

  function setGuideVisible(visible) {
    const elements = cacheDom();
    if (!elements.root) return;
    elements.root.classList.toggle('visible', visible);
    elements.root.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }

  function setHint(key) {
    if (state.lastHint === key) return;
    state.lastHint = key;
    const elements = cacheDom();
    if (elements.title) elements.title.textContent = tr('title');
    if (elements.text) elements.text.textContent = tr(key);
    if (elements.skip) elements.skip.textContent = tr('skip');
    setGuideVisible(true);
  }

  function hasMeaningfulProgress() {
    const campaign = window.JorSaveManager?.getSection?.('campaign', {}) || {};
    const shop = window.JorSaveManager?.getSection?.('shop', {}) || {};
    const meta = window.JorSaveManager?.getSection?.('meta', {}) || {};
    const daily = window.JorSaveManager?.getSection?.('dailyBonus', {}) || {};
    const hasStars = Object.values(campaign.stars || {}).some(value => Number(value) > 0);
    const hasCampaignProgress = Number(campaign.highestUnlockedLevel || 1) > 1 || hasStars;
    const hasOwnedItems = Object.values(shop.owned || {}).some(Boolean) || Object.values(shop.timed || {}).some(value => Number(value) > 0);
    const hasMetaProgress = Number(meta.fullXp || 0) > 0 || Number(meta.bestEndlessScore || 0) > 0;
    return hasCampaignProgress || hasOwnedItems || hasMetaProgress || !!daily.bonusId;
  }

  function isForced() {
    try {
      return new URL(window.location.href).searchParams.get('tutorial') === '1';
    } catch (error) {
      return false;
    }
  }

  function saveCompletion() {
    if (!state.savePromise) {
      state.savePromise = Promise.resolve(window.JorSaveManager?.updateSection?.('meta', (meta) => ({
        ...meta,
        tutorialVersion: Math.max(VERSION, Math.floor(Number(meta?.tutorialVersion) || 0))
      }), true)).catch(() => false);
    }
    return state.savePromise;
  }

  function shouldAutoStart() {
    if (isForced()) return true;
    const meta = window.JorSaveManager?.getSection?.('meta', {}) || {};
    if (Math.floor(Number(meta.tutorialVersion) || 0) >= VERSION) return false;
    if (hasMeaningfulProgress()) {
      saveCompletion();
      return false;
    }
    return true;
  }

  function start() {
    state.active = true;
    state.completed = false;
    state.moved = false;
    state.dashShown = false;
    state.dashed = false;
    state.lastHint = '';
    state.enemySpawnIndex = 0;
    state.savePromise = null;
    App.pendingCampaignStart = false;
    App.gameMode = 'tutorial';
    App.campaignLevel = null;
    App.campaignChapter = null;
    App.campaignRun = null;
    App.hasStarted = true;
    App.localPause = false;
    hideStartScreen();
    resetGame();
    ensureAmbientMusic();
    markGameplayStart();
    return true;
  }

  function maybeStart() {
    return shouldAutoStart() ? start() : false;
  }

  function configurePlayer(source) {
    if (!source || App.gameMode !== 'tutorial') return;
    source.skinId = 'jor_char_goldfish';
    source.baseSpeed = 2.85;
    source.speed = source.baseSpeed;
    source.damageReduction = 1;
    source.enemyGrowthBonus = 1;
  }

  function configureEnemy(enemy, variantIndex = 0) {
    if (!enemy || !player) return enemy;
    const maxRadius = Math.max(15, player.radius * 0.7);
    enemy.radius = randomRange(12, maxRadius);
    const variant = variantIndex % 6;
    if (variant === 0 || variant === 4) enemy.applySpawnPerk('shell');
    else if (variant === 2) enemy.applySpawnPerk('tail');
    else if (variant === 3) enemy.applySpawnPerk('agility');
    else if (variant === 5) enemy.applySpawnPerk('maw');
    enemy.level = calculateLevelFromRadius(enemy.radius);
    return enemy;
  }

  function createEnemy(sizeFactor = 1) {
    const variantIndex = state.enemySpawnIndex++;
    const shielded = variantIndex % 4 === 1 && typeof ShieldEnemy === 'function';
    return configureEnemy(shielded ? new ShieldEnemy(sizeFactor) : new Enemy(sizeFactor), variantIndex);
  }

  function onRunStarted(source) {
    if (App.gameMode !== 'tutorial') {
      state.active = false;
      state.completed = false;
      setGuideVisible(false);
      return;
    }
    configurePlayer(source);
    state.startX = source?.x || 0;
    state.startY = source?.y || 0;
    setHint(hasTouchControls() ? 'moveTouch' : 'moveMouse');
  }

  function update(source, eaten) {
    if (!state.active || state.completed || !source) return;
    if (!state.moved && Math.hypot(source.x - state.startX, source.y - state.startY) >= 24) {
      state.moved = true;
      setHint('hunt');
    }
    if (!state.dashShown && eaten >= 1) {
      state.dashShown = true;
      setHint(hasTouchControls() ? 'dashTouch' : 'dashMouse');
    }
    if (state.dashShown && !state.dashed && source.dashTime > 0) {
      state.dashed = true;
      setHint('finishHunt');
    }
  }

  function progressText(value) {
    return tr('progress', Math.max(0, Math.floor(Number(value) || 0)));
  }

  function showCompletion() {
    state.completed = true;
    setGuideVisible(false);
    saveCompletion();
    DOM.messageTitle.textContent = tr('completeTitle');
    DOM.messageTitle.dataset.messageKey = 'tutorialComplete';
    DOM.messageText.textContent = tr('completeText');
    DOM.messageText.className = 'tutorialCompleteMessage';
    DOM.messageText.dataset.messageMode = 'tutorialComplete';
    DOM.centerMessage.classList.remove('leaderboardDialog', 'levelFailedDialog', 'campaignCompleteDialog', 'campaignCompactResult');
    DOM.centerMessage.classList.add('tutorialCompleteDialog');
    if (DOM.messageRetryBtn) DOM.messageRetryBtn.hidden = true;
    if (DOM.messageOurGamesBtn) DOM.messageOurGamesBtn.hidden = true;
    if (DOM.restartBtn) DOM.restartBtn.textContent = tr('continue');
    DOM.centerMessage.style.display = 'block';
    window.JorUIFit?.refresh?.();
  }

  async function continueToMenu() {
    await saveCompletion();
    state.active = false;
    state.completed = false;
    App.gameMode = null;
    App.campaignRun = null;
    if (typeof startCampaignRunIfNeeded === 'function') startCampaignRunIfNeeded();
    returnToMainMenu();
  }

  async function skip() {
    if (!state.active || state.completed) return;
    setGuideVisible(false);
    await saveCompletion();
    state.active = false;
    App.gameMode = null;
    App.campaignRun = null;
    if (typeof startCampaignRunIfNeeded === 'function') startCampaignRunIfNeeded();
    returnToMainMenu();
  }

  function leave() {
    if (!state.active) return;
    state.active = false;
    state.completed = false;
    setGuideVisible(false);
    App.gameMode = null;
    App.campaignRun = null;
    if (typeof startCampaignRunIfNeeded === 'function') startCampaignRunIfNeeded();
  }

  window.JorTutorial = {
    VERSION,
    level,
    maybeStart,
    configurePlayer,
    createEnemy,
    configureEnemy,
    onRunStarted,
    update,
    progressText,
    showCompletion,
    continueToMenu,
    leave,
    isActive: () => state.active,
    isComplete: () => state.completed
  };
})();
