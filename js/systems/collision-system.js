function spawnShatterFood(x, y, amount) {
      const scatterRadius = 18;
      const scatterSpeedMin = 1.15;
      const scatterSpeedMax = 2.25;
      for (let i = 0; i < amount; i++) {
        const shard = new ShardFood(x, y);
        const angle = Math.random() * Math.PI * 2;
        const radial = Math.sqrt(Math.random());
        const burstRadius = scatterRadius * radial;
        const burstSpeed = randomRange(scatterSpeedMin, scatterSpeedMax);
        shard.x = x + Math.cos(angle) * burstRadius;
        shard.y = y + Math.sin(angle) * burstRadius;
        shard.vx += Math.cos(angle) * burstSpeed;
        shard.vy += Math.sin(angle) * burstSpeed;
        foods.push(shard);
      }
    }

    function playerCanEatTarget(target) {
      const mawModifier = player.mawLevel * 0.03;
      const spikeModifier = player.spikeLevel * 0.02;
      const combinedModifier = Math.min(0.08, mawModifier + spikeModifier);
      const dominanceRequirement = Math.max(
        1.01,
        ENEMY_EVOLUTION_CONFIG.DOMINANCE_RATIO - combinedModifier
      );
      return player.radius * player.predatorBonus > target.radius * dominanceRequirement;
    }

    function applyTentaclePull() {
      player.pullTargets = [];
      if (!player.hasTentacle) return;

      const pullRange = player.radius + 72 + player.tentacleLevel * 26;
      const pullRangeSq = pullRange * pullRange;
      const maxTargets = 2;
      const pullForce = 0.03 + player.tentacleLevel * 0.009;
      const mouth = getEntityMouthPosition(player);
      const lockedTargets = Array.isArray(player.tentacleLockedTargets)
        ? player.tentacleLockedTargets
        : [];
      const activeTargets = [];

      function isValidTarget(entity) {
        if (!entity) return false;
        const exists =
          foods.includes(entity) ||
          dnaOrbs.includes(entity) ||
          tomatoFoods.includes(entity) ||
          (enemies.includes(entity) && playerCanEatTarget(entity));
        if (!exists) return false;

        const dx = mouth.x - entity.x;
        const dy = mouth.y - entity.y;
        return dx * dx + dy * dy < pullRangeSq;
      }

      for (const entity of lockedTargets) {
        if (activeTargets.length >= maxTargets) break;
        if (isValidTarget(entity) && !activeTargets.includes(entity)) {
          activeTargets.push(entity);
        }
      }

      const freeSlots = maxTargets - activeTargets.length;
      const best = [];

      function tryRegisterTarget(entity) {
        if (activeTargets.includes(entity)) return;
        const dx = mouth.x - entity.x;
        const dy = mouth.y - entity.y;
        const distSq = dx * dx + dy * dy;
        if (distSq >= pullRangeSq) return;
        const candidate = { entity, distSq };
        if (best.length < freeSlots) {
          best.push(candidate);
          return;
        }
        if (freeSlots <= 0) return;
        let worstIndex = 0;
        for (let i = 1; i < best.length; i++) {
          if (best[i].distSq > best[worstIndex].distSq) worstIndex = i;
        }
        if (candidate.distSq >= best[worstIndex].distSq) return;
        best[worstIndex] = candidate;
      }

      if (freeSlots > 0) {
        const nearbyFoods = getNearbyFoods(mouth.x, mouth.y, pullRange, []);
        for (const food of nearbyFoods) {
          tryRegisterTarget(food);
        }

        for (const orb of dnaOrbs) {
          tryRegisterTarget(orb);
        }

        for (const tomato of tomatoFoods) {
          tryRegisterTarget(tomato);
        }

        const nearbyEnemies = getNearbyEnemies(mouth.x, mouth.y, pullRange, []);
        for (const enemy of nearbyEnemies) {
          if (!playerCanEatTarget(enemy)) continue;
          tryRegisterTarget(enemy);
        }
      }

      best.sort((a, b) => a.distSq - b.distSq);
      for (const item of best) {
        if (activeTargets.length >= maxTargets) break;
        activeTargets.push(item.entity);
      }

      player.tentacleLockedTargets = activeTargets;

      for (const entity of activeTargets) {
        const predictedX = entity.x + (entity.vx ?? 0) * 6;
        const predictedY = entity.y + (entity.vy ?? 0) * 6;
        const dx = mouth.x - predictedX;
        const dy = mouth.y - predictedY;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const nx = dx / dist;
        const ny = dy / dist;
        const force01 = 1 - dist / pullRange;
        const force = Math.max(0, force01) * pullForce;
        const pullStep = force * (24 + player.tentacleLevel * 3);
        const closeSnap = dist < player.radius * 1.9 ? (player.radius * 1.9 - dist) * 0.06 : 0;

        entity.x += nx * (pullStep + closeSnap);
        entity.y += ny * (pullStep + closeSnap);

        if (typeof entity.vx === 'number') {
          entity.vx = entity.vx * 0.9 + nx * force * 1.2;
        }
        if (typeof entity.vy === 'number') {
          entity.vy = entity.vy * 0.9 + ny * force * 1.2;
        }

        const attachPoint = getTentacleAttachPoint(mouth, entity);
        const worldRelX = attachPoint.x - player.x;
        const worldRelY = attachPoint.y - player.y;
        const cosA = Math.cos(player.angle);
        const sinA = Math.sin(player.angle);
        player.pullTargets.push({
          relX: worldRelX * cosA + worldRelY * sinA,
          relY: -worldRelX * sinA + worldRelY * cosA,
          side: (-worldRelX * sinA + worldRelY * cosA) >= 0 ? 1 : -1,
          seed: (entity.visualSeed ?? 0) + dist * 0.015,
        });
      }
    }

