/* ============================================================
 *  VORTEX-CANNON.JS — Directional wind blast (Alt+V)
 *
 *  Instant 60° forward-cone force burst, 20u range.
 *  Enemies inside: 40 dmg + strong push along view vector +
 *  upward pop (they fly back). Detection range zeroed for 1.5s.
 *  Visual: 3 cyan torus ring-waves travel outward along fwd,
 *  expanding in radius as they go, fading over 0.5s each.
 *  Distinct from force-blast (omnidirectional): this is aimed.
 *  2 per wave, 16s cooldown.
 * ============================================================ */
var VortexCannon = (function () {
  'use strict';

  var RANGE       = 20;
  var CONE_DOT    = 0.5;   /* cos(60°) — half-angle */
  var PUSH_FORCE  = 8.0;
  var LIFT        = 4.0;
  var DAMAGE      = 40;
  var STUN_DUR    = 1.5;
  var STOCK_MAX   = 2;
  var COOLDOWN    = 16.0;

  var _stock      = STOCK_MAX;
  var _cd         = 0;
  var _waveWas    = -1;
  var _init       = false;
  var _lastTs     = 0;
  var _scene      = null;

  var _rings      = [];     /* { mesh, mat, light, fwd, t, maxT, startPos } */
  var _stunList   = [];     /* { e, t, savedDet, savedRng } */
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
    _hintEl.id = 'vortex-hint';
    Object.assign(_hintEl.style, {
      position: 'fixed', bottom: '79px', left: '12px',
      fontFamily: "'Courier New', monospace", fontSize: '9px',
      letterSpacing: '1.5px', color: 'rgba(60,255,180,0.55)',
      zIndex: 250, pointerEvents: 'none', whiteSpace: 'nowrap'
    });
    _hintEl.textContent = '[Alt+V] VORTEX ×' + _stock;
    document.body.appendChild(_hintEl);
  }

  /* ── Spawn ring-wave ───────────────────────── */
  function _spawnRings(origin, fwd) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return;

    /* Orientation: default torus faces +Z; rotate so it faces fwd */
    var zAxis   = new THREE.Vector3(0, 0, 1);
    var fwdV    = new THREE.Vector3(fwd.x, fwd.y, fwd.z).normalize();
    var quat    = new THREE.Quaternion().setFromUnitVectors(zAxis, fwdV);

    for (var i = 0; i < 3; i++) {
      try {
        var geo  = new THREE.TorusGeometry(0.3, 0.04, 6, 28);
        var mat  = new THREE.MeshBasicMaterial({ color: 0x33ffcc, transparent: true, opacity: 0.85, depthWrite: false });
        var mesh = new THREE.Mesh(geo, mat);
        /* Stagger starting position so rings don't all start at same spot */
        var startDist = i * 3.5;
        mesh.position.set(
          origin.x + fwd.x * startDist,
          origin.y + fwd.y * startDist,
          origin.z + fwd.z * startDist
        );
        mesh.quaternion.copy(quat);
        scene.add(mesh);

        var light = new THREE.PointLight(0x33ffcc, 2.0 - i * 0.5, 8);
        light.position.copy(mesh.position);
        scene.add(light);

        var maxT = 0.50 + i * 0.05;
        _rings.push({
          mesh: mesh, mat: mat, light: light,
          fwd: fwdV.clone(),
          startDist: startDist,
          t: maxT, maxT: maxT,
          scene: scene,
          origin: { x: origin.x, y: origin.y, z: origin.z }
        });
      } catch (err) {}
    }
  }

  /* ── Fire the blast ─────────────────────────── */
  function _fire() {
    var player = window.player;
    if (!player || !player.position) return;

    var cam = null;
    try { cam = window.GameManager && GameManager.getCamera ? GameManager.getCamera() : null; } catch (e) {}
    if (typeof THREE === 'undefined') return;

    var fwd = new THREE.Vector3(0, 0, -1);
    if (cam) fwd.applyQuaternion(cam.quaternion).normalize();

    var ox = player.position.x, oy = player.position.y + 1.2, oz = player.position.z;

    /* Hit enemies in cone */
    var hits = 0;
    try {
      if (typeof Enemies !== 'undefined' && Enemies.getAll) {
        var all = Enemies.getAll();
        for (var i = 0; i < all.length; i++) {
          var e = all[i];
          if (!e || e.dead || !e.mesh) continue;

          var ex = e.mesh.position.x - ox;
          var ey = e.mesh.position.y - oy;
          var ez = e.mesh.position.z - oz;
          var dist = Math.sqrt(ex*ex + ey*ey + ez*ez);
          if (dist > RANGE || dist < 0.1) continue;

          var dot = (ex/dist)*fwd.x + (ey/dist)*fwd.y + (ez/dist)*fwd.z;
          if (dot < CONE_DOT) continue;

          /* Damage */
          e.hp = Math.max(0, e.hp - DAMAGE);
          hits++;

          /* Push: move mesh position directly along fwd + up */
          var pushDist = PUSH_FORCE * (1 - dist / RANGE);
          e.mesh.position.x += fwd.x * pushDist;
          e.mesh.position.y += LIFT * (1 - dist / RANGE);
          e.mesh.position.z += fwd.z * pushDist;

          /* Stun */
          var savedDet = e.detectionRange, savedRng = e.rangedRange;
          e.detectionRange = 0.01; e.rangedRange = 0.01;
          _stunList.push({ e: e, t: STUN_DUR, savedDet: savedDet, savedRng: savedRng });
        }
      }
    } catch (err) {}

    /* Spawn visual rings */
    _spawnRings({ x: ox, y: oy, z: oz }, { x: fwd.x, y: fwd.y, z: fwd.z });

    /* Shake */
    try { if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(0.28, 0.18); } catch (e) {}

    /* HUD */
    var msg = hits > 0 ? ('🌪 VORTEX — ' + hits + ' ENEMY' + (hits > 1 ? ' BLASTED' : ' HIT')) : '🌪 VORTEX — MISS';
    try { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup(msg); } catch (e) {}
  }

  /* ── Activate ─────────────────────────────── */
  function _activate() {
    if (_cd > 0)     { try { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('VORTEX CD ' + Math.ceil(_cd) + 's'); } catch (e) {} return; }
    if (_stock <= 0) { try { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('VORTEX — NO CHARGE'); } catch (e) {} return; }
    _stock--;
    _cd = COOLDOWN;
    _hintEl.textContent = '[Alt+V] VORTEX ×' + _stock;
    _hintEl.style.color = 'rgba(60,255,180,0.3)';
    _fire();
  }

  /* ── rAF tick ─────────────────────────────── */
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;

    /* Restock on wave change */
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        var w = GameManager.getCurrentWave();
        if (w !== _waveWas) {
          _waveWas = w; _stock = STOCK_MAX; _cd = 0;
          _hintEl.textContent = '[Alt+V] VORTEX ×' + _stock;
          _hintEl.style.color = 'rgba(60,255,180,0.55)';
          for (var si = 0; si < _stunList.length; si++) {
            var s0 = _stunList[si];
            s0.e.detectionRange = s0.savedDet; s0.e.rangedRange = s0.savedRng;
          }
          _stunList = [];
        }
      }
    } catch (e) {}

    /* Cooldown */
    if (_cd > 0) {
      _cd = Math.max(0, _cd - dt);
      if (_cd === 0) { _hintEl.textContent = '[Alt+V] VORTEX ×' + _stock; _hintEl.style.color = 'rgba(60,255,180,0.55)'; }
    }

    /* Stun maintenance */
    for (var si = _stunList.length - 1; si >= 0; si--) {
      var s = _stunList[si];
      s.t -= dt;
      if (s.e.dead || s.t <= 0) {
        s.e.detectionRange = s.savedDet; s.e.rangedRange = s.savedRng;
        _stunList.splice(si, 1);
        continue;
      }
      s.e.detectionRange = 0.01; s.e.rangedRange = 0.01;
    }

    /* Ring animation */
    for (var ri = _rings.length - 1; ri >= 0; ri--) {
      var r = _rings[ri];
      r.t -= dt;
      var prog = Math.max(0, r.t / r.maxT);
      var elapsed = r.maxT - r.t;
      var traveled = elapsed * RANGE / r.maxT * 2.5;

      /* Travel along fwd */
      var dist = r.startDist + traveled;
      r.mesh.position.set(
        r.origin.x + r.fwd.x * dist,
        r.origin.y + r.fwd.y * dist,
        r.origin.z + r.fwd.z * dist
      );
      r.light.position.copy(r.mesh.position);

      /* Expand radius as it travels */
      var expansionFactor = 1 + traveled * 0.35;
      r.mesh.scale.set(expansionFactor, expansionFactor, 1);

      r.mat.opacity      = prog * 0.85;
      r.light.intensity  = prog * 1.8;

      if (r.t <= 0) {
        r.scene.remove(r.mesh); r.mesh.geometry.dispose(); r.mat.dispose();
        r.scene.remove(r.light);
        _rings.splice(ri, 1);
      }
    }
  }

  /* ── Key handler ──────────────────────────── */
  function _onKey(e) {
    if (e.code === 'KeyV' && e.altKey && !e.repeat) {
      e.preventDefault();
      _activate();
    }
  }

  /* ── Init ─────────────────────────────────── */
  function init() {
    if (_init) return;
    _init = true;
    _buildHint();
    window.addEventListener('keydown', _onKey);
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.VortexCannon = VortexCannon;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { VortexCannon.init(); });
} else {
  VortexCannon.init();
}
