class FoodEatParticle {
      constructor(x, y, eater, options = {}) {
        this.reset(x, y, eater, options);
      }

      reset(x, y, eater, options = {}) {
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;
        this.eater = eater;
        this.life = 24 + Math.random() * 9;
        this.maxLife = this.life;
        this.delay = options.delay ?? Math.random() * 3;
        this.size = options.size ?? randomRange(2.2, 5.8);
        this.baseSize = this.size;
        this.orbit = randomRange(-16, 16);
        this.side = Math.random() < 0.5 ? -1 : 1;
        this.arc = randomRange(10, 24);
        this.alpha = 1;
        this.tint = options.tint ?? (Math.random() < 0.5 ? '#9cffb9' : '#d9ffe9');
        this.spark = Math.random();
        this.vx = (Math.random() - 0.5) * 1.8;
        this.vy = (Math.random() - 0.5) * 1.8;
        this.spin = Math.random() * Math.PI * 2;
        this.spinSpeed = randomRange(-0.24, 0.24);
        this.sprite = getFoodParticleSprite(this.tint, this.spark > 0.55);
      }

      update() {
        this.prevX = this.x;
        this.prevY = this.y;
        this.spin += this.spinSpeed;

        if (this.delay > 0) {
          this.delay -= 1;
          this.x += this.vx;
          this.y += this.vy;
          this.vx *= 0.86;
          this.vy *= 0.86;
          return;
        }

        const mouth = getEntityMouthPosition(this.eater);
        const dx = mouth.x - this.x;
        const dy = mouth.y - this.y;
        const dist = Math.max(0.001, Math.hypot(dx, dy));
        const nx = dx / dist;
        const ny = dy / dist;
        const swirlX = -ny * this.side * this.arc * Math.max(0.08, dist / 90);
        const swirlY = nx * this.side * this.arc * Math.max(0.08, dist / 90);
        const pull = 0.18 + (1 - Math.min(1, dist / 120)) * 0.24;

        this.x += (dx + swirlX + nx * this.orbit) * pull;
        this.y += (dy + swirlY + ny * this.orbit) * pull;
        this.orbit *= 0.84;
        this.arc *= 0.9;
        this.life -= 1.4;
        this.alpha = clamp(this.life / this.maxLife, 0, 1);
        this.size = Math.max(0.5, this.baseSize * (0.55 + this.alpha * 0.65));

        if (typeof this.eater?.triggerSwallow === 'function') {
          this.eater.triggerSwallow(0.1 + (1 - this.alpha) * 0.16);
        }

        if (dist < Math.max(8, this.eater.radius * 0.14 + this.baseSize)) {
          this.life = 0;
        }
      }

