const FIXED_STEP_MS = 1000 / 60;
    const MAX_FRAME_DELTA_MS = 100;
    const MAX_CATCH_UP_STEPS = 5;
    let lastLoopTime = 0;
    let fixedStepAccumulator = 0;
    let simulationFrame = 0;
    let hudDirty = true;
    let lastHudRenderFrame = -999;

    function loop(timestamp = performance.now()) {
      frameTime = timestamp;

      if (!lastLoopTime) {
        lastLoopTime = timestamp;
      }

      let deltaMs = timestamp - lastLoopTime;
      lastLoopTime = timestamp;

      if (!Number.isFinite(deltaMs) || deltaMs < 0) {
        deltaMs = FIXED_STEP_MS;
      }

      deltaMs = Math.min(deltaMs, MAX_FRAME_DELTA_MS);
      fixedStepAccumulator += deltaMs;
      updateMobileControlsVisibility();
      if (typeof processRenderWarmupQueue === 'function') {
        const warmupIdle = App.startScreenVisible || App.localPause || App.platformPaused || App.userPaused;
        processRenderWarmupQueue(warmupIdle ? 4 : 0.75, warmupIdle ? 6 : 1);
      }

      let catchUpSteps = 0;
      try {
        while (fixedStepAccumulator >= FIXED_STEP_MS && catchUpSteps < MAX_CATCH_UP_STEPS) {
          updateGame();
          updateCamera();
          updateRenderBudget();
          fixedStepAccumulator -= FIXED_STEP_MS;
          catchUpSteps += 1;
        }
      } catch (error) {
        console.error('updateGame error:', error);
        fixedStepAccumulator = 0;
        if (DOM?.sdkStatus) {
          DOM.sdkStatus.textContent = `Update error: ${error?.message || error}`;
          DOM.sdkStatus.style.display = 'block';
        }
      }

      if (catchUpSteps >= MAX_CATCH_UP_STEPS) {
        fixedStepAccumulator = 0;
      }

      updatePerformanceQuality(deltaMs, catchUpSteps);
      try {
        drawGame();
      } catch (error) {
        console.error('drawGame error:', error);
        if (DOM?.sdkStatus) {
          DOM.sdkStatus.textContent = `Render error: ${error?.message || error}`;
          DOM.sdkStatus.style.display = 'block';
        }
      }
      requestAnimationFrame(loop);
    }

    // ------------------------------
    // РРЅРёС†РёР°Р»РёР·Р°С†РёСЏ UI
    // ------------------------------
    function setupUiEvents() {
      window.JorMetaUI?.init?.();
      window.JorCampaignUI?.init?.();
      window.JorShopUI?.init?.();
      setupStickyBannerResizeSync();
      DOM.rewardAdBtn?.addEventListener('click', showRewardedRerollAd);
          document.addEventListener('pointerdown', unlockAudio, { passive: true });
          document.addEventListener('touchstart', unlockAudio, { passive: true });

    document.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button) return;
      playButtonSound();
    });

DOM.startPlayBtn.addEventListener('click', startGameFromMenu);
      DOM.startOurGamesBtn?.addEventListener('click', openOurGames);
      DOM.messageOurGamesBtn?.addEventListener('click', () => {
        if (DOM.messageOurGamesBtn?.dataset?.action === 'nextCampaignRound') {
          startNextCampaignRound();
          return;
        }
        openOurGames();
      });

      DOM.restartBtn.addEventListener('click', () => {
        returnToMainMenuFromRoundEnd();
      });

      DOM.messageRetryBtn?.addEventListener('click', () => {
        retryCurrentCampaignRound();
      });

      // РљРЅРѕРїРєР° В«РџСЂРѕРґРѕР»Р¶РёС‚СЊВ» РЅР° РѕРІРµСЂР»РµРµ РїР°СѓР·С‹ вЂ” С‚Рѕ Р¶Рµ РґРµР№СЃС‚РІРёРµ, С‡С‚Рѕ ESC.
      if (DOM.pauseResumeBtn) {
        DOM.pauseResumeBtn.addEventListener('click', () => {
          setUserPaused(false);
        });
      }

      DOM.pauseExitBtn?.addEventListener('click', showExitConfirm);
      DOM.exitStayBtn?.addEventListener('click', hideExitConfirm);
      DOM.exitConfirmBtn?.addEventListener('click', confirmExitToMainMenu);
    }

    // ------------------------------
    // Р—Р°РїСѓСЃРє
    // ------------------------------
    setupInput();
    setupUiEvents();
    // РЎРЅР°С‡Р°Р»Р° СЃС‚Р°РІРёРј СЏР·С‹Рє РїРѕ URL / navigator РґРѕ РїРµСЂРІРѕР№ РѕС‚СЂРёСЃРѕРІРєРё,
    // С‡С‚РѕР±С‹ UI СЃСЂР°Р·Сѓ РїРѕСЏРІРёР»СЃСЏ РЅР° РїСЂР°РІРёР»СЊРЅРѕРј СЏР·С‹РєРµ Р±РµР· В«РјРёРіР°РЅРёСЏВ» ru в†’ en.
    currentLang = detectPreferredLanguage();
    document.documentElement.lang = currentLang;
    applyLocalization();
    initYandexSdk();
    resetGame();
    showStartScreen();
    loop();

