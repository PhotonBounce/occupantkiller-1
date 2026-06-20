/* ════════════════════════════════════════════════════════════════════════
 *  COLLAPSE-PHYSICS.JS — Red Faction-style building collapse
 *
 *  Improvements over v1:
 *  - Lateral spread: adjacent columns collapse when they lose support
 *  - Multiple debris chunks per block (2-3) for visual drama
 *  - Horizontal velocity so debris scatters outward
 *  - Stronger gravity (35 units/s²)
 *  - Recursive spread capped at depth 4 to avoid performance spikes
 *
 *  Hook: call CollapsePhysics.onBlockDestroyed(scene, x, y, z)
 *        CollapsePhysics.update(scene, delta) — in game loop
 *        CollapsePhysics.clear(scene)         — on stage change
 * ════════════════════════════════════════════════════════════════════════ */
const CollapsePhysics = (function () {
  'use strict';

  var STRUCTURAL = { 3: true, 4: true, 5: true, 9: true, 10: true, 11: true, 18: true };

  var BLOCK_COLOR = {
    3:  0x888888,
    4:  0x8B5E3C,
    5:  0x7a7a7a,
    9:  0xaaaaaa,
    10: 0xb87060,
    11: 0x88c8e0,
    18: 0x333333,
  };

  var _fallers  = [];
  var _matCache = {};
  var _chunkGeo = null;

  function _mat(hex) {
    if (_matCache[hex]) return _matCache[hex];
    var m = new THREE.MeshLambertMaterial({ color: hex });
    _matCache[hex] = m;
    return m;
  }

  function _geo() {
    if (!_chunkGeo) _chunkGeo = new THREE.BoxGeometry(0.85, 0.85, 0.85);
    return _chunkGeo;
  }

  function _spawnDebris(scene, wx, wy, wz, blockType, heightFactor) {
    if (!scene) return;
    heightFactor = heightFactor || 0;
    var hex = BLOCK_COLOR[blockType] || 0x999999;
    var count = 2 + (Math.random() < 0.4 ? 1 : 0); // 2 or 3 chunks

    var groundY = 0;
    try {
      if (window.VoxelWorld && window.VoxelWorld.getTopSolidY) {
        groundY = window.VoxelWorld.getTopSolidY(wx, wz) || 0;
      }
    } catch (e) {}

    for (var i = 0; i < count; i++) {
      var mesh = new THREE.Mesh(_geo(), _mat(hex));
      var scale = 0.55 + Math.random() * 0.65;
      mesh.scale.set(scale, scale, scale);

      mesh.position.set(
        wx + 0.5 + (Math.random() - 0.5) * 0.9,
        wy + 0.5 + Math.random() * 0.3,
        wz + 0.5 + (Math.random() - 0.5) * 0.9
      );

      var upVel = 2 + heightFactor * 0.4 + Math.random() * 5;
      var outAngle = Math.random() * Math.PI * 2;
      var outSpd  = 1.5 + Math.random() * 3.5;

      scene.add(mesh);
      _fallers.push({
        mesh:    mesh,
        vy:      upVel,
        vx:      Math.cos(outAngle) * outSpd,
        vz:      Math.sin(outAngle) * outSpd,
        rx:      (Math.random() - 0.5) * 10,
        rz:      (Math.random() - 0.5) * 10,
        groundY: Math.min(groundY + 0.3, wy - 0.2),
        settled: 0,
      });
    }
  }

  // Track which (x,y,z) columns are already being collapsed this frame
  // to avoid double-processing in recursive lateral spread
  var _processing = {};

  function onBlockDestroyed(scene, wx, wy, wz, _depth) {
    if (!scene || typeof THREE === 'undefined') return;
    var VW = window.VoxelWorld;
    if (!VW || !VW.getBlock || !VW.setBlock) return;
    var AIR = (VW.BLOCK && VW.BLOCK.AIR) ? VW.BLOCK.AIR : 0;
    _depth = _depth || 0;

    var key = wx + ',' + wy + ',' + wz;
    if (_processing[key]) return;
    _processing[key] = true;

    // Walk upward: collapse every block in the column above the destroyed block
    var topFell = 0;
    for (var dy = 1; dy <= 28; dy++) {
      var ty = wy + dy;
      var blockType = VW.getBlock(wx, ty, wz);
      if (!blockType || blockType === AIR) break;

      // Check if block still has solid support directly below
      var below = VW.getBlock(wx, ty - 1, wz);
      if (below && below !== AIR) break;

      VW.setBlock(wx, ty, wz, AIR);
      _spawnDebris(scene, wx, ty, wz, blockType, dy);
      topFell++;
    }

    // Lateral spread to adjacent columns — makes buildings actually crumble
    if (_depth < 4 && topFell >= 1) {
      var neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (var ni = 0; ni < neighbors.length; ni++) {
        var nx = wx + neighbors[ni][0];
        var nz = wz + neighbors[ni][1];
        var nKey = nx + ',' + wy + ',' + nz;
        if (_processing[nKey]) continue;

        var adjBlock = VW.getBlock(nx, wy, nz);
        if (!adjBlock || adjBlock === AIR) continue;
        if (!STRUCTURAL[adjBlock]) continue;

        // Spread probability: higher if adj block also has no support below
        var adjBelow = VW.getBlock(nx, wy - 1, nz);
        var noSupport = !adjBelow || adjBelow === AIR;
        var prob = noSupport ? 0.70 : 0.30;

        if (Math.random() < prob) {
          VW.setBlock(nx, wy, nz, AIR);
          _spawnDebris(scene, nx, wy, nz, adjBlock, 0);
          onBlockDestroyed(scene, nx, wy, nz, _depth + 1);
        }
      }
    }

    // Clean up processing map (frame-level, small footprint)
    if (_depth === 0) _processing = {};
  }

  function update(scene, delta) {
    if (!scene || !delta || _fallers.length === 0) return;

    // Safety cap — older debris removed first if pile gets too big
    while (_fallers.length > 220) {
      var oldest = _fallers.shift();
      if (oldest.mesh) { scene.remove(oldest.mesh); }
    }

    for (var i = _fallers.length - 1; i >= 0; i--) {
      var f = _fallers[i];
      f.vy -= 35 * delta;
      f.mesh.position.y += f.vy * delta;
      f.mesh.position.x += f.vx * delta;
      f.mesh.position.z += f.vz * delta;
      f.mesh.rotation.x += f.rx * delta;
      f.mesh.rotation.z += f.rz * delta;

      // Air drag on horizontal velocity
      f.vx *= Math.max(0, 1 - delta * 1.8);
      f.vz *= Math.max(0, 1 - delta * 1.8);

      if (f.mesh.position.y <= f.groundY) {
        f.mesh.position.y = f.groundY;
        if (Math.abs(f.vy) > 2.5) {
          f.vy *= -0.12; // very small bounce
          f.rx *= 0.2; f.rz *= 0.2;
          f.vx *= 0.25; f.vz *= 0.25;
        } else {
          f.vy = 0; f.rx = 0; f.rz = 0; f.vx = 0; f.vz = 0;
          f.settled += delta;
          if (f.settled > 4.5) {
            scene.remove(f.mesh);
            _fallers.splice(i, 1);
          }
        }
      }
    }
  }

  function clear(scene) {
    for (var i = 0; i < _fallers.length; i++) {
      if (scene && _fallers[i].mesh) scene.remove(_fallers[i].mesh);
    }
    _fallers.length = 0;
    _processing = {};
  }

  if (typeof window !== 'undefined') window.CollapsePhysics = { onBlockDestroyed: onBlockDestroyed, update: update, clear: clear };
  return { onBlockDestroyed: onBlockDestroyed, update: update, clear: clear };
})();
