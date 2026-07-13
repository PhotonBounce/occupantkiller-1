  // Low ammo warning sound
  function playLowAmmo() {
    if (!enabled || !ctx) return;
    resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.25);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

/* ───────────────────────────────────────────────────────────
   AUDIO SYSTEM — Procedural sound effects via Web Audio API
   ─────────────────────────────────────────────────────────── */
window.AudioSystem = (function () {
  'use strict';

  let ctx = null;
  let masterGain = null;
  let enabled = true;
  let volume = 0.5;

  function init() {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = volume;
      // Bass-heavy master EQ: low-shelf +6 dB at 120 Hz, slight high cut to soften screech
      var bass = ctx.createBiquadFilter(); bass.type = 'lowshelf'; bass.frequency.value = 120; bass.gain.value = 6;
      var sub  = ctx.createBiquadFilter(); sub.type  = 'peaking';  sub.frequency.value  =  60; sub.gain.value  = 4; sub.Q.value = 0.9;
      var hicut= ctx.createBiquadFilter(); hicut.type= 'highshelf'; hicut.frequency.value = 9000; hicut.gain.value = -2;
      masterGain.connect(bass);
      bass.connect(sub);
      sub.connect(hicut);
      hicut.connect(ctx.destination);
    } catch (e) {
      enabled = false;
    }
  }

  // Resume context on user gesture (required by browsers)
  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  // ── Sound Generators ────────────────────────────────────

  function playGunshot(type) {
    // type: 'pistol', 'rifle', 'sniper', 'hmg', 'shotgun', 'smg', 'launcher', 'explosive', 'melee'
    if (!enabled || !ctx || ctx.state === 'suspended') return;
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var noise = createNoise(0.08);
    var gain = ctx.createGain();
    var filter = ctx.createBiquadFilter();
    var params = {
      pistol:       { freq: 800, decay: 0.06, noiseVol: 0.4, filterFreq: 3000 },
      rifle:        { freq: 400, decay: 0.10, noiseVol: 0.6, filterFreq: 2000 },
      sniper:       { freq: 200, decay: 0.15, noiseVol: 0.8, filterFreq: 1500 },
      heavy_sniper: { freq: 120, decay: 0.22, noiseVol: 0.95, filterFreq: 1000 },
      hmg:          { freq: 300, decay: 0.08, noiseVol: 0.7, filterFreq: 1800 },
      smg:          { freq: 600, decay: 0.05, noiseVol: 0.5, filterFreq: 2400 },
      shotgun:      { freq: 250, decay: 0.18, noiseVol: 0.95, filterFreq: 1200 },
      launcher:     { freq: 90,  decay: 0.30, noiseVol: 0.9,  filterFreq: 800 },
      explosive:    { freq: 70,  decay: 0.35, noiseVol: 1.0,  filterFreq: 600 },
      melee:        { freq: 220, decay: 0.04, noiseVol: 0.3,  filterFreq: 4000 },
    }[type] || { freq: 400, decay: 0.10, noiseVol: 0.6, filterFreq: 2000 };

    filter.type = 'lowpass';
    filter.frequency.value = params.filterFreq;

    osc.frequency.setValueAtTime(params.freq, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + params.decay);
    osc.type = 'sawtooth';

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + params.decay);

    osc.connect(filter);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + params.decay);

    // Environmental echo: check for ceiling above player
    var isIndoor = false;
    if (typeof window.VoxelWorld !== 'undefined' && window.VoxelWorld.getBlock && typeof GameManager !== 'undefined' && GameManager.getPlayer) {
      var pp = GameManager.getPlayer().position;
      if (pp) isIndoor = window.VoxelWorld.getBlock(Math.floor(pp.x), Math.floor(pp.y) + 4, Math.floor(pp.z)) !== 0;
    }
    if (isIndoor) {
      // Indoor reverb: two short delayed reflections
      [0.05, 0.12].forEach(function(del, i) {
        var echo = createNoise(del + 0.08);
        var eGain = ctx.createGain();
        var eFilt = ctx.createBiquadFilter();
        eFilt.type = 'lowpass';
        eFilt.frequency.value = params.filterFreq * 0.6;
        eGain.gain.setValueAtTime(0, now);
        eGain.gain.setValueAtTime((i === 0 ? 0.12 : 0.06), now + del);
        eGain.gain.exponentialRampToValueAtTime(0.001, now + del + 0.06);
        echo.connect(eFilt);
        eFilt.connect(eGain);
        eGain.connect(masterGain);
      });
    } else {
      // Outdoor: single distant echo
      var outEcho = createNoise(0.55);
      var outGain = ctx.createGain();
      var outFilt = ctx.createBiquadFilter();
      outFilt.type = 'lowpass';
      outFilt.frequency.value = 400;
      outGain.gain.setValueAtTime(0, now);
      outGain.gain.setValueAtTime(0.04, now + 0.3);
      outGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      outEcho.connect(outFilt);
      outFilt.connect(outGain);
      outGain.connect(masterGain);
    }
  }

  // --- Place wrapAudio and return block at the end of the IIFE ---
  function wrapAudio(fn, name) {
    return function() {
      try { return fn.apply(this, arguments); }
      catch(e) {
        if (window.showAudioWarning) window.showAudioWarning('Failed to play sound: ' + name + '\n' + (e.message||e));
      }
    }
  }


  // Procedural explosion sound (deep boom + noise burst)
  function playExplosion() {
    if (!enabled || !ctx || ctx.state === 'suspended') return;
    resume();
    var now = ctx.currentTime;
    // Deep boom
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.5);
    // Noise burst overlay
    var noise = createNoise(0.32);
    var noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.13, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    noise.connect(noiseGain);
    noiseGain.connect(masterGain);
  }

  // Distant mortar/artillery boom - low rumble for ambient war atmosphere


  function playFlashbang() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    // High-pitched burst + ringing
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(4000, now);
    osc.frequency.exponentialRampToValueAtTime(2000, now + 0.5);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.8);
    // Tinnitus ring
    var ring = ctx.createOscillator();
    var ringGain = ctx.createGain();
    ring.type = 'sine';
    ring.frequency.value = 3200;
    ringGain.gain.setValueAtTime(0.1, now + 0.1);
    ringGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
    ring.connect(ringGain);
    ringGain.connect(masterGain);
    ring.start(now + 0.1);
    ring.stop(now + 2.0);
  }

  // Procedural mine detonation sound (deep boom + metallic ping)
  function playMine() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    // Deep boom
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.4);
    // Metallic ping overlay
    var ping = ctx.createOscillator();
    var pingGain = ctx.createGain();
    ping.type = 'triangle';
    ping.frequency.setValueAtTime(1800, now + 0.1);
    ping.frequency.exponentialRampToValueAtTime(600, now + 0.5);
    pingGain.gain.setValueAtTime(0.08, now + 0.1);
    pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    ping.connect(pingGain);
    pingGain.connect(masterGain);
    ping.start(now + 0.1);
    ping.stop(now + 0.5);
  }

  // Procedural smoke grenade sound (soft pop + hiss)
  function playSmoke() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    // Soft pop
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.12);
    // Hiss (noise burst)
    var hiss = createNoise(0.7);
    var hissGain = ctx.createGain();
    hissGain.gain.setValueAtTime(0.09, now + 0.1);
    hissGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    hiss.connect(hissGain);
    hissGain.connect(masterGain);
  }

  // ── Spatial panning helper ─────────────────────────────
  // pos = {x,z} sound source, listener = {x,z} camera, angle = camera Y rotation
  function _safeAudio(v) { return isFinite(v) ? v : 0; }
  // Safe AudioParam setter — prevents non-finite value errors (especially in headless)
  function _safePV(param, v) { if (isFinite(v)) param.value = v; }

  function _calcPan(pos, listener, angle) {
    if (!pos || !listener) return 0;
    var dx = (pos.x || 0) - (listener.x || 0), dz = (pos.z || 0) - (listener.z || 0);
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (!isFinite(dist) || dist < 0.1) return 0;
    // Angle from listener to source relative to listener facing direction
    var toSource = Math.atan2(dx, dz);
    var rel = toSource - (angle || 0);
    return Math.max(-1, Math.min(1, Math.sin(rel)));
  }

  function playSpatialGunshot(type, worldPos, listenerPos, listenerAngle) {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var noise = createNoise(0.08);
    var gain = ctx.createGain();
    var filter = ctx.createBiquadFilter();
    var params = {
      pistol:       { freq: 800, decay: 0.06, noiseVol: 0.4, filterFreq: 3000 },
      rifle:        { freq: 400, decay: 0.10, noiseVol: 0.6, filterFreq: 2000 },
      sniper:       { freq: 200, decay: 0.15, noiseVol: 0.8, filterFreq: 1500 },
      heavy_sniper: { freq: 120, decay: 0.22, noiseVol: 0.95, filterFreq: 1000 },
      hmg:          { freq: 300, decay: 0.08, noiseVol: 0.7, filterFreq: 1800 },
      smg:          { freq: 600, decay: 0.05, noiseVol: 0.5, filterFreq: 2400 },
      shotgun:      { freq: 250, decay: 0.18, noiseVol: 0.95, filterFreq: 1200 },
      launcher:     { freq: 90,  decay: 0.30, noiseVol: 0.9,  filterFreq: 800 },
      explosive:    { freq: 70,  decay: 0.35, noiseVol: 1.0,  filterFreq: 600 },
      melee:        { freq: 220, decay: 0.04, noiseVol: 0.3,  filterFreq: 4000 },
      silenced:     { freq: 480, decay: 0.04, noiseVol: 0.18, filterFreq: 2200 },
      gatling:      { freq: 350, decay: 0.045, noiseVol: 0.55, filterFreq: 2100 },
    }[type] || { freq: 400, decay: 0.10, noiseVol: 0.6, filterFreq: 2000 };
    filter.type = 'lowpass';
    filter.frequency.value = params.filterFreq;
    osc.frequency.setValueAtTime(params.freq, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + params.decay);
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + params.decay);
    // Spatial panning (guarded for Safari < 14.1)
    var panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (panner) _safePV(panner.pan, _calcPan(worldPos, listenerPos, listenerAngle));
    // Distance attenuation
    if (listenerPos && worldPos) {
      var ddx = (worldPos.x || 0) - (listenerPos.x || 0), ddz = (worldPos.z || 0) - (listenerPos.z || 0);
      var dd = Math.sqrt(ddx * ddx + ddz * ddz);
      if (isFinite(dd)) gain.gain.setValueAtTime(_safeAudio(0.3 * Math.max(0.05, 1 - dd / 80)), now);
    }
    osc.connect(filter);
    noise.connect(filter);
    filter.connect(gain);
    if (panner) { gain.connect(panner); panner.connect(masterGain); }
    else { gain.connect(masterGain); }
    osc.start(now);
    osc.stop(now + params.decay);
  }

  function playHit() {
    if (!enabled || !ctx) return;
    resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  // Pitch-shifted hit marker: higher pitch when target is nearly dead (audio low-HP cue)
  function playHitPitched(hpFrac) {
    if (!enabled || !ctx) return;
    resume();
    const now = ctx.currentTime;
    const f = Math.max(0, Math.min(1, hpFrac == null ? 1 : hpFrac));
    // Low HP → shift up an octave
    var basePitch = 1200 + (1 - f) * 1100;
    var endPitch = 300 + (1 - f) * 300;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(basePitch, now);
    osc.frequency.exponentialRampToValueAtTime(endPitch, now + 0.05);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  function playReload() {
    if (!enabled || !ctx || ctx.state === 'suspended') return;
    resume();
    const now = ctx.currentTime;
    // Click-clack sound
    [0, 0.3, 0.6].forEach(function (t) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 2000 + Math.random() * 1000;
      osc.type = 'square';
      gain.gain.setValueAtTime(0.1, now + t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.03);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now + t);
      osc.stop(now + t + 0.04);
    });
  }

  function playReloadReady() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    // Two-tone "chambered" click: high tick then low tick 60ms later
    [[300, 0], [200, 0.06]].forEach(function(pair) {
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(pair[0], now + pair[1]);
      osc.frequency.exponentialRampToValueAtTime(pair[0] * 0.5, now + pair[1] + 0.04);
      g.gain.setValueAtTime(0.07, now + pair[1]);
      g.gain.exponentialRampToValueAtTime(0.001, now + pair[1] + 0.05);
      osc.connect(g); g.connect(masterGain);
      osc.start(now + pair[1]); osc.stop(now + pair[1] + 0.06);
    });
  }

  function playPickup() {
    if (!enabled || !ctx) return;
    resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.1);
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  function playDeath() {
    if (!enabled || !ctx) return;
    resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Enemy death grunt — guttural, panned by relative position
  function playEnemyDeath(distance, panX) {
    if (!enabled || !ctx) return;
    resume();
    var dist = Math.max(2, Math.min(60, distance || 10));
    var falloff = 1 - (dist / 60);
    var now = ctx.currentTime;
    // Vocal grunt: noise + low osc
    var osc = ctx.createOscillator();
    var oscG = ctx.createGain();
    osc.type = 'sawtooth';
    var startPitch = 110 + Math.random() * 40;
    osc.frequency.setValueAtTime(startPitch, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
    oscG.gain.setValueAtTime(0.18 * falloff, now);
    oscG.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    // Panner
    var pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pan) {
      pan.pan.value = Math.max(-1, Math.min(1, panX || 0));
      osc.connect(oscG); oscG.connect(pan); pan.connect(masterGain);
    } else {
      osc.connect(oscG); oscG.connect(masterGain);
    }
    osc.start(now);
    osc.stop(now + 0.55);
    // Body fall thud
    var thudN = createNoise(0.15);
    var thudF = ctx.createBiquadFilter();
    thudF.type = 'lowpass'; thudF.frequency.value = 200;
    var thudG = ctx.createGain();
    thudG.gain.setValueAtTime(0.15 * falloff, now + 0.35);
    thudG.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    thudN.connect(thudF); thudF.connect(thudG); thudG.connect(masterGain);
  }

  function playScream(isFriendly, distance, panX) {
    if (!enabled || !ctx) return;
    resume();
    var dist = Math.max(2, Math.min(80, distance || 10));
    var falloff = 1 - (dist / 80);
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    // Friendly = higher pitch (terror), enemy = lower (agony)
    var base = isFriendly ? 520 : 280;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(base + Math.random() * 60, now);
    osc.frequency.exponentialRampToValueAtTime(base * 0.35, now + 0.35 + Math.random() * 0.15);
    g.gain.setValueAtTime(0.14 * falloff, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    var pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pan) {
      pan.pan.value = Math.max(-1, Math.min(1, panX || 0));
      osc.connect(g); g.connect(pan); pan.connect(masterGain);
    } else {
      osc.connect(g); g.connect(masterGain);
    }
    osc.start(now);
    osc.stop(now + 0.5);
  }

  function playFootstep(surfaceType) {
    if (!enabled || !ctx) return;
    resume();
    const now = ctx.currentTime;
    var sp = {
      5:  { freq: 2000, dur: 0.02, vol: 0.08 },  // metal
      9:  { freq: 1000, dur: 0.04, vol: 0.06 },  // concrete
      10: { freq: 900,  dur: 0.04, vol: 0.06 },  // brick
      4:  { freq: 600,  dur: 0.05, vol: 0.05 },  // wood
      8:  { freq: 1500, dur: 0.03, vol: 0.04 },  // glass
      3:  { freq: 700,  dur: 0.05, vol: 0.05 },  // stone
      7:  { freq: 300,  dur: 0.07, vol: 0.04 },  // sand
      1:  { freq: 400,  dur: 0.06, vol: 0.04 },  // dirt
      2:  { freq: 350,  dur: 0.06, vol: 0.04 },  // grass
      6:  { freq: 200,  dur: 0.08, vol: 0.05 },  // water
    }[surfaceType] || { freq: 800, dur: 0.04, vol: 0.06 };
    const noise = createNoise(sp.dur);
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = sp.freq;
    gain.gain.setValueAtTime(sp.vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + sp.dur);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
  }

  // Landing thud — low-frequency impact sound scaled by intensity
  function playLandingThud(intensity) {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    var noise = createNoise(0.1 + intensity * 0.1);
    var gain = ctx.createGain();
    var filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = _safeAudio(200 + intensity * 300) || 200;
    gain.gain.setValueAtTime(_safeAudio(0.15 * intensity), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
  }

  // ── Bullet snap / near-miss whizz ───────────────────────────
  function playBulletSnap(pan) {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    var source = createNoise(0.04);
    var hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 6000 + Math.random() * 4000;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    source.connect(hp);
    hp.connect(gain);
    var panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.value = Math.max(-1, Math.min(1, pan || 0));
      gain.connect(panner);
      panner.connect(masterGain);
    } else {
      gain.connect(masterGain);
    }
  }

  // Enemy footstep sound — distance-attenuated
  function playEnemyFootstep(distance) {
    if (!enabled || !ctx || distance > 25) return;
    resume();
    var vol = Math.max(0.005, 0.04 * (1 - distance / 25));
    if (!isFinite(vol)) return;
    var now = ctx.currentTime;
    var noise = createNoise(0.03);
    var gain = ctx.createGain();
    var filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500 + Math.random() * 200;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
  }

  // Vehicle engine sound (oscillator-based)
  var _engineOsc = null;
  var _engineGain = null;
  function startEngine() {
    if (!enabled || !ctx) return;
    stopEngine(); // prevent orphaned oscillator leak
    resume();
    _engineOsc = ctx.createOscillator();
    _engineOsc.type = 'sawtooth';
    _engineOsc.frequency.value = 80;
    _engineGain = ctx.createGain();
    _engineGain.gain.value = 0;
    var filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    _engineOsc.connect(filter);
    filter.connect(_engineGain);
    _engineGain.connect(masterGain);
    _engineOsc.start();
  }
  function updateEngine(speed) {
    if (!_engineOsc || !_engineGain) return;
    _engineOsc.frequency.value = _safeAudio(80 + speed * 3);
    _engineGain.gain.value = _safeAudio(Math.min(0.12, speed * 0.008));
  }
  function stopEngine() {
    if (_engineOsc) { try { _engineOsc.stop(); } catch(e){} _engineOsc = null; }
    _engineGain = null;
  }

  function playTurretTraverse() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    var filter = ctx.createBiquadFilter();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180 + Math.random() * 30, now);
    osc.frequency.linearRampToValueAtTime(120 + Math.random() * 20, now + 0.08);
    filter.type = 'bandpass';
    filter.frequency.value = 340;
    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  function playReadyChime() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    [740, 980].forEach(function(freq, idx) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);
      gain.gain.setValueAtTime(0.06, now + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.14);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.15);
    });
  }

  // Ricochet ping — metallic high-freq chirp
  function playRicochet() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(3000 + Math.random() * 2000, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  // ── Surface-aware bullet impact sounds ──────────────────────
  // Block types: 5=METAL, 14=REINFORCED, 11=GLASS, 4=WOOD, 9=CONCRETE, 10=BRICK, 3=STONE, 7=SAND, 1=DIRT
  function playImpact(blockType) {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    if (blockType === 5 || blockType === 14) {
      // Metal: high-freq ping + noise
      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2500 + Math.random() * 1500, now);
      osc.frequency.exponentialRampToValueAtTime(500, now + 0.08);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.06, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(g); g.connect(masterGain);
      osc.start(now); osc.stop(now + 0.09);
    } else if (blockType === 11) {
      // Glass: bright shatter burst
      var src = createNoise(0.06);
      var hp = ctx.createBiquadFilter();
      hp.type = 'highpass'; hp.frequency.value = 4000;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.1, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      src.connect(hp); hp.connect(g); g.connect(masterGain);
    } else if (blockType === 4) {
      // Wood: low thunk
      var src = createNoise(0.05);
      var lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 800;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.08, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      src.connect(lp); lp.connect(g); g.connect(masterGain);
    } else if (blockType === 9 || blockType === 10 || blockType === 3) {
      // Concrete/brick/stone: mid-freq crunch
      var src = createNoise(0.04);
      var bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 1200; bp.Q.value = 1.5;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.06, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      src.connect(bp); bp.connect(g); g.connect(masterGain);
    } else {
      // Default (dirt, sand, etc): soft thud
      var src = createNoise(0.03);
      var lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 400;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.04, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      src.connect(lp); lp.connect(g); g.connect(masterGain);
    }
  }

  // Drone motor buzz — continuous oscillator pair, call update to change volume
  var _droneOsc1 = null, _droneOsc2 = null, _droneGain = null, _droneMotorBaseGain = 0.04;
  // Per-model engine signatures — modeled on real drone acoustics.
  // base/detune = oscillator Hz, band = bandpass centre, q = resonance,
  // gain = base loudness, o1/o2 = waveforms.
  var _DRONE_VOICES = {
    // Ukrainian FPV racing quad — high-pitched aggressive scream
    fpv_attack:   { base: 240, detune: 247, band: 900, q: 3,   gain: 0.05, o1: 'sawtooth', o2: 'square' },
    kamikaze:     { base: 260, detune: 268, band: 1000, q: 3,  gain: 0.055, o1: 'sawtooth', o2: 'square' },
    // DJI Mavic-style recon quad — quiet smooth hum
    recon:        { base: 200, detune: 204, band: 520, q: 2,   gain: 0.03, o1: 'sawtooth', o2: 'triangle' },
    surveillance: { base: 190, detune: 193, band: 480, q: 2,   gain: 0.03, o1: 'sawtooth', o2: 'triangle' },
    // Bomber quad (octocopter dropping munitions) — medium buzz
    bomb:         { base: 165, detune: 170, band: 420, q: 2.2, gain: 0.045, o1: 'sawtooth', o2: 'square' },
    incendiary:   { base: 160, detune: 165, band: 410, q: 2.2, gain: 0.045, o1: 'sawtooth', o2: 'square' },
    // Baba Yaga heavy agricultural hexacopter — deep heavy thrum
    baba_yaga:    { base: 120, detune: 124, band: 300, q: 1.8, gain: 0.06, o1: 'sawtooth', o2: 'square' },
    // Bayraktar TB2 — distant Rotax prop drone
    bayraktar:    { base: 140, detune: 143, band: 360, q: 2,   gain: 0.035, o1: 'sawtooth', o2: 'triangle' },
    // Russian Shahed-136 — the infamous "flying moped / lawnmower" 2-stroke buzz
    enemy_bomber: { base: 95,  detune: 99,  band: 260, q: 4,   gain: 0.07, o1: 'sawtooth', o2: 'square' },
    // Russian Lancet loitering munition — sharp small-prop whine
    enemy_fpv:    { base: 220, detune: 226, band: 820, q: 3.5, gain: 0.05, o1: 'sawtooth', o2: 'square' },
    // Russian Orlan-10 recon — small 2-stroke drone, lower hum
    enemy_observer: { base: 130, detune: 134, band: 340, q: 2.5, gain: 0.04, o1: 'sawtooth', o2: 'triangle' },
  };
  var _DRONE_DEFAULT_VOICE = { base: 180, detune: 183, band: 400, q: 2, gain: 0.04, o1: 'sawtooth', o2: 'square' };

  function startDroneMotor(droneType) {
    if (!enabled || !ctx || _droneOsc1) return;
    resume();
    var v = _DRONE_VOICES[droneType] || _DRONE_DEFAULT_VOICE;
    _droneMotorBaseGain = v.gain;
    _droneOsc1 = ctx.createOscillator();
    _droneOsc1.type = v.o1;
    _droneOsc1.frequency.value = v.base;
    _droneOsc2 = ctx.createOscillator();
    _droneOsc2.type = v.o2;
    _droneOsc2.frequency.value = v.detune; // slight detune for buzz
    _droneGain = ctx.createGain();
    _droneGain.gain.value = v.gain;
    var filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = v.band;
    filter.Q.value = v.q;
    _droneOsc1.connect(filter);
    _droneOsc2.connect(filter);
    filter.connect(_droneGain);
    _droneGain.connect(masterGain);
    _droneOsc1.start();
    _droneOsc2.start();
  }
  function updateDroneMotor(distance) {
    if (!_droneGain) return;
    if (!isFinite(distance) || distance > 40) { _droneGain.gain.value = 0; return; }
    var peak = (_droneMotorBaseGain || 0.04) * 1.5;
    _droneGain.gain.value = _safeAudio(Math.max(0.005, peak * (1 - distance / 40)));
  }
  function stopDroneMotor() {
    if (_droneOsc1) { try { _droneOsc1.stop(); } catch(e){} _droneOsc1 = null; }
    if (_droneOsc2) { try { _droneOsc2.stop(); } catch(e){} _droneOsc2 = null; }
    _droneGain = null;
  }

  function playAmbientWind() {
    if (!enabled || !ctx) return;
    resume();
    // Continuous wind loop using filtered noise
    const noise = createNoise(10);
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 300;
    filter.Q.value = 0.5;
    gain.gain.value = 0.03;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    return { stop: function () { try { gain.gain.value = 0; } catch(e){} } };
  }

  // ── Stage-specific ambient loop ───────────────────────────
  var _ambientNodes = [];   // gain nodes for volume kill
  var _ambientSources = []; // oscillators + buffer sources to .stop()
  var _ambientTimers = [];  // setInterval IDs

  function stopAmbientLoop() {
    var i;
    for (i = 0; i < _ambientTimers.length; i++) {
      clearInterval(_ambientTimers[i]);
    }
    for (i = 0; i < _ambientSources.length; i++) {
      try { _ambientSources[i].stop(); } catch(e){}
    }
    for (i = 0; i < _ambientNodes.length; i++) {
      try { _ambientNodes[i].disconnect(); } catch(e){}
    }
    _ambientNodes = [];
    _ambientSources = [];
    _ambientTimers = [];
  }

  // Helper: looping noise source connected through filter → gain → master
  function _ambientNoise(duration, filterType, filterFreq, filterQ, vol) {
    var src = createNoise(duration);
    src.loop = true;
    var flt = ctx.createBiquadFilter();
    flt.type = filterType; flt.frequency.value = filterFreq;
    if (filterQ !== undefined) flt.Q.value = filterQ;
    var g = ctx.createGain();
    g.gain.value = vol;
    src.connect(flt); flt.connect(g); g.connect(masterGain);
    _ambientSources.push(src);
    _ambientNodes.push(g, flt);
    return g;
  }

  // Helper: LFO-gated oscillator (intermittent tone)
  function _ambientTone(freq, oscType, lfoFreq, vol) {
    var osc = ctx.createOscillator();
    osc.type = oscType; osc.frequency.value = freq;
    var lfo = ctx.createOscillator();
    lfo.type = 'square'; lfo.frequency.value = lfoFreq;
    var amp = ctx.createGain(); amp.gain.value = 0;
    lfo.connect(amp.gain);
    var g = ctx.createGain(); g.gain.value = vol;
    osc.connect(amp); amp.connect(g); g.connect(masterGain);
    osc.start(); lfo.start();
    _ambientSources.push(osc, lfo);
    _ambientNodes.push(g, amp);
    return g;
  }

  // Helper: continuous oscillator
  function _ambientOsc(freq, oscType, vol) {
    var osc = ctx.createOscillator();
    osc.type = oscType; osc.frequency.value = freq;
    var g = ctx.createGain(); g.gain.value = vol;
    osc.connect(g); g.connect(masterGain);
    osc.start();
    _ambientSources.push(osc);
    _ambientNodes.push(g);
    return g;
  }

  // Helper: periodic one-shot event (boom, clank, etc.)
  function _ambientPeriodicShot(intervalMs, jitterMs, builder) {
    var id = setInterval(function () {
      if (!enabled || !ctx) return;
      var jitter = Math.random() * jitterMs;
      setTimeout(function () { builder(ctx.currentTime); }, jitter);
    }, intervalMs);
    _ambientTimers.push(id);
  }

  function startAmbientLoop(theme) {
    if (!enabled || !ctx) return;
    resume();
    stopAmbientLoop();



    if (theme === 'grassland') {
      // ── Grassland ──────────────────────────────────────
      // Bird chirps: high sine blips, LFO-gated at ~0.4 Hz
      _ambientTone(3800, 'sine', 0.4, 0.010);
      // Second bird, slightly detuned, slower cadence
      _ambientTone(4400, 'sine', 0.25, 0.007);
      // Rustling: bandpassed noise pulsing via LFO
      _ambientNoise(6, 'bandpass', 2200, 1.5, 0.015);





    } else if (theme === 'coastal') {
      // ── Coastal ────────────────────────────────────────
      // Ocean waves: filtered noise with slow amplitude LFO
      var waveSrc = createNoise(10);
      waveSrc.loop = true;
      var waveFilter = ctx.createBiquadFilter();
      waveFilter.type = 'lowpass'; waveFilter.frequency.value = 500;
      var waveLfo = ctx.createOscillator();
      waveLfo.type = 'sine'; waveLfo.frequency.value = 0.15;
      var waveAmp = ctx.createGain(); waveAmp.gain.value = 0.06;
      waveLfo.connect(waveAmp.gain);
      var waveVol = ctx.createGain(); waveVol.gain.value = 0.04;
      waveSrc.connect(waveFilter); waveFilter.connect(waveAmp);
      waveAmp.connect(waveVol); waveVol.connect(masterGain);
      waveSrc.start ? void 0 : waveSrc.start(); // already started by createNoise
      waveLfo.start();
      _ambientSources.push(waveSrc, waveLfo);
      _ambientNodes.push(waveVol, waveAmp, waveFilter);
      // Seagulls: high sine chirps, intermittent
      _ambientTone(2800, 'sine', 0.3, 0.008);
      // Wind is already in base layer, boost it slightly for coast
      _ambientNoise(8, 'bandpass', 350, 0.5, 0.02);



    } else if (theme === 'cityscape') {
      // ── Cityscape ──────────────────────────────────────
      // Distant siren: sine sweep oscillating slowly
      var sirenOsc = ctx.createOscillator();
      sirenOsc.type = 'sine';
      var sirenLfo = ctx.createOscillator();
      sirenLfo.type = 'sine'; sirenLfo.frequency.value = 0.5;
      var sirenLfoGain = ctx.createGain(); sirenLfoGain.gain.value = 200;
      sirenLfo.connect(sirenLfoGain);
      sirenLfoGain.connect(sirenOsc.frequency);
      sirenOsc.frequency.value = 700;
      var sirenVol = ctx.createGain(); sirenVol.gain.value = 0.012;
      sirenOsc.connect(sirenVol); sirenVol.connect(masterGain);
      sirenOsc.start(); sirenLfo.start();
      _ambientSources.push(sirenOsc, sirenLfo);
      _ambientNodes.push(sirenVol, sirenLfoGain);
      // Wind through buildings: bandpassed with resonance
      _ambientNoise(8, 'bandpass', 600, 6, 0.018);
      // Distant gunfire echoes: periodic muffled cracks
      _ambientPeriodicShot(3000, 4000, function (now) {
        var n = createNoise(0.08);
        var f = ctx.createBiquadFilter();
        f.type = 'bandpass'; f.frequency.value = 800; f.Q.value = 2;
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.04, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        n.connect(f); f.connect(g); g.connect(masterGain);
      });

    } else if (theme === 'desert') {
      // ── Desert ─────────────────────────────────────────
      // Hot wind: higher-pitched bandpassed noise, slow swell
      var desertSrc = createNoise(10);
      desertSrc.loop = true;
      var desertFilter = ctx.createBiquadFilter();
      desertFilter.type = 'bandpass'; desertFilter.frequency.value = 500;
      desertFilter.Q.value = 1.2;
      var desertLfo = ctx.createOscillator();
      desertLfo.type = 'sine'; desertLfo.frequency.value = 0.08;
      var desertAmp = ctx.createGain(); desertAmp.gain.value = 0.04;
      desertLfo.connect(desertAmp.gain);
      var desertVol = ctx.createGain(); desertVol.gain.value = 0.03;
      desertSrc.connect(desertFilter); desertFilter.connect(desertAmp);
      desertAmp.connect(desertVol); desertVol.connect(masterGain);
      desertLfo.start();
      _ambientSources.push(desertSrc, desertLfo);
      _ambientNodes.push(desertVol, desertAmp, desertFilter);
      // Sand rustling: very high filtered noise, faint
      _ambientNoise(4, 'highpass', 4000, 1, 0.010);
    }
    // Unknown themes get base wind only — silent fallback
  }

  function playWaveStart() {
    if (!enabled || !ctx) return;
    resume();
    const now = ctx.currentTime;
    // Alarm/siren sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.linearRampToValueAtTime(900, now + 0.3);
    osc.frequency.linearRampToValueAtTime(600, now + 0.6);
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.setValueAtTime(0.15, now + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.8);
  }

  // ── Noise generator helper (pooled buffers) ──────────────────
  var _noisePool = {};
  function _getNoiseBuffer(duration) {
    // Round to nearest 0.01 to maximize cache hits
    var key = Math.round(duration * 100);
    if (!_noisePool[key]) {
      var bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
      var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      _noisePool[key] = buffer;
    }
    return _noisePool[key];
  }
  function createNoise(duration) {
    var source = ctx.createBufferSource();
    source.buffer = _getNoiseBuffer(duration);
    source.start();
    return source;
  }

  function setVolume(v) {
    volume = Math.max(0, Math.min(1, v));
    if (masterGain) masterGain.gain.value = volume;
  }

  // Low health heartbeat-style warning
  function playLowHealth() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    // Two quick "thump thump" pulses like a racing heartbeat
    for (var pi = 0; pi < 2; pi++) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      var t = now + pi * 0.28;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, t);
      osc.frequency.exponentialRampToValueAtTime(55, t + 0.12);
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.18);
    }
  }

  // ── Background Music System (procedural) ──────────────
  let _musicPlaying = false;
  let _musicNodes = [];
  let _musicGain = null;
  let _musicVolume = 0.18;
  let _musicBeatInterval = null;
  // ── Shuffle system: 4 battle music themes cycle in random order ──
  var _musicThemes = [0, 1, 2, 3];
  var _musicThemeIdx = 0;
  var _musicThemeDuration = 0;    // seconds elapsed on current theme
  var _THEME_DURATION = 90;       // switch theme every ~90s
  var _lastPlayedTheme = -1;      // track last theme so starts don't repeat it
  var _forcedTheme = -1;          // when >=0, playMusic uses this theme (boss music)
  (function _shuffleThemes() {
    for (var i = _musicThemes.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = _musicThemes[i]; _musicThemes[i] = _musicThemes[j]; _musicThemes[j] = t;
    }
  })();
  function _nextTheme() {
    _musicThemeIdx = (_musicThemeIdx + 1) % _musicThemes.length;
    if (_musicThemeIdx === 0) {
      // Re-shuffle on loop-around
      for (var i = _musicThemes.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = _musicThemes[i]; _musicThemes[i] = _musicThemes[j]; _musicThemes[j] = t;
      }
    }
    return _musicThemes[_musicThemeIdx];
  }

  function playMusic(style) {
    // style: 'battle', 'ambient', 'victory'
    if (!enabled || !ctx) return;
    stopMusic();
    resume();

    _musicGain = ctx.createGain();
    _musicGain.gain.value = _musicVolume;
    _musicGain.connect(masterGain);
    _musicPlaying = true;
    _musicThemeDuration = 0;

    if (style === 'battle' || !style) {
      if (_forcedTheme >= 0) {
        // Boss music (or any forced theme) — honour the requested theme exactly.
        var fIdx = _musicThemes.indexOf(_forcedTheme);
        _musicThemeIdx = fIdx >= 0 ? fIdx : 0;
        _forcedTheme = -1; // consume once
      } else {
        // Pick a fresh random theme, avoiding an immediate repeat of the last
        // theme so a new game start always sounds different.
        _musicThemeIdx = Math.floor(Math.random() * _musicThemes.length);
        if (_musicThemes.length > 1 && _musicThemes[_musicThemeIdx] === _lastPlayedTheme) {
          _musicThemeIdx = (_musicThemeIdx + 1) % _musicThemes.length;
        }
      }
      var theme = _musicThemes[_musicThemeIdx];
      _lastPlayedTheme = theme;
      // Theme 0: Fast march (original) — 110 BPM kick/snare/hat + bass
      // Theme 1: Tense ominous — 90 BPM, sparse kick, heavy bass drone
      // Theme 2: Intense assault — 140 BPM, fast hats, double kick
      // Theme 3: Slow tension pad — 75 BPM, deep sub bass, minimal perc
      var bpmTable = [110, 90, 140, 75];
      var bpm = bpmTable[theme] || 110;
      var beatTime = 60 / bpm;
      var beat = 0;

      // Bass note sequences per theme: Am, Dm, Em, Gm flavours
      var _bassSeqs = [
        [55, 65, 55, 73],   // Theme 0: A–E–A–C march
        [42, 42, 50, 42],   // Theme 1: F#–F#–D–F# ominous
        [58, 62, 58, 65],   // Theme 2: A#–D–A#–F assault
        [36, 36, 43, 36],   // Theme 3: C–C–G–C deep sub
      ];
      var _kickGainMap   = [0.50, 0.35, 0.60, 0.28]; // kick volume per theme
      var _snareGainMap  = [0.25, 0.12, 0.32, 0.08]; // snare volume per theme
      var _bassFreqMap   = [200, 120, 220, 100];       // bass filter cutoff per theme
      var _kickPattern   = [[0,0,0,0], [0,0,0,0], [0,2,0,0], [0,0,0,0]]; // extra kick on beat (intensity theme)
      var _bassGainMap   = [0.08, 0.14, 0.06, 0.18];  // bass louder on ominous/tension themes
      var _bassSeq = _bassSeqs[theme] || _bassSeqs[0];

      _musicBeatInterval = setInterval(function () {
        if (!enabled || !ctx || !_musicPlaying) return;
        var now = ctx.currentTime;
        _musicThemeDuration += beatTime;

        // Kick drum
        var doKick = (beat % 4 === 0) || (theme === 2 && beat % 4 === 2); // double kick on intense theme
        if (doKick) {
          var kickOsc = ctx.createOscillator();
          var kickGain = ctx.createGain();
          kickOsc.type = 'sine';
          var kickStart = theme === 1 ? 80 : 120;
          kickOsc.frequency.setValueAtTime(kickStart, now);
          kickOsc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
          kickGain.gain.setValueAtTime(_kickGainMap[theme] || 0.5, now);
          kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
          kickOsc.connect(kickGain);
          kickGain.connect(_musicGain);
          kickOsc.start(now);
          kickOsc.stop(now + 0.22);
        }

        // Snare — not on Theme 3 (tension: no snare)
        if (beat % 4 === 2 && theme !== 3) {
          var snareNoise = createNoise(0.08);
          var snareGain = ctx.createGain();
          var snareFilter = ctx.createBiquadFilter();
          snareFilter.type = 'highpass';
          snareFilter.frequency.value = theme === 2 ? 3000 : 2000;
          snareGain.gain.setValueAtTime(_snareGainMap[theme] || 0.25, now);
          snareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          snareNoise.connect(snareFilter);
          snareFilter.connect(snareGain);
          snareGain.connect(_musicGain);
        }

        // Hi-hat — sparse on Theme 1 and 3 (ominous/tension), rapid on Theme 2 (intense)
        var hhEvery = theme === 2 ? 1 : (theme === 1 || theme === 3 ? 4 : 2);
        if (beat % hhEvery === 0) {
          var hhNoise = createNoise(0.02);
          var hhGain = ctx.createGain();
          var hhFilter = ctx.createBiquadFilter();
          hhFilter.type = 'highpass';
          hhFilter.frequency.value = theme === 2 ? 8000 : 6000;
          var hhVol = theme === 2 ? 0.18 : (theme === 0 ? (beat % 2 === 0 ? 0.12 : 0.06) : 0.05);
          hhGain.gain.setValueAtTime(hhVol, now);
          hhGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
          hhNoise.connect(hhFilter);
          hhFilter.connect(hhGain);
          hhGain.connect(_musicGain);
        }

        // Bass pulse (every 8 beats; every 4 on intense theme)
        var bassEvery = theme === 2 ? 4 : 8;
        if (beat % bassEvery === 0) {
          var bassOsc = ctx.createOscillator();
          var bassGain = ctx.createGain();
          bassOsc.type = theme === 1 ? 'sine' : 'sawtooth';
          bassOsc.frequency.value = _bassSeq[Math.floor(beat / bassEvery) % _bassSeq.length];
          bassGain.gain.setValueAtTime(_bassGainMap[theme] || 0.08, now);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + beatTime * (theme === 3 ? 5 : 3));
          var bassFilter = ctx.createBiquadFilter();
          bassFilter.type = 'lowpass';
          bassFilter.frequency.value = _bassFreqMap[theme] || 200;
          bassOsc.connect(bassFilter);
          bassFilter.connect(bassGain);
          bassGain.connect(_musicGain);
          bassOsc.start(now);
          bassOsc.stop(now + beatTime * (theme === 3 ? 6 : 4));
        }

        // Tension drone pad on Theme 1 (ominous) and Theme 3 (slow tension)
        if ((theme === 1 || theme === 3) && beat % 16 === 0) {
          var padF = theme === 3 ? 55 : 73;
          var padOscT = ctx.createOscillator();
          var padGainT = ctx.createGain();
          padOscT.type = 'sine';
          padOscT.frequency.value = padF;
          padGainT.gain.setValueAtTime(0.04, now);
          padGainT.gain.linearRampToValueAtTime(0.07, now + 2);
          padGainT.gain.exponentialRampToValueAtTime(0.001, now + 6);
          padOscT.connect(padGainT);
          padGainT.connect(_musicGain);
          padOscT.start(now);
          padOscT.stop(now + 6);
        }

        beat++;

        // Auto-advance to next shuffle theme after _THEME_DURATION seconds
        if (_musicThemeDuration >= _THEME_DURATION && _musicPlaying) {
          _musicThemeDuration = 0;
          var nextT = _nextTheme();
          // Fade out and restart with new theme
          if (_musicGain) {
            _musicGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
            setTimeout(function() {
              if (_musicPlaying) playMusic('battle');
            }, 1300);
          }
        }
      }, beatTime * 1000);

    } else if (style === 'ambient') {
      // Soft ambient pad
      var padOsc = ctx.createOscillator();
      var padOsc2 = ctx.createOscillator();
      var padGain = ctx.createGain();
      var padFilter = ctx.createBiquadFilter();
      padOsc.type = 'sine';
      padOsc2.type = 'sine';
      padOsc.frequency.value = 220;
      padOsc2.frequency.value = 330;
      padGain.gain.value = 0.06;
      padFilter.type = 'lowpass';
      padFilter.frequency.value = 600;
      padOsc.connect(padFilter);
      padOsc2.connect(padFilter);
      padFilter.connect(padGain);
      padGain.connect(_musicGain);
      padOsc.start();
      padOsc2.start();
      _musicNodes.push(padOsc, padOsc2);

    } else if (style === 'victory') {
      // Triumphant fanfare
      var now = ctx.currentTime;
      var notes = [440, 554, 659, 880];
      notes.forEach(function (freq, i) {
        var osc = ctx.createOscillator();
        var g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0, now + i * 0.3);
        g.gain.linearRampToValueAtTime(0.15, now + i * 0.3 + 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.3 + 0.8);
        osc.connect(g);
        g.connect(_musicGain);
        osc.start(now + i * 0.3);
        osc.stop(now + i * 0.3 + 0.8);
      });
    }
  }

  // Force the 140 BPM "intense assault" battle theme for boss fights.
  // Switches immediately so the music escalates when the boss spawns.
  function playBossMusic() {
    _forcedTheme = 2; // theme index 2 = 140 BPM intense assault (honoured by playMusic)
    playMusic('battle');
    // Also max out volume for added drama
    if (_musicGain) _musicGain.gain.value = Math.min(1.0, _musicVolume * 1.6);
  }

  function setMusicIntensity(intensity) {
    // intensity: 0.0 (calm) to 1.0 (maximum combat)
    if (!_musicPlaying || !_musicGain) return;
    // Scale music volume: base volume at 0 intensity, 2x at full
    var targetVol = _musicVolume * (0.5 + intensity * 1.5);
    _musicGain.gain.value = Math.min(1.0, targetVol);
  }

  function stopMusic() {
    _musicPlaying = false;
    if (_musicBeatInterval) {
      clearInterval(_musicBeatInterval);
      _musicBeatInterval = null;
    }
    _musicNodes.forEach(function (n) {
      try { n.stop(); } catch (e) { /* already stopped */ }
    });
    _musicNodes = [];
    if (_musicGain) {
      try { _musicGain.disconnect(); } catch (e) { /* ok */ }
      _musicGain = null;
    }
  }

  function setMusicVolume(v) {
    _musicVolume = Math.max(0, Math.min(1, v));
    if (_musicGain) _musicGain.gain.value = _musicVolume;
  }

  function isMusicPlaying() { return _musicPlaying; }

  /* ── New Audio Features (B21) ──────────────────────────── */

  // Enemy bark / shout SFX — type-specific tonal patterns
  var _BARK_TONES = {
    attack:    { freq: 140, type: 'sawtooth', dur: 0.18, ramp: [1.3, 0.8] },
    grenade:   { freq: 200, type: 'square',   dur: 0.12, ramp: [1.5, 1.0, 0.6] },
    reload:    { freq: 100, type: 'triangle',  dur: 0.15, ramp: [0.8] },
    flank:     { freq: 160, type: 'sawtooth', dur: 0.22, ramp: [0.9, 1.2, 0.7] },
    sniper:    { freq: 250, type: 'square',   dur: 0.10, ramp: [1.0, 1.8] },
    retreat:   { freq: 110, type: 'sawtooth', dur: 0.25, ramp: [1.0, 0.6, 0.4] },
    charge:    { freq: 90,  type: 'sawtooth', dur: 0.30, ramp: [0.7, 1.0, 1.4] },
    hurt:      { freq: 180, type: 'square',   dur: 0.14, ramp: [1.2, 0.5] },
    reinforce: { freq: 130, type: 'triangle',  dur: 0.20, ramp: [1.0, 1.3] },
    spot:      { freq: 280, type: 'sawtooth', dur: 0.22, ramp: [1.0, 0.78, 1.25, 0.64] },
    suppress:  { freq: 200, type: 'sawtooth', dur: 0.20, ramp: [1.0, 0.90, 1.00, 0.80] },
  };
  function playEnemyBark(barkType, panX) {
    if (!enabled || !ctx) return;
    var tone = _BARK_TONES[barkType] || _BARK_TONES.attack;
    var now = ctx.currentTime;
    var segDur = tone.dur / tone.ramp.length;
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = tone.type;
    // Frequency contour from ramp multipliers
    osc.frequency.setValueAtTime(tone.freq * tone.ramp[0], now);
    for (var ri = 1; ri < tone.ramp.length; ri++) {
      osc.frequency.linearRampToValueAtTime(tone.freq * tone.ramp[ri], now + segDur * ri);
    }
    g.gain.setValueAtTime(0.09, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + tone.dur);
    // Spatial panning if available
    if (panX !== undefined && ctx.createStereoPanner) {
      var pan = ctx.createStereoPanner();
      _safePV(pan.pan, Math.max(-1, Math.min(1, _safeAudio(panX))));
      osc.connect(g); g.connect(pan); pan.connect(masterGain);
    } else {
      osc.connect(g); g.connect(masterGain);
    }
    osc.start(now); osc.stop(now + tone.dur);
  }

  // Headshot ding 
  function playHeadshotDing() {
    if (!enabled || !ctx) return;
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 1200;
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(g); g.connect(masterGain);
    osc.start(); osc.stop(ctx.currentTime + 0.25);
  }

  // Level complete jingle
  function playLevelComplete() {
    if (!enabled || !ctx) return;
    var now = ctx.currentTime;
    var notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach(function(freq, i) {
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, now + i * 0.15);
      g.gain.linearRampToValueAtTime(0.12, now + i * 0.15 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4);
      osc.connect(g); g.connect(masterGain);
      osc.start(now + i * 0.15); osc.stop(now + i * 0.15 + 0.4);
    });
  }

  // Grenade bounce sound
  function playGrenadeBounce() {
    if (!enabled || !ctx) return;
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);
    g.gain.setValueAtTime(0.06, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(g); g.connect(masterGain);
    osc.start(); osc.stop(ctx.currentTime + 0.08);
  }

  // Tank cannon fire (deep boom)
  function playTankCannon() {
    if (!enabled || !ctx) return;
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.5);
    g.gain.setValueAtTime(0.25, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(g); g.connect(masterGain);
    osc.start(); osc.stop(ctx.currentTime + 0.5);
    // layered noise burst
    var buf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    var noise = ctx.createBufferSource();
    noise.buffer = buf;
    var ng = ctx.createGain();
    ng.gain.setValueAtTime(0.2, ctx.currentTime);
    ng.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    noise.connect(ng); ng.connect(masterGain);
    noise.start(); noise.stop(ctx.currentTime + 0.3);
  }

  // Knife throw whoosh
  function playKnifeThrow() {
    if (!enabled || !ctx) return;
    var buf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / data.length);
    var noise = ctx.createBufferSource();
    noise.buffer = buf;
    var g = ctx.createGain();
    var filt = ctx.createBiquadFilter();
    filt.type = 'highpass';
    filt.frequency.value = 2000;
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    noise.connect(filt); filt.connect(g); g.connect(masterGain);
    noise.start(); noise.stop(ctx.currentTime + 0.15);
  }

  // Fire crackle ambient
  let _fireCrackle = null;
  function startFireCrackle() {
    if (!enabled || !ctx || _fireCrackle) return;
    // Looping noise with bandpass = crackle
    var buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (Math.random() > 0.92 ? 0.5 : 0.05);
    }
    var noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    var filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 3000;
    filt.Q.value = 2;
    var g = ctx.createGain();
    g.gain.value = 0.04;
    noise.connect(filt); filt.connect(g); g.connect(masterGain);
    noise.start();
    _fireCrackle = { source: noise, gain: g };
  }

  function stopFireCrackle() {
    if (_fireCrackle) {
      try { _fireCrackle.source.stop(); } catch(e) {}
      _fireCrackle = null;
    }
  }

  // Radiation geiger tick
  function playGeigerTick() {
    if (!enabled || !ctx) return;
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 4000 + Math.random() * 2000;
    g.gain.setValueAtTime(0.03, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
    osc.connect(g); g.connect(masterGain);
    osc.start(); osc.stop(ctx.currentTime + 0.02);
  }

  function toggle() {
    enabled = !enabled;
    return enabled;
  }

  // ── New Sound Functions ───────────────────────────────────

  function playVehicleEngine(type) {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sawtooth';
    var params = {
      idle:   { freq: 50, vol: 0.06, dur: 0.3 },
      moving: { freq: 65, vol: 0.10, dur: 0.2 },
      boost:  { freq: 80, vol: 0.14, dur: 0.15 },
    }[type] || { freq: 50, vol: 0.06, dur: 0.3 };
    osc.frequency.setValueAtTime(params.freq, now);
    osc.frequency.linearRampToValueAtTime(params.freq * 1.2, now + params.dur);
    gain.gain.setValueAtTime(params.vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + params.dur);
    var filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 150;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + params.dur + 0.01);
  }

  function playGrappleHook() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  function playWallRun() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    var noise = createNoise(0.1);
    var gain = ctx.createGain();
    var filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 400;
    filter.Q.value = 3;
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
  }

  function playAchievementUnlock() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    var notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach(function (freq, i) {
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, now + i * 0.12);
      g.gain.linearRampToValueAtTime(0.14, now + i * 0.12 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.5);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.5);
      // Reverb delay echo
      var echo = ctx.createOscillator();
      var eg = ctx.createGain();
      echo.type = 'triangle';
      echo.frequency.value = freq;
      eg.gain.setValueAtTime(0, now + i * 0.12 + 0.15);
      eg.gain.linearRampToValueAtTime(0.04, now + i * 0.12 + 0.19);
      eg.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.6);
      echo.connect(eg);
      eg.connect(masterGain);
      echo.start(now + i * 0.12 + 0.15);
      echo.stop(now + i * 0.12 + 0.6);
    });
  }

  function playLevelUp() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(2000, now + 0.3);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.31);
  }

  function playRollDodge() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    var noise = createNoise(0.2);
    var gain = ctx.createGain();
    var filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
  }

  function playCriticalHit() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var oscGain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 100;
    oscGain.gain.setValueAtTime(0.2, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(oscGain);
    oscGain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.16);
    var noise = createNoise(0.15);
    var ng = ctx.createGain();
    ng.gain.setValueAtTime(0.15, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    noise.connect(ng);
    ng.connect(masterGain);
  }

  function playEnemyAlert() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    for (var i = 0; i < 2; i++) {
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 600;
      var t = now + i * 0.15;
      g.gain.setValueAtTime(0.12, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.1);
    }
  }

  function playBountyComplete() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    for (var i = 0; i < 6; i++) {
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 2000 + Math.random() * 2000;
      var t = now + i * 0.06;
      g.gain.setValueAtTime(0.08, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.08);
    }
  }

  function playFortificationBuild() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    var noise = createNoise(0.2);
    var ng = ctx.createGain();
    ng.gain.setValueAtTime(0.12, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    noise.connect(ng);
    ng.connect(masterGain);
    var osc = ctx.createOscillator();
    var og = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 100;
    og.gain.setValueAtTime(0.15, now);
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(og);
    og.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.21);
  }

  // ── Weapon switch click — sharp metallic tick ──
  function playWeaponSwitch() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(2400, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.03);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.08, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // ── Dry fire click — empty chamber ──
  function playDryFire() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.02);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.06, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.03);
  }

  // ── Kill confirm chime — short rising tone on every kill ──
  function playKillConfirm() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.07);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.07, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // ── Multi-kill chord burst — escalating layers for 2+ rapid kills ──
  function playMultiKill(count) {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    var baseFreq = 600 + Math.min(count, 6) * 100;
    // Layer 1: base tone
    var osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = baseFreq;
    var g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.08, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc1.connect(g1); g1.connect(masterGain);
    osc1.start(now); osc1.stop(now + 0.16);
    // Layer 2: major third above
    var osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = baseFreq * 1.25;
    var g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.06, now + 0.02);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc2.connect(g2); g2.connect(masterGain);
    osc2.start(now); osc2.stop(now + 0.16);
    // Layer 3: fifth above (only for 3+ kills)
    if (count >= 3) {
      var osc3 = ctx.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.value = baseFreq * 1.5;
      var g3 = ctx.createGain();
      g3.gain.setValueAtTime(0.05, now + 0.03);
      g3.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc3.connect(g3); g3.connect(masterGain);
      osc3.start(now); osc3.stop(now + 0.16);
    }
  }

  // ── First blood — deep powerful confirm on first kill of session ──
  var _firstBloodPlayed = false;
  function playFirstBlood() {
    if (!enabled || !ctx || _firstBloodPlayed) return;
    _firstBloodPlayed = true;
    resume();
    var now = ctx.currentTime;
    // Low power tone
    var osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    var filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    osc.connect(filter); filter.connect(g); g.connect(masterGain);
    osc.start(now); osc.stop(now + 0.31);
    // Bright harmonic on top
    var osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(800, now + 0.05);
    osc2.frequency.exponentialRampToValueAtTime(1600, now + 0.15);
    var g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.08, now + 0.05);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc2.connect(g2); g2.connect(masterGain);
    osc2.start(now); osc2.stop(now + 0.26);
  }
  function resetFirstBlood() { _firstBloodPlayed = false; }

  /* ── Heartbeat effect for low HP ───── */
  var _heartbeatTimer = 0;
  function playHeartbeat(intensity) {
    // intensity: 0-1 (0 = barely low, 1 = near death)
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    // BPM: 80 at intensity 0, 160 at intensity 1
    var interval = 60 / (80 + intensity * 80);
    if ((now - _heartbeatTimer) < interval) return;
    _heartbeatTimer = now;
    var vol = 0.06 + intensity * 0.12;
    // Two-thump heartbeat: lub...dub
    for (var i = 0; i < 2; i++) {
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(55 - i * 10, now + i * 0.12);
      g.gain.setValueAtTime(vol, now + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.08);
      osc.connect(g); g.connect(masterGain);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.09);
    }
  }

  // ── Bass-heavy enemy / player wound + death sounds ─────────────────
  function playEnemyWound(spatialPos) {
    if (!enabled || !ctx) return;
    var now = ctx.currentTime;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.45, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    g.connect(masterGain);
    var o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(180 + Math.random() * 40, now);
    o.frequency.exponentialRampToValueAtTime(80, now + 0.5);
    var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 320; f.Q.value = 4;
    o.connect(f); f.connect(g);
    o.start(now); o.stop(now + 0.6);
  }
  function playEnemyDying(spatialPos) {
    if (!enabled || !ctx) return;
    var now = ctx.currentTime;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.55, now + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
    g.connect(masterGain);
    var o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(140, now);
    o.frequency.exponentialRampToValueAtTime(50, now + 1.2);
    var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600;
    // Choke / gurgle: noise burst
    var noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.8, ctx.sampleRate);
    var nd = noiseBuf.getChannelData(0);
    for (var i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / nd.length);
    var nSrc = ctx.createBufferSource(); nSrc.buffer = noiseBuf;
    var nFilt = ctx.createBiquadFilter(); nFilt.type = 'bandpass'; nFilt.frequency.value = 600; nFilt.Q.value = 5;
    var nGain = ctx.createGain(); nGain.gain.value = 0.25;
    nSrc.connect(nFilt); nFilt.connect(nGain); nGain.connect(g);
    o.connect(f); f.connect(g);
    o.start(now); o.stop(now + 1.4);
    nSrc.start(now); nSrc.stop(now + 0.8);
  }
  function playPlayerWound() {
    if (!enabled || !ctx) return;
    var now = ctx.currentTime;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.5, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    g.connect(masterGain);
    var o = ctx.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(220, now);
    o.frequency.exponentialRampToValueAtTime(110, now + 0.6);
    var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 800;
    o.connect(f); f.connect(g);
    o.start(now); o.stop(now + 0.7);
  }
  function playVehicleIdle(rpm) {
    // Returns a handle so caller can stop / update
    if (!enabled || !ctx) return null;
    var now = ctx.currentTime;
    var g = ctx.createGain(); g.gain.value = 0.18; g.connect(masterGain);
    var o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 50 + (rpm || 0) * 30;
    var o2 = ctx.createOscillator(); o2.type = 'square';   o2.frequency.value = 25 + (rpm || 0) * 18;
    var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 320;
    o1.connect(f); o2.connect(f); f.connect(g);
    var lfo = ctx.createOscillator(); lfo.frequency.value = 6;
    var lfoG = ctx.createGain(); lfoG.gain.value = 8;
    lfo.connect(lfoG); lfoG.connect(o1.frequency);
    o1.start(now); o2.start(now); lfo.start(now);
    return {
      setRpm: function (v) {
        try { o1.frequency.setTargetAtTime(50 + v * 30, ctx.currentTime, 0.1); o2.frequency.setTargetAtTime(25 + v * 18, ctx.currentTime, 0.1); } catch (e) {}
      },
      stop: function () {
        var t = ctx.currentTime;
        try { g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); } catch (e) {}
        try { o1.stop(t + 0.32); o2.stop(t + 0.32); lfo.stop(t + 0.32); } catch (e) {}
      }
    };
  }
  function playMortarFire() {
    if (!enabled || !ctx) return;
    var now = ctx.currentTime;
    var g = ctx.createGain(); g.connect(masterGain);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.9, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    var o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(120, now);
    o.frequency.exponentialRampToValueAtTime(35, now + 0.6);
    var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 380;
    o.connect(f); f.connect(g);
    o.start(now); o.stop(now + 0.8);
    // Click on top
    var nb = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate);
    var nd = nb.getChannelData(0);
    for (var i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1);
    var ns = ctx.createBufferSource(); ns.buffer = nb;
    var ng = ctx.createGain(); ng.gain.value = 0.3;
    ns.connect(ng); ng.connect(masterGain);
    ns.start(now); ns.stop(now + 0.06);
  }
  function playBirdCaw() {
    if (!enabled || !ctx) return;
    var now = ctx.currentTime;
    var g = ctx.createGain(); g.connect(masterGain);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    var o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(900 + Math.random() * 200, now);
    o.frequency.exponentialRampToValueAtTime(400, now + 0.3);
    var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 6;
    o.connect(f); f.connect(g);
    o.start(now); o.stop(now + 0.4);
  }
  function playBrickShatter() {
    if (!enabled || !ctx) return;
    var now = ctx.currentTime;
    var nb = ctx.createBuffer(1, ctx.sampleRate * 0.45, ctx.sampleRate);
    var nd = nb.getChannelData(0);
    for (var i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / nd.length, 2);
    var ns = ctx.createBufferSource(); ns.buffer = nb;
    var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 3;
    var g = ctx.createGain(); g.gain.value = 0.4;
    ns.connect(f); f.connect(g); g.connect(masterGain);
    ns.start(now); ns.stop(now + 0.45);
  }

  // Distant mortar/artillery boom - low rumble for ambient war atmosphere
  function playDistantBoom() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    // Deep, distant boom: low sine + filtered noise
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(48, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 1.2);
    gain.gain.setValueAtTime(0.13, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 1.2);
    // Noise burst overlay for rumble
    var noise = createNoise(0.9);
    var noiseGain = ctx.createGain();
    var noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 180;
    noiseGain.gain.setValueAtTime(0.07, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
  }

  function playLootPickup() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    var freqs = [880, 1109, 1318, 1760];
    freqs.forEach(function(f, i) {
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(f, now + i * 0.05);
      o.frequency.exponentialRampToValueAtTime(f * 1.05, now + i * 0.05 + 0.1);
      g.gain.setValueAtTime(0.12, now + i * 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.2);
      o.connect(g); g.connect(masterGain);
      o.start(now + i * 0.05); o.stop(now + i * 0.05 + 0.22);
    });
  }

  function playShopPurchase() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    var notes = [523, 659, 784];
    notes.forEach(function(f, i) {
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.18, now + i * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);
      o.connect(g); g.connect(masterGain);
      o.start(now + i * 0.08); o.stop(now + i * 0.08 + 0.38);
    });
    var click = ctx.createOscillator();
    var cg = ctx.createGain();
    click.type = 'square'; click.frequency.value = 120;
    cg.gain.setValueAtTime(0.06, now); cg.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    click.connect(cg); cg.connect(masterGain);
    click.start(now); click.stop(now + 0.05);
  }

  function playBloodHit() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    var noise = createNoise(0.08);
    var filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    noise.connect(filter); filter.connect(gain); gain.connect(masterGain);
    var thud = ctx.createOscillator();
    var tg = ctx.createGain();
    thud.type = 'sine'; thud.frequency.setValueAtTime(100, now);
    thud.frequency.exponentialRampToValueAtTime(40, now + 0.08);
    tg.gain.setValueAtTime(0.15, now); tg.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    thud.connect(tg); tg.connect(masterGain);
    thud.start(now); thud.stop(now + 0.12);
  }

  function playT72Cannon() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    var noise1 = createNoise(0.5);
    var f1 = ctx.createBiquadFilter();
    f1.type = 'lowpass'; f1.frequency.value = 400;
    var g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.55, now); g1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    noise1.connect(f1); f1.connect(g1); g1.connect(masterGain);
    var sub = ctx.createOscillator();
    var sg = ctx.createGain();
    sub.type = 'sine'; sub.frequency.setValueAtTime(55, now);
    sub.frequency.exponentialRampToValueAtTime(28, now + 0.6);
    sg.gain.setValueAtTime(0.35, now); sg.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    sub.connect(sg); sg.connect(masterGain);
    sub.start(now); sub.stop(now + 0.75);
    var crack = ctx.createOscillator();
    var cg = ctx.createGain();
    crack.type = 'sawtooth'; crack.frequency.value = 180;
    cg.gain.setValueAtTime(0.4, now); cg.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    crack.connect(cg); cg.connect(masterGain);
    crack.start(now); crack.stop(now + 0.08);
  }

  function playBTR80Fire() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    var noise = createNoise(0.12);
    var filter = ctx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 600; filter.Q.value = 0.8;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.28, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    noise.connect(filter); filter.connect(gain); gain.connect(masterGain);
    var bark = ctx.createOscillator();
    var bg = ctx.createGain();
    bark.type = 'sawtooth'; bark.frequency.setValueAtTime(280, now);
    bark.frequency.exponentialRampToValueAtTime(110, now + 0.1);
    bg.gain.setValueAtTime(0.22, now); bg.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    bark.connect(bg); bg.connect(masterGain);
    bark.start(now); bark.stop(now + 0.16);
  }

  function playHorn() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    var freqs = [233, 293, 175];
    freqs.forEach(function(f, i) {
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0, now);
      g.gain.linearRampToValueAtTime(0.15, now + 0.04);
      g.gain.setValueAtTime(0.15, now + 0.55);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      o.connect(g); g.connect(masterGain);
      o.start(now); o.stop(now + 0.72);
    });
  }

  // ── Ambient battlefield sounds ──────────────────────────────

  // Deep distant artillery rumble (non-directional, low freq)
  function playDistantArtillery() {
    if (!enabled || !ctx) return;
    resume();
    var buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 1.5), ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.8;
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 120;
    lp.Q.value = 5;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.15);
    gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.5);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
    src.connect(lp); lp.connect(gain); gain.connect(masterGain);
    src.start(ctx.currentTime);
  }

  // Helicopter rotor ambience — call with true to start, false to stop
  var _heliOsc = null;
  var _heliGain = null;
  function playHelicopterAmbient(start) {
    if (!enabled || !ctx) return;
    resume();
    if (start) {
      if (_heliOsc) return;
      _heliOsc = ctx.createOscillator();
      _heliOsc.type = 'sawtooth';
      _heliOsc.frequency.value = 18;
      var lfo = ctx.createOscillator();
      lfo.frequency.value = 18;
      var lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.3;
      lfo.connect(lfoGain);
      _heliGain = ctx.createGain();
      _heliGain.gain.value = 0.08;
      var lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 400;
      lfoGain.connect(_heliGain.gain);
      _heliOsc.connect(lp); lp.connect(_heliGain); _heliGain.connect(masterGain);
      _heliOsc.start(); lfo.start();
    } else {
      if (_heliOsc) { try { _heliOsc.stop(); } catch(e) {} _heliOsc = null; _heliGain = null; }
    }
  }

  // Wind howl ambient — intensity 0.0 to 1.0; creates node on first call
  var _windAmbNode = null;
  var _windAmbGain = null;
  function playWindAmbient(intensity) {
    if (!enabled || !ctx) return;
    resume();
    if (!_windAmbGain) {
      var buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      _windAmbNode = ctx.createBufferSource();
      _windAmbNode.buffer = buf;
      _windAmbNode.loop = true;
      var hp = ctx.createBiquadFilter();
      hp.type = 'bandpass';
      hp.frequency.value = 600;
      hp.Q.value = 0.7;
      _windAmbGain = ctx.createGain();
      _windAmbGain.gain.value = 0;
      _windAmbNode.connect(hp); hp.connect(_windAmbGain); _windAmbGain.connect(masterGain);
      _windAmbNode.start();
    }
    _windAmbGain.gain.setTargetAtTime((intensity || 0) * 0.06, ctx.currentTime, 0.5);
  }

  // Supersonic bullet crack — near-miss crack whip sound
  function playBulletCrack() {
    if (!enabled || !ctx) return;
    resume();
    var len = Math.floor(ctx.sampleRate * 0.04);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) {
      var env = 1 - i / len;
      d[i] = (Math.random() * 2 - 1) * env * env;
    }
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000;
    var gain = ctx.createGain(); gain.gain.value = 0.6;
    src.connect(hp); hp.connect(gain); gain.connect(masterGain);
    src.start();
  }

  // ── 1. Positional 3D Audio Engine ────────────────────────────
  // playPositional3D: plays a sound at a world position with distance falloff and stereo pan
  function playPositional3D(soundId, worldX, worldZ, listenerX, listenerZ) {
    if (!enabled || !ctx) return;
    resume();
    var dx = (worldX || 0) - (listenerX || 0);
    var dz = (worldZ || 0) - (listenerZ || 0);
    var distance = Math.sqrt(dx * dx + dz * dz);
    var maxRange = 40;
    if (distance > maxRange) return;
    var vol = 1 / (distance + 1);
    var angle = Math.atan2(dx, dz);
    var pan = Math.max(-1, Math.min(1, Math.sin(angle)));
    var now = ctx.currentTime;

    // Attempt to use PannerNode (full 3D), fall back to StereoPannerNode
    var panner = null;
    if (ctx.createPanner) {
      panner = ctx.createPanner();
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'linear';
      panner.maxDistance = maxRange;
      panner.refDistance = 1;
      panner.rolloffFactor = 1;
      if (panner.positionX) {
        panner.positionX.value = dx;
        panner.positionY.value = 0;
        panner.positionZ.value = dz;
      } else {
        panner.setPosition(dx, 0, dz);
      }
    } else if (ctx.createStereoPanner) {
      panner = ctx.createStereoPanner();
      _safePV(panner.pan, pan);
    }

    var gainNode = ctx.createGain();
    gainNode.gain.value = _safeAudio(Math.min(1, vol));

    // Choose oscillator params based on soundId
    var freq = 400, decay = 0.10, oscType = 'sawtooth';
    if (soundId === 'gunshot_enemy') { freq = 400; decay = 0.10; }
    else if (soundId === 'explosion') { freq = 70; decay = 0.35; oscType = 'sine'; }
    else if (soundId === 'engine') { freq = 80; decay = 0.20; oscType = 'sawtooth'; }
    else if (soundId === 'pistol') { freq = 800; decay = 0.06; }
    else if (soundId === 'rifle') { freq = 400; decay = 0.10; }

    var osc = ctx.createOscillator();
    osc.type = oscType;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * 0.2), now + decay);
    var oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.25, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + decay);
    osc.connect(oscGain);
    oscGain.connect(gainNode);

    if (panner) {
      gainNode.connect(panner);
      panner.connect(masterGain);
    } else {
      gainNode.connect(masterGain);
    }
    osc.start(now);
    osc.stop(now + decay + 0.01);
  }

  // ── 2. Level-specific Ambient Sound Layers ────────────────────
  var _levelAmbientTimers = [];
  var _levelAmbientSources = [];
  var _levelAmbientNodes = [];

  function stopLevelAmbient() {
    var i;
    for (i = 0; i < _levelAmbientTimers.length; i++) {
      clearTimeout(_levelAmbientTimers[i]);
      clearInterval(_levelAmbientTimers[i]);
    }
    for (i = 0; i < _levelAmbientSources.length; i++) {
      try { _levelAmbientSources[i].stop(); } catch(e) {}
    }
    for (i = 0; i < _levelAmbientNodes.length; i++) {
      try { _levelAmbientNodes[i].disconnect(); } catch(e) {}
    }
    _levelAmbientTimers = [];
    _levelAmbientSources = [];
    _levelAmbientNodes = [];
  }

  function playAmbient(levelId) {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = ctx.createGain();
        masterGain.gain.value = volume;
        masterGain.connect(ctx.destination);
      } catch(e) { return; }
    }
    if (!enabled) return;
    resume();
    stopLevelAmbient();

    if (levelId === 'CHORNOBYL') {
      // Geiger counter: random oscillator clicks 10-40ms pulses, 0.3-2s apart
      function _scheduleGeiger() {
        if (!enabled || !ctx) return;
        var now = ctx.currentTime;
        var pulseLen = 0.010 + Math.random() * 0.030; // 10-40ms
        var osc = ctx.createOscillator();
        var g = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = 3000 + Math.random() * 3000;
        g.gain.setValueAtTime(0.04, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + pulseLen);
        osc.connect(g); g.connect(masterGain);
        osc.start(now); osc.stop(now + pulseLen + 0.001);
        _levelAmbientSources.push(osc);
        _levelAmbientNodes.push(g);
        var nextMs = 300 + Math.random() * 1700; // 0.3-2s
        var tid = setTimeout(_scheduleGeiger, nextMs);
        _levelAmbientTimers.push(tid);
      }
      _scheduleGeiger();

    } else if (levelId === 'KYIV' || levelId === 'KHARKIV' || levelId === 'MARIUPOL_STEEL') {
      // Distant artillery rumble: very low 20-40Hz oscillator, slow amplitude modulation
      var artOsc = ctx.createOscillator();
      artOsc.type = 'sine';
      artOsc.frequency.value = 20 + Math.random() * 20;
      var artLfo = ctx.createOscillator();
      artLfo.type = 'sine';
      artLfo.frequency.value = 0.12;
      var artLfoGain = ctx.createGain();
      artLfoGain.gain.value = 0.015;
      artLfo.connect(artLfoGain);
      var artGain = ctx.createGain();
      artGain.gain.value = 0.04;
      artLfoGain.connect(artGain.gain);
      artOsc.connect(artGain); artGain.connect(masterGain);
      artOsc.start(); artLfo.start();
      _levelAmbientSources.push(artOsc, artLfo);
      _levelAmbientNodes.push(artGain, artLfoGain);

    } else if (levelId === 'KREMLIN' || levelId === 'MOSCOW') {
      // Wind howl: noise through 200Hz bandpass, slow LFO on gain 0.03-0.07
      var windBuf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
      var windData = windBuf.getChannelData(0);
      for (var wi = 0; wi < windData.length; wi++) windData[wi] = Math.random() * 2 - 1;
      var windSrc = ctx.createBufferSource();
      windSrc.buffer = windBuf;
      windSrc.loop = true;
      var windFilt = ctx.createBiquadFilter();
      windFilt.type = 'bandpass';
      windFilt.frequency.value = 200;
      windFilt.Q.value = 1.5;
      var windLfo = ctx.createOscillator();
      windLfo.type = 'sine';
      windLfo.frequency.value = 0.08;
      var windLfoAmp = ctx.createGain();
      windLfoAmp.gain.value = 0.02; // LFO depth
      windLfo.connect(windLfoAmp);
      var windGain = ctx.createGain();
      windGain.gain.value = 0.05; // center of 0.03-0.07 range
      windLfoAmp.connect(windGain.gain);
      windSrc.connect(windFilt); windFilt.connect(windGain); windGain.connect(masterGain);
      windSrc.start(); windLfo.start();
      _levelAmbientSources.push(windSrc, windLfo);
      _levelAmbientNodes.push(windGain, windLfoAmp, windFilt);

    } else if (levelId === 'CRIMEA_BRIDGE') {
      // Ocean/sea wind: similar to above but faster LFO
      var seaBuf = ctx.createBuffer(1, ctx.sampleRate * 5, ctx.sampleRate);
      var seaData = seaBuf.getChannelData(0);
      for (var si = 0; si < seaData.length; si++) seaData[si] = Math.random() * 2 - 1;
      var seaSrc = ctx.createBufferSource();
      seaSrc.buffer = seaBuf;
      seaSrc.loop = true;
      var seaFilt = ctx.createBiquadFilter();
      seaFilt.type = 'bandpass';
      seaFilt.frequency.value = 300;
      seaFilt.Q.value = 0.8;
      var seaLfo = ctx.createOscillator();
      seaLfo.type = 'sine';
      seaLfo.frequency.value = 0.28; // faster LFO for ocean waves
      var seaLfoAmp = ctx.createGain();
      seaLfoAmp.gain.value = 0.025;
      seaLfo.connect(seaLfoAmp);
      var seaGain = ctx.createGain();
      seaGain.gain.value = 0.04;
      seaLfoAmp.connect(seaGain.gain);
      seaSrc.connect(seaFilt); seaFilt.connect(seaGain); seaGain.connect(masterGain);
      seaSrc.start(); seaLfo.start();
      _levelAmbientSources.push(seaSrc, seaLfo);
      _levelAmbientNodes.push(seaGain, seaLfoAmp, seaFilt);

    } else {
      // Default: distant combat ambience — occasional faint explosion burst every 8-15s
      function _scheduleDistantCombat() {
        if (!enabled || !ctx) return;
        var now = ctx.currentTime;
        var osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(45, now);
        osc.frequency.exponentialRampToValueAtTime(22, now + 0.9);
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.06, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        osc.connect(g); g.connect(masterGain);
        osc.start(now); osc.stop(now + 0.95);
        _levelAmbientSources.push(osc);
        _levelAmbientNodes.push(g);
        var nextMs = 8000 + Math.random() * 7000; // 8-15s
        var tid = setTimeout(_scheduleDistantCombat, nextMs);
        _levelAmbientTimers.push(tid);
      }
      _scheduleDistantCombat();
    }
  }

  // ── 3. Menu / UI SFX ─────────────────────────────────────────
  function playMenuClick() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 440;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.1, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(g); g.connect(masterGain);
    osc.start(now); osc.stop(now + 0.04);
  }

  function playMenuHover() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 880;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.05, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
    osc.connect(g); g.connect(masterGain);
    osc.start(now); osc.stop(now + 0.025);
  }

  function playWaveComplete() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    var notes = [440, 550, 660];
    var gap = 0.030; // 30ms gap
    var dur = 0.080; // 80ms each
    notes.forEach(function(freq, i) {
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      var t = now + i * (dur + gap);
      g.gain.setValueAtTime(0.12, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(g); g.connect(masterGain);
      osc.start(t); osc.stop(t + dur + 0.01);
    });
  }

  // Enhanced playLevelComplete — triumphant 4-note sequence with harmony
  function playLevelCompleteNew() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    var notes = [523, 659, 784, 1047];
    notes.forEach(function(freq, i) {
      var t = now + i * 0.4;
      // Primary note
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.12, t);
      g.gain.linearRampToValueAtTime(0.15, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.connect(g); g.connect(masterGain);
      osc.start(t); osc.stop(t + 0.55);
      // Harmony: fifth above
      var harm = ctx.createOscillator();
      var hg = ctx.createGain();
      harm.type = 'sine';
      harm.frequency.value = freq * 1.5;
      hg.gain.setValueAtTime(0.05, t);
      hg.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      harm.connect(hg); hg.connect(masterGain);
      harm.start(t); harm.stop(t + 0.55);
    });
  }

  // Enhanced playAchievementUnlock — magical shimmer: 8 notes 440→1760Hz, each 40ms
  function playAchievementUnlockNew() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    var startFreq = 440;
    var endFreq = 1760;
    var numNotes = 8;
    var noteDur = 0.040;
    for (var ai = 0; ai < numNotes; ai++) {
      var freq = startFreq * Math.pow(endFreq / startFreq, ai / (numNotes - 1));
      var t = now + ai * noteDur;
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.08, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + noteDur);
      osc.connect(g); g.connect(masterGain);
      osc.start(t); osc.stop(t + noteDur + 0.002);
    }
  }

  // ── 4. Combat Audio Improvements ─────────────────────────────

  // Enhanced reload: metallic click pattern, 3-4 clicks 60ms apart
  function playReloadWeapon(weaponType) {
    if (!enabled || !ctx || ctx.state === 'suspended') return;
    resume();
    var now = ctx.currentTime;
    var numClicks = (weaponType === 'shotgun' || weaponType === 'sniper') ? 4 : 3;
    var clickSpacing = 0.060; // 60ms
    for (var ci = 0; ci < numClicks; ci++) {
      var t = now + ci * clickSpacing;
      var osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1800 + Math.random() * 600, t);
      osc.frequency.exponentialRampToValueAtTime(800, t + 0.025);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.09, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
      osc.connect(g); g.connect(masterGain);
      osc.start(t); osc.stop(t + 0.04);
      // Metallic resonance
      var ping = ctx.createOscillator();
      ping.type = 'sine';
      ping.frequency.value = 3000 + Math.random() * 1500;
      var pg = ctx.createGain();
      pg.gain.setValueAtTime(0.03, t);
      pg.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      ping.connect(pg); pg.connect(masterGain);
      ping.start(t); ping.stop(t + 0.045);
    }
  }

  // Dry fire — hollow click: 100Hz tap oscillator, 40ms
  function playDryFireNew() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.040);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.08, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.040);
    osc.connect(g); g.connect(masterGain);
    osc.start(now); osc.stop(now + 0.045);
  }

  // Far explosion — low rumble at 40Hz, 0.8s, fades
  function playExplosionFar() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(40, now);
    osc.frequency.exponentialRampToValueAtTime(22, now + 0.8);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.07, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc.connect(g); g.connect(masterGain);
    osc.start(now); osc.stop(now + 0.82);
    // Noise rumble
    var nbuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.8), ctx.sampleRate);
    var nd = nbuf.getChannelData(0);
    for (var ni = 0; ni < nd.length; ni++) nd[ni] = (Math.random() * 2 - 1) * (1 - ni / nd.length);
    var nsrc = ctx.createBufferSource();
    nsrc.buffer = nbuf;
    var nf = ctx.createBiquadFilter();
    nf.type = 'lowpass'; nf.frequency.value = 100;
    var ng = ctx.createGain(); ng.gain.value = 0.04;
    nsrc.connect(nf); nf.connect(ng); ng.connect(masterGain);
    nsrc.start(now); nsrc.stop(now + 0.82);
  }

  // Near explosion — distance-attenuated sharp boom then rumble tail
  function playExplosionNear(distance) {
    if (!enabled || !ctx) return;
    resume();
    var dist = Math.max(1, Math.min(40, distance || 1));
    var vol = Math.max(0.05, 1 - dist / 40);
    var now = ctx.currentTime;
    // Sharp boom: 60Hz → 20Hz sweep, 0.4s
    var osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.4);
    var g = ctx.createGain();
    g.gain.setValueAtTime(_safeAudio(0.45 * vol), now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(g); g.connect(masterGain);
    osc.start(now); osc.stop(now + 0.42);
    // Noise burst on impact
    var crack = createNoise(0.12);
    var cg = ctx.createGain();
    cg.gain.setValueAtTime(_safeAudio(0.35 * vol), now);
    cg.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    crack.connect(cg); cg.connect(masterGain);
    // Rumble tail: 0.6s after boom
    var rumble = ctx.createOscillator();
    rumble.type = 'sine';
    rumble.frequency.setValueAtTime(35, now + 0.4);
    rumble.frequency.exponentialRampToValueAtTime(18, now + 1.0);
    var rg = ctx.createGain();
    rg.gain.setValueAtTime(_safeAudio(0.08 * vol), now + 0.4);
    rg.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    rumble.connect(rg); rg.connect(masterGain);
    rumble.start(now + 0.38); rumble.stop(now + 1.05);
  }

  // Melee knife swing — air whoosh: white noise through 2000Hz lowpass, 150ms
  function playMeleeKnifeSwing() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    var whoosh = createNoise(0.15);
    var filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 2000;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.18, now + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    whoosh.connect(filt); filt.connect(g); g.connect(masterGain);
  }

  // Melee knife hit — wet thud: 200→80Hz sine sweep, 100ms
  function playMeleeKnifeHit() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.10);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.22, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
    osc.connect(g); g.connect(masterGain);
    osc.start(now); osc.stop(now + 0.11);
    // Flesh thud noise
    var n = createNoise(0.08);
    var nf = ctx.createBiquadFilter();
    nf.type = 'lowpass'; nf.frequency.value = 600;
    var ng = ctx.createGain();
    ng.gain.setValueAtTime(0.14, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    n.connect(nf); nf.connect(ng); ng.connect(masterGain);
  }

  // ── Enhanced Audio Functions ──────────────────────────────────

  // 1. playFootstepEnhanced — surface-aware synthetic footstep
  var _lastFootstepTime = 0;
  function playFootstepEnhanced(surfaceType, isRunning) {
    if (window._sfxEnabled === false) return;
    if (!enabled || !ctx) return;
    var masterVol = window._masterVolume || 1.0;
    var now = ctx.currentTime;
    // Rate limiting: ~2/s walking (~500ms), ~3.5/s running (~286ms)
    var minInterval = isRunning ? 0.286 : 0.500;
    if ((now - _lastFootstepTime) < minInterval) return;
    _lastFootstepTime = now;
    resume();
    var surface = surfaceType || 'concrete';
    var gainMult = isRunning ? 1.4 : 1.0;
    if (surface === 'concrete' || surface === 'metal') {
      // Short noise burst, 200Hz HP filter
      var noise = createNoise(0.06);
      var hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 200;
      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08 * gainMult * masterVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      noise.connect(hp); hp.connect(gain); gain.connect(masterGain);
    } else if (surface === 'dirt' || surface === 'wood') {
      // Lower noise burst, 80Hz HP filter
      var noise2 = createNoise(0.10);
      var hp2 = ctx.createBiquadFilter();
      hp2.type = 'highpass';
      hp2.frequency.value = 80;
      var gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.06 * gainMult * masterVol, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
      noise2.connect(hp2); hp2.connect(gain2); gain2.connect(masterGain);
    } else if (surface === 'water') {
      // Splash noise burst
      var noise3 = createNoise(0.08);
      var hp3 = ctx.createBiquadFilter();
      hp3.type = 'highpass';
      hp3.frequency.value = 400;
      var gain3 = ctx.createGain();
      gain3.gain.setValueAtTime(0.07 * gainMult * masterVol, now);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      noise3.connect(hp3); hp3.connect(gain3); gain3.connect(masterGain);
      // Brief delay reverb (simulate splash echo)
      var delay = ctx.createDelay();
      delay.delayTime.value = 0.05;
      var echoNoise = createNoise(0.05);
      var echoGain = ctx.createGain();
      echoGain.gain.setValueAtTime(0.03 * masterVol, now + 0.05);
      echoGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      echoNoise.connect(delay); delay.connect(echoGain); echoGain.connect(masterGain);
    } else {
      // Default: concrete-like
      var noiseD = createNoise(0.06);
      var hpD = ctx.createBiquadFilter();
      hpD.type = 'highpass';
      hpD.frequency.value = 200;
      var gainD = ctx.createGain();
      gainD.gain.setValueAtTime(0.07 * gainMult * masterVol, now);
      gainD.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      noiseD.connect(hpD); hpD.connect(gainD); gainD.connect(masterGain);
    }
  }

  // 2. playRicochetEnhanced — sharp metallic ping with distance factor
  function playRicochetEnhanced(distanceFactor) {
    if (window._sfxEnabled === false) return;
    if (!enabled || !ctx) return;
    var masterVol = window._masterVolume || 1.0;
    var df = (distanceFactor == null) ? 1.0 : Math.max(0, Math.min(1, distanceFactor));
    resume();
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.linearRampToValueAtTime(800, now + 0.08);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.04 * df * masterVol, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(g); g.connect(masterGain);
    osc.start(now); osc.stop(now + 0.09);
  }

  // 3. playGlassBreak — high freq noise burst + debris rattle
  function playGlassBreak() {
    if (window._sfxEnabled === false) return;
    if (!enabled || !ctx) return;
    var masterVol = window._masterVolume || 1.0;
    resume();
    var now = ctx.currentTime;
    // High freq noise burst: 4000Hz HP, 0.15 gain, 0.12s
    var shatter = createNoise(0.12);
    var hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 4000;
    var shatterGain = ctx.createGain();
    shatterGain.gain.setValueAtTime(0.15 * masterVol, now);
    shatterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    shatter.connect(hp); hp.connect(shatterGain); shatterGain.connect(masterGain);
    // Debris rattle: low 200Hz noise, 0.05 gain, 0.3s with fade
    var rattle = createNoise(0.3);
    var rattleFilt = ctx.createBiquadFilter();
    rattleFilt.type = 'lowpass';
    rattleFilt.frequency.value = 200;
    var rattleGain = ctx.createGain();
    rattleGain.gain.setValueAtTime(0.05 * masterVol, now + 0.10);
    rattleGain.gain.linearRampToValueAtTime(0.04 * masterVol, now + 0.2);
    rattleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.40);
    rattle.connect(rattleFilt); rattleFilt.connect(rattleGain); rattleGain.connect(masterGain);
  }

  // 4. playHelicopterRotor — start/stop rotor oscillation at 14Hz
  var _heliRotorOsc = null;
  var _heliRotorGain = null;
  function playHelicopterRotor(isActive, distanceFactor) {
    if (window._sfxEnabled === false) return;
    if (!enabled || !ctx) return;
    var masterVol = window._masterVolume || 1.0;
    var df = (distanceFactor == null) ? 1.0 : Math.max(0, Math.min(1, distanceFactor));
    resume();
    if (isActive) {
      if (_heliRotorOsc) return; // already running
      _heliRotorOsc = ctx.createOscillator();
      _heliRotorOsc.type = 'sine';
      _heliRotorOsc.frequency.value = 14; // ~14Hz rotor pulse
      _heliRotorGain = ctx.createGain();
      _heliRotorGain.gain.value = 0.1 * df * masterVol;
      var rotorLp = ctx.createBiquadFilter();
      rotorLp.type = 'lowpass';
      rotorLp.frequency.value = 400;
      _heliRotorOsc.connect(rotorLp);
      rotorLp.connect(_heliRotorGain);
      _heliRotorGain.connect(masterGain);
      _heliRotorOsc.start();
    } else {
      if (_heliRotorOsc) {
        try { _heliRotorOsc.stop(); } catch(e) {}
        _heliRotorOsc = null;
        _heliRotorGain = null;
      }
    }
  }

  // 5. playMortarLaunch — low THUMP + ascending whistle
  function playMortarLaunch() {
    if (window._sfxEnabled === false) return;
    if (!enabled || !ctx) return;
    var masterVol = window._masterVolume || 1.0;
    resume();
    var now = ctx.currentTime;
    // Low THUMP: 60Hz sine, 0.7 gain, 0.15s fast attack/decay
    var thump = ctx.createOscillator();
    thump.type = 'sine';
    thump.frequency.value = 60;
    var thumpGain = ctx.createGain();
    thumpGain.gain.setValueAtTime(0.001, now);
    thumpGain.gain.linearRampToValueAtTime(0.7 * masterVol, now + 0.02);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    thump.connect(thumpGain); thumpGain.connect(masterGain);
    thump.start(now); thump.stop(now + 0.16);
    // Ascending whistle: 200→800Hz sweep, 0.1 gain, 1.0s
    var whistle = ctx.createOscillator();
    whistle.type = 'sine';
    whistle.frequency.setValueAtTime(200, now + 0.05);
    whistle.frequency.linearRampToValueAtTime(800, now + 1.05);
    var whistleGain = ctx.createGain();
    whistleGain.gain.setValueAtTime(0.1 * masterVol, now + 0.05);
    whistleGain.gain.exponentialRampToValueAtTime(0.001, now + 1.05);
    whistle.connect(whistleGain); whistleGain.connect(masterGain);
    whistle.start(now + 0.05); whistle.stop(now + 1.06);
  }

  // 6. playMortarImpact — sub-bass BOOM + debris rattle
  function playMortarImpact(distanceFactor) {
    if (window._sfxEnabled === false) return;
    if (!enabled || !ctx) return;
    var masterVol = window._masterVolume || 1.0;
    var df = (distanceFactor == null) ? 1.0 : Math.max(0, Math.min(1, distanceFactor));
    resume();
    var now = ctx.currentTime;
    // Sub-bass BOOM: 40Hz sine, gain 1.0×df, 0.5s
    var boom = ctx.createOscillator();
    boom.type = 'sine';
    boom.frequency.value = 40;
    var boomGain = ctx.createGain();
    boomGain.gain.setValueAtTime(1.0 * df * masterVol, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    boom.connect(boomGain); boomGain.connect(masterGain);
    boom.start(now); boom.stop(now + 0.52);
    // Debris rattle: bandpass noise 400Hz, 0.3 gain, 0.8s
    var debris = createNoise(0.8);
    var debrisFilt = ctx.createBiquadFilter();
    debrisFilt.type = 'bandpass';
    debrisFilt.frequency.value = 400;
    debrisFilt.Q.value = 1.5;
    var debrisGain = ctx.createGain();
    debrisGain.gain.setValueAtTime(0.3 * masterVol, now);
    debrisGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    debris.connect(debrisFilt); debrisFilt.connect(debrisGain); debrisGain.connect(masterGain);
  }

  // 7. playTripwireArm — short mechanical click
  function playTripwireArm() {
    if (window._sfxEnabled === false) return;
    if (!enabled || !ctx) return;
    var masterVol = window._masterVolume || 1.0;
    resume();
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 880;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.04 * masterVol, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(g); g.connect(masterGain);
    osc.start(now); osc.stop(now + 0.05);
  }

  // 8. playTripwireDetonate — explosion with extra low-end
  function playTripwireDetonate() {
    if (window._sfxEnabled === false) return;
    if (!enabled || !ctx) return;
    var masterVol = window._masterVolume || 1.0;
    resume();
    // Alias to playExplosionNear with extra 30Hz oscillator
    playExplosionNear(2);
    var now = ctx.currentTime;
    var subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.value = 30;
    var subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.3 * masterVol, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    subOsc.connect(subGain); subGain.connect(masterGain);
    subOsc.start(now); subOsc.stop(now + 0.65);
  }

  // 9. playVehicleEngineLoop — continuous engine hum, start/stop on isRunning toggle
  var _vehicleEngineOsc = null;
  var _vehicleEngineGain = null;
  function playVehicleEngineLoop(isRunning, type) {
    if (window._sfxEnabled === false) return;
    if (!enabled || !ctx) return;
    var masterVol = window._masterVolume || 1.0;
    resume();
    if (isRunning) {
      if (_vehicleEngineOsc) return; // already running
      var freqMap = { truck: 60, tank: 45, btv: 70 };
      var baseFreq = freqMap[type] || 80;
      _vehicleEngineOsc = ctx.createOscillator();
      _vehicleEngineOsc.type = 'sawtooth';
      _vehicleEngineOsc.frequency.value = baseFreq;
      _vehicleEngineGain = ctx.createGain();
      _vehicleEngineGain.gain.value = 0.08 * masterVol;
      var engLp = ctx.createBiquadFilter();
      engLp.type = 'lowpass';
      engLp.frequency.value = 300;
      _vehicleEngineOsc.connect(engLp);
      engLp.connect(_vehicleEngineGain);
      _vehicleEngineGain.connect(masterGain);
      _vehicleEngineOsc.start();
    } else {
      if (_vehicleEngineOsc) {
        try { _vehicleEngineOsc.stop(); } catch(e) {}
        _vehicleEngineOsc = null;
        _vehicleEngineGain = null;
      }
    }
  }

  // 10. playRadioChatter — bandpass noise 1200-2400Hz voice range, 0.3s burst
  function playRadioChatter() {
    if (window._sfxEnabled === false) return;
    if (!enabled || !ctx) return;
    var masterVol = window._masterVolume || 1.0;
    resume();
    var now = ctx.currentTime;
    var noise = createNoise(0.3);
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800; // center of 1200-2400Hz
    bp.Q.value = 1.5;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.06 * masterVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    noise.connect(bp); bp.connect(gain); gain.connect(masterGain);
  }

  return {
    init: init,
    resume: resume,
    playEnemyWound: playEnemyWound,
    playEnemyDying: playEnemyDying,
    playPlayerWound: playPlayerWound,
    playVehicleIdle: playVehicleIdle,
    playMortarFire: playMortarFire,
    playBirdCaw: playBirdCaw,
    playBrickShatter: playBrickShatter,
    playGunshot: playGunshot,
    playSpatialGunshot: playSpatialGunshot,
    playExplosion: playExplosion,
    playDistantBoom: playDistantBoom,
    playHit: playHit,
    playHitPitched: playHitPitched,
    playReload: playReload,
    playReloadReady: playReloadReady,
    playPickup: playPickup,
    playDeath: playDeath,
    playEnemyDeath: playEnemyDeath,
    playScream: playScream,
    playFootstep: playFootstep,
    playEnemyFootstep: playEnemyFootstep,
    startEngine: startEngine,
    updateEngine: updateEngine,
    stopEngine: stopEngine,
    playTurretTraverse: playTurretTraverse,
    playReadyChime: playReadyChime,
    playAmbientWind: playAmbientWind,
    startAmbientLoop: startAmbientLoop,
    stopAmbientLoop: stopAmbientLoop,
    playWaveStart: playWaveStart,
    playMusic: playMusic,
    playBossMusic: playBossMusic,
    stopMusic: stopMusic,
    setMusicVolume: setMusicVolume,
    setMusicIntensity: setMusicIntensity,
    playFlashbang: playFlashbang,
    playMine: playMine,
    playSmoke: playSmoke,

    playRicochet: playRicochet,
    startDroneMotor: startDroneMotor,
    updateDroneMotor: updateDroneMotor,
    stopDroneMotor: stopDroneMotor,
    isMusicPlaying: isMusicPlaying,
    setVolume: setVolume,
    toggle: toggle,
    isEnabled: function () { return enabled; },
    // B21: New audio
    playEnemyBark: playEnemyBark,
    playBark: playEnemyBark,
    playHeadshotDing: playHeadshotDing,
    playLevelComplete: playLevelComplete,
    playGrenadeBounce: playGrenadeBounce,
    playTankCannon: playTankCannon,
    playKnifeThrow: playKnifeThrow,
    startFireCrackle: startFireCrackle,
    stopFireCrackle: stopFireCrackle,
    playGeigerTick: playGeigerTick,
    // New sounds
    playVehicleEngine: playVehicleEngine,
    playGrappleHook: playGrappleHook,
    playWallRun: playWallRun,
    playAchievementUnlock: playAchievementUnlock,
    playUnlock: playAchievementUnlock,
    playLevelUp: playLevelUp,
    playRollDodge: playRollDodge,
    playCriticalHit: playCriticalHit,
    playEnemyAlert: playEnemyAlert,
    playBountyComplete: playBountyComplete,
    playFortificationBuild: playFortificationBuild,
    playWeaponSwitch: playWeaponSwitch,
    playDryFire: playDryFire,
    playKillConfirm: playKillConfirm,
    playMultiKill: playMultiKill,
    playFirstBlood: playFirstBlood,
    resetFirstBlood: resetFirstBlood,
    playHeartbeat: playHeartbeat,
    playLandingThud: playLandingThud,
    playBulletSnap: playBulletSnap,
    playImpact: playImpact,
    playLowHealth: playLowHealth,
    playFlatline: playFlatline,
    playLootPickup: playLootPickup,
    playShopPurchase: playShopPurchase,
    playBloodHit: playBloodHit,
    playT72Cannon: playT72Cannon,
    playBTR80Fire: playBTR80Fire,
    playHorn: playHorn,
    // Ambient battlefield sounds
    playDistantArtillery: playDistantArtillery,
    playHelicopterAmbient: playHelicopterAmbient,
    playWindAmbient: playWindAmbient,
    playBulletCrack: playBulletCrack,
    // 1. Positional 3D audio
    playPositional3D: playPositional3D,
    // 2. Level ambient layers
    playAmbient: playAmbient,
    stopLevelAmbient: stopLevelAmbient,
    // 3. Menu/UI SFX
    playMenuClick: playMenuClick,
    playMenuHover: playMenuHover,
    playWaveComplete: playWaveComplete,
    playLevelCompleteNew: playLevelCompleteNew,
    playAchievementUnlockNew: playAchievementUnlockNew,
    // 4. Combat audio improvements
    playReloadWeapon: playReloadWeapon,
    playDryFireNew: playDryFireNew,
    playExplosionFar: playExplosionFar,
    playExplosionNear: playExplosionNear,
    playMeleeKnifeSwing: playMeleeKnifeSwing,
    playMeleeKnifeHit: playMeleeKnifeHit,
    // Enhanced audio functions
    playFootstepEnhanced: playFootstepEnhanced,
    playRicochetEnhanced: playRicochetEnhanced,
    playGlassBreak: playGlassBreak,
    playHelicopterRotor: playHelicopterRotor,
    playMortarLaunch: playMortarLaunch,
    playMortarImpact: playMortarImpact,
    playTripwireArm: playTripwireArm,
    playTripwireDetonate: playTripwireDetonate,
    playVehicleEngineLoop: playVehicleEngineLoop,
    playRadioChatter: playRadioChatter,
  };

  // EKG flatline — played on player death before death overlay
  function playFlatline() {
    if (!enabled || !ctx) return;
    resume();
    var now = ctx.currentTime;
    // Short beeps (last heartbeats) followed by continuous flatline tone
    var beats = [0, 0.22, 0.44];
    beats.forEach(function(t) {
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 880;
      g.gain.setValueAtTime(0, now + t);
      g.gain.linearRampToValueAtTime(0.18, now + t + 0.02);
      g.gain.setValueAtTime(0.18, now + t + 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.12);
      o.connect(g); g.connect(masterGain);
      o.start(now + t); o.stop(now + t + 0.14);
    });
    // Flatline drone (1000ms)
    var fl = ctx.createOscillator();
    var fg = ctx.createGain();
    fl.type = 'sine'; fl.frequency.value = 1000;
    fg.gain.setValueAtTime(0.08, now + 0.7);
    fg.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
    fl.connect(fg); fg.connect(masterGain);
    fl.start(now + 0.7); fl.stop(now + 1.9);
  }
})();
if (typeof window !== 'undefined' && window.AudioSystem) {
  console.log('[AudioSystem] Assigned to window. Keys:', Object.keys(window.AudioSystem));
}
// Ensure AudioSystem is always available as a global variable
if (typeof AudioSystem === 'undefined' && typeof window !== 'undefined' && window.AudioSystem) {
  AudioSystem = window.AudioSystem;
}
