    const SECONDARY_ENTITY_LIMITS = {
      DNA_MAX: 20,
      REMAINS_MAX: 12,
      FOOD_EAT_PARTICLES_MAX: 132,
      ENEMY_EAT_PARTICLES_MAX: 156,
      ENEMY_EAT_BURSTS_MAX: 28,
      ENEMY_SPIKES_MAX: 6,
    };

    let foods = [];
    let dnaOrbs = [];
    let tomatoFoods = [];
    let remains = [];
    const spatialQueryScratch = [];
    let entitySpatialIndex = null;
    const foodEatParticlePool = [];
    const enemyEatParticlePool = [];
    const foodEatBurstPool = [];
    const enemyEatBurstPool = [];
    const remainsPool = [];
    let foodEatParticles = [];
    let foodEatBursts = [];
    let enemyEatParticles = [];
    let enemyEatBursts = [];
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
    let enemiesEatenThisRound = 0;
    let endlessTime = 0;
    let endlessDifficulty = 0;
    let endlessScoreBase = 0;
    let firstPhaseRewardLevel = 1;
    let endlessLevel = 1;
    let endlessRewardLevel = 1;
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
      }

      clear() {
        this.foodCells.clear();
        this.enemyCells.clear();
      }

      _cellCoord(value) {
        return Math.floor(value * this.invCellSize);
      }

      _cellKey(cx, cy) {
        return `${cx},${cy}`;
      }

      _insertIntoMap(map, entity) {
        const cx = this._cellCoord(entity.x);
        const cy = this._cellCoord(entity.y);
        const key = this._cellKey(cx, cy);
        let bucket = map.get(key);
        if (!bucket) {
          bucket = [];
          map.set(key, bucket);
        }
        bucket.push(entity);
      }

      rebuild(foodsList, enemiesList) {
        this.clear();
        for (const food of foodsList) this._insertIntoMap(this.foodCells, food);
        for (const enemy of enemiesList) this._insertIntoMap(this.enemyCells, enemy);
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

    function getEnemyPerkPool() {
      return shuffleArray([...ENEMY_PERK_CONFIG.BASE_PERKS]);
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
      const perkPool = getEnemyPerkPool();
      const perkCount = Math.min(ENEMY_PERK_CONFIG.MAX_PERKS, getEnemySpawnPerkCount());

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

function createEnemy(sizeFactor = 1) {
      let shieldChance = 0.16;
      if (endlessMode && typeof getEndlessPressureState === 'function') {
        const endlessState = getEndlessPressureState();
        shieldChance = Math.min(0.28, 0.12 + endlessState.pressure * 0.05 + endlessState.doomProgress * 0.03);
      }
      const enemy = Math.random() < shieldChance ? new ShieldEnemy(sizeFactor) : new Enemy(sizeFactor);
      return applyRandomEnemyPerks(enemy);
    }

    function addScore(amount) {
      score += Math.max(0, Math.round(amount));
    }


function resetGame() {
      runtimeSessionId += 1;
      if (typeof clearRenderWarmupQueue === 'function') clearRenderWarmupQueue();
      updateWorldSize({ keepExisting: false });
      world.seed = Math.max(1, Math.floor(Math.random() * 2147483647));
      player = new Player();
      const selectedPetId = window.JorShopUI?.selectedPetId?.() || '';
      activePet = selectedPetId && typeof PlayerPet === 'function' ? new PlayerPet(selectedPetId, player) : null;
      camera.x = player.x - canvas.width * 0.5;
      camera.y = player.y - canvas.height * 0.5;
      foods = [];
      dnaOrbs = [];
      tomatoFoods = [];
      remains = [];
      ambientParticles = [];
      backgroundGlows = [];
      backgroundBubbles = [];
      backgroundBlooms = [];
      entitySpatialIndex = null;
      spatialQueryScratch.length = 0;
      foodEatParticlePool.length = 0;
      enemyEatParticlePool.length = 0;
      foodEatBurstPool.length = 0;
      enemyEatBurstPool.length = 0;
      remainsPool.length = 0;
      foodEatParticles = [];
      foodEatBursts = [];
      enemyEatParticles = [];
      enemyEatBursts = [];
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
      spawnTomatoTimer = 240;
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

      if (typeof startCampaignRunIfNeeded === 'function') startCampaignRunIfNeeded();
      setupAmbient();
      seedInitialEntities();
      rebuildSpatialIndex();
      scheduleRoundRenderWarmup();
      updateCamera(true);
    }

    function updateEnemyEvolution() {

      if (!endlessMode) {
        for (const enemy of enemies) {
          const eatRange = enemy.radius + 26;
          const nearbyFoods = getNearbyFoods(enemy.x, enemy.y, eatRange, []);
          for (const food of nearbyFoods) {
            const foodIndex = foods.indexOf(food);
            if (foodIndex === -1) continue;
            if (!enemy.tryEatFood(food, player)) continue;
            spawnFoodEatEffect(food, enemy, { particleCount: food instanceof ShardFood ? 4 : 6, ringCount: 1 });
            foods.splice(foodIndex, 1);
            break;
          }
        }
      }

      rebuildSpatialIndex();

      for (let i = enemies.length - 1; i >= 0; i--) {
        const hunter = enemies[i];
        const preyRange = hunter.radius + ENEMY_EVOLUTION_CONFIG.PREY_SEEK_RANGE + hunter.mawLevel * 24 + hunter.spikeLevel * 16;
        const nearbyEnemies = getNearbyEnemies(hunter.x, hunter.y, preyRange, []);
        let preyEaten = false;

        for (const prey of nearbyEnemies) {
          if (prey === hunter) continue;
          const preyIndex = enemies.indexOf(prey);
          if (preyIndex === -1 || preyIndex === i) continue;

          if (!hunter.tryEatEnemy(prey, player)) continue;

          spawnEnemyRemains(prey, hunter);
          enemies.splice(preyIndex, 1);
          preyEaten = true;

          if (preyIndex < i) {
            i -= 1;
          }

          break;
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
      if (gameOver || victory || evolutionPending || App.localPause || App.platformPaused || App.userPaused) return;
      simulationFrame += 1;
      hudDirty = true;

      updateEndlessProgression();
      player.update();
      if (activePet) activePet.update(player);
      updateRenderBudget();
      rebuildSpatialIndex();

      const shouldThrottleAmbient = simulationLoad > 180 && (simulationFrame % 2 === 0);
      if (!shouldThrottleAmbient) {
        for (const glow of backgroundGlows) glow.update();
        for (const bubble of backgroundBubbles) bubble.update();
        for (const bloom of backgroundBlooms) bloom.update();
        for (const particle of ambientParticles) particle.update();
      }
      for (const food of foods) food.update();
      const shouldThrottleSecondary = simulationLoad > 150 && (simulationFrame % 2 === 1);
      for (const orb of dnaOrbs) {
        if (!shouldThrottleSecondary || !isEntityFarOutsideView(orb, 120)) orb.update();
      }
      for (const tomato of tomatoFoods) {
        if (!shouldThrottleSecondary || !isEntityFarOutsideView(tomato, 120)) tomato.update();
      }
      for (const chunk of remains) {
        if (!shouldThrottleSecondary || !isEntityFarOutsideView(chunk, 120)) chunk.update();
      }
      updateFoodEatEffects();
      updateEnemyEatEffects();
      if (typeof updateEnemySpikes === 'function') updateEnemySpikes();
      trimSecondaryVisualLoad();
      for (const enemy of enemies) enemy.update(player, foods, enemies);

      handlePlayerCollisions();
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

      spawnTomatoTimer -= 1;
      if (spawnTomatoTimer <= 0) {
        spawnTomatoTimer = endlessMode ? ENDLESS_CONFIG.TOMATO_ENDLESS_SPAWN_FRAMES : ENDLESS_CONFIG.TOMATO_SPAWN_FRAMES;
        if (tomatoFoods.length < ENDLESS_CONFIG.TOMATO_MAX_COUNT) {
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
        enemyEatBursts.length * 0.45 +
        remains.length * 0.2 +
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
