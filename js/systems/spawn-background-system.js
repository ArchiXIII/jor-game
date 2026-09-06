let ambientParticles = [];
    let backgroundGlows = [];
    let backgroundBubbles = [];
    let backgroundBlooms = [];
    let backgroundLightingSprite = null;
    let backgroundLightingKey = '';
    let distantBackgroundLayer = null;
    let distantBackgroundLayerKey = '';
    let distantBackgroundRoundSeed = 0;
    let deepBackgroundCreature = null;
    let deepBackgroundCreatureCooldown = 0;
    let deepWhaleFrames = null;
    let deepWhaleFramesKey = '';
    let deepSquidFrames = null;
    let deepSquidFramesKey = '';
    let deepSerpentFrames = null;
    let deepSerpentFramesKey = '';
    let deepBackgroundNextType = 'whale';
    let deepBackgroundLastType = '';
    let deepBackgroundWarmupToken = 0;
    const DEEP_BACKGROUND_CREATURE_WEIGHTS = {
      whale: 45,
      squid: 35,
      serpent: 20,
    };
    const DEEP_BACKGROUND_DELAY_MIN_FRAMES = 70 * 60;
    const DEEP_BACKGROUND_DELAY_RANGE_FRAMES = 130 * 60;
    const BACKGROUND_EFFECT_LIMITS = {
      TOTAL_MAX: 80,
      AMBIENT_MAX: 48,
      GLOW_MAX: 8,
      BUBBLE_MAX: 20,
      BLOOM_MAX: 5,
    };

    function getGameplayBackgroundPalette() {
      if (
        typeof App !== 'object' ||
        !App ||
        !App.hasStarted ||
        App.startScreenVisible
      ) {
        return GAMEPLAY_BACKGROUND_DEFAULT_PALETTE;
      }
      if (App.gameMode === 'endless' || App.gameMode === 'tutorial') {
        return GAMEPLAY_BACKGROUND_ENDLESS_PALETTE;
      }
      if (App.gameMode !== 'campaign') return GAMEPLAY_BACKGROUND_DEFAULT_PALETTE;
      const level = Math.max(1, Math.floor(Number(App.campaignLevel) || 1));
      const chapterIndex = Math.min(
        GAMEPLAY_BACKGROUND_CHAPTER_PALETTES.length - 1,
        Math.floor((level - 1) / 10)
      );
      return GAMEPLAY_BACKGROUND_CHAPTER_PALETTES[chapterIndex] || GAMEPLAY_BACKGROUND_DEFAULT_PALETTE;
    }

    function releaseDeepWhaleFrames() {
      if (!deepWhaleFrames) return;
      for (let i = 0; i < deepWhaleFrames.length; i++) {
        deepWhaleFrames[i].width = 1;
        deepWhaleFrames[i].height = 1;
      }
      deepWhaleFrames = null;
    }

    function releaseDeepSquidFrames() {
      if (!deepSquidFrames) return;
      for (let i = 0; i < deepSquidFrames.length; i++) {
        deepSquidFrames[i].width = 1;
        deepSquidFrames[i].height = 1;
      }
      deepSquidFrames = null;
    }

    function releaseDeepSerpentFrames() {
      if (!deepSerpentFrames) return;
      for (let i = 0; i < deepSerpentFrames.length; i++) {
        deepSerpentFrames[i].width = 1;
        deepSerpentFrames[i].height = 1;
      }
      deepSerpentFrames = null;
    }

    function getDeepWhaleFrames(palette) {
      const touch = typeof hasTouchControls === 'function' && hasTouchControls();
      const key = `${palette.id}:${touch ? 1 : 0}`;
      if (deepWhaleFrames && deepWhaleFramesKey === key) return deepWhaleFrames;
      releaseDeepWhaleFrames();
      deepWhaleFramesKey = key;
      const width = touch ? 346 : 520;
      const height = touch ? 200 : 300;
      const scaleX = width / 520;
      const scaleY = height / 300;
      deepWhaleFrames = [];

      const frameCount = 8;
      for (let frame = 0; frame < frameCount; frame++) {
        const phase = frame / frameCount * Math.PI * 2;
        const sprite = createSpriteCanvas(width, height, (spriteCtx) => {
          spriteCtx.save();
          spriteCtx.scale(scaleX, scaleY);
          const centerY = 150;
          const bodyBend = Math.sin(phase) * 12;
          const middleBend = Math.sin(phase - 0.85) * 5;
          const tailSpread = Math.sin(phase + Math.PI * 0.5) * 5;
          const silhouetteGradient = spriteCtx.createLinearGradient(8, 72, 505, 228);
          silhouetteGradient.addColorStop(0, palette.edge);
          silhouetteGradient.addColorStop(0.72, palette.depth);
          silhouetteGradient.addColorStop(1, palette.base);
          spriteCtx.fillStyle = silhouetteGradient;
          spriteCtx.save();
          spriteCtx.translate(0, bodyBend);
          spriteCtx.beginPath();
          spriteCtx.moveTo(130, 142);
          spriteCtx.bezierCurveTo(100, 139, 80, 120, 60, 103 - tailSpread);
          spriteCtx.bezierCurveTo(42, 88 - tailSpread, 25, 87 - tailSpread, 15, 98 - tailSpread);
          spriteCtx.bezierCurveTo(30, 122, 55, 140, 84, 148);
          spriteCtx.bezierCurveTo(72, 148, 62, 149, 56, centerY);
          spriteCtx.bezierCurveTo(62, 151, 72, 152, 84, 152);
          spriteCtx.bezierCurveTo(55, 160, 30, 178, 15, 202 + tailSpread);
          spriteCtx.bezierCurveTo(25, 213 + tailSpread, 42, 212 + tailSpread, 60, 197 + tailSpread);
          spriteCtx.bezierCurveTo(80, 180, 100, 161, 130, 158);
          spriteCtx.closePath();
          spriteCtx.fill();
          spriteCtx.restore();

          const finBend = Math.sin(phase - 0.7) * 5;
          for (let side = -1; side <= 1; side += 2) {
            spriteCtx.save();
            spriteCtx.translate(0, centerY);
            spriteCtx.scale(1, side);
            spriteCtx.beginPath();
            spriteCtx.moveTo(390, 67);
            spriteCtx.bezierCurveTo(360, 72, 325, 88, 290, 103 + finBend);
            spriteCtx.bezierCurveTo(272, 111 + finBend, 256, 112 + finBend, 248, 104 + finBend);
            spriteCtx.bezierCurveTo(267, 82, 295, 66, 330, 58);
            spriteCtx.bezierCurveTo(355, 57, 378, 61, 390, 67);
            spriteCtx.closePath();
            spriteCtx.fill();
            spriteCtx.restore();
          }

          spriteCtx.beginPath();
          spriteCtx.moveTo(76, centerY + bodyBend);
          spriteCtx.bezierCurveTo(116, 145 + bodyBend * 0.82, 145, 133 + middleBend, 181, 113 + middleBend);
          spriteCtx.bezierCurveTo(242, 79 + middleBend * 0.55, 326, 64, 414, 73);
          spriteCtx.bezierCurveTo(461, 78, 491, 103, 504, 132);
          spriteCtx.bezierCurveTo(509, 143, 509, 157, 504, 168);
          spriteCtx.bezierCurveTo(491, 197, 461, 222, 414, 227);
          spriteCtx.bezierCurveTo(326, 236, 242, 221 + middleBend * 0.55, 181, 187 + middleBend);
          spriteCtx.bezierCurveTo(145, 167 + middleBend, 116, 155 + bodyBend * 0.82, 76, centerY + bodyBend);
          spriteCtx.closePath();
          spriteCtx.fill();
          spriteCtx.restore();
        });
        deepWhaleFrames.push(sprite);
      }
      return deepWhaleFrames;
    }

    function getDeepSquidFrames(palette) {
      const touch = typeof hasTouchControls === 'function' && hasTouchControls();
      const key = `${palette.id}:${touch ? 1 : 0}`;
      if (deepSquidFrames && deepSquidFramesKey === key) return deepSquidFrames;
      releaseDeepSquidFrames();
      deepSquidFramesKey = key;
      const width = touch ? 346 : 520;
      const height = touch ? 200 : 300;
      const scaleX = width / 520;
      const scaleY = height / 300;
      const arms = [
        [20, -55, 82, -48, 148, -33, 16],
        [36, -31, 102, -28, 160, -20, 19],
        [54, -13, 112, -10, 168, -8, 21],
        [48, 14, 108, 13, 166, 9, 21],
        [31, 35, 94, 31, 157, 22, 18],
        [13, 59, 76, 51, 146, 35, 15],
      ];
      deepSquidFrames = [];

      const frameCount = 8;
      for (let frame = 0; frame < frameCount; frame++) {
        const phase = frame / frameCount * Math.PI * 2;
        const sprite = createSpriteCanvas(width, height, (spriteCtx) => {
          spriteCtx.save();
          spriteCtx.scale(scaleX, scaleY);
          const centerY = 150;
          const pulse = Math.sin(phase) * 6;
          const finWave = Math.sin(phase - 0.6) * 5;
          const silhouetteGradient = spriteCtx.createLinearGradient(12, 70, 508, 230);
          silhouetteGradient.addColorStop(0, palette.edge);
          silhouetteGradient.addColorStop(0.72, palette.depth);
          silhouetteGradient.addColorStop(1, palette.base);
          spriteCtx.fillStyle = silhouetteGradient;
          spriteCtx.strokeStyle = silhouetteGradient;
          spriteCtx.lineCap = 'round';

          for (let i = 0; i < arms.length; i++) {
            const arm = arms[i];
            const wave = Math.sin(phase + i * 0.83) * (8 + i * 0.7);
            spriteCtx.lineWidth = arm[6];
            spriteCtx.beginPath();
            spriteCtx.moveTo(244, centerY + arm[5] * 0.25);
            spriteCtx.bezierCurveTo(
              arm[4], centerY + arm[5] + wave * 0.35,
              arm[2], centerY + arm[3] - wave * 0.45,
              arm[0], centerY + arm[1] + wave
            );
            spriteCtx.stroke();
          }

          for (let side = -1; side <= 1; side += 2) {
            const longWave = Math.sin(phase + side * 1.25) * 12;
            spriteCtx.lineWidth = 10;
            spriteCtx.beginPath();
            spriteCtx.moveTo(236, centerY + side * 20);
            spriteCtx.bezierCurveTo(
              170, centerY + side * 48,
              91, centerY + side * (74 + longWave * 0.35),
              10, centerY + side * (66 + longWave)
            );
            spriteCtx.stroke();
            spriteCtx.beginPath();
            spriteCtx.ellipse(12, centerY + side * (66 + longWave), 14, 7, side * 0.28, 0, Math.PI * 2);
            spriteCtx.fill();
          }

          for (let side = -1; side <= 1; side += 2) {
            spriteCtx.save();
            spriteCtx.translate(0, centerY);
            spriteCtx.scale(1, side);
            spriteCtx.beginPath();
            spriteCtx.moveTo(390, 65);
            spriteCtx.bezierCurveTo(426, 58, 466, 36 + finWave, 497, 28 + finWave);
            spriteCtx.bezierCurveTo(489, 68, 470, 104, 434, 126);
            spriteCtx.bezierCurveTo(414, 110, 400, 88, 390, 65);
            spriteCtx.closePath();
            spriteCtx.fill();
            spriteCtx.restore();
          }

          spriteCtx.beginPath();
          spriteCtx.moveTo(228, centerY);
          spriteCtx.bezierCurveTo(259, 111 - pulse * 0.35, 305, 82 - pulse, 366, 72 - pulse);
          spriteCtx.bezierCurveTo(424, 62 - pulse, 476, 91, 506, 143);
          spriteCtx.quadraticCurveTo(511, centerY, 506, 157);
          spriteCtx.bezierCurveTo(476, 209, 424, 238 + pulse, 366, 228 + pulse);
          spriteCtx.bezierCurveTo(305, 218 + pulse, 259, 189 + pulse * 0.35, 228, centerY);
          spriteCtx.closePath();
          spriteCtx.fill();

          spriteCtx.beginPath();
          spriteCtx.ellipse(235, centerY, 50 + pulse * 0.25, 40 - pulse * 0.18, 0, 0, Math.PI * 2);
          spriteCtx.fill();
          spriteCtx.restore();
        });
        deepSquidFrames.push(sprite);
      }
      return deepSquidFrames;
    }

    function getDeepSerpentFrames(palette) {
      const touch = typeof hasTouchControls === 'function' && hasTouchControls();
      const key = `${palette.id}:${touch ? 1 : 0}`;
      if (deepSerpentFrames && deepSerpentFramesKey === key) return deepSerpentFrames;
      releaseDeepSerpentFrames();
      deepSerpentFramesKey = key;
      const width = touch ? 414 : 620;
      const height = touch ? 174 : 260;
      const scaleX = width / 620;
      const scaleY = height / 260;
      deepSerpentFrames = [];

      const frameCount = 12;
      const pointCount = 40;
      const waveTurns = Math.PI * 2.35;
      for (let frame = 0; frame < frameCount; frame++) {
        const phase = frame / frameCount * Math.PI * 2;
        const sprite = createSpriteCanvas(width, height, (spriteCtx) => {
          spriteCtx.save();
          spriteCtx.scale(scaleX, scaleY);
          const centerY = 130;
          const silhouetteGradient = spriteCtx.createLinearGradient(12, 88, 610, 172);
          silhouetteGradient.addColorStop(0, palette.edge);
          silhouetteGradient.addColorStop(0.76, palette.depth);
          silhouetteGradient.addColorStop(1, palette.base);
          spriteCtx.fillStyle = silhouetteGradient;
          const upper = new Array(pointCount);
          const lower = new Array(pointCount);

          for (let i = 0; i < pointCount; i++) {
            const t = i / (pointCount - 1);
            const theta = t * waveTurns - phase;
            const envelope = 1 - t * 0.72;
            const x = 16 + t * 472;
            const center = centerY + Math.sin(theta) * 26 * envelope;
            const derivativeY = Math.cos(theta) * waveTurns * 26 * envelope - Math.sin(theta) * 18.72;
            const normalLength = Math.hypot(472, derivativeY);
            const normalX = -derivativeY / normalLength;
            const normalY = 472 / normalLength;
            const radius = 3 + 32 * Math.pow(t, 0.72);
            upper[i] = [x + normalX * radius, center + normalY * radius];
            lower[i] = [x - normalX * radius, center - normalY * radius];
          }

          spriteCtx.beginPath();
          spriteCtx.moveTo(upper[0][0], upper[0][1]);
          for (let i = 1; i < pointCount; i++) spriteCtx.lineTo(upper[i][0], upper[i][1]);
          for (let i = pointCount - 1; i >= 0; i--) spriteCtx.lineTo(lower[i][0], lower[i][1]);
          spriteCtx.closePath();
          spriteCtx.fill();

          const headY = centerY + Math.sin(waveTurns - phase) * 7.28;
          spriteCtx.beginPath();
          spriteCtx.moveTo(456, headY);
          spriteCtx.bezierCurveTo(480, headY - 39, 530, headY - 48, 578, headY - 30);
          spriteCtx.bezierCurveTo(600, headY - 22, 610, headY - 10, 610, headY);
          spriteCtx.bezierCurveTo(610, headY + 10, 600, headY + 22, 578, headY + 30);
          spriteCtx.bezierCurveTo(530, headY + 48, 480, headY + 39, 456, headY);
          spriteCtx.closePath();
          spriteCtx.fill();
          spriteCtx.restore();
        });
        deepSerpentFrames.push(sprite);
      }
      return deepSerpentFrames;
    }

    function chooseDeepBackgroundCreatureType() {
      const roll = Math.random();
      if (deepBackgroundLastType === 'whale') return roll < 2 / 3 ? 'squid' : 'serpent';
      if (deepBackgroundLastType === 'squid') return roll < 6 / 7 ? 'whale' : 'serpent';
      if (deepBackgroundLastType === 'serpent') return roll < 0.75 ? 'whale' : 'squid';
      if (roll < DEEP_BACKGROUND_CREATURE_WEIGHTS.whale / 100) return 'whale';
      if (roll < (DEEP_BACKGROUND_CREATURE_WEIGHTS.whale + DEEP_BACKGROUND_CREATURE_WEIGHTS.squid) / 100) return 'squid';
      return 'serpent';
    }

    function getDeepBackgroundCreatureFrames(type, palette) {
      if (type === 'squid') return getDeepSquidFrames(palette);
      if (type === 'serpent') return getDeepSerpentFrames(palette);
      return getDeepWhaleFrames(palette);
    }

    function prepareDeepBackgroundCreatureFrames(type, palette) {
      const warmupToken = ++deepBackgroundWarmupToken;
      if (type !== 'whale') releaseDeepWhaleFrames();
      if (type !== 'squid') releaseDeepSquidFrames();
      if (type !== 'serpent') releaseDeepSerpentFrames();
      if (typeof scheduleRenderWarmupTask === 'function') {
        scheduleRenderWarmupTask(() => {
          if (warmupToken === deepBackgroundWarmupToken) getDeepBackgroundCreatureFrames(type, palette);
        });
      }
    }

    function resetDeepBackgroundCreature() {
      deepBackgroundCreature = null;
      deepBackgroundNextType = chooseDeepBackgroundCreatureType();
      deepBackgroundCreatureCooldown = DEEP_BACKGROUND_DELAY_MIN_FRAMES +
        Math.floor(Math.random() * DEEP_BACKGROUND_DELAY_RANGE_FRAMES);
    }

    function spawnDeepBackgroundCreature(type, minScale, scaleRange, minDuration, durationRange) {
      const zoom = camera.zoom || 1;
      const viewWidth = canvas.width / zoom;
      const viewHeight = canvas.height / zoom;
      const duration = minDuration + Math.floor(Math.random() * durationRange);
      const width = viewWidth * (minScale + Math.random() * scaleRange);
      const margin = width * 0.46;
      const angle = Math.random() * Math.PI * 2;
      const directionX = Math.cos(angle);
      const directionY = Math.sin(angle);
      const normalX = -directionY;
      const normalY = directionX;
      const halfViewWidth = viewWidth * 0.5;
      const halfViewHeight = viewHeight * 0.5;
      const edgeDistance = Math.min(
        halfViewWidth / Math.max(0.001, Math.abs(directionX)),
        halfViewHeight / Math.max(0.001, Math.abs(directionY))
      );
      const pathOffset = (Math.random() - 0.5) * Math.min(viewWidth, viewHeight) * 0.32;
      const pathCenterX = camera.x + halfViewWidth + normalX * pathOffset;
      const pathCenterY = camera.y + halfViewHeight + normalY * pathOffset;
      const pathRadius = edgeDistance + margin;
      const speed = pathRadius * 2 / duration;
      deepBackgroundCreature = {
        type,
        duration,
        age: 0,
        hasEnteredView: false,
        x: pathCenterX - directionX * pathRadius,
        y: pathCenterY - directionY * pathRadius,
        width,
        velocityX: directionX * speed,
        velocityY: directionY * speed,
        normalX,
        normalY,
        angle,
        waveAmplitude: viewHeight * 0.02,
        alpha: 0.14 + Math.random() * 0.055,
        phase: Math.random() * Math.PI * 2,
        animationOffset: Math.random() * 8,
      };
      deepBackgroundLastType = type;
    }

    function spawnDeepBackgroundWhale() {
      spawnDeepBackgroundCreature('whale', 1.05, 0.55, 1500, 600);
    }

    function spawnDeepBackgroundSquid() {
      spawnDeepBackgroundCreature('squid', 0.88, 0.42, 1200, 600);
    }

    function spawnDeepBackgroundSerpent() {
      spawnDeepBackgroundCreature('serpent', 1.15, 0.5, 1050, 450);
    }

    function spawnNextDeepBackgroundCreature() {
      if (deepBackgroundNextType === 'squid') {
        spawnDeepBackgroundSquid();
      } else if (deepBackgroundNextType === 'serpent') {
        spawnDeepBackgroundSerpent();
      } else {
        spawnDeepBackgroundWhale();
      }
    }

    function updateDeepBackgroundCreature() {
      if (deepBackgroundCreature) {
        const creature = deepBackgroundCreature;
        creature.age += 1;
        creature.x += creature.velocityX;
        creature.y += creature.velocityY;
        const zoom = camera.zoom || 1;
        const screenX = (creature.x - camera.x) * zoom;
        const screenY = (creature.y - camera.y) * zoom;
        const screenRadius = (creature.width * 0.58 + creature.waveAmplitude) * zoom;
        const intersectsView = screenX + screenRadius >= 0 &&
          screenX - screenRadius <= canvas.width &&
          screenY + screenRadius >= 0 &&
          screenY - screenRadius <= canvas.height;
        if (intersectsView) {
          creature.hasEnteredView = true;
        } else if (creature.hasEnteredView) {
          deepBackgroundCreature = null;
          deepBackgroundCreatureCooldown = DEEP_BACKGROUND_DELAY_MIN_FRAMES +
            Math.floor(Math.random() * DEEP_BACKGROUND_DELAY_RANGE_FRAMES);
          deepBackgroundNextType = chooseDeepBackgroundCreatureType();
          prepareDeepBackgroundCreatureFrames(deepBackgroundNextType, getGameplayBackgroundPalette());
        }
        return;
      }
      deepBackgroundCreatureCooldown -= 1;
      if (deepBackgroundCreatureCooldown <= 0) spawnNextDeepBackgroundCreature();
    }

    function drawDeepBackgroundCreature(palette) {
      if (!deepBackgroundCreature) return;
      const creature = deepBackgroundCreature;
      const isSquid = creature.type === 'squid';
      const isSerpent = creature.type === 'serpent';
      const frames = getDeepBackgroundCreatureFrames(creature.type, palette);
      const animationRate = isSquid ? 0.04 : isSerpent ? 0.064 : 0.032;
      const framePosition = (creature.age * animationRate + creature.animationOffset) % frames.length;
      const frameIndex = Math.floor(framePosition);
      const frameBlend = framePosition - frameIndex;
      const sprite = frames[frameIndex];
      const nextSprite = frames[(frameIndex + 1) % frames.length];
      const zoom = camera.zoom || 1;
      const renderWidth = creature.width * zoom;
      const renderHeight = renderWidth * sprite.height / sprite.width;
      const wave = Math.sin(creature.age * 0.008 + creature.phase) * creature.waveAmplitude;
      const x = (creature.x + creature.normalX * wave - camera.x) * zoom;
      const y = (creature.y + creature.normalY * wave - camera.y) * zoom;
      ctx.save();
      ctx.translate(x, y);
      const sway = isSquid
        ? Math.sin(creature.age * 0.014 + creature.phase) * 0.018
        : isSerpent
          ? Math.sin(creature.age * 0.011 + creature.phase) * 0.026
          : 0;
      ctx.rotate(creature.angle + sway);
      ctx.globalAlpha = creature.alpha * (1 - frameBlend);
      ctx.drawImage(sprite, -renderWidth * 0.5, -renderHeight * 0.5, renderWidth, renderHeight);
      ctx.globalAlpha = creature.alpha * frameBlend;
      ctx.drawImage(nextSprite, -renderWidth * 0.5, -renderHeight * 0.5, renderWidth, renderHeight);
      ctx.restore();
    }

    function getBackgroundLightingSprite(width, height) {
      const touch = typeof hasTouchControls === 'function' && hasTouchControls();
      const palette = getGameplayBackgroundPalette();
      const maxSide = touch ? 512 : 768;
      const scale = Math.min(1, maxSide / Math.max(width, height));
      const spriteWidth = Math.max(1, Math.round(width * scale));
      const spriteHeight = Math.max(1, Math.round(height * scale));
      const key = `${width}:${height}:${touch ? 1 : 0}:${palette.id}`;
      if (backgroundLightingSprite && backgroundLightingKey === key) return backgroundLightingSprite;

      backgroundLightingKey = key;
      backgroundLightingSprite = createSpriteCanvas(spriteWidth, spriteHeight, (spriteCtx, w, h) => {
        const centerX = w * 0.5;
        const centerY = h * 0.5;
        const viewMax = Math.max(w, h);
        const innerRadius = Math.max(18, Math.min(w, h) * 0.12);

        spriteCtx.fillStyle = palette.base;
        spriteCtx.fillRect(0, 0, w, h);

        const mainLight = spriteCtx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, viewMax * 1.02);
        mainLight.addColorStop(0, palette.center);
        mainLight.addColorStop(0.28, palette.middle);
        mainLight.addColorStop(0.62, palette.depth);
        mainLight.addColorStop(1, palette.edge);
        spriteCtx.fillStyle = mainLight;
        spriteCtx.fillRect(0, 0, w, h);

        const upperLight = spriteCtx.createLinearGradient(0, 0, 0, h);
        upperLight.addColorStop(0, palette.upperLight);
        upperLight.addColorStop(0.34, palette.accentA);
        upperLight.addColorStop(1, 'rgba(0, 0, 0, 0)');
        spriteCtx.fillStyle = upperLight;
        spriteCtx.fillRect(0, 0, w, h);

        const bioLightX = centerX - w * 0.12;
        const bioLightY = centerY - h * 0.08;
        const bioLight = spriteCtx.createRadialGradient(bioLightX, bioLightY, 0, bioLightX, bioLightY, viewMax * 0.7);
        bioLight.addColorStop(0, palette.accentA);
        bioLight.addColorStop(0.42, palette.accentB);
        bioLight.addColorStop(1, 'rgba(0, 0, 0, 0)');
        spriteCtx.fillStyle = bioLight;
        spriteCtx.fillRect(0, 0, w, h);

        const magicLightX = centerX + w * 0.18;
        const magicLightY = centerY + h * 0.03;
        const magicLight = spriteCtx.createRadialGradient(magicLightX, magicLightY, 0, magicLightX, magicLightY, viewMax * 0.58);
        magicLight.addColorStop(0, palette.accentB);
        magicLight.addColorStop(0.36, palette.accentA);
        magicLight.addColorStop(1, 'rgba(0, 0, 0, 0)');
        spriteCtx.fillStyle = magicLight;
        spriteCtx.fillRect(0, 0, w, h);
      });

      return backgroundLightingSprite;
    }

    function createBackgroundRandom(seed) {
      let state = seed >>> 0;
      return () => {
        state += 0x6D2B79F5;
        let value = state;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
      };
    }

    function getBackgroundPaletteSeed(palette) {
      let seed = 2166136261;
      const id = palette.id || 'default';
      for (let i = 0; i < id.length; i++) {
        seed ^= id.charCodeAt(i);
        seed = Math.imul(seed, 16777619);
      }
      return seed >>> 0;
    }

    function createSoftOrganismSprite(random, palette, size, intensity, detailed) {
      const hueCount = palette.glowHues.length;
      const hueRoll = random();
      const hueShift = hueRoll < 0.5 ? 0 : hueRoll < 0.78 ? 52 : -58;
      const baseHue = (palette.glowHues[Math.floor(random() * hueCount)] + hueShift + 360) % 360;
      const creatureType = random() < (detailed ? 0.22 : 0.12) ? 1 + Math.floor(random() * 3) : 0;
      return createSpriteCanvas(size, size, (spriteCtx, w, h) => {
        const centerX = w * 0.5;
        const centerY = h * 0.5;
        const radius = Math.min(w, h) * 0.5;
        spriteCtx.save();
        spriteCtx.translate(centerX, centerY);
        spriteCtx.rotate(random() * Math.PI * 2);
        if (creatureType === 1) spriteCtx.scale(1.08, 0.82);
        else if (creatureType === 2) spriteCtx.scale(1.25, 0.78);
        spriteCtx.translate(-centerX, -centerY);

        spriteCtx.strokeStyle = `hsla(${baseHue}, 72%, 62%, ${intensity * 0.38})`;
        spriteCtx.lineCap = 'round';
        if (creatureType === 1) {
          spriteCtx.lineWidth = Math.max(1, radius * 0.075);
          for (let i = -1; i <= 1; i++) {
            const startX = centerX + i * radius * 0.18;
            spriteCtx.beginPath();
            spriteCtx.moveTo(startX, centerY + radius * 0.12);
            spriteCtx.bezierCurveTo(
              startX + i * radius * 0.07,
              centerY + radius * 0.3,
              startX - i * radius * 0.1,
              centerY + radius * 0.5,
              startX + i * radius * 0.04,
              centerY + radius * 0.7
            );
            spriteCtx.stroke();
          }
        } else if (creatureType === 2) {
          for (let pass = 0; pass < 2; pass++) {
            spriteCtx.lineWidth = Math.max(1, radius * (pass === 0 ? 0.12 : 0.045));
            spriteCtx.globalAlpha = pass === 0 ? 0.58 : 0.8;
            spriteCtx.beginPath();
            spriteCtx.moveTo(centerX + radius * 0.24, centerY);
            spriteCtx.bezierCurveTo(
              centerX + radius * 0.4,
              centerY - radius * 0.08,
              centerX + radius * 0.52,
              centerY + radius * 0.16,
              centerX + radius * 0.72,
              centerY + radius * 0.04
            );
            spriteCtx.stroke();
          }
          spriteCtx.globalAlpha = 1;
        } else if (creatureType === 3) {
          spriteCtx.lineWidth = Math.max(1, radius * 0.065);
          const rayCount = 5 + Math.floor(random() * 3);
          for (let i = 0; i < rayCount; i++) {
            const angle = (i / rayCount) * Math.PI * 2 + (random() - 0.5) * 0.18;
            spriteCtx.beginPath();
            spriteCtx.moveTo(centerX + Math.cos(angle) * radius * 0.28, centerY + Math.sin(angle) * radius * 0.28);
            spriteCtx.lineTo(centerX + Math.cos(angle) * radius * 0.7, centerY + Math.sin(angle) * radius * 0.7);
            spriteCtx.stroke();
          }
        }

        const lobeCount = creatureType ? 4 + Math.floor(random() * 3) : detailed ? 6 + Math.floor(random() * 3) : 4 + Math.floor(random() * 3);
        for (let i = 0; i < lobeCount; i++) {
          const angle = random() * Math.PI * 2;
          const distance = radius * (0.035 + random() * (creatureType ? 0.07 : 0.1));
          const lobeX = centerX + Math.cos(angle) * distance;
          const lobeY = centerY + Math.sin(angle) * distance;
          const lobeRadius = radius * (creatureType ? 0.34 + random() * 0.16 : 0.38 + random() * 0.2);
          const hue = baseHue + Math.round((random() - 0.5) * 28);
          const gradient = spriteCtx.createRadialGradient(lobeX, lobeY, 0, lobeX, lobeY, lobeRadius);
          gradient.addColorStop(0, `hsla(${hue}, 76%, 66%, ${intensity})`);
          gradient.addColorStop(0.52, `hsla(${hue}, 70%, 58%, ${intensity * 0.52})`);
          gradient.addColorStop(1, `hsla(${hue}, 64%, 48%, 0)`);
          spriteCtx.fillStyle = gradient;
          spriteCtx.beginPath();
          spriteCtx.ellipse(lobeX, lobeY, lobeRadius, lobeRadius * (0.62 + random() * 0.45), angle, 0, Math.PI * 2);
          spriteCtx.fill();
        }

        const nucleusX = centerX + radius * (random() - 0.5) * 0.2;
        const nucleusY = centerY + radius * (random() - 0.5) * 0.2;
        const nucleusRadius = radius * (0.22 + random() * 0.12);
        const nucleusHue = palette.glowHues[Math.floor(random() * hueCount)];
        const nucleus = spriteCtx.createRadialGradient(nucleusX, nucleusY, 0, nucleusX, nucleusY, nucleusRadius);
        nucleus.addColorStop(0, `hsla(${nucleusHue}, 82%, 72%, ${intensity * 0.75})`);
        nucleus.addColorStop(1, `hsla(${nucleusHue}, 70%, 54%, 0)`);
        spriteCtx.fillStyle = nucleus;
        spriteCtx.beginPath();
        spriteCtx.arc(nucleusX, nucleusY, nucleusRadius, 0, Math.PI * 2);
        spriteCtx.fill();
        spriteCtx.restore();
      });
    }

    function drawWrappedBackgroundSprite(spriteCtx, sprite, x, y, size, width, height) {
      const halfSize = size * 0.5;
      for (let row = -1; row <= 1; row++) {
        for (let column = -1; column <= 1; column++) {
          spriteCtx.drawImage(sprite, x + column * width - halfSize, y + row * height - halfSize, size, size);
        }
      }
    }

    function createOrganismBackgroundTile(width, height, palette, seed, count, distant) {
      return createSpriteCanvas(width, height, (spriteCtx, w, h) => {
        const random = createBackgroundRandom(seed);
        const minSide = Math.min(w, h);
        for (let i = 0; i < count; i++) {
          const size = minSide * (distant ? 0.42 + random() * 0.3 : 0.25 + random() * 0.2);
          const spriteSize = Math.max(48, Math.round(size));
          const intensity = (distant ? 0.085 + random() * 0.035 : 0.105 + random() * 0.045) * 0.765;
          const sprite = createSoftOrganismSprite(random, palette, spriteSize, intensity, !distant);
          drawWrappedBackgroundSprite(spriteCtx, sprite, random() * w, random() * h, size, w, h);
          sprite.width = 1;
          sprite.height = 1;
        }
      });
    }

    function createBackgroundPattern(tile, width, height) {
      const pattern = ctx.createPattern(tile, 'repeat');
      if (!pattern || typeof pattern.setTransform !== 'function' || typeof DOMMatrix !== 'function') return null;
      pattern.setTransform(new DOMMatrix([width / tile.width, 0, 0, height / tile.height, 0, 0]));
      return pattern;
    }

    function releaseDistantBackgroundLayer() {
      if (!distantBackgroundLayer) return;
      distantBackgroundLayer.far.tile.width = 1;
      distantBackgroundLayer.far.tile.height = 1;
      distantBackgroundLayer.middle.tile.width = 1;
      distantBackgroundLayer.middle.tile.height = 1;
      distantBackgroundLayer = null;
    }

    function getDistantBackgroundLayer(width, height, palette) {
      const touch = typeof hasTouchControls === 'function' && hasTouchControls();
      const farWidth = Math.max(1900, Math.min(2800, Math.round(width * 2)));
      const farHeight = Math.max(1300, Math.min(2000, Math.round(height * 2)));
      const middleWidth = Math.max(1500, Math.min(2200, Math.round(width * 1.5)));
      const middleHeight = Math.max(1000, Math.min(1500, Math.round(height * 1.5)));
      const farScale = touch ? 0.27 : 1;
      const middleScale = touch ? 0.34 : 1;
      const key = `${farWidth}:${farHeight}:${middleWidth}:${middleHeight}:${touch ? 1 : 0}:${palette.id}:${distantBackgroundRoundSeed}`;
      if (distantBackgroundLayer && distantBackgroundLayerKey === key) return distantBackgroundLayer;

      const seed = getBackgroundPaletteSeed(palette) ^ distantBackgroundRoundSeed;
      const spotDensity = 0.85;
      releaseDistantBackgroundLayer();
      const farTile = createOrganismBackgroundTile(
        Math.max(1, Math.round(farWidth * farScale)),
        Math.max(1, Math.round(farHeight * farScale)),
        palette,
        seed,
        Math.max(4, Math.round(7 * spotDensity)),
        true
      );
      const middleTile = createOrganismBackgroundTile(
        Math.max(1, Math.round(middleWidth * middleScale)),
        Math.max(1, Math.round(middleHeight * middleScale)),
        palette,
        seed ^ 0x9E3779B9,
        Math.max(5, Math.round(9 * spotDensity)),
        false
      );
      distantBackgroundLayerKey = key;
      distantBackgroundLayer = {
        far: {
          width: farWidth,
          height: farHeight,
          tile: farTile,
          pattern: createBackgroundPattern(farTile, farWidth, farHeight),
        },
        middle: {
          width: middleWidth,
          height: middleHeight,
          tile: middleTile,
          pattern: createBackgroundPattern(middleTile, middleWidth, middleHeight),
        },
      };
      return distantBackgroundLayer;
    }

    function drawTiledBackgroundLayer(layer, offsetX, offsetY) {
      if (layer.pattern) {
        ctx.save();
        ctx.translate(-offsetX, -offsetY);
        ctx.fillStyle = layer.pattern;
        ctx.fillRect(offsetX, offsetY, canvas.width, canvas.height);
        ctx.restore();
        return;
      }
      const firstColumn = Math.floor(offsetX / layer.width);
      const firstRow = Math.floor(offsetY / layer.height);
      const lastColumn = Math.floor((offsetX + canvas.width) / layer.width);
      const lastRow = Math.floor((offsetY + canvas.height) / layer.height);

      for (let row = firstRow; row <= lastRow; row++) {
        const y = Math.round(row * layer.height - offsetY);
        const nextY = Math.round((row + 1) * layer.height - offsetY);
        for (let column = firstColumn; column <= lastColumn; column++) {
          const x = Math.round(column * layer.width - offsetX);
          const nextX = Math.round((column + 1) * layer.width - offsetX);
          ctx.drawImage(layer.tile, x, y, nextX - x, nextY - y);
        }
      }
    }

    function drawDistantBackgroundLayer(palette) {
      const layer = getDistantBackgroundLayer(canvas.width, canvas.height, palette);
      const smoothing = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = true;
      drawTiledBackgroundLayer(layer.far, camera.x * 0.088, camera.y * 0.06);
      drawDeepBackgroundCreature(palette);
      drawTiledBackgroundLayer(layer.middle, camera.x * 0.28, camera.y * 0.192);
      ctx.imageSmoothingEnabled = smoothing;
    }

