window.Destructibles = (function() {
  'use strict';

  var _scene = null;
  var _objects = [];

  // Object types
  var TYPE_CRATE     = 'crate';
  var TYPE_BARREL    = 'barrel';
  var TYPE_SANDBAG   = 'sandbag';
  var TYPE_GLASS     = 'glass';

  // Colours
  var COL_WOOD       = 0x6b3a1f;
  var COL_WOOD_DARK  = 0x4a2710;
  var COL_BARREL     = 0x444444;
  var COL_SAND       = 0xc4a35a;
  var COL_GLASS      = 0x88ccff;
  var COL_AMMO       = 0x22bb44;
  var COL_FRAG       = 0x7a4a2a;
  var COL_SPARK      = 0xffffaa;
  var COL_GLASS_SHARD = 0xaaddff;

  // Bounding sphere radii
  var RAD_CRATE   = 1.1;
  var RAD_BARREL  = 0.55;
  var RAD_SANDBAG = 1.2;
  var RAD_GLASS   = 1.1;

  // Fragment physics state
  var _fragments = [];

  // ─── Helpers ─────────────────────────────────────────────────────────

  function _rng(lo, hi) {
    return lo + Math.random() * (hi - lo);
  }

  function _makeBox(w, h, d, color, opacity) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var opts = { color: color };
    if (typeof opacity === 'number' && opacity < 1) {
      opts.transparent = true;
      opts.opacity = opacity;
    }
    return new THREE.MeshLambertMaterial(opts);
  }

  // ─── Fragment system ─────────────────────────────────────────────────

  function _spawnFragment(x, y, z, w, h, d, color, vx, vy, vz, life) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    if (_scene) _scene.add(mesh);
    _fragments.push({
      mesh: mesh,
      vx: vx, vy: vy, vz: vz,
      life: life || 1.2,
      age: 0,
      spinning: true,
    });
  }

  function _spawnSphere(x, y, z, r, color, vx, vy, vz, life) {
    var geo = new THREE.SphereGeometry(r, 4, 4);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    if (_scene) _scene.add(mesh);
    _fragments.push({
      mesh: mesh,
      vx: vx, vy: vy, vz: vz,
      life: life || 0.5,
      age: 0,
      spinning: false,
    });
  }

  function _flashLight(x, y, z, color, intensity, duration) {
    if (!_scene) return;
    var light = new THREE.PointLight(color, intensity, 8);
    light.position.set(x, y, z);
    _scene.add(light);
    var elapsed = 0;
    var step = function() {
      elapsed += 0.016;
      light.intensity = intensity * Math.max(0, 1 - elapsed / duration);
      if (elapsed < duration) {
        if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(step);
      } else {
        if (_scene) _scene.remove(light);
      }
    };
    if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(step);
  }

  // ─── Ammo pickup ─────────────────────────────────────────────────────

  function _spawnAmmoPickup(x, y, z) {
    var geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    var mat = new THREE.MeshLambertMaterial({ color: COL_AMMO });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + 0.25, z);
    mesh.userData.isAmmoPickup = true;
    mesh.userData.ammoAmt = 30;
    if (_scene) _scene.add(mesh);
    // Pulse the pickup so it's visible
    _objects.push({
      type: 'ammo_pickup',
      mesh: mesh,
      age: 0,
      x: x, y: y + 0.25, z: z,
      destroyed: false,
      hp: 1,
      maxHp: 1,
      radius: 0.4,
    });
  }

  // ─── Wooden Crate ─────────────────────────────────────────────────────

  function _buildCrate(x, y, z) {
    var group = new THREE.Group();

    // Main body
    var bodyMat = _makeBox(1.2, 1.2, 1.2, COL_WOOD);
    var body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), bodyMat);
    group.add(body);

    // Dark edge strips — 4 vertical corner accents
    var edgeMat = new THREE.MeshLambertMaterial({ color: COL_WOOD_DARK });
    var edgePositions = [
      [0.55, 0, 0],  [-0.55, 0, 0],
      [0, 0, 0.55],  [0, 0, -0.55],
    ];
    for (var ei = 0; ei < edgePositions.length; ei++) {
      var ep = edgePositions[ei];
      var ew = (ep[0] !== 0) ? 0.08 : 1.22;
      var ed = (ep[2] !== 0) ? 0.08 : 1.22;
      var edgeGeo = new THREE.BoxGeometry(ew, 1.22, ed);
      var edgeMesh = new THREE.Mesh(edgeGeo, edgeMat);
      edgeMesh.position.set(ep[0], ep[1], ep[2]);
      group.add(edgeMesh);
    }

    // Cross planks on top face (X shape)
    var plankMat = new THREE.MeshLambertMaterial({ color: COL_WOOD_DARK });
    var plank1 = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.08, 0.1), plankMat);
    plank1.position.set(0, 0.62, 0);
    plank1.rotation.y = 0.42; // ~24 degrees
    group.add(plank1);
    var plank2 = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.08, 0.1), plankMat);
    plank2.position.set(0, 0.62, 0);
    plank2.rotation.y = -0.42;
    group.add(plank2);

    // Cross planks on front face
    var fp1 = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.1, 0.08), plankMat);
    fp1.position.set(0, 0, 0.62);
    fp1.rotation.z = 0.42;
    group.add(fp1);
    var fp2 = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.1, 0.08), plankMat);
    fp2.position.set(0, 0, 0.62);
    fp2.rotation.z = -0.42;
    group.add(fp2);

    group.position.set(x, y + 0.6, z);
    if (_scene) _scene.add(group);

    return {
      type: TYPE_CRATE,
      mesh: group,
      hp: 3, maxHp: 3,
      x: x, y: y, z: z,
      destroyed: false,
      radius: RAD_CRATE,
    };
  }

  function _destroyCrate(obj) {
    if (!_scene || obj.destroyed) return;
    obj.destroyed = true;
    var px = obj.mesh.position.x;
    var py = obj.mesh.position.y;
    var pz = obj.mesh.position.z;
    _scene.remove(obj.mesh);

    // 12 wood fragments
    for (var fi = 0; fi < 12; fi++) {
      _spawnFragment(
        px + _rng(-0.4, 0.4),
        py + _rng(0, 0.4),
        pz + _rng(-0.4, 0.4),
        0.15, 0.15, 0.15,
        COL_FRAG,
        _rng(-3, 3), _rng(1.5, 4), _rng(-3, 3),
        1.5
      );
    }

    // Light flash
    _flashLight(px, py, pz, 0xffaa44, 3, 0.3);

    // 25% loot drop
    if (Math.random() < 0.25) {
      _spawnAmmoPickup(obj.x, obj.y, obj.z);
    }
  }

  function _hitCrate(obj) {
    // Hit particles: 5 tiny cubes
    var px = obj.mesh.position.x;
    var py = obj.mesh.position.y;
    var pz = obj.mesh.position.z;
    for (var pi = 0; pi < 5; pi++) {
      _spawnFragment(
        px + _rng(-0.3, 0.3),
        py + _rng(0, 0.3),
        pz + _rng(-0.3, 0.3),
        0.08, 0.08, 0.08,
        COL_WOOD,
        _rng(-2, 2), _rng(1, 3), _rng(-2, 2),
        0.6
      );
    }
    // Darken on each hit
    var stage = 1 - (obj.hp / obj.maxHp);
    var darkened = Math.floor(0x6b3a1f * (1 - stage * 0.5));
    if (obj.mesh.children[0] && obj.mesh.children[0].material) {
      obj.mesh.children[0].material.color.setHex(darkened);
    }
  }

  // ─── Metal Barrel ─────────────────────────────────────────────────────

  function _buildBarrel(x, y, z) {
    var group = new THREE.Group();

    var bodyMat = new THREE.MeshLambertMaterial({ color: COL_BARREL });
    var body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.7, 8), bodyMat);
    group.add(body);

    // Top ring
    var ringMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var ring = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.06, 8, 1, true), ringMat);
    ring.position.y = 0.32;
    group.add(ring);

    // Bottom ring
    var ringB = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.06, 8, 1, true), ringMat);
    ringB.position.y = -0.28;
    group.add(ringB);

    group.position.set(x, y + 0.35, z);
    if (_scene) _scene.add(group);

    return {
      type: TYPE_BARREL,
      mesh: group,
      hp: 5, maxHp: 5,
      x: x, y: y, z: z,
      destroyed: false,
      radius: RAD_BARREL,
    };
  }

  function _destroyBarrel(obj) {
    if (!_scene || obj.destroyed) return;
    obj.destroyed = true;
    var px = obj.mesh.position.x;
    var py = obj.mesh.position.y;
    var pz = obj.mesh.position.z;
    _scene.remove(obj.mesh);

    // 6 flat cylinder slices
    for (var si = 0; si < 6; si++) {
      var angle = (si / 6) * Math.PI * 2;
      var vx = Math.cos(angle) * _rng(1, 3);
      var vz = Math.sin(angle) * _rng(1, 3);
      _spawnFragment(
        px + Math.cos(angle) * 0.2,
        py + _rng(-0.2, 0.2),
        pz + Math.sin(angle) * 0.2,
        0.35, 0.12, 0.35,
        0x333333,
        vx, _rng(0.5, 2), vz,
        1.2
      );
    }
  }

  function _hitBarrel(obj) {
    // Sparks: 3 tiny bright spheres
    var px = obj.mesh.position.x;
    var py = obj.mesh.position.y;
    var pz = obj.mesh.position.z;
    for (var si = 0; si < 3; si++) {
      var sparkColor = (Math.random() > 0.5) ? 0xffffff : 0xffee44;
      _spawnSphere(
        px + _rng(-0.2, 0.2),
        py + _rng(-0.1, 0.2),
        pz + _rng(-0.2, 0.2),
        0.05, sparkColor,
        _rng(-3, 3), _rng(1, 4), _rng(-3, 3),
        0.3
      );
    }
    // Darken with damage
    if (obj.hp < obj.maxHp * 0.5 && obj.mesh.children[0]) {
      obj.mesh.children[0].material.color.setHex(0x222222);
    }
  }

  // ─── Sandbag Wall ─────────────────────────────────────────────────────

  function _buildSandbag(x, y, z) {
    var group = new THREE.Group();
    var matMain = new THREE.MeshLambertMaterial({ color: COL_SAND });
    var matBump = new THREE.MeshLambertMaterial({ color: 0xb8943a });

    var bags = [];

    for (var row = 0; row < 3; row++) {
      var bagGeo = new THREE.BoxGeometry(1.4, 0.5, 0.6);
      var bag = new THREE.Mesh(bagGeo, matMain);
      bag.position.y = row * 0.52;
      group.add(bag);
      bags.push(bag);

      // Bump overlay for texture
      var bumpGeo = new THREE.BoxGeometry(0.6, 0.52, 0.62);
      var bumpMesh = new THREE.Mesh(bumpGeo, matBump);
      bumpMesh.position.set(_rng(-0.2, 0.2), row * 0.52, 0);
      group.add(bumpMesh);
    }

    group.position.set(x, y + 0.25, z);
    if (_scene) _scene.add(group);

    return {
      type: TYPE_SANDBAG,
      mesh: group,
      bags: bags,
      hp: 8, maxHp: 8,
      x: x, y: y, z: z,
      destroyed: false,
      radius: RAD_SANDBAG,
      _topGone: false,
      _midGone: false,
    };
  }

  function _hitSandbag(obj) {
    // Degrade at thresholds
    if (!obj._topGone && obj.hp <= 4) {
      obj._topGone = true;
      // Remove top bag visually (index 2 = top row)
      var topBag = obj.bags[2];
      if (topBag) {
        obj.mesh.remove(topBag);
        // Scatter some sand fragments
        var px = obj.mesh.position.x;
        var py = obj.mesh.position.y + 1.1;
        var pz = obj.mesh.position.z;
        for (var si = 0; si < 4; si++) {
          _spawnFragment(
            px + _rng(-0.5, 0.5), py, pz + _rng(-0.2, 0.2),
            0.15, 0.08, 0.15, COL_SAND,
            _rng(-1.5, 1.5), _rng(0.5, 2), _rng(-1.5, 1.5),
            0.8
          );
        }
      }
    }
    if (!obj._midGone && obj.hp <= 2) {
      obj._midGone = true;
      var midBag = obj.bags[1];
      if (midBag) {
        obj.mesh.remove(midBag);
        var px2 = obj.mesh.position.x;
        var py2 = obj.mesh.position.y + 0.5;
        var pz2 = obj.mesh.position.z;
        for (var si2 = 0; si2 < 4; si2++) {
          _spawnFragment(
            px2 + _rng(-0.5, 0.5), py2, pz2 + _rng(-0.2, 0.2),
            0.15, 0.08, 0.15, COL_SAND,
            _rng(-1.5, 1.5), _rng(0.5, 2), _rng(-1.5, 1.5),
            0.8
          );
        }
      }
    }
    // Sandbags never fully "destroyed" — hp floor at 1
    if (obj.hp < 1) obj.hp = 1;
  }

  // ─── Glass Panel ─────────────────────────────────────────────────────

  function _buildGlass(x, y, z) {
    var geo = new THREE.BoxGeometry(1.0, 2.0, 0.05);
    var mat = new THREE.MeshLambertMaterial({
      color: COL_GLASS,
      transparent: true,
      opacity: 0.4,
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + 1.0, z);
    if (_scene) _scene.add(mesh);

    return {
      type: TYPE_GLASS,
      mesh: mesh,
      hp: 1, maxHp: 1,
      x: x, y: y, z: z,
      destroyed: false,
      radius: RAD_GLASS,
    };
  }

  function _destroyGlass(obj) {
    if (!_scene || obj.destroyed) return;
    obj.destroyed = true;
    var px = obj.mesh.position.x;
    var py = obj.mesh.position.y;
    var pz = obj.mesh.position.z;
    _scene.remove(obj.mesh);

    // 15-25 glass shards
    var shardCount = 15 + Math.floor(Math.random() * 11);
    for (var gi = 0; gi < shardCount; gi++) {
      var tw = _rng(0.05, 0.25);
      var th = _rng(0.05, 0.3);
      var td = 0.02;
      var shardColor = (Math.random() > 0.5) ? COL_GLASS_SHARD : 0xffffff;
      var frag = {
        mesh: null,
        vx: _rng(-5, 5),
        vy: _rng(1, 6),
        vz: _rng(-5, 5),
        life: _rng(0.4, 1.0),
        age: 0,
        spinning: true,
      };
      var sGeo = new THREE.BoxGeometry(tw, th, td);
      var sMat = new THREE.MeshLambertMaterial({
        color: shardColor,
        transparent: true,
        opacity: 0.6,
      });
      var sMesh = new THREE.Mesh(sGeo, sMat);
      sMesh.position.set(
        px + _rng(-0.4, 0.4),
        py + _rng(-0.8, 0.8),
        pz + _rng(-0.05, 0.05)
      );
      sMesh.rotation.set(_rng(-1, 1), _rng(-1, 1), _rng(-1, 1));
      if (_scene) _scene.add(sMesh);
      frag.mesh = sMesh;
      _fragments.push(frag);
    }

    // Audio: short high-pitched glass crash
    _playGlassCrash();
  }

  function _playGlassCrash() {
    try {
      if (!window._audioCtx) return;
      var ctx = window._audioCtx;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch (_e) {}
  }

  // ─── Public API ───────────────────────────────────────────────────────

  function init(scene) {
    _scene = scene;
    _objects = [];
    _fragments = [];
  }

  function update(delta) {
    var grav = 9.8;
    var i;

    // Animate fragments
    for (i = _fragments.length - 1; i >= 0; i--) {
      var f = _fragments[i];
      f.age += delta;
      f.vy -= grav * delta;
      f.mesh.position.x += f.vx * delta;
      f.mesh.position.y += f.vy * delta;
      f.mesh.position.z += f.vz * delta;
      if (f.spinning) {
        f.mesh.rotation.x += f.vx * delta * 2;
        f.mesh.rotation.z += f.vz * delta * 2;
      }
      // Floor bounce / fade
      if (f.mesh.position.y < 0) {
        f.mesh.position.y = 0;
        f.vy = Math.abs(f.vy) * 0.25;
        f.vx *= 0.6;
        f.vz *= 0.6;
      }
      if (f.age >= f.life) {
        if (_scene) _scene.remove(f.mesh);
        _fragments.splice(i, 1);
      }
    }

    // Ammo pickup rotation + player proximity check
    for (i = _objects.length - 1; i >= 0; i--) {
      var obj = _objects[i];
      if (obj.type === 'ammo_pickup' && !obj.destroyed) {
        obj.age += delta;
        obj.mesh.rotation.y += delta * 2;
        // Check player proximity via global player
        if (typeof player !== 'undefined' && player.position) {
          var pdx = player.position.x - obj.mesh.position.x;
          var pdz = player.position.z - obj.mesh.position.z;
          if (pdx * pdx + pdz * pdz < 0.64) { // 0.8 radius
            obj.destroyed = true;
            if (_scene) _scene.remove(obj.mesh);
            // Give ammo
            if (typeof Weapons !== 'undefined' && Weapons.addAmmo) {
              Weapons.addAmmo(obj.mesh.userData.ammoAmt || 30);
            }
            if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
              HUD.notifyPickup('+30 AMMO', '#22bb44');
            }
            _objects.splice(i, 1);
          }
        }
      }
    }
  }

  function spawnCrate(scene, x, y, z) {
    var sc = scene || _scene;
    var savedScene = _scene;
    _scene = sc;
    var obj = _buildCrate(x, y || 0, z);
    _objects.push(obj);
    _scene = savedScene;
    if (sc !== savedScene) {
      // re-add to correct scene
      if (savedScene && sc) {
        sc.remove(obj.mesh);
        savedScene.add(obj.mesh);
        _scene = savedScene;
      }
    }
    return obj;
  }

  function spawnWoodPile(scene, x, y, z) {
    spawnCrate(scene, x, y, z);
    spawnCrate(scene, x + 1.4, y, z);
    spawnCrate(scene, x + 0.7, y + 1.2, z);
  }

  // ─── Level setup ──────────────────────────────────────────────────────

  function setupForLevel(levelId, scene) {
    clear();
    if (scene) _scene = scene;
    if (!_scene) return;

    var isIndustrial = (levelId === 5 || levelId === 8 || levelId === 12);
    var isUrban = (levelId === 2 || levelId === 3 || levelId === 10 || levelId === 13);

    // Base crates: 4-8 scattered
    var crateCount = 4 + Math.floor(Math.random() * 5);
    if (isIndustrial) crateCount += 3;
    var cratePositions = [
      [-10, 0, -12], [10, 0, -12], [-14, 0, 8], [14, 0, 8],
      [-6, 0, 18], [6, 0, 18], [-18, 0, -6], [18, 0, -6],
      [0, 0, -18], [-12, 0, 2], [12, 0, 2], [0, 0, 14],
    ];
    for (var ci = 0; ci < crateCount && ci < cratePositions.length; ci++) {
      var cp = cratePositions[ci];
      var obj = _buildCrate(cp[0], 0, cp[2]);
      _objects.push(obj);
    }

    // Industrial: extra barrels
    if (isIndustrial) {
      var barrelPos = [
        [-8, 0, -6], [8, 0, -6], [-8, 0, 6], [8, 0, 6],
      ];
      for (var bi = 0; bi < barrelPos.length; bi++) {
        var bp = barrelPos[bi];
        var bobj = _buildBarrel(bp[0], 0, bp[2]);
        _objects.push(bobj);
      }
    }

    // Sandbag walls: 2-4
    var sbCount = 2 + Math.floor(Math.random() * 3);
    if (isUrban) sbCount += 2;
    var sbPositions = [
      [-5, 0, -8], [5, 0, -8], [-16, 0, 0], [16, 0, 0],
      [-5, 0, 10], [5, 0, 10],
    ];
    for (var si = 0; si < sbCount && si < sbPositions.length; si++) {
      var sp = sbPositions[si];
      var sobj = _buildSandbag(sp[0], 0, sp[2]);
      _objects.push(sobj);
    }

    // Glass panels: 2 at choke points
    var glassPositions = [
      [-2, 0, -5], [2, 0, -5],
    ];
    if (isUrban) {
      glassPositions = [
        [-2, 0, -5], [2, 0, -5],
        [-8, 0, 3], [8, 0, 3],
      ];
    }
    for (var gi = 0; gi < 2 && gi < glassPositions.length; gi++) {
      var gp = glassPositions[gi];
      var gobj = _buildGlass(gp[0], 0, gp[2]);
      _objects.push(gobj);
    }
  }

  // ─── Hit detection ────────────────────────────────────────────────────

  function checkBulletHit(rayOrigin, rayDirection, maxDist) {
    for (var i = 0; i < _objects.length; i++) {
      var obj = _objects[i];
      if (obj.destroyed) continue;
      if (!obj.mesh) continue;

      var pos = obj.mesh.position;
      var dx = pos.x - rayOrigin.x;
      var dy = pos.y - rayOrigin.y;
      var dz = pos.z - rayOrigin.z;

      // Project onto ray
      var t = dx * rayDirection.x + dy * rayDirection.y + dz * rayDirection.z;
      if (t < 0 || t > maxDist) continue;

      // Perpendicular distance
      var cx = rayOrigin.x + rayDirection.x * t - pos.x;
      var cy = rayOrigin.y + rayDirection.y * t - pos.y;
      var cz = rayOrigin.z + rayDirection.z * t - pos.z;
      var perpDist = Math.sqrt(cx * cx + cy * cy + cz * cz);

      var rad = obj.radius || 0.8;
      if (perpDist < rad) {
        return { hit: true, object: obj, distance: t };
      }
    }
    return { hit: false };
  }

  function damage(obj, dmg) {
    if (!obj || obj.destroyed) return;
    // Sandbag never fully destroyed
    if (obj.type === TYPE_SANDBAG) {
      obj.hp = Math.max(1, obj.hp - (dmg || 25));
      _hitSandbag(obj);
      return;
    }
    obj.hp -= (dmg || 25);
    if (obj.hp <= 0) {
      obj.hp = 0;
      _destroyObject(obj);
    } else {
      _hitObject(obj);
    }
  }

  function _hitObject(obj) {
    if (obj.type === TYPE_CRATE)  _hitCrate(obj);
    if (obj.type === TYPE_BARREL) _hitBarrel(obj);
  }

  function _destroyObject(obj) {
    if (obj.type === TYPE_CRATE)  _destroyCrate(obj);
    if (obj.type === TYPE_BARREL) _destroyBarrel(obj);
    if (obj.type === TYPE_GLASS)  _destroyGlass(obj);
  }

  function clear() {
    for (var i = 0; i < _objects.length; i++) {
      var obj = _objects[i];
      if (!obj.destroyed && obj.mesh && _scene) {
        _scene.remove(obj.mesh);
      }
    }
    _objects = [];
    for (var fi = 0; fi < _fragments.length; fi++) {
      if (_fragments[fi].mesh && _scene) _scene.remove(_fragments[fi].mesh);
    }
    _fragments = [];
  }

  function reset() {
    clear();
  }

  return {
    init: init,
    update: update,
    spawnCrate: spawnCrate,
    spawnWoodPile: spawnWoodPile,
    setupForLevel: setupForLevel,
    checkBulletHit: checkBulletHit,
    damage: damage,
    clear: clear,
    reset: reset,
  };
})();
