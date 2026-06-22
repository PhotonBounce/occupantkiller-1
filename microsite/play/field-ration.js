// field-ration.js — MRE (Meal Ready-to-Eat) health recovery pickup system
// Browser-based Three.js FPS — IIFE, all var (no let/const)
//
// Public API:
//   FieldRation.init(scene, camera, controls)
//   FieldRation.update(dt)
//   FieldRation.spawnRation(x, y, z, type)
//   FieldRation.reset()
//
// Ration types:
//   ENERGY_BAR  — +15 HP instant
//   FULL_MRE    — +40 HP over 8s
//   STIMPACK    — +25 HP + sprint speed +20% for 30s
//   MEDKIT      — +60 HP instant (rare)
//
// window._rationHealing  — boolean, true while sustained heal active

window.FieldRation = (function () {
  'use strict';

  // ------------------------------------------------------------------ config
  var COLLECT_DIST   = 1.5;
  var COLLECT_DIST_SQ = COLLECT_DIST * COLLECT_DIST;
  var BOB_SPEED      = 1.6;   // rad/s
  var BOB_RANGE      = 0.06;  // metres
  var ROTATE_SPEED   = 0.8;   // rad/s
  var FLOAT_NUM_LIFE = 1.4;   // seconds a floating "+5" lives
  var HEAL_TICK_HP   = 5;     // HP per tick during sustained heal
  var HEAL_TICK_INT  = 2.0;   // seconds between ticks
  var VIGNETTE_HZ    = 0.5;   // pulse frequency
  var STIM_SPEED_MOD = 1.20;  // sprint multiplier

  var TYPE_CONFIG = {
    ENERGY_BAR: { hp: 15, duration: 0,  color: 0xD4A84B, label: 'ENERGY BAR' },
    FULL_MRE:   { hp: 40, duration: 8,  color: 0xA0785A, label: 'FULL MRE'   },
    STIMPACK:   { hp: 25, duration: 0,  color: 0x88CC44, label: 'STIMPACK', stimDur: 30 },
    MEDKIT:     { hp: 60, duration: 0,  color: 0xFF4444, label: 'MEDKIT'     },
  };

  // ------------------------------------------------------------------ state
  var _scene    = null;
  var _camera   = null;
  var _rations  = [];   // array of ration objects
  var _time     = 0;

  // Sustained heal state
  var _healActive    = false;
  var _healTotal     = 0;   // total HP remaining to give
  var _healTimer     = 0;   // time until next tick
  var _healDuration  = 0;   // total seconds (for countdown bar)
  var _healElapsed   = 0;   // seconds elapsed in heal
  var _healTickAcc   = 0;   // accumulator for ticks

  // Stim state
  var _stimActive   = false;
  var _stimTimer    = 0;
  var _stimApplied  = false;

  // DOM / HUD elements
  var _vigEl        = null; // vignette div
  var _hudBar       = null; // HUD countdown container
  var _hudFill      = null; // HUD bar fill
  var _hudLabel     = null; // HUD text label
  var _floatCont    = null; // container for floating +HP numbers
  var _floatNums    = [];   // active floating number objects

  // AudioContext (lazy)
  var _audioCtx     = null;

  // Shared geometry
  var _boxGeo       = null;
  var _mreTexCache  = null;

  window._rationHealing = false;

  // ================================================================== helpers

  function _getBoxGeo() {
    if (!_boxGeo) {
      _boxGeo = new THREE.BoxGeometry(0.25, 0.15, 0.35);
    }
    return _boxGeo;
  }

  function _makeMRETexture(labelText) {
    var canvas = document.createElement('canvas');
    canvas.width  = 128;
    canvas.height = 64;
    var ctx = canvas.getContext('2d');

    // Background — tan/brown
    ctx.fillStyle = '#A0785A';
    ctx.fillRect(0, 0, 128, 64);

    // Dark border stripe
    ctx.fillStyle = '#6B4F38';
    ctx.fillRect(0, 0, 128, 8);
    ctx.fillRect(0, 56, 128, 8);

    // "MRE" in white bold
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MRE', 64, 28);

    // Sub-label in smaller text
    ctx.font = 'bold 9px monospace';
    ctx.fillText(labelText || 'MEAL READY-TO-EAT', 64, 50);

    return new THREE.CanvasTexture(canvas);
  }

  function _makeMesh(type) {
    var cfg = TYPE_CONFIG[type] || TYPE_CONFIG.FULL_MRE;
    var tex = _makeMRETexture(cfg.label);

    var mat = new THREE.MeshLambertMaterial({
      color:    cfg.color,
      emissive: 0x1A0F08,
      emissiveIntensity: 0.3,
      map: tex,
    });

    var mesh = new THREE.Mesh(_getBoxGeo(), mat);
    return { mesh: mesh, tex: tex };
  }

  // ================================================================== Audio

  function _getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { _audioCtx = null; }
    }
    return _audioCtx;
  }

  function _playChewSound() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      // Low-frequency click-crunch at ~150Hz
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      var dist = ctx.createWaveShaper();

      // Simple waveshaper for crunch
      var curve = new Float32Array(256);
      for (var i = 0; i < 256; i++) {
        var x = (i * 2) / 256 - 1;
        curve[i] = (Math.PI + 200) * x / (Math.PI + 200 * Math.abs(x));
      }
      dist.curve = curve;
      dist.oversample = '2x';

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

      osc.connect(dist);
      dist.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
    } catch (e) {}
  }

  function _playHealDoneSound() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      // Satisfying rising tone — "healing complete"
      var freqs = [440, 550, 660];
      for (var fi = 0; fi < freqs.length; fi++) {
        (function (freq, delay) {
          var osc  = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
          gain.gain.setValueAtTime(0.0, ctx.currentTime + delay);
          gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + delay + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.4);
        })(freqs[fi], fi * 0.07);
      }
    } catch (e) {}
  }

  // ================================================================== DOM / HUD

  function _ensureVignette() {
    if (_vigEl) return;
    _vigEl = document.createElement('div');
    _vigEl.id = 'rationVignette';
    _vigEl.style.position = 'fixed';
    _vigEl.style.top = '0';
    _vigEl.style.left = '0';
    _vigEl.style.width = '100%';
    _vigEl.style.height = '100%';
    _vigEl.style.pointerEvents = 'none';
    _vigEl.style.zIndex = '450';
    _vigEl.style.borderRadius = '0';
    _vigEl.style.opacity = '0';
    _vigEl.style.transition = 'opacity 0.1s';
    // Green vignette border glow
    _vigEl.style.boxShadow = 'inset 0 0 80px 30px rgba(0,255,80,0.45)';
    document.body.appendChild(_vigEl);
  }

  function _ensureHUD() {
    if (_hudBar) return;

    var wrap = document.createElement('div');
    wrap.id = 'rationHUD';
    wrap.style.position = 'fixed';
    wrap.style.bottom = '60px';
    wrap.style.left   = '20px';
    wrap.style.width  = '200px';
    wrap.style.pointerEvents = 'none';
    wrap.style.zIndex = '600';
    wrap.style.display = 'none';

    _hudLabel = document.createElement('div');
    _hudLabel.style.color = '#44FF88';
    _hudLabel.style.fontFamily = 'monospace, sans-serif';
    _hudLabel.style.fontSize = '12px';
    _hudLabel.style.fontWeight = 'bold';
    _hudLabel.style.marginBottom = '4px';
    _hudLabel.style.textShadow = '0 0 6px #00FF44';
    _hudLabel.textContent = 'HEALING: 0s remaining';
    wrap.appendChild(_hudLabel);

    var track = document.createElement('div');
    track.style.width = '100%';
    track.style.height = '8px';
    track.style.background = 'rgba(0,0,0,0.5)';
    track.style.border = '1px solid #44FF88';
    track.style.borderRadius = '3px';
    track.style.overflow = 'hidden';
    wrap.appendChild(track);

    _hudFill = document.createElement('div');
    _hudFill.style.height = '100%';
    _hudFill.style.width = '100%';
    _hudFill.style.background = 'linear-gradient(90deg, #00FF44, #88FF44)';
    _hudFill.style.borderRadius = '3px';
    _hudFill.style.transition = 'width 0.2s';
    track.appendChild(_hudFill);

    _hudBar = wrap;
    document.body.appendChild(_hudBar);
  }

  function _ensureFloatContainer() {
    if (_floatCont) return;
    _floatCont = document.createElement('div');
    _floatCont.id = 'rationFloatNums';
    _floatCont.style.position = 'fixed';
    _floatCont.style.top = '0';
    _floatCont.style.left = '0';
    _floatCont.style.width = '100%';
    _floatCont.style.height = '100%';
    _floatCont.style.pointerEvents = 'none';
    _floatCont.style.zIndex = '610';
    _floatCont.style.overflow = 'hidden';
    document.body.appendChild(_floatCont);
  }

  function _spawnFloatNumber(hpAmount) {
    if (!_camera || !_floatCont) return;

    // Spawn near bottom-left HUD area (fixed screen position)
    var sx = 110 + (Math.random() * 60 - 30);
    var sy = window.innerHeight - 120 + (Math.random() * 20 - 10);

    var div = document.createElement('div');
    div.textContent = '+' + hpAmount;
    div.style.position = 'fixed';
    div.style.left = sx + 'px';
    div.style.top  = sy + 'px';
    div.style.color = '#44FF88';
    div.style.fontSize = '18px';
    div.style.fontWeight = 'bold';
    div.style.fontFamily = 'monospace, sans-serif';
    div.style.textShadow = '0 0 8px #00FF44, 1px 1px 2px #000';
    div.style.opacity = '1';
    div.style.pointerEvents = 'none';
    div.style.userSelect = 'none';
    div.style.transform = 'translate(-50%, -50%)';
    _floatCont.appendChild(div);

    _floatNums.push({
      div: div,
      sx: sx,
      sy: sy,
      elapsed: 0,
    });
  }

  function _updateFloatNumbers(dt) {
    var i = _floatNums.length - 1;
    while (i >= 0) {
      var fn = _floatNums[i];
      fn.elapsed += dt;

      if (fn.elapsed >= FLOAT_NUM_LIFE) {
        if (fn.div.parentNode) fn.div.parentNode.removeChild(fn.div);
        _floatNums.splice(i, 1);
        i--;
        continue;
      }

      var progress = fn.elapsed / FLOAT_NUM_LIFE;
      var topPx    = fn.sy - progress * 55;
      var opacity  = 1 - Math.max(0, (progress - 0.55) / 0.45);

      fn.div.style.top     = topPx + 'px';
      fn.div.style.opacity = String(Math.max(0, opacity));
      i--;
    }
  }

  function _setHUDVisible(visible) {
    _ensureHUD();
    _hudBar.style.display = visible ? 'block' : 'none';
  }

  function _updateHUD() {
    if (!_healActive) { _setHUDVisible(false); return; }
    _setHUDVisible(true);
    var remaining = Math.max(0, _healDuration - _healElapsed);
    _hudLabel.textContent = 'HEALING: ' + Math.ceil(remaining) + 's remaining';
    var pct = _healDuration > 0 ? Math.max(0, 1 - _healElapsed / _healDuration) : 0;
    _hudFill.style.width = (pct * 100) + '%';
  }

  function _updateVignette(dt) {
    _ensureVignette();
    if (_healActive) {
      var pulse = (Math.sin(_time * VIGNETTE_HZ * Math.PI * 2) * 0.5 + 0.5);
      _vigEl.style.opacity = String(0.35 + pulse * 0.50);
    } else {
      _vigEl.style.opacity = '0';
    }
  }

  // ================================================================== HP helpers

  function _getPlayerHP() {
    try {
      // Common game patterns for player HP
      if (window.GameManager && typeof window.GameManager.getPlayerHP === 'function') {
        return window.GameManager.getPlayerHP();
      }
      if (window._playerHP !== undefined) return window._playerHP;
      if (window.player && window.player.hp !== undefined) return window.player.hp;
      if (window.Player && window.Player.hp !== undefined) return window.Player.hp;
    } catch (e) {}
    return null;
  }

  function _setPlayerHP(hp) {
    try {
      var clamped = Math.min(100, Math.max(0, hp));
      if (window.GameManager && typeof window.GameManager.setPlayerHP === 'function') {
        window.GameManager.setPlayerHP(clamped);
        return true;
      }
      if (window._playerHP !== undefined) { window._playerHP = clamped; return true; }
      if (window.player && window.player.hp !== undefined) { window.player.hp = clamped; return true; }
      if (window.Player && window.Player.hp !== undefined) { window.Player.hp = clamped; return true; }
    } catch (e) {}
    return false;
  }

  function _healPlayer(amount) {
    var cur = _getPlayerHP();
    if (cur === null) return;
    var next = Math.min(100, cur + amount);
    _setPlayerHP(next);
    // Update HUD HP bar if available
    try {
      if (window.HUD && typeof window.HUD.setHP === 'function') {
        window.HUD.setHP(next);
      }
    } catch (e) {}
  }

  function _applySprintBoost() {
    try {
      if (window.Player && window.Player.sprintSpeed !== undefined) {
        if (!_stimApplied) {
          window.Player.sprintSpeed *= STIM_SPEED_MOD;
          _stimApplied = true;
        }
      } else if (window.player && window.player.sprintSpeed !== undefined) {
        if (!_stimApplied) {
          window.player.sprintSpeed *= STIM_SPEED_MOD;
          _stimApplied = true;
        }
      }
    } catch (e) {}
  }

  function _removeSprintBoost() {
    try {
      if (window.Player && window.Player.sprintSpeed !== undefined && _stimApplied) {
        window.Player.sprintSpeed /= STIM_SPEED_MOD;
      } else if (window.player && window.player.sprintSpeed !== undefined && _stimApplied) {
        window.player.sprintSpeed /= STIM_SPEED_MOD;
      }
    } catch (e) {}
    _stimApplied = false;
  }

  // ================================================================== collect

  function _collectRation(ration) {
    var cfg = TYPE_CONFIG[ration.type] || TYPE_CONFIG.FULL_MRE;

    _playChewSound();

    if (cfg.duration > 0) {
      // Sustained heal: queue it
      _healActive   = true;
      _healTotal    = cfg.hp;
      _healDuration = cfg.duration;
      _healElapsed  = 0;
      _healTickAcc  = 0;
      window._rationHealing = true;
      _setHUDVisible(true);
    } else {
      // Instant heal
      _healPlayer(cfg.hp);
      _spawnFloatNumber(cfg.hp);
      _playHealDoneSound();
    }

    // Stimpack bonus
    if (ration.type === 'STIMPACK') {
      _stimActive = true;
      _stimTimer  = cfg.stimDur || 30;
      _applySprintBoost();
    }
  }

  // ================================================================== player pos

  function _getPlayerPos() {
    try {
      if (window.GameManager && window.GameManager.playerPosition) return window.GameManager.playerPosition;
      if (window._playerPos) return window._playerPos;
      if (window.player && window.player.position) return window.player.position;
      if (window.Player && window.Player.position) return window.Player.position;
      // Fallback: camera position (first-person)
      if (_camera) return _camera.position;
    } catch (e) {}
    return null;
  }

  // ================================================================== public API

  function init(scene, camera, controls) {
    _scene   = scene;
    _camera  = camera;

    _ensureVignette();
    _ensureHUD();
    _ensureFloatContainer();
  }

  function spawnRation(x, y, z, type) {
    if (!_scene) return;
    if (!TYPE_CONFIG[type]) type = 'FULL_MRE';

    var built = _makeMesh(type);
    var mesh  = built.mesh;
    var tex   = built.tex;

    var baseY = (y !== undefined ? y : 0) + 0.15;
    mesh.position.set(x || 0, baseY, z || 0);
    mesh.rotation.y = Math.random() * Math.PI * 2;

    _scene.add(mesh);

    _rations.push({
      mesh:    mesh,
      tex:     tex,
      type:    type,
      baseY:   baseY,
      phase:   Math.random() * Math.PI * 2,
      active:  true,
    });
  }

  function update(dt) {
    _time += dt;

    var playerPos = _getPlayerPos();

    // --- Animate and collect rations ---
    var i = _rations.length - 1;
    while (i >= 0) {
      var r = _rations[i];

      // Bob animation
      r.mesh.position.y = r.baseY + Math.sin(_time * BOB_SPEED + r.phase) * BOB_RANGE;
      r.mesh.rotation.y += ROTATE_SPEED * dt;

      // Proximity collection
      if (playerPos) {
        var dx = r.mesh.position.x - playerPos.x;
        var dz = r.mesh.position.z - playerPos.z;
        var distSq = dx * dx + dz * dz;

        if (distSq < COLLECT_DIST_SQ) {
          // Collect!
          _collectRation(r);
          _scene.remove(r.mesh);
          if (r.mesh.material) {
            if (r.tex) r.tex.dispose();
            r.mesh.material.dispose();
          }
          _rations.splice(i, 1);
          i--;
          continue;
        }
      }

      i--;
    }

    // --- Sustained heal tick ---
    if (_healActive) {
      _healElapsed += dt;
      _healTickAcc += dt;

      if (_healTickAcc >= HEAL_TICK_INT) {
        _healTickAcc -= HEAL_TICK_INT;
        var tickHp = Math.min(HEAL_TICK_HP, _healTotal);
        if (tickHp > 0) {
          _healPlayer(tickHp);
          _spawnFloatNumber(tickHp);
          _playChewSound();
          _healTotal -= tickHp;
        }
      }

      if (_healElapsed >= _healDuration || _healTotal <= 0) {
        _healActive = false;
        window._rationHealing = false;
        _playHealDoneSound();
        _setHUDVisible(false);
      }
    }

    // --- Stim timer ---
    if (_stimActive) {
      _stimTimer -= dt;
      if (_stimTimer <= 0) {
        _stimActive  = false;
        _removeSprintBoost();
      }
    }

    // --- Floating numbers ---
    _updateFloatNumbers(dt);

    // --- Vignette ---
    _updateVignette(dt);

    // --- HUD bar ---
    _updateHUD();
  }

  function reset() {
    // Remove all ration meshes
    var i;
    for (i = 0; i < _rations.length; i++) {
      var r = _rations[i];
      if (_scene) _scene.remove(r.mesh);
      if (r.mesh && r.mesh.material) {
        if (r.tex) r.tex.dispose();
        r.mesh.material.dispose();
      }
    }
    _rations = [];

    // Clear heal state
    _healActive    = false;
    _healTotal     = 0;
    _healTimer     = 0;
    _healDuration  = 0;
    _healElapsed   = 0;
    _healTickAcc   = 0;
    window._rationHealing = false;

    // Clear stim
    if (_stimActive) _removeSprintBoost();
    _stimActive  = false;
    _stimTimer   = 0;

    // Clear floating numbers
    for (i = 0; i < _floatNums.length; i++) {
      var fn = _floatNums[i];
      if (fn.div && fn.div.parentNode) fn.div.parentNode.removeChild(fn.div);
    }
    _floatNums = [];

    // Hide HUD / vignette
    _setHUDVisible(false);
    if (_vigEl) _vigEl.style.opacity = '0';

    _time = 0;
  }

  // ================================================================== level spawn (5 per level)

  function _spawnLevelRations(scene) {
    // Called externally or from game-manager on level start
    // Provides 5 random loot rations across the map
    var types = ['ENERGY_BAR', 'FULL_MRE', 'FULL_MRE', 'STIMPACK', 'MEDKIT'];
    var radius = 40;
    for (var n = 0; n < types.length; n++) {
      var angle = (n / types.length) * Math.PI * 2 + Math.random() * 0.8;
      var dist  = radius * (0.5 + Math.random() * 0.5);
      var rx    = Math.cos(angle) * dist;
      var rz    = Math.sin(angle) * dist;
      spawnRation(rx, 0.5, rz, types[n]);
    }
  }

  // ================================================================== medic drop (20% chance)

  function onMedicDeath(x, y, z) {
    if (Math.random() < 0.20) {
      spawnRation(x, y, z, 'FULL_MRE');
    }
  }

  // ================================================================== return

  return {
    init:             init,
    update:           update,
    spawnRation:      spawnRation,
    reset:            reset,
    spawnLevelRations: _spawnLevelRations,
    onMedicDeath:     onMedicDeath,
  };

})();
