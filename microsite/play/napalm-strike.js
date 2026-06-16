/* ============================================================
 *  NAPALM-STRIKE.JS — Walking napalm barrage (F6)
 *
 *  F6 calls in 10 napalm canisters along player's forward axis,
 *  starting 20u ahead, spaced 6u apart, 0.4s between each.
 *  Each impact: spawnExplosion, orange fire zone (3s burn, 3u
 *  radius, 12 dmg/s DOT). 1 stock per wave.
 * ============================================================ */
var NapalmStrike = (function () {
  'use strict';

  var POD_COUNT   = 10;
  var POD_SPACING = 6.0;
  var POD_DELAY   = 0.40;  /* seconds between impacts */
  var POD_SPREAD  = 2.2;   /* lateral scatter per pod */
  var START_DIST  = 20;
  var FIRE_DUR    = 3.5;
  var FIRE_RADIUS = 3.2;
  var FIRE_DPS    = 12;
  var STOCK_MAX   = 1;

  var _stock    = STOCK_MAX;
  var _waveWas  = -1;
  var _init     = false;
  var _frameN   = 0;
  var _lastTs   = 0;
  var _scene    = null;
  var _fires    = [];       /* active burn patches */
  var _queue    = [];       /* pending impacts { t, pos } */

  /* ── Get scene (lazy) ──────────────────── */
  function _getScene() {
    if (!_scene) {
      try { _scene = window.GameManager && GameManager.getScene ? GameManager.getScene() : null; } catch (e) {}
    }
    return _scene;
  }

  /* ── Spawn persistent fire zone ─────── */
  function _spawnFire(pos) {
    var scene = _getScene();
    if (!scene || typeof THREE === 'undefined') return;
    try {
      var group = new THREE.Group();
      group.position.set(pos.x, pos.y, pos.z);

      /* 2 offset overlapping cones — orange/red napalm burn */
      var offsets = [
        { x: 0,    z: 0,    scale: 1.0 },
        { x: 0.5,  z: 0.4,  scale: 0.7 },
        { x: -0.4, z: 0.5,  scale: 0.6 },
      ];
      var mats = [];
      offsets.forEach(function (o, idx) {
        var geo = new THREE.ConeGeometry(0.45 * o.scale, 1.2 * o.scale, 7);
        var mat = new THREE.MeshBasicMaterial({
          color: idx === 0 ? 0xff4400 : 0xff8800,
          transparent: true, opacity: 0.85, depthWrite: false
        });
        mats.push(mat);
        var cone = new THREE.Mesh(geo, mat);
        cone.position.set(o.x, 0.6 * o.scale, o.z);
        group.add(cone);
      });

      var light = new THREE.PointLight(0xff5500, 2.5, 9);
      light.position.y = 0.6;
      group.add(light);

      scene.add(group);
      _fires.push({
        group:  group,
        light:  light,
        mats:   mats,
        t:      FIRE_DUR,
        maxT:   FIRE_DUR,
        pos:    new THREE.Vector3(pos.x, pos.y, pos.z),
        scene:  scene,
        phase:  Math.random() * Math.PI * 2
      });
    } catch (err) {}
  }

  /* ── Trigger a single napalm impact ─── */
  function _impact(pos) {
    try {
      if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion) {
        Tracers.spawnExplosion(pos, 1.8);
      }
      _spawnFire(pos);
    } catch (err) {}
  }

  /* ── Activate strike ─────────────────── */
  function _activate() {
    if (_stock <= 0) {
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('NAPALM — NO STOCK');
      return;
    }
    if (_queue.length > 0) {
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('NAPALM ALREADY INBOUND');
      return;
    }

    var player = window.player;
    var cam    = null;
    try { cam = window.GameManager && GameManager.getCamera ? GameManager.getCamera() : null; } catch (e) {}

    if (!player || !player.position) { return; }

    /* Forward direction from camera, flattened to XZ */
    var fwd = new THREE.Vector3(0, 0, -1);
    if (cam) fwd.applyQuaternion(cam.quaternion).setY(0).normalize();

    var right = new THREE.Vector3(-fwd.z, 0, fwd.x); /* perp in XZ */

    _stock--;
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) HUD.notifyPickup('🔥 NAPALM INBOUND — CLEAR THE AREA');

    /* Build queue */
    for (var i = 0; i < POD_COUNT; i++) {
      var dist   = START_DIST + i * POD_SPACING;
      var scatter = (Math.random() - 0.5) * POD_SPREAD;
      var px     = player.position.x + fwd.x * dist + right.x * scatter;
      var pz     = player.position.z + fwd.z * dist + right.z * scatter;
      var py     = 0;
      try {
        if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) py = VoxelWorld.getTerrainHeight(px, pz);
      } catch (e) {}
      _queue.push({ t: i * POD_DELAY, pos: new THREE.Vector3(px, py, pz) });
    }
  }

  /* ── rAF tick ───────────────────────────── */
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    _frameN++;

    /* Restock on new wave */
    try {
      if (typeof GameManager !== 'undefined' && GameManager.getCurrentWave) {
        var w = GameManager.getCurrentWave();
        if (w !== _waveWas) { _waveWas = w; _stock = STOCK_MAX; }
      }
    } catch (e) {}

    /* Advance impact queue */
    for (var qi = _queue.length - 1; qi >= 0; qi--) {
      _queue[qi].t -= dt;
      if (_queue[qi].t <= 0) {
        _impact(_queue[qi].pos);
        _queue.splice(qi, 1);
      }
    }

    /* Update fire patches */
    for (var fi = _fires.length - 1; fi >= 0; fi--) {
      var f = _fires[fi];
      f.t -= dt;
      if (f.t <= 0) {
        f.scene.remove(f.group);
        f.group.traverse(function (obj) {
          if (obj.geometry) obj.geometry.dispose();
        });
        f.mats.forEach(function (m) { m.dispose(); });
        _fires.splice(fi, 1);
        continue;
      }

      /* Flicker animation */
      var prog    = f.t / f.maxT;
      var flicker = 0.85 + Math.sin(ts * 0.013 + f.phase + fi * 1.9) * 0.15;
      var sc      = flicker * Math.min(1, prog / 0.1);
      f.group.children[0].scale.setScalar(sc);
      if (f.group.children[1]) f.group.children[1].scale.setScalar(sc * 0.75);
      if (f.group.children[2]) f.group.children[2].scale.setScalar(sc * 0.65);
      f.group.children[0].rotation.y += dt * 3.2;

      /* Fade out */
      var op = prog < 0.2 ? prog / 0.2 : 1;
      f.mats.forEach(function (m) { m.opacity = (m === f.mats[0] ? 0.85 : 0.75) * op; });
      f.light.intensity = 2.5 * op * flicker;

      /* DOT — every 6 frames */
      if (_frameN % 6 === 0) {
        try {
          if (typeof Enemies !== 'undefined' && Enemies.damageInRadius) {
            Enemies.damageInRadius(f.pos, FIRE_RADIUS, FIRE_DPS * (dt * 3));
          }
        } catch (err) {}
      }
    }
  }

  /* ── Key handler ────────────────────────── */
  function _onKey(e) {
    if (e.key === 'F6' && !e.repeat) {
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

window.NapalmStrike = NapalmStrike;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { NapalmStrike.init(); });
} else {
  NapalmStrike.init();
}