function handlePlayerCollisions() {
      applyTentaclePull();

      let foodsRemovedThisFrame = false;
      for (let i = foods.length - 1; i >= 0; i--) {
        const food = foods[i];

        if (food.life !== undefined && food.life <= 0) {
          playEatingSound();
            foods.splice(i, 1);
          foodsRemovedThisFrame = true;
          continue;
        }

        if (endlessMode && !(food instanceof ShardFood)) {
          food.fadeOut = (typeof food.fadeOut === 'number' ? food.fadeOut : 1) - ENDLESS_CONFIG.FOOD_FADE_SPEED;
          if (food.fadeOut <= 0) {
            foods.splice(i, 1);
            foodsRemovedThisFrame = true;
            continue;
          }
        }
      }

      if (foodsRemovedThisFrame) rebuildSpatialIndex();
      const nearbyPlayerFoods = getNearbyFoods(player.x, player.y, player.radius + 48, []);
      for (const food of nearbyPlayerFoods) {
        const foodIndex = foods.indexOf(food);
        if (foodIndex === -1) continue;
        if (!isWithinDistance(player, food, player.radius + food.radius)) continue;

        foods.splice(foodIndex, 1);
        playEatingSound();
        spawnFoodEatEffect(food, player);
        if (food instanceof ShardFood) {
          player.grow(0.10);
          addScore(ENDLESS_CONFIG.SCORE_PER_SHARD);
        } else {
          player.grow(0.32);
          addScore(ENDLESS_CONFIG.SCORE_PER_FOOD);
          if (typeof recordCampaignFood === 'function') recordCampaignFood();
        }

        if (!endlessMode && !(food instanceof ShardFood) && Math.random() < 0.18) {
          dnaOrbs.push(new DNAOrb(food.x, food.y));
        }
      }

      for (let i = dnaOrbs.length - 1; i >= 0; i--) {
        const orb = dnaOrbs[i];

        if (isWithinDistance(player, orb, player.radius + orb.radius + 2)) {
          dnaOrbs.splice(i, 1);
          playEatingSound();
          player.dna += 1;
          player.grow(endlessMode ? ENDLESS_CONFIG.ENDLESS_DNA_GROWTH : 0.95);
          addScore(endlessMode ? ENDLESS_CONFIG.SCORE_PER_ENDLESS_DNA : ENDLESS_CONFIG.SCORE_PER_DNA);
          if (typeof recordCampaignDna === 'function') recordCampaignDna();
          if (typeof recordCampaignFood === 'function') recordCampaignFood();
        }
      }

      for (let i = tomatoFoods.length - 1; i >= 0; i--) {
        const tomato = tomatoFoods[i];
        if (isWithinDistance(player, tomato, player.radius + tomato.radius + 2)) {
          tomatoFoods.splice(i, 1);
          playEatingSound();
          spawnFoodEatEffect(tomato, player, { particleCount: 10, ringCount: 2 });
          player.grow(endlessMode ? ENDLESS_CONFIG.TOMATO_ENDLESS_GROWTH : ENDLESS_CONFIG.TOMATO_GROWTH);
          addScore(ENDLESS_CONFIG.SCORE_PER_TOMATO);
          if (typeof recordCampaignTomato === 'function') recordCampaignTomato();
          if (typeof recordCampaignFood === 'function') recordCampaignFood();
        }
      }

      for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const contactRange = player.radius + enemy.radius * 0.9;

        if (isWithinDistance(player, enemy, contactRange)) {
          if (playerCanEatTarget(enemy)) {
            const shieldBlockedAttack = enemy.onAttack(player);
            if (shieldBlockedAttack) {
              continue;
            }

            enemy.receiveImpact(1);
            playEatingSound();
            spawnEnemyRemains(enemy, player);
            enemies.splice(i, 1);
            enemiesEatenThisRound += 1;
            if (typeof recordCampaignEnemy === 'function') recordCampaignEnemy();
            player.dna += endlessMode ? 1 : 3;
            player.grow((endlessMode ? 0.28 : 1.8) * (player.enemyGrowthBonus || 1));
            addScore(ENDLESS_CONFIG.SCORE_PER_ENEMY_BASE + enemy.radius * ENDLESS_CONFIG.SCORE_PER_ENEMY_RADIUS);
            if (dnaOrbs.length < SECONDARY_ENTITY_LIMITS.DNA_MAX) {
              dnaOrbs.push(new DNAOrb(enemy.x, enemy.y, endlessMode ? ENDLESS_CONFIG.ENDLESS_DNA_RADIUS : undefined));
            }

            if (player.hasShatter) {
              spawnShatterFood(enemy.x, enemy.y, 2 + player.shatterLevel * 2 + (endlessMode ? 1 : 0));
            }

            const endlessTargetEnemies = endlessMode && typeof getEndlessEnemyTargetCount === 'function' ? getEndlessEnemyTargetCount() : getTargetEnemyCount();
            const endlessSpawnChance = endlessMode && typeof getEndlessEnemySpawnChance === 'function'
              ? getEndlessEnemySpawnChance(Math.max(1, endlessTargetEnemies - enemies.length), true)
              : 0.9;
            const endlessSizeFactor = endlessMode && typeof getEndlessEnemySizeFactor === 'function' ? getEndlessEnemySizeFactor() : 1;
            if (Math.random() < endlessSpawnChance && enemies.length < endlessTargetEnemies) {
              spawnStreamEnemy((1 + Math.min(1.08, player.level * 0.06)) * endlessSizeFactor);
            }
          } else if (enemy.radius > player.radius * 1.02) {
            const endlessState = endlessMode && typeof getEndlessPressureState === 'function' ? getEndlessPressureState() : null;
            const lateGameScale = endlessState ? endlessState.lateGameScale : 0;
            const damageAmount = 10 + lateGameScale * 4;
            player.takeDamage(damageAmount, enemy.radius);
          }
        }
      }
    }
