let ambientParticles = [];
    let backgroundGlows = [];
    let backgroundBubbles = [];
    let backgroundBlooms = [];
    let backgroundLightingSprite = null;
    let backgroundLightingKey = '';
    const BACKGROUND_EFFECT_LIMITS = {
      TOTAL_MAX: 80,
      AMBIENT_MAX: 48,
      GLOW_MAX: 8,
      BUBBLE_MAX: 20,
      BLOOM_MAX: 5,
    };

    function getBackgroundLightingSprite(width, height) {
      const touch = typeof hasTouchControls === 'function' && hasTouchControls();
      const maxSide = touch ? 512 : 768;
      const scale = Math.min(1, maxSide / Math.max(width, height));
      const spriteWidth = Math.max(1, Math.round(width * scale));
      const spriteHeight = Math.max(1, Math.round(height * scale));
      const key = `${width}:${height}:${touch ? 1 : 0}`;
      if (backgroundLightingSprite && backgroundLightingKey === key) return backgroundLightingSprite;

      backgroundLightingKey = key;
      backgroundLightingSprite = createSpriteCanvas(spriteWidth, spriteHeight, (spriteCtx, w, h) => {
        const centerX = w * 0.5;
        const centerY = h * 0.5;
        const viewMax = Math.max(w, h);
        const innerRadius = Math.max(18, Math.min(w, h) * 0.12);

        spriteCtx.fillStyle = '#09111a';
        spriteCtx.fillRect(0, 0, w, h);

        const mainLight = spriteCtx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, viewMax * 1.02);
        mainLight.addColorStop(0, '#3a7890');
        mainLight.addColorStop(0.28, '#255569');
        mainLight.addColorStop(0.62, '#123247');
        mainLight.addColorStop(1, '#08131f');
        spriteCtx.fillStyle = mainLight;
        spriteCtx.fillRect(0, 0, w, h);

        const upperLight = spriteCtx.createLinearGradient(0, 0, 0, h);
        upperLight.addColorStop(0, 'rgba(180, 255, 245, 0.16)');
        upperLight.addColorStop(0.34, 'rgba(150, 235, 255, 0.08)');
        upperLight.addColorStop(1, 'rgba(0, 0, 0, 0)');
        spriteCtx.fillStyle = upperLight;
        spriteCtx.fillRect(0, 0, w, h);

        const bioLightX = centerX - w * 0.12;
        const bioLightY = centerY - h * 0.08;
        const bioLight = spriteCtx.createRadialGradient(bioLightX, bioLightY, 0, bioLightX, bioLightY, viewMax * 0.7);
        bioLight.addColorStop(0, 'rgba(110, 255, 225, 0.16)');
        bioLight.addColorStop(0.42, 'rgba(90, 235, 210, 0.08)');
        bioLight.addColorStop(1, 'rgba(0, 0, 0, 0)');
        spriteCtx.fillStyle = bioLight;
        spriteCtx.fillRect(0, 0, w, h);

        const magicLightX = centerX + w * 0.18;
        const magicLightY = centerY + h * 0.03;
        const magicLight = spriteCtx.createRadialGradient(magicLightX, magicLightY, 0, magicLightX, magicLightY, viewMax * 0.58);
        magicLight.addColorStop(0, 'rgba(215, 150, 255, 0.14)');
        magicLight.addColorStop(0.36, 'rgba(170, 120, 255, 0.08)');
        magicLight.addColorStop(1, 'rgba(0, 0, 0, 0)');
        spriteCtx.fillStyle = magicLight;
        spriteCtx.fillRect(0, 0, w, h);
      });

      return backgroundLightingSprite;
    }