      draw() {
        const fade = clamp(this.alpha, 0, 1);
        const streakAlpha = fade * 0.28;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.strokeStyle = `rgba(185, 255, 215, ${streakAlpha})`;
        ctx.lineWidth = Math.max(1, this.size * 0.65);
        ctx.beginPath();
        ctx.moveTo(this.prevX, this.prevY);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.spin);
        ctx.globalAlpha = fade;
        const spriteScale = this.size / 6.5;
        drawSpriteCentered(this.sprite, 0, 0, this.sprite.width * spriteScale, this.sprite.height * spriteScale);
        ctx.restore();
      }
    }

    function acquireFoodEatParticle(x, y, eater, options = {}) {
      const particle = foodEatParticlePool.pop() ?? new FoodEatParticle(x, y, eater, options);
      particle.reset(x, y, eater, options);
      return particle;
    }

    function releaseFoodEatParticle(particle) {
      if (!particle) return;
      foodEatParticlePool.push(particle);
    }

    function acquireFoodEatBurst(config) {
      const burst = foodEatBurstPool.pop() ?? {};
      burst.x = config.x;
      burst.y = config.y;
      burst.life = config.life;
      burst.maxLife = config.maxLife;
      burst.radius = config.radius;
      burst.drift = config.drift;
      return burst;
    }

    function releaseFoodEatBurst(burst) {
      if (!burst) return;
      foodEatBurstPool.push(burst);
    }

    function acquireEnemyEatBurst(config) {
      const burst = enemyEatBurstPool.pop() ?? {};
      burst.kind = config.kind;
      burst.x = config.x;
      burst.y = config.y;
      burst.life = config.life;
      burst.maxLife = config.maxLife;
      burst.radius = config.radius;
      burst.spin = config.spin;
      return burst;
    }

    function releaseEnemyEatBurst(burst) {
      if (!burst) return;
      enemyEatBurstPool.push(burst);
    }

    function getTentacleAttachPoint(mouth, entity) {
      const dx = mouth.x - entity.x;
      const dy = mouth.y - entity.y;
      const dist = Math.hypot(dx, dy) || 0.0001;
      const edgeInset = Math.min(entity.radius * 0.72, Math.max(entity.radius * 0.34, 4));
      return {
        x: entity.x + dx / dist * edgeInset,
        y: entity.y + dy / dist * edgeInset,
      };
    }

    function trimSecondaryVisualLoad() {
      if (dnaOrbs.length > SECONDARY_ENTITY_LIMITS.DNA_MAX) {
        dnaOrbs.splice(0, dnaOrbs.length - SECONDARY_ENTITY_LIMITS.DNA_MAX);
      }
      if (remains.length > SECONDARY_ENTITY_LIMITS.REMAINS_MAX) {
        const overflow = remains.length - SECONDARY_ENTITY_LIMITS.REMAINS_MAX;
        const removed = remains.splice(0, overflow);
        for (const remain of removed) remainsPool.push(remain);
      }
      if (foodEatParticles.length > SECONDARY_ENTITY_LIMITS.FOOD_EAT_PARTICLES_MAX) {
        const overflow = foodEatParticles.length - SECONDARY_ENTITY_LIMITS.FOOD_EAT_PARTICLES_MAX;
        for (let i = 0; i < overflow; i++) {
          releaseFoodEatParticle(foodEatParticles[i]);
        }
        foodEatParticles.splice(0, overflow);
      }
      if (enemyEatParticles.length > SECONDARY_ENTITY_LIMITS.ENEMY_EAT_PARTICLES_MAX) {
        const overflow = enemyEatParticles.length - SECONDARY_ENTITY_LIMITS.ENEMY_EAT_PARTICLES_MAX;
        for (let i = 0; i < overflow; i++) {
          releaseEnemyEatParticle(enemyEatParticles[i]);
        }
        enemyEatParticles.splice(0, overflow);
      }
      if (enemyEatBursts.length > SECONDARY_ENTITY_LIMITS.ENEMY_EAT_BURSTS_MAX) {
        const overflow = enemyEatBursts.length - SECONDARY_ENTITY_LIMITS.ENEMY_EAT_BURSTS_MAX;
        for (let i = 0; i < overflow; i++) {
          releaseEnemyEatBurst(enemyEatBursts[i]);
        }
        enemyEatBursts.splice(0, overflow);
      }
    }

    function spawnFoodEatEffect(food, eater, options = {}) {
      const availableParticles = Math.max(0, SECONDARY_ENTITY_LIMITS.FOOD_EAT_PARTICLES_MAX - foodEatParticles.length);
      if (availableParticles <= 0 && !options.particleCount) return;
      const loadScale = simulationLoad > 170
        ? 0.48
        : simulationLoad > 120
          ? 0.64
          : simulationLoad > 82
            ? 0.78
            : 1;
      const quality = typeof performanceQuality === 'number' ? performanceQuality : 1;
      const baseParticleCount = options.particleCount ?? Math.max(2, Math.round((food instanceof ShardFood ? 4 : 7) * (0.62 + renderDetailScale * 0.28) * loadScale * quality));
      const particleCount = options.particleCount ? baseParticleCount : Math.min(baseParticleCount, availableParticles);
      const ringCount = options.ringCount ?? (renderDetailScale < 0.7 ? 0 : 1);

      for (let i = 0; i < particleCount; i++) {
        foodEatParticles.push(acquireFoodEatParticle(
          food.x + (Math.random() - 0.5) * food.radius * 2.4,
          food.y + (Math.random() - 0.5) * food.radius * 2.4,
          eater,
          {
            size: food instanceof ShardFood ? randomRange(1.6, 3.4) : randomRange(2.4, 5.6),
            delay: i * 0.28 + Math.random() * 2.4,
            tint: food instanceof ShardFood ? '#cbffe0' : (Math.random() < 0.45 ? '#7effa7' : '#ddffec'),
          }
        ));
      }

      for (let i = 0; i < ringCount; i++) {
        const mouth = getEntityMouthPosition(eater);
        foodEatBursts.push(acquireFoodEatBurst({
          x: mouth.x,
          y: mouth.y,
          life: 13 + i * 2,
          maxLife: 13 + i * 2,
          radius: Math.max(7, eater.radius * (0.13 + i * 0.03)),
          drift: (Math.random() - 0.5) * 0.7,
        }));
      }

      if (typeof eater?.triggerSwallow === 'function') {
        eater.triggerSwallow(food instanceof ShardFood ? 0.42 : 0.72);
      }
    }

    function updateFoodEatEffects() {
      for (let i = foodEatParticles.length - 1; i >= 0; i--) {
        const particle = foodEatParticles[i];
        particle.update();
        if (particle.life <= 0) {
          const deadParticle = foodEatParticles[i];
          foodEatParticles[i] = foodEatParticles[foodEatParticles.length - 1];
          foodEatParticles.pop();
          releaseFoodEatParticle(deadParticle);
        }
      }

      for (let i = foodEatBursts.length - 1; i >= 0; i--) {
        const burst = foodEatBursts[i];
        burst.life -= 1;
        burst.radius += 1.2;
        burst.y -= 0.18;
        burst.x += burst.drift ?? 0;
        if (burst.life <= 0) {
          const deadBurst = foodEatBursts[i];
          foodEatBursts[i] = foodEatBursts[foodEatBursts.length - 1];
          foodEatBursts.pop();
          releaseFoodEatBurst(deadBurst);
        }
      }
    }

    function drawFoodEatEffects() {
      const effectBounds = getViewBounds(140);

      for (const particle of foodEatParticles) {
        if (isOutsideBounds(particle, effectBounds, particle.size * 2.4 + 12)) continue;
        particle.draw();
      }

      for (const burst of foodEatBursts) {
        if (isOutsideBounds(burst, effectBounds, burst.radius * 2.6 + 12)) continue;
        const alpha = clamp(burst.life / burst.maxLife, 0, 1);
        ctx.save();
        ctx.globalAlpha = alpha * 0.38;
        const burstSprite = getBurstSprite('gulp');
        const size = burst.radius * 2.35;
        drawSpriteCentered(burstSprite, burst.x, burst.y, size, size);
        ctx.restore();
      }
    }

    


    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    function getEntityMouthPosition(entity) {
      const angle = entity.displayAngle ?? entity.angle ?? 0;
      const radius = entity.radius ?? 16;
      return {
        x: entity.x + Math.cos(angle) * radius * 1.02,
        y: entity.y + Math.sin(angle) * radius * 0.08,
      };
    }

    class BioRemains {
      constructor(source, eater = null) {
        this.reset(source, eater);
      }

      reset(source, eater = null) {
        this.x = source.x;
        this.y = source.y;
        this.vx = (source.vx ?? 0) * 0.375 + (Math.random() - 0.5) * 1.65;
        this.vy = (source.vy ?? 0) * 0.375 + (Math.random() - 0.5) * 1.65;
        this.radius = Math.max(5, source.radius * 0.42);
        this.baseRadius = this.radius;
        this.life = 80;
        this.phase = Math.random() * Math.PI * 2;
        this.visualSeed = source.visualSeed ?? Math.random() * 1000;
        this.tintA = source.type === 'shield' ? 'rgba(255,245,230,' : 'rgba(255,180,170,';
        this.tintB = source.type === 'shield' ? 'rgba(180,255,245,' : 'rgba(255,110,130,';
        this.eater = eater;
        this.consumeProgress = 0;
        this.sprite = getRemainsSprite(source.type === 'shield' ? 'shield' : 'basic');
        return this;
      }

      update() {
        this.phase += 0.12;

        if (this.eater) {
          const mouth = getEntityMouthPosition(this.eater);
          this.consumeProgress = Math.min(1, this.consumeProgress + 0.12);
          const pull = 0.18 + this.consumeProgress * 0.16;
          this.x = lerp(this.x, mouth.x, pull);
          this.y = lerp(this.y, mouth.y, pull);
          this.radius = Math.max(1.4, this.baseRadius * (1 - this.consumeProgress * 0.82));
          this.life -= 2.5;
          if (typeof this.eater.triggerSwallow === 'function') {
            this.eater.triggerSwallow(0.25 + this.consumeProgress * 0.3);
          }
        } else {
          this.x += this.vx;
          this.y += this.vy;
          this.vx *= 0.96;
          this.vy *= 0.96;
          this.life -= 1;
        }
      }

      draw() {
        const alpha = clamp(this.life / 80, 0, 1);
        const wobble = Math.sin(this.phase) * this.radius * 0.18;
        const size = this.radius * 2.6;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y + wobble * 0.08);
        ctx.rotate(this.phase * 0.3);
        drawSpriteCentered(this.sprite, 0, 0, size, size * 0.78);
        ctx.restore();
      }
    }


    class EnemyEatParticle {
      constructor(source, eater, options = {}) {
        this.reset(source, eater, options);
      }

      reset(source, eater, options = {}) {
        this.sourceX = source.x;
        this.sourceY = source.y;
        this.x = source.x + (Math.random() - 0.5) * source.radius * 1.35;
        this.y = source.y + (Math.random() - 0.5) * source.radius * 1.35;
        this.prevX = this.x;
        this.prevY = this.y;
        this.eater = eater;
        const mobileLite = typeof hasTouchControls === 'function' && hasTouchControls();
        this.life = mobileLite ? 18 + Math.random() * 10 : 28 + Math.random() * 16;
        this.maxLife = this.life;
        this.delay = options.delay ?? Math.random() * 4;
        this.baseSize = options.size ?? randomRange(Math.max(2.8, source.radius * 0.08), Math.max(5.8, source.radius * 0.16));
        this.size = this.baseSize;
        this.side = Math.random() < 0.5 ? -1 : 1;
        this.arc = randomRange(18, 51);
        this.orbit = randomRange(-27, 27);
        this.spin = Math.random() * Math.PI * 2;
        this.spinSpeed = randomRange(-0.28, 0.28);
        this.trailAlpha = 1;
        this.alpha = 1;
        this.tintCore = options.tintCore ?? (source.type === 'shield' ? '#fff0d8' : (Math.random() < 0.45 ? '#ff7f9f' : '#ffb7ae'));
        this.tintGlow = options.tintGlow ?? (source.type === 'shield' ? '#9ff9f0' : (Math.random() < 0.5 ? '#ff5a8d' : '#ff9b7e'));
        this.vx = (Math.random() - 0.5) * 3.6 + (source.vx ?? 0) * 0.525;
        this.vy = (Math.random() - 0.5) * 3.6 + (source.vy ?? 0) * 0.525;
        this.stretch = randomRange(1.05, 1.6);
        this.sprite = getEnemyParticleSprite(this.tintCore, this.tintGlow);
      }

      update() {
        this.prevX = this.x;
        this.prevY = this.y;
        this.spin += this.spinSpeed;

        if (this.delay > 0) {
          this.delay -= 1;
          this.x += this.vx;
          this.y += this.vy;
          this.vx *= 0.88;
          this.vy *= 0.88;
          return;
        }

        const mouth = getEntityMouthPosition(this.eater);
        const dx = mouth.x - this.x;
        const dy = mouth.y - this.y;
        const dist = Math.max(0.001, Math.hypot(dx, dy));
        const nx = dx / dist;
        const ny = dy / dist;
        const proximity = 1 - Math.min(1, dist / 170);
        const swirlX = -ny * this.side * this.arc * Math.max(0.08, dist / 110);
        const swirlY = nx * this.side * this.arc * Math.max(0.08, dist / 110);
        const pull = 0.12 + proximity * 0.22;

        this.x += (dx + swirlX + nx * this.orbit) * pull;
        this.y += (dy + swirlY + ny * this.orbit) * pull;
        this.orbit *= 0.86;
        this.arc *= 0.91;
        this.life -= 1.45;
        this.alpha = clamp(this.life / this.maxLife, 0, 1);
        this.trailAlpha = clamp(this.alpha * (0.5 + proximity * 0.8), 0, 1);
        this.size = Math.max(0.75, this.baseSize * (0.55 + this.alpha * 0.85 + proximity * 0.25));
        this.stretch = lerp(this.stretch, 1.9 + proximity * 0.55, 0.14);

        if (typeof this.eater?.triggerSwallow === 'function') {
          this.eater.triggerSwallow(0.12 + proximity * 0.22);
        }

        if (dist < Math.max(8, this.eater.radius * 0.16 + this.baseSize)) {
          this.life = 0;
        }
      }

      draw() {
        const fade = clamp(this.alpha, 0, 1);
        const dx = this.x - this.prevX;
        const dy = this.y - this.prevY;
        const trailAngle = Math.atan2(dy, dx || 0.0001);
        const speed = Math.hypot(dx, dy);

        ctx.save();

        if (speed > 0.2) {
          const mobileLite = typeof hasTouchControls === 'function' && hasTouchControls();
          ctx.strokeStyle = `rgba(255, 170, 185, ${this.trailAlpha * 0.28})`;
          ctx.lineWidth = Math.max(1.1, this.size * (mobileLite ? 0.62 : 0.95));
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(this.prevX, this.prevY);
          ctx.lineTo(this.x, this.y);
          ctx.stroke();

          if (!mobileLite) {
            ctx.strokeStyle = `rgba(255, 235, 230, ${this.trailAlpha * 0.18})`;
            ctx.lineWidth = Math.max(0.8, this.size * 0.38);
            ctx.beginPath();
            ctx.moveTo(this.prevX + Math.cos(trailAngle + Math.PI * 0.5) * this.size * 0.18, this.prevY + Math.sin(trailAngle + Math.PI * 0.5) * this.size * 0.18);
            ctx.lineTo(this.x, this.y);
            ctx.stroke();
          }
        }

        ctx.translate(this.x, this.y);
        ctx.rotate(this.spin + trailAngle * 0.5);
        ctx.globalAlpha = fade;
        drawSpriteCentered(this.sprite, 0, 0, this.size * this.stretch * 2.2, this.size * 2.1);
        ctx.restore();
      }
    }

    function acquireEnemyEatParticle(source, eater, options = {}) {
      const particle = enemyEatParticlePool.pop() ?? new EnemyEatParticle(source, eater, options);
      particle.reset(source, eater, options);
      return particle;
    }

    function releaseEnemyEatParticle(particle) {
      if (!particle) return;
      enemyEatParticlePool.push(particle);
    }

    function spawnEnemyEatEffect(source, eater, options = {}) {
      if (!eater) return;

      const mobileLite = typeof hasTouchControls === 'function' && hasTouchControls();
      if (mobileLite) {
        if (typeof eater?.triggerSwallow === 'function') {
          eater.triggerSwallow(0.55);
        }
        return;
      }
      const loadScale = simulationLoad > 170
        ? 0.5
        : simulationLoad > 120
          ? 0.66
          : simulationLoad > 82
            ? 0.82
          : 1;
      const quality = typeof performanceQuality === 'number' ? performanceQuality : 1;
      const mobileScale = mobileLite ? 0.48 : 1;
      const minParticles = mobileLite ? 3 : 5;
      const maxBaseParticles = mobileLite ? 10 : 22;
      const particleCount = options.particleCount ?? Math.max(
        minParticles,
        Math.round(clamp(source.radius * 0.72, minParticles + 2, maxBaseParticles) * (0.72 + renderDetailScale * 0.28) * loadScale * quality * mobileScale)
      );
      const burstCount = Math.min(
        options.burstCount ?? (mobileLite ? 1 : renderDetailScale < 0.7 ? 1 : renderDetailScale < 0.86 ? 2 : 3),
        Math.max(1, SECONDARY_ENTITY_LIMITS.ENEMY_EAT_BURSTS_MAX - enemyEatBursts.length - 1)
      );

      const particleLimit = mobileLite ? 72 : SECONDARY_ENTITY_LIMITS.ENEMY_EAT_PARTICLES_MAX;
      const burstLimit = mobileLite ? 12 : SECONDARY_ENTITY_LIMITS.ENEMY_EAT_BURSTS_MAX;

      if (enemyEatParticles.length >= particleLimit && !options.particleCount) {
        return;
      }

      const availableParticles = Math.max(0, particleLimit - enemyEatParticles.length);
      for (let i = 0; i < Math.min(particleCount, availableParticles); i++) {
        enemyEatParticles.push(acquireEnemyEatParticle(
          source,
          eater,
          {
            delay: i * 0.12 + Math.random() * 3.2,
            size: randomRange(Math.max(2.4, source.radius * 0.07), Math.max(6.4, source.radius * 0.17)),
          }
        ));
      }

      const availableBursts = Math.max(0, burstLimit - enemyEatBursts.length - 1);
      for (let i = 0; i < Math.min(burstCount, availableBursts); i++) {
        enemyEatBursts.push(acquireEnemyEatBurst({
          kind: 'impact',
          x: source.x + (Math.random() - 0.5) * source.radius * 0.45,
          y: source.y + (Math.random() - 0.5) * source.radius * 0.45,
          life: 12 + i * 3,
          maxLife: 12 + i * 3,
          radius: source.radius * (0.28 + i * 0.09),
          spin: Math.random() * Math.PI * 2,
        }));
      }

      if (enemyEatBursts.length < burstLimit) {
        const mouth = getEntityMouthPosition(eater);
        enemyEatBursts.push(acquireEnemyEatBurst({
          kind: 'gulp',
          x: mouth.x,
          y: mouth.y,
          life: mobileLite ? 14 : 18,
          maxLife: mobileLite ? 14 : 18,
          radius: Math.max(10, eater.radius * (mobileLite ? 0.15 : 0.18)),
          spin: Math.random() * Math.PI * 2,
        }));
      }

      if (typeof eater?.triggerSwallow === 'function') {
        eater.triggerSwallow(1.05);
      }
    }

    function updateEnemyEatEffects() {
      for (let i = enemyEatParticles.length - 1; i >= 0; i--) {
        const particle = enemyEatParticles[i];
        particle.update();
        if (particle.life <= 0) {
          const deadParticle = enemyEatParticles[i];
          enemyEatParticles[i] = enemyEatParticles[enemyEatParticles.length - 1];
          enemyEatParticles.pop();
          releaseEnemyEatParticle(deadParticle);
        }
      }

      for (let i = enemyEatBursts.length - 1; i >= 0; i--) {
        const burst = enemyEatBursts[i];
        burst.life -= 1;
        burst.radius += burst.kind === 'gulp' ? 1.2 : 1.65;
        burst.spin += 0.16;
        if (burst.life <= 0) {
          const deadBurst = enemyEatBursts[i];
          enemyEatBursts[i] = enemyEatBursts[enemyEatBursts.length - 1];
          enemyEatBursts.pop();
          releaseEnemyEatBurst(deadBurst);
        }
      }
    }

    function drawEnemyEatEffects() {
      const effectBounds = getViewBounds(150);

      for (const particle of enemyEatParticles) {
        if (isOutsideBounds(particle, effectBounds, particle.size * particle.stretch * 2.4 + 12)) continue;
        particle.draw();
      }

      for (const burst of enemyEatBursts) {
        const burstPadding = burst.kind === 'impact' ? burst.radius * 2.5 + 14 : burst.radius * 3 + 14;
        if (isOutsideBounds(burst, effectBounds, burstPadding)) continue;
        const alpha = clamp(burst.life / burst.maxLife, 0, 1);
        const burstSprite = getBurstSprite(burst.kind);

        ctx.save();
        ctx.translate(burst.x, burst.y);
        ctx.rotate(burst.spin);
        ctx.globalAlpha = alpha * (burst.kind === 'impact' ? 0.45 : 0.52);
        const width = burst.kind === 'impact' ? burst.radius * 2.35 : burst.radius * 2.8;
        const height = burst.kind === 'impact' ? burst.radius * 1.55 : burst.radius * 2.0;
        drawSpriteCentered(burstSprite, 0, 0, width, height);
        ctx.restore();
      }
    }


    function spawnEnemyRemains(source, eater = null) {
      const mobileLite = typeof hasTouchControls === 'function' && hasTouchControls();
      if (mobileLite) {
        if (typeof eater?.triggerSwallow === 'function') {
          eater.triggerSwallow(0.55);
        }
        return;
      }
      const quality = typeof performanceQuality === 'number' ? performanceQuality : 1;
      if ((simulationLoad > 170 || quality < 0.74) && remains.length > SECONDARY_ENTITY_LIMITS.REMAINS_MAX * 0.58 && Math.random() < 0.55) {
        if (eater) spawnEnemyEatEffect(source, eater, { particleCount: 6, burstCount: 1 });
        return;
      }
      const remainsLimit = SECONDARY_ENTITY_LIMITS.REMAINS_MAX;
      if (remains.length >= remainsLimit) {
        const oldest = remains.shift();
        if (oldest) remainsPool.push(oldest);
      }
      const remain = remainsPool.pop() ?? new BioRemains(source, eater);
      remain.reset(source, eater);
      remains.push(remain);
      if (eater) {
        spawnEnemyEatEffect(source, eater);
      }
    }
