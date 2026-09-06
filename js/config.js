// -----------------------------------------------------------------------
    const PLAYER_SWIM_VISUAL_SPEED = 0.8;

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
      // Р В РЎС™Р В РЎвЂР В Р вЂ¦Р В РЎвЂР В РЎВР В Р’В°Р В Р’В»Р РЋР Р‰Р В Р вЂ¦Р РЋРІР‚в„–Р В РІвЂћвЂ“ Р В РЎВР В Р вЂ¦Р В РЎвЂўР В Р’В¶Р В РЎвЂР РЋРІР‚С™Р В Р’ВµР В Р’В»Р РЋР Р‰ softness Р РЋРЎвЂњ Р В РЎвЂ”Р В РЎвЂўР РЋРІР‚С™Р В РЎвЂўР В Р’В»Р В РЎвЂќР В Р’В°. Р В Р’В Р В Р’В°Р В Р вЂ¦Р РЋР Р‰Р РЋРІвЂљВ¬Р В Р’Вµ Р В Р’В±Р РЋРІР‚в„–Р В Р’В»Р В РЎвЂў 0.08 Р Р†Р вЂљРІР‚Сњ
      // Р РЋРЎвЂњ Р РЋР С“Р В Р’В°Р В РЎВР В РЎвЂўР В РЎвЂ“Р В РЎвЂў Р В РЎвЂќР РЋР вЂљР В Р’В°Р РЋР РЏ Р РЋР вЂљР В РЎвЂўР РЋР С“Р РЋРІР‚С™Р В Р’В° Р В Р’ВµР В РўвЂР В Р’В° Р В РўвЂР В Р’В°Р В Р вЂ Р В Р’В°Р В Р’В»Р В Р’В° Р В Р вЂ  12 Р РЋР вЂљР В Р’В°Р В Р’В· Р В РЎВР В Р’ВµР В Р вЂ¦Р РЋР Р‰Р РЋРІвЂљВ¬Р В Р’Вµ, Р РЋРІР‚РЋР РЋРІР‚С™Р В РЎвЂў Р В РЎвЂ”Р РЋР вЂљР В Р’ВµР В Р вЂ Р РЋР вЂљР В Р’В°Р РЋРІР‚В°Р В Р’В°Р В Р’В»Р В РЎвЂў
      // Р В РЎвЂ”Р В РЎвЂўР РЋР С“Р В Р’В»Р В Р’ВµР В РўвЂР В Р вЂ¦Р В РЎвЂР В Р’Вµ Р РЋРЎвЂњР РЋР вЂљР В РЎвЂўР В Р вЂ Р В Р вЂ¦Р В РЎвЂ Р В Р вЂ  Р РЋРЎвЂњР РЋРІР‚С™Р В РЎвЂўР В РЎВР В РЎвЂР РЋРІР‚С™Р В Р’ВµР В Р’В»Р РЋР Р‰Р В Р вЂ¦Р В РЎвЂўР В Р’Вµ Р РЋР С“Р РЋРІР‚С™Р В РЎвЂўР РЋР РЏР В Р вЂ¦Р В РЎвЂР В Р’Вµ. 0.28 = Р В РЎвЂ”Р В Р’В»Р В Р’В°Р В Р вЂ Р В Р вЂ¦Р В РЎвЂўР В Р’Вµ Р В Р вЂ¦Р В Р’В°Р РЋР С“Р РЋРІР‚в„–Р РЋРІР‚В°Р В Р’ВµР В Р вЂ¦Р В РЎвЂР В Р’Вµ.
      SOFTNESS_MIN: 0.28,
    };

    const PROGRESSION_CONFIG = {
      FIRST_PHASE_LEVELS: 20,
      ENDLESS_LEVELS: 30,
      REWARD_EVERY_LEVELS: 2,
      ENDLESS_REWARD_FIRST_LEVEL: 4,
      ENDLESS_REWARD_EVERY_LEVELS: 3,
      RECOVERY_EVOLUTION_COOLDOWN_FRAMES: 1800,
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
      // Р В Р’В Р В Р’В°Р В Р вЂ¦Р РЋР Р‰Р РЋРІвЂљВ¬Р В Р’Вµ 1.11 Р Р†Р вЂљРІР‚Сњ Р В РЎвЂР В РЎвЂ“Р РЋР вЂљР В РЎвЂўР В РЎвЂќ Р В РЎВР В РЎвЂўР В РЎвЂ“ Р РЋР С“Р РЋР вЂ°Р В Р’ВµР РЋР С“Р РЋРІР‚С™Р РЋР Р‰ Р РЋРІР‚С™Р В РЎвЂўР В Р’В»Р РЋР Р‰Р В РЎвЂќР В РЎвЂў Р В Р вЂ Р РЋР вЂљР В Р’В°Р В РЎвЂ“Р В Р’В° Р В РЎВР В Р’ВµР В Р вЂ¦Р РЋР Р‰Р РЋРІвЂљВ¬Р В Р’Вµ Р РЋР С“Р В Р’ВµР В Р’В±Р РЋР РЏ Р В Р вЂ¦Р В Р’В° 11%.
      // 1.04 = Р В РЎВР В РЎвЂўР В Р’В¶Р В Р вЂ¦Р В РЎвЂў Р В Р’ВµР РЋР С“Р РЋРІР‚С™Р РЋР Р‰ Р В Р вЂ Р РЋР вЂљР В Р’В°Р В РЎвЂ“Р В РЎвЂўР В Р вЂ  Р В РЎвЂ”Р В РЎвЂўР РЋРІР‚РЋР РЋРІР‚С™Р В РЎвЂ Р РЋР вЂљР В Р’В°Р В Р вЂ Р В Р вЂ¦Р В РЎвЂўР В РЎвЂ“Р В РЎвЂў Р РЋР вЂљР В Р’В°Р В Р’В·Р В РЎВР В Р’ВµР РЋР вЂљР В Р’В°. Р В Р’В­Р РЋРІР‚С™Р В РЎвЂў Р В РўвЂР В Р’В°Р РЋРІР‚ВР РЋРІР‚С™ Р РЋРІР‚С™Р В Р’В°Р В РЎвЂќР РЋРІР‚С™Р В РЎвЂР РЋРІР‚РЋР В Р’ВµР РЋР С“Р В РЎвЂќР В РЎвЂР В Р’Вµ
      // Р РЋР вЂљР В Р’ВµР РЋРІвЂљВ¬Р В Р’ВµР В Р вЂ¦Р В РЎвЂР РЋР РЏ Р вЂ™Р’В«Р РЋР вЂљР В РЎвЂР В Р вЂ¦Р РЋРЎвЂњР РЋРІР‚С™Р РЋР Р‰Р РЋР С“Р РЋР РЏ Р В РЎвЂР В Р’В»Р В РЎвЂ Р В Р вЂ¦Р В Р’ВµР РЋРІР‚С™Р вЂ™Р’В» Р В Р вЂ Р В РЎВР В Р’ВµР РЋР С“Р РЋРІР‚С™Р В РЎвЂў Р В РЎвЂўР РЋРІР‚РЋР В Р’ВµР В Р вЂ Р В РЎвЂР В РўвЂР В Р вЂ¦Р В РЎвЂўР В РЎвЂ“Р В РЎвЂў Р вЂ™Р’В«Р В РЎвЂўР В Р вЂ¦ Р В РЎвЂќР РЋР вЂљР РЋРЎвЂњР В РЎвЂ”Р В Р вЂ¦Р В Р’ВµР В Р’Вµ Р Р†Р вЂљРІР‚Сњ Р В РЎвЂўР В Р’В±Р В РЎвЂўР В РІвЂћвЂ“Р В РўвЂР В РЎвЂР вЂ™Р’В».
      DOMINANCE_RATIO: 1.04,
    };

    const ENEMY_PERK_CONFIG = {
      MAX_PERKS: 3,
      BASE_PERKS: ['spike', 'tail', 'shell', 'maw', 'agility'],
    };

    const GAMEPLAY_BACKGROUND_DEFAULT_PALETTE = {
      id: 'default',
      base: '#09111a',
      center: '#3a7890',
      middle: '#255569',
      depth: '#123247',
      edge: '#08131f',
      upperLight: 'rgba(180, 255, 245, 0.16)',
      accentA: 'rgba(110, 255, 225, 0.16)',
      accentB: 'rgba(215, 150, 255, 0.14)',
      glowHues: [165, 178, 192, 286, 304],
    };

    const GAMEPLAY_BACKGROUND_ENDLESS_PALETTE = {
      id: 'endless',
      base: '#050914',
      center: '#2b4c68',
      middle: '#172d43',
      depth: '#0a1a2d',
      edge: '#040812',
      upperLight: 'rgba(172, 218, 244, 0.11)',
      accentA: 'rgba(75, 198, 187, 0.12)',
      accentB: 'rgba(126, 102, 214, 0.10)',
      glowHues: [178, 192, 208, 252, 274],
    };

    const GAMEPLAY_BACKGROUND_CHAPTER_PALETTES = [
      { id: 'chapter-1', base: '#090811', center: '#55387c', middle: '#2f1f45', depth: '#120f23', edge: '#090811', upperLight: 'rgba(220, 196, 255, 0.13)', accentA: 'rgba(150, 84, 255, 0.16)', accentB: 'rgba(226, 154, 255, 0.11)', glowHues: [258, 272, 286, 304] },
      { id: 'chapter-2', base: '#050812', center: '#324c8b', middle: '#1c2a4d', depth: '#0a142a', edge: '#050812', upperLight: 'rgba(170, 210, 255, 0.14)', accentA: 'rgba(72, 151, 255, 0.15)', accentB: 'rgba(100, 224, 255, 0.1)', glowHues: [205, 220, 232, 250] },
      { id: 'chapter-3', base: '#050d0d', center: '#2b6851', middle: '#183a2d', depth: '#081e19', edge: '#050d0d', upperLight: 'rgba(178, 255, 216, 0.13)', accentA: 'rgba(79, 230, 145, 0.13)', accentB: 'rgba(96, 255, 218, 0.1)', glowHues: [145, 160, 174, 185] },
      { id: 'chapter-4', base: '#0e050a', center: '#79314d', middle: '#431b2b', depth: '#220a16', edge: '#0e050a', upperLight: 'rgba(255, 180, 203, 0.13)', accentA: 'rgba(255, 82, 132, 0.14)', accentB: 'rgba(255, 145, 104, 0.1)', glowHues: [340, 352, 8, 18] },
      { id: 'chapter-5', base: '#0f0904', center: '#7e5528', middle: '#462f16', depth: '#241608', edge: '#0f0904', upperLight: 'rgba(255, 222, 164, 0.14)', accentA: 'rgba(255, 178, 64, 0.15)', accentB: 'rgba(255, 224, 102, 0.1)', glowHues: [28, 38, 48, 55] },
      { id: 'chapter-6', base: '#040a10', center: '#2b5e83', middle: '#183449', depth: '#081927', edge: '#040a10', upperLight: 'rgba(170, 232, 255, 0.14)', accentA: 'rgba(77, 214, 255, 0.14)', accentB: 'rgba(85, 255, 222, 0.1)', glowHues: [180, 194, 208, 220] },
      { id: 'chapter-7', base: '#050e08', center: '#387341', middle: '#1f4024', depth: '#0c2011', edge: '#050e08', upperLight: 'rgba(212, 255, 176, 0.13)', accentA: 'rgba(154, 236, 86, 0.13)', accentB: 'rgba(74, 255, 166, 0.1)', glowHues: [92, 110, 130, 150] },
      { id: 'chapter-8', base: '#0b0512', center: '#683a89', middle: '#3a204c', depth: '#1c0c2a', edge: '#0b0512', upperLight: 'rgba(235, 188, 255, 0.14)', accentA: 'rgba(217, 88, 255, 0.15)', accentB: 'rgba(126, 135, 255, 0.1)', glowHues: [268, 284, 300, 320] },
      { id: 'chapter-9', base: '#070709', center: '#554838', middle: '#2f281f', depth: '#121112', edge: '#070709', upperLight: 'rgba(255, 232, 178, 0.13)', accentA: 'rgba(255, 210, 92, 0.13)', accentB: 'rgba(188, 225, 210, 0.09)', glowHues: [38, 48, 58, 172] },
      { id: 'chapter-10', base: '#05060b', center: '#5e5a75', middle: '#343241', depth: '#10111b', edge: '#05060b', upperLight: 'rgba(255, 245, 218, 0.14)', accentA: 'rgba(255, 242, 194, 0.14)', accentB: 'rgba(181, 198, 255, 0.1)', glowHues: [42, 218, 238, 262] },
    ];

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
      CAMERA_FIRST_PHASE_LATE_MOBILE_ZOOM_OUT: 0.64,
      CAMERA_FIRST_PHASE_LATE_START: 0.72,
      CAMERA_ENDLESS_ZOOM_OUT: 0.58,
      CAMERA_ENDLESS_MOBILE_ZOOM_OUT: 0.44,
      CAMERA_ZOOM_LERP: 0.035,
      ENDLESS_DEATH_RADIUS: 14,
      MOBILE_GAMEPLAY_SPEED_SCALE: 0.85,
      WORLD_SPEED_SCALE_STRENGTH: 1.28,
      WORLD_SPEED_SCALE_MAX: 1.68,
      SCORE_PER_FOOD: 10,
      SCORE_PER_SHARD: 4,
      SCORE_PER_DNA: 20,
      SCORE_PER_ENDLESS_DNA: 55,
      SCORE_PER_TOMATO: 550,
      SCORE_PER_ENEMY_BASE: 120,
      SCORE_PER_ENEMY_RADIUS: 9,
      ENDLESS_DNA_RADIUS: 9,
      ENDLESS_DNA_GROWTH: 0.46,
      TOMATO_GROWTH: 9.5,
      TOMATO_ENDLESS_GROWTH: 4.6,
      TOMATO_MAX_COUNT: 1,
      TOMATO_SPAWN_FRAMES: 1500,
      TOMATO_ENDLESS_SPAWN_FRAMES: 1080,
      ENDLESS_DNA_SPAWN_FRAMES: 120,
      ENDLESS_DNA_SPAWN_BATCH: 3,
      // Р В РІР‚ВР РЋРІР‚в„–Р В Р’В»Р В РЎвЂў 18 Р РЋР С“Р В Р’ВµР В РЎвЂќ Р Р†Р вЂљРІР‚Сњ Р РЋР С“Р В Р’В»Р В РЎвЂР РЋРІвЂљВ¬Р В РЎвЂќР В РЎвЂўР В РЎВ Р В РўвЂР В Р’В»Р В РЎвЂР В Р вЂ¦Р В Р вЂ¦Р В Р’В°Р РЋР РЏ Р В Р вЂ Р В РЎвЂўР В Р’В»Р В Р вЂ¦Р В Р’В° Р В РўвЂР В Р’В»Р РЋР РЏ Р В РЎвЂўР РЋРІР‚В°Р РЋРЎвЂњР РЋРІР‚В°Р В Р’ВµР В Р вЂ¦Р В РЎвЂР РЋР РЏ Р вЂ™Р’В«Р РЋР С“Р В РЎвЂўР В Р’В±Р РЋРІР‚в„–Р РЋРІР‚С™Р В РЎвЂР РЋР РЏР вЂ™Р’В».
      // 14 Р РЋР С“Р В Р’ВµР В РЎвЂќ: Р В РЎвЂ”Р В РЎвЂР В РЎвЂќ Р В Р вЂ  Р В РЎвЂ”Р В Р’ВµР РЋР вЂљР В Р вЂ Р РЋРІР‚в„–Р В Р’Вµ ~2 Р РЋР С“Р В Р’ВµР В РЎвЂќ, ~8 Р РЋР С“Р В Р’ВµР В РЎвЂќ Р В Р’В°Р В РЎвЂќР РЋРІР‚С™Р В РЎвЂР В Р вЂ Р В Р вЂ¦Р В РЎвЂўР В РІвЂћвЂ“ Р В Р вЂ Р В РЎвЂўР В Р’В»Р В Р вЂ¦Р РЋРІР‚в„–, ~3 Р РЋР С“Р В Р’ВµР В РЎвЂќ Р В РЎвЂ”Р В Р’ВµР РЋР вЂљР В Р’ВµР В РўвЂР РЋРІР‚в„–Р РЋРІвЂљВ¬Р В РЎвЂќР В РЎвЂ.
      WAVE_SECONDS: 14,
      DIFFICULTY_GROWTH_PER_WAVE: 0.16,
      MAX_SIZE_FACTOR_BONUS: 1.68,
      MAX_PREDATOR_BONUS: 0.42,
      MAX_SPEED_BONUS: 0.34,
      FOOD_FADE_SPEED: 0.025,
      GROWTH_SOFT_STOP_LERP: 0.055,
    };

    // ------------------------------
    // Р В РІР‚СљР В Р’В»Р В РЎвЂўР В Р’В±Р В Р’В°Р В Р’В»Р РЋР Р‰Р В Р вЂ¦Р В РЎвЂўР В Р’Вµ Р РЋР С“Р В РЎвЂўР РЋР С“Р РЋРІР‚С™Р В РЎвЂўР РЋР РЏР В Р вЂ¦Р В РЎвЂР В Р’Вµ Р В РЎвЂ”Р РЋР вЂљР В РЎвЂР В Р’В»Р В РЎвЂўР В Р’В¶Р В Р’ВµР В Р вЂ¦Р В РЎвЂР РЋР РЏ
    // ------------------------------
