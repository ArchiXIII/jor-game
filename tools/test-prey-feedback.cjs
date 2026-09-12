const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const scope = vm.createContext({
  window: {},
  Math,
  clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
  lerp: (a, b, t) => a + (b - a) * t,
  playEatingSound() {},
});
for (const file of ['entity-player.js', 'entity-effects.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/entities', file), 'utf8'), scope);
}
vm.runInContext(`
  spawnEnemyEatFragments = () => {};
  this.PlayerClass = Player;
  this.ConsumeClass = EnemyConsumeEffect;
`, scope);

function makePlayer() {
  return Object.assign(Object.create(scope.PlayerClass.prototype), {
    x: 0, y: 0, radius: 40, angle: 0,
    swallowAnimationFrame: -1, swallowAnimationStrength: 0,
    swallowPreparation: 0, swallowPreparationTimer: 0,
    preySwallowStrength: 0, preyZoomFrame: -1, preyZoomCooldown: 0,
    preyZoomStrength: 0,
  });
}

for (const ratio of [0.4, 0.5, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.95, 1]) {
  const eater = makePlayer();
  scope.player = eater;
  const source = { x: 60, y: 0, radius: ratio * 40, angle: 0, swimPhase: 0, hurtPulse: 0, damageFlash: 0 };
  const effect = new scope.ConsumeClass(source, eater, { particleCount: 0 });
  let soundCount = 0;
  let soundFrame = -1;
  scope.playEatingSound = () => { soundCount++; soundFrame = effect.frame; };
  let triggerCount = 0;
  const trigger = eater.triggerPreySwallow;
  eater.triggerPreySwallow = function (value) {
    triggerCount++;
    assert.ok(effect.frame / effect.duration >= 0.9);
    assert.equal(value, Math.max(0.3, Math.min(1, ratio)));
    trigger.call(this, value);
  };
  eater.radius = 60;
  for (let i = 0; i < effect.duration; i++) {
    eater.x += 6;
    effect.update();
    assert.ok(Number.isFinite(source.x) && Number.isFinite(source.y));
  }
  assert.equal(triggerCount, ratio > 0.5 ? 1 : 0);
  assert.equal(soundCount, 1);
  assert.equal(soundFrame, Math.ceil(effect.duration * (ratio > 0.5 ? 0.9 : 0.24)));
  const amplitude = eater.preyZoomStrength;
  assert.ok(amplitude <= 0.03);
  if (ratio <= 0.5) assert.equal(eater.preyZoomFrame, -1);
  if (ratio === 0.7) assert.ok(Math.abs(amplitude - 0.012) < 1e-9);
  if (ratio === 0.8) assert.ok(amplitude > 0.02);
  if (ratio >= 0.85) assert.equal(amplitude, 0.03);
  if (ratio > 0.5) {
    eater.angle = Math.PI;
    eater.triggerPreySwallow = trigger;
    eater.triggerPreySwallow(1);
    assert.equal(eater.preyZoomStrength, amplitude);
    assert.equal(eater.preyZoomCooldown, 24);
  }
  for (let frame = 0; frame <= 22; frame++) {
    eater.preyZoomFrame = frame;
    const scale = eater.getPreyZoomScale();
    assert.ok(scale >= 1 && scale <= 1.03);
    if (frame === 0 || frame === 22) assert.equal(scale, 1);
    if (frame === 7) assert.equal(scale, 1 + amplitude);
  }
  effect.release();
  assert.equal(effect.source, null);
  source.radius = 38;
  eater.radius = 40;
  effect.reset(source, eater);
  assert.equal(effect.swallowTriggered, false);
  assert.equal(effect.biteTriggered, false);
}

const npc = makePlayer();
scope.player = makePlayer();
npc.triggerPreySwallow = () => assert.fail('NPC triggered player feedback');
const npcEffect = new scope.ConsumeClass({ x: 50, y: 0, radius: 38, swimPhase: 0 }, npc);
for (let i = 0; i < npcEffect.duration; i++) npcEffect.update();
assert.equal(npc.preyZoomFrame, -1);
console.log('Prey feedback: size thresholds, timing, captured ratio, moving eater, cooldown, pooling and NPC isolation passed.');
