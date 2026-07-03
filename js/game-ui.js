const App = {
      ysdk: null,
      sdkReady: false,
      platformPaused: false,
      localPause: false,
      gameplayMarked: false,
      usingBannerApi: true,
      bannerVisible: false,
      bannerRequestPending: false,
      keepStickyBannerAlways: true,
      rewardedUsedThisEvolution: false,
      evolutionChoiceLockedUntil: 0,
      evolutionChoiceUnlockTimer: null,
      hasStarted: false,
      startScreenVisible: false,
      // Р¤Р»Р°РіРё РґР»СЏ РєРѕСЂСЂРµРєС‚РЅРѕРіРѕ СЃСЂР°Р±Р°С‚С‹РІР°РЅРёСЏ LoadingAPI.ready() вЂ” СЃРј. Рї. 1.19.
      // gameReadyMoment вЂ” РёРіСЂР° РѕС‚СЂРёСЃРѕРІР°Р»Р° СЃС‚Р°СЂС‚РѕРІС‹Р№ СЌРєСЂР°РЅ (РёРіСЂР°Р±РµР»СЊРЅР°).
      // loadingReadySent вЂ” СЃРёРіРЅР°Р» СѓР¶Рµ РѕС‚РїСЂР°РІР»РµРЅ, РґРІР°Р¶РґС‹ РµРіРѕ СЃР»Р°С‚СЊ РЅРµР»СЊР·СЏ.
      gameReadyMoment: false,
      loadingReadySent: false,
      // РџР°СѓР·Р°, Р·Р°РїСЂРѕС€РµРЅРЅР°СЏ РёРіСЂРѕРєРѕРј РІСЂСѓС‡РЅСѓСЋ (ESC). РћС‚РґРµР»СЊРЅР°СЏ РѕС‚ localPause,
      // С‡С‚РѕР±С‹ РЅРµ РєРѕРЅС„Р»РёРєС‚РѕРІР°С‚СЊ СЃ Р°РІС‚РѕРїР°СѓР·Р°РјРё СЃС‚Р°СЂС‚РѕРІРѕРіРѕ СЌРєСЂР°РЅР° / СЌРІРѕР»СЋС†РёРё /
      // РѕРєРЅР° СЃРјРµСЂС‚Рё. РџСЂРѕРІРµСЂСЏРµС‚СЃСЏ РІ updateGame() РєР°Рє РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅС‹Р№ РіРµР№С‚.
      userPaused: false,
      player: null,
      leaderboardName: 'topScore',
      ourGamesUrl: null,
      ourGamesLoading: false,
      fullscreenAdPending: false,
      metaXpAwardedSession: null,
    };

    // ------------------------------
    // Yandex SDK
    // ------------------------------
    async function initYandexSdk() {
      if (typeof YaGames === 'undefined') {
        DOM.sdkStatus.textContent = t('sdkLocal');
        updateOurGamesButtonState();
        return;
      }

      try {
        App.ysdk = await YaGames.init();
        App.sdkReady = true;
        // РўСЂРµР±РѕРІР°РЅРёРµ РЇРЅРґРµРєСЃ.РРіСЂ Рї. 2.14: СЏР·С‹Рє РёРЅС‚РµСЂС„РµР№СЃР° РѕРїСЂРµРґРµР»СЏРµС‚СЃСЏ
        // С‡РµСЂРµР· ysdk.environment.i18n.lang. Р”РµР»Р°РµРј СЌС‚Рѕ СЃСЂР°Р·Сѓ РїРѕСЃР»Рµ init
        // Рё РїРµСЂРµРґ РІСЃРµРјРё РѕСЃС‚Р°Р»СЊРЅС‹РјРё UI-РѕРїРµСЂР°С†РёСЏРјРё.
        const sdkLang = App.ysdk?.environment?.i18n?.lang;
        if (sdkLang) {
          setLanguage(sdkLang);
        }
        DOM.sdkStatus.textContent = t('sdkReady');

        App.ysdk.on('game_api_pause', () => {
          handlePlatformPause();
        });

        App.ysdk.on('game_api_resume', () => {
          handlePlatformResume();
        });

        await initYandexPlayer();
        await window.JorShopUI?.refreshPayments?.();
        // Р•СЃР»Рё СЃС‚Р°СЂС‚РѕРІС‹Р№ СЌРєСЂР°РЅ СѓР¶Рµ РѕС‚СЂРёСЃРѕРІР°РЅ Рє РјРѕРјРµРЅС‚Сѓ РіРѕС‚РѕРІРЅРѕСЃС‚Рё SDK вЂ”
        // РґР°С‚СЊ СЃРёРіРЅР°Р» ready() РїСЂСЏРјРѕ СЃРµР№С‡Р°СЃ. РРЅР°С‡Рµ РѕРЅ СЃС‚СЂРµР»СЊРЅС‘С‚ РёР·
        // showStartScreen() РєР°Рє С‚РѕР»СЊРєРѕ С‚РѕС‚ РїРѕРєР°Р¶РµС‚СЃСЏ.
        notifyGameReady();
        showEvolutionBanner();
        if (App.hasStarted && !App.startScreenVisible) {
          markGameplayStart();
        }
        refreshOurGamesUrl();
      } catch (error) {
        console.error('Yandex SDK init error:', error);
        DOM.sdkStatus.textContent = t('sdkError');
        updateOurGamesButtonState();
      }
    }

    async function initYandexPlayer() {
      if (!App.sdkReady || !App.ysdk?.getPlayer) return null;

      try {
        App.player = await App.ysdk.getPlayer();
        window.JorMetaUI?.refreshPlayer?.();
        return App.player;
      } catch (error) {
        console.error('Yandex player init error:', error);
        App.player = null;
        return null;
      }
    }

    function isAuthorizedYandexPlayer() {
      return !!(App.player && typeof App.player.isAuthorized === 'function' && App.player.isAuthorized());
    }

    async function submitScoreToLeaderboard(finalScore) {
      if (!App.sdkReady || !App.ysdk?.leaderboards) return false;
      if (!isAuthorizedYandexPlayer()) return false;

      try {
        await App.ysdk.leaderboards.setScore(App.leaderboardName, finalScore);
        return true;
      } catch (error) {
        console.error('Leaderboard setScore error:', error);
        return false;
      }
    }

    async function loadLeaderboardEntries(includeUser = true) {
      if (!App.sdkReady || !App.ysdk?.leaderboards) return null;

      try {
        const options = {
          quantityTop: 5,
        };
        if (includeUser) {
          options.includeUser = true;
          options.quantityAround = 2;
        }
        return await App.ysdk.leaderboards.getEntries(App.leaderboardName, options);
      } catch (error) {
        console.error('Leaderboard getEntries error:', error);
        return null;
      }
    }

    function markGameplayStart() {
      if (!App.sdkReady) return;
      if (App.localPause || App.platformPaused) return;
      if (App.gameplayMarked) return;

      App.ysdk.features?.GameplayAPI?.start();
      App.gameplayMarked = true;
      showEvolutionBanner();
    }

    function markGameplayStop(showStickyBanner = true) {
      if (!App.sdkReady) return;
      if (!App.gameplayMarked) return;

      App.ysdk.features?.GameplayAPI?.stop();
      App.gameplayMarked = false;
    }

    function shouldShowStickyBanner() {
      return App.keepStickyBannerAlways;
    }

    async function showEvolutionBanner() {
      if (!App.sdkReady || !App.ysdk?.adv?.showBannerAdv || !App.usingBannerApi) return;
      if (!shouldShowStickyBanner()) return;
      if (App.bannerVisible) return;
      if (App.bannerRequestPending) return;

      App.bannerRequestPending = true;
      try {
        if (App.ysdk.adv.getBannerAdvStatus) {
          const status = await App.ysdk.adv.getBannerAdvStatus();
          if (status?.stickyAdvIsShowing) {
            App.bannerVisible = true;
            return;
          }
          if (status?.reason) {
            console.warn('Sticky banner is not showing:', status.reason);
          }
        }

        const result = await App.ysdk.adv.showBannerAdv();
        App.bannerVisible = Boolean(result?.stickyAdvIsShowing ?? true);
        if (!App.bannerVisible && result?.reason) {
          console.warn('showBannerAdv did not show sticky banner:', result.reason);
        }
      } catch (error) {
        console.warn('showBannerAdv error:', error);
      } finally {
        App.bannerRequestPending = false;
      }
    }

    async function hideEvolutionBanner(force = false) {
      if (!force) return;
      if (App.keepStickyBannerAlways) return;
      if (!App.sdkReady || !App.ysdk?.adv?.hideBannerAdv || !App.usingBannerApi) return;

      try {
        const result = await App.ysdk.adv.hideBannerAdv();
        App.bannerVisible = false;
      } catch (error) {
        console.warn('hideBannerAdv error:', error);
      }
    }

    async function showFullscreenAdBeforeMenu(onDone) {
      if (App.fullscreenAdPending) return;
      App.fullscreenAdPending = true;
      let finished = false;
      const complete = () => {
        if (finished) return;
        finished = true;
        App.fullscreenAdPending = false;
        try { onDone?.(); } catch (error) {}
      };

      if (!App.sdkReady || !App.ysdk?.adv?.showFullscreenAdv) {
        complete();
        return;
      }

      markGameplayStop(false);
      pauseAmbientMusic();

      try {
        App.ysdk.adv.showFullscreenAdv({
          callbacks: {
            onOpen: () => {
              App.platformPaused = true;
              pauseAmbientMusic();
            },
            onClose: () => {
              App.platformPaused = false;
              complete();
            },
            onError: (error) => {
              console.warn('showFullscreenAdv error:', error);
              App.platformPaused = false;
              complete();
            }
          }
        });
      } catch (error) {
        console.warn('showFullscreenAdv call error:', error);
        App.platformPaused = false;
        complete();
      }
    }

    async function showRewardedRerollAd() {
      if (App.rewardedUsedThisEvolution) return;

      if (window.JorShopUI?.hasNoRewardAds?.()) {
        const extraMutation = getRewardMutationChoice(currentChoices);
        if (extraMutation) {
          currentChoices = [...currentChoices, { ...extraMutation, bonus: true }];
        }

        App.rewardedUsedThisEvolution = true;
        renderEvolutionChoices();
        updateRewardButtonState();
        return;
      }

      if (!App.sdkReady || !App.ysdk?.adv?.showRewardedVideo) {
        const extraMutation = getRewardMutationChoice(currentChoices);
        if (extraMutation) {
          currentChoices = [...currentChoices, { ...extraMutation, bonus: true }];
        }

        App.rewardedUsedThisEvolution = true;
        renderEvolutionChoices();
        updateRewardButtonState();
        return;
      }

      if (DOM.rewardAdBtn) {
        DOM.rewardAdBtn.disabled = true;
      }
      markGameplayStop(false);

      App.ysdk.adv.showRewardedVideo({
        callbacks: {
          onOpen: () => {
            handlePlatformPause();
          },
          onRewarded: () => {
            const extraMutation = getRewardMutationChoice(currentChoices);
            if (extraMutation) {
              currentChoices = [...currentChoices, { ...extraMutation, bonus: true }];
            }

            App.rewardedUsedThisEvolution = true;
            renderEvolutionChoices();
            updateRewardButtonState();
          },
          onClose: () => {
            handlePlatformResume();

            if (!App.rewardedUsedThisEvolution) {
              updateRewardButtonState();
            }
          },
          onError: (error) => {
            console.error('Rewarded video error:', error);
            handlePlatformResume();
            updateRewardButtonState();
          }
        }
      });
    }

    function updateRewardButtonState() {
      if (!DOM.rewardAdBtn) return;
      DOM.rewardAdBtn.disabled = App.rewardedUsedThisEvolution;
      DOM.rewardAdBtn.textContent = App.rewardedUsedThisEvolution
        ? t('rewardButtonUsed')
        : (window.JorShopUI?.hasNoRewardAds?.() ? t('rewardButtonNoAd') : t('rewardButtonDefault'));
    }

    function areEvolutionChoicesLocked() {
      return Date.now() < (App.evolutionChoiceLockedUntil || 0);
    }

    function updateEvolutionChoiceLockState() {
      if (!DOM.evolutionCards) return;
      const locked = areEvolutionChoicesLocked();
      for (const button of DOM.evolutionCards.querySelectorAll('button.card')) {
        button.disabled = locked;
      }
    }

    function lockEvolutionChoices(durationMs = 500) {
      App.evolutionChoiceLockedUntil = Date.now() + durationMs;
      if (App.evolutionChoiceUnlockTimer) {
        clearTimeout(App.evolutionChoiceUnlockTimer);
      }
      App.evolutionChoiceUnlockTimer = setTimeout(() => {
        App.evolutionChoiceUnlockTimer = null;
        updateEvolutionChoiceLockState();
      }, durationMs);
    }

    // ------------------------------
    // РРіСЂРѕРІС‹Рµ СЃСѓС‰РЅРѕСЃС‚Рё
    // ------------------------------

