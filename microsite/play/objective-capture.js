// objective-capture.js — Battlefield-style Flag Capture & Territory Ownership
// 4 capture points, zone control, ticket bleed, score-per-second, minimap integration.
// Depends on: THREE (global), window.Enemies (optional), window.HUD (optional)
// API: ObjectiveCapture.init(scene, camera), .update(dt, playerPos, enemies), .reset()

window.ObjectiveCapture = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────
  var CAPTURE_RADIUS     = 4;          // units — player must be within this
  var CAPTURE_TIME       = 5;          // seconds for player to capture
  var ENEMY_SPEED_MULT   = 1 / 3;     // enemy captures at 1/3 player speed
  var SCORE_PER_SEC      = 10;         // score per friendly objective per second
  var TICKET_BLEED_RATE  = 10;         // seconds between HP bleeds when losing
  var TICKET_BLEED_DMG   = 1;          // HP lost per bleed tick
  var ENEMY_BLEED_THRESH = 3;          // enemy must hold this many objectives
  var RING_SEGMENTS      = 64;         // arc segments for progress ring
  var FLAG_SWAY_SPEED    = 1.2;        // base flag sway speed (rad/s)
  var FLAG_SWAY_AMP      = 0.18;       // sway amplitude (radians)
  var CONTESTED_SWAY_MULT = 3.0;       // sway speed multiplier when contested

  // Colors
  var COLOR_NEUTRAL      = 0x888888;
  var COLOR_FRIENDLY     = 0x0044FF;
  var COLOR_ENEMY        = 0xFF2200;
  var COLOR_BASE         = 0x555555;
  var COLOR_POLE         = 0xAAAAAA;

  // States
  var STATE_NEUTRAL      = 'NEUTRAL';
  var STATE_FRIENDLY     = 'FRIENDLY';
  var STATE_ENEMY        = 'ENEMY';

  // Spawn positions
  var SPAWN_POSITIONS = [
    { x: -30, y: 0, z:   0 },
    { x:  30, y: 0, z:   0 },
    { x:   0, y: 0, z: -30 },
    { x:   0, y: 0, z:  30 }
  ];

  // ── Module State ───────────────────────────────────────────────────────────
  var _scene          = null;
  var _camera         = null;
  var _points         = [];       // array of capture point objects
  var _initialized    = false;
  var _scoreAccum     = 0;        // accumulator for score ticks
  var _bleedAccum     = 0;        // accumulator for ticket bleed ticks
  var _totalScore     = 0;
  var _hudEl          = null;     // top-right HUD element
  var _time           = 0;        // global time for animations
  var _audioCtx       = null;     // Web AudioContext (lazy init)

  // ── Audio ──────────────────────────────────────────────────────────────────
  function _getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        _audioCtx = null;
      }
    }
    return _audioCtx;
  }

  function _playCaptureChord() {
    var ctx = _getAudioCtx();
    if (!ctx) { return; }
    var freqs = [523, 659, 784];
    for (var i = 0; i < freqs.length; i++) {
      (function (freq, delay) {
        var osc  = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + delay + 0.02);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + 0.35);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.4);
      })(freqs[i], i * 0.12);
    }
  }

  // ── HUD ────────────────────────────────────────────────────────────────────
  function _createHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'oc-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'right:16px',
      'background:rgba(0,0,0,0.62)',
      'color:#fff',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 12px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9900',
      'letter-spacing:0.04em',
      'text-shadow:0 1px 3px #000'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) { return; }
    var friendly = 0;
    for (var i = 0; i < _points.length; i++) {
      if (_points[i].state === STATE_FRIENDLY) { friendly++; }
    }
    var total   = _points.length;
    var perSec  = friendly * SCORE_PER_SEC;
    var stars   = '';
    for (var s = 0; s < total; s++) {
      stars += (s < friendly) ? '★' : '☆';
    }
    _hudEl.textContent = 'OBJECTIVES [' + friendly + '/' + total + ' FRIENDLY] — ' + stars + ' +' + perSec + '/s';
  }

  // ── Capture Point Mesh Construction ────────────────────────────────────────
  function _buildProgressRing(point) {
    // We rebuild the ring arc on each update by replacing geometry.
    // Store segments-worth of small arc cylinders grouped under a parent Object3D.
    var ringGroup = new THREE.Object3D();
    ringGroup.position.set(0, 0.01, 0);  // just above base
    point.mesh.add(ringGroup);
    point.ringGroup = ringGroup;
    point.ringSegments = [];

    var segCount = RING_SEGMENTS;
    var innerR   = 3.8;
    var outerR   = 4.2;
    var height   = 0.08;

    for (var i = 0; i < segCount; i++) {
      var angle0 = (i / segCount) * Math.PI * 2 - Math.PI / 2;
      var angle1 = ((i + 1) / segCount) * Math.PI * 2 - Math.PI / 2;
      var midA   = (angle0 + angle1) / 2;
      var midR   = (innerR + outerR) / 2;

      var segW  = outerR - innerR;
      var segArc = (2 * Math.PI * midR) / segCount;

      var geo  = new THREE.BoxGeometry(segArc, height, segW);
      var mat  = new THREE.MeshBasicMaterial({ color: COLOR_NEUTRAL, transparent: true, opacity: 0.9 });
      var mesh = new THREE.Mesh(geo, mat);

      mesh.position.set(
        Math.cos(midA) * midR,
        0,
        Math.sin(midA) * midR
      );
      mesh.rotation.y = -midA;

      ringGroup.add(mesh);
      point.ringSegments.push(mesh);
    }
  }

  function _createCapturePoint(pos, index) {
    var group = new THREE.Object3D();
    group.position.set(pos.x, pos.y, pos.z);

    // Base platform
    var baseGeo  = new THREE.CylinderGeometry(4, 4, 0.3, 32);
    var baseMat  = new THREE.MeshLambertMaterial({ color: COLOR_BASE });
    var baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 0.15;
    group.add(baseMesh);

    // Flag pole
    var poleGeo  = new THREE.CylinderGeometry(0.1, 0.1, 6, 8);
    var poleMat  = new THREE.MeshLambertMaterial({ color: COLOR_POLE });
    var poleMesh = new THREE.Mesh(poleGeo, poleMat);
    poleMesh.position.y = 3.3;   // 0.3 base + 6/2
    group.add(poleMesh);

    // Flag
    var flagGeo  = new THREE.BoxGeometry(2, 1.2, 0.1);
    var flagMat  = new THREE.MeshLambertMaterial({ color: COLOR_NEUTRAL });
    var flagMesh = new THREE.Mesh(flagGeo, flagMat);
    flagMesh.position.set(1, 6.3, 0);  // top of pole + half flag height
    group.add(flagMesh);

    var point = {
      index:         index,
      mesh:          group,
      flagMesh:      flagMesh,
      flagMat:       flagMat,
      baseMesh:      baseMesh,
      state:         STATE_NEUTRAL,
      progress:      0,       // 0..1 capture progress
      neutralizing:  false,   // true when recapturing enemy point (must neutralize first)
      ringGroup:     null,
      ringSegments:  [],
      pos:           pos,
      contested:     false
    };

    _buildProgressRing(point);
    _scene.add(group);
    return point;
  }

  // ── Progress Ring Update ────────────────────────────────────────────────────
  function _updateRing(point) {
    var prog     = point.progress;          // 0..1
    var segCount = point.ringSegments.length;
    var filled   = Math.round(prog * segCount);

    var ringColor = COLOR_NEUTRAL;
    if (point.state === STATE_FRIENDLY || (point.state !== STATE_ENEMY && !point.neutralizing)) {
      ringColor = COLOR_FRIENDLY;
    } else if (point.state === STATE_ENEMY) {
      ringColor = COLOR_ENEMY;
    }
    if (point.contested) { ringColor = 0xFFAA00; }

    for (var i = 0; i < segCount; i++) {
      var seg     = point.ringSegments[i];
      var visible = (i < filled);
      seg.visible = visible;
      if (visible) {
        seg.material.color.setHex(ringColor);
      }
    }
  }

  // ── Flag Color ─────────────────────────────────────────────────────────────
  function _setFlagColor(point, hex) {
    point.flagMat.color.setHex(hex);
  }

  // ── Flag Sway Animation ────────────────────────────────────────────────────
  function _animateFlag(point, dt) {
    var speed = FLAG_SWAY_SPEED;
    if (point.contested) { speed *= CONTESTED_SWAY_MULT; }
    point.flagMesh.rotation.y = Math.sin(_time * speed) * FLAG_SWAY_AMP;
  }

  // ── Player Proximity ───────────────────────────────────────────────────────
  function _dist2D(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _playerInRadius(point, playerPos) {
    if (!playerPos) { return false; }
    return _dist2D(playerPos, point.pos) <= CAPTURE_RADIUS;
  }

  function _enemiesInRadius(point, enemies) {
    if (!enemies || !enemies.length) { return 0; }
    var count = 0;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.position) { continue; }
      if (_dist2D(e.position, point.pos) <= CAPTURE_RADIUS) { count++; }
    }
    return count;
  }

  // ── Per-Point Logic ─────────────────────────────────────────────────────────
  function _updatePoint(point, dt, playerPos, enemies) {
    var playerIn  = _playerInRadius(point, playerPos);
    var enemyIn   = _enemiesInRadius(point, enemies);
    var contested = playerIn && (enemyIn > 0);
    point.contested = contested;

    if (point.state === STATE_NEUTRAL) {
      if (playerIn && !contested) {
        // Player capturing neutral
        point.progress += dt / CAPTURE_TIME;
        if (point.progress >= 1) {
          point.progress = 1;
          point.state    = STATE_FRIENDLY;
          _setFlagColor(point, COLOR_FRIENDLY);
          _playCaptureChord();
          point.progress = 0;
        }
      } else if (enemyIn > 0 && !contested) {
        // Enemy capturing neutral
        point.progress += (dt / CAPTURE_TIME) * ENEMY_SPEED_MULT * enemyIn;
        if (point.progress >= 1) {
          point.progress = 1;
          point.state    = STATE_ENEMY;
          _setFlagColor(point, COLOR_ENEMY);
          point.progress = 0;
        }
      } else if (contested) {
        // Contested — progress pauses (do nothing)
      } else {
        // Nobody present — decay toward 0 slowly
        point.progress = Math.max(0, point.progress - dt * 0.2);
      }

    } else if (point.state === STATE_FRIENDLY) {
      if (enemyIn > 0 && !playerIn) {
        // Enemy recapturing friendly — must neutralize first
        point.neutralizing = true;
        point.progress += (dt / CAPTURE_TIME) * ENEMY_SPEED_MULT * enemyIn;
        if (point.progress >= 1) {
          point.state    = STATE_NEUTRAL;
          _setFlagColor(point, COLOR_NEUTRAL);
          point.progress = 0;
          point.neutralizing = false;
        }
      } else if (playerIn) {
        // Player reinforcing — decay back toward 0
        point.progress = Math.max(0, point.progress - dt / CAPTURE_TIME);
        if (point.progress <= 0) { point.neutralizing = false; }
      } else {
        // Nobody — slow decay
        point.progress = Math.max(0, point.progress - dt * 0.15);
        if (point.progress <= 0) { point.neutralizing = false; }
      }

    } else if (point.state === STATE_ENEMY) {
      if (playerIn && !contested) {
        // Player recapturing enemy — must neutralize first then capture
        point.neutralizing = true;
        point.progress += dt / (CAPTURE_TIME * 2);  // double time for recapture
        if (point.progress >= 1) {
          if (point.neutralizing) {
            // First phase complete — now truly neutral, continue to friendly
            point.state    = STATE_NEUTRAL;
            _setFlagColor(point, COLOR_NEUTRAL);
            point.progress = 0;
            point.neutralizing = false;
          }
        }
      } else if (!playerIn && enemyIn === 0) {
        point.progress = Math.max(0, point.progress - dt * 0.15);
        if (point.progress <= 0) { point.neutralizing = false; }
      }
    }

    // Clamp
    if (point.progress < 0) { point.progress = 0; }
    if (point.progress > 1) { point.progress = 1; }
  }

  // ── Scoring & Bleed ────────────────────────────────────────────────────────
  function _countStates() {
    var friendly = 0;
    var enemy    = 0;
    for (var i = 0; i < _points.length; i++) {
      if (_points[i].state === STATE_FRIENDLY) { friendly++; }
      if (_points[i].state === STATE_ENEMY)    { enemy++;    }
    }
    return { friendly: friendly, enemy: enemy };
  }

  function _applyScoring(dt) {
    var counts = _countStates();
    _scoreAccum += dt;
    if (_scoreAccum >= 1) {
      _scoreAccum -= 1;
      var gained = counts.friendly * SCORE_PER_SEC;
      _totalScore += gained;
      // Push to window score if available
      if (window._gameScore !== undefined) {
        window._gameScore += gained;
      }
    }
  }

  function _applyTicketBleed(dt) {
    var counts = _countStates();
    if (counts.enemy >= ENEMY_BLEED_THRESH) {
      _bleedAccum += dt;
      if (_bleedAccum >= TICKET_BLEED_RATE) {
        _bleedAccum -= TICKET_BLEED_RATE;
        // Apply bleed to player HP systems
        if (window._playerHP !== undefined) {
          window._playerHP = Math.max(0, window._playerHP - TICKET_BLEED_DMG);
        }
        if (window.HUD && typeof window.HUD.setHP === 'function') {
          // notify HUD if available
        }
      }
    } else {
      _bleedAccum = 0;
    }
  }

  // ── Minimap Integration ─────────────────────────────────────────────────────
  function _updateMinimapData() {
    window._capturePoints = [];
    for (var i = 0; i < _points.length; i++) {
      var p = _points[i];
      window._capturePoints.push({
        pos:      p.pos,
        state:    p.state,
        progress: p.progress,
        contested: p.contested
      });
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  function init(scene, camera) {
    if (_initialized) { reset(); }
    _scene       = scene;
    _camera      = camera;
    _points      = [];
    _scoreAccum  = 0;
    _bleedAccum  = 0;
    _totalScore  = 0;
    _time        = 0;

    for (var i = 0; i < SPAWN_POSITIONS.length; i++) {
      _points.push(_createCapturePoint(SPAWN_POSITIONS[i], i));
    }

    // Initial flag colors
    for (var j = 0; j < _points.length; j++) {
      _setFlagColor(_points[j], COLOR_NEUTRAL);
    }

    if (!_hudEl) { _createHUD(); }
    _updateHUD();
    _updateMinimapData();
    _initialized = true;
  }

  function update(dt, playerPos, enemies) {
    if (!_initialized) { return; }

    _time += dt;

    // Enemy list — accept array or try window.Enemies
    var enemyList = enemies;
    if (!enemyList && window.Enemies && Array.isArray(window.Enemies.list)) {
      enemyList = window.Enemies.list;
    }
    if (!enemyList) { enemyList = []; }

    for (var i = 0; i < _points.length; i++) {
      _updatePoint(_points[i], dt, playerPos, enemyList);
      _animateFlag(_points[i], dt);
      _updateRing(_points[i]);
    }

    _applyScoring(dt);
    _applyTicketBleed(dt);
    _updateHUD();
    _updateMinimapData();
  }

  function reset() {
    for (var i = 0; i < _points.length; i++) {
      var p = _points[i];
      if (p.mesh && _scene) {
        _scene.remove(p.mesh);
      }
    }
    _points      = [];
    _scoreAccum  = 0;
    _bleedAccum  = 0;
    _totalScore  = 0;
    _time        = 0;
    _initialized = false;
    if (_hudEl) {
      _hudEl.textContent = '';
    }
    window._capturePoints = [];
  }

  return {
    init:   init,
    update: update,
    reset:  reset
  };

})();
