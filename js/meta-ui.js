(function () {
  'use strict';

  const FULL_XP_LEADERBOARD = 'jorFullXP';
  const STARS_LEADERBOARD = 'jorStars';
  const FULL_XP_STORAGE = 'jor-full-xp';
  const STARS_STORAGE = 'jor-stars-total';

  const rankThresholds = [
    0, 2500, 6500, 12500, 22000,
    36000, 55000, 82000, 120000, 170000,
    235000, 320000, 430000, 580000, 780000,
    1050000, 1400000, 1850000, 2450000, 3200000,
    4200000, 5500000, 7200000, 9400000, 12200000,
    15600000, 19600000, 24200000, 29200000, 35000000
  ];

  const rankNames = {
    ru: [
      '\u0417\u0430\u0440\u043e\u0434\u044b\u0448', '\u041c\u0435\u043b\u043a\u0430\u044f \u043a\u043b\u0435\u0442\u043a\u0430', '\u0418\u0441\u043a\u0430\u0442\u0435\u043b\u044c \u043f\u0438\u0449\u0438', '\u0421\u043e\u0431\u0438\u0440\u0430\u0442\u0435\u043b\u044c \u043c\u0430\u0441\u0441\u044b', '\u042e\u043d\u044b\u0439 \u043e\u0445\u043e\u0442\u043d\u0438\u043a',
      '\u0413\u0438\u0431\u043a\u0438\u0439 \u043f\u043b\u043e\u0432\u0435\u0446', '\u0417\u0443\u0431\u0430\u0441\u0442\u0430\u044f \u043a\u043b\u0435\u0442\u043a\u0430', '\u041b\u043e\u0432\u0435\u0446 \u0442\u0435\u0447\u0435\u043d\u0438\u0439', '\u0425\u0438\u0449\u043d\u0430\u044f \u0444\u043e\u0440\u043c\u0430', '\u0410\u043b\u044c\u0444\u0430-\u043a\u043b\u0435\u0442\u043a\u0430',
      '\u041f\u043e\u0436\u0438\u0440\u0430\u0442\u0435\u043b\u044c \u043c\u0430\u043b\u044c\u043a\u043e\u0432', '\u0422\u0435\u043d\u0435\u0432\u043e\u0439 \u043e\u0445\u043e\u0442\u043d\u0438\u043a', '\u0413\u043b\u0443\u0431\u0438\u043d\u043d\u044b\u0439 \u0441\u0442\u0440\u0430\u043d\u043d\u0438\u043a', '\u0421\u0435\u0440\u0434\u0446\u0435 \u0441\u0442\u0430\u0438', '\u0412\u043b\u0430\u0434\u044b\u043a\u0430 \u0440\u0438\u0444\u0430',
      '\u0413\u043e\u043b\u043e\u0434 \u0431\u0435\u0437\u0434\u043d\u044b', '\u0416\u0438\u0432\u0430\u044f \u0431\u0443\u0440\u044f', '\u041f\u043e\u0432\u0435\u043b\u0438\u0442\u0435\u043b\u044c \u043c\u0443\u0442\u0430\u0446\u0438\u0439', '\u0421\u0438\u044f\u044e\u0449\u0438\u0439 \u0445\u0438\u0449\u043d\u0438\u043a', '\u0410\u0431\u0441\u043e\u043b\u044e\u0442\u043d\u044b\u0439 \u0416\u043e\u0440',
      '\u041f\u043e\u0432\u0435\u043b\u0438\u0442\u0435\u043b\u044c \u0440\u043e\u0441\u0442\u0430', '\u0425\u0440\u0430\u043d\u0438\u0442\u0435\u043b\u044c \u0431\u0435\u0437\u0434\u043d\u044b', '\u0421\u043e\u0437\u0434\u0430\u0442\u0435\u043b\u044c \u0432\u0438\u0434\u043e\u0432', '\u0412\u0435\u0447\u043d\u0430\u044f \u043a\u043b\u0435\u0442\u043a\u0430', '\u0412\u0435\u0440\u0445\u043e\u0432\u043d\u044b\u0439 \u0445\u0438\u0449\u043d\u0438\u043a',
      '\u0418\u043c\u043f\u0435\u0440\u0430\u0442\u043e\u0440 \u0433\u043b\u0443\u0431\u0438\u043d', '\u041b\u0435\u0433\u0435\u043d\u0434\u0430 \u0416\u043e\u0440\u0430', '\u0421\u0435\u0440\u0434\u0446\u0435 \u044d\u0432\u043e\u043b\u044e\u0446\u0438\u0438', '\u0411\u0435\u0441\u043a\u043e\u043d\u0435\u0447\u043d\u044b\u0439 \u0433\u043e\u043b\u043e\u0434', '\u0410\u0431\u0441\u043e\u043b\u044e\u0442\u043d\u0430\u044f \u0444\u043e\u0440\u043c\u0430'
    ],
    en: [
      'Seed Cell', 'Tiny Cell', 'Food Seeker', 'Mass Gatherer', 'Young Hunter',
      'Swift Swimmer', 'Toothed Cell', 'Current Catcher', 'Predator Form', 'Alpha Cell',
      'Fry Devourer', 'Shadow Hunter', 'Deep Wanderer', 'Swarm Heart', 'Reef Warden',
      'Abyss Hunger', 'Living Storm', 'Mutation Lord', 'Radiant Predator', 'Absolute Gluttony',
      'Growth Sovereign', 'Abyss Keeper', 'Species Maker', 'Eternal Cell', 'Supreme Predator',
      'Depth Emperor', 'Gluttony Legend', 'Evolution Heart', 'Endless Hunger', 'Absolute Form'
    ]
  };

  const text = {
    ru: {
      player: '\u0418\u0433\u0440\u043e\u043a',
      profileTitle: '\u0418\u0433\u0440\u043e\u043a',
      totalXp: '\u041d\u0430\u0431\u0440\u0430\u043d\u043e \u043e\u043f\u044b\u0442\u0430 \u0437\u0430 \u0432\u0441\u0451 \u0432\u0440\u0435\u043c\u044f',
      xpLeaderboard: '\u0420\u0435\u0439\u0442\u0438\u043d\u0433 \u043e\u043f\u044b\u0442\u0430',
      thanks: '\u0421\u043f\u0430\u0441\u0438\u0431\u043e, \u0447\u0442\u043e \u0438\u0433\u0440\u0430\u0435\u0448\u044c \u0432 \u043d\u0430\u0448\u0438 \u0438\u0433\u0440\u044b. \u041d\u0430\u043c \u043f\u0440\u0430\u0432\u0434\u0430 \u043f\u0440\u0438\u044f\u0442\u043d\u043e \u0432\u0438\u0434\u0435\u0442\u044c \u0442\u0432\u043e\u0439 \u043f\u0440\u043e\u0433\u0440\u0435\u0441\u0441.',
      rating: '\u0420\u0435\u0439\u0442\u0438\u043d\u0433',
      stars: '\u0417\u0432\u0451\u0437\u0434\u044b',
      endless: '\u0411\u0435\u0441\u043a\u043e\u043d\u0435\u0447\u043d\u044b\u0439',
      starsHint: '\u041f\u043e \u043e\u0431\u0449\u0435\u043c\u0443 \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u0443 \u043d\u0430\u0431\u0440\u0430\u043d\u043d\u044b\u0445 \u0437\u0432\u0451\u0437\u0434',
      endlessHint: '\u041f\u043e \u043e\u043f\u044b\u0442\u0443, \u043d\u0430\u0431\u0440\u0430\u043d\u043d\u043e\u043c\u0443 \u0432 \u0431\u0435\u0441\u043a\u043e\u043d\u0435\u0447\u043d\u043e\u043c \u0440\u0435\u0436\u0438\u043c\u0435',
      xpHint: '\u041f\u043e \u043e\u0431\u0449\u0435\u043c\u0443 \u043e\u043f\u044b\u0442\u0443 \u0437\u0430 \u0432\u0441\u0451 \u0432\u0440\u0435\u043c\u044f',
      loading: '\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043c...',
      empty: '\u041f\u043e\u043a\u0430 \u043d\u0435\u0442 \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u043e\u0432',
      unavailable: '\u0420\u0435\u0439\u0442\u0438\u043d\u0433 \u0431\u0443\u0434\u0435\u0442 \u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d \u043d\u0430 \u042f\u043d\u0434\u0435\u043a\u0441 \u0418\u0433\u0440\u0430\u0445',
      close: '\u0417\u0430\u043a\u0440\u044b\u0442\u044c'
    },
    en: {
      player: 'Player',
      profileTitle: 'Player',
      totalXp: 'Total experience earned',
      xpLeaderboard: 'XP leaderboard',
      thanks: 'Thanks for playing our games. We are genuinely happy to see your progress.',
      rating: 'Leaderboard',
      stars: 'Stars',
      endless: 'Endless',
      starsHint: 'By total stars earned',
      endlessHint: 'By endless mode experience',
      xpHint: 'By total experience earned',
      loading: 'Loading...',
      empty: 'No results yet',
      unavailable: 'Leaderboard is available on Yandex Games',
      close: 'Close'
    }
  };

  const state = {
    initialized: false,
    fullXp: loadNumber(FULL_XP_STORAGE),
    totalStars: loadNumber(STARS_STORAGE),
    activeModal: null,
    activeLeaderboardTab: 'stars',
    leaderboardLoading: false,
    leaderboardError: '',
    leaderboardEntries: [],
    xpLeaderboardLoading: false,
    xpLeaderboardError: '',
    xpLeaderboardEntries: [],
    trophyAwards: new Set(),
    trophyAwardTimer: 0,
    highlightedChapter: null
  };

  const dom = {};

  function lang() {
    const value = (typeof currentLang !== 'undefined' ? currentLang : document.documentElement.lang || 'ru').toLowerCase();
    return value.startsWith('en') ? 'en' : 'ru';
  }

  function tr(key) {
    const dictionary = text[lang()] || text.ru;
    return dictionary[key] || text.ru[key] || key;
  }

  function loadNumber(key) {
    try {
      const value = Number(window.localStorage.getItem(key) || 0);
      return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    } catch (error) {
      return 0;
    }
  }

  function saveNumber(key, value) {
    try {
      window.localStorage.setItem(key, String(Math.max(0, Math.floor(value || 0))));
    } catch (error) {}
  }

  function formatNumber(value) {
    const locale = lang() === 'en' ? 'en-US' : 'ru-RU';
    return Math.max(0, Math.floor(value || 0)).toLocaleString(locale);
  }

  function rankInfo() {
    let index = 0;
    for (let i = rankThresholds.length - 1; i >= 0; i -= 1) {
      if (state.fullXp >= rankThresholds[i]) {
        index = i;
        break;
      }
    }
    const current = rankThresholds[index];
    const next = rankThresholds[index + 1] === undefined ? current : rankThresholds[index + 1];
    const progress = rankThresholds[index + 1] === undefined ? 1 : Math.max(0, Math.min(1, (state.fullXp - current) / Math.max(1, next - current)));
    const names = rankNames[lang()] || rankNames.ru;
    return {
      level: index + 1,
      title: names[index] || names[names.length - 1],
      progress
    };
  }

  function playerName() {
    try {
      if (App?.player?.getName) return App.player.getName() || tr('player');
      if (App?.player?.getUniqueID) return App.player.getUniqueID() || tr('player');
    } catch (error) {}
    return tr('player');
  }

  function cacheDom() {
    dom.overlay = document.getElementById('metaModalOverlay');
    dom.profileButton = document.getElementById('metaProfileButton');
    dom.leaderboardButton = document.getElementById('metaLeaderboardButton');
    dom.soundButton = document.getElementById('metaSoundToggleBtn');
    dom.profileIcon = document.getElementById('metaProfileIcon');
    dom.playerName = document.getElementById('metaPlayerName');
    dom.rankName = document.getElementById('metaRankName');
    dom.rankFill = document.getElementById('metaRankFill');
    dom.trophyShelf = document.getElementById('metaTrophyShelf');
    dom.profileModal = document.getElementById('metaProfileModal');
    dom.leaderboardModal = document.getElementById('metaLeaderboardModal');
    dom.xpLeaderboardModal = document.getElementById('metaXpLeaderboardModal');
    dom.profileClose = document.getElementById('metaProfileClose');
    dom.leaderboardClose = document.getElementById('metaLeaderboardClose');
    dom.xpLeaderboardClose = document.getElementById('metaXpLeaderboardClose');
    dom.profileTitle = document.getElementById('metaProfileTitle');
    dom.profileModalIcon = document.getElementById('metaProfileModalIcon');
    dom.profileRank = document.getElementById('metaProfileRank');
    dom.profileRankFill = document.getElementById('metaProfileRankFill');
    dom.profileXp = document.getElementById('metaProfileXp');
    dom.xpButton = document.getElementById('metaXpLeaderboardButton');
    dom.leaderboardTitle = document.getElementById('metaLeaderboardTitle');
    dom.leaderboardTabs = document.getElementById('metaLeaderboardTabs');
    dom.leaderboardHint = document.getElementById('metaLeaderboardHint');
    dom.leaderboardList = document.getElementById('metaLeaderboardList');
    dom.xpLeaderboardTitle = document.getElementById('metaXpLeaderboardTitle');
    dom.xpLeaderboardList = document.getElementById('metaXpLeaderboardList');
  }

  function bindEvents() {
    dom.profileButton?.addEventListener('click', openProfile);
    dom.leaderboardButton?.addEventListener('click', () => openLeaderboard(state.activeLeaderboardTab));
    dom.soundButton?.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      if (typeof toggleAudioMuted === 'function') toggleAudioMuted();
      if (typeof updateAudioToggleButton === 'function') updateAudioToggleButton();
      syncSoundButton();
    });
    dom.profileClose?.addEventListener('click', closeModal);
    dom.leaderboardClose?.addEventListener('click', closeModal);
    dom.xpLeaderboardClose?.addEventListener('click', closeModal);
    dom.xpButton?.addEventListener('click', openXpLeaderboard);
    dom.xpButton?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openXpLeaderboard();
      }
    });
    dom.leaderboardTabs?.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-meta-tab]');
      if (!button) return;
      openLeaderboard(button.dataset.metaTab);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && state.activeModal) closeModal();
    });
  }

  function render() {
    const rank = rankInfo();
    if (dom.playerName) dom.playerName.textContent = playerName();
    const profileIcon = window.JorProfileIcons?.getIcon?.(window.JorShopUI?.selectedProfileIconId?.() || 'base');
    if (dom.profileIcon && profileIcon?.src) dom.profileIcon.style.backgroundImage = `url('${profileIcon.src}')`;
    if (dom.profileModalIcon && profileIcon?.src) dom.profileModalIcon.style.backgroundImage = `url('${profileIcon.src}')`;
    syncSoundButton();
    if (dom.rankName) dom.rankName.textContent = rank.title;
    if (dom.rankFill) dom.rankFill.style.width = `${Math.round(rank.progress * 100)}%`;
    if (dom.profileTitle) dom.profileTitle.textContent = playerName();
    if (dom.profileRank) dom.profileRank.textContent = rank.title;
    if (dom.profileRankFill) dom.profileRankFill.style.width = `${Math.round(rank.progress * 100)}%`;
    if (dom.profileXp) dom.profileXp.textContent = formatNumber(state.fullXp);
    renderTrophyShelf();

    const xpLabel = dom.xpButton?.querySelector('.metaXpLabel');
    const xpAction = dom.xpButton?.querySelector('.metaXpAction');
    const thanks = dom.profileModal?.querySelector('.metaThanks');
    if (xpLabel) xpLabel.textContent = tr('totalXp');
    if (xpAction) xpAction.textContent = tr('xpLeaderboard');
    if (thanks) thanks.textContent = tr('thanks');
    if (dom.leaderboardTitle) dom.leaderboardTitle.textContent = tr('rating');
    if (dom.xpLeaderboardTitle) dom.xpLeaderboardTitle.textContent = tr('xpLeaderboard');
    if (dom.profileClose) dom.profileClose.setAttribute('aria-label', tr('close'));
    if (dom.leaderboardClose) dom.leaderboardClose.setAttribute('aria-label', tr('close'));
    if (dom.xpLeaderboardClose) dom.xpLeaderboardClose.setAttribute('aria-label', tr('close'));

    const starTab = dom.leaderboardTabs?.querySelector('[data-meta-tab="stars"]');
    const endlessTab = dom.leaderboardTabs?.querySelector('[data-meta-tab="endless"]');
    if (starTab) starTab.textContent = tr('stars');
    if (endlessTab) endlessTab.textContent = tr('endless');

    renderLeaderboard();
    renderXpLeaderboard();
  }


  function renderTrophyShelf() {
    if (!dom.trophyShelf) return;
    const progress = window.JorCampaignUI?.getProgress?.() || {};
    const trophies = progress.chapterTrophies || {};
    const chapterOverlayOpen = !!document.getElementById('campaignOverlay')?.classList.contains('active');
    dom.trophyShelf.replaceChildren();
    for (let chapter = 0; chapter < 10; chapter += 1) {
      const item = document.createElement('span');
      item.className = 'metaTrophyItem'
        + (trophies[String(chapter)] ? ' complete' : '')
        + (state.trophyAwards.has(chapter) ? ' awarding' : '')
        + (chapterOverlayOpen && state.highlightedChapter === chapter ? ' currentChapter' : '');
      const image = document.createElement('img');
      image.src = 'sprites/ui/chapter_trophy.png';
      image.alt = '';
      image.setAttribute('aria-hidden', 'true');
      item.appendChild(image);
      dom.trophyShelf.appendChild(item);
    }
  }

  function playPendingTrophyAwards() {
    if (!dom.trophyShelf || !window.JorCampaignUI?.consumePendingTrophyAwards) return;
    const pending = window.JorCampaignUI.consumePendingTrophyAwards();
    if (!pending.length) return;
    if (state.trophyAwardTimer) window.clearTimeout(state.trophyAwardTimer);
    state.trophyAwards = new Set(pending);
    render();
    state.trophyAwardTimer = window.setTimeout(() => {
      state.trophyAwards.clear();
      state.trophyAwardTimer = 0;
      render();
    }, 1500);
  }

  function setModal(name) {
    state.activeModal = name;
    dom.overlay?.classList.toggle('active', !!name);
    dom.overlay?.setAttribute('aria-hidden', name ? 'false' : 'true');
    dom.profileModal?.classList.toggle('active', name === 'profile');
    dom.leaderboardModal?.classList.toggle('active', name === 'leaderboard');
    dom.xpLeaderboardModal?.classList.toggle('active', name === 'xpLeaderboard');
  }

  function closeModal() {
    setModal(null);
  }

  function openProfile() {
    render();
    setModal('profile');
    syncFullXpWithServer();
  }

  async function openLeaderboard(tab = 'stars') {
    state.activeLeaderboardTab = tab === 'endless' ? 'endless' : 'stars';
    state.leaderboardLoading = true;
    state.leaderboardError = '';
    state.leaderboardEntries = [];
    render();
    setModal('leaderboard');

    const leaderboardName = state.activeLeaderboardTab === 'stars'
      ? STARS_LEADERBOARD
      : (App?.leaderboardName || 'topScore');
    const localValue = state.activeLeaderboardTab === 'stars' ? state.totalStars : Math.max(0, Math.floor(App?.lastLeaderboardScore || 0));

    if (state.activeLeaderboardTab === 'stars' && state.totalStars > 0) {
      await submitLeaderboardScore(STARS_LEADERBOARD, state.totalStars);
    }

    const result = await loadLeaderboardRows(leaderboardName, localValue, 10, 2);
    state.leaderboardLoading = false;
    state.leaderboardEntries = result.entries;
    state.leaderboardError = result.error;
    renderLeaderboard();
  }

  async function openXpLeaderboard() {
    state.xpLeaderboardLoading = true;
    state.xpLeaderboardError = '';
    state.xpLeaderboardEntries = [];
    render();
    setModal('xpLeaderboard');

    await syncFullXpWithServer(false);
    const result = await loadLeaderboardRows(FULL_XP_LEADERBOARD, state.fullXp, 30, 1);
    state.xpLeaderboardLoading = false;
    state.xpLeaderboardEntries = result.entries;
    state.xpLeaderboardError = result.error;
    syncFullXpFromEntries(result.entries);
    renderXpLeaderboard();
    render();
  }

  function renderLeaderboard() {
    if (!dom.leaderboardList) return;
    const active = state.activeLeaderboardTab;
    dom.leaderboardTabs?.querySelectorAll('button[data-meta-tab]').forEach((button) => {
      button.classList.toggle('active', button.dataset.metaTab === active);
    });
    if (dom.leaderboardHint) dom.leaderboardHint.textContent = active === 'stars' ? tr('starsHint') : tr('endlessHint');
    renderRows(dom.leaderboardList, state.leaderboardEntries, state.leaderboardLoading, state.leaderboardError);
  }

  function renderXpLeaderboard() {
    if (!dom.xpLeaderboardList) return;
    renderRows(dom.xpLeaderboardList, state.xpLeaderboardEntries, state.xpLeaderboardLoading, state.xpLeaderboardError, true);
  }

  function syncSoundButton() {
    if (!dom.soundButton) return;
    const muted = Boolean(typeof AUDIO !== 'undefined' && AUDIO?.muted);
    dom.soundButton.classList.toggle('muted', muted);
    dom.soundButton.setAttribute('aria-label', muted ? 'Sound off' : 'Sound on');
    dom.soundButton.setAttribute('aria-pressed', muted ? 'true' : 'false');
  }

  function renderRows(container, entries, loading, error, xpMode = false) {
    if (loading) {
      container.innerHTML = `<div class="metaLeaderboardState">${escapeHtml(tr('loading'))}</div>`;
      return;
    }
    if (error) {
      container.innerHTML = `<div class="metaLeaderboardState">${escapeHtml(error)}</div>`;
      return;
    }
    const rows = xpMode ? xpLeaderboardRows(entries || []) : leaderboardRows(entries || []);
    if (!rows.length) {
      container.innerHTML = `<div class="metaLeaderboardState">${escapeHtml(tr('empty'))}</div>`;
      return;
    }
    container.innerHTML = rows.map((row) => {
      if (row.type === 'gap') return '<div class="metaLeaderboardGap" aria-hidden="true"></div>';
      const entry = row.entry;
      const rankClass = entry.rank <= 3 ? ` top${entry.rank}` : '';
      return `
        <div class="metaLeaderboardRow${entry.isPlayer ? ' isPlayer' : ''}${rankClass}">
          <div class="metaLeaderboardRank">${escapeHtml(entry.rank)}</div>
          <div class="metaLeaderboardName">${escapeHtml(entry.name || tr('player'))}</div>
          <div class="metaLeaderboardScore">${escapeHtml(formatNumber(entry.score))}</div>
        </div>
      `;
    }).join('');
  }

  function leaderboardRows(entries) {
    const sorted = (entries || [])
      .filter((entry) => entry && Number.isFinite(entry.rank))
      .sort((a, b) => a.rank - b.rank);
    const result = [];
    const added = new Set();
    const add = (entry) => {
      if (!entry || added.has(entry.rank)) return;
      result.push({ type: 'row', entry });
      added.add(entry.rank);
    };
    sorted.filter((entry) => entry.rank <= 10).slice(0, 10).forEach(add);
    const player = sorted.find((entry) => entry.isPlayer);
    if (player && !added.has(player.rank)) {
      if (result.length) result.push({ type: 'gap' });
      sorted.filter((entry) => Math.abs(entry.rank - player.rank) <= 2).forEach(add);
    }
    return result;
  }

  function xpLeaderboardRows(entries) {
    const sorted = (entries || [])
      .filter((entry) => entry && Number.isFinite(entry.rank))
      .sort((a, b) => a.rank - b.rank);
    const result = [];
    const added = new Set();
    const add = (entry) => {
      if (!entry || added.has(entry.rank)) return;
      result.push({ type: 'row', entry });
      added.add(entry.rank);
    };
    const addGap = () => {
      if (result.length && result[result.length - 1].type !== 'gap') result.push({ type: 'gap' });
    };

    sorted.filter((entry) => entry.rank <= 3).slice(0, 3).forEach(add);
    const player = sorted.find((entry) => entry.isPlayer);
    const around = player ? sorted.filter((entry) => Math.abs(entry.rank - player.rank) <= 1) : [];
    if (around.some((entry) => !added.has(entry.rank))) {
      addGap();
      around.forEach(add);
    }
    const bottom = sorted.slice(-3);
    if (bottom.some((entry) => !added.has(entry.rank))) {
      addGap();
      bottom.forEach(add);
    }
    return result.slice(0, 13);
  }

  async function getLeaderboardsApi() {
    if (!App?.sdkReady || !App?.ysdk) return null;
    if (App.ysdk.leaderboards) return App.ysdk.leaderboards;
    if (typeof App.ysdk.getLeaderboards === 'function') {
      try {
        return await App.ysdk.getLeaderboards();
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  async function submitLeaderboardScore(name, value) {
    const score = Math.max(0, Math.floor(value || 0));
    if (score <= 0) return false;
    const api = await getLeaderboardsApi();
    if (!api) return false;
    try {
      if (typeof api.setScore === 'function') {
        await api.setScore(name, score);
        return true;
      }
      if (typeof api.setLeaderboardScore === 'function') {
        await api.setLeaderboardScore(name, score);
        return true;
      }
    } catch (error) {}
    return false;
  }

  async function loadLeaderboardRows(name, localValue, quantityTop, quantityAround) {
    const api = await getLeaderboardsApi();
    if (!api) {
      const score = Math.max(0, Math.floor(localValue || 0));
      return {
        error: App?.sdkReady ? tr('unavailable') : '',
        entries: score > 0 ? [{ rank: 1, name: playerName(), score, isPlayer: true }] : []
      };
    }
    try {
      const options = { quantityTop, includeUser: true, quantityAround };
      const result = typeof api.getEntries === 'function'
        ? await api.getEntries(name, options)
        : await api.getLeaderboardEntries(name, options);
      return { error: '', entries: mapEntries(result) };
    } catch (error) {
      return { error: tr('unavailable'), entries: [] };
    }
  }

  function mapEntries(result) {
    let currentUserId = '';
    try {
      currentUserId = App?.player?.getUniqueID?.() || '';
    } catch (error) {}
    return (result?.entries || []).map((entry) => {
      const uniqueId = entry.player?.uniqueID || '';
      return {
        rank: Number(entry.rank),
        name: entry.player?.publicName || uniqueId || tr('player'),
        score: Math.max(0, Math.floor(entry.score || 0)),
        isPlayer: !!entry.isUser || (!!uniqueId && !!currentUserId && uniqueId === currentUserId)
      };
    }).filter((entry) => Number.isFinite(entry.rank));
  }

  function setFullXp(value) {
    const next = Math.max(0, Math.floor(value || 0));
    if (next <= state.fullXp) return false;
    state.fullXp = next;
    saveNumber(FULL_XP_STORAGE, state.fullXp);
    return true;
  }

  function syncFullXpFromEntries(entries) {
    const playerEntry = (entries || []).find((entry) => entry?.isPlayer);
    return playerEntry ? setFullXp(playerEntry.score) : false;
  }

  async function syncFullXpWithServer(renderAfter = true) {
    const result = await loadLeaderboardRows(FULL_XP_LEADERBOARD, state.fullXp, 1, 1);
    const updated = syncFullXpFromEntries(result.entries);
    if (!updated && state.fullXp > 0) await submitLeaderboardScore(FULL_XP_LEADERBOARD, state.fullXp);
    if (updated && renderAfter) render();
    return updated;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function awardXp(amount) {
    const baseValue = Math.max(0, Math.floor(amount || 0));
    if (baseValue <= 0) return;
    const xpBonus = Math.max(0, Number(window.JorShopUI?.getBonuses?.().xp || 0));
    const value = Math.max(0, Math.floor(baseValue * (1 + xpBonus)));
    setFullXp(state.fullXp + value);
    render();
    await submitLeaderboardScore(FULL_XP_LEADERBOARD, state.fullXp);
  }

  async function setStars(totalStars) {
    state.totalStars = Math.max(0, Math.floor(totalStars || 0));
    saveNumber(STARS_STORAGE, state.totalStars);
    render();
    await submitLeaderboardScore(STARS_LEADERBOARD, state.totalStars);
  }


  function setHighlightedChapter(chapter) {
    const value = Number.isFinite(Number(chapter)) ? Math.floor(Number(chapter)) : null;
    const next = value === null ? null : Math.max(0, Math.min(9, value));
    if (state.highlightedChapter === next) return;
    state.highlightedChapter = next;
    renderTrophyShelf();
  }

  function refreshPlayer() {
    render();
  }

  function init() {
    if (state.initialized) return;
    cacheDom();
    if (!dom.overlay) return;
    state.initialized = true;
    bindEvents();
    render();
    syncFullXpWithServer();
  }

  window.JorMetaUI = {
    init,
    render,
    refreshPlayer,
    awardXp,
    setStars,
    setHighlightedChapter,
    playPendingTrophyAwards,
    openProfile,
    openLeaderboard,
    openXpLeaderboard,
    submitFullXp: () => submitLeaderboardScore(FULL_XP_LEADERBOARD, state.fullXp),
    submitStars: () => submitLeaderboardScore(STARS_LEADERBOARD, state.totalStars)
  };
})();
