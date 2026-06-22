/* ───────────────────────────────────────────────────────────────────────
   SUPPRESSION SYSTEM — enemies take cover when under heavy fire
   LMGs and full-auto fire suppress/pin enemies, reducing their
   effectiveness and making them crouch or retreat.
   ─────────────────────────────────────────────────────────────────────── */
window.SuppressionSystem = (function () {
  'use strict';

  // ── Private state ──────────────────────────────────────────────────
  var _camera = null;
  var _scene  = null;

  // Map from enemy reference to { labelEl, panicTimer, panicInterval }
  var _enemyData = [];   // array of { enemy, labelEl, panicTimer }

  // HUD element for "SUPPRESSING: X ENEMIES"
  var _hudEl = null;

  // Shared scratch Vector3 for projection (avoid alloc per frame)
  var _tmpV3 = null;

  // ── Thresholds ─────────────────────────────────────────────────────
  var SUPPRESSED_THRESHOLD = 30;
  var PINNED_THRESHOLD     = 70;
  var MAX_SUPPRESSION      = 100;
  var SHOT_SUPPRESSION_ADD = 15;   // points per nearby shot
  var DECAY_RATE           = 5;    // points/second decay
  var NEAR_SHOT_RADIUS     = 3;    // units — shots within this distance suppress

  // ── Scale targets for crouching animation ──────────────────────────
  var SCALE_NORMAL      = 1.0;
  var SCALE_SUPPRESSED  = 0.5;
  var SCALE_PINNED      = 0.4;
  var LERP_SPEED        = 6;       // scale lerp per second

  // ── Panic check interval for PINNED enemies ────────────────────────
  var PANIC_CHECK_INTERVAL = 2.0;  // seconds between panic rolls
  var PANIC_CHANCE         = 0.30; // 30% to flee each check

  // ── DOM helpers ────────────────────────────────────────────────────
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

  function _createHud() {
    _hudEl = _getOrCreate('suppressionHud', 'div', {
      position:    'fixed',
      bottom:      '60px',
      left:        '14px',
      fontFamily:  'monospace',
      fontSize:    '13px',
      color:       '#ff8800',
      background:  'rgba(0,0,0,0.65)',
      padding:     '4px 10px',
      borderRadius:'4px',
      border:      '1px solid #ff8800',
      zIndex:      '4800',
      display:     'none',
      pointerEvents: 'none',
      letterSpacing: '1px'
    });
  }

  function _createLabel(state) {
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;font-family:monospace;font-size:12px;font-weight:bold;' +
      'pointer-events:none;z-index:4700;transform:translateX(-50%);' +
      'background:rgba(0,0,0,0.55);padding:1px 5px;border-radius:3px;display:none;';
    el.textContent = (state === 'PINNED') ? 'PINNED' : 'SUPPRESSED';
    el.style.color  = (state === 'PINNED') ? '#ff2222' : '#ff8800';
    document.body.appendChild(el);
    return el;
  }

  // ── 3D → 2D label repositioning ────────────────────────────────────
  function _updateLabelPos(entry) {
    var enemy  = entry.enemy;
    var labelEl = entry.labelEl;
    if (!labelEl || !enemy || !enemy.mesh || !_camera) return;

    if (!_tmpV3) _tmpV3 = new THREE.Vector3();

    _tmpV3.set(
      enemy.mesh.position.x,
      enemy.mesh.position.y + 2.2,
      enemy.mesh.position.z
    );
    _tmpV3.project(_camera);

    // Behind camera
    if (_tmpV3.z > 1) {
      labelEl.style.display = 'none';
      return;
    }

    var sx = (_tmpV3.x *  0.5 + 0.5) * window.innerWidth;
    var sy = (_tmpV3.y * -0.5 + 0.5) * window.innerHeight;

    labelEl.style.left    = sx + 'px';
    labelEl.style.top     = (sy - 20) + 'px';
    labelEl.style.display = 'block';
  }

  // ── Ensure enemy tracking entry exists ─────────────────────────────
  function _getEntry(enemy) {
    for (var i = 0; i < _enemyData.length; i++) {
      if (_enemyData[i].enemy === enemy) return _enemyData[i];
    }
    return null;
  }

  function _ensureEntry(enemy) {
    var entry = _getEntry(enemy);
    if (!entry) {
      entry = {
        enemy:      enemy,
        labelEl:    null,   // created on demand when state changes
        panicTimer: 0
      };
      _enemyData.push(entry);
    }
    return entry;
  }

  function _removeEntry(entry) {
    if (entry.labelEl && entry.labelEl.parentNode) {
      entry.labelEl.parentNode.removeChild(entry.labelEl);
    }
    var idx = _enemyData.indexOf(entry);
    if (idx >= 0) _enemyData.splice(idx, 1);
  }

  // ── Init enemy suppression properties ──────────────────────────────
  function _initEnemy(enemy) {
    if (enemy._suppressionLevel === undefined) enemy._suppressionLevel = 0;
    if (enemy._suppressionState === undefined) enemy._suppressionState = 'NORMAL';
    if (enemy._suppressionDecayTimer === undefined) enemy._suppressionDecayTimer = 0;
  }

  // ── Apply suppression from a single shot ───────────────────────────
  // Called by game-manager via window._onShotFired hook.
  // shotPos: THREE.Vector3 origin of shot
  // shotDir: THREE.Vector3 normalized direction
  function applySuppressionFromShot(shotPos, shotDir) {
    if (typeof window.Enemies === 'undefined' || !window.Enemies.getAll) return;
    var all = window.Enemies.getAll();

    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (!e || !e.alive || !e.mesh) continue;
      _initEnemy(e);

      // Distance from enemy position to the shot ray
      var ep = e.mesh.position;
      var dx = ep.x - shotPos.x;
      var dy = ep.y - shotPos.y;
      var dz = ep.z - shotPos.z;

      // Project enemy onto ray: t = dot(ep - shotPos, shotDir)
      var t = dx * shotDir.x + dy * shotDir.y + dz * shotDir.z;

      // Closest point on ray to enemy (clamp t >= 0; ray goes forward only)
      var cx, cy, cz;
      if (t <= 0) {
        cx = shotPos.x; cy = shotPos.y; cz = shotPos.z;
      } else {
        cx = shotPos.x + shotDir.x * t;
        cy = shotPos.y + shotDir.y * t;
        cz = shotPos.z + shotDir.z * t;
      }

      var perpDx = ep.x - cx;
      var perpDy = ep.y - cy;
      var perpDz = ep.z - cz;
      var dist   = Math.sqrt(perpDx*perpDx + perpDy*perpDy + perpDz*perpDz);

      if (dist <= NEAR_SHOT_RADIUS) {
        e._suppressionLevel = Math.min(MAX_SUPPRESSION, (e._suppressionLevel || 0) + SHOT_SUPPRESSION_ADD);
        e._suppressionDecayTimer = 0; // reset decay window on each hit
        _ensureEntry(e);
      }
    }
  }

  // ── Public getter ───────────────────────────────────────────────────
  function getSuppression(enemy) {
    if (!enemy) return 0;
    return enemy._suppressionLevel || 0;
  }

  // ── Init ────────────────────────────────────────────────────────────
  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;
    _enemyData = [];
    _createHud();

    // Register shot-fired hook so game-manager can trigger us
    window._onShotFired = function (shotPos, shotDir) {
      applySuppressionFromShot(shotPos, shotDir);
    };
  }

  // ── Lerp helper ─────────────────────────────────────────────────────
  function _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // ── Update (called every frame) ─────────────────────────────────────
  function update(delta, player) {
    if (!delta || delta <= 0) return;

    var suppressedCount = 0;

    // Purge stale entries for dead enemies
    for (var k = _enemyData.length - 1; k >= 0; k--) {
      var ed = _enemyData[k];
      if (!ed.enemy || !ed.enemy.alive) {
        _removeEntry(ed);
      }
    }

    // Retrieve live enemies
    var all = [];
    if (typeof window.Enemies !== 'undefined' && window.Enemies.getAll) {
      all = window.Enemies.getAll();
    }

    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (!e || !e.alive || !e.mesh) continue;
      _initEnemy(e);

      // ── Decay suppression over time ──────────────────────────────
      e._suppressionDecayTimer += delta;
      // Decay starts after 0.25s without being shot at
      if (e._suppressionDecayTimer > 0.25) {
        e._suppressionLevel = Math.max(0, e._suppressionLevel - DECAY_RATE * delta);
      }

      // ── Determine state ──────────────────────────────────────────
      var prevState = e._suppressionState;
      var newState;

      if (e._suppressionLevel >= PINNED_THRESHOLD) {
        newState = 'PINNED';
      } else if (e._suppressionLevel >= SUPPRESSED_THRESHOLD) {
        newState = 'SUPPRESSED';
      } else {
        newState = 'NORMAL';
      }
      e._suppressionState = newState;

      // ── Count suppressed/pinned for HUD ─────────────────────────
      if (newState === 'SUPPRESSED' || newState === 'PINNED') {
        suppressedCount++;
      }

      // ── Apply behavioral effects ─────────────────────────────────
      if (newState === 'SUPPRESSED') {
        // Slow movement — set _speedMult (already read by enemies.js)
        e._speedMult = 0.30;   // 70% slower means 30% of base
        // Shoot less often: extend attackTimer so they fire half as often
        if (e.attackTimer !== undefined) {
          e.attackTimer += delta * 0.5;   // adds half a second extra cooldown per frame? No — reduce fire rate
        }
        // Hold position: do not advance — enemies.js reads _suppressionActive for speedMult=0 already
        // We use _speedMult instead to allow slight movement
      } else if (newState === 'PINNED') {
        // Complete stop
        e._speedMult = 0;
        // Force attackTimer high to block shooting while pinned
        if (e.attackTimer !== undefined && e.attackRate !== undefined) {
          e.attackTimer = Math.max(e.attackTimer, e.attackRate * 2);
        }
      } else {
        // Restore normal speed mult if we set it
        // Only reset if it was us who set it (check if still at our suppression value)
        if (e._speedMult === 0.30 || e._speedMult === 0) {
          e._speedMult = 1.0;
        }
      }

      // ── Crouch animation (scale.y lerp) ─────────────────────────
      if (e.mesh && e.mesh.scale) {
        var targetScaleY;
        if (newState === 'PINNED') {
          targetScaleY = SCALE_PINNED;
        } else if (newState === 'SUPPRESSED') {
          targetScaleY = SCALE_SUPPRESSED;
        } else {
          targetScaleY = SCALE_NORMAL;
        }
        var lerpFactor = Math.min(1, LERP_SPEED * delta);
        e.mesh.scale.y = _lerp(e.mesh.scale.y, targetScaleY, lerpFactor);
      }

      // ── PINNED: jitter + panic retreat ──────────────────────────
      if (newState === 'PINNED' && e.mesh) {
        // Jitter position slightly each frame
        e.mesh.position.x += (Math.random() - 0.5) * 0.05;
        e.mesh.position.z += (Math.random() - 0.5) * 0.05;

        // Panic check every PANIC_CHECK_INTERVAL seconds
        var entry = _ensureEntry(e);
        entry.panicTimer = (entry.panicTimer || 0) + delta;
        if (entry.panicTimer >= PANIC_CHECK_INTERVAL) {
          entry.panicTimer = 0;
          if (Math.random() < PANIC_CHANCE) {
            // Trigger panic retreat: use existing retreating flag + timer
            if (!e.retreating && player && player.position) {
              e.retreating = true;
              e._retreatTimer = 2.5 + Math.random() * 1.5;
              e._flankAssigned = false;
              e._flankDx = undefined;
              e._flankDz = undefined;
            }
          }
        }
      }

      // ── Manage floating label ────────────────────────────────────
      var labelEntry = _ensureEntry(e);

      if (newState === 'NORMAL') {
        // Hide label
        if (labelEntry.labelEl) {
          labelEntry.labelEl.style.display = 'none';
        }
      } else {
        // Show/update label
        if (!labelEntry.labelEl || labelEntry.labelEl._state !== newState) {
          // Remove old label if state changed
          if (labelEntry.labelEl && labelEntry.labelEl.parentNode) {
            labelEntry.labelEl.parentNode.removeChild(labelEntry.labelEl);
          }
          labelEntry.labelEl = _createLabel(newState);
          labelEntry.labelEl._state = newState;
        }
        _updateLabelPos(labelEntry);
      }

      // ── State transition cleanup ────────────────────────────────
      if (prevState !== 'NORMAL' && newState === 'NORMAL') {
        // Fully restored — reset panic timer
        if (labelEntry) labelEntry.panicTimer = 0;
      }
    }

    // ── Update HUD ─────────────────────────────────────────────────
    window._suppressedEnemyCount = suppressedCount;

    if (!_hudEl) _createHud();
    if (suppressedCount > 0) {
      _hudEl.textContent = 'SUPPRESSING: ' + suppressedCount + ' ' + (suppressedCount === 1 ? 'ENEMY' : 'ENEMIES');
      _hudEl.style.display = 'block';
    } else {
      _hudEl.style.display = 'none';
    }
  }

  // ── Reset (called between waves/stages) ────────────────────────────
  function reset() {
    // Remove all label DOM nodes
    for (var i = 0; i < _enemyData.length; i++) {
      var ed = _enemyData[i];
      if (ed.labelEl && ed.labelEl.parentNode) {
        ed.labelEl.parentNode.removeChild(ed.labelEl);
      }
    }
    _enemyData = [];
    window._suppressedEnemyCount = 0;
    if (_hudEl) _hudEl.style.display = 'none';
  }

  // ── Public API ──────────────────────────────────────────────────────
  return {
    init:                    init,
    update:                  update,
    applySuppressionFromShot: applySuppressionFromShot,
    getSuppression:          getSuppression,
    reset:                   reset
  };
})();
