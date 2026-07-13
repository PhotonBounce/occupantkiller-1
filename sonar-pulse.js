// sonar-pulse.js — radar pulse that briefly reveals all enemies through walls
// Key: O  (P is taken by Perks Menu; O is the next available key)
// Cooldown: 20s (12s if window._sonarUpgraded)
// Range: 30 units (45 if window._sonarUpgraded)
window.SonarPulse = (function () {
  'use strict';

  // ── Constants ────────────────────────────────────────────────────────────────
  var KEY_CODE          = 'KeyO';
  var BASE_RANGE        = 30;
  var UPGRADED_RANGE    = 45;
  var BASE_COOLDOWN     = 20;
  var UPGRADED_COOLDOWN = 12;
  var RING_SPEED        = 15;          // units per second
  var RING_STAGGER      = 0.3;         // seconds between rings
  var REVEAL_DURATION   = 3;           // seconds enemy outline lasts
  var RING_LIFETIME     = 2;           // seconds before ring fades out
  var RING_COLOR        = 0x00FFFF;
  var RING_OPACITY_MAX  = 0.7;
  var NUM_RINGS         = 3;

  // ── State ────────────────────────────────────────────────────────────────────
  var _initialized    = false;
  var _scene          = null;
  var _camera         = null;
  var _player         = null;
  var _enemies        = null;  // reference to window.Enemies
  var _cooldownLeft   = 0;
  var _rings          = [];    // array of active ring objects
  var _revealedEnemies = [];   // [{ enemy, timer, dotEl, waypointEl }]
  var _hudEl          = null;
  var _waypointContainer = null;
  var _audioCtx       = null;
  var _keyDown        = false;

  // ── Public flag ─────────────────────────────────────────────────────────────
  window._sonarPulseActive = false;

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function _getRange() {
    return window._sonarUpgraded ? UPGRADED_RANGE : BASE_RANGE;
  }

  function _getCooldown() {
    return window._sonarUpgraded ? UPGRADED_COOLDOWN : BASE_COOLDOWN;
  }

  // ── Audio ────────────────────────────────────────────────────────────────────
  function _playPing() {
    try {
      if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      var ctx = _audioCtx;

      function _makePing(delaySeconds, gainMult) {
        var osc  = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, ctx.currentTime + delaySeconds);

        gain.gain.setValueAtTime(0.4 * gainMult, ctx.currentTime + delaySeconds);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + delaySeconds + 0.5
        );

        osc.start(ctx.currentTime + delaySeconds);
        osc.stop(ctx.currentTime + delaySeconds + 0.6);
      }

      _makePing(0,    1.0);   // primary ping
      _makePing(0.8,  0.4);   // echo at 0.8s, 40% volume
    } catch (e) {
      // AudioContext may be unavailable in some environments — fail silently
    }
  }

  // ── Ring geometry ────────────────────────────────────────────────────────────
  function _createRing(staggerDelay) {
    if (!_scene || !window.THREE) { return null; }

    var geo = new window.THREE.RingGeometry(0.1, 0.3, 64);
    var mat = new window.THREE.MeshBasicMaterial({
      color:       RING_COLOR,
      transparent: true,
      opacity:     RING_OPACITY_MAX,
      side:        window.THREE.DoubleSide,
      depthWrite:  false
    });
    var mesh = new window.THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;  // lay flat on the ground plane

    var playerPos = _getPlayerPos();
    mesh.position.set(playerPos.x, 0.05, playerPos.z);

    _scene.add(mesh);

    return {
      mesh:          mesh,
      mat:           mat,
      radius:        0.1,
      age:           -staggerDelay,  // negative age = waiting for stagger
      alive:         true,
      triggered:     false           // did this ring already reveal enemies?
    };
  }

  function _getPlayerPos() {
    if (_player && _player.position) { return _player.position; }
    if (window.GameManager && window.GameManager.getPlayerPosition) {
      return window.GameManager.getPlayerPosition();
    }
    return { x: 0, y: 0, z: 0 };
  }

  // ── Enemy reveal ─────────────────────────────────────────────────────────────
  function _revealEnemy(enemy) {
    // Avoid double-revealing
    for (var i = 0; i < _revealedEnemies.length; i++) {
      if (_revealedEnemies[i].enemy === enemy) {
        _revealedEnemies[i].timer = REVEAL_DURATION; // reset timer
        return;
      }
    }

    // Emissive outline
    try {
      if (enemy.mesh && enemy.mesh.material) {
        enemy.mesh.material.emissive = new window.THREE.Color(0xFFFFFF);
        if (enemy.mesh.material.emissiveIntensity !== undefined) {
          enemy.mesh.material.emissiveIntensity = 1.0;
        }
      }
    } catch (e) {}

    // Minimap red dot
    var dotEl = _createMinimapDot(enemy);

    // HUD waypoint
    var waypointEl = _createWaypoint();

    _revealedEnemies.push({
      enemy:      enemy,
      timer:      REVEAL_DURATION,
      dotEl:      dotEl,
      waypointEl: waypointEl
    });
  }

  function _clearReveal(entry) {
    try {
      if (entry.enemy.mesh && entry.enemy.mesh.material) {
        entry.enemy.mesh.material.emissive = new window.THREE.Color(0x000000);
        if (entry.enemy.mesh.material.emissiveIntensity !== undefined) {
          entry.enemy.mesh.material.emissiveIntensity = 0;
        }
      }
    } catch (e) {}

    if (entry.dotEl && entry.dotEl.parentNode) {
      entry.dotEl.parentNode.removeChild(entry.dotEl);
    }
    if (entry.waypointEl && entry.waypointEl.parentNode) {
      entry.waypointEl.parentNode.removeChild(entry.waypointEl);
    }
  }

  // ── Minimap dot ──────────────────────────────────────────────────────────────
  function _createMinimapDot(enemy) {
    var canvas = document.getElementById('minimap-canvas');
    if (!canvas) { return null; }

    var dot = document.createElement('div');
    dot.style.cssText = [
      'position:absolute',
      'width:6px',
      'height:6px',
      'border-radius:50%',
      'background:#ff2222',
      'pointer-events:none',
      'z-index:9999',
      'box-shadow:0 0 4px #ff0000'
    ].join(';');

    // Position the dot relative to minimap canvas
    var rect = canvas.getBoundingClientRect();
    dot.style.left   = (rect.left + rect.width  / 2) + 'px';
    dot.style.top    = (rect.top  + rect.height / 2) + 'px';
    document.body.appendChild(dot);

    // Try to position dot based on enemy world position
    _updateMinimapDotPos(dot, enemy, canvas);

    return dot;
  }

  function _updateMinimapDotPos(dot, enemy, canvas) {
    if (!enemy || !enemy.mesh) { return; }
    var rect = canvas.getBoundingClientRect();
    var playerPos = _getPlayerPos();

    var ex = enemy.mesh.position.x - playerPos.x;
    var ez = enemy.mesh.position.z - playerPos.z;

    // Minimap is 180px wide, represents ~60 units radius
    var scale = (rect.width / 2) / 60;
    var px = rect.left + rect.width  / 2 + ex * scale;
    var py = rect.top  + rect.height / 2 + ez * scale;

    // Clamp within minimap
    px = Math.max(rect.left,               Math.min(rect.right  - 6, px));
    py = Math.max(rect.top,                Math.min(rect.bottom - 6, py));

    dot.style.left = px + 'px';
    dot.style.top  = py + 'px';
  }

  // ── Waypoint marker ──────────────────────────────────────────────────────────
  function _createWaypoint() {
    if (!_waypointContainer) { return null; }
    var el = document.createElement('div');
    el.style.cssText = [
      'position:absolute',
      'width:0',
      'height:0',
      'border-left:7px solid transparent',
      'border-right:7px solid transparent',
      'border-bottom:12px solid #ff2222',
      'pointer-events:none',
      'filter:drop-shadow(0 0 4px #ff0000)'
    ].join(';');
    _waypointContainer.appendChild(el);
    return el;
  }

  function _updateWaypointPos(el, enemy) {
    if (!el || !_camera || !enemy || !enemy.mesh) { return; }

    var worldPos = enemy.mesh.position.clone();
    worldPos.y = 1;

    var projected = worldPos.project(_camera);

    var hw = window.innerWidth  / 2;
    var hh = window.innerHeight / 2;

    var sx = (projected.x  + 1) * hw;
    var sy = (-projected.y + 1) * hh;

    // Is the enemy behind the camera? Flip coords
    if (projected.z > 1) {
      sx = window.innerWidth  - sx;
      sy = window.innerHeight - sy;
    }

    // Edge-clamp — pull to screen border
    var margin = 20;
    var cx = window.innerWidth  / 2;
    var cy = window.innerHeight / 2;
    var dx = sx - cx;
    var dy = sy - cy;
    var len = Math.sqrt(dx * dx + dy * dy);

    // If on screen (roughly) just show near position; otherwise clamp to edge
    var maxX = hw - margin;
    var maxY = hh - margin;

    if (len > 1) {
      var scale2 = Math.min(maxX / Math.abs(dx), maxY / Math.abs(dy));
      if (scale2 < 1) {
        sx = cx + dx * scale2;
        sy = cy + dy * scale2;
      }
    }

    el.style.left      = Math.round(sx - 7)  + 'px';
    el.style.top       = Math.round(sy - 12) + 'px';
    el.style.display   = 'block';

    // Rotate triangle to point towards enemy
    var angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    el.style.transform = 'rotate(' + angle + 'deg)';
  }

  // ── HUD element ──────────────────────────────────────────────────────────────
  function _createHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'sonar-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:50px',
      'right:12px',
      'font-family:monospace',
      'font-size:11px',
      'color:#00ffff',
      'z-index:210',
      'pointer-events:none',
      'text-shadow:0 0 6px #00ffff',
      'background:rgba(0,0,0,0.45)',
      'padding:3px 8px',
      'border-radius:4px',
      'border:1px solid rgba(0,255,255,0.3)'
    ].join(';');
    _hudEl.textContent = 'SONAR [O]: READY';
    document.body.appendChild(_hudEl);

    _waypointContainer = document.createElement('div');
    _waypointContainer.id = 'sonar-waypoints';
    _waypointContainer.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:209'
    ].join(';');
    document.body.appendChild(_waypointContainer);
  }

  function _updateHUD() {
    if (!_hudEl) { return; }
    if (_cooldownLeft <= 0) {
      _hudEl.style.color = '#00ffff';
      _hudEl.style.textShadow = '0 0 6px #00ffff';
      _hudEl.textContent = 'SONAR [O]: READY';
    } else {
      _hudEl.style.color = '#888888';
      _hudEl.style.textShadow = 'none';
      _hudEl.textContent = 'SONAR [O]: ' + Math.ceil(_cooldownLeft) + 's';
    }
  }

  // ── Pulse fire ───────────────────────────────────────────────────────────────
  function pulse() {
    if (_cooldownLeft > 0) { return; }

    _cooldownLeft = _getCooldown();
    window._sonarPulseActive = true;

    _playPing();

    // Spawn NUM_RINGS rings staggered
    for (var i = 0; i < NUM_RINGS; i++) {
      var ring = _createRing(i * RING_STAGGER);
      if (ring) { _rings.push(ring); }
    }
  }

  // ── Check enemies against a ring's current radius ────────────────────────────
  function _checkEnemiesAtRadius(ring) {
    if (!_enemies) { return; }

    var list = null;
    if (typeof _enemies.getList === 'function') {
      list = _enemies.getList();
    } else if (Array.isArray(_enemies.list)) {
      list = _enemies.list;
    } else if (Array.isArray(window._enemyList)) {
      list = window._enemyList;
    }
    if (!list) { return; }

    var playerPos = _getPlayerPos();
    var range = _getRange();

    for (var i = 0; i < list.length; i++) {
      var enemy = list[i];
      if (!enemy || !enemy.mesh) { continue; }
      if (enemy.dead || enemy.hp <= 0) { continue; }

      var ex = enemy.mesh.position.x - playerPos.x;
      var ez = enemy.mesh.position.z - playerPos.z;
      var distFromPlayer = Math.sqrt(ex * ex + ez * ez);

      // Reveal if within pulse range and the ring has reached this enemy
      if (distFromPlayer <= range && ring.radius >= distFromPlayer) {
        _revealEnemy(enemy);
      }
    }
  }

  // ── Update loop ──────────────────────────────────────────────────────────────
  function update(dt) {
    if (!dt || dt <= 0) { dt = 0.016; }

    // Cooldown tick
    if (_cooldownLeft > 0) {
      _cooldownLeft -= dt;
      if (_cooldownLeft < 0) { _cooldownLeft = 0; }
    }

    _updateHUD();

    // Update rings
    var anyAlive = false;
    for (var i = _rings.length - 1; i >= 0; i--) {
      var ring = _rings[i];
      if (!ring.alive) { continue; }

      ring.age += dt;

      // Still in pre-stagger delay
      if (ring.age < 0) {
        anyAlive = true;
        continue;
      }

      // Expand radius
      ring.radius += RING_SPEED * dt;

      // Check if range exceeded — stop expanding and start dying
      var range = _getRange();
      var t = ring.age / RING_LIFETIME;  // 0→1 over 2 seconds

      // Fade opacity
      var opacity = RING_OPACITY_MAX * (1 - t);
      if (opacity < 0) { opacity = 0; }

      // Scale outer ring thinner (ring index 2 is outermost → thinner)
      var thickness = (i === NUM_RINGS - 1) ? 0.15 : 0.4;
      var innerR = Math.max(0.05, ring.radius - thickness);

      if (ring.mesh && window.THREE) {
        // Replace geometry to update radii
        ring.mesh.geometry.dispose();
        ring.mesh.geometry = new window.THREE.RingGeometry(innerR, ring.radius, 64);
        ring.mat.opacity = opacity;
      }

      // Trigger enemy reveal at leading edge (once)
      if (!ring.triggered && ring.radius > 0) {
        _checkEnemiesAtRadius(ring);
        // Once ring covers full range, mark triggered
        if (ring.radius >= range) {
          ring.triggered = true;
        }
      }

      // Kill ring after lifetime
      if (ring.age >= RING_LIFETIME || ring.radius > range + 5) {
        if (ring.mesh) {
          _scene.remove(ring.mesh);
          ring.mesh.geometry.dispose();
          ring.mat.dispose();
          ring.mesh = null;
        }
        ring.alive = false;
        _rings.splice(i, 1);
        continue;
      }

      anyAlive = true;
    }

    window._sonarPulseActive = anyAlive;

    // Tick revealed enemy timers
    var minimapCanvas = document.getElementById('minimap-canvas');
    for (var j = _revealedEnemies.length - 1; j >= 0; j--) {
      var entry = _revealedEnemies[j];
      entry.timer -= dt;

      // Update minimap dot position each frame
      if (entry.dotEl && minimapCanvas) {
        _updateMinimapDotPos(entry.dotEl, entry.enemy, minimapCanvas);
      }

      // Update waypoint
      if (entry.waypointEl) {
        _updateWaypointPos(entry.waypointEl, entry.enemy);
      }

      if (entry.timer <= 0) {
        _clearReveal(entry);
        _revealedEnemies.splice(j, 1);
      }
    }
  }

  // ── Key handler ──────────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    if (e.code !== KEY_CODE) { return; }
    if (_keyDown) { return; }  // prevent repeat
    _keyDown = true;

    // Only fire when game is actually running (if GameManager exposes state)
    if (window.GameManager && window.GameManager.isPlaying && !window.GameManager.isPlaying()) {
      return;
    }

    pulse();
  }

  function _onKeyUp(e) {
    if (e.code === KEY_CODE) { _keyDown = false; }
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  function init(opts) {
    if (_initialized) { return; }
    _initialized = true;

    opts = opts || {};

    // Grab THREE.js scene and camera from GameManager or passed opts
    if (opts.scene) {
      _scene  = opts.scene;
      _camera = opts.camera;
    } else if (window.GameManager) {
      _scene  = window.GameManager.scene  || null;
      _camera = window.GameManager.camera || null;
    }

    // Enemy reference
    _enemies = window.Enemies || null;

    // Player reference
    _player = (window.GameManager && window.GameManager.player) ? window.GameManager.player : null;

    _cooldownLeft = 0;
    _rings        = [];
    _revealedEnemies = [];

    _createHUD();

    document.addEventListener('keydown', _onKeyDown, false);
    document.addEventListener('keyup',   _onKeyUp,   false);
  }

  // ── Reset ────────────────────────────────────────────────────────────────────
  function reset() {
    // Remove active rings from scene
    for (var i = 0; i < _rings.length; i++) {
      var ring = _rings[i];
      if (ring.mesh && _scene) {
        _scene.remove(ring.mesh);
        if (ring.mesh.geometry) { ring.mesh.geometry.dispose(); }
        if (ring.mat)           { ring.mat.dispose(); }
      }
    }
    _rings = [];

    // Clear revealed enemies
    for (var j = 0; j < _revealedEnemies.length; j++) {
      _clearReveal(_revealedEnemies[j]);
    }
    _revealedEnemies = [];

    _cooldownLeft = 0;
    window._sonarPulseActive = false;
    _keyDown = false;

    _updateHUD();
  }

  // ── Public API ───────────────────────────────────────────────────────────────
  return {
    init:   init,
    update: update,
    pulse:  pulse,
    reset:  reset
  };

}());
