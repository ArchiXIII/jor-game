function unlockRewardMutationChoice() {
  if (App.rewardedUsedThisEvolution) return;
  if (currentChoices.length < 3) {
    const extraMutation = getRewardMutationChoice(currentChoices);
    if (extraMutation) {
      currentChoices = [...currentChoices, { ...extraMutation, bonus: true }];
    }
  }
  App.rewardedUsedThisEvolution = true;
}

async function showRewardedRerollAd() {
  if (App.rewardedUsedThisEvolution) return;

  if (window.JorShopUI?.hasNoRewardAds?.()) {
    unlockRewardMutationChoice();
    renderEvolutionChoices();
    updateRewardButtonState();
    return;
  }

  if (!App.sdkReady || !window.JorPlatform?.hasFeature?.('rewardedAds')) {
    unlockRewardMutationChoice();
    renderEvolutionChoices();
    updateRewardButtonState();
    return;
  }

  if (DOM.rewardAdBtn) {
    DOM.rewardAdBtn.disabled = true;
  }
  markGameplayStop(false);

  await window.JorPlatform.showRewarded({
    onOpen: () => {
      handlePlatformPause();
    },
    onRewarded: () => {
      unlockRewardMutationChoice();
      renderEvolutionChoices();
      updateRewardButtonState();
    },
    onClose: () => {
      handlePlatformResume();
      if (!App.rewardedUsedThisEvolution) updateRewardButtonState();
    },
    onError: (error) => {
      console.error('Rewarded video error:', error);
      handlePlatformResume();
      updateRewardButtonState();
    }
  });
}

function updateRewardButtonState() {
  if (!DOM.rewardAdBtn) return;
  DOM.rewardAdBtn.disabled = App.rewardedUsedThisEvolution;
  DOM.rewardAdBtn.textContent = App.rewardedUsedThisEvolution
    ? t('rewardButtonUsed')
    : (window.JorShopUI?.hasNoRewardAds?.() ? t('rewardButtonNoAd') : t('rewardButtonDefault'));
}

function areEvolutionChoicesLocked() {
  return Date.now() < (App.evolutionChoiceLockedUntil || 0);
}

function updateEvolutionChoiceLockState() {
  if (!DOM.evolutionCards) return;
  const locked = areEvolutionChoicesLocked();
  for (const button of DOM.evolutionCards.querySelectorAll('button.card')) {
    button.disabled = locked;
  }
}

function lockEvolutionChoices(durationMs = 500) {
  App.evolutionChoiceLockedUntil = Date.now() + durationMs;
  if (App.evolutionChoiceUnlockTimer) {
    clearTimeout(App.evolutionChoiceUnlockTimer);
  }
  App.evolutionChoiceUnlockTimer = setTimeout(() => {
    App.evolutionChoiceUnlockTimer = null;
    updateEvolutionChoiceLockState();
  }, durationMs);
}

function getRewardCounterAfterChoice(reachedLevel, currentRewardLevel, cap) {
  const reachedRewardLevel = Math.floor(reachedLevel / PROGRESSION_CONFIG.REWARD_EVERY_LEVELS) + 1;
  return Math.min(cap + 1, Math.max(currentRewardLevel + 1, reachedRewardLevel));
}

function getMutationIconSvg(id) {
  const paths = {
    spike: `
      <path d="M18 5L20.8 14.2L30 18L20.8 21.8L18 31L15.2 21.8L6 18L15.2 14.2Z"></path>
      <path d="M18 11V25"></path>
      <path d="M11 18H25"></path>
    `,
    tail: `
      <path d="M8 22C13 11 24 11 28 18"></path>
      <path d="M28 18C24 18 22 20.5 21 25"></path>
      <path d="M11 21C15 24 19 24.5 23 22"></path>
    `,
    shell: `
      <path d="M18 6L28 11V18C28 24.5 24.2 28.8 18 31C11.8 28.8 8 24.5 8 18V11Z"></path>
      <path d="M18 10V27"></path>
      <path d="M11 17H25"></path>
    `,
    maw: `
      <path d="M8 19C10 11 16 8 24 9C22 14 22 22 24 27C16 28 10 25 8 19Z"></path>
      <path d="M13 17L18 19L13 21"></path>
      <path d="M23 13L20 17"></path>
      <path d="M23 25L20 21"></path>
    `,
    dash: `
      <path d="M7 20H22"></path>
      <path d="M17 13L25 20L17 27"></path>
      <path d="M7 13H13"></path>
      <path d="M7 27H13"></path>
    `,
    tentacle: `
      <path d="M10 27C11 19 17 18 18 12C18.7 8.5 16 7 13 8.5"></path>
      <path d="M18 28C19 21 25 20 26 14C26.6 10.2 24 8.5 21 10"></path>
      <path d="M26 15C28.5 16 29 18.4 27.5 20.5"></path>
    `,
    shatter: `
      <path d="M18 11L22 18L18 25L14 18Z"></path>
      <path d="M8 14L11 12"></path>
      <path d="M25 9L27 6"></path>
      <path d="M28 22L31 24"></path>
      <path d="M10 28L7 31"></path>
    `,
    agility: `
      <path d="M26 12C23.8 9.6 20.8 8.5 17.8 8.8C12.8 9.3 9 13.4 9 18.4"></path>
      <path d="M10 25C12.2 27.4 15.2 28.5 18.2 28.2C23.2 27.7 27 23.6 27 18.6"></path>
      <path d="M26 8V12H22"></path>
      <path d="M10 29V25H14"></path>
    `,
  };

  return `
    <svg class="mutationCardSvg" viewBox="0 0 36 36" aria-hidden="true" focusable="false">
      ${paths[id] ?? paths.spike}
    </svg>
  `;
}

