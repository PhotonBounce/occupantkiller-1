/* ============================================================
 *  INFERNO-WALL.JS — Fire wall strike (F10)
 *
 *  Deploys 4 incendiary canisters in a perpendicular fan arc
 *  25u ahead of player, spaced 7u apart forming a wall of fire
 *  blocking the path. Each canister: small cylinder flies on
 *  ballistic arc, lands, creates a fire zone identical to
 *  napalm-strike (THREE.js cone cluster + PointLight, 4s burn,
 *  12 dmg/s, 3.2u radius via HP-delta intercept).
 *  1 per wave, 20s cooldown.
 * ============================================================ */
var InfernoWall = (function () {
  'use strict';

  var CANISTER_COUNT = 4;
  var WALL_WIDTH     = 21;   /* total width — canisters spaced WALL_WIDTH/(count-1) */
  var WALL_DIST      = 22;   /* forward distance */
  var BURN_DUR       = 4.0;
  var BURN_DMG       = 12;   /* dmg/s per zone */
  var BURN_RADIUS    = 3.2;
  var STOCK_MAX      = 1;
  var COOLDOWN       = 20.0;
  var STAGGER        = 0.12; /* delay between canister launches */

  var _stock         = STOCK_MAX;
  var _cd            = 0;
  var _waveWas       = -1;
  var _init          = false;
  var _lastTs        = 0;
  var _scene         = null;

  var _projectiles   = [];  /* in-flight canisters */
  var _zones         = [];  /* { x, y, z, t, cones[], lights[], prevHps WeakMap } */
  var _hintEl        = null;

  function _getScene() {
    if (!_scene) {
      try { _scene = window.GameManager && GameManager.getScene ? GameManager.getScene() : null; } catch (e) {}
    }
    return _scene;
  }

  function _ty(x, z) {
    try { return (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) ? VoxelWorld.getTerrainHeight(x, z) : 0; } catch (e) { return 0; }
  }

  /* ── Hint ──────────────────────────────────── */
  function _buildHint() {
    _hintEl = document.createElement('div');
    _hintEl.id = 'iwall-hint';
    Object.assign(_hintEl.style, {
      position: 'fixed', bottom: '156px', left: '12px',
      fontFamily: "'Courier New', monospace", fontSize: '9px',
      letterSpacing: '1.5px', color: 'rgba(255,100,30,0.55)',
      zIndex: 250, pointerEvents: 'none', whiteSpace: 'nowrap'
    });
    _hintEl.textContent = '[F10] INFERNO WALL ×' + _stock;
    document.body.appendChild(_hintEl);
  }

  /* ── Spawn fire zone at landing pos ────────── */
  function _spawnFireZone(pos) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return;
    var cones = [], lights = [];
    try {
      /* 3 offset fire cones */
      for (var c = 0; c < 3; c++) {
        var offX = (Math.random() - 0.5) * 1.5;
        var offZ = (Math.random() - 0.5) * 1.5;
        var h    = 2.5 + Math.random() * 1.5;
        var geo  = new THREE.ConeGeometry(0.55, h, 5, 1);
        var mat  = new THREE.MeshBasicMaterial({ color: c === 0 ? 0xff5500 : (c === 1 ? 0xff8800 : 0xffaa00), transparent: true, opacity: 0.82, depthWrite: false });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(pos.x + offX, pos.y + h / 2, pos.z + offZ);
        scene.add(mesh);
        cones.push({ mesh: mesh, mat: mat, offX: offX, offZ: offZ, h: h });
      }
      var light = new THREE.PointLight(0xff5500, 2.8, 9);
      light.position.set(pos.x, pos.y + 1.5, pos.z);
      scene.add(light);
      lights.push(light);
    } catch (err) {}

    _zones.push({ x: pos.x, y: pos.y, z: pos.z, t: BURN_DUR, cones: cones, lights: lights, prevHps: new WeakMap(), justHit: new WeakMap() });
    try { if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(0.22, 0.12); } catch (e) {}
  }

  /* ── Activate ─────────────────────────────── */
  function _activate() {
    if (_cd > 0)     { try { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('INFERNO WALL CD ' + Math.ceil(_cd) + 's'); } catch (e) {} return; }
    if (_stock <= 0) { try { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('INFERNO WALL — NO STOCK'); } catch (e) {} return; }
    var player = window.player;
    if (!player || !player.position) return;
    var cam = null;
    try { cam = window.GameManager && GameManager.getCamera ? GameManager.getCamera() : null; } catch (e) {}
    if (typeof THREE === 'undefined') return;

    _stock--;
    _cd = COOLDOWN;
    _hintEl.textContent = '[F10] INFERNO WALL ×' + _stock;
    _hintEl.style.color = 'rgba(255,100,30,0.3)';

    /* Camera forward (horizontal only) and perpendicular (right) */
    var fwd = new THREE.Vector3(0, 0, -1);
    if (cam) fwd.applyQuaternion(cam.quaternion).normalize();
    fwd.y = 0; fwd.normalize();
    var right = new THREE.Vector3(fwd.z, 0, -fwd.x); /* perpendicular */

    var wallCenter = new THREE.Vector3(
      player.position.x + fwd.x * WALL_DIST,
      player.position.y,
      player.position.z + fwd.z * WALL_DIST
    );

    /* Launch canisters staggered in time */
    for (var i = 0; i < CANISTER_COUNT; i++) {
      (function (idx) {
        var offset = (idx / (CANISTER_COUNT - 1) - 0.5) * WALL_WIDTH;
        var tx = wallCenter.x + right.x * offset;
        var tz = wallCenter.z + right.z * offset;

        setTimeout(function () {
          var scene = _getScene();
          if (!scene) return;
          var px = player.position.x, py = player.position.y, pz = player.position.z;
          try {
            var geo = new THREE.CylinderGeometry(0.05, 0.08, 0.25, 5);
            var mat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(px, py + 1.4, pz);
            scene.add(mesh);

            var dx = tx - px, dz = tz - pz;
            var dist2 = Math.sqrt(dx*dx + dz*dz);
            var spd = 16;
            var vel = new THREE.Vector3(dx/dist2 * spd, 10, dz/dist2 * spd);
            _projectiles.push({ mesh: mesh, mat: mat, vel: vel, tx: tx, tz: tz, scene: scene });
          } catch (e2) {}
        }, idx * STAGGER * 1000);
      })(i);
    }

    try { if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('🔥 INFERNO WALL — ' + CANISTER_COUNT + ' CANISTERS'); } catch (e) {}
  }

  /* ── rAF tick ─────────────────────────────── */
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt   = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs  = ts;
    var tSec = ts / 1000;

    /* Restock */
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        var w = GameManager.getCurrentWave();
        if (w !== _waveWas) {
          _waveWas = w; _stock = STOCK_MAX; _cd = 0;
          _hintEl.textContent = '[F10] INFERNO WALL ×' + _stock;
          _hintEl.style.color = 'rgba(255,100,30,0.55)';
          /* Clean up */
          var sc = _getScene();
          for (var zi = 0; zi < _zones.length; zi++) {
            var z0 = _zones[zi];
            for (var ci0 = 0; ci0 < z0.cones.length; ci0++) { if (sc) sc.remove(z0.cones[ci0].mesh); z0.cones[ci0].mat.dispose(); }
            for (var li0 = 0; li0 < z0.lights.length; li0++) { if (sc) sc.remove(z0.lights[li0]); }
          }
          _zones = [];
        }
      }
    } catch (e) {}

    /* Cooldown */
    if (_cd > 0) {
      _cd = Math.max(0, _cd - dt);
      if (_cd === 0) { _hintEl.textContent = '[F10] INFERNO WALL ×' + _stock; _hintEl.style.color = 'rgba(255,100,30,0.55)'; }
    }

    /* Projectile flight */
    for (var pi = _projectiles.length - 1; pi >= 0; pi--) {
      var p = _projectiles[pi];
      p.vel.y -= 22 * dt;
      p.mesh.position.x += p.vel.x * dt;
      p.mesh.position.y += p.vel.y * dt;
      p.mesh.position.z += p.vel.z * dt;
      p.mesh.rotation.x += dt * 6;
      var gy = _ty(p.mesh.position.x, p.mesh.position.z);
      if (p.mesh.position.y <= gy + 0.1) {
        var lp = { x: p.mesh.position.x, y: gy, z: p.mesh.position.z };
        p.scene.remove(p.mesh); p.mesh.geometry.dispose(); p.mat.dispose();
        _projectiles.splice(pi, 1);
        _spawnFireZone(lp);
      }
    }

    /* Fire zone tick */
    for (var zi = _zones.length - 1; zi >= 0; zi--) {
      var z = _zones[zi];
      z.t -= dt;
      var prog = Math.max(0, z.t / BURN_DUR);

      /* Animate cones */
      for (var ci = 0; ci < z.cones.length; ci++) {
        var c = z.cones[ci];
        var flicker = 0.7 + Math.sin(tSec * (8 + ci * 3)) * 0.3;
        c.mat.opacity = prog * 0.82 * flicker;
        c.mesh.position.y = z.y + c.h / 2 + Math.sin(tSec * 4 + ci) * 0.15;
        c.mesh.scale.x = 0.85 + Math.sin(tSec * 6 + ci * 2) * 0.15;
        c.mesh.scale.z = c.mesh.scale.x;
      }
      for (var li = 0; li < z.lights.length; li++) {
        z.lights[li].intensity = prog * 2.8 * (0.8 + Math.sin(tSec * 9) * 0.2);
      }

      /* DOT on enemies in zone via HP-delta intercept */
      try {
        if (typeof Enemies !== 'undefined' && Enemies.getAll) {
          var all = Enemies.getAll();
          for (var ei = 0; ei < all.length; ei++) {
            var e = all[ei];
            if (!e || e.dead || !e.mesh) continue;
            var edx = e.mesh.position.x - z.x, edz = e.mesh.position.z - z.z;
            if (edx*edx + edz*edz > BURN_RADIUS * BURN_RADIUS) continue;
            var prevHp = z.prevHps.has(e) ? z.prevHps.get(e) : e.hp;
            var jh     = z.justHit.has(e) ? z.justHit.get(e) : false;
            if (!jh) {
              var drop = prevHp - e.hp;
              var dot  = BURN_DMG * dt;
              e.hp = Math.max(0, e.hp - dot);
              if (drop > 0.5) { z.justHit.set(e, true); } else { z.justHit.set(e, false); }
            } else { z.justHit.set(e, false); }
            z.prevHps.set(e, e.hp);
          }
        }
      } catch (err) {}

      if (z.t <= 0) {
        var sc2 = _getScene();
        for (var ci2 = 0; ci2 < z.cones.length; ci2++) { if (sc2) sc2.remove(z.cones[ci2].mesh); z.cones[ci2].mat.dispose(); }
        for (var li2 = 0; li2 < z.lights.length; li2++) { if (sc2) sc2.remove(z.lights[li2]); }
        _zones.splice(zi, 1);
      }
    }
  }

  /* ── Key handler ──────────────────────────── */
  function _onKey(e) {
    if (e.code === 'F10' && !e.repeat) {
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

window.InfernoWall = InfernoWall;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { InfernoWall.init(); });
} else {
  InfernoWall.init();
}
