class EnemySpikeProjectile {
      constructor(source, angle, pressure = 0) {
        this.reset(source, angle, pressure);
      }

      reset(source, angle, pressure = 0) {
        const isTouchDevice = typeof hasTouchControls === 'function' && hasTouchControls();
        const mobileGameplayScale = ENDLESS_CONFIG.MOBILE_GAMEPLAY_SPEED_SCALE ?? 0.9;
        const platformScale = isTouchDevice ? 0.85 * mobileGameplayScale : (endlessMode ? 1.1 : 1);
        const speed = (8.1 + Math.min(2.0, pressure * 0.7)) * platformScale;
        this.sourceRadius = source.radius;
        this.x = source.x + Math.cos(angle) * source.radius * 0.92;
        this.y = source.y + Math.sin(angle) * source.radius * 0.92;
        this.prevX = this.x;
        this.prevY = this.y;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.angle = angle;
        this.radius = clamp(source.radius * 0.11, 5, 10);
        this.length = clamp(source.radius * 0.72, 28, 54);
        this.life = 210;
        this.maxLife = this.life;
        this.spin = Math.random() * Math.PI * 2;
        this.damageAmount = 5.5 + Math.min(3.5, pressure * 1.4);
        this.damageRadius = source.radius * 0.56;
      }

      update() {
        this.prevX = this.x;
        this.prevY = this.y;
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 1;
        this.spin += 0.12;
      }

      draw() {
        const fade = clamp(this.life / this.maxLife, 0, 1);
        const pulse = 0.92 + Math.sin(frameTime * 0.16 + this.spin) * 0.08;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.globalAlpha = fade;

        const spikeGradient = ctx.createLinearGradient(-this.length * 0.45, 0, this.length * 0.58, 0);
        spikeGradient.addColorStop(0, 'rgba(122, 30, 44, 0.92)');
        spikeGradient.addColorStop(0.52, 'rgba(255, 126, 102, 0.98)');
        spikeGradient.addColorStop(1, 'rgba(255, 232, 210, 1)');
        ctx.fillStyle = spikeGradient;
        ctx.beginPath();
        ctx.moveTo(this.length * 0.62, 0);
        ctx.quadraticCurveTo(this.length * 0.12, -this.radius * 1.45 * pulse, -this.length * 0.48, -this.radius * 0.62);
        ctx.quadraticCurveTo(-this.length * 0.18, 0, -this.length * 0.48, this.radius * 0.62);
        ctx.quadraticCurveTo(this.length * 0.12, this.radius * 1.45 * pulse, this.length * 0.62, 0);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 238, 226, 0.48)';
        ctx.lineWidth = Math.max(1, this.radius * 0.18);
        ctx.beginPath();
        ctx.moveTo(-this.length * 0.16, -this.radius * 0.28);
        ctx.lineTo(this.length * 0.34, -this.radius * 0.08);
        ctx.stroke();

        ctx.restore();
      }
    }
