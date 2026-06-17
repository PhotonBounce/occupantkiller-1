/* ============================================================
 *  QUANTUM-SHIFT.JS — Tactical phase teleport (Alt+Q)
 *
 *  Instantly teleports player 12u forward along camera look
 *  direction. Player Y snapped to terrain height.
 *  Visual: wireframe ghost box left at origin position (fades
 *  0.3s), blue-white screen flash, brief afterimage trail
 *  (3 translucent spheres along the travel path).
 *  "PHASE SHIFT" HUD message. 2 per wave, 12s cooldown.
 * ============================================================ */
var QuantumShift = (function () {
  'use strict';

  var SHIFT_DIST  = 12;
  var STOCK_MAX   = 2;
  var COOLDOWN    = 12.0;

  var _stock      = STOCK_MAX;
  var _cd         = 0;
  var _waveWas    = -1;
  var _init       = false;
  var _lastTs     = 0;
  var _scene      = null;

  var _ghosts     = [];   /* { meshes[], mats[], t, maxT } */
  var _flash      = null;
  var _flashT     = 0;
  var _hintEl     = null;

  function _getScene() {
    if (!_scene) {
      try { _scene = window.GameManager && GameManager.getScene ? GameManager.getScene() : null; } catch (e) {}
    }
    return _scene;
  }

  /* ── Hint ──────────────────────────────────── */
  function _buildHint() {
    _hintEl = document.createElement('div');
    _hintEl.id = 'qshift-hint';
    Object.assign(_hintEl.style, {
      position: 'fixed', bottom: '112px', left: '12px',
      fontFamily: "'Courier New', monospace", fontSize: '9px',
      letterSpacing: '1.5px', color: 'rgba(140,200,255,0.55)',
      zIndex: 250, pointerEvents: 'none', whiteSpace: 'nowrap'
    });
    _hintEl.textContent = '[Alt+Q] PHASE ×' + _stock;
    document.body.appendChild(_hintEl);
  }

  /* ── Screen flash overlay ──────────────────── */
  function _buildFlash() {
    _flash = document.createElement('div');
    Object.assign(_flash.style, {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(140,200,255,0.45)',
      zIndex: 330, pointerEvents: 'none', opacity: 0
    });
    document.body.appendChild(_flash);
  }

  /* ── Spawn ghost + afterimage trail ───────── */
  function _spawnGhost(fromPos, toPos, fwd) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return;
    try {
      var meshes = [], mats = [];

      /* Ghost wireframe at origin */
      var gGeo = new THREE.BoxGeometry(0.6, 1.8, 0.6);
      var gMat = new THREE.MeshBasicMaterial({ color: 0x88ccff, wireframe: true, transparent: true, opacity: 0.8 });
      var ghost = new THREE.Mesh(gGeo, gMat);
      ghost.position.set(fromPos.x, fromPos.y + 0.9, fromPos.z);
      scene.add(ghost);
      meshes.push(ghost); mats.push(gMat);

      /* Afterimage trail: 3 translucent spheres along path */
      for (var i = 1; i <= 3; i++) {
        var frac = i / 4;
        var tGeo = new THREE.SphereGeometry(0.22, 5, 4);
        var tMat = new THREE.MeshBasicMaterial({ color: 0xaaddff, transparent: true, opacity: 0.5 * (1 - frac * 0.4), depthWrite: false });
        var trail = new THREE.Mesh(tGeo, tMat);
        trail.position.set(
          fromPos.x + fwd.x * SHIFT_DIST * frac,
          fromPos.y + 0.9,
          fromPos.z + fwd.z * SHIFT_DIST * frac
        );
        scene.add(trail);
        meshes.push(trail); mats.push(tMat);
      }

      /* Arrival flash PointLight */
      var light = new THREE.PointLight(0x88ccff, 5.0, 8);
      light.position.set(toPos.x, toPos.y + 1, toPos.z);
      scene.add(light);

      _ghosts.push({ meshes: meshes, mats: mats, light: light, t: 0.32, maxT: 0.32, scene: scene });
    } catch (err) {}
  }

  /* ── Execute teleport ──────────────────────── */
  function _shift() {
    var player = window.player;
    if (!player || !player.position) return;

    var cam = null;
    try { cam = window.GameManager && GameManager.getCamera ? GameManager.getCamera() : null; } catch (e) {}
    if (typeof THREE === 'undefined') return;

    var fwd = new THREE.Vector3(0, 0, -1);
    if (cam) fwd.applyQuaternion(cam.quaternion).normalize();
    fwd.y = 0; fwd.normalize();   /* horizontal only */

    var fromX = player.position.x, fromY = player.position.y, fromZ = player.position.z;
    var toX   = fromX + fwd.x * SHIFT_DIST;
    var toZ   = fromZ + fwd.z * SHIFT_DIST;
    var toY   = fromY;
    try { if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) toY = VoxelWorld.getTerrainHeight(toX, toZ) + 1.0; } catch (e) {}

    _spawnGhost({ x: fromX, y: fromY, z: fromZ }, { x: toX, y: toY, z: toZ }, fwd);

    player.position.x = toX;
    player.position.y = toY;
    player.position.z = toZ;

    /* Flash */
    if (_flash) { _flash.style.opacity = 1; _flashT = 0.18; }

    /* Micro shake at arrival */
    try { if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(0.18, 0.10); } catch (e) {}

    try { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('⚡ PHASE SHIFT'); } catch (e) {}
  }

  /* ── Activate ─────────────────────────────── */
  function _activate() {
    if (_cd > 0)     { try { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('PHASE CD ' + Math.ceil(_cd) + 's'); } catch (e) {} return; }
    if (_stock <= 0) { try { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('PHASE — NO CHARGE'); } catch (e) {} return; }
    _stock--;
    _cd = COOLDOWN;
    _hintEl.textContent = '[Alt+Q] PHASE ×' + _stock;
    _hintEl.style.color = 'rgba(140,200,255,0.3)';
    _shift();
  }

  /* ── rAF tick ─────────────────────────────── */
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    /* Restock */
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        var w = GameManager.getCurrentWave();
        if (w !== _waveWas) {
          _waveWas = w; _stock = STOCK_MAX; _cd = 0;
          _hintEl.textContent = '[Alt+Q] PHASE ×' + _stock;
          _hintEl.style.color = 'rgba(140,200,255,0.55)';
        }
      }
    } catch (e) {}

    /* Cooldown */
    if (_cd > 0) {
      _cd = Math.max(0, _cd - dt);
      if (_cd === 0) { _hintEl.textContent = '[Alt+Q] PHASE ×' + _stock; _hintEl.style.color = 'rgba(140,200,255,0.55)'; }
    }

    /* Flash decay */
    if (_flashT > 0 && _flash) {
      _flashT -= dt;
      _flash.style.opacity = Math.max(0, _flashT / 0.18);
      if (_flashT <= 0) _flash.style.opacity = 0;
    }

    /* Ghost / trail decay */
    for (var gi = _ghosts.length - 1; gi >= 0; gi--) {
      var g = _ghosts[gi];
      g.t -= dt;
      var prog = Math.max(0, g.t / g.maxT);
      for (var mi = 0; mi < g.mats.length; mi++) g.mats[mi].opacity *= (1 - dt * 4);
      g.light.intensity = prog * 5.0;
      if (g.t <= 0) {
        for (var xi = 0; xi < g.meshes.length; xi++) {
          g.scene.remove(g.meshes[xi]);
          g.meshes[xi].geometry.dispose();
          g.mats[xi].dispose();
        }
        g.scene.remove(g.light);
        _ghosts.splice(gi, 1);
      }
    }
  }

  /* ── Key handler ──────────────────────────── */
  function _onKey(e) {
    if (e.code === 'KeyQ' && e.altKey && !e.repeat) {
      e.preventDefault();
      _activate();
    }
  }

  /* ── Init ─────────────────────────────────── */
  function init() {
    if (_init) return;
    _init = true;
    _buildHint();
    _buildFlash();
    window.addEventListener('keydown', _onKey);
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.QuantumShift = QuantumShift;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { QuantumShift.init(); });
} else {
  QuantumShift.init();
}