function createAmbientParticleAt(x, y) {
      return new Particle(
        x,
        y,
        randomRange(1.5, 3.5),
        `rgba(${70 + Math.floor(Math.random() * 60)}, ${150 + Math.floor(Math.random() * 95)}, ${185 + Math.floor(Math.random() * 70)}, 1)`,
        randomRange(0.2, 0.62)
      );
    }

    function createFoodAt(x, y, deferSprite = true) {
      const food = new Food({ deferSprite });
      food.x = x;
      food.y = y;
      return food;
    }

    function createDnaOrbAt(x, y, deferSprite = true) {
      const orb = new DNAOrb(x, y, endlessMode ? ENDLESS_CONFIG.ENDLESS_DNA_RADIUS : undefined, { deferSprite });
      orb.pulse = Math.random() * Math.PI * 2;
      return orb;
    }

    function createTomatoFoodAt(x, y, deferSprite = true) {
      return new TomatoFood(x, y, { deferSprite, radius: endlessMode ? 14 : 12 });
    }

    function createEnemyAt(x, y, sizeFactor = 1) {
      const enemy = createEnemy(sizeFactor);
      enemy.x = x;
      enemy.y = y;
      return typeof tuneEnemyForEndless === 'function' ? tuneEnemyForEndless(enemy) : enemy;
    }

    function createBackgroundGlowAt(x, y) {
      return new BackgroundGlow(x, y, getGameplayBackgroundPalette());
    }

    function createBackgroundBubbleAt(x, y) {
      return new BackgroundBubble(x, y);
    }

    function createBackgroundBloomAt(x, y) {
      return new BackgroundBloom(x, y);
    }

    function setupAmbient() {
      distantBackgroundRoundSeed = (Math.random() * 4294967296) >>> 0;
      releaseDistantBackgroundLayer();
      resetDeepBackgroundCreature();
      ambientParticles = [];
      backgroundGlows = [];
      backgroundBubbles = [];
      backgroundBlooms = [];
      const bounds = getViewBounds(WORLD_CONFIG.SPAWN_MARGIN + 220);
      const effectTargets = getBackgroundEffectTargets();
      const palette = getGameplayBackgroundPalette();
      const spotDensity = 0.85;

      for (let i = 0; i < effectTargets.ambient; i++) {
        ambientParticles.push(createAmbientParticleAt(
          randomRange(bounds.left, bounds.right),
          randomRange(bounds.top, bounds.bottom)
        ));
      }

      for (let i = 0, count = Math.round(effectTargets.glow * spotDensity); i < count; i++) {
        backgroundGlows.push(createBackgroundGlowAt(
          randomRange(bounds.left, bounds.right),
          randomRange(bounds.top, bounds.bottom)
        ));
      }

      for (let i = 0; i < effectTargets.bubble; i++) {
        backgroundBubbles.push(createBackgroundBubbleAt(
          randomRange(bounds.left, bounds.right),
          randomRange(bounds.top, bounds.bottom)
        ));
      }

      for (let i = 0, count = Math.round(effectTargets.bloom * spotDensity); i < count; i++) {
        backgroundBlooms.push(createBackgroundBloomAt(
          randomRange(bounds.left, bounds.right),
          randomRange(bounds.top, bounds.bottom)
        ));
      }
    }

    function seedInitialEntities() {
      const initialBounds = getViewBounds(WORLD_CONFIG.INITIAL_FILL_MARGIN);

      for (let i = 0; i < getTargetFoodCount(); i++) {
        const spawn = randomWorldPosition(24, initialBounds);
        foods.push(createFoodAt(spawn.x, spawn.y));
      }

      for (let i = 0; i < getInitialEnemyCount(); i++) {
        const spawn = randomWorldPositionAwayFrom(player, 220, 30, 20, initialBounds);
        enemies.push(createEnemyAt(spawn.x, spawn.y, 1));
      }

      for (let i = 0; i < getTargetDnaCount(); i++) {
        const spawn = randomWorldPosition(40, initialBounds);
        dnaOrbs.push(createDnaOrbAt(spawn.x, spawn.y));
      }
    }

    function warmFoodSprite(food) {
      if (!food || food.sprite) return;
      food.sprite = food.createSprite();
    }

    function warmDnaOrbSprite(orb) {
      if (!orb || orb.sprite) return;
      orb.sprite = orb.createSprite();
    }

    function warmTomatoFoodSprite(tomato) {
      if (!tomato || tomato.sprite) return;
      tomato.sprite = tomato.createSprite();
    }

    function warmEnemyBodySprite(enemy) {
      if (!enemy || typeof enemy.getCachedBodySprite !== 'function') return;
      if (enemy instanceof ShieldEnemy) {
        enemy.getCachedBodySprite(
          enemy.hasShield
            ? ENEMY_SHIELD_FILL_COLORS
            : ENEMY_SHIELD_BROKEN_FILL_COLORS,
          ENEMY_SHIELD_EYE_COLOR
        );
        return;
      }
      enemy.getCachedBodySprite(
        ENEMY_BASIC_FILL_COLORS,
        ENEMY_BASIC_EYE_COLOR
      );
    }

    function scheduleRoundRenderWarmup() {
      if (typeof clearRenderWarmupQueue === 'function') clearRenderWarmupQueue();
      if (typeof scheduleRenderWarmupTask !== 'function') return;
      prepareDeepBackgroundCreatureFrames(deepBackgroundNextType, getGameplayBackgroundPalette());

      scheduleRenderWarmupTask(() => {
        if (typeof getBakedPlayerBodySprite === 'function') getBakedPlayerBodySprite();
      });

      for (const enemy of enemies) {
        scheduleRenderWarmupTask(() => warmEnemyBodySprite(enemy), true);
      }

      for (const orb of dnaOrbs) {
        scheduleRenderWarmupTask(() => warmDnaOrbSprite(orb));
      }

      for (const tomato of tomatoFoods) {
        scheduleRenderWarmupTask(() => warmTomatoFoodSprite(tomato));
      }

      for (const food of foods) {
        scheduleRenderWarmupTask(() => warmFoodSprite(food));
      }
    }

    function cullStreamedEntities() {
      const despawnBounds = getViewBounds(WORLD_CONFIG.DESPAWN_MARGIN);

      let writeFood = 0;
      for (let i = 0; i < foods.length; i++) {
        const food = foods[i];
        if (food.life !== undefined && food.life <= 0) continue;
        if (isOutsideBounds(food, despawnBounds, food.radius + 24)) continue;
        foods[writeFood++] = food;
      }
      foods.length = writeFood;

      let writeOrb = 0;
      for (let i = 0; i < dnaOrbs.length; i++) {
        const orb = dnaOrbs[i];
        if (isOutsideBounds(orb, despawnBounds, orb.radius + 20)) continue;
        dnaOrbs[writeOrb++] = orb;
      }
      dnaOrbs.length = writeOrb;

      let writeTomato = 0;
      for (let i = 0; i < tomatoFoods.length; i++) {
        const tomato = tomatoFoods[i];
        if (isOutsideBounds(tomato, despawnBounds, tomato.radius + 28)) continue;
        tomatoFoods[writeTomato++] = tomato;
      }
      tomatoFoods.length = writeTomato;

      let writeEnemy = 0;
      for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        if (isOutsideBounds(enemy, despawnBounds, enemy.radius + 90)) continue;
        enemies[writeEnemy++] = enemy;
      }
      enemies.length = writeEnemy;
    }

    function isEntityFarOutsideView(entity, margin = 120) {
      const bounds = getViewBounds(margin);
      return entity.x < bounds.left || entity.x > bounds.right || entity.y < bounds.top || entity.y > bounds.bottom;
    }

    function softTrimBackgroundList(list, target, paddingGetter) {
      if (list.length <= target) return;

      const bounds = getViewBounds(140);
      for (let i = list.length - 1; i >= 0 && list.length > target; i--) {
        const entity = list[i];
        if (!isOutsideBounds(entity, bounds, paddingGetter(entity))) continue;
        list[i] = list[list.length - 1];
        list.pop();
      }

      if (list.length > target && simulationFrame % 90 === 0) {
        list.pop();
      }
    }

    function refillAmbientParticles() {
      const effectTargets = getBackgroundEffectTargets();
      const particleTarget = effectTargets.ambient;
      const glowTarget = effectTargets.glow;
      const bubbleTarget = effectTargets.bubble;
      const bloomTarget = effectTargets.bloom;
      const bounds = getViewBounds(WORLD_CONFIG.SPAWN_MARGIN + 220);

      while (ambientParticles.length < particleTarget) {
        ambientParticles.push(createAmbientParticleAt(
          randomRange(bounds.left, bounds.right),
          randomRange(bounds.top, bounds.bottom)
        ));
      }

      while (backgroundGlows.length < glowTarget) {
        backgroundGlows.push(createBackgroundGlowAt(
          randomRange(bounds.left, bounds.right),
          randomRange(bounds.top, bounds.bottom)
        ));
      }

      while (backgroundBubbles.length < bubbleTarget) {
        backgroundBubbles.push(createBackgroundBubbleAt(
          randomRange(bounds.left, bounds.right),
          randomRange(bounds.top, bounds.bottom)
        ));
      }

      while (backgroundBlooms.length < bloomTarget) {
        backgroundBlooms.push(createBackgroundBloomAt(
          randomRange(bounds.left, bounds.right),
          randomRange(bounds.top, bounds.bottom)
        ));
      }

      softTrimBackgroundList(ambientParticles, particleTarget, particle => particle.radius + 30);
      softTrimBackgroundList(backgroundGlows, glowTarget, glow => Math.max(glow.radiusX, glow.radiusY) + 80);
      softTrimBackgroundList(backgroundBubbles, bubbleTarget, bubble => bubble.radius + 60);
      softTrimBackgroundList(backgroundBlooms, bloomTarget, bloom => bloom.radius + 90);
    }

    function spawnStreamFood(amount) {
      let remaining = amount;
      while (remaining > 0) {
        const clusterSize = Math.min(remaining, 3 + Math.floor(Math.random() * 5));
        const center = randomOffscreenWorldPosition({
          padding: 24,
          minDistanceFromPlayer: WORLD_CONFIG.SAFE_PLAYER_RADIUS,
        });
        for (let i = 0; i < clusterSize; i++) {
          const angle = Math.random() * Math.PI * 2;
          const offset = Math.random() * 80;
          const food = createFoodAt(
            center.x + Math.cos(angle) * offset,
            center.y + Math.sin(angle) * offset
          );
          foods.push(food);
          if (typeof scheduleRenderWarmupTask === 'function') {
            scheduleRenderWarmupTask(() => warmFoodSprite(food));
          }
        }
        remaining -= clusterSize;
      }
    }

    function spawnStreamDna(amount = 1) {
      for (let i = 0; i < amount; i++) {
        const spawn = randomOffscreenWorldPosition({
          padding: 40,
          minDistanceFromPlayer: WORLD_CONFIG.SAFE_PLAYER_RADIUS + 40,
        });
        const orb = createDnaOrbAt(spawn.x, spawn.y);
        dnaOrbs.push(orb);
        if (typeof scheduleRenderWarmupTask === 'function') {
          scheduleRenderWarmupTask(() => warmDnaOrbSprite(orb));
        }
      }
    }

    function spawnStreamEnemy(sizeFactor = 1) {
      const spawn = randomOffscreenWorldPosition({
        padding: 32,
        minDistanceFromPlayer: WORLD_CONFIG.SAFE_PLAYER_RADIUS + 40,
      });
      const enemy = createEnemyAt(spawn.x, spawn.y, sizeFactor);
      enemies.push(enemy);
      if (typeof scheduleRenderWarmupTask === 'function') {
        scheduleRenderWarmupTask(() => warmEnemyBodySprite(enemy), true);
      }
    }

