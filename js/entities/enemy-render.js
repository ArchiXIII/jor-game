class EnemyRenderMethods {
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
        const spikeChargeProgress = this.spikeChargeDuration > 0
          ? clamp(1 - this.spikeChargeTimer / this.spikeChargeDuration, 0, 1)
          : 0;
        const ambushChargeProgress = this.aiState === 'ambush'
          ? clamp(this.ambushCharge / Math.max(1, this.ambushChargeTarget), 0, 1)
          : 0;
        const chargeProgress = Math.max(spikeChargeProgress, ambushChargeProgress * 0.82);
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
          // Р”РѕСЂСЃР°Р»СЊРЅС‹Рµ РЅР°СЂРѕСЃС‚С‹.
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
          // Р‘РѕРєРѕРІС‹Рµ СЂРµСЃРЅРёС‡РєРё.
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

        // РњРµРјР±СЂР°РЅР° Рё РїР»Р°СЃС‚РёРЅС‹.
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

        // РЇРґСЂРѕ Рё РІРЅСѓС‚СЂРµРЅРЅРёРµ РїСЏС‚РЅР°.
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

        // Р РѕС‚/С…РёС‰РЅС‹Р№ РІС‹СЂРѕСЃС‚.
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

        // Р“Р»Р°Р·.
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.ellipse(width * 0.15, -height * 0.24, Math.max(2, this.radius * 0.14), Math.max(1.5, this.radius * 0.11), 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(15, 45, 40, 0.7)';
        ctx.beginPath();
        ctx.arc(width * 0.2, -height * 0.24, Math.max(1.2, this.radius * 0.05), 0, Math.PI * 2);
        ctx.fill();

        // Р‘Р»РёРє.
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

const enemyRenderDescriptors = Object.getOwnPropertyDescriptors(EnemyRenderMethods.prototype);
delete enemyRenderDescriptors.constructor;
Object.defineProperties(Enemy.prototype, enemyRenderDescriptors);

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

