/**
 * ballistic-calculator.js — Advanced Ballistic Calculator & Long-Range Shooting
 * Three.js FPS game (Ukraine-conflict theme)
 *
 * Features:
 *   - Press C to toggle ballistic calculator HUD overlay (bottom-left)
 *   - HUD shows: distance, drop compensation (MOA), wind drift, time of flight,
 *     optimal range band (green zone indicator)
 *   - Hold-over reticle: offset dot above crosshair showing aim correction
 *   - Mil-dot scope graphic overlay when calculator active
 *   - Alt+C  → range finder (lock target range, auto-adjust next 3 shots)
 *   - Shift+C → DOPE table (Data On Previous Engagements)
 *   - Long-range mode (>40 units): parabolic bullet trajectory with drop & wind drift
 *   - Penetration warning if wall detected between player and target
 *   - Shot trace: thin red particle trail persists 3 s after firing
 *   - Sniper patience bonus: 3 s still → +25% accuracy toast
 *
 * IIFE pattern, all var (never let/const).
 * Exports: window.BallisticCalculator  { init, update, getCalculatorData, applyBallisticDrop, reset }
 *
 * Globals read (optional):
 *   window.WeatherSystem.getModifiers()  — { windX, windZ, ... }
 *   window._playerVelocity               — THREE.Vector3 of player movement speed
 *   window._onBulletFired                — hook called by game { origin, direction, weaponType }
 *   window._lastShotHit                  — { hit: bool, point: THREE.Vector3 } set by game
 */
