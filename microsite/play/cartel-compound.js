/* ───────────────────────────────────────────────────────────────────────────
   cartel-compound.js — Cartel Compound Raid Mini-Game
   API: window.CartelCompound = { init, update, reset }

   Controls:
     C + C (within 400ms)    → activate raid
     WASD                    → move player
     Mouse                   → look / aim
     Left-click / Space      → shoot
     G                       → plant C4 on drug vat (when near)
     E (hold 3s)             → copy intel from laptop (when near)
     F                       → interact / pickup El Jefe when knocked out
     A                       → call gunship airstrike (aim at target, 90s cooldown, 3 uses)
     T                       → drive truck (when near garage)

   Win: intel copied + 4+ vats destroyed + El Jefe captured + reach airstrip
   Lose: El Jefe killed, player dies, or 10-minute timer expires
   ─────────────────────────────────────────────────────────────────────────── */
window.CartelCompound = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Activation (C+C within 400ms) ────────────────────────────────────── */
  var _lastCTime   = 0;
  var _active      = false;

  /* ── Player state ──────────────────────────────────────────────────────── */
  var _playerPos   = null;   // THREE.Vector3
  var _playerHP    = 100;
  var _playerYaw   = 0;      // radians
  var _playerPitch = 0;
  var _keys        = {};
  var _mouseX      = 0;
  var _mouseY      = 0;
  var _inTruck     = false;
  var _truckObj    = null;

  /* ── Mission state ─────────────────────────────────────────────────────── */
  var _vatsDestroyed   = 0;
  var _jefeCaptured    = false;   // knocked to <= 10HP and "picked up"
  var _jefeCarried     = false;   // player is carrying jefe toward airstrip
  var _jefeKilled      = false;
  var _intelCopied     = false;
  var _intelHoldTime   = 0;
  var _eHeld           = false;
  var _missionTimer    = 600;     // 10 minutes in seconds
  var _soldierKills    = 0;
  var _airstrikeUses   = 3;
  var _airstrikeCooldown = 0;
  var _gameOver        = false;
  var _gameWon         = false;

  /* ── C4 planting ───────────────────────────────────────────────────────── */
  var _c4PlantTimer    = 0;        // countdown after planting
  var _c4Vat           = null;     // which vat index being planted

  /* ── Shooting ──────────────────────────────────────────────────────────── */
  var _bullets         = [];       // { mesh, vel, life, damage }
  var _shootCooldown   = 0;
  var _mouseDown       = false;

  /* ── Soldiers ──────────────────────────────────────────────────────────── */
  var _soldiers        = [];  // { mesh, hp, pos, vel, alive, fireTimer, isElite, isJefe }

  /* ── Vats ──────────────────────────────────────────────────────────────── */
  var _vats            = [];  // { mesh, light, destroyed, pos }

  /* ── Intel laptop ──────────────────────────────────────────────────────── */
  var _laptop          = null;
  var _laptopLight     = null;
  var _laptopPos       = null;

  /* ── Airstrip ──────────────────────────────────────────────────────────── */
  var _airstripPos     = null;

  /* ── El Jefe ───────────────────────────────────────────────────────────── */
  var _jefeObj         = null;
  var _jefeHP          = 500;
  var _jefePos         = null;

  /* ── Explosions ────────────────────────────────────────────────────────── */
  var _explosions      = [];  // { mesh, light, life }

  /* ── Gunship bombs ─────────────────────────────────────────────────────── */
  var _bombs           = [];  // { mesh, life, targetPos }

  /* ── All static scene meshes (for cleanup) ─────────────────────────────── */
  var _sceneMeshes     = [];

  /* ── DOM ───────────────────────────────────────────────────────────────── */
  var _hud             = null;
  var _msgEl           = null;
  var _crosshair       = null;
  var _endScreen       = null;

  /* ════════════════════════════════════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════════════════════════════════════ */

  function addMesh(mesh) {
    _scene.add(mesh);
    _sceneMeshes.push(mesh);
    return mesh;
  }

  function box(w, h, d, color, x, y, z) {
    var geo  = new THREE.BoxGeometry(w, h, d);
    var mat  = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function cyl(rt, rb, h, segs, color, x, y, z) {
    var geo  = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat  = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function sph(r, segs, color, x, y, z) {
    var geo  = new THREE.SphereGeometry(r, segs, segs);
    var mat  = new THREE.MeshBasicMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function cone(r, h, segs, color, x, y, z) {
    var geo  = new THREE.ConeGeometry(r, h, segs);
    var mat  = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function dist2D(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD COMPOUND
  ════════════════════════════════════════════════════════════════════════ */

  function buildCompound() {

    /* Ground plane */
    var ground = box(300, 0.5, 300, 0x556644, 0, -0.25, 0);
    addMesh(ground);

    /* ── Perimeter fence ───────────────────────────────────────────────── */
    var FENCE = 80;    /* half-size of compound square */
    var postStep = 10;
    var postH    = 5;
    var postGeo  = new THREE.BoxGeometry(0.4, postH, 0.4);
    var postMat  = new THREE.MeshLambertMaterial({ color: 0x8B7355 });

    /* Build wire lines along each side */
    var wirePoints = [];
    var fenceSides = [
      { axis: 'x', fixed: -FENCE, from: -FENCE, to: FENCE },
      { axis: 'x', fixed:  FENCE, from: -FENCE, to: FENCE },
      { axis: 'z', fixed: -FENCE, from: -FENCE, to: FENCE },
      { axis: 'z', fixed:  FENCE, from: -FENCE, to: FENCE }
    ];

    for (var fi = 0; fi < fenceSides.length; fi++) {
      var side = fenceSides[fi];
      for (var fp = side.from; fp <= side.to; fp += postStep) {
        var post = new THREE.Mesh(postGeo, postMat);
        if (side.axis === 'x') {
          post.position.set(fp, postH / 2, side.fixed);
        } else {
          post.position.set(side.fixed, postH / 2, fp);
        }
        addMesh(post);

        /* Wire points at two heights */
        for (var wh = 0; wh < 2; wh++) {
          var wy = 1.5 + wh * 2.5;
          var wx = side.axis === 'x' ? fp : side.fixed;
          var wz = side.axis === 'x' ? side.fixed : fp;
          wirePoints.push(wx, wy, wz);
        }
      }

      /* Wire as LineSegments along the side */
      var wGeoPoints = [];
      var step2 = postStep;
      for (var wp = side.from; wp < side.to; wp += step2) {
        var nx = wp + step2;
        if (nx > side.to) nx = side.to;
        for (var whi = 0; whi < 2; whi++) {
          var wyr = 1.5 + whi * 2.5;
          var x1 = side.axis === 'x' ? wp  : side.fixed;
          var z1 = side.axis === 'x' ? side.fixed : wp;
          var x2 = side.axis === 'x' ? nx  : side.fixed;
          var z2 = side.axis === 'x' ? side.fixed : nx;
          wGeoPoints.push(x1, wyr, z1, x2, wyr, z2);
        }
      }
      if (wGeoPoints.length > 0) {
        var wBuf = new THREE.BufferGeometry();
        wBuf.setAttribute('position', new THREE.Float32BufferAttribute(wGeoPoints, 3));
        var wire = new THREE.LineSegments(wBuf, new THREE.LineBasicMaterial({ color: 0xAAAAAA }));
        _scene.add(wire);
        _sceneMeshes.push(wire);
      }
    }

    /* ── Guard towers (4 corners) ──────────────────────────────────────── */
    var towerCorners = [
      [-FENCE, -FENCE], [FENCE, -FENCE],
      [-FENCE,  FENCE], [FENCE,  FENCE]
    ];
    for (var ti = 0; ti < towerCorners.length; ti++) {
      var tx = towerCorners[ti][0];
      var tz = towerCorners[ti][1];
      /* Base column */
      addMesh(cyl(1.2, 1.2, 10, 8, 0x8B7355, tx, 5, tz));
      /* Platform */
      addMesh(box(5, 0.5, 5, 0x7A6545, tx, 10.25, tz));
      /* Guard rail */
      addMesh(box(5, 1, 0.3, 0x6B5535, tx, 10.75, tz - 2));
      addMesh(box(5, 1, 0.3, 0x6B5535, tx, 10.75, tz + 2));
      addMesh(box(0.3, 1, 5, 0x6B5535, tx - 2, 10.75, tz));
      addMesh(box(0.3, 1, 5, 0x6B5535, tx + 2, 10.75, tz));
      /* Roof */
      addMesh(cone(3, 3, 6, 0x665533, tx, 12.5, tz));
    }

    /* ── Main house ────────────────────────────────────────────────────── */
    addMesh(box(25, 8, 20, 0x886655,  0, 4, -20));
    /* Roof overhang */
    addMesh(box(27, 0.5, 22, 0x775544, 0, 8.25, -20));
    /* Windows (dark boxes) */
    addMesh(box(2, 2, 0.3, 0x223344, -6, 4, -10.2));
    addMesh(box(2, 2, 0.3, 0x223344,  6, 4, -10.2));
    addMesh(box(2, 2, 0.3, 0x223344, -6, 4, -29.8));
    addMesh(box(2, 2, 0.3, 0x223344,  6, 4, -29.8));
    /* Door */
    addMesh(box(3, 4, 0.3, 0x554433,  0, 2, -10.2));

    /* ── Lab building ──────────────────────────────────────────────────── */
    addMesh(box(20, 5, 15, 0x778866, -30, 2.5, 20));
    /* Lab roof */
    addMesh(box(22, 0.5, 17, 0x667755, -30, 5.25, 20));
    /* Ventilation cylinders */
    addMesh(cyl(0.6, 0.6, 3, 8, 0x556644, -25, 6.5, 15));
    addMesh(cyl(0.6, 0.6, 3, 8, 0x556644, -35, 6.5, 15));
    addMesh(cyl(0.6, 0.6, 3, 8, 0x556644, -25, 6.5, 25));
    addMesh(cyl(0.6, 0.6, 3, 8, 0x556644, -35, 6.5, 25));

    /* ── Vats (5 drug vats in lab) ─────────────────────────────────────── */
    _vats = [];
    var vatPositions = [
      [-27, 20], [-30, 20], [-33, 20],
      [-28.5, 25], [-31.5, 25]
    ];
    for (var vi = 0; vi < vatPositions.length; vi++) {
      var vx = vatPositions[vi][0];
      var vz = vatPositions[vi][1];
      var vatMesh = cyl(1.2, 1.0, 3, 12, 0x44AA44, vx, 1.5, vz);
      addMesh(vatMesh);
      /* Top cap */
      addMesh(cyl(1.2, 1.2, 0.2, 12, 0x339933, vx, 3.1, vz));
      var vatLight = new THREE.PointLight(0x00FF44, 1.5, 6);
      vatLight.position.set(vx, 2.5, vz);
      _scene.add(vatLight);
      _sceneMeshes.push(vatLight);
      _vats.push({
        mesh:      vatMesh,
        light:     vatLight,
        destroyed: false,
        pos:       new THREE.Vector3(vx, 1.5, vz)
      });
    }

    /* ── Garage ────────────────────────────────────────────────────────── */
    addMesh(box(15, 5, 12, 0x665544, 30, 2.5, 20));
    /* Garage door opening */
    addMesh(box(6, 4, 0.2, 0x554433, 30, 2, 14.1));

    /* ── Truck in garage ───────────────────────────────────────────────── */
    _truckObj = box(5, 2.5, 9, 0x445533, 28, 1.25, 19);
    addMesh(_truckObj);
    /* Truck cab */
    addMesh(box(5, 2, 5, 0x334422, 28, 2.5, 16));
    /* Wheels (cylinders) */
    addMesh(cyl(0.7, 0.7, 0.5, 8, 0x222222, 25.2, 0.7, 16.5));
    addMesh(cyl(0.7, 0.7, 0.5, 8, 0x222222, 30.8, 0.7, 16.5));
    addMesh(cyl(0.7, 0.7, 0.5, 8, 0x222222, 25.2, 0.7, 21));
    addMesh(cyl(0.7, 0.7, 0.5, 8, 0x222222, 30.8, 0.7, 21));

    /* ── Speedboat (in garage) ─────────────────────────────────────────── */
    addMesh(box(3, 1, 7, 0x223344, 32, 0.5, 21));
    addMesh(box(2.5, 0.8, 6, 0x334455, 32, 1.1, 21));

    /* ── Airstrip ──────────────────────────────────────────────────────── */
    _airstripPos = new THREE.Vector3(60, 0, -40);
    addMesh(box(60, 0.2, 12, 0x665544, 60, 0.1, -40));
    /* Runway markings */
    for (var ri = 0; ri < 5; ri++) {
      addMesh(box(1, 0.3, 3, 0xCCBB88, 40 + ri * 10, 0.2, -40));
    }
    /* Airstrip lights */
    addMesh(box(0.3, 0.5, 0.3, 0xFFFF00, 32, 0.3, -45));
    addMesh(box(0.3, 0.5, 0.3, 0xFFFF00, 32, 0.3, -35));
    addMesh(box(0.3, 0.5, 0.3, 0xFFFF00, 89, 0.3, -45));
    addMesh(box(0.3, 0.5, 0.3, 0xFFFF00, 89, 0.3, -35));

    /* ── Intel laptop on leader's desk ─────────────────────────────────── */
    _laptopPos = new THREE.Vector3(3, 4.8, -18);
    /* Desk */
    addMesh(box(4, 0.8, 2, 0x554422, 3, 4.4, -18));
    /* Laptop base */
    var laptopBase = box(1.5, 0.1, 1, 0x334455, 3, 4.85, -18);
    addMesh(laptopBase);
    /* Laptop screen (angled slightly) */
    var laptopScreen = box(1.4, 0.9, 0.08, 0x445566, 3, 5.35, -18.5);
    laptopScreen.rotation.x = -0.4;
    addMesh(laptopScreen);
    /* Screen glow */
    _laptopLight = new THREE.PointLight(0x4488FF, 1.2, 5);
    _laptopLight.position.set(3, 5.5, -18.5);
    _scene.add(_laptopLight);
    _sceneMeshes.push(_laptopLight);
    _laptop = laptopBase;

    /* ── Jungle perimeter trees (50 ConeGeometry) ──────────────────────── */
    var treePositions = [];
    for (var tri = 0; tri < 50; tri++) {
      var ta = Math.random() * Math.PI * 2;
      var tr = 85 + Math.random() * 40;
      var tx2 = Math.cos(ta) * tr;
      var tz2 = Math.sin(ta) * tr;
      treePositions.push([tx2, tz2]);
    }
    for (var tpi = 0; tpi < treePositions.length; tpi++) {
      var tx3 = treePositions[tpi][0];
      var tz3 = treePositions[tpi][1];
      var th  = 6 + Math.random() * 6;
      /* Trunk */
      addMesh(cyl(0.3, 0.4, th * 0.4, 6, 0x4A3728, tx3, th * 0.2, tz3));
      /* Canopy cone */
      addMesh(cone(2.5 + Math.random(), th * 0.7, 7, 0x225522, tx3, th * 0.4 + th * 0.35, tz3));
      /* Second tier */
      addMesh(cone(1.8 + Math.random() * 0.5, th * 0.5, 7, 0x1A4419, tx3, th * 0.4 + th * 0.65, tz3));
    }

    /* ── Undergrowth around compound ───────────────────────────────────── */
    for (var ugi = 0; ugi < 60; ugi++) {
      var ua = Math.random() * Math.PI * 2;
      var ur = 82 + Math.random() * 10;
      addMesh(box(
        1 + Math.random() * 2,
        0.3 + Math.random() * 0.7,
        1 + Math.random() * 2,
        0x2D5A1B,
        Math.cos(ua) * ur,
        0.2,
        Math.sin(ua) * ur
      ));
    }

    /* ── Interior compound decorations ────────────────────────────────── */
    /* Fuel drums */
    addMesh(cyl(0.5, 0.5, 1.5, 8, 0x334455, 15, 0.75, 5));
    addMesh(cyl(0.5, 0.5, 1.5, 8, 0x334455, 16.5, 0.75, 5));
    addMesh(cyl(0.5, 0.5, 1.5, 8, 0x334455, 15, 0.75, 6.8));
    /* Sandbag barriers */
    addMesh(box(6, 1, 1, 0x8B7355, -10, 0.5,  5));
    addMesh(box(6, 1, 1, 0x8B7355,  10, 0.5,  5));
    addMesh(box(1, 1, 6, 0x8B7355, -10, 0.5, -5));
    addMesh(box(1, 1, 6, 0x8B7355,  10, 0.5, -5));
    /* Crates */
    addMesh(box(2, 2, 2, 0x7A6040, -5, 1, 10));
    addMesh(box(2, 2, 2, 0x7A6040, -5, 3, 10));
    addMesh(box(2, 2, 2, 0x7A6040, -7, 1, 10));

    /* ── Ambient & sun light ───────────────────────────────────────────── */
    var ambient = new THREE.AmbientLight(0x334422, 0.6);
    _scene.add(ambient);
    _sceneMeshes.push(ambient);
    var sun = new THREE.DirectionalLight(0xFFDD99, 1.0);
    sun.position.set(80, 120, 60);
    _scene.add(sun);
    _sceneMeshes.push(sun);
  }

  /* ════════════════════════════════════════════════════════════════════════
     BUILD SOLDIERS
  ════════════════════════════════════════════════════════════════════════ */

  function buildSoldiers() {
    _soldiers = [];

    /* 30 regular cartel soldiers */
    var regularPositions = [
      /* Near perimeter */
      [-70, -70], [ 70, -70], [-70, 70], [ 70, 70],
      [-40, -75], [ 40, -75], [-40,  75], [ 40,  75],
      /* Along fence */
      [-70,   0], [ 70,   0], [  0, -75], [  0,  75],
      /* Interior patrol */
      [-20,  10], [ 20,  10], [-20, -10], [ 20, -10],
      [ 10,  30], [-10,  30], [ 10, -35], [-10, -35],
      /* Near lab */
      [-20,  15], [-35,  12], [-25,  28], [-38,  22],
      /* Near garage */
      [ 22,  12], [ 38,  12], [ 25,  28], [ 35,  28],
      /* Roaming */
      [  5,   5], [ -5, -45]
    ];

    for (var si = 0; si < 30; si++) {
      var sx = regularPositions[si][0];
      var sz = regularPositions[si][1];
      var soldierGroup = buildSoldierMesh(0x443322);
      soldierGroup.position.set(sx, 0, sz);
      _scene.add(soldierGroup);
      _soldiers.push({
        mesh:      soldierGroup,
        hp:        70,
        pos:       new THREE.Vector3(sx, 0, sz),
        vel:       new THREE.Vector3(0, 0, 0),
        alive:     true,
        fireTimer: 1 + Math.random() * 3,
        isElite:   false,
        isJefe:    false,
        patrolAngle: Math.random() * Math.PI * 2,
        patrolRadius: 8 + Math.random() * 6,
        patrolCenter: new THREE.Vector3(sx, 0, sz)
      });
    }

    /* 4 elite bodyguards (near leader in main house) */
    var eliteOffsets = [[-3, -3], [3, -3], [-3, 3], [3, 3]];
    for (var ei = 0; ei < 4; ei++) {
      var ex = eliteOffsets[ei][0];
      var ez = eliteOffsets[ei][1];
      var eliteGroup = buildSoldierMesh(0x222211);
      eliteGroup.position.set(ex, 0, -20 + ez);
      _scene.add(eliteGroup);
      _soldiers.push({
        mesh:        eliteGroup,
        hp:          150,
        pos:         new THREE.Vector3(ex, 0, -20 + ez),
        vel:         new THREE.Vector3(0, 0, 0),
        alive:       true,
        fireTimer:   0.5 + Math.random() * 1.5,
        isElite:     true,
        isJefe:      false,
        patrolAngle: Math.random() * Math.PI * 2,
        patrolRadius: 4,
        patrolCenter: new THREE.Vector3(ex, 0, -20 + ez)
      });
    }

    /* El Jefe */
    _jefePos = new THREE.Vector3(0, 0, -25);
    _jefeHP  = 500;
    _jefeCaptured = false;
    _jefeCarried  = false;
    _jefeKilled   = false;
    _jefeObj = buildJefeMesh();
    _jefeObj.position.copy(_jefePos);
    _scene.add(_jefeObj);
  }

  function buildSoldierMesh(color) {
    var group = new THREE.Group();
    /* Body */
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.2, 0.5),
      new THREE.MeshLambertMaterial({ color: color })
    );
    body.position.y = 1.6;
    group.add(body);
    /* Head */
    var head = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.6, 0.6),
      new THREE.MeshLambertMaterial({ color: 0x8B6A50 })
    );
    head.position.y = 2.5;
    group.add(head);
    /* Gun */
    var gun = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.8),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    gun.position.set(0.5, 1.7, -0.5);
    group.add(gun);
    return group;
  }

  function buildJefeMesh() {
    var group = new THREE.Group();
    /* Body — distinctive color */
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 1.4, 0.6),
      new THREE.MeshLambertMaterial({ color: 0x332211 })
    );
    body.position.y = 1.7;
    group.add(body);
    /* Head */
    var head = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.7, 0.7),
      new THREE.MeshLambertMaterial({ color: 0x9B7A5A })
    );
    head.position.y = 2.75;
    group.add(head);
    /* Hat */
    var hat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.3, 8),
      new THREE.MeshLambertMaterial({ color: 0x221100 })
    );
    hat.position.y = 3.2;
    group.add(hat);
    /* Brim */
    var brim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 0.08, 8),
      new THREE.MeshLambertMaterial({ color: 0x221100 })
    );
    brim.position.y = 3.05;
    group.add(brim);
    return group;
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD / DOM
  ════════════════════════════════════════════════════════════════════════ */

  function buildDOM() {
    _hud = document.createElement('div');
    _hud.id = 'cc-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#AAFF66',
      'font-family:monospace',
      'font-size:13px',
      'font-weight:bold',
      'background:rgba(0,0,0,0.6)',
      'padding:6px 14px',
      'border-radius:4px',
      'pointer-events:none',
      'display:none',
      'z-index:900',
      'letter-spacing:1px',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hud);

    _msgEl = document.createElement('div');
    _msgEl.id = 'cc-msg';
    _msgEl.style.cssText = [
      'position:fixed',
      'top:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#FFDD44',
      'font-family:monospace',
      'font-size:14px',
      'font-weight:bold',
      'background:rgba(0,0,0,0.5)',
      'padding:4px 12px',
      'border-radius:3px',
      'pointer-events:none',
      'display:none',
      'z-index:901'
    ].join(';');
    document.body.appendChild(_msgEl);

    _crosshair = document.createElement('div');
    _crosshair.id = 'cc-crosshair';
    _crosshair.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'width:16px',
      'height:16px',
      'pointer-events:none',
      'display:none',
      'z-index:902'
    ].join(';');
    _crosshair.innerHTML = '<div style="position:absolute;top:50%;left:0;right:0;height:2px;background:#FFFFFF;margin-top:-1px"></div>' +
                           '<div style="position:absolute;left:50%;top:0;bottom:0;width:2px;background:#FFFFFF;margin-left:-1px"></div>';
    document.body.appendChild(_crosshair);

    _endScreen = document.createElement('div');
    _endScreen.id = 'cc-end';
    _endScreen.style.cssText = [
      'position:fixed',
      'top:40%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#AAFF66',
      'font-family:monospace',
      'font-size:28px',
      'font-weight:bold',
      'text-align:center',
      'background:rgba(0,0,0,0.8)',
      'padding:24px 40px',
      'border-radius:8px',
      'pointer-events:none',
      'display:none',
      'z-index:903'
    ].join(';');
    document.body.appendChild(_endScreen);
  }

  function updateHUD() {
    if (!_hud || !_active) return;
    var mm = Math.floor(_missionTimer / 60);
    var ss = Math.floor(_missionTimer % 60);
    var ssStr = ss < 10 ? '0' + ss : String(ss);
    var jefeSt = _jefeCarried ? 'CARRIED' : (_jefeCaptured ? 'CAPTURED' : 'FREE');
    var intelSt = _intelCopied ? 'COPIED' : 'NOT COPIED';
    var aliveCount = 0;
    for (var si = 0; si < _soldiers.length; si++) {
      if (_soldiers[si].alive) aliveCount++;
    }
    _hud.textContent =
      'CARTEL COMPOUND' +
      ' [LAB VATS: ' + _vatsDestroyed + '/5 DESTROYED]' +
      ' [EL JEFE: ' + jefeSt + ']' +
      ' [INTEL: ' + intelSt + ']' +
      ' [AIRSTRIKES: ' + _airstrikeUses + ']' +
      ' [TIMER: ' + mm + ':' + ssStr + ']' +
      ' [SOLDIERS: ' + aliveCount + ']' +
      ' [HP: ' + _playerHP + ']';
  }

  function showMsg(text, duration) {
    if (!_msgEl) return;
    _msgEl.textContent = text;
    _msgEl.style.display = 'block';
    if (_msgEl._hideTimer) clearTimeout(_msgEl._hideTimer);
    if (duration) {
      _msgEl._hideTimer = setTimeout(function () {
        if (_msgEl) _msgEl.style.display = 'none';
      }, duration * 1000);
    }
  }

  function hideMsg() {
    if (_msgEl) {
      _msgEl.style.display = 'none';
      if (_msgEl._hideTimer) { clearTimeout(_msgEl._hideTimer); _msgEl._hideTimer = null; }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     LAUNCH
  ════════════════════════════════════════════════════════════════════════ */

  function launchRaid() {
    if (_active) return;
    _active          = true;
    _playerHP        = 100;
    _playerYaw       = 0;
    _playerPitch     = 0;
    _vatsDestroyed   = 0;
    _jefeCaptured    = false;
    _jefeCarried     = false;
    _jefeKilled      = false;
    _intelCopied     = false;
    _intelHoldTime   = 0;
    _eHeld           = false;
    _missionTimer    = 600;
    _soldierKills    = 0;
    _airstrikeUses   = 3;
    _airstrikeCooldown = 0;
    _gameOver        = false;
    _gameWon         = false;
    _bullets         = [];
    _explosions      = [];
    _bombs           = [];
    _sceneMeshes     = [];
    _inTruck         = false;

    _playerPos = new THREE.Vector3(0, 1.7, 85);

    buildCompound();
    buildSoldiers();

    if (_hud)        _hud.style.display      = 'block';
    if (_crosshair)  _crosshair.style.display = 'block';
    if (_endScreen)  _endScreen.style.display = 'none';

    /* Position camera */
    _camera.position.copy(_playerPos);
    _camera.position.y += 0.3;
    _camera.rotation.set(0, 0, 0);

    showMsg('RAID INITIATED — CAPTURE EL JEFE, COPY INTEL, DESTROY VATS, REACH AIRSTRIP', 5);
  }

  /* ════════════════════════════════════════════════════════════════════════
     SHOOTING
  ════════════════════════════════════════════════════════════════════════ */

  function shoot() {
    if (!_active || _gameOver || _gameWon) return;
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(_playerPitch, _playerYaw, 0, 'YXZ'));
    var geo = new THREE.SphereGeometry(0.08, 4, 4);
    var mat = new THREE.MeshBasicMaterial({ color: 0xFFFF44 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(_playerPos);
    mesh.position.y += 0.3;
    _scene.add(mesh);
    _bullets.push({
      mesh:   mesh,
      vel:    dir.multiplyScalar(80),
      life:   2.0,
      damage: 25
    });
  }

  function updateBullets(dt) {
    for (var bi = _bullets.length - 1; bi >= 0; bi--) {
      var b = _bullets[bi];
      b.life -= dt;
      if (b.life <= 0) {
        _scene.remove(b.mesh);
        _bullets.splice(bi, 1);
        continue;
      }
      b.mesh.position.addScaledVector(b.vel, dt);

      /* Check hits against soldiers */
      var hit = false;
      for (var si = 0; si < _soldiers.length; si++) {
        var s = _soldiers[si];
        if (!s.alive) continue;
        if (b.mesh.position.distanceTo(s.pos) < 1.2) {
          s.hp -= b.damage;
          if (s.hp <= 0) {
            killSoldier(s);
          }
          _scene.remove(b.mesh);
          _bullets.splice(bi, 1);
          hit = true;
          break;
        }
      }
      if (hit) continue;

      /* Check El Jefe hits */
      if (_jefeObj && !_jefeCaptured && !_jefeKilled) {
        if (b.mesh.position.distanceTo(_jefePos) < 1.5) {
          _jefeHP -= b.damage;
          _scene.remove(b.mesh);
          _bullets.splice(bi, 1);
          if (_jefeHP <= 10) {
            /* Knock out Jefe — stop him, prompt pickup */
            showMsg('EL JEFE IS DOWN! Press F to carry him.', 5);
            _jefeCaptured = true;
          } else if (_jefeHP <= 0) {
            /* Killed — mission fail */
            killJefe();
          }
          continue;
        }
      }
    }
  }

  function killSoldier(s) {
    if (!s.alive) return;
    s.alive = false;
    spawnExplosion(s.pos.clone(), 0.4, 0xFF4400, 3);
    _scene.remove(s.mesh);
    _soldierKills++;
  }

  function killJefe() {
    if (_jefeKilled) return;
    _jefeKilled = true;
    spawnExplosion(_jefePos.clone(), 0.6, 0xFF2200, 5);
    _scene.remove(_jefeObj);
    triggerLose('EL JEFE IS DEAD — MISSION FAILED');
  }

  /* ════════════════════════════════════════════════════════════════════════
     SOLDIER AI
  ════════════════════════════════════════════════════════════════════════ */

  var _soldierBullets = [];

  function updateSoldiers(dt) {
    for (var si = 0; si < _soldiers.length; si++) {
      var s = _soldiers[si];
      if (!s.alive) continue;

      var dToPlayer = s.pos.distanceTo(_playerPos);

      if (dToPlayer < 60) {
        /* Chase / engage player */
        var toPlayer = new THREE.Vector3().subVectors(_playerPos, s.pos);
        toPlayer.y = 0;
        var dist = toPlayer.length();
        if (dist > 8) {
          toPlayer.normalize().multiplyScalar(3.5 * dt);
          s.pos.add(toPlayer);
          s.mesh.position.copy(s.pos);
          /* Face player */
          s.mesh.lookAt(_playerPos.x, s.pos.y, _playerPos.z);
        }

        /* Fire at player */
        s.fireTimer -= dt;
        if (s.fireTimer <= 0 && dist < 40) {
          soldierFire(s);
          s.fireTimer = (s.isElite ? 0.6 : 1.2) + Math.random() * 1.0;
        }
      } else {
        /* Patrol */
        s.patrolAngle += dt * 0.4;
        var px = s.patrolCenter.x + Math.cos(s.patrolAngle) * s.patrolRadius;
        var pz = s.patrolCenter.z + Math.sin(s.patrolAngle) * s.patrolRadius;
        s.pos.x = px;
        s.pos.z = pz;
        s.mesh.position.copy(s.pos);
      }
    }

    /* El Jefe — moves toward airstrip if captured and carried */
    if (_jefeCarried && _jefeObj && !_jefeKilled) {
      _jefePos.copy(_playerPos);
      _jefePos.x += 1.5;
      _jefeObj.position.copy(_jefePos);
    } else if (_jefeObj && !_jefeCaptured && !_jefeKilled) {
      /* Jefe paces in main house */
      _jefePos.x = Math.sin(Date.now() * 0.0003) * 4;
      _jefePos.z = -25 + Math.cos(Date.now() * 0.0002) * 3;
      _jefeObj.position.copy(_jefePos);
    }

    /* Update soldier bullets */
    updateSoldierBullets(dt);
  }

  function soldierFire(s) {
    var dir = new THREE.Vector3().subVectors(_playerPos, s.pos);
    /* Add spread */
    dir.x += (Math.random() - 0.5) * 4;
    dir.y += (Math.random() - 0.5) * 2;
    dir.z += (Math.random() - 0.5) * 4;
    dir.normalize().multiplyScalar(45);

    var geo  = new THREE.SphereGeometry(0.06, 4, 4);
    var mat  = new THREE.MeshBasicMaterial({ color: 0xFF6600 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(s.pos);
    mesh.position.y += 1.6;
    _scene.add(mesh);
    _soldierBullets.push({ mesh: mesh, vel: dir, life: 2.0, dmg: s.isElite ? 20 : 12 });
  }

  function updateSoldierBullets(dt) {
    for (var bi = _soldierBullets.length - 1; bi >= 0; bi--) {
      var b = _soldierBullets[bi];
      b.life -= dt;
      if (b.life <= 0) {
        _scene.remove(b.mesh);
        _soldierBullets.splice(bi, 1);
        continue;
      }
      b.mesh.position.addScaledVector(b.vel, dt);
      if (b.mesh.position.distanceTo(_playerPos) < 1.0) {
        _playerHP -= b.dmg;
        _scene.remove(b.mesh);
        _soldierBullets.splice(bi, 1);
        if (_playerHP <= 0) {
          triggerLose('YOU WERE KILLED — MISSION FAILED');
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     C4 / VAT DESTRUCTION
  ════════════════════════════════════════════════════════════════════════ */

  function tryPlantC4() {
    if (!_active || _gameOver || _gameWon) return;
    /* Find nearest undestroyed vat */
    var nearest = null;
    var nearDist = 999;
    for (var vi = 0; vi < _vats.length; vi++) {
      var v = _vats[vi];
      if (v.destroyed) continue;
      var d = _playerPos.distanceTo(v.pos);
      if (d < 4 && d < nearDist) {
        nearDist = d;
        nearest  = vi;
      }
    }
    if (nearest === null) {
      showMsg('No vat nearby to plant C4!', 2);
      return;
    }
    showMsg('C4 PLANTED — DETONATING IN 3s...', 3);
    _c4Vat      = nearest;
    _c4PlantTimer = 3.0;
  }

  function updateC4(dt) {
    if (_c4PlantTimer <= 0 || _c4Vat === null) return;
    _c4PlantTimer -= dt;
    if (_c4PlantTimer <= 0) {
      detonateVat(_c4Vat);
      _c4Vat        = null;
      _c4PlantTimer = 0;
    }
  }

  function detonateVat(idx) {
    var v = _vats[idx];
    if (!v || v.destroyed) return;
    v.destroyed = true;
    _vatsDestroyed++;
    spawnExplosion(v.pos.clone(), 1.0, 0x44FF44, 10);
    spawnExplosion(v.pos.clone(), 0.6, 0xFFAA00, 7);
    _scene.remove(v.mesh);
    if (v.light) {
      v.light.intensity = 0;
    }
    showMsg('VAT DESTROYED! (' + _vatsDestroyed + '/5)', 2);
  }

  /* ════════════════════════════════════════════════════════════════════════
     INTEL LAPTOP
  ════════════════════════════════════════════════════════════════════════ */

  function updateIntelHold(dt) {
    if (!_active || _intelCopied || _gameOver || _gameWon) return;
    if (!_eHeld) { _intelHoldTime = 0; return; }
    var dToLaptop = _playerPos.distanceTo(_laptopPos);
    if (dToLaptop > 4) {
      _intelHoldTime = 0;
      return;
    }
    _intelHoldTime += dt;
    var pct = Math.floor((_intelHoldTime / 3.0) * 100);
    showMsg('COPYING INTEL... ' + pct + '%');
    if (_intelHoldTime >= 3.0) {
      _intelCopied = true;
      showMsg('INTEL DOWNLOADED!', 3);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     AIRSTRIKE
  ════════════════════════════════════════════════════════════════════════ */

  function callAirstrike() {
    if (!_active || _gameOver || _gameWon) return;
    if (_airstrikeUses <= 0) { showMsg('NO AIRSTRIKES REMAINING', 2); return; }
    if (_airstrikeCooldown > 0) {
      showMsg('AIRSTRIKE ON COOLDOWN: ' + Math.ceil(_airstrikeCooldown) + 's', 2);
      return;
    }
    _airstrikeUses--;
    _airstrikeCooldown = 90;

    /* Target is 30 units ahead of player look direction */
    var fwd = new THREE.Vector3(0, 0, -1);
    fwd.applyEuler(new THREE.Euler(0, _playerYaw, 0, 'YXZ'));
    var target = _playerPos.clone().add(fwd.multiplyScalar(30));
    target.y = 0;

    showMsg('GUNSHIP INBOUND!', 3);

    /* Spawn 5 bombs from above */
    for (var bi = 0; bi < 5; bi++) {
      var bx = target.x + (Math.random() - 0.5) * 20;
      var bz = target.z + (Math.random() - 0.5) * 20;
      var bombGeo = new THREE.ConeGeometry(0.3, 1.2, 6);
      var bombMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var bombMesh = new THREE.Mesh(bombGeo, bombMat);
      bombMesh.position.set(bx, 60, bz);
      bombMesh.rotation.x = Math.PI;
      _scene.add(bombMesh);
      _bombs.push({
        mesh:      bombMesh,
        life:      3.0,
        targetPos: new THREE.Vector3(bx, 0, bz),
        delay:     bi * 0.3
      });
    }
  }

  function updateBombs(dt) {
    for (var bi = _bombs.length - 1; bi >= 0; bi--) {
      var b = _bombs[bi];
      b.delay -= dt;
      if (b.delay > 0) continue;
      b.life -= dt;
      /* Fall down */
      b.mesh.position.y -= 25 * dt;
      if (b.mesh.position.y <= 0.5) {
        /* Detonate — AoE 80dmg */
        var bpos = b.mesh.position.clone();
        bpos.y = 0;
        spawnExplosion(bpos, 1.5, 0xFF6600, 15);
        spawnExplosion(bpos, 0.8, 0xFFAA00, 10);

        /* Damage soldiers in 8-unit radius */
        for (var si = 0; si < _soldiers.length; si++) {
          var s = _soldiers[si];
          if (!s.alive) continue;
          if (bpos.distanceTo(s.pos) < 8) {
            s.hp -= 80;
            if (s.hp <= 0) killSoldier(s);
          }
        }

        _scene.remove(b.mesh);
        _bombs.splice(bi, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     EXPLOSIONS
  ════════════════════════════════════════════════════════════════════════ */

  function spawnExplosion(pos, scale, color, intensity) {
    var geo  = new THREE.SphereGeometry(scale * 2, 8, 8);
    var mat  = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.9 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    _scene.add(mesh);
    var lt = new THREE.PointLight(color, intensity, scale * 15);
    lt.position.copy(pos);
    _scene.add(lt);
    _explosions.push({ mesh: mesh, light: lt, life: 1.0 });
  }

  function updateExplosions(dt) {
    for (var ei = _explosions.length - 1; ei >= 0; ei--) {
      var ex = _explosions[ei];
      ex.life -= dt * 1.5;
      if (ex.life <= 0) {
        _scene.remove(ex.mesh);
        _scene.remove(ex.light);
        _explosions.splice(ei, 1);
        continue;
      }
      ex.mesh.material.opacity = ex.life * 0.9;
      ex.light.intensity       = ex.light.intensity * ex.life;
      ex.mesh.scale.setScalar(1 + (1 - ex.life) * 0.8);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER MOVEMENT
  ════════════════════════════════════════════════════════════════════════ */

  function updatePlayer(dt) {
    if (!_active || _gameOver || _gameWon) return;

    if (_inTruck) {
      updateTruckDrive(dt);
      return;
    }

    var speed = 10 * dt;
    var fwd   = new THREE.Vector3(-Math.sin(_playerYaw), 0, -Math.cos(_playerYaw));
    var right = new THREE.Vector3(Math.cos(_playerYaw), 0, -Math.sin(_playerYaw));

    if (_keys['w'] || _keys['W']) _playerPos.addScaledVector(fwd, speed);
    if (_keys['s'] || _keys['S']) _playerPos.addScaledVector(fwd, -speed);
    if (_keys['a'] || _keys['A']) _playerPos.addScaledVector(right, -speed);
    if (_keys['d'] || _keys['D']) _playerPos.addScaledVector(right,  speed);

    /* Stay on ground */
    _playerPos.y = 1.7;

    /* Clamp to world bounds */
    _playerPos.x = Math.max(-120, Math.min(120, _playerPos.x));
    _playerPos.z = Math.max(-120, Math.min(120, _playerPos.z));

    /* Update camera */
    _camera.position.copy(_playerPos);
    _camera.position.y = _playerPos.y + 0.3;
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y = _playerYaw;
    _camera.rotation.x = _playerPitch;

    /* Continuous shooting */
    _shootCooldown -= dt;
    if ((_mouseDown || _keys[' ']) && _shootCooldown <= 0) {
      shoot();
      _shootCooldown = 0.12;
    }

    /* Airstrike cooldown */
    if (_airstrikeCooldown > 0) _airstrikeCooldown -= dt;

    /* Mission timer */
    _missionTimer -= dt;
    if (_missionTimer <= 0) {
      _missionTimer = 0;
      triggerLose('TIME EXPIRED — MISSION FAILED');
    }

    /* Check win condition */
    checkWin();

    /* Proximity prompts */
    checkProximityPrompts();
  }

  function updateTruckDrive(dt) {
    var speed = 16 * dt;
    var fwd   = new THREE.Vector3(-Math.sin(_playerYaw), 0, -Math.cos(_playerYaw));
    var right = new THREE.Vector3(Math.cos(_playerYaw), 0, -Math.sin(_playerYaw));

    if (_keys['w'] || _keys['W']) {
      _playerPos.addScaledVector(fwd, speed);
      if (_truckObj) _truckObj.position.copy(_playerPos).setY(1.25);
    }
    if (_keys['s'] || _keys['S']) {
      _playerPos.addScaledVector(fwd, -speed * 0.5);
      if (_truckObj) _truckObj.position.copy(_playerPos).setY(1.25);
    }
    if (_keys['a'] || _keys['A']) _playerYaw += 1.5 * dt;
    if (_keys['d'] || _keys['D']) _playerYaw -= 1.5 * dt;

    _playerPos.y = 1.7;
    _camera.position.copy(_playerPos).setY(_playerPos.y + 3);
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y = _playerYaw;
    _camera.rotation.x = -0.2;
  }

  function checkProximityPrompts() {
    /* Near vat */
    for (var vi = 0; vi < _vats.length; vi++) {
      var v = _vats[vi];
      if (!v.destroyed && _playerPos.distanceTo(v.pos) < 4) {
        return; /* Prompts shown in keydown */
      }
    }
    /* Near laptop */
    if (!_intelCopied && _playerPos.distanceTo(_laptopPos) < 4) {
      return;
    }
    /* Near El Jefe */
    if (_jefeCaptured && !_jefeCarried && _playerPos.distanceTo(_jefePos) < 3) {
      return;
    }
  }

  function checkWin() {
    if (_gameOver || _gameWon) return;
    if (_intelCopied && _vatsDestroyed >= 4 && _jefeCarried) {
      /* Check if near airstrip */
      if (_playerPos.distanceTo(_airstripPos) < 20) {
        triggerWin();
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     WIN / LOSE
  ════════════════════════════════════════════════════════════════════════ */

  function triggerWin() {
    _gameWon  = true;
    _active   = false;
    _endScreen.style.color = '#AAFF66';
    _endScreen.innerHTML =
      'MISSION COMPLETE<br>' +
      '<span style="font-size:16px">' +
      'Intel Downloaded | ' + _vatsDestroyed + '/5 Vats Destroyed<br>' +
      'El Jefe Captured | Extraction Complete<br>' +
      'Soldiers KIA: ' + _soldierKills + ' | Time: ' + Math.ceil(_missionTimer) + 's remaining' +
      '</span>';
    _endScreen.style.display = 'block';
  }

  function triggerLose(reason) {
    if (_gameOver || _gameWon) return;
    _gameOver = true;
    _active   = false;
    _endScreen.style.color = '#FF4444';
    _endScreen.innerHTML =
      reason + '<br>' +
      '<span style="font-size:16px">' +
      'Vats: ' + _vatsDestroyed + '/5 | Intel: ' + (_intelCopied ? 'Copied' : 'Not copied') + '<br>' +
      'Soldiers KIA: ' + _soldierKills +
      '</span>';
    _endScreen.style.display = 'block';
  }

  /* ════════════════════════════════════════════════════════════════════════
     INPUT
  ════════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    _keys[e.key] = true;

    /* C+C activation */
    if (e.key === 'c' || e.key === 'C') {
      var now = Date.now();
      if (now - _lastCTime < 400) {
        launchRaid();
      }
      _lastCTime = now;
    }

    if (!_active || _gameOver || _gameWon) return;

    /* G — plant C4 */
    if (e.key === 'g' || e.key === 'G') {
      tryPlantC4();
    }

    /* A — airstrike */
    if (e.key === 'a' || e.key === 'A') {
      /* Only if no movement intent — check no WASD held */
      if (!_keys['w'] && !_keys['W'] && !_keys['s'] && !_keys['S'] &&
          !_keys['d'] && !_keys['D']) {
        callAirstrike();
      }
    }

    /* F — pick up El Jefe */
    if (e.key === 'f' || e.key === 'F') {
      if (_jefeCaptured && !_jefeCarried && _playerPos.distanceTo(_jefePos) < 4) {
        _jefeCarried = true;
        showMsg('EL JEFE SECURED — HEAD TO AIRSTRIP!', 4);
      }
    }

    /* T — enter/exit truck */
    if (e.key === 't' || e.key === 'T') {
      if (!_inTruck && _truckObj && _playerPos.distanceTo(_truckObj.position) < 6) {
        _inTruck = true;
        showMsg('IN TRUCK — W/S drive, A/D steer, T to exit', 3);
      } else if (_inTruck) {
        _inTruck = false;
        showMsg('EXITED TRUCK', 2);
      }
    }

    /* E — hold for intel */
    if (e.key === 'e' || e.key === 'E') {
      _eHeld = true;
      if (!_intelCopied && _playerPos.distanceTo(_laptopPos) < 4) {
        showMsg('HOLD E TO COPY INTEL...');
      }
    }

    /* Space — shoot */
    if (e.key === ' ') {
      e.preventDefault();
    }
  }

  function onKeyUp(e) {
    _keys[e.key] = false;
    if (e.key === 'e' || e.key === 'E') {
      _eHeld = false;
      if (!_intelCopied) hideMsg();
      _intelHoldTime = 0;
    }
  }

  function onMouseMove(e) {
    if (!_active || !_canvas) return;
    var dx = e.movementX || 0;
    var dy = e.movementY || 0;
    _playerYaw   -= dx * 0.002;
    _playerPitch -= dy * 0.002;
    _playerPitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, _playerPitch));
  }

  function onMouseDown(e) {
    if (e.button === 0) _mouseDown = true;
    /* Request pointer lock */
    if (_canvas && _active) {
      _canvas.requestPointerLock();
    }
  }

  function onMouseUp(e) {
    if (e.button === 0) _mouseDown = false;
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    buildDOM();

    document.addEventListener('keydown',   onKeyDown);
    document.addEventListener('keyup',     onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup',   onMouseUp);
  }

  function update(delta) {
    if (!_active || !_scene) return;
    var dt = delta || 0.016;

    updatePlayer(dt);
    updateSoldiers(dt);
    updateBullets(dt);
    updateC4(dt);
    updateBombs(dt);
    updateExplosions(dt);
    updateIntelHold(dt);
    updateHUD();
  }

  function reset() {
    _active   = false;
    _gameOver = false;
    _gameWon  = false;

    /* Remove all static scene meshes */
    for (var mi = 0; mi < _sceneMeshes.length; mi++) {
      if (_scene) _scene.remove(_sceneMeshes[mi]);
    }
    _sceneMeshes = [];

    /* Remove soldiers */
    for (var si = 0; si < _soldiers.length; si++) {
      if (_scene && _soldiers[si].mesh) _scene.remove(_soldiers[si].mesh);
    }
    _soldiers = [];

    /* Remove El Jefe */
    if (_jefeObj && _scene) { _scene.remove(_jefeObj); _jefeObj = null; }

    /* Remove bullets */
    for (var bi = 0; bi < _bullets.length; bi++) {
      if (_scene) _scene.remove(_bullets[bi].mesh);
    }
    _bullets = [];
    for (var sbi = 0; sbi < _soldierBullets.length; sbi++) {
      if (_scene) _scene.remove(_soldierBullets[sbi].mesh);
    }
    _soldierBullets = [];

    /* Remove explosions */
    for (var ei = 0; ei < _explosions.length; ei++) {
      if (_scene) {
        _scene.remove(_explosions[ei].mesh);
        _scene.remove(_explosions[ei].light);
      }
    }
    _explosions = [];

    /* Remove bombs */
    for (var bmi = 0; bmi < _bombs.length; bmi++) {
      if (_scene) _scene.remove(_bombs[bmi].mesh);
    }
    _bombs = [];

    /* DOM */
    if (_hud)       _hud.style.display       = 'none';
    if (_crosshair) _crosshair.style.display  = 'none';
    if (_endScreen) _endScreen.style.display  = 'none';
    hideMsg();

    /* Release pointer lock */
    if (document.exitPointerLock) document.exitPointerLock();

    _keys        = {};
    _mouseDown   = false;
    _playerPos   = null;
    _inTruck     = false;
    _vats        = [];
    _laptop      = null;
    _laptopLight = null;
    _c4Vat       = null;
    _c4PlantTimer = 0;
    _eHeld       = false;
    _intelHoldTime = 0;
  }

  return { init: init, update: update, reset: reset };

}());
