function getFirstPhaseRewardCap() {
      return Math.floor(PROGRESSION_CONFIG.FIRST_PHASE_LEVELS / PROGRESSION_CONFIG.REWARD_EVERY_LEVELS);
    }

    function getEndlessRewardCap() {
      const firstLevel = PROGRESSION_CONFIG.ENDLESS_REWARD_FIRST_LEVEL ?? PROGRESSION_CONFIG.REWARD_EVERY_LEVELS;
      const step = PROGRESSION_CONFIG.ENDLESS_REWARD_EVERY_LEVELS ?? PROGRESSION_CONFIG.REWARD_EVERY_LEVELS;
      if (PROGRESSION_CONFIG.ENDLESS_LEVELS < firstLevel) return 0;
      return Math.floor((PROGRESSION_CONFIG.ENDLESS_LEVELS - firstLevel) / step) + 1;
    }

function getTotalRewardLevels() {
      return (firstPhaseRewardLevel - 1) + (endlessRewardLevel - 1);
    }

    function queueRecoveryEvolution() {
      if (recoveryEvolutionPending) return;
      recoveryEvolutionPending = true;
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

function updateEndlessProgression() {
      if (!endlessMode) return;

      endlessTime += 1;
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

function handlePostSimulationProgression() {
      if (typeof updateCampaignRun === 'function') updateCampaignRun();
      if (typeof isCampaignRunCompleted === 'function' && isCampaignRunCompleted()) return true;
      if (typeof isCampaignRunFinishing === 'function' && isCampaignRunFinishing()) return true;
      if (recoveryEvolutionCooldown > 0) recoveryEvolutionCooldown -= 1;

      const nextFirstPhaseRewardLevel = getNextFirstPhaseRewardLevel();
      const nextEndlessRewardLevel = getNextEndlessRewardLevel();
      const canOpenPhaseLevelUp = !endlessMode && nextFirstPhaseRewardLevel !== null && player.level >= nextFirstPhaseRewardLevel;
      const canOpenEndlessLevelUp = endlessMode && nextEndlessRewardLevel !== null && endlessLevel >= nextEndlessRewardLevel;
      const canOpenEvolutionNow = (player.evolutionDelayTimer ?? 0) <= 0;
      const canOpenRegularEvolution = canOpenPhaseLevelUp || canOpenEndlessLevelUp;
      if (canOpenRegularEvolution && !evolutionPending && canOpenEvolutionNow) {
        recoveryEvolutionPending = false;
        openEvolutionPanel('normal');
      } else if (recoveryEvolutionPending && recoveryEvolutionCooldown <= 0 && !evolutionPending && canOpenEvolutionNow) {
        openEvolutionPanel('recovery');
      }

      const deathRadius = endlessMode
        ? Math.max(player.minRadius, ENDLESS_CONFIG.ENDLESS_DEATH_RADIUS ?? player.minRadius)
        : player.minRadius;
      if (player.radius <= deathRadius + 0.05) {
        if (typeof hasCampaignRun === 'function' && hasCampaignRun()) {
          const stars = typeof getCampaignStars === 'function' ? getCampaignStars() : 0;
          if (typeof completeCampaignRun === 'function') completeCampaignRun(stars);
          return true;
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
      return false;
    }
