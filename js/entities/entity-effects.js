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
      if (enemyEatParticles.length > SECONDARY_ENTITY_LIMITS.ENEMY_EAT_PARTICLES_MAX) {
        const overflow = enemyEatParticles.length - SECONDARY_ENTITY_LIMITS.ENEMY_EAT_PARTICLES_MAX;
        for (let i = 0; i < overflow; i++) {
          releaseEnemyEatParticle(enemyEatParticles[i]);
        }
        enemyEatParticles.splice(0, overflow);
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
      const particleLimit = mobileLite ? 72 : SECONDARY_ENTITY_LIMITS.ENEMY_EAT_PARTICLES_MAX;

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

    }

    function drawEnemyEatEffects() {
      const effectBounds = getViewBounds(150);

      for (const particle of enemyEatParticles) {
        if (isOutsideBounds(particle, effectBounds, particle.size * particle.stretch * 2.4 + 12)) continue;
        particle.draw();
      }

    }
