(function () {
  'use strict';

  const dom = {};
  let initialized = false;
  let open = false;

  function lang() {
    return typeof currentLang === 'string' && currentLang === 'en' ? 'en' : 'ru';
  }

  function pluralRu(value, one, few, many) {
    const number = Math.abs(Math.floor(Number(value) || 0));
    const mod100 = number % 100;
    const mod10 = number % 10;
    if (mod100 >= 11 && mod100 <= 14) return many;
    if (mod10 === 1) return one;
    if (mod10 >= 2 && mod10 <= 4) return few;
    return many;
  }

  function goalText(level) {
    const target = level?.starMode === 'completionTime'
      ? Math.max(1, Math.floor(Number(level.target) || 1))
      : Math.max(1, Math.floor(Number(level?.stars?.[2] ?? level?.target) || 1));

    if (lang() === 'en') {
      if (level.type === 'food') return `Collect ${target} food`;
      if (level.type === 'growth') return `Grow by ${target} stages`;
      if (level.type === 'dna') return `Collect ${target} blue orbs`;
      if (level.type === 'tomato') return `Collect ${target} tomatoes`;
      if (level.type === 'score') return `Score ${target} points`;
      if (level.type === 'enemy') return `Eat ${target} enemies`;
      if (level.type === 'survive') return `Survive for ${target} seconds`;
      return `Reach ${target}`;
    }

    if (level.type === 'food') return `\u0421\u043e\u0431\u0435\u0440\u0438 ${target} ${pluralRu(target, '\u0435\u0434\u0438\u043d\u0438\u0446\u0443', '\u0435\u0434\u0438\u043d\u0438\u0446\u044b', '\u0435\u0434\u0438\u043d\u0438\u0446')} \u0435\u0434\u044b`;
    if (level.type === 'growth') return `\u0412\u044b\u0440\u0430\u0441\u0442\u0438 \u043d\u0430 ${target} ${pluralRu(target, '\u0441\u0442\u0443\u043f\u0435\u043d\u044c', '\u0441\u0442\u0443\u043f\u0435\u043d\u0438', '\u0441\u0442\u0443\u043f\u0435\u043d\u0435\u0439')}`;
    if (level.type === 'dna') return `\u0421\u043e\u0431\u0435\u0440\u0438 ${target} ${pluralRu(target, '\u0441\u0438\u043d\u0438\u0439 \u043e\u0440\u0431', '\u0441\u0438\u043d\u0438\u0445 \u043e\u0440\u0431\u0430', '\u0441\u0438\u043d\u0438\u0445 \u043e\u0440\u0431\u043e\u0432')}`;
    if (level.type === 'tomato') return `\u0421\u043e\u0431\u0435\u0440\u0438 ${target} ${pluralRu(target, '\u043f\u043e\u043c\u0438\u0434\u043e\u0440', '\u043f\u043e\u043c\u0438\u0434\u043e\u0440\u0430', '\u043f\u043e\u043c\u0438\u0434\u043e\u0440\u043e\u0432')}`;
    if (level.type === 'score') return `\u041d\u0430\u0431\u0435\u0440\u0438 ${target} \u043e\u0447\u043a\u043e\u0432`;
    if (level.type === 'enemy') return `\u0421\u044a\u0435\u0448\u044c ${target} ${pluralRu(target, '\u043f\u0440\u043e\u0442\u0438\u0432\u043d\u0438\u043a\u0430', '\u043f\u0440\u043e\u0442\u0438\u0432\u043d\u0438\u043a\u043e\u0432', '\u043f\u0440\u043e\u0442\u0438\u0432\u043d\u0438\u043a\u043e\u0432')}`;
    if (level.type === 'survive') return `\u041f\u0440\u043e\u0434\u0435\u0440\u0436\u0438\u0441\u044c ${target} ${pluralRu(target, '\u0441\u0435\u043a\u0443\u043d\u0434\u0443', '\u0441\u0435\u043a\u0443\u043d\u0434\u044b', '\u0441\u0435\u043a\u0443\u043d\u0434')}`;
    return `\u0414\u043e\u0441\u0442\u0438\u0433\u043d\u0438 ${target}`;
  }

  function thresholdText(level, index) {
    if (level.starMode === 'completionTime') {
      const seconds = Math.max(1, Math.floor(Number(level.timeStars?.[index]) || 1));
      return lang() === 'en' ? `${seconds}s` : `${seconds} \u0441`;
    }
    const value = Math.max(0, Math.floor(Number(level.stars?.[index]) || 0));
    if (level.type === 'survive') return lang() === 'en' ? `${value}s` : `${value} \u0441`;
    return String(value);
  }

  function createThreshold(level, index) {
    const item = document.createElement('div');
    item.className = 'campaignRoundIntroStarItem';
    const icons = document.createElement('span');
    icons.className = 'campaignRoundIntroStarIcons';
    for (let i = 0; i <= index; i += 1) {
      const icon = document.createElement('img');
      icon.src = 'sprites/ui/level_star.webp';
      icon.alt = '';
      icon.setAttribute('aria-hidden', 'true');
      icons.appendChild(icon);
    }
    const value = document.createElement('strong');
    value.textContent = thresholdText(level, index);
    item.append(icons, value);
    return item;
  }

  function cacheDom() {
    dom.overlay = document.getElementById('campaignRoundIntroOverlay');
    dom.title = document.getElementById('campaignRoundIntroTitle');
    dom.goal = document.getElementById('campaignRoundIntroGoal');
    dom.stars = document.getElementById('campaignRoundIntroStars');
    dom.start = document.getElementById('campaignRoundIntroStart');
  }

  function closeAndStart() {
    if (!open) return;
    open = false;
    dom.overlay?.classList.remove('active');
    dom.overlay?.setAttribute('aria-hidden', 'true');
    App.pendingCampaignStart = false;
    App.localPause = false;
    if (DOM?.pauseToggleBtn) DOM.pauseToggleBtn.disabled = false;
    if (typeof resetMobileStick === 'function') resetMobileStick();
    if (typeof markGameplayStart === 'function') markGameplayStart();
  }

  function init() {
    if (initialized) return;
    initialized = true;
    cacheDom();
    dom.start?.addEventListener('click', closeAndStart);
    document.addEventListener('keydown', (event) => {
      if (open && event.key === 'Enter') closeAndStart();
    });
  }

  function show() {
    if (App.gameMode !== 'campaign') return false;
    init();
    const level = window.JorCampaignLevels?.getLevel?.(App.campaignLevel);
    if (!level || !dom.overlay) return false;

    dom.title.textContent = lang() === 'en' ? `ROUND ${level.n}` : `\u0420\u0410\u0423\u041d\u0414 ${level.n}`;
    dom.goal.textContent = goalText(level);
    dom.stars.textContent = '';
    for (let i = 0; i < 3; i += 1) dom.stars.appendChild(createThreshold(level, i));
    dom.start.textContent = lang() === 'en' ? 'START' : '\u041d\u0410\u0427\u0410\u0422\u042c';
    open = true;
    App.localPause = true;
    if (DOM?.pauseToggleBtn) DOM.pauseToggleBtn.disabled = true;
    dom.overlay.classList.add('active');
    dom.overlay.setAttribute('aria-hidden', 'false');
    dom.start.focus({ preventScroll: true });
    if (typeof markGameplayStop === 'function') markGameplayStop();
    return true;
  }

  window.showCampaignRoundIntro = show;
  window.isCampaignRoundIntroOpen = () => open;
})();