window.BallisticCalculator = (function () {
  'use strict';

  /* ── Constants ──────────────────────────────────────────────────────────── */
  var GRAVITY          = 9.81;          /* m/s² */
  var MUZZLE_VELOCITY  = 900;           /* m/s default (sniper-class) */
  var WIND_DRIFT_K     = 0.003;         /* x-offset per unit dist per windX */
  var DROP_PER_UNIT    = 0.05;          /* y vel adjust per unit distance (long-range) */
  var LONG_RANGE_THRESH = 40;           /* units: beyond this → parabolic mode */
  var MOA_PER_UNIT     = 0.95;          /* approximate MOA / metre at 100m baseline */
  var PATIENCE_STILL_TIME = 3.0;        /* seconds stationary required */
  var PATIENCE_BONUS_MULT = 1.25;
  var SHOT_TRACE_LIFE  = 3.0;           /* seconds shot trace persists */
  var RANGE_LOCK_SHOTS = 3;             /* auto-adjust shots after range lock */
  var PENETRATION_MATS = {              /* material id → penetration % */
    WOOD:     85,
    DRYWALL:  90,
    BRICK:    45,
    CONCRETE: 25,
    METAL:    15,
    DEFAULT:  65
  };
  var OPTIMAL_RANGE_MIN = 80;           /* units — green zone */
  var OPTIMAL_RANGE_MAX = 300;          /* units — green zone */

  /* ── Module state ────────────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _raycaster = null;
  var _inited = false;

  /* Calculator on/off */
  var _calcActive = false;

  /* DOPE panel on/off */
  var _dopeActive = false;

  /* Range lock state */
  var _rangeLocked      = false;
  var _rangeLockDist    = 0;
  var _rangeLockShots   = 0;

  /* Patience bonus */
  var _patienceTimer    = 0;
  var _patienceReady    = false;
  var _lastPlayerPos    = null;
  var _patienceToastTimer = 0;

  /* Current frame calculator data */
  var _calcData = {
    distance:      0,
    dropMOA:       0,
    windDriftMOA:  0,
    timeOfFlight:  0,
    inOptimalRange: false,
    penetration:   null,
    windX:         0
  };

  /* DOPE log */
  var _dopeLog = [];               /* [{ dist, result, drift }] */

  /* Shot traces (THREE.Line objects) */
  var _shotTraces = [];            /* [{ line, timeLeft }] */

  /* DOM elements */
  var _hudEl        = null;        /* main HUD panel */
  var _scopeEl      = null;        /* mil-dot scope overlay */
  var _holdoverEl   = null;        /* hold-over reticle dot */
  var _dopeEl       = null;        /* DOPE table panel */
  var _toastEl      = null;        /* patience toast */

  /* Keyboard modifiers */
  var _altDown   = false;
  var _shiftDown = false;

  /* Previous bullet-fired hook */
  var _prevOnBulletFired = null;

  /* ── MOA / ballistics helpers ────────────────────────────────────────────── */

  /**
   * Time of flight for a given range (horizontal dist) at muzzle velocity.
   * Simple horizontal flight time (ignoring drag).
   */
  function _timeOfFlight(dist) {
    return dist / MUZZLE_VELOCITY;
  }

  /**
   * Bullet drop in metres at a given range.
   * Uses kinematic: drop = 0.5 * g * t²
   */
  function _bulletDrop(dist) {
    var t = _timeOfFlight(dist);
    return 0.5 * GRAVITY * t * t;
  }

  /**
   * Convert metres of drop at a given range to MOA adjustment needed.
   * 1 MOA ≈ 2.908 cm at 100 m → (drop_m / dist_m) * (100/2.908e-2) / 100
   * Simplified: MOA = (drop_m / dist_m) * 3438
   */
  function _dropToMOA(dropM, distM) {
    if (distM <= 0) return 0;
    return (dropM / distM) * 3438;
  }

  /**
   * Wind drift in metres at range for given wind speed (m/s lateral).
   */
  function _windDrift(dist, windX) {
    var t = _timeOfFlight(dist);
    return windX * t;
  }

  /**
   * Wind drift in MOA.
   */
  function _windDriftMOA(dist, windX) {
    var drift = _windDrift(dist, windX);
    return _dropToMOA(Math.abs(drift), Math.max(dist, 1));
  }

  /* ── Apply ballistic drop to a velocity vector (public API) ──────────────── */

  /**
   * applyBallisticDrop(vel, dist)
   * Mutates vel THREE.Vector3 — adjusts y for drop, x for wind drift.
   * Only applied when dist > LONG_RANGE_THRESH.
   * Returns modified vel.
   */
  function applyBallisticDrop(vel, dist) {
    if (!vel || dist <= LONG_RANGE_THRESH) return vel;
    var windX = _getWindX();
    vel.y -= DROP_PER_UNIT * dist;
    vel.x += windX * dist * WIND_DRIFT_K;
    return vel;
  }

  /* ── Wind helper ──────────────────────────────────────────────────────────── */

  function _getWindX() {
    try {
      if (window.WeatherSystem && typeof window.WeatherSystem.getModifiers === 'function') {
        var mods = window.WeatherSystem.getModifiers();
        return mods ? (mods.windX || 0) : 0;
      }
    } catch (e) {}
    return window._windX || 0;
  }

  /* ── Raycaster: find distance to crosshair target ────────────────────────── */

  function _getCrosshairHit(scene, camera) {
    if (!camera || !scene) return null;
    if (!_raycaster) _raycaster = new THREE.Raycaster();
    _raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    var hits = _raycaster.intersectObjects(scene.children, true);
    if (hits && hits.length > 0) return hits[0];
    return null;
  }

  /**
   * Check if there is an intervening object between camera and target.
   * Returns penetration % string or null.
   */
  function _checkPenetration(scene, camera, targetDist) {
    if (!camera || !scene) return null;
    if (!_raycaster) _raycaster = new THREE.Raycaster();
    _raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    var hits = _raycaster.intersectObjects(scene.children, true);
    if (!hits || hits.length < 2) return null;
    /* More than one hit before the target distance means cover */
    var coverHit = hits[0];
    if (coverHit.distance >= targetDist - 0.5) return null;
    /* Guess material from object name or userData */
    var matType = 'DEFAULT';
    if (coverHit.object) {
      var name = (coverHit.object.name || '').toUpperCase();
      var ud   = coverHit.object.userData || {};
      if (ud.material) matType = String(ud.material).toUpperCase();
      else if (name.indexOf('WOOD')     !== -1) matType = 'WOOD';
      else if (name.indexOf('DRYWALL')  !== -1) matType = 'DRYWALL';
      else if (name.indexOf('BRICK')    !== -1) matType = 'BRICK';
      else if (name.indexOf('CONCRETE') !== -1) matType = 'CONCRETE';
      else if (name.indexOf('METAL')    !== -1) matType = 'METAL';
    }
    var pct = PENETRATION_MATS[matType] !== undefined
      ? PENETRATION_MATS[matType]
      : PENETRATION_MATS.DEFAULT;
    return pct;
  }

  /* ── Shot trace (Three.js line) ──────────────────────────────────────────── */

  function _addShotTrace(origin, direction, dist) {
    if (!_scene) return;
    var end = direction.clone().multiplyScalar(dist > 0 ? dist : 200).add(origin);
    var points = [origin.clone(), end];
    var geom = new THREE.BufferGeometry().setFromPoints(points);
    var mat  = new THREE.LineBasicMaterial({
      color:       0xff2222,
      transparent: true,
      opacity:     0.75,
      linewidth:   1
    });
    var line = new THREE.Line(geom, mat);
    _scene.add(line);
    _shotTraces.push({ line: line, timeLeft: SHOT_TRACE_LIFE });
  }

  function _updateShotTraces(delta) {
    var i = _shotTraces.length - 1;
    for (; i >= 0; i--) {
      var t = _shotTraces[i];
      t.timeLeft -= delta;
      /* Fade opacity */
      t.line.material.opacity = Math.max(0, (t.timeLeft / SHOT_TRACE_LIFE) * 0.75);
      if (t.timeLeft <= 0) {
        _scene.remove(t.line);
        t.line.geometry.dispose();
        t.line.material.dispose();
        _shotTraces.splice(i, 1);
      }
    }
  }

  /* ── Patience bonus ──────────────────────────────────────────────────────── */

  function _updatePatience(delta) {
    var playerPos = null;
    try {
      if (window._playerPosition) playerPos = window._playerPosition.clone();
      else if (window._player && window._player.position) playerPos = window._player.position.clone();
    } catch (e) {}

    if (!playerPos) { _patienceTimer = 0; return; }

    if (!_lastPlayerPos) {
      _lastPlayerPos = playerPos;
      _patienceTimer = 0;
      return;
    }

    var moved = playerPos.distanceTo(_lastPlayerPos);
    _lastPlayerPos = playerPos;

    if (moved < 0.005) {
      _patienceTimer += delta;
      if (_patienceTimer >= PATIENCE_STILL_TIME) {
        _patienceReady = true;
      }
    } else {
      _patienceTimer = 0;
      _patienceReady = false;
    }

    if (_patienceToastTimer > 0) {
      _patienceToastTimer -= delta;
      if (_patienceToastTimer <= 0 && _toastEl) {
        _toastEl.style.display = 'none';
      }
    }
  }

  /* ── Bullet fired hook ───────────────────────────────────────────────────── */

  function _onFired(data) {
    /* Call original hook first if it existed */
    if (_prevOnBulletFired && typeof _prevOnBulletFired === 'function') {
      _prevOnBulletFired(data);
    }

    /* Shot trace */
    if (data && data.origin && data.direction) {
      _addShotTrace(data.origin, data.direction, _calcData.distance || 200);
    }

    /* Patience bonus toast */
    if (_patienceReady) {
      _showToast('PATIENCE BONUS +25% ACCURACY');
      _patienceReady = false;
      _patienceTimer = 0;
      /* Expose multiplier for external systems */
      window._patienceAccuracyMult = PATIENCE_BONUS_MULT;
    } else {
      window._patienceAccuracyMult = 1.0;
    }

    /* Range lock shot countdown */
    if (_rangeLocked && _rangeLockShots > 0) {
      _rangeLockShots--;
      if (_rangeLockShots <= 0) {
        _rangeLocked = false;
        _updateHUDRangeLockIndicator();
      }
    }

    /* Log to DOPE — result will be updated by _lastShotHit */
    var entry = {
      dist:   Math.round(_calcData.distance),
      result: 'PENDING',
      drift:  _calcData.windDriftMOA.toFixed(1)
    };
    _dopeLog.unshift(entry);
    if (_dopeLog.length > 20) _dopeLog.pop();

    /* After a short delay, resolve hit/miss from _lastShotHit */
    setTimeout(function () {
      try {
        if (window._lastShotHit) {
          entry.result = window._lastShotHit.hit ? 'HIT' : 'MISS';
        } else {
          entry.result = '?';
        }
        if (_dopeActive) _renderDOPETable();
      } catch (e) {}
    }, 200);
  }

  /* ── DOM builders ────────────────────────────────────────────────────────── */

  function _buildStyles() {
    var old = document.getElementById('ballisticCalcStyles');
    if (old) old.parentNode.removeChild(old);

    var s = document.createElement('style');
    s.id = 'ballisticCalcStyles';
    s.textContent = [
      '/* Ballistic Calculator HUD */',
      '#ballisticHUD {',
      '  display: none;',
      '  position: fixed;',
      '  bottom: 80px;',
      '  left: 16px;',
      '  z-index: 800;',
      '  background: rgba(0,0,0,0.68);',
      '  border: 1px solid rgba(80,220,100,0.55);',
      '  border-radius: 6px;',
      '  padding: 10px 14px;',
      '  min-width: 210px;',
      '  font-family: "Courier New", monospace;',
      '  font-size: 12px;',
      '  color: #b8ffb0;',
      '  pointer-events: none;',
      '  user-select: none;',
      '}',
      '#ballisticHUD .bc-title {',
      '  font-size: 10px;',
      '  letter-spacing: 2px;',
      '  color: #55ff88;',
      '  margin-bottom: 6px;',
      '  text-transform: uppercase;',
      '}',
      '#ballisticHUD .bc-row {',
      '  display: flex;',
      '  justify-content: space-between;',
      '  margin: 2px 0;',
      '}',
      '#ballisticHUD .bc-label {',
      '  color: #80c080;',
      '}',
      '#ballisticHUD .bc-val {',
      '  color: #eeffee;',
      '  font-weight: bold;',
      '}',
      '#ballisticHUD .bc-optimal {',
      '  margin-top: 6px;',
      '  height: 6px;',
      '  background: #222;',
      '  border-radius: 3px;',
      '  overflow: hidden;',
      '  position: relative;',
      '}',
      '#ballisticHUD .bc-optimal-fill {',
      '  height: 100%;',
      '  width: 0%;',
      '  background: #00cc44;',
      '  border-radius: 3px;',
      '  transition: width 0.15s, background 0.3s;',
      '}',
      '#ballisticHUD .bc-cover-warn {',
      '  margin-top: 6px;',
      '  color: #ff8844;',
      '  font-size: 11px;',
      '}',
      '#ballisticHUD .bc-lock {',
      '  margin-top: 5px;',
      '  color: #ffee44;',
      '  font-size: 11px;',
      '}',

      '/* Mil-dot scope overlay */',
      '#ballisticScope {',
      '  display: none;',
      '  position: fixed;',
      '  top: 0; left: 0; right: 0; bottom: 0;',
      '  z-index: 790;',
      '  pointer-events: none;',
      '  user-select: none;',
      '}',
      '#ballisticScope canvas {',
      '  width: 100%;',
      '  height: 100%;',
      '  display: block;',
      '}',

      '/* Hold-over reticle */',
      '#ballisticHoldover {',
      '  display: none;',
      '  position: fixed;',
      '  z-index: 801;',
      '  pointer-events: none;',
      '  user-select: none;',
      '  width: 10px;',
      '  height: 10px;',
      '  border-radius: 50%;',
      '  border: 2px solid rgba(255,80,80,0.9);',
      '  box-shadow: 0 0 4px #ff4444;',
      '  transform: translate(-50%, -50%);',
      '}',

      '/* DOPE table */',
      '#ballisticDOPE {',
      '  display: none;',
      '  position: fixed;',
      '  top: 50%;',
      '  left: 50%;',
      '  transform: translate(-50%, -50%);',
      '  z-index: 850;',
      '  background: rgba(0,0,0,0.88);',
      '  border: 1px solid rgba(80,180,120,0.6);',
      '  border-radius: 8px;',
      '  padding: 18px 24px;',
      '  min-width: 320px;',
      '  font-family: "Courier New", monospace;',
      '  font-size: 12px;',
      '  color: #ccffcc;',
      '  pointer-events: none;',
      '}',
      '#ballisticDOPE .dope-title {',
      '  font-size: 13px;',
      '  letter-spacing: 2px;',
      '  color: #55ff88;',
      '  margin-bottom: 10px;',
      '  text-align: center;',
      '}',
      '#ballisticDOPE table {',
      '  width: 100%;',
      '  border-collapse: collapse;',
      '}',
      '#ballisticDOPE th {',
      '  color: #55dd77;',
      '  border-bottom: 1px solid #335533;',
      '  padding: 3px 8px;',
      '  text-align: left;',
      '}',
      '#ballisticDOPE td {',
      '  padding: 2px 8px;',
      '  color: #b8ffb0;',
      '}',
      '#ballisticDOPE .hit  { color: #44ff88; }',
      '#ballisticDOPE .miss { color: #ff5544; }',
      '#ballisticDOPE .pending { color: #ffcc44; }',

      '/* Patience toast */',
      '#ballisticToast {',
      '  display: none;',
      '  position: fixed;',
      '  top: 38%;',
      '  left: 50%;',
      '  transform: translateX(-50%);',
      '  z-index: 900;',
      '  background: rgba(0,60,0,0.85);',
      '  border: 1px solid #00ff88;',
      '  border-radius: 5px;',
      '  padding: 8px 22px;',
      '  font-family: "Courier New", monospace;',
      '  font-size: 14px;',
      '  font-weight: bold;',
      '  color: #00ff88;',
      '  letter-spacing: 1px;',
      '  pointer-events: none;',
      '  text-shadow: 0 0 8px #00ff44;',
      '}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function _buildHUD() {
    var old = document.getElementById('ballisticHUD');
    if (old) old.parentNode.removeChild(old);

    var el = document.createElement('div');
    el.id = 'ballisticHUD';
    el.innerHTML = [
      '<div class="bc-title">[ BALLISTIC CALCULATOR ]</div>',
      '<div class="bc-row"><span class="bc-label">DIST</span>      <span class="bc-val" id="bcDist">---</span></div>',
      '<div class="bc-row"><span class="bc-label">DROP</span>      <span class="bc-val" id="bcDrop">---</span></div>',
      '<div class="bc-row"><span class="bc-label">WIND DRIFT</span><span class="bc-val" id="bcWind">---</span></div>',
      '<div class="bc-row"><span class="bc-label">TOF</span>       <span class="bc-val" id="bcTOF">---</span></div>',
      '<div class="bc-row"><span class="bc-label">RANGE BAND</span><span class="bc-val" id="bcBand">---</span></div>',
      '<div class="bc-optimal"><div class="bc-optimal-fill" id="bcOptFill"></div></div>',
      '<div class="bc-cover-warn" id="bcCover" style="display:none"></div>',
      '<div class="bc-lock"      id="bcLock"  style="display:none"></div>'
    ].join('');
    document.body.appendChild(el);
    _hudEl = el;
  }

  function _buildScopeOverlay() {
    var old = document.getElementById('ballisticScope');
    if (old) old.parentNode.removeChild(old);

    var el = document.createElement('div');
    el.id = 'ballisticScope';

    var canvas = document.createElement('canvas');
    canvas.id = 'ballisticScopeCanvas';
    el.appendChild(canvas);
    document.body.appendChild(el);
    _scopeEl = el;

    _drawMilDotScope(canvas);
  }

  function _drawMilDotScope(canvas) {
    /* Defer drawing until layout is available */
    setTimeout(function () {
      var W = window.innerWidth  || 800;
      var H = window.innerHeight || 600;
      canvas.width  = W;
      canvas.height = H;
      var cx = W / 2;
      var cy = H / 2;
      var r  = Math.min(W, H) * 0.42;

      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, W, H);

      /* Dark vignette outside circle */
      ctx.fillStyle = 'rgba(0,0,0,0.88)';
      ctx.fillRect(0, 0, W, H);

      /* Clear the scope circle */
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.clearRect(0, 0, W, H);

      /* Faint green tint */
      ctx.fillStyle = 'rgba(0,20,5,0.35)';
      ctx.fillRect(0, 0, W, H);

      /* Crosshair lines */
      ctx.strokeStyle = 'rgba(0,200,60,0.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - r, cy); ctx.lineTo(cx - r * 0.12, cy);
      ctx.moveTo(cx + r * 0.12, cy); ctx.lineTo(cx + r, cy);
      ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy - r * 0.12);
      ctx.moveTo(cx, cy + r * 0.12); ctx.lineTo(cx, cy + r);
      ctx.stroke();

      /* Mil-dot grid — dots every 5% of radius along axes */
      var milSpacing = r * 0.10;
      ctx.fillStyle = 'rgba(0,200,60,0.9)';
      var dotR = 2.5;
      var i;
      /* Horizontal mil-dots */
      for (i = -5; i <= 5; i++) {
        if (i === 0) continue;
        var dx = cx + i * milSpacing;
        ctx.beginPath();
        ctx.arc(dx, cy, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
      /* Vertical mil-dots */
      for (i = -5; i <= 5; i++) {
        if (i === 0) continue;
        var dy = cy + i * milSpacing;
        ctx.beginPath();
        ctx.arc(cx, dy, dotR, 0, Math.PI * 2);
        ctx.fill();
      }

      /* Scope circle border */
      ctx.restore();
      ctx.strokeStyle = 'rgba(0,200,60,0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      /* Range stadia at bottom of reticle */
      ctx.fillStyle = 'rgba(0,200,60,0.75)';
      ctx.font = '11px "Courier New"';
      ctx.textAlign = 'center';
      ctx.fillText('BALLISTIC CALC ACTIVE', cx, cy + r * 0.80);
    }, 50);
  }

  function _buildHoldoverReticle() {
    var old = document.getElementById('ballisticHoldover');
    if (old) old.parentNode.removeChild(old);
    var el = document.createElement('div');
    el.id = 'ballisticHoldover';
    document.body.appendChild(el);
    _holdoverEl = el;
  }

  function _buildDOPEPanel() {
    var old = document.getElementById('ballisticDOPE');
    if (old) old.parentNode.removeChild(old);
    var el = document.createElement('div');
    el.id = 'ballisticDOPE';
    document.body.appendChild(el);
    _dopeEl = el;
  }

  function _buildToast() {
    var old = document.getElementById('ballisticToast');
    if (old) old.parentNode.removeChild(old);
    var el = document.createElement('div');
    el.id = 'ballisticToast';
    document.body.appendChild(el);
    _toastEl = el;
  }

  /* ── HUD update helpers ──────────────────────────────────────────────────── */

  function _setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function _updateHUD() {
    if (!_hudEl) return;

    var d   = _calcData;
    var dist = d.distance;

    _setText('bcDist', dist > 0 ? dist.toFixed(1) + ' m'      : '---');
    _setText('bcDrop', d.dropMOA > 0 ? d.dropMOA.toFixed(1) + ' MOA UP' : '---');
    _setText('bcWind', d.windDriftMOA > 0
      ? d.windDriftMOA.toFixed(1) + ' MOA ' + (d.windX >= 0 ? 'R' : 'L')
      : '0.0 MOA');
    _setText('bcTOF', d.timeOfFlight > 0 ? d.timeOfFlight.toFixed(3) + ' s' : '---');
    _setText('bcBand', d.inOptimalRange ? 'OPTIMAL' : (dist < OPTIMAL_RANGE_MIN ? 'TOO CLOSE' : 'BEYOND'));

    /* Optimal range fill bar */
    var fillEl = document.getElementById('bcOptFill');
    if (fillEl) {
      var pct = 0;
      if (dist >= OPTIMAL_RANGE_MIN && dist <= OPTIMAL_RANGE_MAX) {
        pct = 100;
        fillEl.style.background = '#00cc44';
      } else if (dist < OPTIMAL_RANGE_MIN) {
        pct = (dist / OPTIMAL_RANGE_MIN) * 60;
        fillEl.style.background = '#ccaa00';
      } else {
        pct = Math.max(0, 100 - ((dist - OPTIMAL_RANGE_MAX) / OPTIMAL_RANGE_MAX) * 100);
        fillEl.style.background = '#cc4400';
      }
      fillEl.style.width = Math.min(100, Math.max(0, pct)) + '%';
    }

    /* Cover warning */
    var coverEl = document.getElementById('bcCover');
    if (coverEl) {
      if (d.penetration !== null) {
        coverEl.style.display = '';
        coverEl.textContent = 'COVER PENETRATION: ' + d.penetration + '%';
      } else {
        coverEl.style.display = 'none';
      }
    }

    _updateHUDRangeLockIndicator();
  }

  function _updateHUDRangeLockIndicator() {
    var lockEl = document.getElementById('bcLock');
    if (!lockEl) return;
    if (_rangeLocked && _rangeLockShots > 0) {
      lockEl.style.display = '';
      lockEl.textContent = 'RANGE LOCK: ' + _rangeLockDist.toFixed(0) + 'm  [' + _rangeLockShots + ' shots]';
    } else {
      lockEl.style.display = 'none';
    }
  }

  /* ── Hold-over reticle position ─────────────────────────────────────────── */

  function _updateHoldoverReticle() {
    if (!_holdoverEl) return;
    if (!_calcActive || _calcData.distance <= 0) {
      _holdoverEl.style.display = 'none';
      return;
    }

    var W  = window.innerWidth  || 800;
    var H  = window.innerHeight || 600;
    var cx = W / 2;
    var cy = H / 2;

    /* Drop compensation in pixels:
       Use MOA to pixel conversion. At screen center 1 MOA ≈ screen_height / (2 * tan(FOV/2 * deg2rad)) * pi / 10800
       Simplified: assume ~0.5 px per MOA at normal FOV for a rough indicator. */
    var fov     = (_camera && _camera.fov) ? _camera.fov : 75;
    var pxPerMOA = (H / 2) / (Math.tan((fov / 2) * (Math.PI / 180)) * 3438);
    var offsetPx = _calcData.dropMOA * pxPerMOA;

    /* Clamp to reasonable screen range */
    offsetPx = Math.max(0, Math.min(offsetPx, H * 0.35));

    _holdoverEl.style.display   = 'block';
    _holdoverEl.style.left      = cx + 'px';
    _holdoverEl.style.top       = (cy - offsetPx) + 'px';
  }

  /* ── DOPE table render ───────────────────────────────────────────────────── */

  function _renderDOPETable() {
    if (!_dopeEl) return;
    var rows = _dopeLog.length === 0
      ? '<tr><td colspan="3" style="text-align:center;color:#558855;">No data yet</td></tr>'
      : _dopeLog.map(function (e) {
          var cls = e.result === 'HIT' ? 'hit' : e.result === 'MISS' ? 'miss' : 'pending';
          return '<tr>' +
            '<td>' + e.dist + ' m</td>' +
            '<td class="' + cls + '">' + e.result + '</td>' +
            '<td>' + e.drift + ' MOA</td>' +
            '</tr>';
        }).join('');

    _dopeEl.innerHTML = [
      '<div class="dope-title">[ D.O.P.E. — DATA ON PREVIOUS ENGAGEMENTS ]</div>',
      '<table>',
      '<tr><th>DIST</th><th>RESULT</th><th>DRIFT CORR</th></tr>',
      rows,
      '</table>'
    ].join('');
  }

  /* ── Toast helper ────────────────────────────────────────────────────────── */

  function _showToast(msg) {
    if (!_toastEl) return;
    _toastEl.textContent = msg;
    _toastEl.style.display = 'block';
    _patienceToastTimer = 2.5;
  }

  /* ── Keyboard handler ────────────────────────────────────────────────────── */

  function _onKeyDown(e) {
    if (e.key === 'Alt' || e.code === 'AltLeft' || e.code === 'AltRight') {
      _altDown = true;
    }
    if (e.key === 'Shift' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      _shiftDown = true;
    }

    if (e.code === 'KeyC' || e.key === 'c' || e.key === 'C') {
      if (_altDown) {
        /* Alt+C → range finder lock */
        e.preventDefault();
        _doRangeLock();
        return;
      }
      if (_shiftDown) {
        /* Shift+C → DOPE table toggle */
        e.preventDefault();
        _toggleDOPE();
        return;
      }
      /* C → toggle calculator */
      e.preventDefault();
      _toggleCalculator();
    }
  }

  function _onKeyUp(e) {
    if (e.key === 'Alt' || e.code === 'AltLeft' || e.code === 'AltRight') {
      _altDown = false;
    }
    if (e.key === 'Shift' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      _shiftDown = false;
    }
  }

  /* ── Calculator toggle ───────────────────────────────────────────────────── */

  function _toggleCalculator() {
    _calcActive = !_calcActive;
    if (_hudEl)   _hudEl.style.display   = _calcActive ? 'block' : 'none';
    if (_scopeEl) _scopeEl.style.display = _calcActive ? 'block' : 'none';
    if (!_calcActive) {
      if (_holdoverEl) _holdoverEl.style.display = 'none';
    }
  }

  /* ── DOPE toggle ─────────────────────────────────────────────────────────── */

  function _toggleDOPE() {
    _dopeActive = !_dopeActive;
    if (_dopeEl) {
      if (_dopeActive) {
        _renderDOPETable();
        _dopeEl.style.display = 'block';
      } else {
        _dopeEl.style.display = 'none';
      }
    }
  }

  /* ── Range lock ──────────────────────────────────────────────────────────── */

  function _doRangeLock() {
    var dist = _calcData.distance;
    if (dist <= 0) return;
    _rangeLocked    = true;
    _rangeLockDist  = dist;
    _rangeLockShots = RANGE_LOCK_SHOTS;
    _showToast('RANGE LOCKED: ' + dist.toFixed(0) + ' m  (3 auto-aim shots)');
    _updateHUDRangeLockIndicator();
    /* Expose for weapon systems to read */
    window._ballisticRangeLock = {
      active:   true,
      distance: _rangeLockDist,
      shots:    _rangeLockShots
    };
  }

  /* ── Per-frame update ────────────────────────────────────────────────────── */

  function update(delta) {
    if (!_inited) return;

    delta = delta || (1 / 60);

    /* Patience tracking */
    _updatePatience(delta);

    /* Shot trace fade */
    _updateShotTraces(delta);

    /* Recalculate ballistic data */
    var hit = _getCrosshairHit(_scene, _camera);
    var dist = 0;
    if (hit) {
      dist = hit.distance;
    } else if (_rangeLocked) {
      dist = _rangeLockDist;
    }

    var windX = _getWindX();
    var dropM = _bulletDrop(dist);
    var dropMOA = _dropToMOA(dropM, Math.max(dist, 1));
    var wdriftMOA = _windDriftMOA(dist, windX);
    var tof = _timeOfFlight(dist);

    var pen = null;
    if (dist > 0) {
      pen = _checkPenetration(_scene, _camera, dist);
    }

    _calcData.distance      = dist;
    _calcData.dropMOA       = dropMOA;
    _calcData.windDriftMOA  = wdriftMOA;
    _calcData.timeOfFlight  = tof;
    _calcData.inOptimalRange = (dist >= OPTIMAL_RANGE_MIN && dist <= OPTIMAL_RANGE_MAX);
    _calcData.penetration   = pen;
    _calcData.windX         = windX;

    /* Update range lock shots counter in public window object */
    if (window._ballisticRangeLock) {
      window._ballisticRangeLock.active   = _rangeLocked;
      window._ballisticRangeLock.shots    = _rangeLockShots;
    }

    if (_calcActive) {
      _updateHUD();
      _updateHoldoverReticle();
    }

    if (_patienceToastTimer > 0) {
      _patienceToastTimer -= delta;
      if (_patienceToastTimer <= 0 && _toastEl) {
        _toastEl.style.display = 'none';
      }
    }
  }

  /* ── Public: getCalculatorData ───────────────────────────────────────────── */

  function getCalculatorData() {
    return {
      distance:       _calcData.distance,
      dropMOA:        _calcData.dropMOA,
      windDriftMOA:   _calcData.windDriftMOA,
      timeOfFlight:   _calcData.timeOfFlight,
      inOptimalRange: _calcData.inOptimalRange,
      penetration:    _calcData.penetration,
      windX:          _calcData.windX,
      patienceReady:  _patienceReady,
      rangeLocked:    _rangeLocked,
      rangeLockDist:  _rangeLockDist,
      rangeLockShots: _rangeLockShots
    };
  }

  /* ── Init ────────────────────────────────────────────────────────────────── */

  function init(scene, camera) {
    if (_inited) reset();

    _scene  = scene  || null;
    _camera = camera || null;

    _buildStyles();
    _buildHUD();
    _buildScopeOverlay();
    _buildHoldoverReticle();
    _buildDOPEPanel();
    _buildToast();

    /* Intercept bullet fired hook */
    _prevOnBulletFired = window._onBulletFired || null;
    window._onBulletFired = _onFired;

    /* Keyboard */
    document.addEventListener('keydown', _onKeyDown, false);
    document.addEventListener('keyup',   _onKeyUp,   false);

    /* Expose range lock container */
    window._ballisticRangeLock = { active: false, distance: 0, shots: 0 };

    _inited = true;
  }

  /* ── Reset ───────────────────────────────────────────────────────────────── */

  function reset() {
    _calcActive   = false;
    _dopeActive   = false;
    _rangeLocked  = false;
    _rangeLockDist  = 0;
    _rangeLockShots = 0;
    _patienceTimer  = 0;
    _patienceReady  = false;
    _lastPlayerPos  = null;
    _patienceToastTimer = 0;
    _dopeLog = [];
    _altDown  = false;
    _shiftDown = false;

    /* Remove shot traces */
    var i;
    for (i = _shotTraces.length - 1; i >= 0; i--) {
      if (_scene) _scene.remove(_shotTraces[i].line);
      _shotTraces[i].line.geometry.dispose();
      _shotTraces[i].line.material.dispose();
    }
    _shotTraces = [];

    /* Hide DOM elements */
    if (_hudEl)      _hudEl.style.display      = 'none';
    if (_scopeEl)    _scopeEl.style.display    = 'none';
    if (_holdoverEl) _holdoverEl.style.display = 'none';
    if (_dopeEl)     _dopeEl.style.display     = 'none';
    if (_toastEl)    _toastEl.style.display    = 'none';

    /* Restore previous bullet fired hook */
    if (_prevOnBulletFired !== null) {
      window._onBulletFired = _prevOnBulletFired;
    }
    _prevOnBulletFired = null;

    if (_inited) {
      document.removeEventListener('keydown', _onKeyDown, false);
      document.removeEventListener('keyup',   _onKeyUp,   false);
    }

    _inited = false;
  }

  /* ── Public API ──────────────────────────────────────────────────────────── */

  return {
    init:               init,
    update:             update,
    getCalculatorData:  getCalculatorData,
    applyBallisticDrop: applyBallisticDrop,
    reset:              reset
  };

})();
