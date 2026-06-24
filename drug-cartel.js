/* ───────────────────────────────────────────────────────────────────────────
   drug-cartel.js — DEA Raid on El Jefe's Jungle Compound
   API: window.DrugCartel = { init, update, reset }
   Controls:
     D + C (together, within 400ms) → activate module
     WASD                           → move player
     Mouse                          → aim / look
     Left Click                     → shoot
     E (hold 3s near stunned El Jefe) → arrest El Jefe
     E (near crate)                 → seize drug shipment
     F+E (near meth lab)            → place C4 charge (10s fuse)
     1 / 2 / 3                      → assign DEA squad (breach/secure/extract)
   ─────────────────────────────────────────────────────────────────────────── */
window.DrugCartel = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Activation state ──────────────────────────────────────────────────── */
  var _active     = false;
  var _dPressTime = 0;
  var _cPressTime = 0;
  var _keys       = {};

  /* ── Player ────────────────────────────────────────────────────────────── */
  var _player     = null;
  var _playerPos  = null;
  var _playerHP   = 100;
  var _yaw        = 0;
  var _pitch      = 0;
  var _fireTimer  = 0;
  var _fireRate   = 0.12;

  /* ── Bullets ───────────────────────────────────────────────────────────── */
  var _playerBullets = [];
  var _enemyBullets  = [];
  var _bulletSpeed   = 25;

  /* ── Game state ────────────────────────────────────────────────────────── */
  var _gameTime          = 0;
  var _alerted           = false;
  var _missionEnd        = false;
  var _missionWon        = false;
  var _endTimer          = 0;

  /* ── Objectives ────────────────────────────────────────────────────────── */
  var _shipmentsSeized   = 0;   // need 8
  var _labsDestroyed     = 0;   // need 2
  var _farmersFreed      = 0;   // need 3
  var _elJefeArrested    = false;

  /* ── Arrest mechanic ───────────────────────────────────────────────────── */
  var _arrestTimer       = 0;   // hold E for 3s
  var _arresting         = false;

  /* ── C4 mechanic ───────────────────────────────────────────────────────── */
  var _fKeyDown          = false;
  var _c4Charges         = [];  // { mesh, fuseTimer, labIndex, exploded }

  /* ── El Jefe ───────────────────────────────────────────────────────────── */
  var _elJefe            = null;
  var _elJefeHP          = 350;
  var _elJefePanicking   = false;
  var _elJefeStunned     = false;
  var _elJefeEscaped     = false;
  var _elJefeFireTimer   = 0;
  var _elJefeAtHelo      = false;
  var _heloEscapeTimer   = 30;  // 30s window once he boards

  /* ── Helicopter ────────────────────────────────────────────────────────── */
  var _heloGroup         = null;
  var _heloRotorTop      = null;
  var _heloRotorTail     = null;
  var _heloFuelTank      = null;
  var _heloDisabled      = false;
  var _heloPadPos        = null;

  /* ── Enemies ───────────────────────────────────────────────────────────── */
  var _sicarios          = [];  // 20 x { mesh, hp, alive, patrol, fireTimer, pos, detRange }
  var _snipers           = [];  // 4  x { mesh, hp, alive, fireTimer, pos }
  var _captain           = null;
  var _captainHP         = 200;
  var _captainAlive      = true;
  var _captainFireTimer  = 0;

  /* ── Squad ─────────────────────────────────────────────────────────────── */
  var _squadAgents       = [];  // 3 x { mesh, hp, alive, order, target }
  var _squadAlive        = 3;

  /* ── Drug shipments ────────────────────────────────────────────────────── */
  var _shipments         = [];  // 10 x { mesh, seized, pos }

  /* ── Meth labs ─────────────────────────────────────────────────────────── */
  var _methLabs          = [];  // 3 x { mesh, destroyed, pos, cloud, cloudTimer }

  /* ── Farmers (captive) ─────────────────────────────────────────────────── */
  var _farmers           = [];  // 5 x { mesh, freed, escorting, pos }

  /* ── Workers (non-hostile, flee on explosion) ──────────────────────────── */
  var _workers           = [];  // { mesh, fleeing, pos }

  /* ── Chemical clouds ───────────────────────────────────────────────────── */
  var _chemClouds        = [];  // { mesh, timer, pos }

  /* ── Screen edge glow (meth lab proximity) ─────────────────────────────── */
  var _glowOverlay       = null;
  var _glowAlpha         = 0;

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  var _hud               = null;

  /* ── Group ─────────────────────────────────────────────────────────────── */
  var _compoundGroup     = null;

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  HELPERS                                                                */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _mat(color, opacity) {
    if (opacity !== undefined && opacity < 1) {
      return new THREE.MeshLambertMaterial({ color: color, transparent: true, opacity: opacity });
    }
    return new THREE.MeshLambertMaterial({ color: color });
  }

  function _box(w, h, d, color, opacity) {
    var geo = new THREE.BoxGeometry(w, h, d);
    return new THREE.Mesh(geo, _mat(color, opacity));
  }

  function _cyl(rt, rb, h, segs, color) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
    return new THREE.Mesh(geo, _mat(color));
  }

  function _sphere(r, color, opacity) {
    var geo = new THREE.SphereGeometry(r, 8, 8);
    return new THREE.Mesh(geo, _mat(color, opacity));
  }

  function _cone(r, h, segs, color) {
    var geo = new THREE.ConeGeometry(r, h, segs || 8);
    return new THREE.Mesh(geo, _mat(color));
  }

  function _dist2d(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _dist3(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _v3(x, y, z) {
    return new THREE.Vector3(x, y, z);
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  BUILD COMPOUND                                                         */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _buildCompound() {
    _compoundGroup = new THREE.Group();

    /* ── Ground (jungle clearing) ─────────────────────────────────────── */
    var ground = _box(120, 0.3, 100, 0x3A5A1A);
    ground.position.set(0, -0.15, 0);
    _compoundGroup.add(ground);

    /* ── River at east border ─────────────────────────────────────────── */
    var river = _box(20, 0.4, 100, 0x224466);
    river.position.set(55, 0.1, 0);
    _compoundGroup.add(river);

    /* ── Perimeter fence (LineSegments) ───────────────────────────────── */
    _buildFence();

    /* ── 6 Guard towers ───────────────────────────────────────────────── */
    var towerPositions = [
      [-38, 0, -38], [0, 0, -38], [38, 0, -38],
      [-38, 0, 38],  [0, 0, 38],  [38, 0, 38]
    ];
    for (var ti = 0; ti < 6; ti++) {
      var tp = towerPositions[ti];
      var tower = _cyl(2, 2.5, 10, 6, 0x4A3322);
      tower.position.set(tp[0], 5, tp[2]);
      _compoundGroup.add(tower);
      /* Platform on top */
      var platform = _cyl(3, 3, 0.5, 6, 0x3A2A15);
      platform.position.set(tp[0], 10.25, tp[2]);
      _compoundGroup.add(platform);
      /* Roof cone */
      var roof = _cone(3.2, 2, 6, 0x2A1A08);
      roof.position.set(tp[0], 11.5, tp[2]);
      _compoundGroup.add(roof);
    }

    /* ── Main house (El Jefe's residence) 20x5x15 ─────────────────────── */
    var mainHouse = _box(20, 5, 15, 0x885533);
    mainHouse.position.set(-10, 2.5, -15);
    _compoundGroup.add(mainHouse);
    /* Roof */
    var houseRoof = _box(22, 0.5, 17, 0x6A3A1A);
    houseRoof.position.set(-10, 5.25, -15);
    _compoundGroup.add(houseRoof);

    /* ── Helicopter pad ────────────────────────────────────────────────── */
    var heloPad = _cyl(7, 7, 0.3, 8, 0x333333);
    heloPad.position.set(-10, 0.15, -32);
    _compoundGroup.add(heloPad);
    /* H marking */
    var hMark = _box(3, 0.05, 0.8, 0xFFFFFF);
    hMark.position.set(-10, 0.31, -32);
    _compoundGroup.add(hMark);
    var hMark2 = _box(0.8, 0.05, 3, 0xFFFFFF);
    hMark2.position.set(-10, 0.31, -32);
    _compoundGroup.add(hMark2);
    _heloPadPos = _v3(-10, 0, -32);

    /* ── Helicopter ────────────────────────────────────────────────────── */
    _buildHelicopter();

    /* ── 3 Meth labs 10x4x8 ────────────────────────────────────────────── */
    var labPositions = [
      [10, 2, -10], [20, 2, 5], [15, 2, 18]
    ];
    for (var li = 0; li < 3; li++) {
      var lp = labPositions[li];
      var lab = _box(10, 4, 8, 0x667744);
      lab.position.set(lp[0], lp[1], lp[2]);
      _compoundGroup.add(lab);
      /* Barrel outside each lab */
      var barrel = _cyl(0.5, 0.5, 1.2, 8, 0x445533);
      barrel.position.set(lp[0] + 6, 0.6, lp[2]);
      _compoundGroup.add(barrel);
      _methLabs.push({
        mesh: lab,
        destroyed: false,
        pos: _v3(lp[0], lp[1], lp[2]),
        cloud: null,
        cloudTimer: 0
      });
    }

    /* ── Barracks 25x4x10 ──────────────────────────────────────────────── */
    var barracks = _box(25, 4, 10, 0x554433);
    barracks.position.set(5, 2, -25);
    _compoundGroup.add(barracks);

    /* ── Vehicle pool ──────────────────────────────────────────────────── */
    /* 2 pickups */
    var pickup1 = _buildPickup(0x664422);
    pickup1.position.set(-25, 0.6, 5);
    _compoundGroup.add(pickup1);
    var pickup2 = _buildPickup(0x664422);
    pickup2.position.set(-25, 0.6, 12);
    _compoundGroup.add(pickup2);
    /* Speedboat at river dock */
    var speedboat = _buildSpeedboat();
    speedboat.position.set(42, 0.4, 10);
    _compoundGroup.add(speedboat);
    /* River dock */
    var dock = _box(8, 0.4, 4, 0x7A5A2A);
    dock.position.set(48, 0.2, 10);
    _compoundGroup.add(dock);

    /* ── 10 Drug shipment crates ────────────────────────────────────────── */
    var cratePositions = [
      [0, 0.5, -10], [5, 0.5, -5],  [12, 0.5, -15],
      [20, 0.5, -8], [25, 0.5, 0],  [18, 0.5, 12],
      [-5, 0.5, 10], [30, 0.5, -20],[8, 0.5, 25],
      [-15, 0.5, 0]
    ];
    for (var ci = 0; ci < 10; ci++) {
      var cp = cratePositions[ci];
      var crate = _box(1.5, 1.2, 1.5, 0xFFCC44);
      crate.position.set(cp[0], cp[1], cp[2]);
      _compoundGroup.add(crate);
      /* Lid stripe */
      var stripe = _box(1.6, 0.1, 0.3, 0xCC8800);
      stripe.position.set(cp[0], cp[1] + 0.65, cp[2]);
      _compoundGroup.add(stripe);
      _shipments.push({
        mesh: crate,
        stripeMesh: stripe,
        seized: false,
        pos: _v3(cp[0], cp[1], cp[2])
      });
    }

    /* ── 5 Captive farmers ──────────────────────────────────────────────── */
    var farmerPositions = [
      [-20, 0.75, -5], [-22, 0.75, 2], [22, 0.75, -18],
      [28, 0.75, 8],   [0, 0.75, 20]
    ];
    for (var fi = 0; fi < 5; fi++) {
      var fp = farmerPositions[fi];
      var farmerMesh = _box(0.6, 1.5, 0.6, 0xDDA84A);
      farmerMesh.position.set(fp[0], fp[1], fp[2]);
      _compoundGroup.add(farmerMesh);
      /* Head */
      var farmerHead = _sphere(0.35, 0xE8C080);
      farmerHead.position.set(fp[0], fp[1] + 1.1, fp[2]);
      _compoundGroup.add(farmerHead);
      /* Cage bars */
      var cage = _buildCage();
      cage.position.set(fp[0], 0, fp[2]);
      _compoundGroup.add(cage);
      _farmers.push({
        mesh: farmerMesh,
        headMesh: farmerHead,
        cage: cage,
        freed: false,
        escorting: false,
        pos: _v3(fp[0], fp[1], fp[2])
      });
    }

    /* ── Lab workers (non-hostile) ──────────────────────────────────────── */
    var workerPositions = [
      [10, 0.75, -10], [20, 0.75, 5], [15, 0.75, 18]
    ];
    for (var wi = 0; wi < 3; wi++) {
      var wpos = workerPositions[wi];
      var workerMesh = _box(0.6, 1.5, 0.6, 0xFFDDCC);
      workerMesh.position.set(wpos[0] + 2, wpos[1], wpos[2]);
      _compoundGroup.add(workerMesh);
      _workers.push({
        mesh: workerMesh,
        fleeing: false,
        fleeDir: _v3(0, 0, 0),
        pos: _v3(wpos[0] + 2, wpos[1], wpos[2])
      });
    }

    /* ── Jungle trees around perimeter ─────────────────────────────────── */
    _buildJungle();

    /* ── Lighting ───────────────────────────────────────────────────────── */
    var ambient = new THREE.AmbientLight(0xAACC88, 0.55);
    _scene.add(ambient);
    var sun = new THREE.DirectionalLight(0xFFEECC, 1.0);
    sun.position.set(30, 60, 20);
    _scene.add(sun);
    var fillLight = new THREE.DirectionalLight(0x88AAFF, 0.3);
    fillLight.position.set(-20, 20, -20);
    _scene.add(fillLight);

    _scene.add(_compoundGroup);
  }

  function _buildFence() {
    var pts = [];
    var W = 44, D = 44;
    /* Perimeter corners */
    var corners = [
      [-W, 0, -D], [W, 0, -D], [W, 0, D], [-W, 0, D], [-W, 0, -D]
    ];
    for (var i = 0; i < 4; i++) {
      var a = corners[i], b = corners[i + 1];
      /* Bottom rail */
      pts.push(a[0], 0.5, a[2],  b[0], 0.5, b[2]);
      /* Mid rail */
      pts.push(a[0], 2.0, a[2],  b[0], 2.0, b[2]);
      /* Top rail */
      pts.push(a[0], 3.5, a[2],  b[0], 3.5, b[2]);
      /* Vertical posts every 8 units */
      var steps = Math.round(Math.sqrt((b[0]-a[0])*(b[0]-a[0])+(b[2]-a[2])*(b[2]-a[2])) / 8);
      for (var s = 0; s <= steps; s++) {
        var t = s / steps;
        var px = a[0] + (b[0] - a[0]) * t;
        var pz = a[2] + (b[2] - a[2]) * t;
        pts.push(px, 0, pz,  px, 4, pz);
      }
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    var mat = new THREE.LineBasicMaterial({ color: 0x664422 });
    var fence = new THREE.LineSegments(geo, mat);
    _compoundGroup.add(fence);
  }

  function _buildHelicopter() {
    _heloGroup = new THREE.Group();
    /* Body */
    var body = _box(2.5, 1.5, 6, 0x333344);
    body.position.set(0, 0.75, 0);
    _heloGroup.add(body);
    /* Cockpit bubble */
    var cockpit = _sphere(1.1, 0x445566, 0.8);
    cockpit.position.set(0, 0.9, 2.5);
    _heloGroup.add(cockpit);
    /* Tail boom */
    var tailBoom = _box(0.7, 0.7, 4, 0x333344);
    tailBoom.position.set(0, 0.8, -4.5);
    _heloGroup.add(tailBoom);
    /* Tail rotor */
    _heloRotorTail = _box(0.2, 2, 0.15, 0x666666);
    _heloRotorTail.position.set(0.6, 0.8, -7);
    _heloGroup.add(_heloRotorTail);
    /* Main rotor */
    _heloRotorTop = _box(10, 0.15, 0.3, 0x666666);
    _heloRotorTop.position.set(0, 2.1, 0);
    _heloGroup.add(_heloRotorTop);
    /* Fuel tank (shoot to disable) */
    _heloFuelTank = _cyl(0.4, 0.4, 1.4, 8, 0xFF4400);
    _heloFuelTank.rotation.z = Math.PI / 2;
    _heloFuelTank.position.set(0, 0.2, -3);
    _heloGroup.add(_heloFuelTank);
    /* Skids */
    var skidL = _box(0.2, 0.2, 5.5, 0x555555);
    skidL.position.set(-1.2, -0.2, 0);
    _heloGroup.add(skidL);
    var skidR = _box(0.2, 0.2, 5.5, 0x555555);
    skidR.position.set(1.2, -0.2, 0);
    _heloGroup.add(skidR);

    _heloGroup.position.set(-10, 0.3, -32);
    _compoundGroup.add(_heloGroup);
  }

  function _buildPickup(color) {
    var g = new THREE.Group();
    var body = _box(2, 1.2, 4.5, color);
    body.position.y = 0.6;
    g.add(body);
    var cab = _box(2, 1.0, 2, color);
    cab.position.set(0, 1.7, -0.5);
    g.add(cab);
    var wPositions = [[-1.1, 0.4, 1.5], [1.1, 0.4, 1.5], [-1.1, 0.4, -1.5], [1.1, 0.4, -1.5]];
    for (var wi = 0; wi < 4; wi++) {
      var wheel = _cyl(0.4, 0.4, 0.3, 8, 0x111111);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wPositions[wi][0], wPositions[wi][1], wPositions[wi][2]);
      g.add(wheel);
    }
    return g;
  }

  function _buildSpeedboat() {
    var g = new THREE.Group();
    var hull = _box(2, 0.8, 6, 0x334455);
    hull.position.y = 0.4;
    g.add(hull);
    var windshield = _box(1.8, 0.6, 0.3, 0x667788, 0.5);
    windshield.position.set(0, 1.1, 0.5);
    g.add(windshield);
    var engine = _box(0.8, 0.6, 0.8, 0x223344);
    engine.position.set(0, 0.7, -3.2);
    g.add(engine);
    return g;
  }

  function _buildCage() {
    var pts = [];
    var s = 1.2;
    /* 4 vertical corners */
    var corners2 = [[-s,0,-s],[s,0,-s],[s,0,s],[-s,0,s]];
    for (var i = 0; i < 4; i++) {
      var c = corners2[i];
      pts.push(c[0], 0, c[2],  c[0], 2.2, c[2]);
    }
    /* Horizontal rings at 0, 1.1, 2.2 */
    for (var h = 0; h <= 2; h++) {
      var hy = h * 1.1;
      pts.push(-s, hy, -s,  s, hy, -s);
      pts.push( s, hy, -s,  s, hy,  s);
      pts.push( s, hy,  s, -s, hy,  s);
      pts.push(-s, hy,  s, -s, hy, -s);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    var mat = new THREE.LineBasicMaterial({ color: 0x888888 });
    return new THREE.LineSegments(geo, mat);
  }

  function _buildJungle() {
    var treePositions = [];
    for (var i = 0; i < 40; i++) {
      var angle = (i / 40) * Math.PI * 2;
      var r = 50 + Math.random() * 15;
      treePositions.push([Math.cos(angle) * r, Math.sin(angle) * r]);
    }
    for (var j = 0; j < 40; j++) {
      var tp = treePositions[j];
      var trunk = _cyl(0.3, 0.5, 5 + Math.random() * 3, 6, 0x4A3010);
      trunk.position.set(tp[0], 2.5, tp[1]);
      _compoundGroup.add(trunk);
      var canopy = _sphere(2.5 + Math.random() * 1.5, 0x1A4A10);
      canopy.position.set(tp[0], 6 + Math.random() * 2, tp[1]);
      _compoundGroup.add(canopy);
      var canopy2 = _sphere(1.8 + Math.random(), 0x2A6A15);
      canopy2.position.set(tp[0] + (Math.random()-0.5)*2, 8 + Math.random() * 2, tp[1] + (Math.random()-0.5)*2);
      _compoundGroup.add(canopy2);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  SPAWN ENEMIES                                                          */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _spawnEnemies() {
    /* 20 sicarios */
    var sicarioSpawns = [
      [0,-20],[5,-18],[12,-22],[18,-15],[25,-10],
      [20,0],[15,10],[8,22],[0,25],[-10,18],
      [-18,10],[-20,0],[-15,-10],[30,-15],[28,5],
      [22,18],[35,-5],[32,15],[10,-28],[-5,-25]
    ];
    for (var si = 0; si < 20; si++) {
      var sp = sicarioSpawns[si];
      var sBody = _box(0.8, 1.8, 0.8, 0x554433);
      sBody.position.set(sp[0], 0.9, sp[1]);
      _compoundGroup.add(sBody);
      var sHead = _sphere(0.35, 0x7A5A3A);
      sHead.position.set(sp[0], 2.2, sp[1]);
      _compoundGroup.add(sHead);
      /* Check if near shipment for bonus range */
      var baseRange = 20;
      for (var sh = 0; sh < _shipments.length; sh++) {
        if (_dist2d(sBody.position, _shipments[sh].pos) < 8) {
          baseRange = 24; /* +20% detection */
          break;
        }
      }
      var patrolAngle = Math.random() * Math.PI * 2;
      _sicarios.push({
        mesh: sBody,
        headMesh: sHead,
        hp: 80,
        alive: true,
        fireTimer: Math.random() * 2,
        patrolAngle: patrolAngle,
        patrolCenter: _v3(sp[0], 0.9, sp[1]),
        patrolRadius: 5 + Math.random() * 5,
        detRange: baseRange,
        alerted: false
      });
    }

    /* 4 snipers in guard towers */
    var towerPositions = [
      [-38, 10.5, -38], [38, 10.5, -38],
      [-38, 10.5, 38],  [38, 10.5, 38]
    ];
    for (var sni = 0; sni < 4; sni++) {
      var snp = towerPositions[sni];
      var snBody = _cyl(0.3, 0.35, 2.0, 8, 0x3A2A1A);
      snBody.position.set(snp[0], snp[1], snp[2]);
      _compoundGroup.add(snBody);
      var snHead = _sphere(0.3, 0x6A4A2A);
      snHead.position.set(snp[0], snp[1] + 1.3, snp[2]);
      _compoundGroup.add(snHead);
      _snipers.push({
        mesh: snBody,
        headMesh: snHead,
        hp: 120,
        alive: true,
        fireTimer: 1.5 + Math.random() * 1.5,
        pos: _v3(snp[0], snp[1], snp[2])
      });
    }

    /* Captain */
    var capBody = _box(1.0, 2.0, 1.0, 0x330000);
    capBody.position.set(0, 1.0, -20);
    _compoundGroup.add(capBody);
    var capHead = _sphere(0.4, 0x4A0000);
    capHead.position.set(0, 2.8, -20);
    _compoundGroup.add(capHead);
    _captain = { mesh: capBody, headMesh: capHead, pos: _v3(0, 1.0, -20) };

    /* El Jefe */
    var jefeBody = _box(1.1, 2.2, 1.1, 0x550000);
    jefeBody.position.set(-10, 1.1, -15);
    _compoundGroup.add(jefeBody);
    var jefeHead = _sphere(0.45, 0x660000);
    jefeHead.position.set(-10, 3.2, -15);
    _compoundGroup.add(jefeHead);
    /* Gold chain indicator */
    var chain = _cyl(0.05, 0.05, 0.6, 6, 0xFFDD00);
    chain.rotation.x = Math.PI / 2;
    chain.position.set(-10, 2.3, -14.6);
    _compoundGroup.add(chain);
    _elJefe = { mesh: jefeBody, headMesh: jefeHead, chainMesh: chain };
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  SPAWN DEA SQUAD                                                        */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _spawnSquad() {
    var squadSpawns = [[-4, 0.9, 48], [0, 0.9, 48], [4, 0.9, 48]];
    var squadOrders = ['standby', 'standby', 'standby'];
    for (var i = 0; i < 3; i++) {
      var sp = squadSpawns[i];
      var agentBody = _box(0.8, 1.8, 0.8, 0x334455);
      agentBody.position.set(sp[0], sp[1], sp[2]);
      _compoundGroup.add(agentBody);
      var agentHead = _sphere(0.32, 0x88AABB);
      agentHead.position.set(sp[0], sp[1] + 1.15, sp[2]);
      _compoundGroup.add(agentHead);
      /* DEA vest marker */
      var vest = _box(0.85, 0.7, 0.85, 0xFFFF00);
      vest.position.set(sp[0], sp[1] + 0.2, sp[2]);
      _compoundGroup.add(vest);
      _squadAgents.push({
        mesh: agentBody,
        headMesh: agentHead,
        vestMesh: vest,
        hp: 100,
        alive: true,
        order: squadOrders[i],
        target: null,
        fireTimer: 0,
        pos: _v3(sp[0], sp[1], sp[2])
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  PLAYER                                                                 */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _spawnPlayer() {
    _player = _box(0.8, 1.8, 0.8, 0x2244AA);
    _player.position.set(0, 0.9, 45);
    _compoundGroup.add(_player);
    _playerPos = _player.position;
    _playerHP = 100;
    _yaw = 0;
    _pitch = 0;
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  HUD                                                                    */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'dc-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.72)',
      'color:#00FF88',
      'font:bold 13px/1.4 monospace',
      'padding:7px 16px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'text-align:center',
      'letter-spacing:0.04em',
      'border:1px solid #336644'
    ].join(';');
    document.body.appendChild(_hud);

    /* Health bar */
    _hud.insertAdjacentHTML('beforeend',
      '<div id="dc-hp" style="color:#FF4444;margin-top:4px;">HP: 100</div>');

    /* Screen edge glow overlay for meth lab proximity */
    _glowOverlay = document.createElement('div');
    _glowOverlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'pointer-events:none',
      'z-index:9998',
      'box-shadow:inset 0 0 80px 40px rgba(68,255,68,0)',
      'transition:box-shadow 0.2s'
    ].join(';');
    document.body.appendChild(_glowOverlay);

    /* Crosshair */
    var xhair = document.createElement('div');
    xhair.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'width:14px',
      'height:14px',
      'pointer-events:none',
      'z-index:9999'
    ].join(';');
    xhair.innerHTML = '<svg width="14" height="14"><line x1="7" y1="0" x2="7" y2="14" stroke="#00FF88" stroke-width="1.5"/><line x1="0" y1="7" x2="14" y2="7" stroke="#00FF88" stroke-width="1.5"/></svg>';
    document.body.appendChild(xhair);
  }

  function _updateHUD() {
    if (!_hud) return;
    var jefeStatus = _elJefeArrested ? 'ARRESTED' : (_elJefeEscaped ? 'ESCAPED' : 'AT LARGE');
    var squadCount = 0;
    for (var i = 0; i < _squadAgents.length; i++) {
      if (_squadAgents[i].alive) squadCount++;
    }
    _hud.childNodes[0].nodeValue = '';
    _hud.innerHTML =
      'DRUG CARTEL  [SHIPMENTS: ' + _shipmentsSeized + '/10]' +
      '  [LABS: ' + _labsDestroyed + '/3 DESTROYED]' +
      '  [FARMERS: ' + _farmersFreed + '/5]' +
      '  [EL JEFE: ' + jefeStatus + ']' +
      '  |  SQUAD: ' + squadCount + '/3' +
      '<div id="dc-hp" style="color:' + (_playerHP > 40 ? '#88FF88' : '#FF4444') + ';margin-top:3px;">' +
      'HP: ' + Math.max(0, Math.round(_playerHP)) + '</div>';

    if (_arrestTimer > 0) {
      _hud.innerHTML += '<div style="color:#FFFF00;margin-top:3px;">ARRESTING: ' +
        Math.round(_arrestTimer * 33) + '%</div>';
    }
    if (_elJefeAtHelo && !_elJefeEscaped && !_heloDisabled && !_elJefeArrested) {
      _hud.innerHTML += '<div style="color:#FF0000;margin-top:3px;">⚠ EL JEFE AT HELO — ' +
        Math.ceil(_heloEscapeTimer) + 's TO ESCAPE — SHOOT FUEL TANK (RED)</div>';
    }

    /* Update glow overlay */
    var nearLab = false;
    for (var li = 0; li < _methLabs.length; li++) {
      if (!_methLabs[li].destroyed &&
          _dist2d(_playerPos, _methLabs[li].pos) < 12) {
        nearLab = true; break;
      }
    }
    _glowOverlay.style.boxShadow = nearLab
      ? 'inset 0 0 80px 40px rgba(68,255,68,0.35)'
      : 'inset 0 0 80px 40px rgba(68,255,68,0)';
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  SHOOTING                                                               */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _fireBullet() {
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(_pitch, _yaw, 0, 'YXZ'));
    var bMesh = _box(0.12, 0.12, 0.5, 0xFFFF88);
    bMesh.position.copy(_playerPos).add(_v3(0, 1.4, 0));
    _compoundGroup.add(bMesh);
    _playerBullets.push({ mesh: bMesh, vel: dir.multiplyScalar(_bulletSpeed), life: 2.5 });
  }

  function _fireEnemyBullet(fromPos, toPos) {
    var dir = new THREE.Vector3(
      toPos.x - fromPos.x,
      toPos.y - fromPos.y,
      toPos.z - fromPos.z
    );
    var len = dir.length();
    if (len < 0.01) return;
    dir.divideScalar(len);
    /* Small inaccuracy */
    dir.x += (Math.random() - 0.5) * 0.12;
    dir.y += (Math.random() - 0.5) * 0.06;
    dir.z += (Math.random() - 0.5) * 0.12;
    var bMesh = _box(0.1, 0.1, 0.4, 0xFF6600);
    bMesh.position.copy(fromPos);
    _compoundGroup.add(bMesh);
    _enemyBullets.push({ mesh: bMesh, vel: dir.multiplyScalar(18), life: 3 });
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  EXPLOSIONS                                                             */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _explodeParticle(pos, color) {
    var p = _sphere(0.25, color, 0.8);
    p.position.copy(pos);
    var vel = _v3(
      (Math.random() - 0.5) * 10,
      Math.random() * 8,
      (Math.random() - 0.5) * 10
    );
    _compoundGroup.add(p);
    return { mesh: p, vel: vel, life: 0.8 };
  }

  var _particles = [];

  function _explodeLab(labIndex) {
    var lab = _methLabs[labIndex];
    if (lab.destroyed) return;
    lab.destroyed = true;
    lab.mesh.material.color.setHex(0x333333);
    _labsDestroyed++;

    /* Chemical cloud */
    var cloud = _sphere(8, 0x44FF44, 0.35);
    cloud.position.copy(lab.pos);
    cloud.position.y = 4;
    _compoundGroup.add(cloud);
    lab.cloud = cloud;
    lab.cloudTimer = 10;
    _chemClouds.push({ mesh: cloud, timer: 10, pos: lab.pos.clone() });

    /* Particles */
    for (var i = 0; i < 12; i++) {
      _particles.push(_explodeParticle(lab.pos.clone(), 0xFF6600));
    }

    /* Workers flee */
    for (var wi = 0; wi < _workers.length; wi++) {
      var w = _workers[wi];
      if (_dist2d(w.pos, lab.pos) < 15) {
        w.fleeing = true;
        w.fleeDir = _v3(
          w.pos.x - lab.pos.x + (Math.random()-0.5)*2,
          0,
          w.pos.z - lab.pos.z + (Math.random()-0.5)*2
        );
        var flen = Math.sqrt(w.fleeDir.x*w.fleeDir.x + w.fleeDir.z*w.fleeDir.z);
        if (flen > 0) { w.fleeDir.x /= flen; w.fleeDir.z /= flen; }
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  WIN / LOSE CHECK                                                       */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _checkEndConditions() {
    if (_missionEnd) return;
    /* Win: El Jefe arrested + 8 shipments + 2 labs + 3 farmers */
    if (_elJefeArrested && _shipmentsSeized >= 8 && _labsDestroyed >= 2 && _farmersFreed >= 3) {
      _missionEnd = true;
      _missionWon = true;
      _showEndMsg('MISSION COMPLETE — El Jefe arrested. DEA victory!', '#00FF88');
      return;
    }
    /* Lose: El Jefe escaped by helo */
    if (_elJefeEscaped) {
      _missionEnd = true;
      _missionWon = false;
      _showEndMsg('MISSION FAILED — El Jefe escaped by helicopter.', '#FF2200');
      return;
    }
    /* Lose: all squad dead and player dead */
    if (_playerHP <= 0) {
      _missionEnd = true;
      _missionWon = false;
      _showEndMsg('AGENT DOWN — DEA squad eliminated.', '#FF2200');
      return;
    }
    /* Lose: squad entirely eliminated */
    var aliveCount = 0;
    for (var i = 0; i < _squadAgents.length; i++) {
      if (_squadAgents[i].alive) aliveCount++;
    }
    if (aliveCount === 0 && _playerHP <= 0) {
      _missionEnd = true;
      _missionWon = false;
      _showEndMsg('MISSION FAILED — All DEA agents KIA.', '#FF2200');
    }
  }

  function _showEndMsg(msg, color) {
    var div = document.createElement('div');
    div.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.88)',
      'color:' + color,
      'font:bold 22px monospace',
      'padding:22px 36px',
      'border-radius:8px',
      'z-index:99999',
      'text-align:center',
      'border:2px solid ' + color
    ].join(';');
    div.textContent = msg;
    document.body.appendChild(div);
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  INPUT                                                                  */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function _onKeyDown(e) {
    var k = e.key.toLowerCase();
    _keys[k] = true;

    if (k === 'd') _dPressTime = performance.now();
    if (k === 'c') _cPressTime = performance.now();
    if (k === 'd' || k === 'c') {
      if (Math.abs(_dPressTime - _cPressTime) < 400) {
        _activate();
      }
    }

    if (!_active) return;

    /* Squad commands */
    if (k === '1') _assignSquad(0, 'breach');
    if (k === '2') _assignSquad(1, 'secure');
    if (k === '3') _assignSquad(2, 'extract');

    /* F key state for C4 */
    if (k === 'f') _fKeyDown = true;

    /* E key actions */
    if (k === 'e') {
      /* Seize shipment */
      for (var shi = 0; shi < _shipments.length; shi++) {
        var s = _shipments[shi];
        if (!s.seized && _dist2d(_playerPos, s.pos) < 3) {
          s.seized = true;
          s.mesh.visible = false;
          s.stripeMesh.visible = false;
          _shipmentsSeized++;
          break;
        }
      }
      /* Free farmer */
      for (var fi = 0; fi < _farmers.length; fi++) {
        var f = _farmers[fi];
        if (!f.freed && _dist2d(_playerPos, f.pos) < 4) {
          f.freed = true;
          f.cage.visible = false;
          _farmersFreed++;
          break;
        }
      }
      /* Place C4 if F is held */
      if (_fKeyDown) {
        for (var li = 0; li < _methLabs.length; li++) {
          var lab = _methLabs[li];
          if (!lab.destroyed && _dist2d(_playerPos, lab.pos) < 8) {
            _placeC4(li);
            break;
          }
        }
      }
    }
  }

  function _onKeyUp(e) {
    var k = e.key.toLowerCase();
    _keys[k] = false;
    if (k === 'f') _fKeyDown = false;
  }

  function _onMouseMove(e) {
    if (!_active) return;
    _yaw   -= e.movementX * 0.002;
    _pitch -= e.movementY * 0.002;
    _pitch = Math.max(-0.9, Math.min(0.9, _pitch));
  }

  function _onMouseDown(e) {
    if (!_active) return;
    if (e.button === 0 && _fireTimer <= 0) {
      _fireBullet();
      _fireTimer = _fireRate;
    }
  }

  function _onContextMenu(e) { e.preventDefault(); }

  function _assignSquad(agentIndex, order) {
    if (agentIndex < _squadAgents.length && _squadAgents[agentIndex].alive) {
      _squadAgents[agentIndex].order = order;
    }
  }

  function _placeC4(labIndex) {
    var lab = _methLabs[labIndex];
    var c4 = _box(0.5, 0.3, 0.5, 0x44AA44);
    c4.position.copy(lab.pos);
    c4.position.y = 0.3;
    _compoundGroup.add(c4);
    _c4Charges.push({ mesh: c4, fuseTimer: 10, labIndex: labIndex, exploded: false });
  }

  function _activate() {
    if (_active) return;
    _active = true;
    if (_canvas) {
      _canvas.requestPointerLock();
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  INIT                                                                   */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    _buildCompound();
    _spawnEnemies();
    _spawnSquad();
    _spawnPlayer();
    _buildHUD();

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);
    document.addEventListener('mousemove', _onMouseMove);
    document.addEventListener('mousedown', _onMouseDown);
    document.addEventListener('contextmenu', _onContextMenu);
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  UPDATE — main loop (called every frame with delta seconds)            */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function update(delta) {
    if (!_active || _missionEnd) return;
    _gameTime += delta;

    _updatePlayer(delta);
    _updateCamera();
    _updateEnemies(delta);
    _updateSquad(delta);
    _updateBullets(delta);
    _updateC4(delta);
    _updateChemClouds(delta);
    _updateParticles(delta);
    _updateHelicopter(delta);
    _updateElJefe(delta);
    _updateArrest(delta);
    _updateHUD();
    _checkEndConditions();
  }

  /* ── Player movement ──────────────────────────────────────────────────── */
  function _updatePlayer(delta) {
    if (_playerHP <= 0) return;

    var speed = 8 * delta;
    var forward = new THREE.Vector3(-Math.sin(_yaw), 0, -Math.cos(_yaw));
    var right   = new THREE.Vector3(Math.cos(_yaw), 0, -Math.sin(_yaw));

    if (_keys['w'] || _keys['arrowup'])    { _playerPos.addScaledVector(forward, speed); }
    if (_keys['s'] || _keys['arrowdown'])  { _playerPos.addScaledVector(forward, -speed); }
    if (_keys['a'] || _keys['arrowleft'])  { _playerPos.addScaledVector(right, -speed); }
    if (_keys['d'] || _keys['arrowright']) { _playerPos.addScaledVector(right, speed); }

    /* Clamp to play area */
    _playerPos.x = Math.max(-58, Math.min(58, _playerPos.x));
    _playerPos.z = Math.max(-58, Math.min(58, _playerPos.z));
    _playerPos.y = 0.9;

    if (_fireTimer > 0) _fireTimer -= delta;

    /* Auto-fire on mousedown held */
    if (_keys['mousefire'] && _fireTimer <= 0) {
      _fireBullet();
      _fireTimer = _fireRate;
    }
  }

  /* ── Camera ───────────────────────────────────────────────────────────── */
  function _updateCamera() {
    if (!_camera || !_playerPos) return;
    _camera.position.set(_playerPos.x, _playerPos.y + 1.4, _playerPos.z);
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y = _yaw;
    _camera.rotation.x = _pitch;
  }

  /* ── Bullets ──────────────────────────────────────────────────────────── */
  function _updateBullets(delta) {
    var i, b, hit;

    /* Player bullets */
    for (i = _playerBullets.length - 1; i >= 0; i--) {
      b = _playerBullets[i];
      b.mesh.position.addScaledVector(b.vel, delta);
      b.life -= delta;
      hit = false;

      /* Hit sicarios */
      for (var si = 0; si < _sicarios.length; si++) {
        var s = _sicarios[si];
        if (!s.alive) continue;
        if (_dist3(b.mesh.position, s.mesh.position) < 1.2) {
          s.hp -= 25;
          if (s.hp <= 0) { _killSicario(si); }
          else { s.alerted = true; _alerted = true; }
          hit = true; break;
        }
      }
      if (!hit) {
        /* Hit snipers */
        for (var sni = 0; sni < _snipers.length; sni++) {
          var sn = _snipers[sni];
          if (!sn.alive) continue;
          if (_dist3(b.mesh.position, sn.mesh.position) < 1.4) {
            sn.hp -= 30;
            if (sn.hp <= 0) { _killSniper(sni); }
            hit = true; break;
          }
        }
      }
      if (!hit && _captainAlive) {
        if (_dist3(b.mesh.position, _captain.mesh.position) < 1.3) {
          _captainHP -= 25;
          if (_captainHP <= 0) { _killCaptain(); }
          else { _alerted = true; }
          hit = true;
        }
      }
      if (!hit && _elJefeHP > 0) {
        if (_dist3(b.mesh.position, _elJefe.mesh.position) < 1.5) {
          _elJefeHP -= 20;
          _alerted = true;
          if (_elJefeHP <= 0.2 * 350 && !_elJefePanicking) {
            _elJefePanicking = true;
          }
          if (_elJefeHP <= 0.2 * 350) {
            _elJefeStunned = (_elJefeHP <= 0);
            if (_elJefeHP <= 0) _elJefeHP = 1; /* Keep alive for arrest */
          }
          hit = true;
        }
      }
      /* Hit helo fuel tank */
      if (!hit && !_heloDisabled && _heloFuelTank) {
        if (_dist3(b.mesh.position, _heloFuelTank.getWorldPosition(new THREE.Vector3())) < 1.2) {
          _heloDisabled = true;
          _heloFuelTank.material.color.setHex(0x333333);
          hit = true;
        }
      }

      if (hit || b.life <= 0) {
        _compoundGroup.remove(b.mesh);
        _playerBullets.splice(i, 1);
      }
    }

    /* Enemy bullets */
    for (i = _enemyBullets.length - 1; i >= 0; i--) {
      b = _enemyBullets[i];
      b.mesh.position.addScaledVector(b.vel, delta);
      b.life -= delta;
      hit = false;

      if (_dist3(b.mesh.position, _playerPos) < 1.0) {
        _playerHP -= 8 + Math.random() * 12;
        hit = true;
      }
      /* Hit squad */
      if (!hit) {
        for (var ai = 0; ai < _squadAgents.length; ai++) {
          var ag = _squadAgents[ai];
          if (!ag.alive) continue;
          if (_dist3(b.mesh.position, ag.pos) < 1.0) {
            ag.hp -= 10 + Math.random() * 10;
            if (ag.hp <= 0) { _killAgent(ai); }
            hit = true; break;
          }
        }
      }

      if (hit || b.life <= 0) {
        _compoundGroup.remove(b.mesh);
        _enemyBullets.splice(i, 1);
      }
    }
  }

  /* ── Enemy AI ─────────────────────────────────────────────────────────── */
  function _updateEnemies(delta) {
    var i, s;

    /* Sicarios */
    for (i = 0; i < _sicarios.length; i++) {
      s = _sicarios[i];
      if (!s.alive) continue;

      var distToPlayer = _dist2d(s.mesh.position, _playerPos);
      var detRange = _alerted ? 40 : s.detRange;

      if (distToPlayer < detRange) {
        s.alerted = true;
        _alerted = true;
      }

      if (s.alerted) {
        /* Chase player */
        var dx = _playerPos.x - s.mesh.position.x;
        var dz = _playerPos.z - s.mesh.position.z;
        var d = Math.sqrt(dx*dx + dz*dz);
        if (d > 6) {
          var spd = 4.5 * delta;
          s.mesh.position.x += (dx / d) * spd;
          s.mesh.position.z += (dz / d) * spd;
          s.headMesh.position.x = s.mesh.position.x;
          s.headMesh.position.z = s.mesh.position.z;
        }
        /* Shoot */
        s.fireTimer -= delta;
        if (s.fireTimer <= 0 && distToPlayer < 30) {
          _fireEnemyBullet(
            s.mesh.position.clone().add(_v3(0, 1, 0)),
            _playerPos.clone().add(_v3(0, 1, 0))
          );
          s.fireTimer = 0.9 + Math.random() * 0.8;
        }
      } else {
        /* Patrol */
        s.patrolAngle += delta * 0.5;
        s.mesh.position.x = s.patrolCenter.x + Math.cos(s.patrolAngle) * s.patrolRadius;
        s.mesh.position.z = s.patrolCenter.z + Math.sin(s.patrolAngle) * s.patrolRadius;
        s.headMesh.position.x = s.mesh.position.x;
        s.headMesh.position.z = s.mesh.position.z;
      }
    }

    /* Snipers — stationary, long range */
    for (i = 0; i < _snipers.length; i++) {
      var sn = _snipers[i];
      if (!sn.alive) continue;
      sn.fireTimer -= delta;
      var distSniper = _dist2d(sn.pos, _playerPos);
      if ((distSniper < 50 || _alerted) && sn.fireTimer <= 0) {
        _fireEnemyBullet(
          sn.pos.clone().add(_v3(0, 1, 0)),
          _playerPos.clone().add(_v3(0, 1.4, 0))
        );
        sn.fireTimer = 2.5 + Math.random() * 1.5;
      }
    }

    /* Captain */
    if (_captainAlive && _captain) {
      var distCap = _dist2d(_captain.mesh.position, _playerPos);
      if (distCap < 35 || _alerted) {
        /* Rally nearby sicarios */
        for (i = 0; i < _sicarios.length; i++) {
          if (_sicarios[i].alive && _dist2d(_sicarios[i].mesh.position, _captain.mesh.position) < 15) {
            _sicarios[i].alerted = true;
          }
        }
        /* Move toward player */
        var cdx = _playerPos.x - _captain.mesh.position.x;
        var cdz = _playerPos.z - _captain.mesh.position.z;
        var cd  = Math.sqrt(cdx*cdx + cdz*cdz);
        if (cd > 8) {
          _captain.mesh.position.x += (cdx / cd) * 5 * delta;
          _captain.mesh.position.z += (cdz / cd) * 5 * delta;
          _captain.headMesh.position.x = _captain.mesh.position.x;
          _captain.headMesh.position.z = _captain.mesh.position.z;
        }
        _captainFireTimer -= delta;
        if (_captainFireTimer <= 0 && distCap < 25) {
          _fireEnemyBullet(
            _captain.mesh.position.clone().add(_v3(0, 1, 0)),
            _playerPos.clone().add(_v3(0, 1, 0))
          );
          _captainFireTimer = 0.6 + Math.random() * 0.6;
        }
      }
    }

    /* Chemical cloud damage */
    for (var ci = 0; ci < _chemClouds.length; ci++) {
      var cloud = _chemClouds[ci];
      if (_dist3(_playerPos, cloud.pos) < 8 && cloud.timer > 0) {
        _playerHP -= 20 * delta;
      }
    }
  }

  /* ── El Jefe AI ───────────────────────────────────────────────────────── */
  function _updateElJefe(delta) {
    if (!_elJefe || _elJefeArrested) return;

    var jpos = _elJefe.mesh.position;

    if (_elJefePanicking && !_elJefeStunned && !_elJefeEscaped) {
      /* Run for helicopter pad */
      var dx = _heloPadPos.x - jpos.x;
      var dz = _heloPadPos.z - jpos.z;
      var d  = Math.sqrt(dx*dx + dz*dz);
      if (d > 3) {
        var spd = 6 * delta;
        jpos.x += (dx / d) * spd;
        jpos.z += (dz / d) * spd;
        _elJefe.headMesh.position.x = jpos.x;
        _elJefe.headMesh.position.z = jpos.z;
        _elJefe.chainMesh.position.x = jpos.x;
        _elJefe.chainMesh.position.z = jpos.z - 0.4;
      } else {
        /* At helipad */
        if (!_elJefeAtHelo) {
          _elJefeAtHelo = true;
          _heloEscapeTimer = 30;
        }
      }
      /* Also shoot at player */
      _elJefeFireTimer -= delta;
      var distJefe = _dist2d(jpos, _playerPos);
      if (_elJefeFireTimer <= 0 && distJefe < 25) {
        _fireEnemyBullet(jpos.clone().add(_v3(0, 1.5, 0)), _playerPos.clone().add(_v3(0, 1, 0)));
        _fireEnemyBullet(jpos.clone().add(_v3(0.3, 1.5, 0)), _playerPos.clone().add(_v3(0, 1, 0)));
        _elJefeFireTimer = 0.5 + Math.random() * 0.4;
      }
    } else if (!_elJefePanicking) {
      /* Normal behavior: wander around house area */
      _elJefeFireTimer -= delta;
      var distJefeN = _dist2d(jpos, _playerPos);
      if (distJefeN < 20 || _alerted) {
        _fireEnemyBullet(jpos.clone().add(_v3(0, 1.5, 0)), _playerPos.clone().add(_v3(0, 1, 0)));
        _fireEnemyBullet(jpos.clone().add(_v3(-0.3, 1.5, 0)), _playerPos.clone().add(_v3(0, 1, 0)));
        _elJefeFireTimer = 0.7 + Math.random() * 0.5;
      }
    }

    /* Helo escape countdown */
    if (_elJefeAtHelo && !_heloDisabled && !_elJefeArrested) {
      _heloEscapeTimer -= delta;
      if (_heloEscapeTimer <= 0) {
        _elJefeEscaped = true;
      }
    }
  }

  /* ── Arrest mechanic ──────────────────────────────────────────────────── */
  function _updateArrest(delta) {
    if (_elJefeArrested || !_elJefe) return;
    var jpos = _elJefe.mesh.position;
    var distJefe = _dist2d(_playerPos, jpos);
    /* Must be stunned (below 20% HP) to arrest */
    if (_elJefeHP <= 70 && distJefe < 3 && _keys['e']) {
      _arrestTimer += delta;
      _arresting = true;
      if (_arrestTimer >= 3) {
        _elJefeArrested = true;
        _arrestTimer = 0;
        /* Visual cuff indicator */
        _elJefe.mesh.material.color.setHex(0x0000FF);
        _elJefe.headMesh.material.color.setHex(0x0000AA);
      }
    } else {
      _arrestTimer = Math.max(0, _arrestTimer - delta * 2);
      _arresting = false;
    }
  }

  /* ── Squad AI ─────────────────────────────────────────────────────────── */
  function _updateSquad(delta) {
    for (var i = 0; i < _squadAgents.length; i++) {
      var ag = _squadAgents[i];
      if (!ag.alive) continue;

      var moved = false;

      if (ag.order === 'breach') {
        /* Move to nearest building and shoot nearby enemies */
        var target = _v3(-10, 0.9, -10); /* Main house approach */
        var dx = target.x - ag.pos.x;
        var dz = target.z - ag.pos.z;
        var d  = Math.sqrt(dx*dx + dz*dz);
        if (d > 3) {
          ag.pos.x += (dx / d) * 5 * delta;
          ag.pos.z += (dz / d) * 5 * delta;
          moved = true;
        }
        /* Shoot nearest sicario */
        ag.fireTimer -= delta;
        if (ag.fireTimer <= 0) {
          var closest = _findClosestEnemy(ag.pos);
          if (closest && _dist3(closest, ag.pos) < 25) {
            _fireAgentBullet(ag.pos.clone().add(_v3(0, 1.2, 0)), closest);
            ag.fireTimer = 0.8 + Math.random() * 0.5;
          }
        }

      } else if (ag.order === 'secure') {
        /* Move to nearest unseized shipment */
        var nearShip = _findNearestShipment(ag.pos);
        if (nearShip) {
          var sdx = nearShip.x - ag.pos.x;
          var sdz = nearShip.z - ag.pos.z;
          var sd  = Math.sqrt(sdx*sdx + sdz*sdz);
          if (sd > 2) {
            ag.pos.x += (sdx / sd) * 5 * delta;
            ag.pos.z += (sdz / sd) * 5 * delta;
            moved = true;
          }
        }
        /* Also defend */
        ag.fireTimer -= delta;
        if (ag.fireTimer <= 0) {
          var closestS = _findClosestEnemy(ag.pos);
          if (closestS && _dist3(closestS, ag.pos) < 20) {
            _fireAgentBullet(ag.pos.clone().add(_v3(0, 1.2, 0)), closestS);
            ag.fireTimer = 1.0 + Math.random() * 0.5;
          }
        }

      } else if (ag.order === 'extract') {
        /* Move to nearest freed farmer and escort them toward LZ */
        var farmer = _findFreedFarmer(ag.pos);
        if (farmer) {
          var fdx = farmer.pos.x - ag.pos.x;
          var fdz = farmer.pos.z - ag.pos.z;
          var fd  = Math.sqrt(fdx*fdx + fdz*fdz);
          if (fd > 2) {
            ag.pos.x += (fdx / fd) * 5 * delta;
            ag.pos.z += (fdz / fd) * 5 * delta;
            moved = true;
          }
          if (!farmer.escorting && fd < 3) {
            farmer.escorting = true;
          }
          if (farmer.escorting) {
            /* Move farmer toward LZ (south edge) */
            var lzx = 0, lzz = 46;
            var lfx = lzx - farmer.pos.x;
            var lfz = lzz - farmer.pos.z;
            var lfd = Math.sqrt(lfx*lfx + lfz*lfz);
            if (lfd > 2) {
              farmer.pos.x += (lfx / lfd) * 4 * delta;
              farmer.pos.z += (lfz / lfd) * 4 * delta;
              farmer.mesh.position.x = farmer.pos.x;
              farmer.mesh.position.z = farmer.pos.z;
              farmer.headMesh.position.x = farmer.pos.x;
              farmer.headMesh.position.z = farmer.pos.z;
            }
          }
        }

      } else {
        /* Standby: follow player loosely */
        var pdx = _playerPos.x - ag.pos.x + (i - 1) * 2;
        var pdz = _playerPos.z - ag.pos.z + 3;
        var pd  = Math.sqrt(pdx*pdx + pdz*pdz);
        if (pd > 5) {
          ag.pos.x += (pdx / pd) * 5 * delta;
          ag.pos.z += (pdz / pd) * 5 * delta;
          moved = true;
        }
        ag.fireTimer -= delta;
        if (ag.fireTimer <= 0) {
          var closestSB = _findClosestEnemy(ag.pos);
          if (closestSB && _dist3(closestSB, ag.pos) < 22) {
            _fireAgentBullet(ag.pos.clone().add(_v3(0, 1.2, 0)), closestSB);
            ag.fireTimer = 0.9 + Math.random() * 0.6;
          }
        }
      }

      /* Update mesh position */
      if (moved || true) {
        ag.mesh.position.copy(ag.pos);
        ag.headMesh.position.set(ag.pos.x, ag.pos.y + 1.15, ag.pos.z);
        ag.vestMesh.position.set(ag.pos.x, ag.pos.y + 0.2, ag.pos.z);
      }
    }
  }

  function _findClosestEnemy(pos) {
    var best = null;
    var bestDist = Infinity;
    var i;
    for (i = 0; i < _sicarios.length; i++) {
      if (!_sicarios[i].alive) continue;
      var d = _dist3(pos, _sicarios[i].mesh.position);
      if (d < bestDist) { bestDist = d; best = _sicarios[i].mesh.position.clone(); }
    }
    if (_captainAlive) {
      var dc = _dist3(pos, _captain.mesh.position);
      if (dc < bestDist) { bestDist = dc; best = _captain.mesh.position.clone(); }
    }
    return best;
  }

  function _findNearestShipment(pos) {
    var best = null;
    var bestDist = Infinity;
    for (var i = 0; i < _shipments.length; i++) {
      if (_shipments[i].seized) continue;
      var d = _dist2d(pos, _shipments[i].pos);
      if (d < bestDist) { bestDist = d; best = _shipments[i].pos; }
    }
    return best;
  }

  function _findFreedFarmer(pos) {
    var best = null;
    var bestDist = Infinity;
    for (var i = 0; i < _farmers.length; i++) {
      var f = _farmers[i];
      if (!f.freed) continue;
      var d = _dist2d(pos, f.pos);
      if (d < bestDist) { bestDist = d; best = f; }
    }
    return best;
  }

  function _fireAgentBullet(fromPos, toPos) {
    var dir = new THREE.Vector3(
      toPos.x - fromPos.x,
      toPos.y - fromPos.y,
      toPos.z - fromPos.z
    );
    var len = dir.length();
    if (len < 0.01) return;
    dir.divideScalar(len);
    var bMesh = _box(0.1, 0.1, 0.4, 0x88CCFF);
    bMesh.position.copy(fromPos);
    _compoundGroup.add(bMesh);

    var bObj = { mesh: bMesh, vel: dir.multiplyScalar(22), life: 2 };
    /* Damage enemies inline */
    var self = bObj;
    for (var si = 0; si < _sicarios.length; si++) {
      var s = _sicarios[si];
      if (!s.alive) continue;
      if (_dist3(fromPos, s.mesh.position) < 20) {
        /* Will be hit via bullet update; just add it */
      }
    }
    _playerBullets.push(bObj); /* Reuse player bullets array for collision */
  }

  /* ── C4 update ────────────────────────────────────────────────────────── */
  function _updateC4(delta) {
    for (var i = _c4Charges.length - 1; i >= 0; i--) {
      var c = _c4Charges[i];
      if (c.exploded) continue;
      c.fuseTimer -= delta;
      /* Blink the C4 */
      if (Math.floor(c.fuseTimer * 4) % 2 === 0) {
        c.mesh.material.color.setHex(0xFF4400);
      } else {
        c.mesh.material.color.setHex(0x44AA44);
      }
      if (c.fuseTimer <= 0) {
        c.exploded = true;
        _compoundGroup.remove(c.mesh);
        _explodeLab(c.labIndex);
      }
    }
  }

  /* ── Chem clouds ──────────────────────────────────────────────────────── */
  function _updateChemClouds(delta) {
    for (var i = _chemClouds.length - 1; i >= 0; i--) {
      var cloud = _chemClouds[i];
      cloud.timer -= delta;
      if (cloud.timer <= 0) {
        _compoundGroup.remove(cloud.mesh);
        _chemClouds.splice(i, 1);
      } else {
        cloud.mesh.material.opacity = Math.min(0.4, (cloud.timer / 10) * 0.4);
        /* Slowly expand */
        var scale = 1 + (1 - cloud.timer / 10) * 0.5;
        cloud.mesh.scale.set(scale, scale, scale);
      }
    }

    /* Workers flee */
    for (var wi = 0; wi < _workers.length; wi++) {
      var w = _workers[wi];
      if (w.fleeing) {
        w.pos.x += w.fleeDir.x * 6 * delta;
        w.pos.z += w.fleeDir.z * 6 * delta;
        w.mesh.position.x = w.pos.x;
        w.mesh.position.z = w.pos.z;
      }
    }
  }

  /* ── Particles ────────────────────────────────────────────────────────── */
  function _updateParticles(delta) {
    for (var i = _particles.length - 1; i >= 0; i--) {
      var p = _particles[i];
      p.mesh.position.addScaledVector(p.vel, delta);
      p.vel.y -= 12 * delta; /* Gravity */
      p.life -= delta;
      p.mesh.material.opacity = p.life / 0.8;
      if (p.life <= 0) {
        _compoundGroup.remove(p.mesh);
        _particles.splice(i, 1);
      }
    }
  }

  /* ── Helicopter rotor spin ────────────────────────────────────────────── */
  function _updateHelicopter(delta) {
    if (!_heloGroup) return;
    if (!_heloDisabled) {
      var spinSpeed = _elJefeAtHelo ? 8 : 2;
      if (_heloRotorTop) _heloRotorTop.rotation.y += spinSpeed * delta;
      if (_heloRotorTail) _heloRotorTail.rotation.x += spinSpeed * 3 * delta;
    }
  }

  /* ── Kill helpers ─────────────────────────────────────────────────────── */
  function _killSicario(index) {
    var s = _sicarios[index];
    s.alive = false;
    s.mesh.material.color.setHex(0x221100);
    s.mesh.position.y = 0.15;
    s.headMesh.visible = false;
  }

  function _killSniper(index) {
    var sn = _snipers[index];
    sn.alive = false;
    sn.mesh.material.color.setHex(0x221100);
    sn.headMesh.visible = false;
  }

  function _killCaptain() {
    _captainAlive = false;
    _captain.mesh.material.color.setHex(0x110000);
    _captain.mesh.position.y = 0.2;
    _captain.headMesh.visible = false;
  }

  function _killAgent(index) {
    var ag = _squadAgents[index];
    ag.alive = false;
    ag.mesh.material.color.setHex(0x111122);
    ag.headMesh.visible = false;
    ag.vestMesh.visible = false;
    _squadAlive = Math.max(0, _squadAlive - 1);
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  RESET                                                                  */
  /* ═══════════════════════════════════════════════════════════════════════ */

  function reset() {
    /* Remove compound group */
    if (_compoundGroup && _scene) {
      _scene.remove(_compoundGroup);
    }
    /* Remove lights */
    var toRemove = [];
    if (_scene) {
      _scene.traverse(function(obj) {
        if (obj.isLight) toRemove.push(obj);
      });
      for (var i = 0; i < toRemove.length; i++) {
        _scene.remove(toRemove[i]);
      }
    }

    /* Remove HUD */
    if (_hud && _hud.parentNode) _hud.parentNode.removeChild(_hud);
    if (_glowOverlay && _glowOverlay.parentNode) _glowOverlay.parentNode.removeChild(_glowOverlay);

    /* Remove event listeners */
    document.removeEventListener('keydown', _onKeyDown);
    document.removeEventListener('keyup',   _onKeyUp);
    document.removeEventListener('mousemove', _onMouseMove);
    document.removeEventListener('mousedown', _onMouseDown);
    document.removeEventListener('contextmenu', _onContextMenu);

    /* Reset all state */
    _active          = false;
    _missionEnd      = false;
    _missionWon      = false;
    _alerted         = false;
    _shipmentsSeized = 0;
    _labsDestroyed   = 0;
    _farmersFreed    = 0;
    _elJefeArrested  = false;
    _elJefeEscaped   = false;
    _elJefePanicking = false;
    _elJefeStunned   = false;
    _elJefeAtHelo    = false;
    _elJefeHP        = 350;
    _heloEscapeTimer = 30;
    _heloDisabled    = false;
    _captainAlive    = true;
    _captainHP       = 200;
    _playerHP        = 100;
    _arrestTimer     = 0;
    _arresting       = false;
    _gameTime        = 0;
    _squadAlive      = 3;
    _sicarios        = [];
    _snipers         = [];
    _squadAgents     = [];
    _shipments       = [];
    _methLabs        = [];
    _farmers         = [];
    _workers         = [];
    _chemClouds      = [];
    _particles       = [];
    _playerBullets   = [];
    _enemyBullets    = [];
    _c4Charges       = [];
    _keys            = {};
    _compoundGroup   = null;
    _hud             = null;
    _glowOverlay     = null;
    _heloGroup       = null;
    _heloRotorTop    = null;
    _heloRotorTail   = null;
    _heloFuelTank    = null;
    _captain         = null;
    _elJefe          = null;
    _player          = null;
    _playerPos       = null;
  }

  /* ── Public API ─────────────────────────────────────────────────────────*/
  return { init: init, update: update, reset: reset };

}());
