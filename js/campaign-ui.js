(function () {
  'use strict';

  const CHAPTER_COUNT = 10;
  const LEVELS_PER_CHAPTER = 10;
  const TOTAL_LEVELS = CHAPTER_COUNT * LEVELS_PER_CHAPTER;

  const chapterNames = {
    ru: [
      '\u041c\u0435\u043b\u043a\u043e\u0432\u043e\u0434\u044c\u0435',
      '\u0422\u0451\u043f\u043b\u043e\u0435 \u0442\u0435\u0447\u0435\u043d\u0438\u0435',
      '\u0421\u0438\u043d\u0438\u0435 \u0442\u0435\u0447\u0435\u043d\u0438\u044f',
      '\u0413\u043b\u0443\u0431\u0438\u043d\u043d\u044b\u0435 \u0437\u0430\u0440\u043e\u0441\u043b\u0438',
      '\u0422\u0451\u043c\u043d\u0430\u044f \u0432\u043f\u0430\u0434\u0438\u043d\u0430',
      '\u0421\u0432\u0435\u0442\u044f\u0449\u0438\u0439\u0441\u044f \u0440\u0430\u0437\u043b\u043e\u043c',
      '\u0425\u043e\u043b\u043e\u0434\u043d\u0430\u044f \u0431\u0435\u0437\u0434\u043d\u0430',
      '\u0421\u0442\u0430\u044f \u0445\u0438\u0449\u043d\u0438\u043a\u043e\u0432',
      '\u0414\u0440\u0435\u0432\u043d\u0438\u0439 \u043e\u043a\u0435\u0430\u043d',
      '\u0421\u0435\u0440\u0434\u0446\u0435 \u0433\u043e\u043b\u043e\u0434\u0430'
    ],
    en: [
      'Shallows',
      'Warm Current',
      'Blue Currents',
      'Deep Thickets',
      'Dark Trench',
      'Glowing Rift',
      'Cold Abyss',
      'Predator Pack',
      'Ancient Ocean',
      'Heart of Hunger'
    ]
  };

  const chapterThemes = [
    { top: 'rgb(47, 31, 69)', mid: 'rgb(18, 15, 35)', bottom: 'rgb(9, 8, 17)', glow: 'rgba(150, 84, 255, 0.16)' },
    { top: 'rgb(28, 42, 77)', mid: 'rgb(10, 20, 42)', bottom: 'rgb(5, 8, 18)', glow: 'rgba(72, 151, 255, 0.15)' },
    { top: 'rgb(24, 58, 45)', mid: 'rgb(8, 30, 25)', bottom: 'rgb(5, 13, 13)', glow: 'rgba(79, 230, 145, 0.13)' },
    { top: 'rgb(67, 27, 43)', mid: 'rgb(34, 10, 22)', bottom: 'rgb(14, 5, 10)', glow: 'rgba(255, 82, 132, 0.14)' },
    { top: 'rgb(70, 47, 22)', mid: 'rgb(36, 22, 8)', bottom: 'rgb(15, 9, 4)', glow: 'rgba(255, 178, 64, 0.15)' },
    { top: 'rgb(24, 52, 73)', mid: 'rgb(8, 25, 39)', bottom: 'rgb(4, 10, 16)', glow: 'rgba(77, 214, 255, 0.14)' },
    { top: 'rgb(31, 64, 36)', mid: 'rgb(12, 32, 17)', bottom: 'rgb(5, 14, 8)', glow: 'rgba(154, 236, 86, 0.13)' },
    { top: 'rgb(58, 32, 76)', mid: 'rgb(28, 12, 42)', bottom: 'rgb(11, 5, 18)', glow: 'rgba(217, 88, 255, 0.15)' },
    { top: 'rgb(47, 40, 31)', mid: 'rgb(18, 17, 18)', bottom: 'rgb(7, 7, 9)', glow: 'rgba(255, 210, 92, 0.13)' },
    { top: 'rgb(52, 50, 65)', mid: 'rgb(16, 17, 27)', bottom: 'rgb(5, 6, 11)', glow: 'rgba(255, 242, 194, 0.14)' }
  ];

  const texts = {
    ru: {
      campaign: '\u041f\u0440\u043e\u0445\u043e\u0436\u0434\u0435\u043d\u0438\u0435',
      chapter: '\u0413\u041b\u0410\u0412\u0410',
      back: '\u041d\u0430\u0437\u0430\u0434',
      play: '\u0418\u0433\u0440\u0430\u0442\u044c'
    },
    en: {
      campaign: 'Campaign',
      chapter: 'CHAPTER',
      back: 'Back',
      play: 'Play'
    }
  };

  const dom = {};
  let initialized = false;
  let messageTimer = 0;
  let cloudLoaded = false;
  let progress = normalizeProgress(window.JorSaveManager?.getSection?.('campaign', null));
  let state = {
    open: false,
    chapter: Math.max(0, Math.min(CHAPTER_COUNT - 1, Math.floor((recommendedLevelNumber() - 1) / LEVELS_PER_CHAPTER))),
    selectedLevel: recommendedLevelNumber()
  };

  function lang() {
    return typeof currentLang === 'string' && currentLang === 'en' ? 'en' : 'ru';
  }

  function tr(key) {
    return texts[lang()][key] || texts.ru[key] || '';
  }

  function cacheDom() {
    dom.startButton = document.getElementById('startCampaignBtn');
    dom.overlay = document.getElementById('campaignOverlay');
    dom.panel = document.getElementById('campaignPanel');
    dom.closeButton = document.getElementById('campaignCloseBtn');
    dom.prevButton = document.getElementById('campaignPrevBtn');
    dom.nextButton = document.getElementById('campaignNextBtn');
    dom.trophy = document.getElementById('campaignTrophy');
    dom.title = document.getElementById('campaignTitle');
    dom.name = document.getElementById('campaignName');
    dom.stars = document.getElementById('campaignStarsText');
    dom.grid = document.getElementById('campaignGrid');
    dom.message = document.getElementById('campaignMessage');
    dom.backButton = document.getElementById('campaignBackBtn');
    dom.playButton = document.getElementById('campaignPlayBtn');
  }

  function normalizeProgress(source) {
    const src = source && typeof source === 'object' ? source : {};
    const stars = {};
    Object.keys(src.stars || {}).forEach((key) => {
      const level = Math.max(1, Math.min(TOTAL_LEVELS, Math.floor(Number(key) || 0)));
      const value = Math.max(0, Math.min(3, Math.floor(Number(src.stars[key]) || 0)));
      if (level && value) stars[String(level)] = value;
    });
    const trophies = {};
    Object.keys(src.chapterTrophies || {}).forEach((key) => {
      const chapter = Math.max(0, Math.min(CHAPTER_COUNT - 1, Math.floor(Number(key) || 0)));
      if (src.chapterTrophies[key]) trophies[String(chapter)] = true;
    });

    const pendingTrophies = {};
    const rawPendingTrophies = Array.isArray(src.pendingChapterTrophies)
      ? src.pendingChapterTrophies
      : Object.keys(src.pendingChapterTrophies || {}).filter((key) => src.pendingChapterTrophies[key]);
    rawPendingTrophies.forEach((value) => {
      const chapter = Math.max(0, Math.min(CHAPTER_COUNT - 1, Math.floor(Number(value) || 0)));
      if (trophies[String(chapter)]) pendingTrophies[String(chapter)] = true;
    });

    const unlocked = {};
    const rawUnlocked = Array.isArray(src.unlockedLevels)
      ? src.unlockedLevels
      : Object.keys(src.unlockedLevels || {}).filter((key) => src.unlockedLevels[key]);
    rawUnlocked.forEach((value) => {
      const level = Math.max(1, Math.min(TOTAL_LEVELS, Math.floor(Number(value) || 0)));
      if (level) unlocked[String(level)] = true;
    });
    unlocked['1'] = true;

    const completedLevels = Object.keys(stars)
      .map((key) => Math.max(1, Math.min(TOTAL_LEVELS, Math.floor(Number(key) || 0))))
      .filter((level) => level > 0);
    const legacyHighest = Math.max(1, Math.min(TOTAL_LEVELS, Math.floor(Number(src.highestUnlockedLevel) || 1)));
    for (let level = 1; level <= legacyHighest; level += 1) unlocked[String(level)] = true;
    completedLevels.forEach((level) => {
      unlocked[String(level)] = true;
      if (level + 1 <= TOTAL_LEVELS) unlocked[String(level + 1)] = true;
      if (level + 2 <= TOTAL_LEVELS) unlocked[String(level + 2)] = true;
    });

    const highest = Object.keys(unlocked).reduce((max, key) => Math.max(max, Math.floor(Number(key) || 0)), 1);
    return {
      highestUnlockedLevel: Math.max(1, Math.min(TOTAL_LEVELS, highest)),
      unlockedLevels: unlocked,
      stars,
      chapterTrophies: trophies,
      pendingChapterTrophies: pendingTrophies
    };
  }

  function saveProgress() {
    window.JorSaveManager?.setSection?.('campaign', progress, true);
  }

  async function loadCloud() {
    if (cloudLoaded) return true;
    cloudLoaded = true;
    try {
      await window.JorSaveManager?.load?.();
      progress = normalizeProgress(window.JorSaveManager?.getSection?.('campaign', null));
      window.JorMetaUI?.setStars?.(totalStars());
      render();
      return true;
    } catch (error) {
      cloudLoaded = false;
      console.warn('Campaign save load error:', error);
      return false;
    }
  }

  function levelStarsFor(levelNumber) {
    return Math.max(0, Math.min(3, Math.floor(Number(progress.stars[String(levelNumber)]) || 0)));
  }

  function isLevelUnlocked(levelNumber) {
    const level = Math.max(1, Math.min(TOTAL_LEVELS, Math.floor(Number(levelNumber) || 1)));
    return !!progress.unlockedLevels?.[String(level)] || level <= Math.max(1, Math.floor(Number(progress.highestUnlockedLevel) || 1));
  }

  function unlockLevel(levelNumber) {
    const level = Math.max(1, Math.min(TOTAL_LEVELS, Math.floor(Number(levelNumber) || 1)));
    progress.unlockedLevels = progress.unlockedLevels || { '1': true };
    progress.unlockedLevels[String(level)] = true;
    progress.highestUnlockedLevel = Math.max(progress.highestUnlockedLevel || 1, level);
  }

  function totalStars() {
    return Object.keys(progress.stars || {}).reduce((sum, key) => sum + levelStarsFor(key), 0);
  }

  function chapterLevels(chapterIndex) {
    const first = chapterIndex * LEVELS_PER_CHAPTER + 1;
    return Array.from({ length: LEVELS_PER_CHAPTER }, (_, index) => first + index).filter((level) => level <= TOTAL_LEVELS);
  }

  function chapterStarInfo(chapterIndex) {
    const levels = chapterLevels(chapterIndex);
    const earned = levels.reduce((sum, level) => sum + levelStarsFor(level), 0);
    return { earned, max: levels.length * 3 };
  }

  function applyChapterTheme() {
    if (!dom.panel) return;
    const theme = chapterThemes[Math.max(0, Math.floor(state.chapter || 0)) % chapterThemes.length];
    dom.panel.style.setProperty('--campaign-theme-top', theme.top);
    dom.panel.style.setProperty('--campaign-theme-mid', theme.mid);
    dom.panel.style.setProperty('--campaign-theme-bottom', theme.bottom);
    dom.panel.style.setProperty('--campaign-theme-glow', theme.glow);
  }

  function hasChapterTrophy(chapterIndex) {
    const key = String(Math.max(0, Math.floor(Number(chapterIndex) || 0)));
    if (progress.chapterTrophies[key]) return true;
    const info = chapterStarInfo(chapterIndex);
    return info.max > 0 && info.earned >= info.max;
  }

  function recommendedLevelNumber() {
    const frontier = Math.max(1, Math.min(TOTAL_LEVELS, Math.floor(Number(progress.highestUnlockedLevel) || 1)));
    const sourceRecommended = Math.max(1, frontier - 1 || 1);
    if (isLevelUnlocked(sourceRecommended)) return sourceRecommended;

    for (let level = frontier; level >= 1; level -= 1) {
      if (isLevelUnlocked(level)) return level;
    }
    return 1;
  }

  function syncSelectedToChapter() {
    const first = state.chapter * LEVELS_PER_CHAPTER + 1;
    const last = first + LEVELS_PER_CHAPTER - 1;
    if (state.selectedLevel < first || state.selectedLevel > last) {
      const recommended = recommendedLevelNumber();
      state.selectedLevel = recommended >= first && recommended <= last ? recommended : first;
    }
  }

  function clearMessage() {
    if (dom.message) dom.message.textContent = '';
    if (messageTimer) {
      window.clearTimeout(messageTimer);
      messageTimer = 0;
    }
  }

  function showMessage(text) {
    if (!dom.message) return;
    dom.message.textContent = text;
    if (messageTimer) window.clearTimeout(messageTimer);
    messageTimer = window.setTimeout(clearMessage, 1700);
  }

  function setOpen(value) {
    state.open = !!value;
    if (!dom.overlay) return;
    dom.overlay.classList.toggle('active', state.open);
    dom.overlay.setAttribute('aria-hidden', state.open ? 'false' : 'true');
    window.JorMetaUI?.setHighlightedChapter?.(state.open ? state.chapter : null);
    if (state.open) render();
  }

  function open() {
    progress = normalizeProgress(window.JorSaveManager?.getSection?.('campaign', progress));
    const recommended = recommendedLevelNumber();
    state.selectedLevel = recommended;
    state.chapter = Math.max(0, Math.min(CHAPTER_COUNT - 1, Math.floor((recommended - 1) / LEVELS_PER_CHAPTER)));
    clearMessage();
    setOpen(true);
  }

  function close() {
    setOpen(false);
  }

  function changeChapter(delta) {
    const next = Math.max(0, Math.min(CHAPTER_COUNT - 1, state.chapter + delta));
    if (next === state.chapter) return;
    state.chapter = next;
    syncSelectedToChapter();
    clearMessage();
    window.JorMetaUI?.setHighlightedChapter?.(state.chapter);
    render();
  }

  function selectLevel(levelNumber) {
    const level = Math.max(1, Math.min(TOTAL_LEVELS, Math.floor(Number(levelNumber) || 1)));
    state.selectedLevel = level;
    state.chapter = Math.max(0, Math.min(CHAPTER_COUNT - 1, Math.floor((level - 1) / LEVELS_PER_CHAPTER)));
    clearMessage();
    window.JorMetaUI?.setHighlightedChapter?.(state.open ? state.chapter : null);
    render();
  }

  function startSelectedLevel() {
    const level = Math.max(1, Math.min(TOTAL_LEVELS, Math.floor(Number(state.selectedLevel) || 1)));
    if (!isLevelUnlocked(level)) {
      clearMessage();
      return;
    }
    if (typeof App === 'object' && App) {
      App.pendingCampaignStart = true;
      App.gameMode = 'campaign';
      App.campaignLevel = level;
      App.campaignChapter = state.chapter;
    }
    close();
    if (typeof startGameFromMenu === 'function') {
      startGameFromMenu();
    } else if (DOM && DOM.startPlayBtn) {
      DOM.startPlayBtn.click();
    }
  }

  function completeLevel(levelNumber, stars) {
    const level = Math.max(1, Math.min(TOTAL_LEVELS, Math.floor(Number(levelNumber) || 1)));
    const value = Math.max(0, Math.min(3, Math.floor(Number(stars) || 0)));
    if (value > levelStarsFor(level)) {
      progress.stars[String(level)] = value;
    }
    if (value > 0) {
      unlockLevel(level);
      if (level + 1 <= TOTAL_LEVELS) unlockLevel(level + 1);
      if (level + 2 <= TOTAL_LEVELS) unlockLevel(level + 2);
    }
    const chapter = Math.floor((level - 1) / LEVELS_PER_CHAPTER);
    if (chapterStarInfo(chapter).earned >= LEVELS_PER_CHAPTER * 3) {
      const trophyKey = String(chapter);
      const alreadyHadTrophy = !!progress.chapterTrophies[trophyKey];
      progress.chapterTrophies[trophyKey] = true;
      if (!alreadyHadTrophy) {
        progress.pendingChapterTrophies = progress.pendingChapterTrophies || {};
        progress.pendingChapterTrophies[trophyKey] = true;
      }
    }
    saveProgress();
    window.JorMetaUI?.setStars?.(totalStars());
    render();
  }

  function createStar(active) {
    const star = document.createElement('img');
    star.className = 'campaignSmallStar' + (active ? ' active' : '');
    star.src = 'sprites/ui/level_star.webp';
    star.alt = '';
    star.setAttribute('aria-hidden', 'true');
    return star;
  }

  function renderLevelButton(level) {
    const button = document.createElement('button');
    const available = isLevelUnlocked(level);
    const stars = levelStarsFor(level);
    button.className = 'campaignLevelBtn' + (available ? '' : ' locked') + (level === state.selectedLevel ? ' selected' : '');
    button.type = 'button';
    button.dataset.level = String(level);
    button.setAttribute('aria-label', String(level));
    button.innerHTML = '<span class="campaignLevelShape"></span><span class="campaignLevelNumber"></span><span class="campaignStarsBadge"></span>';
    button.querySelector('.campaignLevelNumber').textContent = String(level);
    const badge = button.querySelector('.campaignStarsBadge');
    for (let i = 1; i <= 3; i += 1) badge.appendChild(createStar(i <= stars));
    return button;
  }

  function render() {
    if (!dom.overlay) return;
    syncSelectedToChapter();
    applyChapterTheme();
    if (dom.startButton) dom.startButton.textContent = tr('campaign');
    if (dom.title) dom.title.textContent = tr('chapter') + ' ' + (state.chapter + 1);
    if (dom.name) dom.name.textContent = (chapterNames[lang()] || chapterNames.ru)[state.chapter] || '';
    const info = chapterStarInfo(state.chapter);
    if (dom.stars) dom.stars.textContent = info.earned + '/' + info.max;
    if (dom.trophy) dom.trophy.classList.toggle('complete', hasChapterTrophy(state.chapter));
    if (dom.prevButton) dom.prevButton.disabled = state.chapter <= 0;
    if (dom.nextButton) dom.nextButton.disabled = state.chapter >= CHAPTER_COUNT - 1;
    if (dom.backButton) dom.backButton.textContent = tr('back');
    if (dom.playButton) {
      dom.playButton.textContent = tr('play');
      dom.playButton.disabled = !isLevelUnlocked(state.selectedLevel);
    }
    if (dom.grid) {
      dom.grid.textContent = '';
      chapterLevels(state.chapter).forEach((level) => dom.grid.appendChild(renderLevelButton(level)));
    }
  }

  function bindEvents() {
    dom.startButton?.addEventListener('click', open);
    dom.closeButton?.addEventListener('click', close);
    dom.backButton?.addEventListener('click', close);
    dom.prevButton?.addEventListener('click', () => changeChapter(-1));
    dom.nextButton?.addEventListener('click', () => changeChapter(1));
    dom.playButton?.addEventListener('click', startSelectedLevel);
    dom.grid?.addEventListener('click', (event) => {
      const button = event.target.closest('.campaignLevelBtn');
      if (!button) return;
      selectLevel(button.dataset.level);
    });
    document.addEventListener('keydown', (event) => {
      if (!state.open) return;
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowLeft') changeChapter(-1);
      if (event.key === 'ArrowRight') changeChapter(1);
      if (event.key === 'Enter') startSelectedLevel();
    });
  }

  function consumePendingTrophyAwards() {
    const pending = Object.keys(progress.pendingChapterTrophies || {})
      .map((key) => Math.max(0, Math.min(CHAPTER_COUNT - 1, Math.floor(Number(key) || 0))))
      .filter((chapter, index, list) => progress.chapterTrophies[String(chapter)] && list.indexOf(chapter) === index)
      .sort((a, b) => a - b);
    if (pending.length) {
      progress.pendingChapterTrophies = {};
      saveProgress();
    }
    return pending;
  }

  function init() {
    if (initialized) return;
    initialized = true;
    cacheDom();
    bindEvents();
    window.JorMetaUI?.setStars?.(totalStars());
    render();
    loadCloud();
  }

  window.JorCampaignUI = {
    init,
    render,
    open,
    close,
    syncCloud: loadCloud,
    completeLevel,
    levelStarsFor,
    isLevelUnlocked,
    totalStars,
    consumePendingTrophyAwards,
    getProgress: () => JSON.parse(JSON.stringify(progress))
  };
})();
