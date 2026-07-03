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
