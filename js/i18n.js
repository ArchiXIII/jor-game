const SUPPORTED_LANGS = new Set(['ru', 'en']);
    let currentLang = 'ru';

    const i18n = {
      ru: {
        documentTitle: 'Gluttony \u2014 Yandex Games',
        startBadge: 'Milevora team',
        startTitle: '\u0416\u043e\u0440',
        hudTitle: '\u0416\u043e\u0440',
        startSubtitle: '\u041f\u043e\u0433\u043b\u043e\u0449\u0430\u0439 \u043f\u0438\u0449\u0443, \u0440\u0430\u0441\u0442\u0438, \u043e\u0442\u043a\u0440\u044b\u0432\u0430\u0439 \u043c\u0443\u0442\u0430\u0446\u0438\u0438 \u0438 \u043f\u0435\u0440\u0435\u0445\u043e\u0434\u0438 \u0432 \u0431\u0435\u0441\u043a\u043e\u043d\u0435\u0447\u043d\u0443\u044e \u0444\u0430\u0437\u0443 \u0432\u044b\u0436\u0438\u0432\u0430\u043d\u0438\u044f',
        play: '\u0411\u0435\u0441\u043a\u043e\u043d\u0435\u0447\u043d\u044b\u0439 \u0440\u0435\u0436\u0438\u043c',
        campaign: '\u041f\u0440\u043e\u0445\u043e\u0436\u0434\u0435\u043d\u0438\u0435',
        ourGames: '\u041d\u0430\u0448\u0438 \u0438\u0433\u0440\u044b',
        shop: '\u041c\u0430\u0433\u0430\u0437\u0438\u043d',
        restart: '\u0412 \u0433\u043b\u0430\u0432\u043d\u043e\u0435 \u043c\u0435\u043d\u044e',
        pauseTitle: '\u041f\u0430\u0443\u0437\u0430',
        pauseHint: '\u041d\u0430\u0436\u043c\u0438 ESC, \u0447\u0442\u043e\u0431\u044b \u043f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c',
        pauseResume: '\u041f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c',
        pauseExit: '\u0412\u042b\u0425\u041e\u0414',
        exitRoundTitle: '\u0412\u042b\u0419\u0422\u0418 \u0418\u0417 \u0420\u0410\u0423\u041d\u0414\u0410?',
        exitRoundText: '\u041f\u0440\u043e\u0433\u0440\u0435\u0441\u0441 \u0442\u0435\u043a\u0443\u0449\u0435\u0433\u043e \u0440\u0430\u0443\u043d\u0434\u0430 \u0431\u0443\u0434\u0435\u0442 \u043f\u043e\u0442\u0435\u0440\u044f\u043d.',
        exitRoundConfirm: '\u0412\u042b\u0419\u0422\u0418',
        exitRoundCancel: '\u041e\u0421\u0422\u0410\u0422\u042c\u0421\u042f',
        evolutionTitle: '\u042d\u0432\u043e\u043b\u044e\u0446\u0438\u044f',
        evolutionChoose: '\u0412\u044b\u0431\u0435\u0440\u0438 \u043e\u0434\u043d\u0443 \u043c\u0443\u0442\u0430\u0446\u0438\u044e',
        rewardButtonDefault: '\u0421\u043c\u043e\u0442\u0440\u0435\u0442\u044c \u0440\u0435\u043a\u043b\u0430\u043c\u0443 \u0437\u0430 \u0431\u043e\u043d\u0443\u0441: +1 \u0434\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0439 \u0432\u0430\u0440\u0438\u0430\u043d\u0442 \u043c\u0443\u0442\u0430\u0446\u0438\u0438',
        rewardButtonUsed: '\u0411\u043e\u043d\u0443\u0441\u043d\u0430\u044f \u0440\u0435\u043a\u043b\u0430\u043c\u0430 \u0443\u0436\u0435 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0430 \u0432 \u044d\u0442\u043e\u043c \u0432\u044b\u0431\u043e\u0440\u0435',
        rewardButtonNoAd: '\u0411\u043e\u043d\u0443\u0441\u043d\u044b\u0439 \u0432\u044b\u0431\u043e\u0440',
        sdkLocal: 'SDK: \u043b\u043e\u043a\u0430\u043b\u044c\u043d\u044b\u0439 \u0440\u0435\u0436\u0438\u043c',
        sdkReady: 'SDK: Yandex Games',
        sdkError: 'SDK: \u043e\u0448\u0438\u0431\u043a\u0430 \u0438\u043d\u0438\u0446\u0438\u0430\u043b\u0438\u0437\u0430\u0446\u0438\u0438',
        endlessWave: (wave) => `\u0411\u0435\u0441\u043a\u043e\u043d\u0435\u0447\u043d\u043e\u0441\u0442\u044c \u00b7 \u0432\u043e\u043b\u043d\u0430 ${wave}`,
        endlessMax: '\u043c\u0430\u043a\u0441\u0438\u043c\u0443\u043c',
        congratsTitle: '\u0420\u0430\u0443\u043d\u0434 \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043d',
        congratsText: (score) => `\u0422\u044b \u043d\u0430\u0431\u0440\u0430\u043b ${score} \u043e\u0447\u043a\u043e\u0432 \u0437\u0430 \u044d\u0442\u0443 \u0438\u0433\u0440\u0443`,
        enemiesEaten: '\u041f\u0440\u043e\u0442\u0438\u0432\u043d\u0438\u043a\u043e\u0432 \u0441\u044a\u0435\u0434\u0435\u043d\u043e',
        leaderboardLoginHint: '\u0412\u043e\u0439\u0434\u0438\u0442\u0435 \u0432 \u0430\u043a\u043a\u0430\u0443\u043d\u0442, \u0447\u0442\u043e\u0431\u044b \u043f\u043e\u043f\u0430\u0441\u0442\u044c \u0432 \u0442\u0430\u0431\u043b\u0438\u0446\u0443 \u0440\u0435\u0439\u0442\u0438\u043d\u0433\u0430',
        mutationLevel: (currentLevel, nextLevel) => `\u0423\u0440\u043e\u0432\u0435\u043d\u044c: ${currentLevel} \u2192 ${nextLevel}`,
        lockedRewardTitle: '\u0411\u043e\u043d\u0443\u0441\u043d\u044b\u0439 \u0432\u044b\u0431\u043e\u0440',
        lockedRewardText: '\u041e\u0442\u043a\u0440\u043e\u0439 \u0442\u0440\u0435\u0442\u0438\u0439 \u0432\u0430\u0440\u0438\u0430\u043d\u0442 \u043c\u0443\u0442\u0430\u0446\u0438\u0438 \u0437\u0430 \u043f\u0440\u043e\u0441\u043c\u043e\u0442\u0440 \u0440\u0435\u043a\u043b\u0430\u043c\u044b',
        lockedRewardReserved: '',
        lockedRewardAction: '',
        mutationStackText: {
          spike: (nextLevel) => `\u0421\u043b\u0435\u0434\u0443\u044e\u0449\u0438\u0439 \u0443\u0440\u043e\u0432\u0435\u043d\u044c: \u0441\u0443\u043c\u043c\u0430\u0440\u043d\u044b\u0439 \u043c\u043d\u043e\u0436\u0438\u0442\u0435\u043b\u044c \u043e\u0445\u043e\u0442\u044b \u0432\u044b\u0440\u0430\u0441\u0442\u0435\u0442 \u0434\u043e x${(1 + nextLevel * 0.07).toFixed(2)}.`,
          tail: (nextLevel) => `\u0421\u043b\u0435\u0434\u0443\u044e\u0449\u0438\u0439 \u0443\u0440\u043e\u0432\u0435\u043d\u044c: +${(nextLevel * 0.4).toFixed(1)} \u043a \u0431\u0430\u0437\u043e\u0432\u043e\u0439 \u0441\u043a\u043e\u0440\u043e\u0441\u0442\u0438.`,
          shell: (nextLevel) => `\u0421\u043b\u0435\u0434\u0443\u044e\u0449\u0438\u0439 \u0443\u0440\u043e\u0432\u0435\u043d\u044c: \u0437\u0430\u0449\u0438\u0442\u0430 \u043e\u0442 \u043f\u043e\u0442\u0435\u0440\u0438 \u043c\u0430\u0441\u0441\u044b ${Math.min(50, nextLevel * 9)}%.`,
          maw: (nextLevel) => `\u0421\u043b\u0435\u0434\u0443\u044e\u0449\u0438\u0439 \u0443\u0440\u043e\u0432\u0435\u043d\u044c: \u0435\u0434\u0430 \u0434\u0430\u0451\u0442 \u043f\u0440\u0438\u043c\u0435\u0440\u043d\u043e +${Math.round(Math.min(0.85, nextLevel * 0.11) * 100)}% \u0440\u043e\u0441\u0442\u0430.`,
          dash: () => '\u0421\u043b\u0435\u0434\u0443\u044e\u0449\u0438\u0439 \u0443\u0440\u043e\u0432\u0435\u043d\u044c: \u0440\u044b\u0432\u043e\u043a \u0447\u0443\u0442\u044c \u0434\u043b\u0438\u043d\u043d\u0435\u0435, \u0441\u0438\u043b\u044c\u043d\u0435\u0435 \u0438 \u0441 \u043c\u0435\u043d\u044c\u0448\u0438\u043c \u043a\u0443\u043b\u0434\u0430\u0443\u043d\u043e\u043c.',
          tentacle: () => '\u0421\u043b\u0435\u0434\u0443\u044e\u0449\u0438\u0439 \u0443\u0440\u043e\u0432\u0435\u043d\u044c: \u0432\u044b\u0448\u0435 \u0440\u0430\u0434\u0438\u0443\u0441, \u0441\u0438\u043b\u0430 \u043f\u0440\u0438\u0442\u044f\u0436\u0435\u043d\u0438\u044f \u0438 \u0447\u0438\u0441\u043b\u043e \u0446\u0435\u043b\u0435\u0439.',
          shatter: (nextLevel) => `\u0421\u043b\u0435\u0434\u0443\u044e\u0449\u0438\u0439 \u0443\u0440\u043e\u0432\u0435\u043d\u044c: \u043f\u043e\u0441\u043b\u0435 \u0432\u0440\u0430\u0433\u0430 \u0432\u044b\u043f\u0430\u0434\u0430\u0435\u0442 ${2 + nextLevel * 2} \u0447\u0430\u0441\u0442\u0438\u0446 \u0435\u0434\u044b.`,
          agility: () => '\u0421\u043b\u0435\u0434\u0443\u044e\u0449\u0438\u0439 \u0443\u0440\u043e\u0432\u0435\u043d\u044c: \u043f\u043e\u0432\u043e\u0440\u043e\u0442 \u043a \u043a\u0443\u0440\u0441\u043e\u0440\u0443 \u0441\u0442\u0430\u043d\u0435\u0442 \u0435\u0449\u0451 \u0431\u044b\u0441\u0442\u0440\u0435\u0435.',
        },
        mutations: {
          spike: { title: '\u0428\u0438\u043f', desc: '\u041b\u0435\u0433\u0447\u0435 \u043e\u0445\u043e\u0442\u0438\u0442\u044c\u0441\u044f \u043d\u0430 \u0432\u0440\u0430\u0433\u043e\u0432 \u043f\u043e\u043a\u0440\u0443\u043f\u043d\u0435\u0435.', hint: '+\u043e\u0445\u043e\u0442\u0430' },
          tail: { title: '\u0425\u0432\u043e\u0441\u0442', desc: '\u041a\u043b\u0435\u0442\u043a\u0430 \u043f\u043b\u0430\u0432\u0430\u0435\u0442 \u0431\u044b\u0441\u0442\u0440\u0435\u0435.', hint: '+\u0441\u043a\u043e\u0440\u043e\u0441\u0442\u044c' },
          shell: { title: '\u041f\u0430\u043d\u0446\u0438\u0440\u044c', desc: '\u0421\u043d\u0438\u0436\u0430\u0435\u0442 \u043f\u043e\u0442\u0435\u0440\u044e \u043c\u0430\u0441\u0441\u044b \u043f\u0440\u0438 \u0443\u0440\u043e\u043d\u0435.', hint: '+\u0437\u0430\u0449\u0438\u0442\u0430' },
          maw: { title: '\u0411\u043e\u043b\u044c\u0448\u043e\u0439 \u0440\u043e\u0442', desc: '\u0415\u0434\u0430 \u0434\u0430\u0451\u0442 \u0431\u043e\u043b\u044c\u0448\u0435 \u0440\u043e\u0441\u0442\u0430.', hint: '+\u0440\u043e\u0441\u0442' },
          dash: { title: '\u0420\u044b\u0432\u043e\u043a', desc: '\u041b\u041a\u041c \u0434\u0430\u0451\u0442 \u043a\u043e\u0440\u043e\u0442\u043a\u043e\u0435 \u0443\u0441\u043a\u043e\u0440\u0435\u043d\u0438\u0435 \u0432\u043f\u0435\u0440\u0451\u0434 \u0441 \u043a\u0443\u043b\u0434\u0430\u0443\u043d\u043e\u043c.', hint: '+\u043c\u043e\u0431\u0438\u043b\u044c\u043d\u043e\u0441\u0442\u044c' },
          tentacle: { title: '\u0429\u0443\u043f\u0430\u043b\u044c\u0446\u0435', desc: '\u0429\u0443\u043f\u0430\u043b\u044c\u0446\u0430 \u0442\u044f\u043d\u0443\u0442 \u0434\u043e\u0431\u044b\u0447\u0443 \u043a \u0441\u0435\u0431\u0435.', hint: '+\u043a\u043e\u043d\u0442\u0440\u043e\u043b\u044c' },
          shatter: { title: '\u0414\u0440\u043e\u0431\u043b\u0435\u043d\u0438\u0435 \u043f\u0438\u0449\u0438', desc: '\u041f\u043e\u0441\u043b\u0435 \u043f\u043e\u0435\u0434\u0430\u043d\u0438\u044f \u0432\u0440\u0430\u0433\u0430 \u0440\u044f\u0434\u043e\u043c \u0432\u044b\u0441\u044b\u043f\u0430\u0435\u0442\u0441\u044f \u043c\u0435\u043b\u043a\u0430\u044f \u0435\u0434\u0430.', hint: '+\u0440\u0435\u0441\u0443\u0440\u0441\u044b' },
          agility: { title: '\u041c\u0430\u043d\u0451\u0432\u0440', desc: '\u041a\u043b\u0435\u0442\u043a\u0430 \u0431\u044b\u0441\u0442\u0440\u0435\u0435 \u0440\u0430\u0437\u0432\u043e\u0440\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044f \u043a \u043a\u0443\u0440\u0441\u043e\u0440\u0443.', hint: '+\u043f\u043e\u0432\u043e\u0440\u043e\u0442' },
        },
      },
      en: {
        documentTitle: 'Gluttony \u2014 Yandex Games',
        startBadge: 'Milevora team',
        startTitle: 'Gluttony',
        hudTitle: 'Gluttony',
        startSubtitle: 'Consume food, grow, unlock mutations, and enter the endless survival phase',
        play: 'Endless mode',
        campaign: 'Campaign',
        ourGames: 'Our games',
        shop: 'Shop',
        restart: 'Main menu',
        pauseTitle: 'Paused',
        pauseHint: 'Press ESC to resume',
        pauseResume: 'Resume',
        pauseExit: 'EXIT',
        exitRoundTitle: 'LEAVE ROUND?',
        exitRoundText: 'Current round progress will be lost.',
        exitRoundConfirm: 'LEAVE',
        exitRoundCancel: 'STAY',
        evolutionTitle: 'Evolution',
        evolutionChoose: 'Choose one mutation',
        rewardButtonDefault: 'Watch an ad for a bonus: +1 extra mutation option',
        rewardButtonUsed: 'Bonus ad already used for this choice',
        rewardButtonNoAd: 'Bonus choice',
        sdkLocal: 'SDK: local mode',
        sdkReady: 'SDK: Yandex Games',
        sdkError: 'SDK: initialization error',
        endlessWave: (wave) => `Endless \u00b7 wave ${wave}`,
        endlessMax: 'maximum',
        congratsTitle: 'Round complete',
        congratsText: (score) => `You scored ${score} points this run`,
        enemiesEaten: 'Enemies eaten',
        leaderboardLoginHint: 'Sign in to enter the leaderboard',
        mutationLevel: (currentLevel, nextLevel) => `Level: ${currentLevel} \u2192 ${nextLevel}`,
        lockedRewardTitle: 'Bonus choice',
        lockedRewardText: 'Unlock the third mutation option by watching an ad',
        lockedRewardReserved: 'The right slot is reserved for an extra perk',
        lockedRewardAction: '',
        mutationStackText: {
          spike: (nextLevel) => `Next level: total hunt multiplier increases to x${(1 + nextLevel * 0.07).toFixed(2)}.`,
          tail: (nextLevel) => `Next level: +${(nextLevel * 0.4).toFixed(1)} base speed.`,
          shell: (nextLevel) => `Next level: ${Math.min(50, nextLevel * 9)}% mass loss reduction.`,
          maw: (nextLevel) => `Next level: food gives about +${Math.round(Math.min(0.85, nextLevel * 0.11) * 100)}% growth.`,
          dash: () => 'Next level: the dash becomes a bit longer, stronger, and has a shorter cooldown.',
          tentacle: () => 'Next level: higher range, pull strength, and number of targets.',
          shatter: (nextLevel) => `Next level: defeated enemies drop ${2 + nextLevel * 2} food particles.`,
          agility: () => 'Next level: turning toward the cursor becomes even faster.',
        },
        mutations: {
          spike: { title: 'Spike', desc: 'Makes hunting larger enemies easier.', hint: '+hunting' },
          tail: { title: 'Tail', desc: 'The cell swims faster.', hint: '+speed' },
          shell: { title: 'Shell', desc: 'Reduces mass loss when taking damage.', hint: '+defense' },
          maw: { title: 'Big Maw', desc: 'Food gives more growth.', hint: '+growth' },
          dash: { title: 'Dash', desc: 'Left click gives a short forward burst with a cooldown.', hint: '+mobility' },
          tentacle: { title: 'Tentacle', desc: 'Tentacles pull prey in.', hint: '+control' },
          shatter: { title: 'Food Shatter', desc: 'After eating an enemy, small food drops nearby.', hint: '+resources' },
          agility: { title: 'Maneuver', desc: 'The cell turns toward the cursor faster.', hint: '+turning' },
        },
      },
    };

    function normalizeLanguage(lang) {
      const value = String(lang || 'ru').toLowerCase();
      if (SUPPORTED_LANGS.has(value)) return value;
      if (value.startsWith('ru')) return 'ru';
      if (value.startsWith('en')) return 'en';
      return 'ru';
    }

    function getLocale() {
      return currentLang === 'en' ? 'en-US' : 'ru-RU';
    }

    function t(key, ...args) {
      const entry = i18n[currentLang]?.[key];
      if (typeof entry === 'function') return entry(...args);
      return entry ?? '';
    }

    function getMutationTranslations(id) {
      return i18n[currentLang]?.mutations?.[id] ?? i18n.ru.mutations[id] ?? {};
    }

    function createMutationCatalog() {
      return {
        spike: { id: 'spike', accent: '#f4ffff', ...getMutationTranslations('spike') },
        tail: { id: 'tail', accent: '#8dffe8', ...getMutationTranslations('tail') },
        shell: { id: 'shell', accent: '#8ef5ff', ...getMutationTranslations('shell') },
        maw: { id: 'maw', accent: '#ffd2ba', ...getMutationTranslations('maw') },
        dash: { id: 'dash', accent: '#b4fff1', ...getMutationTranslations('dash') },
        tentacle: { id: 'tentacle', accent: '#7fffe6', ...getMutationTranslations('tentacle') },
        shatter: { id: 'shatter', accent: '#d8fff5', ...getMutationTranslations('shatter') },
        agility: { id: 'agility', accent: '#c6fff6', ...getMutationTranslations('agility') },
      };
    }

    let mutationCatalog = createMutationCatalog();

    function applyLocalization() {
      document.documentElement.lang = currentLang;
      document.title = t('documentTitle');
      if (DOM.startBadge) DOM.startBadge.textContent = t('startBadge');
      if (DOM.startTitle) DOM.startTitle.textContent = t('startTitle');
      if (DOM.hudTitle) DOM.hudTitle.textContent = t('hudTitle');
      if (DOM.startSubtitle) DOM.startSubtitle.textContent = t('startSubtitle');
      if (DOM.startPlayBtn) DOM.startPlayBtn.textContent = t('play');
      if (DOM.startCampaignBtn) DOM.startCampaignBtn.textContent = t('campaign');
      if (DOM.startShopBtn) DOM.startShopBtn.textContent = t('shop');
      if (DOM.startOurGamesBtn) DOM.startOurGamesBtn.textContent = t('ourGames');
      if (DOM.evolutionTitle) DOM.evolutionTitle.textContent = t('evolutionTitle');
      if (DOM.evolutionText) DOM.evolutionText.textContent = t('evolutionChoose');
      if (DOM.restartBtn) DOM.restartBtn.textContent = t('restart');
      if (DOM.messageOurGamesBtn) DOM.messageOurGamesBtn.textContent = t('ourGames');
      if (DOM.pauseTitle) DOM.pauseTitle.textContent = t('pauseTitle');
      if (DOM.pauseHint) DOM.pauseHint.textContent = t('pauseHint');
      if (DOM.pauseResumeBtn) DOM.pauseResumeBtn.textContent = t('pauseResume');
      if (DOM.pauseExitBtn) DOM.pauseExitBtn.textContent = t('pauseExit');
      if (DOM.exitConfirmTitle) DOM.exitConfirmTitle.textContent = t('exitRoundTitle');
      if (DOM.exitConfirmText) DOM.exitConfirmText.textContent = t('exitRoundText');
      if (DOM.exitStayBtn) DOM.exitStayBtn.textContent = t('exitRoundCancel');
      if (DOM.exitConfirmBtn) DOM.exitConfirmBtn.textContent = t('exitRoundConfirm');

      mutationCatalog = createMutationCatalog();
      updateRewardButtonState();

      if (evolutionPending) {
        renderEvolutionChoices();
      }

      window.JorMetaUI?.render?.();
      window.JorCampaignUI?.render?.();
      if (gameOver && DOM.messageTitle?.dataset?.messageKey === 'congrats') {
        DOM.messageTitle.textContent = t('congratsTitle');

        if (DOM.messageText?.dataset?.messageMode === 'leaderboard') {
          DOM.messageText.innerHTML = buildLeaderboardHtml(
            App.lastLeaderboardScore || Math.max(0, Math.round(score || 0)),
            App.lastLeaderboardEntries,
            App.lastLeaderboardAuthorized
          );
        } else {
          DOM.messageText.textContent = t('congratsText', formatCompactScore(score));
        }
      }
    }

    function setLanguage(lang) {
      const next = normalizeLanguage(lang);
      if (next === currentLang) {
        document.documentElement.lang = currentLang;
        return;
      }
      currentLang = next;
      applyLocalization();
    }

    function detectPreferredLanguage() {
      try {
        const url = new URL(window.location.href);
        const fromQuery = url.searchParams.get('lang');
        if (fromQuery) {
          const normalized = normalizeLanguage(fromQuery);
          if (SUPPORTED_LANGS.has(normalized)) return normalized;
        }
        if (url.hash && url.hash.length > 1) {
          const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
          const fromHash = hashParams.get('lang');
          if (fromHash) {
            const normalized = normalizeLanguage(fromHash);
            if (SUPPORTED_LANGS.has(normalized)) return normalized;
          }
        }
      } catch (e) {}
      // 2) navigator.language / navigator.languages.
      try {
        const langs = [];
        if (navigator.language) langs.push(navigator.language);
        if (Array.isArray(navigator.languages)) langs.push(...navigator.languages);
        for (const raw of langs) {
          const normalized = normalizeLanguage(raw);
          if (SUPPORTED_LANGS.has(normalized)) return normalized;
        }
      } catch (e) {}
      return 'ru';
    }