function showStartScreen() {
      App.startScreenVisible = true;
      App.localPause = true;
      markGameplayStop();
      DOM.startScreen.style.display = 'flex';
      if (DOM.metaTopBar) DOM.metaTopBar.style.display = 'flex';
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => window.JorMetaUI?.playPendingTrophyAwards?.());
      } else {
        window.JorMetaUI?.playPendingTrophyAwards?.();
      }
      // РџРѕРјРµС‡Р°РµРј РјРѕРјРµРЅС‚, РєРѕРіРґР° РёРіСЂР° СЃС‚Р°Р»Р° СЂРµР°Р»СЊРЅРѕ РёРіСЂР°Р±РµР»СЊРЅРѕР№ РґР»СЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
      // (СЃС‚Р°СЂС‚РѕРІС‹Р№ СЌРєСЂР°РЅ СЃ РєРЅРѕРїРєРѕР№ В«РРіСЂР°С‚СЊВ» РІ DOM). РЎР°Рј СЃРёРіРЅР°Р» РІ РЇРЅРґРµРєСЃ С€Р»С‘Рј
      // РїРѕСЃР»Рµ СЃР»РµРґСѓСЋС‰РµРіРѕ animation frame вЂ” С‡С‚РѕР±С‹ РѕРЅ СЃРѕРІРїР°Р» СЃ СЂРµР°Р»СЊРЅРѕР№ РѕС‚СЂРёСЃРѕРІРєРѕР№,
      // Р° РЅРµ СЃ РјРѕРјРµРЅС‚РѕРј СЃРјРµРЅС‹ display. РЎРј. notifyGameReady Рё Рї. 1.19.
      App.gameReadyMoment = true;
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => notifyGameReady());
      } else {
        notifyGameReady();
      }
    }

    // РўСЂРµР±РѕРІР°РЅРёРµ РЇРЅРґРµРєСЃ.РРіСЂ Рї. 1.19: LoadingAPI.ready() РґРѕР»Р¶РµРЅ РІС‹Р·С‹РІР°С‚СЊСЃСЏ
    // СЂРѕРІРЅРѕ РІ С‚РѕС‚ РјРѕРјРµРЅС‚, РєРѕРіРґР° РёРіСЂР° СЃС‚Р°РЅРѕРІРёС‚СЃСЏ РґРѕСЃС‚СѓРїРЅРѕР№ РґР»СЏ РёРіСЂР°РЅРёСЏ вЂ”
    // РЅРµ СЂР°РЅСЊС€Рµ (РёРіСЂР° РµС‰С‘ РіСЂСѓР·РёС‚СЃСЏ) Рё РЅРµ РїРѕР·Р¶Рµ (РЅР°СЂСѓС€РµРЅРёРµ GRA).
    // Р¤СѓРЅРєС†РёСЏ РёРґРµРјРїРѕС‚РµРЅС‚РЅР° Рё Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё РґРѕР¶РёРґР°РµС‚СЃСЏ РіРѕС‚РѕРІРЅРѕСЃС‚Рё SDK.
    function notifyGameReady() {
      if (App.loadingReadySent) return;
      if (!App.gameReadyMoment) return;     // СЃС‚Р°СЂС‚РѕРІС‹Р№ СЌРєСЂР°РЅ РµС‰С‘ РЅРµ РїРѕРєР°Р·Р°РЅ
      if (!App.sdkReady || !App.ysdk) return; // SDK РµС‰С‘ РЅРµ РёРЅРёС†РёР°Р»РёР·РёСЂРѕРІР°Р»СЃСЏ вЂ” РїРѕРІС‚РѕСЂРёРј РїРѕР·Р¶Рµ
      try {
        const api = App.ysdk.features?.LoadingAPI;
        if (api && typeof api.ready === 'function') {
          api.ready();
          App.loadingReadySent = true;
        }
      } catch (error) {
        console.error('LoadingAPI.ready error:', error);
      }
    }

    // -----------------------------------------------------------------------
    // РџР°СѓР·Р° РїРѕ ESC.
    // Р“Р»Р°РІРЅРѕРµ РїСЂР°РІРёР»Рѕ: РЅРµ РєРѕРЅС„Р»РёРєС‚РѕРІР°С‚СЊ СЃ Р°РІС‚РѕРїР°СѓР·Р°РјРё. ESC РёРіРЅРѕСЂРёСЂСѓРµС‚СЃСЏ,
    // РµСЃР»Рё РёРіСЂР° Рё С‚Р°Рє РЅР° РїР°СѓР·Рµ РїРѕ РґСЂСѓРіРѕР№ РїСЂРёС‡РёРЅРµ (СЃС‚Р°СЂС‚РѕРІС‹Р№ СЌРєСЂР°РЅ,
    // СЌРІРѕР»СЋС†РёСЏ, РѕРєРЅРѕ СЃРјРµСЂС‚Рё/РїРѕР±РµРґС‹, СЂРµРєР»Р°РјР°/СЃРІС‘СЂРЅСѓС‚Р°СЏ РІРєР»Р°РґРєР°). Р­С‚Рѕ
    // РіР°СЂР°РЅС‚РёСЂСѓРµС‚, С‡С‚Рѕ СЃРЅСЏС‚РёРµ userPaused РЅРёРєРѕРіРґР° РЅРµ В«РѕР¶РёРІРёС‚В» РёРіСЂСѓ
    // РІ СЃРёС‚СѓР°С†РёРё, РєРѕРіРґР° РїРѕРєР°Р·С‹РІР°РµС‚СЃСЏ РјРѕРґР°Р»РєР°.
    // -----------------------------------------------------------------------
    function canTogglePause() {
      // РќР° СЃС‚Р°СЂС‚РѕРІРѕРј СЌРєСЂР°РЅРµ вЂ” РЅРµС‚ СЃРјС‹СЃР»Р°, С‚Р°Рј Рё С‚Р°Рє РїР°СѓР·Р°, Рё РµСЃС‚СЊ РєРЅРѕРїРєР° Play.
      if (App.startScreenVisible) return false;
      // РРіСЂР° РµС‰С‘ РЅРµ РЅР°С‡РёРЅР°Р»Р°СЃСЊ.
      if (!App.hasStarted) return false;
      // РљРѕРЅРµС† РёРіСЂС‹ РёР»Рё РїРѕР±РµРґР° вЂ” РїРµСЂРµРєР»СЋС‡РµРЅРёРµ РїР°СѓР·С‹ РЅРµ РЅСѓР¶РЅРѕ.
      if (gameOver || victory) return false;
      // Р­РІРѕР»СЋС†РёСЏ / С†РµРЅС‚СЂР°Р»СЊРЅРѕРµ СЃРѕРѕР±С‰РµРЅРёРµ вЂ” РµСЃС‚СЊ СЃРІРѕРё СЌР»РµРјРµРЅС‚С‹ СѓРїСЂР°РІР»РµРЅРёСЏ.
      if (evolutionPending) return false;
      // РџР»Р°С‚С„РѕСЂРјР° СЃР°РјР° РїРѕСЃС‚Р°РІРёР»Р° РЅР° РїР°СѓР·Сѓ (СЃРІС‘СЂРЅСѓС‚Р°СЏ РІРєР»Р°РґРєР°, СЂРµРєР»Р°РјР°).
      if (App.platformPaused) return false;
      return true;
    }

    function showPauseOverlay() {
      if (!DOM.pauseOverlay) return;
      DOM.pauseOverlay.classList.add('visible');
      DOM.pauseOverlay.setAttribute('aria-hidden', 'false');
    }

    function hidePauseOverlay() {
      if (!DOM.pauseOverlay) return;
      hideExitConfirm();
      DOM.pauseOverlay.classList.remove('visible');
      DOM.pauseOverlay.setAttribute('aria-hidden', 'true');
    }

    function showExitConfirm() {
      if (!DOM.exitConfirmCard) return;
      DOM.exitConfirmCard.classList.add('visible');
      DOM.exitConfirmCard.setAttribute('aria-hidden', 'false');
    }

    function hideExitConfirm() {
      if (!DOM.exitConfirmCard) return;
      DOM.exitConfirmCard.classList.remove('visible');
      DOM.exitConfirmCard.setAttribute('aria-hidden', 'true');
    }

    function confirmExitToMainMenu() {
      hideExitConfirm();
      returnToMainMenuFromRoundEnd();
    }

    function setUserPaused(value) {
      const next = Boolean(value);
      if (App.userPaused === next) return;
      App.userPaused = next;
      if (next) {
        showPauseOverlay();
        try { pauseAmbientMusic(); } catch (e) {}
        // РЎРѕРѕР±С‰Р°РµРј РЇРЅРґРµРєСЃСѓ: РіРµР№Рј-РїР»РµР№ РѕСЃС‚Р°РЅРѕРІР»РµРЅ (РІР°Р¶РЅРѕ РґР»СЏ РјРµС‚СЂРёРє SDK).
        try { markGameplayStop(); } catch (e) {}
      } else {
        hidePauseOverlay();
        // Р’РѕР·РѕР±РЅРѕРІР»СЏРµРј РјСѓР·С‹РєСѓ С‚РѕР»СЊРєРѕ РµСЃР»Рё РІ РєРѕРјРЅР°С‚Рµ РЅРµС‚ РґСЂСѓРіРёС… СЃС‚РѕРї-РїСЂРёС‡РёРЅ.
        try { ensureAmbientMusic(); } catch (e) {}
        try { markGameplayStart(); } catch (e) {}
      }
    }

    function togglePause() {
      if (App.userPaused) {
        // РЎРЅСЏС‚СЊ РїР°СѓР·Сѓ вЂ” РІСЃРµРіРґР° СЂР°Р·СЂРµС€РµРЅРѕ, С‡С‚РѕР±С‹ РёРіСЂРѕРє РЅРёРєРѕРіРґР° РЅРµ В«Р·Р°СЃС‚СЂСЏР»В».
        setUserPaused(false);
        return;
      }
      if (!canTogglePause()) return;
      setUserPaused(true);
    }

    function hideStartScreen() {
      App.startScreenVisible = false;
      DOM.startScreen.style.display = 'none';
      if (DOM.metaTopBar) DOM.metaTopBar.style.display = 'none';
    }

    function updateOurGamesButtonState() {
      const available = Boolean(App.ourGamesUrl);
      const disabled = !available || App.ourGamesLoading;
      const ariaDisabled = available && !App.ourGamesLoading ? 'false' : 'true';
      for (const button of [DOM.startOurGamesBtn, DOM.messageOurGamesBtn]) {
        if (!button) continue;
        button.disabled = disabled;
        button.setAttribute('aria-disabled', ariaDisabled);
      }
    }

    async function refreshOurGamesUrl() {
      if (!App.sdkReady || !App.ysdk?.features?.GamesAPI?.getAllGames) {
        App.ourGamesUrl = null;
        updateOurGamesButtonState();
        return;
      }

      if (App.ourGamesLoading) return;
      App.ourGamesLoading = true;
      updateOurGamesButtonState();

      try {
        const { developerURL, games } = await App.ysdk.features.GamesAPI.getAllGames();
        App.ourGamesUrl = developerURL || games?.[0]?.url || null;
      } catch (error) {
        console.warn('GamesAPI.getAllGames error:', error);
        App.ourGamesUrl = null;
      } finally {
        App.ourGamesLoading = false;
        updateOurGamesButtonState();
      }
    }

    function openOurGames() {
      if (!App.ourGamesUrl) {
        refreshOurGamesUrl();
        return;
      }

      window.open(App.ourGamesUrl, '_blank', 'noopener,noreferrer');
    }

    function returnToMainMenu() {
      App.hasStarted = false;
      App.userPaused = false;
      App.localPause = true;
      hideCenterMessage();
      hidePauseOverlay();
      pauseAmbientMusic();
      showStartScreen();
    }

    function returnToMainMenuFromRoundEnd() {
      if (!gameOver) {
        returnToMainMenu();
        return;
      }

      showFullscreenAdBeforeMenu(returnToMainMenu);
    }

    function retryCurrentCampaignRound() {
      if (App.gameMode !== 'campaign' || !App.campaignLevel) return;
      App.pendingCampaignStart = true;
      App.hasStarted = true;
      App.localPause = false;
      hideCenterMessage();
      hideStartScreen();
      resetGame();
      ensureAmbientMusic();
      markGameplayStart();
    }

    function startGameFromMenu() {
      const campaignStart = App.pendingCampaignStart === true;
      App.pendingCampaignStart = false;
      if (!campaignStart) {
        App.gameMode = 'endless';
        App.campaignLevel = null;
        App.campaignChapter = null;
        App.campaignRun = null;
      }
      App.hasStarted = true;
      unlockAudio();
      App.localPause = false;
      hideStartScreen();
      try {
        resetGame();
      } catch (error) {
        console.error('resetGame error:', error);
        if (DOM?.sdkStatus) {
          DOM.sdkStatus.textContent = `Start error: ${error?.message || error}`;
          DOM.sdkStatus.style.display = 'block';
        }
        showStartScreen();
        return;
      }
      ensureAmbientMusic();
      markGameplayStart();
    }

    function hideCenterMessage() {
      hideElement(DOM.centerMessage);
      DOM.centerMessage?.classList.remove('leaderboardDialog', 'levelFailedDialog');
      if (DOM.messageRetryBtn) DOM.messageRetryBtn.hidden = true;
    }

    function showMessage(title, text) {
      App.localPause = true;
      markGameplayStop();
      DOM.messageTitle.textContent = title;
      DOM.messageText.textContent = text;
      DOM.messageText.className = '';
      DOM.messageText.dataset.messageMode = 'text';
      DOM.messageTitle.dataset.messageKey = title === t('congratsTitle') ? 'congrats' : '';
      DOM.centerMessage.classList.toggle('leaderboardDialog', title === t('congratsTitle'));
      DOM.centerMessage.classList.remove('levelFailedDialog');
      if (DOM.messageRetryBtn) DOM.messageRetryBtn.hidden = true;
      DOM.centerMessage.style.display = 'block';
    }

    function showHtmlMessage(title, html, messageKey = '') {
      App.localPause = true;
      markGameplayStop();
      DOM.messageTitle.textContent = title;
      DOM.messageText.innerHTML = html;
      DOM.messageText.className = messageKey === 'congrats' ? 'leaderboardMessage' : '';
      DOM.messageText.dataset.messageMode = messageKey === 'congrats' ? 'leaderboard' : 'html';
      DOM.messageTitle.dataset.messageKey = messageKey;
      DOM.centerMessage.classList.toggle('leaderboardDialog', messageKey === 'congrats');
      DOM.centerMessage.classList.remove('levelFailedDialog');
      if (DOM.messageRetryBtn) DOM.messageRetryBtn.hidden = true;
      DOM.centerMessage.style.display = 'block';
    }

    function escapeHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function formatCompactScore(value) {
      const scoreValue = Math.max(0, Math.round(value || 0));
      return scoreValue.toLocaleString(getLocale());
    }

    function getLeaderboardTopTitle() {
      return currentLang === 'en' ? 'Top players' : '\u0422\u043e\u043f \u0438\u0433\u0440\u043e\u043a\u043e\u0432';
    }

    function getLeaderboardTopBadge() {
      return currentLang === 'en' ? 'Ranking' : '\u0420\u0435\u0439\u0442\u0438\u043d\u0433';
    }

    function getLeaderboardUnavailableText() {
      return currentLang === 'en'
        ? 'Leaderboard data is temporarily unavailable'
        : '\u0414\u0430\u043d\u043d\u044b\u0435 \u0440\u0435\u0439\u0442\u0438\u043d\u0433\u0430 \u0432\u0440\u0435\u043c\u0435\u043d\u043d\u043e \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b';
    }

    function getLeaderboardPlayerFallbackName() {
      return currentLang === 'en' ? 'Player' : '\u0418\u0433\u0440\u043e\u043a';
    }

    function getLeaderboardScorePrefix() {
      return currentLang === 'en' ? 'Score' : '\u0421\u0447\u0451\u0442';
    }

    function normalizeGameOverLeaderboardEntries(entries, currentUserId) {
      const rows = Array.isArray(entries?.entries) ? entries.entries : [];
      return rows
        .map(entry => {
          const rank = Number(entry?.rank);
          if (!Number.isFinite(rank)) return null;
          const uniqueId = entry?.player?.uniqueID || '';
          return {
            rank,
            name: entry?.player?.publicName || getLeaderboardPlayerFallbackName(),
            score: Math.max(0, Math.round(entry?.score || 0)),
            isPlayer: !!uniqueId && !!currentUserId && uniqueId === currentUserId,
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.rank - b.rank);
    }

    function getGameOverLeaderboardRows(entries, currentUserId) {
      const sorted = normalizeGameOverLeaderboardEntries(entries, currentUserId);
      const top = sorted.filter(entry => entry.rank <= 5).slice(0, 5);
      const player = sorted.find(entry => entry.isPlayer);
      const rows = top.slice();

      if (player && !top.some(entry => entry.rank === player.rank)) {
        const around = sorted.filter(entry => (
          Math.abs(entry.rank - player.rank) <= 2 &&
          !rows.some(row => row.rank === entry.rank)
        ));
        if (around.length) {
          rows.push({ divider: true });
          around.forEach(entry => rows.push(entry));
        }
      }

      if (!rows.length && sorted.length) return sorted.slice(0, 7);
      return rows.slice(0, 9);
    }

    function getGameOverLeaderboardTitle() {
      return currentLang === 'en' ? 'LEADERBOARD' : '\u0420\u0415\u0419\u0422\u0418\u041d\u0413';
    }

    function getGameOverLoadingText() {
      return currentLang === 'en' ? 'Updating leaderboard...' : '\u041e\u0431\u043d\u043e\u0432\u043b\u044f\u0435\u043c \u0440\u0435\u0439\u0442\u0438\u043d\u0433...';
    }

    function getGameOverPendingText() {
      return currentLang === 'en'
        ? 'Your place will appear after score publishing'
        : '\u0412\u0430\u0448\u0435 \u043c\u0435\u0441\u0442\u043e \u043f\u043e\u044f\u0432\u0438\u0442\u0441\u044f \u043f\u043e\u0441\u043b\u0435 \u043f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u0438 \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u0430';
    }

    function buildGameOverLeaderboardRowsHtml(rows) {
      if (!rows.length) {
        return `<div class="leaderboardPending">${escapeHtml(getGameOverPendingText())}</div>`;
      }

      return rows.map(row => {
        if (row.divider) return '<div class="leaderboardGap" aria-hidden="true">...</div>';
        const rankClass = Number.isFinite(row.rank) && row.rank <= 3 ? ` top${row.rank}` : '';
        return `
          <div class="leaderboardRow${row.isPlayer ? ' currentUser' : ''}${rankClass}">
            <div class="leaderboardRank">${escapeHtml(row.rank)}</div>
            <div class="leaderboardNameWrap">
              <div class="leaderboardName">${escapeHtml(row.name)}</div>
            </div>
            <div class="leaderboardPoints">${formatCompactScore(row.score)}</div>
          </div>
        `;
      }).join('');
    }

    function buildLeaderboardHtml(finalScore, entries, isAuthorized, state = 'ready') {
      const currentUserId = App.player && typeof App.player.getUniqueID === 'function'
        ? App.player.getUniqueID()
        : '';
      const rows = state === 'ready' ? getGameOverLeaderboardRows(entries, currentUserId) : [];
      const enemiesEatenLabel = t('enemiesEaten');
      const enemiesEatenValue = formatCompactScore(enemiesEatenThisRound);
      const isLoading = state === 'loading';
      const isError = state === 'error';

      return `
        <div class="leaderboardPanel gameOverPanel">
          <div class="leaderboardScoreCard">
            <div class="leaderboardScoreValue">${escapeHtml(getLeaderboardScorePrefix())}: ${formatCompactScore(finalScore)}</div>
            <div class="leaderboardRunStat"><span>${escapeHtml(enemiesEatenLabel)}:</span> <strong>${enemiesEatenValue}</strong></div>
            ${isAuthorized ? '' : `<div class="leaderboardLoginHint">${escapeHtml(t('leaderboardLoginHint'))}</div>`}
          </div>

          <div class="leaderboardTitle">${escapeHtml(getGameOverLeaderboardTitle())}</div>
          <div class="leaderboardListCard">
            <div class="leaderboardRows">
              ${isLoading
                ? `<div class="leaderboardPending">${escapeHtml(getGameOverLoadingText())}</div>`
                : isError
                  ? `<div class="leaderboardPending">${escapeHtml(getLeaderboardUnavailableText())}</div>`
                  : buildGameOverLeaderboardRowsHtml(rows)}
            </div>
          </div>
        </div>
      `;
    }

    async function showGameOverWithLeaderboard() {
      const sessionId = runtimeSessionId;
      const finalScore = Math.max(0, Math.round(score || 0));

      App.localPause = true;
      markGameplayStop();

      showHtmlMessage(
        t('congratsTitle'),
        buildLeaderboardHtml(finalScore, null, false, 'loading'),
        'congrats'
      );

      if (App.sdkReady && !App.player) {
        await initYandexPlayer();
        if (sessionId !== runtimeSessionId || !gameOver) return;
      }

      const isAuthorized = isAuthorizedYandexPlayer();

      if (isAuthorized) {
        await submitScoreToLeaderboard(finalScore);
        if (sessionId !== runtimeSessionId || !gameOver) return;
      }

      if (App.metaXpAwardedSession !== sessionId) {
        App.metaXpAwardedSession = sessionId;
        window.JorMetaUI?.awardXp?.(finalScore);
      }

      const entries = await loadLeaderboardEntries(isAuthorized);
      if (sessionId !== runtimeSessionId || !gameOver) return;

      App.lastLeaderboardScore = finalScore;
      App.lastLeaderboardEntries = entries;
      App.lastLeaderboardAuthorized = isAuthorized;

      showHtmlMessage(
        t('congratsTitle'),
        buildLeaderboardHtml(finalScore, entries, isAuthorized, entries ? 'ready' : 'error'),
        'congrats'
      );
    }

    function getCampaignFailedTitle() {
      return currentLang === 'en' ? 'ROUND FAILED' : '\u0420\u0410\u0423\u041d\u0414 \u041d\u0415 \u041f\u0420\u041e\u0419\u0414\u0415\u041d';
    }

    function getCampaignFailedReason() {
      return currentLang === 'en' ? 'GOAL NOT COMPLETED' : '\u0426\u0415\u041b\u042c \u041d\u0415 \u0412\u042b\u041f\u041e\u041b\u041d\u0415\u041d\u0410';
    }

    function buildCampaignFailedHtml(level, progressValue) {
      const levelNumber = level?.n || App.campaignLevel || 1;
      const label = window.JorCampaignLevels?.label?.(level?.type) || '';
      const target = level?.stars?.[0] || level?.target || 1;
      const value = Math.max(0, Math.floor(Number(progressValue) || 0));
      const suffix = level?.type === 'survive' ? (window.JorCampaignLevels?.label?.('seconds') || 's') : '';
      const levelText = currentLang === 'en' ? `ROUND ${levelNumber}` : `\u0420\u0410\u0423\u041d\u0414 ${levelNumber}`;
      return `
        <div class="campaignFailedPanel">
          <div class="campaignFailedLevel">${escapeHtml(levelText)}</div>
          <div class="campaignFailedReason">${escapeHtml(getCampaignFailedReason())}</div>
          <div class="campaignFailedProgress">
            <span>${escapeHtml(label)}</span>
            <strong>${escapeHtml(Math.min(value, target))}/${escapeHtml(target)}${escapeHtml(suffix)}</strong>
          </div>
        </div>
      `;
    }

    function showCampaignFailedMessage(level, progressValue = 0) {
      App.localPause = true;
      markGameplayStop();
      DOM.messageTitle.textContent = getCampaignFailedTitle();
      DOM.messageTitle.dataset.messageKey = 'levelFailed';
      DOM.messageText.innerHTML = buildCampaignFailedHtml(level, progressValue);
      DOM.messageText.className = 'campaignFailedMessage';
      DOM.messageText.dataset.messageMode = 'campaignFailed';
      DOM.centerMessage.classList.remove('leaderboardDialog');
      DOM.centerMessage.classList.add('levelFailedDialog');
      if (DOM.messageRetryBtn) {
        DOM.messageRetryBtn.hidden = false;
        DOM.messageRetryBtn.textContent = currentLang === 'en' ? 'RESTART' : '\u041f\u0415\u0420\u0415\u0417\u0410\u041f\u0423\u0421\u0422\u0418\u0422\u042c';
      }
      if (DOM.restartBtn) DOM.restartBtn.textContent = currentLang === 'en' ? 'MAIN MENU' : '\u0413\u041b\u0410\u0412\u041d\u041e\u0415 \u041c\u0415\u041d\u042e';
      DOM.centerMessage.style.display = 'block';
    }

    function getEvolutionProgressState() {
      if (endlessMode) {
        const nextRewardLevel = getNextEndlessRewardLevel();
        if (nextRewardLevel === null) {
          return { progress: 1, scoreText: formatCompactScore(score) };
        }
        const targetIndex = Math.max(0, nextRewardLevel - 2);
        const prevRewardLevel = typeof getPreviousEndlessRewardLevel === 'function'
          ? getPreviousEndlessRewardLevel()
          : Math.max(1, nextRewardLevel - (PROGRESSION_CONFIG.ENDLESS_REWARD_EVERY_LEVELS ?? PROGRESSION_CONFIG.REWARD_EVERY_LEVELS));
        const prevIndex = Math.max(0, prevRewardLevel - 2);
        const startThreshold = prevRewardLevel > 1
          ? (PROGRESSION_CONFIG.ENDLESS_LEVEL_SCORE_THRESHOLDS[prevIndex] ?? 0)
          : 0;
        const endThreshold = PROGRESSION_CONFIG.ENDLESS_LEVEL_SCORE_THRESHOLDS[targetIndex] ?? startThreshold;
        const phaseScore = getEndlessPhaseScore();
        const progress = endThreshold > startThreshold
          ? clamp((phaseScore - startThreshold) / Math.max(1, endThreshold - startThreshold), 0, 1)
          : 1;
        return { progress, scoreText: formatCompactScore(score) };
      }

      const nextRewardLevel = getNextFirstPhaseRewardLevel();
      if (nextRewardLevel === null) {
        return { progress: 1, scoreText: formatCompactScore(score) };
      }
      const prevRewardLevel = Math.max(1, nextRewardLevel - PROGRESSION_CONFIG.REWARD_EVERY_LEVELS);
      const progress = clamp(
        (player.level - prevRewardLevel) / Math.max(1, nextRewardLevel - prevRewardLevel),
        0,
        1
      );
      return { progress, scoreText: formatCompactScore(score) };
    }

    function formatCampaignTimer(seconds) {
      const safeSeconds = Math.max(0, Math.ceil(Number(seconds) || 0));
      const minutes = Math.floor(safeSeconds / 60);
      const rest = safeSeconds % 60;
      return minutes > 0 ? `${minutes}:${String(rest).padStart(2, '0')}` : String(rest);
    }

    function updateCampaignTimer() {
      if (!DOM.campaignTimer) return;
      const info = typeof getCampaignTimeInfo === 'function' ? getCampaignTimeInfo() : null;
      const visible = Boolean(info && App.hasStarted && !App.startScreenVisible && !gameOver && !victory);
      DOM.campaignTimer.classList.toggle('visible', visible);
      DOM.campaignTimer.setAttribute('aria-hidden', visible ? 'false' : 'true');
      if (!visible) {
        DOM.campaignTimer.classList.remove('danger');
        return;
      }
      DOM.campaignTimer.textContent = formatCampaignTimer(info.remainingSeconds);
      DOM.campaignTimer.classList.toggle('danger', info.progress <= 0.1);
    }

    function updateTopProgressBar() {
      updateCampaignTimer();
      if (!DOM.topProgressScore) return;

      if (typeof getCampaignTopProgressText === 'function') {
        const campaignText = getCampaignTopProgressText();
        if (campaignText) {
          DOM.topProgressScore.textContent = campaignText;
          DOM.topProgressScore.classList.remove('pop');
          return;
        }
      }

      const targetScore = Math.max(0, Math.round(score || 0));

      if (targetScore > displayedTopScore) {
        const gain = targetScore - displayedTopScore;
        displayedTopScore += Math.max(1, Math.ceil(gain * 0.22));
        if (displayedTopScore > targetScore) displayedTopScore = targetScore;
      } else if (targetScore < displayedTopScore) {
        displayedTopScore = targetScore;
      }

      if (displayedTopScore > lastPoppedTopScore) {
        topScorePopTimer = 8;
        lastPoppedTopScore = displayedTopScore;
      }

      if (topScorePopTimer > 0) {
        topScorePopTimer -= 1;
        DOM.topProgressScore.classList.add('pop');
      } else {
        DOM.topProgressScore.classList.remove('pop');
      }

      DOM.topProgressScore.textContent = formatCompactScore(displayedTopScore);
    }

    function getCurrentPhaseLevel() {
      return endlessMode ? endlessLevel : player.level;
    }

    function getCurrentPhaseLevelCap() {
      return endlessMode ? PROGRESSION_CONFIG.ENDLESS_LEVELS : PROGRESSION_CONFIG.FIRST_PHASE_LEVELS;
    }

    function getOverallLevel() {
      return endlessMode
        ? PROGRESSION_CONFIG.FIRST_PHASE_LEVELS + endlessLevel
        : player.level;
    }

    function getNextEndlessLevelScoreThreshold() {
      const levelIndex = Math.max(0, endlessLevel - 1);
      const threshold = PROGRESSION_CONFIG.ENDLESS_LEVEL_SCORE_THRESHOLDS[levelIndex] ?? null;
      if (threshold === null) return null;
      return endlessScoreBase + threshold;
    }

    function getRewardCounterAfterChoice(reachedLevel, currentRewardLevel, cap) {
      const reachedRewardLevel = Math.floor(reachedLevel / PROGRESSION_CONFIG.REWARD_EVERY_LEVELS) + 1;
      return Math.min(cap + 1, Math.max(currentRewardLevel + 1, reachedRewardLevel));
    }

    function getMutationIconSvg(id) {
      const paths = {
        spike: `
          <path d="M18 5L20.8 14.2L30 18L20.8 21.8L18 31L15.2 21.8L6 18L15.2 14.2Z"></path>
          <path d="M18 11V25"></path>
          <path d="M11 18H25"></path>
        `,
        tail: `
          <path d="M8 22C13 11 24 11 28 18"></path>
          <path d="M28 18C24 18 22 20.5 21 25"></path>
          <path d="M11 21C15 24 19 24.5 23 22"></path>
        `,
        shell: `
          <path d="M18 6L28 11V18C28 24.5 24.2 28.8 18 31C11.8 28.8 8 24.5 8 18V11Z"></path>
          <path d="M18 10V27"></path>
          <path d="M11 17H25"></path>
        `,
        maw: `
          <path d="M8 19C10 11 16 8 24 9C22 14 22 22 24 27C16 28 10 25 8 19Z"></path>
          <path d="M13 17L18 19L13 21"></path>
          <path d="M23 13L20 17"></path>
          <path d="M23 25L20 21"></path>
        `,
        dash: `
          <path d="M7 20H22"></path>
          <path d="M17 13L25 20L17 27"></path>
          <path d="M7 13H13"></path>
          <path d="M7 27H13"></path>
        `,
        tentacle: `
          <path d="M10 27C11 19 17 18 18 12C18.7 8.5 16 7 13 8.5"></path>
          <path d="M18 28C19 21 25 20 26 14C26.6 10.2 24 8.5 21 10"></path>
          <path d="M26 15C28.5 16 29 18.4 27.5 20.5"></path>
        `,
        shatter: `
          <path d="M18 11L22 18L18 25L14 18Z"></path>
          <path d="M8 14L11 12"></path>
          <path d="M25 9L27 6"></path>
          <path d="M28 22L31 24"></path>
          <path d="M10 28L7 31"></path>
        `,
        agility: `
          <path d="M26 12C23.8 9.6 20.8 8.5 17.8 8.8C12.8 9.3 9 13.4 9 18.4"></path>
          <path d="M10 25C12.2 27.4 15.2 28.5 18.2 28.2C23.2 27.7 27 23.6 27 18.6"></path>
          <path d="M26 8V12H22"></path>
          <path d="M10 29V25H14"></path>
        `,
      };

      return `
        <svg class="mutationCardSvg" viewBox="0 0 36 36" aria-hidden="true" focusable="false">
          ${paths[id] ?? paths.spike}
        </svg>
      `;
    }

    function buildMutationCard(mutation, index) {
      const button = document.createElement('button');
      button.className = mutation.bonus ? 'card bonusCard' : 'card';
      button.type = 'button';
      button.style.gridColumn = String(index + 1);
      button.style.borderColor = `${mutation.accent ?? '#8befff'}66`;
      button.style.boxShadow = `inset 0 0 0 1px ${mutation.accent ?? '#8befff'}22, 0 10px 24px rgba(0,0,0,0.18)`;
      button.style.background = `linear-gradient(180deg, ${(mutation.accent ?? '#8befff')}1f 0%, rgba(20,40,52,0.96) 38%, rgba(16,32,42,0.98) 100%)`;

      const currentLevel = getMutationLevel(mutation.id);
      const nextLevel = currentLevel + 1;

      button.innerHTML = `
        <div class="mutationCardHeader">
          <div class="mutationCardIcon" style="background:${mutation.accent ?? '#8befff'}22;border-color:${mutation.accent ?? '#8befff'}55;color:${mutation.accent ?? '#8befff'};">${getMutationIconSvg(mutation.id)}</div>
          <div class="mutationCardTitleWrap">
            <h3>${mutation.title}</h3>
            <div class="mutationCardHint">${mutation.hint}</div>
          </div>
        </div>
        <p>${mutation.desc}</p>
        <small style="margin-top:12px;opacity:0.95;">${t('mutationLevel', currentLevel, nextLevel)}</small>
      `;

      button.onclick = () => {
        if (areEvolutionChoicesLocked()) return;
        dashRequested = false;
        if (player) player.dashTime = 0;
        player.applyMutation(mutation.id);
        if (endlessMode) {
          endlessRewardLevel = getEndlessRewardCounterAfterChoice(
            endlessLevel,
            endlessRewardLevel,
            getEndlessRewardCap()
          );
        } else {
          firstPhaseRewardLevel = getRewardCounterAfterChoice(
            player.level,
            firstPhaseRewardLevel,
            getFirstPhaseRewardCap()
          );
        }
        closeEvolutionPanel();
      };

      return button;
    }

    function buildLockedRewardCard() {
      const button = document.createElement('button');
      button.className = 'card lockedCard';
      button.type = 'button';
      button.style.gridColumn = '3';
      button.innerHTML = `
        <h3>${t('lockedRewardTitle')}</h3>
        <p>${t('lockedRewardText')}</p>
      `;

      button.onclick = () => {
        if (areEvolutionChoicesLocked()) return;
        showRewardedRerollAd();
      };
      return button;
    }

    function renderEvolutionChoices() {
      if (!currentChoices.length) {
        currentChoices = getMutationChoices();
      }

      DOM.evolutionCards.innerHTML = '';

      currentChoices.forEach((mutation, index) => {
        DOM.evolutionCards.appendChild(buildMutationCard(mutation, index));
      });

      if (!App.rewardedUsedThisEvolution) {
        DOM.evolutionCards.appendChild(buildLockedRewardCard());
      }

      updateEvolutionChoiceLockState();
    }

    async function openEvolutionPanel() {
      evolutionPending = true;
      App.localPause = true;
      dashRequested = false;
      if (player) player.dashTime = 0;
      markGameplayStop();

      App.rewardedUsedThisEvolution = false;
      lockEvolutionChoices(500);
      currentChoices = getMutationChoices();

      updateRewardButtonState();
      DOM.evolutionText.textContent = t('evolutionChoose')

      renderEvolutionChoices();
      showElement(DOM.overlay);
      showElement(DOM.evolutionPanel);
    }

    async function closeEvolutionPanel() {
      evolutionPending = false;
      App.localPause = false;
      dashRequested = false;
      currentChoices = [];
      App.evolutionChoiceLockedUntil = 0;
      if (App.evolutionChoiceUnlockTimer) {
        clearTimeout(App.evolutionChoiceUnlockTimer);
        App.evolutionChoiceUnlockTimer = null;
      }

      hideElement(DOM.overlay);
      hideElement(DOM.evolutionPanel);

      markGameplayStart();
    }


