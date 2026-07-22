const enemyAiFrameContext = {};

function prepareEnemyAiFrameContext() {
  const context = enemyAiFrameContext;
  context.endlessState = endlessMode ? getEndlessPressureState() : null;
  context.campaignLevel = !endlessMode && App.gameMode === 'campaign'
    ? App.campaignRun?.level || (typeof getActiveCampaignLevel === 'function' ? getActiveCampaignLevel() : null)
    : null;
  context.campaignThreat = window.getCampaignThreatProgress(context.campaignLevel);
  context.allowAmbush = context.campaignLevel?.allowAmbush !== false;
  context.allowSchool = context.campaignLevel?.allowSchool !== false;
  context.ambushChargeFrames = context.campaignLevel ? Math.round(70 - context.campaignThreat * 6) : 60;
  context.ambushCooldownFrames = context.campaignLevel ? Math.round(300 - context.campaignThreat * 60) : 300;
  context.endlessAggroScale = context.endlessState ? 1 + context.endlessState.pressure * 0.2 + context.endlessState.doomProgress * 0.34 : 1;
  context.endlessSpeedScale = context.endlessState ? 1 + context.endlessState.pressure * 0.08 + context.endlessState.doomProgress * 0.13 : 1;
  context.worldSpeedScale = getWorldSpeedScale();
  const isTouchDevice = typeof hasTouchControls === 'function' && hasTouchControls();
  const mobileGameplayScale = ENDLESS_CONFIG.MOBILE_GAMEPLAY_SPEED_SCALE ?? 0.9;
  const mobileEnemyScale = context.campaignLevel ? 0.9 : 0.85;
  const campaignEnemySpeedScale = context.campaignLevel ? Math.max(0.5, Number(context.campaignLevel.enemySpeedScale) || 1) : 1;
  context.enemyPlatformSpeedScale = (isTouchDevice ? mobileEnemyScale * mobileGameplayScale : (endlessMode ? 1.1 : 1)) * campaignEnemySpeedScale;
  context.lateGameScale = context.endlessState ? context.endlessState.lateGameScale : 0;
  context.viewSpan = Math.max(canvas.width, canvas.height) / Math.max(0.1, camera.zoom || 1);
  return context;
}