class Enemy {
      constructor(sizeFactor = 1) {
        this.type = 'basic';
        this.hasShield = false;
        this.radius = 16 + Math.random() * 16 * sizeFactor;

        const spawn = randomWorldPositionAwayFrom(
          typeof player !== 'undefined' ? player : null,
          260,
          Math.max(this.radius + 24, 60)
        );

        this.x = spawn.x;
        this.y = spawn.y;
        this.vx = (Math.random() - 0.5) * (1.2 + Math.random() * 0.8);
        this.vy = (Math.random() - 0.5) * (1.2 + Math.random() * 0.8);
        this.dirTimer = 60 + Math.random() * 120;
        this.foodEaten = 0;
        this.enemyEaten = 0;
        this.level = calculateLevelFromRadius(this.radius);

        // РџРµСЂРє-СЃРѕСЃС‚РѕСЏРЅРёСЏ РїСЂРѕС‚РёРІРЅРёРєР°.
        this.hasSpike = false;
        this.hasTail = false;
        this.hasShell = false;
        this.hasMaw = false;
        this.hasTentacle = false;
        this.hasAgility = false;

        this.spikeLevel = 0;
        this.tailLevel = 0;
        this.shellLevel = 0;
        this.mawLevel = 0;
        this.tentacleLevel = 0;
        this.agilityLevel = 0;

        this.predatorBonus = 1;
        this.endlessAggressionBonus = 0;
        this.foodGrowthBonus = 1;
        this.damageReduction = 0;
        this.perkIds = [];

        // Р’РёР·СѓР°Р»СЊРЅС‹Рµ РїР°СЂР°РјРµС‚СЂС‹ РјРёРєСЂРѕРѕСЂРіР°РЅРёР·РјР°.
        this.visualSeed = Math.random() * 1000;
        this.swimPhase = Math.random() * Math.PI * 2;
        this.displayAngle = Math.atan2(this.vy, this.vx);
        this.turnTilt = 0;
        this.eatPulse = 0;
        this.attackPulse = 0;
        this.swallowPulse = 0;
        this.hurtPulse = 0;
        this.damageFlash = 0;
        this.fleeShake = 0;
        this.isFleeing = false;
        this.fleeShakeX = 0;
        this.fleeShakeY = 0;
        this.finOffset = Math.random() * Math.PI * 2;
        this.bodyPatternSeed = Math.random() * Math.PI * 2;

        // ---- РџРѕРІРµРґРµРЅРёРµ AI ----
        // РЎРѕСЃС‚РѕСЏРЅРёРµ РІСЂР°РіР°: 'wander' (Р±СЂРѕРґРёС‚), 'forage' (РµСЃС‚ РєРѕСЂРј),
        // 'hunt' (РїСЂРµСЃР»РµРґСѓРµС‚ РґРѕР±С‹С‡Сѓ/РёРіСЂРѕРєР°), 'flee' (Р±РµР¶РёС‚ РѕС‚ СѓРіСЂРѕР·С‹),
        // 'ambush' (Р·Р°СЃР°РґР° вЂ” РјРµРґР»РµРЅРЅРѕРµ РїСЂРёР±Р»РёР¶РµРЅРёРµ РїРµСЂРµРґ СЂС‹РІРєРѕРј),
        // 'school' (СЃС‚Р°Р№РЅРѕРµ РґРІРёР¶РµРЅРёРµ СЃ СЃРѕСЂРѕРґРёС‡Р°РјРё).
        this.aiState = 'wander';
        this.aiStateTimer = 0;                        // С‚РёРєРѕРІ РґРѕ СЃР»РµРґСѓСЋС‰РµРіРѕ РїРµСЂРµСЃС‡С‘С‚Р° СЃРѕСЃС‚РѕСЏРЅРёСЏ
        this.chasePersistence = 0;                    // В«СѓСЃС‚Р°Р»РѕСЃС‚СЊВ» РІ РїРѕРіРѕРЅРµ Р·Р° РёРіСЂРѕРєРѕРј
        this.aiPersonality = Math.random();           // [0..1) вЂ” РёРЅРґРёРІРёРґСѓР°Р»СЊРЅС‹Рµ СЃРєР»РѕРЅРЅРѕСЃС‚Рё
        this.ambushCharge = 0;                        // РЅР°РєРѕРїР»РµРЅРЅС‹Р№ Р·Р°СЂСЏРґ Р·Р°СЃР°РґС‹
        this.ambushCooldown = 0;
        this.ambushChargeTarget = 60;
        this.spikeShotCooldown = 260 + Math.random() * 300;
        this.spikeChargeTimer = 0;
        this.spikeChargeDuration = 0;
        this.spikeAimAngle = 0;
        this.lastTargetX = 0;                         // РєСѓРґР° РЅР°РїСЂР°РІР»СЏР»СЃСЏ РІ РїСЂРѕС€Р»С‹Р№ СЂР°Р·
        this.lastTargetY = 0;
        // РљСЌС€ СЃС‚Р°Р№РЅРѕРіРѕ РёРјРїСѓР»СЊСЃР°: РІС‹С‡РёСЃР»СЏРµС‚СЃСЏ РІ retarget-С†РёРєР»Рµ, Р° РЅРµ РєР°Р¶РґС‹Р№
        // РєР°РґСЂ вЂ” schooling С‚СЂРµР±СѓРµС‚ O(k) РїРѕРёСЃРєР° СЃРѕСЃРµРґРµР№ Рё Р±С‹Р» СѓР·РєРёРј РјРµСЃС‚РѕРј.
        this.schoolImpulseX = 0;
        this.schoolImpulseY = 0;
      }

      getTotalPerkLevels() {
        return (
          this.spikeLevel +
          this.tailLevel +
          this.shellLevel +
          this.mawLevel +
          this.tentacleLevel +
          this.agilityLevel
        );
      }

      applySpawnPerk(id) {
        if (this.perkIds.includes(id)) return;

        this.perkIds.push(id);

        if (id === 'spike') {
          this.hasSpike = true;
          this.spikeLevel += 1;
          this.predatorBonus += 0.1;
        }

        if (id === 'tail') {
          this.hasTail = true;
          this.tailLevel += 1;
        }

        if (id === 'shell') {
          this.hasShell = true;
          this.shellLevel += 1;
          this.damageReduction = Math.min(0.24, this.damageReduction + 0.08);
        }

        if (id === 'maw') {
          this.hasMaw = true;
          this.mawLevel += 1;
          this.foodGrowthBonus = Math.min(1.45, this.foodGrowthBonus + 0.1);
          this.predatorBonus += 0.05;
        }

        if (id === 'tentacle') {
          this.hasTentacle = true;
          this.tentacleLevel += 1;
        }

        if (id === 'agility') {
          this.hasAgility = true;
          this.agilityLevel += 1;
        }
      }

      getRadiusCap(player) {
        return calculateEnemyRadiusCap(player);
      }

