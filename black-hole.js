/* ============================================================
 *  BLACK-HOLE.JS — Singularity grenade (Alt+B)
 *
 *  Throws a grenade that creates a 6s gravitational singularity.
 *  All enemies within 15u are physically pulled toward the center
 *  each frame (position nudge). Enemies in the core (<1.8u) take
 *  20 dmg/s. Visual: dark pulsing sphere + purple PointLight +
 *  orbiting ring particles. 1 per wave. Ballistic arc throw.
 * ============================================================ */
var BlackHole = (function () {
  'use strict';

  var PULL_RADIUS  = 15;
  var PULL_SPEED   = 5.5;    /* units/s at edge, stronger near center */
  var CORE_RADIUS  = 1.8;
  var CORE_DPS     = 20;
  var DURATION     = 6.0;
  var THROW_SPEED  = 22;
  var THROW_ARC    = 8;
  var STOCK_MAX    = 1;

  var _stock       = STOCK_MAX;
  var _waveWas     = -1;
  var _init        = false;
  var _lastTs      = 0;
  var _frameN      = 0;
  var _scene       = null;
  var _holes       = [];   /* active singularities */
  var _projectile  = null; /* in-flight grenade */

  function _getScene() {
    if (!_scene) {
      try { _scene = window.GameManager && GameManager.getScene ? GameManager.getScene() : null; } catch (e) {}
    }
    return _scene;
  }

  /* ── Build singularity mesh ─────────────── */
  function _buildSingularity(pos) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return null;
    try {
      var group = new THREE.Group();
      group.position.copy(pos);
      group.position.y += 0.5;

      /* Dark core sphere */
      var coreGeo = new THREE.SphereGeometry(0.4, 10, 8);
      var coreMat = new THREE.MeshBasicMaterial({ color: 0x110022, transparent: true, opacity: 0.95 });
      var core = new THREE.Mesh(coreGeo, coreMat);
      group.add(core);

      /* Purple glow sphere */
      var glowGeo = new THREE.SphereGeometry(0.9, 10, 8);
      var glowMat = new THREE.MeshBasicMaterial({ color: 0x6600cc, transparent: true, opacity: 0.30, depthWrite: false });
      var glow = new THREE.Mesh(glowGeo, glowMat);
      group.add(glow);

      /* Outer haze */
      var hazeGeo = new THREE.SphereGeometry(1.8, 8, 6);
      var hazeMat = new THREE.MeshBasicMaterial({ color: 0x4400aa, transparent: true, opacity: 0.10, depthWrite: false });
      var haze = new THREE.Mesh(hazeGeo, hazeMat);
      group.add(haze);

      /* Equatorial ring */
      var ringGeo = new THREE.TorusGeometry(1.2, 0.06, 6, 24);
      var ringMat = new THREE.MeshBasicMaterial({ color: 0xaa44ff, transparent: true, opacity: 0.7 });
      var ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      group.add(ring);

      /* Second tilted ring */
      var ringGeo2 = new THREE.TorusGeometry(0.85, 0.04, 5, 20);
      var ringMat2 = new THREE.MeshBasicMaterial({ color: 0xcc88ff, transparent: true, opacity: 0.55 });
      var ring2 = new THREE.Mesh(ringGeo2, ringMat2);
      ring2.rotation.x = Math.PI / 4;
      ring2.rotation.z = Math.PI / 6;
      group.add(ring2);

      /* Purple PointLight */
      var light = new THREE.PointLight(0x8822ff, 3.5, 14);
      group.add(light);

      scene.add(group);
      return {
        group: group, core: core, glow: glow, haze: haze,
        ring: ring, ring2: ring2, light: light,
        coreMat: coreMat, glowMat: glowMat, hazeMat: hazeMat,
        ringMat: ringMat, ringMat2: ringMat2,
        pos: group.position.clone(),
        t: DURATION, maxT: DURATION, scene: scene
      };
    } catch (err) { return null; }
  }

  /* ── Throw projectile ───────────────────── */
  function _throw() {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return;
    var player = window.player;
    if (!player || !player.position) return;

    try {
      var cam = window.GameManager && GameManager.getCamera ? GameManager.getCamera() : null;
      var fwd = new THREE.Vector3(0, 0, -1);
      if (cam) fwd.applyQuaternion(cam.quaternion).normalize();

      var start = player.position.clone();
      start.y += 1.5;

      /* Velocity: forward + slight upward arc */
      var vel = fwd.clone().multiplyScalar(THROW_SPEED);
      vel.y = Math.abs(vel.y) + THROW_ARC;

      /* Small dark sphere for in-flight visual */
      var geo = new THREE.SphereGeometry(0.12, 6, 4);
      var mat = new THREE.MeshBasicMaterial({ color: 0x220033 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(start);
      scene.add(mesh);

      _projectile = { mesh: mesh, vel: vel, scene: scene };
    } catch (err) {}
  }

  /* ── Activate ───────────────────────────── */
  function _activate() {
    if (_stock <= 0) {
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('BLACK HOLE — NO STOCK');
      return;
    }
    if (_projectile) return; /* already in flight */
    _stock--;
    _throw();
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('⚫ SINGULARITY DEPLOYED');
    if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(0.15, 0.12);
  }

  /* ── Pull enemies toward a singularity ─── */
  function _pullEnemies(hole, dt) {
    if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
    try {
      var all = Enemies.getAll();
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (!e || e.dead || !e.mesh) continue;
        var dx  = hole.pos.x - e.mesh.position.x;
        var dz  = hole.pos.z - e.mesh.position.z;
        var dy  = hole.pos.y - e.mesh.position.y;
        var dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (dist > PULL_RADIUS || dist < 0.01) continue;

        /* Pull strength: stronger near center, inverse square ish */
        var strength = PULL_SPEED * (1 - dist / PULL_RADIUS) * (1 - dist / PULL_RADIUS) * dt;
        e.mesh.position.x += (dx / dist) * strength;
        e.mesh.position.z += (dz / dist) * strength;
        e.mesh.position.y += (dy / dist) * strength * 0.5;
      }

      /* Core DOT */
      if (typeof Enemies.damageInRadius === 'function') {
        Enemies.damageInRadius(hole.pos, CORE_RADIUS, CORE_DPS * (dt * 2));
      }
    } catch (err) {}
  }

  /* ── rAF tick ───────────────────────────── */
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    _frameN++;

    /* Restock on wave change */
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        var w = GameManager.getCurrentWave();
        if (w !== _waveWas) { _waveWas = w; _stock = STOCK_MAX; }
      }
    } catch (e) {}

    /* Projectile physics */
    if (_projectile) {
      var p = _projectile;
      p.vel.y -= 20 * dt;   /* gravity */
      p.mesh.position.x += p.vel.x * dt;
      p.mesh.position.y += p.vel.y * dt;
      p.mesh.position.z += p.vel.z * dt;

      /* Ground detection */
      var groundY = 0;
      try {
        if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) {
          groundY = VoxelWorld.getTerrainHeight(p.mesh.position.x, p.mesh.position.z);
        }
      } catch (e) {}

      if (p.mesh.position.y <= groundY + 0.1) {
        /* Land — create singularity */
        var landPos = p.mesh.position.clone();
        landPos.y = groundY;
        p.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        _projectile = null;

        var hole = _buildSingularity(landPos);
        if (hole) _holes.push(hole);

        if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(0.4, 0.25);
      }
    }

    /* Animate and tick singularities */
    for (var hi = _holes.length - 1; hi >= 0; hi--) {
      var hole = _holes[hi];
      hole.t -= dt;

      var prog     = Math.max(0, hole.t / hole.maxT);
      var tSec     = ts / 1000;
      var pulse    = 0.85 + Math.sin(tSec * 6.5) * 0.15;

      /* Rotate rings */
      hole.ring.rotation.z  += dt * 2.2;
      hole.ring2.rotation.y += dt * 3.0;

      /* Breathing pulse on glow */
      hole.group.scale.setScalar(pulse * Math.min(1, (1 - prog) < 0.15 ? (1 - prog) / 0.15 : 1));

      /* Light pulse */
      hole.light.intensity = 3.5 * pulse * prog;

      /* Material opacity fade on expiry */
      if (prog < 0.2) {
        var fade = prog / 0.2;
        hole.glowMat.opacity  = 0.30 * fade;
        hole.hazeMat.opacity  = 0.10 * fade;
        hole.ringMat.opacity  = 0.70 * fade;
        hole.ringMat2.opacity = 0.55 * fade;
      }

      /* Pull enemies every 2 frames */
      if (_frameN % 2 === 0) _pullEnemies(hole, dt * 2);

      if (hole.t <= 0) {
        hole.scene.remove(hole.group);
        hole.group.traverse(function (obj) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) obj.material.dispose();
        });
        _holes.splice(hi, 1);
      }
    }
  }

  /* ── Key handler ────────────────────────── */
  function _onKey(e) {
    if (e.code === 'KeyB' && e.altKey && !e.repeat) {
      e.preventDefault();
      _activate();
    }
  }

  /* ── Init ──────────────────────────────── */
  function init() {
    if (_init) return;
    _init = true;
    window.addEventListener('keydown', _onKey);
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.BlackHole = BlackHole;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { BlackHole.init(); });
} else {
  BlackHole.init();
}
