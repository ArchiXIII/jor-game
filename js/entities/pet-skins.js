(function () {
  'use strict';

  const PETS = {
    jor_pet_medusa: { id: 'jor_pet_medusa', body: '#91eaff', dark: '#2f75c8', accent: '#e6fcff', eye: '#f6ffff', pupil: '#06334b', style: 'medusa', motion: 'float' },
    jor_pet_kaplik: { id: 'jor_pet_kaplik', body: '#8cff62', dark: '#2c8c36', accent: '#e7ffc7', eye: '#f9fff5', pupil: '#214018', style: 'kaplik', motion: 'bounce' },
    jor_pet_reef_clown: { id: 'jor_pet_reef_clown', body: '#ff8b2a', dark: '#1d1511', accent: '#fff2d8', eye: '#fff8ec', pupil: '#28110c', style: 'clown', motion: 'waggle' },
    jor_pet_toothlet: { id: 'jor_pet_toothlet', body: '#cf3140', dark: '#4c1420', accent: '#74cf4a', eye: '#fff8ec', pupil: '#3d1114', style: 'toothlet', motion: 'snap' },
    jor_pet_pink_glutton: { id: 'jor_pet_pink_glutton', body: '#ff7fbd', dark: '#b73680', accent: '#db4d68', eye: '#162032', pupil: '#162032', style: 'pink_glutton', motion: 'puff' },
    jor_pet_ancient: { id: 'jor_pet_ancient', body: '#ffd83d', dark: '#c98912', accent: '#62f1e6', eye: '#10151a', pupil: '#10151a', style: 'ancient', motion: 'chomp' }
  };

  function getPet(id) {
    return PETS[id] || null;
  }

  function getPetRadius(playerRadius) {
    const start = (typeof GROWTH_CONFIG !== 'undefined' && GROWTH_CONFIG.START_RADIUS) || 14;
    const max = (typeof GROWTH_CONFIG !== 'undefined' && GROWTH_CONFIG.TARGET_MAX_RADIUS) || 64;
    const t = Math.max(0, Math.min(1, (playerRadius - start) / Math.max(1, max - start)));
    const ratio = 0.82 - Math.sqrt(t) * 0.48;
    return Math.max(6, playerRadius * ratio);
  }

  function setupCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const cssW = Math.max(1, canvas.clientWidth || 104);
    const cssH = Math.max(1, canvas.clientHeight || 74);
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

  function ellipse(ctx, x, y, rx, ry, rotation) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rotation || 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function strokeEllipse(ctx, x, y, rx, ry, rotation) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rotation || 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  function bodyGradient(ctx, pet, radius, ox, oy) {
    const gradient = ctx.createRadialGradient(radius * (ox ?? -0.28), radius * (oy ?? -0.32), radius * 0.08, 0, 0, radius * 1.28);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.36, pet.body);
    gradient.addColorStop(1, pet.dark);
    return gradient;
  }

  function drawEye(ctx, pet, radius, x, y, size) {
    ctx.fillStyle = pet.eye;
    ellipse(ctx, x, y, radius * size, radius * size * 0.86, 0);
    ctx.fillStyle = pet.pupil;
    ctx.beginPath();
    ctx.arc(x + radius * size * 0.18, y + radius * size * 0.04, Math.max(0.9, radius * size * 0.34), 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFin(ctx, x, y, w, h, color, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-w * 0.3, -h * 0.7, w, -h * 0.25);
    ctx.quadraticCurveTo(w * 0.45, h * 0.28, 0, 0);
    ctx.fill();
    ctx.restore();
  }

  function drawMedusa(ctx, pet, radius, phase) {
    const wobble = Math.sin(phase * 1.15) * radius * 0.05;
    ctx.fillStyle = bodyGradient(ctx, pet, radius, -0.32, -0.46);
    ctx.beginPath();
    ctx.moveTo(-radius * 1.08, radius * 0.1);
    ctx.bezierCurveTo(-radius * 0.88, -radius * 0.92 - wobble, radius * 0.88, -radius * 0.92 + wobble, radius * 1.08, radius * 0.1);
    ctx.quadraticCurveTo(radius * 0.84, radius * 0.42, radius * 0.54, radius * 0.32);
    ctx.quadraticCurveTo(radius * 0.36, radius * 0.58, radius * 0.1, radius * 0.36);
    ctx.quadraticCurveTo(-radius * 0.12, radius * 0.62, -radius * 0.38, radius * 0.36);
    ctx.quadraticCurveTo(-radius * 0.68, radius * 0.5, -radius * 1.08, radius * 0.1);
    ctx.fill();
    ctx.strokeStyle = 'rgba(232,255,255,0.9)';
    ctx.lineWidth = Math.max(1.2, radius * 0.065);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.38)';
    ctx.lineWidth = Math.max(1, radius * 0.05);
    ctx.beginPath();
    ctx.arc(-radius * 0.28, radius * 0.02, radius * 0.54, Math.PI * 1.05, Math.PI * 1.82);
    ctx.arc(radius * 0.28, radius * 0.02, radius * 0.48, Math.PI * 1.18, Math.PI * 1.88);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(218,252,255,0.92)';
    ctx.lineWidth = Math.max(1, radius * 0.075);
    ctx.beginPath();
    for (let i = -3; i <= 3; i++) {
      const x = i * radius * 0.2;
      const bend = Math.sin(phase * 1.15 + i * 0.9) * radius * 0.18;
      ctx.moveTo(x, radius * 0.3);
      ctx.bezierCurveTo(x + bend, radius * 0.58, x - bend * 0.4, radius * 0.88, x + bend * 0.25, radius * 1.22);
    }
    ctx.stroke();
    drawEye(ctx, pet, radius, radius * 0.34, -radius * 0.18, 0.14);
  }

  function drawKaplik(ctx, pet, radius, phase) {
    const squash = 1 + Math.sin(phase * 1.8) * 0.075;
    ctx.save();
    ctx.scale(1 / squash, squash);
    ctx.fillStyle = bodyGradient(ctx, pet, radius, -0.18, -0.42);
    ctx.beginPath();
    ctx.moveTo(0, -radius * 1.2);
    ctx.bezierCurveTo(radius * 0.8, -radius * 0.92, radius * 1.16, -radius * 0.18, radius * 0.9, radius * 0.5);
    ctx.bezierCurveTo(radius * 0.55, radius * 1.2, -radius * 0.58, radius * 1.2, -radius * 0.92, radius * 0.5);
    ctx.bezierCurveTo(-radius * 1.18, -radius * 0.18, -radius * 0.82, -radius * 0.92, 0, -radius * 1.2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(234,255,214,0.82)';
    ctx.lineWidth = Math.max(1.2, radius * 0.065);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.52)';
    ellipse(ctx, -radius * 0.34, -radius * 0.48, radius * 0.24, radius * 0.16, -0.55);
    drawEye(ctx, pet, radius, -radius * 0.32, -radius * 0.18, 0.22);
    drawEye(ctx, pet, radius, radius * 0.34, -radius * 0.18, 0.22);
    ctx.strokeStyle = '#173712';
    ctx.lineWidth = Math.max(1.4, radius * 0.085);
    ctx.beginPath();
    ctx.arc(radius * 0.02, radius * 0.18, radius * 0.36, 0.12, Math.PI - 0.12);
    ctx.stroke();
    ctx.restore();
  }

  function drawClown(ctx, pet, radius, phase) {
    const tailWave = Math.sin(phase * 1.5) * radius * 0.12;
    ctx.fillStyle = '#ff9b24';
    ctx.beginPath();
    ctx.moveTo(-radius * 0.82, 0);
    ctx.lineTo(-radius * 1.35, -radius * 0.44 + tailWave);
    ctx.lineTo(-radius * 1.12, 0);
    ctx.lineTo(-radius * 1.35, radius * 0.44 + tailWave);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = pet.dark;
    ctx.lineWidth = Math.max(1, radius * 0.06);
    ctx.stroke();
    drawFin(ctx, -radius * 0.08, -radius * 0.58, radius * 0.44, radius * 0.28, '#ffb23c', -0.55);
    drawFin(ctx, -radius * 0.12, radius * 0.55, radius * 0.38, radius * 0.24, '#ffb23c', 0.4);
    ctx.fillStyle = bodyGradient(ctx, { body: '#ff9824', dark: '#d24a18' }, radius);
    ellipse(ctx, 0, 0, radius * 1.0, radius * 0.64, 0);
    ctx.strokeStyle = pet.dark;
    ctx.lineWidth = Math.max(1.2, radius * 0.075);
    strokeEllipse(ctx, 0, 0, radius * 1.0, radius * 0.64, 0);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.94, radius * 0.58, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.lineCap = 'round';
    ctx.strokeStyle = pet.dark;
    ctx.lineWidth = Math.max(2, radius * 0.24);
    ctx.beginPath();
    ctx.moveTo(-radius * 0.48, -radius * 0.56);
    ctx.quadraticCurveTo(-radius * 0.34, 0, -radius * 0.48, radius * 0.56);
    ctx.moveTo(radius * 0.08, -radius * 0.54);
    ctx.quadraticCurveTo(radius * 0.2, 0, radius * 0.08, radius * 0.54);
    ctx.stroke();
    ctx.strokeStyle = pet.accent;
    ctx.lineWidth = Math.max(1.6, radius * 0.17);
    ctx.beginPath();
    ctx.moveTo(-radius * 0.48, -radius * 0.56);
    ctx.quadraticCurveTo(-radius * 0.34, 0, -radius * 0.48, radius * 0.56);
    ctx.moveTo(radius * 0.08, -radius * 0.54);
    ctx.quadraticCurveTo(radius * 0.2, 0, radius * 0.08, radius * 0.54);
    ctx.stroke();
    ctx.restore();
    drawEye(ctx, pet, radius, radius * 0.46, -radius * 0.16, 0.15);
    ctx.strokeStyle = pet.dark;
    ctx.lineWidth = Math.max(1, radius * 0.055);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(radius * 0.7, radius * 0.08, radius * 0.12, 0.15, Math.PI * 0.78);
    ctx.stroke();
  }
  function drawToothlet(ctx, pet, radius, phase) {
    const snap = 0.5 + (Math.sin(phase * 2.0) * 0.5 + 0.5) * 0.12;
    ctx.fillStyle = pet.accent;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.42, -radius * 0.56);
    ctx.lineTo(-radius * 0.82, -radius * 1.02);
    ctx.lineTo(-radius * 0.22, -radius * 0.74);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-radius * 0.5, radius * 0.48);
    ctx.lineTo(-radius * 0.96, radius * 0.86);
    ctx.lineTo(-radius * 0.28, radius * 0.68);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = bodyGradient(ctx, pet, radius, -0.18, -0.38);
    ctx.beginPath();
    ctx.moveTo(radius * 1.02, 0);
    ctx.bezierCurveTo(radius * 0.72, -radius * 0.92, -radius * 0.28, -radius * 1.08, -radius * 0.96, -radius * 0.38);
    ctx.quadraticCurveTo(-radius * 0.58, 0, -radius * 0.96, radius * 0.38);
    ctx.bezierCurveTo(-radius * 0.28, radius * 1.08, radius * 0.72, radius * 0.92, radius * 1.02, 0);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,188,0.88)';
    ctx.lineWidth = Math.max(1.4, radius * 0.075);
    ctx.stroke();
    ctx.fillStyle = '#13070b';
    ctx.beginPath();
    ctx.moveTo(radius * 0.98, 0);
    ctx.lineTo(radius * 0.12, -radius * snap);
    ctx.quadraticCurveTo(-radius * 0.12, 0, radius * 0.12, radius * snap);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff2d8';
    for (let i = 0; i < 5; i++) {
      const y = (-0.42 + i * 0.21) * radius;
      ctx.beginPath();
      ctx.moveTo(radius * 0.17, y);
      ctx.lineTo(radius * 0.5, y * 0.22);
      ctx.lineTo(radius * 0.18, y + radius * 0.12);
      ctx.closePath();
      ctx.fill();
    }
    drawEye(ctx, pet, radius, -radius * 0.22, -radius * 0.38, 0.13);
  }

  function drawPinkGlutton(ctx, pet, radius, phase) {
    const puff = 1 + Math.sin(phase * 1.6) * 0.05;
    ctx.save();
    ctx.scale(puff, 1 / puff);
    ctx.fillStyle = pet.accent;
    ellipse(ctx, -radius * 0.57, radius * 0.67, radius * 0.29, radius * 0.19, -0.34);
    ellipse(ctx, radius * 0.57, radius * 0.66, radius * 0.3, radius * 0.19, 0.34);
    ellipse(ctx, -radius * 0.72, -radius * 0.04, radius * 0.18, radius * 0.14, -0.2);
    ellipse(ctx, radius * 0.72, -radius * 0.04, radius * 0.18, radius * 0.14, 0.2);
    ctx.fillStyle = bodyGradient(ctx, pet, radius, -0.28, -0.32);
    ellipse(ctx, 0, 0, radius * 0.92, radius * 0.88, 0);
    ctx.fillStyle = 'rgba(255,214,236,0.82)';
    ellipse(ctx, radius * 0.24, radius * 0.1, radius * 0.25, radius * 0.18, -0.1);
    ctx.fillStyle = '#46213d';
    ellipse(ctx, radius * 0.48, radius * 0.02, radius * 0.19, radius * 0.24, 0.08);
    ctx.fillStyle = pet.eye;
    ctx.beginPath();
    ctx.arc(radius * 0.13, -radius * 0.29, Math.max(1, radius * 0.055), 0, Math.PI * 2);
    ctx.arc(radius * 0.34, -radius * 0.29, Math.max(1, radius * 0.055), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  function drawAncient(ctx, pet, radius, phase) {
    const mouth = 0.22 + (Math.sin(phase * 1.8) * 0.5 + 0.5) * 0.4;
    ctx.fillStyle = pet.body;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, mouth, Math.PI * 2 - mouth, false);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,210,0.8)';
    ctx.lineWidth = Math.max(1, radius * 0.07);
    ctx.stroke();
    ctx.fillStyle = pet.eye;
    ctx.beginPath();
    ctx.arc(radius * 0.2, -radius * 0.46, Math.max(1.8, radius * 0.12), 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPet(ctx, petId, radius, phase = 0, direction = 0) {
    const pet = getPet(petId);
    if (!pet) return;
    ctx.save();
    ctx.rotate(direction);
    if (pet.style === 'medusa') drawMedusa(ctx, pet, radius, phase);
    else if (pet.style === 'kaplik') drawKaplik(ctx, pet, radius, phase);
    else if (pet.style === 'clown') drawClown(ctx, pet, radius, phase);
    else if (pet.style === 'toothlet') drawToothlet(ctx, pet, radius, phase);
    else if (pet.style === 'pink_glutton') drawPinkGlutton(ctx, pet, radius, phase);
    else if (pet.style === 'ancient') drawAncient(ctx, pet, radius, phase);
    ctx.restore();
  }

  function drawPreview(canvas, petId, time = 0) {
    const setup = setupCanvas(canvas);
    if (!setup) return;
    const { ctx, cssW, cssH } = setup;
    const pet = getPet(petId);
    const start = (typeof GROWTH_CONFIG !== 'undefined' && GROWTH_CONFIG.START_RADIUS) || 14;
    const max = (typeof GROWTH_CONFIG !== 'undefined' && GROWTH_CONFIG.TARGET_MAX_RADIUS) || 64;
    const playerRadius = start + (max - start) * 0.5;
    const radius = Math.min(getPetRadius(playerRadius) * 1.22, cssW * 0.31, cssH * 0.43);
    const t = time * 0.003;
    let ox = Math.sin(t) * 1.5;
    let oy = Math.cos(t * 1.07) * 1.1;
    if (pet?.motion === 'float') oy += Math.sin(t * 1.9) * 2.2;
    else if (pet?.motion === 'bounce') oy += Math.abs(Math.sin(t * 2.4)) * 2.2;
    else if (pet?.motion === 'snap') ox += Math.sin(t * 2.8) * 1.4;
    else if (pet?.motion === 'puff') oy += Math.sin(t * 1.5) * 1.6;
    ctx.save();
    ctx.translate(cssW * 0.5 + ox, cssH * 0.52 + oy);
    drawPet(ctx, petId, radius, time * 0.006, Math.PI * 0.24);
    ctx.restore();
  }

  window.JorPetSkins = { getPet, getPetRadius, drawPet, drawPreview };
})();







