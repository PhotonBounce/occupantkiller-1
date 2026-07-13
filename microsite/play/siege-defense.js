/* ============================================================
 *  SIEGE-DEFENSE.JS — Tower-defense mode: defend your base
 *  Activation: S + D simultaneous keypress (both within 400ms)
 *  8 waves of attackers; place defensive structures with 1-5 + E
 * ============================================================ */
window.SiegeDefense = (function () {
  'use strict';

  // ── Activation ──────────────────────────────────────────────────────────────
  var _active = false;
  var _keyTimes = {};
  var _ACTIVATION_WINDOW = 400;

  // ── Scene references ────────────────────────────────────────────────────────
  var _scene = null;
  var _camera = null;
  var _renderer = null;
  var _animId = null;
  var _clock = null;

  // ── HUD ─────────────────────────────────────────────────────────────────────
  var _hudEl = null;

  // ── Keys ────────────────────────────────────────────────────────────────────
  var _keys = {};

  // ── Base geometry groups ────────────────────────────────────────────────────
  var _baseGroup = null;

  // Wall sections: [{ mesh, hp, maxHp, side }]
  var _wallSections = [];
  var _WALL_HP = 200;

  // Gate
  var _gateMesh = null;
  var _gateHP = 300;
  var _gateMaxHP = 300;

  // Corner tower meshes
  var _cornerTowers = [];

  // Barricade positions (3 slots, draggable)
  var _barricades = [];          // { mesh, placed, x, z }

  // ── Resources ───────────────────────────────────────────────────────────────
  var _gold = 200;
  var _keepHP = 500;
  var _keepMaxHP = 500;

  // ── Defensive structures ────────────────────────────────────────────────────
  // Arrow towers
  var _arrowTowers = [];         // { group, mesh, barrel, x, z, range, fireTimer, fireCooldown }
  // Cannons
  var _cannons = [];             // { group, mesh, x, z, fireTimer, fireCooldown }
  // Oil cauldrons
  var _oilCauldrons = [];        // { mesh, x, z, active, timer }
  // Spike traps
  var _spikeTraps = [];          // { mesh, x, z }
  // Repair kits in progress
  var _repairKits = [];          // { wallIdx, timer }

  // Projectiles
  var _arrows = [];              // { mesh, vx, vy, vz, damage, life }
  var _cannonballs = [];         // { mesh, vx, vy, vz, damage, splashR, life }

  // ── Wave system ─────────────────────────────────────────────────────────────
  var _currentWave = 0;
  var _totalWaves = 8;
  var _waveActive = false;
  var _waveTimer = 0;
  var _restTimer = 0;
  var _inRest = false;
  var _gameOver = false;
  var _victory = false;

  // Attackers
  var _attackers = [];
  // { mesh, type, hp, maxHp, speed, x, z, targetX, targetZ,
  //   damage, attackTimer, attackCooldown, reward,
  //   ladderMesh, carriers, boulderTimer, firing, immune }

  // Enemy projectiles (catapult boulders)
  var _enemyBoulders = [];       // { mesh, vx, vy, vz, damage, life }

  // Gold pickups floating
  var _goldPickups = [];         // { mesh, x, z, life }

  // ── Selected tool ───────────────────────────────────────────────────────────
  var _selectedTool = 0;         // 1-5

  // ── Costs ───────────────────────────────────────────────────────────────────
  var COSTS = { ARROW_TOWER: 80, CANNON: 150, OIL: 40, SPIKE: 60, REPAIR: 100, GATE_REINFORCE: 50 };

  // ── Wave definitions ─────────────────────────────────────────────────────────
  // Each entry: { infantry, ladders, ram, catapult, siegeTower, commander }
  var WAVE_DEFS = [
    { infantry: 10, ladders: 0, ram: 0,  catapult: 0, siegeTower: 0, commander: false }, // W1
    { infantry: 15, ladders: 2, ram: 0,  catapult: 0, siegeTower: 0, commander: false }, // W2
    { infantry: 20, ladders: 0, ram: 1,  catapult: 0, siegeTower: 0, commander: false }, // W3
    { infantry: 25, ladders: 0, ram: 0,  catapult: 1, siegeTower: 0, commander: false }, // W4
    { infantry: 30, ladders: 0, ram: 0,  catapult: 0, siegeTower: 1, commander: false }, // W5
    { infantry: 40, ladders: 2, ram: 1,  catapult: 1, siegeTower: 0, commander: false }, // W6
    { infantry: 50, ladders: 0, ram: 2,  catapult: 1, siegeTower: 0, commander: false }, // W7
    { infantry: 60, ladders: 0, ram: 0,  catapult: 1, siegeTower: 0, commander: true  }  // W8
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // GEOMETRY HELPERS
  // ──────────────────────────────────────────────────────────────────────────

  function _makeBox(w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y || 0, z || 0);
    return mesh;
  }

  function _makeCylinder(rt, rb, h, segs, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y || 0, z || 0);
    return mesh;
  }

  function _makeSphere(r, color, x, y, z) {
    var geo = new THREE.SphereGeometry(r, 8, 8);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y || 0, z || 0);
    return mesh;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // BUILD BASE
  // ──────────────────────────────────────────────────────────────────────────

  function _buildBase() {
    _baseGroup = new THREE.Group();
    _wallSections = [];
    _cornerTowers = [];
    _barricades = [];

    // Ground
    var ground = _makeBox(120, 0.5, 120, 0x4a5a3a, 0, -0.25, 0);
    _baseGroup.add(ground);

    // Keep (center): 12x10x12, color 0x557755
    var keep = _makeBox(12, 10, 12, 0x557755, 0, 5, 0);
    keep.userData.isKeep = true;
    _baseGroup.add(keep);

    // Outer walls: 40x6x2 rectangle perimeter, color 0x668866
    // North wall (z=-22)
    var northWall = _makeBox(40, 6, 2, 0x668866, 0, 3, -22);
    northWall.userData.wallSide = 'north';
    _baseGroup.add(northWall);
    _wallSections.push({ mesh: northWall, hp: _WALL_HP, maxHp: _WALL_HP, side: 'north', breached: false });

    // East wall (x=22)
    var eastWall = _makeBox(2, 6, 40, 0x668866, 22, 3, 0);
    eastWall.userData.wallSide = 'east';
    _baseGroup.add(eastWall);
    _wallSections.push({ mesh: eastWall, hp: _WALL_HP, maxHp: _WALL_HP, side: 'east', breached: false });

    // West wall (x=-22)
    var westWall = _makeBox(2, 6, 40, 0x668866, -22, 3, 0);
    westWall.userData.wallSide = 'west';
    _baseGroup.add(westWall);
    _wallSections.push({ mesh: westWall, hp: _WALL_HP, maxHp: _WALL_HP, side: 'west', breached: false });

    // South wall — two halves with gate gap, color 0x668866
    var southWallL = _makeBox(16, 6, 2, 0x668866, -12, 3, 22);
    southWallL.userData.wallSide = 'south_l';
    _baseGroup.add(southWallL);
    _wallSections.push({ mesh: southWallL, hp: _WALL_HP, maxHp: _WALL_HP, side: 'south', breached: false });

    var southWallR = _makeBox(16, 6, 2, 0x668866, 12, 3, 22);
    southWallR.userData.wallSide = 'south_r';
    _baseGroup.add(southWallR);
    _wallSections.push({ mesh: southWallR, hp: _WALL_HP, maxHp: _WALL_HP, side: 'south', breached: false });

    // 4 corner towers: 4x12x4, color 0x669966
    var cornerPos = [
      { x: -22, z: -22 },
      { x:  22, z: -22 },
      { x: -22, z:  22 },
      { x:  22, z:  22 }
    ];
    for (var ci = 0; ci < cornerPos.length; ci++) {
      var ct = _makeBox(4, 12, 4, 0x669966, cornerPos[ci].x, 6, cornerPos[ci].z);
      _baseGroup.add(ct);
      _cornerTowers.push(ct);
    }

    // Main gate: 5x5x2, color 0x554433, south center
    _gateMesh = _makeBox(5, 5, 2, 0x554433, 0, 2.5, 22);
    _gateMesh.userData.isGate = true;
    _baseGroup.add(_gateMesh);
    _gateHP = 300;
    _gateMaxHP = 300;

    // 3 barricades: 4x3x0.5, color 0x8B6914
    var barricadePositions = [
      { x: -8, z: 18 },
      { x:  0, z: 15 },
      { x:  8, z: 18 }
    ];
    for (var bi = 0; bi < barricadePositions.length; bi++) {
      var bMesh = _makeBox(4, 3, 0.5, 0x8B6914, barricadePositions[bi].x, 1.5, barricadePositions[bi].z);
      _baseGroup.add(bMesh);
      _barricades.push({ mesh: bMesh, placed: true, x: barricadePositions[bi].x, z: barricadePositions[bi].z });
    }

    _scene.add(_baseGroup);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SPAWN ATTACKERS
  // ──────────────────────────────────────────────────────────────────────────

  function _spawnWave(waveIdx) {
    var def = WAVE_DEFS[waveIdx];
    if (!def) return;

    // Spawn infantry (soldiers)
    for (var ii = 0; ii < def.infantry; ii++) {
      _spawnAttacker('soldier');
    }

    // Spawn ladder units
    for (var li = 0; li < def.ladders; li++) {
      _spawnAttacker('ladder');
    }

    // Spawn battering ram
    for (var ri = 0; ri < def.ram; ri++) {
      _spawnAttacker('ram');
    }

    // Spawn catapult
    for (var cai = 0; cai < def.catapult; cai++) {
      _spawnAttacker('catapult');
    }

    // Spawn siege tower
    for (var si = 0; si < def.siegeTower; si++) {
      _spawnAttacker('siegetower');
    }

    // Spawn commander in wave 8
    if (def.commander) {
      _spawnAttacker('commander');
    }
  }

  function _spawnAttacker(type) {
    var spawnAngle = Math.random() * Math.PI * 2;
    var spawnR = 55 + Math.random() * 10;
    var sx = Math.cos(spawnAngle) * spawnR;
    var sz = Math.sin(spawnAngle) * spawnR;

    var attacker = null;

    if (type === 'soldier') {
      var mesh = _makeBox(1, 2, 1, 0x884422, sx, 1, sz);
      _scene.add(mesh);
      attacker = {
        mesh: mesh, type: 'soldier', hp: 60, maxHp: 60,
        speed: 4 + Math.random() * 1, x: sx, z: sz,
        targetX: 0, targetZ: 22,
        damage: 10, attackTimer: 0, attackCooldown: 1.5,
        reward: 10, immune: false,
        ladderMesh: null, boulderTimer: 0, firing: false, carriers: []
      };
    } else if (type === 'ladder') {
      var lmesh = _makeBox(1, 2, 1, 0x774422, sx, 1, sz);
      lmesh.material.color.setHex(0x774422);
      _scene.add(lmesh);
      // Ladder object
      var ladderMesh = _makeBox(0.3, 8, 0.3, 0x6B4226, sx, 4, sz);
      _scene.add(ladderMesh);
      attacker = {
        mesh: lmesh, type: 'ladder', hp: 50, maxHp: 50,
        speed: 3, x: sx, z: sz,
        targetX: -8 + Math.random() * 16, targetZ: 22,
        damage: 5, attackTimer: 0, attackCooldown: 2,
        reward: 10, immune: false,
        ladderMesh: ladderMesh, boulderTimer: 0, firing: false, carriers: []
      };
    } else if (type === 'ram') {
      // Battering ram: large box with 4 carrier soldiers
      var ramGroup = new THREE.Group();
      ramGroup.position.set(sx, 1, sz);
      var ramBody = _makeBox(8, 2, 2, 0x8B6914, 0, 0, 0);
      ramGroup.add(ramBody);
      // 4 carriers
      var carrierMeshes = [];
      var carrierOffsets = [
        { x: -3, z: 0 }, { x: -1, z: 0 }, { x: 1, z: 0 }, { x: 3, z: 0 }
      ];
      for (var kk = 0; kk < 4; kk++) {
        var c = _makeBox(0.8, 1.8, 0.8, 0x884422, carrierOffsets[kk].x, 1.2, 0);
        ramGroup.add(c);
        carrierMeshes.push(c);
      }
      _scene.add(ramGroup);
      attacker = {
        mesh: ramGroup, type: 'ram', hp: 200, maxHp: 200,
        speed: 2, x: sx, z: sz,
        targetX: 0, targetZ: 22,
        damage: 20, attackTimer: 0, attackCooldown: 2,
        reward: 50, immune: false,
        ladderMesh: null, boulderTimer: 0, firing: false, carriers: carrierMeshes
      };
    } else if (type === 'catapult') {
      var catGroup = new THREE.Group();
      catGroup.position.set(sx, 0, sz);
      var catFrame = _makeBox(4, 2, 3, 0x7B5B2A, 0, 1, 0);
      catGroup.add(catFrame);
      var catArm = _makeBox(0.5, 6, 0.5, 0x8B6914, 0, 3, 0);
      catGroup.add(catArm);
      _scene.add(catGroup);
      attacker = {
        mesh: catGroup, type: 'catapult', hp: 150, maxHp: 150,
        speed: 1.2, x: sx, z: sz,
        targetX: 0 + (Math.random() - 0.5) * 20, targetZ: 35,
        damage: 0, attackTimer: 0, attackCooldown: 6,
        reward: 50, immune: false,
        ladderMesh: null, boulderTimer: 0, firing: false, carriers: [],
        stoppedAtRange: false
      };
    } else if (type === 'siegetower') {
      var stGroup = new THREE.Group();
      stGroup.position.set(sx, 0, sz);
      var stBase = _makeBox(4, 10, 4, 0x8B7355, 0, 5, 0);
      stGroup.add(stBase);
      var stTop = _makeBox(5, 2, 5, 0x6B5B35, 0, 11, 0);
      stGroup.add(stTop);
      // 4 wheels visual
      var wheelOffsets = [{ x: -2, z: -2 }, { x: 2, z: -2 }, { x: -2, z: 2 }, { x: 2, z: 2 }];
      for (var wh = 0; wh < 4; wh++) {
        var wheel = _makeCylinder(0.5, 0.5, 0.3, 8, 0x333333, wheelOffsets[wh].x, 0, wheelOffsets[wh].z);
        wheel.rotation.z = Math.PI / 2;
        stGroup.add(wheel);
      }
      _scene.add(stGroup);
      attacker = {
        mesh: stGroup, type: 'siegetower', hp: 400, maxHp: 400,
        speed: 1, x: sx, z: sz,
        targetX: 0, targetZ: 22,
        damage: 15, attackTimer: 0, attackCooldown: 1,
        reward: 50, immune: false,
        ladderMesh: null, boulderTimer: 0, firing: false, carriers: []
      };
    } else if (type === 'commander') {
      var cmdMesh = _makeCylinder(1.5, 1, 4, 10, 0x880000, sx, 2, sz);
      cmdMesh.scale.set(1.5, 1.5, 1.5);
      _scene.add(cmdMesh);
      attacker = {
        mesh: cmdMesh, type: 'commander', hp: 600, maxHp: 600,
        speed: 2.5, x: sx, z: sz,
        targetX: 0, targetZ: 22,
        damage: 30, attackTimer: 0, attackCooldown: 1.2,
        reward: 200, immune: true,  // immune to arrow towers
        ladderMesh: null, boulderTimer: 0, firing: false, carriers: []
      };
    }

    if (attacker) {
      _attackers.push(attacker);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PLACE DEFENSIVE STRUCTURES
  // ──────────────────────────────────────────────────────────────────────────

  function _placeSelectedTool() {
    if (_selectedTool === 1) {
      // Arrow tower: 2x4x2 + cylinder barrel
      if (_gold < COSTS.ARROW_TOWER) { _toast('Not enough gold! (need ' + COSTS.ARROW_TOWER + ')', 2000, '#ff4444'); return; }
      _gold -= COSTS.ARROW_TOWER;
      var tGroup = new THREE.Group();
      var px = (Math.random() - 0.5) * 30;
      var pz = -5 + (Math.random() - 0.5) * 20;
      tGroup.position.set(px, 0, pz);
      var tBody = _makeBox(2, 4, 2, 0x445544, 0, 2, 0);
      tGroup.add(tBody);
      var tBarrel = _makeCylinder(0.2, 0.2, 1.5, 6, 0x223322, 0, 4, 0.8);
      tGroup.add(tBarrel);
      _scene.add(tGroup);
      _arrowTowers.push({
        group: tGroup, mesh: tBody, barrel: tBarrel,
        x: px, z: pz, range: 20,
        fireTimer: 0, fireCooldown: 1.5
      });
      _toast('Arrow Tower placed!', 2000, '#aaffaa');

    } else if (_selectedTool === 2) {
      // Cannon: 3x2x3
      if (_gold < COSTS.CANNON) { _toast('Not enough gold! (need ' + COSTS.CANNON + ')', 2000, '#ff4444'); return; }
      _gold -= COSTS.CANNON;
      var cGroup = new THREE.Group();
      var cpx = (Math.random() - 0.5) * 30;
      var cpz = -5 + (Math.random() - 0.5) * 20;
      cGroup.position.set(cpx, 0, cpz);
      var cBody = _makeBox(3, 2, 3, 0x333333, 0, 1, 0);
      cGroup.add(cBody);
      var cBarrel = _makeCylinder(0.35, 0.25, 2, 8, 0x222222, 0, 2, 1.2);
      cGroup.add(cBarrel);
      _scene.add(cGroup);
      _cannons.push({
        group: cGroup, mesh: cBody, x: cpx, z: cpz,
        fireTimer: 0, fireCooldown: 4
      });
      _toast('Cannon placed!', 2000, '#aaffaa');

    } else if (_selectedTool === 3) {
      // Boiling oil cauldron: 2x1x2
      if (_gold < COSTS.OIL) { _toast('Not enough gold! (need ' + COSTS.OIL + ')', 2000, '#ff4444'); return; }
      _gold -= COSTS.OIL;
      var opx = (Math.random() - 0.5) * 10;
      var opz = 20 + (Math.random() - 0.5) * 3;
      var oMesh = _makeBox(2, 1, 2, 0x222222, opx, 6.5, opz);
      _scene.add(oMesh);
      _oilCauldrons.push({ mesh: oMesh, x: opx, z: opz, active: false, timer: 0 });
      _toast('Boiling Oil placed on wall!', 2000, '#aaffaa');

    } else if (_selectedTool === 4) {
      // Spike trap: 3x0.5x3
      if (_gold < COSTS.SPIKE) { _toast('Not enough gold! (need ' + COSTS.SPIKE + ')', 2000, '#ff4444'); return; }
      _gold -= COSTS.SPIKE;
      var spx = (Math.random() - 0.5) * 20;
      var spz = 20 + (Math.random() - 0.5) * 8;
      var sMesh = _makeBox(3, 0.5, 3, 0x888888, spx, 0.25, spz);
      _scene.add(sMesh);
      // Add spike visuals
      for (var sk = 0; sk < 4; sk++) {
        var spike = _makeCylinder(0, 0.1, 0.8, 4, 0xaaaaaa,
          spx + (sk % 2 - 0.5) * 1.5, 0.9,
          spz + (Math.floor(sk / 2) - 0.5) * 1.5);
        _scene.add(spike);
      }
      _spikeTraps.push({ mesh: sMesh, x: spx, z: spz });
      _toast('Spike Trap placed!', 2000, '#aaffaa');

    } else if (_selectedTool === 5) {
      // Wall repair kit: restore 100 HP to most damaged wall
      if (_gold < COSTS.REPAIR) { _toast('Not enough gold! (need ' + COSTS.REPAIR + ')', 2000, '#ff4444'); return; }
      // Find most damaged wall
      var minHP = Infinity;
      var targetWall = -1;
      for (var wi = 0; wi < _wallSections.length; wi++) {
        if (_wallSections[wi].hp < minHP) {
          minHP = _wallSections[wi].hp;
          targetWall = wi;
        }
      }
      if (targetWall < 0 || _wallSections[targetWall].hp >= _wallSections[targetWall].maxHp) {
        _toast('All walls at full HP!', 2000, '#ffcc00');
        return;
      }
      _gold -= COSTS.REPAIR;
      _repairKits.push({ wallIdx: targetWall, timer: 20, totalTime: 20, hp: 100 });
      _toast('Repair Kit deployed! (20s build)', 3000, '#aaffaa');
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // FIRE ARROW
  // ──────────────────────────────────────────────────────────────────────────

  function _fireArrowAt(tower, attacker) {
    var ax = attacker.x;
    var az = attacker.z;
    var tx = tower.x;
    var tz = tower.z;
    var dx = ax - tx;
    var dz = az - tz;
    var dist = Math.sqrt(dx * dx + dz * dz) || 1;
    var spd = 25;
    var arrowMesh = _makeSphere(0.15, 0x996633, tx, 4, tz);
    _scene.add(arrowMesh);
    _arrows.push({
      mesh: arrowMesh,
      vx: (dx / dist) * spd,
      vy: 0.5,
      vz: (dz / dist) * spd,
      damage: 15,
      life: 2,
      targetId: _attackers.indexOf(attacker)
    });
  }

  function _fireCannonAt(cannon, targetX, targetZ) {
    var dx = targetX - cannon.x;
    var dz = targetZ - cannon.z;
    var dist = Math.sqrt(dx * dx + dz * dz) || 1;
    var spd = 18;
    var cbMesh = _makeSphere(0.4, 0x222222, cannon.x, 2, cannon.z);
    _scene.add(cbMesh);
    _cannonballs.push({
      mesh: cbMesh,
      vx: (dx / dist) * spd,
      vy: 8,
      vz: (dz / dist) * spd,
      damage: 80, splashR: 5,
      life: 4
    });
  }

  function _fireCatapultAt(attacker) {
    // Catapult fires boulder at a random wall section
    var wallIdx = Math.floor(Math.random() * _wallSections.length);
    var wall = _wallSections[wallIdx];
    var wx = wall.mesh.position.x;
    var wz = wall.mesh.position.z;
    var bMesh = _makeSphere(0.6, 0x8B6914, attacker.x, 2, attacker.z);
    _scene.add(bMesh);
    var dx = wx - attacker.x;
    var dz = wz - attacker.z;
    var dist = Math.sqrt(dx * dx + dz * dz) || 1;
    var spd = 14;
    _enemyBoulders.push({
      mesh: bMesh,
      vx: (dx / dist) * spd,
      vy: 10,
      vz: (dz / dist) * spd,
      damage: 40,
      life: 5,
      wallIdx: wallIdx
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DAMAGE / DEATH HELPERS
  // ──────────────────────────────────────────────────────────────────────────

  function _damageAttacker(attacker, dmg) {
    attacker.hp -= dmg;
    if (attacker.hp <= 0) {
      _killAttacker(attacker);
    } else {
      // Flash red briefly
      if (attacker.mesh && attacker.mesh.material) {
        attacker.mesh.material.color.setHex(0xff2222);
        setTimeout(function () {
          if (attacker.mesh && attacker.mesh.material) {
            attacker.mesh.material.color.setHex(_getAttackerColor(attacker.type));
          }
        }, 150);
      }
    }
  }

  function _getAttackerColor(type) {
    if (type === 'soldier')    return 0x884422;
    if (type === 'ladder')     return 0x774422;
    if (type === 'ram')        return 0x8B6914;
    if (type === 'catapult')   return 0x7B5B2A;
    if (type === 'siegetower') return 0x8B7355;
    if (type === 'commander')  return 0x880000;
    return 0x884422;
  }

  function _killAttacker(attacker) {
    // Gold reward
    _gold += attacker.reward;
    _spawnGoldPickup(attacker.x, attacker.z, attacker.reward);

    // Remove mesh from scene
    _scene.remove(attacker.mesh);
    if (attacker.mesh.geometry) attacker.mesh.geometry.dispose();
    if (attacker.mesh.material) attacker.mesh.material.dispose();

    // Remove ladder if present
    if (attacker.ladderMesh) {
      _scene.remove(attacker.ladderMesh);
      if (attacker.ladderMesh.geometry) attacker.ladderMesh.geometry.dispose();
      if (attacker.ladderMesh.material) attacker.ladderMesh.material.dispose();
    }

    // Remove from array
    var idx = _attackers.indexOf(attacker);
    if (idx >= 0) _attackers.splice(idx, 1);

    // Score
    var scoreAdd = attacker.type === 'commander' ? 500 :
                   attacker.reward === 50 ? 100 : 20;
    _addScore(scoreAdd);
  }

  function _spawnGoldPickup(x, z, amount) {
    var gMesh = _makeBox(0.4, 0.4, 0.4, 0xFFD700, x, 0.5, z);
    _scene.add(gMesh);
    _goldPickups.push({ mesh: gMesh, x: x, z: z, life: 5, amount: amount });
  }

  function _addScore(pts) {
    if (typeof window._score !== 'undefined') {
      window._score = (window._score || 0) + pts;
    }
  }

  function _damageWall(wallIdx, dmg) {
    if (wallIdx < 0 || wallIdx >= _wallSections.length) return;
    var ws = _wallSections[wallIdx];
    ws.hp -= dmg;
    if (ws.hp <= 0) {
      ws.hp = 0;
      if (!ws.breached) {
        ws.breached = true;
        // Visual: darken wall
        if (ws.mesh && ws.mesh.material) {
          ws.mesh.material.color.setHex(0x443322);
        }
        _toast('WALL BREACHED! Enemies pouring through!', 4000, '#ff2200');
      }
    } else {
      // Tint wall by damage
      var frac = ws.hp / ws.maxHp;
      var r = Math.round(0x66 + (0x44 - 0x66) * (1 - frac));
      var g = Math.round(0x88 + (0x33 - 0x88) * (1 - frac));
      var b = Math.round(0x66 + (0x22 - 0x66) * (1 - frac));
      if (ws.mesh && ws.mesh.material) {
        ws.mesh.material.color.setHex((r << 16) | (g << 8) | b);
      }
    }
  }

  function _damageGate(dmg) {
    _gateHP -= dmg;
    if (_gateHP <= 0) {
      _gateHP = 0;
      if (_gateMesh && _gateMesh.material) {
        _gateMesh.material.color.setHex(0x221111);
      }
      _toast('GATE DESTROYED! Enemies flooding in!', 4000, '#ff0000');
    } else {
      var frac = _gateHP / _gateMaxHP;
      var col = Math.round(0x55 * frac + 0x22 * (1 - frac));
      if (_gateMesh && _gateMesh.material) {
        _gateMesh.material.color.setHex((col << 16) | (0x22 << 8) | 0x11);
      }
    }
  }

  function _damageKeep(dmg) {
    _keepHP -= dmg;
    if (_keepHP <= 0) {
      _keepHP = 0;
      _gameOver = true;
      _toast('KEEP FALLEN! YOU HAVE BEEN DEFEATED!', 8000, '#ff0000');
      setTimeout(_deactivate, 6000);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // UPDATE LOOP
  // ──────────────────────────────────────────────────────────────────────────

  function _update(dt) {
    if (!_active || _gameOver || _victory) return;

    // Wave management
    if (_inRest) {
      _restTimer -= dt;
      if (_restTimer <= 0) {
        _inRest = false;
        _currentWave++;
        if (_currentWave > _totalWaves) {
          _victory = true;
          _addScore(3000);
          _toast('VICTORY! All 8 waves repelled! +3000 score', 8000, '#00ff88');
          setTimeout(_deactivate, 7000);
          return;
        }
        _waveActive = true;
        _spawnWave(_currentWave - 1);
        _toast('WAVE ' + _currentWave + ' OF ' + _totalWaves + ' — INCOMING!', 3000, '#ff8800');
      }
    } else if (_waveActive && _attackers.length === 0) {
      // Wave cleared
      _waveActive = false;
      if (_currentWave < _totalWaves) {
        _inRest = true;
        _restTimer = 12;
        _toast('Wave ' + _currentWave + ' cleared! Next wave in 12s', 4000, '#aaffaa');
      }
    }

    // Update attackers
    _updateAttackers(dt);

    // Update arrow towers
    _updateArrowTowers(dt);

    // Update cannons
    _updateCannons(dt);

    // Update oil cauldrons
    _updateOilCauldrons(dt);

    // Update arrows
    _updateArrows(dt);

    // Update cannonballs
    _updateCannonballs(dt);

    // Update enemy boulders
    _updateEnemyBoulders(dt);

    // Update repair kits
    _updateRepairKits(dt);

    // Update gold pickups
    _updateGoldPickups(dt);

    // HUD
    _updateHUD();
  }

  function _updateAttackers(dt) {
    for (var i = _attackers.length - 1; i >= 0; i--) {
      var a = _attackers[i];
      if (!a || !a.mesh) continue;

      // Catapult: stop at range and fire
      if (a.type === 'catapult') {
        var distToBase = Math.sqrt(a.x * a.x + a.z * a.z);
        if (distToBase > 40 && !a.stoppedAtRange) {
          // Move closer
          var dx2 = a.targetX - a.x;
          var dz2 = a.targetZ - a.z;
          var d2 = Math.sqrt(dx2 * dx2 + dz2 * dz2) || 1;
          a.x += (dx2 / d2) * a.speed * dt;
          a.z += (dz2 / d2) * a.speed * dt;
          a.mesh.position.set(a.x, 0, a.z);
        } else {
          a.stoppedAtRange = true;
          a.attackTimer += dt;
          if (a.attackTimer >= a.attackCooldown) {
            a.attackTimer = 0;
            _fireCatapultAt(a);
          }
        }
        continue;
      }

      // Move toward target
      var tx = a.targetX;
      var tz = a.targetZ;
      var ddx = tx - a.x;
      var ddz = tz - a.z;
      var dd = Math.sqrt(ddx * ddx + ddz * ddz);

      // Check spike traps — slow down + damage
      var onSpike = false;
      for (var si = 0; si < _spikeTraps.length; si++) {
        var sp = _spikeTraps[si];
        var sdx = a.x - sp.x;
        var sdz = a.z - sp.z;
        if (Math.abs(sdx) < 2 && Math.abs(sdz) < 2) {
          onSpike = true;
          _damageAttacker(a, 20 * dt);
          if (i >= _attackers.length || _attackers[i] !== a) break;
          break;
        }
      }
      if (i >= _attackers.length || _attackers[i] !== a) continue;

      var effectiveSpeed = onSpike ? a.speed * 0.5 : a.speed;

      if (dd > 0.5) {
        a.x += (ddx / dd) * effectiveSpeed * dt;
        a.z += (ddz / dd) * effectiveSpeed * dt;
        a.mesh.position.set(a.x, a.type === 'siegetower' ? 0 : (a.type === 'ram' ? 1 : 1), a.z);
      } else {
        // At target — attack!
        a.attackTimer += dt;
        if (a.attackTimer >= a.attackCooldown) {
          a.attackTimer = 0;

          if (a.type === 'ram') {
            _damageGate(a.damage);
          } else if (a.type === 'siegetower') {
            // Damage wall
            _damageWall(0, a.damage);
            _damageKeep(5);
          } else if (a.type === 'ladder') {
            // Scale wall — damage keep
            _damageKeep(a.damage);
          } else {
            // soldier / commander: if gate destroyed or wall breached, damage keep
            var gateOpen = _gateHP <= 0;
            var anyBreached = false;
            for (var wb = 0; wb < _wallSections.length; wb++) {
              if (_wallSections[wb].breached) { anyBreached = true; break; }
            }
            if (gateOpen || anyBreached) {
              _damageKeep(a.damage);
            } else {
              _damageGate(a.damage);
            }
          }
        }
      }

      // Update ladder mesh position if any
      if (a.ladderMesh) {
        a.ladderMesh.position.set(a.x, 4, a.z);
      }
    }
  }

  function _updateArrowTowers(dt) {
    for (var ti = 0; ti < _arrowTowers.length; ti++) {
      var tower = _arrowTowers[ti];
      tower.fireTimer += dt;
      if (tower.fireTimer < tower.fireCooldown) continue;

      // Find nearest non-immune attacker in range
      var nearest = null;
      var nearDist = Infinity;
      for (var ai = 0; ai < _attackers.length; ai++) {
        var atk = _attackers[ai];
        if (atk.immune) continue;  // immune to arrow towers
        var dx = atk.x - tower.x;
        var dz = atk.z - tower.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist <= tower.range && dist < nearDist) {
          nearDist = dist;
          nearest = atk;
        }
      }
      if (nearest) {
        tower.fireTimer = 0;
        _fireArrowAt(tower, nearest);
      }
    }
  }

  function _updateCannons(dt) {
    for (var ci = 0; ci < _cannons.length; ci++) {
      var cannon = _cannons[ci];
      cannon.fireTimer += dt;
      if (cannon.fireTimer < cannon.fireCooldown) continue;

      // Fire at the largest cluster of enemies within range 35
      if (_attackers.length === 0) continue;
      // Find best target (closest enemy cluster center)
      var bestX = 0, bestZ = 22;
      var nearest2 = null;
      var nearDist2 = Infinity;
      for (var ai2 = 0; ai2 < _attackers.length; ai2++) {
        var a2 = _attackers[ai2];
        var ddx2 = a2.x - cannon.x;
        var ddz2 = a2.z - cannon.z;
        var dist2 = Math.sqrt(ddx2 * ddx2 + ddz2 * ddz2);
        if (dist2 < nearDist2 && dist2 < 40) {
          nearDist2 = dist2;
          nearest2 = a2;
          bestX = a2.x;
          bestZ = a2.z;
        }
      }
      if (nearest2) {
        cannon.fireTimer = 0;
        _fireCannonAt(cannon, bestX, bestZ);
      }
    }
  }

  function _updateOilCauldrons(dt) {
    for (var oi = 0; oi < _oilCauldrons.length; oi++) {
      var oil = _oilCauldrons[oi];
      if (oil.active) {
        oil.timer -= dt;
        if (oil.timer <= 0) {
          oil.active = false;
        } else {
          // Kill zone: 6 units wide, 10s — damage nearby enemies
          for (var ai3 = _attackers.length - 1; ai3 >= 0; ai3--) {
            var atk3 = _attackers[ai3];
            var dx3 = atk3.x - oil.x;
            var dz3 = atk3.z - oil.z;
            if (Math.abs(dx3) < 3 && Math.abs(dz3) < 8) {
              _damageAttacker(atk3, 50 * dt);
              if (ai3 >= _attackers.length) break;
            }
          }
        }
      } else {
        // Auto-pour if enemies are below
        for (var ai4 = 0; ai4 < _attackers.length; ai4++) {
          var atk4 = _attackers[ai4];
          var dx4 = atk4.x - oil.x;
          var dz4 = atk4.z - (oil.z - 5);
          if (Math.abs(dx4) < 4 && Math.abs(dz4) < 6) {
            oil.active = true;
            oil.timer = 10;
            _toast('Boiling oil poured!', 2000, '#ff8800');
            break;
          }
        }
      }
    }
  }

  function _updateArrows(dt) {
    for (var i = _arrows.length - 1; i >= 0; i--) {
      var ar = _arrows[i];
      ar.life -= dt;
      ar.mesh.position.x += ar.vx * dt;
      ar.mesh.position.y += ar.vy * dt;
      ar.mesh.position.z += ar.vz * dt;

      // Check hits
      var hit = false;
      for (var ai = _attackers.length - 1; ai >= 0; ai--) {
        var atk = _attackers[ai];
        var dx = ar.mesh.position.x - atk.x;
        var dy = ar.mesh.position.y - 1.5;
        var dz = ar.mesh.position.z - atk.z;
        if (dx * dx + dy * dy + dz * dz < 1.5) {
          _damageAttacker(atk, ar.damage);
          hit = true;
          break;
        }
      }

      if (hit || ar.life <= 0) {
        _scene.remove(ar.mesh);
        if (ar.mesh.geometry) ar.mesh.geometry.dispose();
        if (ar.mesh.material) ar.mesh.material.dispose();
        _arrows.splice(i, 1);
      }
    }
  }

  function _updateCannonballs(dt) {
    var GRAVITY = 12;
    for (var i = _cannonballs.length - 1; i >= 0; i--) {
      var cb = _cannonballs[i];
      cb.life -= dt;
      cb.vy -= GRAVITY * dt;
      cb.mesh.position.x += cb.vx * dt;
      cb.mesh.position.y += cb.vy * dt;
      cb.mesh.position.z += cb.vz * dt;

      // Hit ground or enemies
      var exploded = false;
      if (cb.mesh.position.y <= 0.5 || cb.life <= 0) {
        exploded = true;
      }

      if (exploded) {
        // Splash damage to all enemies within splashR
        for (var ai = _attackers.length - 1; ai >= 0; ai--) {
          var atk = _attackers[ai];
          var dx = cb.mesh.position.x - atk.x;
          var dz = cb.mesh.position.z - atk.z;
          if (dx * dx + dz * dz < cb.splashR * cb.splashR) {
            _damageAttacker(atk, cb.damage);
            if (ai >= _attackers.length) continue;
          }
        }
        _scene.remove(cb.mesh);
        if (cb.mesh.geometry) cb.mesh.geometry.dispose();
        if (cb.mesh.material) cb.mesh.material.dispose();
        _cannonballs.splice(i, 1);
      }
    }
  }

  function _updateEnemyBoulders(dt) {
    var GRAVITY = 10;
    for (var i = _enemyBoulders.length - 1; i >= 0; i--) {
      var eb = _enemyBoulders[i];
      eb.life -= dt;
      eb.vy -= GRAVITY * dt;
      eb.mesh.position.x += eb.vx * dt;
      eb.mesh.position.y += eb.vy * dt;
      eb.mesh.position.z += eb.vz * dt;

      var hit = false;
      if (eb.mesh.position.y <= 4 && eb.life < 4) {
        // Hit a wall
        _damageWall(eb.wallIdx !== undefined ? eb.wallIdx : 0, eb.damage);
        hit = true;
      }
      if (hit || eb.life <= 0 || eb.mesh.position.y < 0) {
        _scene.remove(eb.mesh);
        if (eb.mesh.geometry) eb.mesh.geometry.dispose();
        if (eb.mesh.material) eb.mesh.material.dispose();
        _enemyBoulders.splice(i, 1);
      }
    }
  }

  function _updateRepairKits(dt) {
    for (var i = _repairKits.length - 1; i >= 0; i--) {
      var rk = _repairKits[i];
      rk.timer -= dt;
      if (rk.timer <= 0) {
        // Complete repair
        var ws = _wallSections[rk.wallIdx];
        if (ws) {
          ws.hp = Math.min(ws.hp + rk.hp, ws.maxHp);
          if (ws.hp > 0 && ws.breached) {
            ws.breached = false;
            if (ws.mesh && ws.mesh.material) {
              ws.mesh.material.color.setHex(0x668866);
            }
          }
          _toast('Wall repaired! HP: ' + Math.round(ws.hp) + '/' + ws.maxHp, 3000, '#aaffaa');
        }
        _repairKits.splice(i, 1);
      }
    }
  }

  function _updateGoldPickups(dt) {
    for (var i = _goldPickups.length - 1; i >= 0; i--) {
      var gp = _goldPickups[i];
      gp.life -= dt;
      gp.mesh.position.y = 0.5 + Math.sin(Date.now() * 0.004 + i) * 0.2;
      gp.mesh.rotation.y += dt * 2;
      if (gp.life <= 0) {
        _scene.remove(gp.mesh);
        if (gp.mesh.geometry) gp.mesh.geometry.dispose();
        if (gp.mesh.material) gp.mesh.material.dispose();
        _goldPickups.splice(i, 1);
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // HUD
  // ──────────────────────────────────────────────────────────────────────────

  function _ensureHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'siege-defense-hud';
    _hudEl.style.cssText = [
      'display:none',
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:15px',
      'font-weight:bold',
      'color:#aaffaa',
      'text-shadow:0 0 8px rgba(0,255,128,0.7)',
      'z-index:210',
      'pointer-events:none',
      'text-align:center',
      'background:rgba(0,0,0,0.55)',
      'padding:6px 14px',
      'border-radius:6px',
      'line-height:1.5'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    if (!_active) { _hudEl.style.display = 'none'; return; }
    _hudEl.style.display = 'block';

    var northWall = _wallSections[0];
    var wallHP = northWall ? Math.round(northWall.hp) : 0;
    var wallMax = northWall ? northWall.maxHp : 200;

    var toolNames = ['', 'ARROW TOWER(80g)', 'CANNON(150g)', 'OIL(40g)', 'SPIKES(60g)', 'REPAIR(100g)'];
    var toolLine = _selectedTool ? ' | TOOL: [' + toolNames[_selectedTool] + '] press E to place' : ' | TOOL: press 1-5';

    var waveStr = _inRest
      ? 'PREPARING [WAVE: ' + (_currentWave + 1) + '/' + _totalWaves + ' in ' + Math.ceil(_restTimer) + 's]'
      : 'DEFENSE [WAVE: ' + _currentWave + '/' + _totalWaves + ']';

    _hudEl.innerHTML =
      waveStr +
      ' [WALL: ' + wallHP + '/' + wallMax + ' HP]' +
      ' [GATE: ' + Math.round(_gateHP) + '/' + _gateMaxHP + ']' +
      ' [KEEP: ' + Math.round(_keepHP) + '/' + _keepMaxHP + ']' +
      ' [GOLD: ' + _gold + ']' +
      ' [TOWERS: ' + _arrowTowers.length + ']' +
      ' | ENEMIES: ' + _attackers.length + ' INBOUND' +
      toolLine;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TOAST
  // ──────────────────────────────────────────────────────────────────────────

  function _toast(msg, ms, color) {
    ms = ms || 3000;
    color = color || '#ffffff';
    if (typeof window.HUD !== 'undefined' && window.HUD.showToast) {
      window.HUD.showToast(msg, ms, color);
      return;
    }
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed', 'top:70px', 'left:50%', 'transform:translateX(-50%)',
      'font-family:monospace', 'font-size:16px', 'font-weight:bold',
      'color:' + color, 'z-index:999', 'pointer-events:none',
      'text-shadow:0 0 8px rgba(0,0,0,0.9)',
      'background:rgba(0,0,0,0.6)', 'padding:4px 14px', 'border-radius:4px'
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, ms);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SCENE SETUP
  // ──────────────────────────────────────────────────────────────────────────

  function _getScene() {
    if (_scene) return _scene;
    if (typeof GameManager !== 'undefined' && GameManager.getScene) {
      _scene = GameManager.getScene();
    }
    if (!_scene && typeof window._gameScene !== 'undefined') {
      _scene = window._gameScene;
    }
    return _scene;
  }

  function _getCamera() {
    if (_camera) return _camera;
    if (typeof GameManager !== 'undefined' && GameManager.getCamera) {
      _camera = GameManager.getCamera();
    }
    if (!_camera && typeof window._gameCamera !== 'undefined') {
      _camera = window._gameCamera;
    }
    return _camera;
  }

  function _getRenderer() {
    if (_renderer) return _renderer;
    if (typeof GameManager !== 'undefined' && GameManager.getRenderer) {
      _renderer = GameManager.getRenderer();
    }
    if (!_renderer && typeof window._gameRenderer !== 'undefined') {
      _renderer = window._gameRenderer;
    }
    return _renderer;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ACTIVATE / DEACTIVATE
  // ──────────────────────────────────────────────────────────────────────────

  function _activate() {
    if (_active) return;
    _getScene();
    _getCamera();
    _getRenderer();
    if (!_scene) {
      _toast('SiegeDefense: No scene found', 2000, '#ff4444');
      return;
    }

    _active = true;
    _gameOver = false;
    _victory = false;
    _currentWave = 0;
    _waveActive = false;
    _inRest = true;
    _restTimer = 5;  // 5 second countdown before wave 1
    _gold = 200;
    _keepHP = 500;
    _keepMaxHP = 500;
    _gateHP = 300;
    _gateMaxHP = 300;
    _attackers = [];
    _arrows = [];
    _cannonballs = [];
    _enemyBoulders = [];
    _goldPickups = [];
    _arrowTowers = [];
    _cannons = [];
    _oilCauldrons = [];
    _spikeTraps = [];
    _repairKits = [];
    _selectedTool = 0;

    _buildBase();

    // Setup lighting if needed
    if (_scene.getObjectByName('sd_ambient') === undefined || _scene.getObjectByName('sd_ambient') === null) {
      var ambLight = new THREE.AmbientLight(0xffffff, 0.5);
      ambLight.name = 'sd_ambient';
      _scene.add(ambLight);
      var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
      dirLight.name = 'sd_dir';
      dirLight.position.set(30, 50, 30);
      _scene.add(dirLight);
    }

    // Camera position overhead
    if (_camera) {
      _camera.position.set(0, 60, 40);
      _camera.lookAt(0, 0, 0);
    }

    _clock = new THREE.Clock();

    _ensureHUD();
    _updateHUD();
    _toast('SIEGE DEFENSE ACTIVE — Survive 8 waves! Press 1-5 to select tools, E to place', 5000, '#aaffaa');

    _animLoop();
  }

  function _deactivate() {
    if (!_active) return;
    _active = false;

    // Clean up all meshes
    if (_baseGroup) {
      _scene.remove(_baseGroup);
      _baseGroup = null;
    }

    for (var i = 0; i < _attackers.length; i++) {
      if (_attackers[i].mesh) _scene.remove(_attackers[i].mesh);
      if (_attackers[i].ladderMesh) _scene.remove(_attackers[i].ladderMesh);
    }
    _attackers = [];

    for (var j = 0; j < _arrows.length; j++) {
      if (_arrows[j].mesh) _scene.remove(_arrows[j].mesh);
    }
    _arrows = [];

    for (var k = 0; k < _cannonballs.length; k++) {
      if (_cannonballs[k].mesh) _scene.remove(_cannonballs[k].mesh);
    }
    _cannonballs = [];

    for (var l = 0; l < _enemyBoulders.length; l++) {
      if (_enemyBoulders[l].mesh) _scene.remove(_enemyBoulders[l].mesh);
    }
    _enemyBoulders = [];

    for (var m = 0; m < _goldPickups.length; m++) {
      if (_goldPickups[m].mesh) _scene.remove(_goldPickups[m].mesh);
    }
    _goldPickups = [];

    for (var n = 0; n < _arrowTowers.length; n++) {
      if (_arrowTowers[n].group) _scene.remove(_arrowTowers[n].group);
    }
    _arrowTowers = [];

    for (var o = 0; o < _cannons.length; o++) {
      if (_cannons[o].group) _scene.remove(_cannons[o].group);
    }
    _cannons = [];

    for (var p = 0; p < _oilCauldrons.length; p++) {
      if (_oilCauldrons[p].mesh) _scene.remove(_oilCauldrons[p].mesh);
    }
    _oilCauldrons = [];

    for (var q = 0; q < _spikeTraps.length; q++) {
      if (_spikeTraps[q].mesh) _scene.remove(_spikeTraps[q].mesh);
    }
    _spikeTraps = [];

    _wallSections = [];
    _cornerTowers = [];
    _barricades = [];
    _repairKits = [];

    // Remove ambient/dir lights added by us
    var sdAmb = _scene.getObjectByName('sd_ambient');
    if (sdAmb) _scene.remove(sdAmb);
    var sdDir = _scene.getObjectByName('sd_dir');
    if (sdDir) _scene.remove(sdDir);

    if (_animId) { cancelAnimationFrame(_animId); _animId = null; }
    if (_hudEl) { _hudEl.style.display = 'none'; }

    _toast('Siege Defense ended.', 2000, '#aaaaaa');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ANIM LOOP
  // ──────────────────────────────────────────────────────────────────────────

  function _animLoop() {
    if (!_active) return;
    _animId = requestAnimationFrame(_animLoop);
    var dt = _clock ? _clock.getDelta() : 0.016;
    if (dt > 0.1) dt = 0.1;
    _update(dt);
    if (_renderer && _scene && _camera) {
      _renderer.render(_scene, _camera);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // INPUT
  // ──────────────────────────────────────────────────────────────────────────

  function _onKeyDown(e) {
    var key = e.key ? e.key.toUpperCase() : '';
    _keys[key] = true;

    // Activation: S + D within 400ms
    if (key === 'S' || key === 'D') {
      _keyTimes[key] = Date.now();
      var other = key === 'S' ? 'D' : 'S';
      if (_keyTimes[other] && (Date.now() - _keyTimes[other]) <= _ACTIVATION_WINDOW) {
        if (_active) {
          _deactivate();
        } else {
          _activate();
        }
        _keyTimes = {};
        return;
      }
    }

    if (!_active) return;

    // Tool selection 1-5
    if (key === '1') _selectedTool = 1;
    if (key === '2') _selectedTool = 2;
    if (key === '3') _selectedTool = 3;
    if (key === '4') _selectedTool = 4;
    if (key === '5') _selectedTool = 5;

    // Place tool with E
    if (key === 'E') {
      if (_selectedTool > 0) {
        _placeSelectedTool();
      }
    }

    // Reinforce gate with G (costs 50 gold)
    if (key === 'G') {
      if (_gold >= COSTS.GATE_REINFORCE) {
        _gold -= COSTS.GATE_REINFORCE;
        _gateHP = Math.min(_gateHP + 100, _gateMaxHP + 100);
        _gateMaxHP = Math.max(_gateMaxHP, _gateHP);
        _toast('Gate reinforced! HP: ' + Math.round(_gateHP), 2000, '#aaffaa');
      } else {
        _toast('Need 50 gold to reinforce gate!', 2000, '#ff4444');
      }
    }

    _updateHUD();
  }

  function _onKeyUp(e) {
    var key = e.key ? e.key.toUpperCase() : '';
    _keys[key] = false;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // INIT
  // ──────────────────────────────────────────────────────────────────────────

  function _init() {
    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup', _onKeyUp);
    _ensureHUD();
  }

  _init();

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    activate:   _activate,
    deactivate: _deactivate,
    isActive:   function () { return _active; },
    getGold:    function () { return _gold; },
    getWave:    function () { return _currentWave; },
    addGold:    function (amt) { _gold += amt; }
  };
}());
