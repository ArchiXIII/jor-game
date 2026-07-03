(function () {
  'use strict';

  const levels = (window.JorCampaignChapterLevels || []).flat();

  const labels = {
    ru: {
      food: '\u0415\u0434\u0430',
      size: '\u0420\u0430\u0437\u043c\u0435\u0440',
      enemy: '\u0412\u0440\u0430\u0433\u0438',
      dna: '\u041e\u0440\u0431\u044b',
      survive: '\u0412\u0440\u0435\u043c\u044f',
      winTitle: '\u0420\u0430\u0443\u043d\u0434 \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043d',
      winText: (level, stars) => `\u0420\u0430\u0443\u043d\u0434 ${level} \u043f\u0440\u043e\u0439\u0434\u0435\u043d. \u0417\u0432\u0451\u0437\u0434: ${stars}/3`,
      seconds: '\u0441'
    },
    en: {
      food: 'Food',
      size: 'Size',
      enemy: 'Enemies',
      dna: 'Orbs',
      survive: 'Time',
      winTitle: 'Round complete',
      winText: (level, stars) => `Round ${level} complete. Stars: ${stars}/3`,
      seconds: 's'
    }
  };

  function lang() {
    return typeof currentLang === 'string' && currentLang === 'en' ? 'en' : 'ru';
  }

  function t(key, ...args) {
    const entry = labels[lang()][key] || labels.ru[key];
    return typeof entry === 'function' ? entry(...args) : entry;
  }

  function getLevel(levelNumber) {
    const number = Math.max(1, Math.floor(Number(levelNumber) || 1));
    return levels.find((level) => level.n === number) || null;
  }

  function getStarCount(level, value) {
    if (!level) return 0;
    const score = Math.max(0, Math.floor(Number(value) || 0));
    if (score >= level.stars[2]) return 3;
    if (score >= level.stars[1]) return 2;
    if (score >= level.stars[0]) return 1;
    return 0;
  }

  window.JorCampaignLevels = {
    levels,
    getLevel,
    getStarCount,
    label: t
  };
})();
