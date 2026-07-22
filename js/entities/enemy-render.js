const ENEMY_BASIC_FILL_COLORS = ['#ffe9d5', '#ff8f7c', '#7c1837'];
const ENEMY_BASIC_EYE_COLOR = 'rgba(255,245,252,0.95)';
const ENEMY_SHIELD_FILL_COLORS = ['#fff4dd', '#f6af7d', '#914d48'];
const ENEMY_SHIELD_BROKEN_FILL_COLORS = ['#ffe3d8', '#ff8d76', '#7a2433'];
const ENEMY_SHIELD_EYE_COLOR = 'rgba(255,252,244,0.96)';
const enemySpritePendingKeys = new Set();

function clearEnemySpritePendingKeys() {
  enemySpritePendingKeys.clear();
}

function isEnemySpriteKeyActive(key) {
  if (!Array.isArray(enemies)) return false;
  for (let i = 0; i < enemies.length; i++) {
    if (enemies[i]?.enemySpriteKey === key) return true;
  }
  return false;
}

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

      drawCampaignAlarmWarning() {
        if (!(this.campaignAlarmTimer > 0)) return;
        const elapsed = this.campaignAlarmDuration - this.campaignAlarmTimer;
        const intro = clamp(elapsed / 18, 0, 1);
        const alpha = (0.28 + Math.sin(frameTime * 0.22) * 0.08) * intro;
        ctx.save();
        ctx.strokeStyle = `rgba(255, 114, 88, ${alpha})`;
        ctx.lineWidth = Math.max(1.6, this.radius * 0.055);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * (1.32 + intro * 0.12), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      onAttack(attacker) {
        return false;
      }

      getSpriteCacheKey(fillColors, eyeColor) {
        const tailLevel = Math.min(4, this.tailLevel);
        const spikeLevel = Math.min(4, this.spikeLevel);
        const shellLevel = Math.min(4, this.shellLevel);
        const mawLevel = Math.min(4, this.mawLevel);
        const tentacleLevel = Math.min(4, this.tentacleLevel);
        const agilityLevel = Math.min(4, this.agilityLevel);
        if (
          this.enemySpriteKey &&
          this.enemySpriteKeyType === this.type &&
          this.enemySpriteKeyShield === this.hasShield &&
          this.enemySpriteKeyTail === tailLevel &&
          this.enemySpriteKeySpike === spikeLevel &&
          this.enemySpriteKeyShell === shellLevel &&
          this.enemySpriteKeyMaw === mawLevel &&
          this.enemySpriteKeyTentacle === tentacleLevel &&
          this.enemySpriteKeyAgility === agilityLevel &&
          this.enemySpriteKeyFill0 === fillColors[0] &&
          this.enemySpriteKeyFill1 === fillColors[1] &&
          this.enemySpriteKeyFill2 === fillColors[2] &&
          this.enemySpriteKeyEye === eyeColor
        ) {
          return this.enemySpriteKey;
        }
        const key = [
          'enemy-body',
          this.type,
          this.hasShield ? 1 : 0,
          tailLevel,
          spikeLevel,
          shellLevel,
          mawLevel,
          tentacleLevel,
          agilityLevel,
          fillColors.join('|'),
          eyeColor,
        ].join(':');
        this.enemySpriteKey = key;
        this.enemySpriteKeyType = this.type;
        this.enemySpriteKeyShield = this.hasShield;
        this.enemySpriteKeyTail = tailLevel;
        this.enemySpriteKeySpike = spikeLevel;
        this.enemySpriteKeyShell = shellLevel;
        this.enemySpriteKeyMaw = mawLevel;
        this.enemySpriteKeyTentacle = tentacleLevel;
        this.enemySpriteKeyAgility = agilityLevel;
        this.enemySpriteKeyFill0 = fillColors[0];
        this.enemySpriteKeyFill1 = fillColors[1];
        this.enemySpriteKeyFill2 = fillColors[2];
        this.enemySpriteKeyEye = eyeColor;
        return key;
      }

      getCachedBodySprite(fillColors, eyeColor) {
        const key = this.getSpriteCacheKey(fillColors, eyeColor);
        if (enemySpriteCache.has(key)) {
          const sprite = enemySpriteCache.get(key);
          sprite.enemyLastUsedFrame = typeof simulationFrame === 'number' ? simulationFrame : 0;
          return sprite;
        }

        const cacheLimit = typeof hasTouchControls === 'function' && hasTouchControls() ? 32 : 64;
        while (enemySpriteCache.size >= cacheLimit) {
          let oldestKey;
          let oldestFrame = Infinity;
          for (const [candidateKey, candidateSprite] of enemySpriteCache) {
            if (isEnemySpriteKeyActive(candidateKey)) continue;
            const lastUsedFrame = candidateSprite.enemyLastUsedFrame ?? -1;
            if (lastUsedFrame >= oldestFrame) continue;
            oldestFrame = lastUsedFrame;
            oldestKey = candidateKey;
          }
          if (oldestKey === undefined) {
            for (const [candidateKey, candidateSprite] of enemySpriteCache) {
              const lastUsedFrame = candidateSprite.enemyLastUsedFrame ?? -1;
              if (lastUsedFrame >= oldestFrame) continue;
              oldestFrame = lastUsedFrame;
              oldestKey = candidateKey;
            }
          }
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
        sprite.enemyLastUsedFrame = typeof simulationFrame === 'number' ? simulationFrame : 0;
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
          if (typeof scheduleRenderWarmupTask === 'function' && !enemySpritePendingKeys.has(spriteKey)) {
            enemySpritePendingKeys.add(spriteKey);
            scheduleRenderWarmupTask(() => {
              try {
                this.getCachedBodySprite(fillColors, eyeColor);
              } finally {
                enemySpritePendingKeys.delete(spriteKey);
              }
            }, true);
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
          this.drawCampaignAlarmWarning();
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
        this.drawCampaignAlarmWarning();
      }

      drawBody(fillColors, eyeColor = 'rgba(255,255,255,0.92)') {
        this.drawCachedBody(fillColors, eyeColor);
      }
      draw() {
        this.drawBody(
          ENEMY_BASIC_FILL_COLORS,
          ENEMY_BASIC_EYE_COLOR
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
            ? ENEMY_SHIELD_FILL_COLORS
            : ENEMY_SHIELD_BROKEN_FILL_COLORS,
          ENEMY_SHIELD_EYE_COLOR
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
