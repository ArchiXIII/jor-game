let campaignRun = null;

function getActiveCampaignLevel() {
  if (typeof App !== 'object' || App.gameMode !== 'campaign') return null;
  return window.JorCampaignLevels?.getLevel?.(App.campaignLevel) || null;
}

function hasCampaignRun() {
  return !!campaignRun;
}

function isCampaignRunCompleted() {
  return !!campaignRun?.completed;
}

function isCampaignRunFinishing() {
  return !!campaignRun?.finishing;
}

function recordCampaignFood(amount = 1) {
  if (campaignRun && !campaignRun.completed) campaignRun.food += amount;
}

function recordCampaignDna(amount = 1) {
  if (campaignRun && !campaignRun.completed) campaignRun.dna += amount;
}

function recordCampaignEnemy(amount = 1) {
  if (campaignRun && !campaignRun.completed) campaignRun.enemies += amount;
}

function recordCampaignTomato(amount = 1) {
  if (campaignRun && !campaignRun.completed) campaignRun.tomatoes += amount;
}

function startCampaignRunIfNeeded() {
  const level = getActiveCampaignLevel();
  if (!level) {
    campaignRun = null;
    if (typeof App === 'object') App.campaignResultTimeInfo = null;
    return;
  }

  campaignRun = {
    level,
    frames: 0,
    food: 0,
    dna: 0,
    enemies: 0,
    tomatoes: 0,
    bestSize: 1,
    startGrowthStage: Math.max(0, player?.growthStage || 0),
    goalReachedFrames: 0,
    finishDelay: 0,
    finishing: false,
    completed: false,
  };
  App.campaignRun = campaignRun;
  App.campaignResultTimeInfo = null;
}

function getCampaignProgressValue() {
  if (!campaignRun || !player) return 0;

  switch (campaignRun.level.type) {
    case 'food': return campaignRun.food;
    case 'dna': return campaignRun.dna;
    case 'enemy': return campaignRun.enemies;
    case 'tomato': return campaignRun.tomatoes;
    case 'score': return Math.max(0, Math.floor(Number(score) || 0));
    case 'size': return campaignRun.bestSize;
    case 'growth': return Math.max(0, (player.growthStage || 0) - campaignRun.startGrowthStage);
    case 'survive': return Math.floor(campaignRun.frames / 60);
    default: return 0;
  }
}

function getCampaignTimeLimitFrames() {
  if (!campaignRun) return 0;
  if (campaignRun.level.timeLimit) return Math.max(1, campaignRun.level.timeLimit) * 60;
  if (campaignRun.level.type === 'survive') return campaignRun.level.stars[2] * 60;
  return Math.max(75, 50 + campaignRun.level.n * 5) * 60;
}

function getCampaignStars() {
  if (!campaignRun) return 0;
  if (campaignRun.level.starMode === 'completionTime') {
    if (getCampaignProgressValue() < campaignRun.level.target) return 0;
    const elapsedSeconds = (campaignRun.goalReachedFrames || campaignRun.frames) / 60;
    const thresholds = campaignRun.level.timeStars || [];
    if (elapsedSeconds <= thresholds[2]) return 3;
    if (elapsedSeconds <= thresholds[1]) return 2;
    if (elapsedSeconds <= thresholds[0]) return 1;
    return 0;
  }
  return window.JorCampaignLevels?.getStarCount?.(campaignRun.level, getCampaignProgressValue()) || 0;
}

function getCampaignTimeInfo() {
  if (!campaignRun || campaignRun.completed) return null;
  const limitFrames = getCampaignTimeLimitFrames();
  if (limitFrames <= 0) return null;
  const elapsedFrames = Math.max(0, Math.floor(campaignRun.frames || 0));
  const remainingFrames = Math.max(0, limitFrames - elapsedFrames);
  return {
    limitFrames,
    elapsedFrames,
    remainingFrames,
    remainingSeconds: Math.ceil(remainingFrames / 60),
    progress: remainingFrames / Math.max(1, limitFrames),
  };
}

function getCampaignTopProgressText() {
  if (!campaignRun) return '';

  const level = campaignRun.level;
  const value = getCampaignProgressValue();
  const goal = level.stars[2] || level.target || 1;
  const label = window.JorCampaignLevels?.label?.(level.type) || level.type;

  if (level.type === 'survive') {
    return `${label}: ${Math.min(value, goal)}/${goal}${window.JorCampaignLevels?.label?.('seconds') || 's'}`;
  }

  return `${label}: ${Math.min(value, goal)}/${goal}`;
}

