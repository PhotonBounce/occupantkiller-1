/* ============================================================
 *  TAKEDOWN.JS — Stealth melee execution system
 *
 *  When the player is within 2.5u of an enemy and approaching
 *  from behind (dot product of approach vs enemy facing ≤ −0.5),
 *  press F to trigger an instant silent kill:
 *    • Enemy dies immediately (no damage roll, no gunshot)
 *    • Blood burst VFX at position
 *    • "SILENT TAKEDOWN" banner + knife-slash CSS animation
 *    • +150 score, +stealth XP, radio call "target neutralised"
 *    • 2.5s cooldown per takedown
 *  "Ready" indicator appears at screen edge when takedown is possible.
 * ============================================================ */
var TakedownSystem = (function () {
  'use strict';

  /* ── Config ─────────────────────────────────── */
  var CFG = {
    RANGE:         2.5,   // max distance (units)
    BACKSTAB_DOT:  -0.35, // enemy-forward·to-enemy dot must be ≤ this (approaching from behind)
    COOLDOWN:      2.5,   // seconds between takedowns
    SCORE_BONUS:   150,
    PROMPT_RANGE:  3.5,   // show prompt at this range (wider than execute range)
  };

  /* ── State ──────────────────────────────────── */
  var _initialized  = false;
  var _cooldown     = 0;
  var _promptEl     = null;
  var _bannerEl     = null;
  var _slashEl      = null;
  var _targetCache  = null; // closest valid target this frame

  /* ── Helpers ────────────────────────────────── */
  var _tmpA = null, _tmpB = null, _tmpC = null;
  function _initTmp() {
    if (!_tmpA && typeof THREE !== 'undefined') {
      _tmpA = new THREE.Vector3();
      _tmpB = new THREE.Vector3();
      _tmpC = new THREE.Vector3();
    }
  }
  function _notify(msg, color) {
    try { if (window.HUD && HUD.notifyPickup) HUD.notifyPickup(msg, color || '#44ffaa'); } catch(e) {}
  }
  function _getCamera() {
    try { return window.GameManager && GameManager.getCamera ? GameManager.getCamera() : null; } catch(e) { return null; }
  }
  function _getPlayer() {
    try { return window.player || null; } catch(e) { return null; }
  }

  /* ── DOM elements ───────────────────────────── */
  function _buildUI() {
    // "TAKEDOWN READY" prompt
    _promptEl = document.createElement('div');
    _promptEl.id = 'takedown-prompt';
    _promptEl.style.cssText = [
      'display:none;position:fixed;right:24px;top:50%;transform:translateY(-50%);',
      'background:rgba(0,0,0,0.75);border:1px solid rgba(255,80,80,0.7);',
      'color:#ff5050;font-family:monospace;font-size:12px;font-weight:bold;',
      'padding:5px 12px;border-radius:5px;z-index:210;pointer-events:none;',
      'text-align:center;letter-spacing:0.08em;',
      'animation:takedownPulse 0.9s ease-in-out infinite alternate;',
    ].join('');
    _promptEl.innerHTML = '🔪 [F] TAKEDOWN';
    document.body.appendChild(_promptEl);

    // Knife-slash flash overlay
    _slashEl = document.createElement('div');
    _slashEl.id = 'takedown-slash';
    _slashEl.style.cssText = [
      'display:none;position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:300;',
      'background:radial-gradient(ellipse at 60% 50%,rgba(200,0,0,0.0) 30%,rgba(200,0,0,0.35) 100%);',
    ].join('');
    document.body.appendChild(_slashEl);

    // CSS keyframe
    var style = document.createElement('style');
    style.textContent = [
      '@keyframes takedownPulse{from{opacity:1;border-color:rgba(255,80,80,0.7)}to{opacity:0.5;border-color:rgba(255,80,80,0.3)}}',
      '@keyframes slashIn{0%{opacity:0;transform:scaleX(0.3)}15%{opacity:1}80%{opacity:0.6}100%{opacity:0;transform:scaleX(1)}}',
    ].join('\n');
    document.head.appendChild(style);
  }

  /* ── Flash the slash overlay ────────────────── */
  function _flashSlash() {
    if (!_slashEl) return;
    _slashEl.style.display = 'block';
    _slashEl.style.animation = 'none';
    void _slashEl.offsetWidth; // reflow
    _slashEl.style.animation = 'slashIn 0.35s ease-out forwards';
    setTimeout(function () { if (_slashEl) _slashEl.style.display = 'none'; }, 380);
  }

  /* ── Kill the target ─────────────────────────── */
  function _executeTarget(e) {
    if (!e || e.dead) return;
    // Instant kill via damageInRadius (radius 0 = point, huge damage)
    try {
      if (window.Enemies && Enemies.damageInRadius) {
        Enemies.damageInRadius(e.mesh.position, 0.5, 9999);
      }
    } catch(ex) {}

    // Blood burst VFX
    try {
      if (window.Tracers && Tracers.spawnBlood) {
        Tracers.spawnBlood(e.mesh.position, null);
        Tracers.spawnBlood(e.mesh.position, null);
      }
    } catch(ex) {}

    // Score
    try {
      var p = _getPlayer();
      if (p) {
        p.score = (p.score || 0) + CFG.SCORE_BONUS;
        if (window.HUD && HUD.setScore) HUD.setScore(p.score);
      }
    } catch(ex) {}

    // VFX slash + banner
    _flashSlash();
    _notify('🔪 SILENT TAKEDOWN  +' + CFG.SCORE_BONUS, '#ff5050');

    // Radio
    setTimeout(function () {
      try {
        if (window.Feedback && Feedback.radioChatter) Feedback.radioChatter('kill_streak');
        if (window.HUD && HUD.addCombatLog) HUD.addCombatLog('Target neutralised.', '#ff5050');
      } catch(e) {}
    }, 500);

    // Screen effects integration
    try {
      if (window.CameraSystem && CameraSystem.shake) CameraSystem.shake(0.04, 0.2);
    } catch(ex) {}

    _cooldown     = CFG.COOLDOWN;
    _targetCache  = null;
    if (_promptEl) _promptEl.style.display = 'none';
  }

  /* ── Find a valid takedown target ───────────── */
  function _findTarget() {
    _initTmp();
    if (!_tmpA) return null;
    var p  = _getPlayer();
    var cam = _getCamera();
    if (!p || !cam) return null;
    if (typeof Enemies === 'undefined' || !Enemies.getAll) return null;

    // Player forward (camera heading)
    var fwd = _tmpA.set(0, 0, -1).applyQuaternion(cam.quaternion);
    fwd.y = 0; fwd.normalize();

    var all  = Enemies.getAll();
    var best = null, bestDist = CFG.RANGE * 1.5;

    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (!e || !e.mesh || e.dead) continue;

      // Distance check
      var dx = e.mesh.position.x - p.position.x;
      var dz = e.mesh.position.z - p.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > CFG.PROMPT_RANGE) continue;

      // Backstab check — enemy must be facing away from player.
      // Use enemy mesh forward (negative Z rotated by enemy yaw)
      var eFwd = _tmpB.set(
        -Math.sin(e.mesh.rotation.y),
        0,
        -Math.cos(e.mesh.rotation.y)
      );
      // Vector from enemy to player
      var toPlayer = _tmpC.set(-dx, 0, -dz).normalize();
      // If dot(enemyFwd, toPlayer) ≤ CFG.BACKSTAB_DOT, player is behind enemy
      var dot = eFwd.dot(toPlayer);
      if (dot > CFG.BACKSTAB_DOT) continue; // enemy is facing player — not a backstab

      if (dist < bestDist) {
        bestDist = dist;
        best     = { enemy: e, dist: dist };
      }
    }
    return best;
  }

  /* ── Update loop ─────────────────────────────── */
  function update(dt) {
    if (_cooldown > 0) _cooldown -= dt;

    // Scan for target every frame
    var result = _findTarget();
    _targetCache = result ? result.enemy : null;

    // Show/hide prompt
    if (_promptEl) {
      var canExecute = _targetCache && _cooldown <= 0 && result && result.dist <= CFG.RANGE;
      _promptEl.style.display = canExecute ? 'block' : 'none';
    }
  }

  /* ── F key handler ───────────────────────────── */
  function _onKeyDown(e) {
    if (e.code !== 'KeyF') return;
    // Don't steal F from drone deploy / fortify if those are in other modules
    // Only trigger if we have a valid backstab target
    if (!_targetCache || _cooldown > 0) return;
    var p = _getPlayer();
    if (!p) return;
    // Re-check distance before executing
    var dx = _targetCache.mesh.position.x - p.position.x;
    var dz = _targetCache.mesh.position.z - p.position.z;
    if (dx * dx + dz * dz > CFG.RANGE * CFG.RANGE) return;
    e.stopPropagation();
    _executeTarget(_targetCache);
  }

  /* ── Init ────────────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;

    _buildUI();
    window.addEventListener('keydown', _onKeyDown, true);

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

window.TakedownSystem = TakedownSystem;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { TakedownSystem.init(); });
} else {
  TakedownSystem.init();
}
