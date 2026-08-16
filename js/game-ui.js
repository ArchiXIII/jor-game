const App = {
      sdkReady: false,
      platformPaused: false,
      localPause: false,
      gameplayMarked: false,
      usingBannerApi: true,
      bannerVisible: false,
      bannerRequestPending: false,
      bannerResizeTimer: null,
      bannerResizeBound: false,
      keepStickyBannerAlways: true,
      rewardedUsedThisEvolution: false,
      evolutionChoiceLockedUntil: 0,
      evolutionChoiceUnlockTimer: null,
      hasStarted: false,
      startScreenVisible: false,
      // Р В¤Р В»Р В°Р С–Р С‘ Р Т‘Р В»РЎРЏ Р С”Р С•РЎР‚РЎР‚Р ВµР С”РЎвЂљР Р…Р С•Р С–Р С• РЎРѓРЎР‚Р В°Р В±Р В°РЎвЂљРЎвЂ№Р Р†Р В°Р Р…Р С‘РЎРЏ LoadingAPI.ready() РІР‚вЂќ РЎРѓР С. Р С—. 1.19.
      // gameReadyMoment РІР‚вЂќ Р С‘Р С–РЎР‚Р В° Р С•РЎвЂљРЎР‚Р С‘РЎРѓР С•Р Р†Р В°Р В»Р В° РЎРѓРЎвЂљР В°РЎР‚РЎвЂљР С•Р Р†РЎвЂ№Р в„– РЎРЊР С”РЎР‚Р В°Р Р… (Р С‘Р С–РЎР‚Р В°Р В±Р ВµР В»РЎРЉР Р…Р В°).
      // loadingReadySent РІР‚вЂќ РЎРѓР С‘Р С–Р Р…Р В°Р В» РЎС“Р В¶Р Вµ Р С•РЎвЂљР С—РЎР‚Р В°Р Р†Р В»Р ВµР Р…, Р Т‘Р Р†Р В°Р В¶Р Т‘РЎвЂ№ Р ВµР С–Р С• РЎРѓР В»Р В°РЎвЂљРЎРЉ Р Р…Р ВµР В»РЎРЉР В·РЎРЏ.
      loadingReadySent: false,
      // Р СџР В°РЎС“Р В·Р В°, Р В·Р В°Р С—РЎР‚Р С•РЎв‚¬Р ВµР Р…Р Р…Р В°РЎРЏ Р С‘Р С–РЎР‚Р С•Р С”Р С•Р С Р Р†РЎР‚РЎС“РЎвЂЎР Р…РЎС“РЎР‹ (ESC). Р С›РЎвЂљР Т‘Р ВµР В»РЎРЉР Р…Р В°РЎРЏ Р С•РЎвЂљ localPause,
      // РЎвЂЎРЎвЂљР С•Р В±РЎвЂ№ Р Р…Р Вµ Р С”Р С•Р Р…РЎвЂћР В»Р С‘Р С”РЎвЂљР С•Р Р†Р В°РЎвЂљРЎРЉ РЎРѓ Р В°Р Р†РЎвЂљР С•Р С—Р В°РЎС“Р В·Р В°Р СР С‘ РЎРѓРЎвЂљР В°РЎР‚РЎвЂљР С•Р Р†Р С•Р С–Р С• РЎРЊР С”РЎР‚Р В°Р Р…Р В° / РЎРЊР Р†Р С•Р В»РЎР‹РЎвЂ Р С‘Р С‘ /
      // Р С•Р С”Р Р…Р В° РЎРѓР СР ВµРЎР‚РЎвЂљР С‘. Р СџРЎР‚Р С•Р Р†Р ВµРЎР‚РЎРЏР ВµРЎвЂљРЎРѓРЎРЏ Р Р† updateGame() Р С”Р В°Р С” Р Т‘Р С•Р С—Р С•Р В»Р Р…Р С‘РЎвЂљР ВµР В»РЎРЉР Р…РЎвЂ№Р в„– Р С–Р ВµР в„–РЎвЂљ.
      userPaused: false,
      leaderboardName: 'topScore',
      ourGamesUrl: null,
      ourGamesLoading: false,
      fullscreenAdPending: false,
      lastInterstitialAdAt: 0,
      metaXpAwardedSession: null,
    };

    // ------------------------------
    // Yandex SDK
    // ------------------------------
    async function initPlatform() {
      if (!window.JorPlatform) {
        DOM.sdkStatus.textContent = t('sdkLocal');
        updateOurGamesButtonState();
        return;
      }

      try {
        const platformState = await window.JorPlatform.init({
          onPause: handlePlatformPause,
          onResume: handlePlatformResume
        });
        App.sdkReady = !!platformState?.ready;
        App.loadingReadySent = !!window.jorLoadingReadySent;
        App.gameReadyMoment = true;
        // Р СћРЎР‚Р ВµР В±Р С•Р Р†Р В°Р Р…Р С‘Р Вµ Р Р‡Р Р…Р Т‘Р ВµР С”РЎРѓ.Р ВР С–РЎР‚ Р С—. 2.14: РЎРЏР В·РЎвЂ№Р С” Р С‘Р Р…РЎвЂљР ВµРЎР‚РЎвЂћР ВµР в„–РЎРѓР В° Р С•Р С—РЎР‚Р ВµР Т‘Р ВµР В»РЎРЏР ВµРЎвЂљРЎРѓРЎРЏ
        // РЎвЂЎР ВµРЎР‚Р ВµР В· ysdk.environment.i18n.lang. Р вЂќР ВµР В»Р В°Р ВµР С РЎРЊРЎвЂљР С• РЎРѓРЎР‚Р В°Р В·РЎС“ Р С—Р С•РЎРѓР В»Р Вµ init
        // Р С‘ Р С—Р ВµРЎР‚Р ВµР Т‘ Р Р†РЎРѓР ВµР СР С‘ Р С•РЎРѓРЎвЂљР В°Р В»РЎРЉР Р…РЎвЂ№Р СР С‘ UI-Р С•Р С—Р ВµРЎР‚Р В°РЎвЂ Р С‘РЎРЏР СР С‘.
        const sdkLang = window.JorPlatform.getLanguage();
        if (sdkLang) {
          setLanguage(sdkLang);
        }
        DOM.sdkStatus.textContent = App.sdkReady ? t('sdkReady') : t('sdkLocal');

        notifyGameReady();
        await initPlatformPlayer();
        await window.JorSaveManager?.load?.();
        await window.JorMetaUI?.syncPlayerProgress?.();
        await window.JorCampaignUI?.syncCloud?.();
        await window.JorShopUI?.refreshPayments?.();
        // Р вЂўРЎРѓР В»Р С‘ РЎРѓРЎвЂљР В°РЎР‚РЎвЂљР С•Р Р†РЎвЂ№Р в„– РЎРЊР С”РЎР‚Р В°Р Р… РЎС“Р В¶Р Вµ Р С•РЎвЂљРЎР‚Р С‘РЎРѓР С•Р Р†Р В°Р Р… Р С” Р СР С•Р СР ВµР Р…РЎвЂљРЎС“ Р С–Р С•РЎвЂљР С•Р Р†Р Р…Р С•РЎРѓРЎвЂљР С‘ SDK РІР‚вЂќ
        // Р Т‘Р В°РЎвЂљРЎРЉ РЎРѓР С‘Р С–Р Р…Р В°Р В» ready() Р С—РЎР‚РЎРЏР СР С• РЎРѓР ВµР в„–РЎвЂЎР В°РЎРѓ. Р ВР Р…Р В°РЎвЂЎР Вµ Р С•Р Р… РЎРѓРЎвЂљРЎР‚Р ВµР В»РЎРЉР Р…РЎвЂРЎвЂљ Р С‘Р В·
        // showStartScreen() Р С”Р В°Р С” РЎвЂљР С•Р В»РЎРЉР С”Р С• РЎвЂљР С•РЎвЂљ Р С—Р С•Р С”Р В°Р В¶Р ВµРЎвЂљРЎРѓРЎРЏ.
        showEvolutionBanner();
        if (App.hasStarted && !App.startScreenVisible) {
          markGameplayStart();
        }
        refreshOurGamesUrl();
      } catch (error) {
        console.error('Platform init error:', error);
        DOM.sdkStatus.textContent = t('sdkError');
        updateOurGamesButtonState();
      }
    }

    async function initPlatformPlayer() {
      try {
        const player = await window.JorPlatform?.ensurePlayer?.();
        window.JorMetaUI?.refreshPlayer?.();
        return player || null;
      } catch (error) {
        console.error('Platform player init error:', error);
        return null;
      }
    }

    function isAuthorizedPlatformPlayer() {
      return !!window.JorPlatform?.isAuthorized?.();
    }

    async function submitScoreToLeaderboard(finalScore) {
      const leaderboard = window.JorPlatform?.getLeaderboardApi?.();
      if (!leaderboard || !isAuthorizedPlatformPlayer()) return false;

      if (typeof window.JorMetaUI?.submitScore === 'function') {
        return window.JorMetaUI.submitScore(App.leaderboardName, finalScore);
      }

      try {
        await leaderboard.setScore(App.leaderboardName, finalScore);
        return true;
      } catch (error) {
        console.error('Leaderboard setScore error:', error);
        return false;
      }
    }

    async function loadLeaderboardEntries(includeUser = true) {
      const leaderboard = window.JorPlatform?.getLeaderboardApi?.();
      if (!leaderboard) return null;

      try {
        const options = {
          quantityTop: 5,
        };
        if (includeUser) {
          options.includeUser = true;
          options.quantityAround = 2;
        }
        return await leaderboard.getEntries(App.leaderboardName, options);
      } catch (error) {
        console.error('Leaderboard getEntries error:', error);
        return null;
      }
    }

    function markGameplayStart() {
      if (!App.sdkReady) return;
      if (App.localPause || App.platformPaused || App.userPaused) return;
      if (App.gameplayMarked) return;

      window.JorPlatform?.gameplayStart?.();
      App.gameplayMarked = true;
      showEvolutionBanner();
    }

    function markGameplayStop(showStickyBanner = true) {
      if (!App.sdkReady) return;
      if (!App.gameplayMarked) return;

      window.JorPlatform?.gameplayStop?.();
      App.gameplayMarked = false;
    }

    function shouldShowStickyBanner() {
      return App.keepStickyBannerAlways && !window.JorShopUI?.hasNoSideAds?.();
    }

    async function showEvolutionBanner() {
      if (!App.sdkReady || !window.JorPlatform?.hasFeature?.('stickyBanner') || !App.usingBannerApi) return;
      if (!shouldShowStickyBanner()) {
        await hideEvolutionBanner(true);
        return;
      }
      if (App.bannerVisible) return;
      if (App.bannerRequestPending) return;

      App.bannerRequestPending = true;
      try {
        App.bannerVisible = await window.JorPlatform.showStickyBanner();
      } catch (error) {
        console.warn('showBannerAdv error:', error);
      } finally {
        App.bannerRequestPending = false;
      }
    }

    async function hideEvolutionBanner(force = false) {
      if (!force) return;
      if (!force && App.keepStickyBannerAlways) return;
      if (!App.sdkReady || !window.JorPlatform?.hasFeature?.('stickyBanner') || !App.usingBannerApi) return;

      try {
        await window.JorPlatform.hideStickyBanner();
        App.bannerVisible = false;
      } catch (error) {
        console.warn('hideBannerAdv error:', error);
      }
    }

    function scheduleStickyBannerSync() {
      if (App.bannerResizeTimer !== null) {
        clearTimeout(App.bannerResizeTimer);
      }
      App.bannerResizeTimer = setTimeout(() => {
        App.bannerResizeTimer = null;
        App.bannerVisible = false;
        showEvolutionBanner();
      }, 350);
    }

    function setupStickyBannerResizeSync() {
      if (App.bannerResizeBound) return;
      App.bannerResizeBound = true;
      window.addEventListener('resize', scheduleStickyBannerSync, { passive: true });
      window.visualViewport?.addEventListener('resize', scheduleStickyBannerSync, { passive: true });
    }

    const INTERSTITIAL_COOLDOWN_MS = 2 * 60 * 1000;
    const INTERSTITIAL_STORAGE_KEY = 'jor-interstitial-last-shown-v1';

    function getLastInterstitialAdAt() {
      if (App.lastInterstitialAdAt > 0) return App.lastInterstitialAdAt;
      try {
        App.lastInterstitialAdAt = Math.max(0, Number(localStorage.getItem(INTERSTITIAL_STORAGE_KEY)) || 0);
      } catch (error) {}
      return App.lastInterstitialAdAt;
    }

    function markInterstitialAdShown() {
      App.lastInterstitialAdAt = Date.now();
      try {
        localStorage.setItem(INTERSTITIAL_STORAGE_KEY, String(App.lastInterstitialAdAt));
      } catch (error) {}
    }

    async function showInterstitialBeforeTransition(onDone) {
      if (App.fullscreenAdPending) return;
      App.fullscreenAdPending = true;
      let finished = false;
      const complete = () => {
        if (finished) return;
        finished = true;
        App.fullscreenAdPending = false;
        try { onDone?.(); } catch (error) {}
      };

      if (!App.sdkReady ||
          !window.JorPlatform?.hasFeature?.('interstitialAds') ||
          Date.now() - getLastInterstitialAdAt() < INTERSTITIAL_COOLDOWN_MS) {
        complete();
        return;
      }

      markGameplayStop(false);
      pauseAmbientMusic();

      try {
        const shown = await window.JorPlatform.showInterstitial({
          onOpen: () => {
            App.platformPaused = true;
            pauseAmbientMusic();
          },
          onClose: () => {
            App.platformPaused = false;
          },
          onError: (error) => {
            console.warn('showInterstitial error:', error);
            App.platformPaused = false;
          }
        });
        if (shown) markInterstitialAdShown();
        complete();
      } catch (error) {
        console.warn('showInterstitial call error:', error);
        App.platformPaused = false;
        complete();
      }
    }

    // ------------------------------
    // Р ВР С–РЎР‚Р С•Р Р†РЎвЂ№Р Вµ РЎРѓРЎС“РЎвЂ°Р Р…Р С•РЎРѓРЎвЂљР С‘
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
      // Р СџР С•Р СР ВµРЎвЂЎР В°Р ВµР С Р СР С•Р СР ВµР Р…РЎвЂљ, Р С”Р С•Р С–Р Т‘Р В° Р С‘Р С–РЎР‚Р В° РЎРѓРЎвЂљР В°Р В»Р В° РЎР‚Р ВµР В°Р В»РЎРЉР Р…Р С• Р С‘Р С–РЎР‚Р В°Р В±Р ВµР В»РЎРЉР Р…Р С•Р в„– Р Т‘Р В»РЎРЏ Р С—Р С•Р В»РЎРЉР В·Р С•Р Р†Р В°РЎвЂљР ВµР В»РЎРЏ
      // (РЎРѓРЎвЂљР В°РЎР‚РЎвЂљР С•Р Р†РЎвЂ№Р в„– РЎРЊР С”РЎР‚Р В°Р Р… РЎРѓ Р С”Р Р…Р С•Р С—Р С”Р С•Р в„– Р’В«Р ВР С–РЎР‚Р В°РЎвЂљРЎРЉР’В» Р Р† DOM). Р РЋР В°Р С РЎРѓР С‘Р С–Р Р…Р В°Р В» Р Р† Р Р‡Р Р…Р Т‘Р ВµР С”РЎРѓ РЎв‚¬Р В»РЎвЂР С
      // Р С—Р С•РЎРѓР В»Р Вµ РЎРѓР В»Р ВµР Т‘РЎС“РЎР‹РЎвЂ°Р ВµР С–Р С• animation frame РІР‚вЂќ РЎвЂЎРЎвЂљР С•Р В±РЎвЂ№ Р С•Р Р… РЎРѓР С•Р Р†Р С—Р В°Р В» РЎРѓ РЎР‚Р ВµР В°Р В»РЎРЉР Р…Р С•Р в„– Р С•РЎвЂљРЎР‚Р С‘РЎРѓР С•Р Р†Р С”Р С•Р в„–,
      // Р В° Р Р…Р Вµ РЎРѓ Р СР С•Р СР ВµР Р…РЎвЂљР С•Р С РЎРѓР СР ВµР Р…РЎвЂ№ display. Р РЋР С. notifyGameReady Р С‘ Р С—. 1.19.
    }

    // Р СћРЎР‚Р ВµР В±Р С•Р Р†Р В°Р Р…Р С‘Р Вµ Р Р‡Р Р…Р Т‘Р ВµР С”РЎРѓ.Р ВР С–РЎР‚ Р С—. 1.19: LoadingAPI.ready() Р Т‘Р С•Р В»Р В¶Р ВµР Р… Р Р†РЎвЂ№Р В·РЎвЂ№Р Р†Р В°РЎвЂљРЎРЉРЎРѓРЎРЏ
    // РЎР‚Р С•Р Р†Р Р…Р С• Р Р† РЎвЂљР С•РЎвЂљ Р СР С•Р СР ВµР Р…РЎвЂљ, Р С”Р С•Р С–Р Т‘Р В° Р С‘Р С–РЎР‚Р В° РЎРѓРЎвЂљР В°Р Р…Р С•Р Р†Р С‘РЎвЂљРЎРѓРЎРЏ Р Т‘Р С•РЎРѓРЎвЂљРЎС“Р С—Р Р…Р С•Р в„– Р Т‘Р В»РЎРЏ Р С‘Р С–РЎР‚Р В°Р Р…Р С‘РЎРЏ РІР‚вЂќ
    // Р Р…Р Вµ РЎР‚Р В°Р Р…РЎРЉРЎв‚¬Р Вµ (Р С‘Р С–РЎР‚Р В° Р ВµРЎвЂ°РЎвЂ Р С–РЎР‚РЎС“Р В·Р С‘РЎвЂљРЎРѓРЎРЏ) Р С‘ Р Р…Р Вµ Р С—Р С•Р В·Р В¶Р Вµ (Р Р…Р В°РЎР‚РЎС“РЎв‚¬Р ВµР Р…Р С‘Р Вµ GRA).
    // Р В¤РЎС“Р Р…Р С”РЎвЂ Р С‘РЎРЏ Р С‘Р Т‘Р ВµР СР С—Р С•РЎвЂљР ВµР Р…РЎвЂљР Р…Р В° Р С‘ Р В°Р Р†РЎвЂљР С•Р СР В°РЎвЂљР С‘РЎвЂЎР ВµРЎРѓР С”Р С‘ Р Т‘Р С•Р В¶Р С‘Р Т‘Р В°Р ВµРЎвЂљРЎРѓРЎРЏ Р С–Р С•РЎвЂљР С•Р Р†Р Р…Р С•РЎРѓРЎвЂљР С‘ SDK.
    function notifyGameReady() {
      if (App.loadingReadySent) return;
      if (!App.gameReadyMoment) return;     // РЎРѓРЎвЂљР В°РЎР‚РЎвЂљР С•Р Р†РЎвЂ№Р в„– РЎРЊР С”РЎР‚Р В°Р Р… Р ВµРЎвЂ°РЎвЂ Р Р…Р Вµ Р С—Р С•Р С”Р В°Р В·Р В°Р Р…
      if (!App.sdkReady || !window.JorPlatform) return;
      try {
        window.JorPlatform.notifyGameReady();
        App.loadingReadySent = true;
      } catch (error) {
        console.error('LoadingAPI.ready error:', error);
      }
    }

    // -----------------------------------------------------------------------
    // Р СџР В°РЎС“Р В·Р В° Р С—Р С• ESC.
    // Р вЂњР В»Р В°Р Р†Р Р…Р С•Р Вµ Р С—РЎР‚Р В°Р Р†Р С‘Р В»Р С•: Р Р…Р Вµ Р С”Р С•Р Р…РЎвЂћР В»Р С‘Р С”РЎвЂљР С•Р Р†Р В°РЎвЂљРЎРЉ РЎРѓ Р В°Р Р†РЎвЂљР С•Р С—Р В°РЎС“Р В·Р В°Р СР С‘. ESC Р С‘Р С–Р Р…Р С•РЎР‚Р С‘РЎР‚РЎС“Р ВµРЎвЂљРЎРѓРЎРЏ,
    // Р ВµРЎРѓР В»Р С‘ Р С‘Р С–РЎР‚Р В° Р С‘ РЎвЂљР В°Р С” Р Р…Р В° Р С—Р В°РЎС“Р В·Р Вµ Р С—Р С• Р Т‘РЎР‚РЎС“Р С–Р С•Р в„– Р С—РЎР‚Р С‘РЎвЂЎР С‘Р Р…Р Вµ (РЎРѓРЎвЂљР В°РЎР‚РЎвЂљР С•Р Р†РЎвЂ№Р в„– РЎРЊР С”РЎР‚Р В°Р Р…,
    // РЎРЊР Р†Р С•Р В»РЎР‹РЎвЂ Р С‘РЎРЏ, Р С•Р С”Р Р…Р С• РЎРѓР СР ВµРЎР‚РЎвЂљР С‘/Р С—Р С•Р В±Р ВµР Т‘РЎвЂ№, РЎР‚Р ВµР С”Р В»Р В°Р СР В°/РЎРѓР Р†РЎвЂРЎР‚Р Р…РЎС“РЎвЂљР В°РЎРЏ Р Р†Р С”Р В»Р В°Р Т‘Р С”Р В°). Р В­РЎвЂљР С•
    // Р С–Р В°РЎР‚Р В°Р Р…РЎвЂљР С‘РЎР‚РЎС“Р ВµРЎвЂљ, РЎвЂЎРЎвЂљР С• РЎРѓР Р…РЎРЏРЎвЂљР С‘Р Вµ userPaused Р Р…Р С‘Р С”Р С•Р С–Р Т‘Р В° Р Р…Р Вµ Р’В«Р С•Р В¶Р С‘Р Р†Р С‘РЎвЂљР’В» Р С‘Р С–РЎР‚РЎС“
    // Р Р† РЎРѓР С‘РЎвЂљРЎС“Р В°РЎвЂ Р С‘Р С‘, Р С”Р С•Р С–Р Т‘Р В° Р С—Р С•Р С”Р В°Р В·РЎвЂ№Р Р†Р В°Р ВµРЎвЂљРЎРѓРЎРЏ Р СР С•Р Т‘Р В°Р В»Р С”Р В°.
    // -----------------------------------------------------------------------
    function canTogglePause() {
      if (typeof isCampaignRoundIntroOpen === 'function' && isCampaignRoundIntroOpen()) return false;
      // Р СњР В° РЎРѓРЎвЂљР В°РЎР‚РЎвЂљР С•Р Р†Р С•Р С РЎРЊР С”РЎР‚Р В°Р Р…Р Вµ РІР‚вЂќ Р Р…Р ВµРЎвЂљ РЎРѓР СРЎвЂ№РЎРѓР В»Р В°, РЎвЂљР В°Р С Р С‘ РЎвЂљР В°Р С” Р С—Р В°РЎС“Р В·Р В°, Р С‘ Р ВµРЎРѓРЎвЂљРЎРЉ Р С”Р Р…Р С•Р С—Р С”Р В° Play.
      if (App.startScreenVisible) return false;
      // Р ВР С–РЎР‚Р В° Р ВµРЎвЂ°РЎвЂ Р Р…Р Вµ Р Р…Р В°РЎвЂЎР С‘Р Р…Р В°Р В»Р В°РЎРѓРЎРЉ.
      if (!App.hasStarted) return false;
      // Р С™Р С•Р Р…Р ВµРЎвЂ  Р С‘Р С–РЎР‚РЎвЂ№ Р С‘Р В»Р С‘ Р С—Р С•Р В±Р ВµР Т‘Р В° РІР‚вЂќ Р С—Р ВµРЎР‚Р ВµР С”Р В»РЎР‹РЎвЂЎР ВµР Р…Р С‘Р Вµ Р С—Р В°РЎС“Р В·РЎвЂ№ Р Р…Р Вµ Р Р…РЎС“Р В¶Р Р…Р С•.
      if (gameOver || victory) return false;
      // Р В­Р Р†Р С•Р В»РЎР‹РЎвЂ Р С‘РЎРЏ / РЎвЂ Р ВµР Р…РЎвЂљРЎР‚Р В°Р В»РЎРЉР Р…Р С•Р Вµ РЎРѓР С•Р С•Р В±РЎвЂ°Р ВµР Р…Р С‘Р Вµ РІР‚вЂќ Р ВµРЎРѓРЎвЂљРЎРЉ РЎРѓР Р†Р С•Р С‘ РЎРЊР В»Р ВµР СР ВµР Р…РЎвЂљРЎвЂ№ РЎС“Р С—РЎР‚Р В°Р Р†Р В»Р ВµР Р…Р С‘РЎРЏ.
      if (evolutionPending) return false;
      // Р СџР В»Р В°РЎвЂљРЎвЂћР С•РЎР‚Р СР В° РЎРѓР В°Р СР В° Р С—Р С•РЎРѓРЎвЂљР В°Р Р†Р С‘Р В»Р В° Р Р…Р В° Р С—Р В°РЎС“Р В·РЎС“ (РЎРѓР Р†РЎвЂРЎР‚Р Р…РЎС“РЎвЂљР В°РЎРЏ Р Р†Р С”Р В»Р В°Р Т‘Р С”Р В°, РЎР‚Р ВµР С”Р В»Р В°Р СР В°).
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
        // Р РЋР С•Р С•Р В±РЎвЂ°Р В°Р ВµР С Р Р‡Р Р…Р Т‘Р ВµР С”РЎРѓРЎС“: Р С–Р ВµР в„–Р С-Р С—Р В»Р ВµР в„– Р С•РЎРѓРЎвЂљР В°Р Р…Р С•Р Р†Р В»Р ВµР Р… (Р Р†Р В°Р В¶Р Р…Р С• Р Т‘Р В»РЎРЏ Р СР ВµРЎвЂљРЎР‚Р С‘Р С” SDK).
        try { markGameplayStop(); } catch (e) {}
      } else {
        hidePauseOverlay();
        // Р вЂ™Р С•Р В·Р С•Р В±Р Р…Р С•Р Р†Р В»РЎРЏР ВµР С Р СРЎС“Р В·РЎвЂ№Р С”РЎС“ РЎвЂљР С•Р В»РЎРЉР С”Р С• Р ВµРЎРѓР В»Р С‘ Р Р† Р С”Р С•Р СР Р…Р В°РЎвЂљР Вµ Р Р…Р ВµРЎвЂљ Р Т‘РЎР‚РЎС“Р С–Р С‘РЎвЂ¦ РЎРѓРЎвЂљР С•Р С—-Р С—РЎР‚Р С‘РЎвЂЎР С‘Р Р….
        try { ensureAmbientMusic(); } catch (e) {}
        try { markGameplayStart(); } catch (e) {}
      }
    }

    function togglePause() {
      if (App.userPaused) {
        // Р РЋР Р…РЎРЏРЎвЂљРЎРЉ Р С—Р В°РЎС“Р В·РЎС“ РІР‚вЂќ Р Р†РЎРѓР ВµР С–Р Т‘Р В° РЎР‚Р В°Р В·РЎР‚Р ВµРЎв‚¬Р ВµР Р…Р С•, РЎвЂЎРЎвЂљР С•Р В±РЎвЂ№ Р С‘Р С–РЎР‚Р С•Р С” Р Р…Р С‘Р С”Р С•Р С–Р Т‘Р В° Р Р…Р Вµ Р’В«Р В·Р В°РЎРѓРЎвЂљРЎР‚РЎРЏР В»Р’В».
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
      const featureEnabled = Boolean(window.JorPlatform?.hasFeature?.('developerGames'));
      const available = Boolean(App.ourGamesUrl);
      const disabled = !available || App.ourGamesLoading;
      const ariaDisabled = available && !App.ourGamesLoading ? 'false' : 'true';
      if (DOM.startOurGamesBtn) {
        DOM.startOurGamesBtn.hidden = !featureEnabled;
        DOM.startOurGamesBtn.disabled = disabled;
        DOM.startOurGamesBtn.setAttribute('aria-disabled', ariaDisabled);
      }
      if (DOM.messageOurGamesBtn) {
        const isCampaignAction = DOM.messageOurGamesBtn.dataset.action === 'nextCampaignRound';
        DOM.messageOurGamesBtn.hidden = !isCampaignAction && !featureEnabled;
        DOM.messageOurGamesBtn.disabled = isCampaignAction ? false : disabled;
        DOM.messageOurGamesBtn.setAttribute('aria-disabled', isCampaignAction ? 'false' : ariaDisabled);
      }
    }

    async function refreshOurGamesUrl() {
      if (!App.sdkReady || !window.JorPlatform?.hasFeature?.('developerGames')) {
        App.ourGamesUrl = null;
        updateOurGamesButtonState();
        return;
      }

      if (App.ourGamesLoading) return;
      App.ourGamesLoading = true;
      updateOurGamesButtonState();

      try {
        App.ourGamesUrl = await window.JorPlatform.getDeveloperGamesUrl() || null;
      } catch (error) {
        console.warn('Developer games request error:', error);
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
      showInterstitialBeforeTransition(returnToMainMenu);
    }

    function startNextCampaignRound() {
      if (App.gameMode !== 'campaign' || !App.campaignLevel) return;
      const nextLevel = Math.max(1, Math.floor(Number(App.campaignLevel) || 1) + 1);
      if (!window.JorCampaignLevels?.getLevel?.(nextLevel)) {
        returnToMainMenuFromRoundEnd();
        return;
      }
      showInterstitialBeforeTransition(() => {
        App.campaignLevel = nextLevel;
        App.campaignChapter = Math.max(0, Math.floor((nextLevel - 1) / 10));
        retryCurrentCampaignRound();
      });
    }

    function retryCurrentCampaignRound() {
      if (App.gameMode !== 'campaign' || !App.campaignLevel) return;
      App.pendingCampaignStart = false;
      App.hasStarted = true;
      App.localPause = false;
      hideCenterMessage();
      hideStartScreen();
      resetGame();
      ensureAmbientMusic();
      if (typeof showCampaignRoundIntro === 'function' && showCampaignRoundIntro()) return;
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
      if (campaignStart && typeof showCampaignRoundIntro === 'function' && showCampaignRoundIntro()) return;
      markGameplayStart();
    }

    function hideCenterMessage() {
      hideElement(DOM.centerMessage);
      DOM.centerMessage?.classList.remove('leaderboardDialog', 'levelFailedDialog', 'campaignCompleteDialog');
      if (DOM.messageRetryBtn) DOM.messageRetryBtn.hidden = true;
      if (DOM.messageOurGamesBtn) {
        DOM.messageOurGamesBtn.dataset.action = '';
        DOM.messageOurGamesBtn.hidden = false;
        DOM.messageOurGamesBtn.textContent = t('ourGames');
      }
      updateOurGamesButtonState();
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
      DOM.centerMessage.classList.remove('levelFailedDialog', 'campaignCompleteDialog');
      if (DOM.messageRetryBtn) DOM.messageRetryBtn.hidden = true;
      if (DOM.messageOurGamesBtn) {
        DOM.messageOurGamesBtn.dataset.action = '';
        DOM.messageOurGamesBtn.textContent = t('ourGames');
      }
      updateOurGamesButtonState();
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
      DOM.centerMessage.classList.remove('levelFailedDialog', 'campaignCompleteDialog');
      if (DOM.messageRetryBtn) DOM.messageRetryBtn.hidden = true;
      if (DOM.messageOurGamesBtn) {
        DOM.messageOurGamesBtn.dataset.action = '';
        DOM.messageOurGamesBtn.textContent = t('ourGames');
      }
      updateOurGamesButtonState();
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
      return `${minutes} : ${String(rest).padStart(2, '0')}`;
    }

    function getCampaignTimeExpiredText() {
      return currentLang === 'en' ? 'Time is up' : '\u0412\u0440\u0435\u043c\u044f \u0432\u044b\u0448\u043b\u043e';
    }

    function updateCampaignTimer() {
      if (!DOM.campaignTimer) return;
      const resultOpen = DOM.centerMessage?.classList?.contains('campaignCompleteDialog');
      const liveInfo = typeof getCampaignTimeInfo === 'function' ? getCampaignTimeInfo() : null;
      const resultInfo = resultOpen ? App.campaignResultTimeInfo : null;
      const info = liveInfo || resultInfo;
      const surviveLevel = App.gameMode === 'campaign' && campaignRun?.level?.type === 'survive';
      const visible = Boolean(!surviveLevel && info && App.hasStarted && !App.startScreenVisible && (!victory || resultOpen));
      DOM.campaignTimer.classList.toggle('visible', visible);
      DOM.campaignTimer.setAttribute('aria-hidden', visible ? 'false' : 'true');
      if (!visible) {
        DOM.campaignTimer.classList.remove('danger', 'expired');
        return;
      }
      const expired = !!info.expired || info.remainingFrames <= 0 || info.remainingSeconds <= 0;
      DOM.campaignTimer.textContent = expired ? getCampaignTimeExpiredText() : formatCampaignTimer(info.remainingSeconds);
      DOM.campaignTimer.classList.toggle('danger', !expired && info.progress <= 0.1);
      DOM.campaignTimer.classList.toggle('expired', expired);
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

