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
      pupil: 'rgba(8, 35, 30, 0.55)',
      mouth: '#064958',
      pattern: 'plain',
      eyeStyle: 'base',
      finStyle: 'base',
      hasTail: false
    },
    jor_char_shellback: {
      id: 'jor_char_shellback',
      body: '#9ef0c6',
      belly: '#e9fff1',
      fin: '#5fd09f',
      fin2: '#2c997a',
      eye: '#f5fff7',
      pupil: '#073326',
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
      eye: '#f6ffff',
      pupil: '#053645',
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
      eye: '#fff7ef',
      pupil: '#4a1518',
      mouth: '#6b1d22',
      pattern: 'hunter',
      eyeStyle: 'hunter',
      finStyle: 'sharp',
      hasTail: false
    },
    jor_char_abyssal: {
      id: 'jor_char_abyssal',
      body: '#7652c9',
      belly: '#c8b5ff',
      fin: '#2bd8c8',
      fin2: '#5d38a6',
      eye: '#dffff9',
      pupil: '#110b2b',
      mouth: '#1b1242',
      pattern: 'abyss',
      eyeStyle: 'deep',
      finStyle: 'deep',
      hasTail: false
    }
  };

  const FALLBACK = SKINS.default;

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
    const locomotion = Math.sin(swimPhase);
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
      finWave: Math.sin(swimPhase * 1.18 + 0.7)
    };
  }

  function drawPreviewContent(ctx, skinId, metrics, time = 0) {
    const skin = getSkin(skinId);
    const { cx, cy, radius: base, width, height, rotation, swimPhase, locomotion, finWave } = metrics;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);

    if (skin.hasTail) drawSpeedTail(ctx, skin, width, height, base, finWave);
    drawSideFin(ctx, skin, width, height, base, swimPhase, 1);
    drawSideFin(ctx, skin, width, height, base, swimPhase, -1);
    drawBody(ctx, skin, width, height, base, time);
    drawPattern(ctx, skin, width, height, base);
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

  function drawSideFin(ctx, skin, width, height, radius, legCycle, side) {
    const finRoots = [-width * 0.2, width * 0.26];
    const phaseOffsets = [0, Math.PI * 0.52];
    const legWave = 0.35 + Math.abs(Math.sin(legCycle * 0.9)) * 0.42;
    const swimPower = Math.min(1.55, 0.55 + legWave * 1.05);
    const finLengthBase = radius * (0.62 + swimPower * 0.16);
    const finWidthBase = radius * (0.34 + swimPower * 0.08);

    for (let i = 0; i < 2; i++) {
      const rootX = finRoots[i];
      const rootY = side * (height * (0.64 + i * 0.03));
      const phase = legCycle * 0.72 + phaseOffsets[i] + (side === 1 ? 0 : Math.PI * 0.55);
      const sweep = Math.sin(phase) * (0.42 + swimPower * 0.28);
      const fanOpen = 0.95 + Math.cos(phase - 0.4) * 0.24 + swimPower * 0.26;
      const trailing = Math.sin(phase - 0.7) * (0.24 + swimPower * 0.08);
      const finLength = finLengthBase * (0.95 + i * 0.13);
      const finWidth = finWidthBase * (0.96 + i * 0.1) * fanOpen;
      const tipX = rootX - finLength;
      const tipY = rootY + side * (sweep * radius * 0.78);
      const upperCtrlX = rootX - finLength * 0.34;
      const upperCtrlY = rootY - side * (finWidth * (1.18 + trailing));
      const lowerCtrlX = rootX - finLength * 0.48;
      const lowerCtrlY = rootY + side * (finWidth * (1.24 - trailing * 0.45));
      const trailingX = rootX + width * (0.14 + i * 0.03);
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
      ctx.lineWidth = Math.max(1.2, radius * 0.032);
      ctx.stroke();
      ctx.fillStyle = 'rgba(230,255,248,0.32)';
      ctx.beginPath();
      ctx.moveTo(rootX, rootY);
      ctx.quadraticCurveTo(upperCtrlX, upperCtrlY, tipX, tipY);
      ctx.quadraticCurveTo(lowerCtrlX, lowerCtrlY, rootX, rootY);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.58)';
      ctx.lineWidth = Math.max(1, radius * 0.024);
      ctx.beginPath();
      ctx.moveTo(rootX - width * 0.04, rootY);
      ctx.quadraticCurveTo(rootX - finLength * 0.4, rootY + side * (sweep * radius * 0.28), tipX, tipY);
      ctx.stroke();
      ctx.restore();
    }
  }
  function drawSpeedTail(ctx, skin, width, height, radius, wave) {
    const tailBaseX = -width * 0.86;
    const tailMidX = -width * 1.12;
    const tailTipX = -width * 1.34;
    const tailHalfHeight = height * 0.46;
    const swing = wave * radius * 0.18;
    ctx.save();

    const gradient = ctx.createLinearGradient(tailBaseX, 0, tailTipX, swing);
    gradient.addColorStop(0, skin.fin2);
    gradient.addColorStop(0.45, skin.fin);
    gradient.addColorStop(1, 'rgba(230,255,255,0.9)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(tailBaseX, -height * 0.18);
    ctx.quadraticCurveTo(tailMidX, -tailHalfHeight + swing * 0.35, tailTipX, -tailHalfHeight * 0.42 + swing);
    ctx.quadraticCurveTo(tailMidX + width * 0.08, 0 + swing * 0.18, tailTipX, tailHalfHeight * 0.42 + swing);
    ctx.quadraticCurveTo(tailMidX, tailHalfHeight + swing * 0.35, tailBaseX, height * 0.18);
    ctx.quadraticCurveTo(-width * 0.96, 0, tailBaseX, -height * 0.18);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(238,255,255,0.62)';
    ctx.lineWidth = Math.max(1.1, radius * 0.035);
    ctx.stroke();

    ctx.restore();
  }

  function drawBodyBase(ctx, skin, width, height) {
    const gradient = ctx.createRadialGradient(-width * 0.25, -height * 0.35, width * 0.12, 0, 0, width * 1.1);
    if (skin.id === 'default') {
      gradient.addColorStop(0, '#edfff9');
      gradient.addColorStop(0.45, '#71ffd8');
      gradient.addColorStop(1, '#1f9e93');
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

    ctx.fillStyle = skin.id === 'default' ? 'rgba(255,255,255,0.12)' : skin.belly;
    ctx.beginPath();
    ctx.ellipse(-width * 0.14, 0, width * 0.28, height * 0.32, Math.sin(time * 0.003) * 0.22, 0, Math.PI * 2);
    ctx.fill();
    if (skin.id === 'default') {
      ctx.fillStyle = 'rgba(18, 78, 67, 0.18)';
      ctx.beginPath();
      ctx.ellipse(width * 0.04, height * 0.18, width * 0.2, height * 0.16, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(235,255,250,0.32)';
    ctx.lineWidth = Math.max(1.2, radius * 0.055);
    ctx.beginPath();
    ctx.ellipse(0, 0, width * 1.03, height * 1.03, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawPattern(ctx, skin, width, height, radius) {
    const detailScale = Math.max(0.9, radius / 17);
    const patternScale = 1.296;
    const px = width * patternScale;
    const py = height * patternScale;
    const offsetX = 0;
    if (skin.pattern === 'shell') {
      ctx.strokeStyle = 'rgba(5,48,39,0.42)';
      ctx.lineWidth = 1.35 * detailScale;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(offsetX - px * 0.08 + i * px * 0.18, -py * 0.36);
        ctx.quadraticCurveTo(offsetX - px * 0.1 + i * px * 0.14, 0, offsetX - px * 0.08 + i * px * 0.18, py * 0.36);
        ctx.stroke();
      }
    } else if (skin.pattern === 'speed') {
      ctx.strokeStyle = 'rgba(235,255,255,0.5)';
      ctx.lineWidth = 1.15 * detailScale;
      [-0.14, 0.14].forEach((offset) => {
        ctx.beginPath();
        ctx.moveTo(offsetX - px * 0.38, py * offset * 1.2);
        ctx.quadraticCurveTo(offsetX - px * 0.12, py * offset * 0.7, offsetX + px * 0.18, py * offset * 0.9);
        ctx.stroke();
      });
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
      ctx.moveTo(offsetX - px * 0.42, -py * 0.34);
      ctx.lineTo(offsetX - px * 0.1, -py * 0.1);
      ctx.lineTo(offsetX - px * 0.3, py * 0.12);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(offsetX - px * 0.04, -py * 0.3);
      ctx.lineTo(offsetX + px * 0.25, -py * 0.06);
      ctx.lineTo(offsetX + px * 0.02, py * 0.2);
      ctx.closePath();
      ctx.fill();
    } else if (skin.pattern === 'abyss') {
      ctx.strokeStyle = 'rgba(87,255,229,0.56)';
      ctx.lineWidth = 1.45 * detailScale;
      ctx.beginPath();
      ctx.moveTo(offsetX - px * 0.5, -py * 0.16);
      ctx.quadraticCurveTo(offsetX - px * 0.15, -py * 0.34, offsetX + px * 0.28, -py * 0.1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(offsetX - px * 0.44, py * 0.26);
      ctx.quadraticCurveTo(offsetX - px * 0.08, py * 0.38, offsetX + px * 0.3, py * 0.16);
      ctx.stroke();
    }
  }
  function drawMouth(ctx, skin, width, height, radius, locomotion) {
    const mouthOpen = 0.19 + Math.max(0, locomotion) * 0.018;
    const mandibleBaseX = width * 0.4;
    const mandibleRootBulge = width * 0.2;
    const mandibleTipX = width * 1.02;
    const mandibleSpread = height * (0.26 + mouthOpen * 0.54);
    const clawLength = radius * 0.34;

    ctx.save();
    ctx.fillStyle = 'rgba(7, 30, 28, 0.68)';
    ctx.beginPath();
    ctx.ellipse(width * 0.77, 0, Math.max(7.5, radius * 0.24), Math.max(3.4, radius * (0.14 + mouthOpen * 0.22)), 0, 0, Math.PI * 2);
    ctx.fill();

    const drawMandible = (side) => {
      const upperY = -mandibleSpread * side;
      const lowerY = -height * 0.05 * side;
      const tipY = -mandibleSpread * 0.55 * side;
      const gradient = ctx.createLinearGradient(mandibleBaseX, 0, mandibleTipX + clawLength, tipY);
      gradient.addColorStop(0, 'rgba(70, 255, 215, 0.28)');
      gradient.addColorStop(0.45, 'rgba(215, 255, 245, 0.96)');
      gradient.addColorStop(1, 'rgba(255, 250, 245, 0.98)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(mandibleBaseX - mandibleRootBulge * 0.28, lowerY - side * radius * 0.06);
      ctx.quadraticCurveTo(width * 0.48, upperY * 0.34, mandibleBaseX + mandibleRootBulge * 0.65, upperY * 0.98);
      ctx.quadraticCurveTo(width * 0.8, upperY * 1.02, mandibleTipX, tipY);
      ctx.quadraticCurveTo(mandibleTipX + clawLength, tipY - side * radius * 0.1, mandibleTipX + clawLength * 0.94, tipY + side * radius * 0.15);
      ctx.quadraticCurveTo(width * 0.9, lowerY + side * radius * 0.08, mandibleBaseX + mandibleRootBulge * 0.24, lowerY + side * radius * 0.13);
      ctx.quadraticCurveTo(width * 0.48, lowerY * 0.68, mandibleBaseX - mandibleRootBulge * 0.28, lowerY - side * radius * 0.06);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(10, 42, 36, 0.42)';
      ctx.beginPath();
      ctx.moveTo(width * 0.5, lowerY * 0.98);
      ctx.quadraticCurveTo(width * 0.78, upperY * 0.86, mandibleTipX - radius * 0.06, tipY * 0.96);
      ctx.quadraticCurveTo(width * 0.82, lowerY * 0.88, width * 0.5, lowerY * 0.98);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(245,255,250,0.82)';
      ctx.lineWidth = 1.35;
      ctx.beginPath();
      ctx.moveTo(mandibleTipX - radius * 0.05, tipY);
      ctx.lineTo(mandibleTipX + clawLength * 0.84, tipY + side * radius * 0.12);
      ctx.stroke();
    };

    drawMandible(1);
    drawMandible(-1);
    ctx.restore();
  }

  function drawEyes(ctx, skin, width, height, radius) {
    if ((skin.eyeStyle || 'round') === 'base') {
      ctx.fillStyle = 'rgba(255,255,255,0.98)';
      ctx.beginPath();
      ctx.ellipse(width * 0.1, -height * 0.24, Math.max(2.8, radius * 0.12), Math.max(2.2, radius * 0.095), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(8, 35, 30, 0.55)';
      ctx.beginPath();
      ctx.arc(width * 0.16, -height * 0.24, Math.max(1.6, radius * 0.05), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.56)';
      ctx.beginPath();
      ctx.arc(-width * 0.22, -height * 0.28, Math.max(2.4, radius * 0.1), 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    const eyeX = width * 0.34;
    const eyeGap = height * 0.28;
    const style = skin.eyeStyle || 'round';
    const eyeScale = Math.max(0.85, radius / 18);
    const rawShape = {
      calm: { rx: 4.8, ry: 2.7, tilt: -0.04, pupil: 1.25, lid: 0.34, pupilScaleY: 0.82 },
      alert: { rx: 5.2, ry: 2.35, tilt: -0.28, pupil: 1.25, lid: 0.12, pupilScaleY: 0.72 },
      round: { rx: 5.0, ry: 4.25, tilt: 0, pupil: 1.85, lid: 0, pupilScaleY: 1 },
      hunter: { rx: 5.4, ry: 1.9, tilt: -0.42, pupil: 1.08, lid: 0.42, pupilScaleY: 0.55 },
      deep: { rx: 4.65, ry: 2.05, tilt: -0.16, pupil: 0.95, lid: 0.22, pupilScaleY: 0.62 }
    }[style] || { rx: 4.2, ry: 3.25, tilt: 0, pupil: 1.55, lid: 0, pupilScaleY: 1 };
    const shape = {
      rx: rawShape.rx * eyeScale,
      ry: rawShape.ry * eyeScale,
      tilt: rawShape.tilt,
      pupil: rawShape.pupil * eyeScale,
      lid: rawShape.lid,
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

      if (shape.lid > 0) {
        ctx.fillStyle = 'rgba(3,16,22,0.26)';
        ctx.beginPath();
        ctx.ellipse(-0.4, -shape.ry * 0.75, shape.rx * 1.04, shape.ry * shape.lid, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.save();
      ctx.translate(shape.rx * 0.22, 0);
      ctx.scale(1, shape.pupilScaleY || 1);
      ctx.beginPath();
      ctx.arc(0, 0, shape.pupil, 0, Math.PI * 2);
      ctx.fillStyle = skin.pupil;
      ctx.fill();
      ctx.restore();

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
  }

  function drawGameEyes(ctx, skinId, width, height, radius) {
    drawEyes(ctx, getSkin(skinId), width, height, radius);
  }

  function hasVisualTail(skinId) {
    return !!getSkin(skinId).hasTail;
  }

  window.JorPlayerSkins = { getSkin, getPreviewMetrics, drawPreview, drawPreviewContent, drawGameBody, drawGameEyes, hasVisualTail };
})();




















