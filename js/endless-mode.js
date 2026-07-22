// Кеш для getEndlessPressureState: функция вызывается из update() каждого
// врага (десятки раз за кадр), а её значения зависят только от
// endlessTime/level/reward. Кешируем по endlessTime+session — пересчёт
// ровно раз на тик симуляции (60 раз/сек), а не раз на врага.
let _endlessPressureCache = null;
let _endlessPressureCacheKey = -1;

function resetEndlessPressureCache() {
  _endlessPressureCache = null;
  _endlessPressureCacheKey = -1;
}

function getEndlessPressureState() {
  // Ключ кеша — комбинация (endlessTime, endlessLevel, endlessRewardLevel).
  // endlessTime в каждом тике меняется на 1, остальные — изредка.
  const cacheKey = endlessTime * 100000 + endlessLevel * 100 + endlessRewardLevel;
  if (_endlessPressureCacheKey === cacheKey && _endlessPressureCache) {
    return _endlessPressureCache;
  }

  const wave = getEndlessWave();
  const levelProgress = clamp((endlessLevel - 1) / Math.max(1, PROGRESSION_CONFIG.ENDLESS_LEVELS - 1), 0, 1);
  const rewardProgress = clamp((endlessRewardLevel - 1) / Math.max(1, getEndlessRewardCap()), 0, 1);
  const waveProgress = Math.min(1.35, wave / 15);
  const timeProgress = Math.min(1.2, endlessTime / (60 * 60 * 7.5));
  const postEvolutionProgress = Math.max(
    0,
    levelProgress * 0.72 + rewardProgress * 0.54 + Math.max(0, wave - 10) * 0.06 - 0.74
  );
  const doomProgress = Math.min(
    1.9,
    postEvolutionProgress +
    Math.max(0, endlessLevel - Math.floor(PROGRESSION_CONFIG.ENDLESS_LEVELS * 0.8)) * 0.055 +
    Math.max(0, endlessRewardLevel - Math.floor(getEndlessRewardCap() * 0.8)) * 0.08 +
    Math.max(0, wave - 14) * 0.08 +
    Math.max(0, endlessTime - 60 * 60 * 8) / (60 * 60 * 6)
  );
  const basePressure = Math.min(
    2.5,
    levelProgress * 0.54 +
    rewardProgress * 0.28 +
    waveProgress * 0.34 +
    timeProgress * 0.18 +
    doomProgress * 0.58
  );

  // -----------------------------------------------------------------
  // Ритм волны: внутри каждой WAVE_SECONDS волны есть «всплеск» в
  // начале (первые 8 сек = ×1.18 давления) и «передышка» в конце
  // (последние 5 сек = ×0.82). Это превращает монотонную кривую в
  // дышащую — игрок чувствует ритм атак и пауз, что критично для
  // удержания внимания. Сама форма — гладкая (синус), без рывков.
  // -----------------------------------------------------------------
  const waveDurationFrames = ENDLESS_CONFIG.WAVE_SECONDS * 60;
  const waveLocalFrame = endlessTime % waveDurationFrames;
  const waveT = waveLocalFrame / waveDurationFrames; // 0..1 внутри волны
  // Cosine-bell: 0 в покое, +1 на пике в начале, -1 во время передышки.
  // Пик ~14% волны (≈2.5 сек), передышка ~85% (последние ~3 сек).
  const waveBeat = Math.cos(waveT * Math.PI * 2) * 0.5
                 + Math.cos(waveT * Math.PI) * 0.5;
  const waveBeatScale = 1 + waveBeat * 0.18;
  const pressure = clamp(basePressure * waveBeatScale, 0, 2.5);

  let stage = 'opening';
  if (pressure >= 1.38) {
    stage = 'apex';
  } else if (pressure >= 0.94) {
    stage = 'elite';
  } else if (pressure >= 0.4) {
    stage = 'hunt';
  }

  // waveBeat — также экспортируется наружу, чтобы спавн/враги
  // могли использовать ритм напрямую (например, делать всплеск
  // спавна только в первые секунды волны).
  // -----------------------------------------------------------------
  // lateGameScale — линейный множитель, отражающий, насколько игра
  // продвинулась в endless. Используется чтобы поздняя игра становилась
  // быстрее и опаснее: чем дольше игрок выживает, тем агрессивнее
  // враги, тем выше их скорость и реактивность. См. использование
  // в Enemy.update() для maxSpeed/turnSpeed/aiStateTimer.
  // Кривая: 0 в начале endless → 1 на середине → 2.2 в финале.
  // -----------------------------------------------------------------
  const lateGameScale = Math.min(
    1.5,
    levelProgress * 0.78 + rewardProgress * 0.38 + timeProgress * 0.34
  );

  _endlessPressureCache = {
    wave,
    levelProgress,
    rewardProgress,
    waveProgress,
    timeProgress,
    doomProgress,
    pressure,
    basePressure,
    waveBeat,
    waveT,
    stage,
    lateGameScale,
  };
  _endlessPressureCacheKey = cacheKey;
  return _endlessPressureCache;
}

