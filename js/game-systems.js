    const SECONDARY_ENTITY_LIMITS = {
      DNA_MAX: 20,
      ENEMY_EAT_PARTICLES_MAX: 156,
      ENEMY_SPIKES_MAX: 6,
    };

    let foods = [];
    let dnaOrbs = [];
    let tomatoFoods = [];
    const spatialQueryScratch = [];
    let entitySpatialIndex = null;
    const enemyEatParticlePool = [];
    let enemyEatParticles = [];
    let enemySpikes = [];
    let enemySpikeGlobalCooldown = 0;
    let enemies = [];
    let player;
    let activePet = null;
    let gameOver = false;
    let victory = false;
    let evolutionPending = false;
    let endlessMode = false;
    let endlessTransition = 0;
    let score = 0;
    let scoreXpBonus = 0;
    let enemiesEatenThisRound = 0;
    let endlessTime = 0;
    let endlessDifficulty = 0;
    let endlessScoreBase = 0;
    let firstPhaseRewardLevel = 1;
    let endlessLevel = 1;
    let endlessRewardLevel = 1;
    let recoveryEvolutionCooldown = 0;
    let recoveryEvolutionPending = false;
    let evolutionRewardSource = 'normal';
    let currentChoices = [];
    let spawnFoodTimer = 0;
    let spawnDnaTimer = 0;
    let spawnTomatoTimer = 0;
    let runtimeSessionId = 0;

    
    class SpatialHashIndex {
      constructor(cellSize = 160) {
        this.cellSize = cellSize;
        this.invCellSize = 1 / cellSize;
        this.foodCells = new Map();
        this.enemyCells = new Map();
        this.foodBucketPool = [];
        this.enemyBucketPool = [];
      }

      _releaseBuckets(map, pool) {
        for (const bucket of map.values()) {
          bucket.length = 0;
          pool.push(bucket);
        }
        map.clear();
      }

      _cellCoord(value) {
        return Math.floor(value * this.invCellSize);
      }

      _cellKey(cx, cy) {
        const x = cx >= 0 ? cx * 2 : -cx * 2 - 1;
        const y = cy >= 0 ? cy * 2 : -cy * 2 - 1;
        const sum = x + y;
        return sum * (sum + 1) * 0.5 + y;
      }

      _insertIntoMap(map, pool, entity) {
        const cx = this._cellCoord(entity.x);
        const cy = this._cellCoord(entity.y);
        const key = this._cellKey(cx, cy);
        let bucket = map.get(key);
        if (!bucket) {
          bucket = pool.pop() || [];
          map.set(key, bucket);
        }
        bucket.push(entity);
      }

      rebuild(foodsList, enemiesList) {
        this._releaseBuckets(this.foodCells, this.foodBucketPool);
        this._releaseBuckets(this.enemyCells, this.enemyBucketPool);
        for (let i = 0; i < foodsList.length; i++) {
          this._insertIntoMap(this.foodCells, this.foodBucketPool, foodsList[i]);
        }
        for (let i = 0; i < enemiesList.length; i++) {
          this._insertIntoMap(this.enemyCells, this.enemyBucketPool, enemiesList[i]);
        }
      }

      collectNearby(map, x, y, range, out) {
        const minX = this._cellCoord(x - range);
        const maxX = this._cellCoord(x + range);
        const minY = this._cellCoord(y - range);
        const maxY = this._cellCoord(y + range);

        for (let cy = minY; cy <= maxY; cy++) {
          for (let cx = minX; cx <= maxX; cx++) {
            const bucket = map.get(this._cellKey(cx, cy));
            if (!bucket) continue;
            for (let i = 0; i < bucket.length; i++) {
              out.push(bucket[i]);
            }
          }
        }

        return out;
      }

      findEnemyTargets(source, includeFood, foodRange, preyRange, threatRange, out) {
        let closestFoodDistSq = Infinity;
        let closestPreyDistSq = Infinity;
        let closestThreatDistSq = Infinity;
        out.closestFood = null;
        out.closestPrey = null;
        out.closestThreat = null;

        if (includeFood) {
          const foodRangeSq = foodRange * foodRange;
          const minX = this._cellCoord(source.x - foodRange);
          const maxX = this._cellCoord(source.x + foodRange);
          const minY = this._cellCoord(source.y - foodRange);
          const maxY = this._cellCoord(source.y + foodRange);
          for (let cy = minY; cy <= maxY; cy++) {
            for (let cx = minX; cx <= maxX; cx++) {
              const bucket = this.foodCells.get(this._cellKey(cx, cy));
              if (!bucket) continue;
              for (let i = 0; i < bucket.length; i++) {
                const food = bucket[i];
                const dx = food.x - source.x;
                const dy = food.y - source.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < foodRangeSq && distSq < closestFoodDistSq) {
                  out.closestFood = food;
                  closestFoodDistSq = distSq;
                }
              }
            }
          }
        }

        const maxEnemyRange = Math.max(preyRange, threatRange);
        const preyRangeSq = preyRange * preyRange;
        const threatRangeSq = threatRange * threatRange;
        const minX = this._cellCoord(source.x - maxEnemyRange);
        const maxX = this._cellCoord(source.x + maxEnemyRange);
        const minY = this._cellCoord(source.y - maxEnemyRange);
        const maxY = this._cellCoord(source.y + maxEnemyRange);
        for (let cy = minY; cy <= maxY; cy++) {
          for (let cx = minX; cx <= maxX; cx++) {
            const bucket = this.enemyCells.get(this._cellKey(cx, cy));
            if (!bucket) continue;
            for (let i = 0; i < bucket.length; i++) {
              const enemy = bucket[i];
              if (enemy === source) continue;
              const dx = enemy.x - source.x;
              const dy = enemy.y - source.y;
              const distSq = dx * dx + dy * dy;
              if (
                enemy.radius > source.radius * ENEMY_EVOLUTION_CONFIG.DOMINANCE_RATIO &&
                distSq < threatRangeSq &&
                distSq < closestThreatDistSq
              ) {
                out.closestThreat = enemy;
                closestThreatDistSq = distSq;
              }
              if (
                source.canEatTarget(enemy) &&
                distSq < preyRangeSq &&
                distSq < closestPreyDistSq
              ) {
                out.closestPrey = enemy;
                closestPreyDistSq = distSq;
              }
            }
          }
        }

        return out;
      }

      tryEatNearbyFood(source, player, range, foodsList) {
        const minX = this._cellCoord(source.x - range);
        const maxX = this._cellCoord(source.x + range);
        const minY = this._cellCoord(source.y - range);
        const maxY = this._cellCoord(source.y + range);
        for (let cy = minY; cy <= maxY; cy++) {
          for (let cx = minX; cx <= maxX; cx++) {
            const bucket = this.foodCells.get(this._cellKey(cx, cy));
            if (!bucket) continue;
            for (let i = 0; i < bucket.length; i++) {
              const food = bucket[i];
              if (foodsList.indexOf(food) === -1) continue;
              if (source.tryEatFood(food, player)) return food;
            }
          }
        }
        return null;
      }

      tryEatNearbyEnemy(source, player, range, enemiesList, sourceIndex) {
        const minX = this._cellCoord(source.x - range);
        const maxX = this._cellCoord(source.x + range);
        const minY = this._cellCoord(source.y - range);
        const maxY = this._cellCoord(source.y + range);
        for (let cy = minY; cy <= maxY; cy++) {
          for (let cx = minX; cx <= maxX; cx++) {
            const bucket = this.enemyCells.get(this._cellKey(cx, cy));
            if (!bucket) continue;
            for (let i = 0; i < bucket.length; i++) {
              const prey = bucket[i];
              if (prey === source) continue;
              const preyIndex = enemiesList.indexOf(prey);
              if (preyIndex === -1 || preyIndex === sourceIndex) continue;
              if (source.tryEatEnemy(prey, player)) return prey;
            }
          }
        }
        return null;
      }

      queryFoods(x, y, range, out = []) {
        return this.collectNearby(this.foodCells, x, y, range, out);
      }

      queryEnemies(x, y, range, out = []) {
        return this.collectNearby(this.enemyCells, x, y, range, out);
      }
    }

    function getMaxSpatialQueryRange() {
      const baseEnemyRange = Math.max(
        ENEMY_EVOLUTION_CONFIG.FOOD_SEEK_RANGE + 4 * 26,
        ENEMY_EVOLUTION_CONFIG.PREY_SEEK_RANGE + 4 * 24 + 4 * 16,
        ENEMY_EVOLUTION_CONFIG.THREAT_AVOID_RANGE + 4 * 18
      );
      const playerPullRange = player
        ? player.radius + 72 + (player.tentacleLevel ?? 0) * 26
        : 220;
      return Math.max(baseEnemyRange, playerPullRange) + 24;
    }

    function rebuildSpatialIndex() {
      const desiredCellSize = Math.max(120, Math.round(getMaxSpatialQueryRange() * 0.5));
      if (!entitySpatialIndex || entitySpatialIndex.cellSize !== desiredCellSize) {
        entitySpatialIndex = new SpatialHashIndex(desiredCellSize);
      }
      entitySpatialIndex.rebuild(foods, enemies);
    }

    function getNearbyFoods(x, y, range, out = spatialQueryScratch) {
      out.length = 0;
      if (!entitySpatialIndex) return out;
      return entitySpatialIndex.queryFoods(x, y, range, out);
    }

    function getNearbyEnemies(x, y, range, out = spatialQueryScratch) {
      out.length = 0;
      if (!entitySpatialIndex) return out;
      return entitySpatialIndex.queryEnemies(x, y, range, out);
    }

    function findNearbyEnemyTargets(source, targetPlayer, out) {
      const result = out || { closestFood: null, closestPrey: null, closestThreat: null };
      if (!entitySpatialIndex) {
        result.closestFood = null;
        result.closestPrey = null;
        result.closestThreat = null;
        return result;
      }
      const foodRange = ENEMY_EVOLUTION_CONFIG.FOOD_SEEK_RANGE + source.tentacleLevel * 26;
      const preyRange = ENEMY_EVOLUTION_CONFIG.PREY_SEEK_RANGE + source.mawLevel * 24 + source.spikeLevel * 16;
      const threatRange = ENEMY_EVOLUTION_CONFIG.THREAT_AVOID_RANGE + source.agilityLevel * 18;
      const includeFood = !endlessMode && source.radius < source.getRadiusCap(targetPlayer) - 0.25;
      return entitySpatialIndex.findEnemyTargets(source, includeFood, foodRange, preyRange, threatRange, result);
    }

    function getEnemySpawnPerkCount() {
      const firstPhaseProgress = clamp(((player?.level ?? 1) - 1) / Math.max(1, PROGRESSION_CONFIG.FIRST_PHASE_LEVELS - 1), 0, 1);
      const endlessProgress = clamp((endlessLevel - 1) / Math.max(1, PROGRESSION_CONFIG.ENDLESS_LEVELS - 1), 0, 1);
      const rewardProgress = clamp((endlessRewardLevel - 1) / Math.max(1, getEndlessRewardCap()), 0, 1);
      const progress = Math.max(firstPhaseProgress, endlessProgress * 0.95, rewardProgress);

      if (endlessMode && typeof getEndlessPressureState === 'function') {
        const state = getEndlessPressureState();
        if (state.stage === 'opening') return Math.random() < 0.62 ? 1 : 2;
        if (state.stage === 'hunt') return Math.random() < 0.58 ? 2 : 3;
        return 3;
      }

      if (progress < 0.22) return 1;
      if (progress < 0.52) return Math.random() < 0.72 ? 2 : 1;
      if (progress < 0.82) return Math.random() < 0.8 ? 3 : 2;
      return 3;
    }

    function getEnemyPerkPool(source = ENEMY_PERK_CONFIG.BASE_PERKS) {
      return shuffleArray([...source]);
    }

    function getCampaignSurvivalTailTier(level) {
      if (!level || level.type !== 'survive' || Number(level.n) <= 10) return 0;
      const chapter = Math.max(2, Math.ceil(Number(level.n) / 10));
      const chapterStep = Math.min(8, chapter - 2);
      let elapsedProgress = 0;
      if (campaignRun && Number(campaignRun.level?.n) === Number(level.n)) {
        elapsedProgress = clamp(campaignRun.frames / Math.max(1, getCampaignTimeLimitFrames()), 0, 1);
      }
      const tailChance = Math.min(0.95, 0.3 + chapterStep * 0.09 + elapsedProgress * (0.1 + chapterStep * 0.01));
      if (Math.random() >= tailChance) return 0;
      if (chapter < 3) return 1;
      const tierTwoChance = Math.min(0.68, chapterStep * 0.08 + elapsedProgress * 0.15);
      return Math.random() < tierTwoChance ? 2 : 1;
    }

    function applyEnemyPerkTier(enemy, perkId, tiers = 1) {
      for (let i = 0; i < tiers; i++) {
        if (perkId === 'spike') {
          enemy.hasSpike = true;
          enemy.spikeLevel += 1;
          enemy.predatorBonus += 0.1;
        }

        if (perkId === 'tail') {
          enemy.hasTail = true;
          enemy.tailLevel += 1;
        }

        if (perkId === 'shell') {
          enemy.hasShell = true;
          enemy.shellLevel += 1;
          enemy.damageReduction = Math.min(0.52, enemy.damageReduction + 0.08);
        }

        if (perkId === 'maw') {
          enemy.hasMaw = true;
          enemy.mawLevel += 1;
          enemy.foodGrowthBonus = Math.min(1.95, enemy.foodGrowthBonus + 0.1);
          enemy.predatorBonus += 0.05;
        }

        if (perkId === 'tentacle') {
          enemy.hasTentacle = true;
          enemy.tentacleLevel += 1;
        }

        if (perkId === 'agility') {
          enemy.hasAgility = true;
          enemy.agilityLevel += 1;
        }
      }

      if (!enemy.perkIds.includes(perkId)) {
        enemy.perkIds.push(perkId);
      }
    }

    function getEnemyEndlessPerkBudget() {
      if (!endlessMode) return 0;
      const state = typeof getEndlessPressureState === 'function' ? getEndlessPressureState() : null;
      if (!state) return 0;
      return Math.min(
        PROGRESSION_CONFIG.ENEMY_MAX_PERK_TIERS,
        Math.floor(
          state.pressure * 2.2 +
          state.levelProgress * 2.9 +
          state.rewardProgress * 2.4 +
          state.wave * 0.13 +
          state.doomProgress * 2.8
        )
      );
    }

    function applyRandomEnemyPerks(enemy) {
      const campaignLevel = App.gameMode === 'campaign' ? getCampaignLevelBalance() : null;
      const survivalTailTier = getCampaignSurvivalTailTier(campaignLevel);
      if (survivalTailTier > 0) {
        applyEnemyPerkTier(enemy, 'tail', survivalTailTier);
        enemy.radius *= 1 + enemy.getTotalPerkLevels() * 0.03;
        enemy.level = calculateLevelFromRadius(enemy.radius);
        return enemy;
      }
      if (campaignLevel?.enemyPerks === false) return enemy;
      if (campaignLevel && Math.random() >= clamp(Number(campaignLevel.enemyPerkChance) || 0, 0, 1)) return enemy;
      const configuredPool = campaignLevel && Array.isArray(campaignLevel.enemyPerkPool)
        ? campaignLevel.enemyPerkPool
        : ENEMY_PERK_CONFIG.BASE_PERKS;
      const perkPool = getEnemyPerkPool(configuredPool);
      const campaignMaxPerks = campaignLevel
        ? Math.max(1, Math.floor(Number(campaignLevel.enemyMaxPerks) || 1))
        : ENEMY_PERK_CONFIG.MAX_PERKS;
      const perkCount = Math.min(campaignMaxPerks, getEnemySpawnPerkCount());

      for (let i = 0; i < perkCount; i++) {
        const perkId = perkPool[i];
        if (!perkId) break;
        enemy.applySpawnPerk(perkId);
      }
if (endlessMode) {
        let perkBudget = getEnemyEndlessPerkBudget();
        const bonusUniquePerks = Math.min(
          PROGRESSION_CONFIG.ENEMY_MAX_BONUS_PERKS,
          Math.floor(perkBudget / 2)
        );
        for (let i = perkCount; i < Math.min(perkPool.length, perkCount + bonusUniquePerks); i++) {
          applyEnemyPerkTier(enemy, perkPool[i], 1);
          perkBudget -= 1;
        }

        const enhancedPool = shuffleArray([...perkPool.slice(0, perkCount + bonusUniquePerks)]);
        let guard = 0;
        while (perkBudget > 0 && enhancedPool.length && guard < 32) {
          const perkId = enhancedPool[guard % enhancedPool.length];
          applyEnemyPerkTier(enemy, perkId, 1);
          perkBudget -= 1;
          guard += 1;
        }
      }

      enemy.radius *= 1 + enemy.getTotalPerkLevels() * 0.03;
      enemy.level = calculateLevelFromRadius(enemy.radius);
      return enemy;
    }

    function applyArchetypeEnemyTiers(enemy, perkIds, tierCount) {
      if (!tierCount || !perkIds.length) return;
      const pool = shuffleArray([...perkIds]);
      for (let i = 0; i < tierCount; i++) {
        const perkId = pool[i % pool.length];
        applyEnemyPerkTier(enemy, perkId, 1);
      }
    }

    function tuneCampaignEnemyRadius(enemy, level) {
      if (!enemy || !player || !level || Number(level.n) < 31) return enemy;

      let preyShare = 0.4;
      let rivalShare = 0.35;
      if (level.type === 'enemy') {
        preyShare = Number.isFinite(Number(level.preyShare)) ? Number(level.preyShare) : 0.48;
        rivalShare = 0.42;
      } else if (level.type === 'growth') {
        preyShare = 0.4;
        rivalShare = 0.35;
      } else if (level.type === 'survive') {
        preyShare = 0.2;
        rivalShare = 0.4;
      } else if (level.type === 'food' || level.type === 'dna') {
        preyShare = 0.45;
        rivalShare = 0.35;
      }

      rivalShare -= window.getCampaignThreatProgress(level) * 0.1;

      preyShare = clamp(preyShare, 0.15, 0.62);
      rivalShare = clamp(rivalShare, 0.2, 0.5);
      rivalShare = Math.min(rivalShare, 0.84 - preyShare);
      const heroRadius = Math.max(GROWTH_CONFIG.START_RADIUS, player.radius);
      const chapter = Math.max(4, Math.ceil(Number(level.n) / 10));
      const chapterStep = Math.min(6, chapter - 4);
      const perkScale = 1 + enemy.getTotalPerkLevels() * 0.03;
      const roll = Math.random();
      let minRadius;
      let maxRadius;

      if (roll < preyShare) {
        const combinedModifier = Math.min(0.08, player.mawLevel * 0.03 + player.spikeLevel * 0.02);
        const dominanceRequirement = Math.max(1.01, ENEMY_EVOLUTION_CONFIG.DOMINANCE_RATIO - combinedModifier);
        const edibleMax = player.radius * player.predatorBonus / dominanceRequirement * 0.97;
        minRadius = Math.max(10, edibleMax * 0.7);
        maxRadius = Math.max(minRadius + 1, edibleMax);
      } else if (roll < preyShare + rivalShare) {
        minRadius = heroRadius * 0.86;
        maxRadius = heroRadius * (1.04 + chapterStep * 0.006);
      } else {
        minRadius = heroRadius * (1.06 + chapterStep * 0.012);
        maxRadius = heroRadius * Math.min(1.42, 1.15 + chapterStep * 0.05);
      }

      const absoluteCap = GROWTH_CONFIG.TARGET_MAX_RADIUS * (ENEMY_EVOLUTION_CONFIG.MAX_RADIUS_MULTIPLIER || 2);
      enemy.radius = clamp(randomRange(minRadius, maxRadius) * perkScale, 10, absoluteCap);
      if (roll < preyShare) enemy.radius = Math.min(enemy.radius, maxRadius);
      enemy.level = calculateLevelFromRadius(enemy.radius);
      return enemy;
    }

