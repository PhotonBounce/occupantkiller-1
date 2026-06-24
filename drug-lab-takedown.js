/* ───────────────────────────────────────────────────────────────────────────
   drug-lab-takedown.js — Raid a Hidden Drug Manufacturing Compound
   API: window.DrugLabTakedown = { init, update, reset }

   Controls:
     D then L (within 400ms)     → activate module
     WASD                        → move player
     Mouse                       → aim / look
     Left Click                  → shoot
     E (near laptop, hold 2s)    → extract intel
     R                           → reload (aesthetic)
   ─────────────────────────────────────────────────────────────────────────── */
window.DrugLabTakedown = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Activation (D then L within 400ms) ───────────────────────────────── */
  var _active      = false;
  var _dPressTime  = 0;
  var _lPressTime  = 0;
  var _keys        = {};
  var _mouseDown   = false;

  /* ── Player ────────────────────────────────────────────────────────────── */
  var _playerPos   = null;
  var _playerHP    = 100;
  var _playerMaxHP = 100;
  var _yaw         = 0;
  var _pitch       = 0;
  var _fireTimer   = 0;
  var _fireRate    = 0.10;
  var _speed       = 7;
  var _playerMesh  = null;

  /* ── Movement slow from chemical grenade ──────────────────────────────── */
  var _slowTimer   = 0;   // seconds remaining of movement slow

  /* ── Bullets ───────────────────────────────────────────────────────────── */
  var _playerBullets = [];
  var _enemyBullets  = [];
  var _bulletSpeed   = 28;

  /* ── Enemies ───────────────────────────────────────────────────────────── */
  // type: 'soldier' | 'chemist' | 'boss'
  var _enemies = [];

  /* ── Boss ──────────────────────────────────────────────────────────────── */
  var _boss               = null;
  var _bossGrenadeTimer   = 0;
  var _bossGrenadeRate    = 4.5;  // seconds between chemical grenade throws
  var _bossLabIgnited     = false;
  var _bossPhase2         = false; // set when boss <= 30% HP

  /* ── Chemical grenades (boss projectile) ─────────────────────────────── */
  var _chemGrenades = [];  // { mesh, vel, life, exploded, pos }

  /* ── Toxic clouds ─────────────────────────────────────────────────────── */
  var _toxicClouds = [];   // { mesh, pos, timer, maxTimer }

  /* ── Lab fire zones ────────────────────────────────────────────────────── */
  var _fireZones  = [];    // { mesh, pos, active }

  /* ── Explosive drums ──────────────────────────────────────────────────── */
  var _drums = [];         // { mesh, pos, exploded, hp }

  /* ── Laptops / intel ──────────────────────────────────────────────────── */
  var _laptops          = [];  // { mesh, pos, collected, holdTimer }
  var _evidenceCollected = 0;
  var _eHeld             = false;
  var _nearLaptopIdx     = -1;

  /* ── Reinforcement wave ────────────────────────────────────────────────── */
  var _reinforcementTimer   = 0;
  var _reinforcementPending = false;

  /* ── Chemist tracking ──────────────────────────────────────────────────── */
  var _chemistsNeutralized = 0;

  /* ── Lab sections destroyed ────────────────────────────────────────────── */
  var _labSectionsDestroyed = 0;

  /* ── Game state ────────────────────────────────────────────────────────── */
  var _gameTime    = 0;
  var _missionEnd  = false;
  var _missionWon  = false;
  var _endTimer    = 0;
  var _score       = 0;
  var _alerted     = false;

  /* ── HUD overlay ───────────────────────────────────────────────────────── */
  var _hudEl = null;

  /* ── Compound meshes (for cleanup) ─────────────────────────────────────── */
  var _compoundMeshes = [];

  /* ── Helper: create a box mesh and add it to scene ────────────────────── */
  function _makeBox(w, h, d, color, x, y, z) {
    var geo  = new THREE.BoxGeometry(w, h, d);
    var mat  = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    _scene.add(mesh);
    _compoundMeshes.push(mesh);
    return mesh;
  }

  /* ── Helper: create a cylinder mesh ────────────────────────────────────── */
  function _makeCyl(rT, rB, h, segs, color, x, y, z) {
    var geo  = new THREE.CylinderGeometry(rT, rB, h, segs);
    var mat  = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    _scene.add(mesh);
    _compoundMeshes.push(mesh);
    return mesh;
  }

  /* ── Helper: create a sphere mesh ──────────────────────────────────────── */
  function _makeSphere(r, color, x, y, z) {
    var geo  = new THREE.SphereGeometry(r, 8, 6);
    var mat  = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    _scene.add(mesh);
    _compoundMeshes.push(mesh);
    return mesh;
  }

  /* ── Helper: distance squared ───────────────────────────────────────────── */
  function _dist2(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return dx * dx + dz * dz;
  }

  /* ── Helper: distance ───────────────────────────────────────────────────── */
  function _dist(a, b) {
    return Math.sqrt(_dist2(a, b));
  }

  /* ── Helper: remove mesh from scene ────────────────────────────────────── */
  function _removeMesh(mesh) {
    if (mesh && mesh.parent) {
      mesh.parent.remove(mesh);
    }
    var idx = _compoundMeshes.indexOf(mesh);
    if (idx !== -1) _compoundMeshes.splice(idx, 1);
  }

  /* ── Build environment ─────────────────────────────────────────────────── */
  function _buildEnvironment() {
    // Ground
    _makeBox(120, 0.5, 120, 0x3a3020, 0, -0.25, 0);

    // ── Perimeter fence (wooden planks) ──────────────────────────────────
    var fenceColor = 0x8B5E3C;
    // North wall planks
    for (var fx = -55; fx <= 55; fx += 5) {
      _makeBox(4.5, 3, 0.3, fenceColor, fx, 1.5, -58);
    }
    // South wall planks
    for (var fx2 = -55; fx2 <= 55; fx2 += 5) {
      _makeBox(4.5, 3, 0.3, fenceColor, fx2, 1.5, 58);
    }
    // East wall planks
    for (var fz = -55; fz <= 55; fz += 5) {
      _makeBox(0.3, 3, 4.5, fenceColor, 58, 1.5, fz);
    }
    // West wall planks
    for (var fz2 = -55; fz2 <= 55; fz2 += 5) {
      _makeBox(0.3, 3, 4.5, fenceColor, -58, 1.5, fz2);
    }

    // Fence top rail
    _makeBox(116, 0.3, 0.3, 0x6B3E1C, 0, 3.1, -58);
    _makeBox(116, 0.3, 0.3, 0x6B3E1C, 0, 3.1, 58);
    _makeBox(0.3, 0.3, 116, 0x6B3E1C, 58, 3.1, 0);
    _makeBox(0.3, 0.3, 116, 0x6B3E1C, -58, 3.1, 0);

    // Compound entrance gate (south)
    _makeBox(1, 3.5, 0.4, 0x5a3010, -6, 1.75, 58);
    _makeBox(1, 3.5, 0.4, 0x5a3010, 6, 1.75, 58);
    _makeBox(12, 0.5, 0.4, 0x5a3010, 0, 3.6, 58);

    // ── Watchtowers at corners ────────────────────────────────────────────
    var towerPositions = [
      [-52, -52], [52, -52], [-52, 52], [52, 52]
    ];
    for (var t = 0; t < towerPositions.length; t++) {
      var tx = towerPositions[t][0];
      var tz = towerPositions[t][1];
      // Pole
      _makeCyl(0.4, 0.5, 8, 8, 0x6B4E27, tx, 4, tz);
      // Platform
      _makeBox(4, 0.4, 4, 0x7a5533, tx, 8.2, tz);
      // Railing
      _makeBox(4, 1, 0.2, 0x6B4E27, tx, 8.9, tz - 1.9);
      _makeBox(4, 1, 0.2, 0x6B4E27, tx, 8.9, tz + 1.9);
      _makeBox(0.2, 1, 4, 0x6B4E27, tx - 1.9, 8.9, tz);
      _makeBox(0.2, 1, 4, 0x6B4E27, tx + 1.9, 8.9, tz);
      // Roof cone shape approximated
      _makeBox(4.5, 0.3, 4.5, 0x5a3010, tx, 9.55, tz);
    }

    // ── Main lab building (industrial) ───────────────────────────────────
    // Walls
    _makeBox(30, 8, 0.5, 0x888880, 0, 4, -20);   // north wall
    _makeBox(30, 8, 0.5, 0x888880, 0, 4, 10);    // south wall
    _makeBox(0.5, 8, 30, 0x888880, -15, 4, -5);  // west wall
    _makeBox(0.5, 8, 30, 0x888880, 15, 4, -5);   // east wall
    _makeBox(30, 0.5, 30, 0x777770, 0, 8.25, -5); // roof

    // Ventilation fans on roof
    _makeCyl(1.8, 1.8, 0.5, 12, 0x555555, -6, 8.7, -10);
    _makeCyl(1.5, 1.5, 0.5, 12, 0x555555, 6, 8.7, -10);
    _makeCyl(1.8, 1.8, 0.5, 12, 0x555555, -6, 8.7, 0);
    // Fan blades (cross pattern using boxes)
    _makeBox(4, 0.15, 0.4, 0x444444, -6, 8.95, -10);
    _makeBox(0.4, 0.15, 4, 0x444444, -6, 8.95, -10);
    _makeBox(4, 0.15, 0.4, 0x444444, 6, 8.95, -10);
    _makeBox(0.4, 0.15, 4, 0x444444, 6, 8.95, -10);

    // Chimney stack
    _makeCyl(0.5, 0.6, 5, 8, 0x666655, 12, 11, -15);

    // ── Lab interior: chemistry tables ───────────────────────────────────
    // Table 1
    _makeBox(5, 0.2, 1.5, 0xc0c0b0, -6, 1.1, -12);
    _makeBox(0.1, 1, 0.1, 0x888888, -8.4, 0.5, -12.6);
    _makeBox(0.1, 1, 0.1, 0x888888, -3.6, 0.5, -12.6);
    _makeBox(0.1, 1, 0.1, 0x888888, -8.4, 0.5, -11.4);
    _makeBox(0.1, 1, 0.1, 0x888888, -3.6, 0.5, -11.4);
    // Table 2
    _makeBox(5, 0.2, 1.5, 0xc0c0b0, 6, 1.1, -12);
    _makeBox(0.1, 1, 0.1, 0x888888, 3.6, 0.5, -12.6);
    _makeBox(0.1, 1, 0.1, 0x888888, 8.4, 0.5, -12.6);
    _makeBox(0.1, 1, 0.1, 0x888888, 3.6, 0.5, -11.4);
    _makeBox(0.1, 1, 0.1, 0x888888, 8.4, 0.5, -11.4);
    // Table 3
    _makeBox(5, 0.2, 1.5, 0xc0c0b0, -6, 1.1, -6);
    _makeBox(5, 0.2, 1.5, 0xc0c0b0, 6, 1.1, -6);

    // Beakers/flasks on tables (spheres for glass)
    _makeSphere(0.25, 0x88ccee, -7, 1.35, -12);
    _makeSphere(0.2, 0xaaeeaa, -6, 1.35, -12);
    _makeSphere(0.3, 0xeecc88, -5.5, 1.35, -11.8);
    _makeSphere(0.25, 0xee8888, 5, 1.35, -12);
    _makeSphere(0.2, 0x8888ee, 6.5, 1.35, -12);
    _makeSphere(0.22, 0xeeffaa, 7, 1.35, -11.9);

    // Chemical barrels / flasks on floor
    _makeCyl(0.3, 0.3, 0.7, 8, 0x4488aa, -10, 0.35, -8);
    _makeCyl(0.3, 0.3, 0.7, 8, 0xaa6644, -9.5, 0.35, -8);
    _makeCyl(0.35, 0.35, 0.8, 8, 0x226688, -11, 0.4, -15);

    // ── Drying room (east side of lab) ──────────────────────────────────
    _makeBox(0.5, 8, 10, 0x888880, 20, 4, -5);
    _makeBox(10, 8, 0.5, 0x888880, 25, 4, -10);
    _makeBox(10, 8, 0.5, 0x888880, 25, 4, 0);
    _makeBox(10, 0.5, 10, 0x777770, 25, 8.25, -5);
    // Hanging strips of product (thin boxes in rows)
    for (var dr = 0; dr < 6; dr++) {
      _makeBox(0.1, 1.5, 0.05, 0xddcc99, 18 + dr, 5.5, -5);
      _makeBox(0.1, 1.5, 0.05, 0xddcc99, 18 + dr, 5.5, -6);
      _makeBox(0.1, 1.5, 0.05, 0xddcc99, 18 + dr, 5.5, -4);
      _makeBox(0.1, 1.5, 0.05, 0xddcc99, 18 + dr, 3.8, -5.5);
      _makeBox(0.1, 1.5, 0.05, 0xddcc99, 18 + dr, 3.8, -4.5);
    }
    // Horizontal hang bars
    _makeBox(8, 0.08, 0.08, 0x884422, 21, 6.5, -4);
    _makeBox(8, 0.08, 0.08, 0x884422, 21, 6.5, -5);
    _makeBox(8, 0.08, 0.08, 0x884422, 21, 6.5, -6);
    _makeBox(8, 0.08, 0.08, 0x884422, 21, 4.8, -4.5);
    _makeBox(8, 0.08, 0.08, 0x884422, 21, 4.8, -5.5);

    // ── Processing facility (west side) ──────────────────────────────────
    _makeBox(0.5, 6, 12, 0x888880, -15, 3, -5);   // already west wall of lab
    _makeBox(12, 6, 0.5, 0x888880, -21, 3, -11);
    _makeBox(12, 6, 0.5, 0x888880, -21, 3, 1);
    _makeBox(0.5, 6, 12, 0x888880, -27, 3, -5);
    _makeBox(12, 0.5, 12, 0x777770, -21, 6.25, -5);
    // Conveyor belt (flat box)
    _makeBox(10, 0.2, 1.2, 0x333333, -21, 0.6, -5);
    // Belt side rails
    _makeBox(10, 0.4, 0.1, 0x666666, -21, 0.7, -5.55);
    _makeBox(10, 0.4, 0.1, 0x666666, -21, 0.7, -4.45);
    // Packing machines
    _makeBox(1.5, 2, 1.5, 0x666655, -18, 1, -5);
    _makeBox(1.5, 2, 1.5, 0x666655, -24, 1, -5);
    // Machine details
    _makeBox(0.3, 0.3, 0.3, 0xcc2222, -18, 2.15, -5);
    _makeBox(0.3, 0.3, 0.3, 0xcc2222, -24, 2.15, -5);

    // ── Underground storage / bunker ─────────────────────────────────────
    // Trap door on ground
    _makeBox(2, 0.15, 2, 0x8B5E3C, -21, 0.07, 15);
    _makeBox(1.8, 0.08, 0.9, 0x6B3E1C, -21, 0.22, 15);  // door handle detail
    // Bunker walls (sunken)
    _makeBox(12, 3, 0.3, 0x555540, -21, -1.5, 20);
    _makeBox(12, 3, 0.3, 0x555540, -21, -1.5, 10);
    _makeBox(0.3, 3, 10, 0x555540, -27, -1.5, 15);
    _makeBox(0.3, 3, 10, 0x555540, -15, -1.5, 15);
    _makeBox(12, 0.3, 10, 0x444430, -21, 0.1, 15);       // ceiling at ground
    _makeBox(12, 0.3, 10, 0x333320, -21, -3.05, 15);     // bunker floor
    // Supply crates in bunker
    _makeBox(1.5, 1.2, 1.2, 0x7a6644, -23, -2.45, 17);
    _makeBox(1.5, 1.2, 1.2, 0x7a6644, -21, -2.45, 17);
    _makeBox(1.5, 1.2, 1.2, 0x7a6644, -19, -2.45, 17);
    _makeBox(1.5, 1.2, 1.2, 0x7a6644, -23, -2.45, 13);
    _makeBox(1.5, 1.2, 1.2, 0x7a6644, -21, -2.45, 13);
    // Crate cross boards
    _makeBox(1.5, 0.12, 0.1, 0x5a4422, -23, -1.9, 17);
    _makeBox(0.1, 0.12, 1.2, 0x5a4422, -23, -1.9, 17);
    _makeBox(1.5, 0.12, 0.1, 0x5a4422, -21, -1.9, 17);
    _makeBox(0.1, 0.12, 1.2, 0x5a4422, -21, -1.9, 17);

    // ── Ambient scene dressing ────────────────────────────────────────────
    // Parked pickup truck (simple box)
    _makeBox(4, 1.2, 2, 0x334422, 35, 0.6, 30);
    _makeBox(2, 1, 2, 0x334422, 34, 1.6, 30);
    // Fuel storage shed
    _makeBox(8, 4, 6, 0x666655, 35, 2, -30);
    _makeBox(8, 0.3, 6, 0x555544, 35, 4.15, -30);
    // Generator box
    _makeBox(2, 1.2, 1, 0x555544, -30, 0.6, 30);
    _makeCyl(0.2, 0.2, 2, 6, 0x444433, -30, 1.8, 30);

    // Lighting: ambient and directional (if not already set by game engine)
    var ambLight = new THREE.AmbientLight(0x404040, 1.2);
    _scene.add(ambLight);
    _compoundMeshes.push(ambLight);
    var dirLight = new THREE.DirectionalLight(0xffeedd, 1.0);
    dirLight.position.set(40, 60, 20);
    _scene.add(dirLight);
    _compoundMeshes.push(dirLight);
  }

  /* ── Spawn explosive drums ─────────────────────────────────────────────── */
  function _spawnDrums() {
    var positions = [
      { x: 8,   z: -3  },
      { x: -12, z: -14 },
      { x: -22, z: -7  },
      { x: 3,   z: 5   },
      { x: 28,  z: -3  }
    ];
    _drums = [];
    for (var i = 0; i < positions.length; i++) {
      var px = positions[i].x;
      var pz = positions[i].z;
      var mesh = _makeCyl(0.55, 0.6, 1.4, 10, 0xcc2200, px, 0.7, pz);
      // Red stripe
      var stripe = _makeBox(1.25, 0.2, 1.25, 0xffee00, px, 0.7, pz);
      _drums.push({
        mesh: mesh,
        stripe: stripe,
        pos: new THREE.Vector3(px, 0.7, pz),
        exploded: false,
        hp: 30
      });
    }
  }

  /* ── Spawn laptops ─────────────────────────────────────────────────────── */
  function _spawnLaptops() {
    var positions = [
      { x: -8,  z: -14, rx: 0 },
      { x: 8,   z: -14, rx: 0 },
      { x: -22, z: -7,  rx: 0 },
      { x: 28,  z: -8,  rx: 0 }
    ];
    _laptops = [];
    for (var i = 0; i < positions.length; i++) {
      var px = positions[i].x;
      var pz = positions[i].z;
      // Base
      var base   = _makeBox(1.2, 0.08, 0.9, 0x222222, px, 1.25, pz);
      // Screen
      var screen = _makeBox(1.1, 0.8, 0.06, 0x1155cc, px, 1.65, pz - 0.42);
      // Screen glow frame
      var frame  = _makeBox(1.15, 0.85, 0.04, 0x111111, px, 1.65, pz - 0.44);
      _laptops.push({
        base: base,
        screen: screen,
        frame: frame,
        pos: new THREE.Vector3(px, 1.2, pz),
        collected: false,
        holdTimer: 0
      });
    }
  }

  /* ── Spawn enemies ─────────────────────────────────────────────────────── */
  function _spawnEnemies() {
    _enemies = [];

    // 14 cartel soldiers
    var soldierPos = [
      { x: -40, z: 0   }, { x: 40,  z: 0   }, { x: 0,   z: -40 }, { x: 0,   z: 40  },
      { x: -30, z: -30 }, { x: 30,  z: -30 }, { x: -30, z: 30  }, { x: 30,  z: 30  },
      { x: -10, z: 30  }, { x: 10,  z: 30  }, { x: -15, z: -18 }, { x: 15,  z: -18 },
      { x: -25, z: -5  }, { x: 25,  z: -5  }
    ];
    for (var s = 0; s < 14; s++) {
      var sp = soldierPos[s];
      var smesh = _makeBox(0.7, 1.7, 0.5, 0x443322, sp.x, 0.85, sp.z);
      // Head
      var shead = _makeBox(0.55, 0.55, 0.55, 0x886644, sp.x, 2.0, sp.z);
      _enemies.push({
        type: 'soldier',
        mesh: smesh,
        headMesh: shead,
        pos: new THREE.Vector3(sp.x, 0.85, sp.z),
        hp: 75,
        maxHp: 75,
        alive: true,
        fireTimer: 1.5 + Math.random() * 2,
        alertTimer: 0,
        patrolAngle: Math.random() * Math.PI * 2,
        patrolCenter: new THREE.Vector3(sp.x, 0.85, sp.z),
        vel: new THREE.Vector3()
      });
    }

    // 6 chemists
    var chemistPos = [
      { x: -6,  z: -10 }, { x: 6,   z: -10 }, { x: 0,   z: -5  },
      { x: -22, z: -3  }, { x: 28,  z: -3  }, { x: -6,  z: 2   }
    ];
    for (var c = 0; c < 6; c++) {
      var cp = chemistPos[c];
      var cmesh = _makeBox(0.65, 1.7, 0.5, 0x446644, cp.x, 0.85, cp.z);
      var chead = _makeBox(0.5, 0.5, 0.5, 0x99bb88, cp.x, 2.0, cp.z);
      // Lab coat
      var ccoat = _makeBox(0.72, 1.2, 0.52, 0xdddddd, cp.x, 1.2, cp.z);
      _enemies.push({
        type: 'chemist',
        mesh: cmesh,
        headMesh: chead,
        coatMesh: ccoat,
        pos: new THREE.Vector3(cp.x, 0.85, cp.z),
        hp: 55,
        maxHp: 55,
        alive: true,
        fireTimer: 3.5 + Math.random(),
        alertTimer: 0,
        fleeing: false,
        fleeTimer: 0,
        calledReinforcements: false,
        vel: new THREE.Vector3()
      });
    }

    // Boss: El Quimico
    var bmesh  = _makeBox(0.85, 1.8, 0.65, 0x442211, 0, 0.9, -15);
    var bhead  = _makeBox(0.7, 0.65, 0.65, 0x885533, 0, 2.15, -15);
    // Boss coat (dark)
    var bcoat  = _makeBox(0.9, 1.3, 0.7, 0x221100, 0, 1.35, -15);
    _boss = {
      type: 'boss',
      mesh: bmesh,
      headMesh: bhead,
      coatMesh: bcoat,
      pos: new THREE.Vector3(0, 0.9, -15),
      hp: 440,
      maxHp: 440,
      alive: true,
      fireTimer: 2,
      vel: new THREE.Vector3()
    };
    _enemies.push(_boss);
  }

  /* ── Spawn lab fire zones ──────────────────────────────────────────────── */
  function _spawnFireZones() {
    var firePositions = [
      { x: -8, z: -10 }, { x: 4, z: -8 }, { x: -2, z: -14 },
      { x: 8, z: -12 },  { x: -12, z: -6 }
    ];
    _fireZones = [];
    for (var i = 0; i < firePositions.length; i++) {
      var fp = firePositions[i];
      var fmesh = _makeBox(3, 0.3, 3, 0xff4400, fp.x, 0.1, fp.z);
      fmesh.visible = false;
      _fireZones.push({
        mesh: fmesh,
        pos: new THREE.Vector3(fp.x, 0.1, fp.z),
        active: false,
        pulseTimer: 0
      });
    }
  }

  /* ── Activate boss fire phase ──────────────────────────────────────────── */
  function _igniteLab() {
    if (_bossLabIgnited) return;
    _bossLabIgnited = true;
    for (var i = 0; i < _fireZones.length; i++) {
      _fireZones[i].active = true;
      _fireZones[i].mesh.visible = true;
    }
    _showHint('Lab is on fire! 20HP/s in flames!');
  }

  /* ── Show HUD hint message ─────────────────────────────────────────────── */
  function _showHint(msg) {
    if (!_hudEl) return;
    var hint = document.getElementById('dlt-hint');
    if (!hint) {
      hint = document.createElement('div');
      hint.id = 'dlt-hint';
      hint.style.cssText = 'position:absolute;top:60px;left:50%;transform:translateX(-50%);' +
        'background:rgba(180,60,0,0.85);color:#fff;padding:8px 18px;border-radius:6px;' +
        'font-size:15px;font-family:monospace;pointer-events:none;z-index:9999;';
      document.body.appendChild(hint);
    }
    hint.textContent = msg;
    hint.style.display = 'block';
    clearTimeout(hint._timer);
    hint._timer = setTimeout(function () {
      hint.style.display = 'none';
    }, 3000);
  }

  /* ── Update HUD ─────────────────────────────────────────────────────────── */
  function _updateHUD() {
    if (!_hudEl) return;
    var drumsDest = 0;
    for (var d = 0; d < _drums.length; d++) {
      if (_drums[d].exploded) drumsDest++;
    }
    var bossHP = _boss ? Math.max(0, _boss.hp) : 0;
    var labSections = _labSectionsDestroyed;

    _hudEl.innerHTML =
      '<span style="color:#ff9933">DRUG LAB TAKEDOWN</span>' +
      '&nbsp;&nbsp;|&nbsp;&nbsp;HP: <b>' + Math.max(0, _playerHP) + '</b>' +
      '&nbsp;&nbsp;|&nbsp;&nbsp;Evidence: <b>' + _evidenceCollected + '/4</b>' +
      '&nbsp;&nbsp;|&nbsp;&nbsp;Drums: <b>' + drumsDest + '/5</b>' +
      '&nbsp;&nbsp;|&nbsp;&nbsp;Chemists neutralized: <b>' + _chemistsNeutralized + '</b>' +
      '&nbsp;&nbsp;|&nbsp;&nbsp;El Qu&iacute;mico: <b>' +
        (_boss && _boss.alive ? bossHP + 'HP' : 'DEAD') + '</b>' +
      '&nbsp;&nbsp;|&nbsp;&nbsp;Lab sections: <b>' + labSections + '</b>' +
      '&nbsp;&nbsp;|&nbsp;&nbsp;Score: <b>' + _score + '</b>';
  }

  /* ── Fire a player bullet ───────────────────────────────────────────────── */
  function _firePlayerBullet() {
    var geo  = new THREE.SphereGeometry(0.08, 5, 4);
    var mat  = new THREE.MeshLambertMaterial({ color: 0xffee88 });
    var mesh = new THREE.Mesh(geo, mat);

    var dir = new THREE.Vector3(
      Math.sin(_yaw) * Math.cos(_pitch),
      Math.sin(-_pitch),
      -Math.cos(_yaw) * Math.cos(_pitch)
    );
    mesh.position.copy(_playerPos);
    mesh.position.y += 1.6;
    _scene.add(mesh);

    _playerBullets.push({
      mesh: mesh,
      vel: dir.multiplyScalar(_bulletSpeed),
      life: 2.0,
      damage: 25
    });
  }

  /* ── Fire an enemy bullet ───────────────────────────────────────────────── */
  function _fireEnemyBullet(from, damage) {
    var geo  = new THREE.SphereGeometry(0.1, 5, 4);
    var mat  = new THREE.MeshLambertMaterial({ color: 0xff4400 });
    var mesh = new THREE.Mesh(geo, mat);

    var dx = _playerPos.x - from.x;
    var dz = _playerPos.z - from.z;
    var dy = 1.6;
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < 0.001) len = 1;
    var spread = 0.08;

    mesh.position.set(from.x, from.y + 1.2, from.z);
    _scene.add(mesh);

    _enemyBullets.push({
      mesh: mesh,
      vel: new THREE.Vector3(
        (dx / len + (Math.random() - 0.5) * spread) * (_bulletSpeed * 0.8),
        (dy / len + (Math.random() - 0.5) * spread) * (_bulletSpeed * 0.8),
        (dz / len + (Math.random() - 0.5) * spread) * (_bulletSpeed * 0.8)
      ),
      life: 2.5,
      damage: damage
    });
  }

  /* ── Throw boss chemical grenade ────────────────────────────────────────── */
  function _throwChemGrenade(from) {
    var geo  = new THREE.SphereGeometry(0.22, 8, 6);
    var mat  = new THREE.MeshLambertMaterial({ color: 0x9900cc });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(from.x, from.y + 1.5, from.z);
    _scene.add(mesh);

    var dx = _playerPos.x - from.x;
    var dz = _playerPos.z - from.z;
    var d  = Math.sqrt(dx * dx + dz * dz);
    if (d < 0.01) d = 1;
    var arcH = 0.5;

    _chemGrenades.push({
      mesh: mesh,
      vel: new THREE.Vector3(
        (dx / d) * 7,
        5 + arcH,
        (dz / d) * 7
      ),
      life: 1.8,
      exploded: false,
      pos: mesh.position
    });
  }

  /* ── Explode chemical grenade ───────────────────────────────────────────── */
  function _explodeChemGrenade(grenade) {
    if (grenade.exploded) return;
    grenade.exploded = true;
    _removeMesh(grenade.mesh);

    // Spawn toxic cloud
    var cx = grenade.mesh.position.x;
    var cz = grenade.mesh.position.z;
    var cgeo = new THREE.SphereGeometry(2.5, 8, 6);
    var cmat = new THREE.MeshLambertMaterial({
      color: 0xaa9900, transparent: true, opacity: 0.55
    });
    var cmesh = new THREE.Mesh(cgeo, cmat);
    cmesh.position.set(cx, 1.2, cz);
    _scene.add(cmesh);
    _compoundMeshes.push(cmesh);

    _toxicClouds.push({
      mesh: cmesh,
      pos: new THREE.Vector3(cx, 1.2, cz),
      timer: 6,
      maxTimer: 6,
      type: 'chem-grenade'
    });

    // AoE damage + slow
    var dist2player = _dist(_playerPos, grenade.mesh.position);
    if (dist2player < 4) {
      _playerHP -= 40;
      _slowTimer = 4.0;
      _showHint('Chemical grenade hit! Movement slowed!');
    }
  }

  /* ── Explode a drum ────────────────────────────────────────────────────── */
  function _explodeDrum(drumIdx) {
    var drum = _drums[drumIdx];
    if (drum.exploded) return;
    drum.exploded = true;

    var ex = drum.pos.x;
    var ez = drum.pos.z;

    // Visual flash sphere
    var fgeo = new THREE.SphereGeometry(4, 8, 6);
    var fmat = new THREE.MeshLambertMaterial({
      color: 0xff6600, transparent: true, opacity: 0.7
    });
    var fmesh = new THREE.Mesh(fgeo, fmat);
    fmesh.position.set(ex, 1.5, ez);
    _scene.add(fmesh);

    // Fade out after short time
    setTimeout(function () {
      if (fmesh.parent) fmesh.parent.remove(fmesh);
    }, 600);

    // Hide drum
    drum.mesh.visible = false;
    drum.stripe.visible = false;

    _score += 200;
    _labSectionsDestroyed++;
    _showHint('DRUM EXPLODED! Chain reaction check...');

    // Player AoE
    var dPlayer = _dist(_playerPos, drum.pos);
    if (dPlayer < 6) {
      _playerHP -= 70 * Math.max(0, 1 - dPlayer / 6);
    }

    // Enemy AoE
    for (var i = 0; i < _enemies.length; i++) {
      var en = _enemies[i];
      if (!en.alive) continue;
      var dEn = _dist(en.pos, drum.pos);
      if (dEn < 6) {
        en.hp -= 70 * Math.max(0, 1 - dEn / 6);
        if (en.hp <= 0) _killEnemy(i);
      }
    }

    // Chain reaction to nearby drums
    for (var j = 0; j < _drums.length; j++) {
      if (j === drumIdx || _drums[j].exploded) continue;
      var dDrum = _dist(_drums[j].pos, drum.pos);
      if (dDrum < 8) {
        (function (idx) {
          setTimeout(function () { _explodeDrum(idx); }, 300 + Math.random() * 200);
        })(j);
      }
    }
  }

  /* ── Kill enemy ────────────────────────────────────────────────────────── */
  function _killEnemy(idx) {
    var en = _enemies[idx];
    if (!en.alive) return;
    en.alive = false;

    // Drop to floor visually
    en.mesh.position.y = 0.3;
    if (en.headMesh) en.headMesh.position.y = 0.3;
    if (en.coatMesh) en.coatMesh.position.y = 0.3;

    // Change color to indicate dead
    if (en.mesh.material) en.mesh.material.color.setHex(0x222211);
    if (en.headMesh && en.headMesh.material) en.headMesh.material.color.setHex(0x333322);

    if (en.type === 'chemist') {
      _chemistsNeutralized++;
      _score += 150;
    } else if (en.type === 'soldier') {
      _score += 100;
    } else if (en.type === 'boss') {
      _score += 2000;
      _showHint('El Quimico is down!');
    }
  }

  /* ── Shoot chemical equipment (toxic cloud) ─────────────────────────────── */
  function _shootEquipment(hitPos) {
    var cgeo = new THREE.SphereGeometry(1.8, 8, 6);
    var cmat = new THREE.MeshLambertMaterial({
      color: 0xcccc00, transparent: true, opacity: 0.5
    });
    var cmesh = new THREE.Mesh(cgeo, cmat);
    cmesh.position.set(hitPos.x, 1.0, hitPos.z);
    _scene.add(cmesh);
    _compoundMeshes.push(cmesh);

    _toxicClouds.push({
      mesh: cmesh,
      pos: new THREE.Vector3(hitPos.x, 1.0, hitPos.z),
      timer: 8,
      maxTimer: 8,
      type: 'equipment',
      contactTimer: 0
    });
    _showHint('TOXIC CLOUD! 5HP/s if inside for 3s!');
  }

  /* ── Trigger reinforcement wave ─────────────────────────────────────────── */
  function _triggerReinforcements() {
    if (_reinforcementPending) return;
    _reinforcementPending = true;
    _reinforcementTimer   = 20;
    _showHint('LOCKDOWN! Reinforcements in 20s!');
  }

  /* ── Spawn reinforcement wave ───────────────────────────────────────────── */
  function _spawnReinforcements() {
    var spawnPoints = [
      { x: -50, z: 0 }, { x: 50, z: 0 },
      { x: 0, z: -50 }, { x: 0, z: 50 }
    ];
    for (var i = 0; i < 4; i++) {
      var sp = spawnPoints[i];
      var rmesh = _makeBox(0.7, 1.7, 0.5, 0x221100, sp.x, 0.85, sp.z);
      var rhead = _makeBox(0.55, 0.55, 0.55, 0x664422, sp.x, 2.0, sp.z);
      _enemies.push({
        type: 'soldier',
        mesh: rmesh,
        headMesh: rhead,
        pos: new THREE.Vector3(sp.x, 0.85, sp.z),
        hp: 75,
        maxHp: 75,
        alive: true,
        fireTimer: 1 + Math.random(),
        alertTimer: 0,
        patrolAngle: Math.random() * Math.PI * 2,
        patrolCenter: new THREE.Vector3(sp.x, 0.85, sp.z),
        vel: new THREE.Vector3()
      });
    }
    _reinforcementPending = false;
    _showHint('REINFORCEMENTS ARRIVED!');
  }

  /* ── Check win condition ────────────────────────────────────────────────── */
  function _checkWin() {
    if (_missionEnd) return;

    var allDrumsDestroyed = true;
    for (var d = 0; d < _drums.length; d++) {
      if (!_drums[d].exploded) { allDrumsDestroyed = false; break; }
    }

    var bossDefeated = _boss && !_boss.alive;

    // Escape zone near compound entrance (south gate area)
    var atEscape = (_playerPos.z > 50 && Math.abs(_playerPos.x) < 8);

    if (allDrumsDestroyed && bossDefeated && _evidenceCollected >= 4 && atEscape) {
      _missionEnd = true;
      _missionWon = true;
      _showHint('MISSION COMPLETE! Compound neutralized!');
      _score += 5000;
    }
  }

  /* ── Check lose condition ───────────────────────────────────────────────── */
  function _checkLose() {
    if (_missionEnd) return;
    if (_playerHP <= 0) {
      _missionEnd = true;
      _missionWon = false;
      _showHint('AGENT DOWN. Mission failed.');
    }
  }

  /* ── Input handlers ─────────────────────────────────────────────────────── */
  function _onKeyDown(e) {
    _keys[e.code] = true;

    if (e.code === 'KeyD') _dPressTime = Date.now();
    if (e.code === 'KeyL') {
      _lPressTime = Date.now();
      if (_lPressTime - _dPressTime <= 400 && !_active) {
        _activate();
      }
    }

    // E key for laptop intel
    if (e.code === 'KeyE') _eHeld = true;
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;
    if (e.code === 'KeyE') {
      _eHeld = false;
      // Reset hold timer on nearest laptop
      if (_nearLaptopIdx >= 0 && _laptops[_nearLaptopIdx]) {
        _laptops[_nearLaptopIdx].holdTimer = 0;
      }
    }
  }

  function _onMouseDown(e) {
    if (e.button === 0) _mouseDown = true;
  }

  function _onMouseUp(e) {
    if (e.button === 0) _mouseDown = false;
  }

  var _lastMouseX = 0;
  var _lastMouseY = 0;

  function _onMouseMove(e) {
    if (!_active) return;
    var dx = e.clientX - _lastMouseX;
    var dy = e.clientY - _lastMouseY;
    _lastMouseX = e.clientX;
    _lastMouseY = e.clientY;
    _yaw   -= dx * 0.002;
    _pitch -= dy * 0.002;
    _pitch = Math.max(-1.2, Math.min(1.2, _pitch));
  }

  /* ── Activate module ────────────────────────────────────────────────────── */
  function _activate() {
    _active = true;
    _buildEnvironment();
    _spawnDrums();
    _spawnLaptops();
    _spawnEnemies();
    _spawnFireZones();

    // Player start position (outside south fence, facing north)
    _playerPos = new THREE.Vector3(0, 0.9, 52);
    _playerMesh = _makeBox(0.5, 1.5, 0.5, 0x223344, 0, 0.75, 52);

    // Camera setup
    _camera.position.copy(_playerPos);
    _camera.position.y += 1.6;
    _yaw   = 0;
    _pitch = 0;

    // HUD
    _hudEl = document.createElement('div');
    _hudEl.id = 'dlt-hud';
    _hudEl.style.cssText =
      'position:absolute;bottom:14px;left:50%;transform:translateX(-50%);' +
      'background:rgba(0,0,0,0.72);color:#ffdd88;padding:7px 18px;' +
      'border-radius:8px;font-size:13px;font-family:monospace;' +
      'pointer-events:none;z-index:9998;white-space:nowrap;';
    document.body.appendChild(_hudEl);

    _showHint('D+L activated — Raid the drug lab! Destroy 5 drums, collect 4 intel, kill El Quimico!');

    // Pointer lock
    if (_canvas && _canvas.requestPointerLock) {
      _canvas.requestPointerLock();
    }
  }

  /* ── Update player movement ─────────────────────────────────────────────── */
  function _updatePlayer(dt) {
    var spd = (_slowTimer > 0) ? _speed * 0.4 : _speed;

    var fwdX = Math.sin(_yaw);
    var fwdZ = -Math.cos(_yaw);
    var rightX = Math.cos(_yaw);
    var rightZ = Math.sin(_yaw);

    var moveX = 0;
    var moveZ = 0;
    if (_keys['KeyW']) { moveX += fwdX; moveZ += fwdZ; }
    if (_keys['KeyS']) { moveX -= fwdX; moveZ -= fwdZ; }
    if (_keys['KeyA']) { moveX -= rightX; moveZ -= rightZ; }
    if (_keys['KeyD']) { moveX += rightX; moveZ += rightZ; }

    var mlen = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (mlen > 0.001) {
      moveX /= mlen;
      moveZ /= mlen;
    }

    _playerPos.x += moveX * spd * dt;
    _playerPos.z += moveZ * spd * dt;
    // Clamp to compound area
    _playerPos.x = Math.max(-62, Math.min(62, _playerPos.x));
    _playerPos.z = Math.max(-62, Math.min(62, _playerPos.z));

    // Camera follows player
    _camera.position.set(
      _playerPos.x,
      _playerPos.y + 1.6,
      _playerPos.z
    );
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y = _yaw;
    _camera.rotation.x = _pitch;

    // Player mesh follows
    if (_playerMesh) {
      _playerMesh.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
    }

    // Slow timer
    if (_slowTimer > 0) _slowTimer -= dt;

    // Check fire zones
    if (_bossLabIgnited) {
      for (var f = 0; f < _fireZones.length; f++) {
        var fz = _fireZones[f];
        if (!fz.active) continue;
        var fdist = _dist(_playerPos, fz.pos);
        if (fdist < 2.0) {
          _playerHP -= 20 * dt;
        }
      }
    }

    // Check toxic clouds
    for (var tc = 0; tc < _toxicClouds.length; tc++) {
      var cloud = _toxicClouds[tc];
      if (!cloud.mesh.visible) continue;
      var cdist = _dist(_playerPos, cloud.pos);
      if (cdist < 2.2) {
        if (cloud.type === 'equipment') {
          cloud.contactTimer = (cloud.contactTimer || 0) + dt;
          if (cloud.contactTimer >= 3) {
            _playerHP -= 5 * dt;
          }
        } else {
          // Chem grenade cloud
          _playerHP -= 5 * dt;
        }
      } else {
        if (cloud.type === 'equipment') {
          cloud.contactTimer = 0;
        }
      }
    }
  }

  /* ── Update firing ──────────────────────────────────────────────────────── */
  function _updateFiring(dt) {
    _fireTimer -= dt;
    if (_mouseDown && _fireTimer <= 0) {
      _fireTimer = _fireRate;
      _firePlayerBullet();
    }
  }

  /* ── Update player bullets ──────────────────────────────────────────────── */
  function _updatePlayerBullets(dt) {
    for (var i = _playerBullets.length - 1; i >= 0; i--) {
      var b = _playerBullets[i];
      b.life -= dt;
      b.mesh.position.x += b.vel.x * dt;
      b.mesh.position.y += b.vel.y * dt;
      b.mesh.position.z += b.vel.z * dt;

      var hit = false;

      // Check enemy hits
      for (var e = 0; e < _enemies.length; e++) {
        var en = _enemies[e];
        if (!en.alive) continue;
        var bd = _dist(b.mesh.position, en.pos);
        if (bd < 1.0) {
          en.hp -= b.damage;
          hit = true;
          if (!_alerted) {
            _alerted = true;
          }
          // Chemist: trigger reinforcement if fleeing and not already called
          if (en.type === 'chemist' && en.fleeing && !en.calledReinforcements) {
            en.calledReinforcements = true;
            _triggerReinforcements();
          }
          if (en.hp <= 0) _killEnemy(e);
          break;
        }
      }

      // Check drum hits
      if (!hit) {
        for (var d = 0; d < _drums.length; d++) {
          var dr = _drums[d];
          if (dr.exploded) continue;
          var dd = _dist(b.mesh.position, dr.pos);
          if (dd < 1.0) {
            dr.hp -= b.damage;
            hit = true;
            if (dr.hp <= 0) _explodeDrum(d);
            break;
          }
        }
      }

      // Check equipment hits (tables area, rough detection)
      if (!hit) {
        var bx = b.mesh.position.x;
        var bz = b.mesh.position.z;
        // Lab interior tables
        if (bx > -16 && bx < 16 && bz > -20 && bz < 12) {
          // Could hit a beaker/flask
          if (b.life < 1.5 && Math.random() < 0.02) {
            _shootEquipment(new THREE.Vector3(bx, 0, bz));
            hit = true;
          }
        }
      }

      if (hit || b.life <= 0) {
        _removeMesh(b.mesh);
        _playerBullets.splice(i, 1);
      }
    }
  }

  /* ── Update enemy bullets ───────────────────────────────────────────────── */
  function _updateEnemyBullets(dt) {
    for (var i = _enemyBullets.length - 1; i >= 0; i--) {
      var b = _enemyBullets[i];
      b.life -= dt;
      b.mesh.position.x += b.vel.x * dt;
      b.mesh.position.y += b.vel.y * dt;
      b.mesh.position.z += b.vel.z * dt;

      var dist2p = _dist(b.mesh.position, _playerPos);
      if (dist2p < 0.8) {
        _playerHP -= b.damage;
        _removeMesh(b.mesh);
        _enemyBullets.splice(i, 1);
        continue;
      }

      if (b.life <= 0) {
        _removeMesh(b.mesh);
        _enemyBullets.splice(i, 1);
      }
    }
  }

  /* ── Update enemy AI ────────────────────────────────────────────────────── */
  function _updateEnemies(dt) {
    var aggro = _alerted;

    for (var i = 0; i < _enemies.length; i++) {
      var en = _enemies[i];
      if (!en.alive) continue;

      var distToPlayer = _dist(en.pos, _playerPos);

      // Alert trigger: any enemy sees player within 20m triggers alert
      if (distToPlayer < 20 && !_alerted) {
        _alerted = true;
        aggro = true;
      }

      if (en.type === 'boss') {
        _updateBossAI(en, dt, distToPlayer);
        continue;
      }

      if (en.type === 'chemist') {
        _updateChemistAI(en, dt, distToPlayer, aggro);
        continue;
      }

      // Soldier AI
      _updateSoldierAI(en, dt, distToPlayer, aggro);
    }
  }

  /* ── Soldier AI ─────────────────────────────────────────────────────────── */
  function _updateSoldierAI(en, dt, distToPlayer, aggro) {
    if (aggro && distToPlayer < 35) {
      // Advance toward player
      var dx = _playerPos.x - en.pos.x;
      var dz = _playerPos.z - en.pos.z;
      var dl = Math.sqrt(dx * dx + dz * dz);
      if (dl > 3) {
        en.pos.x += (dx / dl) * 3.5 * dt;
        en.pos.z += (dz / dl) * 3.5 * dt;
      }

      // Fire at player
      en.fireTimer -= dt;
      if (en.fireTimer <= 0 && distToPlayer < 25) {
        en.fireTimer = 1.5 + Math.random();
        _fireEnemyBullet(en.pos, 8);
      }
    } else {
      // Patrol
      en.patrolAngle += dt * 0.4;
      var pr = 5;
      en.pos.x = en.patrolCenter.x + Math.cos(en.patrolAngle) * pr;
      en.pos.z = en.patrolCenter.z + Math.sin(en.patrolAngle) * pr;
    }

    // Sync mesh
    en.mesh.position.set(en.pos.x, en.pos.y, en.pos.z);
    if (en.headMesh) en.headMesh.position.set(en.pos.x, en.pos.y + 1.15, en.pos.z);
  }

  /* ── Chemist AI ─────────────────────────────────────────────────────────── */
  function _updateChemistAI(en, dt, distToPlayer, aggro) {
    if (aggro || distToPlayer < 12) {
      // Flee away from player
      en.fleeing = true;
      var dx = en.pos.x - _playerPos.x;
      var dz = en.pos.z - _playerPos.z;
      var dl = Math.sqrt(dx * dx + dz * dz);
      if (dl < 0.01) dl = 1;
      en.pos.x += (dx / dl) * 4.5 * dt;
      en.pos.z += (dz / dl) * 4.5 * dt;
      en.pos.x = Math.max(-56, Math.min(56, en.pos.x));
      en.pos.z = Math.max(-56, Math.min(56, en.pos.z));

      // Chemist fires pistol occasionally
      en.fireTimer -= dt;
      if (en.fireTimer <= 0 && distToPlayer < 20) {
        en.fireTimer = 3 + Math.random() * 2;
        _fireEnemyBullet(en.pos, 5);
      }

      // If escaped far enough, call reinforcements
      if (distToPlayer > 40 && !en.calledReinforcements) {
        en.calledReinforcements = true;
        _triggerReinforcements();
      }
    }

    // Sync mesh
    en.mesh.position.set(en.pos.x, en.pos.y, en.pos.z);
    if (en.headMesh) en.headMesh.position.set(en.pos.x, en.pos.y + 1.15, en.pos.z);
    if (en.coatMesh) en.coatMesh.position.set(en.pos.x, en.pos.y + 0.35, en.pos.z);
  }

  /* ── Boss AI ──────────────────────────────────────────────────────────────── */
  function _updateBossAI(en, dt, distToPlayer) {
    if (!en.alive) return;

    var hpPct = en.hp / en.maxHp;

    // Phase 2 at 30%
    if (hpPct <= 0.3 && !_bossPhase2) {
      _bossPhase2 = true;
      _igniteLab();
      _bossGrenadeRate = 2.5; // faster grenades in phase 2
    }

    // Move toward player but keep some distance
    var dx = _playerPos.x - en.pos.x;
    var dz = _playerPos.z - en.pos.z;
    var dl = Math.sqrt(dx * dx + dz * dz);
    if (dl > 6) {
      en.pos.x += (dx / dl) * 3.0 * dt;
      en.pos.z += (dz / dl) * 3.0 * dt;
    } else if (dl < 4) {
      en.pos.x -= (dx / dl) * 2.0 * dt;
      en.pos.z -= (dz / dl) * 2.0 * dt;
    }

    // Shoot bullets
    en.fireTimer -= dt;
    if (en.fireTimer <= 0 && distToPlayer < 30) {
      en.fireTimer = 1.0 + Math.random() * 0.5;
      _fireEnemyBullet(en.pos, 14);
    }

    // Throw chemical grenades
    _bossGrenadeTimer -= dt;
    if (_bossGrenadeTimer <= 0 && distToPlayer < 25) {
      _bossGrenadeTimer = _bossGrenadeRate;
      _throwChemGrenade(en.pos);
    }

    // Sync mesh
    en.mesh.position.set(en.pos.x, en.pos.y, en.pos.z);
    if (en.headMesh) en.headMesh.position.set(en.pos.x, en.pos.y + 1.25, en.pos.z);
    if (en.coatMesh) en.coatMesh.position.set(en.pos.x, en.pos.y + 0.45, en.pos.z);
  }

  /* ── Update chemical grenades ───────────────────────────────────────────── */
  function _updateChemGrenades(dt) {
    for (var i = _chemGrenades.length - 1; i >= 0; i--) {
      var g = _chemGrenades[i];
      if (g.exploded) {
        _chemGrenades.splice(i, 1);
        continue;
      }
      g.life -= dt;
      g.vel.y -= 9.8 * dt;  // gravity
      g.mesh.position.x += g.vel.x * dt;
      g.mesh.position.y += g.vel.y * dt;
      g.mesh.position.z += g.vel.z * dt;

      // Explode on ground contact or life expiry
      if (g.mesh.position.y <= 0.3 || g.life <= 0) {
        _explodeChemGrenade(g);
        _chemGrenades.splice(i, 1);
      }
    }
  }

  /* ── Update toxic clouds ────────────────────────────────────────────────── */
  function _updateToxicClouds(dt) {
    for (var i = _toxicClouds.length - 1; i >= 0; i--) {
      var c = _toxicClouds[i];
      c.timer -= dt;
      // Fade opacity
      var t = c.timer / c.maxTimer;
      if (c.mesh.material) c.mesh.material.opacity = 0.55 * t;
      // Grow slightly
      var scale = 1 + (1 - t) * 0.5;
      c.mesh.scale.set(scale, scale, scale);

      if (c.timer <= 0) {
        _removeMesh(c.mesh);
        _toxicClouds.splice(i, 1);
      }
    }
  }

  /* ── Update fire zones ──────────────────────────────────────────────────── */
  function _updateFireZones(dt) {
    for (var i = 0; i < _fireZones.length; i++) {
      var fz = _fireZones[i];
      if (!fz.active) continue;
      fz.pulseTimer += dt * 3;
      var pulse = 0.6 + 0.4 * Math.abs(Math.sin(fz.pulseTimer));
      if (fz.mesh.material) {
        fz.mesh.material.color.setRGB(1.0 * pulse, 0.27 * pulse, 0);
      }
    }
  }

  /* ── Update laptop intel collection ─────────────────────────────────────── */
  function _updateLaptops(dt) {
    _nearLaptopIdx = -1;
    for (var i = 0; i < _laptops.length; i++) {
      var lp = _laptops[i];
      if (lp.collected) continue;
      var dist = _dist(_playerPos, lp.pos);
      if (dist < 2.5) {
        _nearLaptopIdx = i;
        if (_eHeld) {
          lp.holdTimer += dt;
          // Pulse screen to indicate progress
          var prog = lp.holdTimer / 2.0;
          if (lp.screen && lp.screen.material) {
            lp.screen.material.color.setRGB(prog * 0.2, prog * 0.6, 1.0);
          }
          if (lp.holdTimer >= 2.0) {
            lp.collected = true;
            _evidenceCollected++;
            _score += 500;
            // Turn screen green
            if (lp.screen && lp.screen.material) {
              lp.screen.material.color.setHex(0x00ff44);
            }
            _showHint('Intel extracted! (' + _evidenceCollected + '/4)');
          }
        } else {
          lp.holdTimer = 0;
        }
      }
    }
  }

  /* ── Update reinforcement wave ──────────────────────────────────────────── */
  function _updateReinforcements(dt) {
    if (!_reinforcementPending) return;
    _reinforcementTimer -= dt;
    if (_reinforcementTimer <= 0) {
      _spawnReinforcements();
    }
  }

  /* ── Init ───────────────────────────────────────────────────────────────── */
  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    _playerHP   = 100;
    _active     = false;
    _dPressTime = 0;
    _lPressTime = 0;
    _gameTime   = 0;
    _missionEnd = false;
    _missionWon = false;
    _alerted    = false;
    _score      = 0;
    _evidenceCollected = 0;
    _chemistsNeutralized = 0;
    _labSectionsDestroyed = 0;
    _slowTimer  = 0;
    _bossLabIgnited = false;
    _bossPhase2     = false;
    _bossGrenadeTimer = 2;
    _bossGrenadeRate  = 4.5;
    _reinforcementPending = false;
    _reinforcementTimer   = 0;
    _compoundMeshes = [];
    _enemies = [];
    _playerBullets = [];
    _enemyBullets  = [];
    _chemGrenades  = [];
    _toxicClouds   = [];
    _fireZones     = [];
    _drums         = [];
    _laptops       = [];
    _boss          = null;
    _playerMesh    = null;

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);
    document.addEventListener('mousedown', _onMouseDown);
    document.addEventListener('mouseup',   _onMouseUp);
    document.addEventListener('mousemove', _onMouseMove);
  }

  /* ── Update (called each frame) ─────────────────────────────────────────── */
  function update(dt) {
    if (!_active || _missionEnd) {
      if (_missionEnd) {
        _endTimer += dt;
        if (_endTimer > 0.1 && _hudEl) {
          var msg = _missionWon
            ? '<span style="color:#00ff88">MISSION COMPLETE</span> — Score: ' + _score
            : '<span style="color:#ff4444">MISSION FAILED</span> — Score: ' + _score;
          _hudEl.innerHTML = msg;
        }
      }
      return;
    }

    _gameTime += dt;

    _updatePlayer(dt);
    _updateFiring(dt);
    _updatePlayerBullets(dt);
    _updateEnemyBullets(dt);
    _updateEnemies(dt);
    _updateChemGrenades(dt);
    _updateToxicClouds(dt);
    _updateFireZones(dt);
    _updateLaptops(dt);
    _updateReinforcements(dt);

    _checkWin();
    _checkLose();
    _updateHUD();
  }

  /* ── Reset ──────────────────────────────────────────────────────────────── */
  function reset() {
    // Remove all compound meshes from scene
    for (var i = 0; i < _compoundMeshes.length; i++) {
      var m = _compoundMeshes[i];
      if (m && m.parent) m.parent.remove(m);
    }
    _compoundMeshes = [];

    // Remove bullet meshes
    for (var b = 0; b < _playerBullets.length; b++) {
      if (_playerBullets[b].mesh && _playerBullets[b].mesh.parent) {
        _playerBullets[b].mesh.parent.remove(_playerBullets[b].mesh);
      }
    }
    for (var eb = 0; eb < _enemyBullets.length; eb++) {
      if (_enemyBullets[eb].mesh && _enemyBullets[eb].mesh.parent) {
        _enemyBullets[eb].mesh.parent.remove(_enemyBullets[eb].mesh);
      }
    }
    for (var cg = 0; cg < _chemGrenades.length; cg++) {
      if (_chemGrenades[cg].mesh && _chemGrenades[cg].mesh.parent) {
        _chemGrenades[cg].mesh.parent.remove(_chemGrenades[cg].mesh);
      }
    }
    for (var tc = 0; tc < _toxicClouds.length; tc++) {
      if (_toxicClouds[tc].mesh && _toxicClouds[tc].mesh.parent) {
        _toxicClouds[tc].mesh.parent.remove(_toxicClouds[tc].mesh);
      }
    }

    // Remove HUD
    if (_hudEl && _hudEl.parentNode) _hudEl.parentNode.removeChild(_hudEl);
    _hudEl = null;
    var hint = document.getElementById('dlt-hint');
    if (hint && hint.parentNode) hint.parentNode.removeChild(hint);

    // Remove event listeners
    document.removeEventListener('keydown', _onKeyDown);
    document.removeEventListener('keyup',   _onKeyUp);
    document.removeEventListener('mousedown', _onMouseDown);
    document.removeEventListener('mouseup',   _onMouseUp);
    document.removeEventListener('mousemove', _onMouseMove);

    // Reset state
    _active     = false;
    _gameTime   = 0;
    _missionEnd = false;
    _missionWon = false;
    _endTimer   = 0;
    _score      = 0;
    _alerted    = false;
    _playerHP   = 100;
    _slowTimer  = 0;
    _bossLabIgnited   = false;
    _bossPhase2       = false;
    _bossGrenadeTimer = 2;
    _bossGrenadeRate  = 4.5;
    _reinforcementPending = false;
    _reinforcementTimer   = 0;
    _evidenceCollected    = 0;
    _chemistsNeutralized  = 0;
    _labSectionsDestroyed = 0;
    _enemies       = [];
    _playerBullets = [];
    _enemyBullets  = [];
    _chemGrenades  = [];
    _toxicClouds   = [];
    _fireZones     = [];
    _drums         = [];
    _laptops       = [];
    _boss          = null;
    _playerMesh    = null;
    _keys          = {};
    _mouseDown     = false;
    _eHeld         = false;
    _nearLaptopIdx = -1;
    _dPressTime    = 0;
    _lPressTime    = 0;
  }

  /* ── Public API ─────────────────────────────────────────────────────────── */
  return { init: init, update: update, reset: reset };

}());
