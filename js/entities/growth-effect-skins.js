(function () {
  'use strict';

  const EFFECTS = {
    default: {
      id: 'default',
      color: 'rgba(175, 255, 240, 1)',
      alpha: 1,
      reach: 1,
      rings: 2,
      line: 1,
      bubbles: 0,
      arcs: 0,
      cycleMs: 2600,
      activeMs: 980,
      burst: 0,
      bodyPulse: 0,
      rays: 0
    },
    jor_growth_bubbles: {
      id: 'jor_growth_bubbles',
      color: 'rgba(118, 255, 222, 1)',
      alpha: 1.22,
      reach: 1.04,
      rings: 0,
      line: 0.9,
      bubbles: 6,
      arcs: 0,
      cycleMs: 2050,
      activeMs: 1250,
      burst: 0.45,
      bodyPulse: 0,
      rays: 0
    },
    jor_growth_pulse: {
      id: 'jor_growth_pulse',
      color: 'rgba(55, 178, 255, 1)',
      alpha: 1.38,
      reach: 1.38,
      rings: 1,
      line: 1.72,
      bubbles: 0,
      arcs: 0,
      cycleMs: 2100,
      activeMs: 1120,
      burst: 0.9,
      bodyPulse: 0,
      rays: 0
    },
    jor_growth_deepglow: {
      id: 'jor_growth_deepglow',
      color: 'rgba(175, 255, 70, 1)',
      alpha: 1.34,
      reach: 1.2,
      rings: 1,
      line: 1.16,
      bubbles: 2,
      arcs: 0,
      cycleMs: 2250,
      activeMs: 1220,
      burst: 0.55,
      bodyPulse: 0,
      rays: 0
    },
    jor_growth_abyssrings: {
      id: 'jor_growth_abyssrings',
      color: 'rgba(190, 92, 255, 1)',
      alpha: 1.45,
      reach: 1.42,
      rings: 0,
      line: 1.5,
      bubbles: 0,
      arcs: 4,
      cycleMs: 2300,
      activeMs: 1260,
      burst: 0.5,
      bodyPulse: 0,
      rays: 0
    },
    jor_growth_legendary: {
      id: 'jor_growth_legendary',
      color: 'rgba(255, 178, 42, 1)',
      alpha: 1.62,
      reach: 1.52,
      rings: 2,
      line: 1.45,
      bubbles: 5,
      arcs: 4,
      cycleMs: 2350,
      activeMs: 1320,
      burst: 0.9,
      bodyPulse: 0,
      rays: 6
    }
  };

  function getEffect(id) {
    return EFFECTS[id] || EFFECTS.default;
  }

  window.JorGrowthEffectSkins = { EFFECTS, getEffect };
})();