function createEnemy(sizeFactor = 1) {
      if (App.gameMode === 'tutorial') {
        return window.JorTutorial?.createEnemy?.(sizeFactor) || new Enemy(sizeFactor);
      }
      let shieldChance = 0.16;
      const campaignLevel = App.gameMode === 'campaign' ? getCampaignLevelBalance() : null;
      if (campaignLevel && Number.isFinite(Number(campaignLevel.shieldChance))) {
        shieldChance = clamp(Number(campaignLevel.shieldChance), 0, 1);
      } else if (campaignLevel && Number(campaignLevel.n) >= 41) {
        const shieldProgress = clamp((Number(campaignLevel.n) - 41) / 59, 0, 1);
        shieldChance = (0.05 + shieldProgress * 0.27) * (campaignLevel.type === 'enemy' ? 0.82 : 1);
      }
      if (endlessMode && typeof getEndlessPressureState === 'function') {
        const endlessState = getEndlessPressureState();
        shieldChance = Math.min(0.28, 0.12 + endlessState.pressure * 0.05 + endlessState.doomProgress * 0.03);
      }
      const enemy = Math.random() < shieldChance ? new ShieldEnemy(sizeFactor) : new Enemy(sizeFactor);
      const evolvedEnemy = applyRandomEnemyPerks(enemy);
      if (campaignLevel && Number(campaignLevel.n) >= 31) {
        return tuneCampaignEnemyRadius(evolvedEnemy, campaignLevel);
      }
      if (campaignLevel?.preyShare > 0 && Math.random() < campaignLevel.preyShare) {
        const stage = Math.max(1, Math.floor(campaignLevel.preyGrowthStage || 1));
        const huntRadius = GROWTH_CONFIG.START_RADIUS + stage * GROWTH_CONFIG.GROWTH_STAGE_RADIUS_STEP;
        const edibleRadius = huntRadius / ENEMY_EVOLUTION_CONFIG.DOMINANCE_RATIO;
        evolvedEnemy.radius = randomRange(Math.max(10, edibleRadius * 0.84), edibleRadius * 0.97);
        evolvedEnemy.level = calculateLevelFromRadius(evolvedEnemy.radius);
      }
      return evolvedEnemy;
    }

    function applyCampaignStartConditions() {
      const level = getCampaignLevelBalance();
      if (!level || !player) return;

      const stage = clamp(
        Math.floor(Number(level.startGrowthStage) || 0),
        0,
        GROWTH_CONFIG.VISUAL_GROWTH_STAGES - 1
      );
      if (stage > 0) {
        player.growthStage = stage;
        player.highestGrowthStage = stage;
        player.radius = Math.min(
          GROWTH_CONFIG.TARGET_MAX_RADIUS,
          GROWTH_CONFIG.START_RADIUS + stage * GROWTH_CONFIG.GROWTH_STAGE_RADIUS_STEP
        );
        player.cameraRadius = player.radius;
        player.level = calculateLevelFromRadius(player.radius);
      }

      const mutations = Array.isArray(level.startingMutations) ? level.startingMutations : [];
      for (let i = 0; i < mutations.length; i++) {
        player.applyMutation(mutations[i]);
      }

      while (
        firstPhaseRewardLevel <= getFirstPhaseRewardCap() &&
        firstPhaseRewardLevel * PROGRESSION_CONFIG.REWARD_EVERY_LEVELS <= player.level
      ) {
        firstPhaseRewardLevel += 1;
      }
    }

    function addScore(amount) {
      const baseAmount = Math.max(0, Math.round(amount));
      score += baseAmount * (1 + scoreXpBonus);
    }


