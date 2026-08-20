(() => {
  'use strict';

  const bonuses = [
    { id: 'speed', ru: 'Стремительный поток', en: 'Swift Current', valueRu: '+5% скорости', valueEn: '+5% speed', bonuses: { speed: 0.05 } },
    { id: 'defense', ru: 'Прочный панцирь', en: 'Strong Shell', valueRu: '+5% защиты', valueEn: '+5% defense', bonuses: { defense: 0.05 } },
    { id: 'growth', ru: 'Большой аппетит', en: 'Big Appetite', valueRu: '+5% роста', valueEn: '+5% growth', bonuses: { growth: 0.05 } },
    { id: 'enemyGrowth', ru: 'Инстинкт охотника', en: 'Hunter Instinct', valueRu: '+6% роста за врагов', valueEn: '+6% enemy growth', bonuses: { enemyGrowth: 0.06 } },
    { id: 'xp', ru: 'Быстрое развитие', en: 'Fast Development', valueRu: '+8% опыта', valueEn: '+8% XP', bonuses: { score: 0.08 } }
  ];
  const byId = new Map(bonuses.map((bonus) => [bonus.id, bonus]));
  const dom = {};
  let selection = {};
  let resetTimer = 0;

  function english() {
    return typeof currentLang === 'string' && currentLang === 'en';
  }

  function text(ru, en) {
    return english() ? en : ru;
  }

  function dayKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function previousDayKey(key) {
    const parts = key.split('-').map(Number);
    return dayKey(new Date(parts[0], parts[1] - 1, parts[2] - 1, 12));
  }

  function hash(value) {
    let result = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      result ^= value.charCodeAt(i);
      result = Math.imul(result, 16777619);
    }
    return result >>> 0;
  }

  function shuffledIds(key) {
    const ids = bonuses.map((bonus) => bonus.id);
    let seed = hash(`jor-daily-v1:${key}`) || 1;
    for (let i = ids.length - 1; i > 0; i -= 1) {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      const index = (seed >>> 0) % (i + 1);
      const current = ids[i];
      ids[i] = ids[index];
      ids[index] = current;
    }
    return ids;
  }

  function optionIds(key = dayKey()) {
    const ids = shuffledIds(key);
    const previous = shuffledIds(previousDayKey(key));
    const samePair = ids[0] === previous[0] && ids[1] === previous[1]
      || ids[0] === previous[1] && ids[1] === previous[0];
    return samePair ? [ids[0], ids[2]] : [ids[0], ids[1]];
  }

  function normalizeSelection(value) {
    const source = value && typeof value === 'object' ? value : {};
    const bonusId = String(source.bonusId || '');
    return byId.has(bonusId) ? { day: String(source.day || ''), bonusId } : {};
  }

  function activeBonus() {
    if (selection.day !== dayKey()) return null;
    return byId.get(selection.bonusId) || null;
  }

  function getBonuses() {
    const active = activeBonus();
    return active ? { ...active.bonuses } : {};
  }

  function getScoreBonus() {
    const active = activeBonus();
    return Math.max(0, Number(active?.bonuses.score || 0));
  }

  function setOpen(open) {
    if (!dom.overlay) return;
    dom.overlay.classList.toggle('visible', open);
    dom.overlay.setAttribute('aria-hidden', open ? 'false' : 'true');
    window.JorUIFit?.refresh?.();
  }

  function close() {
    setOpen(false);
  }

  function renderChoice(bonus, active) {
    const button = document.createElement('button');
    const title = document.createElement('span');
    const value = document.createElement('span');
    button.type = 'button';
    button.className = 'dailyBonusChoice';
    button.dataset.bonusId = bonus.id;
    title.className = 'dailyBonusChoiceTitle';
    value.className = 'dailyBonusChoiceValue';
    title.textContent = text(bonus.ru, bonus.en);
    value.textContent = text(bonus.valueRu, bonus.valueEn);
    button.append(title, value);
    if (active) {
      button.disabled = true;
      button.classList.toggle('selected', active.id === bonus.id);
    }
    return button;
  }

  function render() {
    const active = activeBonus();
    if (dom.button) {
      dom.button.textContent = active ? text('БОНУС АКТИВЕН', 'BONUS ACTIVE') : text('БОНУС ДНЯ', 'DAILY BONUS');
      dom.button.classList.toggle('active', !!active);
    }
    if (dom.title) dom.title.textContent = text('Бонус дня', 'Daily bonus');
    if (dom.hint) dom.hint.textContent = active
      ? text('Выбранный бонус действует до конца дня', 'The selected bonus lasts until the end of your local day')
      : text('Выбери бонус на сегодня', 'Choose today\'s bonus');
    if (dom.close) dom.close.setAttribute('aria-label', text('Закрыть', 'Close'));
    if (dom.choices) {
      dom.choices.replaceChildren(...optionIds().map((id) => renderChoice(byId.get(id), active)));
    }
  }

  function refresh() {
    render();
    scheduleReset();
  }

  function scheduleReset() {
    if (resetTimer) clearTimeout(resetTimer);
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    resetTimer = setTimeout(refresh, Math.max(1000, next.getTime() - now.getTime() + 250));
  }

  function choose(bonusId) {
    if (activeBonus() || !optionIds().includes(bonusId)) return;
    selection = { day: dayKey(), bonusId };
    window.JorSaveManager?.setSection?.('dailyBonus', selection, true);
    render();
  }

  function open() {
    refresh();
    setOpen(true);
  }

  function syncFromSave() {
    selection = normalizeSelection(window.JorSaveManager?.getSection?.('dailyBonus', {}));
    refresh();
  }

  function init() {
    dom.button = document.getElementById('startDailyBonusBtn');
    dom.overlay = document.getElementById('dailyBonusOverlay');
    dom.close = document.getElementById('dailyBonusClose');
    dom.title = document.getElementById('dailyBonusTitle');
    dom.hint = document.getElementById('dailyBonusHint');
    dom.choices = document.getElementById('dailyBonusChoices');
    dom.button?.addEventListener('click', open);
    dom.close?.addEventListener('click', close);
    dom.overlay?.addEventListener('click', (event) => {
      if (event.target === dom.overlay) close();
    });
    dom.choices?.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-bonus-id]');
      if (button) choose(button.dataset.bonusId);
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) refresh();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && dom.overlay?.classList.contains('visible')) close();
    });
    syncFromSave();
  }

  window.JorDailyBonus = { init, open, close, render, refresh, syncFromSave, getBonuses, getScoreBonus, getActiveBonus: activeBonus, getDayKey: dayKey, getOptionIds: optionIds };
})();
