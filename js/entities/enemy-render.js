const ENEMY_BASIC_FILL_COLORS = ['#ffe9d5', '#ff8f7c', '#7c1837'];
const ENEMY_BASIC_EYE_COLOR = 'rgba(255,245,252,0.95)';
const ENEMY_SHIELD_FILL_COLORS = ['#fff6cf', '#efb064', '#76503f'];
const ENEMY_SHIELD_BROKEN_FILL_COLORS = ['#fff1c4', '#dfa25f', '#6c493d'];
const ENEMY_SHIELD_EYE_COLOR = 'rgba(255,252,244,0.96)';
const ENEMY_APPENDAGE_PALETTES = [
  ['#060910', '#121a2a', '#2b3b56', 'rgba(91,112,150,0.82)', '#45112c', '#21091c', 'rgba(139,47,78,0.68)'],
  ['#0d0712', '#22132e', '#45234e', 'rgba(118,85,139,0.82)', '#521342', '#280a27', 'rgba(157,55,122,0.68)'],
  ['#050d0e', '#102426', '#274446', 'rgba(78,124,124,0.82)', '#431c27', '#201014', 'rgba(132,67,76,0.68)'],
  ['#100808', '#291414', '#4b2825', 'rgba(137,91,83,0.82)', '#591821', '#2c0b10', 'rgba(166,61,68,0.68)']
];
const enemySpritePendingKeys = new Set();
const enemyBasicTailSprites = [];
const enemyPerkTailSprites = [];
const enemyBasicFinSprites = [];
const enemyShieldArmorSprites = [];

function getEnemyBasicTailSprite(variant) {
  if (enemyBasicTailSprites[variant]) return enemyBasicTailSprites[variant];
  const palette = ENEMY_APPENDAGE_PALETTES[variant];
  const sprite = createSpriteCanvas(128, 96, (spriteCtx) => {
    const originX = 110;
    const originY = 48;
    const gradient = spriteCtx.createLinearGradient(originX, originY, 14, originY);
    gradient.addColorStop(0, palette[0]);
    gradient.addColorStop(0.52, palette[1]);
    gradient.addColorStop(1, palette[2]);
    spriteCtx.fillStyle = gradient;
    spriteCtx.beginPath();
    spriteCtx.moveTo(originX, originY);
    spriteCtx.bezierCurveTo(86, 32, 62, 19, 39, 18);
    spriteCtx.quadraticCurveTo(23, 17, 9, 29);
    spriteCtx.quadraticCurveTo(31, 37, 54, originY);
    spriteCtx.quadraticCurveTo(31, 59, 9, 67);
    spriteCtx.quadraticCurveTo(23, 79, 39, 78);
    spriteCtx.bezierCurveTo(62, 77, 86, 64, originX, originY);
    spriteCtx.closePath();
    spriteCtx.fill();
    spriteCtx.strokeStyle = palette[3];
    spriteCtx.lineWidth = 2;
    spriteCtx.stroke();
  });
  sprite.originX = 110;
  sprite.originY = 48;
  enemyBasicTailSprites[variant] = sprite;
  return sprite;
}

function getEnemyPerkTailSprite(variant, level) {
  const tier = Math.max(1, Math.min(4, level));
  const key = variant * 5 + tier;
  if (enemyPerkTailSprites[key]) return enemyPerkTailSprites[key];
  const palette = ENEMY_APPENDAGE_PALETTES[variant];
  const sprite = createSpriteCanvas(196, 132, (spriteCtx) => {
    const originX = 178;
    const originY = 66;
    const tipX = 13 - tier * 1.5;
    const gradient = spriteCtx.createLinearGradient(originX, originY, tipX, originY);
    gradient.addColorStop(0, palette[0]);
    gradient.addColorStop(0.5, palette[1]);
    gradient.addColorStop(1, palette[2]);
    spriteCtx.fillStyle = gradient;
    spriteCtx.beginPath();
    spriteCtx.moveTo(originX, originY);
    spriteCtx.bezierCurveTo(150, 56, 124, 39, 104, 24);
    spriteCtx.bezierCurveTo(78, 5, 43, 4, tipX, 12);
    spriteCtx.bezierCurveTo(28, 29, 44, 49, 56, originY);
    spriteCtx.bezierCurveTo(44, 83, 28, 103, tipX, 120);
    spriteCtx.bezierCurveTo(43, 128, 78, 127, 104, 108);
    spriteCtx.bezierCurveTo(124, 93, 150, 76, originX, originY);
    spriteCtx.closePath();
    spriteCtx.fill();
    spriteCtx.strokeStyle = palette[3];
    spriteCtx.lineWidth = 3;
    spriteCtx.lineJoin = 'round';
    spriteCtx.stroke();

    spriteCtx.strokeStyle = 'rgba(218, 208, 236, 0.78)';
    spriteCtx.lineWidth = 2.4 + tier * 0.3;
    spriteCtx.lineCap = 'round';
    spriteCtx.beginPath();
    spriteCtx.moveTo(151, originY - 2);
    spriteCtx.quadraticCurveTo(96, originY - 17, 34, 20);
    spriteCtx.moveTo(151, originY + 2);
    spriteCtx.quadraticCurveTo(96, originY + 17, 34, 112);
    spriteCtx.stroke();

    spriteCtx.fillStyle = palette[4];
    spriteCtx.beginPath();
    spriteCtx.moveTo(143, originY);
    spriteCtx.quadraticCurveTo(115, originY - 10, 91, originY);
    spriteCtx.quadraticCurveTo(115, originY + 10, 143, originY);
    spriteCtx.fill();
  });
  sprite.originX = 178;
  sprite.originY = 66;
  enemyPerkTailSprites[key] = sprite;
  return sprite;
}

