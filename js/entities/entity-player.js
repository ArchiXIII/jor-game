class Player {
      constructor() {
        this.x = 0;
        this.y = 0;
        this.radius = GROWTH_CONFIG.START_RADIUS;
        const shopBonuses = (typeof window !== 'undefined' && window.JorShopUI?.getBonuses?.()) || {};
        this.shopBonuses = shopBonuses;
        this.skinId = (typeof window !== 'undefined' && window.JorShopUI?.selectedCharacterSkinId?.()) || 'default';
        // Чуть быстрее: 2.6 вместо 2.5, штраф за размер мягче (0.012 вместо
        // 0.018). На макс. размере игрок теряет ~0.6 скорости вместо ~0.6 +
        // упирается в минимум — мутация Tail остаётся ценной, но не критичной.
        this.baseSpeed = 2.6 * (1 + (shopBonuses.speed || 0));
        this.speed = this.baseSpeed;
        this.angle = 0;
        this.baseTurnSpeed = 0.055;
        this.turnSpeed = this.baseTurnSpeed;
        this.dna = 0;
        this.minRadius = 8;
        this.foodEaten = 0;
        this.level = 1;
        this.hitCooldown = 0;
        this.growthStage = 0;
        this.growthBank = 0;
        this.cameraRadius = this.radius;
        this.cameraGrowthDelay = 0;
        this.growthPopTimer = 0;
        this.growthPopDuration = 0;
        this.growthPopStrength = 0;
        this.growthPopStartScale = 1;
        this.evolutionDelayTimer = 0;

        // Уровни и флаги мутаций.
        this.hasSpike = false;
        this.hasTail = false;
        this.hasShell = false;
        this.hasMaw = false;
        this.hasDash = Number(shopBonuses.startDashLevel || 0) > 0;
        this.hasTentacle = false;
        this.hasShatter = false;
        this.hasAgility = false;

        this.tailLevel = 0;
        this.spikeLevel = 0;
        this.shellLevel = 0;
        this.mawLevel = 0;
        this.dashLevel = Math.max(0, Number(shopBonuses.startDashLevel || 0));
        this.tentacleLevel = 0;
        this.shatterLevel = 0;
        this.agilityLevel = 0;

        // Бонусы, которые собираются мутациями.
        this.damageReduction = Math.min(0.55, shopBonuses.defense || 0);
        this.predatorBonus = 1 + (shopBonuses.hunt || 0);
        this.endlessAggressionBonus = 0;
        this.foodGrowthBonus = 1 + (shopBonuses.growth || 0);
        this.enemyGrowthBonus = 1 + (shopBonuses.enemyGrowth || 0);

        // Временные состояния.
        this.dashCooldown = 0;
        this.dashTime = 0;
        this.dashDirection = 0;
        this.mobileCoastSpeed = 0;
        this.pullTargets = [];
        this.tentacleLockedTargets = [];
        this.knockbackVX = 0;
        this.knockbackVY = 0;
        this.knockbackTime = 0;

        // Визуальная анимация существа.
        this.swimPhase = Math.random() * Math.PI * 2;
        this.turnTilt = 0;
        this.attackPulse = 0;
        this.eatPulse = 0;
        this.swallowPulse = 0;
        this.hurtPulse = 0;
        this.damageFlash = 0;
        this.idlePulse = Math.random() * Math.PI * 2;
        this.patternPhase = Math.random() * Math.PI * 2;
        this.legCycle = Math.random() * Math.PI * 2;
        this.legWave = 0.32;
        this.legLift = 0.24;
      }

      getTotalMutationLevels() {
        return (
          this.tailLevel +
          this.spikeLevel +
          this.shellLevel +
          this.mawLevel +
          this.dashLevel +
          this.tentacleLevel +
          this.shatterLevel +
          this.agilityLevel
        );
      }

      triggerSwallow(strength = 1) {
        this.swallowPulse = Math.max(this.swallowPulse, strength);
        this.eatPulse = Math.max(this.eatPulse, strength * 0.95);
        this.attackPulse = Math.max(this.attackPulse, strength * 0.5);
      }

      receiveImpact(strength = 1) {
        this.hurtPulse = Math.max(this.hurtPulse, strength);
        this.damageFlash = Math.max(this.damageFlash, 0.6 + strength * 0.3);
      }

      update() {
        updatePointerFromMobileControl();
        const worldPointer = screenToWorld(pointer.x, pointer.y);
        const dx = worldPointer.x - this.x;
        const dy = worldPointer.y - this.y;
        const dist = Math.hypot(dx, dy);

        const worldSpeedScale = getWorldSpeedScale();
        const mobileGameplayScale = (typeof hasTouchControls === 'function' && hasTouchControls())
          ? (ENDLESS_CONFIG.MOBILE_GAMEPLAY_SPEED_SCALE ?? 0.9)
          : 1;
        const tailSpeedBonus = this.tailLevel * 0.4;
        this.speed = Math.max(
          1.9,
          (this.baseSpeed + tailSpeedBonus) * worldSpeedScale
        ) * mobileGameplayScale;
        this.turnSpeed = this.baseTurnSpeed + this.agilityLevel * 0.022;

        const hasAimDirection = dist > 1 && (!mobileControl.enabled || mobileControl.strength > 0.01);
        let angleDiff = 0;

        if (hasAimDirection) {
          const targetAngle = Math.atan2(dy, dx);
          angleDiff = targetAngle - this.angle;

          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

          this.angle += clamp(angleDiff, -this.turnSpeed, this.turnSpeed);
          this.turnTilt = clamp(angleDiff, -0.45, 0.45);
        } else {
          this.turnTilt *= 0.72;
        }

        if (
          dashRequested &&
          this.hasDash &&
          this.dashCooldown <= 0 &&
          !evolutionPending &&
          !gameOver
        ) {
          this.dashTime = 10 + this.dashLevel * 2;
          this.dashCooldown = Math.max(96, 210 - this.dashLevel * 14);
          this.dashDirection = this.angle;
          this.attackPulse = 1;
          playFlashSound();
        }

        dashRequested = false;

        const alignment = dist > 1 ? Math.max(0.22, 1 - Math.abs(angleDiff) / Math.PI) : 0;
        let moveSpeed = Math.min(this.speed, dist * 0.08) * alignment;
        let isMobileCoasting = false;

        if (this.dashTime > 0) {
          moveSpeed += (4.2 + this.dashLevel * 0.55) * worldSpeedScale * mobileGameplayScale;
          this.dashTime -= 1;
        }

        if (mobileControl.enabled) {
          if (mobileControl.strength > 0.01 && dist > 1) {
            this.mobileCoastSpeed = moveSpeed;
          } else if (this.dashTime <= 0 && this.mobileCoastSpeed > 0.02) {
            moveSpeed = Math.max(moveSpeed, this.mobileCoastSpeed);
            this.mobileCoastSpeed *= 0.965;
            isMobileCoasting = true;
          } else if (this.mobileCoastSpeed <= 0.02) {
            this.mobileCoastSpeed = 0;
          }
        } else {
          this.mobileCoastSpeed = 0;
        }

        const moveAngle = this.dashTime > 0 ? this.dashDirection : this.angle;
        if (dist > 1 || this.dashTime > 0 || isMobileCoasting) {
          this.x += Math.cos(moveAngle) * moveSpeed;
          this.y += Math.sin(moveAngle) * moveSpeed;
        }

        if (this.knockbackTime > 0) {
          this.x += this.knockbackVX;
          this.y += this.knockbackVY;
          this.knockbackVX *= 0.84;
          this.knockbackVY *= 0.84;
          this.knockbackTime -= 1;
        }

        if (this.hitCooldown > 0) this.hitCooldown -= 1;
        if (this.dashCooldown > 0) this.dashCooldown -= 1;
        if (this.cameraGrowthDelay > 0) {
          this.cameraGrowthDelay -= 1;
          if (this.cameraGrowthDelay <= 0) {
            this.cameraRadius = this.radius;
          }
        }
        if (this.growthPopTimer > 0) {
          this.growthPopTimer -= 1;
        }
        if (this.evolutionDelayTimer > 0) {
          this.evolutionDelayTimer -= 1;
        }

        const animationMoveSpeed = moveSpeed / Math.max(1, worldSpeedScale);
        this.swimPhase += 0.1 + animationMoveSpeed * 0.15 + (this.dashTime > 0 ? 0.16 : 0);
        this.idlePulse += 0.03;
        this.patternPhase += 0.025 + this.getTotalMutationLevels() * 0.002;

        const movementBlend = clamp(moveSpeed / Math.max(1.2, this.speed + 0.001), 0, 1);
        const dashLegBoost = this.dashTime > 0 ? 0.18 : 0;
        this.legCycle += 0.03 + movementBlend * 0.06 + dashLegBoost;
        this.legWave = lerp(this.legWave, 0.2 + movementBlend * 0.58 + dashLegBoost * 0.3, 0.08);
        this.legLift = lerp(this.legLift, 0.12 + movementBlend * 0.18 + (this.dashTime > 0 ? 0.05 : 0), 0.07);

        this.attackPulse *= 0.91;
        this.eatPulse *= 0.9;
        this.swallowPulse *= 0.88;
        this.hurtPulse *= 0.85;
        this.damageFlash *= 0.84;
      }

      applyKnockback(dirX, dirY, frames = 8) {
        this.knockbackVX = dirX;
        this.knockbackVY = dirY;
        this.knockbackTime = Math.max(this.knockbackTime, frames);
      }

      grow(amount) {
        const phaseGrowthScale = endlessMode ? 1 : (GROWTH_CONFIG.FIRST_PHASE_GROWTH_SCALE ?? 1);
        let growthDelta = amount * GROWTH_CONFIG.GROWTH_RATE_FACTOR * phaseGrowthScale * this.foodGrowthBonus;
        const radiusCap = GROWTH_CONFIG.TARGET_MAX_RADIUS;
        const radiusBeforeGrowth = this.radius;

        if (this.radius >= radiusCap) {
          growthDelta = 0;
        } else {
          const remaining = radiusCap - this.radius;
          const capRange = Math.max(1, radiusCap - GROWTH_CONFIG.START_RADIUS);
          // Кубический корень даёт мягкую кривую насыщения вместо линейной:
          // у потолка ещё ~50% эффективности, а не 8% как раньше.
          const softnessRaw = Math.cbrt(remaining / capRange);
          const softness = clamp(softnessRaw, GROWTH_CONFIG.SOFTNESS_MIN, 1);
          growthDelta = Math.min(remaining, growthDelta * softness);
        }

        this.growthBank += growthDelta;
        let grewStage = false;

        while (
          this.growthStage < GROWTH_CONFIG.VISUAL_GROWTH_STAGES - 1 &&
          this.growthBank >= GROWTH_CONFIG.GROWTH_STAGE_RADIUS_STEP
        ) {
          this.growthBank -= GROWTH_CONFIG.GROWTH_STAGE_RADIUS_STEP;
          this.growthStage += 1;
          this.radius = Math.min(
            radiusCap,
            GROWTH_CONFIG.START_RADIUS + this.growthStage * GROWTH_CONFIG.GROWTH_STAGE_RADIUS_STEP
          );
          grewStage = true;
        }

        if (this.growthStage >= GROWTH_CONFIG.VISUAL_GROWTH_STAGES - 1) {
          this.radius = radiusCap;
          this.growthBank = 0;
        }

        if (grewStage) {
          this.cameraGrowthDelay = GROWTH_CONFIG.CAMERA_GROWTH_DELAY_FRAMES;
          this.eatPulse = Math.max(this.eatPulse, 1.2);
          this.swallowPulse = Math.max(this.swallowPulse, 1.05);
          this.growthPopDuration = 84;
          this.growthPopTimer = this.growthPopDuration;
          this.growthPopStrength = Math.min(0.42, 0.3 + this.growthStage * 0.014);
          this.growthPopStartScale = clamp(radiusBeforeGrowth / Math.max(1, this.radius), 0.55, 1);
          this.evolutionDelayTimer = 120;
          playGrowthSound();
        }

        this.foodEaten += 1;
        this.level = calculateLevelFromRadius(this.radius);
        this.triggerSwallow(1);
        this.attackPulse = Math.max(this.attackPulse, 0.45);
      }

      takeDamage(amount, attackerRadius = null) {
        if (this.hitCooldown > 0) return;

        this.hitCooldown = 30;

        // Урон масштабируется с размером атакующего: маленький враг кусает
        // слабее, крупный — серьёзно. Это создаёт градиент угрозы вместо
        // плоского «все враги бьют на 10».
        const scaledBase = attackerRadius != null
          ? Math.max(amount * 0.7, attackerRadius * 0.42)
          : amount;
        const reduced = scaledBase * (1 - this.damageReduction);
        const radiusLoss = Math.max(0.9, reduced * 0.16);
        this.radius = Math.max(this.minRadius, this.radius - radiusLoss);
        this.growthStage = clamp(
          Math.floor((this.radius - GROWTH_CONFIG.START_RADIUS) / GROWTH_CONFIG.GROWTH_STAGE_RADIUS_STEP),
          0,
          GROWTH_CONFIG.VISUAL_GROWTH_STAGES - 1
        );
        this.growthBank = 0;
        if (this.radius < this.cameraRadius) {
          this.cameraRadius = this.radius;
          this.cameraGrowthDelay = 0;
        }
        this.level = calculateLevelFromRadius(this.radius);
        this.growthPopTimer = 0;
        this.growthPopDuration = 0;
        this.growthPopStrength = 0;
        this.growthPopStartScale = 1;
        this.evolutionDelayTimer = 0;
        this.receiveImpact(1);
      }

      applyMutation(id) {
        if (id === 'spike') {
          this.hasSpike = true;
          this.spikeLevel += 1;
          // Было +0.12 — на 4-м уровне игрок мог есть врагов x1.48 от своего
          // размера, что ломало pacing. +0.07 = на 4-м уровне x1.28, всё
          // ещё мощно, но не «жми spike и побеждай».
          this.predatorBonus += 0.07;
        }

        if (id === 'tail') {
          this.hasTail = true;
          this.tailLevel += 1;
        }

        if (id === 'shell') {
          this.hasShell = true;
          this.shellLevel += 1;
          // +0.09 за уровень с потолком 0.5: даёт сильную мотивацию
          // вкладываться в защиту до конца, но 1 уровень не делает игрока
          // неуязвимым.
          this.damageReduction = Math.min(0.5, this.damageReduction + 0.09);
        }

        if (id === 'maw') {
          this.hasMaw = true;
          this.mawLevel += 1;
          // Потолок поднят до 1.85 (было 1.7) — Maw-билд более выраженный.
          this.foodGrowthBonus = Math.min(1.85, this.foodGrowthBonus + 0.11);
        }

        if (id === 'dash') {
          this.hasDash = true;
          this.dashLevel += 1;
        }

        if (id === 'tentacle') {
          this.hasTentacle = true;
          this.tentacleLevel += 1;
        }

        if (id === 'shatter') {
          this.hasShatter = true;
          this.shatterLevel += 1;
        }

        if (id === 'agility') {
          this.hasAgility = true;
          this.agilityLevel += 1;
        }
      }


      drawSideLegs(width, height) {
        const playerFxShadowScale = getPlayerFxShadowScale();
        const lowDetail = isPlayerLowDetail();
        const finCount = 2;
        const finRoots = [-width * 0.2, width * 0.26];
        const phaseOffsets = [0, Math.PI * 0.52];
        const swimPower = Math.min(1.55, 0.55 + this.legWave * 1.05 + (this.dashTime > 0 ? 0.24 : 0));
        const finLengthBase = this.radius * (0.62 + swimPower * 0.16);
        const finWidthBase = this.radius * (0.34 + swimPower * 0.08);

        for (const side of [-1, 1]) {
          for (let i = 0; i < finCount; i++) {
            const rootX = finRoots[i];
            const rootY = side * (height * (0.64 + i * 0.03));
            const phase = this.legCycle * 0.72 + phaseOffsets[i] + (side === 1 ? 0 : Math.PI * 0.55);

            const sweep = Math.sin(phase) * (0.42 + swimPower * 0.28);
            const fanOpen = 0.95 + Math.cos(phase - 0.4) * 0.24 + swimPower * 0.26;
            const trailing = Math.sin(phase - 0.7) * (0.24 + swimPower * 0.08);

            const finLength = finLengthBase * (0.95 + i * 0.13);
            const finWidth = finWidthBase * (0.96 + i * 0.1) * fanOpen;
            const tipX = rootX - finLength;
            const tipY = rootY + side * (sweep * this.radius * 0.78);
            const upperCtrlX = rootX - finLength * 0.34;
            const upperCtrlY = rootY - side * (finWidth * (1.18 + trailing));
            const lowerCtrlX = rootX - finLength * 0.48;
            const lowerCtrlY = rootY + side * (finWidth * (1.24 - trailing * 0.45));
            const trailingX = rootX + this.radius * (0.14 + i * 0.03);

            const finGradient = ctx.createLinearGradient(rootX, rootY, tipX, tipY);
            finGradient.addColorStop(0, 'rgba(120,255,235,0.34)');
            finGradient.addColorStop(0.32, 'rgba(70,240,215,0.72)');
            finGradient.addColorStop(0.72, 'rgba(220,255,248,0.92)');
            finGradient.addColorStop(1, 'rgba(245,255,252,0.5)');

            ctx.save();
            ctx.fillStyle = finGradient;
            ctx.beginPath();
            ctx.moveTo(trailingX, rootY);
            ctx.quadraticCurveTo(rootX - finLength * 0.12, upperCtrlY * 0.96, tipX, tipY);
            ctx.quadraticCurveTo(rootX - finLength * 0.72, rootY + side * (finWidth * 0.08), rootX - finLength * 0.14, rootY + side * (finWidth * 0.24));
            ctx.quadraticCurveTo(rootX - finLength * 0.02, rootY + side * (finWidth * 0.34), trailingX, rootY);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = 'rgba(235,255,250,0.92)';
            ctx.lineWidth = Math.max(1.4, this.radius * 0.032);
            ctx.beginPath();
            ctx.moveTo(trailingX, rootY);
            ctx.quadraticCurveTo(rootX - finLength * 0.12, upperCtrlY * 0.96, tipX, tipY);
            ctx.quadraticCurveTo(rootX - finLength * 0.72, rootY + side * (finWidth * 0.08), rootX - finLength * 0.14, rootY + side * (finWidth * 0.24));
            ctx.quadraticCurveTo(rootX - finLength * 0.02, rootY + side * (finWidth * 0.34), trailingX, rootY);
            ctx.closePath();
            ctx.stroke();

            ctx.fillStyle = 'rgba(230,255,248,0.32)';
            ctx.beginPath();
            ctx.moveTo(rootX, rootY);
            ctx.quadraticCurveTo(upperCtrlX, upperCtrlY, tipX, tipY);
            ctx.quadraticCurveTo(lowerCtrlX, lowerCtrlY, rootX, rootY);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = 'rgba(255,255,255,0.58)';
            ctx.lineWidth = Math.max(1.1, this.radius * 0.024);
            ctx.beginPath();
            ctx.moveTo(rootX - this.radius * 0.04, rootY);
            ctx.quadraticCurveTo(rootX - finLength * 0.4, rootY + side * (sweep * this.radius * 0.28), tipX, tipY);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(205,255,242,0.34)';
            ctx.lineWidth = Math.max(0.9, this.radius * 0.018);
            const ribCount = lowDetail ? 1 : 4;
            for (let rib = 1; rib <= ribCount; rib++) {
              const t = rib / 5;
              const ribStartX = rootX - finLength * 0.1;
              const ribStartY = rootY + side * (finWidth * (t - 0.5) * 0.2);
              const ribEndX = rootX - finLength * (0.26 + t * 0.48);
              const ribEndY = rootY + side * (finWidth * (t - 0.5) * 0.98 + sweep * this.radius * 0.24);
              ctx.beginPath();
              ctx.moveTo(ribStartX, ribStartY);
              ctx.lineTo(ribEndX, ribEndY);
              ctx.stroke();
            }

            ctx.restore();
          }
        }
      }
      draw() {
        const locomotion = Math.sin(this.swimPhase);
        const totalMutations = this.getTotalMutationLevels();
        const evolutionScale = Math.min(1.2, totalMutations * 0.06);
        const dashBoost = this.dashTime > 0 ? 0.18 : 0;
        const playerFxShadowScale = getPlayerFxShadowScale();
        const lowDetail = isPlayerLowDetail();
        const width = this.radius * (1.04 + locomotion * 0.06 + dashBoost + this.attackPulse * 0.08 + evolutionScale * 0.08 + this.hurtPulse * 0.02);
        const height = this.radius * (0.9 - locomotion * 0.05 + this.eatPulse * 0.05 + evolutionScale * 0.04 + this.swallowPulse * 0.05 - this.hurtPulse * 0.09);

        ctx.save();
        ctx.translate(
          this.x + Math.sin(frameTime * 0.22 + this.patternPhase) * this.hurtPulse * 3.2,
          this.y + Math.cos(frameTime * 0.18 + this.patternPhase * 1.3) * this.hurtPulse * 2.4
        );
        ctx.rotate(this.angle + this.turnTilt * 0.18);
        if (this.growthPopTimer > 0 && this.growthPopDuration > 0) {
          const t = 1 - this.growthPopTimer / this.growthPopDuration;
          const startScale = this.growthPopStartScale || 1;
          const peakScale = 1 + this.growthPopStrength;
          const growT = clamp(t / 0.48, 0, 1);
          const settleT = clamp((t - 0.48) / 0.52, 0, 1);
          const growEase = 1 - Math.pow(1 - growT, 2.4);
          const settleEase = 1 - Math.pow(1 - settleT, 1.65);
          const popScale = t < 0.48
            ? lerp(startScale, peakScale, growEase)
            : lerp(peakScale, 1, settleEase);

          const waveT = clamp(t / 0.46, 0, 1);
          const growthVisual = (typeof window !== 'undefined' && window.JorShopUI?.getGrowthVisual?.()) || null;
          if (typeof window !== 'undefined' && window.JorGrowthEffects?.drawWorldEffect) {
            window.JorGrowthEffects.drawWorldEffect(ctx, growthVisual, waveT, width, height, this.radius, 0, 1);
          }

          ctx.scale(popScale, popScale);
        }

        if (this.pullTargets.length) {
          ctx.save();
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          const visualPullTargets = lowDetail ? this.pullTargets.slice(0, 2) : this.pullTargets;
          for (const target of visualPullTargets) {
            const tipX = target.relX;
            const tipY = target.relY;
            const dist = Math.max(1, Math.hypot(tipX, tipY));
            const nx = tipX / dist;
            const ny = tipY / dist;
            const px = -ny;
            const py = nx;
            const phase = this.swimPhase * 1.45 + (target.seed ?? 0);
            const wave = Math.sin(phase) * (dist * 0.12 + this.radius * 0.22);
            const curl = Math.cos(phase * 1.28) * (dist * 0.07 + this.radius * 0.12);
            const rootX = this.radius * (0.46 + (target.side ?? 0) * 0.04);
            const rootY = (target.side ?? 1) * this.radius * 0.08;
            const ctrl1X = rootX + tipX * 0.22 + px * (wave * 0.9);
            const ctrl1Y = rootY + tipY * 0.16 + py * (wave * 0.9);
            const ctrl2X = rootX + tipX * 0.68 - px * (curl + wave * 0.42);
            const ctrl2Y = rootY + tipY * 0.74 - py * (curl + wave * 0.42);
            const tipBackX = tipX - nx * Math.min(this.radius * 0.3, dist * 0.12);
            const tipBackY = tipY - ny * Math.min(this.radius * 0.3, dist * 0.12);
            const baseThickness = Math.max(2.8, this.radius * (0.09 + this.tentacleLevel * 0.012));

            // Мягкое внешнее свечение.
            ctx.strokeStyle = `rgba(115,255,230,${0.18 + this.tentacleLevel * 0.04})`;
            ctx.lineWidth = baseThickness * 1.9;
            ctx.beginPath();
            ctx.moveTo(rootX, rootY);
            ctx.bezierCurveTo(ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, tipX, tipY);
            ctx.stroke();

            // Основное тело щупальца с плавным сужением.
            const coreGradient = ctx.createLinearGradient(rootX, rootY, tipX, tipY);
            coreGradient.addColorStop(0, 'rgba(70,235,208,0.92)');
            coreGradient.addColorStop(0.45, 'rgba(205,255,244,0.98)');
            coreGradient.addColorStop(1, 'rgba(245,255,252,0.94)');
            ctx.strokeStyle = coreGradient;
            ctx.lineWidth = baseThickness;
            ctx.beginPath();
            ctx.moveTo(rootX, rootY);
            ctx.bezierCurveTo(ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, tipX, tipY);
            ctx.stroke();

            if (!lowDetail) {
              // Светлая продольная жила.
              ctx.strokeStyle = 'rgba(255,255,255,0.52)';
              ctx.lineWidth = Math.max(1.1, baseThickness * 0.22);
              ctx.beginPath();
              ctx.moveTo(rootX + px * baseThickness * 0.1, rootY + py * baseThickness * 0.1);
              ctx.bezierCurveTo(
                ctrl1X + px * baseThickness * 0.08,
                ctrl1Y + py * baseThickness * 0.08,
                ctrl2X - px * baseThickness * 0.04,
                ctrl2Y - py * baseThickness * 0.04,
                tipBackX,
                tipBackY
              );
              ctx.stroke();
            }

            // Присоски вдоль внутренней стороны щупальца.
            const suckerCount = lowDetail
              ? Math.max(2, Math.min(4, 2 + Math.floor(this.tentacleLevel * 0.5)))
              : Math.max(3, Math.round((4 + this.tentacleLevel + Math.floor(dist / 55)) * (0.72 + renderDetailScale * 0.28)));
            for (let i = 1; i <= suckerCount; i++) {
              const t = i / (suckerCount + 1);
              const mt = 1 - t;
              const bx =
                mt * mt * mt * rootX +
                3 * mt * mt * t * ctrl1X +
                3 * mt * t * t * ctrl2X +
                t * t * t * tipX;
              const by =
                mt * mt * mt * rootY +
                3 * mt * mt * t * ctrl1Y +
                3 * mt * t * t * ctrl2Y +
                t * t * t * tipY;
              const tx =
                3 * mt * mt * (ctrl1X - rootX) +
                6 * mt * t * (ctrl2X - ctrl1X) +
                3 * t * t * (tipX - ctrl2X);
              const ty =
                3 * mt * mt * (ctrl1Y - rootY) +
                6 * mt * t * (ctrl2Y - ctrl1Y) +
                3 * t * t * (tipY - ctrl2Y);
              const tangentLen = Math.max(0.001, Math.hypot(tx, ty));
              const sx = -ty / tangentLen;
              const sy = tx / tangentLen;
              const offsetDir = target.side ?? 1;
              const suckX = bx - sx * baseThickness * (0.45 + (1 - t) * 0.22) * offsetDir;
              const suckY = by - sy * baseThickness * (0.45 + (1 - t) * 0.22) * offsetDir;
              const suckR = Math.max(1.3, baseThickness * (0.16 + (1 - t) * 0.12));
              const suckAngle = Math.atan2(ty, tx);

              ctx.fillStyle = 'rgba(218,255,246,0.9)';
              ctx.beginPath();
              ctx.ellipse(suckX, suckY, suckR * 1.18, suckR * 0.82, suckAngle, 0, Math.PI * 2);
              ctx.fill();

              if (!lowDetail) {
                ctx.strokeStyle = 'rgba(120,240,222,0.55)';
                ctx.lineWidth = Math.max(0.8, suckR * 0.25);
                ctx.beginPath();
                ctx.ellipse(suckX, suckY, suckR * 0.62, suckR * 0.38, suckAngle, 0, Math.PI * 2);
                ctx.stroke();
              }
            }

            // Светящийся кончик у цели.
            ctx.fillStyle = 'rgba(240,255,250,0.95)';
            ctx.beginPath();
            ctx.ellipse(tipX, tipY, baseThickness * 0.34, baseThickness * 0.24, Math.atan2(ny, nx), 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }

        if (this.hasTail || (typeof window !== 'undefined' && window.JorPlayerSkins?.hasVisualTail?.(this.skinId))) {
          ctx.save();
          const tailSwing = Math.sin(this.swimPhase * 0.92) * this.radius * (0.34 + this.tailLevel * 0.035);
          const tailTipSwing = Math.sin(this.swimPhase * 0.92 - 0.75) * this.radius * (0.62 + this.tailLevel * 0.06);
          const tailBaseX = -width * 0.78;
          const tailMidX = -width * (1.1 + this.tailLevel * 0.08);
          const tailTipX = -width * (1.66 + this.tailLevel * 0.16);
          const tailFinHeight = height * (0.52 + this.tailLevel * 0.05);
          const splitDepth = width * (0.18 + this.tailLevel * 0.02);
          const spinePath = new Path2D();
          spinePath.moveTo(tailBaseX, 0);
          spinePath.bezierCurveTo(
            -width * 0.96,
            tailSwing * 0.22,
            tailMidX,
            tailSwing,
            tailTipX - splitDepth * 0.42,
            tailTipSwing * 0.26
          );
          const finPath = new Path2D();
          finPath.moveTo(tailBaseX, 0);
          finPath.bezierCurveTo(
            -width * 0.98,
            -tailFinHeight * 0.26 + tailSwing * 0.2,
            tailMidX,
            -tailFinHeight * 0.58 + tailSwing * 0.38,
            tailTipX,
            -tailFinHeight * 0.18 + tailTipSwing
          );
          finPath.quadraticCurveTo(
            tailTipX - splitDepth * 0.56,
            tailTipSwing * 0.2,
            tailTipX - splitDepth,
            tailTipSwing * 0.06
          );
          finPath.quadraticCurveTo(
            tailTipX - splitDepth * 0.56,
            -tailTipSwing * 0.2,
            tailTipX,
            tailFinHeight * 0.18 + tailTipSwing
          );
          finPath.bezierCurveTo(
            tailMidX,
            tailFinHeight * 0.58 + tailSwing * 0.38,
            -width * 0.98,
            tailFinHeight * 0.26 + tailSwing * 0.2,
            tailBaseX,
            0
          );
          finPath.closePath();

          ctx.strokeStyle = 'rgba(178,255,242,0.82)';
          ctx.lineWidth = Math.max(3.5, this.radius * (0.11 + this.tailLevel * 0.012));
          ctx.lineCap = 'round';
          ctx.stroke(spinePath);

          const tailGradient = ctx.createLinearGradient(tailBaseX, 0, tailTipX, 0);
          tailGradient.addColorStop(0, 'rgba(85,245,222,0.12)');
          tailGradient.addColorStop(0.58, 'rgba(190,255,245,0.5)');
          tailGradient.addColorStop(1, 'rgba(245,255,252,0.24)');
          ctx.fillStyle = tailGradient;
          ctx.fill(finPath);

          ctx.strokeStyle = 'rgba(236,255,250,0.88)';
          ctx.lineWidth = Math.max(1.3, this.radius * 0.026);
          ctx.stroke(finPath);

          if (!lowDetail) {
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = Math.max(1, this.radius * 0.02);
            ctx.beginPath();
            ctx.moveTo(tailBaseX - this.radius * 0.03, 0);
            ctx.bezierCurveTo(-width * 1.02, tailSwing * 0.16, tailMidX, tailSwing * 0.74, tailTipX - splitDepth * 0.72, tailTipSwing * 0.06);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(215,255,244,0.22)';
            ctx.lineWidth = Math.max(0.8, this.radius * 0.013);
            for (let rib = 1; rib <= 2; rib++) {
              const t = rib / 3;
              ctx.beginPath();
              ctx.moveTo(-width * (0.94 + t * 0.1), tailSwing * (0.12 + t * 0.06));
              ctx.quadraticCurveTo(
                -width * (1.08 + t * 0.2),
                -tailFinHeight * (0.22 + t * 0.12) + tailSwing * 0.28,
                tailTipX - splitDepth * (0.16 + t * 0.22),
                -tailFinHeight * (0.03 + t * 0.07) + tailTipSwing * (0.66 + t * 0.06)
              );
              ctx.stroke();

              ctx.beginPath();
              ctx.moveTo(-width * (0.94 + t * 0.1), tailSwing * (0.12 + t * 0.06));
              ctx.quadraticCurveTo(
                -width * (1.08 + t * 0.2),
                tailFinHeight * (0.22 + t * 0.12) + tailSwing * 0.28,
                tailTipX - splitDepth * (0.16 + t * 0.22),
                tailFinHeight * (0.03 + t * 0.07) + tailTipSwing * (0.66 + t * 0.06)
              );
              ctx.stroke();
            }
          }
          ctx.restore();
        }

        // Развитая спина и хребет усиливаются от общего уровня мутаций.
        if (!lowDetail) {
          ctx.save();
          ctx.fillStyle = `rgba(210,255,245,${0.12 + totalMutations * 0.018})`;
          ctx.beginPath();
          ctx.moveTo(-width * 0.42, -height * 0.38);
          ctx.quadraticCurveTo(-width * 0.06, -height * (1.14 + evolutionScale * 0.18), width * 0.34, -height * 0.28);
          ctx.quadraticCurveTo(width * 0.02, -height * 0.02, -width * 0.42, -height * 0.38);
          ctx.fill();
          ctx.restore();
        }

        // Боковые лапки: рисуем их как мягкие полупрозрачные плавники,
        // чтобы персонаж визуально именно плыл, а не перебирал лапами.
        this.drawSideLegs(width, height);

        if (this.hasShell) {
          ctx.save();
          ctx.strokeStyle = `rgba(170, 255, 255, ${0.24 + this.shellLevel * 0.08})`;
          ctx.lineWidth = 4 + this.shellLevel;
          ctx.beginPath();
          ctx.ellipse(0, 0, width * 1.08, height * 1.08, 0, 0, Math.PI * 2);
          ctx.stroke();

          if (!lowDetail) {
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = 'rgba(235,255,255,0.34)';
            ctx.beginPath();
            ctx.ellipse(0, 0, width * 0.88, height * 0.86, 0, 0, Math.PI * 2);
            ctx.stroke();

            for (let i = -1; i <= 1; i++) {
              ctx.beginPath();
              ctx.moveTo(-width * 0.34, i * height * 0.28);
              ctx.quadraticCurveTo(0, i * height * 0.02, width * 0.32, i * height * 0.28);
              ctx.stroke();
            }
          }
          ctx.restore();
        }

        if (typeof window !== 'undefined' && window.JorPlayerSkins?.drawGameBody) {
          window.JorPlayerSkins.drawGameBody(ctx, this.skinId, width, height, this.radius, frameTime);
        } else if (lowDetail) {
          const bodySprite = getBakedPlayerBodySprite();
          const sx = width / bodySprite.baseRx;
          const sy = height / bodySprite.baseRy;
          ctx.drawImage(
            bodySprite,
            -bodySprite.originX * sx,
            -bodySprite.originY * sy,
            bodySprite.width * sx,
            bodySprite.height * sy
          );
        } else {
          const gradient = ctx.createRadialGradient(
            -width * 0.25,
            -height * 0.35,
            width * 0.12,
            0,
            0,
            width * 1.1
          );
          gradient.addColorStop(0, '#edfff9');
          gradient.addColorStop(0.45, '#71ffd8');
          gradient.addColorStop(1, '#1f9e93');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.ellipse(0, 0, width, height, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        if (this.hurtPulse > 0.02) {
          ctx.fillStyle = `rgba(255, 130, 160, ${0.18 + this.damageFlash * 0.22})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, width * 1.03, height * 1.02, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Внутренние органические ядра.
        if (!lowDetail) {
          ctx.fillStyle = 'rgba(255,255,255,0.12)';
          ctx.beginPath();
          ctx.ellipse(-width * 0.14, 0, width * 0.28, height * 0.32, Math.sin(this.idlePulse) * 0.22, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(18, 78, 67, 0.18)';
          ctx.beginPath();
          ctx.ellipse(width * 0.04, height * 0.18, width * 0.2, height * 0.16, 0.4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        const innerDots = lowDetail ? 0 : 4 + totalMutations;
        for (let i = 0; i < innerDots; i++) {
          const ox = Math.sin(this.patternPhase + i * 1.3) * width * 0.26;
          const oy = Math.cos(this.patternPhase * 1.25 + i * 0.9) * height * 0.24;
          ctx.beginPath();
          ctx.arc(ox, oy, Math.max(1.2, this.radius * 0.038 + (i % 3) * 0.35), 0, Math.PI * 2);
          ctx.fill();
        }

        if (this.hasShatter) {
          ctx.fillStyle = `rgba(200,255,245,${0.12 + this.shatterLevel * 0.05})`;
          const shatterDotCount = lowDetail ? Math.min(2, 1 + this.shatterLevel) : 3 + this.shatterLevel;
          for (let i = 0; i < shatterDotCount; i++) {
            const px = Math.cos(this.patternPhase * 1.4 + i) * width * 0.34;
            const py = Math.sin(this.patternPhase * 1.8 + i * 1.2) * height * 0.28;
            ctx.beginPath();
            ctx.arc(px, py, Math.max(1.8, this.radius * 0.05), 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Мембрана.
        ctx.strokeStyle = 'rgba(235,255,250,0.32)';
        ctx.lineWidth = Math.max(1.2, this.radius * 0.055);
        ctx.beginPath();
        ctx.ellipse(0, 0, width * 1.03, height * 1.03, 0, 0, Math.PI * 2);
        ctx.stroke();

        if (this.hasSpike) {
          ctx.save();
          const spikeLength = this.radius * (0.44 + this.spikeLevel * 0.2) + this.attackPulse * 7.5;
          const spikeWidth = Math.max(this.radius * 0.11, this.radius * (0.09 + this.spikeLevel * 0.014));
          const rootX = width * 0.4;
          const tipX = width * 0.72 + spikeLength;
          const mouthInset = height * 0.5;
          const drawCheekSpike = (side) => {
            const rootY = side * mouthInset;
            const curveLift = side * height * (0.32 + this.spikeLevel * 0.03);
            const tipY = side * height * 0.72;
            const spikeGradient = ctx.createLinearGradient(rootX, rootY, tipX, tipY);
            spikeGradient.addColorStop(0, 'rgba(90,255,230,0.22)');
            spikeGradient.addColorStop(0.42, 'rgba(225,255,252,0.96)');
            spikeGradient.addColorStop(1, 'rgba(255,255,255,1)');
            ctx.fillStyle = spikeGradient;
            ctx.beginPath();
            ctx.moveTo(rootX, rootY - spikeWidth);
            ctx.quadraticCurveTo(width * 0.72, rootY - spikeWidth - curveLift * 0.52, tipX, tipY);
            ctx.quadraticCurveTo(width * 0.72, rootY + spikeWidth - curveLift * 0.52, rootX, rootY + spikeWidth);
            ctx.quadraticCurveTo(rootX - width * 0.1, rootY, rootX, rootY - spikeWidth);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = 'rgba(120,255,240,0.68)';
            ctx.lineWidth = Math.max(1.1, this.radius * 0.028);
            ctx.beginPath();
            ctx.moveTo(rootX + width * 0.025, rootY);
            ctx.quadraticCurveTo(width * 0.74, rootY - curveLift * 0.28, tipX - spikeLength * 0.1, tipY);
            ctx.stroke();
          };
          drawCheekSpike(-1);
          drawCheekSpike(1);
          ctx.restore();
        }

        const mouthOpen = (this.hasMaw ? 0.32 + this.mawLevel * 0.052 : 0.19) + this.attackPulse * 0.38 + this.eatPulse * 0.23 + this.swallowPulse * 0.34;
        const mandibleBaseX = width * 0.4;
        const mandibleRootBulge = width * (0.2 + this.mawLevel * 0.018);
        const mandibleTipX = width * (1.02 + this.mawLevel * 0.05) + this.attackPulse * this.radius * 0.3;
        const mandibleSpread = height * (0.26 + mouthOpen * 0.54);
        const clawLength = this.radius * (0.34 + this.mawLevel * 0.07);

        // Центральная ротовая полость между жвалами.
        ctx.fillStyle = 'rgba(7, 30, 28, 0.68)';
        ctx.beginPath();
        ctx.ellipse(
          width * 0.77,
          0,
          Math.max(7.5, this.radius * (0.24 + this.mawLevel * 0.03)),
          Math.max(3.4, this.radius * (0.14 + mouthOpen * 0.22)),
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();

        const drawMandible = (side) => {
          const upperY = -mandibleSpread * side;
          const lowerY = -height * 0.05 * side;
          const tipY = -mandibleSpread * 0.55 * side;

          const mandibleGradient = ctx.createLinearGradient(mandibleBaseX, 0, mandibleTipX + clawLength, tipY);
          mandibleGradient.addColorStop(0, 'rgba(70, 255, 215, 0.28)');
          mandibleGradient.addColorStop(0.45, 'rgba(215, 255, 245, 0.96)');
          mandibleGradient.addColorStop(1, 'rgba(255, 250, 245, 0.98)');
          ctx.fillStyle = mandibleGradient;

          ctx.beginPath();
          ctx.moveTo(mandibleBaseX - mandibleRootBulge * 0.28, lowerY - side * this.radius * 0.06);
          ctx.quadraticCurveTo(width * 0.48, upperY * 0.34, mandibleBaseX + mandibleRootBulge * 0.65, upperY * 0.98);
          ctx.quadraticCurveTo(width * 0.8, upperY * 1.02, mandibleTipX, tipY);
          ctx.quadraticCurveTo(mandibleTipX + clawLength, tipY - side * this.radius * 0.1, mandibleTipX + clawLength * 0.94, tipY + side * this.radius * 0.15);
          ctx.quadraticCurveTo(width * 0.9, lowerY + side * this.radius * 0.08, mandibleBaseX + mandibleRootBulge * 0.24, lowerY + side * this.radius * 0.13);
          ctx.quadraticCurveTo(width * 0.48, lowerY * 0.68, mandibleBaseX - mandibleRootBulge * 0.28, lowerY - side * this.radius * 0.06);
          ctx.closePath();
          ctx.fill();

          // Внутренняя тёмная грань жвала.
          ctx.fillStyle = 'rgba(10, 42, 36, 0.42)';
          ctx.beginPath();
          ctx.moveTo(width * 0.5, lowerY * 0.98);
          ctx.quadraticCurveTo(width * 0.78, upperY * 0.86, mandibleTipX - this.radius * 0.06, tipY * 0.96);
          ctx.quadraticCurveTo(width * 0.82, lowerY * 0.88, width * 0.5, lowerY * 0.98);
          ctx.closePath();
          ctx.fill();

          // Острый внутренний крюк как у клешни.
          ctx.strokeStyle = 'rgba(245,255,250,0.82)';
          ctx.lineWidth = 1.35;
          ctx.beginPath();
          ctx.moveTo(mandibleTipX - this.radius * 0.05, tipY);
          ctx.lineTo(mandibleTipX + clawLength * 0.84, tipY + side * this.radius * 0.12);
          ctx.stroke();

          // Сегменты/зазубрины на внутренней стороне.
          const toothCount = lowDetail ? Math.min(3, 2 + Math.floor(this.mawLevel * 0.5)) : 3 + this.mawLevel;
          ctx.strokeStyle = 'rgba(225,255,248,0.72)';
          ctx.lineWidth = 1.05;
          for (let i = 0; i < toothCount; i++) {
            const t = toothCount === 1 ? 0 : i / (toothCount - 1);
            const px = mandibleBaseX + (mandibleTipX - mandibleBaseX) * (0.1 + t * 0.78);
            const py = lowerY + (tipY - lowerY) * (0.13 + t * 0.76);
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + this.radius * 0.08, py + side * this.radius * 0.09);
            ctx.stroke();
          }
        };

        drawMandible(1);
        drawMandible(-1);

        if (this.swallowPulse > 0.02) {
          ctx.strokeStyle = `rgba(235,255,248,${0.18 + this.swallowPulse * 0.24})`;
          ctx.lineWidth = Math.max(1.2, this.radius * 0.05);
          const swallowRingCount = lowDetail ? 1 : 3;
          for (let i = 0; i < swallowRingCount; i++) {
            const throatX = width * (0.22 + i * 0.16);
            const ringScale = 1 - i * 0.12;
            ctx.beginPath();
            ctx.ellipse(throatX, 0, width * 0.08 * ringScale, height * (0.24 + this.swallowPulse * 0.06) * ringScale, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        if (this.hasDash && !lowDetail) {
          const dashReady = this.dashCooldown <= 0 && this.dashTime <= 0;
          const readyPulse = 0.94 + Math.sin(frameTime * 0.11 + this.idlePulse) * 0.03;
          const indicatorX = -width * 0.5;
          const indicatorY = height * 0.02;
          const indicatorRX = width * (0.135 + this.dashLevel * 0.012);
          const indicatorRY = height * (0.17 + this.dashLevel * 0.01);
          const indicatorRotation = -0.12;

          const baseTint = ctx.createRadialGradient(
            indicatorX - indicatorRX * 0.24,
            indicatorY - indicatorRY * 0.18,
            indicatorRX * 0.06,
            indicatorX,
            indicatorY,
            indicatorRX * 1.18
          );

          if (dashReady) {
            baseTint.addColorStop(0, `rgba(205,255,210,${0.34 * readyPulse})`);
            baseTint.addColorStop(0.45, `rgba(118,214,125,${0.26 * readyPulse})`);
            baseTint.addColorStop(0.82, 'rgba(48,104,60,0.08)');
            baseTint.addColorStop(1, 'rgba(20,42,24,0)');
          } else {
            baseTint.addColorStop(0, 'rgba(255,176,176,0.44)');
            baseTint.addColorStop(0.45, 'rgba(224,68,68,0.38)');
            baseTint.addColorStop(0.82, 'rgba(118,24,24,0.14)');
            baseTint.addColorStop(1, 'rgba(40,8,8,0)');
          }

          ctx.fillStyle = baseTint;
          ctx.beginPath();
          ctx.ellipse(indicatorX, indicatorY, indicatorRX, indicatorRY, indicatorRotation, 0, Math.PI * 2);
          ctx.fill();

          ctx.globalAlpha *= 0.62;
          ctx.strokeStyle = dashReady ? 'rgba(188,255,198,0.26)' : 'rgba(255,164,164,0.34)';
          ctx.lineWidth = Math.max(0.8, this.radius * 0.016);
          ctx.beginPath();
          ctx.ellipse(indicatorX, indicatorY, indicatorRX * 0.93, indicatorRY * 0.93, indicatorRotation, 0, Math.PI * 2);
          ctx.stroke();

          ctx.globalAlpha *= 0.82;
          ctx.fillStyle = dashReady ? 'rgba(255,255,255,0.1)' : 'rgba(255,235,235,0.08)';
          ctx.beginPath();
          ctx.ellipse(
            indicatorX - indicatorRX * 0.18,
            indicatorY - indicatorRY * 0.16,
            indicatorRX * 0.26,
            indicatorRY * 0.2,
            -0.3,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        // Глаз и блик.
        if (typeof window !== 'undefined' && window.JorPlayerSkins?.drawGameEyes) {
          window.JorPlayerSkins.drawGameEyes(ctx, this.skinId, width, height, this.radius);
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.98)';
          ctx.beginPath();
          ctx.ellipse(width * 0.1, -height * 0.24, Math.max(2.8, this.radius * 0.12), Math.max(2.2, this.radius * 0.095), 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(8, 35, 30, 0.55)';
          ctx.beginPath();
          ctx.arc(width * 0.16, -height * 0.24, Math.max(1.6, this.radius * 0.05), 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(255,255,255,0.56)';
          ctx.beginPath();
          ctx.arc(-width * 0.22, -height * 0.28, Math.max(2.4, this.radius * 0.1), 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        if (this.hitCooldown > 0) {
          ctx.save();
          ctx.globalAlpha = 0.15 + Math.sin(frameTime * 0.04) * 0.1;
          ctx.fillStyle = '#ff6d7f';
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius + 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }

    // ------------------------------
    // Мутации
    // ------------------------------
