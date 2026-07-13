/* ============================================================
 *  GRAVITY-FIELD.JS — Gravity Field ability system
 *
 *  API:
 *    GravityField.init()       — call once after DOM ready
 *    GravityField.update(dt)   — call each frame with delta-time seconds
 *    GravityField.activate()   — manually trigger gravity field
 *    GravityField.reset()      — cancel active field, reset state
 *
 *  Globals set/read:
 *    window._gravityFieldActive  {boolean}  — true while field is active
 *    window._enemiesLifted       {array}    — enemies currently lifted
 *    window._enemies             {array}    — enemy list from enemies.js
 *    window._scene               {THREE.Scene}
 *    window.player               {Object}   — player object with .position
 *    window.AudioContext / window.webkitAudioContext
 * ============================================================ */
window.GravityField = (function () {
  'use strict';

  /* ── Config ─────────────────────────────────── */
  var CFG = {
    KEY:              'KeyG',           // Ctrl+G
    COOLDOWN:         10,               // seconds between uses
    MAX_CHARGES:      3,                // charge count
    ACTIVE_DURATION:  5,               // seconds active
    LIFT_RADIUS:      8,               // units radius for enemy lift
    LIFT_HEIGHT:      2,               // units above ground
    LIFT_SPEED:       0.5,             // seconds to lerp to lifted position
    ACCURACY_PENALTY: 0.5,             // 50% accuracy reduction while airborne
    IMPACT_DAMAGE:    20,              // damage on slam-down
    ORBIT_SPEED:      1.2,             // radians per second for orbit
    ORBIT_RADIUS:     4,               // orbit circle radius around player
    AURA_COLOR:       0x4b0082,        // dark purple
    AURA_OPACITY:     0.15,
    PICKUP_COLOR:     0x6a0dad,        // dark purple gem
    PICKUP_BOB_SPEED: 2.0,
    PICKUP_BOB_AMP:   0.18,
    AUDIO_FREQ:       30,              // Hz subsonic hum
    AUDIO_VOLUME:     0.15,
    HUD_ID:           'gravity-field-hud'
  };

  /* ── State ──────────────────────────────────── */
  var _active       = false;
  var _activeTimer  = 0;
  var _cooldown     = 0;
  var _charges      = CFG.MAX_CHARGES;
  var _auraMesh     = null;
  var _liftProgress = {};   // enemyId -> 0..1
  var _orbitAngles  = {};   // enemyId -> radians
  var _origY        = {};   // enemyId -> original Y position
  var _enemyIds     = 0;    // incrementing ID counter

  /* ── Audio ──────────────────────────────────── */
  var _audioCtx    = null;
  var _audioOsc    = null;
  var _audioGain   = null;

  /* ── HUD elements ───────────────────────────── */
  var _hudEl        = null;
  var _hudBadge     = null;
  var _hudArcEl     = null;

  /* ── Pickups ────────────────────────────────── */
  var _pickups      = [];

  /* ─────────────────────────────────────────────
   *  Scene / player helpers
   * ───────────────────────────────────────────── */
  function _getScene() {
    return window._scene || null;
  }

  function _getPlayer() {
    return window.player || null;
  }

  function _getEnemies() {
    if (Array.isArray(window._enemies)) return window._enemies;
    return [];
  }

  /* ─────────────────────────────────────────────
   *  Ensure each enemy has a stable _gfId
   * ───────────────────────────────────────────── */
  function _ensureId(enemy) {
    if (enemy._gfId === undefined) {
      enemy._gfId = ++_enemyIds;
    }
    return enemy._gfId;
  }

  /* ─────────────────────────────────────────────
   *  Audio: 30Hz subsonic hum
   * ───────────────────────────────────────────── */
  function _startAudio() {
    try {
      if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      var ctx = _audioCtx;
      _audioOsc  = ctx.createOscillator();
      _audioGain = ctx.createGain();
      _audioOsc.type = 'sine';
      _audioOsc.frequency.setValueAtTime(CFG.AUDIO_FREQ, ctx.currentTime);
      _audioGain.gain.setValueAtTime(0, ctx.currentTime);
      _audioGain.gain.linearRampToValueAtTime(CFG.AUDIO_VOLUME, ctx.currentTime + 0.3);
      _audioOsc.connect(_audioGain);
      _audioGain.connect(ctx.destination);
      _audioOsc.start();
    } catch (e) {
      // Audio unavailable — silent fail
    }
  }

  function _stopAudio() {
    try {
      if (_audioGain && _audioCtx) {
        _audioGain.gain.setValueAtTime(_audioGain.gain.value, _audioCtx.currentTime);
        _audioGain.gain.linearRampToValueAtTime(0, _audioCtx.currentTime + 0.4);
      }
      if (_audioOsc) {
        var stopTime = _audioCtx ? (_audioCtx.currentTime + 0.5) : 0;
        _audioOsc.stop(stopTime);
        _audioOsc = null;
        _audioGain = null;
      }
    } catch (e) {
      // Silent fail
    }
  }

  /* ─────────────────────────────────────────────
   *  VFX: dark purple aura sphere around player
   * ───────────────────────────────────────────── */
  function _createAura() {
    var sc = _getScene();
    if (!sc || typeof THREE === 'undefined') return;
    var geo = new THREE.SphereGeometry(CFG.LIFT_RADIUS, 16, 16);
    var mat = new THREE.MeshBasicMaterial({
      color:       CFG.AURA_COLOR,
      wireframe:   true,
      transparent: true,
      opacity:     CFG.AURA_OPACITY
    });
    _auraMesh = new THREE.Mesh(geo, mat);
    sc.add(_auraMesh);
  }

  function _removeAura() {
    var sc = _getScene();
    if (_auraMesh) {
      if (sc) sc.remove(_auraMesh);
      if (_auraMesh.geometry) _auraMesh.geometry.dispose();
      if (_auraMesh.material) _auraMesh.material.dispose();
      _auraMesh = null;
    }
  }

  /* ─────────────────────────────────────────────
   *  Lift logic
   * ───────────────────────────────────────────── */
  function _liftEnemies() {
    var player = _getPlayer();
    var enemies = _getEnemies();
    if (!player) return;

    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.position) continue;
      var dx = e.position.x - player.position.x;
      var dz = e.position.z - player.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= CFG.LIFT_RADIUS) {
        var id = _ensureId(e);
        if (_origY[id] === undefined) {
          _origY[id] = e.position.y;
        }
        if (_liftProgress[id] === undefined) {
          _liftProgress[id] = 0;
        }
        // Assign a stable orbit angle
        if (_orbitAngles[id] === undefined) {
          _orbitAngles[id] = Math.atan2(dz, dx);
        }
        // Tag enemy as lifted
        e._gravLifted = true;
        e._gravAccuracyMult = (1 - CFG.ACCURACY_PENALTY);
        // Push into global lifted array if not already there
        var found = false;
        for (var j = 0; j < window._enemiesLifted.length; j++) {
          if (window._enemiesLifted[j] === e) { found = true; break; }
        }
        if (!found) window._enemiesLifted.push(e);
      }
    }
  }

  function _updateEnemies(dt) {
    var player = _getPlayer();
    if (!player) return;

    for (var i = window._enemiesLifted.length - 1; i >= 0; i--) {
      var e = window._enemiesLifted[i];
      if (!e || !e.position) {
        window._enemiesLifted.splice(i, 1);
        continue;
      }
      var id = _ensureId(e);

      // Lerp lift progress 0->1 over LIFT_SPEED seconds
      if (_liftProgress[id] < 1) {
        _liftProgress[id] = Math.min(1, _liftProgress[id] + dt / CFG.LIFT_SPEED);
      }

      // Orbit angle advances
      _orbitAngles[id] += CFG.ORBIT_SPEED * dt;

      // Position: orbit around player at ORBIT_RADIUS, lifted Y
      var angle = _orbitAngles[id];
      var targetX = player.position.x + Math.cos(angle) * CFG.ORBIT_RADIUS;
      var targetZ = player.position.z + Math.sin(angle) * CFG.ORBIT_RADIUS;
      var targetY = (_origY[id] !== undefined ? _origY[id] : e.position.y) + CFG.LIFT_HEIGHT * _liftProgress[id];

      // Apply position (freeze enemy AI movement by overriding each frame)
      e.position.x = targetX;
      e.position.y = targetY;
      e.position.z = targetZ;
    }
  }

  function _slamEnemies() {
    for (var i = 0; i < window._enemiesLifted.length; i++) {
      var e = window._enemiesLifted[i];
      if (!e) continue;
      var id = _ensureId(e);

      // Snap back to ground
      if (_origY[id] !== undefined && e.position) {
        e.position.y = _origY[id];
      }

      // Deal impact damage
      if (typeof e.takeDamage === 'function') {
        e.takeDamage(CFG.IMPACT_DAMAGE);
      } else if (e.health !== undefined) {
        e.health = Math.max(0, e.health - CFG.IMPACT_DAMAGE);
      }

      // Un-tag
      e._gravLifted = false;
      e._gravAccuracyMult = 1;
    }
    window._enemiesLifted = [];

    // Clean up per-enemy state
    _liftProgress = {};
    _orbitAngles  = {};
    _origY        = {};
  }

  /* ─────────────────────────────────────────────
   *  HUD build
   * ───────────────────────────────────────────── */
  function _buildHUD() {
    if (_hudEl) return;

    var container = document.createElement('div');
    container.id = CFG.HUD_ID;
    container.style.cssText = [
      'position:fixed',
      'bottom:24px',
      'right:24px',
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'pointer-events:none',
      'z-index:900'
    ].join(';');

    // SVG cooldown ring
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', '52');
    svg.setAttribute('height', '52');
    svg.style.cssText = 'display:block;';

    // Track
    var track = document.createElementNS(ns, 'circle');
    track.setAttribute('cx', '26');
    track.setAttribute('cy', '26');
    track.setAttribute('r', '22');
    track.setAttribute('fill', 'none');
    track.setAttribute('stroke', 'rgba(255,255,255,0.10)');
    track.setAttribute('stroke-width', '4');
    svg.appendChild(track);

    // Progress arc
    var arc = document.createElementNS(ns, 'circle');
    arc.setAttribute('cx', '26');
    arc.setAttribute('cy', '26');
    arc.setAttribute('r', '22');
    arc.setAttribute('fill', 'none');
    arc.setAttribute('stroke', '#7b2fff');
    arc.setAttribute('stroke-width', '4');
    arc.setAttribute('stroke-linecap', 'round');
    arc.setAttribute('transform', 'rotate(-90 26 26)');
    arc.id = 'gravity-field-arc';
    svg.appendChild(arc);

    // G icon
    var icon = document.createElementNS(ns, 'text');
    icon.setAttribute('x', '26');
    icon.setAttribute('y', '31');
    icon.setAttribute('text-anchor', 'middle');
    icon.setAttribute('fill', 'rgba(255,255,255,0.85)');
    icon.setAttribute('font-size', '14');
    icon.setAttribute('font-family', 'monospace');
    icon.textContent = 'G';
    svg.appendChild(icon);

    container.appendChild(svg);

    // Badge: "GRAVITY x3"
    var badge = document.createElement('div');
    badge.id = 'gravity-field-badge';
    badge.innerHTML = '🌑 GRAVITY \xD7' + _charges;
    badge.style.cssText = [
      'margin-top:4px',
      'color:#b070ff',
      'font-size:10px',
      'font-family:monospace',
      'white-space:nowrap',
      'letter-spacing:1px',
      'text-shadow:0 0 6px #7b2fff'
    ].join(';');
    container.appendChild(badge);

    document.body.appendChild(container);
    _hudEl    = container;
    _hudArcEl = arc;
    _hudBadge = badge;
  }

  function _updateHUD() {
    if (!_hudArcEl || !_hudBadge) return;

    var r = 22;
    var circ = 2 * Math.PI * r;
    var pct;

    if (_active) {
      // Show active duration drain
      pct = 1 - (_activeTimer / CFG.ACTIVE_DURATION);
      _hudArcEl.setAttribute('stroke', '#ff44ff');
    } else if (_cooldown > 0) {
      pct = 1 - (_cooldown / CFG.COOLDOWN);
      _hudArcEl.setAttribute('stroke', '#553377');
    } else {
      pct = 1;
      _hudArcEl.setAttribute('stroke', '#7b2fff');
    }
    pct = Math.max(0, Math.min(1, pct));
    var dash = pct * circ;
    _hudArcEl.setAttribute('stroke-dasharray', dash + ' ' + circ);

    // Badge text
    _hudBadge.innerHTML = '🌑 GRAVITY \xD7' + _charges;
    _hudBadge.style.color = (_charges > 0 && !_active) ? '#b070ff' : '#664488';
  }

  /* ─────────────────────────────────────────────
   *  Pickup gem
   * ───────────────────────────────────────────── */
  function _spawnPickup(x, y, z) {
    var sc = _getScene();
    if (!sc || typeof THREE === 'undefined') return;

    var geo = new THREE.SphereGeometry(0.2, 8, 8);
    var mat = new THREE.MeshBasicMaterial({
      color: CFG.PICKUP_COLOR,
      transparent: true,
      opacity: 0.9
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    sc.add(mesh);

    _pickups.push({
      mesh: mesh,
      baseY: y,
      age: 0
    });
  }

  function _updatePickups(dt) {
    var player = _getPlayer();
    for (var i = _pickups.length - 1; i >= 0; i--) {
      var pk = _pickups[i];
      pk.age += dt;

      // Bob animation
      pk.mesh.position.y = pk.baseY + Math.sin(pk.age * CFG.PICKUP_BOB_SPEED) * CFG.PICKUP_BOB_AMP;
      pk.mesh.rotation.y += dt * 1.5;

      // Pickup detection
      if (player && player.position) {
        var dx = pk.mesh.position.x - player.position.x;
        var dy = pk.mesh.position.y - player.position.y;
        var dz = pk.mesh.position.z - player.position.z;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 1.2) {
          // Collect: add a charge (cap at max)
          if (_charges < CFG.MAX_CHARGES) {
            _charges++;
          }
          var sc = _getScene();
          if (sc) sc.remove(pk.mesh);
          if (pk.mesh.geometry) pk.mesh.geometry.dispose();
          if (pk.mesh.material) pk.mesh.material.dispose();
          _pickups.splice(i, 1);
        }
      }
    }
  }

  function _clearPickups() {
    var sc = _getScene();
    for (var i = 0; i < _pickups.length; i++) {
      if (sc) sc.remove(_pickups[i].mesh);
      if (_pickups[i].mesh.geometry) _pickups[i].mesh.geometry.dispose();
      if (_pickups[i].mesh.material) _pickups[i].mesh.material.dispose();
    }
    _pickups = [];
  }

  /* ─────────────────────────────────────────────
   *  Key handler: Ctrl+G
   * ───────────────────────────────────────────── */
  function _onKeyDown(e) {
    if (e.code === CFG.KEY && e.ctrlKey) {
      e.preventDefault();
      activate();
    }
  }

  /* ─────────────────────────────────────────────
   *  Public: activate()
   * ───────────────────────────────────────────── */
  function activate() {
    if (_active) return false;
    if (_cooldown > 0) return false;
    if (_charges <= 0) return false;

    _active = true;
    _activeTimer = 0;
    _charges--;
    window._gravityFieldActive = true;
    window._enemiesLifted = [];

    _createAura();
    _liftEnemies();
    _startAudio();

    return true;
  }

  /* ─────────────────────────────────────────────
   *  End active field
   * ───────────────────────────────────────────── */
  function _endField() {
    _active = false;
    _activeTimer = 0;
    _cooldown = CFG.COOLDOWN;
    window._gravityFieldActive = false;

    _removeAura();
    _slamEnemies();
    _stopAudio();
  }

  /* ─────────────────────────────────────────────
   *  Public: update(dt)
   * ───────────────────────────────────────────── */
  function update(dt) {
    // Cooldown
    if (_cooldown > 0) {
      _cooldown = Math.max(0, _cooldown - dt);
    }

    // Active field
    if (_active) {
      _activeTimer += dt;

      // Keep aura on player
      var player = _getPlayer();
      if (_auraMesh && player && player.position) {
        _auraMesh.position.copy(player.position);
        _auraMesh.rotation.y += dt * 0.5;
      }

      // Update orbit / lift for enemies
      _updateEnemies(dt);

      // Check for new enemies entering radius each frame
      _liftEnemies();

      // Expire
      if (_activeTimer >= CFG.ACTIVE_DURATION) {
        _endField();
      }
    }

    // Pickups
    _updatePickups(dt);

    // HUD
    _updateHUD();
  }

  /* ─────────────────────────────────────────────
   *  Public: init()
   * ───────────────────────────────────────────── */
  function init() {
    window._gravityFieldActive = false;
    window._enemiesLifted      = [];

    window.addEventListener('keydown', _onKeyDown);

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _buildHUD);
    } else {
      _buildHUD();
    }

    // Spawn a couple of recharge pickups in the world after a brief delay
    // so the scene is ready
    setTimeout(function () {
      var player = _getPlayer();
      var baseX = player ? player.position.x : 0;
      var baseZ = player ? player.position.z : 0;
      _spawnPickup(baseX + 6,  1.0, baseZ + 4);
      _spawnPickup(baseX - 8,  1.0, baseZ - 6);
      _spawnPickup(baseX + 12, 1.0, baseZ + 10);
    }, 3000);
  }

  /* ─────────────────────────────────────────────
   *  Public: reset()
   * ───────────────────────────────────────────── */
  function reset() {
    if (_active) {
      _removeAura();
      _slamEnemies();
      _stopAudio();
    }
    _active      = false;
    _activeTimer = 0;
    _cooldown    = 0;
    _charges     = CFG.MAX_CHARGES;

    window._gravityFieldActive = false;
    window._enemiesLifted      = [];

    _liftProgress = {};
    _orbitAngles  = {};
    _origY        = {};

    _clearPickups();
    _updateHUD();
  }

  /* ─────────────────────────────────────────────
   *  Public API
   * ───────────────────────────────────────────── */
  return { init: init, update: update, activate: activate, reset: reset };

}());