function resetGame() {
      runtimeSessionId += 1;
      if (typeof clearRenderWarmupQueue === 'function') clearRenderWarmupQueue();
      updateWorldSize({ keepExisting: false });
      world.seed = Math.max(1, Math.floor(Math.random() * 2147483647));
      player = new Player();
      scoreXpBonus = Math.max(0, Number(window.JorShopUI?.getBonuses?.().xp || 0))
        + Math.max(0, Number(window.JorDailyBonus?.getScoreBonus?.() || 0));
      const selectedPetId = App.gameMode === 'tutorial' ? '' : window.JorShopUI?.selectedPetId?.() || '';
      activePet = selectedPetId && typeof PlayerPet === 'function' ? new PlayerPet(selectedPetId, player) : null;
      camera.x = player.x - canvas.width * 0.5;
      camera.y = player.y - canvas.height * 0.5;
      foods = [];
      dnaOrbs = [];
      tomatoFoods = [];
      ambientParticles = [];
      backgroundGlows = [];
      backgroundBubbles = [];
      backgroundBlooms = [];
      entitySpatialIndex = null;
      spatialQueryScratch.length = 0;
      enemyEatParticlePool.length = 0;
      enemyEatParticles = [];
      enemySpikes = [];
      enemySpikeGlobalCooldown = 0;
      enemies = [];
      gameOver = false;
      victory = false;
      evolutionPending = false;
      endlessMode = false;
      endlessTransition = 0;
      score = 0;
      enemiesEatenThisRound = 0;
      displayedTopScore = 0;
      lastPoppedTopScore = 0;
      topScorePopTimer = 0;
      endlessTime = 0;
      endlessDifficulty = 0;
      endlessScoreBase = 0;
      firstPhaseRewardLevel = 1;
      endlessLevel = 1;
      endlessRewardLevel = 1;
      recoveryEvolutionCooldown = 0;
      recoveryEvolutionPending = false;
      evolutionRewardSource = 'normal';
      currentChoices = [];
      mutationOfferCounts = {};
      App.evolutionChoiceLockedUntil = 0;
      if (App.evolutionChoiceUnlockTimer) {
        clearTimeout(App.evolutionChoiceUnlockTimer);
        App.evolutionChoiceUnlockTimer = null;
      }
      if (typeof resetMobileStick === 'function') resetMobileStick();
      spawnFoodTimer = 0;
      spawnDnaTimer = 0;
      const campaignLevel = getCampaignLevelBalance();
      spawnTomatoTimer = Math.max(1, Math.floor(Number(campaignLevel?.tomatoFirstSpawnFrames) || 240));
      dashRequested = false;
      simulationLoad = 0;
      fxShadowScale = 1;
      renderDetailScale = 1;
      performanceQuality = 1;
      averageFrameMs = 1000 / 60;
      frameTime = 0;
      fixedStepAccumulator = 0;
      lastLoopTime = 0;
      simulationFrame = 0;
      if (typeof invalidateEndlessPressureCache === 'function') invalidateEndlessPressureCache();
      hudDirty = true;
      lastHudRenderFrame = -999;
      App.rewardedUsedThisEvolution = false;
      App.localPause = App.startScreenVisible;
      if (App.userPaused) {
        App.userPaused = false;
        hidePauseOverlay();
      }
      App.lastLeaderboardScore = 0;
      App.lastLeaderboardEntries = null;
      App.lastLeaderboardAuthorized = false;

      hideCenterMessage();
      hideElement(DOM.overlay);
      hideElement(DOM.evolutionPanel);
      if (DOM.topProgressScore) {
        DOM.topProgressScore.textContent = '0';
        DOM.topProgressScore.classList.remove('pop');
      }
      if (DOM.campaignTimer) {
        DOM.campaignTimer.classList.remove('visible', 'danger');
        DOM.campaignTimer.setAttribute('aria-hidden', 'true');
      }
      if (DOM.messageTitle) {
        DOM.messageTitle.dataset.messageKey = '';
      }
      if (DOM.messageText) {
        DOM.messageText.dataset.messageMode = 'text';
        DOM.messageText.className = '';
        DOM.messageText.textContent = '';
      }

      if (App.hasStarted && !App.startScreenVisible) {
        markGameplayStart();
      } else {
        markGameplayStop();
      }

      applyCampaignStartConditions();
      window.JorTutorial?.onRunStarted?.(player);
      if (typeof startCampaignRunIfNeeded === 'function') startCampaignRunIfNeeded();
      setupAmbient();
      seedInitialEntities();
      rebuildSpatialIndex();
      scheduleRoundRenderWarmup();
      updateCamera(true);
    }

    function updateEnemyEvolution() {

      if (App.gameMode === 'tutorial') {
        rebuildSpatialIndex();
        return;
      }

      if (!endlessMode) {
        for (const enemy of enemies) {
          const eatRange = enemy.radius + 26;
          const food = entitySpatialIndex?.tryEatNearbyFood(enemy, player, eatRange, foods);
          if (food) {
            const foodIndex = foods.indexOf(food);
            enemy.triggerSwallow(food instanceof ShardFood ? 0.42 : 0.72);
            foods.splice(foodIndex, 1);
          }
        }
      }

      rebuildSpatialIndex();

      for (let i = enemies.length - 1; i >= 0; i--) {
        const hunter = enemies[i];
        const preyRange = hunter.radius + ENEMY_EVOLUTION_CONFIG.PREY_SEEK_RANGE + hunter.mawLevel * 24 + hunter.spikeLevel * 16;
        const prey = entitySpatialIndex?.tryEatNearbyEnemy(hunter, player, preyRange, enemies, i);
        const preyEaten = Boolean(prey);
        if (prey) {
          const preyIndex = enemies.indexOf(prey);
          spawnEnemyEatEffect(prey, hunter);
          enemies.splice(preyIndex, 1);
          if (preyIndex < i) {
            i -= 1;
          }
        }

        if (preyEaten) {
          rebuildSpatialIndex();
        }

        if (preyEaten && enemies.length <= 0) {
          break;
        }
      }
    }

    function updateGame() {
      if (gameOver || victory || evolutionPending || App.localPause || App.platformPaused || App.orientationBlocked || App.userPaused) return;
      simulationFrame += 1;
      hudDirty = true;

      updateEndlessProgression();
      player.update();
      if (activePet) activePet.update(player);
      updateRenderBudget();
      rebuildSpatialIndex();

      const ambientStride = simulationLoad > 180 || performanceQuality < 0.78 ? 2 : 1;
      if (ambientStride === 1 || simulationFrame % ambientStride === 0) {
        const glowBounds = getViewBounds(WORLD_CONFIG.DESPAWN_MARGIN + 260);
        const bubbleBounds = getViewBounds(WORLD_CONFIG.DESPAWN_MARGIN + 120);
        const bloomBounds = getViewBounds(WORLD_CONFIG.DESPAWN_MARGIN + 90);
        const particleBounds = getViewBounds(WORLD_CONFIG.DESPAWN_MARGIN + 80);
        for (const glow of backgroundGlows) glow.update(glowBounds, ambientStride);
        for (const bubble of backgroundBubbles) bubble.update(bubbleBounds, ambientStride);
        for (const bloom of backgroundBlooms) bloom.update(bloomBounds, ambientStride);
        for (const particle of ambientParticles) particle.update(particleBounds, ambientStride);
      }
      for (const food of foods) {
        if (food instanceof ShardFood) food.update();
      }
      const shouldThrottleSecondary = simulationLoad > 150 && (simulationFrame % 2 === 1);
      for (const orb of dnaOrbs) {
        if (!shouldThrottleSecondary || !isEntityFarOutsideView(orb, 120)) orb.update();
      }
      for (const tomato of tomatoFoods) {
        if (!shouldThrottleSecondary || !isEntityFarOutsideView(tomato, 120)) tomato.update();
      }
      updateEnemyEatEffects();
      if (typeof updateEnemySpikes === 'function') updateEnemySpikes();
      trimSecondaryVisualLoad();
      const enemyAiContext = prepareEnemyAiFrameContext();
      for (const enemy of enemies) enemy.update(player, foods, enemies, enemyAiContext);
      if (typeof applyCampaignCurrents === 'function') applyCampaignCurrents();

      handlePlayerCollisions();
      window.JorTutorial?.update?.(player, enemiesEatenThisRound);
      updateEnemyEvolution();
      cullStreamedEntities();
      refillAmbientParticles();

      const targetFoodCount = endlessMode ? 0 : getTargetFoodCount();
      if (foods.length < targetFoodCount) {
        spawnFoodTimer -= 1;
        if (spawnFoodTimer <= 0) {
          spawnFoodTimer = 3;
          const foodToSpawn = Math.min(targetFoodCount - foods.length, getFoodSpawnBatchSize());
          spawnStreamFood(foodToSpawn);
        }
      }

      const campaignLevel = getCampaignLevelBalance();
      const tomatoMaxCount = App.gameMode === 'tutorial'
        ? 0
        : endlessMode
          ? ENDLESS_CONFIG.TOMATO_MAX_COUNT
          : Math.max(1, Math.floor(Number(campaignLevel?.tomatoMaxCount) || ENDLESS_CONFIG.TOMATO_MAX_COUNT));
      if (tomatoFoods.length < tomatoMaxCount) {
        spawnTomatoTimer -= 1;
        if (spawnTomatoTimer <= 0) {
          spawnTomatoTimer = endlessMode
            ? ENDLESS_CONFIG.TOMATO_ENDLESS_SPAWN_FRAMES
            : Math.max(1, Math.floor(Number(campaignLevel?.tomatoRespawnFrames) || ENDLESS_CONFIG.TOMATO_SPAWN_FRAMES));
          const spawn = randomOffscreenWorldPosition({
            padding: 44,
            minDistanceFromPlayer: WORLD_CONFIG.SAFE_PLAYER_RADIUS + 70,
          });
          const tomato = createTomatoFoodAt(spawn.x, spawn.y);
          tomatoFoods.push(tomato);
          if (typeof scheduleRenderWarmupTask === 'function') {
            scheduleRenderWarmupTask(() => warmTomatoFoodSprite(tomato));
          }
        }
      }

      spawnDnaTimer -= 1;
      if (spawnDnaTimer <= 0) {
        spawnDnaTimer = endlessMode ? ENDLESS_CONFIG.ENDLESS_DNA_SPAWN_FRAMES : 300;
        if (dnaOrbs.length < getTargetDnaCount()) {
          spawnStreamDna(endlessMode ? ENDLESS_CONFIG.ENDLESS_DNA_SPAWN_BATCH : 1);
        }
      }

      const targetEnemies = endlessMode && typeof getEndlessEnemyTargetCount === 'function' ? getEndlessEnemyTargetCount() : getTargetEnemyCount();
      const enemySpawnChance = endlessMode && typeof getEndlessEnemySpawnChance === 'function'
        ? getEndlessEnemySpawnChance(Math.max(1, targetEnemies - enemies.length), false)
        : 0.11;
      const enemySizeFactor = endlessMode && typeof getEndlessEnemySizeFactor === 'function' ? getEndlessEnemySizeFactor() : 1;
      if (enemies.length < targetEnemies && Math.random() < enemySpawnChance) {
        spawnStreamEnemy((1 + Math.min(1.12, player.level * 0.055)) * enemySizeFactor);
      }

      if (handlePostSimulationProgression()) return;
    }

