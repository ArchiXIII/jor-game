// -----------------------------------------------------------------------
    const GROWTH_CONFIG = {
      START_RADIUS: 14,
      LEGACY_MAX_LEVEL: 8,
      TARGET_MAX_LEVEL: 20,
      TARGET_MAX_RADIUS: 64,
      VISUAL_GROWTH_STAGES: 10,
      CAMERA_GROWTH_DELAY_FRAMES: 120,
      LEGACY_LEVEL_RADIUS_STEP: 8,
      GROWTH_RATE_FACTOR: 0.55,
      FIRST_PHASE_GROWTH_SCALE: 0.88,
      // Минимальный множитель softness у потолка. Раньше было 0.08 —
      // у самого края роста еда давала в 12 раз меньше, что превращало
      // последние уровни в утомительное стояние. 0.28 = плавное насыщение.
      SOFTNESS_MIN: 0.28,
    };

    const PROGRESSION_CONFIG = {
      FIRST_PHASE_LEVELS: 20,
      ENDLESS_LEVELS: 30,
      REWARD_EVERY_LEVELS: 2,
      ENDLESS_REWARD_FIRST_LEVEL: 4,
      ENDLESS_REWARD_EVERY_LEVELS: 3,
      ENDLESS_SCORE_PER_LEVEL: 1500,
      ENDLESS_LEVEL_SCORE_THRESHOLDS: [],
      ENEMY_BASE_CAP: 18,
      ENEMY_ENDLESS_CAP: 26,
      ENEMY_CAP_RAMP_PER_WAVE: 0.26,
      ENDLESS_PERK_GROWTH_PER_WAVE: 1.18,
      ENDLESS_PERK_GROWTH_OVER_TIME: 0.46,
      ENEMY_MAX_PERK_TIERS: 14,
      ENEMY_MAX_BONUS_PERKS: 6,
      ENEMY_ELITE_CHANCE_CAP: 0.9,
    };

    const LEGACY_MAX_RADIUS =
      GROWTH_CONFIG.START_RADIUS +
      (GROWTH_CONFIG.LEGACY_MAX_LEVEL - 1) * GROWTH_CONFIG.LEGACY_LEVEL_RADIUS_STEP;

    const ENEMY_EVOLUTION_CONFIG = {
      FOOD_GROWTH: 0.11,
      SHARD_GROWTH: 0.06,
      PREY_GROWTH_BASE: 0.42,
      PREY_GROWTH_RADIUS_FACTOR: 0.012,
      FOOD_SEEK_RANGE: 150,
      PREY_SEEK_RANGE: 175,
      THREAT_AVOID_RANGE: 160,
      HARD_CAP_MULTIPLIER: 1.08,
      MAX_RADIUS_MULTIPLIER: 2,
      // Раньше 1.11 — игрок мог съесть только врага меньше себя на 11%.
      // 1.04 = можно есть врагов почти равного размера. Это даёт тактические
      // решения «ринуться или нет» вместо очевидного «он крупнее — обойди».
      DOMINANCE_RATIO: 1.04,
    };

    const ENEMY_PERK_CONFIG = {
      MAX_PERKS: 3,
      BASE_PERKS: ['spike', 'tail', 'shell', 'maw', 'tentacle', 'agility'],
    };

    PROGRESSION_CONFIG.ENDLESS_LEVEL_SCORE_THRESHOLDS = (() => {
      const thresholds = [];
      let cumulative = 0;
      for (let index = 0; index < PROGRESSION_CONFIG.ENDLESS_LEVELS - 1; index++) {
        const curve =
          index < 8
            ? 0.46 + index * 0.02
            : 0.62 + index * 0.022 + Math.max(0, index - 8) * 0.006;
        const perLevelCost = PROGRESSION_CONFIG.ENDLESS_SCORE_PER_LEVEL * curve;
        cumulative += Math.round(perLevelCost);
        thresholds.push(cumulative);
      }
      return thresholds;
    })();

    const PREVIOUS_SIZE_REDUCTION_FACTOR = 2.25;
    const CURRENT_SIZE_REDUCTION_FACTOR = PREVIOUS_SIZE_REDUCTION_FACTOR * 2;

    GROWTH_CONFIG.LEVEL_RADIUS_STEP =
      (GROWTH_CONFIG.TARGET_MAX_RADIUS - GROWTH_CONFIG.START_RADIUS) /
      (GROWTH_CONFIG.TARGET_MAX_LEVEL - 1);
    GROWTH_CONFIG.GROWTH_STAGE_RADIUS_STEP =
      (GROWTH_CONFIG.TARGET_MAX_RADIUS - GROWTH_CONFIG.START_RADIUS) /
      (GROWTH_CONFIG.VISUAL_GROWTH_STAGES - 1);


    const ENDLESS_CONFIG = {
      CAMERA_GROWTH_ZOOM_OUT: 0.76,
      CAMERA_ENDLESS_ZOOM_OUT: 0.58,
      CAMERA_ENDLESS_MOBILE_ZOOM_OUT: 0.48,
      CAMERA_ZOOM_LERP: 0.035,
      ENDLESS_DEATH_RADIUS: 14,
      MOBILE_GAMEPLAY_SPEED_SCALE: 0.9,
      WORLD_SPEED_SCALE_STRENGTH: 1.28,
      WORLD_SPEED_SCALE_MAX: 1.68,
      SCORE_PER_FOOD: 10,
      SCORE_PER_SHARD: 4,
      SCORE_PER_DNA: 20,
      SCORE_PER_ENDLESS_DNA: 55,
      SCORE_PER_ENEMY_BASE: 120,
      SCORE_PER_ENEMY_RADIUS: 9,
      ENDLESS_DNA_RADIUS: 9,
      ENDLESS_DNA_GROWTH: 0.46,
      ENDLESS_DNA_SPAWN_FRAMES: 120,
      ENDLESS_DNA_SPAWN_BATCH: 3,
      // Было 18 сек — слишком длинная волна для ощущения «события».
      // 14 сек: пик в первые ~2 сек, ~8 сек активной волны, ~3 сек передышки.
      WAVE_SECONDS: 14,
      DIFFICULTY_GROWTH_PER_WAVE: 0.16,
      MAX_SIZE_FACTOR_BONUS: 1.68,
      MAX_PREDATOR_BONUS: 0.42,
      MAX_SPEED_BONUS: 0.34,
      FOOD_FADE_SPEED: 0.025,
      GROWTH_SOFT_STOP_LERP: 0.055,
    };

    // ------------------------------
    // Глобальное состояние приложения
    // ------------------------------