function getCampaignXpReward(level, stars, previousStars) {
  const levelNumber = Math.max(1, Math.floor(Number(level?.n) || 1));
  const safeStars = Math.max(0, Math.min(3, Math.floor(Number(stars) || 0)));
  const oldStars = Math.max(0, Math.min(3, Math.floor(Number(previousStars) || 0)));
  const newStars = Math.max(0, safeStars - oldStars);
  if (safeStars <= 0 || (oldStars > 0 && newStars <= 0)) return 0;
  const firstWinBonus = oldStars <= 0 ? 180 + levelNumber * 35 : 0;
  const starBonus = newStars * (140 + levelNumber * 25);
  return Math.max(0, Math.round(firstWinBonus + starBonus));
}

function completeCampaignRun(stars) {
  if (!campaignRun || campaignRun.completed) return;

  const safeStars = Math.max(0, Math.min(3, Math.floor(Number(stars) || 0)));
  const completedLevel = campaignRun.level;
  const completedFrames = Math.max(0, Math.floor(Number(campaignRun.frames) || 0));
  const completedProgress = getCampaignProgressValue();
  const previousStars = window.JorCampaignUI?.levelStarsFor?.(completedLevel.n) || 0;
  const xpReward = getCampaignXpReward(completedLevel, safeStars, previousStars);
  const gameplayXpReward = Math.max(0, Math.round(typeof score === 'number' ? score : 0));
  const totalXpReward = gameplayXpReward + xpReward;
  const timeInfo = typeof getCampaignTimeInfo === 'function' ? getCampaignTimeInfo() : null;
  App.campaignResultTimeInfo = safeStars > 0 && timeInfo
    ? Object.assign({}, timeInfo, { expired: timeInfo.remainingFrames <= 0 })
    : null;
  campaignRun.completed = true;
  victory = safeStars > 0;
  gameOver = safeStars <= 0;
  App.localPause = true;
  markGameplayStop();

  if (totalXpReward > 0) window.JorMetaUI?.awardXp?.(totalXpReward);

  if (safeStars > 0) {
    window.JorCampaignUI?.completeLevel?.(campaignRun.level.n, safeStars);
  }

  if (safeStars <= 0) {
    if (typeof showCampaignFailedMessage === 'function') {
      showCampaignFailedMessage(campaignRun.level, getCampaignProgressValue());
    } else {
      showMessage(currentLang === 'en' ? 'ROUND FAILED' : '\u0420\u0410\u0423\u041d\u0414 \u041d\u0415 \u041f\u0420\u041e\u0419\u0414\u0415\u041d', currentLang === 'en' ? 'Try again.' : '\u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439 \u0435\u0449\u0451 \u0440\u0430\u0437.');
    }
    return;
  }

  if (typeof showCampaignCompleteMessage === 'function') {
    showCampaignCompleteMessage(completedLevel, safeStars, completedProgress, completedFrames);
  } else {
    const title = window.JorCampaignLevels?.label?.('winTitle') || t('congratsTitle');
    const text = window.JorCampaignLevels?.label?.('winText', completedLevel.n, safeStars) || '';
    showMessage(title, text);
  }
}

function updateCampaignRun() {
  if (!campaignRun || campaignRun.completed || !player) return;

  if (campaignRun.finishing) {
    campaignRun.finishDelay -= 1;
    if (campaignRun.finishDelay <= 0) {
      completeCampaignRun(campaignRun.pendingStars);
    }
    return;
  }

  campaignRun.frames += 1;
  campaignRun.bestSize = Math.max(campaignRun.bestSize, player.level || 1);

  const value = getCampaignProgressValue();
  const threeStarTarget = campaignRun.level.starMode === 'completionTime'
    ? campaignRun.level.target
    : campaignRun.level.stars[2] || campaignRun.level.target;
  if (value >= threeStarTarget) {
    campaignRun.goalReachedFrames = campaignRun.frames;
    const stars = getCampaignStars();
    const finishDelay = Math.max(0, Math.floor(campaignRun.level.finishDelayFrames || 0));
    if (finishDelay > 0) {
      campaignRun.finishing = true;
      campaignRun.finishDelay = finishDelay;
      campaignRun.pendingStars = stars;
    } else {
      completeCampaignRun(stars || 3);
    }
    return;
  }

  const timeLimit = getCampaignTimeLimitFrames();
  if (timeLimit > 0 && campaignRun.frames >= timeLimit) {
    completeCampaignRun(getCampaignStars());
  }
}