      canEatTarget(target) {
        const mawModifier = this.mawLevel * 0.04;
        const spikeModifier = this.spikeLevel * 0.03;
        const dominanceRequirement = Math.max(
          1.01,
          ENEMY_EVOLUTION_CONFIG.DOMINANCE_RATIO - mawModifier - spikeModifier
        );

        return this.radius * this.predatorBonus > target.radius * dominanceRequirement;
      }

      grow(amount, player) {
        const maxRadius = this.getRadiusCap(player);
        if (this.radius >= maxRadius) return false;

        this.radius = Math.min(maxRadius, this.radius + amount * this.foodGrowthBonus);
        this.level = calculateLevelFromRadius(this.radius);
        this.eatPulse = Math.max(this.eatPulse, 1);
        return true;
      }

      tryEatFood(food, player) {
        if (!isWithinDistance(this, food, this.radius + food.radius + 1.5)) return false;

        const growth = food instanceof ShardFood
          ? ENEMY_EVOLUTION_CONFIG.SHARD_GROWTH
          : ENEMY_EVOLUTION_CONFIG.FOOD_GROWTH;

        this.foodEaten += 1;
        this.triggerSwallow(1);
        this.attackPulse = Math.max(this.attackPulse, 0.45);
        this.grow(growth, player);
        return true;
      }

      tryEatEnemy(target, player) {
        if (!this.canEatTarget(target)) return false;
        if (!isWithinDistance(this, target, this.radius + target.radius * 0.78)) return false;

        const shieldBlockedAttack = target.onAttack(this);
        if (shieldBlockedAttack) return false;

        const growth =
          ENEMY_EVOLUTION_CONFIG.PREY_GROWTH_BASE +
          target.radius * ENEMY_EVOLUTION_CONFIG.PREY_GROWTH_RADIUS_FACTOR;

        target.receiveImpact(1);
        this.enemyEaten += 1;
        this.attackPulse = 1;
        this.triggerSwallow(1);
        this.grow(growth, player);
        return true;
      }

      triggerSwallow(strength = 1) {
        this.swallowPulse = Math.max(this.swallowPulse, strength);
        this.eatPulse = Math.max(this.eatPulse, strength * 0.9);
        this.attackPulse = Math.max(this.attackPulse, strength * 0.55);
      }

      receiveImpact(strength = 1) {
        this.hurtPulse = Math.max(this.hurtPulse, strength);
        this.damageFlash = Math.max(this.damageFlash, 0.55 + strength * 0.35);
      }

      findNearbyTargets(player) {
        let closestFood = null;
        let closestFoodDistSq = Infinity;
        let closestPrey = null;
        let closestPreyDistSq = Infinity;
        let closestThreat = null;
        let closestThreatDistSq = Infinity;

        const foodSeekRange = ENEMY_EVOLUTION_CONFIG.FOOD_SEEK_RANGE + this.tentacleLevel * 26;
        const preySeekRange = ENEMY_EVOLUTION_CONFIG.PREY_SEEK_RANGE + this.mawLevel * 24 + this.spikeLevel * 16;
        const threatAvoidRange = ENEMY_EVOLUTION_CONFIG.THREAT_AVOID_RANGE + this.agilityLevel * 18;
        const maxEnemyRange = Math.max(preySeekRange, threatAvoidRange);
        const foodSeekRangeSq = foodSeekRange * foodSeekRange;
        const preySeekRangeSq = preySeekRange * preySeekRange;
        const threatAvoidRangeSq = threatAvoidRange * threatAvoidRange;

        if (!endlessMode && this.radius < this.getRadiusCap(player) - 0.25) {
          const nearbyFoods = getNearbyFoods(this.x, this.y, foodSeekRange, []);
          for (const food of nearbyFoods) {
            const dx = food.x - this.x;
            const dy = food.y - this.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < foodSeekRangeSq && distSq < closestFoodDistSq) {
              closestFood = food;
              closestFoodDistSq = distSq;
            }
          }
        }

        const nearbyEnemies = getNearbyEnemies(this.x, this.y, maxEnemyRange, []);
        for (const enemy of nearbyEnemies) {
          if (enemy === this) continue;

          const dx = enemy.x - this.x;
          const dy = enemy.y - this.y;
          const distSq = dx * dx + dy * dy;

          if (
            enemy.radius > this.radius * ENEMY_EVOLUTION_CONFIG.DOMINANCE_RATIO &&
            distSq < threatAvoidRangeSq &&
            distSq < closestThreatDistSq
          ) {
            closestThreat = enemy;
            closestThreatDistSq = distSq;
          }

          if (
            this.canEatTarget(enemy) &&
            distSq < preySeekRangeSq &&
            distSq < closestPreyDistSq
          ) {
            closestPrey = enemy;
            closestPreyDistSq = distSq;
          }
        }

        return { closestFood, closestPrey, closestThreat };
      }
    }
