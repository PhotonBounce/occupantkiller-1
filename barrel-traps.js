/* ============================================================
 *  BARREL-TRAPS.JS — Explosive barrel environment hazards
 *
 *  4 red explosive barrels spawn each wave in the environment.
 *  Patch Tracers.spawnTracer: if a bullet tracer line passes
 *  within 0.6u of a barrel it detonates — spawnExplosion,
 *  150 AOE damage, chain-reacts to nearby barrels in 0.2s.
 *  Enemy kills within 4u of a barrel also trigger it.
 * ============================================================ */
var BarrelTraps = (function () {
  'use strict';

  var BARREL_COUNT   = 4;
  var CHAIN_RADIUS   = 5.5;
  var CHAIN_DELAY    = 0.18;  /* seconds */
  var AOE_RADIUS     = 7.0;
  var AOE_DAMAGE     = 150;
  var HIT_RADIUS     = 0.65;  /* tracer line miss-tolerance */
  var SPAWN_MIN_R    = 14;
  var SPAWN_MAX_R    = 55;

  var _barrels       = [];   /* { group, pos, blown, chainTimer } */
  var _scene         = null;
  var _waveWas       = -1;
  var _init          = false;
  var _frameN        = 0;
  var _lastTs        = 0;
  var _patchedTracer = false;
  var _origTracer    = null;
  var _prevDead      = new WeakMap();

  /* ── Get scene ──────────────────────────── */
  function _getScene() {
    if (!_scene) {
      try { _scene = window.GameManager && GameManager.getScene ? GameManager.getScene() : null; } catch (e) {}
    }
    return _scene;
  }

  /* ── Build barrel mesh ─────────────────── */
  function _buildBarrel(pos) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return null;

    try {
      var group = new THREE.Group();
      group.position.copy(pos);

      /* Main drum body — red */
      var bodyGeo = new THREE.CylinderGeometry(0.38, 0.40, 0.95, 10);
      var bodyMat = new THREE.MeshLambertMaterial({ color: 0xcc1100, emissive: 0x330000 });
      var body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.47;
      group.add(body);

      /* Top cap */
      var topGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.06, 10);
      var topMat = new THREE.MeshLambertMaterial({ color: 0x882200 });
      var top = new THREE.Mesh(topGeo, topMat);
      top.position.y = 0.97;
      group.add(top);

      /* Yellow hazard band */
      var bandGeo = new THREE.CylinderGeometry(0.395, 0.395, 0.12, 10);
      var bandMat = new THREE.MeshLambertMaterial({ color: 0xffcc00, emissive: 0x443300 });
      var band = new THREE.Mesh(bandGeo, bandMat);
      band.position.y = 0.65;
      group.add(band);

      /* Glow light */
      var light = new THREE.PointLight(0xff3300, 0.7, 5);
      light.position.y = 0.7;
      group.add(light);

      scene.add(group);
      return { group: group, light: light, pos: pos.clone(), blown: false, chainTimer: -1 };
    } catch (err) { return null; }
  }

  /* ── Spawn barrels at wave start ─────── */
  function _spawnBarrels() {
    _clearBarrels();
    var player = window.player;
    if (!player || !player.position) return;

    var px = player.position.x;
    var pz = player.position.z;

    for (var i = 0; i < BARREL_COUNT; i++) {
      /* Random position in front arc (±70°), distance 14–55u */
      var angle = (Math.random() - 0.5) * (Math.PI * 1.4);
      var dist  = SPAWN_MIN_R + Math.random() * (SPAWN_MAX_R - SPAWN_MIN_R);
      var bx    = px + Math.sin(angle) * dist;
      var bz    = pz + Math.cos(angle) * dist;
      var by    = 0;
      try {
        if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) {
          by = VoxelWorld.getTerrainHeight(bx, bz);
        }
      } catch (e) {}
      var b = _buildBarrel(new THREE.Vector3(bx, by, bz));
      if (b) _barrels.push(b);
    }
  }

  /* ── Remove all barrels from scene ──── */
  function _clearBarrels() {
    var scene = _getScene();
    for (var i = 0; i < _barrels.length; i++) {
      var b = _barrels[i];
      if (scene && b.group) {
        scene.remove(b.group);
        b.group.traverse(function (obj) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) obj.material.dispose();
        });
      }
    }
    _barrels = [];
  }

  /* ── Detonate a barrel ──────────────── */
  function _detonate(b) {
    if (b.blown) return;
    b.blown = true;

    var scene = _getScene();
    if (scene && b.group) {
      scene.remove(b.group);
      b.group.traverse(function (obj) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
    }

    try {
      if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion) {
        Tracers.spawnExplosion(b.pos, 2.5);
      }
      if (typeof Enemies !== 'undefined' && Enemies.damageInRadius) {
        Enemies.damageInRadius(b.pos, AOE_RADIUS, AOE_DAMAGE);
      }
      if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) {
        /* Shake scales with distance from player */
        var player = window.player;
        if (player && player.position) {
          var dx = b.pos.x - player.position.x;
          var dz = b.pos.z - player.position.z;
          var d  = Math.sqrt(dx*dx + dz*dz);
          var intensity = Math.max(0.05, 0.9 - d * 0.025);
          CameraSystem.shake(intensity, 0.45);
        }
      }
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('💥 BARREL DETONATED');
    } catch (err) {}

    /* Queue chain detonation of nearby barrels */
    for (var i = 0; i < _barrels.length; i++) {
      var other = _barrels[i];
      if (other.blown) continue;
      var dx2 = other.pos.x - b.pos.x;
      var dz2 = other.pos.z - b.pos.z;
      if (dx2*dx2 + dz2*dz2 < CHAIN_RADIUS * CHAIN_RADIUS) {
        if (other.chainTimer < 0) other.chainTimer = CHAIN_DELAY;
      }
    }
  }

  /* ── Patch Tracers.spawnTracer ──────── */
  function _patchTracers() {
    if (_patchedTracer) return;
    if (typeof Tracers === 'undefined' || !Tracers.spawnTracer) return;
    _origTracer = Tracers.spawnTracer;
    Tracers.spawnTracer = function (from, to, color, width) {
      if (_origTracer) _origTracer.call(Tracers, from, to, color, width);
      _checkTracerBarrels(from, to);
    };
    _patchedTracer = true;
  }

  /* ── Line-segment vs barrel point test ── */
  function _checkTracerBarrels(from, to) {
    if (_barrels.length === 0) return;
    try {
      var dx   = to.x - from.x;
      var dy   = to.y - from.y;
      var dz   = to.z - from.z;
      var lenSq = dx*dx + dy*dy + dz*dz;
      if (lenSq < 0.001) return;

      for (var i = 0; i < _barrels.length; i++) {
        var b = _barrels[i];
        if (b.blown) continue;
        /* Project barrel center onto the line segment */
        var tx  = b.pos.x - from.x;
        var ty  = b.pos.y + 0.5 - from.y;   /* aim at barrel mid-height */
        var tz  = b.pos.z - from.z;
        var t   = (tx*dx + ty*dy + tz*dz) / lenSq;
        t = Math.max(0, Math.min(1, t));
        /* Closest point on segment to barrel */
        var cx  = from.x + t * dx;
        var cy  = from.y + t * dy;
        var cz  = from.z + t * dz;
        var ex  = b.pos.x - cx;
        var ey  = (b.pos.y + 0.5) - cy;
        var ez  = b.pos.z - cz;
        var distSq = ex*ex + ey*ey + ez*ez;
        if (distSq < HIT_RADIUS * HIT_RADIUS) {
          _detonate(b);
        }
      }
    } catch (err) {}
  }

  /* ── Enemy-kill chain-trigger ─────────── */
  function _scanEnemyKills() {
    if (_barrels.length === 0 || typeof Enemies === 'undefined' || !Enemies.getAll) return;
    try {
      var all = Enemies.getAll();
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (!e || !e.mesh) continue;
        var wasDead = _prevDead.has(e) ? _prevDead.get(e) : false;
        if (e.dead && !wasDead) {
          /* Killed enemy — check nearby barrels */
          for (var bi = 0; bi < _barrels.length; bi++) {
            var b = _barrels[bi];
            if (b.blown) continue;
            var dx = e.mesh.position.x - b.pos.x;
            var dz = e.mesh.position.z - b.pos.z;
            if (dx*dx + dz*dz < 16) {  /* 4u radius */
              _detonate(b);
            }
          }
        }
        _prevDead.set(e, !!e.dead);
      }
    } catch (err) {}
  }

  /* ── rAF tick ───────────────────────────── */
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    _frameN++;

    _patchTracers();

    /* Check wave change */
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        var w = GameManager.getCurrentWave();
        if (w !== _waveWas) { _waveWas = w; _spawnBarrels(); }
      }
    } catch (e) {}

    /* Chain timers */
    for (var i = 0; i < _barrels.length; i++) {
      var b = _barrels[i];
      if (b.chainTimer >= 0 && !b.blown) {
        b.chainTimer -= dt;
        if (b.chainTimer <= 0) { b.chainTimer = -1; _detonate(b); }
      }
    }

    /* Enemy-kill scan every 4 frames */
    if (_frameN % 4 === 0) _scanEnemyKills();

    /* Animate barrel glow pulse */
    if (_frameN % 3 === 0) {
      var pulse = 0.6 + Math.sin(ts * 0.004) * 0.3;
      for (var bi = 0; bi < _barrels.length; bi++) {
        var brl = _barrels[bi];
        if (!brl.blown && brl.light) brl.light.intensity = pulse;
      }
    }
  }

  /* ── Init ──────────────────────────────── */
  function init() {
    if (_init) return;
    _init = true;
    requestAnimationFrame(_tick);
  }

  return { init: init };
})();

window.BarrelTraps = BarrelTraps;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { BarrelTraps.init(); });
} else {
  BarrelTraps.init();
}
