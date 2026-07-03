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

        // Перк-состояния противника.
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

        // Визуальные параметры микроорганизма.
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

        // ---- Поведение AI ----
        // Состояние врага: 'wander' (бродит), 'forage' (ест корм),
        // 'hunt' (преследует добычу/игрока), 'flee' (бежит от угрозы),
        // 'ambush' (засада — медленное приближение перед рывком),
        // 'school' (стайное движение с сородичами).
        this.aiState = 'wander';
        this.aiStateTimer = 0;                        // тиков до следующего пересчёта состояния
        this.chasePersistence = 0;                    // «усталость» в погоне за игроком
        this.aiPersonality = Math.random();           // [0..1) — индивидуальные склонности
        this.ambushCharge = 0;                        // накопленный заряд засады
        this.spikeShotCooldown = 260 + Math.random() * 300;
        this.spikeChargeTimer = 0;
        this.spikeChargeDuration = 0;
        this.spikeAimAngle = 0;
        this.lastTargetX = 0;                         // куда направлялся в прошлый раз
        this.lastTargetY = 0;
        // Кэш стайного импульса: вычисляется в retarget-цикле, а не каждый
        // кадр — schooling требует O(k) поиска соседей и был узким местом.
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

      update(player, foods, enemies) {
        this.dirTimer -= 1;

        const endlessState = endlessMode ? getEndlessPressureState() : null;
        const endlessAggroScale = endlessState ? 1 + endlessState.pressure * 0.2 + endlessState.doomProgress * 0.34 : 1;
        const endlessSpeedScale = endlessState ? 1 + endlessState.pressure * 0.08 + endlessState.doomProgress * 0.13 : 1;
        const worldSpeedScale = getWorldSpeedScale();
        const isTouchDevice = typeof hasTouchControls === 'function' && hasTouchControls();
        const mobileGameplayScale = ENDLESS_CONFIG.MOBILE_GAMEPLAY_SPEED_SCALE ?? 0.9;
        const enemyPlatformSpeedScale = isTouchDevice ? 0.85 * mobileGameplayScale : (endlessMode ? 1.1 : 1);
        // Прогресс late-game: 0 вне endless, 0..2.2 в endless. Влияет на
        // скорость, реактивность поворота, силу засадного рывка. Это
        // ключевая переменная для нарастания сложности к финалу.
        const lateGameScale = endlessState ? endlessState.lateGameScale : 0;
        const playerIsEdibleThreat = playerCanEatTarget(this);
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (typeof updateEnemySpikeShooter === 'function') {
          updateEnemySpikeShooter(this, player, dx, dy, dist, lateGameScale);
        }
        const viewSpan = Math.max(canvas.width, canvas.height) / Math.max(0.1, camera.zoom || 1);
        const aiDistanceTier = dist > viewSpan * 0.74 + 220
          ? 2
          : dist > viewSpan * 0.48 + 150
            ? 1
            : 0;
        const aiStride = aiDistanceTier === 2
          ? (simulationLoad > 120 || performanceQuality < 0.78 ? 6 : 4)
          : aiDistanceTier === 1
            ? (simulationLoad > 120 || performanceQuality < 0.78 ? 4 : 2)
            : 1;

        const baseRetargetInterval = simulationLoad > 180
          ? 7
          : simulationLoad > 125
            ? 6
            : simulationLoad > 90
              ? 5
              : 3;
        const distanceRetargetMultiplier = aiDistanceTier === 2 ? 3 : aiDistanceTier === 1 ? 2 : 1;
        const retargetInterval = (baseRetargetInterval + (Math.floor(this.visualSeed * 10) % 2)) * distanceRetargetMultiplier;

        if (!this.aiRetargetInterval || this.aiRetargetInterval !== retargetInterval) {
          this.aiRetargetInterval = retargetInterval;
          this.aiRetargetOffset = Math.floor(this.visualSeed * 60) % this.aiRetargetInterval;
          this.cachedTargets = this.cachedTargets ?? { closestFood: null, closestPrey: null, closestThreat: null };
        }

        if (this.dirTimer <= 0) {
          this.dirTimer = 60 + Math.random() * 120;
          this.vx += (Math.random() - 0.5) * (1.2 + this.agilityLevel * 0.18) * endlessSpeedScale * worldSpeedScale;
          this.vy += (Math.random() - 0.5) * (1.2 + this.agilityLevel * 0.18) * endlessSpeedScale * worldSpeedScale;

          const maxDirectionSpeed = (1.8 + this.tailLevel * 0.18) * (endlessState ? (1 + endlessState.pressure * 0.05) : 1) * worldSpeedScale;
          const directionSpeed = Math.hypot(this.vx, this.vy);
          if (directionSpeed > maxDirectionSpeed) {
            this.vx = (this.vx / directionSpeed) * maxDirectionSpeed;
            this.vy = (this.vy / directionSpeed) * maxDirectionSpeed;
          }
        }

        const canRunExpensiveAI = aiStride <= 1 || ((simulationFrame + this.aiRetargetOffset) % aiStride === 0);
        const shouldRefreshTargets = canRunExpensiveAI && (!this.cachedTargets || ((simulationFrame + this.aiRetargetOffset) % this.aiRetargetInterval === 0));
        if (shouldRefreshTargets) {
          this.cachedTargets = this.findNearbyTargets(player);
        }
        const { closestFood, closestPrey, closestThreat } = this.cachedTargets;

        // ---------------------------------------------------------------
        // Конечный автомат поведения (FSM).
        // Решение пересчитывается раз в ~30 кадров, плюс с гистерезисом
        // (флипперства не будет: если в состоянии 'hunt' — игрок чуть отойдёт,
        // не сразу разворачиваемся). Параметр aiPersonality [0..1) делает
        // одинаковых по размеру врагов поведенчески разными.
        // ---------------------------------------------------------------
        this.aiStateTimer -= 1;

        // Архетип: большой и тяжёлый враг ≠ юркий мелкий.
        // sizeArchetype = 0 → юркий малыш; 1 → крупный апекс.
        const sizeArchetype = clamp(
          (this.radius - GROWTH_CONFIG.START_RADIUS) /
            Math.max(1, GROWTH_CONFIG.TARGET_MAX_RADIUS - GROWTH_CONFIG.START_RADIUS),
          0,
          1.4
        );
        // Дальность преследования зависит от размера и личности.
        const baseChase = 200 + sizeArchetype * 80 + this.aiPersonality * 70;
        const playerChaseRange = baseChase + this.mawLevel * 18
          + (endlessState ? endlessState.pressure * 26 + endlessState.doomProgress * 34 : 0);
        const playerFleeRange = 180 + this.agilityLevel * 22
          + (endlessState ? endlessState.pressure * 24 + endlessState.doomProgress * 44 : 0);

        // Решение о состоянии — раз в 30 кадров (~0.5 сек). В late-game
        // интервал сокращается до ~16 кадров (~0.27 сек) — враги
        // принимают решения почти вдвое быстрее, что объективно делает
        // их реактивнее без увеличения числа вычислений суммарно.
        if (this.aiStateTimer <= 0 && canRunExpensiveAI) {
          const baseInterval = 28 + Math.floor(this.aiPersonality * 14);
          const lateReduction = Math.floor(lateGameScale * 8); // до -17 кадров
          this.aiStateTimer = Math.max(12, baseInterval - lateReduction);

          let nextState = 'wander';

          // Главные угрозы — другие крупные враги и игрок, если он крупнее.
          const playerIsThreat = !playerIsEdibleThreat && player.radius > this.radius * 1.04 && dist < playerFleeRange;
          if (closestThreat || playerIsThreat) {
            nextState = 'flee';
          } else if (
            !playerIsEdibleThreat &&
            player.radius < this.radius * 0.97 &&
            dist < playerChaseRange &&
            // В late-game лимит «усталости» растёт с 240 до 540 — враги
            // упорнее, отрыв требует больше усилий.
            this.chasePersistence < 240 + lateGameScale * 150
          ) {
            // Большие/смелые с большей вероятностью идут в засаду,
            // мелкие — в прямую погоню.
            const ambushPreference = sizeArchetype * 0.5 + this.aiPersonality * 0.35;
            if (dist > playerChaseRange * 0.55 && ambushPreference > 0.55 && this.ambushCharge < 60) {
              nextState = 'ambush';
            } else {
              nextState = 'hunt';
            }
          } else if (closestPrey && !playerIsEdibleThreat) {
            nextState = 'hunt';
        } else if (!endlessMode && closestFood) {
            nextState = 'forage';
          } else {
            // Мелкие враги склонны сбиваться в стаи; крупные — нет.
            nextState = (sizeArchetype < 0.35 && this.aiPersonality > 0.3) ? 'school' : 'wander';
          }

          // Гистерезис: если только что закончили долгую погоню — отдохнём.
          if (this.aiState === 'hunt' && this.chasePersistence > 200 + lateGameScale * 130 && nextState === 'hunt') {
            nextState = 'wander';
            this.chasePersistence = 0;
          }

          this.aiState = nextState;
        }

        // Накопление «усталости погони» — нужно, чтобы игрок мог реально уйти.
        if (this.aiState === 'hunt' && !playerIsEdibleThreat && player.radius < this.radius * 0.97) {
          this.chasePersistence += 1;
        } else {
          this.chasePersistence = Math.max(0, this.chasePersistence - 2);
        }

        // ---------------------------------------------------------------
        // Состояния → силы. Старые формулы преследования / убегания
        // от игрока остаются как «базовое поведение реакции», но
        // модулируются через множители состояния.
        // ---------------------------------------------------------------
        const stateChaseScale  = this.aiState === 'hunt'   ? 1.35
                              : this.aiState === 'ambush' ? 0.25
                              : this.aiState === 'school' ? 0.55
                              : 0.85;
        const stateFleeScale   = this.aiState === 'flee'   ? 1.3
                              : this.aiState === 'ambush' ? 0.7
                              : 1.0;
        const stateForageScale = this.aiState === 'forage' ? 1.3
                              : this.aiState === 'hunt'   ? 0.4
                              : this.aiState === 'flee'   ? 0.2
                              : 1.0;

        // Базовое поведение по игроку (с учётом состояния).
        if (!playerIsEdibleThreat && player.radius < this.radius * 0.97 && dist < playerChaseRange) {
          const chaseStrength = (0.042 + this.mawLevel * 0.004) * endlessAggroScale * stateChaseScale * worldSpeedScale;
          this.vx += (dx / dist) * chaseStrength;
          this.vy += (dy / dist) * chaseStrength;
          this.attackPulse = Math.min(1, this.attackPulse + 0.016 * endlessAggroScale * stateChaseScale);
        } else if (playerIsEdibleThreat && dist < playerFleeRange) {
          const fleeStrength = (0.05 + this.agilityLevel * 0.005 + this.tailLevel * 0.002)
            * (endlessState ? 1 + endlessState.pressure * 0.22 + endlessState.doomProgress * 0.28 : 1)
            * stateFleeScale
            * worldSpeedScale;
          this.vx -= (dx / dist) * fleeStrength;
          this.vy -= (dy / dist) * fleeStrength;
          this.fleeShake = Math.min(1, this.fleeShake + 0.16);
        }

        this.isFleeing = Boolean(closestThreat || playerIsEdibleThreat);

        if (closestThreat) {
          const tx = closestThreat.x - this.x;
          const ty = closestThreat.y - this.y;
          const threatDist = Math.hypot(tx, ty) || 1;
          const strength = (0.05 + this.agilityLevel * 0.004) * stateFleeScale * worldSpeedScale;
          this.vx -= (tx / threatDist) * strength;
          this.vy -= (ty / threatDist) * strength;
          this.fleeShake = Math.min(1, this.fleeShake + 0.12);
        } else {
          this.fleeShake *= 0.9;
        }

        const fearShakeAmount = this.isFleeing ? this.fleeShake : 0;
        if (fearShakeAmount > 0.01) {
          const fearWave = this.swimPhase * 1.7 + this.visualSeed * 1.9;
          this.fleeShakeX = Math.sin(fearWave) * fearShakeAmount * 2.15;
          this.fleeShakeY = Math.cos(fearWave * 1.11 + 0.6) * fearShakeAmount * 1.6;
        } else {
          this.fleeShakeX = 0;
          this.fleeShakeY = 0;
        }

        if (!closestThreat && !playerIsEdibleThreat && closestPrey) {
          const tx = closestPrey.x - this.x;
          const ty = closestPrey.y - this.y;
          const preyDist = Math.hypot(tx, ty) || 1;
          const preyDrive = (0.03 + this.spikeLevel * 0.004 + this.mawLevel * 0.003)
            * endlessAggroScale * stateChaseScale * worldSpeedScale;
          this.vx += (tx / preyDist) * preyDrive;
          this.vy += (ty / preyDist) * preyDrive;
          this.attackPulse = Math.min(1, this.attackPulse + 0.018 * endlessAggroScale * stateChaseScale);
        } else if (!endlessMode && !closestThreat && closestFood) {
          const tx = closestFood.x - this.x;
          const ty = closestFood.y - this.y;
          const foodDist = Math.hypot(tx, ty) || 1;
          const foragePush = (0.022 + this.tentacleLevel * 0.003)
            * (endlessState ? (1 + endlessState.pressure * 0.05) : 1)
            * stateForageScale
            * worldSpeedScale;
          this.vx += (tx / foodDist) * foragePush;
          this.vy += (ty / foodDist) * foragePush;
        }

        // ---------------------------------------------------------------
        // Дополнительные состояния, дающие игре характер.
        // ---------------------------------------------------------------

        // SCHOOLING — мелкие враги сбиваются в стайки.
        // Импульс пересчитывается только в retarget-цикле (раз в ~5 кадров),
        // а применяется каждый кадр через кэш. Это убирает дорогой
        // getNearbyEnemies из горячего пути.
        if (shouldRefreshTargets) {
          if (this.aiState === 'school' && closestPrey === null) {
            const schoolRange = 90;
            const schoolRangeSq = schoolRange * schoolRange;
            let mateX = 0, mateY = 0, mateCount = 0;
            const nearby = getNearbyEnemies(this.x, this.y, schoolRange);
            for (let n = 0; n < nearby.length; n++) {
              const mate = nearby[n];
              if (mate === this) continue;
              if (Math.abs(mate.radius - this.radius) > this.radius * 0.4) continue;
              const mdx = mate.x - this.x;
              const mdy = mate.y - this.y;
              const mdSq = mdx * mdx + mdy * mdy;
              if (mdSq < schoolRangeSq && mdSq > 1) {
                mateX += mdx; mateY += mdy; mateCount++;
              }
            }
            if (mateCount > 0) {
              const ax = mateX / mateCount;
              const ay = mateY / mateCount;
              const aLen = Math.hypot(ax, ay) || 1;
              this.schoolImpulseX = (ax / aLen) * 0.012 * worldSpeedScale;
              this.schoolImpulseY = (ay / aLen) * 0.012 * worldSpeedScale;
            } else {
              this.schoolImpulseX = 0;
              this.schoolImpulseY = 0;
            }
          } else {
            this.schoolImpulseX = 0;
            this.schoolImpulseY = 0;
          }
        }
        // Применяем сохранённый импульс каждый кадр (дёшево).
        this.vx += this.schoolImpulseX;
        this.vy += this.schoolImpulseY;

        // AMBUSH — почти стоим, копим заряд. По достижению 60+ кадров —
        // короткий выброс в сторону игрока, после чего обнуляем заряд.
        // В late-game подготовка короче (до 30 кадров) — засады чаще и
        // неожиданнее.
        if (this.aiState === 'ambush') {
          this.vx *= 0.93;
          this.vy *= 0.93;
          this.ambushCharge += 1;
          const ambushThreshold = Math.max(30, 60 - lateGameScale * 14);
          const centerVisible = isWithinBounds(this, getViewBounds(0), 0);
          if (this.ambushCharge > ambushThreshold && !playerIsEdibleThreat && centerVisible) {
            const burst = (1.6 + sizeArchetype * 0.6 + lateGameScale * 0.4) * worldSpeedScale;
            this.vx += (dx / dist) * burst;
            this.vy += (dy / dist) * burst;
            this.attackPulse = 1;
            this.aiState = 'hunt';
            this.aiStateTimer = 40;
            this.ambushCharge = 0;
          }
        } else {
          this.ambushCharge = Math.max(0, this.ambushCharge - 1);
        }

        if (this.spikeChargeTimer > 0) {
          this.vx *= 0.9;
          this.vy *= 0.9;
          this.attackPulse = Math.max(this.attackPulse, 0.72);
        }

        // Tentacle pull — раньше итерировался по ВСЕМ еды кадр.
        // Перевели на spatial index: O(k) вместо O(n) на врага.
        if (!endlessMode && this.hasTentacle && (aiDistanceTier === 0 || canRunExpensiveAI)) {
          const pullRange = this.radius + 34 + this.tentacleLevel * 18;
          const pullRangeSq = pullRange * pullRange;
          const pullFoods = getNearbyFoods(this.x, this.y, pullRange);
          for (let pi = 0; pi < pullFoods.length; pi++) {
            const food = pullFoods[pi];
            const tx = this.x - food.x;
            const ty = this.y - food.y;
            const pullDistSq = tx * tx + ty * ty;
            if (pullDistSq < pullRangeSq && pullDistSq > 1) {
              const pullDist = Math.sqrt(pullDistSq);
              const force = (1 - pullDist / pullRange) * (0.22 + this.tentacleLevel * 0.08);
              food.x += (tx / pullDist) * force;
              food.y += (ty / pullDist) * force;
            }
          }
        }

        // ---------------------------------------------------------------
        // Скорость и поворот.
        // lateGameScale (0..2.2) добавляется к maxSpeed и agility-повороту,
        // чтобы поздняя игра становилась объективно быстрее — крупные
        // апексные хищники должны нагнетать страх, а не быть «грузными».
        // ---------------------------------------------------------------
        const baseMaxSpeed = this.hasShield ? 2.1 : 2.35;
        const perkSpeedBonus = this.tailLevel * 0.26 + this.agilityLevel * 0.08;
        const shellPenalty = this.shellLevel * 0.07;
        const stateSpeedCap = this.aiState === 'hunt' ? 1.08
                             : this.aiState === 'flee' ? 1.12
                             : 1.0;
        // late-game ускорение: +0.45 к максималке к финалу endless.
        const lateSpeedBonus = lateGameScale * 0.28;
        const computedSpeed = (baseMaxSpeed + perkSpeedBonus - shellPenalty + lateSpeedBonus) * stateSpeedCap * worldSpeedScale;
        const maxSpeed = Math.max((this.hasShield ? 1.14 : 1.26) * worldSpeedScale, computedSpeed);
        const currentSpeed = Math.hypot(this.vx, this.vy);
        if (currentSpeed > maxSpeed) {
          this.vx = (this.vx / currentSpeed) * maxSpeed;
          this.vy = (this.vy / currentSpeed) * maxSpeed;
        }

        this.x += this.vx * enemyPlatformSpeedScale;
        this.y += this.vy * enemyPlatformSpeedScale;

        this.vx *= 0.998;
        this.vy *= 0.998;

        const moveAngle = this.spikeChargeTimer > 0
          ? this.spikeAimAngle
          : Math.atan2(this.vy || Math.sin(this.visualSeed), this.vx || Math.cos(this.visualSeed));
        let angleDelta = moveAngle - this.displayAngle;
        while (angleDelta > Math.PI) angleDelta -= Math.PI * 2;
        while (angleDelta < -Math.PI) angleDelta += Math.PI * 2;
        this.turnTilt = clamp(angleDelta, -0.36, 0.36);
        // Враги в late-game поворачиваются ощутимо живее.
        const turnResponsiveness = this.spikeChargeTimer > 0
          ? 0.24 + this.agilityLevel * 0.018
          : 0.14 + this.agilityLevel * 0.018 + lateGameScale * 0.024;
        this.displayAngle += angleDelta * turnResponsiveness;

        const animationCurrentSpeed = (currentSpeed * enemyPlatformSpeedScale) / Math.max(1, worldSpeedScale);
        this.swimPhase += 0.11 + animationCurrentSpeed * 0.12 + this.tailLevel * 0.02;
        this.eatPulse *= 0.9;
        this.attackPulse *= 0.92;
        this.swallowPulse *= 0.88;
        this.hurtPulse *= 0.86;
        this.damageFlash *= 0.84;
      }

      drawSpikeChargeWarning() {
        if (this.spikeChargeTimer <= 0 || this.spikeChargeDuration <= 0) return;

        const progress = clamp(1 - this.spikeChargeTimer / this.spikeChargeDuration, 0, 1);
        const pulse = 0.78 + Math.sin(frameTime * 0.18) * 0.22;
        const mouthX = this.x + Math.cos(this.spikeAimAngle) * this.radius * 0.9;
        const mouthY = this.y + Math.sin(this.spikeAimAngle) * this.radius * 0.9;
        const chargeRadius = this.radius * (0.45 + progress * 0.42);
        const alpha = (0.28 + progress * 0.42) * pulse;

        ctx.save();
        ctx.translate(mouthX, mouthY);
        ctx.rotate(this.spikeAimAngle);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.globalAlpha = alpha;
        ctx.strokeStyle = 'rgba(255, 142, 126, 0.95)';
        ctx.lineWidth = Math.max(2, this.radius * 0.07);
        ctx.beginPath();
        ctx.arc(0, 0, chargeRadius, -0.9, 0.9);
        ctx.stroke();

        ctx.globalAlpha = alpha * 0.42;
        ctx.fillStyle = 'rgba(255, 120, 106, 0.55)';
        ctx.beginPath();
        ctx.moveTo(this.radius * 0.12, 0);
        ctx.lineTo(this.radius * (1.05 + progress * 0.4), -this.radius * 0.18);
        ctx.lineTo(this.radius * (1.05 + progress * 0.4), this.radius * 0.18);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      onAttack(attacker) {
        return false;
      }

      getSpriteCacheKey(fillColors, eyeColor) {
        return [
          'enemy-body',
          this.type,
          this.hasShield ? 1 : 0,
          Math.min(4, this.tailLevel),
          Math.min(4, this.spikeLevel),
          Math.min(4, this.shellLevel),
          Math.min(4, this.mawLevel),
          Math.min(4, this.tentacleLevel),
          Math.min(4, this.agilityLevel),
          fillColors.join('|'),
          eyeColor,
        ].join(':');
      }

      getCachedBodySprite(fillColors, eyeColor) {
        const key = this.getSpriteCacheKey(fillColors, eyeColor);
        if (enemySpriteCache.has(key)) {
          const sprite = enemySpriteCache.get(key);
          enemySpriteCache.delete(key);
          enemySpriteCache.set(key, sprite);
          return sprite;
        }

        const cacheLimit = typeof hasTouchControls === 'function' && hasTouchControls() ? 32 : 64;
        while (enemySpriteCache.size >= cacheLimit) {
          const oldestKey = enemySpriteCache.keys().next().value;
          if (oldestKey === undefined) break;
          enemySpriteCache.delete(oldestKey);
        }

        const sprite = createSpriteCanvas(400, 250, (spriteCtx, spriteW, spriteH) => {
          const originX = 220;
          const originY = spriteH * 0.5;
          const radius = 64;
          const tailLevel = Math.min(4, this.tailLevel);
          const spikeLevel = Math.min(4, this.spikeLevel);
          const shellLevel = Math.min(4, this.shellLevel);
          const mawLevel = Math.min(4, this.mawLevel);
          const tentacleLevel = Math.min(4, this.tentacleLevel);
          const totalPerks = tailLevel + spikeLevel + shellLevel + mawLevel + tentacleLevel + Math.min(4, this.agilityLevel);
          const width = radius * (1.1 + totalPerks * 0.012);
          const height = radius * (0.8 + totalPerks * 0.005);
          const dorsalHeight = 0.18 + totalPerks * 0.018;

          spriteCtx.save();
          spriteCtx.translate(originX, originY);

          if (tailLevel > 0) {
            const tailBaseX = -width * 0.78;
            const tailTipX = -width * (1.62 + tailLevel * 0.16);
            const tailFinHeight = height * (0.54 + tailLevel * 0.05);
            const splitDepth = width * (0.16 + tailLevel * 0.018);

            const tailGradient = spriteCtx.createLinearGradient(tailBaseX, 0, tailTipX, 0);
            tailGradient.addColorStop(0, 'rgba(95,245,224,0.16)');
            tailGradient.addColorStop(0.58, 'rgba(205,255,244,0.48)');
            tailGradient.addColorStop(1, 'rgba(242,255,250,0.2)');
            spriteCtx.fillStyle = tailGradient;
            spriteCtx.beginPath();
            spriteCtx.moveTo(tailBaseX, 0);
            spriteCtx.bezierCurveTo(-width, -tailFinHeight * 0.28, -width * 1.28, -tailFinHeight * 0.54, tailTipX, -tailFinHeight * 0.12);
            spriteCtx.quadraticCurveTo(tailTipX - splitDepth * 0.58, 0, tailTipX - splitDepth, 0);
            spriteCtx.quadraticCurveTo(tailTipX - splitDepth * 0.58, 0, tailTipX, tailFinHeight * 0.12);
            spriteCtx.bezierCurveTo(-width * 1.28, tailFinHeight * 0.54, -width, tailFinHeight * 0.28, tailBaseX, 0);
            spriteCtx.closePath();
            spriteCtx.fill();

            spriteCtx.strokeStyle = 'rgba(236,255,250,0.72)';
            spriteCtx.lineWidth = Math.max(1.1, radius * 0.025);
            spriteCtx.stroke();
          } else {
            spriteCtx.strokeStyle = 'rgba(184, 255, 242, 0.7)';
            spriteCtx.lineWidth = Math.max(1.4, radius * 0.12);
            spriteCtx.lineCap = 'round';
            spriteCtx.beginPath();
            spriteCtx.moveTo(-width * 0.76, 0);
            spriteCtx.quadraticCurveTo(-width * 1.18, height * 0.54, -width * 1.48, height * 0.18);
            spriteCtx.stroke();
          }

          if (totalPerks > 0) {
            spriteCtx.fillStyle = 'rgba(210, 255, 244, 0.17)';
            spriteCtx.beginPath();
            spriteCtx.moveTo(-width * 0.46, -height * 0.35);
            spriteCtx.quadraticCurveTo(-width * 0.08, -height * (1 + dorsalHeight), width * 0.22, -height * 0.28);
            spriteCtx.quadraticCurveTo(-width * 0.03, -height * 0.1, -width * 0.46, -height * 0.35);
            spriteCtx.fill();
          }

          if (tentacleLevel > 0) {
            const tendrilCount = Math.min(4, 1 + tentacleLevel);
            const fanArc = 0.72 + tentacleLevel * 0.08;
            for (let i = 0; i < tendrilCount; i++) {
              const spreadT = tendrilCount === 1 ? 0.5 : i / (tendrilCount - 1);
              const localAngle = -fanArc * 0.5 + spreadT * fanArc;
              const startX = width * 0.24;
              const startY = Math.sin(localAngle) * height * 0.54;
              const length = width * (0.72 + tentacleLevel * 0.12);
              const endX = startX + Math.cos(localAngle) * length;
              const endY = startY + Math.sin(localAngle) * length * 0.74;
              const thickness = Math.max(2.2, radius * (0.06 + tentacleLevel * 0.008));

              spriteCtx.strokeStyle = 'rgba(120,255,228,0.82)';
              spriteCtx.lineWidth = thickness;
              spriteCtx.lineCap = 'round';
              spriteCtx.beginPath();
              spriteCtx.moveTo(startX, startY);
              spriteCtx.bezierCurveTo(width * 0.55, startY + height * 0.14 * Math.sin(localAngle), width * 0.84, endY, endX, endY);
              spriteCtx.stroke();
            }
          }

          const gradient = spriteCtx.createRadialGradient(-width * 0.25, -height * 0.35, width * 0.12, 0, 0, width * 1.08);
          gradient.addColorStop(0, fillColors[0]);
          gradient.addColorStop(0.55, fillColors[1]);
          gradient.addColorStop(1, fillColors[2] || fillColors[1]);

          spriteCtx.fillStyle = gradient;
          spriteCtx.beginPath();
          spriteCtx.ellipse(0, 0, width, height, 0, 0, Math.PI * 2);
          spriteCtx.fill();

          spriteCtx.strokeStyle = 'rgba(215,255,248,0.38)';
          spriteCtx.lineWidth = Math.max(1, radius * 0.045);
          spriteCtx.beginPath();
          spriteCtx.ellipse(0, 0, width * 1.02, height * 1.03, 0, 0, Math.PI * 2);
          spriteCtx.stroke();

          if (shellLevel > 0) {
            spriteCtx.strokeStyle = `rgba(190,255,255,${0.2 + shellLevel * 0.07})`;
            spriteCtx.lineWidth = 1.6 + shellLevel * 0.55;
            spriteCtx.beginPath();
            spriteCtx.ellipse(0, 0, width * 0.84, height * 0.74, 0, 0, Math.PI * 2);
            spriteCtx.stroke();
          }

          spriteCtx.fillStyle = 'rgba(255,255,255,0.14)';
          spriteCtx.beginPath();
          spriteCtx.ellipse(-width * 0.08, 0, width * 0.24, height * 0.3, 0.12, 0, Math.PI * 2);
          spriteCtx.fill();

          spriteCtx.fillStyle = 'rgba(255,255,255,0.08)';
          for (let i = 0; i < Math.min(3, 1 + Math.floor(totalPerks / 3)); i++) {
            const ox = Math.sin(this.bodyPatternSeed + i * 1.7) * width * 0.24;
            const oy = Math.cos(this.bodyPatternSeed * 1.2 + i * 1.1) * height * 0.22;
            spriteCtx.beginPath();
            spriteCtx.arc(ox, oy, Math.max(1.4, radius * 0.045 + (i % 2) * 0.6), 0, Math.PI * 2);
            spriteCtx.fill();
          }

          const mouthScale = 0.22 + mawLevel * 0.055;
          spriteCtx.fillStyle = 'rgba(28, 12, 18, 0.52)';
          spriteCtx.beginPath();
          spriteCtx.ellipse(width * 0.74, 0, width * (0.16 + mawLevel * 0.015), height * mouthScale, 0, -Math.PI * 0.9, Math.PI * 0.9);
          spriteCtx.fill();

          if (spikeLevel > 0) {
            const spikeLength = width * (0.18 + spikeLevel * 0.07);
            const spikeWidth = Math.max(width * 0.06, width * (0.055 + spikeLevel * 0.008));
            const rootX = width * 0.5;
            const tipX = width * 0.68 + spikeLength;
            const drawCheekSpike = (side) => {
              const rootY = side * height * 0.42;
              const tipY = side * height * 0.6;
              const spikeGradient = spriteCtx.createLinearGradient(rootX, rootY, tipX, tipY);
              spikeGradient.addColorStop(0, 'rgba(90,255,228,0.18)');
              spikeGradient.addColorStop(0.42, 'rgba(220,255,250,0.96)');
              spikeGradient.addColorStop(1, 'rgba(255,255,255,1)');
              spriteCtx.fillStyle = spikeGradient;
              spriteCtx.beginPath();
              spriteCtx.moveTo(rootX, rootY - spikeWidth);
              spriteCtx.quadraticCurveTo(width * 0.7, rootY - spikeWidth - side * height * 0.05, tipX, tipY);
              spriteCtx.quadraticCurveTo(width * 0.7, rootY + spikeWidth - side * height * 0.05, rootX, rootY + spikeWidth);
              spriteCtx.closePath();
              spriteCtx.fill();
            };
            drawCheekSpike(-1);
            drawCheekSpike(1);
          }

          spriteCtx.fillStyle = eyeColor;
          spriteCtx.beginPath();
          spriteCtx.ellipse(width * 0.15, -height * 0.24, Math.max(2, radius * 0.14), Math.max(1.5, radius * 0.11), 0, 0, Math.PI * 2);
          spriteCtx.fill();

          spriteCtx.fillStyle = 'rgba(15, 45, 40, 0.7)';
          spriteCtx.beginPath();
          spriteCtx.arc(width * 0.2, -height * 0.24, Math.max(1.2, radius * 0.05), 0, Math.PI * 2);
          spriteCtx.fill();

          spriteCtx.fillStyle = 'rgba(255,255,255,0.55)';
          spriteCtx.beginPath();
          spriteCtx.arc(-width * 0.24, -height * 0.28, Math.max(2, radius * 0.1), 0, Math.PI * 2);
          spriteCtx.fill();

          spriteCtx.restore();
        });

        sprite.originX = 220;
        sprite.originY = sprite.height * 0.5;
        enemySpriteCache.set(key, sprite);
        return sprite;
      }

      drawCachedBody(fillColors, eyeColor = 'rgba(255,255,255,0.92)') {
        const speed = Math.hypot(this.vx, this.vy);
        const pulse = Math.sin(this.swimPhase) * 0.05;
        const chargeProgress = this.spikeChargeDuration > 0
          ? clamp(1 - this.spikeChargeTimer / this.spikeChargeDuration, 0, 1)
          : 0;
        const chargeSqueeze = chargeProgress * chargeProgress;
        const scale = this.radius / 64;
        const scaleX = scale * (1 + pulse + speed * 0.018 + this.attackPulse * 0.045 + this.eatPulse * 0.03 - chargeSqueeze * 0.16);
        const scaleY = scale * (1 - pulse * 0.45 + this.eatPulse * 0.025 + this.swallowPulse * 0.03 - this.hurtPulse * 0.04 + chargeSqueeze * 0.11);
        const damageJitter = this.hurtPulse * 3.2;
        const damageWave = frameTime * 0.2 + this.visualSeed;
        const jitterX = this.fleeShakeX + Math.sin(damageWave) * damageJitter;
        const jitterY = this.fleeShakeY + Math.cos(damageWave * 0.82 + this.visualSeed * 0.7) * damageJitter * 0.75;
        const spriteKey = this.getSpriteCacheKey(fillColors, eyeColor);

        if (!enemySpriteCache.has(spriteKey)) {
          if (typeof scheduleRenderWarmupTask === 'function') {
            scheduleRenderWarmupTask(() => this.getCachedBodySprite(fillColors, eyeColor), true);
          }
          const bodyWidth = 64 * (1.1 + this.getTotalPerkLevels() * 0.012);
          const bodyHeight = 64 * (0.8 + this.getTotalPerkLevels() * 0.005);
          ctx.save();
          ctx.translate(this.x + jitterX, this.y + jitterY);
          ctx.rotate(this.displayAngle + this.turnTilt * 0.32);
          ctx.scale(scaleX, scaleY);
          ctx.fillStyle = fillColors[1];
          ctx.beginPath();
          ctx.ellipse(0, 0, bodyWidth, bodyHeight, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = eyeColor;
          ctx.beginPath();
          ctx.ellipse(bodyWidth * 0.15, -bodyHeight * 0.24, 8, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          return;
        }

        const sprite = this.getCachedBodySprite(fillColors, eyeColor);

        ctx.save();
        ctx.translate(this.x + jitterX, this.y + jitterY);
        ctx.rotate(this.displayAngle + this.turnTilt * 0.32);
        ctx.scale(scaleX, scaleY);
        ctx.drawImage(sprite, -sprite.originX, -sprite.originY);

        if (this.hurtPulse > 0.02) {
          ctx.fillStyle = `rgba(255, 130, 160, ${0.12 + this.damageFlash * 0.16})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, 76, 52, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
        this.drawSpikeChargeWarning();
      }

      drawBody(fillColors, eyeColor = 'rgba(255,255,255,0.92)') {
        this.drawCachedBody(fillColors, eyeColor);
        return;

        const speed = Math.hypot(this.vx, this.vy);
        const pulse = Math.sin(this.swimPhase) * 0.07;
        const totalPerks = this.getTotalPerkLevels();
        const dorsalHeight = 0.18 + totalPerks * 0.018;
        const squeeze = 1 + pulse + this.eatPulse * 0.08 - this.swallowPulse * 0.03;
        const width = this.radius * (1.05 + speed * 0.08 + this.attackPulse * 0.12 + totalPerks * 0.012 + this.hurtPulse * 0.02);
        const height = this.radius * (0.78 - pulse * 0.55 + this.eatPulse * 0.05 + totalPerks * 0.006 + this.swallowPulse * 0.04 - this.hurtPulse * 0.08);
        const enemyDecorEnabled = shouldRenderEnemyDecor();
        const enemyMicroDecorEnabled = shouldRenderEnemyMicroDecor();

        const damageJitter = this.hurtPulse * 3.2;
        const damageWave = frameTime * 0.2 + this.visualSeed;
        const jitterX = this.fleeShakeX + Math.sin(damageWave) * damageJitter;
        const jitterY = this.fleeShakeY + Math.cos(damageWave * 0.82 + this.visualSeed * 0.7) * damageJitter * 0.75;

        ctx.save();
        ctx.translate(this.x + jitterX, this.y + jitterY);
        ctx.rotate(this.displayAngle + this.turnTilt * 0.45);

        if (this.hasTail) {
          ctx.save();
          const tailSwing = Math.sin(this.swimPhase * 0.88 + this.finOffset) * height * (0.34 + this.tailLevel * 0.035);
          const tailTipSwing = Math.sin(this.swimPhase * 0.88 + this.finOffset - 0.78) * height * (0.56 + this.tailLevel * 0.05);
          const tailBaseX = -width * 0.78;
          const tailMidX = -width * (1.14 + this.tailLevel * 0.1);
          const tailTipX = -width * (1.62 + this.tailLevel * 0.18);
          const tailFinHeight = height * (0.54 + this.tailLevel * 0.05);
          const splitDepth = width * (0.16 + this.tailLevel * 0.018);

          ctx.strokeStyle = 'rgba(184, 255, 242, 0.82)';
          ctx.lineWidth = Math.max(1.5, this.radius * (0.09 + this.tailLevel * 0.009));
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(tailBaseX, 0);
          ctx.bezierCurveTo(
            -width * 0.98,
            tailSwing * 0.22,
            tailMidX,
            tailSwing,
            tailTipX - splitDepth * 0.42,
            tailTipSwing * 0.22
          );
          ctx.stroke();

          const tailGradient = ctx.createLinearGradient(tailBaseX, 0, tailTipX, 0);
          tailGradient.addColorStop(0, 'rgba(95,245,224,0.16)');
          tailGradient.addColorStop(0.58, 'rgba(205,255,244,0.46)');
          tailGradient.addColorStop(1, 'rgba(242,255,250,0.2)');
          ctx.fillStyle = tailGradient;
          ctx.beginPath();
          ctx.moveTo(tailBaseX, 0);
          ctx.bezierCurveTo(
            -width * 0.98,
            -tailFinHeight * 0.24 + tailSwing * 0.18,
            tailMidX,
            -tailFinHeight * 0.56 + tailSwing * 0.34,
            tailTipX,
            -tailFinHeight * 0.16 + tailTipSwing
          );
          ctx.quadraticCurveTo(
            tailTipX - splitDepth * 0.56,
            tailTipSwing * 0.18,
            tailTipX - splitDepth,
            tailTipSwing * 0.04
          );
          ctx.quadraticCurveTo(
            tailTipX - splitDepth * 0.56,
            -tailTipSwing * 0.18,
            tailTipX,
            tailFinHeight * 0.16 + tailTipSwing
          );
          ctx.bezierCurveTo(
            tailMidX,
            tailFinHeight * 0.56 + tailSwing * 0.34,
            -width * 0.98,
            tailFinHeight * 0.24 + tailSwing * 0.18,
            tailBaseX,
            0
          );
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = 'rgba(236,255,250,0.78)';
          ctx.lineWidth = Math.max(1.05, this.radius * 0.022);
          ctx.beginPath();
          ctx.moveTo(tailBaseX, 0);
          ctx.bezierCurveTo(
            -width * 0.98,
            -tailFinHeight * 0.24 + tailSwing * 0.18,
            tailMidX,
            -tailFinHeight * 0.56 + tailSwing * 0.34,
            tailTipX,
            -tailFinHeight * 0.16 + tailTipSwing
          );
          ctx.quadraticCurveTo(
            tailTipX - splitDepth * 0.56,
            tailTipSwing * 0.18,
            tailTipX - splitDepth,
            tailTipSwing * 0.04
          );
          ctx.quadraticCurveTo(
            tailTipX - splitDepth * 0.56,
            -tailTipSwing * 0.18,
            tailTipX,
            tailFinHeight * 0.16 + tailTipSwing
          );
          ctx.bezierCurveTo(
            tailMidX,
            tailFinHeight * 0.56 + tailSwing * 0.34,
            -width * 0.98,
            tailFinHeight * 0.24 + tailSwing * 0.18,
            tailBaseX,
            0
          );
          ctx.closePath();
          ctx.stroke();

          ctx.restore();
        } else {
          ctx.save();
          ctx.strokeStyle = 'rgba(184, 255, 242, 0.7)';
          ctx.lineWidth = Math.max(1.4, this.radius * 0.12);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(-width * 0.75, 0);
          ctx.quadraticCurveTo(
            -width * (1.15 + Math.sin(this.swimPhase + this.finOffset) * 0.12),
            Math.sin(this.swimPhase * 1.2 + this.finOffset) * height * 0.85,
            -width * 1.5,
            Math.cos(this.swimPhase * 0.9 + this.finOffset) * height * 0.3
          );
          ctx.stroke();
          ctx.restore();
        }

        if (enemyDecorEnabled) {
          // Дорсальные наросты.
          ctx.save();
          ctx.fillStyle = 'rgba(210, 255, 244, 0.18)';
          ctx.beginPath();
          ctx.moveTo(-width * 0.46, -height * 0.35);
          ctx.quadraticCurveTo(-width * 0.08, -height * (1 + dorsalHeight), width * 0.22, -height * 0.28);
          ctx.quadraticCurveTo(-width * 0.03, -height * 0.1, -width * 0.46, -height * 0.35);
          ctx.fill();
          ctx.restore();
        }

        if (this.hasTentacle) {
          ctx.save();
          const tendrilCount = enemyMicroDecorEnabled ? Math.min(3, 1 + this.tentacleLevel) : Math.max(2, 1 + this.tentacleLevel);
          const fanArc = 0.7 + this.tentacleLevel * 0.1;
          const pulse = Math.sin(this.swimPhase * 1.08) * 0.05;

          for (let i = 0; i < tendrilCount; i++) {
            const spreadT = tendrilCount === 1 ? 0.5 : i / (tendrilCount - 1);
            const localAngle = -fanArc * 0.5 + spreadT * fanArc + pulse;
            const startX = width * 0.24;
            const startY = Math.sin(localAngle) * height * 0.54;
            const length = width * (0.72 + this.tentacleLevel * 0.14) + Math.sin(this.swimPhase * 0.92 + i * 0.75) * this.radius * 0.08;
            const curvePhase = this.swimPhase * 0.9 + i * 0.82;
            const ctrl1X = width * (0.52 + this.tentacleLevel * 0.04);
            const ctrl1Y = startY + Math.sin(curvePhase) * height * (0.22 + this.tentacleLevel * 0.035);
            const ctrl2X = width * (0.78 + this.tentacleLevel * 0.07);
            const ctrl2Y = startY + Math.cos(curvePhase * 1.18) * height * (0.32 + this.tentacleLevel * 0.04);
            const endX = startX + Math.cos(localAngle) * length;
            const endY = startY + Math.sin(localAngle) * length * 0.74 + Math.sin(curvePhase * 1.35) * height * 0.18;
            const thickness = Math.max(2.2, this.radius * (0.06 + this.tentacleLevel * 0.008));
            const endSize = Math.max(1.1, thickness * 0.26);

            ctx.save();
            ctx.strokeStyle = 'rgba(120,255,228,0.92)';
            ctx.lineWidth = thickness;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.bezierCurveTo(ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, endX, endY);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(230,255,248,0.58)';
            ctx.lineWidth = Math.max(0.95, thickness * 0.34);
            ctx.beginPath();
            ctx.moveTo(startX + thickness * 0.18, startY);
            ctx.bezierCurveTo(ctrl1X, ctrl1Y - thickness * 0.12, ctrl2X, ctrl2Y - thickness * 0.1, endX, endY);
            ctx.stroke();

            const webAlpha = 0.08 + this.tentacleLevel * 0.015;
            if (enemyMicroDecorEnabled && i < tendrilCount - 1 && i % 2 === 0) {
              const nextSpreadT = (i + 1) / (tendrilCount - 1);
              const nextAngle = -fanArc * 0.5 + nextSpreadT * fanArc + pulse;
              const nextEndX = startX + Math.cos(nextAngle) * length * 0.88;
              const nextEndY = Math.sin(nextAngle) * height * 0.54 + Math.sin(curvePhase * 1.1) * height * 0.06 + Math.sin(nextAngle) * length * 0.54;
              ctx.fillStyle = `rgba(140,255,235,${webAlpha})`;
              ctx.beginPath();
              ctx.moveTo(startX + thickness * 0.22, startY);
              ctx.quadraticCurveTo(width * 0.66, (startY + nextEndY) * 0.18, nextEndX, nextEndY);
              ctx.quadraticCurveTo(width * 0.54, (startY + nextEndY) * 0.08, startX - thickness * 0.08, startY);
              ctx.closePath();
              ctx.fill();
            }

            const suckerCount = enemyMicroDecorEnabled ? Math.max(1, 1 + Math.floor(this.tentacleLevel * 0.5)) : 1;
            for (let j = 1; j <= suckerCount; j++) {
              const t = j / (suckerCount + 1);
              const px =
                Math.pow(1 - t, 3) * startX +
                3 * Math.pow(1 - t, 2) * t * ctrl1X +
                3 * (1 - t) * t * t * ctrl2X +
                t * t * t * endX;
              const py =
                Math.pow(1 - t, 3) * startY +
                3 * Math.pow(1 - t, 2) * t * ctrl1Y +
                3 * (1 - t) * t * t * ctrl2Y +
                t * t * t * endY;
              const suckerR = Math.max(0.9, this.radius * (0.02 + (1 - t) * 0.013));
              ctx.fillStyle = `rgba(236,255,248,${0.26 + (1 - t) * 0.12})`;
              ctx.beginPath();
              ctx.arc(px, py, suckerR, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = `rgba(110,255,225,${0.24 + (1 - t) * 0.08})`;
              ctx.beginPath();
              ctx.arc(px, py, suckerR * 0.45, 0, Math.PI * 2);
              ctx.fill();
            }

            ctx.fillStyle = 'rgba(220,255,248,0.96)';
            ctx.beginPath();
            ctx.arc(endX, endY, endSize + Math.sin(this.swimPhase * 1.4 + i) * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          ctx.restore();
        }

        if (enemyMicroDecorEnabled) {
          // Боковые реснички.
          ctx.save();
          ctx.strokeStyle = 'rgba(185, 255, 245, 0.42)';
          ctx.lineWidth = Math.max(0.8, this.radius * 0.05);
          for (let i = -1; i <= 1; i++) {
            const px = -width * 0.15 + i * width * 0.22;
            const py = height * 0.82;
            const sway = Math.sin(this.swimPhase * 1.4 + i + this.visualSeed) * height * 0.16;
            ctx.beginPath();
            ctx.moveTo(px, py * 0.52);
            ctx.lineTo(px - width * 0.08, py + sway);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(px, -py * 0.52);
            ctx.lineTo(px - width * 0.08, -py - sway);
            ctx.stroke();
          }
          ctx.restore();
        }

        const gradient = ctx.createRadialGradient(
          -width * 0.25,
          -height * 0.35,
          width * 0.12,
          0,
          0,
          width * 1.08
        );
        gradient.addColorStop(0, fillColors[0]);
        gradient.addColorStop(0.55, fillColors[1]);
        gradient.addColorStop(1, fillColors[2] || fillColors[1]);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, width * squeeze, height, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.hurtPulse > 0.02) {
          ctx.fillStyle = `rgba(255, 130, 160, ${0.16 + this.damageFlash * 0.2})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, width * 1.04, height * 1.02, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Мембрана и пластины.
        ctx.strokeStyle = 'rgba(215,255,248,0.4)';
        ctx.lineWidth = Math.max(0.95, this.radius * 0.045);
        ctx.beginPath();
        ctx.ellipse(0, 0, width * (1.02 + this.eatPulse * 0.04), height * 1.03, 0, 0, Math.PI * 2);
        ctx.stroke();

        if (this.hasShell) {
          ctx.strokeStyle = `rgba(190,255,255,${0.2 + this.shellLevel * 0.07})`;
          ctx.lineWidth = 1.6 + this.shellLevel * 0.55;
          ctx.beginPath();
          ctx.ellipse(0, 0, width * 0.84, height * 0.74, 0, 0, Math.PI * 2);
          ctx.stroke();

          if (enemyDecorEnabled) {
            for (let i = -1; i <= 1; i++) {
              ctx.beginPath();
              ctx.moveTo(-width * 0.28, i * height * 0.26);
              ctx.quadraticCurveTo(width * 0.06, i * height * 0.05, width * 0.28, i * height * 0.26);
              ctx.stroke();
            }
          }
        }

        // Ядро и внутренние пятна.
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.ellipse(-width * 0.08, 0, width * 0.24, height * 0.3, Math.sin(this.swimPhase) * 0.22, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        for (let i = 0; i < Math.min(2, 1 + Math.floor(totalPerks / 4)); i++) {
          const ox = Math.sin(this.bodyPatternSeed + i * 1.7) * width * 0.24;
          const oy = Math.cos(this.bodyPatternSeed * 1.2 + i * 1.1) * height * 0.22;
          ctx.beginPath();
          ctx.arc(ox, oy, Math.max(1.2, this.radius * 0.045 + (i % 2) * 0.4), 0, Math.PI * 2);
          ctx.fill();
        }

        // Рот/хищный вырост.
        const mouthScale = 0.2 + this.attackPulse * 0.32 + this.eatPulse * 0.18 + this.mawLevel * 0.04 + this.swallowPulse * 0.28;
        ctx.fillStyle = 'rgba(28, 12, 18, 0.5)';
        ctx.beginPath();
        ctx.ellipse(width * 0.74, 0, width * (0.16 + this.mawLevel * 0.015), height * mouthScale, 0, -Math.PI * 0.9, Math.PI * 0.9);
        ctx.fill();

        if (enemyDecorEnabled && (this.attackPulse > 0.18 || this.hasMaw || this.swallowPulse > 0.08)) {
          ctx.strokeStyle = 'rgba(255, 215, 215, 0.72)';
          ctx.lineWidth = 1;
          for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.moveTo(width * 0.52, i * height * 0.12);
            ctx.lineTo(width * (0.76 + Math.abs(i) * 0.03 + this.mawLevel * 0.02), i * height * 0.18);
            ctx.stroke();
          }
        }

        if (this.hasSpike) {
          ctx.save();
          const spikeLength = width * (0.16 + this.spikeLevel * 0.08) + this.attackPulse * width * 0.04;
          const spikeWidth = Math.max(width * 0.06, width * (0.055 + this.spikeLevel * 0.008));
          const rootX = width * 0.5;
          const tipX = width * 0.68 + spikeLength;
          const mouthInset = height * 0.42;
          const drawCheekSpike = (side) => {
            const rootY = side * mouthInset;
            const curveLift = side * height * (0.28 + this.spikeLevel * 0.03);
            const tipY = side * height * 0.6;
            const spikeGradient = ctx.createLinearGradient(rootX, rootY, tipX, tipY);
            spikeGradient.addColorStop(0, 'rgba(90,255,228,0.18)');
            spikeGradient.addColorStop(0.42, 'rgba(220,255,250,0.96)');
            spikeGradient.addColorStop(1, 'rgba(255,255,255,1)');
            ctx.fillStyle = spikeGradient;
            ctx.beginPath();
            ctx.moveTo(rootX, rootY - spikeWidth);
            ctx.quadraticCurveTo(width * 0.7, rootY - spikeWidth - curveLift * 0.5, tipX, tipY);
            ctx.quadraticCurveTo(width * 0.7, rootY + spikeWidth - curveLift * 0.5, rootX, rootY + spikeWidth);
            ctx.quadraticCurveTo(rootX - width * 0.08, rootY, rootX, rootY - spikeWidth);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = 'rgba(130,255,240,0.52)';
            ctx.lineWidth = Math.max(1, this.radius * 0.022);
            ctx.beginPath();
            ctx.moveTo(rootX + width * 0.02, rootY);
            ctx.quadraticCurveTo(width * 0.72, rootY - curveLift * 0.28, tipX - spikeLength * 0.1, tipY);
            ctx.stroke();
          };
          drawCheekSpike(-1);
          drawCheekSpike(1);
          ctx.restore();
        }
        if (this.swallowPulse > 0.02) {
          ctx.strokeStyle = `rgba(230,255,248,${0.18 + this.swallowPulse * 0.24})`;
          ctx.lineWidth = Math.max(1.1, this.radius * 0.05);
          for (let i = 0; i < (enemyDecorEnabled ? 3 : 2); i++) {
            const throatX = width * (0.2 + i * 0.16);
            const ringScale = 1 - i * 0.12;
            ctx.beginPath();
            ctx.ellipse(throatX, 0, width * 0.08 * ringScale, height * (0.22 + this.swallowPulse * 0.06) * ringScale, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        // Глаз.
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.ellipse(width * 0.15, -height * 0.24, Math.max(2, this.radius * 0.14), Math.max(1.5, this.radius * 0.11), 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(15, 45, 40, 0.7)';
        ctx.beginPath();
        ctx.arc(width * 0.2, -height * 0.24, Math.max(1.2, this.radius * 0.05), 0, Math.PI * 2);
        ctx.fill();

        // Блик.
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath();
        ctx.arc(-width * 0.24, -height * 0.28, Math.max(2, this.radius * 0.1), 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      draw() {
        this.drawBody(
          ['#ffe9d5', '#ff8f7c', '#7c1837'],
          'rgba(255,245,252,0.95)'
        );
      }
    }


class ShieldEnemy extends Enemy {
      constructor(sizeFactor = 1) {
        super(sizeFactor);
        this.type = 'shield';
        this.hasShield = true;
        this.radius *= 1.02 + Math.random() * 0.12;
        this.level = calculateLevelFromRadius(this.radius);
      }

      onAttack(attacker) {
        if (!this.hasShield) return false;

        this.hasShield = false;

        const dx = attacker.x - this.x;
        const dy = attacker.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;

        if (typeof attacker.applyKnockback === 'function') {
          attacker.applyKnockback((dx / dist) * 4.6, (dy / dist) * 4.6, 15);
        } else {
          attacker.vx += (dx / dist) * 1.5;
          attacker.vy += (dy / dist) * 1.5;
        }

        this.vx -= (dx / dist) * 0.9;
        this.vy -= (dy / dist) * 0.9;
        this.receiveImpact(1);
        this.attackPulse = 0.8;

        return true;
      }

      draw() {
        this.drawBody(
          this.hasShield
            ? ['#fff4dd', '#f6af7d', '#914d48']
            : ['#ffe3d8', '#ff8d76', '#7a2433'],
          'rgba(255,252,244,0.96)'
        );

        if (this.hasShield) {
          const shieldPulse = 0.92 + Math.sin(this.swimPhase * 1.2) * 0.05;
          ctx.save();
          ctx.translate(this.x, this.y);
          ctx.rotate(this.displayAngle);
          ctx.strokeStyle = 'rgba(120, 240, 255, 0.95)';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.ellipse(0, 0, this.radius * 1.42 * shieldPulse, this.radius * 1.04 * shieldPulse, 0, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(220, 255, 255, 0.42)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(0, 0, this.radius * 1.18 * shieldPulse, this.radius * 0.88 * shieldPulse, 0, 0, Math.PI * 2);
          ctx.stroke();

          ctx.restore();
        }
      }
    }
