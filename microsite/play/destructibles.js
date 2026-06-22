window.Destructibles = (function() {
  'use strict';

  var _scene = null;
  var _objects = [];

  // Keep global reference for external bullet hit checks
  window._destructibleObjects = _objects;

  // Object types
  var TYPE_CRATE     = 'crate';
  var TYPE_BARREL    = 'barrel';
  var TYPE_SANDBAG   = 'sandbag';
  var TYPE_GLASS     = 'glass';
  var TYPE_WINDOW    = 'window';
  var TYPE_SIGN      = 'sign';

  // Colours
  var COL_WOOD         = 0x8B4513;
  var COL_WOOD_DARK    = 0x4a2710;
  var COL_BARREL       = 0x4a4a6a;
  var COL_SAND         = 0xc4a35a;
  var COL_GLASS        = 0x88ccff;
  var COL_GLASS_WINDOW = 0x88ccee;
  var COL_AMMO         = 0x22bb44;
  var COL_FRAG         = 0x7a4a2a;
  var COL_SPARK        = 0xffffaa;
  var COL_GLASS_SHARD  = 0xaaddff;

  // Bounding sphere radii
  var RAD_CRATE   = 1.1;
  var RAD_BARREL  = 0.55;
  var RAD_SANDBAG = 1.2;
  var RAD_GLASS   = 1.1;
  var RAD_WINDOW  = 0.8;
  var RAD_SIGN    = 0.6;

  // Fragment physics state
  var _fragments = [];

  // Barrel tipping state
  // _barrelTipping: array of { obj, targetRot, dir }
  var _barrelTipping = [];

  // Sign falling state
  var _signFalling = [];

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
  // HP: 40, each bullet does 10-15 damage
  // At 50% HP: darker look (splinter damage)
  // At 0 HP: explode into 8-12 wood plank debris (BoxGeometry 0.3, 0.05, 0.6)

  function _buildCrate(x, y, z) {
    var group = new THREE.Group();

    // Main body
    var bodyMat = new THREE.MeshLambertMaterial({ color: COL_WOOD });
    var body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), bodyMat);
    group.add(body);

    // Dark edge strips — 4 vertical corner accents
    var edgeMat = new THREE.MeshLambertMaterial({ color: COL_WOOD_DARK });
    var edgePositions = [
      [0.38, 0, 0],  [-0.38, 0, 0],
      [0, 0, 0.38],  [0, 0, -0.38],
    ];
    for (var ei = 0; ei < edgePositions.length; ei++) {
      var ep = edgePositions[ei];
      var ew = (ep[0] !== 0) ? 0.06 : 0.82;
      var ed = (ep[2] !== 0) ? 0.06 : 0.82;
      var edgeGeo = new THREE.BoxGeometry(ew, 0.82, ed);
      var edgeMesh = new THREE.Mesh(edgeGeo, edgeMat);
      edgeMesh.position.set(ep[0], ep[1], ep[2]);
      group.add(edgeMesh);
    }

    // Cross planks on top face
    var plankMat = new THREE.MeshLambertMaterial({ color: COL_WOOD_DARK });
    var plank1 = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.06, 0.08), plankMat);
    plank1.position.set(0, 0.42, 0);
    plank1.rotation.y = 0.42;
    group.add(plank1);
    var plank2 = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.06, 0.08), plankMat);
    plank2.position.set(0, 0.42, 0);
    plank2.rotation.y = -0.42;
    group.add(plank2);

    // Cross planks on front face
    var fp1 = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.08, 0.06), plankMat);
    fp1.position.set(0, 0, 0.42);
    fp1.rotation.z = 0.42;
    group.add(fp1);
    var fp2 = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.08, 0.06), plankMat);
    fp2.position.set(0, 0, 0.42);
    fp2.rotation.z = -0.42;
    group.add(fp2);

    group.position.set(x, y + 0.4, z);
    if (_scene) _scene.add(group);

    return {
      type: TYPE_CRATE,
      mesh: group,
      hp: 40, maxHp: 40,
      x: x, y: y, z: z,
      destroyed: false,
      radius: RAD_CRATE,
      _damagedVisual: false,
    };
  }

  function _destroyCrate(obj) {
    if (!_scene || obj.destroyed) return;
    obj.destroyed = true;
    var px = obj.mesh.position.x;
    var py = obj.mesh.position.y;
    var pz = obj.mesh.position.z;
    _scene.remove(obj.mesh);

    // 8-12 wood plank debris pieces (BoxGeometry 0.3, 0.05, 0.6)
    var debrisCount = 8 + Math.floor(Math.random() * 5);
    for (var fi = 0; fi < debrisCount; fi++) {
      var angle = _rng(0, Math.PI * 2);
      var speed = _rng(1.5, 4.5);
      _spawnFragment(
        px + _rng(-0.3, 0.3),
        py + _rng(0, 0.3),
        pz + _rng(-0.3, 0.3),
        0.3, 0.05, 0.6,
        COL_FRAG,
        Math.cos(angle) * speed,
        _rng(1.5, 5),
        Math.sin(angle) * speed,
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
        0.06, 0.06, 0.06,
        COL_WOOD,
        _rng(-2, 2), _rng(1, 3), _rng(-2, 2),
        0.6
      );
    }
    // At 50% HP: show damage visual (splinters — darken main body)
    if (!obj._damagedVisual && obj.hp <= obj.maxHp * 0.5) {
      obj._damagedVisual = true;
      if (obj.mesh.children[0] && obj.mesh.children[0].material) {
        obj.mesh.children[0].material.color.setHex(0x4a2008);
      }
    }
  }

  // ─── Metal Barrel (non-explosive) ─────────────────────────────────────
  // HP: 25, tips over when shot (rotate physics)
  // Falls over: animate rotation until cylinder lies on its side
  // Rolls slightly when on side

  function _buildBarrel(x, y, z) {
    var group = new THREE.Group();

    var bodyMat = new THREE.MeshLambertMaterial({ color: COL_BARREL });
    var body = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.6, 8), bodyMat);
    group.add(body);

    // Top ring
    var ringMat = new THREE.MeshLambertMaterial({ color: 0x222244 });
    var ring = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.05, 8, 1, true), ringMat);
    ring.position.y = 0.28;
    group.add(ring);

    // Bottom ring
    var ringB = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.05, 8, 1, true), ringMat);
    ringB.position.y = -0.22;
    group.add(ringB);

    group.position.set(x, y + 0.3, z);
    if (_scene) _scene.add(group);

    return {
      type: TYPE_BARREL,
      mesh: group,
      hp: 25, maxHp: 25,
      x: x, y: y, z: z,
      destroyed: false,
      radius: RAD_BARREL,
      _tipped: false,
      _tipAngle: 0,        // current tip rotation (radians, around Z)
      _tipDir: 0,          // +1 or -1 direction to tip
      _rolling: false,
      _rollSpeed: 0,
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
        px + Math.cos(angle) * 0.15,
        py + _rng(-0.15, 0.15),
        pz + Math.sin(angle) * 0.15,
        0.28, 0.1, 0.28,
        0x333355,
        vx, _rng(0.5, 2), vz,
        1.2
      );
    }
  }

  function _hitBarrel(obj) {
    // Sparks
    var px = obj.mesh.position.x;
    var py = obj.mesh.position.y;
    var pz = obj.mesh.position.z;
    for (var si = 0; si < 3; si++) {
      var sparkColor = (Math.random() > 0.5) ? 0xffffff : 0xffee44;
      _spawnSphere(
        px + _rng(-0.15, 0.15),
        py + _rng(-0.1, 0.15),
        pz + _rng(-0.15, 0.15),
        0.04, sparkColor,
        _rng(-3, 3), _rng(1, 4), _rng(-3, 3),
        0.3
      );
    }
    // Start tipping if not already tipped
    if (!obj._tipped) {
      obj._tipped = true;
      obj._tipDir = (Math.random() > 0.5) ? 1 : -1;
      _barrelTipping.push(obj);
    }
  }

  function _updateBarrelTipping(obj, dt) {
    // Animate tip angle toward Math.PI/2 (lying on side)
    var TARGET_ANGLE = Math.PI / 2;
    var TIP_SPEED = 1.8; // rad/s
    obj._tipAngle += TIP_SPEED * dt;
    if (obj._tipAngle >= TARGET_ANGLE) {
      obj._tipAngle = TARGET_ANGLE;
      // Now on its side — start rolling slightly
      obj._rolling = true;
      obj._rollSpeed = _rng(0.4, 0.9) * obj._tipDir;
      return true; // done tipping
    }
    // Pivot around base: lower mesh slightly as it falls
    obj.mesh.rotation.z = obj._tipDir * obj._tipAngle;
    var fallY = obj.y + 0.3 * Math.cos(obj._tipAngle);
    var fallX = obj.x + 0.25 * Math.sin(obj._tipAngle) * obj._tipDir;
    obj.mesh.position.x = fallX;
    obj.mesh.position.y = fallY;
    return false;
  }

  function _updateBarrelRolling(obj, dt) {
    // Gentle roll when lying on side
    obj.mesh.position.z += obj._rollSpeed * dt;
    obj.mesh.rotation.x += obj._rollSpeed * dt * 2;
    // Dampen
    obj._rollSpeed *= (1 - dt * 0.8);
    if (Math.abs(obj._rollSpeed) < 0.02) obj._rollSpeed = 0;
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
      var topBag = obj.bags[2];
      if (topBag) {
        obj.mesh.remove(topBag);
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

  // ─── Glass Panel (original) ───────────────────────────────────────────

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

    // Audio
    _playGlassCrash();
  }

  function _playGlassCrash() {
    try {
      if (window.AudioSystem && window.AudioSystem.playGlassBreak) {
        window.AudioSystem.playGlassBreak();
        return;
      }
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

  // ─── Window (WINDOW type) ─────────────────────────────────────────────
  // PlaneGeometry(1.2, 0.8), glass blue 0x88ccee, transparent 0.4
  // 1st hit: crack overlay, opacity 0.6
  // 2nd hit: shatter — 6 glass shards + AudioSystem.playGlassBreak

  function _makeWindowCrackOverlay() {
    // Dark line overlay to simulate cracks — use a thin plane offset slightly
    var mat = new THREE.MeshLambertMaterial({
      color: 0x223344,
      transparent: true,
      opacity: 0.55,
      wireframe: true,
    });
    var geo = new THREE.PlaneGeometry(1.2, 0.8, 4, 3);
    return new THREE.Mesh(geo, mat);
  }

  function _buildWindow(x, y, z, rotY) {
    var group = new THREE.Group();

    // Frame
    var frameMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var frameTop = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.06, 0.05), frameMat);
    frameTop.position.y = 0.43;
    group.add(frameTop);
    var frameBot = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.06, 0.05), frameMat);
    frameBot.position.y = -0.43;
    group.add(frameBot);
    var frameL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.92, 0.05), frameMat);
    frameL.position.x = -0.63;
    group.add(frameL);
    var frameR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.92, 0.05), frameMat);
    frameR.position.x = 0.63;
    group.add(frameR);

    // Glass pane
    var glassMat = new THREE.MeshLambertMaterial({
      color: COL_GLASS_WINDOW,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    var glassGeo = new THREE.PlaneGeometry(1.2, 0.8);
    var glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.z = 0.01;
    group.add(glassMesh);

    group.position.set(x, y, z);
    if (rotY !== undefined) group.rotation.y = rotY;
    if (_scene) _scene.add(group);

    return {
      type: TYPE_WINDOW,
      mesh: group,
      glassMesh: glassMesh,
      glassMat: glassMat,
      hp: 2, maxHp: 2,
      x: x, y: y, z: z,
      destroyed: false,
      radius: RAD_WINDOW,
      _cracked: false,
    };
  }

  function _hitWindow(obj) {
    if (obj._cracked) return; // second hit handled by destroy
    obj._cracked = true;
    // Darken + reduce opacity to simulate crack
    obj.glassMat.opacity = 0.6;
    obj.glassMat.color.setHex(0x557799);
    // Add wireframe crack overlay
    var crackMesh = _makeWindowCrackOverlay();
    crackMesh.position.z = 0.02;
    obj.glassMesh.parent.add(crackMesh);
    obj._crackMesh = crackMesh;
  }

  function _destroyWindow(obj) {
    if (!_scene || obj.destroyed) return;
    obj.destroyed = true;
    var px = obj.mesh.position.x;
    var py = obj.mesh.position.y;
    var pz = obj.mesh.position.z;
    _scene.remove(obj.mesh);

    // 6 glass shards (small triangles approximated as thin planes flying outward)
    for (var gi = 0; gi < 6; gi++) {
      var angle = (gi / 6) * Math.PI * 2;
      var speed = _rng(2, 5);
      var tw = _rng(0.06, 0.18);
      var th = _rng(0.06, 0.2);
      var shardGeo = new THREE.PlaneGeometry(tw, th);
      var shardMat = new THREE.MeshLambertMaterial({
        color: COL_GLASS_SHARD,
        transparent: true,
        opacity: _rng(0.4, 0.7),
        side: THREE.DoubleSide,
      });
      var shardMesh = new THREE.Mesh(shardGeo, shardMat);
      shardMesh.position.set(
        px + _rng(-0.4, 0.4),
        py + _rng(-0.3, 0.3),
        pz + _rng(-0.1, 0.1)
      );
      shardMesh.rotation.set(_rng(-1, 1), _rng(-1, 1), _rng(-1, 1));
      if (_scene) _scene.add(shardMesh);
      _fragments.push({
        mesh: shardMesh,
        vx: Math.cos(angle) * speed,
        vy: _rng(0.5, 3),
        vz: Math.sin(angle) * speed,
        life: 1.0,
        age: 0,
        spinning: true,
      });
    }

    // Play glass break sound
    try {
      if (window.AudioSystem && window.AudioSystem.playGlassBreak) {
        window.AudioSystem.playGlassBreak();
      } else {
        _playGlassCrash();
      }
    } catch (_e) {}
  }

  // ─── Sign / Poster ────────────────────────────────────────────────────
  // PlaneGeometry(0.8, 0.5), canvas texture
  // 1 hit: bullet hole (canvas dot)
  // 3 hits: falls off wall, clatters to floor (rotation physics)

  var SIGN_TEXTS = [
    'НЕБЕЗПЕКА',  // НЕБЕЗПЕКА (DANGER)
    'ВИХІД',                            // ВИХІД (EXIT)
    'ЗУПИНИСЬ',         // ЗУПИНИСЬ (STOP)
    'УВАГА',                            // УВАГА (WARNING)
  ];

  function _makeSignTexture(text) {
    var canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 160;
    var ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#cc3300';
    ctx.fillRect(0, 0, 256, 160);

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, 244, 148);

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 80);

    return canvas;
  }

  function _buildSign(x, y, z, rotY) {
    var group = new THREE.Group();

    // Pick a random sign text
    var text = SIGN_TEXTS[Math.floor(Math.random() * SIGN_TEXTS.length)];

    // Canvas texture
    var canvas = _makeSignTexture(text);
    var texture = new THREE.CanvasTexture(canvas);

    var signMat = new THREE.MeshLambertMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });
    var signGeo = new THREE.PlaneGeometry(0.8, 0.5);
    var signMesh = new THREE.Mesh(signGeo, signMat);
    group.add(signMesh);

    // Small wall mount pegs
    var pegMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var pegL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), pegMat);
    pegL.position.set(-0.3, 0, -0.02);
    group.add(pegL);
    var pegR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), pegMat);
    pegR.position.set(0.3, 0, -0.02);
    group.add(pegR);

    group.position.set(x, y, z);
    if (rotY !== undefined) group.rotation.y = rotY;
    if (_scene) _scene.add(group);

    return {
      type: TYPE_SIGN,
      mesh: group,
      signMesh: signMesh,
      signTexture: texture,
      signCanvas: canvas,
      hp: 3, maxHp: 3,
      x: x, y: y, z: z,
      destroyed: false,
      radius: RAD_SIGN,
      _bulletHoles: 0,
      _falling: false,
      _fallAngle: 0,
      _fallDir: 0,
    };
  }

  function _addBulletHoleToSign(obj) {
    var canvas = obj.signCanvas;
    var ctx = canvas.getContext('2d');
    // Random bullet hole position within sign bounds
    var hx = 20 + Math.random() * 216;
    var hy = 20 + Math.random() * 120;
    // Dark outer ring
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(hx, hy, 10, 0, Math.PI * 2);
    ctx.fill();
    // Bright center
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.arc(hx, hy, 5, 0, Math.PI * 2);
    ctx.fill();
    // Radial scratch marks
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1;
    for (var ri = 0; ri < 6; ri++) {
      var angle = (ri / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(hx + Math.cos(angle) * 6, hy + Math.sin(angle) * 6);
      ctx.lineTo(hx + Math.cos(angle) * 16, hy + Math.sin(angle) * 16);
      ctx.stroke();
    }
    obj.signTexture.needsUpdate = true;
  }

  function _hitSign(obj) {
    obj._bulletHoles++;
    _addBulletHoleToSign(obj);
  }

  function _destroySign(obj) {
    if (obj.destroyed) return;
    // Add final bullet hole first
    _addBulletHoleToSign(obj);
    // Start falling off wall
    obj._falling = true;
    obj._fallDir = (Math.random() > 0.5) ? 1 : -1;
    _signFalling.push(obj);
  }

  function _updateSignFalling(obj, dt) {
    var TARGET = Math.PI / 2;
    var FALL_SPEED = 2.5;
    obj._fallAngle += FALL_SPEED * dt;
    if (obj._fallAngle >= TARGET) {
      obj._fallAngle = TARGET;
      // Fully on floor — mark destroyed, clean up after brief delay
      obj.destroyed = true;
      // Leave mesh on ground for visual continuity but stop updating
      obj.mesh.position.y = obj.y - 0.2;
      obj.mesh.rotation.x = Math.PI / 2 * obj._fallDir;
      // Clatter sound (brief noise)
      try {
        if (window._audioCtx) {
          var ctx2 = window._audioCtx;
          var buf = ctx2.createBuffer(1, ctx2.sampleRate * 0.15, ctx2.sampleRate);
          var data = buf.getChannelData(0);
          for (var ni = 0; ni < data.length; ni++) {
            data[ni] = (Math.random() * 2 - 1) * Math.max(0, 1 - ni / data.length);
          }
          var src = ctx2.createBufferSource();
          src.buffer = buf;
          var gainNode = ctx2.createGain();
          gainNode.gain.value = 0.15;
          src.connect(gainNode);
          gainNode.connect(ctx2.destination);
          src.start();
        }
      } catch (_e) {}
      return true; // done
    }
    // Pivot downward — rotate around top edge
    obj.mesh.rotation.x = obj._fallDir * obj._fallAngle;
    var fallY = obj.y - 0.25 * (1 - Math.cos(obj._fallAngle));
    obj.mesh.position.y = fallY;
    return false;
  }

  // ─── spawnObjects: level-wide spawn ──────────────────────────────────
  // Called by game to populate the scene with destructible objects

  function spawnObjects(scene) {
    if (scene) _scene = scene;
    if (!_scene) return;

    // Update global reference whenever we respawn
    window._destructibleObjects = _objects;

    // 3-5 windows on building facades (Y=2, near walls)
    var windowCount = 3 + Math.floor(Math.random() * 3);
    var windowPositions = [
      [-8, 2, -15, 0],
      [8,  2, -15, 0],
      [-14, 2, -5, Math.PI / 2],
      [14,  2, -5, Math.PI / 2],
      [0,   2, -15, 0],
    ];
    for (var wi = 0; wi < windowCount && wi < windowPositions.length; wi++) {
      var wp = windowPositions[wi];
      var wobj = _buildWindow(wp[0], wp[1], wp[2], wp[3]);
      _objects.push(wobj);
    }

    // 4-6 crates in clustered pairs (near objectives)
    var crateCount = 4 + Math.floor(Math.random() * 3);
    var cratePositions = [
      [-6, 0, -8], [-5, 0, -8],
      [6,  0, -8], [7,  0, -8],
      [-10, 0, 5], [-9, 0, 5],
      [10,  0, 5],
    ];
    for (var ci = 0; ci < crateCount && ci < cratePositions.length; ci++) {
      var cp = cratePositions[ci];
      var cobj = _buildCrate(cp[0], cp[1], cp[2]);
      _objects.push(cobj);
    }

    // 2-3 barrels in alley areas
    var barrelCount = 2 + Math.floor(Math.random() * 2);
    var barrelPositions = [
      [-3, 0, 2],
      [3,  0, 2],
      [0,  0, -12],
    ];
    for (var bi = 0; bi < barrelCount && bi < barrelPositions.length; bi++) {
      var bp = barrelPositions[bi];
      var bobj = _buildBarrel(bp[0], bp[1], bp[2]);
      _objects.push(bobj);
    }

    // 3-4 signs on walls
    var signCount = 3 + Math.floor(Math.random() * 2);
    var signPositions = [
      [-12, 2.2, -14.9, 0],
      [12,  2.2, -14.9, 0],
      [-13.9, 2.2, -3, Math.PI / 2],
      [13.9,  2.2, -3, Math.PI / 2],
    ];
    for (var si = 0; si < signCount && si < signPositions.length; si++) {
      var sp = signPositions[si];
      var sobj = _buildSign(sp[0], sp[1], sp[2], sp[3]);
      _objects.push(sobj);
    }
  }

  // ─── onBulletHit: distance-based hit detection ────────────────────────
  // Called by game-manager after each shot with the world-space hit point

  function onBulletHit(hitPoint) {
    if (!hitPoint) return;
    var HIT_RADIUS = 0.5;
    for (var i = 0; i < _objects.length; i++) {
      var obj = _objects[i];
      if (obj.destroyed) continue;
      if (!obj.mesh) continue;
      var pos = obj.mesh.position;
      var dx = hitPoint.x - pos.x;
      var dy = hitPoint.y - pos.y;
      var dz = hitPoint.z - pos.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist <= HIT_RADIUS) {
        // Determine damage based on type
        var dmg = 25;
        if (obj.type === TYPE_CRATE) {
          // 10-15 damage per bullet
          dmg = 10 + Math.floor(Math.random() * 6);
        } else if (obj.type === TYPE_BARREL) {
          dmg = 8;
        } else if (obj.type === TYPE_WINDOW) {
          dmg = 1;
        } else if (obj.type === TYPE_SIGN) {
          dmg = 1;
        }
        damage(obj, dmg);
        break; // one object hit per shot
      }
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────

  function init(scene) {
    _scene = scene;
    _objects = [];
    _fragments = [];
    _barrelTipping = [];
    _signFalling = [];
    window._destructibleObjects = _objects;
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

    // Barrel tipping animation
    for (i = _barrelTipping.length - 1; i >= 0; i--) {
      var bobj = _barrelTipping[i];
      if (bobj.destroyed) {
        _barrelTipping.splice(i, 1);
        continue;
      }
      var doneTipping = _updateBarrelTipping(bobj, delta);
      if (doneTipping) {
        _barrelTipping.splice(i, 1);
      }
    }

    // Barrel rolling (lying on side)
    for (i = 0; i < _objects.length; i++) {
      var robj = _objects[i];
      if (robj.type === TYPE_BARREL && robj._rolling && !robj.destroyed) {
        _updateBarrelRolling(robj, delta);
      }
    }

    // Sign falling animation
    for (i = _signFalling.length - 1; i >= 0; i--) {
      var sfobj = _signFalling[i];
      var doneFalling = _updateSignFalling(sfobj, delta);
      if (doneFalling) {
        _signFalling.splice(i, 1);
      }
    }

    // Ammo pickup rotation + player proximity check
    for (i = _objects.length - 1; i >= 0; i--) {
      var obj = _objects[i];
      if (obj.type === 'ammo_pickup' && !obj.destroyed) {
        obj.age += delta;
        obj.mesh.rotation.y += delta * 2;
        if (typeof player !== 'undefined' && player.position) {
          var pdx = player.position.x - obj.mesh.position.x;
          var pdz = player.position.z - obj.mesh.position.z;
          if (pdx * pdx + pdz * pdz < 0.64) {
            obj.destroyed = true;
            if (_scene) _scene.remove(obj.mesh);
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
      var cp2 = cratePositions[ci];
      var cobj2 = _buildCrate(cp2[0], 0, cp2[2]);
      _objects.push(cobj2);
    }

    // Industrial: extra barrels
    if (isIndustrial) {
      var barrelPos = [
        [-8, 0, -6], [8, 0, -6], [-8, 0, 6], [8, 0, 6],
      ];
      for (var bi2 = 0; bi2 < barrelPos.length; bi2++) {
        var bp2 = barrelPos[bi2];
        var bobj2 = _buildBarrel(bp2[0], 0, bp2[2]);
        _objects.push(bobj2);
      }
    }

    // Sandbag walls: 2-4
    var sbCount = 2 + Math.floor(Math.random() * 3);
    if (isUrban) sbCount += 2;
    var sbPositions = [
      [-5, 0, -8], [5, 0, -8], [-16, 0, 0], [16, 0, 0],
      [-5, 0, 10], [5, 0, 10],
    ];
    for (var si3 = 0; si3 < sbCount && si3 < sbPositions.length; si3++) {
      var sp2 = sbPositions[si3];
      var sobj2 = _buildSandbag(sp2[0], 0, sp2[2]);
      _objects.push(sobj2);
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
    for (var gi2 = 0; gi2 < 2 && gi2 < glassPositions.length; gi2++) {
      var gp2 = glassPositions[gi2];
      var gobj2 = _buildGlass(gp2[0], 0, gp2[2]);
      _objects.push(gobj2);
    }

    // Windows on building facades
    var wCount = isUrban ? 4 : 2;
    var wPositions = [
      [-8, 2, -15, 0],
      [8,  2, -15, 0],
      [-14, 2, -5, Math.PI / 2],
      [14,  2, -5, Math.PI / 2],
    ];
    for (var wii = 0; wii < wCount && wii < wPositions.length; wii++) {
      var wpp = wPositions[wii];
      var wobj2 = _buildWindow(wpp[0], wpp[1], wpp[2], wpp[3]);
      _objects.push(wobj2);
    }

    // Signs on walls
    var sgnCount = isUrban ? 4 : 2;
    var sgnPositions = [
      [-12, 2.2, -14.9, 0],
      [12,  2.2, -14.9, 0],
      [-13.9, 2.2, -3, Math.PI / 2],
      [13.9,  2.2, -3, Math.PI / 2],
    ];
    for (var sgni = 0; sgni < sgnCount && sgni < sgnPositions.length; sgni++) {
      var sgnp = sgnPositions[sgni];
      var sgnobj = _buildSign(sgnp[0], sgnp[1], sgnp[2], sgnp[3]);
      _objects.push(sgnobj);
    }

    // Update global reference
    window._destructibleObjects = _objects;
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
    if (obj.type === TYPE_WINDOW) _hitWindow(obj);
    if (obj.type === TYPE_SIGN)   _hitSign(obj);
  }

  function _destroyObject(obj) {
    if (obj.type === TYPE_CRATE)  _destroyCrate(obj);
    if (obj.type === TYPE_BARREL) _destroyBarrel(obj);
    if (obj.type === TYPE_GLASS)  _destroyGlass(obj);
    if (obj.type === TYPE_WINDOW) _destroyWindow(obj);
    if (obj.type === TYPE_SIGN)   _destroySign(obj);
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
    _barrelTipping = [];
    _signFalling = [];
    window._destructibleObjects = _objects;
  }

  function reset() {
    clear();
  }

  return {
    init: init,
    update: update,
    spawnCrate: spawnCrate,
    spawnWoodPile: spawnWoodPile,
    spawnObjects: spawnObjects,
    setupForLevel: setupForLevel,
    checkBulletHit: checkBulletHit,
    onBulletHit: onBulletHit,
    damage: damage,
    clear: clear,
    reset: reset,
  };
})();