class EnemyAiMethods {
      update(player, foods, enemies, frameContext = prepareEnemyAiFrameContext()) {
        this.dirTimer -= 1;
        if (this.ambushCooldown > 0) this.ambushCooldown -= 1;
        if (this.campaignAlarmTimer > 0) this.campaignAlarmTimer -= 1;

        const endlessState = frameContext.endlessState;
        const campaignLevel = frameContext.campaignLevel;
        const campaignThreat = frameContext.campaignThreat;
        const allowAmbush = frameContext.allowAmbush;
        const allowSchool = frameContext.allowSchool;
        const ambushChargeFrames = frameContext.ambushChargeFrames;
        const ambushCooldownFrames = frameContext.ambushCooldownFrames;
        this.ambushChargeTarget = ambushChargeFrames;
        const endlessAggroScale = frameContext.endlessAggroScale;
        const endlessSpeedScale = frameContext.endlessSpeedScale;
        const worldSpeedScale = frameContext.worldSpeedScale;
        const enemyPlatformSpeedScale = frameContext.enemyPlatformSpeedScale;
        // РџСЂРѕРіСЂРµСЃСЃ late-game: 0 РІРЅРµ endless, 0..2.2 РІ endless. Р’Р»РёСЏРµС‚ РЅР°
        // СЃРєРѕСЂРѕСЃС‚СЊ, СЂРµР°РєС‚РёРІРЅРѕСЃС‚СЊ РїРѕРІРѕСЂРѕС‚Р°, СЃРёР»Сѓ Р·Р°СЃР°РґРЅРѕРіРѕ СЂС‹РІРєР°. Р­С‚Рѕ
        // РєР»СЋС‡РµРІР°СЏ РїРµСЂРµРјРµРЅРЅР°СЏ РґР»СЏ РЅР°СЂР°СЃС‚Р°РЅРёСЏ СЃР»РѕР¶РЅРѕСЃС‚Рё Рє С„РёРЅР°Р»Сѓ.
        const lateGameScale = frameContext.lateGameScale;
        const playerIsEdibleThreat = playerCanEatTarget(this);
        const campaignAlarmActive = this.campaignAlarmTimer > 0;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (typeof updateEnemySpikeShooter === 'function') {
          updateEnemySpikeShooter(this, player, dx, dy, dist, lateGameScale);
        }
        const viewSpan = frameContext.viewSpan;
        const aiDistanceTier = dist > viewSpan * 0.74 + 220
          ? 2
          : dist > viewSpan * 0.48 + 150
            ? 1
            : 0;
        const aiStride = aiDistanceTier === 2
          ? (simulationLoad > 120 || performanceQuality < 0.78 ? 6 : 4)
          : aiDistanceTier === 1
            ? (simulationLoad > 120 || performanceQuality < 0.78 ? 4 : 2)
            : 1;

        const baseRetargetInterval = simulationLoad > 180
          ? 7
          : simulationLoad > 125
            ? 6
            : simulationLoad > 90
              ? 5
              : 3;
        const distanceRetargetMultiplier = aiDistanceTier === 2 ? 3 : aiDistanceTier === 1 ? 2 : 1;
        const retargetInterval = (baseRetargetInterval + (Math.floor(this.visualSeed * 10) % 2)) * distanceRetargetMultiplier;

        if (!this.aiRetargetInterval || this.aiRetargetInterval !== retargetInterval) {
          this.aiRetargetInterval = retargetInterval;
          this.aiRetargetOffset = Math.floor(this.visualSeed * 60) % this.aiRetargetInterval;
          this.cachedTargets = this.cachedTargets ?? { closestFood: null, closestPrey: null, closestThreat: null };
        }

        if (this.dirTimer <= 0) {
          this.dirTimer = 60 + Math.random() * 120;
          this.vx += (Math.random() - 0.5) * (1.2 + this.agilityLevel * 0.18) * endlessSpeedScale * worldSpeedScale;
          this.vy += (Math.random() - 0.5) * (1.2 + this.agilityLevel * 0.18) * endlessSpeedScale * worldSpeedScale;

          const maxDirectionSpeed = (1.8 + this.tailLevel * 0.18) * (endlessState ? (1 + endlessState.pressure * 0.05) : 1) * worldSpeedScale;
          const directionSpeed = Math.hypot(this.vx, this.vy);
          if (directionSpeed > maxDirectionSpeed) {
            this.vx = (this.vx / directionSpeed) * maxDirectionSpeed;
            this.vy = (this.vy / directionSpeed) * maxDirectionSpeed;
          }
        }

        const canRunExpensiveAI = aiStride <= 1 || ((simulationFrame + this.aiRetargetOffset) % aiStride === 0);
        const shouldRefreshTargets = canRunExpensiveAI && (!this.cachedTargets || ((simulationFrame + this.aiRetargetOffset) % this.aiRetargetInterval === 0));
        if (shouldRefreshTargets) {
          this.cachedTargets = this.findNearbyTargets(player);
        }
        const { closestFood, closestPrey, closestThreat } = this.cachedTargets;

        // ---------------------------------------------------------------
        // РљРѕРЅРµС‡РЅС‹Р№ Р°РІС‚РѕРјР°С‚ РїРѕРІРµРґРµРЅРёСЏ (FSM).
        // Р РµС€РµРЅРёРµ РїРµСЂРµСЃС‡РёС‚С‹РІР°РµС‚СЃСЏ СЂР°Р· РІ ~30 РєР°РґСЂРѕРІ, РїР»СЋСЃ СЃ РіРёСЃС‚РµСЂРµР·РёСЃРѕРј
        // (С„Р»РёРїРїРµСЂСЃС‚РІР° РЅРµ Р±СѓРґРµС‚: РµСЃР»Рё РІ СЃРѕСЃС‚РѕСЏРЅРёРё 'hunt' вЂ” РёРіСЂРѕРє С‡СѓС‚СЊ РѕС‚РѕР№РґС‘С‚,
        // РЅРµ СЃСЂР°Р·Сѓ СЂР°Р·РІРѕСЂР°С‡РёРІР°РµРјСЃСЏ). РџР°СЂР°РјРµС‚СЂ aiPersonality [0..1) РґРµР»Р°РµС‚
        // РѕРґРёРЅР°РєРѕРІС‹С… РїРѕ СЂР°Р·РјРµСЂСѓ РІСЂР°РіРѕРІ РїРѕРІРµРґРµРЅС‡РµСЃРєРё СЂР°Р·РЅС‹РјРё.
        // ---------------------------------------------------------------
        this.aiStateTimer -= 1;

        // РђСЂС…РµС‚РёРї: Р±РѕР»СЊС€РѕР№ Рё С‚СЏР¶С‘Р»С‹Р№ РІСЂР°Рі в‰  СЋСЂРєРёР№ РјРµР»РєРёР№.
        // sizeArchetype = 0 в†’ СЋСЂРєРёР№ РјР°Р»С‹С€; 1 в†’ РєСЂСѓРїРЅС‹Р№ Р°РїРµРєСЃ.
        const sizeArchetype = clamp(
          (this.radius - GROWTH_CONFIG.START_RADIUS) /
            Math.max(1, GROWTH_CONFIG.TARGET_MAX_RADIUS - GROWTH_CONFIG.START_RADIUS),
          0,
          1.4
        );
        // Р”Р°Р»СЊРЅРѕСЃС‚СЊ РїСЂРµСЃР»РµРґРѕРІР°РЅРёСЏ Р·Р°РІРёСЃРёС‚ РѕС‚ СЂР°Р·РјРµСЂР° Рё Р»РёС‡РЅРѕСЃС‚Рё.
        const baseChase = (200 + sizeArchetype * 80 + this.aiPersonality * 70) * (1 + campaignThreat * 0.2);
        const playerChaseRange = baseChase + this.mawLevel * 18 + (campaignAlarmActive ? 260 : 0)
          + (endlessState ? endlessState.pressure * 26 + endlessState.doomProgress * 34 : 0);
        const playerFleeRange = 180 + this.agilityLevel * 22
          + (endlessState ? endlessState.pressure * 24 + endlessState.doomProgress * 44 : 0);

        // Р РµС€РµРЅРёРµ Рѕ СЃРѕСЃС‚РѕСЏРЅРёРё вЂ” СЂР°Р· РІ 30 РєР°РґСЂРѕРІ (~0.5 СЃРµРє). Р’ late-game
        // РёРЅС‚РµСЂРІР°Р» СЃРѕРєСЂР°С‰Р°РµС‚СЃСЏ РґРѕ ~16 РєР°РґСЂРѕРІ (~0.27 СЃРµРє) вЂ” РІСЂР°РіРё
        // РїСЂРёРЅРёРјР°СЋС‚ СЂРµС€РµРЅРёСЏ РїРѕС‡С‚Рё РІРґРІРѕРµ Р±С‹СЃС‚СЂРµРµ, С‡С‚Рѕ РѕР±СЉРµРєС‚РёРІРЅРѕ РґРµР»Р°РµС‚
        // РёС… СЂРµР°РєС‚РёРІРЅРµРµ Р±РµР· СѓРІРµР»РёС‡РµРЅРёСЏ С‡РёСЃР»Р° РІС‹С‡РёСЃР»РµРЅРёР№ СЃСѓРјРјР°СЂРЅРѕ.
        if (this.aiStateTimer <= 0 && canRunExpensiveAI) {
          const baseInterval = 28 + Math.floor(this.aiPersonality * 14);
          const lateReduction = Math.floor(lateGameScale * 8); // РґРѕ -17 РєР°РґСЂРѕРІ
          this.aiStateTimer = Math.max(12, baseInterval - lateReduction);

          let nextState = 'wander';

          // Р“Р»Р°РІРЅС‹Рµ СѓРіСЂРѕР·С‹ вЂ” РґСЂСѓРіРёРµ РєСЂСѓРїРЅС‹Рµ РІСЂР°РіРё Рё РёРіСЂРѕРє, РµСЃР»Рё РѕРЅ РєСЂСѓРїРЅРµРµ.
          const playerIsThreat = !playerIsEdibleThreat && player.radius > this.radius * 1.04 && dist < playerFleeRange;
          if (closestThreat || playerIsThreat) {
            nextState = 'flee';
          } else if (
            !playerIsEdibleThreat &&
            player.radius < this.radius * 0.97 &&
            dist < playerChaseRange &&
            // Р’ late-game Р»РёРјРёС‚ В«СѓСЃС‚Р°Р»РѕСЃС‚РёВ» СЂР°СЃС‚С‘С‚ СЃ 240 РґРѕ 540 вЂ” РІСЂР°РіРё
            // СѓРїРѕСЂРЅРµРµ, РѕС‚СЂС‹РІ С‚СЂРµР±СѓРµС‚ Р±РѕР»СЊС€Рµ СѓСЃРёР»РёР№.
            this.chasePersistence < 240 + lateGameScale * 150
          ) {
            // Р‘РѕР»СЊС€РёРµ/СЃРјРµР»С‹Рµ СЃ Р±РѕР»СЊС€РµР№ РІРµСЂРѕСЏС‚РЅРѕСЃС‚СЊСЋ РёРґСѓС‚ РІ Р·Р°СЃР°РґСѓ,
            // РјРµР»РєРёРµ вЂ” РІ РїСЂСЏРјСѓСЋ РїРѕРіРѕРЅСЋ.
            const ambushPreference = sizeArchetype * 0.5 + this.aiPersonality * 0.35;
            const ambushPreferenceThreshold = campaignLevel ? 0.2 - campaignThreat * 0.03 : 0.55;
            const canStartAmbush = !campaignLevel || (this.aiPersonality < 0.32 + campaignThreat * 0.18 && this.ambushCooldown <= 0);
            if (allowAmbush && canStartAmbush && dist > playerChaseRange * 0.55 && ambushPreference > ambushPreferenceThreshold && this.ambushCharge < ambushChargeFrames) {
              nextState = 'ambush';
            } else {
              nextState = 'hunt';
            }
          } else if (closestPrey && !playerIsEdibleThreat) {
            nextState = 'hunt';
        } else if (!endlessMode && closestFood) {
            nextState = 'forage';
          } else {
            // РњРµР»РєРёРµ РІСЂР°РіРё СЃРєР»РѕРЅРЅС‹ СЃР±РёРІР°С‚СЊСЃСЏ РІ СЃС‚Р°Рё; РєСЂСѓРїРЅС‹Рµ вЂ” РЅРµС‚.
            nextState = allowSchool && sizeArchetype < 0.35 && this.aiPersonality > 0.3 ? 'school' : 'wander';
          }

          // Р“РёСЃС‚РµСЂРµР·РёСЃ: РµСЃР»Рё С‚РѕР»СЊРєРѕ С‡С‚Рѕ Р·Р°РєРѕРЅС‡РёР»Рё РґРѕР»РіСѓСЋ РїРѕРіРѕРЅСЋ вЂ” РѕС‚РґРѕС…РЅС‘Рј.
          if (this.aiState === 'hunt' && this.chasePersistence > 200 + lateGameScale * 130 && nextState === 'hunt') {
            nextState = 'wander';
            this.chasePersistence = 0;
          }

          this.aiState = nextState;
        }

        if (campaignAlarmActive && !playerIsEdibleThreat && player.radius < this.radius * 0.97) {
          this.aiState = 'hunt';
          this.aiStateTimer = Math.max(this.aiStateTimer, 12);
          this.attackPulse = Math.max(this.attackPulse, 0.5 + Math.sin(simulationFrame * 0.16) * 0.12);
        }

        // РќР°РєРѕРїР»РµРЅРёРµ В«СѓСЃС‚Р°Р»РѕСЃС‚Рё РїРѕРіРѕРЅРёВ» вЂ” РЅСѓР¶РЅРѕ, С‡С‚РѕР±С‹ РёРіСЂРѕРє РјРѕРі СЂРµР°Р»СЊРЅРѕ СѓР№С‚Рё.
        if (this.aiState === 'hunt' && !playerIsEdibleThreat && player.radius < this.radius * 0.97) {
          this.chasePersistence += 1;
        } else {
          this.chasePersistence = Math.max(0, this.chasePersistence - 2);
        }

        // ---------------------------------------------------------------
        // РЎРѕСЃС‚РѕСЏРЅРёСЏ в†’ СЃРёР»С‹. РЎС‚Р°СЂС‹Рµ С„РѕСЂРјСѓР»С‹ РїСЂРµСЃР»РµРґРѕРІР°РЅРёСЏ / СѓР±РµРіР°РЅРёСЏ
        // РѕС‚ РёРіСЂРѕРєР° РѕСЃС‚Р°СЋС‚СЃСЏ РєР°Рє В«Р±Р°Р·РѕРІРѕРµ РїРѕРІРµРґРµРЅРёРµ СЂРµР°РєС†РёРёВ», РЅРѕ
        // РјРѕРґСѓР»РёСЂСѓСЋС‚СЃСЏ С‡РµСЂРµР· РјРЅРѕР¶РёС‚РµР»Рё СЃРѕСЃС‚РѕСЏРЅРёСЏ.
        // ---------------------------------------------------------------
        const stateChaseScale  = this.aiState === 'hunt'   ? 1.35
                              : this.aiState === 'ambush' ? 0.25
                              : this.aiState === 'school' ? 0.55
                              : 0.85;
        const stateFleeScale   = this.aiState === 'flee'   ? 1.3
                              : this.aiState === 'ambush' ? 0.7
                              : 1.0;
        const stateForageScale = this.aiState === 'forage' ? 1.3
                              : this.aiState === 'hunt'   ? 0.4
                              : this.aiState === 'flee'   ? 0.2
                              : 1.0;

        // Р‘Р°Р·РѕРІРѕРµ РїРѕРІРµРґРµРЅРёРµ РїРѕ РёРіСЂРѕРєСѓ (СЃ СѓС‡С‘С‚РѕРј СЃРѕСЃС‚РѕСЏРЅРёСЏ).
        if (!playerIsEdibleThreat && player.radius < this.radius * 0.97 && dist < playerChaseRange) {
          const chaseStrength = (0.042 + this.mawLevel * 0.004) * (1 + campaignThreat * 0.3) * endlessAggroScale * stateChaseScale * worldSpeedScale;
          this.vx += (dx / dist) * chaseStrength;
          this.vy += (dy / dist) * chaseStrength;
          this.attackPulse = Math.min(1, this.attackPulse + 0.016 * endlessAggroScale * stateChaseScale);
        } else if (playerIsEdibleThreat && dist < playerFleeRange) {
          const fleeStrength = (0.05 + this.agilityLevel * 0.005 + this.tailLevel * 0.002)
            * (endlessState ? 1 + endlessState.pressure * 0.22 + endlessState.doomProgress * 0.28 : 1)
            * stateFleeScale
            * worldSpeedScale;
          this.vx -= (dx / dist) * fleeStrength;
          this.vy -= (dy / dist) * fleeStrength;
          this.fleeShake = Math.min(1, this.fleeShake + 0.16);
        }

        this.isFleeing = Boolean(closestThreat || playerIsEdibleThreat);

        if (closestThreat) {
          const tx = closestThreat.x - this.x;
          const ty = closestThreat.y - this.y;
          const threatDist = Math.hypot(tx, ty) || 1;
          const strength = (0.05 + this.agilityLevel * 0.004) * stateFleeScale * worldSpeedScale;
          this.vx -= (tx / threatDist) * strength;
          this.vy -= (ty / threatDist) * strength;
          this.fleeShake = Math.min(1, this.fleeShake + 0.12);
        } else {
          this.fleeShake *= 0.9;
        }

        const fearShakeAmount = this.isFleeing ? this.fleeShake : 0;
        if (fearShakeAmount > 0.01) {
          const fearWave = this.swimPhase * 1.7 + this.visualSeed * 1.9;
          this.fleeShakeX = Math.sin(fearWave) * fearShakeAmount * 2.15;
          this.fleeShakeY = Math.cos(fearWave * 1.11 + 0.6) * fearShakeAmount * 1.6;
        } else {
          this.fleeShakeX = 0;
          this.fleeShakeY = 0;
        }

        if (!closestThreat && !playerIsEdibleThreat && closestPrey) {
          const tx = closestPrey.x - this.x;
          const ty = closestPrey.y - this.y;
          const preyDist = Math.hypot(tx, ty) || 1;
          const preyDrive = (0.03 + this.spikeLevel * 0.004 + this.mawLevel * 0.003)
            * endlessAggroScale * stateChaseScale * worldSpeedScale;
          this.vx += (tx / preyDist) * preyDrive;
          this.vy += (ty / preyDist) * preyDrive;
          this.attackPulse = Math.min(1, this.attackPulse + 0.018 * endlessAggroScale * stateChaseScale);
        } else if (!endlessMode && !closestThreat && closestFood) {
          const tx = closestFood.x - this.x;
          const ty = closestFood.y - this.y;
          const foodDist = Math.hypot(tx, ty) || 1;
          const foragePush = (0.022 + this.tentacleLevel * 0.003)
            * (endlessState ? (1 + endlessState.pressure * 0.05) : 1)
            * stateForageScale
            * worldSpeedScale;
          this.vx += (tx / foodDist) * foragePush;
          this.vy += (ty / foodDist) * foragePush;
        }

        // ---------------------------------------------------------------
        // Р”РѕРїРѕР»РЅРёС‚РµР»СЊРЅС‹Рµ СЃРѕСЃС‚РѕСЏРЅРёСЏ, РґР°СЋС‰РёРµ РёРіСЂРµ С…Р°СЂР°РєС‚РµСЂ.
        // ---------------------------------------------------------------

        // SCHOOLING вЂ” РјРµР»РєРёРµ РІСЂР°РіРё СЃР±РёРІР°СЋС‚СЃСЏ РІ СЃС‚Р°Р№РєРё.
        // РРјРїСѓР»СЊСЃ РїРµСЂРµСЃС‡РёС‚С‹РІР°РµС‚СЃСЏ С‚РѕР»СЊРєРѕ РІ retarget-С†РёРєР»Рµ (СЂР°Р· РІ ~5 РєР°РґСЂРѕРІ),
        // Р° РїСЂРёРјРµРЅСЏРµС‚СЃСЏ РєР°Р¶РґС‹Р№ РєР°РґСЂ С‡РµСЂРµР· РєСЌС€. Р­С‚Рѕ СѓР±РёСЂР°РµС‚ РґРѕСЂРѕРіРѕР№
        // getNearbyEnemies РёР· РіРѕСЂСЏС‡РµРіРѕ РїСѓС‚Рё.
        if (shouldRefreshTargets) {
          if (this.aiState === 'school' && closestPrey === null) {
            const schoolRange = 90;
            const schoolRangeSq = schoolRange * schoolRange;
            let mateX = 0, mateY = 0, mateCount = 0;
            const nearby = getNearbyEnemies(this.x, this.y, schoolRange);
            for (let n = 0; n < nearby.length; n++) {
              const mate = nearby[n];
              if (mate === this) continue;
              if (Math.abs(mate.radius - this.radius) > this.radius * 0.4) continue;
              const mdx = mate.x - this.x;
              const mdy = mate.y - this.y;
              const mdSq = mdx * mdx + mdy * mdy;
              if (mdSq < schoolRangeSq && mdSq > 1) {
                mateX += mdx; mateY += mdy; mateCount++;
              }
            }
            if (mateCount > 0) {
              const ax = mateX / mateCount;
              const ay = mateY / mateCount;
              const aLen = Math.hypot(ax, ay) || 1;
              this.schoolImpulseX = (ax / aLen) * 0.012 * worldSpeedScale;
              this.schoolImpulseY = (ay / aLen) * 0.012 * worldSpeedScale;
            } else {
              this.schoolImpulseX = 0;
              this.schoolImpulseY = 0;
            }
          } else {
            this.schoolImpulseX = 0;
            this.schoolImpulseY = 0;
          }
        }
        // РџСЂРёРјРµРЅСЏРµРј СЃРѕС…СЂР°РЅС‘РЅРЅС‹Р№ РёРјРїСѓР»СЊСЃ РєР°Р¶РґС‹Р№ РєР°РґСЂ (РґС‘С€РµРІРѕ).
        this.vx += this.schoolImpulseX;
        this.vy += this.schoolImpulseY;

        // AMBUSH вЂ” РїРѕС‡С‚Рё СЃС‚РѕРёРј, РєРѕРїРёРј Р·Р°СЂСЏРґ. РџРѕ РґРѕСЃС‚РёР¶РµРЅРёСЋ 60+ РєР°РґСЂРѕРІ вЂ”
        // РєРѕСЂРѕС‚РєРёР№ РІС‹Р±СЂРѕСЃ РІ СЃС‚РѕСЂРѕРЅСѓ РёРіСЂРѕРєР°, РїРѕСЃР»Рµ С‡РµРіРѕ РѕР±РЅСѓР»СЏРµРј Р·Р°СЂСЏРґ.
        // Р’ late-game РїРѕРґРіРѕС‚РѕРІРєР° РєРѕСЂРѕС‡Рµ (РґРѕ 30 РєР°РґСЂРѕРІ) вЂ” Р·Р°СЃР°РґС‹ С‡Р°С‰Рµ Рё
        // РЅРµРѕР¶РёРґР°РЅРЅРµРµ.
        if (this.aiState === 'ambush') {
          this.vx *= 0.93;
          this.vy *= 0.93;
          this.ambushCharge += 1;
          const ambushThreshold = campaignLevel ? ambushChargeFrames : Math.max(30, 60 - lateGameScale * 14);
          const ambushProgress = clamp(this.ambushCharge / Math.max(1, ambushThreshold), 0, 1);
          this.attackPulse = Math.max(this.attackPulse, 0.34 + ambushProgress * 0.5);
          this.swallowPulse = Math.max(this.swallowPulse, 0.12 + ambushProgress * 0.24);
          const centerVisible = isWithinBounds(this, getViewBounds(0), 0);
          if (this.ambushCharge > ambushThreshold && !playerIsEdibleThreat && centerVisible) {
            const burst = (1.6 + sizeArchetype * 0.6 + lateGameScale * 0.4) * (1 + campaignThreat * 0.12) * worldSpeedScale;
            this.vx += (dx / dist) * burst;
            this.vy += (dy / dist) * burst;
            this.attackPulse = 1;
            this.aiState = 'hunt';
            this.aiStateTimer = 40;
            this.ambushCharge = 0;
            this.ambushCooldown = ambushCooldownFrames;
          }
        } else {
          this.ambushCharge = Math.max(0, this.ambushCharge - 1);
        }

        if (this.spikeChargeTimer > 0) {
          this.vx *= 0.9;
          this.vy *= 0.9;
          this.attackPulse = Math.max(this.attackPulse, 0.72);
        }

        // Tentacle pull вЂ” СЂР°РЅСЊС€Рµ РёС‚РµСЂРёСЂРѕРІР°Р»СЃСЏ РїРѕ Р’РЎР•Рњ РµРґС‹ РєР°РґСЂ.
        // РџРµСЂРµРІРµР»Рё РЅР° spatial index: O(k) РІРјРµСЃС‚Рѕ O(n) РЅР° РІСЂР°РіР°.
        if (!endlessMode && this.hasTentacle && (aiDistanceTier === 0 || canRunExpensiveAI)) {
          const pullRange = this.radius + 34 + this.tentacleLevel * 18;
          const pullRangeSq = pullRange * pullRange;
          const pullFoods = getNearbyFoods(this.x, this.y, pullRange);
          for (let pi = 0; pi < pullFoods.length; pi++) {
            const food = pullFoods[pi];
            const tx = this.x - food.x;
            const ty = this.y - food.y;
            const pullDistSq = tx * tx + ty * ty;
            if (pullDistSq < pullRangeSq && pullDistSq > 1) {
              const pullDist = Math.sqrt(pullDistSq);
              const force = (1 - pullDist / pullRange) * (0.22 + this.tentacleLevel * 0.08);
              food.x += (tx / pullDist) * force;
              food.y += (ty / pullDist) * force;
            }
          }
        }

        // ---------------------------------------------------------------
        // РЎРєРѕСЂРѕСЃС‚СЊ Рё РїРѕРІРѕСЂРѕС‚.
        // lateGameScale (0..2.2) РґРѕР±Р°РІР»СЏРµС‚СЃСЏ Рє maxSpeed Рё agility-РїРѕРІРѕСЂРѕС‚Сѓ,
        // С‡С‚РѕР±С‹ РїРѕР·РґРЅСЏСЏ РёРіСЂР° СЃС‚Р°РЅРѕРІРёР»Р°СЃСЊ РѕР±СЉРµРєС‚РёРІРЅРѕ Р±С‹СЃС‚СЂРµРµ вЂ” РєСЂСѓРїРЅС‹Рµ
        // Р°РїРµРєСЃРЅС‹Рµ С…РёС‰РЅРёРєРё РґРѕР»Р¶РЅС‹ РЅР°РіРЅРµС‚Р°С‚СЊ СЃС‚СЂР°С…, Р° РЅРµ Р±С‹С‚СЊ В«РіСЂСѓР·РЅС‹РјРёВ».
        // ---------------------------------------------------------------
        const baseMaxSpeed = this.hasShield ? 2.1 : 2.35;
        const perkSpeedBonus = this.tailLevel * 0.26 + this.agilityLevel * 0.08;
        const shellPenalty = this.shellLevel * 0.07;
        const stateSpeedCap = this.aiState === 'hunt' ? 1.08
                             : this.aiState === 'flee' ? 1.12
                             : 1.0;
        // late-game СѓСЃРєРѕСЂРµРЅРёРµ: +0.45 Рє РјР°РєСЃРёРјР°Р»РєРµ Рє С„РёРЅР°Р»Сѓ endless.
        const lateSpeedBonus = lateGameScale * 0.28;
        const computedSpeed = (baseMaxSpeed + perkSpeedBonus - shellPenalty + lateSpeedBonus) * (1 + campaignThreat * 0.1) * stateSpeedCap * worldSpeedScale;
        const maxSpeed = Math.max((this.hasShield ? 1.14 : 1.26) * worldSpeedScale, computedSpeed);
        const currentSpeed = Math.hypot(this.vx, this.vy);
        if (currentSpeed > maxSpeed) {
          this.vx = (this.vx / currentSpeed) * maxSpeed;
          this.vy = (this.vy / currentSpeed) * maxSpeed;
        }

        this.x += this.vx * enemyPlatformSpeedScale;
        this.y += this.vy * enemyPlatformSpeedScale;

        this.vx *= 0.998;
        this.vy *= 0.998;

        const moveAngle = this.spikeChargeTimer > 0
          ? this.spikeAimAngle
          : Math.atan2(this.vy || Math.sin(this.visualSeed), this.vx || Math.cos(this.visualSeed));
        let angleDelta = moveAngle - this.displayAngle;
        while (angleDelta > Math.PI) angleDelta -= Math.PI * 2;
        while (angleDelta < -Math.PI) angleDelta += Math.PI * 2;
        this.turnTilt = clamp(angleDelta, -0.36, 0.36);
        // Р’СЂР°РіРё РІ late-game РїРѕРІРѕСЂР°С‡РёРІР°СЋС‚СЃСЏ РѕС‰СѓС‚РёРјРѕ Р¶РёРІРµРµ.
        const turnResponsiveness = this.spikeChargeTimer > 0
          ? 0.24 + this.agilityLevel * 0.018
          : 0.14 + this.agilityLevel * 0.018 + lateGameScale * 0.024 + campaignThreat * 0.025;
        this.displayAngle += angleDelta * turnResponsiveness;

        const animationCurrentSpeed = (currentSpeed * enemyPlatformSpeedScale) / Math.max(1, worldSpeedScale);
        this.swimPhase += 0.11 + animationCurrentSpeed * 0.12 + this.tailLevel * 0.02;
        this.eatPulse *= 0.9;
        this.attackPulse *= 0.92;
        this.swallowPulse *= 0.88;
        this.hurtPulse *= 0.86;
        this.damageFlash *= 0.84;
      }
}

const enemyAiDescriptors = Object.getOwnPropertyDescriptors(EnemyAiMethods.prototype);
delete enemyAiDescriptors.constructor;
Object.defineProperties(Enemy.prototype, enemyAiDescriptors);