function getEnemyBasicFinSprite(variant) {
  if (enemyBasicFinSprites[variant]) return enemyBasicFinSprites[variant];
  const palette = ENEMY_APPENDAGE_PALETTES[variant];
  const sprite = createSpriteCanvas(100, 64, (spriteCtx) => {
    const gradient = spriteCtx.createLinearGradient(84, 12, 14, 48);
    gradient.addColorStop(0, palette[0]);
    gradient.addColorStop(0.56, palette[1]);
    gradient.addColorStop(1, palette[2]);
    spriteCtx.fillStyle = gradient;
    spriteCtx.beginPath();
    spriteCtx.moveTo(84, 12);
    spriteCtx.bezierCurveTo(61, 15, 28, 27, 9, 49);
    spriteCtx.bezierCurveTo(39, 51, 69, 35, 84, 12);
    spriteCtx.closePath();
    spriteCtx.fill();
    spriteCtx.strokeStyle = palette[3];
    spriteCtx.lineWidth = 2;
    spriteCtx.stroke();
  });
  sprite.originX = 84;
  sprite.originY = 12;
  enemyBasicFinSprites[variant] = sprite;
  return sprite;
}

function getEnemyShieldArmorSprite(intact) {
  const index = intact ? 1 : 0;
  if (enemyShieldArmorSprites[index]) return enemyShieldArmorSprites[index];
  const sprite = createSpriteCanvas(180, 130, (spriteCtx) => {
    const originX = 90;
    const originY = 65;
    spriteCtx.save();
    spriteCtx.translate(originX, originY);
    spriteCtx.lineJoin = 'round';

    if (intact) {
      const rearGradient = spriteCtx.createLinearGradient(-72, -28, 0, 32);
      rearGradient.addColorStop(0, '#40517f');
      rearGradient.addColorStop(0.48, '#29365c');
      rearGradient.addColorStop(1, '#171b38');
      spriteCtx.fillStyle = rearGradient;
      spriteCtx.beginPath();
      spriteCtx.moveTo(-68, 0);
      spriteCtx.bezierCurveTo(-66, -24, -55, -33, -38, -32);
      spriteCtx.bezierCurveTo(-24, -28, -19, -14, -21, 0);
      spriteCtx.bezierCurveTo(-19, 14, -24, 28, -38, 32);
      spriteCtx.bezierCurveTo(-55, 33, -66, 24, -68, 0);
      spriteCtx.closePath();
      spriteCtx.fill();
      spriteCtx.strokeStyle = 'rgba(12, 15, 31, 0.95)';
      spriteCtx.lineWidth = 2.6;
      spriteCtx.stroke();

      const topGradient = spriteCtx.createLinearGradient(-42, -46, 27, -8);
      topGradient.addColorStop(0, '#6570aa');
      topGradient.addColorStop(0.52, '#404979');
      topGradient.addColorStop(1, '#25244e');
      spriteCtx.fillStyle = topGradient;
      spriteCtx.beginPath();
      spriteCtx.moveTo(-44, -33);
      spriteCtx.bezierCurveTo(-28, -44, -5, -42, 15, -25);
      spriteCtx.bezierCurveTo(9, -15, -4, -9, -20, -11);
      spriteCtx.bezierCurveTo(-31, -14, -40, -23, -44, -33);
      spriteCtx.closePath();
      spriteCtx.fill();
      spriteCtx.strokeStyle = 'rgba(14, 16, 35, 0.95)';
      spriteCtx.lineWidth = 2.4;
      spriteCtx.stroke();

      const bottomGradient = spriteCtx.createLinearGradient(-42, 46, 27, 8);
      bottomGradient.addColorStop(0, '#4a548b');
      bottomGradient.addColorStop(0.5, '#343b6a');
      bottomGradient.addColorStop(1, '#1b2044');
      spriteCtx.fillStyle = bottomGradient;
      spriteCtx.beginPath();
      spriteCtx.moveTo(-44, 33);
      spriteCtx.bezierCurveTo(-28, 44, -5, 42, 15, 25);
      spriteCtx.bezierCurveTo(9, 15, -4, 9, -20, 11);
      spriteCtx.bezierCurveTo(-31, 14, -40, 23, -44, 33);
      spriteCtx.closePath();
      spriteCtx.fill();
      spriteCtx.strokeStyle = 'rgba(12, 14, 31, 0.95)';
      spriteCtx.lineWidth = 2.4;
      spriteCtx.stroke();

      spriteCtx.strokeStyle = 'rgba(143, 173, 226, 0.38)';
      spriteCtx.lineWidth = 1.5;
      spriteCtx.lineCap = 'round';
      spriteCtx.beginPath();
      spriteCtx.moveTo(-56, -16);
      spriteCtx.quadraticCurveTo(-46, -25, -32, -23);
      spriteCtx.moveTo(-30, -34);
      spriteCtx.quadraticCurveTo(-10, -37, 6, -25);
      spriteCtx.moveTo(-30, 34);
      spriteCtx.quadraticCurveTo(-10, 37, 6, 25);
      spriteCtx.stroke();
    } else {
      const fragmentGradient = spriteCtx.createLinearGradient(-70, -30, 35, 34);
      fragmentGradient.addColorStop(0, 'rgba(72, 86, 137, 0.82)');
      fragmentGradient.addColorStop(0.55, 'rgba(48, 57, 103, 0.78)');
      fragmentGradient.addColorStop(1, 'rgba(25, 28, 59, 0.74)');
      spriteCtx.fillStyle = fragmentGradient;
      spriteCtx.beginPath();
      spriteCtx.moveTo(-72, 0);
      spriteCtx.bezierCurveTo(-69, -18, -60, -28, -47, -27);
      spriteCtx.lineTo(-40, -13);
      spriteCtx.lineTo(-47, 3);
      spriteCtx.bezierCurveTo(-58, 9, -69, 13, -72, 0);
      spriteCtx.closePath();
      spriteCtx.moveTo(-23, -43);
      spriteCtx.quadraticCurveTo(-3, -45, 10, -33);
      spriteCtx.lineTo(1, -24);
      spriteCtx.lineTo(-17, -28);
      spriteCtx.closePath();
      spriteCtx.moveTo(8, 36);
      spriteCtx.quadraticCurveTo(25, 33, 34, 22);
      spriteCtx.lineTo(24, 15);
      spriteCtx.lineTo(8, 24);
      spriteCtx.closePath();
      spriteCtx.fill();
      spriteCtx.strokeStyle = 'rgba(15, 17, 35, 0.86)';
      spriteCtx.lineWidth = 1.8;
      spriteCtx.stroke();

      spriteCtx.strokeStyle = 'rgba(45, 49, 86, 0.8)';
      spriteCtx.lineWidth = 1.7;
      spriteCtx.lineCap = 'round';
      spriteCtx.beginPath();
      spriteCtx.moveTo(-3, -15);
      spriteCtx.lineTo(6, -5);
      spriteCtx.lineTo(0, 4);
      spriteCtx.lineTo(10, 13);
      spriteCtx.moveTo(29, 8);
      spriteCtx.lineTo(21, 16);
      spriteCtx.lineTo(27, 24);
      spriteCtx.stroke();
    }

    spriteCtx.restore();
  });
  sprite.originX = 90;
  sprite.originY = 65;
  enemyShieldArmorSprites[index] = sprite;
  return sprite;
}

