/* ============================================================
 *  RAILGUN.JS — Hyper-velocity piercing shot (Alt+R)
 *
 *  One shot per wave. Fires a coilgun slug along camera forward:
 *  hits every enemy within 1.8u of the ray (up to 60u), 250 dmg
 *  each — piercing through all targets simultaneously.
 *  Visual: thick cyan/white CylinderGeometry beam oriented along
 *  the view vector, bright full-screen flash, shake 0.65.
 *  "RAILGUN — X PENETRATED" HUD message.
 * ============================================================ */
var Railgun = (function () {
  'use strict';

  var BEAM_LENGTH   = 60;
  var HIT_RADIUS    = 1.8;
  var DAMAGE        = 250;
  var BEAM_DECAY    = 0.28;
  var STOCK_MAX     = 1;

  var _stock        = STOCK_MAX;
  var _waveWas      = -1;
  var _init         = false;
  var _lastTs       = 0;
  var _scene        = null;
  var _beams        = [];   /* { mesh, mat, glow, gMat, t, maxT } */
  var _flash        = null;
  var _hintEl       = null;

  function _getScene() {
    if (!_scene) {
      try { _scene = window.GameManager && GameManager.getScene ? GameManager.getScene() : null; } catch (e) {}
    }
    return _scene;
  }

  /* ── Hint ──────────────────────────────────── */
  function _buildHint() {
    _hintEl = document.createElement('div');
    _hintEl.id = 'railgun-hint';
    Object.assign(_hintEl.style, {
      position: 'fixed', bottom: '68px', left: '12px',
      fontFamily: "'Courier New', monospace", fontSize: '9px',
      letterSpacing: '1.5px', color: 'rgba(100,240,255,0.55)',
      zIndex: 250, pointerEvents: 'none', whiteSpace: 'nowrap'
    });
    _hintEl.textContent = '[Alt+R] RAILGUN ×' + _stock;
    document.body.appendChild(_hintEl);
  }

  /* ── Screen flash ──────────────────────────── */
  function _buildFlash() {
    _flash = document.createElement('div');
    Object.assign(_flash.style, {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(120,240,255,0.55)',
      zIndex: 320, pointerEvents: 'none', opacity: 0
    });
    document.body.appendChild(_flash);
  }

  /* ── Perpendicular dist from point to ray ─── */
  function _perpDist(px, py, pz, ox, oy, oz, dx, dy, dz) {
    /* Vector from origin to point */
    var ex = px - ox, ey = py - oy, ez = pz - oz;
    /* Project onto direction */
    var t = ex*dx + ey*dy + ez*dz;
    if (t < 0 || t > BEAM_LENGTH) return Infinity;
    /* Rejection */
    var rx = ex - t*dx, ry = ey - t*dy, rz = ez - t*dz;
    return Math.sqrt(rx*rx + ry*ry + rz*rz);
  }

  /* ── Spawn beam visual ─────────────────────── */
  function _spawnBeam(origin, dir) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return;
    try {
      /* Core beam */
      var geo = new THREE.CylinderGeometry(0.05, 0.05, BEAM_LENGTH, 6, 1);
      var mat = new THREE.MeshBasicMaterial({ color: 0x88eeff, transparent: true, opacity: 0.95, depthWrite: false });
      var mesh = new THREE.Mesh(geo, mat);

      /* Center the cylinder midway along the ray */
      var mid = new THREE.Vector3(
        origin.x + dir.x * BEAM_LENGTH * 0.5,
        origin.y + dir.y * BEAM_LENGTH * 0.5,
        origin.z + dir.z * BEAM_LENGTH * 0.5
      );
      mesh.position.copy(mid);

      /* Orient cylinder: default axis is +Y, we want it along dir */
      var upAxis = new THREE.Vector3(0, 1, 0);
      var beamDir = new THREE.Vector3(dir.x, dir.y, dir.z).normalize();
      mesh.quaternion.setFromUnitVectors(upAxis, beamDir);
      scene.add(mesh);

      /* Outer glow — wider, more transparent */
      var gGeo = new THREE.CylinderGeometry(0.18, 0.18, BEAM_LENGTH, 6, 1);
      var gMat = new THREE.MeshBasicMaterial({ color: 0x44ddff, transparent: true, opacity: 0.30, depthWrite: false });
      var glow = new THREE.Mesh(gGeo, gMat);
      glow.position.copy(mid);
      glow.quaternion.copy(mesh.quaternion);
      scene.add(glow);

      /* Point light at muzzle */
      var mlight = new THREE.PointLight(0x88eeff, 8.0, 10);
      mlight.position.copy(origin);
      scene.add(mlight);

      _beams.push({ mesh: mesh, mat: mat, glow: glow, gMat: gMat, mlight: mlight,
                    t: BEAM_DECAY, maxT: BEAM_DECAY, scene: scene });
    } catch (err) {}
  }

  /* ── Fire ──────────────────────────────────── */
  function _fire() {
    var player = window.player;
    if (!player || !player.position) return;

    var cam = null;
    try { cam = window.GameManager && GameManager.getCamera ? GameManager.getCamera() : null; } catch (e) {}
    if (!cam && typeof THREE === 'undefined') return;

    /* Ray direction */
    var fwd = new THREE.Vector3(0, 0, -1);
    if (cam) fwd.applyQuaternion(cam.quaternion).normalize();

    var ox = player.position.x, oy = player.position.y + 1.4, oz = player.position.z;
    var dx = fwd.x, dy = fwd.y, dz = fwd.z;

    /* Hit test all enemies */
    var hits = 0;
    try {
      if (typeof Enemies !== 'undefined' && Enemies.getAll) {
        var all = Enemies.getAll();
        for (var i = 0; i < all.length; i++) {
          var e = all[i];
          if (!e || e.dead || !e.mesh) continue;
          var pd = _perpDist(e.mesh.position.x, e.mesh.position.y, e.mesh.position.z,
                             ox, oy, oz, dx, dy, dz);
          if (pd < HIT_RADIUS) {
            e.hp = Math.max(0, e.hp - DAMAGE);
            hits++;
            /* Micro-explosion at hit point */
            var hp2 = { x: e.mesh.position.x, y: e.mesh.position.y + 0.8, z: e.mesh.position.z };
            try { if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion) Tracers.spawnExplosion(hp2, 0.5); } catch (ex) {}
          }
        }
      }
    } catch (err) {}

    /* Beam visual */
    _spawnBeam({ x: ox, y: oy, z: oz }, { x: dx, y: dy, z: dz });

    /* Screen flash */
    if (_flash) {
      _flash.style.opacity = 1;
      _flashT = 0.18;
    }

    /* Shake */
    try { if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(0.65, 0.22); } catch (e) {}

    /* Tracer sound substitute */
    try { if (typeof Tracers !== 'undefined' && Tracers.spawnTracer) {
      var end = { x: ox + dx*BEAM_LENGTH, y: oy + dy*BEAM_LENGTH, z: oz + dz*BEAM_LENGTH };
      Tracers.spawnTracer({ x: ox, y: oy, z: oz }, end);
    }} catch (e) {}

    /* HUD */
    var msg = hits > 0 ? ('⚡ RAILGUN — ' + hits + ' ENEMY' + (hits > 1 ? ' PENETRATED' : ' HIT')) : '⚡ RAILGUN — MISS';
    try { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup(msg); } catch (e) {}
  }

  var _flashT = 0;

  /* ── Activate ─────────────────────────────── */
  function _activate() {
    if (_stock <= 0) { try { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('RAILGUN — NO CHARGE'); } catch (e) {} return; }
    _stock--;
    _hintEl.textContent = '[Alt+R] RAILGUN ×' + _stock;
    _hintEl.style.color = _stock > 0 ? 'rgba(100,240,255,0.55)' : 'rgba(100,240,255,0.2)';
    _fire();
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
          _waveWas = w; _stock = STOCK_MAX;
          _hintEl.textContent = '[Alt+R] RAILGUN ×' + _stock;
          _hintEl.style.color = 'rgba(100,240,255,0.55)';
        }
      }
    } catch (e) {}

    /* Flash decay */
    if (_flashT > 0 && _flash) {
      _flashT -= dt;
      _flash.style.opacity = Math.max(0, _flashT / 0.18);
      if (_flashT <= 0) _flash.style.opacity = 0;
    }

    /* Beam decay */
    for (var bi = _beams.length - 1; bi >= 0; bi--) {
      var b = _beams[bi];
      b.t -= dt;
      var prog = Math.max(0, b.t / b.maxT);
      b.mat.opacity  = prog * 0.95;
      b.gMat.opacity = prog * 0.30;
      b.mlight.intensity = prog * 8.0;
      if (b.t <= 0) {
        b.scene.remove(b.mesh); b.mesh.geometry.dispose(); b.mat.dispose();
        b.scene.remove(b.glow); b.glow.geometry.dispose(); b.gMat.dispose();
        b.scene.remove(b.mlight);
        _beams.splice(bi, 1);
      }
    }
  }

  /* ── Key handler ──────────────────────────── */
  function _onKey(e) {
    if (e.code === 'KeyR' && e.altKey && !e.repeat) {
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

window.Railgun = Railgun;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { Railgun.init(); });
} else {
  Railgun.init();
}