function getEndlessWave() {
  return 5 + Math.floor(endlessTime / (ENDLESS_CONFIG.WAVE_SECONDS * 60));
}

function getEnemySpikeStartFrame() {
  return ENDLESS_CONFIG.WAVE_SECONDS * 60 * 4;
}

function getCampaignEnemyShotLevel() {
  if (endlessMode || App.gameMode !== 'campaign') return null;
  const level = typeof getCampaignLevelBalance === 'function' ? getCampaignLevelBalance() : null;
  return level?.allowEnemyShots ? level : null;
}

function isEnemySpikeModeActive() {
  return endlessMode
    ? endlessTime >= getEnemySpikeStartFrame()
    : !!getCampaignEnemyShotLevel();
}

function getEnemySpikeThreatProgress() {
  if (endlessMode) {
    return clamp((endlessTime - getEnemySpikeStartFrame()) / (60 * 180), 0, 1);
  }
  const level = getCampaignEnemyShotLevel();
  return level ? clamp((level.n - 51) / 29, 0, 0.72) : 0;
}
function isEnemyVisibleForSpikeShot(enemy) {
  if (!enemy) return false;
  const bounds = getViewBounds(0);
  return (
    enemy.x >= bounds.left &&
    enemy.x <= bounds.right &&
    enemy.y >= bounds.top &&
    enemy.y <= bounds.bottom
  );
}

function getCampaignActiveSpikeCharges() {
  let count = 0;
  for (let i = 0; i < enemies.length; i++) {
    if (enemies[i].spikeChargeTimer > 0) count += 1;
  }
  return count;
}

function canEnemyUseSpikeShot(enemy, player, dist) {
  if (!isEnemySpikeModeActive()) return false;
  const campaignLevel = getCampaignEnemyShotLevel();
  const projectileLimit = campaignLevel
    ? Math.max(3, Math.floor(Number(campaignLevel.enemyProjectileLimit) || 3))
    : SECONDARY_ENTITY_LIMITS.ENEMY_SPIKES_MAX;
  if (!enemy || !player || enemySpikes.length >= projectileLimit) return false;
  if (enemySpikeGlobalCooldown > 0) return false;
  if (campaignLevel) {
    const maxCharges = Math.max(1, Math.floor(Number(campaignLevel.enemyConcurrentShooters) || 1));
    if (getCampaignActiveSpikeCharges() >= maxCharges) return false;
  }
  if (campaignLevel && enemy.aiPersonality >= clamp(Number(campaignLevel.enemyShooterShare) || 0.1, 0, 1)) return false;
  const shooterRadius = campaignLevel
    ? Math.max(30, player.radius * 1.12)
    : Math.max(34, player.radius * 1.18);
  if (enemy.radius < shooterRadius) return false;
  if (playerCanEatTarget(enemy)) return false;
  if (!isEnemyVisibleForSpikeShot(enemy)) return false;

  const minDist = player.radius + enemy.radius + 96;
  const maxDist = Math.max(canvas.width, canvas.height) / Math.max(0.1, camera.zoom || 1) * 0.72;
  return dist > minDist && dist < maxDist;
}

function getEnemySpikeCooldownFrames() {
  const progress = getEnemySpikeThreatProgress();
  if (getCampaignEnemyShotLevel()) {
    return Math.round(randomRange(900, 1280) - progress * randomRange(140, 240));
  }
  return Math.round(randomRange(680, 980) - progress * randomRange(120, 220));
}

function getEnemySpikeGlobalCooldownFrames() {
  const progress = getEnemySpikeThreatProgress();
  if (getCampaignEnemyShotLevel()) {
    return Math.round(randomRange(440, 620) - progress * randomRange(80, 150));
  }
  return Math.round(randomRange(250, 360) - progress * randomRange(45, 90));
}

