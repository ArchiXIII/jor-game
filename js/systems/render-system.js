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

    function drawCampaignTomatoEdgeIndicator() {
      if (!player || !tomatoFoods.length || App.gameMode !== 'campaign') return;
      const level = typeof getActiveCampaignLevel === 'function' ? getActiveCampaignLevel() : null;
      if (level?.type !== 'tomato') return;

      const tomato = tomatoFoods[0];
      const zoom = camera.zoom || 1;
      const screenX = (tomato.x - camera.x) * zoom;
      const screenY = (tomato.y - camera.y) * zoom;
      const screenRadius = Math.max(10, tomato.radius * zoom);
      if (
        screenX + screenRadius > 0 &&
        screenX - screenRadius < canvas.width &&
        screenY + screenRadius > 0 &&
        screenY - screenRadius < canvas.height
      ) return;

      const centerX = canvas.width * 0.5;
      const centerY = canvas.height * 0.5;
      const dx = screenX - centerX;
      const dy = screenY - centerY;
      const margin = 30;
      const scaleX = Math.abs(dx) > 0.001 ? (centerX - margin) / Math.abs(dx) : Infinity;
      const scaleY = Math.abs(dy) > 0.001 ? (centerY - margin) / Math.abs(dy) : Infinity;
      const edgeScale = Math.min(scaleX, scaleY);
      const x = centerX + dx * edgeScale;
      const y = centerY + dy * edgeScale;
      const angle = Math.atan2(dy, dx);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = 'rgba(255, 68, 61, 0.96)';
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(2, -10);
      ctx.lineTo(2, 10);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-4, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(105, 225, 103, 0.98)';
      ctx.beginPath();
      ctx.moveTo(-8, -8);
      ctx.lineTo(-2, -16);
      ctx.lineTo(1, -7);
      ctx.closePath();
      ctx.fill();
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
      if (typeof drawCampaignCurrents === 'function') drawCampaignCurrents();
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
      drawEnemyEatEffects();
      for (const orb of dnaOrbs) {
        if (isOutsideBounds(orb, renderBounds, orb.radius + 18)) continue;
        orb.draw();
      }
      for (const tomato of tomatoFoods) {
        if (isOutsideBounds(tomato, renderBounds, tomato.radius + 24)) continue;
        tomato.draw();
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
      drawCampaignTomatoEdgeIndicator();
      drawMobileEnemyEdgeIndicators();

    }