function buildMutationCard(mutation, index) {
  const button = document.createElement('button');
  button.className = mutation.bonus ? 'card bonusCard' : 'card';
  button.type = 'button';
  button.style.gridColumn = String(index + 1);
  button.style.borderColor = `${mutation.accent ?? '#8befff'}66`;
  button.style.boxShadow = `inset 0 0 0 1px ${mutation.accent ?? '#8befff'}22, 0 10px 24px rgba(0,0,0,0.18)`;
  button.style.background = `linear-gradient(180deg, ${(mutation.accent ?? '#8befff')}1f 0%, rgba(20,40,52,0.96) 38%, rgba(16,32,42,0.98) 100%)`;

  const currentLevel = getMutationLevel(mutation.id);
  const nextLevel = currentLevel + 1;

  button.innerHTML = `
    <div class="mutationCardHeader">
      <div class="mutationCardIcon" style="background:${mutation.accent ?? '#8befff'}22;border-color:${mutation.accent ?? '#8befff'}55;color:${mutation.accent ?? '#8befff'};">${getMutationIconSvg(mutation.id)}</div>
      <div class="mutationCardTitleWrap">
        <h3>${mutation.title}</h3>
        <div class="mutationCardHint">${mutation.hint}</div>
      </div>
    </div>
    <p>${mutation.desc}</p>
    <small style="margin-top:12px;opacity:0.95;">${t('mutationLevel', currentLevel, nextLevel)}</small>
  `;

  button.onclick = () => {
    if (areEvolutionChoicesLocked()) return;
    dashRequested = false;
    if (player) player.dashTime = 0;
    player.applyMutation(mutation.id);
    if (evolutionRewardSource === 'recovery') {
      recoveryEvolutionPending = false;
      recoveryEvolutionCooldown = PROGRESSION_CONFIG.RECOVERY_EVOLUTION_COOLDOWN_FRAMES;
    } else if (endlessMode) {
      endlessRewardLevel = getEndlessRewardCounterAfterChoice(
        endlessLevel,
        endlessRewardLevel,
        getEndlessRewardCap()
      );
    } else {
      firstPhaseRewardLevel = getRewardCounterAfterChoice(
        player.level,
        firstPhaseRewardLevel,
        getFirstPhaseRewardCap()
      );
    }
    closeEvolutionPanel();
  };

  return button;
}

function buildLockedRewardCard() {
  const button = document.createElement('button');
  button.className = 'card lockedCard';
  button.type = 'button';
  button.style.gridColumn = '3';
  button.innerHTML = `
    <h3>${t('lockedRewardTitle')}</h3>
    <p>${t('lockedRewardText')}</p>
  `;

  button.onclick = () => {
    if (areEvolutionChoicesLocked()) return;
    showRewardedRerollAd();
  };
  return button;
}

function renderEvolutionChoices() {
  if (!currentChoices.length) {
    currentChoices = getMutationChoices();
  }

  DOM.evolutionCards.innerHTML = '';

  currentChoices.forEach((mutation, index) => {
    DOM.evolutionCards.appendChild(buildMutationCard(mutation, index));
  });

  if (!App.rewardedUsedThisEvolution) {
    DOM.evolutionCards.appendChild(buildLockedRewardCard());
  }

  updateEvolutionChoiceLockState();
}

async function openEvolutionPanel(source = 'normal') {
  evolutionRewardSource = source;
  evolutionPending = true;
  App.localPause = true;
  dashRequested = false;
  if (player) player.dashTime = 0;
  markGameplayStop();

  App.rewardedUsedThisEvolution = false;
  lockEvolutionChoices(500);
  currentChoices = getMutationChoices();
  if (window.JorShopUI?.hasNoRewardAds?.()) {
    unlockRewardMutationChoice();
  }

  updateRewardButtonState();
  DOM.evolutionText.textContent = t('evolutionChoose')

  renderEvolutionChoices();
  showElement(DOM.overlay);
  showElement(DOM.evolutionPanel);
}

async function closeEvolutionPanel() {
  evolutionPending = false;
  App.localPause = false;
  dashRequested = false;
  currentChoices = [];
  App.evolutionChoiceLockedUntil = 0;
  if (App.evolutionChoiceUnlockTimer) {
    clearTimeout(App.evolutionChoiceUnlockTimer);
    App.evolutionChoiceUnlockTimer = null;
  }

  hideElement(DOM.overlay);
  hideElement(DOM.evolutionPanel);

  markGameplayStart();
}
