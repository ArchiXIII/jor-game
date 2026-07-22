(function () {
  'use strict';

  const CURRENT_FORCE_SCALE = 2;

  function activeLevel() {
    return !endlessMode && App.gameMode === 'campaign' ? App.campaignRun?.level || getActiveCampaignLevel() : null;
  }

  function bandHash(index, seed) {
    let value = Math.imul(index ^ seed, 0x45d9f3b);
    value ^= value >>> 16;
    value = Math.imul(value, 0x45d9f3b);
    value ^= value >>> 16;
    return (value >>> 0) / 4294967295;
  }

  function bandPosition(index, spacing, offset, seed) {
    return offset + index * spacing + (bandHash(index, seed) - 0.5) * spacing * 0.36;
  }

  function bandSpeed(index, seed) {
    const direction = ((index + seed) & 1) === 0 ? 1 : -1;
    return direction * (0.7 + bandHash(index, seed ^ 0x6d2b79f5) * 0.8);
  }

  function bandWidth(index, width, seed) {
    return width * (0.7 + bandHash(index, seed ^ 0x27d4eb2d) * 0.4);
  }

  function currentInfluence(entity, nx, ny, spacing, width, offset, positionSeed, speedSeed, widthSeed) {
    const projection = entity.x * nx + entity.y * ny;
    const centerIndex = Math.round((projection - offset) / spacing);
    let strongest = 0;
    let strongestIndex = centerIndex;
    for (let index = centerIndex - 1; index <= centerIndex + 1; index++) {
      const halfWidth = bandWidth(index, width, widthSeed) * 0.5;
      const distance = Math.abs(projection - bandPosition(index, spacing, offset, positionSeed));
      if (distance >= halfWidth) continue;
      const value = 1 - distance / halfWidth;
      const influence = value * value * (3 - 2 * value);
      if (influence <= strongest) continue;
      strongest = influence;
      strongestIndex = index;
    }
    return strongest * bandSpeed(strongestIndex, speedSeed);
  }

  window.applyCampaignCurrents = function () {
    const level = activeLevel();
    const strength = Number(level?.currentStrength) || 0;
    if (!level || strength <= 0 || !player) return;
    const angle = Number(level.currentAngle) || 0;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const nx = -dy;
    const ny = dx;
    const spacing = Math.max(520, Number(level.currentSpacing) || 820);
    const width = Math.max(180, Number(level.currentWidth) || 300);
    const offset = Number(level.currentOffset) || level.n * 137;
    const levelNumber = Math.floor(Number(level.n) || 0);
    const positionSeed = (levelNumber * 977) | 0;
    const speedSeed = (levelNumber * 1597) | 0;
    const widthSeed = (levelNumber * 2081) | 0;
    const forceScale = CURRENT_FORCE_SCALE * getWorldSpeedScale();
    let influence = currentInfluence(player, nx, ny, spacing, width, offset, positionSeed, speedSeed, widthSeed);
    player.x += dx * strength * influence * forceScale;
    player.y += dy * strength * influence * forceScale;
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      influence = currentInfluence(enemy, nx, ny, spacing, width, offset, positionSeed, speedSeed, widthSeed);
      enemy.x += dx * strength * influence * forceScale * 0.78;
      enemy.y += dy * strength * influence * forceScale * 0.78;
    }
  };

  window.drawCampaignCurrents = function () {
    const level = activeLevel();
    if (!level || !(Number(level.currentStrength) > 0)) return;
    const angle = Number(level.currentAngle) || 0;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const nx = -dy;
    const ny = dx;
    const spacing = Math.max(520, Number(level.currentSpacing) || 820);
    const width = Math.max(180, Number(level.currentWidth) || 300);
    const offset = Number(level.currentOffset) || level.n * 137;
    const levelNumber = Math.floor(Number(level.n) || 0);
    const positionSeed = (levelNumber * 977) | 0;
    const speedSeed = (levelNumber * 1597) | 0;
    const widthSeed = (levelNumber * 2081) | 0;
    const bounds = getViewBounds(120);
    const cx = (bounds.left + bounds.right) * 0.5;
    const cy = (bounds.top + bounds.bottom) * 0.5;
    const centerProjection = cx * nx + cy * ny;
    const extent = Math.abs(nx) * (bounds.right - bounds.left) * 0.5 + Math.abs(ny) * (bounds.bottom - bounds.top) * 0.5;
    const first = Math.floor((centerProjection - extent - offset) / spacing) - 1;
    const last = Math.ceil((centerProjection + extent - offset) / spacing) + 1;
    const length = Math.hypot(bounds.right - bounds.left, bounds.bottom - bounds.top) + 500;
    const flowProjection = cx * dx + cy * dy;
    const visualSpeed = 0.7 + Number(level.currentStrength) * 1.8;
    ctx.save();
    ctx.scale(camera.zoom || 1, camera.zoom || 1);
    ctx.translate(-camera.x, -camera.y);
    ctx.lineCap = 'round';
    for (let i = first; i <= last; i++) {
      const band = bandPosition(i, spacing, offset, positionSeed);
      const speed = bandSpeed(i, speedSeed);
      const currentWidth = bandWidth(i, width, widthSeed);
      const shift = band - centerProjection;
      const bx = cx + nx * shift;
      const by = cy + ny * shift;
      ctx.strokeStyle = 'rgba(80, 230, 205, 0.045)';
      ctx.lineWidth = currentWidth;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(bx - dx * length, by - dy * length);
      ctx.lineTo(bx + dx * length, by + dy * length);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(120, 255, 222, 0.24)';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([30, 42]);
      ctx.lineDashOffset = (flowProjection - length - simulationFrame * visualSpeed * speed) % 72;
      for (let lane = -1; lane <= 1; lane++) {
        const laneShift = lane * currentWidth * 0.23;
        ctx.beginPath();
        ctx.moveTo(bx + nx * laneShift - dx * length, by + ny * laneShift - dy * length);
        ctx.lineTo(bx + nx * laneShift + dx * length, by + ny * laneShift + dy * length);
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  window.triggerCampaignEnemyAlarm = function (x, y) {
    const level = activeLevel();
    const radius = Number(level?.enemyAlarmRadius) || 0;
    if (!level || radius <= 0 || !player) return;
    const radiusSq = radius * radius;
    const count = Math.max(1, Math.min(3, Math.floor(Number(level.enemyAlarmCount) || 1)));
    const duration = Math.max(90, Math.floor(Number(level.enemyAlarmDuration) || 240));
    let first = null;
    let second = null;
    let third = null;
    let firstDist = Infinity;
    let secondDist = Infinity;
    let thirdDist = Infinity;
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      if (enemy.radius <= player.radius * 1.03) continue;
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      const distance = dx * dx + dy * dy;
      if (distance > radiusSq) continue;
      if (distance < firstDist) {
        third = second; thirdDist = secondDist;
        second = first; secondDist = firstDist;
        first = enemy; firstDist = distance;
      } else if (distance < secondDist) {
        third = second; thirdDist = secondDist;
        second = enemy; secondDist = distance;
      } else if (distance < thirdDist) {
        third = enemy; thirdDist = distance;
      }
    }
    if (first) first.campaignAlarmTimer = first.campaignAlarmDuration = duration;
    if (count > 1 && second) second.campaignAlarmTimer = second.campaignAlarmDuration = duration;
    if (count > 2 && third) third.campaignAlarmTimer = third.campaignAlarmDuration = duration;
  };
})();
