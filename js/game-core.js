// ------------------------------
    // Базовые ссылки на DOM
    // ------------------------------
    const DOM = {
      canvas: document.getElementById('game'),
      startScreen: document.getElementById('startScreen'),
      metaTopBar: document.getElementById('metaTopBar'),
      startBadge: document.getElementById('startBadge'),
      startTitle: document.getElementById('startTitle'),
      startSubtitle: document.getElementById('startSubtitle'),
      startPlayBtn: document.getElementById('startPlayBtn'),
      startCampaignBtn: document.getElementById('startCampaignBtn'),
      startShopBtn: document.getElementById('startShopBtn'),
      startOurGamesBtn: document.getElementById('startOurGamesBtn'),
      hudTitle: document.getElementById('hudTitle'),
      hudStats: document.getElementById('hudStats'),
      topProgress: document.getElementById('topProgress'),
      topProgressScore: document.getElementById('topProgressScore'),
      campaignTimer: document.getElementById('campaignTimer'),
      mobileControls: document.getElementById('mobileControls'),
      mobileStick: document.getElementById('mobileStick'),
      mobileStickKnob: document.getElementById('mobileStickKnob'),
      mobileDashBtn: document.getElementById('mobileDashBtn'),
      topControls: document.getElementById('topControls'),
      soundToggleBtn: document.getElementById('soundToggleBtn'),
      pauseToggleBtn: document.getElementById('pauseToggleBtn'),
      overlay: document.getElementById('overlay'),
      evolutionPanel: document.getElementById('evolutionPanel'),
      evolutionTitle: document.getElementById('evolutionTitle'),
      evolutionText: document.getElementById('evolutionText'),
      evolutionCards: document.getElementById('evolutionCards'),
      rewardAdBtn: document.getElementById('rewardAdBtn'),
      sdkStatus: document.getElementById('sdkStatus'),
      centerMessage: document.getElementById('centerMessage'),
      messageTitle: document.getElementById('messageTitle'),
      messageText: document.getElementById('messageText'),
      restartBtn: document.getElementById('restartBtn'),
      messageRetryBtn: document.getElementById('messageRetryBtn'),
      messageOurGamesBtn: document.getElementById('messageOurGamesBtn'),
      pauseOverlay: document.getElementById('pauseOverlay'),
      pauseTitle: document.getElementById('pauseTitle'),
      pauseHint: document.getElementById('pauseHint'),
      pauseResumeBtn: document.getElementById('pauseResumeBtn'),
      pauseExitBtn: document.getElementById('pauseExitBtn'),
      exitConfirmCard: document.getElementById('exitConfirmCard'),
      exitConfirmTitle: document.getElementById('exitConfirmTitle'),
      exitConfirmText: document.getElementById('exitConfirmText'),
      exitStayBtn: document.getElementById('exitStayBtn'),
      exitConfirmBtn: document.getElementById('exitConfirmBtn'),
    };

    const canvas = DOM.canvas;
    const ctx = canvas.getContext('2d');

    const WORLD_CONFIG = {
      CAMERA_LERP: 0.12,
      GRID_STEP: 180,
      SPAWN_MARGIN: 320,
      DESPAWN_MARGIN: 620,
      INITIAL_FILL_MARGIN: 240,
      SAFE_PLAYER_RADIUS: 220,
    };

    const world = { seed: 1 };
    const camera = { x: 0, y: 0, zoom: 1 };

    function updateWorldSize() {
      // Для бесконечного мира размеры не нужны, но хук сохраняем,
      // чтобы не ломать существующий жизненный цикл resize/reset.
    }

    function getViewBounds(margin = 0) {
      const zoom = camera.zoom || 1;
      const viewWidth = canvas.width / zoom;
      const viewHeight = canvas.height / zoom;
      return {
        left: camera.x - margin,
        right: camera.x + viewWidth + margin,
        top: camera.y - margin,
        bottom: camera.y + viewHeight + margin,
      };
    }

    function isWithinBounds(entity, bounds, padding = 0) {
      return (
        entity.x + padding >= bounds.left &&
        entity.x - padding <= bounds.right &&
        entity.y + padding >= bounds.top &&
        entity.y - padding <= bounds.bottom
      );
    }

    function isOutsideBounds(entity, bounds, padding = 0) {
      return !isWithinBounds(entity, bounds, padding);
    }

    function getProceduralDensityScale() {
      const referenceArea = 1600 * 900;
      const currentArea = Math.max(1, canvas.width * canvas.height);
      return clamp(currentArea / referenceArea, 0.78, 1.9);
    }

    function randomWorldPosition(padding = 0, bounds = null) {
      const targetBounds = bounds ?? getViewBounds(WORLD_CONFIG.INITIAL_FILL_MARGIN);

      return {
        x: randomRange(targetBounds.left + padding, targetBounds.right - padding),
        y: randomRange(targetBounds.top + padding, targetBounds.bottom - padding),
      };
    }

    function randomWorldPositionAwayFrom(target, minDistance, padding = 0, attempts = 18, bounds = null) {
      let bestPosition = randomWorldPosition(padding, bounds);
      let bestDistance = target ? Math.hypot(bestPosition.x - target.x, bestPosition.y - target.y) : Infinity;

      for (let i = 0; i < attempts; i++) {
        const candidate = randomWorldPosition(padding, bounds);
        if (!target) return candidate;

        const dist = Math.hypot(candidate.x - target.x, candidate.y - target.y);
        if (dist >= minDistance) {
          return candidate;
        }

        if (dist > bestDistance) {
          bestPosition = candidate;
          bestDistance = dist;
        }
      }

      return bestPosition;
    }

    function randomOffscreenWorldPosition({ padding = 0, minDistanceFromPlayer = 0, attempts = 24 } = {}) {
      const innerBounds = getViewBounds(Math.max(40, padding));
      const outerBounds = getViewBounds(WORLD_CONFIG.SPAWN_MARGIN);
      let bestCandidate = randomWorldPosition(padding, outerBounds);
      let bestDistance = player ? Math.hypot(bestCandidate.x - player.x, bestCandidate.y - player.y) : Infinity;

      for (let i = 0; i < attempts; i++) {
        const side = Math.floor(Math.random() * 4);
        let candidate;

        if (side === 0) {
          candidate = {
            x: randomRange(outerBounds.left + padding, outerBounds.right - padding),
            y: randomRange(outerBounds.top + padding, innerBounds.top - padding),
          };
        } else if (side === 1) {
          candidate = {
            x: randomRange(outerBounds.left + padding, outerBounds.right - padding),
            y: randomRange(innerBounds.bottom + padding, outerBounds.bottom - padding),
          };
        } else if (side === 2) {
          candidate = {
            x: randomRange(outerBounds.left + padding, innerBounds.left - padding),
            y: randomRange(outerBounds.top + padding, outerBounds.bottom - padding),
          };
        } else {
          candidate = {
            x: randomRange(innerBounds.right + padding, outerBounds.right - padding),
            y: randomRange(outerBounds.top + padding, outerBounds.bottom - padding),
          };
        }

        if (!Number.isFinite(candidate.x) || !Number.isFinite(candidate.y)) {
          continue;
        }

        if (!player) {
          return candidate;
        }

        const dist = Math.hypot(candidate.x - player.x, candidate.y - player.y);
        if (dist >= minDistanceFromPlayer) {
          return candidate;
        }

        if (dist > bestDistance) {
          bestCandidate = candidate;
          bestDistance = dist;
        }
      }

      return bestCandidate;
    }

    function screenToWorld(screenX, screenY) {
      const zoom = camera.zoom || 1;
      return {
        x: camera.x + screenX / zoom,
        y: camera.y + screenY / zoom,
      };
    }

    function getGrowthCameraProgress(radius = player?.radius ?? GROWTH_CONFIG.START_RADIUS) {
      const growthProgress = clamp(
        (radius - GROWTH_CONFIG.START_RADIUS) /
          Math.max(1, GROWTH_CONFIG.TARGET_MAX_RADIUS - GROWTH_CONFIG.START_RADIUS),
        0,
        1
      );
      return 1 - Math.pow(1 - growthProgress, 1.45);
    }

    function getCameraTargetZoom() {
      const cameraRadius = player?.cameraRadius ?? player?.radius ?? GROWTH_CONFIG.START_RADIUS;
      const growthZoom = lerp(1, ENDLESS_CONFIG.CAMERA_GROWTH_ZOOM_OUT, getGrowthCameraProgress(cameraRadius));
      const endlessZoom = hasTouchControls()
        ? (ENDLESS_CONFIG.CAMERA_ENDLESS_MOBILE_ZOOM_OUT ?? ENDLESS_CONFIG.CAMERA_ENDLESS_ZOOM_OUT)
        : ENDLESS_CONFIG.CAMERA_ENDLESS_ZOOM_OUT;
      return endlessMode
        ? lerp(growthZoom, endlessZoom, endlessTransition)
        : growthZoom;
    }

    function getWorldSpeedScale() {
      const visibleFieldScale = 1 / Math.max(0.1, getCameraTargetZoom());
      const boostedScale = 1 + (visibleFieldScale - 1) * ENDLESS_CONFIG.WORLD_SPEED_SCALE_STRENGTH;
      return clamp(boostedScale, 1, ENDLESS_CONFIG.WORLD_SPEED_SCALE_MAX);
    }

    function updateCamera(force = false) {
      if (!player) return;

      const targetZoom = getCameraTargetZoom();
      const viewWidth = canvas.width / targetZoom;
      const viewHeight = canvas.height / targetZoom;
      const targetX = player.x - viewWidth * 0.5;
      const targetY = player.y - viewHeight * 0.5;

      if (force) {
        camera.zoom = targetZoom;
        camera.x = targetX;
        camera.y = targetY;
        return;
      }

      camera.zoom += (targetZoom - camera.zoom) * ENDLESS_CONFIG.CAMERA_ZOOM_LERP;
      camera.x += (targetX - camera.x) * WORLD_CONFIG.CAMERA_LERP;
      camera.y += (targetY - camera.y) * WORLD_CONFIG.CAMERA_LERP;
    }

    function getBackgroundEffectTargets() {
      const density = getProceduralDensityScale();
      const quality = typeof performanceQuality === 'number' ? performanceQuality : 1;
      const isTouch = hasTouchControls();
      const ambientScale = isTouch ? 0.52 : 1;
      const glowScale = isTouch ? 0.34 : 0.82;
      const bubbleScale = isTouch ? 0.68 : 0.92;
      const bloomScale = isTouch ? 0.16 : 0.54;
      const lowQualityBloomScale = quality < 0.78 ? clamp((quality - 0.55) / 0.23, 0, 1) : 1;
      const baseTargets = {
        ambient: Math.max(isTouch ? 22 : 34, Math.min(BACKGROUND_EFFECT_LIMITS.AMBIENT_MAX, Math.round(72 * density * quality * ambientScale))),
        glow: isTouch ? 0 : Math.max(7, Math.min(BACKGROUND_EFFECT_LIMITS.GLOW_MAX, Math.round(24 * density * quality * glowScale))),
        bubble: Math.max(isTouch ? 10 : 14, Math.min(BACKGROUND_EFFECT_LIMITS.BUBBLE_MAX, Math.round(34 * density * quality * bubbleScale))),
        bloom: Math.max(isTouch ? 0 : 4, Math.min(BACKGROUND_EFFECT_LIMITS.BLOOM_MAX, Math.round(20 * density * quality * bloomScale * lowQualityBloomScale))),
      };

      const total = baseTargets.ambient + baseTargets.glow + baseTargets.bubble + baseTargets.bloom;
      const totalMax = isTouch
        ? Math.round(BACKGROUND_EFFECT_LIMITS.TOTAL_MAX * 0.42)
        : BACKGROUND_EFFECT_LIMITS.TOTAL_MAX;
      if (total <= totalMax) return baseTargets;

      const scale = totalMax / total;
      return {
        ambient: Math.max(isTouch ? 22 : 34, Math.min(BACKGROUND_EFFECT_LIMITS.AMBIENT_MAX, Math.round(baseTargets.ambient * scale))),
        glow: isTouch ? 0 : Math.max(7, Math.min(BACKGROUND_EFFECT_LIMITS.GLOW_MAX, Math.round(baseTargets.glow * scale))),
        bubble: Math.max(isTouch ? 10 : 14, Math.min(BACKGROUND_EFFECT_LIMITS.BUBBLE_MAX, Math.round(baseTargets.bubble * scale))),
        bloom: Math.max(isTouch ? 0 : 4, Math.min(BACKGROUND_EFFECT_LIMITS.BLOOM_MAX, Math.round(baseTargets.bloom * scale))),
      };
    }

    function getAmbientParticleCount() {
      return getBackgroundEffectTargets().ambient;
    }

    function getBackgroundGlowCount() {
      return getBackgroundEffectTargets().glow;
    }

    function getBackgroundBubbleCount() {
      return getBackgroundEffectTargets().bubble;
    }

    function getBackgroundBloomCount() {
      return getBackgroundEffectTargets().bloom;
    }

    function getCampaignLevelBalance() {
      if (App.gameMode !== 'campaign') return null;
      if (typeof getActiveCampaignLevel === 'function') {
        return getActiveCampaignLevel();
      }
      return window.JorCampaignLevels?.getLevel?.(App.campaignLevel) || null;
    }

    function getTargetFoodCount() {
      // Снижено с 38/96 до 24/64: еда больше не «фон», её надо искать.
      // На макс-плотности всё ещё ~64 единицы — достаточно, чтобы не было
      // голода, но недостаточно, чтобы стоять на месте.
      const base = Math.max(24, Math.min(64, Math.round(32 * getProceduralDensityScale())));
      const campaignLevel = getCampaignLevelBalance();
      return campaignLevel ? Math.max(16, Math.round(base * (campaignLevel.foodFactor || 1))) : base;
    }

    function getInitialEnemyCount() {
      const base = Math.max(6, Math.min(14, Math.round(8 * getProceduralDensityScale())));
      const campaignLevel = getCampaignLevelBalance();
      return campaignLevel ? Math.max(2, Math.round(base * (campaignLevel.enemyFactor || 1))) : base;
    }

    function getTargetEnemyCount() {
      // Чуть больше базы, чуть выше потолок — больше «жизни» в зоне видимости.
      const baseEnemies = 8 + Math.min(12, Math.floor((player?.level ?? 1) * 0.9));
      const base = Math.max(9, Math.min(26, Math.round(baseEnemies * getProceduralDensityScale())));
      const campaignLevel = getCampaignLevelBalance();
      return campaignLevel ? Math.max(3, Math.min(22, Math.round(base * (campaignLevel.enemyFactor || 1)))) : base;
    }

    function getTargetDnaCount() {
      if (endlessMode) {
        const density = getProceduralDensityScale();
        return Math.max(8, Math.min(18, Math.round(8 + Math.sqrt(density) * 4.5)));
      }
      // Снижено с 4/12 до 2/6: DNA-орб стал ценнее (×3 рост) — должен быть
      // редким событием, а не россыпью на каждом шагу.
      const base = Math.max(2, Math.min(6, Math.round(2 + Math.sqrt(getProceduralDensityScale()) * 1.4)));
      const campaignLevel = getCampaignLevelBalance();
      return campaignLevel ? Math.max(1, Math.min(10, Math.round(base * (campaignLevel.dnaFactor || 1)))) : base;
    }

    function getFoodSpawnBatchSize() {
      return Math.max(2, Math.min(6, Math.ceil(getProceduralDensityScale() * 1.8)));
    }

    function drawWorldGrid() {
      const visibleBounds = getViewBounds(0);
      const step = WORLD_CONFIG.GRID_STEP;

      ctx.save();
      ctx.strokeStyle = 'rgba(120, 200, 225, 0.05)';
      ctx.lineWidth = 1;

      const startX = Math.floor(visibleBounds.left / step) * step;
      const endX = Math.ceil(visibleBounds.right / step) * step;
      for (let x = startX; x <= endX; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, visibleBounds.top);
        ctx.lineTo(x, visibleBounds.bottom);
        ctx.stroke();
      }

      const startY = Math.floor(visibleBounds.top / step) * step;
      const endY = Math.ceil(visibleBounds.bottom / step) * step;
      for (let y = startY; y <= endY; y += step) {
        ctx.beginPath();
        ctx.moveTo(visibleBounds.left, y);
        ctx.lineTo(visibleBounds.right, y);
        ctx.stroke();
      }

      ctx.restore();
    }

    // ------------------------------
    // Канвас и ввод
    // ------------------------------
    function getViewportSize() {
      const viewport = window.visualViewport;
      const innerWidth = Math.max(1, Math.round(window.innerWidth || document.documentElement.clientWidth || 1));
      const innerHeight = Math.max(1, Math.round(window.innerHeight || document.documentElement.clientHeight || 1));

      if (viewport) {
        let width = Math.max(1, Math.round(viewport.width));
        let height = Math.max(1, Math.round(viewport.height));
        const screenIsLandscape = window.screen?.orientation?.type?.includes('landscape') || window.matchMedia?.('(orientation: landscape)')?.matches;
        const viewportLooksPortrait = height > width;
        const innerLooksLandscape = innerWidth > innerHeight;

        if (screenIsLandscape && viewportLooksPortrait && innerLooksLandscape) {
          width = innerWidth;
          height = innerHeight;
        } else {
          width = Math.max(width, innerWidth);
          height = Math.max(height, innerHeight);
        }

        return {
          width,
          height,
          offsetLeft: Math.round(viewport.offsetLeft || 0),
          offsetTop: Math.round(viewport.offsetTop || 0),
        };
      }

      return {
        width: innerWidth,
        height: innerHeight,
        offsetLeft: 0,
        offsetTop: 0,
      };
    }

    function resetViewportScroll() {
      try { window.scrollTo(0, 0); } catch (error) {}
      try { document.documentElement.scrollLeft = 0; } catch (error) {}
      try { document.documentElement.scrollTop = 0; } catch (error) {}
      try { document.body.scrollLeft = 0; } catch (error) {}
      try { document.body.scrollTop = 0; } catch (error) {}
    }

    function syncViewportMetrics(viewport = getViewportSize()) {
      const rootStyle = document.documentElement.style;
      rootStyle.setProperty('--app-vw', `${viewport.width}px`);
      rootStyle.setProperty('--app-vh', `${viewport.height}px`);
      rootStyle.setProperty('--vv-left-neg', `${-viewport.offsetLeft}px`);
      rootStyle.setProperty('--vv-top-neg', `${-viewport.offsetTop}px`);
      resetViewportScroll();
    }

    function resizeCanvas() {
      const viewport = getViewportSize();
      syncViewportMetrics(viewport);
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      updateWorldSize();
      resetMobileStick();

      if (player) {
        updateCamera(true);
      }
    }

    let viewportStabilizeSequence = 0;

    function stabilizeViewportAfterResize() {
      const sequence = ++viewportStabilizeSequence;
      resizeCanvas();
      requestAnimationFrame(() => {
        if (sequence === viewportStabilizeSequence) resizeCanvas();
      });
      setTimeout(() => {
        if (sequence === viewportStabilizeSequence) resizeCanvas();
      }, 80);
      setTimeout(() => {
        if (sequence === viewportStabilizeSequence) resizeCanvas();
      }, 260);
      setTimeout(() => {
        if (sequence === viewportStabilizeSequence) resizeCanvas();
      }, 620);
    }

    const initialViewport = getViewportSize();
    const pointer = { x: initialViewport.width / 2, y: initialViewport.height / 2 };
    let dashRequested = false;
    const mobileControl = {
      enabled: false,
      pointerId: null,
      centerX: 0,
      centerY: 0,
      x: 0,
      y: 0,
      strength: 0,
    };

    function updatePointerPosition(x, y) {
      pointer.x = x;
      pointer.y = y;
    }

    function hasTouchControls() {
      const coarsePrimary = window.matchMedia?.('(hover: none), (pointer: coarse)')?.matches ?? false;
      const viewport = getViewportSize();
      const compactTouchScreen = (navigator.maxTouchPoints || 0) > 0 && Math.min(viewport.width, viewport.height) <= 900;
      return coarsePrimary || compactTouchScreen;
    }

    function isGameplayBlocked() {
      return evolutionPending || App.localPause || App.platformPaused || App.userPaused || gameOver || victory;
    }

    function requestDashIfAllowed() {
      if (!isGameplayBlocked() && player?.hasDash && player.dashCooldown <= 0 && player.dashTime <= 0) {
        dashRequested = true;
      }
    }

    function isGameplayTouchTarget(target) {
      return target === canvas || target?.closest?.('.mobileControls') || target?.closest?.('.topControls');
    }

    function isTopControlTarget(target) {
      return Boolean(target?.closest?.('.topControls'));
    }

    function shouldIgnorePointerEvent(event) {
      if (event.pointerType === 'mouse') return false;
      return !isGameplayTouchTarget(event.target);
    }

    function setMobileControlsVisible(visible, inputEnabled = visible) {
      if (!DOM.mobileControls) return;
      DOM.mobileControls.classList.toggle('active', visible);
      DOM.mobileControls.classList.toggle('visualHidden', visible && !inputEnabled);
      DOM.mobileControls.setAttribute('aria-hidden', visible ? 'false' : 'true');
      if (DOM.mobileDashBtn) {
        DOM.mobileDashBtn.hidden = !visible || !(player?.hasDash);
        const dashCoolingDown = Boolean(player?.hasDash && (player.dashCooldown > 0 || player.dashTime > 0));
        DOM.mobileDashBtn.classList.toggle('cooldown', inputEnabled && dashCoolingDown);
        DOM.mobileDashBtn.setAttribute('aria-disabled', inputEnabled && dashCoolingDown ? 'true' : 'false');
      }
      mobileControl.enabled = inputEnabled;
      if (!inputEnabled) {
        resetMobileStick();
      }
    }

    function updateAudioToggleButton() {
      if (!DOM.soundToggleBtn) return;
      const muted = Boolean(AUDIO?.muted);
      DOM.soundToggleBtn.classList.toggle('muted', muted);
      DOM.soundToggleBtn.setAttribute('aria-label', muted ? 'Sound off' : 'Sound on');
      DOM.soundToggleBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    }

    function updateTopControlsVisibility() {
      if (!DOM.topControls) return;
      const visible = App.hasStarted && !App.startScreenVisible && !gameOver && !victory && !evolutionPending && !App.platformPaused;
      DOM.topControls.classList.toggle('active', visible);
      DOM.topControls.setAttribute('aria-hidden', visible ? 'false' : 'true');
      if (DOM.pauseToggleBtn) {
        DOM.pauseToggleBtn.textContent = App.userPaused ? '>' : 'II';
        DOM.pauseToggleBtn.setAttribute('aria-label', App.userPaused ? 'Resume' : 'Pause');
      }
      updateAudioToggleButton();
    }

    function updateMobileControlsVisibility() {
      const keepReady = hasTouchControls() && App.hasStarted && !App.startScreenVisible && !gameOver && !victory && !App.platformPaused;
      setMobileControlsVisible(keepReady, keepReady && !isGameplayBlocked());
      updateTopControlsVisibility();
    }

    function resetMobileStick() {
      mobileControl.pointerId = null;
      mobileControl.x = 0;
      mobileControl.y = 0;
      mobileControl.strength = 0;
      if (DOM.mobileStickKnob) {
        DOM.mobileStickKnob.style.transform = 'translate(-50%, -50%)';
      }
    }

    function updateMobileStickFromEvent(event) {
      if (!DOM.mobileStick) return;
      const rect = DOM.mobileStick.getBoundingClientRect();
      mobileControl.centerX = rect.left + rect.width * 0.5;
      mobileControl.centerY = rect.top + rect.height * 0.5;

      const maxRadius = Math.max(1, rect.width * 0.34);
      const deadZone = 0.17;
      const rawX = event.clientX - mobileControl.centerX;
      const rawY = event.clientY - mobileControl.centerY;
      const dist = Math.hypot(rawX, rawY);
      const rawStrength = clamp(dist / maxRadius, 0, 1);
      const activeStrength = rawStrength <= deadZone
        ? 0
        : clamp((rawStrength - deadZone) / (1 - deadZone), 0, 1);
      const directionX = dist > 0 ? rawX / dist : 0;
      const directionY = dist > 0 ? rawY / dist : 0;
      const knobDistance = activeStrength * maxRadius;
      const knobX = directionX * knobDistance;
      const knobY = directionY * knobDistance;

      mobileControl.x = directionX * activeStrength;
      mobileControl.y = directionY * activeStrength;
      mobileControl.strength = activeStrength;

      if (DOM.mobileStickKnob) {
        DOM.mobileStickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
      }
    }

    function updatePointerFromMobileControl() {
      if (!mobileControl.enabled || !player) return;
      const playerScreenX = (player.x - camera.x) * (camera.zoom || 1);
      const playerScreenY = (player.y - camera.y) * (camera.zoom || 1);
      if (mobileControl.strength <= 0.01) {
        updatePointerPosition(playerScreenX, playerScreenY);
        return;
      }
      const lookAhead = 170 + mobileControl.strength * 110;
      updatePointerPosition(
        playerScreenX + mobileControl.x * lookAhead,
        playerScreenY + mobileControl.y * lookAhead
      );
    }

    function setupInput() {
      window.addEventListener('resize', stabilizeViewportAfterResize);
      window.addEventListener('orientationchange', stabilizeViewportAfterResize);
      window.visualViewport?.addEventListener('resize', stabilizeViewportAfterResize);
      window.visualViewport?.addEventListener('scroll', stabilizeViewportAfterResize);
      stabilizeViewportAfterResize();

      window.addEventListener('mousemove', (event) => {
        updatePointerPosition(event.clientX, event.clientY);
      });

      window.addEventListener('pointermove', (event) => {
        if (event.pointerType !== 'mouse' && mobileControl.enabled) return;
        if (shouldIgnorePointerEvent(event)) return;
        updatePointerPosition(event.clientX, event.clientY);
      }, { passive: true });

      window.addEventListener('touchmove', (event) => {
        if (mobileControl.enabled) return;
        const touch = event.touches[0];
        if (!touch) return;
        updatePointerPosition(touch.clientX, touch.clientY);
      }, { passive: true });

      window.addEventListener('mousedown', (event) => {
        if (isTopControlTarget(event.target)) return;
        if (event.button === 0) {
          requestDashIfAllowed();
        }
      });

      window.addEventListener('pointerdown', (event) => {
        if (shouldIgnorePointerEvent(event)) return;
        if (event.target?.closest?.('.mobileControls')) return;
        if (isTopControlTarget(event.target)) return;
        if (event.pointerType !== 'mouse') {
          updatePointerPosition(event.clientX, event.clientY);
        }
      }, { passive: true });

      window.addEventListener('touchstart', (event) => {
        if (mobileControl.enabled) return;
        const touch = event.touches[0];
        if (!touch) return;
        updatePointerPosition(touch.clientX, touch.clientY);
      }, { passive: true });

      if (DOM.mobileStick) {
        DOM.mobileStick.addEventListener('pointerdown', (event) => {
          if (!mobileControl.enabled || mobileControl.pointerId !== null) return;
          event.preventDefault();
          mobileControl.pointerId = event.pointerId;
          DOM.mobileStick.setPointerCapture?.(event.pointerId);
          updateMobileStickFromEvent(event);
        });

        DOM.mobileStick.addEventListener('pointermove', (event) => {
          if (event.pointerId !== mobileControl.pointerId) return;
          event.preventDefault();
          updateMobileStickFromEvent(event);
        });

        const releaseStick = (event) => {
          if (event.pointerId !== mobileControl.pointerId) return;
          event.preventDefault();
          DOM.mobileStick.releasePointerCapture?.(event.pointerId);
          resetMobileStick();
        };

        DOM.mobileStick.addEventListener('pointerup', releaseStick);
        DOM.mobileStick.addEventListener('pointercancel', releaseStick);
      }

      if (DOM.mobileDashBtn) {
        DOM.mobileDashBtn.addEventListener('pointerdown', (event) => {
          if (!mobileControl.enabled) return;
          event.preventDefault();
          requestDashIfAllowed();
        });
      }

      if (DOM.pauseToggleBtn) {
        DOM.pauseToggleBtn.addEventListener('pointerdown', (event) => {
          event.preventDefault();
          togglePause();
        });
      }

      if (DOM.soundToggleBtn) {
        DOM.soundToggleBtn.addEventListener('pointerdown', (event) => {
          event.preventDefault();
          toggleAudioMuted();
          updateAudioToggleButton();
        });
      }

      document.addEventListener('gesturestart', (event) => {
        event.preventDefault();
      });

      document.addEventListener('touchmove', (event) => {
        if (event.target === canvas) {
          event.preventDefault();
        }
      }, { passive: false });

      document.addEventListener('touchstart', (event) => {
        if (event.target === canvas) {
          event.preventDefault();
        }
      }, { passive: false });

      window.addEventListener('contextmenu', (event) => {
        event.preventDefault();
      });

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          handlePlatformPause();
        } else {
          handlePlatformResume();
        }
      });

      window.addEventListener('pagehide', () => {
        handlePlatformPause();
      });

      window.addEventListener('pageshow', () => {
        handlePlatformResume();
      });

      window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' || event.key === 'Esc') {
          // Не блокируем нативный ESC (выход из fullscreen и т.п.) — только
          // переключаем паузу. Браузер сам решит, выходить из fullscreen или нет.
          togglePause();
          return;
        }
        if (event.key.toLowerCase() === 'r') {
          resetGame();
        }
      });
    }

    // ------------------------------
    // Настройки прогрессии и баланса
    // ------------------------------
    // -----------------------------------------------------------------------
    // БАЛАНС РОСТА (ребаланс)
    // Цели:
    //  • Сделать диапазон размера ощутимым (×4.6 от старта вместо ×2.78).
    //  • Сократить количество уровней до 20, но каждый — заметный скачок.
    //  • Снизить «грайнд» в конце фазы: smooth softness вместо обрыва.
    // Шаг уровня:  (64 - 14) / 19 ≈ 2.63 px — визуально различимый рост
    //              при апгрейде (раньше было 1.1 px — почти незаметно).
