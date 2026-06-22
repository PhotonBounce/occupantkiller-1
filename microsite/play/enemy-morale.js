/* ─────────────────────────────────────────────────────────────────────────────
   enemy-morale.js  — Enemy Morale System
   Enemies panic and flee when morale breaks below threshold.
   Depends on: THREE (optional, for 3D→2D projection), ScavengeSystem (optional)
   ───────────────────────────────────────────────────────────────────────────── */
window.EnemyMorale = (function () {
  'use strict';

  /* ── State ──────────────────────────────────────────────────────────────── */
  var _waveMorale = 100;    // starts at 100% per wave
  var _panicMode = false;   // true when morale < 20
  var _fleeingEnemies = []; // enemies currently fleeing
  var _scene = null;        // THREE.Scene reference (set via init)
  var _camera = null;       // THREE.Camera reference (set via init)

  /* Rapid-kill tracking: timestamps of recent kills */
  var _recentKillTimes = [];
  var RAPID_KILL_WINDOW_MS = 5000; // 5 seconds
  var RAPID_KILL_THRESHOLD = 3;    // 3 kills in 5s triggers rapid-kill bonus

  /* Morale thresholds */
  var THRESHOLD_CONFIDENT  = 60;  // 100-60: CONFIDENT
  var THRESHOLD_SHAKEN     = 40;  // 59-40: SHAKEN
  var THRESHOLD_FRIGHTENED = 20;  // 39-20: FRIGHTENED
  // 19-0: BROKEN

  /* Flee timing */
  var FLEE_DESPAWN_MS = 5000; // 5 seconds of fleeing then despawn
  var FLEE_SPEED_MULT = 1.5;  // flee at 1.5x normal enemy speed

  /* Boss type identifier */
  var BOSS_TYPES = ['BOSS', 'COMMANDER', 'HEAVY_BOSS', 'GENERAL'];

  /* ── DOM element cache ──────────────────────────────────────────────────── */
  var _hudMoraleEl = null;
  var _moraleAlertEl = null;
  var _panicOverlayEl = null;
  var _panicPulseInterval = null;
  var _fleeLabels = {}; // enemyId -> DOM element for "!!!" above head

  /* ── Helpers ────────────────────────────────────────────────────────────── */
  function _clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function _isBoss(enemy) {
    if (!enemy) return false;
    var t = (enemy.type || '').toUpperCase();
    for (var i = 0; i < BOSS_TYPES.length; i++) {
      if (t === BOSS_TYPES[i]) return true;
    }
    return !!(enemy.isBoss);
  }

  function _countRapidKills() {
    var now = Date.now();
    // Prune stale entries
    var fresh = [];
    for (var i = 0; i < _recentKillTimes.length; i++) {
      if (now - _recentKillTimes[i] <= RAPID_KILL_WINDOW_MS) {
        fresh.push(_recentKillTimes[i]);
      }
    }
    _recentKillTimes = fresh;
    return _recentKillTimes.length;
  }

  /* ── DOM helpers ────────────────────────────────────────────────────────── */
  function _getOrCreate(id, tag, styles) {
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement(tag || 'div');
      el.id = id;
      Object.assign(el.style, styles || {});
      document.body.appendChild(el);
    }
    return el;
  }

  /* ── HUD: Morale Meter ──────────────────────────────────────────────────── */
  function _initHUD() {
    _hudMoraleEl = _getOrCreate('morale-meter', 'div', {
      position: 'fixed',
      top: '8px',
      right: '120px',
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#44ff44',
      background: 'rgba(0,0,0,0.55)',
      padding: '3px 8px',
      borderRadius: '4px',
      border: '1px solid rgba(68,68,68,0.5)',
      zIndex: '500',
      letterSpacing: '1px',
      display: 'none',
      userSelect: 'none',
      pointerEvents: 'none'
    });

    _moraleAlertEl = _getOrCreate('morale-alert', 'div', {
      position: 'fixed',
      top: '18%',
      left: '50%',
      transform: 'translateX(-50%)',
      fontFamily: 'monospace',
      fontSize: '14px',
      fontWeight: 'bold',
      padding: '6px 18px',
      borderRadius: '5px',
      background: 'rgba(0,0,0,0.70)',
      zIndex: '600',
      display: 'none',
      letterSpacing: '2px',
      pointerEvents: 'none',
      textAlign: 'center',
      textShadow: '0 0 8px currentColor'
    });

    _panicOverlayEl = _getOrCreate('morale-panic-overlay', 'div', {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      pointerEvents: 'none',
      zIndex: '450',
      boxShadow: 'inset 0 0 80px rgba(255,0,0,0)',
      display: 'none'
    });
  }

  /* Render morale bar with block chars */
  function _renderMoraleBar(pct) {
    var filled = Math.round(pct / 10);
    var empty  = 10 - filled;
    var bar = '';
    for (var i = 0; i < filled; i++) bar += '█'; // █
    for (var j = 0; j < empty;  j++) bar += '░'; // ░
    return 'MORALE: ' + bar + ' ' + pct + '%';
  }

  function _updateHUD() {
    if (!_hudMoraleEl) return;

    var pct = Math.round(_waveMorale);
    _hudMoraleEl.textContent = _renderMoraleBar(pct);
    _hudMoraleEl.style.display = 'block';

    if (pct <= 19) {
      _hudMoraleEl.style.color = '#ff4444';
      // Flashing when broken
      _hudMoraleEl.style.animation = 'morale-flash 0.5s ease-in-out infinite alternate';
    } else if (pct <= 39) {
      _hudMoraleEl.style.color = '#ffaa00';
      _hudMoraleEl.style.animation = '';
    } else if (pct <= 59) {
      _hudMoraleEl.style.color = '#ffdd00';
      _hudMoraleEl.style.animation = '';
    } else {
      _hudMoraleEl.style.color = '#44ff44';
      _hudMoraleEl.style.animation = '';
    }
  }

  /* Inject CSS for morale flash animation (once) */
  function _injectCSS() {
    if (document.getElementById('enemy-morale-style')) return;
    var style = document.createElement('style');
    style.id = 'enemy-morale-style';
    style.textContent = [
      '@keyframes morale-flash {',
      '  from { opacity: 1; }',
      '  to   { opacity: 0.35; }',
      '}',
      '@keyframes morale-panic-pulse {',
      '  0%   { box-shadow: inset 0 0 80px rgba(255,0,0,0); }',
      '  50%  { box-shadow: inset 0 0 80px rgba(255,0,0,0.35); }',
      '  100% { box-shadow: inset 0 0 80px rgba(255,0,0,0); }',
      '}',
      '.morale-flee-label {',
      '  position: fixed;',
      '  font-family: monospace;',
      '  font-size: 14px;',
      '  font-weight: bold;',
      '  color: #ff2222;',
      '  text-shadow: 0 0 6px #ff0000;',
      '  pointer-events: none;',
      '  z-index: 480;',
      '  transform: translateX(-50%);',
      '  letter-spacing: 2px;',
      '}',
      '.morale-shaken-label {',
      '  position: fixed;',
      '  font-family: monospace;',
      '  font-size: 14px;',
      '  font-weight: bold;',
      '  color: #ffdd00;',
      '  text-shadow: 0 0 4px #ffcc00;',
      '  pointer-events: none;',
      '  z-index: 480;',
      '  transform: translateX(-50%);',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  /* ── Alert messages ─────────────────────────────────────────────────────── */
  var _alertTimeout = null;

  function _showAlert(text, color, duration) {
    if (!_moraleAlertEl) return;
    _moraleAlertEl.textContent = text;
    _moraleAlertEl.style.color = color || '#ffffff';
    _moraleAlertEl.style.borderColor = color || '#ffffff';
    _moraleAlertEl.style.border = '1px solid ' + (color || '#fff');
    _moraleAlertEl.style.display = 'block';

    if (_alertTimeout) clearTimeout(_alertTimeout);
    _alertTimeout = setTimeout(function () {
      if (_moraleAlertEl) _moraleAlertEl.style.display = 'none';
    }, duration || 3000);
  }

  /* ── Panic overlay pulse ─────────────────────────────────────────────────── */
  function _startPanicPulse() {
    if (!_panicOverlayEl) return;
    _panicOverlayEl.style.display = 'block';
    _panicOverlayEl.style.animation = 'morale-panic-pulse 1s ease-in-out infinite';

    if (_panicPulseInterval) clearInterval(_panicPulseInterval);
    // Re-trigger show alert every few seconds while panicking
    _panicPulseInterval = setInterval(function () {
      if (_panicMode) {
        _showAlert('★ ENEMY MORALE BROKEN — FORCES ROUTING', '#ffd700', 2500);
      } else {
        _stopPanicPulse();
      }
    }, 4000);
  }

  function _stopPanicPulse() {
    if (_panicOverlayEl) {
      _panicOverlayEl.style.display = 'none';
      _panicOverlayEl.style.animation = '';
    }
    if (_panicPulseInterval) {
      clearInterval(_panicPulseInterval);
      _panicPulseInterval = null;
    }
  }

  /* ── 3D→2D projection for labels ────────────────────────────────────────── */
  function _worldToScreen(position3d) {
    if (!_camera || !window.innerWidth) return null;
    var vec = position3d.clone();
    vec.project(_camera);
    var x = (vec.x *  0.5 + 0.5) * window.innerWidth;
    var y = (vec.y * -0.5 + 0.5) * window.innerHeight;
    // If behind camera or off-screen, return null
    if (vec.z > 1 || x < -50 || x > window.innerWidth + 50 || y < -50 || y > window.innerHeight + 50) {
      return null;
    }
    return { x: x, y: y };
  }

  /* ── Flee label management ──────────────────────────────────────────────── */
  function _getEnemyId(enemy) {
    // Use the uuid if it has a mesh, or fall back to object identity via a custom id
    if (enemy.mesh && enemy.mesh.uuid) return enemy.mesh.uuid;
    if (enemy.uuid) return enemy.uuid;
    if (!enemy.__moraleId) enemy.__moraleId = 'em_' + Math.random().toString(36).slice(2);
    return enemy.__moraleId;
  }

  function _getFleeLabel(enemy) {
    var id = _getEnemyId(enemy);
    if (!_fleeLabels[id]) {
      var el = document.createElement('div');
      el.className = 'morale-flee-label';
      el.textContent = '!!!';
      el.style.display = 'none';
      document.body.appendChild(el);
      _fleeLabels[id] = el;
    }
    return _fleeLabels[id];
  }

  function _removeFleeLabel(enemy) {
    var id = _getEnemyId(enemy);
    if (_fleeLabels[id]) {
      if (_fleeLabels[id].parentNode) _fleeLabels[id].parentNode.removeChild(_fleeLabels[id]);
      delete _fleeLabels[id];
    }
  }

  function _updateFleeLabel(enemy) {
    if (!_camera) return;
    var mesh = enemy.mesh || enemy;
    if (!mesh || !mesh.position) return;
    var headPos = mesh.position.clone();
    headPos.y += 2.5; // above head
    var screen = _worldToScreen(headPos);
    var lbl = _getFleeLabel(enemy);
    if (screen) {
      lbl.style.display = 'block';
      lbl.style.left = screen.x + 'px';
      lbl.style.top  = screen.y + 'px';
    } else {
      lbl.style.display = 'none';
    }
  }

  /* ── Shaken label (occasional "?") ─────────────────────────────────────── */
  var _shakenLabels = {};

  function _getShakenLabel(enemy) {
    var id = _getEnemyId(enemy);
    if (!_shakenLabels[id]) {
      var el = document.createElement('div');
      el.className = 'morale-shaken-label';
      el.textContent = '?';
      el.style.display = 'none';
      document.body.appendChild(el);
      _shakenLabels[id] = { el: el, timer: 0, visible: false };
    }
    return _shakenLabels[id];
  }

  function _removeShakenLabel(enemy) {
    var id = _getEnemyId(enemy);
    if (_shakenLabels[id]) {
      if (_shakenLabels[id].el.parentNode) _shakenLabels[id].el.parentNode.removeChild(_shakenLabels[id].el);
      delete _shakenLabels[id];
    }
  }

  function _updateShakenLabel(enemy, now) {
    if (!_camera) return;
    var info = _getShakenLabel(enemy);
    // Blink: show for 1.5s, hide for 3s
    var cycle = 4500;
    var showFor = 1500;
    var phase = now % cycle;
    var shouldShow = (phase < showFor);

    var mesh = enemy.mesh || enemy;
    if (shouldShow && mesh && mesh.position) {
      var headPos = mesh.position.clone();
      headPos.y += 2.5;
      var screen = _worldToScreen(headPos);
      if (screen) {
        info.el.style.display = 'block';
        info.el.style.left = screen.x + 'px';
        info.el.style.top  = screen.y + 'px';
      } else {
        info.el.style.display = 'none';
      }
    } else {
      info.el.style.display = 'none';
    }
  }

  /* ── Flee audio: distorted shout via AudioContext ───────────────────────── */
  function _playFleeShout() {
    try {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      var ctx = new AudioCtx();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      var dist = ctx.createWaveShaper();

      // Simple distortion curve
      var samples = 256;
      var curve = new Float32Array(samples);
      for (var i = 0; i < samples; i++) {
        var x = (i * 2 / samples) - 1;
        curve[i] = (Math.PI + 200) * x / (Math.PI + 200 * Math.abs(x));
      }
      dist.curve = curve;
      dist.oversample = '4x';

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.connect(dist);
      dist.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);

      setTimeout(function () { ctx.close(); }, 600);
    } catch (e) {
      // AudioContext unavailable — silently ignore
    }
  }

  /* ── Apply morale thresholds after morale changes ───────────────────────── */
  function _applyThresholds(oldMorale) {
    var m = _waveMorale;

    /* Crossed into SHAKEN (59-40) */
    if (oldMorale >= THRESHOLD_CONFIDENT && m < THRESHOLD_CONFIDENT) {
      window._enemiesShaken = true;
      window._waveMorale = m;
      // Enemies stop advancing
    }

    /* Crossed into FRIGHTENED (39-20) */
    if (oldMorale >= THRESHOLD_SHAKEN && m < THRESHOLD_SHAKEN) {
      _showAlert('[! ENEMY FORCES FALTERING]', '#ff8800', 4000);
    }

    /* Crossed into BROKEN (19-0) */
    if (oldMorale >= THRESHOLD_FRIGHTENED && m < THRESHOLD_FRIGHTENED) {
      _panicMode = true;
      window._enemiesPanicking = true;
      window._waveMorale = m;
      _showAlert('[★ ENEMY MORALE BROKEN — FORCES ROUTING]', '#ffd700', 5000);
      _startPanicPulse();
      _triggerMassFlee();
    }
  }

  /* ── Trigger all surviving enemies to flee ──────────────────────────────── */
  function _triggerMassFlee() {
    // Find active enemies via common global arrays
    var activeEnemies = _getActiveEnemies();
    for (var i = 0; i < activeEnemies.length; i++) {
      var e = activeEnemies[i];
      if (!e._fleeing) {
        _startFlee(e);
      }
    }
  }

  /* Try common global arrays that enemies.js may expose */
  function _getActiveEnemies() {
    if (window.Enemies && typeof window.Enemies.getAll === 'function') {
      return window.Enemies.getAll();
    }
    if (window._activeEnemies && Array.isArray(window._activeEnemies)) {
      return window._activeEnemies;
    }
    if (window._enemies && Array.isArray(window._enemies)) {
      return window._enemies;
    }
    return [];
  }

  /* ── Start flee for a single enemy ─────────────────────────────────────── */
  function _startFlee(enemy) {
    if (!enemy || enemy._fleeing || enemy._dead) return;
    enemy._fleeing = true;
    enemy._fleeStartTime = Date.now();

    // Drop weapon
    if (window.ScavengeSystem && typeof window.ScavengeSystem.spawnWeaponDrop === 'function') {
      var pos = (enemy.mesh && enemy.mesh.position) ? enemy.mesh.position : (enemy.position || null);
      if (pos) {
        window.ScavengeSystem.spawnWeaponDrop(pos, null, 15);
      }
    }

    // Play flee sound
    _playFleeShout();

    // Disable shooting
    enemy._canShoot = false;
    if (enemy.canShoot !== undefined) enemy.canShoot = false;

    // Increase speed
    if (typeof enemy.speed === 'number') {
      enemy._originalSpeed = enemy.speed;
      enemy.speed = enemy.speed * FLEE_SPEED_MULT;
    }

    // Track in fleeing list
    _fleeingEnemies.push({ enemy: enemy, startTime: enemy._fleeStartTime });
  }

  /* ── Determine flee direction (away from player) ────────────────────────── */
  function _getFleeVelocity(enemy) {
    var playerPos = null;
    if (window._playerPosition) {
      playerPos = window._playerPosition;
    } else if (window.camera && window.camera.position) {
      playerPos = window.camera.position;
    }

    var mesh = enemy.mesh || enemy;
    if (!mesh || !mesh.position || !playerPos) return null;

    var dx = mesh.position.x - playerPos.x;
    var dz = mesh.position.z - playerPos.z;
    var len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.001) return { x: 1, z: 0 };
    return { x: dx / len, z: dz / len };
  }

  /* ── Despawn a fleeing enemy ─────────────────────────────────────────────── */
  function _despawnEnemy(enemy) {
    enemy._dead = true;
    _removeFleeLabel(enemy);
    _removeShakenLabel(enemy);

    var mesh = enemy.mesh || null;
    if (mesh && mesh.parent) {
      mesh.parent.remove(mesh);
    } else if (_scene && mesh) {
      _scene.remove(mesh);
    }

    // Notify enemies system
    if (window.Enemies && typeof window.Enemies.remove === 'function') {
      window.Enemies.remove(enemy);
    } else if (window._activeEnemies) {
      var idx = window._activeEnemies.indexOf(enemy);
      if (idx >= 0) window._activeEnemies.splice(idx, 1);
    } else if (window._enemies) {
      var idx2 = window._enemies.indexOf(enemy);
      if (idx2 >= 0) window._enemies.splice(idx2, 1);
    }
  }

  /* ── Public API ─────────────────────────────────────────────────────────── */

  /**
   * init(scene, camera) — call once at game startup
   */
  function init(scene, camera) {
    _scene  = scene  || null;
    _camera = camera || null;

    // Wire up camera from globals if not passed
    if (!_camera && window.camera) _camera = window.camera;
    if (!_scene  && window.scene)  _scene  = window.scene;

    _injectCSS();
    _initHUD();
    reset();

    /* Expose window globals */
    window._enemiesShaken    = false;
    window._enemiesPanicking = false;
    window._waveMorale       = 100;

    window._onEnemyKillForMorale = function (enemy, headshot, streak) {
      EnemyMorale.onEnemyKilled(enemy, headshot, streak);
    };

    console.log('[EnemyMorale] init complete');
  }

  /**
   * onEnemyKilled(enemy, isHeadshot, streak)
   * Called whenever an enemy is killed.
   */
  function onEnemyKilled(enemy, isHeadshot, streak) {
    var now = Date.now();
    _recentKillTimes.push(now);
    var rapidCount = _countRapidKills(); // also prunes old entries

    var loss = 8; // base loss

    if (isHeadshot) loss += 4;

    if (streak >= 10) {
      loss += 10; // "unstoppable" fear
    } else if (streak >= 5) {
      loss += 5;  // kill streak fear
    }

    if (_isBoss(enemy)) {
      loss += 50; // major morale blow
    }

    if (rapidCount >= RAPID_KILL_THRESHOLD) {
      loss += 6; // rapid kill bonus
    }

    var oldMorale = _waveMorale;
    _waveMorale = _clamp(_waveMorale - loss, 0, 100);
    window._waveMorale = _waveMorale;

    _applyThresholds(oldMorale);
    _updateHUD();

    /* FRIGHTENED zone: 30% chance another enemy flees */
    if (_waveMorale >= 20 && _waveMorale < 40) {
      if (Math.random() < 0.30) {
        var candidates = _getActiveEnemies();
        if (candidates.length > 0) {
          var target = candidates[Math.floor(Math.random() * candidates.length)];
          if (target && !target._fleeing) {
            _startFlee(target);
          }
        }
      }
    }
  }

  /**
   * update(dt) — call each frame with delta time in seconds
   */
  function update(dt) {
    var now = Date.now();

    /* Update camera reference if it changed */
    if (!_camera && window.camera) _camera = window.camera;
    if (!_scene  && window.scene)  _scene  = window.scene;

    /* Process fleeing enemies */
    var stillFleeing = [];
    for (var i = 0; i < _fleeingEnemies.length; i++) {
      var fe = _fleeingEnemies[i];
      var enemy = fe.enemy;

      if (enemy._dead) {
        _removeFleeLabel(enemy);
        _removeShakenLabel(enemy);
        continue;
      }

      var elapsed = now - fe.startTime;
      if (elapsed >= FLEE_DESPAWN_MS) {
        _despawnEnemy(enemy);
        continue;
      }

      /* Move enemy away from player */
      var dir = _getFleeVelocity(enemy);
      var mesh = enemy.mesh || enemy;
      if (dir && mesh && mesh.position) {
        var spd = (typeof enemy.speed === 'number') ? enemy.speed : 4 * FLEE_SPEED_MULT;
        mesh.position.x += dir.x * spd * dt;
        mesh.position.z += dir.z * spd * dt;
      }

      /* Update "!!!" label */
      _updateFleeLabel(enemy);

      stillFleeing.push(fe);
    }
    _fleeingEnemies = stillFleeing;

    /* Update shaken "?" labels for non-fleeing enemies in SHAKEN zone */
    if (window._enemiesShaken && !_panicMode) {
      var activeEnemies = _getActiveEnemies();
      for (var j = 0; j < activeEnemies.length; j++) {
        var ae = activeEnemies[j];
        if (!ae._fleeing && !ae._dead) {
          _updateShakenLabel(ae, now);
        }
      }
    }
  }

  /**
   * getMorale() — return current morale 0-100
   */
  function getMorale() {
    return _waveMorale;
  }

  /**
   * reset() — call at the start of a new wave
   */
  function reset() {
    _waveMorale = 100;
    _panicMode  = false;

    /* Clear fleeing list without despawning (wave reset handles enemy removal) */
    for (var i = 0; i < _fleeingEnemies.length; i++) {
      var e = _fleeingEnemies[i].enemy;
      _removeFleeLabel(e);
      _removeShakenLabel(e);
    }
    _fleeingEnemies = [];
    _recentKillTimes = [];

    /* Reset window globals */
    window._enemiesShaken    = false;
    window._enemiesPanicking = false;
    window._waveMorale       = 100;

    _stopPanicPulse();
    if (_moraleAlertEl) _moraleAlertEl.style.display = 'none';
    if (_alertTimeout) { clearTimeout(_alertTimeout); _alertTimeout = null; }
    _updateHUD();

    console.log('[EnemyMorale] reset — morale 100');
  }

  /* ── Return public interface ─────────────────────────────────────────────── */
  return {
    init:          init,
    update:        update,
    onEnemyKilled: onEnemyKilled,
    getMorale:     getMorale,
    reset:         reset
  };

})();
