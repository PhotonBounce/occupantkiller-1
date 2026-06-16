/* ============================================================
 *  AIRSTRIKE.JS — Player close-air-support call
 *  Press F5 to enter targeting mode. Click to mark target.
 *  A Su-25 strafing run sweeps 10 explosions across a 60-unit
 *  corridor through the target, 250ms apart.
 *  One use per wave; 45-second cooldown.
 *  Hooks: Tracers.spawnExplosion, Enemies.damageInRadius,
 *         GameManager.getCamera/getScene (for raycast).
 * ============================================================ */
var AirstrikeSystem = (function () {
  'use strict';

  /* ── Config ───────────────────────────────── */
  var CFG = {
    COOLDOWN:       45,    // seconds between strikes
    DELAY_SEC:      3.5,   // radio-to-impact delay
    BOMB_COUNT:     10,    // explosions in the strafing run
    BOMB_INTERVAL:  220,   // ms between bombs
    BOMB_RADIUS:    8,     // enemy damage radius per bomb
    BOMB_DAMAGE:    130,   // per-bomb damage
    EXPL_VFX_SCALE: 4.5,  // visual scale passed to Tracers
    SPREAD:         6,     // lateral scatter each bomb
    SWEEP_LEN:      60,    // total run length (units)
    CAM_SHAKE:      0.18,  // per-explosion camera shake
  };

  /* ── State ────────────────────────────────── */
  var _initialized    = false;
  var _targeting      = false;   // targeting cursor active
  var _cooldownTimer  = 0;       // seconds remaining
  var _usedThisWave   = false;
  var _inboundTimer   = 0;       // countdown to impact
  var _pendingTarget  = null;    // THREE.Vector3

  /* ── DOM elements ────────────────────────── */
  var _cursor   = null;  // targeting reticle overlay
  var _hudBar   = null;  // cooldown / status bar

  /* ── Helpers ─────────────────────────────── */
  function _el(id) { return document.getElementById(id); }

  function _notify(msg, color) {
    try { if (window.HUD && HUD.notifyPickup) HUD.notifyPickup(msg, color || '#ff8800'); } catch(e) {}
  }

  function _shake() {
    try {
      if (window.CameraSystem && CameraSystem.shake) CameraSystem.shake(CFG.CAM_SHAKE, 0.4);
    } catch(e) {}
  }

  function _getCamera() {
    try { return window.GameManager && GameManager.getCamera ? GameManager.getCamera() : null; } catch(e) { return null; }
  }

  /* ── Targeting cursor ───────────────────── */
  function _showCursor(visible) {
    if (!_cursor) return;
    _cursor.style.display = visible ? 'block' : 'none';
    document.body.style.cursor = visible ? 'none' : '';
  }

  function _moveCursor(e) {
    if (!_targeting || !_cursor) return;
    _cursor.style.left = (e.clientX - 30) + 'px';
    _cursor.style.top  = (e.clientY - 30) + 'px';
  }

  /* ── HUD bar ─────────────────────────────── */
  function _updateHUDBar() {
    if (!_hudBar) return;
    if (_usedThisWave && _cooldownTimer > 0) {
      _hudBar.textContent = '✈ CAS ' + Math.ceil(_cooldownTimer) + 's';
      _hudBar.style.color = '#ff8800';
      _hudBar.style.display = 'block';
    } else if (!_usedThisWave) {
      _hudBar.textContent = '✈ CAS [F5]';
      _hudBar.style.color = '#44ffaa';
      _hudBar.style.display = 'block';
    } else {
      _hudBar.style.display = 'none';
    }
  }

  /* ── Raycast to world ───────────────────── */
  function _raycastGround(screenX, screenY) {
    var cam = _getCamera();
    if (!cam || typeof THREE === 'undefined') return null;
    var w = window.innerWidth, h = window.innerHeight;
    var ndc = new THREE.Vector2(
      (screenX / w) * 2 - 1,
      -(screenY / h) * 2 + 1
    );
    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(ndc, cam);
    // Try terrain height — fall back to y=0 ground plane
    var groundY = 0;
    try {
      if (window.VoxelWorld && VoxelWorld.getTerrainHeight) {
        // Estimate ground at a reasonable distance along the ray
        var dir = raycaster.ray.direction;
        var pos = raycaster.ray.origin;
        if (dir.y < -0.01) {
          var t = (groundY - pos.y) / dir.y;
          if (t > 0 && t < 400) {
            return new THREE.Vector3(
              pos.x + dir.x * t,
              groundY,
              pos.z + dir.z * t
            );
          }
        }
      }
    } catch(e) {}
    // Fallback: intersect y=0 plane
    var plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    var result = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, result);
    return result.lengthSq() > 0 ? result : null;
  }

  /* ── Execute the strike ─────────────────── */
  function _executeStrike(target) {
    _notify('💥 AIRSTRIKE INBOUND!', '#ff4400');
    _shake();

    // Determine sweep direction based on camera heading
    var cam = _getCamera();
    var sweepDirX = 1, sweepDirZ = 0;
    if (cam) {
      var fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
      fwd.y = 0; fwd.normalize();
      sweepDirX = fwd.x;
      sweepDirZ = fwd.z;
    }

    var tx = target.x, tz = target.z;
    var step = CFG.SWEEP_LEN / (CFG.BOMB_COUNT - 1);

    for (var i = 0; i < CFG.BOMB_COUNT; i++) {
      (function (idx) {
        setTimeout(function () {
          // Position along sweep axis + lateral scatter
          var along  = (idx - (CFG.BOMB_COUNT - 1) / 2) * step;
          var across = (Math.random() - 0.5) * CFG.SPREAD;
          var bx = tx + sweepDirX * along - sweepDirZ * across;
          var bz = tz + sweepDirZ * along + sweepDirX * across;
          var by = 0;
          try {
            if (window.VoxelWorld && VoxelWorld.getTerrainHeight) {
              by = VoxelWorld.getTerrainHeight(Math.round(bx), Math.round(bz)) || 0;
            }
          } catch (e) {}

          var pos = new THREE.Vector3(bx, by, bz);
          // VFX
          try {
            if (window.Tracers && Tracers.spawnExplosion) {
              Tracers.spawnExplosion(pos, CFG.EXPL_VFX_SCALE);
            }
          } catch (eV) {}
          // Damage
          try {
            if (window.Enemies && Enemies.damageInRadius) {
              Enemies.damageInRadius(pos, CFG.BOMB_RADIUS, CFG.BOMB_DAMAGE);
            }
          } catch (eD) {}
          // Camera shake on every hit
          _shake();
          // EMP flicker on screen-effects if available
          try {
            if (window.ScreenEffects && ScreenEffects.triggerEMP) ScreenEffects.triggerEMP();
          } catch (eE) {}
          // Audio
          try {
            if (window.AudioSystem) {
              if (AudioSystem.playExplosion) AudioSystem.playExplosion();
              else if (AudioSystem.playSound) AudioSystem.playSound('explosion');
            }
          } catch (eA) {}
        }, idx * CFG.BOMB_INTERVAL);
      })(i);
    }

    // Announce clear after run
    setTimeout(function () {
      _notify('✈ STRIKE COMPLETE', '#44ffaa');
    }, CFG.BOMB_COUNT * CFG.BOMB_INTERVAL + 500);
  }

  /* ── Targeting click handler ────────────── */
  function _onTargetClick(e) {
    if (!_targeting) return;
    e.preventDefault();
    e.stopPropagation();

    var worldPos = _raycastGround(e.clientX, e.clientY);
    if (!worldPos) {
      _notify('⚠ No ground target found', '#ffaa00');
      _cancelTargeting();
      return;
    }

    _pendingTarget = worldPos;
    _cancelTargeting();

    // Radio chatter countdown
    _notify('📻 ALPHA-ZULU, REQUESTING CAS — STAND BY', '#ffcc00');
    setTimeout(function () { _notify('📻 TALLY — INBOUND IN 2', '#ffcc00'); }, 1500);
    setTimeout(function () {
      if (_pendingTarget) {
        _executeStrike(_pendingTarget);
        _pendingTarget = null;
      }
    }, CFG.DELAY_SEC * 1000);

    _usedThisWave   = true;
    _cooldownTimer  = CFG.COOLDOWN;
    _updateHUDBar();
  }

  function _cancelTargeting() {
    _targeting = false;
    _showCursor(false);
    window.removeEventListener('click', _onTargetClick, true);
    window.removeEventListener('contextmenu', _onRightCancel, true);
  }

  function _onRightCancel(e) {
    e.preventDefault();
    _notify('✈ CAS targeting cancelled', '#888');
    _cancelTargeting();
  }

  /* ── Public: enter targeting mode ──────── */
  function requestStrike() {
    if (_usedThisWave && _cooldownTimer > 0) {
      _notify('✈ CAS COOLDOWN — ' + Math.ceil(_cooldownTimer) + 's', '#ff8800');
      return;
    }
    if (_targeting) { _cancelTargeting(); return; }

    _targeting = true;
    _showCursor(true);
    _notify('✈ CAS TARGETING — click to mark, RMB to cancel', '#44ffaa');
    window.addEventListener('click', _onTargetClick, true);
    window.addEventListener('contextmenu', _onRightCancel, true);
  }

  /* ── Wave reset ──────────────────────────── */
  function onWaveStart() {
    _usedThisWave = false;
    _updateHUDBar();
  }

  /* ── Update (call from main loop or rAF) ── */
  function update(dt) {
    if (_cooldownTimer > 0) {
      _cooldownTimer -= dt;
      if (_cooldownTimer <= 0) {
        _cooldownTimer = 0;
        _usedThisWave  = false;
        _notify('✈ CAS READY — F5', '#44ffaa');
      }
      _updateHUDBar();
    }
  }

  /* ── Init ────────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;

    // Targeting reticle cursor
    _cursor = document.createElement('div');
    _cursor.id = 'airstrike-cursor';
    _cursor.style.cssText = [
      'display:none;position:fixed;width:60px;height:60px;pointer-events:none;z-index:500;',
      'border:2px solid #ff4400;border-radius:50%;box-shadow:0 0 8px #ff4400,inset 0 0 6px rgba(255,68,0,0.3);',
      'animation:airstrikeReticlePulse 0.7s ease-in-out infinite alternate;'
    ].join('');
    // Cross-hairs
    _cursor.innerHTML =
      '<div style="position:absolute;top:50%;left:0;right:0;height:1px;background:#ff4400;transform:translateY(-50%)"></div>' +
      '<div style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:#ff4400;transform:translateX(-50%)"></div>' +
      '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:6px;height:6px;background:#ff4400;border-radius:50%"></div>';
    document.body.appendChild(_cursor);

    // CSS animation for reticle pulse
    var styleEl = document.createElement('style');
    styleEl.textContent = '@keyframes airstrikeReticlePulse{from{opacity:1;transform:scale(1)}to{opacity:0.5;transform:scale(1.12)}}';
    document.head.appendChild(styleEl);

    // CAS status HUD (top-center, beside existing HUD elements)
    _hudBar = document.createElement('div');
    _hudBar.id = 'airstrike-hud';
    _hudBar.style.cssText = [
      'display:none;position:fixed;top:32px;left:50%;transform:translateX(-50%);',
      'font-family:monospace;font-size:12px;color:#44ffaa;',
      'background:rgba(0,0,0,0.55);border:1px solid rgba(68,255,170,0.3);',
      'padding:2px 10px;border-radius:4px;z-index:210;pointer-events:none;',
      'letter-spacing:0.05em;'
    ].join('');
    document.body.appendChild(_hudBar);

    // Mouse move for cursor
    window.addEventListener('mousemove', _moveCursor);

    // F5 key
    window.addEventListener('keydown', function (e) {
      if (e.key === 'F5') {
        e.preventDefault();
        requestStrike();
      }
    });

    // Hook wave start if GameManager exposes events
    var _hookWave = function () {
      if (window.GameManager && GameManager.onWaveStart) {
        GameManager.onWaveStart(onWaveStart);
      }
    };
    setTimeout(_hookWave, 2000);

    // Self-driven cooldown update via rAF
    var _last = performance.now();
    function _tick(ts) {
      var dt = Math.min(0.1, (ts - _last) / 1000);
      _last = ts;
      update(dt);
      requestAnimationFrame(_tick);
    }
    requestAnimationFrame(_tick);

    _updateHUDBar();
  }

  return { init: init, requestStrike: requestStrike, onWaveStart: onWaveStart, update: update };
})();

window.AirstrikeSystem = AirstrikeSystem;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { AirstrikeSystem.init(); });
} else {
  AirstrikeSystem.init();
}
