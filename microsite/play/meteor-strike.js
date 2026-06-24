/* ───────────────────────────────────────────────────────────────────────────
   meteor-strike.js — Meteor Strike Mini-Game
   API: window.MeteorStrike = { init, update, reset }
   Activation: M + S simultaneous keypress (both keys within 400ms)

   Gameplay:
     CITY DEFENSE — 5-minute countdown, man gun emplacements, evacuate civilians
     METEORS — small / medium / large descend; large can collapse buildings
     MOTHER ASTEROID — appears at 3-min mark at Y=80, descends; destroy before Y=20
     WIN — destroy mother asteroid AND survive 5 minutes
     LOSE — mother asteroid reaches Y=20 OR time hits 0

   Controls:
     M + S     → activate meteor strike
     WASD      → move player
     Mouse     → aim (when manning gun) / look
     Left-click → fire gun (when at emplacement)
     E         → man/leave gun emplacement | open shelter | grab/release civilian
   ─────────────────────────────────────────────────────────────────────────── */

window.MeteorStrike = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;
  var _renderer = null;

  /* ── Game state ────────────────────────────────────────────────────────── */
  var _active          = false;
  var _victory         = false;
  var _defeat          = false;
  var _score           = 0;
  var _timeLeft        = 300; // 5 minutes in seconds
  var _lastTime        = 0;
  var _civsSaved       = 0;
  var _motherDestroyed = false;
  var _gameOver        = false;

  /* ── Key-combo tracking: M+S within 400ms ──────────────────────────────── */
  var _msPressTime = { M: 0, S: 0 };
  var MS_WINDOW    = 400;

  /* ── Input state ───────────────────────────────────────────────────────── */
  var _keys      = {};
  var _mouseX    = 0;
  var _mouseY    = 0;
  var _mouseDown = false;
  var _yaw       = 0;
  var _pitch     = 0;

  /* ── Player ────────────────────────────────────────────────────────────── */
  var _playerMesh   = null;
  var _playerPos    = { x: 0, y: 1.0, z: 10 };
  var _playerSpeed  = 8;
  var _playerHP     = 100;

  /* ── Gun Emplacements ──────────────────────────────────────────────────── */
  var _gunEmplacements = [];
  // Each: { mesh, baseMesh, pos, manned, shells, overheat, overheatTimer, cooldownTimer,
  //         barrelLight, autoTarget, turretPivot, reticleMesh, reticleLines }

  var _manning       = null; // currently manned emplacement
  var _gunYaw        = 0;
  var _gunPitch      = 0;
  var GUN_MAX_SHELLS = 50;
  var GUN_OVERHEAT_T = 10; // seconds of continuous fire before overheat
  var GUN_COOLDOWN_T = 5;  // cooldown duration
  var _fireTimer     = 0;
  var FIRE_RATE      = 0.15; // seconds between shots

  /* ── Resupply crates ──────────────────────────────────────────────────── */
  var _supplyCrates  = [];
  var _supplyTimer   = 0;
  var SUPPLY_INTERVAL = 90;

  /* ── Shelters ─────────────────────────────────────────────────────────── */
  var _shelters = [];
  // Each: { mesh, pos, open }

  /* ── Civilians ────────────────────────────────────────────────────────── */
  var _civilians = [];
  // Each: { mesh, pos, vel, alive, escorted, evacuated, hideTimer, hideActive, panicTimer }
  var _escortedCiv = null; // civilian currently following player

  /* ── Meteors ──────────────────────────────────────────────────────────── */
  var _meteors       = [];
  // Each: { mesh, type, hp, maxHp, pos, vel, alive, radius, dmgRadius, dmgAmt }
  var _meteorCount   = 0;
  var _smallTimer    = 0;
  var _medTimer      = 0;
  var _largeTimer    = 0;
  var SMALL_INTERVAL = 3;   // seconds between small meteors
  var MED_INTERVAL   = 20;
  var LARGE_INTERVAL = 60;

  /* ── Mother Asteroid ──────────────────────────────────────────────────── */
  var _mother      = null;
  // { mesh, hp, maxHp, alive, pos, splitTimer, emissiveLight }
  var _motherSpawned    = false;
  var MOTHER_SPAWN_TIME = 180; // at 3 min mark (300 - 180 = 120s remaining)
  var MOTHER_HP         = 600;
  var MOTHER_SPLIT_INT  = 30; // every 30s splits off 3 medium meteors

  /* ── Buildings ────────────────────────────────────────────────────────── */
  var _buildings = [];
  // Each: { mesh, pos, collapsed, fireLights }

  /* ── Craters ──────────────────────────────────────────────────────────── */
  var _craters   = [];

  /* ── Impact fires ─────────────────────────────────────────────────────── */
  var _fireLights = []; // { light, timer }

  /* ── Projectiles (from gun) ───────────────────────────────────────────── */
  var _shells = []; // { mesh, pos, vel, alive }

  /* ── Reticle / Aim LineSegments ───────────────────────────────────────── */
  var _reticleMesh = null;

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  var _hud         = null;
  var _alertEl     = null;
  var _alertTimer  = 0;
  var _winEl       = null;
  var _loseEl      = null;

  /* ── City props (streets, ground) ─────────────────────────────────────── */
  var _cityObjects = [];

  /* ════════════════════════════════════════════════════════════════════════
     GEOMETRY HELPERS
  ════════════════════════════════════════════════════════════════════════ */

  function makeMesh(geo, color, emissive, emissiveIntensity) {
    var mat;
    if (emissive !== undefined) {
      mat = new THREE.MeshLambertMaterial({
        color: color,
        emissive: emissive,
        emissiveIntensity: emissiveIntensity !== undefined ? emissiveIntensity : 0.5
      });
    } else {
      mat = new THREE.MeshLambertMaterial({ color: color });
    }
    return new THREE.Mesh(geo, mat);
  }

  function makeLineSegments(points, color) {
    var geo = new THREE.BufferGeometry();
    var verts = [];
    var i;
    for (i = 0; i < points.length; i++) {
      verts.push(points[i].x, points[i].y, points[i].z);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    var mat = new THREE.LineBasicMaterial({ color: color });
    return new THREE.LineSegments(geo, mat);
  }

  function dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function dist2(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  /* ════════════════════════════════════════════════════════════════════════
     RETICLE: LineSegments crosshair aimed at nearest meteor
  ════════════════════════════════════════════════════════════════════════ */

  function buildReticle() {
    var pts = [
      { x: -1, y: 0, z: 0 }, { x: -0.3, y: 0, z: 0 },
      { x:  0.3, y: 0, z: 0 }, { x: 1, y: 0, z: 0 },
      { x: 0, y: -1, z: 0 }, { x: 0, y: -0.3, z: 0 },
      { x: 0, y:  0.3, z: 0 }, { x: 0, y: 1, z: 0 }
    ];
    var ls = makeLineSegments(pts, 0xFF4400);
    ls.visible = false;
    _scene.add(ls);
    return ls;
  }

  /* ════════════════════════════════════════════════════════════════════════
     CITY ENVIRONMENT
  ════════════════════════════════════════════════════════════════════════ */

  function buildCity() {
    var i, geo, mesh, light;

    /* Ground / street plane */
    geo  = new THREE.PlaneGeometry(200, 200);
    mesh = makeMesh(geo, 0x444444);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, 0, 0);
    _scene.add(mesh);
    _cityObjects.push(mesh);

    /* Street markings — horizontal */
    var streetW = [
      [-30, 0], [0, 0], [30, 0],
      [-30, -30], [0, -30], [30, -30],
      [-30, 30],  [0, 30],  [30, 30]
    ];
    for (i = 0; i < streetW.length; i++) {
      geo  = new THREE.PlaneGeometry(60, 1);
      mesh = makeMesh(geo, 0x555555);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(streetW[i][0], 0.01, streetW[i][1]);
      _scene.add(mesh);
      _cityObjects.push(mesh);
    }

    /* City buildings — 10 buildings */
    var bldgDefs = [
      { x: -20, z: -20, w: 6, d: 6, h: 12 },
      { x:  18, z: -22, w: 5, d: 7, h: 10 },
      { x: -22, z:  18, w: 7, d: 5, h: 14 },
      { x:  20, z:  20, w: 6, d: 6, h: 11 },
      { x:   0, z: -35, w: 8, d: 6, h: 16 },
      { x: -36, z:   0, w: 5, d: 8, h: 9  },
      { x:  36, z:   0, w: 6, d: 5, h: 13 },
      { x:   0, z:  38, w: 7, d: 7, h: 15 },
      { x: -38, z: -35, w: 5, d: 5, h: 8  },
      { x:  38, z:  35, w: 6, d: 6, h: 10 }
    ];

    for (i = 0; i < bldgDefs.length; i++) {
      var bd = bldgDefs[i];
      geo  = new THREE.BoxGeometry(bd.w, bd.h, bd.d);
      mesh = makeMesh(geo, 0x555566);
      mesh.position.set(bd.x, bd.h * 0.5, bd.z);
      _scene.add(mesh);
      _buildings.push({
        mesh: mesh,
        pos: { x: bd.x, y: bd.h * 0.5, z: bd.z },
        w: bd.w, d: bd.d, h: bd.h,
        collapsed: false,
        fireLights: []
      });
      _cityObjects.push(mesh);
    }

    /* Ambient lighting */
    var ambLight = new THREE.AmbientLight(0x334455, 0.6);
    _scene.add(ambLight);
    _cityObjects.push(ambLight);

    var dirLight = new THREE.DirectionalLight(0xFFDDCC, 0.8);
    dirLight.position.set(20, 40, 10);
    _scene.add(dirLight);
    _cityObjects.push(dirLight);

    /* Background sky color hint via fog */
    _scene.fog = new THREE.Fog(0x111122, 80, 180);
  }

  /* ════════════════════════════════════════════════════════════════════════
     GUN EMPLACEMENTS — 3 positions
  ════════════════════════════════════════════════════════════════════════ */

  function buildGunEmplacements() {
    var positions = [
      { x: -10, z: 5  },
      { x:  10, z: 5  },
      { x:   0, z: -10 }
    ];
    var i, geo, mesh, baseMesh, pivotMesh, barrelLight, reticleLines;

    for (i = 0; i < positions.length; i++) {
      var p = positions[i];

      /* Base platform */
      geo      = new THREE.BoxGeometry(3, 0.8, 3);
      baseMesh = makeMesh(geo, 0x334455);
      baseMesh.position.set(p.x, 0.4, p.z);
      _scene.add(baseMesh);

      /* Turret pivot (contains barrel) */
      geo       = new THREE.CylinderGeometry(0.6, 0.8, 1.2, 8);
      pivotMesh = makeMesh(geo, 0x445566);
      pivotMesh.position.set(p.x, 1.4, p.z);
      _scene.add(pivotMesh);

      /* Barrel */
      geo  = new THREE.CylinderGeometry(0.15, 0.15, 2.5, 6);
      mesh = makeMesh(geo, 0x334455);
      mesh.rotation.x = Math.PI / 2;
      mesh.position.set(p.x, 1.6, p.z - 1.25);
      _scene.add(mesh);

      /* Overheat light (starts invisible) */
      barrelLight = new THREE.PointLight(0xFF4400, 2, 5);
      barrelLight.position.set(p.x, 1.8, p.z - 2);
      barrelLight.visible = false;
      _scene.add(barrelLight);

      /* Reticle LineSegments for this emplacement */
      var rpts = [
        { x: -2, y: 0, z: 0 }, { x: -0.5, y: 0, z: 0 },
        { x:  0.5, y: 0, z: 0 }, { x: 2, y: 0, z: 0 },
        { x: 0, y: -2, z: 0 }, { x: 0, y: -0.5, z: 0 },
        { x: 0, y:  0.5, z: 0 }, { x: 0, y: 2, z: 0 }
      ];
      reticleLines = makeLineSegments(rpts, 0xFF4400);
      reticleLines.visible = false;
      _scene.add(reticleLines);

      _gunEmplacements.push({
        pos:          { x: p.x, y: 1.6, z: p.z },
        baseMesh:     baseMesh,
        turretMesh:   pivotMesh,
        barrelMesh:   mesh,
        barrelLight:  barrelLight,
        reticleLines: reticleLines,
        manned:       false,
        shells:       GUN_MAX_SHELLS,
        overheat:     false,
        overheatTimer: 0,
        cooldownTimer: 0,
        autoTarget:   null,
        yaw:          0,
        pitch:        0
      });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     SHELTER ENTRANCES — 4 manholes
  ════════════════════════════════════════════════════════════════════════ */

  function buildShelters() {
    var positions = [
      { x: -5,  z:  5  },
      { x:  5,  z:  5  },
      { x: -5,  z: -5  },
      { x:  5,  z: -5  }
    ];
    var i, geo, mesh, lid;

    for (i = 0; i < positions.length; i++) {
      var p = positions[i];

      /* Manhole ring */
      geo  = new THREE.CylinderGeometry(1.2, 1.2, 0.2, 12);
      mesh = makeMesh(geo, 0x334433);
      mesh.position.set(p.x, 0.1, p.z);
      _scene.add(mesh);

      /* Manhole cover (closed by default) */
      geo = new THREE.CylinderGeometry(1.0, 1.0, 0.1, 12);
      lid = makeMesh(geo, 0x445544);
      lid.position.set(p.x, 0.25, p.z);
      _scene.add(lid);

      _shelters.push({
        pos:  { x: p.x, y: 0, z: p.z },
        mesh: mesh,
        lid:  lid,
        open: false
      });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     CIVILIANS — 20 wandering boxes
  ════════════════════════════════════════════════════════════════════════ */

  function buildCivilians() {
    var i, geo, mesh;
    var spawnPts = [
      [-5, -15], [5, -15], [-12, -8], [12, -8], [0, -20],
      [-8, 15],  [8, 15],  [-15, 10], [15, 10], [0, 20],
      [-25, -5], [25, -5], [-20, 20], [20, -20],[3, 8],
      [-3, -8],  [10, 3],  [-10, -3], [0, 12],  [0, -12]
    ];

    for (i = 0; i < 20; i++) {
      var sp = spawnPts[i] || [Math.random() * 30 - 15, Math.random() * 30 - 15];
      geo  = new THREE.BoxGeometry(0.5, 1.5, 0.5);
      mesh = makeMesh(geo, 0xFFDDCC);
      mesh.position.set(sp[0], 0.75, sp[1]);
      _scene.add(mesh);

      _civilians.push({
        mesh:       mesh,
        pos:        { x: sp[0], y: 0.75, z: sp[1] },
        vel:        { x: (Math.random() - 0.5) * 4, z: (Math.random() - 0.5) * 4 },
        alive:      true,
        escorted:   false,
        evacuated:  false,
        hideTimer:  Math.random() * 8,
        hideActive: false,
        panicTimer: 1 + Math.random() * 3
      });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER MESH
  ════════════════════════════════════════════════════════════════════════ */

  function buildPlayer() {
    var geo = new THREE.BoxGeometry(0.6, 1.8, 0.6);
    _playerMesh = makeMesh(geo, 0x336699);
    _playerMesh.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
    _scene.add(_playerMesh);
  }

  /* ════════════════════════════════════════════════════════════════════════
     METEOR SPAWNING
  ════════════════════════════════════════════════════════════════════════ */

  function spawnMeteor(type) {
    var geo, color, hp, radius, dmgRadius, dmgAmt, speed;
    if (type === 'small') {
      geo      = new THREE.SphereGeometry(0.5, 8, 8);
      color    = 0x884422;
      hp       = 3;
      radius   = 0.5;
      dmgRadius = 3;
      dmgAmt   = 40;
      speed    = 8 + Math.random() * 4;
    } else if (type === 'medium') {
      geo      = new THREE.SphereGeometry(1.5, 8, 8);
      color    = 0x664411;
      hp       = 8;
      radius   = 1.5;
      dmgRadius = 6;
      dmgAmt   = 80;
      speed    = 5 + Math.random() * 3;
    } else { /* large */
      geo      = new THREE.SphereGeometry(3, 10, 10);
      color    = 0x442200;
      hp       = 15;
      radius   = 3;
      dmgRadius = 10;
      dmgAmt   = 150;
      speed    = 3 + Math.random() * 2;
    }

    var mesh  = makeMesh(geo, color);
    var spawnX = (Math.random() - 0.5) * 80;
    var spawnZ = (Math.random() - 0.5) * 80;
    var targetX = (Math.random() - 0.5) * 60;
    var targetZ = (Math.random() - 0.5) * 60;
    var spawnY = 70 + Math.random() * 30;

    var dx = targetX - spawnX;
    var dy = -spawnY;
    var dz = targetZ - spawnZ;
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz);

    mesh.position.set(spawnX, spawnY, spawnZ);
    _scene.add(mesh);
    _meteorCount++;

    _meteors.push({
      mesh:      mesh,
      type:      type,
      hp:        hp,
      maxHp:     hp,
      pos:       { x: spawnX, y: spawnY, z: spawnZ },
      vel:       { x: dx / len * speed, y: dy / len * speed, z: dz / len * speed },
      alive:     true,
      radius:    radius,
      dmgRadius: dmgRadius,
      dmgAmt:    dmgAmt
    });
  }

  /* ════════════════════════════════════════════════════════════════════════
     MOTHER ASTEROID
  ════════════════════════════════════════════════════════════════════════ */

  function spawnMother() {
    var geo  = new THREE.BoxGeometry(8, 8, 8);
    var mat  = new THREE.MeshLambertMaterial({
      color: 0x553311,
      emissive: 0x441100,
      emissiveIntensity: 0.6
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 80, -20);
    _scene.add(mesh);

    var eLight = new THREE.PointLight(0xFF5511, 3, 30);
    eLight.position.set(0, 80, -20);
    _scene.add(eLight);

    _mother = {
      mesh:       mesh,
      hp:         MOTHER_HP,
      maxHp:      MOTHER_HP,
      alive:      true,
      pos:        { x: 0, y: 80, z: -20 },
      splitTimer: MOTHER_SPLIT_INT,
      emissiveLight: eLight,
      descentSpeed: 0.8
    };
    _motherSpawned = true;
  }

  /* ════════════════════════════════════════════════════════════════════════
     SUPPLY CRATE
  ════════════════════════════════════════════════════════════════════════ */

  function spawnSupplyCrate() {
    var geo  = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    var mesh = makeMesh(geo, 0x334455);
    var px   = (Math.random() - 0.5) * 20;
    var pz   = (Math.random() - 0.5) * 20;
    mesh.position.set(px, 0.6, pz);
    _scene.add(mesh);
    _supplyCrates.push({
      mesh:      mesh,
      pos:       { x: px, y: 0.6, z: pz },
      collected: false
    });
  }

  /* ════════════════════════════════════════════════════════════════════════
     IMPACT EFFECTS: crater + fire
  ════════════════════════════════════════════════════════════════════════ */

  function spawnCrater(x, z, radius) {
    var cr   = Math.max(1.5, radius * 1.2);
    var geo  = new THREE.PlaneGeometry(cr * 2, cr * 2);
    var mesh = makeMesh(geo, 0x332200);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.02, z);
    _scene.add(mesh);
    _craters.push(mesh);

    var fLight = new THREE.PointLight(0xFF4400, 2.5, radius * 2);
    fLight.position.set(x, 1.5, z);
    _scene.add(fLight);
    _fireLights.push({ light: fLight, timer: 8 + Math.random() * 10 });
  }

  function collapseBuilding(bldg) {
    if (bldg.collapsed) { return; }
    bldg.collapsed = true;
    /* Rotate building to "fall" */
    bldg.mesh.rotation.z = (Math.random() > 0.5 ? 1 : -1) * (Math.PI / 2 + Math.random() * 0.4);
    bldg.mesh.position.y = bldg.h * 0.25;
    /* Fire at impact site */
    var fLight = new THREE.PointLight(0xFF4400, 3, 12);
    fLight.position.set(bldg.pos.x, 2, bldg.pos.z);
    _scene.add(fLight);
    _fireLights.push({ light: fLight, timer: 30 });
    bldg.fireLights.push(fLight);
  }

  /* ════════════════════════════════════════════════════════════════════════
     METEOR IMPACT
  ════════════════════════════════════════════════════════════════════════ */

  function meteorImpact(meteor) {
    meteor.alive = false;
    _scene.remove(meteor.mesh);
    _meteorCount = Math.max(0, _meteorCount - 1);

    spawnCrater(meteor.pos.x, meteor.pos.z, meteor.radius);

    /* Damage buildings */
    var i, bldg, bDist;
    if (meteor.type === 'large') {
      for (i = 0; i < _buildings.length; i++) {
        bldg  = _buildings[i];
        bDist = dist2(bldg.pos, meteor.pos);
        if (!bldg.collapsed && bDist < meteor.dmgRadius + bldg.w * 0.5) {
          collapseBuilding(bldg);
        }
      }
    }

    /* Damage civilians */
    var civ;
    for (i = 0; i < _civilians.length; i++) {
      civ = _civilians[i];
      if (!civ.alive || civ.evacuated) { continue; }
      if (dist3(civ.pos, meteor.pos) < 8) {
        civ.alive = false;
        _scene.remove(civ.mesh);
        if (_escortedCiv === civ) { _escortedCiv = null; }
      }
    }

    /* Proximity damage to player */
    if (dist3(_playerPos, meteor.pos) < meteor.dmgRadius) {
      _playerHP -= meteor.dmgAmt * 0.5;
      if (_playerHP <= 0) { _playerHP = 0; }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     FIRING SHELLS
  ════════════════════════════════════════════════════════════════════════ */

  function fireShell(emp) {
    if (!emp || emp.shells <= 0 || emp.overheat) { return; }
    emp.shells--;

    /* Direction: based on gun yaw/pitch if manned, else auto-aim */
    var dirX, dirY, dirZ;
    if (_manning === emp) {
      dirX = -Math.sin(_gunYaw) * Math.cos(_gunPitch);
      dirY =  Math.sin(_gunPitch);
      dirZ = -Math.cos(_gunYaw) * Math.cos(_gunPitch);
    } else {
      /* Auto-aim */
      var tgt = emp.autoTarget;
      if (!tgt || !tgt.alive) { return; }
      var ddx = tgt.pos.x - emp.pos.x;
      var ddy = tgt.pos.y - emp.pos.y;
      var ddz = tgt.pos.z - emp.pos.z;
      var dlen = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz);
      if (dlen < 0.001) { return; }
      dirX = ddx / dlen;
      dirY = ddy / dlen;
      dirZ = ddz / dlen;
    }

    var speed = 60;
    var geo   = new THREE.SphereGeometry(0.12, 4, 4);
    var mesh  = makeMesh(geo, 0xFFDD44, 0xFFAA00, 1.0);
    mesh.position.set(emp.pos.x, emp.pos.y, emp.pos.z);
    _scene.add(mesh);

    _shells.push({
      mesh: mesh,
      pos:  { x: emp.pos.x, y: emp.pos.y, z: emp.pos.z },
      vel:  { x: dirX * speed, y: dirY * speed, z: dirZ * speed },
      alive: true,
      life:  3.0
    });

    /* Overheat tracking */
    emp.overheatTimer += 0.1;
    if (emp.overheatTimer >= GUN_OVERHEAT_T) {
      emp.overheat     = true;
      emp.cooldownTimer = GUN_COOLDOWN_T;
      emp.barrelLight.visible = true;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD
  ════════════════════════════════════════════════════════════════════════ */

  function buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'meteor-strike-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#FFCC44',
      'font-family:monospace',
      'font-size:13px',
      'padding:8px 14px',
      'border-radius:6px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap',
      'border:1px solid #FF4400'
    ].join(';');
    document.body.appendChild(_hud);

    /* Proximity alert */
    _alertEl = document.createElement('div');
    _alertEl.style.cssText = [
      'position:fixed',
      'top:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#FF2200',
      'font-family:monospace',
      'font-size:18px',
      'font-weight:bold',
      'pointer-events:none',
      'z-index:9999',
      'display:none'
    ].join(';');
    _alertEl.textContent = '!! INCOMING METEOR !!';
    document.body.appendChild(_alertEl);

    /* Win screen */
    _winEl = document.createElement('div');
    _winEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,50,0,0.9)',
      'color:#44FF44',
      'font-family:monospace',
      'font-size:24px',
      'padding:30px 50px',
      'border-radius:10px',
      'pointer-events:none',
      'z-index:10000',
      'text-align:center',
      'display:none',
      'border:2px solid #44FF44'
    ].join(';');
    _winEl.innerHTML = 'METEOR STRIKE DEFEATED!<br>CITY SAVED!<br><span style="font-size:14px">Press R to restart</span>';
    document.body.appendChild(_winEl);

    /* Lose screen */
    _loseEl = document.createElement('div');
    _loseEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(80,0,0,0.9)',
      'color:#FF4444',
      'font-family:monospace',
      'font-size:24px',
      'padding:30px 50px',
      'border-radius:10px',
      'pointer-events:none',
      'z-index:10000',
      'text-align:center',
      'display:none',
      'border:2px solid #FF4444'
    ].join(';');
    _loseEl.innerHTML = 'CITY DESTROYED!<br>EVACUATION FAILED!<br><span style="font-size:14px">Press R to restart</span>';
    document.body.appendChild(_loseEl);
  }

  function updateHUD() {
    if (!_hud) { return; }

    var mins    = Math.floor(_timeLeft / 60);
    var secs    = Math.floor(_timeLeft % 60);
    var timeStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;

    var motherStr;
    if (!_motherSpawned) {
      motherStr = 'NOT YET';
    } else if (_motherDestroyed) {
      motherStr = 'DESTROYED';
    } else if (_mother && _mother.alive) {
      motherStr = _mother.hp + ' HP';
    } else {
      motherStr = 'DESTROYED';
    }

    var gunStr = 'NO GUN';
    if (_manning) {
      var emp = _manning;
      if (emp.overheat) {
        gunStr = 'OVERHEAT (' + Math.ceil(emp.cooldownTimer) + 's) SHELLS: ' + emp.shells;
      } else {
        gunStr = 'READY SHELLS: ' + emp.shells;
      }
    }

    var aliveCivs = 0;
    var i;
    for (i = 0; i < _civilians.length; i++) {
      if (_civilians[i].alive && !_civilians[i].evacuated) { aliveCivs++; }
    }

    _hud.textContent = 'METEOR STRIKE  [METEORS: ' + _meteorCount + ']' +
      '  [CIVILIANS SAVED: ' + _civsSaved + '/20]' +
      '  [MOTHER ASTEROID: ' + motherStr + ']' +
      '  [TIME: ' + timeStr + ']  |  GUN: ' + gunStr;
  }

  /* ════════════════════════════════════════════════════════════════════════
     CIVILIAN AI
  ════════════════════════════════════════════════════════════════════════ */

  function updateCivilians(dt) {
    var i, civ, dx, dz, dist;

    for (i = 0; i < _civilians.length; i++) {
      civ = _civilians[i];
      if (!civ.alive || civ.evacuated) { continue; }

      if (civ.escorted) {
        /* Follow player */
        dx = _playerPos.x - civ.pos.x + (Math.random() - 0.5) * 0.5;
        dz = _playerPos.z - civ.pos.z + (Math.random() - 0.5) * 0.5;
        dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 1.5) {
          civ.pos.x += (dx / dist) * 5 * dt;
          civ.pos.z += (dz / dist) * 5 * dt;
        }
      } else {
        /* Panic AI */
        civ.panicTimer -= dt;
        if (civ.panicTimer <= 0) {
          civ.vel.x = (Math.random() - 0.5) * 6;
          civ.vel.z = (Math.random() - 0.5) * 6;
          civ.panicTimer = 1 + Math.random() * 3;

          /* Random hide */
          civ.hideActive = Math.random() < 0.25;
          if (civ.hideActive) {
            civ.hideTimer = 1 + Math.random() * 4;
          }
        }

        if (civ.hideActive) {
          civ.hideTimer -= dt;
          if (civ.hideTimer <= 0) { civ.hideActive = false; }
          /* Crouching visual */
          civ.mesh.scale.y = 0.6;
          civ.mesh.position.y = 0.45;
        } else {
          civ.mesh.scale.y = 1.0;
          civ.pos.x += civ.vel.x * dt;
          civ.pos.z += civ.vel.z * dt;
          /* Boundary clamp */
          if (civ.pos.x >  50) { civ.pos.x =  50; civ.vel.x *= -1; }
          if (civ.pos.x < -50) { civ.pos.x = -50; civ.vel.x *= -1; }
          if (civ.pos.z >  50) { civ.pos.z =  50; civ.vel.z *= -1; }
          if (civ.pos.z < -50) { civ.pos.z = -50; civ.vel.z *= -1; }
        }
      }

      civ.mesh.position.set(civ.pos.x, civ.pos.y, civ.pos.z);

      /* Check if at shelter */
      if (civ.escorted) {
        var j;
        for (j = 0; j < _shelters.length; j++) {
          var sh = _shelters[j];
          if (sh.open && dist2(civ.pos, sh.pos) < 2.5) {
            /* Evacuate */
            civ.evacuated = true;
            civ.alive     = false;
            _scene.remove(civ.mesh);
            _civsSaved++;
            _score += 20;
            if (_escortedCiv === civ) { _escortedCiv = null; }
            /* Bonus */
            if (_civsSaved >= 15) { _score += 500; }
            break;
          }
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER MOVEMENT
  ════════════════════════════════════════════════════════════════════════ */

  function updatePlayer(dt) {
    if (_manning) { return; } /* Locked to emplacement */

    var moveX = 0, moveZ = 0;
    if (_keys['w'] || _keys['W']) { moveZ -= 1; }
    if (_keys['s'] || _keys['S']) { moveZ += 1; }
    if (_keys['a'] || _keys['A']) { moveX -= 1; }
    if (_keys['d'] || _keys['D']) { moveX += 1; }

    /* Rotate movement by yaw */
    var cosY = Math.cos(_yaw), sinY = Math.sin(_yaw);
    var worldX = cosY * moveX - sinY * moveZ;
    var worldZ = sinY * moveX + cosY * moveZ;
    var mlen   = Math.sqrt(worldX * worldX + worldZ * worldZ);
    if (mlen > 0) {
      _playerPos.x += (worldX / mlen) * _playerSpeed * dt;
      _playerPos.z += (worldZ / mlen) * _playerSpeed * dt;
    }

    /* Boundary clamp */
    if (_playerPos.x >  80) { _playerPos.x =  80; }
    if (_playerPos.x < -80) { _playerPos.x = -80; }
    if (_playerPos.z >  80) { _playerPos.z =  80; }
    if (_playerPos.z < -80) { _playerPos.z = -80; }

    _playerMesh.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
    _playerMesh.rotation.y = _yaw;

    /* Camera follow */
    _camera.position.set(
      _playerPos.x + Math.sin(_yaw) * 0 + Math.sin(_yaw + Math.PI) * 3,
      _playerPos.y + 2.5,
      _playerPos.z + Math.cos(_yaw + Math.PI) * 3
    );
    _camera.lookAt(_playerPos.x, _playerPos.y + 1, _playerPos.z);
  }

  /* ════════════════════════════════════════════════════════════════════════
     GUN EMPLACEMENT LOGIC
  ════════════════════════════════════════════════════════════════════════ */

  function findNearestMeteor(pos) {
    var nearest = null, nearDist = Infinity, i, m, d;
    for (i = 0; i < _meteors.length; i++) {
      m = _meteors[i];
      if (!m.alive) { continue; }
      d = dist3(m.pos, pos);
      if (d < nearDist) { nearDist = d; nearest = m; }
    }
    /* Also consider mother asteroid */
    if (_mother && _mother.alive) {
      d = dist3(_mother.pos, pos);
      if (d < nearDist) { nearest = _mother; }
    }
    return nearest;
  }

  function updateGunEmplacements(dt) {
    var i, emp, tgt;

    for (i = 0; i < _gunEmplacements.length; i++) {
      emp = _gunEmplacements[i];

      /* Overheat cooling */
      if (emp.overheat) {
        emp.cooldownTimer -= dt;
        if (emp.cooldownTimer <= 0) {
          emp.overheat      = false;
          emp.overheatTimer = 0;
          emp.barrelLight.visible = false;
        }
      } else {
        /* Passive cool */
        emp.overheatTimer = Math.max(0, emp.overheatTimer - dt * 0.5);
      }

      /* Auto-aim at nearest meteor when not manned */
      if (!emp.manned) {
        tgt = findNearestMeteor(emp.pos);
        emp.autoTarget = tgt;
        emp.reticleLines.visible = false;
      } else if (_manning === emp) {
        /* Manned: reticle follows mouse aim */
        tgt = findNearestMeteor(emp.pos);
        emp.autoTarget = tgt;
        if (tgt && tgt.alive) {
          emp.reticleLines.position.set(tgt.pos.x, tgt.pos.y, tgt.pos.z);
          emp.reticleLines.visible = true;
        } else {
          emp.reticleLines.visible = false;
        }
        /* Camera lock to emplacement */
        _camera.position.set(
          emp.pos.x + Math.sin(_gunYaw) * 0,
          emp.pos.y + 1.5,
          emp.pos.z
        );
        var lookX = emp.pos.x + Math.sin(_gunYaw) * 30;
        var lookY = emp.pos.y + Math.tan(_gunPitch) * 30;
        var lookZ = emp.pos.z - Math.cos(_gunYaw) * 30;
        _camera.position.set(emp.pos.x, emp.pos.y + 1.2, emp.pos.z);
        _camera.rotation.set(-_gunPitch, _gunYaw, 0, 'YXZ');
      }

      /* Turret visual rotation */
      emp.turretMesh.rotation.y = emp.manned ? _gunYaw : (emp.turretMesh.rotation.y + dt * 0.2);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     SHELL PHYSICS
  ════════════════════════════════════════════════════════════════════════ */

  function updateShells(dt) {
    var i, j, sh, m, d;

    for (i = _shells.length - 1; i >= 0; i--) {
      sh = _shells[i];
      if (!sh.alive) { _shells.splice(i, 1); continue; }

      sh.pos.x += sh.vel.x * dt;
      sh.pos.y += sh.vel.y * dt;
      sh.pos.z += sh.vel.z * dt;
      sh.life  -= dt;
      sh.mesh.position.set(sh.pos.x, sh.pos.y, sh.pos.z);

      if (sh.life <= 0 || sh.pos.y < -5 || sh.pos.y > 200) {
        sh.alive = false;
        _scene.remove(sh.mesh);
        continue;
      }

      /* Check meteor hits */
      for (j = 0; j < _meteors.length; j++) {
        m = _meteors[j];
        if (!m.alive) { continue; }
        d = dist3(sh.pos, m.pos);
        if (d < m.radius + 0.2) {
          m.hp--;
          sh.alive = false;
          _scene.remove(sh.mesh);
          if (m.hp <= 0) {
            m.alive = false;
            _scene.remove(m.mesh);
            _meteorCount = Math.max(0, _meteorCount - 1);
            _score += (m.type === 'large' ? 300 : m.type === 'medium' ? 100 : 30);
            spawnCrater(m.pos.x, m.pos.z, m.radius * 0.5);
          }
          break;
        }
      }

      if (!sh.alive) { continue; }

      /* Check mother asteroid hit */
      if (_mother && _mother.alive) {
        d = dist3(sh.pos, _mother.pos);
        if (d < 5) {
          _mother.hp -= 10;
          sh.alive = false;
          _scene.remove(sh.mesh);
          if (_mother.hp <= 0) {
            _mother.alive    = false;
            _motherDestroyed = true;
            _scene.remove(_mother.mesh);
            _scene.remove(_mother.emissiveLight);
            _score += 1000;
            spawnCrater(_mother.pos.x, _mother.pos.z, 5);
          }
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     METEOR PHYSICS
  ════════════════════════════════════════════════════════════════════════ */

  function updateMeteors(dt) {
    var i, m;

    for (i = _meteors.length - 1; i >= 0; i--) {
      m = _meteors[i];
      if (!m.alive) { _meteors.splice(i, 1); continue; }

      m.pos.x += m.vel.x * dt;
      m.pos.y += m.vel.y * dt;
      m.pos.z += m.vel.z * dt;
      m.mesh.position.set(m.pos.x, m.pos.y, m.pos.z);
      m.mesh.rotation.x += dt * 0.5;
      m.mesh.rotation.z += dt * 0.3;

      if (m.pos.y <= 0.5) {
        meteorImpact(m);
        _meteors.splice(i, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     MOTHER ASTEROID LOGIC
  ════════════════════════════════════════════════════════════════════════ */

  function updateMother(dt) {
    if (!_mother || !_mother.alive) { return; }

    _mother.pos.y -= _mother.descentSpeed * dt;
    _mother.mesh.position.set(_mother.pos.x, _mother.pos.y, _mother.pos.z);
    _mother.emissiveLight.position.set(_mother.pos.x, _mother.pos.y, _mother.pos.z);
    _mother.mesh.rotation.y += dt * 0.2;
    _mother.mesh.rotation.x += dt * 0.1;

    /* Split timer */
    _mother.splitTimer -= dt;
    if (_mother.splitTimer <= 0) {
      _mother.splitTimer = MOTHER_SPLIT_INT;
      /* Burst 3 medium meteors */
      var k;
      for (k = 0; k < 3; k++) {
        spawnMeteor('medium');
      }
    }

    /* Fail condition */
    if (_mother.pos.y <= 20) {
      triggerDefeat('MOTHER ASTEROID REACHED CITY!');
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PROXIMITY ALERT
  ════════════════════════════════════════════════════════════════════════ */

  function checkProximityAlert() {
    var i, m;
    for (i = 0; i < _meteors.length; i++) {
      m = _meteors[i];
      if (!m.alive) { continue; }
      if (dist3(m.pos, _playerPos) < 15) {
        _alertTimer = 1.5;
        return;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     WIN / LOSE
  ════════════════════════════════════════════════════════════════════════ */

  function triggerVictory() {
    if (_gameOver) { return; }
    _gameOver = true;
    _victory  = true;
    if (_winEl) { _winEl.style.display = 'block'; }
  }

  function triggerDefeat(reason) {
    if (_gameOver) { return; }
    _gameOver = true;
    _defeat   = true;
    if (_loseEl) {
      _loseEl.innerHTML = 'CITY DESTROYED!<br>' + (reason || 'EVACUATION FAILED!') +
        '<br><span style="font-size:14px">Press R to restart</span>';
      _loseEl.style.display = 'block';
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     FIRE LIGHT TIMERS
  ════════════════════════════════════════════════════════════════════════ */

  function updateFireLights(dt) {
    var i, fl;
    for (i = _fireLights.length - 1; i >= 0; i--) {
      fl = _fireLights[i];
      fl.timer -= dt;
      /* Flicker */
      fl.light.intensity = 2 + Math.sin(fl.timer * 8) * 0.5;
      if (fl.timer <= 0) {
        _scene.remove(fl.light);
        _fireLights.splice(i, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     E KEY INTERACTION
  ════════════════════════════════════════════════════════════════════════ */

  function handleInteract() {
    var i, emp, sh, civ, d;

    /* Already manning a gun — leave */
    if (_manning) {
      _manning.manned = false;
      _manning.reticleLines.visible = false;
      _manning = null;
      return;
    }

    /* Check gun emplacements */
    for (i = 0; i < _gunEmplacements.length; i++) {
      emp = _gunEmplacements[i];
      d   = dist2(_playerPos, emp.pos);
      if (d < 3.5) {
        _manning        = emp;
        emp.manned      = true;
        _gunYaw         = 0;
        _gunPitch       = 0.5;
        return;
      }
    }

    /* Check shelters — open/close */
    for (i = 0; i < _shelters.length; i++) {
      sh = _shelters[i];
      d  = dist2(_playerPos, sh.pos);
      if (d < 3) {
        sh.open = !sh.open;
        sh.lid.visible = !sh.open;
        return;
      }
    }

    /* Check civilians — grab or release */
    if (_escortedCiv) {
      _escortedCiv.escorted = false;
      _escortedCiv = null;
      return;
    }

    for (i = 0; i < _civilians.length; i++) {
      civ = _civilians[i];
      if (!civ.alive || civ.evacuated || civ.escorted) { continue; }
      d = dist3(_playerPos, civ.pos);
      if (d < 3) {
        civ.escorted = true;
        _escortedCiv = civ;
        return;
      }
    }

    /* Check supply crates */
    for (i = 0; i < _supplyCrates.length; i++) {
      var crate = _supplyCrates[i];
      if (crate.collected) { continue; }
      d = dist2(_playerPos, crate.pos);
      if (d < 3) {
        crate.collected = true;
        _scene.remove(crate.mesh);
        /* Resupply all emplacements */
        var k;
        for (k = 0; k < _gunEmplacements.length; k++) {
          _gunEmplacements[k].shells = GUN_MAX_SHELLS;
        }
        return;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     EVENT LISTENERS
  ════════════════════════════════════════════════════════════════════════ */

  var _onKeyDown   = null;
  var _onKeyUp     = null;
  var _onMouseMove = null;
  var _onMouseDown = null;
  var _onMouseUp   = null;
  var _eKeyPressed = false;

  function attachListeners() {
    _onKeyDown = function (e) {
      var key = e.key;
      _keys[key] = true;

      /* Activation combo */
      if (key === 'M' || key === 'm') { _msPressTime.M = performance.now(); }
      if (key === 'S' || key === 's') { _msPressTime.S = performance.now(); }
      if (
        (key === 'S' || key === 's') &&
        _msPressTime.M > 0 &&
        (performance.now() - _msPressTime.M) < MS_WINDOW
      ) {
        if (!_active) { _activateGame(); }
      }
      if (
        (key === 'M' || key === 'm') &&
        _msPressTime.S > 0 &&
        (performance.now() - _msPressTime.S) < MS_WINDOW
      ) {
        if (!_active) { _activateGame(); }
      }

      /* E = interact */
      if ((key === 'e' || key === 'E') && _active && !_eKeyPressed) {
        _eKeyPressed = true;
        handleInteract();
      }

      /* R = restart when game over */
      if ((key === 'r' || key === 'R') && _active && _gameOver) {
        reset();
        _activateGame();
      }
    };

    _onKeyUp = function (e) {
      _keys[e.key] = false;
      if (e.key === 'e' || e.key === 'E') { _eKeyPressed = false; }
    };

    _onMouseMove = function (e) {
      var dx = e.movementX || 0;
      var dy = e.movementY || 0;
      var sens = 0.002;
      if (_manning) {
        _gunYaw   -= dx * sens * 2;
        _gunPitch += dy * sens * 2;
        _gunPitch  = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, _gunPitch));
      } else {
        _yaw   -= dx * sens;
        _pitch -= dy * sens;
        _pitch  = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, _pitch));
      }
    };

    _onMouseDown = function (e) {
      if (e.button === 0) { _mouseDown = true; }
    };

    _onMouseUp = function (e) {
      if (e.button === 0) { _mouseDown = false; }
    };

    document.addEventListener('keydown',   _onKeyDown);
    document.addEventListener('keyup',     _onKeyUp);
    document.addEventListener('mousemove', _onMouseMove);
    document.addEventListener('mousedown', _onMouseDown);
    document.addEventListener('mouseup',   _onMouseUp);
  }

  function detachListeners() {
    if (_onKeyDown)   { document.removeEventListener('keydown',   _onKeyDown); }
    if (_onKeyUp)     { document.removeEventListener('keyup',     _onKeyUp); }
    if (_onMouseMove) { document.removeEventListener('mousemove', _onMouseMove); }
    if (_onMouseDown) { document.removeEventListener('mousedown', _onMouseDown); }
    if (_onMouseUp)   { document.removeEventListener('mouseup',   _onMouseUp); }
  }

  /* ════════════════════════════════════════════════════════════════════════
     ACTIVATE (internal)
  ════════════════════════════════════════════════════════════════════════ */

  function _activateGame() {
    _active = true;
    _gameOver = false;
    _victory  = false;
    _defeat   = false;

    buildCity();
    buildGunEmplacements();
    buildShelters();
    buildCivilians();
    buildPlayer();
    buildHUD();

    _reticleMesh = buildReticle();

    /* Pointer lock request */
    if (_canvas && _canvas.requestPointerLock) {
      _canvas.requestPointerLock();
    }

    /* Initial meteor burst */
    var k;
    for (k = 0; k < 5; k++) {
      spawnMeteor('small');
    }
    _smallTimer = SMALL_INTERVAL;
    _medTimer   = MED_INTERVAL;
    _largeTimer = LARGE_INTERVAL;
    _supplyTimer = SUPPLY_INTERVAL;
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API: init
  ════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene    = scene;
    _camera   = camera;
    _canvas   = canvas;
    _lastTime = performance.now();
    attachListeners();
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API: update — called each frame
  ════════════════════════════════════════════════════════════════════════ */

  function update() {
    if (!_active) { return; }

    var now = performance.now();
    var dt  = Math.min((now - _lastTime) / 1000, 0.1);
    _lastTime = now;

    if (_gameOver) { return; }

    /* ── Countdown ─────────────────────────────────────────────────── */
    _timeLeft -= dt;
    if (_timeLeft <= 0) {
      _timeLeft = 0;
      if (!_motherDestroyed) {
        triggerDefeat('TIME RAN OUT!');
      } else {
        triggerVictory();
      }
      return;
    }

    /* ── Spawn timers ──────────────────────────────────────────────── */
    _smallTimer -= dt;
    if (_smallTimer <= 0) {
      _smallTimer = SMALL_INTERVAL;
      spawnMeteor('small');
    }

    _medTimer -= dt;
    if (_medTimer <= 0) {
      _medTimer = MED_INTERVAL;
      spawnMeteor('medium');
    }

    _largeTimer -= dt;
    if (_largeTimer <= 0) {
      _largeTimer = LARGE_INTERVAL;
      spawnMeteor('large');
    }

    /* ── Mother asteroid spawn at 3-minute mark ─────────────────────── */
    if (!_motherSpawned && _timeLeft <= MOTHER_SPAWN_TIME) {
      spawnMother();
    }

    /* ── Supply crate spawn ────────────────────────────────────────── */
    _supplyTimer -= dt;
    if (_supplyTimer <= 0) {
      _supplyTimer = SUPPLY_INTERVAL;
      spawnSupplyCrate();
    }

    /* ── Auto-fire when manning and mouse held ──────────────────────── */
    _fireTimer -= dt;
    if (_manning && _mouseDown && _fireTimer <= 0) {
      _fireTimer = FIRE_RATE;
      fireShell(_manning);
    }

    /* ── Updates ────────────────────────────────────────────────────── */
    updatePlayer(dt);
    updateCivilians(dt);
    updateGunEmplacements(dt);
    updateShells(dt);
    updateMeteors(dt);
    updateMother(dt);
    updateFireLights(dt);

    /* ── Proximity alert ─────────────────────────────────────────────── */
    checkProximityAlert();
    if (_alertTimer > 0) {
      _alertTimer -= dt;
      if (_alertEl) {
        _alertEl.style.display  = 'block';
        _alertEl.style.opacity  = String((_alertTimer > 0.75) ? 1 : _alertTimer / 0.75);
      }
    } else {
      if (_alertEl) { _alertEl.style.display = 'none'; }
    }

    /* ── Win check: mother destroyed AND time remains ──────────────── */
    if (_motherDestroyed && _timeLeft > 0 && !_gameOver) {
      /* Only win if no meteors remain that could doom city, or wait for timer */
      /* Win immediately on mother destruction */
      triggerVictory();
    }

    /* ── HUD ─────────────────────────────────────────────────────────── */
    updateHUD();
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API: reset
  ════════════════════════════════════════════════════════════════════════ */

  function reset() {
    var i;

    /* Remove all meshes */
    for (i = 0; i < _cityObjects.length; i++) {
      _scene.remove(_cityObjects[i]);
    }
    _cityObjects = [];

    for (i = 0; i < _meteors.length; i++) {
      _scene.remove(_meteors[i].mesh);
    }
    _meteors = [];

    for (i = 0; i < _shells.length; i++) {
      _scene.remove(_shells[i].mesh);
    }
    _shells = [];

    for (i = 0; i < _civilians.length; i++) {
      _scene.remove(_civilians[i].mesh);
    }
    _civilians = [];

    for (i = 0; i < _craters.length; i++) {
      _scene.remove(_craters[i]);
    }
    _craters = [];

    for (i = 0; i < _fireLights.length; i++) {
      _scene.remove(_fireLights[i].light);
    }
    _fireLights = [];

    for (i = 0; i < _supplyCrates.length; i++) {
      _scene.remove(_supplyCrates[i].mesh);
    }
    _supplyCrates = [];

    for (i = 0; i < _gunEmplacements.length; i++) {
      var emp = _gunEmplacements[i];
      _scene.remove(emp.baseMesh);
      _scene.remove(emp.turretMesh);
      _scene.remove(emp.barrelMesh);
      _scene.remove(emp.barrelLight);
      _scene.remove(emp.reticleLines);
    }
    _gunEmplacements = [];

    for (i = 0; i < _shelters.length; i++) {
      _scene.remove(_shelters[i].mesh);
      _scene.remove(_shelters[i].lid);
    }
    _shelters = [];

    if (_playerMesh) { _scene.remove(_playerMesh); _playerMesh = null; }
    if (_reticleMesh) { _scene.remove(_reticleMesh); _reticleMesh = null; }

    if (_mother) {
      _scene.remove(_mother.mesh);
      _scene.remove(_mother.emissiveLight);
      _mother = null;
    }

    _buildings = [];

    /* Remove HUD */
    if (_hud)     { document.body.removeChild(_hud);     _hud = null; }
    if (_alertEl) { document.body.removeChild(_alertEl); _alertEl = null; }
    if (_winEl)   { document.body.removeChild(_winEl);   _winEl = null; }
    if (_loseEl)  { document.body.removeChild(_loseEl);  _loseEl = null; }

    /* Remove fog */
    if (_scene) { _scene.fog = null; }

    /* Reset state */
    _active          = false;
    _victory         = false;
    _defeat          = false;
    _gameOver        = false;
    _score           = 0;
    _timeLeft        = 300;
    _civsSaved       = 0;
    _motherDestroyed = false;
    _motherSpawned   = false;
    _meteorCount     = 0;
    _manning         = null;
    _escortedCiv     = null;
    _smallTimer      = SMALL_INTERVAL;
    _medTimer        = MED_INTERVAL;
    _largeTimer      = LARGE_INTERVAL;
    _supplyTimer     = SUPPLY_INTERVAL;
    _fireTimer       = 0;
    _alertTimer      = 0;
    _yaw             = 0;
    _pitch           = 0;
    _gunYaw          = 0;
    _gunPitch        = 0;
    _playerPos       = { x: 0, y: 1.0, z: 10 };
    _playerHP        = 100;
    _mouseDown       = false;
    _eKeyPressed     = false;
    _msPressTime     = { M: 0, S: 0 };
    _keys            = {};
    _lastTime        = performance.now();
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC EXPORTS
  ════════════════════════════════════════════════════════════════════════ */

  return {
    init:   init,
    update: update,
    reset:  reset
  };

}());
