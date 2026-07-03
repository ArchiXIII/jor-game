let ambientParticles = [];
    let backgroundGlows = [];
    let backgroundBubbles = [];
    let backgroundBlooms = [];
    const BACKGROUND_EFFECT_LIMITS = {
      TOTAL_MAX: 104,
      AMBIENT_MAX: 62,
      GLOW_MAX: 14,
      BUBBLE_MAX: 28,
      BLOOM_MAX: 8,
    };
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
    let runtimeSessionId = 0;

    
    function getFirstPhaseRewardCap() {
      return Math.floor(PROGRESSION_CONFIG.FIRST_PHASE_LEVELS / PROGRESSION_CONFIG.REWARD_EVERY_LEVELS);
    }

    function getEndlessRewardCap() {
      const firstLevel = PROGRESSION_CONFIG.ENDLESS_REWARD_FIRST_LEVEL ?? PROGRESSION_CONFIG.REWARD_EVERY_LEVELS;
      const step = PROGRESSION_CONFIG.ENDLESS_REWARD_EVERY_LEVELS ?? PROGRESSION_CONFIG.REWARD_EVERY_LEVELS;
      if (PROGRESSION_CONFIG.ENDLESS_LEVELS < firstLevel) return 0;
      return Math.floor((PROGRESSION_CONFIG.ENDLESS_LEVELS - firstLevel) / step) + 1;
    }

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

    function getTotalRewardLevels() {
      return (firstPhaseRewardLevel - 1) + (endlessRewardLevel - 1);
    }

    function getNextFirstPhaseRewardLevel() {
      const cap = getFirstPhaseRewardCap();
      if (firstPhaseRewardLevel > cap) return null;
      return firstPhaseRewardLevel * PROGRESSION_CONFIG.REWARD_EVERY_LEVELS;
    }

    function getNextEndlessRewardLevel() {
      const cap = getEndlessRewardCap();
      if (endlessRewardLevel > cap) return null;
      return getEndlessRewardLevelByIndex(endlessRewardLevel);
    }

    function getEndlessRewardLevelByIndex(index) {
      const firstLevel = PROGRESSION_CONFIG.ENDLESS_REWARD_FIRST_LEVEL ?? PROGRESSION_CONFIG.REWARD_EVERY_LEVELS;
      const step = PROGRESSION_CONFIG.ENDLESS_REWARD_EVERY_LEVELS ?? PROGRESSION_CONFIG.REWARD_EVERY_LEVELS;
      return firstLevel + Math.max(0, index - 1) * step;
    }

    function getEndlessRewardIndexForLevel(level) {
      const firstLevel = PROGRESSION_CONFIG.ENDLESS_REWARD_FIRST_LEVEL ?? PROGRESSION_CONFIG.REWARD_EVERY_LEVELS;
      const step = PROGRESSION_CONFIG.ENDLESS_REWARD_EVERY_LEVELS ?? PROGRESSION_CONFIG.REWARD_EVERY_LEVELS;
      if (level < firstLevel) return 0;
      return Math.floor((level - firstLevel) / step) + 1;
    }

    function getPreviousEndlessRewardLevel() {
      return endlessRewardLevel <= 1 ? 1 : getEndlessRewardLevelByIndex(endlessRewardLevel - 1);
    }

    function getEndlessRewardCounterAfterChoice(reachedLevel, currentRewardLevel, cap) {
      const reachedRewardIndex = getEndlessRewardIndexForLevel(reachedLevel);
      return Math.min(cap + 1, Math.max(currentRewardLevel + 1, reachedRewardIndex + 1));
    }

    function invalidateEndlessPressureCache() {
      if (typeof resetEndlessPressureCache === 'function') {
        resetEndlessPressureCache();
      }
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
      // Щитовик встречается реже обычного врага.
      let shieldChance = 0.16;
      if (endlessMode && typeof getEndlessPressureState === 'function') {
        const endlessState = getEndlessPressureState();
        shieldChance = Math.min(0.28, 0.12 + endlessState.pressure * 0.05 + endlessState.doomProgress * 0.03);
      }
      const enemy = Math.random() < shieldChance ? new ShieldEnemy(sizeFactor) : new Enemy(sizeFactor);
      return applyRandomEnemyPerks(enemy);
    }

    function createAmbientParticleAt(x, y) {
      return new Particle(
        x,
        y,
        randomRange(1.5, 3.5),
        `rgba(${70 + Math.floor(Math.random() * 60)}, ${150 + Math.floor(Math.random() * 95)}, ${185 + Math.floor(Math.random() * 70)}, 1)`,
        randomRange(0.2, 0.62)
      );
    }

    function createFoodAt(x, y, deferSprite = true) {
      const food = new Food({ deferSprite });
      food.x = x;
      food.y = y;
      return food;
    }

    function createDnaOrbAt(x, y, deferSprite = true) {
      const orb = new DNAOrb(x, y, endlessMode ? ENDLESS_CONFIG.ENDLESS_DNA_RADIUS : undefined, { deferSprite });
      orb.pulse = Math.random() * Math.PI * 2;
      return orb;
    }

    function createEnemyAt(x, y, sizeFactor = 1) {
      const enemy = createEnemy(sizeFactor);
      enemy.x = x;
      enemy.y = y;
      return typeof tuneEnemyForEndless === 'function' ? tuneEnemyForEndless(enemy) : enemy;
    }

    function createBackgroundGlowAt(x, y) {
      return new BackgroundGlow(x, y);
    }

    function createBackgroundBubbleAt(x, y) {
      return new BackgroundBubble(x, y);
    }

    function createBackgroundBloomAt(x, y) {
      return new BackgroundBloom(x, y);
    }

    function setupAmbient() {
      ambientParticles = [];
      backgroundGlows = [];
      backgroundBubbles = [];
      backgroundBlooms = [];
      const bounds = getViewBounds(WORLD_CONFIG.SPAWN_MARGIN + 220);
      const effectTargets = getBackgroundEffectTargets();

      for (let i = 0; i < effectTargets.ambient; i++) {
        ambientParticles.push(createAmbientParticleAt(
          randomRange(bounds.left, bounds.right),
          randomRange(bounds.top, bounds.bottom)
        ));
      }

      for (let i = 0; i < effectTargets.glow; i++) {
        backgroundGlows.push(createBackgroundGlowAt(
          randomRange(bounds.left, bounds.right),
          randomRange(bounds.top, bounds.bottom)
        ));
      }

      for (let i = 0; i < effectTargets.bubble; i++) {
        backgroundBubbles.push(createBackgroundBubbleAt(
          randomRange(bounds.left, bounds.right),
          randomRange(bounds.top, bounds.bottom)
        ));
      }

      for (let i = 0; i < effectTargets.bloom; i++) {
        backgroundBlooms.push(createBackgroundBloomAt(
          randomRange(bounds.left, bounds.right),
          randomRange(bounds.top, bounds.bottom)
        ));
      }
    }

    function seedInitialEntities() {
      const initialBounds = getViewBounds(WORLD_CONFIG.INITIAL_FILL_MARGIN);

      for (let i = 0; i < getTargetFoodCount(); i++) {
        const spawn = randomWorldPosition(24, initialBounds);
        foods.push(createFoodAt(spawn.x, spawn.y));
      }

      for (let i = 0; i < getInitialEnemyCount(); i++) {
        const spawn = randomWorldPositionAwayFrom(player, 220, 30, 20, initialBounds);
        enemies.push(createEnemyAt(spawn.x, spawn.y, 1));
      }

      for (let i = 0; i < getTargetDnaCount(); i++) {
        const spawn = randomWorldPosition(40, initialBounds);
        dnaOrbs.push(createDnaOrbAt(spawn.x, spawn.y));
      }
    }

    function warmFoodSprite(food) {
      if (!food || food.sprite) return;
      food.sprite = food.createSprite();
    }

    function warmDnaOrbSprite(orb) {
      if (!orb || orb.sprite) return;
      orb.sprite = orb.createSprite();
    }

    function warmEnemyBodySprite(enemy) {
      if (!enemy || typeof enemy.getCachedBodySprite !== 'function') return;
      if (enemy instanceof ShieldEnemy) {
        enemy.getCachedBodySprite(
          enemy.hasShield
            ? ['#fff4dd', '#f6af7d', '#914d48']
            : ['#ffe3d8', '#ff8d76', '#7a2433'],
          'rgba(255,252,244,0.96)'
        );
        return;
      }
      enemy.getCachedBodySprite(
        ['#ffe9d5', '#ff8f7c', '#7c1837'],
        'rgba(255,245,252,0.95)'
      );
    }

    function scheduleRoundRenderWarmup() {
      if (typeof clearRenderWarmupQueue === 'function') clearRenderWarmupQueue();
      if (typeof scheduleRenderWarmupTask !== 'function') return;

      scheduleRenderWarmupTask(() => {
        if (typeof getBakedPlayerBodySprite === 'function') getBakedPlayerBodySprite();
      });

      for (const enemy of enemies) {
        scheduleRenderWarmupTask(() => warmEnemyBodySprite(enemy), true);
      }

      for (const orb of dnaOrbs) {
        scheduleRenderWarmupTask(() => warmDnaOrbSprite(orb));
      }

      for (const food of foods) {
        scheduleRenderWarmupTask(() => warmFoodSprite(food));
      }
    }

    function cullStreamedEntities() {
      const despawnBounds = getViewBounds(WORLD_CONFIG.DESPAWN_MARGIN);

      let writeFood = 0;
      for (let i = 0; i < foods.length; i++) {
        const food = foods[i];
        if (food.life !== undefined && food.life <= 0) continue;
        if (isOutsideBounds(food, despawnBounds, food.radius + 24)) continue;
        foods[writeFood++] = food;
      }
      foods.length = writeFood;

      let writeOrb = 0;
      for (let i = 0; i < dnaOrbs.length; i++) {
        const orb = dnaOrbs[i];
        if (isOutsideBounds(orb, despawnBounds, orb.radius + 20)) continue;
        dnaOrbs[writeOrb++] = orb;
      }
      dnaOrbs.length = writeOrb;

      for (let i = remains.length - 1; i >= 0; i--) {
        const chunk = remains[i];
        if (chunk.life > 0 && !isOutsideBounds(chunk, despawnBounds, chunk.radius + 26)) continue;
        const deadRemain = remains[i];
        remains[i] = remains[remains.length - 1];
        remains.pop();
        remainsPool.push(deadRemain);
      }

      let writeEnemy = 0;
      for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        if (isOutsideBounds(enemy, despawnBounds, enemy.radius + 90)) continue;
        enemies[writeEnemy++] = enemy;
      }
      enemies.length = writeEnemy;
    }

    function isEntityFarOutsideView(entity, margin = 120) {
      const bounds = getViewBounds(margin);
      return entity.x < bounds.left || entity.x > bounds.right || entity.y < bounds.top || entity.y > bounds.bottom;
    }

    function refillAmbientParticles() {
      const effectTargets = getBackgroundEffectTargets();
      const particleTarget = effectTargets.ambient;
      const glowTarget = effectTargets.glow;
      const bubbleTarget = effectTargets.bubble;
      const bloomTarget = effectTargets.bloom;
      const bounds = getViewBounds(WORLD_CONFIG.SPAWN_MARGIN + 220);

      while (ambientParticles.length < particleTarget) {
        ambientParticles.push(createAmbientParticleAt(
          randomRange(bounds.left, bounds.right),
          randomRange(bounds.top, bounds.bottom)
        ));
      }

      while (backgroundGlows.length < glowTarget) {
        backgroundGlows.push(createBackgroundGlowAt(
          randomRange(bounds.left, bounds.right),
          randomRange(bounds.top, bounds.bottom)
        ));
      }

      while (backgroundBubbles.length < bubbleTarget) {
        backgroundBubbles.push(createBackgroundBubbleAt(
          randomRange(bounds.left, bounds.right),
          randomRange(bounds.top, bounds.bottom)
        ));
      }

      while (backgroundBlooms.length < bloomTarget) {
        backgroundBlooms.push(createBackgroundBloomAt(
          randomRange(bounds.left, bounds.right),
          randomRange(bounds.top, bounds.bottom)
        ));
      }

      if (ambientParticles.length > particleTarget) {
        ambientParticles.length = particleTarget;
      }

      if (backgroundGlows.length > glowTarget) {
        backgroundGlows.length = glowTarget;
      }

      if (backgroundBubbles.length > bubbleTarget) {
        backgroundBubbles.length = bubbleTarget;
      }

      if (backgroundBlooms.length > bloomTarget) {
        backgroundBlooms.length = bloomTarget;
      }
    }

    function spawnStreamFood(amount) {
      // Спавн «пятнами»: вместо равномерного разброса еда появляется
      // кластерами по 3–7 штук в одной точке. Это создаёт интересную
      // карту мира — есть «пастбища» и есть «пустоши». Игрок принимает
      // решения: идти на полную еды зону или быстро её защитить.
      let remaining = amount;
      while (remaining > 0) {
        // Размер кластера зависит от того, сколько ещё нужно заспавнить.
        const clusterSize = Math.min(remaining, 3 + Math.floor(Math.random() * 5));
        const center = randomOffscreenWorldPosition({
          padding: 24,
          minDistanceFromPlayer: WORLD_CONFIG.SAFE_PLAYER_RADIUS,
        });
        // Радиус кластера ~80px — еда в одной точке выглядит как «облако».
        for (let i = 0; i < clusterSize; i++) {
          const angle = Math.random() * Math.PI * 2;
          const offset = Math.random() * 80;
          const food = createFoodAt(
            center.x + Math.cos(angle) * offset,
            center.y + Math.sin(angle) * offset
          );
          foods.push(food);
          if (typeof scheduleRenderWarmupTask === 'function') {
            scheduleRenderWarmupTask(() => warmFoodSprite(food));
          }
        }
        remaining -= clusterSize;
      }
    }

    function spawnStreamDna(amount = 1) {
      for (let i = 0; i < amount; i++) {
        const spawn = randomOffscreenWorldPosition({
          padding: 40,
          minDistanceFromPlayer: WORLD_CONFIG.SAFE_PLAYER_RADIUS + 40,
        });
        const orb = createDnaOrbAt(spawn.x, spawn.y);
        dnaOrbs.push(orb);
        if (typeof scheduleRenderWarmupTask === 'function') {
          scheduleRenderWarmupTask(() => warmDnaOrbSprite(orb));
        }
      }
    }

    function spawnStreamEnemy(sizeFactor = 1) {
      const spawn = randomOffscreenWorldPosition({
        padding: 32,
        minDistanceFromPlayer: WORLD_CONFIG.SAFE_PLAYER_RADIUS + 40,
      });
      const enemy = createEnemyAt(spawn.x, spawn.y, sizeFactor);
      enemies.push(enemy);
      if (typeof scheduleRenderWarmupTask === 'function') {
        scheduleRenderWarmupTask(() => warmEnemyBodySprite(enemy), true);
      }
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
      // При полном сбросе всегда снимаем ручную паузу — нельзя начать новую
      // игру в «застрявшем» паузном состоянии.
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
      // Spike и maw немного снижают порог доминирования, но не превращают
      // игрока в «съешь всех» — потолок 0.08 (8% форы) сохраняется.
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

    function updateEnemyEvolution() {
      // Не пересобираем индекс на входе — основной цикл это уже сделал
      // после движения сущностей. Внутри индекс перестраивается только
      // когда что-то реально удалилось (см. preyEaten ниже).

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

    // ------------------------------
    // Основной игровой цикл
    // ------------------------------
    function updateGame() {
      if (gameOver || victory || evolutionPending || App.localPause || App.platformPaused || App.userPaused) return;
      simulationFrame += 1;
      hudDirty = true;

      if (endlessMode) {
        endlessTime += 1;
        if (enemySpikeGlobalCooldown > 0) enemySpikeGlobalCooldown -= 1;
        if (typeof getEndlessPressureState === 'function') {
          const endlessState = getEndlessPressureState();
          endlessDifficulty = Math.min(
            11.8,
            0.28 +
            endlessState.pressure * 2.5 +
            endlessState.wave * 0.045 +
            endlessState.doomProgress * 2.15
          );
        }
        endlessTransition = Math.min(1, endlessTransition + 0.01);
        player.level = Math.max(player.level, GROWTH_CONFIG.TARGET_MAX_LEVEL);
        const endlessPhaseScore = typeof getEndlessPhaseScore === 'function' ? getEndlessPhaseScore() : 0;
        while (endlessLevel < PROGRESSION_CONFIG.ENDLESS_LEVELS) {
          const nextThreshold = PROGRESSION_CONFIG.ENDLESS_LEVEL_SCORE_THRESHOLDS[endlessLevel - 1];
          if (nextThreshold === undefined || endlessPhaseScore < nextThreshold) break;
          endlessLevel += 1;
        }
      }

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
      for (const chunk of remains) {
        if (!shouldThrottleSecondary || !isEntityFarOutsideView(chunk, 120)) chunk.update();
      }
      updateFoodEatEffects();
      updateEnemyEatEffects();
      if (typeof updateEnemySpikes === 'function') updateEnemySpikes();
      trimSecondaryVisualLoad();
      for (const enemy of enemies) enemy.update(player, foods, enemies);

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

      // Перестраиваем индекс только если что-то реально удалилось.
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
          // Осколки — мелкая «закуска», ×3 меньше обычной еды.
          player.grow(0.10);
          addScore(ENDLESS_CONFIG.SCORE_PER_SHARD);
        } else {
          // Обычная еда — базовая единица прогресса. +28% к прежнему,
          // чтобы фаза роста проходилась за разумное время.
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
          // DNA-орб = редкое событие, ×3 от обычной еды для ощущения «джекпот».
          player.grow(endlessMode ? ENDLESS_CONFIG.ENDLESS_DNA_GROWTH : 0.95);
          addScore(endlessMode ? ENDLESS_CONFIG.SCORE_PER_ENDLESS_DNA : ENDLESS_CONFIG.SCORE_PER_DNA);
          if (typeof recordCampaignDna === 'function') recordCampaignDna();
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
            // Враг — крупная награда, ×5-6 от обычной еды. Игрок должен
            // явно чувствовать выгоду от риска агрессии.
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
            // В late-game урон от врагов растёт: фикс 10 → до 18.
            // Вкупе с тем, что в takeDamage урон масштабируется с размером
            // атакующего, к финалу endless игрок становится по-настоящему
            // уязвимым — что и нужно для нарастающей угрозы.
            const endlessState = endlessMode && typeof getEndlessPressureState === 'function' ? getEndlessPressureState() : null;
            const lateGameScale = endlessState ? endlessState.lateGameScale : 0;
            const damageAmount = 10 + lateGameScale * 4;
            player.takeDamage(damageAmount, enemy.radius);
          }
        }
      }

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

      spawnDnaTimer -= 1;
      if (spawnDnaTimer <= 0) {
        // Реже стало: 180→240 (endless), 180→300 (фаза роста).
        // DNA-орбы теперь ценнее (×3 рост) — должны быть событиями, а не
        // фоновыми пикапами. 5 секунд между попытками спавна — норм.
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

      if (typeof updateCampaignRun === 'function') updateCampaignRun();
      if (typeof isCampaignRunCompleted === 'function' && isCampaignRunCompleted()) return;

      const nextFirstPhaseRewardLevel = getNextFirstPhaseRewardLevel();
      const nextEndlessRewardLevel = getNextEndlessRewardLevel();
      const canOpenPhaseLevelUp = !endlessMode && nextFirstPhaseRewardLevel !== null && player.level >= nextFirstPhaseRewardLevel;
      const canOpenEndlessLevelUp = endlessMode && nextEndlessRewardLevel !== null && endlessLevel >= nextEndlessRewardLevel;
      const canOpenEvolutionNow = (player.evolutionDelayTimer ?? 0) <= 0;
      if (App.gameMode !== 'campaign' && (canOpenPhaseLevelUp || canOpenEndlessLevelUp) && !evolutionPending && canOpenEvolutionNow) {
        openEvolutionPanel();
      }

      const deathRadius = endlessMode
        ? Math.max(player.minRadius, ENDLESS_CONFIG.ENDLESS_DEATH_RADIUS ?? player.minRadius)
        : player.minRadius;
      if (player.radius <= deathRadius + 0.05) {
        if (typeof hasCampaignRun === 'function' && hasCampaignRun()) {
          const stars = typeof getCampaignStars === 'function' ? getCampaignStars() : 0;
          if (typeof completeCampaignRun === 'function') completeCampaignRun(stars);
          return;
        }
        gameOver = true;
        playDeathSound();
        showGameOverWithLeaderboard();
      }

      const roundCompleted =
        player.level >= GROWTH_CONFIG.TARGET_MAX_LEVEL &&
        firstPhaseRewardLevel > getFirstPhaseRewardCap();

      if (roundCompleted && !endlessMode && App.gameMode !== 'campaign') {
        enterEndlessMode();
      }
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
        foods.length * 0.08;

      simulationLoad = activeLoad;
      const quality = typeof performanceQuality === 'number' ? performanceQuality : 1;
      const loadShadowScale = activeLoad > 170 ? 0.48 : activeLoad > 120 ? 0.64 : activeLoad > 82 ? 0.78 : 1;
      const loadDetailScale = activeLoad > 170 ? 0.52 : activeLoad > 120 ? 0.68 : activeLoad > 82 ? 0.84 : 1;
      fxShadowScale = loadShadowScale * (0.58 + quality * 0.42);
      renderDetailScale = loadDetailScale * (0.62 + quality * 0.38);
    }

    function drawBackground() {
      ctx.fillStyle = '#09111a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const visibleBounds = getViewBounds(0);
      const zoom = camera.zoom || 1;
      const viewWidth = canvas.width / zoom;
      const viewHeight = canvas.height / zoom;
      const viewMax = Math.max(viewWidth, viewHeight);

      ctx.save();
      ctx.scale(zoom, zoom);
      ctx.translate(-camera.x, -camera.y);

      const gradient = ctx.createRadialGradient(
        player.x,
        player.y,
        100,
        player.x,
        player.y,
        viewMax * 1.02
      );

      gradient.addColorStop(0, '#3a7890');
      gradient.addColorStop(0.28, '#255569');
      gradient.addColorStop(0.62, '#123247');
      gradient.addColorStop(1, '#08131f');

      ctx.fillStyle = gradient;
      ctx.fillRect(
        visibleBounds.left,
        visibleBounds.top,
        visibleBounds.right - visibleBounds.left,
        visibleBounds.bottom - visibleBounds.top
      );

      const upperGlow = ctx.createLinearGradient(
        visibleBounds.left,
        visibleBounds.top,
        visibleBounds.left,
        visibleBounds.bottom
      );
      upperGlow.addColorStop(0, 'rgba(180, 255, 245, 0.16)');
      upperGlow.addColorStop(0.34, 'rgba(150, 235, 255, 0.08)');
      upperGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = upperGlow;
      ctx.fillRect(
        visibleBounds.left,
        visibleBounds.top,
        visibleBounds.right - visibleBounds.left,
        visibleBounds.bottom - visibleBounds.top
      );

      const bioGlow = ctx.createRadialGradient(
        player.x - viewWidth * 0.12,
        player.y - viewHeight * 0.08,
        0,
        player.x - viewWidth * 0.12,
        player.y - viewHeight * 0.08,
        viewMax * 0.7
      );
      bioGlow.addColorStop(0, 'rgba(110, 255, 225, 0.16)');
      bioGlow.addColorStop(0.42, 'rgba(90, 235, 210, 0.08)');
      bioGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = bioGlow;
      ctx.fillRect(
        visibleBounds.left,
        visibleBounds.top,
        visibleBounds.right - visibleBounds.left,
        visibleBounds.bottom - visibleBounds.top
      );

      const magicGlow = ctx.createRadialGradient(
        player.x + viewWidth * 0.18,
        player.y + viewHeight * 0.03,
        0,
        player.x + viewWidth * 0.18,
        player.y + viewHeight * 0.03,
        viewMax * 0.58
      );
      magicGlow.addColorStop(0, 'rgba(215, 150, 255, 0.14)');
      magicGlow.addColorStop(0.36, 'rgba(170, 120, 255, 0.08)');
      magicGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = magicGlow;
      ctx.fillRect(
        visibleBounds.left,
        visibleBounds.top,
        visibleBounds.right - visibleBounds.left,
        visibleBounds.bottom - visibleBounds.top
      );

      for (const glow of backgroundGlows) {
        if (isOutsideBounds(glow, visibleBounds, (glow.radius ?? 0) + 60)) continue;
        glow.draw();
      }

      for (const bloom of backgroundBlooms) {
        if (isOutsideBounds(bloom, visibleBounds, (bloom.radius ?? 0) + 90)) continue;
        bloom.draw();
      }

      for (const bubble of backgroundBubbles) {
        if (isOutsideBounds(bubble, visibleBounds, (bubble.radius ?? 0) + 60)) continue;
        bubble.draw();
      }

      for (const particle of ambientParticles) {
        if (isOutsideBounds(particle, visibleBounds, (particle.radius ?? 0) + 30)) continue;
        particle.draw();
      }

      ctx.restore();
    }

    function drawMobileEnemyEdgeIndicators() {
      if (!mobileControl.enabled || !player || !enemies.length) return;

      const zoom = camera.zoom || 1;
      const centerX = canvas.width * 0.5;
      const centerY = canvas.height * 0.5;
      const edgeInset = 8;
      const maxWarnDistance = Math.min(560, Math.max(300, Math.min(canvas.width, canvas.height) * 0.9));
      const candidates = [];

      for (const enemy of enemies) {
        const screenX = (enemy.x - camera.x) * zoom;
        const screenY = (enemy.y - camera.y) * zoom;
        const screenRadius = Math.max(10, enemy.radius * zoom);
        const isVisible =
          screenX + screenRadius > 0 &&
          screenX - screenRadius < canvas.width &&
          screenY + screenRadius > 0 &&
          screenY - screenRadius < canvas.height;

        if (isVisible) continue;

        const nearestX = clamp(screenX, 0, canvas.width);
        const nearestY = clamp(screenY, 0, canvas.height);
        const offscreenDistance = Math.hypot(screenX - nearestX, screenY - nearestY);
        if (offscreenDistance > maxWarnDistance) continue;

        candidates.push({ enemy, screenX, screenY, offscreenDistance });
      }

      if (!candidates.length) return;
      candidates.sort((a, b) => a.offscreenDistance - b.offscreenDistance);

      ctx.save();
      ctx.lineCap = 'round';
      ctx.globalCompositeOperation = 'source-over';

      for (let i = 0; i < Math.min(6, candidates.length); i++) {
        const { enemy, screenX, screenY, offscreenDistance } = candidates[i];
        const approach = 1 - clamp(offscreenDistance / maxWarnDistance, 0, 1);
        const sizeThreat = clamp((enemy.radius - player.radius * 0.45) / Math.max(1, player.radius * 1.35), 0, 1);
        const length = 34 + approach * 64 + sizeThreat * 18;
        const lineWidth = 2 + approach * 4 + sizeThreat * 1.2;
        const alpha = 0.075 + approach * 0.34;
        const color = enemy.hasShield ? '246, 175, 125' : '255, 143, 124';
        const isLeft = screenX < 0;
        const isRight = screenX > canvas.width;
        const isTop = screenY < 0;
        const isBottom = screenY > canvas.height;
        const isCorner = (isLeft || isRight) && (isTop || isBottom);
        let edgeX = clamp(screenX, edgeInset + length * 0.5, canvas.width - edgeInset - length * 0.5);
        let edgeY = clamp(screenY, edgeInset + length * 0.5, canvas.height - edgeInset - length * 0.5);
        let tangentX = 1;
        let tangentY = 0;

        const leftDistance = Math.abs(screenX);
        const rightDistance = Math.abs(screenX - canvas.width);
        const topDistance = Math.abs(screenY);
        const bottomDistance = Math.abs(screenY - canvas.height);
        const nearestEdgeDistance = Math.min(leftDistance, rightDistance, topDistance, bottomDistance);

        if (nearestEdgeDistance === leftDistance) {
          edgeX = edgeInset;
          tangentX = 0;
          tangentY = 1;
        } else if (nearestEdgeDistance === rightDistance) {
          edgeX = canvas.width - edgeInset;
          tangentX = 0;
          tangentY = 1;
        } else if (nearestEdgeDistance === topDistance) {
          edgeY = edgeInset;
        } else {
          edgeY = canvas.height - edgeInset;
        }

        const drawIndicatorPath = (scale = 1) => {
          const pathLength = length * scale;

          if (isCorner) {
            const cornerX = isLeft ? edgeInset : canvas.width - edgeInset;
            const cornerY = isTop ? edgeInset : canvas.height - edgeInset;
            const dirX = isLeft ? 1 : -1;
            const dirY = isTop ? 1 : -1;
            const bendRadius = clamp(
              12 + approach * 14 + sizeThreat * 4,
              8,
              Math.max(8, pathLength * 0.42)
            );
            const armLength = Math.max(bendRadius + 6, pathLength * 0.56);

            ctx.moveTo(cornerX, cornerY + dirY * armLength);
            ctx.lineTo(cornerX, cornerY + dirY * bendRadius);
            ctx.quadraticCurveTo(cornerX, cornerY, cornerX + dirX * bendRadius, cornerY);
            ctx.lineTo(cornerX + dirX * armLength, cornerY);
            return;
          }

          ctx.moveTo(edgeX - tangentX * pathLength * 0.5, edgeY - tangentY * pathLength * 0.5);
          ctx.lineTo(edgeX + tangentX * pathLength * 0.5, edgeY + tangentY * pathLength * 0.5);
        };

        ctx.strokeStyle = `rgba(${color}, ${alpha})`;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        drawIndicatorPath(1);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 220, 210, ${0.04 + approach * 0.09})`;
        ctx.lineWidth = Math.max(1, lineWidth * 0.42);
        ctx.beginPath();
        drawIndicatorPath(0.68);
        ctx.stroke();
      }

      ctx.restore();
    }

    function drawGame() {
      if (typeof ctx.resetTransform === 'function') {
        ctx.resetTransform();
      } else {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.filter = 'none';
      drawBackground();
      DOM.sdkStatus.textContent = endlessMode && typeof getEndlessWave === 'function'
        ? t('endlessWave', getEndlessWave() + 1)
        : (App.sdkReady ? t('sdkReady') : t('sdkLocal'));

      ctx.save();
      ctx.scale(camera.zoom || 1, camera.zoom || 1);
      ctx.translate(-camera.x, -camera.y);

      const renderBounds = getViewBounds(180);
      for (const food of foods) {
        if (isOutsideBounds(food, renderBounds, food.radius + 12)) continue;
        food.draw();
      }
      drawFoodEatEffects();
      drawEnemyEatEffects();
      for (const orb of dnaOrbs) {
        if (isOutsideBounds(orb, renderBounds, orb.radius + 18)) continue;
        orb.draw();
      }
      for (const chunk of remains) {
        if (isOutsideBounds(chunk, renderBounds, chunk.radius + 18)) continue;
        chunk.draw();
      }
      for (const enemy of enemies) {
        if (isOutsideBounds(enemy, renderBounds, enemy.radius + 120)) continue;
        enemy.draw();
      }
      for (const spike of enemySpikes) {
        if (isOutsideBounds(spike, renderBounds, spike.length + spike.radius + 24)) continue;
        spike.draw();
      }

      if (activePet && player) activePet.draw(player);
      if (player) player.draw();
      ctx.restore();
      updateTopProgressBar();
      if (!player) return;
      drawMobileEnemyEdgeIndicators();

      const nextEndlessScore = typeof getNextEndlessLevelScoreThreshold === 'function' ? getNextEndlessLevelScoreThreshold() : null;
      const progressText = endlessMode
        ? (() => {
            const phaseScore = typeof getEndlessPhaseScore === 'function' ? getEndlessPhaseScore() : 0;
            const nextPhaseThreshold = nextEndlessScore !== null ? Math.max(0, nextEndlessScore - endlessScoreBase) : null;
            return nextPhaseThreshold !== null ? `${phaseScore} / ${nextPhaseThreshold}` : t('endlessMax');
          })()
        : `${Math.min(player.level, PROGRESSION_CONFIG.FIRST_PHASE_LEVELS)} / ${PROGRESSION_CONFIG.FIRST_PHASE_LEVELS}`;

      if (false && hudDirty && simulationFrame - lastHudRenderFrame >= 6) {
        DOM.hudStats.innerHTML = `
          Счёт: <b>${score}</b><br>
          ДНК: <b>${player.dna}</b><br>
          ${endlessMode ? `Режим: <b>Бесконечность</b><br>Волна: <b>${getEndlessWave() + 1}</b><br>Опасность: <b>${(1 + endlessDifficulty).toFixed(2)}x</b><br>Следующий endless-уровень: <b>${getNextEndlessLevelScoreThreshold() !== null ? Math.max(0, getNextEndlessLevelScoreThreshold() - endlessScoreBase) : 'MAX'}</b><br>Следующий перк: <b>${getNextEndlessRewardLevel() ?? 'MAX'} уровень</b><br>Прогресс endless: <b>${progressText}</b><br>` : `Фаза роста: <b>${progressText}</b><br>Следующий перк: <b>${getNextFirstPhaseRewardLevel() ?? 'MAX'} уровень</b><br>`}
          Перки фазы роста: <b>${firstPhaseRewardLevel - 1} / ${getFirstPhaseRewardCap()}</b><br>
          Перки endless: <b>${endlessRewardLevel - 1} / ${getEndlessRewardCap()}</b><br>
          Размер: <b>${player.radius.toFixed(1)}</b><br>
          Уровень фазы: <b>${getCurrentPhaseLevel()} / ${getCurrentPhaseLevelCap()}</b><br>
          Общий ранг: <b>${getOverallLevel()} / ${PROGRESSION_CONFIG.FIRST_PHASE_LEVELS + PROGRESSION_CONFIG.ENDLESS_LEVELS}</b><br>
        `;
        lastHudRenderFrame = simulationFrame;
        hudDirty = false;
      }
    }