function traceTopDownEnemyBody(renderCtx, width, height) {
  renderCtx.beginPath();
  renderCtx.ellipse(0, 0, width, height, 0, 0, Math.PI * 2);
  renderCtx.closePath();
}

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
      usesTopDownEnemyBody() {
        return this.type === 'basic' || this.type === 'shield';
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
          const agilityLevel = Math.min(4, this.agilityLevel);
          const totalPerks = tailLevel + spikeLevel + shellLevel + mawLevel + tentacleLevel + agilityLevel;
          const usesTopDownBody = this.usesTopDownEnemyBody();
          const appendagePalette = ENEMY_APPENDAGE_PALETTES[this.appendageVariant];
          const width = radius * (usesTopDownBody ? 1.1 : 1.1 + totalPerks * 0.012);
          const height = radius * (usesTopDownBody ? 0.8 : 0.8 + totalPerks * 0.005);
          const dorsalHeight = 0.18 + agilityLevel * 0.035;

          spriteCtx.save();
          spriteCtx.translate(originX, originY);

          if (tailLevel > 0 && !usesTopDownBody) {
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
          } else if (!usesTopDownBody) {
            spriteCtx.strokeStyle = 'rgba(184, 255, 242, 0.7)';
            spriteCtx.lineWidth = Math.max(1.4, radius * 0.12);
            spriteCtx.lineCap = 'round';
            spriteCtx.beginPath();
            spriteCtx.moveTo(-width * 0.76, 0);
            spriteCtx.quadraticCurveTo(-width * 1.18, height * 0.54, -width * 1.48, height * 0.18);
            spriteCtx.stroke();
          }

          if (agilityLevel > 0 && !usesTopDownBody) {
            spriteCtx.fillStyle = `rgba(210, 255, 244, ${0.2 + agilityLevel * 0.045})`;
            spriteCtx.beginPath();
            spriteCtx.moveTo(-width * 0.46, -height * 0.35);
            spriteCtx.quadraticCurveTo(-width * 0.08, -height * (1 + dorsalHeight), width * 0.22, -height * 0.28);
            spriteCtx.quadraticCurveTo(-width * 0.03, -height * 0.1, -width * 0.46, -height * 0.35);
            spriteCtx.fill();
          }

          if (spikeLevel > 0) {
            const rootX = width * 0.34;
            const rootOffsetY = height * 0.62;
            const tipX = width * (1.05 + spikeLevel * 0.08);
            const tipOffsetY = height * (0.95 + spikeLevel * 0.05);
            const rootHalfWidth = height * (0.2 + spikeLevel * 0.01);
            const drawCheekSpike = (side) => {
              const rootY = side * rootOffsetY;
              const tipY = side * tipOffsetY;
              const spikeGradient = spriteCtx.createLinearGradient(rootX, rootY, tipX, tipY);
              spikeGradient.addColorStop(0, 'rgba(90,255,228,0.2)');
              spikeGradient.addColorStop(0.5, 'rgba(220,255,250,0.96)');
              spikeGradient.addColorStop(1, 'rgba(255,255,255,1)');
              spriteCtx.fillStyle = spikeGradient;
              spriteCtx.beginPath();
              spriteCtx.moveTo(rootX - width * 0.08, rootY - rootHalfWidth * side);
              spriteCtx.quadraticCurveTo(width * 0.7, side * height * 0.72, tipX, tipY);
              spriteCtx.quadraticCurveTo(width * 0.76, side * height * 1.02, rootX + width * 0.12, rootY + rootHalfWidth * side);
              spriteCtx.closePath();
              spriteCtx.fill();
            };
            drawCheekSpike(-1);
            drawCheekSpike(1);
          }

          const gradient = spriteCtx.createRadialGradient(-width * 0.25, -height * 0.35, width * 0.12, 0, 0, width * 1.08);
          gradient.addColorStop(0, fillColors[0]);
          gradient.addColorStop(0.55, fillColors[1]);
          gradient.addColorStop(1, fillColors[2] || fillColors[1]);

          spriteCtx.fillStyle = gradient;
          if (usesTopDownBody) {
            traceTopDownEnemyBody(spriteCtx, width, height);
          } else {
            spriteCtx.beginPath();
            spriteCtx.ellipse(0, 0, width, height, 0, 0, Math.PI * 2);
            spriteCtx.closePath();
          }
          spriteCtx.fill();
          spriteCtx.lineWidth = Math.max(1, radius * 0.045);
          if (usesTopDownBody) {
            spriteCtx.strokeStyle = 'rgba(255,235,211,0.62)';
            traceTopDownEnemyBody(spriteCtx, width * 1.015, height * 1.02);
            spriteCtx.stroke();
          } else {
            spriteCtx.strokeStyle = 'rgba(215,255,248,0.38)';
            spriteCtx.beginPath();
            spriteCtx.ellipse(0, 0, width * 1.02, height * 1.03, 0, 0, Math.PI * 2);
            spriteCtx.stroke();
          }

          if (shellLevel > 0) {
            spriteCtx.strokeStyle = `rgba(190,255,255,${0.2 + shellLevel * 0.07})`;
            spriteCtx.lineWidth = 1.6 + shellLevel * 0.55;
            spriteCtx.beginPath();
            spriteCtx.ellipse(0, 0, width * 0.84, height * 0.74, 0, 0, Math.PI * 2);
            spriteCtx.stroke();
            spriteCtx.strokeStyle = `rgba(225,255,252,${0.16 + shellLevel * 0.045})`;
            spriteCtx.lineWidth = 1.2 + shellLevel * 0.28;
            for (let i = -1; i <= 1; i++) {
              const ribX = i * width * 0.27;
              spriteCtx.beginPath();
              spriteCtx.moveTo(ribX, -height * 0.58);
              spriteCtx.quadraticCurveTo(ribX + width * 0.08, 0, ribX, height * 0.58);
              spriteCtx.stroke();
            }
          }

          if (usesTopDownBody) {
            spriteCtx.fillStyle = 'rgba(255, 250, 229, 0.24)';
            spriteCtx.beginPath();
            spriteCtx.ellipse(-width * 0.28, -height * 0.22, width * 0.34, height * 0.24, -0.16, 0, Math.PI * 2);
            spriteCtx.fill();
          } else {
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
          }

          if (!usesTopDownBody) {
            const mouthScale = 0.22 + mawLevel * 0.055;
            spriteCtx.fillStyle = appendagePalette[3];
            spriteCtx.globalAlpha = 0.3;
            spriteCtx.beginPath();
            spriteCtx.ellipse(width * 0.67, 0, width * 0.25, height * (mouthScale + 0.08), 0, 0, Math.PI * 2);
            spriteCtx.fill();
            spriteCtx.globalAlpha = 1;
            spriteCtx.fillStyle = 'rgba(28, 12, 18, 0.52)';
            spriteCtx.beginPath();
            spriteCtx.ellipse(width * 0.74, 0, width * (0.16 + mawLevel * 0.015), height * mouthScale, 0, -Math.PI * 0.9, Math.PI * 0.9);
            spriteCtx.fill();
            spriteCtx.fillStyle = appendagePalette[6];
            spriteCtx.beginPath();
            spriteCtx.ellipse(width * 0.67, height * 0.025, width * 0.09, height * mouthScale * 0.42, 0, 0, Math.PI * 2);
            spriteCtx.fill();
          }

          if (!usesTopDownBody) {
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
          }

          spriteCtx.restore();
        });

        sprite.originX = 220;
        sprite.originY = sprite.height * 0.5;
        sprite.enemyLastUsedFrame = typeof simulationFrame === 'number' ? simulationFrame : 0;
        enemySpriteCache.set(key, sprite);
        return sprite;
      }

      drawTopDownAnimatedTail(bodyWidth, speed) {
        if (!this.usesTopDownEnemyBody()) return;
        const tailLevel = Math.min(4, this.tailLevel);
        const tail = tailLevel > 0
          ? getEnemyPerkTailSprite(this.appendageVariant, tailLevel)
          : getEnemyBasicTailSprite(this.appendageVariant);
        const speedFactor = Math.min(1, speed * 0.34);
        const fleeBoost = this.isFleeing ? 0.11 : 0;
        const shieldWeight = this.type === 'shield' ? 0.68 : 1;
        const perkWeight = tailLevel > 0 ? 0.82 : 1;
        const wag = Math.sin(this.swimPhase * (this.type === 'shield' ? 0.76 : 1.08) + this.finOffset - this.turnTilt * 0.7) * (0.16 + speedFactor * 0.16 + fleeBoost) * shieldWeight * perkWeight;
        const tailScale = tailLevel > 0 ? 0.7 + tailLevel * 0.045 : 0.8;
        ctx.save();
        ctx.translate(-bodyWidth * 0.8, 0);
        ctx.rotate(wag);
        ctx.scale(
          (0.84 + speedFactor * 0.08) * tailScale,
          (0.82 + speedFactor * 0.13 + fleeBoost * 0.24) * tailScale
        );
        ctx.drawImage(tail, -tail.originX, -tail.originY);
        ctx.restore();
      }

      drawTopDownAnimatedFins(bodyWidth, bodyHeight) {
        if (!this.usesTopDownEnemyBody()) return;
        const fin = getEnemyBasicFinSprite(this.appendageVariant);
        const perkScale = 1 + Math.min(4, this.agilityLevel) * 0.1;
        const shieldWeight = this.type === 'shield' ? 0.68 : 1;
        for (let side = -1; side <= 1; side += 2) {
          const turnOpen = clamp(this.finTurnLag * side / 0.36, -1, 1);
          const finWave = Math.sin(this.swimPhase * (this.type === 'shield' ? 0.54 : 0.78) + this.finOffset + side * 0.42 - turnOpen * 0.34) * 0.1 * shieldWeight;
          const openness = 1 + Math.max(0, turnOpen) * 0.34 - Math.max(0, -turnOpen) * 0.18;
          ctx.save();
          ctx.translate(-bodyWidth * 0.04, side * bodyHeight * 0.72);
          ctx.rotate(side * (0.08 + finWave - turnOpen * 0.08));
          ctx.scale(0.88 * perkScale, side * (0.72 + openness * 0.16) * perkScale);
          ctx.drawImage(fin, -fin.originX, -fin.originY);
          ctx.restore();
        }
      }

      drawTopDownArmorOverlay() {
        if (this.type !== 'shield') return;
        const armor = getEnemyShieldArmorSprite(this.hasShield);
        ctx.drawImage(armor, -armor.originX, -armor.originY);
      }

      drawTopDownAnimatedFace(bodyWidth, bodyHeight, eyeColor) {
        if (!this.usesTopDownEnemyBody()) return;
        const eyeX = bodyWidth * 0.35;
        const eyeY = bodyHeight * 0.34;
        const eyeWidth = 10.8;
        const eyeHeight = this.visualIntent === 4 ? 5.4 : 6.3;

        for (let side = -1; side <= 1; side += 2) {
          const centerY = eyeY * side;
          ctx.fillStyle = eyeColor;
          ctx.beginPath();
          ctx.moveTo(eyeX - eyeWidth, centerY - side * eyeHeight * 0.18);
          ctx.quadraticCurveTo(eyeX, centerY - eyeHeight * side, eyeX + eyeWidth, centerY + side * eyeHeight * 0.22);
          ctx.quadraticCurveTo(eyeX, centerY + eyeHeight * side, eyeX - eyeWidth, centerY - side * eyeHeight * 0.18);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = 'rgba(89, 17, 42, 0.72)';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = 'rgba(31, 10, 27, 0.92)';
          ctx.beginPath();
          ctx.ellipse(eyeX + 2, centerY, 3.15, 3.7, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(255,255,255,0.72)';
          ctx.beginPath();
          ctx.arc(eyeX + 0.9, centerY - side, 0.85, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(86, 16, 40, 0.82)';
          ctx.lineWidth = 2.6;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(eyeX - eyeWidth * 0.88, side * (eyeY - eyeHeight * 0.42));
          ctx.quadraticCurveTo(eyeX, side * (eyeY - eyeHeight * 0.84), eyeX + eyeWidth * 0.9, side * (eyeY - eyeHeight * 0.18));
          ctx.stroke();
        }

        const eventOpen = Math.min(1, this.attackPulse * 0.5 + this.eatPulse * 0.36 + this.swallowPulse * 0.28);
        const openPulse = Math.max(clamp(this.visualMouthOpen || 0, 0, 1), eventOpen);
        const palette = ENEMY_APPENDAGE_PALETTES[this.appendageVariant];
        const mouthRootX = bodyWidth * 0.68;
        const mouthFrontX = bodyWidth * (1.24 + this.mawLevel * 0.018);
        const tipOffsetY = bodyHeight * (0.1 + this.mawLevel * 0.01 + openPulse * 0.28);
        const rootOuterY = bodyHeight * (0.42 + this.mawLevel * 0.012);
        const rootInnerY = bodyHeight * (0.18 + this.mawLevel * 0.008);
        ctx.fillStyle = 'rgba(18, 3, 16, 0.98)';
        ctx.beginPath();
        ctx.ellipse(
          bodyWidth * 0.81,
          0,
          bodyWidth * 0.22,
          bodyHeight * (0.17 + openPulse * 0.1 + this.mawLevel * 0.008),
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.fillStyle = palette[6];
        ctx.beginPath();
        ctx.ellipse(
          bodyWidth * 0.71,
          bodyHeight * 0.02,
          bodyWidth * 0.095,
          bodyHeight * (0.065 + openPulse * 0.045),
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();

        for (let side = -1; side <= 1; side += 2) {
          const tipY = tipOffsetY * side;
          ctx.fillStyle = side < 0 ? palette[4] : palette[5];
          ctx.beginPath();
          ctx.moveTo(mouthRootX, rootOuterY * side);
          ctx.bezierCurveTo(
            bodyWidth * 0.86,
            side * bodyHeight * (0.56 + openPulse * 0.08),
            mouthFrontX - bodyWidth * 0.1,
            tipY + side * bodyHeight * 0.24,
            mouthFrontX,
            tipY
          );
          ctx.bezierCurveTo(
            mouthFrontX - bodyWidth * 0.13,
            tipY + side * bodyHeight * 0.025,
            bodyWidth * 0.84,
            side * bodyHeight * (0.13 + openPulse * 0.06),
            mouthRootX,
            rootInnerY * side
          );
          ctx.quadraticCurveTo(
            mouthRootX - bodyWidth * 0.07,
            side * bodyHeight * 0.3,
            mouthRootX,
            rootOuterY * side
          );
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = palette[3];
          ctx.lineWidth = 2.3 + this.mawLevel * 0.2;
          ctx.stroke();
        }

      }

      drawConsumedBodySprite(sprite, bodyWidth) {
        const bite = this.consumeBite || 0;
        if (bite <= 0.001) {
          ctx.drawImage(sprite, -sprite.originX, -sprite.originY);
          return;
        }
        const top = -sprite.originY - 4;
        const height = sprite.height + 8;
        const left = -sprite.originX - 4;
        const rearEnd = -bodyWidth * 0.12;
        const middleEnd = bodyWidth * 0.42;

        ctx.save();
        ctx.beginPath();
        ctx.rect(left, top, rearEnd - left + 3, height);
        ctx.clip();
        ctx.drawImage(sprite, -sprite.originX, -sprite.originY);
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.rect(rearEnd - 3, top, middleEnd - rearEnd + 6, height);
        ctx.clip();
        ctx.translate(bodyWidth * 0.12, 0);
        ctx.scale(1 - bite * 0.05, 1 - bite * 0.18);
        ctx.translate(-bodyWidth * 0.12, 0);
        ctx.drawImage(sprite, -sprite.originX, -sprite.originY);
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.rect(middleEnd - 3, top, sprite.width + sprite.originX, height);
        ctx.clip();
        ctx.translate(bodyWidth * (0.42 - bite * 0.09), 0);
        ctx.scale(1 - bite * 0.2, 1 - bite * 0.52);
        ctx.translate(-bodyWidth * 0.42, 0);
        ctx.drawImage(sprite, -sprite.originX, -sprite.originY);
        ctx.restore();
      }

      drawCachedBody(fillColors, eyeColor = 'rgba(255,255,255,0.92)') {
        const speed = Math.hypot(this.vx, this.vy);
        const usesTopDownBody = this.usesTopDownEnemyBody();
        const speedFactor = Math.min(1, speed / 2.5);
        const pulse = usesTopDownBody
          ? Math.sin(this.swimPhase * (this.type === 'shield' ? 0.66 : 0.94)) * (this.type === 'shield' ? 0.018 + speedFactor * 0.018 : 0.028 + speedFactor * 0.035)
          : Math.sin(this.swimPhase) * 0.05;
        const bodySway = usesTopDownBody
          ? Math.sin(this.swimPhase * (this.type === 'shield' ? 0.36 : 0.52) + this.finOffset) * (this.type === 'shield' ? 0.006 + speedFactor * 0.01 : 0.01 + speedFactor * 0.018)
          : 0;
        const spikeChargeProgress = this.spikeChargeDuration > 0
          ? clamp(1 - this.spikeChargeTimer / this.spikeChargeDuration, 0, 1)
          : 0;
        const ambushChargeProgress = this.aiState === 'ambush'
          ? clamp(this.ambushCharge / Math.max(1, this.ambushChargeTarget), 0, 1)
          : 0;
        const chargeProgress = Math.max(spikeChargeProgress, ambushChargeProgress * 0.82);
        const chargeSqueeze = chargeProgress * chargeProgress;
        const scale = this.radius / 64;
        const speedStretch = usesTopDownBody ? 0 : speed * 0.018;
        const topDownShapeX = 1 + pulse + this.attackPulse * 0.025 - chargeSqueeze * 0.1;
        const scaleX = usesTopDownBody
          ? scale * topDownShapeX
          : scale * (1 + pulse + speedStretch + this.attackPulse * 0.035 + this.eatPulse * 0.02 - chargeSqueeze * 0.16);
        const scaleY = usesTopDownBody
          ? scale / topDownShapeX
          : scale * (1 - pulse * 0.35 + this.eatPulse * 0.018 + this.swallowPulse * 0.024 - this.hurtPulse * 0.04 + chargeSqueeze * 0.11);
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
          const totalPerks = this.getTotalPerkLevels();
          const bodyWidth = 64 * (usesTopDownBody ? 1.1 : 1.1 + totalPerks * 0.012);
          const bodyHeight = 64 * (usesTopDownBody ? 0.8 : 0.8 + totalPerks * 0.005);
          ctx.save();
          ctx.translate(this.x + jitterX, this.y + jitterY);
          ctx.rotate(this.displayAngle + this.turnTilt * (usesTopDownBody ? 0.42 : 0.32) + bodySway);
          ctx.scale(scaleX * (this.consumeScaleX || 1), scaleY * (this.consumeScaleY || 1));
          this.drawTopDownAnimatedTail(bodyWidth, speed);
          this.drawTopDownAnimatedFins(bodyWidth, bodyHeight);
          ctx.fillStyle = fillColors[1];
          if (usesTopDownBody) {
            traceTopDownEnemyBody(ctx, bodyWidth, bodyHeight);
          } else {
            ctx.beginPath();
            ctx.ellipse(0, 0, bodyWidth, bodyHeight, 0, 0, Math.PI * 2);
          }
          ctx.fill();
          this.drawTopDownArmorOverlay();
          if (!usesTopDownBody) {
            ctx.fillStyle = eyeColor;
            ctx.beginPath();
            ctx.ellipse(bodyWidth * 0.15, -bodyHeight * 0.24, 8, 6, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          this.drawTopDownAnimatedFace(bodyWidth, bodyHeight, eyeColor);
          ctx.restore();
          this.drawCampaignAlarmWarning();
          return;
        }

        const sprite = this.getCachedBodySprite(fillColors, eyeColor);

        ctx.save();
        ctx.translate(this.x + jitterX, this.y + jitterY);
        ctx.rotate(this.displayAngle + this.turnTilt * (usesTopDownBody ? 0.42 : 0.32) + bodySway);
        ctx.scale(scaleX * (this.consumeScaleX || 1), scaleY * (this.consumeScaleY || 1));
        const totalPerks = this.getTotalPerkLevels();
        const bodyWidth = 64 * (usesTopDownBody ? 1.1 : 1.1 + totalPerks * 0.012);
        const bodyHeight = 64 * (usesTopDownBody ? 0.8 : 0.8 + totalPerks * 0.005);
        this.drawTopDownAnimatedTail(bodyWidth, speed);
        this.drawTopDownAnimatedFins(bodyWidth, bodyHeight);
        this.drawConsumedBodySprite(sprite, bodyWidth);
        this.drawTopDownArmorOverlay();
        const consumeBite = this.consumeBite || 0;
        if (consumeBite > 0.001) {
          ctx.save();
          ctx.translate(bodyWidth * (0.42 - consumeBite * 0.09), 0);
          ctx.scale(1 - consumeBite * 0.2, 1 - consumeBite * 0.52);
          ctx.translate(-bodyWidth * 0.42, 0);
          this.drawTopDownAnimatedFace(bodyWidth, bodyHeight, eyeColor);
          ctx.restore();
        } else {
          this.drawTopDownAnimatedFace(bodyWidth, bodyHeight, eyeColor);
        }

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
        this.shieldBreakGrace = 0;
        this.radius *= 1.02 + Math.random() * 0.12;
        this.level = calculateLevelFromRadius(this.radius);
      }

      onAttack(attacker) {
        if (!this.hasShield) return this.shieldBreakGrace > 0;

        this.hasShield = false;
        this.shieldBreakGrace = 14;

        const dx = attacker.x - this.x;
        const dy = attacker.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        const nx = dx / dist;
        const ny = dy / dist;
        const contactDistance = (attacker.radius || 0) + this.radius * 0.94 + 4;
        const overlap = contactDistance - dist;

        if (overlap > 0) {
          attacker.x += nx * overlap * 0.72;
          attacker.y += ny * overlap * 0.72;
          this.x -= nx * overlap * 0.28;
          this.y -= ny * overlap * 0.28;
        }

        if (typeof attacker.applyKnockback === 'function') {
          attacker.applyKnockback(nx * 4.6, ny * 4.6, 15);
        } else {
          attacker.vx += nx * 1.5;
          attacker.vy += ny * 1.5;
        }

        this.vx -= nx * 0.9;
        this.vy -= ny * 0.9;
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
      }
    }
