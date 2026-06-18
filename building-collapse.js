/* ============================================================
 *  BUILDING-COLLAPSE.JS — gravity-driven structural collapse (passive)
 *
 *  "Can buildings collapse like Red Faction?" — a full per-voxel
 *  structural-integrity solver would be too heavy for a browser/mobile
 *  Three.js game. Instead this delivers the *feel*: heavy explosions
 *  (HIMARS / Javelin / tank rounds / rockets — anything that calls
 *  Tracers.spawnExplosion with a large size) crumble the TOP floors of
 *  a nearby voxel building down into a growing rubble pile, with a dust
 *  plume and a brief screen shake.
 *
 *  Uses only public VoxelWorld APIs: getBuildings(), getBlock(),
 *  setBlock(), getTerrainHeight(). The collapse is animated top-down
 *  over ~0.6s so it reads as the structure crashing down, not vanishing.
 *
 *  Each building can be demolished floor-by-floor across several heavy
 *  hits (cooldown-gated), then becomes a rubble heap. Small explosions
 *  (grenades, bullets) are ignored — only ordnance brings a building down.
 *
 *  Entirely engine-side (no canvas/DOM). Passive — no keybind.
 * ============================================================ */
var BuildingCollapse = (function () {
  'use strict';

  var BIG_SIZE     = 4.0;   /* min explosion size to trigger a collapse */
  var RANGE        = 26;    /* world units: explosion→building footprint */
  var COOLDOWN     = 1.6;   /* seconds between collapses of the same building */
  var MAX_FLOORS   = 4;     /* max floors a single building can lose */
  var VOX_PER_TICK = 7;     /* voxels removed per frame (collapse speed) */
  var DUST_EVERY   = 5;     /* spawn dust every Nth removed voxel */

  var _init       = false;
  var _hooked     = false;
  var _origExpl   = null;
  var _lastTs     = 0;
  var _frameN     = 0;
  var _collapses  = [];                 /* active animations */
  var _cooldown   = new WeakMap();      /* building → last collapse time (s) */
  var _floorsLost = new WeakMap();      /* building → floors removed */

  function _now() { return performance.now() / 1000; }

  function _vw() { return (typeof VoxelWorld !== 'undefined') ? VoxelWorld : (typeof window !== 'undefined' ? window.VoxelWorld : null); }

  function _isSolid(t) {
    if (t === undefined || t === null) return false;
    var B = window.BLOCK || {};
    return t !== (B.AIR !== undefined ? B.AIR : 0) && t !== B.WATER;
  }

  /* Hook Tracers.spawnExplosion to listen for ordnance impacts.
   * Real signature is spawnExplosion(posVector3, radius) — earlier this hook
   * wrongly assumed (x,y,z,size), so size was always undefined and the collapse
   * never fired from real explosions (only via the test() backdoor). */
  function _hook() {
    try {
      if (_hooked) return;
      if (typeof Tracers === 'undefined' || !Tracers.spawnExplosion) return;
      _origExpl = Tracers.spawnExplosion.bind(Tracers);
      Tracers.spawnExplosion = function (pos, radius) {
        _origExpl(pos, radius);
        try {
          var x, y, z, size;
          if (pos && typeof pos === 'object') { x = pos.x; y = pos.y; z = pos.z; size = radius; }
          else { x = pos; y = radius; z = arguments[2]; size = arguments[3]; } // legacy (x,y,z,size) callers
          _onExplosion(x, y, z, size);
        } catch (e) {}
      };
      _hooked = true;
    } catch (e) {}
  }

  /* Spawn dust via the original (pos, radius) signature without re-triggering us. */
  function _dust(x, y, z, size) {
    try {
      if (!_origExpl) return;
      if (typeof THREE !== 'undefined') _origExpl(new THREE.Vector3(x, y, z), size);
      else _origExpl({ x: x, y: y, z: z }, size);
    } catch (e) {}
  }

  function _onExplosion(x, y, z, size) {
    if (!size || size < BIG_SIZE) return;
    var vw = _vw();
    if (!vw || !vw.getBuildings || !vw.setBlock || !vw.getBlock) return;

    var blds;
    try { blds = vw.getBuildings(); } catch (e) { return; }
    if (!blds || !blds.length) return;

    /* Nearest eligible building to the blast. */
    var best = null, bestD = RANGE * RANGE;
    for (var i = 0; i < blds.length; i++) {
      var b = blds[i];
      if (!b || b.kind !== 'apartment') continue;
      var lost = _floorsLost.get(b) || 0;
      if (lost >= Math.min(MAX_FLOORS, (b.floors || 6) - 1)) continue; /* keep ground floor */
      var bcx = (b.cx !== undefined) ? b.cx : (b.x + (b.w || 12) / 2);
      var bcz = (b.cz !== undefined) ? b.cz : (b.z + (b.d || 10) / 2);
      var dx = bcx - x, dz = bcz - z;
      var d2 = dx * dx + dz * dz;
      if (d2 < bestD) { bestD = d2; best = b; }
    }
    if (!best) return;

    var last = _cooldown.get(best) || 0;
    if (_now() - last < COOLDOWN) return;
    _cooldown.set(best, _now());

    _startCollapse(best);
  }

  function _startCollapse(b) {
    var vw = _vw();
    var lost   = _floorsLost.get(b) || 0;
    var floorH = b.floorH || 3;
    var baseY  = (b.baseY !== undefined) ? b.baseY : vw.getTerrainHeight(b.x, b.z);
    var floors = b.floors || 6;

    /* Y-band of the current top floor (from the top, descending as it loses floors). */
    var topY = baseY + (floors - lost) * floorH + 2;
    var botY = baseY + (floors - lost - 1) * floorH + 1;
    if (botY < baseY + 2) return;   /* never collapse the ground floor */

    var w = b.w || 12, d = b.d || 10;
    var voxels = [];
    for (var y = topY; y >= botY; y--) {            /* top-down so it crumbles */
      for (var ix = 0; ix < w; ix++) {
        for (var iz = 0; iz < d; iz++) {
          var wx = b.x + ix, wz = b.z + iz;
          var t = vw.getBlock(wx, y, wz);
          if (_isSolid(t)) voxels.push([wx, y, wz]);
        }
      }
    }
    if (!voxels.length) { _floorsLost.set(b, lost + 1); return; }

    _collapses.push({
      b: b, voxels: voxels, idx: 0, removed: 0,
      baseY: baseY, cx: b.x + Math.floor(w / 2), cz: b.z + Math.floor(d / 2),
    });

    /* Big dust burst + shake at the start. */
    _dust(b.x + Math.floor(w / 2), topY, b.z + Math.floor(d / 2), 3.0);
    try { if (typeof Feedback !== 'undefined' && Feedback.screenShake) Feedback.screenShake(0.6); } catch (e) {}
    _floorsLost.set(b, lost + 1);
  }

  function _stepCollapse(c) {
    var vw = _vw();
    var B  = window.BLOCK || {};
    var AIR    = (B.AIR !== undefined) ? B.AIR : 0;
    var RUBBLE = (B.RUBBLE !== undefined) ? B.RUBBLE : 16;
    var n = 0;
    while (n < VOX_PER_TICK && c.idx < c.voxels.length) {
      var v = c.voxels[c.idx++];
      var wx = v[0], wy = v[1], wz = v[2];
      /* Remove the upper voxel — it "falls". */
      vw.setBlock(wx, wy, wz, AIR);
      /* Drop rubble onto the pile at the base column (gravity outcome). */
      if (Math.random() < 0.30) {
        var gy = vw.getTerrainHeight(wx, wz);
        var py = gy + 1;
        /* stack up to a couple of blocks so a heap forms */
        if (!_isSolid(vw.getBlock(wx, py, wz))) vw.setBlock(wx, py, wz, RUBBLE);
        else if (!_isSolid(vw.getBlock(wx, py + 1, wz))) vw.setBlock(wx, py + 1, wz, RUBBLE);
      }
      c.removed++;
      if (c.removed % DUST_EVERY === 0) _dust(wx, wy, wz, 1.4);
      n++;
    }
    return c.idx >= c.voxels.length;
  }

  function _tick(ts) {
    requestAnimationFrame(_tick);
    _frameN++;
    _lastTs = ts;

    if (!_hooked) _hook();  // retry every frame until Tracers is ready (cheap: early-returns once hooked)

    for (var i = _collapses.length - 1; i >= 0; i--) {
      var done = false;
      try { done = _stepCollapse(_collapses[i]); } catch (e) { done = true; }
      if (done) _collapses.splice(i, 1);
    }
  }

  function init() {
    if (_init) return;
    _init = true;
    _hook();
    requestAnimationFrame(_tick);
  }

  /* Manual trigger for testing from the console. */
  function test() {
    try {
      var vw = _vw();
      var blds = vw.getBuildings();
      if (blds && blds.length) { _cooldown.delete(blds[0]); _startCollapse(blds[0]); return 'collapsing ' + blds[0].x + ',' + blds[0].z; }
      return 'no buildings';
    } catch (e) { return 'err ' + e.message; }
  }

  return { init: init, test: test };
})();

window.BuildingCollapse = BuildingCollapse;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { BuildingCollapse.init(); });
} else {
  BuildingCollapse.init();
}
