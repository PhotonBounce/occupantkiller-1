/* ════════════════════════════════════════════════════════════════════
 *  ENEMY ENGINEER (Sapper / Combat Engineer)
 *  ─────────────────────────────────────────────────────────────────
 *  Tactical engineer enemy that plants IEDs, wall charges, and
 *  repairs nearby allies/vehicles.
 *
 *  States: MOVE → PLANT_MINE → PLANT_CHARGE → REPAIR → RETREAT
 *
 *  Public API  (window.EnemyEngineer):
 *    init()          — call once at startup
 *    update(delta)   — per-frame update
 *    spawn(scene, x, y, z)  — manually spawn an engineer
 *    getAll()        — returns _engineers array
 *    reset()         — clear all engineers, IEDs, charges
 *
 *  Globals written:
 *    window._ieds[]          — planted IED objects (for other systems)
 *    window._engineers[]     — active engineer objects (read-only)
 * ════════════════════════════════════════════════════════════════════ */

window.EnemyEngineer = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────
  var ENGINEER_HP        = 100;
  var MOVE_SPEED         = 2.5;    // m/s normal approach
  var RETREAT_SPEED      = 4.0;    // m/s when retreating
  var PREFER_RANGE_MIN   = 15;     // preferred engagement range
  var PREFER_RANGE_MAX   = 25;
  var RETREAT_DIST       = 6;      // player closer than this → retreat
  var MINE_INTERVAL      = 12;     // seconds between mine plants
  var MINE_PLANT_TIME    = 2.0;    // seconds crouched to plant
  var WALL_CHECK_DIST    = 2.0;    // metres to check for voxel cover
  var CHARGE_DELAY       = 5.0;    // seconds before wall charge detonates
  var CHARGE_PLANT_TIME  = 2.5;    // seconds to attach charge to wall
  var REPAIR_RANGE       = 5.0;    // metres to seek repairable ally
  var REPAIR_TIME        = 3.0;    // seconds of repair animation
  var REPAIR_AMOUNT      = 50;     // HP restored per repair
  var ALLY_HEAL_RANGE    = 3.0;    // raise-fallen radius
  var ALLY_HEAL_AMOUNT   = 50;
  var PISTOL_DMG         = 15;     // pistol damage (after charges expended)
  var MAX_CHARGES        = 3;      // explosive kits
  var MAX_ENGINEERS      = 3;      // concurrent cap
  var IED_DETECT_RANGE   = 1.5;    // metres for player IED detection
  var SCORE_KILL         = 300;
  var SCORE_DEFUSE       = 150;

  // Mesh colours
  var COLOR_BODY         = 0x7A6B45;  // dark tan camo
  var COLOR_HEAD         = 0xC8A87A;  // skin
  var COLOR_HELMET       = 0x4A4A30;  // dark olive helmet
  var COLOR_BELT         = 0x3B2A1A;  // dark brown tool belt
  var COLOR_CUTTER       = 0x888888;  // wire cutter metal
  var COLOR_IED          = 0x556633;  // olive IED box
  var COLOR_CHARGE       = 0x8B1A1A;  // dark red wall charge
  var COLOR_PICKUP       = 0xFFAA00;  // wire cutter pickup (yellow)

  // ── Module state ───────────────────────────────────────────────────
  var _initialized  = false;
  var _scene        = null;

  // ── Registries ─────────────────────────────────────────────────────
  window._ieds       = window._ieds      || [];   // global IED list
  window._engineers  = window._engineers || [];   // global engineer list

  // Local aliases
  var _engineers = window._engineers;
  var _ieds      = window._ieds;

  // Pickups waiting to be collected
  var _pickups = [];    // { mesh, type, pos }

  // Wall-charge timers (live objects)
  var _wallCharges = []; // { mesh, timer, wx, wy, wz }

  // ══════════════════════════════════════════════════════════════════
  //  HELPERS
  // ══════════════════════════════════════════════════════════════════

  function _getScene() {
    if (_scene) return _scene;
    _scene = (window._gameScene) ||
             (window.GameManager && window.GameManager.getScene && window.GameManager.getScene()) ||
             null;
    return _scene;
  }

  function _getPlayer() {
    return (window.GameManager && window.GameManager.getPlayer && window.GameManager.getPlayer()) ||
           window._player || null;
  }

  function _dist2(a, b) {
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

  function _addScore(pts) {
    try {
      if (window.GameManager && window.GameManager.addScore) { window.GameManager.addScore(pts); return; }
      if (window._score !== undefined) { window._score += pts; }
    } catch (e) {}
  }

  function _hudToast(msg, color, duration) {
    try {
      if (window.HUD) {
        if (window.HUD.showToast)    { window.HUD.showToast(msg, duration || 2500, color || '#ffdd00'); return; }
        if (window.HUD.notifyPickup) { window.HUD.notifyPickup(msg, color || '#ffdd00'); return; }
      }
    } catch (e) {}
  }

  function _groundY(x, z) {
    try {
      if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTopSolidY) {
        return VoxelWorld.getTopSolidY(x, z) || 0;
      }
    } catch (e) {}
    return 0;
  }

  // Check if any voxel block is within WALL_CHECK_DIST of position
  function _nearVoxel(pos) {
    try {
      if (typeof VoxelWorld !== 'undefined' && VoxelWorld.isSolid) {
        var bx = Math.round(pos.x);
        var by = Math.round(pos.y);
        var bz = Math.round(pos.z);
        for (var dx = -2; dx <= 2; dx++) {
          for (var dz = -2; dz <= 2; dz++) {
            if (Math.abs(dx) < 0.01 && Math.abs(dz) < 0.01) continue;
            if (VoxelWorld.isSolid(bx + dx, by, bz + dz) ||
                VoxelWorld.isSolid(bx + dx, by + 1, bz + dz)) {
              var dist = Math.sqrt(dx * dx + dz * dz);
              if (dist <= WALL_CHECK_DIST) {
                return { bx: bx + dx, by: by, bz: bz + dz };
              }
            }
          }
        }
      }
    } catch (e) {}
    return null;
  }

  // Remove a 2×2 block area from VoxelWorld (wall charge detonation)
  function _blastWall(bx, by, bz) {
    try {
      if (typeof VoxelWorld !== 'undefined' && VoxelWorld.setBlock) {
        for (var dy = 0; dy <= 1; dy++) {
          for (var dx = -1; dx <= 0; dx++) {
            for (var dz = -1; dz <= 0; dz++) {
              VoxelWorld.setBlock(bx + dx, by + dy, bz + dz, 0);
            }
          }
        }
      }
    } catch (e) {}
  }

  // Small explosion visual at position
  function _spawnExplosion(pos) {
    var sc = _getScene();
    if (!sc) return;
    try {
      var geo = new THREE.SphereGeometry(1.5, 8, 8);
      var mat = new THREE.MeshBasicMaterial({ color: 0xFF6600, transparent: true, opacity: 0.85 });
      var sphere = new THREE.Mesh(geo, mat);
      sphere.position.copy(pos);
      sc.add(sphere);
      setTimeout(function () {
        if (sc) sc.remove(sphere);
        if (geo) geo.dispose();
        if (mat) mat.dispose();
      }, 400);
    } catch (e) {}
  }

  // ══════════════════════════════════════════════════════════════════
  //  MESH BUILDER
  // ══════════════════════════════════════════════════════════════════

  function _buildEngineerMesh(sc) {
    var group = new THREE.Group();

    // Body (CylinderGeometry — 0.28r, 0.28r, 1.7h)
    var bodyGeo = new THREE.CylinderGeometry(0.28, 0.28, 1.7, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: COLOR_BODY });
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.85;
    group.add(body);

    // Head (SphereGeometry)
    var headGeo = new THREE.SphereGeometry(0.2, 8, 6);
    var headMat = new THREE.MeshLambertMaterial({ color: COLOR_HEAD });
    var head    = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.9;
    group.add(head);

    // Helmet — flat wider cylinder on top of head
    var helmGeo = new THREE.CylinderGeometry(0.25, 0.27, 0.12, 8);
    var helmMat = new THREE.MeshLambertMaterial({ color: COLOR_HELMET });
    var helm    = new THREE.Mesh(helmGeo, helmMat);
    helm.position.y = 2.02;
    group.add(helm);

    // Tool belt — thin torus around waist
    var beltGeo = new THREE.TorusGeometry(0.30, 0.04, 6, 16);
    var beltMat = new THREE.MeshLambertMaterial({ color: COLOR_BELT });
    var belt    = new THREE.Mesh(beltGeo, beltMat);
    belt.position.y = 0.55;
    belt.rotation.x = Math.PI / 2;
    group.add(belt);

    // Wire cutters — right hand (two thin cylinders forming handles)
    var cutGeo  = new THREE.CylinderGeometry(0.025, 0.025, 0.22, 5);
    var cutMat  = new THREE.MeshLambertMaterial({ color: COLOR_CUTTER });
    var cutA    = new THREE.Mesh(cutGeo, cutMat);
    cutA.position.set(0.35, 0.95, 0.12);
    cutA.rotation.z = 0.3;
    group.add(cutA);

    var cutB = new THREE.Mesh(cutGeo, cutMat);
    cutB.position.set(0.35, 0.90, 0.05);
    cutB.rotation.z = -0.3;
    group.add(cutB);

    sc.add(group);

    group.userData.head = head;
    group.userData.body = body;

    return group;
  }

  // IED mesh — BoxGeometry 0.15 size, olive, placed on ground
  function _buildIEDMesh(sc, x, y, z) {
    var geo  = new THREE.BoxGeometry(0.15, 0.08, 0.15);
    var mat  = new THREE.MeshLambertMaterial({ color: COLOR_IED });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + 0.04, z);
    sc.add(mesh);
    return mesh;
  }

  // Wall-charge mesh — small box clamped to wall
  function _buildChargeMesh(sc, x, y, z) {
    var geo  = new THREE.BoxGeometry(0.22, 0.18, 0.08);
    var mat  = new THREE.MeshLambertMaterial({ color: COLOR_CHARGE });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + 1.0, z);
    sc.add(mesh);
    return mesh;
  }

  // Wire-cutter pickup mesh
  function _buildPickupMesh(sc, x, y, z) {
    var geo  = new THREE.CylinderGeometry(0.08, 0.08, 0.25, 6);
    var mat  = new THREE.MeshLambertMaterial({ color: COLOR_PICKUP });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + 0.18, z);
    sc.add(mesh);
    return mesh;
  }

  // ══════════════════════════════════════════════════════════════════
  //  SPAWNING
  // ══════════════════════════════════════════════════════════════════

  function spawn(scene, x, y, z) {
    if (_engineers.length >= MAX_ENGINEERS) return null;

    var sc = scene || _getScene();
    if (!sc) return null;

    if (y === undefined || y === null) { y = _groundY(x, z); }

    var mesh = _buildEngineerMesh(sc);
    mesh.position.set(x, y, z);

    var eng = {
      mesh:         mesh,
      hp:           ENGINEER_HP,
      maxHp:        ENGINEER_HP,
      alive:        true,

      state:        'MOVE',       // MOVE | PLANT_MINE | PLANT_CHARGE | REPAIR | RETREAT

      // Mine planting
      mineTimer:    0,            // time since last mine
      plantTimer:   0,            // time spent in plant animation
      planting:     false,

      // Wall charge
      chargesLeft:  MAX_CHARGES,
      chargeTimer:  0,            // plant animation timer
      chargingWall: false,
      chargeTarget: null,         // { bx, by, bz }

      // Repair
      repairTarget: null,
      repairTimer:  0,
      repairing:    false,

      // Pistol fallback
      pistolMode:   false,
      fireTimer:    0,
    };

    _engineers.push(eng);
    return eng;
  }

  // ══════════════════════════════════════════════════════════════════
  //  IED PLANTING
  // ══════════════════════════════════════════════════════════════════

  function _plantIED(eng) {
    var sc = _getScene();
    if (!sc) return;

    var pos  = eng.mesh.position;
    var gy   = _groundY(pos.x, pos.z);
    var mesh = _buildIEDMesh(sc, pos.x, gy, pos.z);

    var ied = {
      mesh:     mesh,
      pos:      { x: pos.x, y: gy, z: pos.z },
      active:   true,
      detected: false,
    };
    _ieds.push(ied);

    // Sync global alias
    window._ieds = _ieds;
  }

  // ══════════════════════════════════════════════════════════════════
  //  WALL CHARGE PLANTING
  // ══════════════════════════════════════════════════════════════════

  function _plantWallCharge(eng, wallInfo) {
    var sc = _getScene();
    if (!sc) return;

    eng.chargesLeft--;

    var pos  = eng.mesh.position;
    var mesh = _buildChargeMesh(sc, pos.x, pos.y, pos.z);

    var charge = {
      mesh:  mesh,
      timer: CHARGE_DELAY,
      bx:    wallInfo.bx,
      by:    wallInfo.by,
      bz:    wallInfo.bz,
    };
    _wallCharges.push(charge);
  }

  // ══════════════════════════════════════════════════════════════════
  //  DEATH & DROPS
  // ══════════════════════════════════════════════════════════════════

  function _killEngineer(eng) {
    if (!eng.alive) return;
    eng.alive = false;
    eng.state = 'DEAD';

    var sc = _getScene();

    // Topple
    if (eng.mesh) {
      eng.mesh.rotation.z = Math.PI / 2;
      eng.mesh.position.y -= 0.5;
      var m = eng.mesh;
      setTimeout(function () { if (sc) sc.remove(m); }, 2500);
    }

    // Drop wire cutters pickup
    if (sc && eng.mesh) {
      var dp  = eng.mesh.position;
      var pMesh = _buildPickupMesh(sc, dp.x + 0.3, dp.y, dp.z + 0.3);
      _pickups.push({
        mesh:    pMesh,
        type:    'wire_cutters',
        pos:     { x: dp.x + 0.3, y: dp.y, z: dp.z + 0.3 },
        active:  true,
      });
    }

    _addScore(SCORE_KILL);
    _hudToast('ENGINEER DOWN', '#FFFF00', 2500);

    // Remove from registry
    var idx = _engineers.indexOf(eng);
    if (idx !== -1) { _engineers.splice(idx, 1); }
  }

  // ══════════════════════════════════════════════════════════════════
  //  REPAIR LOGIC — find nearest repairable entity
  // ══════════════════════════════════════════════════════════════════

  function _findRepairTarget(eng) {
    var pos = eng.mesh.position;

    // Check vehicle wrecks
    try {
      var wrecks = window._vehicleWrecks || (window.VehicleWrecks && window.VehicleWrecks.getAll && window.VehicleWrecks.getAll()) || [];
      for (var i = 0; i < wrecks.length; i++) {
        var w = wrecks[i];
        if (!w || !w.mesh) continue;
        var hp    = (w.hp !== undefined)    ? w.hp    : 0;
        var maxHp = (w.maxHp !== undefined) ? w.maxHp : 100;
        if (hp < maxHp && hp > 0) {
          if (_dist3(pos, w.mesh.position) < REPAIR_RANGE) {
            return w;
          }
        }
      }
    } catch (e) {}

    // Check auto-sentry / turrets
    try {
      var turrets = window._deployedTurrets || [];
      for (var j = 0; j < turrets.length; j++) {
        var t = turrets[j];
        if (!t || !t.mesh) continue;
        var thp    = (t.hp !== undefined)    ? t.hp    : 0;
        var tmaxHp = (t.maxHp !== undefined) ? t.maxHp : 100;
        if (thp < tmaxHp && thp > 0) {
          if (_dist3(pos, t.mesh.position) < REPAIR_RANGE) {
            return t;
          }
        }
      }
    } catch (e) {}

    return null;
  }

  // ══════════════════════════════════════════════════════════════════
  //  TEAM REINFORCEMENT — raise fallen / heal dying allies
  // ══════════════════════════════════════════════════════════════════

  function _tryRaiseFallen(eng) {
    if (eng.chargesLeft <= 0) return;  // no kit left
    var pos = eng.mesh.position;

    // Check all enemy lists
    var alliedLists = [];
    try { if (window._engineerEnemies) alliedLists.push(window._engineerEnemies); } catch (e) {}
    try { if (window.Enemies && window.Enemies.getAll) alliedLists.push(window.Enemies.getAll()); } catch (e) {}
    try { if (window._medicEnemies) alliedLists.push(window._medicEnemies); } catch (e) {}

    for (var li = 0; li < alliedLists.length; li++) {
      var list = alliedLists[li];
      for (var i = 0; i < list.length; i++) {
        var ally = list[i];
        if (!ally || ally === eng) continue;
        if (!ally.mesh) continue;
        var allyHp    = (ally.hp    !== undefined) ? ally.hp    : 100;
        var allyMaxHp = (ally.maxHp !== undefined) ? ally.maxHp : 100;
        // Raise if dying (hp <= 20% or dead but mesh still in scene)
        if (allyHp < allyMaxHp * 0.2 && _dist3(pos, ally.mesh.position) <= ALLY_HEAL_RANGE) {
          ally.hp = Math.min(allyMaxHp, allyHp + ALLY_HEAL_AMOUNT);
          if (ally.alive === false) { ally.alive = true; ally.state = 'MOVE'; }
          _hudToast('Engineer raised fallen ally!', '#FF4444', 2000);
          return;
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════
  //  PISTOL FIRE (fallback after charges expended)
  // ══════════════════════════════════════════════════════════════════

  function _pistolFire(eng, player) {
    var dist = _dist2(eng.mesh.position, player.position);
    if (dist > 20) return;

    eng.fireTimer += 0.016;
    if (eng.fireTimer < 1.5) return;  // ~1 shot / 1.5s
    eng.fireTimer = 0;

    try {
      if (player.hp !== undefined) {
        player.hp = Math.max(0, player.hp - PISTOL_DMG);
        if (window.HUD && window.HUD.setHealth) { window.HUD.setHealth(player.hp, player.maxHp || 100); }
        if (window.HUD && window.HUD.showDamageFlash) { window.HUD.showDamageFlash(0xff4400, 0.25); }
      }
    } catch (e) {}
  }

  // ══════════════════════════════════════════════════════════════════
  //  PER-ENGINEER UPDATE
  // ══════════════════════════════════════════════════════════════════

  function _updateEngineer(eng, delta) {
    if (!eng.alive) return;

    var mesh   = eng.mesh;
    var player = _getPlayer();
    if (!player || !player.position) return;

    var pos    = mesh.position;
    var dist   = _dist2(pos, player.position);

    // ── Pistol mode when no charges remain ──────────────────────────
    if (eng.chargesLeft <= 0 && !eng.pistolMode) {
      eng.pistolMode = true;
    }

    // ── Try to raise fallen allies (opportunistic) ──────────────────
    if (eng.chargesLeft > 0 && eng.state !== 'RETREAT') {
      _tryRaiseFallen(eng);
    }

    // ── RETREAT: player too close ────────────────────────────────────
    if (dist < RETREAT_DIST) {
      eng.state = 'RETREAT';
    }

    // ── State machine ────────────────────────────────────────────────
    if (eng.state === 'RETREAT') {
      // Run directly away from player
      var awayX = pos.x - player.position.x;
      var awayZ = pos.z - player.position.z;
      var awayLen = Math.sqrt(awayX * awayX + awayZ * awayZ) || 1;
      pos.x += (awayX / awayLen) * RETREAT_SPEED * delta;
      pos.z += (awayZ / awayLen) * RETREAT_SPEED * delta;
      mesh.rotation.y = Math.atan2(awayX, awayZ);

      if (dist >= PREFER_RANGE_MIN) {
        eng.state = 'MOVE';
      }

      if (eng.pistolMode) { _pistolFire(eng, player); }
      return;
    }

    if (eng.state === 'PLANT_MINE') {
      // Kneel animation
      mesh.rotation.x = 0.3;
      eng.plantTimer += delta;

      if (eng.plantTimer >= MINE_PLANT_TIME) {
        // Plant the IED
        _plantIED(eng);
        eng.plantTimer = 0;
        mesh.rotation.x = 0;
        eng.mineTimer = 0;
        eng.state = 'MOVE';
      }
      return;
    }

    if (eng.state === 'PLANT_CHARGE') {
      // Plant wall charge animation
      mesh.rotation.x = 0.2;
      eng.chargeTimer += delta;

      if (eng.chargeTimer >= CHARGE_PLANT_TIME) {
        if (eng.chargeTarget && eng.chargesLeft > 0) {
          _plantWallCharge(eng, eng.chargeTarget);
        }
        eng.chargeTimer  = 0;
        eng.chargeTarget = null;
        mesh.rotation.x  = 0;
        eng.state = 'MOVE';
      }
      return;
    }

    if (eng.state === 'REPAIR') {
      var target = eng.repairTarget;
      if (!target || !target.mesh) {
        eng.repairTarget = null;
        eng.repairing    = false;
        mesh.rotation.x  = 0;
        eng.state = 'MOVE';
        return;
      }

      // Walk to repair target
      var td   = _dist3(pos, target.mesh.position);
      if (td > 1.5) {
        var rdx = target.mesh.position.x - pos.x;
        var rdz = target.mesh.position.z - pos.z;
        var rl  = Math.sqrt(rdx * rdx + rdz * rdz) || 1;
        pos.x += (rdx / rl) * MOVE_SPEED * delta;
        pos.z += (rdz / rl) * MOVE_SPEED * delta;
        mesh.rotation.y = Math.atan2(rdx, rdz);
      } else {
        // Repair animation
        mesh.rotation.x  = 0.25;
        eng.repairTimer += delta;

        if (eng.repairTimer >= REPAIR_TIME) {
          // Restore HP
          var maxHp = target.maxHp !== undefined ? target.maxHp : 100;
          target.hp = Math.min(maxHp, (target.hp || 0) + REPAIR_AMOUNT);
          eng.repairTimer  = 0;
          eng.repairTarget = null;
          mesh.rotation.x  = 0;
          eng.state = 'MOVE';
        }
      }
      return;
    }

    // ── Default MOVE state ───────────────────────────────────────────
    eng.state = 'MOVE';

    // Tick mine timer
    eng.mineTimer += delta;

    // Check: should plant mine?
    if (eng.mineTimer >= MINE_INTERVAL && eng.chargesLeft > 0) {
      eng.state      = 'PLANT_MINE';
      eng.plantTimer = 0;
      return;
    }

    // Check: near voxel wall, should plant charge?
    if (!eng.pistolMode && eng.chargesLeft > 0) {
      var wallInfo = _nearVoxel(pos);
      if (wallInfo) {
        eng.state        = 'PLANT_CHARGE';
        eng.chargeTimer  = 0;
        eng.chargeTarget = wallInfo;
        return;
      }
    }

    // Check: repair target nearby?
    if (!eng.pistolMode) {
      var rt = _findRepairTarget(eng);
      if (rt) {
        eng.repairTarget = rt;
        eng.repairTimer  = 0;
        eng.state        = 'REPAIR';
        return;
      }
    }

    // Move toward player, staying in preferred range band
    if (dist > PREFER_RANGE_MAX) {
      // Too far — move closer
      var tpx = player.position.x - pos.x;
      var tpz = player.position.z - pos.z;
      var tl  = Math.sqrt(tpx * tpx + tpz * tpz) || 1;
      pos.x += (tpx / tl) * MOVE_SPEED * delta;
      pos.z += (tpz / tl) * MOVE_SPEED * delta;
      mesh.rotation.y = Math.atan2(tpx, tpz);
    } else if (dist < PREFER_RANGE_MIN) {
      // Too close — back up (but not retreat speed, retreat handles < RETREAT_DIST)
      var bx = pos.x - player.position.x;
      var bz = pos.z - player.position.z;
      var bl = Math.sqrt(bx * bx + bz * bz) || 1;
      pos.x += (bx / bl) * MOVE_SPEED * delta;
      pos.z += (bz / bl) * MOVE_SPEED * delta;
      mesh.rotation.y = Math.atan2(-bx, -bz);
    } else {
      // In range band — strafe sideways
      var strafeDx = -(player.position.z - pos.z);
      var strafeDz =  (player.position.x - pos.x);
      var sl       = Math.sqrt(strafeDx * strafeDx + strafeDz * strafeDz) || 1;
      pos.x += (strafeDx / sl) * MOVE_SPEED * 0.5 * delta;
      pos.z += (strafeDz / sl) * MOVE_SPEED * 0.5 * delta;
      mesh.rotation.y = Math.atan2(player.position.x - pos.x, player.position.z - pos.z);
    }

    if (eng.pistolMode) { _pistolFire(eng, player); }
  }

  // ══════════════════════════════════════════════════════════════════
  //  IED DETECTION — called each frame
  // ══════════════════════════════════════════════════════════════════

  function _updateIEDDetection() {
    var player = _getPlayer();
    if (!player || !player.position) return;

    // Only detect if player has mine detector or LandmineField is active
    var detectorActive = false;
    try {
      if (window.LandmineField && window.LandmineField.isActive) detectorActive = true;
      if (window._mineDetectorActive) detectorActive = true;
      if (window.LandmineDetector && window.LandmineDetector.isActive && window.LandmineDetector.isActive()) detectorActive = true;
      if (window._playerHasDefuseKit) detectorActive = true;  // wire cutters pickup
    } catch (e) {}

    if (!detectorActive) return;

    for (var i = 0; i < _ieds.length; i++) {
      var ied = _ieds[i];
      if (!ied || !ied.active || ied.detected) continue;

      var d = _dist3(player.position, ied.pos);
      if (d <= IED_DETECT_RANGE) {
        ied.detected = true;
        _hudToast('IED DETECTED! Press E to defuse', '#FF6600', 3000);
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════
  //  IED DEFUSE — player presses E near a detected IED
  // ══════════════════════════════════════════════════════════════════

  function _handleDefuseKey() {
    if (!window._playerHasDefuseKit) return;

    var player = _getPlayer();
    if (!player || !player.position) return;

    for (var i = _ieds.length - 1; i >= 0; i--) {
      var ied = _ieds[i];
      if (!ied || !ied.active || !ied.detected) continue;

      var d = _dist3(player.position, ied.pos);
      if (d <= IED_DETECT_RANGE) {
        // Defuse it
        var sc = _getScene();
        if (sc && ied.mesh) { sc.remove(ied.mesh); }
        ied.active = false;
        _ieds.splice(i, 1);
        _addScore(SCORE_DEFUSE);
        _hudToast('+150 DEFUSE BONUS!', '#00FF88', 2500);
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════
  //  WALL CHARGE TIMERS
  // ══════════════════════════════════════════════════════════════════

  function _updateWallCharges(delta) {
    var sc = _getScene();
    for (var i = _wallCharges.length - 1; i >= 0; i--) {
      var ch = _wallCharges[i];
      ch.timer -= delta;

      if (ch.timer <= 0) {
        // Detonate
        _blastWall(ch.bx, ch.by, ch.bz);
        _spawnExplosion(ch.mesh ? ch.mesh.position : new THREE.Vector3(ch.bx, ch.by, ch.bz));

        if (sc && ch.mesh) { sc.remove(ch.mesh); }
        _wallCharges.splice(i, 1);

        // Damage player if close
        var player = _getPlayer();
        if (player && player.position && ch.mesh) {
          var d = _dist3(player.position, ch.mesh.position);
          if (d < 4) {
            var dmg = Math.round(60 * (1 - d / 4));
            try {
              if (player.hp !== undefined) {
                player.hp = Math.max(0, player.hp - dmg);
                if (window.HUD && window.HUD.setHealth) { window.HUD.setHealth(player.hp, player.maxHp || 100); }
                if (window.HUD && window.HUD.showDamageFlash) { window.HUD.showDamageFlash(0xff6600, 0.5); }
              }
            } catch (e) {}
          }
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════
  //  PICKUP COLLECTION
  // ══════════════════════════════════════════════════════════════════

  function _updatePickups() {
    var player = _getPlayer();
    if (!player || !player.position) return;

    var sc = _getScene();
    for (var i = _pickups.length - 1; i >= 0; i--) {
      var pk = _pickups[i];
      if (!pk || !pk.active) { _pickups.splice(i, 1); continue; }

      var d = _dist3(player.position, pk.pos);
      if (d < 1.2) {
        // Collect
        if (sc && pk.mesh) { sc.remove(pk.mesh); }
        pk.active = false;
        _pickups.splice(i, 1);

        // Grant defuse kit to player
        window._playerHasDefuseKit = true;
        _hudToast('Wire Cutters picked up! Press E near IEDs to defuse (+150 score each)', '#FFAA00', 3500);
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════
  //  BULLET HIT HOOK
  // ══════════════════════════════════════════════════════════════════

  function _setupBulletHook() {
    var _prevHit = window._onBulletHit;
    window._onBulletHit = function (hitObject, damage) {
      // Check engineers
      for (var i = 0; i < _engineers.length; i++) {
        var eng = _engineers[i];
        if (!eng.alive) continue;
        if (eng.mesh === hitObject ||
            (eng.mesh && eng.mesh.children && eng.mesh.children.indexOf(hitObject) !== -1)) {
          eng.hp -= (damage || 20);
          if (eng.hp <= 0) { _killEngineer(eng); }
          return true;
        }
      }
      // Check IED meshes (shooting IEDs detonates them)
      for (var j = _ieds.length - 1; j >= 0; j--) {
        var ied = _ieds[j];
        if (ied && ied.active && ied.mesh === hitObject) {
          var sc = _getScene();
          _spawnExplosion(ied.mesh.position);
          if (sc) { sc.remove(ied.mesh); }
          ied.active = false;
          _ieds.splice(j, 1);
          return true;
        }
      }
      if (typeof _prevHit === 'function') {
        try { return _prevHit(hitObject, damage); } catch (e) {}
      }
      return false;
    };
  }

  // ══════════════════════════════════════════════════════════════════
  //  KEY LISTENER (E key for defuse)
  // ══════════════════════════════════════════════════════════════════

  function _setupKeyListener() {
    try {
      document.addEventListener('keydown', function (e) {
        if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') {
          _handleDefuseKey();
        }
      });
    } catch (err) {}
  }

  // ══════════════════════════════════════════════════════════════════
  //  PUBLIC API
  // ══════════════════════════════════════════════════════════════════

  function init() {
    if (_initialized) return;
    _initialized = true;

    window._ieds      = window._ieds      || [];
    window._engineers = window._engineers || [];
    _ieds      = window._ieds;
    _engineers = window._engineers;

    _setupBulletHook();
    _setupKeyListener();
  }

  function update(delta) {
    _getScene();

    var player = _getPlayer();
    if (!player || !player.position) return;

    // Update engineers
    for (var i = _engineers.length - 1; i >= 0; i--) {
      var eng = _engineers[i];
      if (eng && eng.alive) {
        _updateEngineer(eng, delta);
      }
    }

    // Update sub-systems
    _updateWallCharges(delta);
    _updateIEDDetection();
    _updatePickups();
  }

  function getAll() {
    return _engineers;
  }

  function reset() {
    var sc = _getScene();

    // Remove engineer meshes
    for (var i = 0; i < _engineers.length; i++) {
      var eng = _engineers[i];
      if (sc && eng.mesh) { sc.remove(eng.mesh); }
    }
    _engineers.length = 0;
    window._engineers = _engineers;

    // Remove IED meshes
    for (var j = 0; j < _ieds.length; j++) {
      var ied = _ieds[j];
      if (sc && ied && ied.mesh) { sc.remove(ied.mesh); }
    }
    _ieds.length = 0;
    window._ieds = _ieds;

    // Remove wall charges
    for (var k = 0; k < _wallCharges.length; k++) {
      var ch = _wallCharges[k];
      if (sc && ch.mesh) { sc.remove(ch.mesh); }
    }
    _wallCharges.length = 0;

    // Remove pickups
    for (var p = 0; p < _pickups.length; p++) {
      var pk = _pickups[p];
      if (sc && pk.mesh) { sc.remove(pk.mesh); }
    }
    _pickups.length = 0;

    window._playerHasDefuseKit = false;
  }

  return {
    init:   init,
    update: update,
    spawn:  spawn,
    getAll: getAll,
    reset:  reset,
  };

})();
