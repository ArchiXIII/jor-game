function getPlayerFxShadowScale() {
      return typeof hasTouchControls === 'function' && hasTouchControls() ? 0 : fxShadowScale;
    }

    function isPlayerLowDetail() {
      return typeof hasTouchControls === 'function' && hasTouchControls();
    }

    const FOOD_TINT_SETS = [
      ['#89ffb8', '#49e89a', '#d8fff0'],
      ['#7effcf', '#48e2bb', '#effff8'],
      ['#9bffd2', '#57e39f', '#f7fff7'],
      ['#83ffd9', '#3fd0b8', '#dcfffb'],
    ];

    const SHARD_FOOD_TINT_SETS = [
      ['#d9ffe8', '#98ffd4', '#ffffff'],
      ['#cbfff1', '#8ff0de', '#f3fffe'],
      ['#e0fff3', '#aaffcc', '#ffffff'],
    ];

    let bakedTentacleSuckerSprite = null;
    const bakedPlayerSpikeSprites = [];
    const bakedPlayerMandibleSprites = Object.create(null);
    const bakedPlayerFinSprites = Object.create(null);

    function getFoodSpriteRadius(radius, shard = false) {
      const step = shard ? 0.5 : 0.75;
      return Math.max(shard ? 2.5 : 4, Math.round(radius / step) * step);
    }

    function drawBakedFoodSprite(spriteCtx, radius, variant, tintSet, mobileLite = false) {
      const [fillColor, glowColor, highlightColor] = tintSet;
      const pad = Math.ceil(radius * (mobileLite ? 1.6 : 2.8));
      const size = radius * 2 + pad * 2;
      const c = size * 0.5;

      if (mobileLite) {
        spriteCtx.globalAlpha = 0.34;
        spriteCtx.fillStyle = glowColor;
        spriteCtx.beginPath();
        spriteCtx.arc(c, c, radius * 1.28, 0, Math.PI * 2);
        spriteCtx.fill();
      } else {
        spriteCtx.globalAlpha = 0.24;
        spriteCtx.fillStyle = glowColor;
        spriteCtx.beginPath();
        spriteCtx.arc(c, c, radius * 1.18, 0, Math.PI * 2);
        spriteCtx.fill();
      }

      spriteCtx.globalAlpha = 1;

      const bodyGradient = spriteCtx.createRadialGradient(
        c - radius * 0.28,
        c - radius * 0.32,
        radius * 0.2,
        c,
        c,
        radius * 1.2
      );
      bodyGradient.addColorStop(0, highlightColor);
      bodyGradient.addColorStop(0.45, fillColor);
      bodyGradient.addColorStop(1, glowColor);
      spriteCtx.fillStyle = bodyGradient;

      if (variant === 0) {
        spriteCtx.beginPath();
        spriteCtx.arc(c, c, radius, 0, Math.PI * 2);
        spriteCtx.fill();
      } else if (variant === 1) {
        spriteCtx.beginPath();
        spriteCtx.ellipse(c, c, radius * 1.08, radius * 0.86, 0.38, 0, Math.PI * 2);
        spriteCtx.fill();
      } else if (variant === 2) {
        const spikes = 6;
        spriteCtx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
          const a = (Math.PI / spikes) * i - Math.PI * 0.5;
          const r = i % 2 === 0 ? radius * 1.02 : radius * 0.66;
          const px = c + Math.cos(a) * r;
          const py = c + Math.sin(a) * r;
          if (i === 0) spriteCtx.moveTo(px, py);
          else spriteCtx.lineTo(px, py);
        }
        spriteCtx.closePath();
        spriteCtx.fill();
      } else {
        spriteCtx.beginPath();
        spriteCtx.moveTo(c, c - radius * 1.02);
        spriteCtx.quadraticCurveTo(c + radius * 0.94, c - radius * 0.5, c + radius * 0.76, c + radius * 0.34);
        spriteCtx.quadraticCurveTo(c, c + radius * 1.08, c - radius * 0.76, c + radius * 0.34);
        spriteCtx.quadraticCurveTo(c - radius * 0.94, c - radius * 0.5, c, c - radius * 1.02);
        spriteCtx.fill();
      }

      spriteCtx.strokeStyle = 'rgba(235,255,245,0.35)';
      spriteCtx.lineWidth = Math.max(0.8, radius * 0.14);
      spriteCtx.beginPath();
      spriteCtx.arc(c, c, radius * 0.78, -0.9, 0.9);
      spriteCtx.stroke();

      spriteCtx.fillStyle = 'rgba(255,255,255,0.82)';
      spriteCtx.beginPath();
      spriteCtx.arc(c - radius * 0.34, c - radius * 0.38, Math.max(1.2, radius * 0.24), 0, Math.PI * 2);
      spriteCtx.fill();

      spriteCtx.fillStyle = 'rgba(255,255,255,0.26)';
      spriteCtx.beginPath();
      spriteCtx.arc(c + radius * 0.2, c + radius * 0.16, Math.max(0.9, radius * 0.14), 0, Math.PI * 2);
      spriteCtx.fill();
    }

    function getBakedFoodSprite(radius, variant, tintIndex, shard = false) {
      const mobileLite = typeof hasTouchControls === 'function' && hasTouchControls();
      const spriteRadius = getFoodSpriteRadius(radius, shard);
      const tintSets = shard ? SHARD_FOOD_TINT_SETS : FOOD_TINT_SETS;
      const safeTintIndex = tintIndex % tintSets.length;
      const pad = Math.ceil(spriteRadius * (mobileLite ? 1.6 : 2.8));
      const size = spriteRadius * 2 + pad * 2;
      const key = `food-baked:${shard ? 1 : 0}:${mobileLite ? 1 : 0}:${variant}:${safeTintIndex}:${spriteRadius}`;
      const sprite = getCachedEffectSprite(key, size, size, (spriteCtx) => {
        drawBakedFoodSprite(spriteCtx, spriteRadius, variant, tintSets[safeTintIndex], mobileLite);
      });
      return { sprite, spriteRadius };
    }

    function getBakedDnaOrbSprite(radius) {
      const mobileLite = typeof hasTouchControls === 'function' && hasTouchControls();
      const spriteRadius = Math.max(5, Math.round(radius * 2) / 2);
      const pad = Math.ceil(spriteRadius * (mobileLite ? 1.8 : 3));
      const size = spriteRadius * 2 + pad * 2;
      const key = `dna-orb:${mobileLite ? 1 : 0}:${spriteRadius}`;
      const sprite = getCachedEffectSprite(key, size, size, (spriteCtx) => {
        const c = size * 0.5;
        if (mobileLite) {
          spriteCtx.globalAlpha = 0.35;
          spriteCtx.fillStyle = '#52d8ff';
          spriteCtx.beginPath();
          spriteCtx.arc(c, c, spriteRadius * 1.34, 0, Math.PI * 2);
          spriteCtx.fill();
        } else {
          spriteCtx.globalAlpha = 0.28;
          spriteCtx.fillStyle = '#52d8ff';
          spriteCtx.beginPath();
          spriteCtx.arc(c, c, spriteRadius * 1.22, 0, Math.PI * 2);
          spriteCtx.fill();
        }

        spriteCtx.globalAlpha = 1;
        spriteCtx.fillStyle = '#52d8ff';
        spriteCtx.beginPath();
        spriteCtx.arc(c, c, spriteRadius, 0, Math.PI * 2);
        spriteCtx.fill();

        spriteCtx.fillStyle = 'rgba(255,255,255,0.75)';
        spriteCtx.beginPath();
        spriteCtx.arc(c - 1.5, c - 1.5, spriteRadius * 0.35, 0, Math.PI * 2);
        spriteCtx.fill();
      });
      return { sprite, spriteRadius };
    }

    function getBakedTentacleSuckerSprite() {
      if (bakedTentacleSuckerSprite) return bakedTentacleSuckerSprite;
      const size = 24;
      const sprite = getCachedEffectSprite('player-tentacle-sucker:v1', size, size, (spriteCtx) => {
        const c = size * 0.5;
        spriteCtx.fillStyle = 'rgba(218,255,246,0.9)';
        spriteCtx.beginPath();
        spriteCtx.ellipse(c, c, 8.2, 5.7, 0, 0, Math.PI * 2);
        spriteCtx.fill();
        spriteCtx.strokeStyle = 'rgba(120,240,222,0.55)';
        spriteCtx.lineWidth = 1.4;
        spriteCtx.beginPath();
        spriteCtx.ellipse(c, c, 4.3, 2.7, 0, 0, Math.PI * 2);
        spriteCtx.stroke();
      });
      sprite.baseRadius = 7;
      bakedTentacleSuckerSprite = sprite;
      return bakedTentacleSuckerSprite;
    }

    function getBakedPlayerFinSprite(finIndex, phase, swimPower, mobileLite) {
      const frameCount = mobileLite ? 14 : 18;
      const phaseTurn = ((phase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const phaseFrame = Math.round(phaseTurn / (Math.PI * 2) * frameCount) % frameCount;
      const powerFrame = Math.round(clamp((swimPower - 0.72) / 0.83, 0, 1) * 3);
      const key = `${finIndex}:${phaseFrame}:${powerFrame}:${mobileLite ? 1 : 0}`;
      if (bakedPlayerFinSprites[key]) return bakedPlayerFinSprites[key];

      const baseRadius = 64;
      const bakedPhase = phaseFrame / frameCount * Math.PI * 2;
      const bakedPower = 0.72 + powerFrame / 3 * 0.83;
      const finLengthBase = baseRadius * (0.62 + bakedPower * 0.16);
      const finWidthBase = baseRadius * (0.34 + bakedPower * 0.08);
      const sweep = Math.sin(bakedPhase) * (0.42 + bakedPower * 0.28);
      const fanOpen = 0.95 + Math.cos(bakedPhase - 0.4) * 0.24 + bakedPower * 0.26;
      const trailing = Math.sin(bakedPhase - 0.7) * (0.24 + bakedPower * 0.08);
      const finLength = finLengthBase * (0.95 + finIndex * 0.13);
      const finWidth = finWidthBase * (0.96 + finIndex * 0.1) * fanOpen;
      const tipX = -finLength;
      const tipY = sweep * baseRadius * 0.78;
      const upperCtrlX = -finLength * 0.34;
      const upperCtrlY = -finWidth * (1.18 + trailing);
      const lowerCtrlX = -finLength * 0.48;
      const lowerCtrlY = finWidth * (1.24 - trailing * 0.45);
      const trailingX = baseRadius * (0.14 + finIndex * 0.03);
      let minY = Math.min(0, tipY, upperCtrlY, upperCtrlY * 0.96, lowerCtrlY, sweep * baseRadius * 0.28);
      let maxY = Math.max(0, tipY, upperCtrlY, upperCtrlY * 0.96, lowerCtrlY, sweep * baseRadius * 0.28);
      const ribCount = mobileLite ? 1 : 4;
      for (let rib = 1; rib <= ribCount; rib++) {
        const t = rib / 5;
        const startY = finWidth * (t - 0.5) * 0.2;
        const endY = finWidth * (t - 0.5) * 0.98 + sweep * baseRadius * 0.24;
        minY = Math.min(minY, startY, endY);
        maxY = Math.max(maxY, startY, endY);
      }
      const minX = Math.min(tipX, upperCtrlX, lowerCtrlX, -finLength * 0.72);
      const maxX = trailingX;
      const pad = 6;
      const width = Math.ceil(maxX - minX + pad * 2);
      const height = Math.ceil(maxY - minY + pad * 2);
      const originX = pad - minX;
      const originY = pad - minY;
      const sprite = createSpriteCanvas(width, height, (spriteCtx) => {
        spriteCtx.save();
        spriteCtx.translate(originX, originY);
        spriteCtx.fillStyle = 'rgba(98,242,219,0.64)';
        spriteCtx.beginPath();
        spriteCtx.moveTo(trailingX, 0);
        spriteCtx.quadraticCurveTo(-finLength * 0.12, upperCtrlY * 0.96, tipX, tipY);
        spriteCtx.quadraticCurveTo(-finLength * 0.72, finWidth * 0.08, -finLength * 0.14, finWidth * 0.24);
        spriteCtx.quadraticCurveTo(-finLength * 0.02, finWidth * 0.34, trailingX, 0);
        spriteCtx.closePath();
        spriteCtx.fill();
        spriteCtx.strokeStyle = 'rgba(235,255,250,0.92)';
        spriteCtx.lineWidth = Math.max(1.4, baseRadius * 0.032);
        spriteCtx.stroke();

        spriteCtx.fillStyle = 'rgba(230,255,248,0.28)';
        spriteCtx.beginPath();
        spriteCtx.moveTo(0, 0);
        spriteCtx.quadraticCurveTo(upperCtrlX, upperCtrlY, tipX, tipY);
        spriteCtx.quadraticCurveTo(lowerCtrlX, lowerCtrlY, 0, 0);
        spriteCtx.closePath();
        spriteCtx.fill();

        spriteCtx.strokeStyle = 'rgba(255,255,255,0.58)';
        spriteCtx.lineWidth = Math.max(1.1, baseRadius * 0.024);
        spriteCtx.beginPath();
        spriteCtx.moveTo(-baseRadius * 0.04, 0);
        spriteCtx.quadraticCurveTo(-finLength * 0.4, sweep * baseRadius * 0.28, tipX, tipY);
        spriteCtx.stroke();

        spriteCtx.strokeStyle = 'rgba(205,255,242,0.34)';
        spriteCtx.lineWidth = Math.max(0.9, baseRadius * 0.018);
        for (let rib = 1; rib <= ribCount; rib++) {
          const t = rib / 5;
          spriteCtx.beginPath();
          spriteCtx.moveTo(-finLength * 0.1, finWidth * (t - 0.5) * 0.2);
          spriteCtx.lineTo(
            -finLength * (0.26 + t * 0.48),
            finWidth * (t - 0.5) * 0.98 + sweep * baseRadius * 0.24
          );
          spriteCtx.stroke();
        }
        spriteCtx.restore();
      });
      sprite.originX = originX;
      sprite.originY = originY;
      sprite.baseRadius = baseRadius;
      bakedPlayerFinSprites[key] = sprite;
      return sprite;
    }

    function drawBakedPlayerSideFins(renderCtx, width, height, radius, legCycle, swimPower) {
      const mobileLite = isPlayerLowDetail();
      for (let side = -1; side <= 1; side += 2) {
        for (let finIndex = 0; finIndex < 2; finIndex++) {
          const phase = legCycle * 0.72 + finIndex * Math.PI * 0.52 + (side === 1 ? 0 : Math.PI * 0.55);
          const sprite = getBakedPlayerFinSprite(finIndex, phase, swimPower, mobileLite);
          const scale = radius / sprite.baseRadius;
          const rootX = finIndex === 0 ? -width * 0.2 : width * 0.26;
          const rootY = side * height * (0.64 + finIndex * 0.03);
          renderCtx.save();
          renderCtx.translate(rootX, rootY);
          renderCtx.scale(scale, scale * side);
          renderCtx.drawImage(sprite, -sprite.originX, -sprite.originY);
          renderCtx.restore();
        }
      }
    }

    function getBakedPlayerSpikeSprite(level, attackPulse = 0) {
      const safeLevel = Math.max(1, Math.min(8, level | 0));
      const attackStep = Math.round(clamp(attackPulse, 0, 1.25) * 4);
      const cacheKey = safeLevel * 8 + attackStep;
      if (bakedPlayerSpikeSprites[cacheKey]) return bakedPlayerSpikeSprites[cacheKey];

      const baseRadius = 64;
      const baseWidth = baseRadius * 1.04;
      const baseHeight = baseRadius * 0.9;
      const bakedAttackPulse = attackStep * 0.25;
      const spikeLength = baseRadius * (0.44 + safeLevel * 0.2) + bakedAttackPulse * 7.5;
      const spikeWidth = Math.max(baseRadius * 0.11, baseRadius * (0.09 + safeLevel * 0.014));
      const rootX = baseWidth * 0.4;
      const tipX = baseWidth * 0.72 + spikeLength;
      const mouthInset = baseHeight * 0.5;
      const maxY = baseHeight * 0.72 + spikeWidth * 1.6;
      const pad = 8;
      const width = Math.ceil(tipX + pad * 2);
      const height = Math.ceil(maxY * 2 + pad * 2);
      const originX = pad;
      const originY = pad + maxY;
      const sprite = getCachedEffectSprite(`player-spikes:v2:${safeLevel}:${attackStep}`, width, height, (spriteCtx) => {
        spriteCtx.save();
        spriteCtx.translate(originX, originY);
        for (let side = -1; side <= 1; side += 2) {
          const rootY = side * mouthInset;
          const curveLift = side * baseHeight * (0.32 + safeLevel * 0.03);
          const tipY = side * baseHeight * 0.72;
          const gradient = spriteCtx.createLinearGradient(rootX, rootY, tipX, tipY);
          gradient.addColorStop(0, 'rgba(90,255,230,0.22)');
          gradient.addColorStop(0.42, 'rgba(225,255,252,0.96)');
          gradient.addColorStop(1, 'rgba(255,255,255,1)');
          spriteCtx.fillStyle = gradient;
          spriteCtx.beginPath();
          spriteCtx.moveTo(rootX, rootY - spikeWidth);
          spriteCtx.quadraticCurveTo(baseWidth * 0.72, rootY - spikeWidth - curveLift * 0.52, tipX, tipY);
          spriteCtx.quadraticCurveTo(baseWidth * 0.72, rootY + spikeWidth - curveLift * 0.52, rootX, rootY + spikeWidth);
          spriteCtx.quadraticCurveTo(rootX - baseWidth * 0.1, rootY, rootX, rootY - spikeWidth);
          spriteCtx.closePath();
          spriteCtx.fill();
          spriteCtx.strokeStyle = 'rgba(120,255,240,0.68)';
          spriteCtx.lineWidth = Math.max(1.1, baseRadius * 0.028);
          spriteCtx.beginPath();
          spriteCtx.moveTo(rootX + baseWidth * 0.025, rootY);
          spriteCtx.quadraticCurveTo(baseWidth * 0.74, rootY - curveLift * 0.28, tipX - spikeLength * 0.1, tipY);
          spriteCtx.stroke();
        }
        spriteCtx.restore();
      });
      sprite.originX = originX;
      sprite.originY = originY;
      sprite.baseWidth = baseWidth;
      sprite.baseHeight = baseHeight;
      bakedPlayerSpikeSprites[cacheKey] = sprite;
      return bakedPlayerSpikeSprites[cacheKey];
    }

    function getBakedPlayerMandibleSprite(level, mouthOpen, attackPulse = 0, drawTeeth = true) {
      const safeLevel = Math.max(0, Math.min(8, level | 0));
      const openMin = 0.18;
      const openMax = 1.5;
      const openStep = Math.round(clamp((mouthOpen - openMin) / (openMax - openMin), 0, 1) * 12);
      const attackStep = Math.round(clamp(attackPulse, 0, 1.25) * 4);
      const mobileLite = isPlayerLowDetail();
      const cacheKey = `${safeLevel}:${openStep}:${attackStep}:${mobileLite ? 1 : 0}:${drawTeeth ? 1 : 0}`;
      if (bakedPlayerMandibleSprites[cacheKey]) return bakedPlayerMandibleSprites[cacheKey];

      const baseRadius = 64;
      const baseWidth = baseRadius * 1.04;
      const baseHeight = baseRadius * 0.9;
      const bakedMouthOpen = openMin + (openStep / 12) * (openMax - openMin);
      const bakedAttackPulse = attackStep * 0.25;
      const mandibleBaseX = baseWidth * 0.4;
      const mandibleRootBulge = baseWidth * (0.2 + safeLevel * 0.018);
      const mandibleTipX = baseWidth * (1.02 + safeLevel * 0.05) + bakedAttackPulse * baseRadius * 0.3;
      const mandibleSpread = baseHeight * (0.26 + bakedMouthOpen * 0.54);
      const clawLength = baseRadius * (0.34 + safeLevel * 0.07);
      const lowerY = -baseHeight * 0.05;
      const upperY = -mandibleSpread;
      const tipY = -mandibleSpread * 0.55;
      const xMin = mandibleBaseX - mandibleRootBulge * 0.32;
      const xMax = mandibleTipX + clawLength;
      const topExtent = mandibleSpread * 1.12 + baseRadius * 0.08;
      const bottomExtent = baseRadius * 0.24;
      const pad = 8;
      const width = Math.ceil(xMax - xMin + pad * 2);
      const height = Math.ceil(topExtent + bottomExtent + pad * 2);
      const originX = pad + mandibleBaseX - xMin;
      const originY = pad + topExtent;
      const sprite = getCachedEffectSprite(`player-mandible:v2:${cacheKey}`, width, height, (spriteCtx) => {
        spriteCtx.save();
        spriteCtx.translate(originX, originY);
        const tipLocalX = mandibleTipX - mandibleBaseX;
        const gradient = spriteCtx.createLinearGradient(0, 0, tipLocalX + clawLength, tipY);
        gradient.addColorStop(0, 'rgba(70,255,215,0.28)');
        gradient.addColorStop(0.45, 'rgba(215,255,245,0.96)');
        gradient.addColorStop(1, 'rgba(255,250,245,0.98)');
        spriteCtx.fillStyle = gradient;
        spriteCtx.beginPath();
        spriteCtx.moveTo(-mandibleRootBulge * 0.28, lowerY - baseRadius * 0.06);
        spriteCtx.quadraticCurveTo(baseWidth * 0.08, upperY * 0.34, mandibleRootBulge * 0.65, upperY * 0.98);
        spriteCtx.quadraticCurveTo(baseWidth * 0.4, upperY * 1.02, tipLocalX, tipY);
        spriteCtx.quadraticCurveTo(tipLocalX + clawLength, tipY - baseRadius * 0.1, tipLocalX + clawLength * 0.94, tipY + baseRadius * 0.15);
        spriteCtx.quadraticCurveTo(baseWidth * 0.5, lowerY + baseRadius * 0.08, mandibleRootBulge * 0.24, lowerY + baseRadius * 0.13);
        spriteCtx.quadraticCurveTo(baseWidth * 0.08, lowerY * 0.68, -mandibleRootBulge * 0.28, lowerY - baseRadius * 0.06);
        spriteCtx.closePath();
        spriteCtx.fill();

        spriteCtx.fillStyle = 'rgba(10,42,36,0.42)';
        spriteCtx.beginPath();
        spriteCtx.moveTo(baseWidth * 0.1, lowerY * 0.98);
        spriteCtx.quadraticCurveTo(baseWidth * 0.38, upperY * 0.86, tipLocalX - baseRadius * 0.06, tipY * 0.96);
        spriteCtx.quadraticCurveTo(baseWidth * 0.42, lowerY * 0.88, baseWidth * 0.1, lowerY * 0.98);
        spriteCtx.closePath();
        spriteCtx.fill();

        spriteCtx.strokeStyle = 'rgba(245,255,250,0.82)';
        spriteCtx.lineWidth = 1.35;
        spriteCtx.beginPath();
        spriteCtx.moveTo(tipLocalX - baseRadius * 0.05, tipY);
        spriteCtx.lineTo(tipLocalX + clawLength * 0.84, tipY + baseRadius * 0.12);
        spriteCtx.stroke();

        if (drawTeeth) {
          const toothCount = mobileLite
            ? Math.min(3, 2 + Math.floor(safeLevel * 0.5))
            : 3 + safeLevel;
          spriteCtx.strokeStyle = 'rgba(225,255,248,0.72)';
          spriteCtx.lineWidth = 1.05;
          for (let i = 0; i < toothCount; i++) {
            const t = toothCount === 1 ? 0 : i / (toothCount - 1);
            const px = tipLocalX * (0.1 + t * 0.78);
            const py = lowerY + (tipY - lowerY) * (0.13 + t * 0.76);
            spriteCtx.beginPath();
            spriteCtx.moveTo(px, py);
            spriteCtx.lineTo(px + baseRadius * 0.08, py + baseRadius * 0.09);
            spriteCtx.stroke();
          }
        }
        spriteCtx.restore();
      });
      sprite.originX = originX;
      sprite.originY = originY;
      sprite.baseWidth = baseWidth;
      sprite.baseHeight = baseHeight;
      bakedPlayerMandibleSprites[cacheKey] = sprite;
      return bakedPlayerMandibleSprites[cacheKey];
    }

    function getBakedPlayerBodySprite() {
      const baseRx = 72;
      const baseRy = 54;
      const padX = 34;
      const padY = 30;
      const width = baseRx * 2 + padX * 2;
      const height = baseRy * 2 + padY * 2;
      const originX = width * 0.5;
      const originY = height * 0.5;
      const sprite = getCachedEffectSprite('player-body-mobile:v2', width, height, (spriteCtx) => {
        spriteCtx.save();
        spriteCtx.translate(originX, originY);

        const aura = spriteCtx.createRadialGradient(
          -baseRx * 0.18,
          -baseRy * 0.18,
          baseRx * 0.16,
          0,
          0,
          baseRx * 1.22
        );
        aura.addColorStop(0, 'rgba(210,255,244,0.48)');
        aura.addColorStop(0.62, 'rgba(82,236,203,0.18)');
        aura.addColorStop(1, 'rgba(28,126,116,0)');
        spriteCtx.fillStyle = aura;
        spriteCtx.beginPath();
        spriteCtx.ellipse(0, 0, baseRx * 1.16, baseRy * 1.14, 0, 0, Math.PI * 2);
        spriteCtx.fill();

        const bodyGradient = spriteCtx.createRadialGradient(
          -baseRx * 0.28,
          -baseRy * 0.36,
          baseRx * 0.1,
          0,
          0,
          baseRx * 1.08
        );
        bodyGradient.addColorStop(0, '#f4fffb');
        bodyGradient.addColorStop(0.34, '#98ffe4');
        bodyGradient.addColorStop(0.72, '#39d5bf');
        bodyGradient.addColorStop(1, '#167e78');
        spriteCtx.fillStyle = bodyGradient;
        spriteCtx.beginPath();
        spriteCtx.ellipse(0, 0, baseRx, baseRy, 0, 0, Math.PI * 2);
        spriteCtx.fill();

        spriteCtx.fillStyle = 'rgba(255,255,255,0.15)';
        spriteCtx.beginPath();
        spriteCtx.ellipse(-baseRx * 0.16, -baseRy * 0.02, baseRx * 0.34, baseRy * 0.38, -0.18, 0, Math.PI * 2);
        spriteCtx.fill();

        spriteCtx.fillStyle = 'rgba(16, 70, 64, 0.18)';
        spriteCtx.beginPath();
        spriteCtx.ellipse(baseRx * 0.14, baseRy * 0.2, baseRx * 0.24, baseRy * 0.18, 0.42, 0, Math.PI * 2);
        spriteCtx.fill();

        spriteCtx.fillStyle = 'rgba(237,255,249,0.58)';
        spriteCtx.beginPath();
        spriteCtx.ellipse(-baseRx * 0.26, -baseRy * 0.34, baseRx * 0.34, baseRy * 0.2, -0.16, 0, Math.PI * 2);
        spriteCtx.fill();

        spriteCtx.fillStyle = 'rgba(255,255,255,0.2)';
        for (let i = 0; i < 9; i++) {
          const a = i * 1.74 + 0.45;
          const rx = baseRx * (0.1 + (i % 4) * 0.07);
          const px = Math.cos(a) * baseRx * 0.48 + Math.sin(i * 2.1) * baseRx * 0.08;
          const py = Math.sin(a * 1.13) * baseRy * 0.38;
          spriteCtx.beginPath();
          spriteCtx.arc(px, py, Math.max(1.8, rx * 0.16), 0, Math.PI * 2);
          spriteCtx.fill();
        }

        spriteCtx.strokeStyle = 'rgba(235,255,250,0.38)';
        spriteCtx.lineWidth = 2.2;
        spriteCtx.beginPath();
        spriteCtx.ellipse(0, 0, baseRx * 0.98, baseRy * 0.98, 0, -0.25, Math.PI * 1.2);
        spriteCtx.stroke();

        spriteCtx.strokeStyle = 'rgba(24, 98, 90, 0.28)';
        spriteCtx.lineWidth = 2.6;
        spriteCtx.beginPath();
        spriteCtx.ellipse(0, 0, baseRx * 1.02, baseRy * 1.02, 0, Math.PI * 0.14, Math.PI * 1.7);
        spriteCtx.stroke();

        spriteCtx.restore();
      });
      sprite.originX = originX;
      sprite.originY = originY;
      sprite.baseRx = baseRx;
      sprite.baseRy = baseRy;
      return sprite;
    }