function drawBackground() {
      const palette = getGameplayBackgroundPalette();
      const lightingSprite = getBackgroundLightingSprite(canvas.width, canvas.height);
      const smoothing = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(lightingSprite, 0, 0, canvas.width, canvas.height);
      drawDistantBackgroundLayer(palette);
      ctx.imageSmoothingEnabled = smoothing;

      const visibleBounds = getViewBounds(0);
      const zoom = camera.zoom || 1;

      ctx.save();
      ctx.scale(zoom, zoom);
      ctx.translate(-camera.x, -camera.y);

      for (const glow of backgroundGlows) {
        if (isOutsideBounds(glow, visibleBounds, Math.max(glow.radiusX ?? 0, glow.radiusY ?? 0) + 80)) continue;
        glow.draw();
      }

      for (const bloom of backgroundBlooms) {
        if (isOutsideBounds(bloom, visibleBounds, bloom.radius + 90)) continue;
        bloom.draw();
      }

      for (const bubble of backgroundBubbles) {
        if (isOutsideBounds(bubble, visibleBounds, bubble.radius + 60)) continue;
        bubble.draw();
      }

      for (const particle of ambientParticles) {
        if (isOutsideBounds(particle, visibleBounds, particle.radius + 30)) continue;
        particle.draw();
      }

      ctx.restore();
    }
