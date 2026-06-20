/* ════════════════════════════════════════════════════════════════════════
 *  COLLAPSE-PHYSICS.JS — Red Faction-style column collapse
 *
 *  When a structural block is destroyed, the column of blocks directly
 *  above it (up to 20 high) loses support and falls as animated debris
 *  chunks under gravity. Each chunk bounces once then settles.
 *
 *  Hook: call CollapsePhysics.onBlockDestroyed(scene, x, y, z) from the
 *  terrain-shot callback. Call CollapsePhysics.update(scene, delta) from
 *  the game loop. Call CollapsePhysics.clear(scene) on stage change.
 *
 *  Depends on: THREE.js global, window.VoxelWorld (setBlock + getBlock)
 * ════════════════════════════════════════════════════════════════════════ */
const CollapsePhysics = (function () {
  'use strict';

  // Blocks whose destruction can trigger collapse (structural block types)
  var STRUCTURAL = { 3: true, 4: true, 5: true, 9: true, 10: true, 11: true, 18: true };

  // Visual color per block type (approximate voxel palette)
  var BLOCK_COLOR = {
    3:  0x888888, // STONE
    4:  0x8B5E3C, // WOOD
    5:  0x7a7a7a, // METAL
    9:  0xaaaaaa, // CONCRETE
    10: 0xb87060, // BRICK
    11: 0x88c8e0, // GLASS
    18: 0x333333, // ASPHALT
  };

  var _fallers   = [];   // active falling chunks
  var _matCache  = {};   // THREE.Material cache keyed by hex

  function _mat(hex) {
    if (_matCache[hex]) return _matCache[hex];
    var m = new THREE.MeshLambertMaterial({ color: hex });
    _matCache[hex] = m;
    return m;
  }

  var _chunkGeo = null;
  function _geo() {
    if (!_chunkGeo) _chunkGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    return _chunkGeo;
  }

  function _spawnDebris(scene, wx, wy, wz, blockType) {
    var hex = BLOCK_COLOR[blockType] || 0x999999;
    var mesh = new THREE.Mesh(_geo(), _mat(hex));
    mesh.position.set(wx + 0.5, wy + 0.5, wz + 0.5);

    // Slight random horizontal scatter
    mesh.position.x += (Math.random() - 0.5) * 0.4;
    mesh.position.z += (Math.random() - 0.5) * 0.4;

    var groundY = 0;
    try {
      if (window.VoxelWorld && window.VoxelWorld.getTopSolidY) {
        groundY = window.VoxelWorld.getTopSolidY(wx, wz);
      }
    } catch (e) {}
    groundY += 0.45; // rest on ground surface

    scene.add(mesh);
    _fallers.push({
      mesh:    mesh,
      vy:      0,
      rx:      (Math.random() - 0.5) * 6,
      rz:      (Math.random() - 0.5) * 6,
      groundY: Math.min(groundY, wy - 0.5), // don't go higher than spawn
      settled: 0,
    });
  }

  // Called when a block at (x,y,z) is destroyed.
  // Checks the column above: any blocks that lose support fall as debris.
  function onBlockDestroyed(scene, wx, wy, wz) {
    if (!scene || typeof THREE === 'undefined') return;
    var VW = window.VoxelWorld;
    if (!VW || !VW.getBlock || !VW.setBlock) return;
    var AIR = (VW.BLOCK && VW.BLOCK.AIR) ? VW.BLOCK.AIR : 0;

    // Walk up the column; stop at the first gap or non-structural block
    for (var dy = 1; dy <= 20; dy++) {
      var ty = wy + dy;
      var blockType = VW.getBlock(wx, ty, wz);
      if (!blockType || blockType === AIR) break;

      // Check support from adjacent/below — simplified: only check directly below
      var below = VW.getBlock(wx, ty - 1, wz);
      if (below && below !== AIR) break; // still supported, stop cascade

      // Unsupported — pull from world and create falling chunk
      VW.setBlock(wx, ty, wz, AIR);
      _spawnDebris(scene, wx, ty, wz, blockType);
    }
  }

  function update(scene, delta) {
    if (!scene || !delta || _fallers.length === 0) return;
    for (var i = _fallers.length - 1; i >= 0; i--) {
      var f = _fallers[i];
      f.vy -= 20 * delta; // gravity
      f.mesh.position.y += f.vy * delta;
      f.mesh.rotation.x += f.rx * delta;
      f.mesh.rotation.z += f.rz * delta;

      if (f.mesh.position.y <= f.groundY) {
        f.mesh.position.y = f.groundY;
        if (Math.abs(f.vy) > 1) {
          f.vy *= -0.25; // small bounce
          f.rx *= 0.3;
          f.rz *= 0.3;
        } else {
          f.vy = 0; f.rx = 0; f.rz = 0;
          f.settled += delta;
          if (f.settled > 3) {
            scene.remove(f.mesh);
            _fallers.splice(i, 1);
          }
        }
      }
    }
  }

  function clear(scene) {
    _fallers.forEach(function (f) { if (scene) scene.remove(f.mesh); });
    _fallers.length = 0;
  }

  if (typeof window !== 'undefined') window.CollapsePhysics = { onBlockDestroyed: onBlockDestroyed, update: update, clear: clear };
  return { onBlockDestroyed: onBlockDestroyed, update: update, clear: clear };
})();
