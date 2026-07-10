(function () {
  'use strict';

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
    return { ctx, cssW, cssH };
  }

  function resolveVisual(effect) {
    const id = effect?.effectId || effect?.id || effect || 'default';
    return window.JorGrowthEffectSkins?.getEffect?.(id) || window.JorGrowthEffectSkins?.getEffect?.('default') || {
      id: 'default',
      color: 'rgba(175, 255, 240, 1)',
      alpha: 1,
      reach: 1,
      rings: 2,
      line: 1,
      bubbles: 0,
      arcs: 0,
      cycleMs: 2600,
      activeMs: 980
    };
  }

  function drawWorldEffect(ctx, effect, phase, width, height, radius, rotation = 0, previewBoost = 1) {
    if (!effect) return;
    const visual = resolveVisual(effect);
    const t = Math.max(0, Math.min(1, phase));
    const ease = 1 - Math.pow(1 - t, 2.1);
    const fade = Math.pow(1 - t, 1.3);
    const ringCount = Math.max(0, Math.min(4, Number(visual.rings || 0)));
    const alphaBase = 0.42 * (visual.alpha || 1) * previewBoost;
    ctx.save();
    ctx.rotate(rotation);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = visual.color;

    if ((visual.bodyPulse || 0) > 0) {
      const pulseAlpha = Math.sin(Math.PI * Math.min(1, t * 1.12)) * 0.22 * visual.bodyPulse * (visual.alpha || 1) * previewBoost;
      if (pulseAlpha > 0.01) {
        ctx.globalAlpha = pulseAlpha;
        ctx.fillStyle = visual.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, width * (0.98 + ease * 0.08), height * (1 + ease * 0.08), 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if ((visual.burst || 0) > 0) {
      const burstT = Math.min(1, t / 0.32);
      const burstFade = Math.pow(1 - burstT, 0.85) * visual.burst;
      if (burstFade > 0.01) {
        ctx.globalAlpha = burstFade * 0.62 * (visual.alpha || 1) * previewBoost;
        ctx.strokeStyle = 'rgba(255, 255, 245, 0.95)';
        ctx.lineWidth = Math.max(1.2, radius * 0.05 * (visual.line || 1));
        ctx.beginPath();
        ctx.ellipse(0, 0, width * (1.02 + burstT * 0.34), height * (1.04 + burstT * 0.32), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = visual.color;
    for (let ring = 0; ring < ringCount; ring++) {
      const rt = Math.min(1, ease + ring * 0.085);
      const ringFade = Math.pow(1 - rt, 1.2) * fade * (ring === 0 ? 1 : 0.42);
      ctx.globalAlpha = alphaBase * ringFade;
      if (ctx.globalAlpha <= 0.01) continue;
      ctx.lineWidth = Math.max(0.9, radius * (0.052 - rt * 0.026) * (visual.line || 1) * (ring === 0 ? 1 : 0.74));
      ctx.beginPath();
      ctx.ellipse(
        0,
        0,
        width * (1.03 + ring * 0.1 + rt * 1.08 * (visual.reach || 1)),
        height * (1.06 + ring * 0.1 + rt * 0.98 * (visual.reach || 1)),
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }

    const bubbleCount = Math.max(0, Math.min(6, visual.bubbles || 0));
    if (bubbleCount > 0) {
      const bubbles = [
        [-0.72, -0.4, 0.105, 0.95],
        [0.52, -0.34, 0.088, 1.08],
        [-0.26, 0.58, 0.078, 1.22],
        [0.72, 0.28, 0.066, 1.36],
        [-0.54, 0.2, 0.072, 1.5],
        [0.12, -0.64, 0.062, 1.64]
      ];
      ctx.fillStyle = visual.color;
      for (let i = 0; i < bubbleCount; i++) {
        const b = bubbles[i];
        const bt = Math.max(0, Math.min(1, t * b[3]));
        ctx.globalAlpha = fade * 0.48 * (visual.alpha || 1) * previewBoost * (1 - bt * 0.42);
        if (ctx.globalAlpha <= 0.01) continue;
        ctx.beginPath();
        ctx.arc(b[0] * width * 1.5 * (1 + bt * 1.05), b[1] * height * 1.5 * (1 + bt * 1.05), radius * (b[2] + bt * 0.06), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const arcCount = Math.max(0, Math.min(4, visual.arcs || 0));
    if (arcCount > 0) {
      ctx.strokeStyle = visual.color;
      ctx.lineWidth = Math.max(1.2, radius * 0.044 * (visual.line || 1));
      for (let i = 0; i < arcCount; i++) {
        const row = i < 2 ? 0 : 1;
        const arcR = Math.max(width, height) * (1.12 + row * 0.24 + ease * 0.78 * (visual.reach || 1));
        const center = (Math.PI * 2 * i) / arcCount + Math.PI * (0.12 + row * 0.08);
        const span = Math.PI * (0.34 + row * 0.08);
        const start = center - span * 0.5;
        const end = center + span * 0.5;
        ctx.globalAlpha = fade * 0.52 * (visual.alpha || 1) * previewBoost * (row === 0 ? 1 : 0.72);
        ctx.beginPath();
        ctx.arc(0, 0, arcR, start, end);
        ctx.stroke();
      }
    }

    const rayCount = Math.max(0, Math.min(8, visual.rays || 0));
    if (rayCount > 0) {
      const rayT = Math.min(1, t / 0.58);
      const rayFade = Math.pow(1 - rayT, 1.15) * fade;
      ctx.strokeStyle = visual.color;
      ctx.lineWidth = Math.max(1, radius * 0.032 * (visual.line || 1));
      for (let i = 0; i < rayCount; i++) {
        const a = (Math.PI * 2 * i) / rayCount + 0.35;
        const inner = radius * (0.95 + rayT * 0.45);
        const outer = radius * (1.55 + rayT * 0.95);
        const sx = Math.cos(a) * inner;
        const sy = Math.sin(a) * inner * 0.78;
        const ex = Math.cos(a) * outer;
        const ey = Math.sin(a) * outer * 0.78;
        ctx.globalAlpha = rayFade * 0.46 * (visual.alpha || 1) * previewBoost;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawEffectOverlay(canvas, effect, time = 0) {
    const setup = setupCanvas(canvas);
    if (!setup) return;
    const { ctx, cssW, cssH } = setup;
    const visual = resolveVisual(effect);
    const activeMs = visual.activeMs || 1000;
    const local = time % (visual.cycleMs || 2400);
    if (local > activeMs) return;
    const metrics = window.JorPlayerSkins?.getPreviewMetrics?.(cssW, cssH, time) || {
      cx: cssW * 0.52,
      cy: cssH * 0.5,
      radius: Math.min(cssW, cssH) * 0.23,
      width: Math.min(cssW, cssH) * 0.24,
      height: Math.min(cssW, cssH) * 0.21,
      rotation: Math.PI * 0.25
    };
    ctx.save();
    ctx.translate(metrics.cx, metrics.cy);
    drawWorldEffect(ctx, visual, local / activeMs, metrics.width, metrics.height, metrics.radius, metrics.rotation, 1.25);
    ctx.restore();
  }

  function drawPreview(canvas, effectItem, skinId, time = 0) {
    const setup = setupCanvas(canvas);
    if (!setup) return;
    const { ctx, cssW, cssH } = setup;
    ctx.clearRect(0, 0, cssW, cssH);

    const virtualH = canvas.dataset.growthPreview ? Math.min(cssH, cssW <= 90 ? 58 : 74) : cssH;
    const offsetY = (cssH - virtualH) * 0.5;
    const metrics = window.JorPlayerSkins?.getPreviewMetrics?.(cssW, virtualH, time) || {
      cx: cssW * 0.52,
      cy: virtualH * 0.5,
      radius: Math.min(cssW, virtualH) * 0.23,
      width: Math.min(cssW, virtualH) * 0.24,
      height: Math.min(cssW, virtualH) * 0.21,
      rotation: Math.PI * 0.25
    };
    metrics.cy += offsetY;

    if (window.JorPlayerSkins?.drawPreviewContent) {
      window.JorPlayerSkins.drawPreviewContent(ctx, skinId || 'default', metrics, time);
    } else if (window.JorPlayerSkins?.drawPreview) {
      window.JorPlayerSkins.drawPreview(canvas, skinId || 'default', time);
    }

    const visual = resolveVisual(effectItem);
    const activeMs = visual.activeMs || 1000;
    const local = time % (visual.cycleMs || 2400);
    if (local > activeMs) return;
    ctx.save();
    ctx.translate(metrics.cx, metrics.cy);
    drawWorldEffect(ctx, visual, local / activeMs, metrics.width, metrics.height, metrics.radius, metrics.rotation, 1.25);
    ctx.restore();
  }

  window.JorGrowthEffects = { drawPreview, drawEffectOverlay, drawWorldEffect, resolveVisual };
})();
