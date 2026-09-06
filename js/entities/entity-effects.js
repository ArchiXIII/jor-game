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
      const consumeLimit = typeof hasTouchControls === 'function' && hasTouchControls() ? 4 : 7;
      if (enemyConsumeEffects.length > consumeLimit) {
        const overflow = enemyConsumeEffects.length - consumeLimit;
        for (let i = 0; i < overflow; i++) {
          const effect = enemyConsumeEffects[i];
          effect.release();
          enemyConsumeEffectPool.push(effect);
        }
        enemyConsumeEffects.splice(0, overflow);
      }
      if (contactImpactParticles.length > 42) {
        const overflow = contactImpactParticles.length - 42;
        for (let i = 0; i < overflow; i++) contactImpactParticlePool.push(contactImpactParticles[i]);
        contactImpactParticles.splice(0, overflow);
      }
      if (pickupCollectEffects.length > SECONDARY_ENTITY_LIMITS.PICKUP_COLLECT_EFFECTS_MAX) {
        const overflow = pickupCollectEffects.length - SECONDARY_ENTITY_LIMITS.PICKUP_COLLECT_EFFECTS_MAX;
        for (let i = 0; i < overflow; i++) {
          pickupCollectEffectPool.push(pickupCollectEffects[i]);
        }
        pickupCollectEffects.splice(0, overflow);
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
        y: entity.y + Math.sin(angle) * radius * 1.02,
      };
    }

    class PickupCollectEffect {
      constructor(source, eater, kind, intensity) {
        this.reset(source, eater, kind, intensity);
      }

      reset(source, eater, kind, intensity) {
        this.x = source.x;
        this.y = source.y;
        this.prevX = this.x;
        this.prevY = this.y;
        this.eater = eater;
        this.kind = kind;
        this.intensity = intensity;
        this.progress = 0;
        this.burstLife = 0;
        this.swallowTriggered = false;
        this.trailX1 = this.x;
        this.trailY1 = this.y;
        this.trailX2 = this.x;
        this.trailY2 = this.y;

        if (!source.sprite && typeof source.createSprite === 'function') {
          source.sprite = source.createSprite();
        }
        this.sprite = source.sprite || null;
        this.angle = source.spin || 0;

        if (kind === 'food') {
          const visualRadius = source.radius * (App.gameMode === 'campaign' ? 2.15 : 1.72);
          this.displaySize = this.sprite
            ? this.sprite.width * visualRadius / Math.max(0.001, source.spriteBaseRadius || source.radius)
            : visualRadius * 2;
          this.baseRadius = visualRadius;
          this.trailColor = '#62e69b';
          this.coreColor = '#d2ffe0';
        } else if (kind === 'dna') {
          const visualRadius = source.radius * (App.gameMode === 'campaign' ? 1.69 : 1.35);
          this.displaySize = this.sprite
            ? this.sprite.width * visualRadius / Math.max(0.001, source.spriteBaseRadius || source.radius)
            : visualRadius * 2;
          this.baseRadius = visualRadius;
          this.trailColor = '#58dfff';
          this.coreColor = '#e0fbff';
        } else {
          const pulseScale = 1 + Math.sin(source.pulse || 0) * 0.08;
          this.displaySize = this.sprite ? this.sprite.width * source.radius / 18 * pulseScale : source.radius * 2;
          this.baseRadius = source.radius;
          this.trailColor = '#ff7257';
          this.coreColor = '#ffe39a';
        }

        const eaterAngle = eater.displayAngle ?? eater.angle ?? 0;
        const cosA = Math.cos(eaterAngle);
        const sinA = Math.sin(eaterAngle);
        const dx = source.x - eater.x;
        const dy = source.y - eater.y;
        this.startLocalX = dx * cosA + dy * sinA;
        this.startLocalY = -dx * sinA + dy * cosA;
        const side = Math.abs(this.startLocalY) > 0.5
          ? Math.sign(this.startLocalY)
          : (Math.random() < 0.5 ? -1 : 1);
        const detour = clamp((eater.radius * 0.72 - this.startLocalX) / Math.max(1, eater.radius * 1.7), 0, 1);
        const routeY = side * eater.radius * (0.16 + detour * 0.58);
        const guideX = clamp(this.startLocalX, -eater.radius * 0.18, eater.radius * 0.42);
        this.control1X = this.startLocalX + (guideX - this.startLocalX) * 0.42;
        this.control1Y = this.startLocalY + (routeY - this.startLocalY) * 0.38;
        this.control2X = eater.radius * (0.7 + (1 - detour) * 0.12);
        this.control2Y = routeY;
        const distance = Math.hypot(this.startLocalX - eater.radius * 0.34, this.startLocalY);
        this.duration = clamp(12 + distance * 0.075, 14, 21);
        if (kind === 'dna') this.duration *= 0.88;
        if (kind === 'tomato') this.duration *= 1.08;
      }

      update() {
        this.prevX = this.x;
        this.prevY = this.y;
        this.trailX2 = this.trailX1;
        this.trailY2 = this.trailY1;
        this.trailX1 = this.prevX;
        this.trailY1 = this.prevY;
        const eaterAngle = this.eater.displayAngle ?? this.eater.angle ?? 0;
        const cosA = Math.cos(eaterAngle);
        const sinA = Math.sin(eaterAngle);
        const mouthLocalX = this.eater.radius * 0.34;
        const mouthX = this.eater.x + cosA * mouthLocalX;
        const mouthY = this.eater.y + sinA * mouthLocalX;

        if (this.progress < 1) {
          this.progress = Math.min(1, this.progress + 1 / this.duration);
          const smooth = this.progress * this.progress * (3 - 2 * this.progress);
          const inverse = 1 - smooth;
          const localX =
            inverse * inverse * inverse * this.startLocalX +
            3 * inverse * inverse * smooth * this.control1X +
            3 * inverse * smooth * smooth * this.control2X +
            smooth * smooth * smooth * mouthLocalX;
          const localY =
            inverse * inverse * inverse * this.startLocalY +
            3 * inverse * inverse * smooth * this.control1Y +
            3 * inverse * smooth * smooth * this.control2Y;
          this.x = this.eater.x + localX * cosA - localY * sinA;
          this.y = this.eater.y + localX * sinA + localY * cosA;
          const moveX = this.x - this.prevX;
          const moveY = this.y - this.prevY;
          if (moveX * moveX + moveY * moveY > 0.01) this.angle = Math.atan2(moveY, moveX);
          if (!this.swallowTriggered && this.progress >= 0.72 && typeof this.eater.triggerSwallow === 'function') {
            this.swallowTriggered = true;
            playEatingSound();
            this.eater.triggerSwallow(1.08 + (this.intensity - 1) * 0.55);
          }
          return;
        }

        this.x = mouthX;
        this.y = mouthY;
        this.burstLife -= 1;
      }

      draw() {
        if (this.progress < 1) {
          const fade = 1 - this.progress * 0.52;
          const motionX = this.x - this.prevX;
          const motionY = this.y - this.prevY;
          const speed = Math.hypot(motionX, motionY);
          const stretchLimit = this.kind === 'tomato' ? 0.82 : 0.62;
          const stretch = Math.min(stretchLimit, 0.16 + speed * 0.075) * Math.sin(this.progress * Math.PI);

          ctx.save();
          ctx.globalAlpha = fade * (this.kind === 'dna' ? 0.58 : 0.42);
          ctx.strokeStyle = this.trailColor;
          ctx.lineWidth = Math.max(1, this.baseRadius * (this.kind === 'tomato' ? 0.34 : 0.22));
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(this.trailX2, this.trailY2);
          ctx.quadraticCurveTo(this.trailX1, this.trailY1, this.x, this.y);
          ctx.stroke();

          ctx.translate(this.x, this.y);
          ctx.rotate(this.angle);
          ctx.globalAlpha = fade;
          if (this.sprite) {
            drawSpriteCentered(
              this.sprite,
              0,
              0,
              this.displaySize * (1 + stretch),
              this.displaySize * (1 - stretch * 0.36)
            );
          } else {
            ctx.fillStyle = this.coreColor;
            ctx.beginPath();
            ctx.arc(0, 0, this.baseRadius, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }
    }

    function spawnPickupCollectEffect(source, eater, kind) {
      if (!source || !eater) return false;
      const limit = typeof hasTouchControls === 'function' && hasTouchControls()
        ? 4
        : 6;
      if (pickupCollectEffects.length >= limit) return false;

      if (simulationFrame - lastPickupCollectFrame <= 22) {
        pickupCollectStreak = Math.min(5, pickupCollectStreak + 1);
      } else {
        pickupCollectStreak = 1;
      }
      lastPickupCollectFrame = simulationFrame;
      const intensity = 1 + (pickupCollectStreak - 1) * 0.055;
      let effect = pickupCollectEffectPool.pop();
      if (effect) effect.reset(source, eater, kind, intensity);
      else effect = new PickupCollectEffect(source, eater, kind, intensity);
      pickupCollectEffects.push(effect);
      if (typeof eater.prepareSwallow === 'function') {
        eater.prepareSwallow(0.52 + (intensity - 1) * 0.3, effect.duration * 0.72);
      }
      return true;
    }

    function updatePickupCollectEffects() {
      for (let i = pickupCollectEffects.length - 1; i >= 0; i--) {
        const effect = pickupCollectEffects[i];
        effect.update();
        if (effect.progress < 1 || effect.burstLife > 0) continue;
        pickupCollectEffects[i] = pickupCollectEffects[pickupCollectEffects.length - 1];
        pickupCollectEffects.pop();
        pickupCollectEffectPool.push(effect);
      }
    }

    function drawPickupCollectEffects() {
      for (let i = 0; i < pickupCollectEffects.length; i++) {
        pickupCollectEffects[i].draw();
      }
    }

    class EnemyEatParticle {
      constructor(source, eater, options = {}) {
        this.reset(source, eater, options);
      }

      reset(source, eater, options = {}) {
        const dx = eater.x - source.x;
        const dy = eater.y - source.y;
        const dist = Math.hypot(dx, dy) || 1;
        const nx = dx / dist;
        const ny = dy / dist;
        const tangent = randomRange(-source.radius * 0.38, source.radius * 0.38);
        this.x = source.x + nx * source.radius * 0.5 - ny * tangent;
        this.y = source.y + ny * source.radius * 0.5 + nx * tangent;
        this.eater = eater;
        const mobileLite = typeof hasTouchControls === 'function' && hasTouchControls();
        this.life = mobileLite ? 20 + Math.random() * 7 : 27 + Math.random() * 9;
        this.maxLife = this.life;
        this.delay = options.delay ?? 3;
        this.age = 0;
        this.baseSize = options.size ?? randomRange(Math.max(2.6, source.radius * 0.075), Math.max(4.8, source.radius * 0.13));
        this.size = this.baseSize;
        this.pulled = Boolean(options.pulled);
        this.spin = Math.random() * Math.PI * 2;
        this.spinSpeed = randomRange(-0.18, 0.18);
        this.alpha = 1;
        this.stretch = randomRange(0.86, 1.18);
        const spreadT = options.fragmentCount > 1 ? options.fragmentIndex / (options.fragmentCount - 1) - 0.5 : 0;
        const burstAngle = Math.atan2(-ny, -nx) + spreadT * 2.5 + randomRange(-0.24, 0.24);
        const burstSpeed = randomRange(2.1, 3.8);
        this.vx = Math.cos(burstAngle) * burstSpeed + (source.vx ?? 0) * 0.3;
        this.vy = Math.sin(burstAngle) * burstSpeed + (source.vy ?? 0) * 0.3;
        const core = source.type === 'shield' ? '#e3a15e' : (Math.random() < 0.5 ? '#ff8f7c' : '#ffad96');
        const edge = source.type === 'shield' ? '#6c493d' : '#7c1837';
        this.sprite = getEnemyParticleSprite(core, edge, options.shape ?? 0);
      }

      update() {
        if (this.delay > 0) {
          this.delay -= 1;
          return;
        }

        this.age += 1;
        this.spin += this.spinSpeed;
        if (this.pulled && this.age > 4) {
          const mouth = getEntityMouthPosition(this.eater);
          const dx = mouth.x - this.x;
          const dy = mouth.y - this.y;
          const dist = Math.hypot(dx, dy) || 1;
          const pull = Math.min(0.42, 0.12 + this.age * 0.018);
          this.x += dx * pull;
          this.y += dy * pull;
          this.vx *= 0.7;
          this.vy *= 0.7;
          if (dist < Math.max(6, this.eater.radius * 0.18)) this.life = 0;
        } else {
          this.x += this.vx;
          this.y += this.vy;
          this.vx *= 0.86;
          this.vy *= 0.86;
        }
        this.life -= 1;
        this.alpha = clamp(this.life / Math.min(8, this.maxLife), 0, 1);
        this.size = this.baseSize * (0.82 + this.alpha * 0.18);
      }

      draw() {
        if (this.delay > 0) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.spin);
        ctx.globalAlpha = this.alpha;
        drawSpriteCentered(this.sprite, 0, 0, this.size * this.stretch * 2.6, this.size * 2.2);
        ctx.restore();
      }
    }

    class EnemyConsumeEffect {
      constructor(source, eater, options = {}) {
        this.reset(source, eater, options);
      }

      reset(source, eater, options = {}) {
        this.source = source;
        this.eater = eater;
        this.frame = 0;
        const effort = clamp(source.radius / Math.max(1, eater.radius), 0.3, 1);
        this.effort = effort;
        this.duration = Math.round(26 + effort * 10);
        this.biteTriggered = false;
        this.particleCountOverride = options.particleCount;
        const angle = eater.displayAngle ?? eater.angle ?? 0;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const dx = source.x - eater.x;
        const dy = source.y - eater.y;
        this.startLocalX = dx * cosA + dy * sinA;
        this.startLocalY = -dx * sinA + dy * cosA;
        this.startAngle = source.displayAngle ?? source.angle ?? 0;
        source.consumeScaleX = 1;
        source.consumeScaleY = 1;
        source.consumeBite = 0;
        source.campaignAlarmTimer = 0;
        source.spikeChargeTimer = 0;
        source.vx = 0;
        source.vy = 0;
        if (typeof eater.prepareSwallow === 'function') eater.prepareSwallow(0.7 + effort * 0.2, this.duration * 0.22);
      }

      update() {
        this.frame += 1;
        const progress = clamp(this.frame / this.duration, 0, 1);
        const eaterAngle = this.eater.displayAngle ?? this.eater.angle ?? 0;
        const cosA = Math.cos(eaterAngle);
        const sinA = Math.sin(eaterAngle);
        const captureT = clamp((progress - 0.02) / 0.26, 0, 1);
        const captureEase = captureT * captureT * (3 - 2 * captureT);
        const swallowT = clamp((progress - 0.56) / 0.44, 0, 1);
        const swallowEase = swallowT * swallowT * (3 - 2 * swallowT);
        const biteLocalX = this.eater.radius * 0.98 + this.source.radius * 0.62;
        const insideLocalX = this.eater.radius * 0.2;
        let localX = lerp(this.startLocalX, biteLocalX, captureEase);
        let localY = lerp(this.startLocalY, 0, captureEase);
        if (swallowT > 0) {
          localX = lerp(biteLocalX, insideLocalX, swallowEase);
          localY *= 1 - swallowEase;
        }
        this.source.x = this.eater.x + localX * cosA - localY * sinA;
        this.source.y = this.eater.y + localX * sinA + localY * cosA;
        this.source.displayAngle = this.startAngle + Math.sin(progress * Math.PI * 3) * 0.045 * (1 - swallowEase);
        const biteWave = Math.sin(clamp((progress - 0.14) / 0.34, 0, 1) * Math.PI);
        this.source.consumeBite = biteWave;
        this.source.consumeScaleX = 1 - swallowEase * 0.5;
        this.source.consumeScaleY = 1 - swallowEase * 0.86;
        this.source.swimPhase += 0.08;
        this.source.hurtPulse *= 0.78;
        this.source.damageFlash *= 0.82;
        if (!this.biteTriggered && progress >= 0.24) {
          this.biteTriggered = true;
          if (this.eater === player) playEatingSound();
          this.eater.attackPulse = Math.max(this.eater.attackPulse || 0, 1);
          this.eater.eatPulse = Math.max(this.eater.eatPulse || 0, 1.1);
          if (typeof this.eater.triggerSwallow === 'function') this.eater.triggerSwallow(0.92 + this.effort * 0.32);
          spawnEnemyEatFragments(this.source, this.eater, this.particleCountOverride);
        }
        return progress >= 1;
      }

      draw() {
        const progress = clamp(this.frame / this.duration, 0, 1);
        ctx.save();
        ctx.globalAlpha *= progress > 0.86 ? 1 - (progress - 0.86) / 0.14 : 1;
        this.source.draw();
        ctx.restore();
      }

      release() {
        this.source.consumeScaleX = 1;
        this.source.consumeScaleY = 1;
        this.source.consumeBite = 0;
        this.source = null;
        this.eater = null;
      }
    }

    class ContactImpactParticle {
      constructor(x, y, nx, ny, strength, radius, index, count) {
        this.reset(x, y, nx, ny, strength, radius, index, count);
      }

      reset(x, y, nx, ny, strength, radius, index, count) {
        const pair = index >> 1;
        const side = (index & 1) === 0 ? -1 : 1;
        const pairCount = Math.max(1, Math.ceil(count * 0.5));
        const fan = 0.82 + pair / pairCount * 0.7;
        const angle = Math.atan2(ny, nx) + side * fan + randomRange(-0.11, 0.11);
        const speed = randomRange(2.6, 3.8) + strength * 2.4;
        const headStart = randomRange(2.5, 5.5) + pair * 0.65;
        this.x = x + Math.cos(angle) * headStart;
        this.y = y + Math.sin(angle) * headStart;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 16 + Math.round(strength * 7) + Math.random() * 4;
        this.maxLife = this.life;
        const zoomCompensation = clamp(1 / Math.sqrt(Math.max(0.35, camera.zoom || 1)), 1, 1.42);
        this.size = Math.max(4.4, radius * (0.065 + strength * 0.04)) * zoomCompensation;
        this.scale = index === 0 ? 1.3 : index < 3 ? 1.12 : 1;
        this.alpha = 1;
        this.sprite = getEnemyParticleSprite('#fff1e8', '#9e3150', index + 1);
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.91;
        this.vy *= 0.91;
        this.life -= 1;
        this.alpha = clamp(this.life / Math.min(9, this.maxLife), 0, 1);
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.atan2(this.vy, this.vx));
        ctx.globalAlpha = this.alpha;
        drawSpriteCentered(this.sprite, 0, 0, this.size * 4 * this.scale, this.size * 1.7 * this.scale);
        ctx.restore();
      }
    }

    function spawnContactImpactEffect(x, y, nx, ny, strength, radius) {
      const mobileLite = typeof hasTouchControls === 'function' && hasTouchControls();
      const count = mobileLite ? 3 + Math.round(strength * 2) : 5 + Math.round(strength * 3);
      for (let i = 0; i < count; i++) {
        let particle = contactImpactParticlePool.pop();
        if (particle) particle.reset(x, y, nx, ny, strength, radius, i, count);
        else particle = new ContactImpactParticle(x, y, nx, ny, strength, radius, i, count);
        contactImpactParticles.push(particle);
      }
    }

    function updateContactImpactEffects() {
      for (let i = contactImpactParticles.length - 1; i >= 0; i--) {
        const particle = contactImpactParticles[i];
        particle.update();
        if (particle.life > 0) continue;
        contactImpactParticles[i] = contactImpactParticles[contactImpactParticles.length - 1];
        contactImpactParticles.pop();
        contactImpactParticlePool.push(particle);
      }
    }

    function acquireEnemyEatParticle(source, eater, options = {}) {
      const particle = enemyEatParticlePool.pop();
      if (!particle) return new EnemyEatParticle(source, eater, options);
      particle.reset(source, eater, options);
      return particle;
    }

    function releaseEnemyEatParticle(particle) {
      if (!particle) return;
      enemyEatParticlePool.push(particle);
    }

    function spawnEnemyEatFragments(source, eater, particleCountOverride) {
      const mobileLite = typeof hasTouchControls === 'function' && hasTouchControls();
      const sizeRatio = source.radius / Math.max(1, eater.radius);
      let particleCount = sizeRatio < 0.32 ? 0 : mobileLite ? 3 + (sizeRatio > 0.72 ? 1 : 0) : 5 + Math.round(sizeRatio * 2);
      if (simulationLoad > 140) particleCount = Math.max(0, particleCount - 1);
      if (typeof particleCountOverride === 'number') particleCount = particleCountOverride;
      const zoomCompensation = clamp(1 / Math.sqrt(Math.max(0.35, camera.zoom || 1)), 1, 1.42);
      const availableParticles = Math.max(0, SECONDARY_ENTITY_LIMITS.ENEMY_EAT_PARTICLES_MAX - enemyEatParticles.length);
      for (let i = 0; i < Math.min(particleCount, availableParticles); i++) {
        enemyEatParticles.push(acquireEnemyEatParticle(
          source,
          eater,
          {
            delay: Math.random() * 1.2,
            size: randomRange(Math.max(3.2, source.radius * 0.1), Math.max(6.4, source.radius * 0.18)) * zoomCompensation,
            pulled: i === Math.floor(particleCount * 0.5),
            shape: i,
            fragmentIndex: i,
            fragmentCount: particleCount,
          }
        ));
      }
    }

    function spawnEnemyEatEffect(source, eater, options = {}) {
      if (!source || !eater) return;
      let effect = enemyConsumeEffectPool.pop();
      if (effect) effect.reset(source, eater, options);
      else effect = new EnemyConsumeEffect(source, eater, options);
      enemyConsumeEffects.push(effect);
    }

    function updateEnemyEatEffects() {
      for (let i = enemyConsumeEffects.length - 1; i >= 0; i--) {
        const effect = enemyConsumeEffects[i];
        if (!effect.update()) continue;
        effect.release();
        enemyConsumeEffects[i] = enemyConsumeEffects[enemyConsumeEffects.length - 1];
        enemyConsumeEffects.pop();
        enemyConsumeEffectPool.push(effect);
      }
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
      for (let i = 0; i < enemyConsumeEffects.length; i++) {
        const effect = enemyConsumeEffects[i];
        if (isOutsideBounds(effect.source, effectBounds, effect.source.radius + 120)) continue;
        effect.draw();
      }
    }

    function drawEnemyEatFragments() {
      const effectBounds = getViewBounds(150);
      for (const particle of enemyEatParticles) {
        if (isOutsideBounds(particle, effectBounds, particle.size * particle.stretch * 2.4 + 12)) continue;
        particle.draw();
      }
      for (const particle of contactImpactParticles) {
        if (isOutsideBounds(particle, effectBounds, particle.size * 3.4 + 12)) continue;
        particle.draw();
      }
    }

    window.spawnContactImpactEffect = spawnContactImpactEffect;
    window.updateContactImpactEffects = updateContactImpactEffects;
    window.drawEnemyEatFragments = drawEnemyEatFragments;
