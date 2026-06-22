// ============================================================
//  blood-trail.js — Blood Trail Tracker
//  Wounded enemies leave a blood trail the player can follow.
//
//  Public API: { init, update, reset }
//  Config toggle: window._bleedEnabled (default true)
// ============================================================
window.BloodTrail = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────
  var HP_THRESHOLD     = 0.40;   // track enemies below 40% HP
  var DROP_INTERVAL    = 1.5;    // seconds between trail drops
  var DROP_LIFETIME    = 25.0;   // seconds before fade begins
  var DEATH_FADE_TIME  = 2.0;    // seconds for death cleanup fade
  var MAX_DROPS        = 80;     // pool ceiling (FIFO when exceeded)
  var TRACKER_RANGE    = 15.0;   // units — max distance for direction arrow
  var PING_INTERVAL    = 3.0;    // seconds between compass audio pings
  var TRACK_THRESHOLD  = 3;      // drops followed before "tracked kill" bonus
  var BONUS_SCORE      = 75;

  // ── Scene / Three.js state ─────────────────────────────────
  var _scene           = null;
  var _camera          = null;   // needed for screen-space arrow
  var _initialized     = false;

  // ── Drop pool ──────────────────────────────────────────────
  // Each slot: { mesh, light, active, timer, enemyId, fadeDur, opacity }
  var _drops           = [];

  // ── Enemy tracking state ───────────────────────────────────
  // Keyed by a unique _btId assigned to each enemy object.
  // { timer, dropCount }
  var _enemyState      = {};
  var _btIdCounter     = 0;

  // ── Tracker mode ──────────────────────────────────────────
  var _trackerActive   = false;
  var _trackerHUD      = null;   // DOM element for HUD label
  var _arrowEl         = null;   // DOM element for direction arrow
  var _pingTimer       = 0;
  var _pulseLight      = null;   // PointLight on most-recent drop
  var _pulsePhase      = 0;

  // ── Kill-tracking: how many drops player has "followed" ──
  // Maps enemyId -> count of drops the player has passed near
  var _followedDrops   = {};

  // ── Audio context (optional ping) ─────────────────────────
  var _audioCtx        = null;

  // ── Helpers ───────────────────────────────────────────────
  function _rnd(min, max) {
    return min + Math.random() * (max - min);
  }

  function _getBleedEnabled() {
    return (window._bleedEnabled === undefined) ? true : !!window._bleedEnabled;
  }

  function _assignId(enemy) {
    if (!enemy._btId) {
      enemy._btId = ++_btIdCounter;
    }
    return enemy._btId;
  }

  // ── Pool management ───────────────────────────────────────
  function _acquireSlot() {
    // Find inactive slot first
    for (var i = 0; i < _drops.length; i++) {
      if (!_drops[i].active) return i;
    }
    // Pool below ceiling — grow it
    if (_drops.length < MAX_DROPS) {
      return _drops.length; // caller will push a new entry
    }
    // FIFO eviction: remove oldest (first active slot)
    for (var j = 0; j < _drops.length; j++) {
      if (_drops[j].active) {
        _evictDrop(j);
        return j;
      }
    }
    return 0;
  }

  function _evictDrop(idx) {
    var d = _drops[idx];
    if (!d) return;
    if (d.mesh) {
      if (_scene) _scene.remove(d.mesh);
      if (d.mesh.geometry) d.mesh.geometry.dispose();
      if (d.mesh.material) d.mesh.material.dispose();
      d.mesh = null;
    }
    if (d.light) {
      if (_scene) _scene.remove(d.light);
      d.light = null;
    }
    d.active  = false;
    d.enemyId = null;
  }

  // ── Place a blood drop ───────────────────────────────────
  function _placeDrop(x, z, enemyId) {
    var radius  = _rnd(0.08, 0.18);
    var opacity = _rnd(0.6, 1.0);
    var geo     = new THREE.CircleGeometry(radius, 8);
    var mat     = new THREE.MeshBasicMaterial({
      color:       0x8B0000,
      transparent: true,
      opacity:     opacity,
      depthWrite:  false
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.01, z);
    if (_scene) _scene.add(mesh);

    var idx  = _acquireSlot();
    var slot = {
      mesh:       mesh,
      light:      null,
      active:     true,
      timer:      0,
      enemyId:    enemyId,
      fadeDur:    DROP_LIFETIME,
      baseOpacity: opacity
    };

    if (idx < _drops.length) {
      _drops[idx] = slot;
    } else {
      _drops.push(slot);
    }
    return idx;
  }

  // ── Tracker-mode pulse light on newest drop ───────────────
  function _attachPulseLight(idx) {
    // Remove old pulse light from previous drop
    if (_pulseLight && _scene) {
      _scene.remove(_pulseLight);
      _pulseLight = null;
    }
    var d = _drops[idx];
    if (!d || !d.mesh) return;
    var light = new THREE.PointLight(0xFF0000, 3, 4);
    light.position.copy(d.mesh.position);
    light.position.y += 0.3;
    if (_scene) _scene.add(light);
    d.light    = light;
    _pulseLight = light;
  }

  // ── HUD / DOM helpers ─────────────────────────────────────
  function _createHUD() {
    if (_trackerHUD) return;
    var el      = document.createElement('div');
    el.id       = 'blood-trail-hud';
    el.style.position   = 'fixed';
    el.style.top        = '12px';
    el.style.left       = '12px';
    el.style.color      = '#cc0000';
    el.style.fontFamily = 'monospace, sans-serif';
    el.style.fontSize   = '16px';
    el.style.fontWeight = 'bold';
    el.style.textShadow = '0 0 6px #ff0000, 0 0 12px #ff0000';
    el.style.zIndex     = '9999';
    el.style.display    = 'none';
    el.style.pointerEvents = 'none';
    el.innerText        = '🩸 TRAIL ACTIVE';
    document.body.appendChild(el);
    _trackerHUD = el;
  }

  function _createArrow() {
    if (_arrowEl) return;
    var el      = document.createElement('div');
    el.id       = 'blood-trail-arrow';
    el.style.position   = 'fixed';
    el.style.top        = '50%';
    el.style.left       = '50%';
    el.style.transform  = 'translate(-50%, -50%)';
    el.style.color      = '#ff0000';
    el.style.fontSize   = '28px';
    el.style.fontWeight = 'bold';
    el.style.zIndex     = '9999';
    el.style.display    = 'none';
    el.style.pointerEvents = 'none';
    el.style.textShadow = '0 0 8px #ff0000';
    el.innerText        = '↑'; // up arrow, rotated by JS
    document.body.appendChild(el);
    _arrowEl = el;
  }

  function _showHUD(show) {
    if (_trackerHUD) _trackerHUD.style.display = show ? 'block' : 'none';
    if (_arrowEl)    _arrowEl.style.display    = show ? 'block' : 'none';
  }

  // ── Find nearest active drop within range ─────────────────
  function _nearestDrop(px, pz, maxDist) {
    var bestIdx  = -1;
    var bestDist = maxDist * maxDist;
    for (var i = 0; i < _drops.length; i++) {
      var d = _drops[i];
      if (!d || !d.active || !d.mesh) continue;
      var dx   = d.mesh.position.x - px;
      var dz   = d.mesh.position.z - pz;
      var dist2 = dx * dx + dz * dz;
      if (dist2 < bestDist) {
        bestDist = dist2;
        bestIdx  = i;
      }
    }
    return bestIdx;
  }

  // ── Update direction arrow on screen ─────────────────────
  function _updateArrow(px, pz) {
    if (!_arrowEl || !_trackerActive) return;

    var nearIdx = _nearestDrop(px, pz, TRACKER_RANGE);
    if (nearIdx < 0) {
      _arrowEl.style.display = 'none';
      return;
    }

    var drop = _drops[nearIdx];
    var dx   = drop.mesh.position.x - px;
    var dz   = drop.mesh.position.z - pz;
    // Angle in screen-space: atan2(dx, -dz) gives forward-is-up orientation
    var angle = Math.atan2(dx, -dz) * (180 / Math.PI);

    _arrowEl.style.display   = 'block';
    _arrowEl.style.transform =
      'translate(-50%, -50%) rotate(' + angle + 'deg)';
  }

  // ── Audio ping ────────────────────────────────────────────
  function _emitPing() {
    try {
      if (!_audioCtx) {
        if (typeof AudioContext !== 'undefined') {
          _audioCtx = new AudioContext();
        } else if (typeof webkitAudioContext !== 'undefined') {
          _audioCtx = new webkitAudioContext();
        }
      }
      if (!_audioCtx) return;
      var osc  = _audioCtx.createOscillator();
      var gain = _audioCtx.createGain();
      osc.connect(gain);
      gain.connect(_audioCtx.destination);
      osc.type      = 'sine';
      osc.frequency.setValueAtTime(880, _audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, _audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, _audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + 0.3);
      osc.start(_audioCtx.currentTime);
      osc.stop(_audioCtx.currentTime + 0.3);
    } catch (e) {
      // Audio not available — silently skip
    }
  }

  // ── Show score bonus ──────────────────────────────────────
  function _showBonus() {
    // Use game HUD if available
    if (window.HUD && typeof window.HUD.showKillFeedMessage === 'function') {
      window.HUD.showKillFeedMessage('TRACKED KILL +' + BONUS_SCORE);
      return;
    }
    // Fallback: show a brief DOM notification
    var el       = document.createElement('div');
    el.innerText = 'TRACKED KILL +' + BONUS_SCORE;
    el.style.position   = 'fixed';
    el.style.top        = '40%';
    el.style.left       = '50%';
    el.style.transform  = 'translate(-50%, -50%)';
    el.style.color      = '#ff4444';
    el.style.fontFamily = 'monospace, sans-serif';
    el.style.fontSize   = '26px';
    el.style.fontWeight = 'bold';
    el.style.textShadow = '0 0 10px #ff0000';
    el.style.zIndex     = '99999';
    el.style.pointerEvents = 'none';
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 2000);
  }

  // ── Per-frame update of enemy bleeding ───────────────────
  function _tickEnemies(dt) {
    if (!window.Enemies || typeof window.Enemies.getAll !== 'function') return;

    var all = window.Enemies.getAll();
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (!e || !e.alive) continue;
      if (e.hp === undefined || e.maxHp === undefined) continue;

      var hpFrac = e.hp / e.maxHp;
      if (hpFrac >= HP_THRESHOLD) continue;

      var id = _assignId(e);
      if (!_enemyState[id]) {
        _enemyState[id] = { timer: 0, dropCount: 0 };
      }

      var state = _enemyState[id];
      state.timer += dt;

      if (state.timer >= DROP_INTERVAL) {
        state.timer -= DROP_INTERVAL;

        var pos = e.mesh ? e.mesh.position : (e.position || null);
        if (!pos) continue;

        var dropIdx = _placeDrop(
          pos.x + _rnd(-0.05, 0.05),
          pos.z + _rnd(-0.05, 0.05),
          id
        );
        state.dropCount++;

        // Attach pulse light if tracker mode is on (newest drop only)
        if (_trackerActive) {
          _attachPulseLight(dropIdx);
        }
      }
    }
  }

  // ── Check if player is near a drop (for "followed" tally) ─
  function _checkFollowing(px, pz) {
    var NEAR2 = 1.5 * 1.5; // 1.5 units counts as "followed"
    for (var i = 0; i < _drops.length; i++) {
      var d = _drops[i];
      if (!d || !d.active || !d.mesh || !d.enemyId) continue;
      var dx   = d.mesh.position.x - px;
      var dz   = d.mesh.position.z - pz;
      if (dx * dx + dz * dz < NEAR2) {
        _followedDrops[d.enemyId] = (_followedDrops[d.enemyId] || 0) + 1;
        // Deactivate so we don't count same drop twice
        d.active = false;
        d.mesh.visible = false;
        if (d.light && _scene) {
          _scene.remove(d.light);
          d.light = null;
        }
      }
    }
  }

  // ── Death cleanup: accelerate fade on drops for that enemy ─
  function _onEnemyDeath(enemy) {
    if (!enemy || !enemy._btId) return;
    var id = enemy._btId;

    // Award tracked kill bonus if applicable
    var followed = _followedDrops[id] || 0;
    if (followed >= TRACK_THRESHOLD) {
      _showBonus();
      if (window.GameManager && typeof window.GameManager.addScore === 'function') {
        window.GameManager.addScore(BONUS_SCORE);
      }
    }

    // Accelerate fade for all drops belonging to this enemy
    for (var i = 0; i < _drops.length; i++) {
      var d = _drops[i];
      if (!d || !d.active || d.enemyId !== id) continue;
      // Reduce remaining lifetime to force 2s fade
      // We do this by setting fadeDur to DEATH_FADE_TIME and resetting timer
      // to DROP_LIFETIME so fade kicks in immediately.
      d.timer   = d.fadeDur;
      d.fadeDur = DEATH_FADE_TIME;
    }

    delete _followedDrops[id];
    delete _enemyState[id];
  }

  // ── Per-frame fade logic ──────────────────────────────────
  function _tickFades(dt) {
    for (var i = 0; i < _drops.length; i++) {
      var d = _drops[i];
      if (!d || !d.active) continue;

      d.timer += dt;

      if (d.timer >= d.fadeDur) {
        // In fade window
        var elapsed = d.timer - d.fadeDur;
        var fadeLen = (d.fadeDur === DEATH_FADE_TIME)
          ? DEATH_FADE_TIME
          : 3.0; // 3s normal fade window
        var t = elapsed / fadeLen;

        if (t >= 1.0) {
          // Fully faded
          if (d.mesh) {
            if (_scene) _scene.remove(d.mesh);
            if (d.mesh.geometry) d.mesh.geometry.dispose();
            if (d.mesh.material) d.mesh.material.dispose();
            d.mesh = null;
          }
          if (d.light) {
            if (_scene) _scene.remove(d.light);
            d.light = null;
          }
          d.active  = false;
          d.enemyId = null;
          continue;
        }

        // Lerp opacity
        if (d.mesh && d.mesh.material) {
          d.mesh.material.opacity = d.baseOpacity * (1.0 - t);
        }
      }
    }
  }

  // ── Pulse animation for highlight light ──────────────────
  function _tickPulse(dt) {
    if (!_pulseLight || !_trackerActive) return;
    _pulsePhase += dt * 4.0; // 4 Hz pulse
    _pulseLight.intensity = 2.0 + Math.sin(_pulsePhase) * 1.5;
  }

  // ── Get player position from game globals ─────────────────
  function _getPlayerPos() {
    if (window.GameManager && window.GameManager.player) {
      var p = window.GameManager.player;
      var pos = p.position || (p.mesh && p.mesh.position) || null;
      if (pos) return { x: pos.x, z: pos.z };
    }
    if (window.player) {
      var pp = window.player.position || (window.player.mesh && window.player.mesh.position) || null;
      if (pp) return { x: pp.x, z: pp.z };
    }
    return null;
  }

  // ── Check dead enemies each frame ─────────────────────────
  function _tickDeaths() {
    if (!window.Enemies || typeof window.Enemies.getAll !== 'function') return;
    // We track which IDs are alive in enemyState; when the enemy disappears
    // from the alive list (alive===false or not in list), trigger death cleanup.
    // To avoid O(n^2) we check all states and confirm enemy still alive.
    for (var id in _enemyState) {
      if (!_enemyState.hasOwnProperty(id)) continue;
      // We don't hold a reference to the enemy object, only the ID.
      // The game's Enemies.getAll() only returns alive enemies, so if the id
      // is no longer found we treat it as dead.
      var found = false;
      var all   = window.Enemies.getAll();
      for (var i = 0; i < all.length; i++) {
        if (all[i]._btId == id) { found = true; break; }
      }
      if (!found) {
        _onEnemyDeath({ _btId: parseInt(id, 10) });
      }
    }
  }

  // ── Key listener ──────────────────────────────────────────
  function _onKeyDown(e) {
    // Alt+T
    if (e.altKey && (e.key === 't' || e.key === 'T')) {
      _trackerActive = !_trackerActive;
      _showHUD(_trackerActive);
      if (!_trackerActive && _pulseLight) {
        if (_scene) _scene.remove(_pulseLight);
        _pulseLight = null;
      }
    }
  }

  // ── Public: init ──────────────────────────────────────────
  function init(scene, camera) {
    _scene        = scene;
    _camera       = camera || null;
    _initialized  = true;
    _drops        = [];
    _enemyState   = {};
    _followedDrops = {};
    _btIdCounter  = 0;
    _trackerActive = false;
    _pingTimer    = 0;
    _pulsePhase   = 0;
    _pulseLight   = null;

    _createHUD();
    _createArrow();
    _showHUD(false);

    document.addEventListener('keydown', _onKeyDown);

    console.log('[BloodTrail] initialized — tracker ready (Alt+T to toggle)');
  }

  // ── Public: update ────────────────────────────────────────
  function update(dt) {
    if (!_initialized) return;
    if (!_getBleedEnabled()) return;
    if (!dt || dt <= 0) dt = 0.016;

    _tickDeaths();
    _tickEnemies(dt);
    _tickFades(dt);
    _tickPulse(dt);

    var playerPos = _getPlayerPos();
    if (playerPos) {
      _checkFollowing(playerPos.x, playerPos.z);
      if (_trackerActive) {
        _updateArrow(playerPos.x, playerPos.z);

        // Compass ping toward nearest wounded enemy
        _pingTimer += dt;
        if (_pingTimer >= PING_INTERVAL) {
          _pingTimer = 0;
          // Only ping if there are active drops
          var hasDrops = false;
          for (var i = 0; i < _drops.length; i++) {
            if (_drops[i] && _drops[i].active) { hasDrops = true; break; }
          }
          if (hasDrops) _emitPing();
        }
      }
    }
  }

  // ── Public: reset ─────────────────────────────────────────
  function reset() {
    // Remove all drops from scene
    for (var i = 0; i < _drops.length; i++) {
      var d = _drops[i];
      if (!d) continue;
      if (d.mesh) {
        if (_scene) _scene.remove(d.mesh);
        if (d.mesh.geometry) d.mesh.geometry.dispose();
        if (d.mesh.material) d.mesh.material.dispose();
        d.mesh = null;
      }
      if (d.light) {
        if (_scene) _scene.remove(d.light);
        d.light = null;
      }
    }
    _drops        = [];
    _enemyState   = {};
    _followedDrops = {};
    _btIdCounter  = 0;
    _pingTimer    = 0;
    _pulsePhase   = 0;

    if (_pulseLight) {
      if (_scene) _scene.remove(_pulseLight);
      _pulseLight = null;
    }

    _trackerActive = false;
    _showHUD(false);
  }

  return {
    init:   init,
    update: update,
    reset:  reset
  };

})();
