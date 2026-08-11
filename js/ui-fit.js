(() => {
  'use strict';

  const root = document.documentElement;
  const targets = [];
  let frame = 0;

  function viewportSize() {
    const viewport = window.visualViewport;
    return {
      width: Math.max(1, Math.round(viewport?.width || window.innerWidth || 1)),
      height: Math.max(1, Math.round(viewport?.height || window.innerHeight || 1)),
      left: Math.round(viewport?.offsetLeft || 0),
      top: Math.round(viewport?.offsetTop || 0)
    };
  }

  function visible(element) {
    if (!element || element.hidden) return false;
    const style = getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }

  function metaBottom(viewport) {
    const bar = document.getElementById('metaTopBar');
    if (!visible(bar)) return 8;
    const rect = bar.getBoundingClientRect();
    return Math.max(8, Math.round(rect.bottom - viewport.top + 8));
  }

  function gameHudBottom(viewport) {
    let bottom = 8;
    const score = document.getElementById('topProgress');
    const timer = document.getElementById('campaignTimer');
    if (visible(score)) bottom = Math.max(bottom, score.getBoundingClientRect().bottom - viewport.top + 8);
    if (visible(timer)) bottom = Math.max(bottom, timer.getBoundingClientRect().bottom - viewport.top + 8);
    return Math.round(bottom);
  }

  function sizeFor(name, viewport, element) {
    const compact = viewport.height <= 620;
    switch (name) {
      case 'start': return compact ? [560, 230] : [560, 440];
      case 'campaign':
        if (viewport.height <= 500) return [640, 280];
        if (viewport.height <= 560) return [680, 390];
        return [680, 570];
      case 'shop': return viewport.height <= 520 || viewport.width <= 660 ? [620, 340] : [740, 560];
      case 'roundIntro': return viewport.height <= 520 || viewport.width <= 700 ? [390, 190] : [430, 240];
      case 'pause': return [400, 180];
      case 'exitConfirm': return compact ? [336, 196] : [410, 220];
      case 'profile': return [430, 340];
      case 'leaderboard': return compact ? [480, 360] : [480, 640];
      case 'xpLeaderboard': return compact ? [460, 360] : [460, 560];
      case 'evolution': return viewport.height <= 520 ? [560, 230] : [980, 310];
      case 'message':
        if (element.classList.contains('campaignCompleteDialog')) return compact ? [500, 320] : [540, 520];
        if (element.classList.contains('leaderboardDialog')) return compact ? [460, 360] : [460, 540];
        if (element.classList.contains('levelFailedDialog')) return compact ? [410, 300] : [410, 360];
        return compact ? [500, 260] : [560, 300];
      default: return [400, 300];
    }
  }

  function setProperty(element, name, value) {
    if (element.style.getPropertyValue(name) !== value) element.style.setProperty(name, value);
  }

  function fitTarget(entry, viewport, reservedMeta, reservedHud) {
    const element = entry.element;
    const size = sizeFor(entry.name, viewport, element);
    const simpleMessage = entry.name === 'message'
      && !element.classList.contains('campaignCompleteDialog')
      && !element.classList.contains('leaderboardDialog')
      && !element.classList.contains('levelFailedDialog');
    const contentHeight = entry.name === 'roundIntro'
      || entry.name === 'pause'
      || simpleMessage
      || (entry.name === 'evolution' && viewport.height <= 520);
    let top = 8;
    let bottom = 8;
    let left = 8;
    let right = 8;

    if (entry.reserveMeta) top = reservedMeta;
    if (entry.reserveHud) top = reservedHud;
    if (entry.name === 'campaign') {
      top = Math.max(8, reservedMeta - 4);
      bottom = 16;
    }

    const availableWidth = Math.max(1, viewport.width - left - right);
    const availableHeight = Math.max(1, viewport.height - top - bottom);
    setProperty(element, '--ui-fit-width', `${size[0]}px`);
    setProperty(element, '--ui-fit-height', contentHeight ? 'auto' : `${size[1]}px`);
    const targetHeight = contentHeight && visible(element)
      ? Math.max(1, element.scrollHeight + 2)
      : size[1];
    const scale = Math.min(1, availableWidth / size[0], availableHeight / targetHeight);
    let centerX = left + availableWidth * 0.5;
    let centerY = top + availableHeight * 0.5;
    if (entry.fixedCenter) {
      centerX -= (1 - scale) * size[0] * 0.5;
      centerY -= (1 - scale) * targetHeight * 0.5;
    }

    setProperty(element, '--ui-fit-scale', scale.toFixed(4));
    setProperty(element, '--ui-fit-center-x', `${Math.round(centerX)}px`);
    setProperty(element, '--ui-fit-center-y', `${Math.round(centerY)}px`);
  }

  function fitAll() {
    frame = 0;
    const viewport = viewportSize();
    const reservedMeta = metaBottom(viewport);
    const reservedHud = gameHudBottom(viewport);
    setProperty(root, '--ui-meta-bottom', reservedMeta + 'px');
    setProperty(root, '--ui-game-hud-bottom', reservedHud + 'px');
    for (let i = 0; i < targets.length; i += 1) fitTarget(targets[i], viewport, reservedMeta, reservedHud);
    const message = document.getElementById('centerMessage');
    document.body.classList.toggle('uiFitMessageOpen', visible(message));
  }

  function scheduleFit() {
    if (frame) return;
    frame = requestAnimationFrame(fitAll);
  }

  function register(selector, name, reserveMeta = false, reserveHud = false, fixedCenter = false) {
    const element = document.querySelector(selector);
    if (!element) return;
    element.classList.add('uiFitTarget');
    targets.push({ element, name, reserveMeta, reserveHud, fixedCenter });
  }

  register('.startCard', 'start', true);
  register('.campaignPanel', 'campaign', true);
  register('.shopPanel', 'shop');
  register('.campaignRoundIntro', 'roundIntro', false, true, true);
  register('.pauseCard', 'pause', false, true, true);
  register('.exitConfirmCard', 'exitConfirm', false, true, true);
  register('.metaProfileModal', 'profile');
  register('#metaLeaderboardModal', 'leaderboard');
  register('#metaXpLeaderboardModal', 'xpLeaderboard');
  register('.evolutionPanel', 'evolution', false, true, true);
  register('.centerMessage', 'message', false, true, true);

  const observer = new MutationObserver(scheduleFit);
  const observed = [
    ...targets.map(entry => entry.element),
    document.getElementById('metaTopBar'),
    document.getElementById('topProgress'),
    document.getElementById('campaignTimer')
  ];
  for (let i = 0; i < observed.length; i += 1) {
    if (!observed[i]) continue;
    observer.observe(observed[i], {
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'aria-hidden']
    });
  }

  window.addEventListener('resize', scheduleFit, { passive: true });
  window.addEventListener('orientationchange', scheduleFit, { passive: true });
  window.visualViewport?.addEventListener('resize', scheduleFit, { passive: true });
  window.visualViewport?.addEventListener('scroll', scheduleFit, { passive: true });
  window.JorUIFit = { refresh: scheduleFit };
  scheduleFit();
})();
