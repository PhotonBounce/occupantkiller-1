/* ════════════════════════════════════════════════════════════════════
 *  EMP PULSE — Electromagnetic Pulse that disables enemy tech
 *  ─────────────────────────────────────────────────────────────────
 *  Keybind: Ctrl+E  |  2 charges  |  40s cooldown per charge
 *
 *  Visual:
 *   - Expanding WireframeGeometry torus ring at player Y=1
 *   - Expands 0→20 units over 0.8s, electric blue 0x00AAFF
 *   - PointLight(0x0088FF, 15, 25) flash
 *   - 6 random blue lightning arc LINE segments (15-unit radius)
 *
 *  Affected targets (within 20 units):
 *   - EnemyHelicopter: disabled 6s (rotors slow, erratic hover)
 *   - EnemyTank: disabled 5s (cannon jams, 0.3x speed)
 *   - SpyDrone / FPVKamikaze / drones: instantly crash
 *   - EnemyMortarTeam: mortar jams 8s
 *   - All affected: _electronicsDisabled = true flag
 *
 *  HUD: 0.5s brightness/contrast flicker on document.body
 *  Screen: full-screen white flash 100ms + CSS scanlines 1.5s
 *  Audio: crackling 800Hz sawtooth burst + digital glitch sound
 *  Score: +100 per enemy disabled
 *
 *  Globals: window._empActive, window._empRadius = 20
 *
 *  Public API (IIFE, window.EMPPulse):
 *    init(scene, camera)  — once after scene ready
 *    update(dt)           — per-frame
 *    activate()           — fire EMP (called by keybind or external)
 *    reset()              — clear all state between stages
 * ════════════════════════════════════════════════════════════════════ */