function getEnemyDecorQuality() {
      if (enemies.length > 30 || renderDetailScale < 0.76) return 0;
      if (enemies.length > 22 || renderDetailScale < 0.88) return 1;
      return 2;
    }

    function shouldRenderEnemyDecor() {
      return getEnemyDecorQuality() >= 1;
    }

    function shouldRenderEnemyMicroDecor() {
      return getEnemyDecorQuality() >= 2;
    }

    function updateRenderBudget() {
      const activeLoad =
        enemies.length +
        enemyEatParticles.length * 0.34 +
        dnaOrbs.length * 0.25 +
        tomatoFoods.length * 0.22 +
        foods.length * 0.08;

      simulationLoad = activeLoad;
      const quality = typeof performanceQuality === 'number' ? performanceQuality : 1;
      const loadShadowScale = activeLoad > 170 ? 0.48 : activeLoad > 120 ? 0.64 : activeLoad > 82 ? 0.78 : 1;
      const loadDetailScale = activeLoad > 170 ? 0.52 : activeLoad > 120 ? 0.68 : activeLoad > 82 ? 0.84 : 1;
      fxShadowScale = loadShadowScale * (0.58 + quality * 0.42);
      renderDetailScale = loadDetailScale * (0.62 + quality * 0.38);
    }
