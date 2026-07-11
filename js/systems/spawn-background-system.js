let ambientParticles = [];
    let backgroundGlows = [];
    let backgroundBubbles = [];
    let backgroundBlooms = [];
    const BACKGROUND_EFFECT_LIMITS = {
      TOTAL_MAX: 104,
      AMBIENT_MAX: 62,
      GLOW_MAX: 14,
      BUBBLE_MAX: 28,
      BLOOM_MAX: 8,
    };

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
            ? ['#fff4dd', '#f6af7d', '#914d48']
            : ['#ffe3d8', '#ff8d76', '#7a2433'],
          'rgba(255,252,244,0.96)'
        );
        return;
      }
      enemy.getCachedBodySprite(
        ['#ffe9d5', '#ff8f7c', '#7c1837'],
        'rgba(255,245,252,0.95)'
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

      for (let i = remains.length - 1; i >= 0; i--) {
        const chunk = remains[i];
        if (chunk.life > 0 && !isOutsideBounds(chunk, despawnBounds, chunk.radius + 26)) continue;
        const deadRemain = remains[i];
        remains[i] = remains[remains.length - 1];
        remains.pop();
        remainsPool.push(deadRemain);
      }

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
      ctx.fillStyle = '#09111a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const visibleBounds = getViewBounds(0);
      const zoom = camera.zoom || 1;
      const viewWidth = canvas.width / zoom;
      const viewHeight = canvas.height / zoom;
      const viewMax = Math.max(viewWidth, viewHeight);

      ctx.save();
      ctx.scale(zoom, zoom);
      ctx.translate(-camera.x, -camera.y);

      const gradient = ctx.createRadialGradient(
        player.x,
        player.y,
        100,
        player.x,
        player.y,
        viewMax * 1.02
      );

      gradient.addColorStop(0, '#3a7890');
      gradient.addColorStop(0.28, '#255569');
      gradient.addColorStop(0.62, '#123247');
      gradient.addColorStop(1, '#08131f');

      ctx.fillStyle = gradient;
      ctx.fillRect(
        visibleBounds.left,
        visibleBounds.top,
        visibleBounds.right - visibleBounds.left,
        visibleBounds.bottom - visibleBounds.top
      );

      const upperGlow = ctx.createLinearGradient(
        visibleBounds.left,
        visibleBounds.top,
        visibleBounds.left,
        visibleBounds.bottom
      );
      upperGlow.addColorStop(0, 'rgba(180, 255, 245, 0.16)');
      upperGlow.addColorStop(0.34, 'rgba(150, 235, 255, 0.08)');
      upperGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = upperGlow;
      ctx.fillRect(
        visibleBounds.left,
        visibleBounds.top,
        visibleBounds.right - visibleBounds.left,
        visibleBounds.bottom - visibleBounds.top
      );

      const bioGlow = ctx.createRadialGradient(
        player.x - viewWidth * 0.12,
        player.y - viewHeight * 0.08,
        0,
        player.x - viewWidth * 0.12,
        player.y - viewHeight * 0.08,
        viewMax * 0.7
      );
      bioGlow.addColorStop(0, 'rgba(110, 255, 225, 0.16)');
      bioGlow.addColorStop(0.42, 'rgba(90, 235, 210, 0.08)');
      bioGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = bioGlow;
      ctx.fillRect(
        visibleBounds.left,
        visibleBounds.top,
        visibleBounds.right - visibleBounds.left,
        visibleBounds.bottom - visibleBounds.top
      );

      const magicGlow = ctx.createRadialGradient(
        player.x + viewWidth * 0.18,
        player.y + viewHeight * 0.03,
        0,
        player.x + viewWidth * 0.18,
        player.y + viewHeight * 0.03,
        viewMax * 0.58
      );
      magicGlow.addColorStop(0, 'rgba(215, 150, 255, 0.14)');
      magicGlow.addColorStop(0.36, 'rgba(170, 120, 255, 0.08)');
      magicGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = magicGlow;
      ctx.fillRect(
        visibleBounds.left,
        visibleBounds.top,
        visibleBounds.right - visibleBounds.left,
        visibleBounds.bottom - visibleBounds.top
      );

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