function spawnEnemySpike(enemy, angle) {
  const campaignLevel = getCampaignEnemyShotLevel();
  const projectileLimit = campaignLevel
    ? Math.max(3, Math.floor(Number(campaignLevel.enemyProjectileLimit) || 3))
    : SECONDARY_ENTITY_LIMITS.ENEMY_SPIKES_MAX;
  if (!enemy || enemySpikes.length >= projectileLimit) return;
  const pressure = endlessMode
    ? getEndlessPressureState()?.pressure ?? 0
    : 0.28 + getEnemySpikeThreatProgress() * 0.5;
  const doubleChance = campaignLevel ? clamp(Number(campaignLevel.enemyDoubleShotChance) || 0, 0, 1) : 0;
  const doubleShot = doubleChance > 0 && enemy.aiPersonality < doubleChance && enemy.radius > player.radius * 1.2 && enemySpikes.length + 1 < projectileLimit;
  if (doubleShot) {
    const spread = clamp(Number(campaignLevel.enemyDoubleShotSpread) || 0.18, 0.1, 0.28);
    enemySpikes.push(new EnemySpikeProjectile(enemy, angle - spread, pressure));
    enemySpikes.push(new EnemySpikeProjectile(enemy, angle + spread, pressure));
  } else {
    enemySpikes.push(new EnemySpikeProjectile(enemy, angle, pressure));
  }
  enemySpikeGlobalCooldown = getEnemySpikeGlobalCooldownFrames();
}

function updateEnemySpikeShooter(enemy, player, dx, dy, dist, lateGameScale = 0) {
  if (!enemy || !player) return;

  if (enemy.spikeChargeTimer > 0) {
    if (!isEnemySpikeModeActive()) {
      enemy.spikeChargeTimer = 0;
      enemy.spikeChargeDuration = 0;
      enemy.spikeShotCooldown = Math.max(enemy.spikeShotCooldown, 150);
      return;
    }

    enemy.spikeAimAngle = Math.atan2(dy, dx);
    let aimDelta = enemy.spikeAimAngle - enemy.displayAngle;
    while (aimDelta > Math.PI) aimDelta -= Math.PI * 2;
    while (aimDelta < -Math.PI) aimDelta += Math.PI * 2;
    enemy.displayAngle += clamp(aimDelta, -0.085, 0.085);
    enemy.turnTilt = clamp(aimDelta, -0.42, 0.42);
    enemy.spikeChargeTimer -= 1;
    enemy.attackPulse = Math.max(enemy.attackPulse, 0.62);
    enemy.swallowPulse = Math.max(enemy.swallowPulse, 0.22);

    if (enemy.spikeChargeTimer <= 0) {
      spawnEnemySpike(enemy, enemy.spikeAimAngle);
      enemy.spikeChargeDuration = 0;
      enemy.spikeShotCooldown = getEnemySpikeCooldownFrames();
    }
    return;
  }

  if (enemy.spikeShotCooldown > 0) {
    enemy.spikeShotCooldown -= 1;
    return;
  }

  if (!canEnemyUseSpikeShot(enemy, player, dist)) return;

  const progress = getEnemySpikeThreatProgress();
  const chargeDuration = Math.round(74 - progress * 10 - Math.min(5, lateGameScale * 1.5));
  enemy.spikeChargeDuration = Math.max(58, chargeDuration);
  enemy.spikeChargeTimer = enemy.spikeChargeDuration;
  if (getCampaignEnemyShotLevel()) enemySpikeGlobalCooldown = 18;
  enemy.spikeAimAngle = Math.atan2(dy, dx);
  enemy.aiState = 'ambush';
  enemy.aiStateTimer = Math.max(enemy.aiStateTimer, enemy.spikeChargeDuration + 10);
  enemy.attackPulse = 1;
}

function updateEnemySpikes() {
  if (enemySpikeGlobalCooldown > 0) enemySpikeGlobalCooldown -= 1;
  const despawnBounds = getViewBounds(WORLD_CONFIG.DESPAWN_MARGIN + 160);
  for (let i = enemySpikes.length - 1; i >= 0; i--) {
    const spike = enemySpikes[i];
    spike.update();

    if (
      spike.life <= 0 ||
      isOutsideBounds(spike, despawnBounds, spike.length + spike.radius + 24)
    ) {
      enemySpikes.splice(i, 1);
      continue;
    }

    if (player && isWithinDistance(player, spike, player.radius + spike.radius)) {
      const hitDx = player.x - spike.x;
      const hitDy = player.y - spike.y;
      const hitDist = Math.hypot(hitDx, hitDy) || 1;
      player.takeDamage(spike.damageAmount, spike.damageRadius);
      player.applyKnockback((hitDx / hitDist) * 2.8, (hitDy / hitDist) * 2.8, 9);
      enemySpikes.splice(i, 1);
    }
  }
}

