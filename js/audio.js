const AUDIO = {
      urls: {
        button: 'audio/button.wav',
        death: 'audio/death.wav',
        eating: 'audio/eating.wav',
        flash: 'audio/flash.wav',
      },
      volumes: {
        button: 0.5,
        death: 0.7,
        eating: 0.45,
        flash: 0.55,
      },
      maxVoices: {
        button: 4,
        death: 2,
        eating: 3,
        flash: 2,
      },
      buffers: Object.create(null),
      loading: Object.create(null),
      activeCounts: Object.create(null),
      sfxMaster: null,
      readyPromise: null,
      unlocked: false,
      muted: false,
      platformMuted: false,
    };
    const AUDIO_MUTED_STORAGE_KEY = 'jorAudioMuted';
    if (window.JorPlatform?.features?.sdkManagedStorage !== true) {
      try {
        AUDIO.muted = window.localStorage.getItem(AUDIO_MUTED_STORAGE_KEY) === '1';
      } catch (error) {}
    }
    function isAudioMuted() {
      return AUDIO.muted
        || AUDIO.platformMuted
        || (typeof App !== 'undefined' && (App.platformPaused || App.orientationBlocked));
    }

    // -----------------------------------------------------------------------
    // Процедурная фоновая музыка (Web Audio API).
    // Атмосферный амбиент для клеточной стадии: медленный пэд, бел-мелодия
    // по D-дорийской пентатонике, sub-bass и редкие «капли». Бесконечно
    // генерируется в реальном времени, без внешних аудиофайлов.
    // -----------------------------------------------------------------------
    const ProcMusic = {
      ctx: null,
      master: null,
      reverbIn: null,
      active: false,
      schedulerId: null,
      nextNoteTime: 0,
      step: 0,
      bpm: 64,
      targetVolume: 0.32,
      // D-дорийский лад (D, E, F, G, A, B, C) — мистический, но не тревожный.
      scale: [0, 2, 3, 5, 7, 9, 10],
      rootMidi: 50, // D3
      // Тихая прогрессия аккордов по ступеням лада: i — v — III — VII — iv — i — VI — V
      chordProgression: [0, 4, 2, 6, 3, 0, 5, 4],
      lookaheadSec: 0.3,
      schedulerMs: 90,

      midiToFreq(m) {
        return 440 * Math.pow(2, (m - 69) / 12);
      },

      init() {
        if (this.ctx) return true;
        try {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return false;
          try {
            this.ctx = new AC({ latencyHint: 'interactive' });
          } catch (error) {
            this.ctx = new AC();
          }
          this.master = this.ctx.createGain();
          this.master.gain.value = 0.0;
          this.master.connect(this.ctx.destination);
          setupSfxOutput();

          // Простой реверб через delay+feedback с демпфированием —
          // даёт ощущение «подводного пространства».
          const delay = this.ctx.createDelay(2.0);
          delay.delayTime.value = 0.34;
          const fb = this.ctx.createGain();
          fb.gain.value = 0.42;
          const dampen = this.ctx.createBiquadFilter();
          dampen.type = 'lowpass';
          dampen.frequency.value = 2400;
          delay.connect(dampen);
          dampen.connect(fb);
          fb.connect(delay);
          const wet = this.ctx.createGain();
          wet.gain.value = 0.32;
          delay.connect(wet);
          wet.connect(this.master);
          this.reverbIn = delay;
          preloadSfxBuffers();
          return true;
        } catch (e) {
          this.ctx = null;
          return false;
        }
      },

      // Долгий «дышащий» пэд: два расстроенных пилы + синус на октаву ниже,
      // через медленный lowpass.
      playPad(midi, durationSec, when) {
        const ctx = this.ctx;
        if (!ctx) return;
        const g = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.value = 3.0;
        filter.frequency.setValueAtTime(360, when);
        filter.frequency.linearRampToValueAtTime(1100, when + durationSec * 0.45);
        filter.frequency.linearRampToValueAtTime(520, when + durationSec);

        const o1 = ctx.createOscillator();
        o1.type = 'sawtooth';
        o1.frequency.value = this.midiToFreq(midi);
        o1.detune.value = -8;
        const o2 = ctx.createOscillator();
        o2.type = 'sawtooth';
        o2.frequency.value = this.midiToFreq(midi);
        o2.detune.value = +8;
        const o3 = ctx.createOscillator();
        o3.type = 'sine';
        o3.frequency.value = this.midiToFreq(midi - 12);

        o1.connect(filter);
        o2.connect(filter);
        o3.connect(filter);
        filter.connect(g);
        g.connect(this.master);
        if (this.reverbIn) g.connect(this.reverbIn);

        const peak = 0.085;
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(peak, when + durationSec * 0.4);
        g.gain.linearRampToValueAtTime(peak * 0.7, when + durationSec * 0.75);
        g.gain.linearRampToValueAtTime(0.0001, when + durationSec);

        const stopAt = when + durationSec + 0.15;
        o1.start(when); o2.start(when); o3.start(when);
        o1.stop(stopAt); o2.stop(stopAt); o3.stop(stopAt);
      },

      // Колокольчик: синус + слегка расстроенная вторая гармоника, быстрая атака,
      // долгий экспоненциальный спад.
      playBell(midi, when) {
        const ctx = this.ctx;
        if (!ctx) return;
        const g = ctx.createGain();
        const o1 = ctx.createOscillator();
        o1.type = 'sine';
        o1.frequency.value = this.midiToFreq(midi);
        const o2 = ctx.createOscillator();
        o2.type = 'sine';
        o2.frequency.value = this.midiToFreq(midi) * 2.013;
        const g2 = ctx.createGain();
        g2.gain.value = 0.22;

        o1.connect(g);
        o2.connect(g2);
        g2.connect(g);
        g.connect(this.master);
        if (this.reverbIn) g.connect(this.reverbIn);

        const peak = 0.16;
        const decay = 1.8;
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(peak, when + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, when + decay);

        const stopAt = when + decay + 0.1;
        o1.start(when); o2.start(when);
        o1.stop(stopAt); o2.stop(stopAt);
      },

      // Сабовый удар-«пульс» — короткое скольжение частоты вниз.
      playSub(midi, when) {
        const ctx = this.ctx;
        if (!ctx) return;
        const g = ctx.createGain();
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(this.midiToFreq(midi) * 1.6, when);
        o.frequency.exponentialRampToValueAtTime(this.midiToFreq(midi - 12), when + 0.18);
        o.connect(g);
        g.connect(this.master);
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(0.20, when + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, when + 0.7);
        o.start(when);
        o.stop(when + 0.8);
      },

      // Случайная «капля» в высоком регистре — лёгкий сверкающий блик.
      playDrop(when) {
        const ctx = this.ctx;
        if (!ctx) return;
        const g = ctx.createGain();
        const o = ctx.createOscillator();
        o.type = 'sine';
        const noteIdx = Math.floor(Math.random() * this.scale.length);
        const f = this.midiToFreq(this.rootMidi + 24 + this.scale[noteIdx]);
        o.frequency.setValueAtTime(f * 0.55, when);
        o.frequency.exponentialRampToValueAtTime(f * 1.4, when + 0.16);
        o.connect(g);
        g.connect(this.master);
        if (this.reverbIn) g.connect(this.reverbIn);
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(0.07, when + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, when + 0.28);
        o.start(when);
        o.stop(when + 0.32);
      },

      // Шаг секвенсора: 16 шагов на такт, 8 тактов в цикле прогрессии.
      scheduleStep(step, when, secPerBeat) {
        const barLen = 16;
        const inBar = step % barLen;
        const barIdx = Math.floor(step / barLen) % this.chordProgression.length;
        const chordDeg = this.chordProgression[barIdx];
        const chordRoot = this.rootMidi + this.scale[chordDeg];

        // Пэд меняется каждый такт.
        if (inBar === 0) {
          this.playPad(chordRoot, secPerBeat * barLen, when);
          this.playPad(chordRoot + 7, secPerBeat * barLen, when);
        }

        // Sub на сильных долях.
        if (inBar === 0 || inBar === 8) {
          this.playSub(chordRoot - 12, when);
        }

        // Мелодия — редко, на определённых шагах, с долей случайности.
        const melodyStops = [0, 3, 6, 10, 12, 14];
        if (melodyStops.indexOf(inBar) !== -1 && Math.random() < 0.55) {
          const octaveBonus = Math.random() < 0.35 ? 12 : 0;
          const noteIdx = Math.floor(Math.random() * this.scale.length);
          const midi = this.rootMidi + 12 + octaveBonus + this.scale[noteIdx];
          const offset = Math.random() < 0.25 ? secPerBeat * 0.5 : 0;
          this.playBell(midi, when + offset);
        }

        // Редкие «капли».
        if (Math.random() < 0.05) {
          this.playDrop(when + Math.random() * secPerBeat);
        }
      },

      scheduleAhead() {
        const ctx = this.ctx;
        if (!ctx || !this.active) return;
        const secPerBeat = 60 / this.bpm / 4; // 16-е = шаг
        while (this.nextNoteTime < ctx.currentTime + this.lookaheadSec) {
          this.scheduleStep(this.step, this.nextNoteTime, secPerBeat);
          this.step++;
          this.nextNoteTime += secPerBeat;
        }
      },

      start() {
        if (!this.init()) return;
        if (this.active) {
          // На случай если контекст был приостановлен платформой.
          if (this.ctx.state === 'suspended') {
            try { this.ctx.resume(); } catch (e) {}
          }
          return;
        }
        if (this.ctx.state === 'suspended') {
          try { this.ctx.resume(); } catch (e) {}
        }
        this.active = true;
        this.nextNoteTime = this.ctx.currentTime + 0.12;
        // step не обнуляем — даём музыке продолжаться с прежнего места после паузы.

        try {
          const now = this.ctx.currentTime;
          this.master.gain.cancelScheduledValues(now);
          this.master.gain.setValueAtTime(this.master.gain.value || 0, now);
          this.master.gain.linearRampToValueAtTime(this.targetVolume, now + 1.6);
        } catch (e) {}

        this.schedulerId = setInterval(() => {
          try { this.scheduleAhead(); } catch (e) {}
        }, this.schedulerMs);
      },

      stop() {
        if (!this.active) return;
        this.active = false;
        if (this.schedulerId) {
          clearInterval(this.schedulerId);
          this.schedulerId = null;
        }
        if (this.ctx && this.master) {
          try {
            const now = this.ctx.currentTime;
            this.master.gain.cancelScheduledValues(now);
            this.master.gain.setValueAtTime(this.master.gain.value, now);
            this.master.gain.linearRampToValueAtTime(0.0001, now + 0.45);
          } catch (e) {}
        }
      },

      setVolume(v) {
        this.targetVolume = Math.max(0, Math.min(1, v));
        if (this.active && this.ctx && this.master) {
          try {
            const now = this.ctx.currentTime;
            this.master.gain.cancelScheduledValues(now);
            this.master.gain.setValueAtTime(this.master.gain.value, now);
            this.master.gain.linearRampToValueAtTime(this.targetVolume, now + 0.4);
          } catch (e) {}
        }
      },
    };

    function setupSfxOutput() {
      const ctx = ProcMusic.ctx;
      if (!ctx || AUDIO.sfxMaster) return;
      AUDIO.sfxMaster = ctx.createGain();
      AUDIO.sfxMaster.gain.value = isAudioMuted() ? 0 : 1;
      AUDIO.sfxMaster.connect(ctx.destination);
    }

    function updateSfxOutput() {
      const ctx = ProcMusic.ctx;
      const master = AUDIO.sfxMaster;
      if (!ctx || !master) return;
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(isAudioMuted() ? 0 : 1, now);
    }

    function loadSfxBuffer(name) {
      if (AUDIO.buffers[name]) return Promise.resolve(AUDIO.buffers[name]);
      if (AUDIO.loading[name]) return AUDIO.loading[name];
      const url = AUDIO.urls[name];
      if (!url || !ProcMusic.init() || !ProcMusic.ctx || !window.fetch) return Promise.resolve(null);
      const request = window.fetch(url)
        .then((response) => {
          if (!response.ok) throw new Error(`Sound not found: ${url}`);
          return response.arrayBuffer();
        })
        .then((data) => ProcMusic.ctx.decodeAudioData(data))
        .then((buffer) => {
          AUDIO.buffers[name] = buffer;
          return buffer;
        })
        .catch(() => null)
        .finally(() => {
          delete AUDIO.loading[name];
        });
      AUDIO.loading[name] = request;
      return request;
    }

    function preloadSfxBuffers() {
      if (AUDIO.readyPromise) return AUDIO.readyPromise;
      const names = Object.keys(AUDIO.urls);
      const requests = new Array(names.length);
      for (let i = 0; i < names.length; i += 1) requests[i] = loadSfxBuffer(names[i]);
      AUDIO.readyPromise = Promise.all(requests);
      window.JorAudioReady = AUDIO.readyPromise;
      return AUDIO.readyPromise;
    }

    function playSfx(name) {
      if (isAudioMuted()) return;
      reviveAudio();
      const ctx = ProcMusic.ctx;
      const buffer = AUDIO.buffers[name];
      if (!ctx || !buffer || !AUDIO.sfxMaster) {
        loadSfxBuffer(name);
        return;
      }
      const active = AUDIO.activeCounts[name] || 0;
      if (active >= (AUDIO.maxVoices[name] || 2)) return;
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      source.buffer = buffer;
      gain.gain.value = AUDIO.volumes[name] || 0.5;
      source.connect(gain);
      gain.connect(AUDIO.sfxMaster);
      AUDIO.activeCounts[name] = active + 1;
      source.onended = () => {
        AUDIO.activeCounts[name] = Math.max(0, (AUDIO.activeCounts[name] || 1) - 1);
        source.disconnect();
        gain.disconnect();
      };
      source.start(ctx.currentTime);
    }

    function reviveAudio() {
      try {
        ProcMusic.init();
        preloadSfxBuffers();
        if (ProcMusic.ctx && ProcMusic.ctx.state === 'suspended') {
          const resumePromise = ProcMusic.ctx.resume();
          if (resumePromise && typeof resumePromise.then === 'function') {
            resumePromise.then(() => {
              AUDIO.unlocked = true;
            }).catch(() => {});
          }
        }
        if (ProcMusic.ctx && ProcMusic.ctx.state !== 'closed') {
          AUDIO.unlocked = true;
        }
      } catch (e) {}
    }

    function unlockAudio() {
      reviveAudio();
      if (AUDIO.unlocked && (!ProcMusic.ctx || ProcMusic.ctx.state === 'running')) return;
      // Инициализируем AudioContext именно по жесту пользователя —
      // это снимает автоплей-блокировку в браузерах.
      try { ProcMusic.init(); } catch (e) {}
      try {
        if (ProcMusic.ctx && ProcMusic.ctx.state === 'suspended') {
          ProcMusic.ctx.resume();
        }
      } catch (e) {}
    }

    function playButtonSound() {
      try {
        playSfx('button');
      } catch (error) {}
    }

    function playDeathSound() {
      try {
        playSfx('death');
      } catch (error) {}
    }

    function playEatingSound() {
      try {
        playSfx('eating');
      } catch (error) {}
    }

    function playGrowthSound() {
      try {
        if (isAudioMuted()) return;
        reviveAudio();
        if (!AUDIO.unlocked) return;
        if (!ProcMusic.init() || !ProcMusic.ctx) return;

        const ctx = ProcMusic.ctx;
        if (ctx.state === 'suspended') {
          try { ctx.resume(); } catch (error) {}
        }

        const now = ctx.currentTime;
        const out = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1150, now);
        filter.frequency.exponentialRampToValueAtTime(3200, now + 0.22);
        filter.Q.value = 4.2;
        out.gain.setValueAtTime(0.0001, now);
        out.gain.linearRampToValueAtTime(0.2, now + 0.025);
        out.gain.exponentialRampToValueAtTime(0.0001, now + 0.56);
        filter.connect(out);
        out.connect(AUDIO.sfxMaster || ctx.destination);

        const low = ctx.createOscillator();
        low.type = 'sine';
        low.frequency.setValueAtTime(145, now);
        low.frequency.exponentialRampToValueAtTime(92, now + 0.18);
        low.connect(filter);
        low.start(now);
        low.stop(now + 0.6);

        for (let i = 0; i < 2; i++) {
          const start = now + 0.04 + i * 0.095;
          const g = ctx.createGain();
          const o = ctx.createOscillator();
          o.type = 'sine';
          o.frequency.setValueAtTime(280 + i * 105, start);
          o.frequency.exponentialRampToValueAtTime(620 + i * 150, start + 0.12);
          g.gain.setValueAtTime(0.0001, start);
          g.gain.linearRampToValueAtTime(0.16 - i * 0.02, start + 0.015);
          g.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
          o.connect(g);
          g.connect(filter);
          o.start(start);
          o.stop(start + 0.32);
        }
      } catch (error) {}
    }

    function ensureAmbientMusic(force = false) {
      try {
        if (isAudioMuted()) {
          pauseAmbientMusic();
          return;
        }
        if (!AUDIO.unlocked) return;
        if (App.userPaused) return;
        if (App.orientationBlocked) return;
        if (!force && (App.localPause || App.platformPaused || document.hidden)) return;
        ProcMusic.start();
      } catch (error) {}
    }

    function pauseAmbientMusic() {
      try {
        ProcMusic.stop();
      } catch (error) {}
    }

    function setAudioMuted(value, persist = true) {
      AUDIO.muted = Boolean(value);
      if (persist) {
        if (window.JorPlatform?.features?.sdkManagedStorage === true) {
          window.JorSaveManager?.updateSection?.('settings', (settings) => ({
            ...settings,
            audioMuted: AUDIO.muted
          }), true);
        } else {
          try {
            window.localStorage.setItem(AUDIO_MUTED_STORAGE_KEY, AUDIO.muted ? '1' : '0');
          } catch (error) {}
        }
      }
      updateSfxOutput();
      if (isAudioMuted()) {
        pauseAmbientMusic();
      } else {
        ensureAmbientMusic();
      }
    }

    function toggleAudioMuted() {
      if (AUDIO.platformMuted) return;
      setAudioMuted(!AUDIO.muted);
    }

    function setPlatformAudioMuted(value) {
      AUDIO.platformMuted = Boolean(value);
      updateSfxOutput();
      if (isAudioMuted()) {
        pauseAmbientMusic();
      } else {
        ensureAmbientMusic();
      }
      if (typeof updateAudioToggleButton === 'function') updateAudioToggleButton();
      window.JorMetaUI?.render?.();
    }

    function syncAudioSettingsFromSave() {
      if (window.JorPlatform?.features?.sdkManagedStorage !== true) return;
      const settings = window.JorSaveManager?.getSection?.('settings', null);
      if (typeof settings?.audioMuted === 'boolean') setAudioMuted(settings.audioMuted, false);
    }

    function handlePlatformPause() {
      App.platformPaused = true;
      updateSfxOutput();
      pauseAmbientMusic();
      markGameplayStop();
    }

    function handlePlatformResume() {
      App.platformPaused = false;
      reviveAudio();
      updateSfxOutput();
      ensureAmbientMusic(true);
      markGameplayStart();
    }

    function playFlashSound() {
      try {
        playSfx('flash');
      } catch (error) {}
    }

    try {
      if (ProcMusic.init()) preloadSfxBuffers();
    } catch (error) {
      window.JorAudioReady = Promise.resolve([]);
    }