function createAmbientParticleAt(x, y) {
      return new Particle(
        x,
        y,
        randomRange(1.5, 3.5),
        `rgba(${70 + Math.floor(Math.random() * 60)}, ${150 + Math.floor(Math.random() * 95)}, ${185 + Math.floor(Math.random() * 70)}, 1)`,
        randomRange(0.2, 0.62)
      );
    }

    function createFoodAt(x, y, deferSprite = true) {
      const food = new Food({ deferSprite });
      food.x = x;
      food.y = y;
      return food;
    }

    function createDnaOrbAt(x, y, deferSprite = true) {
      const orb = new DNAOrb(x, y, endlessMode ? ENDLESS_CONFIG.ENDLESS_DNA_RADIUS : undefined, { deferSprite });
      orb.pulse = Math.random() * Math.PI * 2;
      return orb;
    }

    function createTomatoFoodAt(x, y, deferSprite = true) {
      return new TomatoFood(x, y, { deferSprite, radius: endlessMode ? 14 : 12 });
    }

    function createEnemyAt(x, y, sizeFactor = 1) {
      const enemy = createEnemy(sizeFactor);
      enemy.x = x;
      enemy.y = y;
      return typeof tuneEnemyForEndless === 'function' ? tuneEnemyForEndless(enemy) : enemy;
    }

    function createBackgroundGlowAt(x, y) {
      return new BackgroundGlow(x, y);
    }

    function createBackgroundBubbleAt(x, y) {
      return new BackgroundBubble(x, y);
    }

    function createBackgroundBloomAt(x, y) {
      return new BackgroundBloom(x, y);
    }

    function setupAmbient() {
      ambientParticles = [];
      backgroundGlows = [];
      backgroundBubbles = [];
      backgroundBlooms = [];
      const bounds = getViewBounds(WORLD_CONFIG.SPAWN_MARGIN + 220);
      const effectTargets = getBackgroundEffectTargets();

      for (let i = 0; i < effectTargets.ambient; i++) {
        ambientParticles.push(createAmbientParticleAt(
          randomRange(bounds.left, bounds.right),
          randomRange(bounds.top, bounds.bottom)
        ));
      }

      for (let i = 0; i < effectTargets.glow; i++) {
        backgroundGlows.push(createBackgroundGlowAt(
          randomRange(bounds.left, bounds.right),
          randomRange(bounds.top, bounds.bottom)
        ));
      }

      for (let i = 0; i < effectTargets.bubble; i++) {
        backgroundBubbles.push(createBackgroundBubbleAt(
          randomRange(bounds.left, bounds.right),
          randomRange(bounds.top, bounds.bottom)
        ));
      }

      for (let i = 0; i < effectTargets.bloom; i++) {
        backgroundBlooms.push(createBackgroundBloomAt(
          randomRange(bounds.left, bounds.right),
          randomRange(bounds.top, bounds.bottom)
        ));
      }
    }

    function seedInitialEntities() {
      const initialBounds = getViewBounds(WORLD_CONFIG.INITIAL_FILL_MARGIN);

      for (let i = 0; i < getTargetFoodCount(); i++) {
        const spawn = randomWorldPosition(24, initialBounds);
        foods.push(createFoodAt(spawn.x, spawn.y));
      }

      for (let i = 0; i < getInitialEnemyCount(); i++) {
        const spawn = randomWorldPositionAwayFrom(player, 220, 30, 20, initialBounds);
        enemies.push(createEnemyAt(spawn.x, spawn.y, 1));
      }

      for (let i = 0; i < getTargetDnaCount(); i++) {
        const spawn = randomWorldPosition(40, initialBounds);
        dnaOrbs.push(createDnaOrbAt(spawn.x, spawn.y));
      }
    }

    function warmFoodSprite(food) {
      if (!food || food.sprite) return;
      food.sprite = food.createSprite();
    }

    function warmDnaOrbSprite(orb) {
      if (!orb || orb.sprite) return;
      orb.sprite = orb.createSprite();
    }

    function warmTomatoFoodSprite(tomato) {
      if (!tomato || tomato.sprite) return;
      tomato.sprite = tomato.createSprite();
    }

    function warmEnemyBodySprite(enemy) {
      if (!enemy || typeof enemy.getCachedBodySprite !== 'function') return;
      if (enemy instanceof ShieldEnemy) {
        enemy.getCachedBodySprite(
          enemy.hasShield
            ? ENEMY_SHIELD_FILL_COLORS
            : ENEMY_SHIELD_BROKEN_FILL_COLORS,
          ENEMY_SHIELD_EYE_COLOR
        );
        return;
      }
      enemy.getCachedBodySprite(
        ENEMY_BASIC_FILL_COLORS,
        ENEMY_BASIC_EYE_COLOR
      );
    }

    function scheduleRoundRenderWarmup() {
      if (typeof clearRenderWarmupQueue === 'function') clearRenderWarmupQueue();
      if (typeof scheduleRenderWarmupTask !== 'function') return;

      scheduleRenderWarmupTask(() => {
        if (typeof getBakedPlayerBodySprite === 'function') getBakedPlayerBodySprite();
      });

      for (const enemy of enemies) {
        scheduleRenderWarmupTask(() => warmEnemyBodySprite(enemy), true);
      }

      for (const orb of dnaOrbs) {
        scheduleRenderWarmupTask(() => warmDnaOrbSprite(orb));
      }

      for (const tomato of tomatoFoods) {
        scheduleRenderWarmupTask(() => warmTomatoFoodSprite(tomato));
      }

      for (const food of foods) {
        scheduleRenderWarmupTask(() => warmFoodSprite(food));
      }
    }

    function cullStreamedEntities() {
      const despawnBounds = getViewBounds(WORLD_CONFIG.DESPAWN_MARGIN);

      let writeFood = 0;
      for (let i = 0; i < foods.length; i++) {
        const food = foods[i];
        if (food.life !== undefined && food.life <= 0) continue;
        if (isOutsideBounds(food, despawnBounds, food.radius + 24)) continue;
        foods[writeFood++] = food;
      }
      foods.length = writeFood;

      let writeOrb = 0;
      for (let i = 0; i < dnaOrbs.length; i++) {
        const orb = dnaOrbs[i];
        if (isOutsideBounds(orb, despawnBounds, orb.radius + 20)) continue;
        dnaOrbs[writeOrb++] = orb;
      }
      dnaOrbs.length = writeOrb;

      let writeTomato = 0;
      for (let i = 0; i < tomatoFoods.length; i++) {
        const tomato = tomatoFoods[i];
        if (isOutsideBounds(tomato, despawnBounds, tomato.radius + 28)) continue;
        tomatoFoods[writeTomato++] = tomato;
      }
      tomatoFoods.length = writeTomato;

      let writeEnemy = 0;
      for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        if (isOutsideBounds(enemy, despawnBounds, enemy.radius + 90)) continue;
        enemies[writeEnemy++] = enemy;
      }
      enemies.length = writeEnemy;
    }

    function isEntityFarOutsideView(entity, margin = 120) {
      const bounds = getViewBounds(margin);
      return entity.x < bounds.left || entity.x > bounds.right || entity.y < bounds.top || entity.y > bounds.bottom;
    }

    function softTrimBackgroundList(list, target, paddingGetter) {
      if (list.length <= target) return;

      const bounds = getViewBounds(140);
      for (let i = list.length - 1; i >= 0 && list.length > target; i--) {
        const entity = list[i];
        if (!isOutsideBounds(entity, bounds, paddingGetter(entity))) continue;
        list[i] = list[list.length - 1];
        list.pop();
      }

      if (list.length > target && simulationFrame % 90 === 0) {
        list.pop();
      }
    }

    function refillAmbientParticles() {
      const effectTargets = getBackgroundEffectTargets();
      const particleTarget = effectTargets.ambient;
      const glowTarget = effectTargets.glow;
      const bubbleTarget = effectTargets.bubble;
      const bloomTarget = effectTargets.bloom;
      const bounds = getViewBounds(WORLD_CONFIG.SPAWN_MARGIN + 220);

      while (ambientParticles.length < particleTarget) {
        ambientParticles.push(createAmbientParticleAt(
          randomRange(bounds.left, bounds.right),
          randomRange(bounds.top, bounds.bottom)
        ));
      }

      while (backgroundGlows.length < glowTarget) {
        backgroundGlows.push(createBackgroundGlowAt(
          randomRange(bounds.left, bounds.right),
          randomRange(bounds.top, bounds.bottom)
        ));
      }

      while (backgroundBubbles.length < bubbleTarget) {
        backgroundBubbles.push(createBackgroundBubbleAt(
          randomRange(bounds.left, bounds.right),
          randomRange(bounds.top, bounds.bottom)
        ));
      }

      while (backgroundBlooms.length < bloomTarget) {
        backgroundBlooms.push(createBackgroundBloomAt(
          randomRange(bounds.left, bounds.right),
          randomRange(bounds.top, bounds.bottom)
        ));
      }

      softTrimBackgroundList(ambientParticles, particleTarget, particle => particle.radius + 30);
      softTrimBackgroundList(backgroundGlows, glowTarget, glow => Math.max(glow.radiusX, glow.radiusY) + 80);
      softTrimBackgroundList(backgroundBubbles, bubbleTarget, bubble => bubble.radius + 60);
      softTrimBackgroundList(backgroundBlooms, bloomTarget, bloom => bloom.radius + 90);
    }

    function spawnStreamFood(amount) {
      let remaining = amount;
      while (remaining > 0) {
        const clusterSize = Math.min(remaining, 3 + Math.floor(Math.random() * 5));
        const center = randomOffscreenWorldPosition({
          padding: 24,
          minDistanceFromPlayer: WORLD_CONFIG.SAFE_PLAYER_RADIUS,
        });
        for (let i = 0; i < clusterSize; i++) {
          const angle = Math.random() * Math.PI * 2;
          const offset = Math.random() * 80;
          const food = createFoodAt(
            center.x + Math.cos(angle) * offset,
            center.y + Math.sin(angle) * offset
          );
          foods.push(food);
          if (typeof scheduleRenderWarmupTask === 'function') {
            scheduleRenderWarmupTask(() => warmFoodSprite(food));
          }
        }
        remaining -= clusterSize;
      }
    }

    function spawnStreamDna(amount = 1) {
      for (let i = 0; i < amount; i++) {
        const spawn = randomOffscreenWorldPosition({
          padding: 40,
          minDistanceFromPlayer: WORLD_CONFIG.SAFE_PLAYER_RADIUS + 40,
        });
        const orb = createDnaOrbAt(spawn.x, spawn.y);
        dnaOrbs.push(orb);
        if (typeof scheduleRenderWarmupTask === 'function') {
          scheduleRenderWarmupTask(() => warmDnaOrbSprite(orb));
        }
      }
    }

    function spawnStreamEnemy(sizeFactor = 1) {
      const spawn = randomOffscreenWorldPosition({
        padding: 32,
        minDistanceFromPlayer: WORLD_CONFIG.SAFE_PLAYER_RADIUS + 40,
      });
      const enemy = createEnemyAt(spawn.x, spawn.y, sizeFactor);
      enemies.push(enemy);
      if (typeof scheduleRenderWarmupTask === 'function') {
        scheduleRenderWarmupTask(() => warmEnemyBodySprite(enemy), true);
      }
    }

function drawBackground() {
      const lightingSprite = getBackgroundLightingSprite(canvas.width, canvas.height);
      ctx.drawImage(lightingSprite, 0, 0, canvas.width, canvas.height);

      const visibleBounds = getViewBounds(0);
      const zoom = camera.zoom || 1;

      ctx.save();
      ctx.scale(zoom, zoom);
      ctx.translate(-camera.x, -camera.y);

      for (const glow of backgroundGlows) {
        if (isOutsideBounds(glow, visibleBounds, Math.max(glow.radiusX ?? 0, glow.radiusY ?? 0) + 80)) continue;
        glow.draw();
      }

      for (const bloom of backgroundBlooms) {
        if (isOutsideBounds(bloom, visibleBounds, bloom.radius + 90)) continue;
        bloom.draw();
      }

      for (const bubble of backgroundBubbles) {
        if (isOutsideBounds(bubble, visibleBounds, bubble.radius + 60)) continue;
        bubble.draw();
      }

      for (const particle of ambientParticles) {
        if (isOutsideBounds(particle, visibleBounds, particle.radius + 30)) continue;
        particle.draw();
      }

      ctx.restore();
    }