function getEndlessPhaseScore() {
  return Math.max(0, score - endlessScoreBase);
}

function getEndlessEnemyTargetCount() {
  const state = getEndlessPressureState();
  const target =
    10 +
    Math.round(
      state.levelProgress * 2.8 +
      state.waveProgress * 2.5 +
      state.rewardProgress * 1.4 +
      state.doomProgress * 2.0 +
      state.lateGameScale * 3.2
    );
  return clamp(target, 10, PROGRESSION_CONFIG.ENEMY_ENDLESS_CAP);
}

function getEndlessEnemySpawnChance(deficit = 1, fromKill = false) {
  const state = getEndlessPressureState();
  const deficitRatio = clamp(deficit / Math.max(1, getEndlessEnemyTargetCount()), 0, 1);
  const baseChance = fromKill ? 0.58 : 0.15;
  const chance =
    baseChance +
    deficitRatio * (fromKill ? 0.34 : 0.26) +
    state.pressure * 0.06 +
    state.doomProgress * 0.07 +
    state.lateGameScale * 0.08;
  // Потолок для не-kill спавна повышен с 0.54 до 0.72 — поздняя игра
  // должна ощущаться плотнее, врагов появляется заметно больше в единицу
  // времени.
  return clamp(chance, fromKill ? 0.48 : 0.1, fromKill ? 0.96 : 0.72);
}

function getEndlessEnemySizeFactor() {
  const state = getEndlessPressureState();
  return 1 + Math.min(
    ENDLESS_CONFIG.MAX_SIZE_FACTOR_BONUS + 0.22,
    state.pressure * 0.88 + state.doomProgress * 0.42 + state.levelProgress * 0.18
  );
}

function getEndlessEnemyRadiusBand(enemy) {
  const state = getEndlessPressureState();
  const heroRadius = Math.max(GROWTH_CONFIG.START_RADIUS, player?.radius ?? GROWTH_CONFIG.START_RADIUS);
  const dynamicMaxCap = calculateEnemyRadiusCap(player);
  const preyFloorChance = clamp(0.26 - state.doomProgress * 0.035, 0.14, 0.26);
  const runtChance = clamp(
    0.2 - state.pressure * 0.035 - state.doomProgress * 0.03 + (state.stage === 'opening' ? 0.05 : 0),
    0.1,
    0.28
  );
  const edibleHunterChance = Math.max(0.06, preyFloorChance - runtChance);
  const apexChance = Math.min(0.3, 0.05 + state.pressure * 0.09 + state.doomProgress * 0.14);
  const hunterChance = clamp(0.42 - state.doomProgress * 0.04 + (state.stage === 'opening' ? 0.08 : 0), 0.24, 0.5);
  const roll = Math.random();

  if (roll < runtChance) {
    return {
      kind: 'runt',
      min: Math.max(16, heroRadius * 0.52),
      max: Math.min(dynamicMaxCap * 0.62, heroRadius * (0.82 + state.pressure * 0.03)),
    };
  }

  if (roll < runtChance + edibleHunterChance) {
    return {
      kind: 'hunter',
      min: Math.max(18, heroRadius * 0.76),
      max: Math.min(dynamicMaxCap * 0.78, heroRadius * (0.94 + state.pressure * 0.05 + state.doomProgress * 0.02)),
    };
  }

  if (roll > 1 - apexChance) {
    return {
      kind: 'apex',
      min: Math.max(heroRadius * (1.44 + state.pressure * 0.16), heroRadius + 10),
      max: Math.min(
        dynamicMaxCap,
        heroRadius * (1.98 + state.pressure * 0.34 + state.doomProgress * 0.3) + 14 + state.wave * 0.5
      ),
    };
  }

  if (roll < runtChance + hunterChance) {
    return {
      kind: 'hunter',
      min: Math.max(heroRadius * 0.92, 22),
      max: Math.min(
        dynamicMaxCap * 0.86,
        heroRadius * (1.18 + state.pressure * 0.14 + state.doomProgress * 0.06) + 6
      ),
    };
  }

  return {
    kind: 'bruiser',
    min: Math.max(heroRadius * (1.14 + state.pressure * 0.06), 24),
    max: Math.min(
      dynamicMaxCap * 0.96,
      heroRadius * (1.56 + state.pressure * 0.22 + state.doomProgress * 0.16) + 10 + state.wave * 0.18
    ),
  };
}

