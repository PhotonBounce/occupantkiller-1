/* ============================================================
 *  BLOOD-DECALS.JS — Persistent blood pool decals
 *
 *  Scans Enemies.getAll() for newly-dead enemies each frame and
 *  spawns a flat circular blood pool mesh on the terrain below.
 *  Pools fade in quickly and linger until wave change or max cap.
 *
 *  Features:
 *    • Random radius (0.35 – 1.05u) and rotation for variety
 *    • 3-4 overlapping discs per kill for organic splatter shape
 *    • Dark red with slight transparency
 *    • Max 60 pools (oldest removed when over cap)
 *    • Cleared on wave change detection
 *    • Zero key bindings, fully automatic
 * ============================================================ */
var BloodDecals = (function () {
  'use strict';

  var MAX_POOLS   = 60;
  var FADE_IN_SPD = 4;  /* opacity units/second */

  var _initialized = false;
  var _scene       = null;
  var _pools       = []; /* { mesh, opacity } */
  var _deadSet     = new WeakSet();
  var _mat         = null;
  var _lastWave    = -1;
  var _lastTs      = 0;

  /* Shared dark-red material */
  function _getMat() {
    if (_mat) return _mat;
    _mat = new THREE.MeshBasicMaterial({
      color: 0x880000,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    return _mat;
  }

  /* ── Spawn a blood pool at world position ─ */
  function _spawnPool(wx, wy, wz) {
    if (!_scene) return;

    /* 2-3 overlapping discs for organic look */
    var count = 2 + Math.floor(Math.random() * 2);
    for (var i = 0; i < count; i++) {
      var r   = 0.35 + Math.random() * 0.7;
      var geo = new THREE.CircleGeometry(r, 10);
      var mat = new THREE.MeshBasicMaterial({
        color: (Math.random() < 0.4) ? 0x550000 : 0x880011,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      var mesh = new THREE.Mesh(geo, mat);

      /* Lay flat on terrain */
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = Math.random() * Math.PI * 2;
      mesh.position.set(
        wx + (Math.random() - 0.5) * 0.6,
        wy + 0.04 + i * 0.01,  /* tiny stack offset avoids z-fight */
        wz + (Math.random() - 0.5) * 0.6
      );
      _scene.add(mesh);
      _pools.push({ mesh: mesh, opacity: 0, targetOp: 0.68 + Math.random() * 0.18 });
    }

    /* Trim to max */
    while (_pools.length > MAX_POOLS) {
      var old = _pools.shift();
      if (old.mesh && old.mesh.parent) old.mesh.parent.remove(old.mesh);
      if (old.mesh && old.mesh.geometry) old.mesh.geometry.dispose();
      if (old.mesh && old.mesh.material) old.mesh.material.dispose();
    }
  }

  /* ── Terrain height helper ─────────────── */
  function _terrainY(x, z) {
    try { return (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) ? VoxelWorld.getTerrainHeight(x, z) : 0; } catch(e){return 0;}
  }

  /* ── Scan for newly-dead enemies ──────── */
  function _scan() {
    try {
      if (typeof Enemies === 'undefined' || !Enemies.getAll) return;
      var all = Enemies.getAll();
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (!e || !e.mesh) continue;
        if (!e.dead) { if (_deadSet.has(e)) _deadSet.delete(e); continue; }
        if (_deadSet.has(e)) continue;
        _deadSet.add(e);
        var x = e.mesh.position.x;
        var z = e.mesh.position.z;
        var y = _terrainY(x, z);
        _spawnPool(x, y, z);
      }
    } catch(err) {}
  }

  /* ── Clear all pools ───────────────────── */
  function _clearAll() {
    for (var i = 0; i < _pools.length; i++) {
      var p = _pools[i];
      if (p.mesh && p.mesh.parent) p.mesh.parent.remove(p.mesh);
      try { if (p.mesh.geometry) p.mesh.geometry.dispose(); } catch(e){}
      try { if (p.mesh.material) p.mesh.material.dispose(); } catch(e){}
    }
    _pools = [];
    _deadSet = new WeakSet();
  }

  /* ── rAF tick ──────────────────────────── */
  var _frameN = 0;
  function _tick(ts) {
    requestAnimationFrame(_tick);
    var dt = Math.min(0.1, (ts - (_lastTs || ts)) / 1000);
    _lastTs = ts;
    _frameN++;

    /* Get scene lazily */
    if (!_scene) {
      try { _scene = window.GameManager && GameManager.getScene ? GameManager.getScene() : null; } catch(e){}
    }
    if (!_scene) return;

    /* Check wave change → clear pools */
    try {
      var w = window.GameManager && GameManager.getCurrentWave ? GameManager.getCurrentWave() : -1;
      if (w !== _lastWave && w > 0) {
        if (_lastWave > 0) _clearAll();
        _lastWave = w;
      }
    } catch(e){}

    /* Scan every 4 frames (~67ms) */
    if (_frameN % 4 === 0) _scan();

    /* Fade in pools */
    for (var i = 0; i < _pools.length; i++) {
      var p = _pools[i];
      if (p.opacity < p.targetOp) {
        p.opacity = Math.min(p.targetOp, p.opacity + FADE_IN_SPD * dt);
        p.mesh.material.opacity = p.opacity;
      }
    }
  }

  /* ── Init ──────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;
    if (typeof THREE === 'undefined') return;
    requestAnimationFrame(_tick);
  }

  return { init: init, clear: _clearAll };
})();

window.BloodDecals = BloodDecals;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { BloodDecals.init(); });
} else {
  BloodDecals.init();
}
