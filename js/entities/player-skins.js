(function () {
  'use strict';

  const SKINS = {
    default: {
      id: 'default',
      body: '#71ffd8',
      belly: 'rgba(255,255,255,0.12)',
      fin: '#46f0d7',
      fin2: '#1f9e93',
      eye: 'rgba(255,255,255,0.98)',
      pupil: '#12564e',
      eyeOutline: 'rgba(12,101,88,0.55)',
      eyeHighlight: 'rgba(239,255,250,0.9)',
      mouth: '#064958',
      pattern: 'pearl',
      eyeStyle: 'gentle',
      finStyle: 'base',
      hasTail: false
    },
    jor_char_shellback: {
      id: 'jor_char_shellback',
      body: '#9ef0c6',
      belly: '#e9fff1',
      fin: '#5fd09f',
      fin2: '#2c997a',
      eye: '#d8ffe4',
      pupil: '#0a4b3a',
      mouth: '#135944',
      pattern: 'shell',
      eyeStyle: 'calm',
      finStyle: 'armored',
      hasTail: false
    },
    jor_char_swifttail: {
      id: 'jor_char_swifttail',
      body: '#7af2ff',
      belly: '#e9ffff',
      fin: '#47d8ff',
      fin2: '#1d9fd4',
      eye: '#fff3a8',
      pupil: '#075776',
      mouth: '#05546a',
      pattern: 'speed',
      eyeStyle: 'alert',
      finStyle: 'swift',
      hasTail: true
    },
    jor_char_glutton: {
      id: 'jor_char_glutton',
      body: '#b5ff87',
      belly: '#f3ffe7',
      fin: '#79df61',
      fin2: '#4fae48',
      eye: '#fafff2',
      pupil: '#29460f',
      mouth: '#345e16',
      pattern: 'glutton',
      eyeStyle: 'round',
      finStyle: 'round',
      hasTail: false
    },
    jor_char_hunter: {
      id: 'jor_char_hunter',
      body: '#ff9f8e',
      belly: '#fff0e8',
      fin: '#ff6e62',
      fin2: '#b43b40',
      eye: '#2a0b12',
      pupil: '#ffcf45',
      mouth: '#6b1d22',
      pattern: 'hunter',
      eyeStyle: 'hunter',
      finStyle: 'sharp',
      hasTail: true
    },
    jor_char_abyssal: {
      id: 'jor_char_abyssal',
      body: '#7652c9',
      belly: '#c8b5ff',
      fin: '#2bd8c8',
      fin2: '#5d38a6',
      finMembrane: '#8567c9',
      eye: '#050409',
      pupil: '#ff334c',
      mouth: '#1b1242',
      pattern: 'abyss',
      eyeStyle: 'deep',
      finStyle: 'deep',
      hasTail: false
    },
    jor_char_goldfish: {
      id: 'jor_char_goldfish',
      body: '#ffd456',
      belly: '#fff2a6',
      fin: '#ffd875',
      fin2: '#d99118',
      eye: 'rgba(255,255,255,0.98)',
      pupil: '#0a4b3a',
      eyeOutline: 'rgba(126,72,12,0.55)',
      mouth: '#7a2f0a',
      pattern: 'goldfish',
      eyeStyle: 'calm',
      finStyle: 'swift',
      hasTail: true
    }
  };

  const FALLBACK = SKINS.default;
  const bodyEdges = Object.create(null);

  for (const skin of Object.values(SKINS)) {
    const color = parseInt(skin.body.slice(1), 16);
    const r = color >> 16;
    const g = (color >> 8) & 255;
    const b = color & 255;
    skin.bodyOutline = `rgb(${Math.round(r * 0.57)},${Math.round(g * 0.57)},${Math.round(b * 0.57)})`;
    skin.mouthSocket = `rgba(${Math.round(r * 0.28)},${Math.round(g * 0.28)},${Math.round(b * 0.28)},0.28)`;
  }

  function getSkin(id) {
    return SKINS[id] || FALLBACK;
  }

  function setupCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const cssW = Math.max(1, canvas.clientWidth || 112);
    const cssH = Math.max(1, canvas.clientHeight || 76);
    const pxW = Math.round(cssW * dpr);
    const pxH = Math.round(cssH * dpr);
    if (canvas.width !== pxW || canvas.height !== pxH) {
      canvas.width = pxW;
      canvas.height = pxH;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    return { ctx, cssW, cssH };
  }

  function getPreviewMetrics(cssW, cssH, time = 0) {
    const swimPhase = time * 0.006;
    const visualSwimPhase = swimPhase * PLAYER_SWIM_VISUAL_SPEED;
    const locomotion = Math.sin(visualSwimPhase);
    const cx = cssW * 0.52 + Math.sin(time * 0.003) * 2.2;
    const cy = cssH * 0.5 + Math.cos(time * 0.0034) * 1.6;
    const startRadius = (typeof GROWTH_CONFIG !== 'undefined' && GROWTH_CONFIG.START_RADIUS) || 14;
    const maxRadius = (typeof GROWTH_CONFIG !== 'undefined' && GROWTH_CONFIG.TARGET_MAX_RADIUS) || 64;
    const previewRadius = startRadius + (maxRadius - startRadius) * 0.5;
    const radius = Math.min(previewRadius, cssW * 0.27, cssH * 0.36);
    return {
      cx,
      cy,
      radius,
      width: radius * (1.04 + locomotion * 0.055),
      height: radius * (0.9 - locomotion * 0.045),
      rotation: Math.PI * 0.25 + locomotion * 0.035,
      swimPhase,
      locomotion,
      finWave: Math.sin(visualSwimPhase * 1.18 + 0.7)
    };
  }

  function drawPreviewContent(ctx, skinId, metrics, time = 0) {
    const skin = getSkin(skinId);
    const { cx, cy, radius: base, width, height, rotation, swimPhase, locomotion, finWave } = metrics;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);

    if (skin.hasTail) drawSpeedTail(ctx, skin, width, height, base, finWave);
    const finPower = Math.min(1.55, 0.55 + (0.35 + Math.abs(Math.sin(swimPhase * 0.9)) * 0.42) * 1.05);
    drawBakedPlayerSideFins(ctx, width, height, base, swimPhase, finPower, skin.id);
    drawBody(ctx, skin, width, height, base, time);
    drawPattern(ctx, skin, width, height, base);
    drawBodyEdge(ctx, skin, width, height, base);
    drawMouth(ctx, skin, width, height, base, locomotion);
    drawEyes(ctx, skin, width, height, base);

    ctx.restore();
  }

  function drawPreview(canvas, skinId, time = 0) {
    const setup = setupCanvas(canvas);
    if (!setup) return;
    const { ctx, cssW, cssH } = setup;
    drawPreviewContent(ctx, skinId, getPreviewMetrics(cssW, cssH, time), time);
  }

  function drawSpeedTail(ctx, skin, width, height, radius, wave) {
    const tailBaseX = -width * 0.86;
    const tailMidX = -width * 1.12;
    const tailTipX = -width * 1.34;
    const tailHalfHeight = height * 0.46;
    const swing = wave * radius * 0.18;
    ctx.save();

    ctx.globalAlpha = 0.68;
    ctx.fillStyle = skin.fin;
    ctx.beginPath();
    ctx.moveTo(tailBaseX, -height * 0.18);
    ctx.quadraticCurveTo(tailMidX, -tailHalfHeight + swing * 0.35, tailTipX, -tailHalfHeight * 0.42 + swing);
    ctx.quadraticCurveTo(tailMidX + width * 0.08, 0 + swing * 0.18, tailTipX, tailHalfHeight * 0.42 + swing);
    ctx.quadraticCurveTo(tailMidX, tailHalfHeight + swing * 0.35, tailBaseX, height * 0.18);
    ctx.quadraticCurveTo(-width * 0.96, 0, tailBaseX, -height * 0.18);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(238,255,255,0.62)';
    ctx.lineWidth = Math.max(1.1, radius * 0.035);
    ctx.stroke();

    ctx.restore();
  }

  function drawBodyBase(ctx, skin, width, height) {
    const gradient = ctx.createRadialGradient(-width * 0.25, -height * 0.35, width * 0.12, 0, 0, width * 1.1);
    if (skin.pattern === 'goldfish') {
      gradient.addColorStop(0, '#fff9c9');
      gradient.addColorStop(0.2, '#ffd456');
      gradient.addColorStop(0.62, '#e89b1e');
      gradient.addColorStop(1, '#8f4a0c');
    } else {
      gradient.addColorStop(0, '#f2fffb');
      gradient.addColorStop(0.18, skin.body);
      gradient.addColorStop(1, skin.fin2);
    }
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, width, height, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBody(ctx, skin, width, height, radius, time) {
    drawBodyBase(ctx, skin, width, height);
  }

  function drawBodyEdge(ctx, skin, width, height, radius, zoom = 1) {
    const screenRadius = Math.max(1, radius * zoom);
    const thickness = Math.max(0.8, Math.min(1.8, screenRadius * 0.04));
    const step = Math.max(3, Math.min(32, Math.round(thickness / screenRadius * 128)));
    const key = `${skin.id}:${step}`;
    let edge = bodyEdges[key];
    if (!edge) {
      const rx = 64 * 1.04;
      const ry = 64 * 0.9;
      const line = step / 128 * 64;
      edge = createSpriteCanvas(160, 144, (c) => {
        c.translate(80, 72);
        c.strokeStyle = skin.bodyOutline;
        c.globalAlpha = 0.62;
        c.lineWidth = line;
        c.beginPath();
        c.ellipse(0, 0, rx - line * 0.5, ry - line * 0.5, 0, 0, Math.PI * 2);
        c.stroke();
      });
      bodyEdges[key] = edge;
    }
    ctx.drawImage(edge, -80 * width / 66.56, -72 * height / 57.6, 160 * width / 66.56, 144 * height / 57.6);
  }

  function drawPattern(ctx, skin, width, height, radius) {
    const detailScale = Math.max(0.9, radius / 17);
    const patternScale = 1.296;
    const px = width * patternScale;
    const py = height * patternScale;
    const offsetX = 0;
    if (skin.pattern === 'pearl') {
      for (let side = -1; side <= 1; side += 2) {
        ctx.fillStyle = 'rgba(10,112,101,0.52)';
        ctx.beginPath();
        ctx.moveTo(-width * 0.7, side * height * 0.15);
        ctx.bezierCurveTo(-width * 0.48, side * height * 0.7, -width * 0.08, side * height * 0.77, width * 0.12, side * height * 0.45);
        ctx.bezierCurveTo(-width * 0.12, side * height * 0.5, -width * 0.38, side * height * 0.39, -width * 0.7, side * height * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(220,255,240,0.78)';
        ctx.beginPath();
        ctx.moveTo(-width * 0.61, side * height * 0.24);
        ctx.bezierCurveTo(-width * 0.38, side * height * 0.56, -width * 0.12, side * height * 0.64, width * 0.05, side * height * 0.49);
        ctx.bezierCurveTo(-width * 0.2, side * height * 0.54, -width * 0.4, side * height * 0.41, -width * 0.61, side * height * 0.24);
        ctx.closePath();
        ctx.fill();
      }
    } else if (skin.pattern === 'shell') {
      ctx.strokeStyle = 'rgba(5,48,39,0.42)';
      ctx.lineWidth = 1.55 * detailScale;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(offsetX - px * 0.112 + i * px * 0.252, -py * 0.504);
        ctx.quadraticCurveTo(offsetX - px * 0.14 + i * px * 0.196, 0, offsetX - px * 0.112 + i * px * 0.252, py * 0.504);
        ctx.stroke();
      }
    } else if (skin.pattern === 'speed') {
      ctx.strokeStyle = 'rgba(238,255,255,0.68)';
      ctx.lineWidth = Math.max(1.8, 1.95 * detailScale);
      ctx.lineCap = 'round';
      [-1, 1].forEach((side) => {
        ctx.beginPath();
        ctx.moveTo(offsetX - px * 0.644, side * py * 0.308);
        ctx.bezierCurveTo(
          offsetX - px * 0.308, side * py * 0.588,
          offsetX + px * 0.252, side * py * 0.504,
          offsetX + px * 0.588, side * py * 0.168
        );
        ctx.stroke();
      });
      ctx.strokeStyle = 'rgba(16,112,142,0.26)';
      ctx.lineWidth = Math.max(1.2, 1.28 * detailScale);
      ctx.beginPath();
      ctx.moveTo(offsetX - px * 0.476, 0);
      ctx.quadraticCurveTo(offsetX - px * 0.028, -py * 0.084, offsetX + px * 0.504, 0);
      ctx.stroke();
    } else if (skin.pattern === 'glutton') {
      ctx.fillStyle = 'rgba(52,105,30,0.3)';
      const spots = [
        [-0.38, -0.24, 3.45 * detailScale],
        [-0.22, 0.25, 4.0 * detailScale],
        [0.1, -0.14, 3.15 * detailScale]
      ];
      spots.forEach(([x, y, r]) => {
        ctx.beginPath();
        ctx.arc(offsetX + px * x, py * y, r, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (skin.pattern === 'hunter') {
      ctx.fillStyle = 'rgba(118,24,32,0.36)';
      ctx.beginPath();
      ctx.moveTo(offsetX - px * 0.588, -py * 0.476);
      ctx.lineTo(offsetX - px * 0.14, -py * 0.14);
      ctx.lineTo(offsetX - px * 0.42, py * 0.168);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(offsetX - px * 0.056, -py * 0.42);
      ctx.lineTo(offsetX + px * 0.35, -py * 0.084);
      ctx.lineTo(offsetX + px * 0.028, py * 0.28);
      ctx.closePath();
      ctx.fill();
    } else if (skin.pattern === 'goldfish') {
      ctx.lineCap = 'round';
      const drawScaleArc = (x, y, s, side) => {
        const cx = offsetX + px * x;
        const cy = py * y * side;
        const r = py * 0.2 * s;
        ctx.strokeStyle = 'rgba(116,62,10,0.18)';
        ctx.lineWidth = Math.max(0.8, 0.86 * detailScale);
        ctx.beginPath();
        ctx.arc(cx, cy + side * py * 0.018, r, Math.PI * (side > 0 ? 0.1 : 1.9), Math.PI * (side > 0 ? 0.9 : 1.1), side < 0);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,250,196,0.56)';
        ctx.lineWidth = Math.max(1, 1.0 * detailScale);
        ctx.beginPath();
        ctx.arc(cx, cy, r, Math.PI * (side > 0 ? 0.1 : 1.9), Math.PI * (side > 0 ? 0.9 : 1.1), side < 0);
        ctx.stroke();
      };
      [-1, 1].forEach((side) => {
        drawScaleArc(-0.3, 0.24, 0.9, side);
        drawScaleArc(0.03, 0.3, 0.78, side);
        drawScaleArc(-0.14, 0.12, 0.74, side);
        drawScaleArc(0.18, 0.17, 0.62, side);
      });
    } else if (skin.pattern === 'abyss') {
      ctx.strokeStyle = 'rgba(26,208,196,0.72)';
      ctx.lineWidth = Math.max(2, 2.15 * detailScale);
      ctx.lineCap = 'round';
      [-0.392, -0.056, 0.28].forEach((x, index) => {
        const segmentHeight = py * (0.42 - index * 0.049);
        ctx.beginPath();
        ctx.moveTo(offsetX + px * x, -segmentHeight);
        ctx.quadraticCurveTo(offsetX + px * (x + 0.14), 0, offsetX + px * x, segmentHeight);
        ctx.stroke();
      });
      ctx.strokeStyle = 'rgba(86,64,180,0.34)';
      ctx.lineWidth = Math.max(1.1, 1.15 * detailScale);
      ctx.beginPath();
      ctx.moveTo(offsetX - px * 0.56, -py * 0.308);
      ctx.quadraticCurveTo(offsetX - px * 0.14, -py * 0.504, offsetX + px * 0.336, -py * 0.28);
      ctx.stroke();
    }
  }
  function drawMouthCavity(ctx, skin, width, height, radius, mouthOpen) {
    ctx.fillStyle = skin.mouthSocket;
    ctx.beginPath();
    ctx.ellipse(width * 0.66, 0, Math.max(9, radius * 0.31), Math.max(4.5, radius * (0.19 + mouthOpen * 0.18)), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(5, 18, 20, 0.88)';
    ctx.beginPath();
    ctx.ellipse(width * 0.78, 0, Math.max(7.5, radius * 0.24), Math.max(3.4, radius * (0.14 + mouthOpen * 0.22)), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.globalAlpha *= 0.3;
    ctx.fillStyle = skin.mouth;
    ctx.beginPath();
    ctx.ellipse(width * 0.71, height * 0.035, Math.max(3.4, radius * 0.105), Math.max(1.5, radius * (0.055 + mouthOpen * 0.07)), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawMouth(ctx, skin, width, height, radius, locomotion) {
    const mouthOpen = 0.19 + Math.max(0, locomotion) * 0.018;
    const mandibleBaseX = width * 0.4;

    ctx.save();
    drawMouthCavity(ctx, skin, width, height, radius, mouthOpen);

    const mandibleSprite = getBakedPlayerMandibleSprite(0, mouthOpen, 0, false);
    const mandibleScaleX = width / mandibleSprite.baseWidth;
    const mandibleScaleY = height / mandibleSprite.baseHeight;
    for (let side = -1; side <= 1; side += 2) {
      ctx.save();
      ctx.translate(mandibleBaseX, 0);
      ctx.scale(mandibleScaleX, mandibleScaleY * side);
      ctx.drawImage(mandibleSprite, -mandibleSprite.originX, -mandibleSprite.originY);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawEyes(ctx, skin, width, height, radius) {
    const eyeX = width * 0.34;
    const eyeGap = height * 0.28;
    const style = skin.eyeStyle || 'round';
    const eyeScale = Math.max(0.85, radius / 18);
    const rawShape = {
      gentle: { rx: 4.9, ry: 3.3, tilt: -0.03, pupil: 1.7, pupilScaleY: 0.9 },
      calm: { rx: 4.8, ry: 2.7, tilt: -0.04, pupil: 1.25, pupilScaleY: 0.82 },
      alert: { rx: 5.4, ry: 2.25, tilt: 0, pupil: 1.22, pupilScaleY: 0.72 },
      round: { rx: 5.0, ry: 4.25, tilt: 0, pupil: 1.85, pupilScaleY: 1 },
      hunter: { rx: 5.5, ry: 1.95, tilt: 0, pupil: 1.08, pupilScaleY: 0.55 },
      deep: { rx: 5.7, ry: 2.55, tilt: -0.16, pupil: 1.22, pupilScaleY: 0.62 }
    }[style] || { rx: 4.2, ry: 3.25, tilt: 0, pupil: 1.55, pupilScaleY: 1 };
    const shape = {
      rx: rawShape.rx * eyeScale,
      ry: rawShape.ry * eyeScale,
      tilt: rawShape.tilt,
      pupil: rawShape.pupil * eyeScale,
      pupilScaleY: rawShape.pupilScaleY
    };

    [-1, 1].forEach((side) => {
      ctx.save();
      ctx.translate(eyeX, eyeGap * side);
      ctx.rotate(shape.tilt * side);
      ctx.beginPath();
      ctx.ellipse(0, 0, shape.rx, shape.ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = skin.eye;
      ctx.fill();
      if (skin.eyeOutline) {
        ctx.strokeStyle = skin.eyeOutline;
        ctx.lineWidth = Math.max(0.8, 0.85 * eyeScale);
        ctx.stroke();
      }


      ctx.save();
      ctx.translate(shape.rx * 0.22, 0);
      ctx.scale(1, shape.pupilScaleY || 1);
      ctx.beginPath();
      ctx.arc(0, 0, shape.pupil, 0, Math.PI * 2);
      ctx.fillStyle = skin.pupil;
      ctx.fill();
      ctx.restore();

      if (skin.eyeHighlight) {
        ctx.fillStyle = skin.eyeHighlight;
        ctx.beginPath();
        ctx.arc(shape.rx * 0.22 - shape.pupil * 0.22, -shape.pupil * 0.25, shape.pupil * 0.28, 0, Math.PI * 2);
        ctx.fill();
      }
      if (style === 'deep') {
        ctx.strokeStyle = 'rgba(105,255,231,0.62)';
        ctx.lineWidth = 0.8 * eyeScale;
        ctx.beginPath();
        ctx.ellipse(0, 0, shape.rx + 0.9 * eyeScale, shape.ry + 0.4 * eyeScale, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    });
  }

  function drawGameBody(ctx, skinId, width, height, radius, time = 0) {
    const skin = getSkin(skinId);
    drawBodyBase(ctx, skin, width, height);
    drawPattern(ctx, skin, width, height, radius);
    drawBodyEdge(ctx, skin, width, height, radius, typeof camera !== 'undefined' ? camera.zoom || 1 : 1);
  }

  function drawGameEyes(ctx, skinId, width, height, radius) {
    drawEyes(ctx, getSkin(skinId), width, height, radius);
  }

  function drawGameMouthCavity(ctx, skinId, width, height, radius, mouthOpen) {
    drawMouthCavity(ctx, getSkin(skinId), width, height, radius, mouthOpen);
  }

  function hasVisualTail(skinId) {
    return !!getSkin(skinId).hasTail;
  }

  window.JorPlayerSkins = { getSkin, getPreviewMetrics, drawPreview, drawPreviewContent, drawGameBody, drawGameEyes, drawGameMouthCavity, hasVisualTail };
})();
