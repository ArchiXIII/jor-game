function escapeHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function formatCompactScore(value) {
      const scoreValue = Math.max(0, Math.round(value || 0));
      return scoreValue.toLocaleString(getLocale());
    }

    function getLeaderboardTopTitle() {
      return currentLang === 'en' ? 'Top players' : '\u0422\u043e\u043f \u0438\u0433\u0440\u043e\u043a\u043e\u0432';
    }

    function getLeaderboardTopBadge() {
      return currentLang === 'en' ? 'Ranking' : '\u0420\u0435\u0439\u0442\u0438\u043d\u0433';
    }

    function getLeaderboardUnavailableText() {
      return currentLang === 'en'
        ? 'Leaderboard data is temporarily unavailable'
        : '\u0414\u0430\u043d\u043d\u044b\u0435 \u0440\u0435\u0439\u0442\u0438\u043d\u0433\u0430 \u0432\u0440\u0435\u043c\u0435\u043d\u043d\u043e \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b';
    }

    function getLeaderboardPlayerFallbackName() {
      return currentLang === 'en' ? 'Player' : '\u0418\u0433\u0440\u043e\u043a';
    }

    function getLeaderboardScorePrefix() {
      return currentLang === 'en' ? 'Score' : '\u0421\u0447\u0451\u0442';
    }

    function normalizeGameOverLeaderboardEntries(entries, currentUserId) {
      const rows = Array.isArray(entries?.entries) ? entries.entries : [];
      return rows
        .map(entry => {
          const rank = Number(entry?.rank);
          if (!Number.isFinite(rank)) return null;
          const uniqueId = entry?.player?.uniqueID || '';
          return {
            rank,
            name: entry?.player?.publicName || getLeaderboardPlayerFallbackName(),
            score: Math.max(0, Math.round(entry?.score || 0)),
            isPlayer: !!uniqueId && !!currentUserId && uniqueId === currentUserId,
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.rank - b.rank);
    }

    function getGameOverLeaderboardRows(entries, currentUserId) {
      const sorted = normalizeGameOverLeaderboardEntries(entries, currentUserId);
      const top = sorted.filter(entry => entry.rank <= 5).slice(0, 5);
      const player = sorted.find(entry => entry.isPlayer);
      const rows = top.slice();

      if (player && !top.some(entry => entry.rank === player.rank)) {
        const around = sorted.filter(entry => (
          Math.abs(entry.rank - player.rank) <= 2 &&
          !rows.some(row => row.rank === entry.rank)
        ));
        if (around.length) {
          rows.push({ divider: true });
          around.forEach(entry => rows.push(entry));
        }
      }

      if (!rows.length && sorted.length) return sorted.slice(0, 7);
      return rows.slice(0, 9);
    }

    function getGameOverLeaderboardTitle() {
      return currentLang === 'en' ? 'LEADERBOARD' : '\u0420\u0415\u0419\u0422\u0418\u041d\u0413';
    }

    function getGoldfishUnlockScore() {
      const item = (window.JorShopCharacterItems || []).find(entry => entry?.id === 'jor_char_goldfish');
      return Math.max(1, Math.floor(Number(item?.unlockEndlessScore) || 50000));
    }

    function getGoldfishUnlockText() {
      return currentLang === 'en'
        ? 'Goldfish unlocked!'
        : '\u041e\u0442\u043a\u0440\u044b\u0442\u0430 \u0417\u043e\u043b\u043e\u0442\u0430\u044f \u0440\u044b\u0431\u043a\u0430!';
    }

    function getGameOverLoadingText() {
      return currentLang === 'en' ? 'Updating leaderboard...' : '\u041e\u0431\u043d\u043e\u0432\u043b\u044f\u0435\u043c \u0440\u0435\u0439\u0442\u0438\u043d\u0433...';
    }

    function getGameOverPendingText() {
      return currentLang === 'en'
        ? 'Your place will appear after score publishing'
        : '\u0412\u0430\u0448\u0435 \u043c\u0435\u0441\u0442\u043e \u043f\u043e\u044f\u0432\u0438\u0442\u0441\u044f \u043f\u043e\u0441\u043b\u0435 \u043f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u0438 \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u0430';
    }

    function buildGameOverLeaderboardRowsHtml(rows) {
      if (!rows.length) {
        return `<div class="leaderboardPending">${escapeHtml(getGameOverPendingText())}</div>`;
      }

      return rows.map(row => {
        if (row.divider) return '<div class="leaderboardGap" aria-hidden="true">...</div>';
        const rankClass = Number.isFinite(row.rank) && row.rank <= 3 ? ` top${row.rank}` : '';
        return `
          <div class="leaderboardRow${row.isPlayer ? ' currentUser' : ''}${rankClass}">
            <div class="leaderboardRank">${escapeHtml(row.rank)}</div>
            <div class="leaderboardNameWrap">
              <div class="leaderboardName">${escapeHtml(row.name)}</div>
            </div>
            <div class="leaderboardPoints">${formatCompactScore(row.score)}</div>
          </div>
        `;
      }).join('');
    }

    function buildLeaderboardHtml(finalScore, entries, isAuthorized, state = 'ready', goldfishUnlocked = false) {
      const currentUserId = App.player && typeof App.player.getUniqueID === 'function'
        ? App.player.getUniqueID()
        : '';
      const rows = state === 'ready' ? getGameOverLeaderboardRows(entries, currentUserId) : [];
      const enemiesEatenLabel = t('enemiesEaten');
      const enemiesEatenValue = formatCompactScore(enemiesEatenThisRound);
      const isLoading = state === 'loading';
      const isError = state === 'error';

      return `
        <div class="leaderboardPanel gameOverPanel">
          <div class="leaderboardScoreCard">
            <div class="leaderboardScoreValue">${escapeHtml(getLeaderboardScorePrefix())}: ${formatCompactScore(finalScore)}</div>
            ${goldfishUnlocked ? `<div class="goldfishUnlockNotice">${escapeHtml(getGoldfishUnlockText())}</div>` : ''}
            <div class="leaderboardRunStat"><span>${escapeHtml(enemiesEatenLabel)}:</span> <strong>${enemiesEatenValue}</strong></div>
            ${isAuthorized ? '' : `<div class="leaderboardLoginHint">${escapeHtml(t('leaderboardLoginHint'))}</div>`}
          </div>

          <div class="leaderboardTitle">${escapeHtml(getGameOverLeaderboardTitle())}</div>
          <div class="leaderboardListCard">
            <div class="leaderboardRows">
              ${isLoading
                ? `<div class="leaderboardPending">${escapeHtml(getGameOverLoadingText())}</div>`
                : isError
                  ? `<div class="leaderboardPending">${escapeHtml(getLeaderboardUnavailableText())}</div>`
                  : buildGameOverLeaderboardRowsHtml(rows)}
            </div>
          </div>
        </div>
      `;
    }

    async function showGameOverWithLeaderboard() {
      const sessionId = runtimeSessionId;
      const finalScore = Math.max(0, Math.round(score || 0));
      const unlockScore = getGoldfishUnlockScore();
      const savedMeta = window.JorSaveManager?.getSection?.('meta', {}) || {};
      const previousBest = Math.max(0, Math.floor(Number(App.bestEndlessScore || 0)), Math.floor(Number(App.lastLeaderboardScore || 0)), Math.floor(Number(savedMeta.bestEndlessScore || 0)));
      const goldfishUnlocked = previousBest < unlockScore && finalScore >= unlockScore;
      App.bestEndlessScore = Math.max(previousBest, finalScore);
      if (App.bestEndlessScore > Math.floor(Number(savedMeta.bestEndlessScore || 0))) {
        window.JorSaveManager?.updateSection?.('meta', (meta) => ({ ...meta, bestEndlessScore: App.bestEndlessScore }), true);
      }
      App.localPause = true;
      markGameplayStop();

      showHtmlMessage(
        t('congratsTitle'),
        buildLeaderboardHtml(finalScore, null, false, 'loading', goldfishUnlocked),
        'congrats'
      );

      if (App.sdkReady && !App.player) {
        await initYandexPlayer();
        if (sessionId !== runtimeSessionId || !gameOver) return;
      }

      const isAuthorized = isAuthorizedYandexPlayer();

      if (isAuthorized) {
        await submitScoreToLeaderboard(App.bestEndlessScore);
        if (sessionId !== runtimeSessionId || !gameOver) return;
      }

      if (App.metaXpAwardedSession !== sessionId) {
        App.metaXpAwardedSession = sessionId;
        window.JorMetaUI?.awardXp?.(finalScore);
      }

      const entries = await loadLeaderboardEntries(isAuthorized);
      if (sessionId !== runtimeSessionId || !gameOver) return;

      App.lastLeaderboardScore = finalScore;
      App.lastLeaderboardEntries = entries;
      App.lastLeaderboardAuthorized = isAuthorized;

      showHtmlMessage(
        t('congratsTitle'),
        buildLeaderboardHtml(finalScore, entries, isAuthorized, entries ? 'ready' : 'error', goldfishUnlocked),
        'congrats'
      );
    }

    function getCampaignFailedTitle(levelNumber = App.campaignLevel || 1) {
      const level = Math.max(1, Math.floor(Number(levelNumber) || 1));
      return currentLang === 'en' ? `ROUND ${level} FAILED` : `\u0420\u0410\u0423\u041d\u0414 ${level} \u041d\u0415 \u041f\u0420\u041e\u0419\u0414\u0415\u041d`;
    }

    function getCampaignFailedReason() {
      return currentLang === 'en' ? 'GOAL NOT COMPLETED' : '\u0426\u0415\u041b\u042c \u041d\u0415 \u0412\u042b\u041f\u041e\u041b\u041d\u0415\u041d\u0410';
    }

    function getCampaignCompleteTitle() {
      return currentLang === 'en' ? 'ROUND COMPLETE' : '\u0420\u0410\u0423\u041d\u0414 \u0417\u0410\u0412\u0415\u0420\u0428\u0401\u041d';
    }

    function getCampaignCompleteTitleForLevel(levelNumber) {
      const level = Math.max(1, Math.floor(Number(levelNumber) || 1));
      return currentLang === 'en'
        ? `ROUND ${level} COMPLETE`
        : `\u0420\u0410\u0423\u041d\u0414 ${level} \u0417\u0410\u0412\u0415\u0420\u0428\u0401\u041d`;
    }

    function getCampaignNextButtonText() {
      return currentLang === 'en' ? 'NEXT ROUND' : '\u0421\u041b\u0415\u0414\u0423\u042e\u0429\u0418\u0419 \u0420\u0410\u0423\u041d\u0414';
    }

    function buildCampaignStarRow(stars) {
      const earned = Math.max(0, Math.min(3, Math.floor(Number(stars) || 0)));
      let html = '';
      for (let i = 1; i <= 3; i += 1) {
        html += `<img class="campaignResultStar${i <= earned ? ' active' : ''}" src="sprites/ui/level_star.webp" alt="" aria-hidden="true">`;
      }
      return html;
    }

    function normalizeCampaignStarsEntries(entries, currentUserId) {
      const rows = Array.isArray(entries?.entries) ? entries.entries : Array.isArray(entries) ? entries : [];
      return rows
        .map(entry => {
          const rank = Number(entry?.rank);
          if (!Number.isFinite(rank)) return null;
          const uniqueId = entry?.player?.uniqueID || '';
          return {
            rank,
            name: entry?.player?.publicName || entry?.name || getLeaderboardPlayerFallbackName(),
            score: Math.max(0, Math.floor(entry?.score || 0)),
            isPlayer: !!entry?.isUser || (!!uniqueId && !!currentUserId && uniqueId === currentUserId),
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.rank - b.rank);
    }

    function getCampaignStarsRows(entries, currentUserId) {
      const sorted = normalizeCampaignStarsEntries(entries, currentUserId);
      const top = sorted.filter(entry => entry.rank <= 3).slice(0, 3);
      const player = sorted.find(entry => entry.isPlayer);

      const rows = top.slice();

      if (player && !top.some(entry => entry.rank === player.rank)) {
        const around = sorted.filter(entry => (
          Math.abs(entry.rank - player.rank) <= 1 &&
          !rows.some(row => row.rank === entry.rank)
        ));
        if (around.length) {
          rows.push({ divider: true });
          around.forEach(entry => rows.push(entry));
        }
      }

      if (!rows.length && sorted.length) return sorted.slice(0, 3);
      return rows.slice(0, 7);
    }

    function buildCampaignStarsLeaderboardRows(rows) {
      if (!rows.length) {
        return `<div class="campaignResultLeaderboardPending">${escapeHtml(getGameOverPendingText())}</div>`;
      }

      return rows.map(row => {
        if (row.divider) return '<div class="campaignResultLeaderboardGap" aria-hidden="true">...</div>';
        const rankClass = Number.isFinite(row.rank) && row.rank <= 3 ? ` top${row.rank}` : '';
        return `
          <div class="campaignResultLeaderboardRow${row.isPlayer ? ' currentUser' : ''}${rankClass}">
            <div class="campaignResultLeaderboardRank">${escapeHtml(row.rank)}</div>
            <div class="campaignResultLeaderboardName">${escapeHtml(row.name)}</div>
            <div class="campaignResultLeaderboardScore">${formatCompactScore(row.score)}</div>
          </div>
        `;
      }).join('');
    }

    function buildCampaignStarsLeaderboardHtml(entries, state = 'loading') {
      const currentUserId = App.player && typeof App.player.getUniqueID === 'function'
        ? App.player.getUniqueID()
        : '';
      const rows = state === 'ready' ? getCampaignStarsRows(entries, currentUserId) : [];
      const title = currentLang === 'en' ? 'STARS RATING' : '\u0420\u0415\u0419\u0422\u0418\u041d\u0413 \u0417\u0412\u0401\u0417\u0414';
      const content = state === 'loading'
        ? `<div class="campaignResultLeaderboardPending">${escapeHtml(getGameOverLoadingText())}</div>`
        : state === 'error'
          ? `<div class="campaignResultLeaderboardPending">${escapeHtml(getLeaderboardUnavailableText())}</div>`
          : buildCampaignStarsLeaderboardRows(rows);

      return `
        <div class="campaignResultLeaderboard">
          <div class="campaignResultLeaderboardTitle">${escapeHtml(title)}</div>
          <div class="campaignResultLeaderboardRows">${content}</div>
        </div>
      `;
    }

    function revealCampaignLeaderboardPlayer() {
      requestAnimationFrame(() => {
        const rows = DOM.messageText?.querySelector('.campaignResultLeaderboardRows');
        const player = rows?.querySelector('.currentUser');
        if (!rows || !player || rows.scrollHeight <= rows.clientHeight) return;
        rows.scrollTop = Math.max(0, player.offsetTop - rows.offsetTop - (rows.clientHeight - player.offsetHeight) * 0.5);
      });
    }

    function buildCampaignCompleteHtml(level, stars, progressValue, elapsedFrames, leaderboardEntries = null, leaderboardState = 'loading') {
      const levelNumber = level?.n || App.campaignLevel || 1;
      const chapter = Math.max(0, Math.floor((levelNumber - 1) / 10));
      const hasNewTrophy = App.campaignResultTrophyChapter === chapter;
      const trophyLabel = currentLang === 'en' ? 'Chapter trophy earned' : '\u041a\u0443\u0431\u043e\u043a \u0433\u043b\u0430\u0432\u044b \u043f\u043e\u043b\u0443\u0447\u0435\u043d';
      const unlockedItem = (window.JorShopPetItems || []).find(item => item?.id === App.campaignResultUnlockedShopItemId);
      const unlockLabel = unlockedItem
        ? (currentLang === 'en' ? `Pet unlocked: ${unlockedItem.en}` : `\u041e\u0442\u043a\u0440\u044b\u0442 \u043f\u0438\u0442\u043e\u043c\u0435\u0446: ${unlockedItem.ru}`)
        : '';

      return `
        <div class="campaignResultPanel">
          <div class="campaignResultStars">${buildCampaignStarRow(stars)}</div>
          ${hasNewTrophy ? '<div class="campaignResultTrophy"><img src="sprites/ui/chapter_trophy.png" alt="" aria-hidden="true"><span>' + escapeHtml(trophyLabel) + '</span></div>' : ''}
          ${unlockLabel ? `<div class="campaignResultUnlock">${escapeHtml(unlockLabel)}</div>` : ''}
          ${buildCampaignStarsLeaderboardHtml(leaderboardEntries, leaderboardState)}
        </div>
      `;
    }

    async function loadCampaignStarsLeaderboard() {
      const localValue = window.JorCampaignUI?.totalStars?.() || 0;
      if (typeof window.JorMetaUI?.submitStars === 'function') {
        await window.JorMetaUI.submitStars();
      }
      if (!App.sdkReady || !App.ysdk?.leaderboards) {
        return localValue > 0
          ? { entries: [{ rank: 1, name: getLeaderboardPlayerFallbackName(), score: localValue, isUser: true }], state: 'ready' }
          : { entries: null, state: 'error' };
      }

      try {
        const entries = await App.ysdk.leaderboards.getEntries('jorStars', {
          quantityTop: 3,
          includeUser: true,
          quantityAround: 1,
        });
        return { entries, state: 'ready' };
      } catch (error) {
        return { entries: null, state: 'error' };
      }
    }

    async function showCampaignCompleteMessage(level, stars, progressValue = 0, elapsedFrames = 0, leaderboardEntries = null, leaderboardState = 'loading') {
      App.localPause = true;
      markGameplayStop();
      DOM.messageTitle.textContent = getCampaignCompleteTitleForLevel(level?.n || App.campaignLevel || 1);
      DOM.messageTitle.dataset.messageKey = 'campaignComplete';
      DOM.messageText.innerHTML = buildCampaignCompleteHtml(level, stars, progressValue, elapsedFrames, leaderboardEntries, leaderboardState);
      DOM.messageText.className = 'campaignResultMessage';
      DOM.messageText.dataset.messageMode = 'campaignComplete';
      DOM.centerMessage.classList.remove('leaderboardDialog', 'levelFailedDialog');
      DOM.centerMessage.classList.add('campaignCompleteDialog');
      if (DOM.messageRetryBtn) {
        DOM.messageRetryBtn.hidden = true;
      }
      if (DOM.restartBtn) DOM.restartBtn.textContent = currentLang === 'en' ? 'MAIN MENU' : '\u0413\u041b\u0410\u0412\u041d\u041e\u0415 \u041c\u0415\u041d\u042e';
      if (DOM.messageOurGamesBtn) {
        DOM.messageOurGamesBtn.hidden = false;
        DOM.messageOurGamesBtn.disabled = false;
        DOM.messageOurGamesBtn.removeAttribute('aria-disabled');
        DOM.messageOurGamesBtn.dataset.action = 'nextCampaignRound';
        DOM.messageOurGamesBtn.textContent = getCampaignNextButtonText();
      }
      DOM.centerMessage.style.display = 'block';
      updateCampaignTimer();
      if (leaderboardState === 'ready') revealCampaignLeaderboardPlayer();

      if (leaderboardState === 'loading') {
        const result = await loadCampaignStarsLeaderboard();
        if (DOM.messageTitle?.dataset?.messageKey !== 'campaignComplete') return;
        const leaderboard = DOM.messageText.querySelector('.campaignResultLeaderboard');
        if (leaderboard) {
          leaderboard.outerHTML = buildCampaignStarsLeaderboardHtml(result.entries, result.state);
          if (result.state === 'ready') revealCampaignLeaderboardPlayer();
        }
      }
    }

    function buildCampaignFailedHtml(level, progressValue) {
      const levelNumber = level?.n || App.campaignLevel || 1;
      const label = window.JorCampaignLevels?.label?.(level?.type) || '';
      const target = level?.stars?.[0] || level?.target || 1;
      const value = Math.max(0, Math.floor(Number(progressValue) || 0));
      const suffix = level?.type === 'survive' ? (window.JorCampaignLevels?.label?.('seconds') || 's') : '';
      const levelText = currentLang === 'en' ? `ROUND ${levelNumber}` : `\u0420\u0410\u0423\u041d\u0414 ${levelNumber}`;
      return `
        <div class="campaignFailedPanel">
          <div class="campaignFailedReason">${escapeHtml(getCampaignFailedReason())}</div>
          <div class="campaignFailedProgress">
            <span>${escapeHtml(label)}</span>
            <strong>${escapeHtml(Math.min(value, target))}/${escapeHtml(target)}${escapeHtml(suffix)}</strong>
          </div>
        </div>
      `;
    }

    function showCampaignFailedMessage(level, progressValue = 0) {
      App.localPause = true;
      markGameplayStop();
      DOM.messageTitle.textContent = getCampaignFailedTitle(level?.n || App.campaignLevel || 1);
      DOM.messageTitle.dataset.messageKey = 'levelFailed';
      DOM.messageText.innerHTML = buildCampaignFailedHtml(level, progressValue);
      DOM.messageText.className = 'campaignFailedMessage';
      DOM.messageText.dataset.messageMode = 'campaignFailed';
      DOM.centerMessage.classList.remove('leaderboardDialog');
      DOM.centerMessage.classList.remove('campaignCompleteDialog');
      DOM.centerMessage.classList.add('levelFailedDialog');
      if (DOM.messageRetryBtn) {
        DOM.messageRetryBtn.hidden = false;
        DOM.messageRetryBtn.textContent = currentLang === 'en' ? 'RESTART' : '\u041f\u0415\u0420\u0415\u0417\u0410\u041f\u0423\u0421\u0422\u0418\u0422\u042c';
      }
      if (DOM.restartBtn) DOM.restartBtn.textContent = currentLang === 'en' ? 'MAIN MENU' : '\u0413\u041b\u0410\u0412\u041d\u041e\u0415 \u041c\u0415\u041d\u042e';
      DOM.centerMessage.style.display = 'block';
    }

