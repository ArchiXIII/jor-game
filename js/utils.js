let displayedTopScore = 0;
    let lastPoppedTopScore = 0;
    let topScorePopTimer = 0;
    let frameTime = 0;
    let fxShadowScale = 1;
    let renderDetailScale = 1;
    let simulationLoad = 0;
    let performanceQuality = 1;
    let averageFrameMs = 1000 / 60;
    const effectSpriteCache = new Map();
    const enemySpriteCache = new Map();
    const renderWarmupQueue = [];

    // ------------------------------
    // Общие утилиты
    // ------------------------------
    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function randomRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    function updatePerformanceQuality(deltaMs, catchUpSteps = 0) {
      if (!Number.isFinite(deltaMs) || deltaMs <= 0) return;

      const measuredFrame = clamp(deltaMs, 8, 80);
      averageFrameMs += (measuredFrame - averageFrameMs) * 0.055;

      const gameplayActive = App?.hasStarted && !App.localPause && !App.platformPaused && !App.userPaused;
      if (!gameplayActive) {
        performanceQuality += (1 - performanceQuality) * 0.012;
        performanceQuality = clamp(performanceQuality, 0.55, 1);
        return;
      }

      const touchBias = (typeof hasTouchControls === 'function' && hasTouchControls()) ? 1 : 0;
      const degradeAt = touchBias ? 20.5 : 22.5;
      const recoverAt = touchBias ? 17.2 : 18.2;
      const catchUpPressure = catchUpSteps >= 2;

      if (averageFrameMs > degradeAt || catchUpPressure) {
        performanceQuality -= catchUpPressure ? 0.018 : 0.01;
      } else if (averageFrameMs < recoverAt && catchUpSteps <= 1) {
        performanceQuality += 0.0045;
      }

      performanceQuality = clamp(performanceQuality, 0.55, 1);
    }

    function createSpriteCanvas(width, height, drawFn) {
      const sprite = document.createElement('canvas');
      sprite.width = Math.max(1, Math.ceil(width));
      sprite.height = Math.max(1, Math.ceil(height));
      const spriteCtx = sprite.getContext('2d');
      drawFn(spriteCtx, sprite.width, sprite.height);
      return sprite;
    }

    function drawSpriteCentered(sprite, x, y, width = sprite.width, height = sprite.height) {
      ctx.drawImage(sprite, x - width * 0.5, y - height * 0.5, width, height);
    }

    function getCachedEffectSprite(key, width, height, drawFn) {
      if (effectSpriteCache.has(key)) {
        const sprite = effectSpriteCache.get(key);
        effectSpriteCache.delete(key);
        effectSpriteCache.set(key, sprite);
        return sprite;
      }

      while (effectSpriteCache.size >= 384) {
        const oldestKey = effectSpriteCache.keys().next().value;
        if (oldestKey === undefined) break;
        effectSpriteCache.delete(oldestKey);
      }

      const sprite = createSpriteCanvas(width, height, drawFn);
      effectSpriteCache.set(key, sprite);
      return sprite;
    }

    function clearRenderWarmupQueue() {
      renderWarmupQueue.length = 0;
    }

    function scheduleRenderWarmupTask(task, priority = false) {
      if (typeof task === 'function') {
        if (priority) {
          renderWarmupQueue.unshift(task);
        } else {
          renderWarmupQueue.push(task);
        }
      }
    }

    function processRenderWarmupQueue(budgetMs = 1, maxTasks = 1) {
      if (!renderWarmupQueue.length) return 0;

      const start = performance.now();
      let processed = 0;
      while (renderWarmupQueue.length && processed < maxTasks) {
        const task = renderWarmupQueue.shift();
        task();
        processed += 1;
        if (performance.now() - start >= budgetMs) break;
      }
      return processed;
    }

    function clearRenderCaches() {
      effectSpriteCache.clear();
      enemySpriteCache.clear();
      clearRenderWarmupQueue();
    }

    function getFoodParticleSprite(tint, spark = false) {
      return getCachedEffectSprite(`food:${tint}:${spark ? 1 : 0}`, 28, 28, (spriteCtx, w, h) => {
        const cx = w * 0.5;
        const cy = h * 0.5;
        const r = 6.5;
        spriteCtx.save();
        spriteCtx.fillStyle = tint;
        spriteCtx.beginPath();
        spriteCtx.arc(cx, cy, r, 0, Math.PI * 2);
        spriteCtx.fill();
        spriteCtx.fillStyle = 'rgba(255,255,255,0.95)';
        spriteCtx.beginPath();
        spriteCtx.arc(cx - r * 0.28, cy - r * 0.28, r * 0.38, 0, Math.PI * 2);
        spriteCtx.fill();
        if (spark) {
          spriteCtx.strokeStyle = 'rgba(235,255,245,0.95)';
          spriteCtx.lineWidth = 1;
          spriteCtx.beginPath();
          spriteCtx.moveTo(cx - r * 0.9, cy);
          spriteCtx.lineTo(cx + r * 0.9, cy);
          spriteCtx.moveTo(cx, cy - r * 0.9);
          spriteCtx.lineTo(cx, cy + r * 0.9);
          spriteCtx.stroke();
        }
        spriteCtx.restore();
      });
    }

    function getEnemyParticleSprite(core, glow) {
      return getCachedEffectSprite(`enemy:${core}:${glow}`, 44, 30, (spriteCtx, w, h) => {
        const cx = w * 0.52;
        const cy = h * 0.5;
        spriteCtx.save();
        spriteCtx.fillStyle = glow;
        spriteCtx.beginPath();
        spriteCtx.ellipse(cx, cy, 12, 8, 0, 0, Math.PI * 2);
        spriteCtx.fill();
        spriteCtx.fillStyle = core;
        spriteCtx.beginPath();
        spriteCtx.ellipse(cx - 1.6, cy - 0.6, 8.6, 5.2, 0.3, 0, Math.PI * 2);
        spriteCtx.fill();
        spriteCtx.fillStyle = 'rgba(255,255,255,0.96)';
        spriteCtx.beginPath();
        spriteCtx.arc(cx - 5, cy - 3.6, 2.4, 0, Math.PI * 2);
        spriteCtx.fill();
        spriteCtx.restore();
      });
    }

    function getBurstSprite(kind) {
      return getCachedEffectSprite(`burst:${kind}`, kind === 'impact' ? 80 : 92, kind === 'impact' ? 80 : 92, (spriteCtx, w, h) => {
        const cx = w * 0.5;
        const cy = h * 0.5;
        spriteCtx.save();
        if (kind === 'impact') {
          spriteCtx.strokeStyle = 'rgba(255,155,175,0.95)';
          spriteCtx.lineWidth = 3;
          spriteCtx.beginPath();
          spriteCtx.ellipse(cx, cy, 28, 18, 0, 0, Math.PI * 2);
          spriteCtx.stroke();
          for (let i = 0; i < 4; i++) {
            const a = (Math.PI * 2 / 4) * i;
            spriteCtx.beginPath();
            spriteCtx.moveTo(cx + Math.cos(a) * 5, cy + Math.sin(a) * 5);
            spriteCtx.lineTo(cx + Math.cos(a) * 29, cy + Math.sin(a) * 20);
            spriteCtx.stroke();
          }
        } else {
          spriteCtx.strokeStyle = 'rgba(235,255,248,0.98)';
          spriteCtx.lineWidth = 3;
          spriteCtx.beginPath();
          spriteCtx.ellipse(cx, cy, 30, 22, 0, 0, Math.PI * 2);
          spriteCtx.stroke();
          spriteCtx.fillStyle = 'rgba(180,255,230,0.95)';
          spriteCtx.beginPath();
          spriteCtx.ellipse(cx, cy, 14, 10, 0, 0, Math.PI * 2);
          spriteCtx.fill();
        }
        spriteCtx.restore();
      });
    }

    function getRemainsSprite(kind = 'basic') {
      const colors = kind === 'shield'
        ? ['rgba(255,245,230,0.55)', 'rgba(180,255,245,0.16)']
        : ['rgba(255,180,170,0.55)', 'rgba(255,110,130,0.14)'];
      return getCachedEffectSprite(`remains:${kind}`, 52, 40, (spriteCtx, w, h) => {
        const pieces = [
          { x: 15, y: 20, rx: 10, ry: 6, rot: -0.35 },
          { x: 26, y: 16, rx: 9, ry: 5.5, rot: 0.18 },
          { x: 36, y: 21, rx: 7.5, ry: 5.8, rot: 0.52 },
        ];
        spriteCtx.save();
        for (const p of pieces) {
          const grad = spriteCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 12);
          grad.addColorStop(0, colors[0]);
          grad.addColorStop(1, colors[1]);
          spriteCtx.fillStyle = grad;
          spriteCtx.beginPath();
          spriteCtx.ellipse(p.x, p.y, p.rx, p.ry, p.rot, 0, Math.PI * 2);
          spriteCtx.fill();
        }
        spriteCtx.strokeStyle = 'rgba(255,245,250,0.16)';
        spriteCtx.lineWidth = 1;
        spriteCtx.beginPath();
        spriteCtx.moveTo(10, 20);
        spriteCtx.quadraticCurveTo(26, 16, 42, 20);
        spriteCtx.stroke();
        spriteCtx.restore();
      });
    }

    function distance(a, b) {
      return Math.hypot(a.x - b.x, a.y - b.y);
    }

    function distanceSq(a, b) {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      return dx * dx + dy * dy;
    }

    function isWithinDistance(a, b, range) {
      return distanceSq(a, b) < range * range;
    }

    function calculateLevelFromRadius(radius) {
      return Math.max(
        1,
        Math.min(
          GROWTH_CONFIG.TARGET_MAX_LEVEL,
          1 + Math.floor((radius - GROWTH_CONFIG.START_RADIUS) / GROWTH_CONFIG.LEVEL_RADIUS_STEP)
        )
      );
    }

    function calculateEnemyRadiusCap(player) {
      const absoluteCap = GROWTH_CONFIG.TARGET_MAX_RADIUS * (ENEMY_EVOLUTION_CONFIG.MAX_RADIUS_MULTIPLIER ?? 2);
      const hardCap = GROWTH_CONFIG.TARGET_MAX_RADIUS * ENEMY_EVOLUTION_CONFIG.HARD_CAP_MULTIPLIER;
      // Расширяем «окно» врагов вокруг игрока: до 1.20× его радиуса (было 1.12).
      // Это даёт больше враждебных целей около размера игрока — основной
      // источник тактических решений в фазе роста.
      const relativeCap = player.radius * 1.20 + 10;
      // Привязка к уровню сильнее: +2.2 px на уровень вместо +1.35 — масштаб
      // угроз растёт ощутимее по мере прогресса.
      const levelCap = GROWTH_CONFIG.START_RADIUS + player.level * 2.2 + 8;

      if (typeof endlessMode !== 'undefined' && endlessMode) {
        const endlessLevelProgress = clamp(
          (endlessLevel - 1) / Math.max(1, PROGRESSION_CONFIG.ENDLESS_LEVELS - 1),
          0,
          1
        );
        const endlessWaveProgress = Math.min(1, getEndlessWave() / 18);
        const endlessGrowth = Math.min(1, endlessLevelProgress * 0.72 + endlessWaveProgress * 0.28);
        const endlessCap = Math.min(
          GROWTH_CONFIG.TARGET_MAX_RADIUS * (1.72 + endlessGrowth * 0.7),
          Math.max(
            player.radius * (1.42 + endlessGrowth * 0.52) + 10 + endlessGrowth * 12,
            GROWTH_CONFIG.START_RADIUS + 22 + endlessGrowth * 26
          )
        );
        return Math.min(absoluteCap, Math.max(hardCap, endlessCap));
      }

      return Math.min(absoluteCap, hardCap, Math.max(30, relativeCap, levelCap));
    }

    function showElement(element) {
      element.style.display = 'block';
    }

    function hideElement(element) {
      element.style.display = 'none';
    }

    // ------------------------------
    // Бесконечный мир и камера
    // ------------------------------

