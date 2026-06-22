window.ExplosiveBarrels = (function() {
  'use strict';
  // var only

  var _scene = null;
  var _barrels = [];
  var _explosionCallback = null; // fn(x, y, z, radius, damage)

  var BARREL_HP = 30;
  var EXPLOSION_RADIUS = 6;
  var EXPLOSION_DAMAGE = 80;
  var CHAIN_DELAY_MS = 120;

  function _buildBarrel(x, y, z) {
    var group = new THREE.Group();

    // Main cylinder
    var bodyGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.8, 10);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0xcc2200 }); // red barrel
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Top cap
    var topGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.08, 10);
    var topMat = new THREE.MeshLambertMaterial({ color: 0x882200 });
    var top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 0.44;
    group.add(top);

    // Warning stripe
    var stripeGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.1, 10, 1, true);
    var stripeMat = new THREE.MeshLambertMaterial({ color: 0xffdd00, side: THREE.BackSide });
    var stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.y = 0.1;
    group.add(stripe);

    group.position.set(x, y + 0.4, z);

    if (_scene) _scene.add(group);

    return {
      mesh: group,
      hp: BARREL_HP,
      maxHp: BARREL_HP,
      x: x, y: y, z: z,
      exploded: false,
      _explodeTimer: -1,
    };
  }

  function addBarrel(x, z) {
    var y = 0;
    // try to get terrain height
    if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) {
      y = VoxelWorld.getTerrainHeight(x, z);
    }
    _barrels.push(_buildBarrel(x, y, z));
  }

  function setupForLevel(levelId) {
    clear();

    // Default barrel positions (scattered around playfield)
    var positions = [
      [-12, -8], [12, -8], [-8, 12], [8, 12],
      [-20, 0], [20, 0], [0, -20], [0, 20],
      [-15, 15], [15, -15],
    ];

    // Some levels get more barrels (industrial/urban)
    var extras = [];
    if (levelId === 'AZOVSTAL' || levelId === 'TORETSK' || levelId === 'AVDIIVKA') {
      extras = [[-5, -5], [5, -5], [-5, 5], [5, 5], [-18, -8], [18, -8]];
    }
    if (levelId === 'BAKHMUT' || levelId === 'SEVERODONETSK_AZOT') {
      extras = [[3, -12], [-3, -12], [3, 12], [-3, 12]];
    }

    var all = positions.concat(extras);
    for (var i = 0; i < all.length; i++) {
      addBarrel(all[i][0], all[i][1]);
    }
  }

  function hitBarrel(barrelIndex, damage) {
    if (barrelIndex < 0 || barrelIndex >= _barrels.length) return false;
    var b = _barrels[barrelIndex];
    if (b.exploded) return false;

    b.hp -= (damage || 25);

    // Visual damage — darken barrel
    if (b.hp < b.maxHp * 0.5) {
      b.mesh.children[0].material.color.setHex(0x881100);
    }

    if (b.hp <= 0) {
      _triggerExplosion(barrelIndex, 0);
    }
    return true;
  }

  function _triggerExplosion(idx, delay) {
    var b = _barrels[idx];
    if (!b || b.exploded) return;
    b.exploded = true;

    var pos = b.mesh.position;

    // Remove mesh after delay
    setTimeout(function() {
      if (!_scene) return;
      // Remove barrel mesh
      _scene.remove(b.mesh);

      // Explosion flash
      var flash = new THREE.PointLight(0xff6600, 8, EXPLOSION_RADIUS * 2);
      flash.position.copy(pos);
      _scene.add(flash);

      // Fade flash out
      var _fadeFlash = function() {
        if (flash.intensity > 0) {
          flash.intensity -= 0.5;
          if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(_fadeFlash);
        } else {
          if (_scene) _scene.remove(flash);
        }
      };
      if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(_fadeFlash);

      // Smoke sphere
      var smokeGeo = new THREE.SphereGeometry(1.5, 6, 6);
      var smokeMat = new THREE.MeshLambertMaterial({
        color: 0x333333, transparent: true, opacity: 0.7, depthWrite: false
      });
      var smoke = new THREE.Mesh(smokeGeo, smokeMat);
      smoke.position.copy(pos);
      _scene.add(smoke);
      // Expand and fade smoke
      var smokeAge = 0;
      var _animSmoke = function() {
        smokeAge += 0.06;
        smoke.scale.setScalar(1 + smokeAge * 2);
        smoke.material.opacity = Math.max(0, 0.7 - smokeAge * 0.4);
        if (smokeAge < 2 && typeof requestAnimationFrame !== 'undefined') {
          requestAnimationFrame(_animSmoke);
        } else {
          if (_scene) _scene.remove(smoke);
        }
      };
      if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(_animSmoke);

      // Deal damage via callback
      if (_explosionCallback) {
        _explosionCallback(pos.x, pos.y, pos.z, EXPLOSION_RADIUS, EXPLOSION_DAMAGE);
      }

      // Chain reaction to nearby barrels
      for (var ci = 0; ci < _barrels.length; ci++) {
        if (_barrels[ci].exploded || ci === idx) continue;
        var nb = _barrels[ci];
        var ddx = nb.mesh.position.x - pos.x;
        var ddz = nb.mesh.position.z - pos.z;
        var ndist = Math.sqrt(ddx*ddx + ddz*ddz);
        if (ndist < EXPLOSION_RADIUS * 1.2) {
          // Chain with slight delay
          (function(nidx) {
            setTimeout(function() { _triggerExplosion(nidx, 0); }, CHAIN_DELAY_MS);
          })(ci);
        }
      }
    }, delay || 0);
  }

  function checkBulletHit(bulletOrigin, bulletDir, maxDist) {
    // Simple sphere intersection test
    for (var i = 0; i < _barrels.length; i++) {
      var b = _barrels[i];
      if (b.exploded) continue;
      var dx = b.mesh.position.x - bulletOrigin.x;
      var dy = b.mesh.position.y - bulletOrigin.y;
      var dz = b.mesh.position.z - bulletOrigin.z;
      // Project onto ray
      var t = dx * bulletDir.x + dy * bulletDir.y + dz * bulletDir.z;
      if (t < 0 || t > maxDist) continue;
      // Perpendicular distance
      var closestX = bulletOrigin.x + bulletDir.x * t - b.mesh.position.x;
      var closestY = bulletOrigin.y + bulletDir.y * t - b.mesh.position.y;
      var closestZ = bulletOrigin.z + bulletDir.z * t - b.mesh.position.z;
      var perpDist = Math.sqrt(closestX*closestX + closestY*closestY + closestZ*closestZ);
      if (perpDist < 0.45) {
        hitBarrel(i, 30);
        return i;
      }
    }
    return -1;
  }

  function getBarrels() { return _barrels; }

  function clear() {
    for (var i = 0; i < _barrels.length; i++) {
      if (_scene && !_barrels[i].exploded) _scene.remove(_barrels[i].mesh);
    }
    _barrels = [];
  }

  function init(scene, onExplosion) {
    _scene = scene;
    _explosionCallback = onExplosion || null;
  }

  return {
    init: init,
    setupForLevel: setupForLevel,
    addBarrel: addBarrel,
    hitBarrel: hitBarrel,
    checkBulletHit: checkBulletHit,
    getBarrels: getBarrels,
    clear: clear,
  };
})();