window.EMPPulse = (function () {
  'use strict';

  /* ── constants ───────────────────────────────────────────────────── */
  var MAX_CHARGES       = 2;
  var COOLDOWN_TIME     = 40;    // seconds per charge
  var EMP_RADIUS        = 20;
  var PULSE_DURATION    = 0.8;   // seconds for ring to expand
  var DISABLE_HELI_DUR  = 6;
  var DISABLE_TANK_DUR  = 5;
  var DISABLE_MORTAR_DUR = 8;
  var FLASH_DURATION    = 0.1;   // seconds full-white screen
  var SCANLINE_DURATION = 1.5;   // seconds scanline overlay
  var HUD_FLICKER_DUR   = 0.5;   // seconds body brightness flicker
  var LIGHTNING_COUNT   = 6;
  var LIGHTNING_RADIUS  = 15;
  var SCORE_PER_DISABLE = 100;

  /* ── private state ───────────────────────────────────────────────── */
  var _scene         = null;
  var _camera        = null;
  var _charges       = MAX_CHARGES;
  var _cooldownTimer = 0;        // counts down to next charge restore
  var _keyBound      = false;

  // Active pulse rings: {mesh, mat, light, age}
  var _pulseRings    = [];
  // Lightning arcs: {lines, age, maxAge}
  var _lightningArcs = [];
  // Spark indicators above disabled enemies: {light, mesh, enemy, age, maxAge}
  var _sparkIndicators = [];

  // HUD element
  var _hudEl         = null;
  // Screen overlay elements
  var _flashEl       = null;
  var _scanlineEl    = null;

  // Timers
  var _flashTimer    = 0;
  var _scanlineTimer = 0;
  var _flickerTimer  = 0;
  var _flickerInterval = 0;

  /* ── globals ─────────────────────────────────────────────────────── */
  window._empActive  = false;
  window._empRadius  = EMP_RADIUS;

  /* ════════════════════════════════════════════════════════════════
     AUDIO — inline Web Audio API, no external dependency
  ════════════════════════════════════════════════════════════════ */
  function _getAudioCtx() {
    if (!window._audioCtx) {
      try {
        window._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { return null; }
    }
    return window._audioCtx;
  }

  function _playEMPBurst() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var dur  = 0.9;
      var rate = ctx.sampleRate;
      var frameCount = Math.floor(rate * dur);

      // --- Sawtooth noise burst (800 Hz carrier) ---
      var buf  = ctx.createBuffer(1, frameCount, rate);
      var data = buf.getChannelData(0);
      var baseFreq = 800;
      var phase = 0;
      for (var i = 0; i < frameCount; i++) {
        var t = i / rate;
        phase += baseFreq / rate;
        phase -= Math.floor(phase);
        // sawtooth wave + noise
        var saw = phase * 2 - 1;
        var noise = (Math.random() * 2 - 1) * 0.4;
        // amplitude envelope: sharp attack, slow decay
        var env = Math.exp(-t * 3.5);
        data[i] = (saw + noise) * env * 0.35;
      }

      var src  = ctx.createBufferSource();
      src.buffer = buf;
      var filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 900;
      filter.Q.value = 2;
      var gain = ctx.createGain();
      gain.gain.value = 0.55;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) { /* silent */ }
  }

  function _playGlitchSound() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      // Digital glitch: rapid pitch-stuttering beeps
      var glitchFreqs = [1200, 600, 1800, 400, 900, 1500];
      for (var i = 0; i < glitchFreqs.length; i++) {
        (function (freq, offset) {
          var osc  = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.08, ctx.currentTime + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.07);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + offset);
          osc.stop(ctx.currentTime + offset + 0.08);
        })(glitchFreqs[i], i * 0.06);
      }
    } catch (e) { /* silent */ }
  }

  /* ════════════════════════════════════════════════════════════════
     HUD
  ════════════════════════════════════════════════════════════════ */
  function _createHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'emp-pulse-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:160px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#00AAFF',
      'font-family:monospace',
      'font-size:13px',
      'font-weight:bold',
      'text-shadow:0 0 8px #0088FF',
      'z-index:1500',
      'pointer-events:none',
      'background:rgba(0,0,20,0.5)',
      'padding:3px 10px',
      'border:1px solid #004488',
      'border-radius:3px',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(_hudEl);
    _updateHUD();
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var cooldownStr = '';
    if (_charges < MAX_CHARGES) {
      var secs = Math.ceil(_cooldownTimer);
      cooldownStr = ' [' + secs + 's]';
    }
    _hudEl.textContent = 'EMP [Ctrl+E]: ' + _charges + '/' + MAX_CHARGES + cooldownStr;
    _hudEl.style.color = _charges > 0 ? '#00AAFF' : '#445566';
  }

  /* ════════════════════════════════════════════════════════════════
     SCREEN EFFECTS
  ════════════════════════════════════════════════════════════════ */
  function _createScreenElements() {
    if (!_flashEl) {
      _flashEl = document.createElement('div');
      _flashEl.id = 'emp-flash';
      _flashEl.style.cssText = [
        'position:fixed',
        'inset:0',
        'background:#ffffff',
        'z-index:9998',
        'pointer-events:none',
        'display:none',
        'opacity:1'
      ].join(';');
      document.body.appendChild(_flashEl);
    }
    if (!_scanlineEl) {
      _scanlineEl = document.createElement('div');
      _scanlineEl.id = 'emp-scanlines';
      _scanlineEl.style.cssText = [
        'position:fixed',
        'inset:0',
        'z-index:9997',
        'pointer-events:none',
        'display:none',
        'background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,100,255,0.06) 2px,rgba(0,100,255,0.06) 4px)',
        'animation:emp-scanline-drift 0.08s linear infinite'
      ].join(';');
      // Inject scanline animation keyframes once
      if (!document.getElementById('emp-scanline-style')) {
        var styleEl = document.createElement('style');
        styleEl.id = 'emp-scanline-style';
        styleEl.textContent = [
          '@keyframes emp-scanline-drift{',
          '  0%{background-position:0 0}',
          '  100%{background-position:0 4px}',
          '}'
        ].join('');
        document.head.appendChild(styleEl);
      }
      document.body.appendChild(_scanlineEl);
    }
  }

  function _triggerScreenEffects() {
    _createScreenElements();

    // Full-screen white flash for 100ms
    if (_flashEl) {
      _flashEl.style.display = 'block';
      _flashEl.style.opacity = '1';
    }
    _flashTimer = FLASH_DURATION;

    // Scanlines for 1.5s
    if (_scanlineEl) {
      _scanlineEl.style.display = 'block';
    }
    _scanlineTimer = SCANLINE_DURATION;

    // Body brightness/contrast flicker for 0.5s
    _flickerTimer    = HUD_FLICKER_DUR;
    _flickerInterval = 0;
  }

  /* ════════════════════════════════════════════════════════════════
     THREE.JS VISUAL EFFECTS
  ════════════════════════════════════════════════════════════════ */
  function _getScene() {
    return _scene || (window.GameManager && window.GameManager.getScene && window.GameManager.getScene()) || window._gameScene || null;
  }

  function _getPlayer() {
    return (window.GameManager && window.GameManager.getPlayer && window.GameManager.getPlayer()) || window.player || null;
  }

  function _spawnPulseRing() {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return;

    var player = _getPlayer();
    var px = player ? player.position.x : 0;
    var py = 1;
    var pz = player ? player.position.z : 0;

    // Expanding torus ring (wireframe)
    var torusGeo  = new THREE.TorusGeometry(0.1, 0.08, 8, 32);
    var torusMat  = new THREE.MeshBasicMaterial({ color: 0x00AAFF, wireframe: true, transparent: true, opacity: 0.9 });
    var torusMesh = new THREE.Mesh(torusGeo, torusMat);
    torusMesh.position.set(px, py, pz);
    torusMesh.rotation.x = Math.PI / 2; // lay flat
    scene.add(torusMesh);

    // Point light flash
    var light = new THREE.PointLight(0x0088FF, 15, 25);
    light.position.set(px, py + 1, pz);
    scene.add(light);

    _pulseRings.push({ mesh: torusMesh, mat: torusMat, light: light, age: 0 });

    // Spawn lightning arcs
    _spawnLightningArcs(px, py, pz);
  }

  function _spawnLightningArcs(cx, cy, cz) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return;

    for (var i = 0; i < LIGHTNING_COUNT; i++) {
      var points = [];
      // Start from center with slight offset
      var sx = cx + (Math.random() - 0.5) * 2;
      var sy = cy + Math.random() * 2;
      var sz = cz + (Math.random() - 0.5) * 2;
      points.push(new THREE.Vector3(sx, sy, sz));

      // 3-4 intermediate zigzag points
      var segCount = 3 + Math.floor(Math.random() * 2);
      var angle = Math.random() * Math.PI * 2;
      var radius = LIGHTNING_RADIUS * (0.4 + Math.random() * 0.6);
      for (var j = 1; j <= segCount; j++) {
        var frac = j / segCount;
        var ex   = cx + Math.cos(angle) * radius * frac + (Math.random() - 0.5) * 3;
        var ey   = cy + (Math.random() - 0.5) * 4 * frac;
        var ez   = cz + Math.sin(angle) * radius * frac + (Math.random() - 0.5) * 3;
        points.push(new THREE.Vector3(ex, ey, ez));
      }

      var geo  = new THREE.BufferGeometry().setFromPoints(points);
      var mat  = new THREE.LineBasicMaterial({ color: 0x00AAFF, transparent: true, opacity: 1.0 });
      var line = new THREE.Line(geo, mat);
      scene.add(line);

      _lightningArcs.push({ line: line, mat: mat, age: 0, maxAge: 0.25 + Math.random() * 0.25 });
    }
  }

  function _spawnSparkIndicator(enemy) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return;
    if (!enemy || !enemy.position) return;

    var light = new THREE.PointLight(0x00FFFF, 3, 3);
    light.position.set(enemy.position.x, enemy.position.y + 2.5, enemy.position.z);
    scene.add(light);

    _sparkIndicators.push({ light: light, enemy: enemy, age: 0, maxAge: 2.5 });
  }

  /* ════════════════════════════════════════════════════════════════
     ENEMY TARGETING — apply EMP disable to nearby enemies
  ════════════════════════════════════════════════════════════════ */
  function _applyEMPToEnemies() {
    var player = _getPlayer();
    if (!player) return;

    var px = player.position.x;
    var py = player.position.y;
    var pz = player.position.z;
    var totalDisabled = 0;

    /* ── Helicopters ── */
    var helis = window._helicopterEnemies || [];
    for (var i = 0; i < helis.length; i++) {
      var heli = helis[i];
      if (!heli || !heli.position) continue;
      if (heli._empDisabled) continue;
      var dx = heli.position.x - px;
      var dy = heli.position.y - py;
      var dz = heli.position.z - pz;
      if (Math.sqrt(dx*dx + dy*dy + dz*dz) <= EMP_RADIUS) {
        heli._electronicsDisabled = true;
        heli._empDisabled = true;
        heli._empDisableTimer = DISABLE_HELI_DUR;
        // Rotor slowdown and erratic hover flags
        heli._rotorSlowed = true;
        heli._hoverErratic = true;
        _spawnSparkIndicator(heli);
        totalDisabled++;
      }
    }

    /* ── Tanks ── */
    var tanks = window._tankEnemies || [];
    for (var j = 0; j < tanks.length; j++) {
      var tank = tanks[j];
      if (!tank || !tank.position) continue;
      if (tank._empDisabled) continue;
      var tdx = tank.position.x - px;
      var tdy = tank.position.y - py;
      var tdz = tank.position.z - pz;
      if (Math.sqrt(tdx*tdx + tdy*tdy + tdz*tdz) <= EMP_RADIUS) {
        tank._electronicsDisabled = true;
        tank._empDisabled = true;
        tank._empDisableTimer = DISABLE_TANK_DUR;
        tank._cannonJammed = true;
        tank._speedScale   = 0.3;
        _spawnSparkIndicator(tank);
        totalDisabled++;
      }
    }

    /* ── Mortar teams ── (private, accessed via global list if exposed) */
    var mortarTeams = window._mortarTeams || [];
    for (var k = 0; k < mortarTeams.length; k++) {
      var team = mortarTeams[k];
      if (!team || !team.position) continue;
      if (team._empDisabled) continue;
      var mdx = team.position.x - px;
      var mdy = team.position.y - py;
      var mdz = team.position.z - pz;
      if (Math.sqrt(mdx*mdx + mdy*mdy + mdz*mdz) <= EMP_RADIUS) {
        team._electronicsDisabled = true;
        team._empDisabled = true;
        team._empDisableTimer = DISABLE_MORTAR_DUR;
        team._mortarJammed = true;
        _spawnSparkIndicator(team);
        totalDisabled++;
      }
    }

    /* ── Generic enemies array (SpyDrone, FPVKamikaze, drones, others) ── */
    var genericEnemies = window._enemies || window._activeEnemies || [];
    for (var n = 0; n < genericEnemies.length; n++) {
      var enemy = genericEnemies[n];
      if (!enemy || !enemy.position) continue;
      if (enemy._empDisabled) continue;
      // Skip already handled registries
      if (helis.indexOf(enemy) !== -1) continue;
      if (tanks.indexOf(enemy) !== -1) continue;

      var gdx = enemy.position.x - px;
      var gdy = enemy.position.y - py;
      var gdz = enemy.position.z - pz;
      if (Math.sqrt(gdx*gdx + gdy*gdy + gdz*gdz) <= EMP_RADIUS) {
        enemy._electronicsDisabled = true;
        enemy._empDisabled = true;
        // Drones crash instantly
        var isDrone = enemy._isDrone || enemy._type === 'drone' ||
                      (enemy._name && (enemy._name.indexOf('Drone') !== -1 || enemy._name.indexOf('FPV') !== -1));
        if (isDrone) {
          enemy._crashed  = true;
          enemy._empCrash = true;
          enemy._empDisableTimer = 0;
        } else {
          enemy._empDisableTimer = DISABLE_TANK_DUR; // generic 5s
        }
        _spawnSparkIndicator(enemy);
        totalDisabled++;
      }
    }

    /* ── Spy drone (player-controlled — friendly fire if in drone view) ── */
    if (window._fpvActive || (window.SpyDrone && window.SpyDrone.isDroneView && window.SpyDrone.isDroneView())) {
      if (window.SpyDrone && window.SpyDrone.recall) {
        window.SpyDrone.recall();
      }
      // Flag crash
      if (window.SpyDrone) {
        window.SpyDrone._empCrash = true;
      }
      if (window.HUD && window.HUD.showToast) {
        window.HUD.showToast('EMP — DRONE SYSTEMS OFFLINE', '#00AAFF');
      }
    }

    /* ── Score ── */
    if (totalDisabled > 0) {
      var pts = totalDisabled * SCORE_PER_DISABLE;
      if (window.player && typeof window.player.score !== 'undefined') {
        window.player.score += pts;
        if (window.HUD && window.HUD.setScore) window.HUD.setScore(window.player.score);
      }
      if (window.HUD && window.HUD.showToast) {
        window.HUD.showToast('EMP DISABLED x' + totalDisabled + '  +' + pts, '#00AAFF');
      }
    } else {
      if (window.HUD && window.HUD.showToast) {
        window.HUD.showToast('EMP PULSE — no targets in range', '#006688');
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════
     DISABLE TIMER TICK — decrement per frame, restore enemies
  ════════════════════════════════════════════════════════════════ */
  function _tickEnemyTimers(dt) {
    /* Helicopters */
    var helis = window._helicopterEnemies || [];
    for (var i = 0; i < helis.length; i++) {
      var heli = helis[i];
      if (!heli || !heli._empDisabled) continue;
      heli._empDisableTimer -= dt;
      if (heli._empDisableTimer <= 0) {
        heli._empDisabled        = false;
        heli._electronicsDisabled = false;
        heli._rotorSlowed        = false;
        heli._hoverErratic       = false;
      }
    }

    /* Tanks */
    var tanks = window._tankEnemies || [];
    for (var j = 0; j < tanks.length; j++) {
      var tank = tanks[j];
      if (!tank || !tank._empDisabled) continue;
      tank._empDisableTimer -= dt;
      if (tank._empDisableTimer <= 0) {
        tank._empDisabled        = false;
        tank._electronicsDisabled = false;
        tank._cannonJammed       = false;
        tank._speedScale         = 1.0;
      }
    }

    /* Mortar teams */
    var mortarTeams = window._mortarTeams || [];
    for (var k = 0; k < mortarTeams.length; k++) {
      var team = mortarTeams[k];
      if (!team || !team._empDisabled) continue;
      team._empDisableTimer -= dt;
      if (team._empDisableTimer <= 0) {
        team._empDisabled        = false;
        team._electronicsDisabled = false;
        team._mortarJammed       = false;
      }
    }

    /* Generic enemies */
    var genericEnemies = window._enemies || window._activeEnemies || [];
    for (var n = 0; n < genericEnemies.length; n++) {
      var enemy = genericEnemies[n];
      if (!enemy || !enemy._empDisabled) continue;
      if (enemy._empCrash) continue; // crashed drones don't recover
      enemy._empDisableTimer -= dt;
      if (enemy._empDisableTimer <= 0) {
        enemy._empDisabled        = false;
        enemy._electronicsDisabled = false;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════
     KEYBIND
  ════════════════════════════════════════════════════════════════ */
  function _bindKey() {
    if (_keyBound) return;
    _keyBound = true;
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey && (e.key === 'e' || e.key === 'E') && !e.repeat) {
        e.preventDefault();
        activate();
      }
    });
  }

  /* ════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════ */
  function init(scene, camera) {
    _scene  = scene  || null;
    _camera = camera || null;
    _bindKey();
    _createHUD();
    _createScreenElements();
    _updateHUD();
  }

  function activate() {
    if (_charges <= 0) {
      if (window.HUD && window.HUD.showToast) {
        window.HUD.showToast('EMP RECHARGING...', '#004488');
      }
      return;
    }
    _charges--;
    if (_charges < MAX_CHARGES) {
      // Start/reset cooldown timer
      _cooldownTimer = COOLDOWN_TIME;
    }
    _updateHUD();

    // Set active global
    window._empActive = true;

    // Audio
    _playEMPBurst();
    _playGlitchSound();

    // Three.js visual: expanding ring + lightning
    _spawnPulseRing();

    // Screen effects
    _triggerScreenEffects();

    // Apply EMP to nearby enemies
    _applyEMPToEnemies();

    // Clear active flag after visual clears (0.8s)
    var clearDelay = Math.round(PULSE_DURATION * 1000);
    setTimeout(function () {
      window._empActive = false;
    }, clearDelay);
  }

  function update(dt) {
    if (!dt || dt <= 0) return;

    /* ── Cooldown tick ── */
    if (_charges < MAX_CHARGES && _cooldownTimer > 0) {
      _cooldownTimer -= dt;
      if (_cooldownTimer <= 0) {
        _charges = Math.min(_charges + 1, MAX_CHARGES);
        if (_charges < MAX_CHARGES) {
          // Still need more charges, restart timer
          _cooldownTimer = COOLDOWN_TIME;
        } else {
          _cooldownTimer = 0;
        }
        _updateHUD();
      }
    }

    /* ── Pulse ring animation ── */
    var scene = _getScene();
    for (var r = _pulseRings.length - 1; r >= 0; r--) {
      var ring = _pulseRings[r];
      ring.age += dt;
      var frac = ring.age / PULSE_DURATION;
      if (frac >= 1) {
        // Remove ring
        if (scene) {
          scene.remove(ring.mesh);
          scene.remove(ring.light);
        }
        ring.mesh.geometry.dispose();
        ring.mat.dispose();
        _pulseRings.splice(r, 1);
        continue;
      }
      // Scale torus outward: 0→20 units radius
      var scale = frac * EMP_RADIUS;
      ring.mesh.scale.set(scale, scale, scale);
      // Fade out opacity and light intensity
      ring.mat.opacity = 0.9 * (1 - frac);
      ring.light.intensity = 15 * (1 - frac * frac);
    }

    /* ── Lightning arc fade ── */
    for (var l = _lightningArcs.length - 1; l >= 0; l--) {
      var arc = _lightningArcs[l];
      arc.age += dt;
      var afrac = arc.age / arc.maxAge;
      if (afrac >= 1) {
        if (scene) scene.remove(arc.line);
        arc.line.geometry.dispose();
        arc.mat.dispose();
        _lightningArcs.splice(l, 1);
        continue;
      }
      arc.mat.opacity = 1.0 - afrac;
    }

    /* ── Spark indicators above disabled enemies ── */
    for (var s = _sparkIndicators.length - 1; s >= 0; s--) {
      var spark = _sparkIndicators[s];
      spark.age += dt;
      if (spark.age >= spark.maxAge) {
        if (scene) scene.remove(spark.light);
        _sparkIndicators.splice(s, 1);
        continue;
      }
      // Flicker intensity
      spark.light.intensity = (Math.random() > 0.3) ? 3 : 0.5;
      // Follow enemy
      if (spark.enemy && spark.enemy.position) {
        spark.light.position.set(
          spark.enemy.position.x,
          spark.enemy.position.y + 2.5,
          spark.enemy.position.z
        );
      }
    }

    /* ── Screen effect timers ── */
    if (_flashTimer > 0) {
      _flashTimer -= dt;
      if (_flashTimer <= 0) {
        if (_flashEl) _flashEl.style.display = 'none';
      }
    }
    if (_scanlineTimer > 0) {
      _scanlineTimer -= dt;
      if (_scanlineTimer <= 0) {
        if (_scanlineEl) _scanlineEl.style.display = 'none';
      }
    }

    /* ── Body flicker (HUD static) ── */
    if (_flickerTimer > 0) {
      _flickerTimer    -= dt;
      _flickerInterval -= dt;
      if (_flickerInterval <= 0) {
        // Toggle brightness flicker rapidly
        if (document.body) {
          document.body.style.filter = (Math.random() > 0.5)
            ? 'brightness(2) contrast(0.3)'
            : '';
        }
        _flickerInterval = 0.06 + Math.random() * 0.05;
      }
      if (_flickerTimer <= 0) {
        if (document.body) document.body.style.filter = '';
      }
    }

    /* ── Tick enemy disable timers ── */
    _tickEnemyTimers(dt);

    /* ── Update HUD periodically (every cooldown tick) ── */
    _updateHUD();
  }

  function reset() {
    // Remove all Three.js objects from scene
    var scene = _getScene();
    for (var r = 0; r < _pulseRings.length; r++) {
      if (scene) {
        scene.remove(_pulseRings[r].mesh);
        scene.remove(_pulseRings[r].light);
      }
      _pulseRings[r].mesh.geometry.dispose();
      _pulseRings[r].mat.dispose();
    }
    _pulseRings = [];

    for (var l = 0; l < _lightningArcs.length; l++) {
      if (scene) scene.remove(_lightningArcs[l].line);
      _lightningArcs[l].line.geometry.dispose();
      _lightningArcs[l].mat.dispose();
    }
    _lightningArcs = [];

    for (var s = 0; s < _sparkIndicators.length; s++) {
      if (scene) scene.remove(_sparkIndicators[s].light);
    }
    _sparkIndicators = [];

    // Restore screen elements
    if (_flashEl)    { _flashEl.style.display    = 'none'; }
    if (_scanlineEl) { _scanlineEl.style.display = 'none'; }
    if (document.body) document.body.style.filter = '';

    // Reset timers
    _flashTimer    = 0;
    _scanlineTimer = 0;
    _flickerTimer  = 0;

    // Reset charges
    _charges       = MAX_CHARGES;
    _cooldownTimer = 0;

    // Reset globals
    window._empActive = false;

    _updateHUD();
  }

  return { init: init, update: update, activate: activate, reset: reset };
})();