function tuneEnemyForEndless(enemy) {
  if (!endlessMode || !enemy) return enemy;

  const state = getEndlessPressureState();
  const band = getEndlessEnemyRadiusBand(enemy);
  const archetypeBonusTiers =
    band.kind === 'hunter'
      ? (Math.random() < 0.3 + state.pressure * 0.12 ? 1 : 0)
      : band.kind === 'bruiser'
        ? Math.min(2, 1 + Math.floor(state.pressure * 0.6 + state.doomProgress * 0.4))
        : band.kind === 'apex'
          ? Math.min(4, 2 + Math.floor(state.pressure * 0.7 + state.doomProgress * 1.25))
          : 0;

  if (band.kind === 'hunter') {
    applyArchetypeEnemyTiers(enemy, ['tail', 'agility', 'maw', 'spike'], archetypeBonusTiers);
  } else if (band.kind === 'bruiser') {
    applyArchetypeEnemyTiers(enemy, ['shell', 'maw', 'spike', 'tail'], archetypeBonusTiers);
  } else if (band.kind === 'apex') {
    applyArchetypeEnemyTiers(enemy, ['shell', 'maw', 'spike', 'tentacle', 'agility', 'tail'], archetypeBonusTiers);
  }

  const perkRadiusBonus = 1 + enemy.getTotalPerkLevels() * 0.03;
  const cappedMax = Math.min(calculateEnemyRadiusCap(player), Math.max(band.min + 2, band.max));
  const cappedMin = Math.min(band.min, Math.max(16, cappedMax - 2));
  enemy.radius = clamp(randomRange(cappedMin, cappedMax) * perkRadiusBonus, cappedMin, cappedMax);

  const archetypePredatorBonus =
    band.kind === 'hunter' ? 0.08 : band.kind === 'bruiser' ? 0.13 : band.kind === 'apex' ? 0.22 : 0.02;
  const archetypeFoodGrowth =
    band.kind === 'hunter' ? 0.08 : band.kind === 'bruiser' ? 0.15 : band.kind === 'apex' ? 0.24 : 0;
  const archetypeDamageReduction =
    band.kind === 'hunter' ? 0.02 : band.kind === 'bruiser' ? 0.08 : band.kind === 'apex' ? 0.12 : 0.01;
  const archetypeSpeedScale =
    band.kind === 'hunter' ? 0.13 : band.kind === 'bruiser' ? 0.05 : band.kind === 'apex' ? 0.11 : 0.02;

  enemy.predatorBonus += Math.min(ENDLESS_CONFIG.MAX_PREDATOR_BONUS + 0.24, 0.06 + state.pressure * 0.12 + state.doomProgress * 0.16 + archetypePredatorBonus);
  enemy.foodGrowthBonus = Math.min(2.85, enemy.foodGrowthBonus + state.pressure * 0.08 + state.doomProgress * 0.14 + archetypeFoodGrowth);
  enemy.damageReduction = Math.min(0.7, enemy.damageReduction + state.pressure * 0.04 + state.doomProgress * 0.07 + archetypeDamageReduction);
  const speedScale = 1 + Math.min(ENDLESS_CONFIG.MAX_SPEED_BONUS + 0.32, state.pressure * 0.09 + state.doomProgress * 0.15 + state.waveProgress * 0.04 + archetypeSpeedScale * 0.75);
  enemy.vx *= speedScale;
  enemy.vy *= speedScale;
  enemy.predatorBonus += Math.min(0.55, state.pressure * 0.08 + state.doomProgress * 0.14 + (band.kind === 'hunter' ? 0.06 : band.kind === 'apex' ? 0.1 : 0.03));
  enemy.endlessAggressionBonus = Math.min(1.1, state.pressure * 0.26 + state.doomProgress * 0.42 + (band.kind === 'hunter' ? 0.18 : band.kind === 'apex' ? 0.22 : 0.08));
  enemy.level = calculateLevelFromRadius(enemy.radius);
  return enemy;
}

function enterEndlessMode() {
  if (endlessMode) return;
  endlessMode = true;
  endlessTransition = 0;
  endlessTime = 0;
  endlessDifficulty = 0;
  endlessScoreBase = score;
  endlessLevel = 1;
  endlessRewardLevel = 1;
  enemySpikes = [];
  enemySpikeGlobalCooldown = 0;
  foods = foods.map(food => {
    food.fadeOut = 1;
    return food;
  });
}
