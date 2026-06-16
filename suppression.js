/* ============================================================
 *  SUPPRESSION.JS — Enemy tactical suppression system
 *
 *  When 3+ player bullets pass within 4 units of an enemy in
 *  1.5 seconds, that enemy enters SUPPRESSED state:
 *    • visually ducks (mesh Y scale ×0.55 → they shrink low)
 *    • fires 60% less often (_rangedTimer inflated)
 *    • yellow "pinned" label appears above head
 *    • lateral cover-seek: slow shuffle perpendicular to threat
 *  State clears 3 seconds after last near-miss.
 *
 *  Hooks into Tracers.spawnTracer (monkey-patch) + poll Enemies.getAll().
 *  No enemies.js / game-manager.js edits needed.
 * ============================================================ */
var SuppressionSystem = (function () {
  'use strict';

  /* ── Config ────────────────────────────────────────────────── */
  var CFG = {
    NEAR_MISS_RADIUS:   4.0,   // units from bullet path → counts as near-miss
    SUPPRESS_THRESHOLD: 3,     // near-misses within window to suppress
    WINDOW_SEC:         1.5,   // near-miss sliding window
    SUPPRESS_DURATION:  3.0,   // seconds suppression lasts after last hit
    DUCK_SCALE_Y:       0.55,  // crouching Y scale
    FIRE_RATE_PENALTY:  2.8,   // multiplier on _rangedTimer while suppressed
    COVER_SPEED:        0.7,   // units/sec lateral shuffle
    LABEL_HEIGHT_OFFSET:2.6,   // above enemy pivot
    RADIO_PHRASES: [
      '📻 SUPPRESSED — TAKING FIRE!',
      '📻 PIN EM DOWN!',
      '📻 CONTACT — KEEP FIRING!',
      '📻 ENEMY PINNED!',
    ],
  };

  /* ── Internal state ─────────────────────────────────────────── */
  var _initialized  = false;
  var _patchApplied = false;

  // Map: enemy-object → { hits: [{t}], suppressedUntil, duckApplied, origScaleY, labelEl, coverDir }
  var _enemyData = new WeakMap();

  var _lastRadioTime = 0;

  /* ── Shared THREE temps ─────────────────────────────────────── */
  var _tmpA = null, _tmpB = null, _tmpC = null;

  function _initTmp() {
    if (!_tmpA && typeof THREE !== 'undefined') {
      _tmpA = new THREE.Vector3();
      _tmpB = new THREE.Vector3();
      _tmpC = new THREE.Vector3();
    }
  }

  /* ── Near-miss detection ─────────────────────────────────────── */
  // Returns true if point P is within radius of the infinite line through (origin, origin+dir)
  function _nearMiss(origin, dir, point, radius) {
    _tmpA.copy(point).sub(origin);
    var t = _tmpA.dot(dir);
    // Only check "in front" of bullet
    if (t < 0) return false;
    _tmpB.copy(dir).multiplyScalar(t);
    _tmpC.copy(_tmpA).sub(_tmpB);
    return _tmpC.lengthSq() <= radius * radius;
  }

  /* ── Pinned label element ───────────────────────────────────── */
  function _makeLabel() {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed;pointer-events:none;z-index:195;',
      'background:rgba(255,200,0,0.85);color:#000;font-weight:bold;',
      'font-size:10px;font-family:monospace;padding:1px 5px;border-radius:3px;',
      'transform:translateX(-50%);display:none;white-space:nowrap;',
    ].join('');
    el.textContent = 'SUPPRESSED';
    document.body.appendChild(el);
    return el;
  }

  /* ── Get/init per-enemy data ────────────────────────────────── */
  function _getData(e) {
    if (!_enemyData.has(e)) {
      _enemyData.set(e, {
        hits:          [],
        suppressedUntil: 0,
        duckApplied:   false,
        origScaleY:    e.mesh ? e.mesh.scale.y : 1,
        labelEl:       _makeLabel(),
        coverDir:      (Math.random() > 0.5 ? 1 : -1),
      });
    }
    return _enemyData.get(e);
  }

  /* ── Record a near-miss on enemy e ─────────────────────────── */
  function _recordNearMiss(e) {
    var d = _getData(e);
    var now = performance.now() / 1000;
    d.hits.push(now);
    // Trim old hits outside window
    var cutoff = now - CFG.WINDOW_SEC;
    while (d.hits.length && d.hits[0] < cutoff) d.hits.shift();

    if (d.hits.length >= CFG.SUPPRESS_THRESHOLD) {
      d.suppressedUntil = now + CFG.SUPPRESS_DURATION;
      // Radio chatter (throttled)
      if (now - _lastRadioTime > 4) {
        _lastRadioTime = now;
        try {
          var phrase = CFG.RADIO_PHRASES[Math.floor(Math.random() * CFG.RADIO_PHRASES.length)];
          if (window.HUD && HUD.notifyPickup) HUD.notifyPickup(phrase, '#ffcc00');
        } catch (eR) {}
      }
    }
  }

  /* ── Apply / remove duck ────────────────────────────────────── */
  function _applyDuck(e, d) {
    if (!e.mesh || d.duckApplied) return;
    d.origScaleY   = e.mesh.scale.y;
    e.mesh.scale.y = d.origScaleY * CFG.DUCK_SCALE_Y;
    d.duckApplied  = true;
    if (d.labelEl) d.labelEl.style.display = 'block';
  }

  function _removeDuck(e, d) {
    if (!d.duckApplied) return;
    if (e.mesh) e.mesh.scale.y = d.origScaleY;
    d.duckApplied = false;
    if (d.labelEl) d.labelEl.style.display = 'none';
  }

  /* ── Project enemy to screen for label ─────────────────────── */
  function _projectEnemy(e, camera) {
    if (!e.mesh || !camera) return null;
    _tmpA.copy(e.mesh.position);
    _tmpA.y += CFG.LABEL_HEIGHT_OFFSET;
    _tmpA.project(camera);
    var hw = window.innerWidth / 2, hh = window.innerHeight / 2;
    return {
      x: (_tmpA.x * hw + hw),
      y: (-_tmpA.y * hh + hh),
    };
  }

  /* ── Main update ─────────────────────────────────────────────── */
  function update(dt) {
    if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
    var all     = Enemies.getAll();
    var now     = performance.now() / 1000;
    var camera  = null;
    try { camera = window.GameManager && GameManager.getCamera ? GameManager.getCamera() : null; } catch(e) {}

    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (!e || !e.mesh || e.dead) continue;

      var d = _getData(e);
      var suppressed = now < d.suppressedUntil;

      if (suppressed) {
        // Visual duck
        _applyDuck(e, d);

        // Inflate fire cooldown while suppressed
        if (typeof e._rangedTimer === 'number' && e._rangedTimer < 0.5) {
          e._rangedTimer = 0.5 + Math.random() * 0.3;
        }

        // Lateral cover-seek shuffle
        if (!e._inVehicle && e.mesh) {
          var perp = _tmpB.set(d.coverDir, 0, -d.coverDir).normalize();
          e.mesh.position.x += perp.x * CFG.COVER_SPEED * dt;
          e.mesh.position.z += perp.z * CFG.COVER_SPEED * dt;
        }

        // Update suppressed label position
        if (d.labelEl && camera) {
          var sc = _projectEnemy(e, camera);
          if (sc && sc.x > 0 && sc.x < window.innerWidth && sc.y > 0 && sc.y < window.innerHeight) {
            d.labelEl.style.left = sc.x + 'px';
            d.labelEl.style.top  = (sc.y - 16) + 'px';
            d.labelEl.style.display = 'block';
          } else {
            d.labelEl.style.display = 'none';
          }
        }
      } else {
        // No longer suppressed
        if (d.duckApplied) _removeDuck(e, d);
        if (d.labelEl) d.labelEl.style.display = 'none';
      }
    }
  }

  /* ── Monkey-patch Tracers.spawnTracer ───────────────────────── */
  function _patchTracers() {
    if (_patchApplied || typeof Tracers === 'undefined') return;
    var _origSpawn = Tracers.spawnTracer;
    if (!_origSpawn) return;
    _patchApplied = true;

    Tracers.spawnTracer = function (origin, direction, color, speed) {
      _origSpawn.call(Tracers, origin, direction, color, speed);
      // Check if any enemy is near-missed by this bullet
      try {
        _initTmp();
        if (!_tmpA) return;
        if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
        var all = Enemies.getAll();
        if (!all || !all.length) return;
        // Normalise direction
        var dir = _tmpA.copy(direction).normalize();
        var r2  = CFG.NEAR_MISS_RADIUS * CFG.NEAR_MISS_RADIUS;
        for (var i = 0; i < all.length; i++) {
          var e = all[i];
          if (!e || !e.mesh || e.dead) continue;
          // Quick dist-squared pre-check
          var dx = e.mesh.position.x - origin.x;
          var dz = e.mesh.position.z - origin.z;
          if (dx*dx + dz*dz > 900) continue; // >30u away, skip
          if (_nearMiss(origin, dir, e.mesh.position, CFG.NEAR_MISS_RADIUS)) {
            _recordNearMiss(e);
          }
        }
      } catch (eS) {}
    };
  }

  /* ── Init ──────────────────────────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;

    // Attempt patch immediately, retry until Tracers is available
    var _attempts = 0;
    function _tryPatch() {
      if (typeof Tracers !== 'undefined' && Tracers.spawnTracer) {
        _patchTracers();
      } else if (_attempts++ < 30) {
        setTimeout(_tryPatch, 300);
      }
    }
    _tryPatch();

    // Self-driven update loop
    var _last = performance.now();
    function _tick(ts) {
      var dt = Math.min(0.1, (ts - _last) / 1000);
      _last  = ts;
      update(dt);
      requestAnimationFrame(_tick);
    }
    requestAnimationFrame(_tick);
  }

  return { init: init, update: update };
})();

window.SuppressionSystem = SuppressionSystem;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { SuppressionSystem.init(); });
} else {
  SuppressionSystem.init();
}
