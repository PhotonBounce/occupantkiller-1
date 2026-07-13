/* ───────────────────────────────────────────────────────────────────────────
   convoy-ambush.js — Convoy Ambush Mini-Game
   API: window.ConvoyAmbush = { init, update, reset }
   Controls:
     C + A (simultaneously, within 400ms) → activate mission
     WASD                                  → move player
     Mouse                                 → look around
     E (near boulder)                      → push boulder onto road (100 dmg + blocks)
     E (near road, IED selected)           → plant IED on road
     E (near cargo / radio)                → secure cargo / interact
     F                                     → detonate nearest planted IED (if vehicle within 2u)
     Mouse-click / Space                   → fire weapon at convoy
   ─────────────────────────────────────────────────────────────────────────── */
window.ConvoyAmbush = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Mission state ─────────────────────────────────────────────────────── */
  var _active         = false;
  var _missionDone    = false;
  var _missionFailed  = false;
  var _score          = 0;

  /* ── C+A simultaneous launch tracking ─────────────────────────────────── */
  var _cPressTime = 0;
  var _aPressTime = 0;
  var CA_WINDOW   = 0.4; // seconds

  /* ── Player state ──────────────────────────────────────────────────────── */
  var _player         = null;
  var _playerHP       = 100;
  var _playerPos      = null; // THREE.Vector3
  var _playerYaw      = 0;
  var _playerPitch    = 0;
  var _mouseDX        = 0;
  var _mouseDY        = 0;
  var _mousePointerLocked = false;

  /* ── Keys ──────────────────────────────────────────────────────────────── */
  var _keys = {};

  /* ── Terrain / World objects ───────────────────────────────────────────── */
  var _road          = null;
  var _cliffL        = null;
  var _cliffR        = null;
  var _ambushPositions = [];  // 4 elevated platforms
  var _boulders      = [];    // 3 rollable boulders { mesh, rolled, rolling, rollDir, rollDist }
  var _extractZone   = null;

  /* ── Convoy ────────────────────────────────────────────────────────────── */
  var CONVOY_SPEED    = 8;    // units/s
  var MAP_LENGTH      = 80;
  var CONVOY_START_Z  = -38;
  var CONVOY_EXIT_Z   = 38;

  var _convoyAlerted  = false;
  var _convoyMoving   = true;
  var _convoyLeadZ    = CONVOY_START_Z; // z position of lead vehicle
  var _vehicles       = [];  // { mesh, type, hp, maxHp, alive, immobilized, tires[] }
  var _soldiers       = [];  // { mesh, alive, pos, vel, timer }
  var _soldiersExited = false;

  /* ── Radio / Air support ───────────────────────────────────────────────── */
  var _radioMesh      = null;
  var _radioDestroyed = false;
  var _airSupportTimer = 0;   // counts up; air support calls at 90s
  var _airSupportActive = false;
  var _airSupportInterval = 20; // strafe every 20s
  var _airSupportCooldown = 0;
  var _helicopter     = null;

  /* ── Cargo ─────────────────────────────────────────────────────────────── */
  var _cargoMeshes    = [];   // [weaponsCacheMesh, documentBoxMesh]
  var _cargoSecured   = [false, false];
  var _cargoTimer     = 0;    // time since convoy stopped
  var _cargoTimerRunning = false;

  /* ── IEDs ──────────────────────────────────────────────────────────────── */
  var _iedsAvailable  = 3;
  var _plantedIEDs    = [];   // { mesh, pos }

  /* ── Projectiles ───────────────────────────────────────────────────────── */
  var _bullets        = [];   // { mesh, vel, life }
  var _fireCooldown   = 0;

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  var _hud        = null;
  var _overlayEl  = null;

  /* ── Timing ────────────────────────────────────────────────────────────── */
  var _lastTime   = 0;
  var _dt         = 0;

  /* ── Explosion pool ────────────────────────────────────────────────────── */
  var _explosions = [];  // { mesh, life }

  /* ════════════════════════════════════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════════════════════════════════════ */

  function _makeMat(color, emissive) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    if (emissive !== undefined) {
      mat.emissive = new THREE.Color(emissive);
      mat.emissiveIntensity = 0.4;
    }
    return mat;
  }

  function _box(w, h, d, color, x, y, z) {
    var geo  = new THREE.BoxGeometry(w, h, d);
    var mat  = _makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y || 0, z || 0);
    return mesh;
  }

  function _cyl(rt, rb, h, segs, color, x, y, z) {
    var geo  = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat  = _makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y || 0, z || 0);
    return mesh;
  }

  function _dist2D(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _removeFromScene(mesh) {
    if (mesh && _scene) _scene.remove(mesh);
  }

  function _spawnExplosion(x, y, z) {
    var geo  = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    var mat  = new THREE.MeshLambertMaterial({ color: 0xFF4400, emissive: new THREE.Color(0xFF2200), emissiveIntensity: 1.5, transparent: true, opacity: 1 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    _scene.add(mesh);
    _explosions.push({ mesh: mesh, life: 0.6 });
    var light = new THREE.PointLight(0xFF4400, 3, 12);
    light.position.set(x, y, z);
    _scene.add(light);
    _explosions.push({ mesh: light, life: 0.4, isLight: true });
  }

  function _updateExplosions(dt) {
    for (var i = _explosions.length - 1; i >= 0; i--) {
      var ex = _explosions[i];
      ex.life -= dt;
      if (ex.isLight) {
        ex.mesh.intensity = Math.max(0, ex.life * 7.5);
      } else {
        ex.mesh.material.opacity = Math.max(0, ex.life / 0.6);
        var s = 1 + (1 - ex.life / 0.6) * 3;
        ex.mesh.scale.setScalar(s);
      }
      if (ex.life <= 0) {
        _removeFromScene(ex.mesh);
        _explosions.splice(i, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     WORLD BUILD
  ════════════════════════════════════════════════════════════════════════ */

  function _buildTerrain() {
    /* Mountain road */
    _road = _box(4, 0.3, MAP_LENGTH, 0x776655, 0, 0, 0);
    _scene.add(_road);

    /* Cliff walls — left and right */
    _cliffL = _box(2, 12, MAP_LENGTH, 0x665544, -5, 6, 0);
    _cliffR = _box(2, 12, MAP_LENGTH, 0x665544,  5, 6, 0);
    _scene.add(_cliffL);
    _scene.add(_cliffR);

    /* Valley floor on each side */
    var floorL = _box(8, 0.3, MAP_LENGTH, 0x554433, -10, 0, 0);
    var floorR = _box(8, 0.3, MAP_LENGTH, 0x554433,  10, 0, 0);
    _scene.add(floorL);
    _scene.add(floorR);

    /* 4 ambush positions — elevated on cliff tops */
    var ambushData = [
      { x: -5.5, y: 12.5, z: -20 },
      { x:  5.5, y: 12.5, z: -10 },
      { x: -5.5, y: 12.5, z:   5 },
      { x:  5.5, y: 12.5, z:  15 }
    ];
    for (var i = 0; i < ambushData.length; i++) {
      var ad = ambushData[i];
      var ap = _box(3, 0.4, 3, 0x557744, ad.x, ad.y, ad.z);
      _scene.add(ap);
      _ambushPositions.push(ap);
    }

    /* 3 rollable boulders — on cliff edge above road */
    var boulderData = [
      { x: -4.5, y: 12.9, z: -15 },
      { x:  4.5, y: 12.9, z:  -5 },
      { x: -4.5, y: 12.9, z:  10 }
    ];
    for (var j = 0; j < boulderData.length; j++) {
      var bd = boulderData[j];
      var bm = _box(1.2, 1.2, 1.2, 0x776655, bd.x, bd.y, bd.z);
      _scene.add(bm);
      _boulders.push({
        mesh:     bm,
        rolled:   false,
        rolling:  false,
        rollDir:  (bd.x < 0) ? 1 : -1,  // rolls toward road center
        rollDist: 0
      });
    }

    /* Extraction zone — far end of valley */
    _extractZone = _box(6, 0.2, 6, 0x00FF44, 0, 0.25, 36);
    _scene.add(_extractZone);

    /* Ambient light */
    var ambLight = new THREE.AmbientLight(0xAAAA88, 0.5);
    _scene.add(ambLight);
    var dirLight = new THREE.DirectionalLight(0xFFFFCC, 0.8);
    dirLight.position.set(5, 20, 10);
    _scene.add(dirLight);
  }

  /* ════════════════════════════════════════════════════════════════════════
     CONVOY BUILD
  ════════════════════════════════════════════════════════════════════════ */

  function _buildConvoy() {
    _vehicles  = [];
    _convoyLeadZ = CONVOY_START_Z;
    _convoyMoving = true;
    _convoyAlerted = false;

    /*
      Order (front → back, increasing Z offset from lead):
      0: lead jeep   3x1.5x2  0x334433  hp 60
      1: cargo truck 6x2.5x2.5 0x334422  hp 120  (weapons cache)
      2: cargo truck 6x2.5x2.5 0x334422  hp 120  (documents)
      3: armored     5x2x3    0x334433  hp 200
      4: rear jeep   3x1.5x2  0x334433  hp 60
    */
    var specs = [
      { type: 'jeep',    w: 3,   h: 1.5, d: 2,   color: 0x334433, maxHp: 60,  zOff: 0  },
      { type: 'truck',   w: 6,   h: 2.5, d: 2.5, color: 0x334422, maxHp: 120, zOff: -5 },
      { type: 'truck2',  w: 6,   h: 2.5, d: 2.5, color: 0x334422, maxHp: 120, zOff: -12},
      { type: 'armored', w: 5,   h: 2,   d: 3,   color: 0x334433, maxHp: 200, zOff: -19},
      { type: 'jeep2',   w: 3,   h: 1.5, d: 2,   color: 0x334433, maxHp: 60,  zOff: -25}
    ];

    for (var i = 0; i < specs.length; i++) {
      var sp   = specs[i];
      var mesh = _box(sp.w, sp.h, sp.d, sp.color, 0, sp.h / 2 + 0.15, CONVOY_START_Z + sp.zOff);
      _scene.add(mesh);

      /* Tire cylinders (4 per vehicle, purely visual) */
      var tires = [];
      var tireOffsets = [
        { x: -sp.w * 0.42, z: -sp.d * 0.3 },
        { x:  sp.w * 0.42, z: -sp.d * 0.3 },
        { x: -sp.w * 0.42, z:  sp.d * 0.3 },
        { x:  sp.w * 0.42, z:  sp.d * 0.3 }
      ];
      for (var t = 0; t < tireOffsets.length; t++) {
        var to = tireOffsets[t];
        var tireMesh = _cyl(0.5, 0.5, 0.3, 8, 0x222222, to.x, 0, sp.d * (t < 2 ? -0.3 : 0.3));
        tireMesh.rotation.z = Math.PI / 2;
        tireMesh.position.x = to.x;
        tireMesh.position.y = 0.2;
        tireMesh.position.z = (t < 2) ? -sp.d * 0.3 : sp.d * 0.3;
        mesh.add(tireMesh);
        tires.push({ mesh: tireMesh, shot: false });
      }

      _vehicles.push({
        mesh:        mesh,
        type:        sp.type,
        hp:          sp.maxHp,
        maxHp:       sp.maxHp,
        alive:       true,
        immobilized: false,
        zOff:        sp.zOff,
        tires:       tires,
        halfH:       sp.h / 2
      });
    }

    /* Radio operator cylinder inside armored vehicle (index 3) */
    _radioMesh = _cyl(0.3, 0.3, 1.2, 8, 0x334455, 0, 1.5, CONVOY_START_Z - 19);
    _radioMesh.userData.isRadio = true;
    _scene.add(_radioMesh);
    _radioDestroyed = false;

    /* Cargo meshes — initially inside trucks, become accessible after stop */
    /* Weapons cache — truck index 1 */
    var wc = _box(1.5, 0.8, 1, 0x556644, 0, 1.6, CONVOY_START_Z - 5);
    wc.userData.cargoIdx = 0;
    _scene.add(wc);
    _cargoMeshes[0] = wc;

    /* Document box — truck index 2 */
    var db = _box(0.8, 0.5, 0.6, 0xFFFFAA, 0, 1.4, CONVOY_START_Z - 12);
    db.userData.cargoIdx = 1;
    _scene.add(db);
    _cargoMeshes[1] = db;

    _cargoSecured       = [false, false];
    _cargoTimer         = 0;
    _cargoTimerRunning  = false;
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER SPAWN
  ════════════════════════════════════════════════════════════════════════ */

  function _spawnPlayer() {
    _playerPos   = new THREE.Vector3(-5, 12.8, -18);
    _playerHP    = 100;
    _playerYaw   = 0;
    _playerPitch = 0;

    _player = _box(0.6, 1.6, 0.6, 0x226622, _playerPos.x, _playerPos.y, _playerPos.z);
    _scene.add(_player);

    /* Position camera behind / above player */
    _camera.position.set(_playerPos.x, _playerPos.y + 1.4, _playerPos.z);
  }

  /* ════════════════════════════════════════════════════════════════════════
     SOLDIERS EXIT CONVOY
  ════════════════════════════════════════════════════════════════════════ */

  function _exitSoldiers() {
    if (_soldiersExited) return;
    _soldiersExited = true;

    /* 15 soldiers — spread out from vehicle positions */
    for (var i = 0; i < 15; i++) {
      var veh    = _vehicles[i % _vehicles.length];
      var sx     = veh.mesh.position.x + (Math.random() - 0.5) * 4;
      var sz     = veh.mesh.position.z + (Math.random() - 0.5) * 4;
      var smesh  = _box(0.5, 1.5, 0.5, 0x334422, sx, 0.75, sz);
      _scene.add(smesh);
      _soldiers.push({
        mesh:  smesh,
        alive: true,
        pos:   new THREE.Vector3(sx, 0.75, sz),
        vel:   new THREE.Vector3((Math.random() - 0.5) * 3, 0, (Math.random() - 0.5) * 3),
        fireTimer: 1 + Math.random() * 2
      });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     IED PLANT & DETONATE
  ════════════════════════════════════════════════════════════════════════ */

  function _plantIED() {
    if (_iedsAvailable <= 0) return;
    /* Plant at player's current road position */
    var px = _playerPos.x;
    var pz = _playerPos.z;
    /* Only plant if near road (x within -2..2) */
    if (Math.abs(px) > 2.5) {
      _hudFlash('NOT ON ROAD');
      return;
    }
    _iedsAvailable--;
    var ied = _box(0.4, 0.15, 0.4, 0xFF2200, px, 0.1, pz);
    _scene.add(ied);
    _plantedIEDs.push({ mesh: ied, pos: new THREE.Vector3(px, 0.1, pz) });
    _hudFlash('IED PLANTED — ' + _iedsAvailable + ' remaining');
  }

  function _detonateIED() {
    if (_plantedIEDs.length === 0) return;
    /* Find nearest IED that has a vehicle within 2u */
    for (var i = _plantedIEDs.length - 1; i >= 0; i--) {
      var ied    = _plantedIEDs[i];
      var hit    = false;
      for (var v = 0; v < _vehicles.length; v++) {
        var veh = _vehicles[v];
        if (!veh.alive) continue;
        var d = _dist2D(ied.pos.x, ied.pos.z, veh.mesh.position.x, veh.mesh.position.z);
        if (d < 2) {
          _damageVehicle(veh, 150, 'IED');
          hit = true;
        }
      }
      if (hit) {
        _spawnExplosion(ied.pos.x, 0.5, ied.pos.z);
        _removeFromScene(ied.mesh);
        _plantedIEDs.splice(i, 1);
        _hudFlash('IED DETONATED!');
        break;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     BOULDER ROLL
  ════════════════════════════════════════════════════════════════════════ */

  function _tryPushBoulder() {
    for (var i = 0; i < _boulders.length; i++) {
      var b = _boulders[i];
      if (b.rolled || b.rolling) continue;
      var d = _dist2D(_playerPos.x, _playerPos.z, b.mesh.position.x, b.mesh.position.z);
      if (d < 2.5) {
        b.rolling = true;
        _hudFlash('BOULDER ROLLING!');
        return;
      }
    }
  }

  function _updateBoulders(dt) {
    for (var i = 0; i < _boulders.length; i++) {
      var b = _boulders[i];
      if (!b.rolling || b.rolled) continue;

      var speed   = 6;
      var maxDist = 10; // rolls across cliff top and down
      b.mesh.position.x += b.rollDir * speed * dt;
      b.mesh.rotation.z += b.rollDir * speed * dt;
      b.rollDist += speed * dt;

      /* Check vehicle collision */
      for (var v = 0; v < _vehicles.length; v++) {
        var veh = _vehicles[v];
        if (!veh.alive) continue;
        var d = _dist2D(b.mesh.position.x, b.mesh.position.z, veh.mesh.position.x, veh.mesh.position.z);
        if (d < 2.5) {
          _damageVehicle(veh, 100, 'BOULDER');
          /* Block the lane — immobilize if in path */
          veh.immobilized = true;
          _hudFlash('BOULDER CRUSHED VEHICLE! +100 DMG');
          b.rolling = false;
          b.rolled  = true;
          break;
        }
      }

      if (b.rollDist >= maxDist) {
        b.rolling = false;
        b.rolled  = true;
        /* Boulder settles on road */
        b.mesh.position.y = 0.6;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     VEHICLE DAMAGE
  ════════════════════════════════════════════════════════════════════════ */

  function _damageVehicle(veh, amount, source) {
    if (!veh.alive) return;
    veh.hp -= amount;

    /* Alert convoy on first damage */
    if (!_convoyAlerted) {
      _convoyAlerted = true;
      _convoyMoving  = false;
      _hudFlash('CONVOY ALERTED — CONVOY STOPPED');
      /* Soldiers exit */
      _exitSoldiers();
      /* Radio countdown starts */
      _airSupportTimer  = 0;
      _cargoTimerRunning = true;
    }

    if (veh.hp <= 0) {
      veh.hp    = 0;
      veh.alive = false;
      _spawnExplosion(veh.mesh.position.x, veh.halfH, veh.mesh.position.z);
      veh.mesh.material.color.setHex(0x111111);
      veh.mesh.material.emissive = new THREE.Color(0x330000);
      _score += 200;
      /* Check if weapons/doc truck destroyed — cargo lost */
      if (veh.type === 'truck')  _hudFlash('TRUCK DESTROYED — WEAPONS CACHE LOST');
      if (veh.type === 'truck2') _hudFlash('TRUCK DESTROYED — DOCUMENTS LOST');
    } else {
      /* Red tint by damage */
      var ratio = veh.hp / veh.maxHp;
      veh.mesh.material.color.setHex(
        ratio > 0.5 ? veh.mesh.material.color.getHex() : (ratio > 0.25 ? 0x553322 : 0x331111)
      );
    }

    /* Move radio with armored vehicle */
    if (veh.type === 'armored' && _radioMesh && !_radioDestroyed) {
      _radioMesh.position.z = veh.mesh.position.z;
    }
  }

  function _damageVehicleTires(veh) {
    /* Immobilize without destroying */
    veh.immobilized = true;
    _hudFlash('TIRES SHOT — VEHICLE IMMOBILIZED');
    for (var t = 0; t < veh.tires.length; t++) {
      if (!veh.tires[t].shot) {
        veh.tires[t].shot = true;
        veh.tires[t].mesh.material.color.setHex(0x111111);
        break;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     SHOOTING
  ════════════════════════════════════════════════════════════════════════ */

  function _fireWeapon() {
    if (_fireCooldown > 0) return;
    _fireCooldown = 0.15;

    var dir = new THREE.Vector3();
    _camera.getWorldDirection(dir);

    var bGeo  = new THREE.BoxGeometry(0.1, 0.1, 0.6);
    var bMat  = new THREE.MeshLambertMaterial({ color: 0xFFFF00, emissive: new THREE.Color(0xFFAA00), emissiveIntensity: 1 });
    var bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.copy(_camera.position);
    bMesh.lookAt(_camera.position.clone().add(dir));
    _scene.add(bMesh);
    _bullets.push({ mesh: bMesh, vel: dir.clone().multiplyScalar(60), life: 2 });
  }

  function _updateBullets(dt) {
    for (var i = _bullets.length - 1; i >= 0; i--) {
      var b = _bullets[i];
      b.life -= dt;
      b.mesh.position.addScaledVector(b.vel, dt);

      if (b.life <= 0) {
        _removeFromScene(b.mesh);
        _bullets.splice(i, 1);
        continue;
      }

      /* Collision with vehicles */
      for (var v = 0; v < _vehicles.length; v++) {
        var veh = _vehicles[v];
        if (!veh.alive) continue;
        var d = _dist2D(b.mesh.position.x, b.mesh.position.z, veh.mesh.position.x, veh.mesh.position.z);
        if (d < 2.5 && Math.abs(b.mesh.position.y - veh.halfH) < veh.halfH + 0.5) {
          _damageVehicle(veh, 20, 'BULLET');
          _removeFromScene(b.mesh);
          _bullets.splice(i, 1);
          break;
        }
      }

      /* Collision with radio */
      if (_radioMesh && !_radioDestroyed) {
        var rd = _dist2D(b.mesh.position.x, b.mesh.position.z, _radioMesh.position.x, _radioMesh.position.z);
        if (rd < 0.6) {
          _radioDestroyed = true;
          _removeFromScene(_radioMesh);
          _radioMesh = null;
          _hudFlash('RADIO DESTROYED — AIR SUPPORT CANCELLED');
          _score += 500;
          _removeFromScene(b.mesh);
          _bullets.splice(i, 1);
          continue;
        }
      }

      /* Collision with soldiers */
      for (var s = _soldiers.length - 1; s >= 0; s--) {
        var sol = _soldiers[s];
        if (!sol.alive) continue;
        var sd = _dist2D(b.mesh.position.x, b.mesh.position.z, sol.pos.x, sol.pos.z);
        if (sd < 0.8) {
          sol.alive = false;
          _removeFromScene(sol.mesh);
          _removeFromScene(b.mesh);
          _bullets.splice(i, 1);
          break;
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     CONVOY MOVEMENT
  ════════════════════════════════════════════════════════════════════════ */

  function _updateConvoy(dt) {
    if (!_convoyMoving) return;

    /* All alive non-immobilized vehicles advance */
    var anyAliveMoving = false;
    for (var i = 0; i < _vehicles.length; i++) {
      var veh = _vehicles[i];
      if (!veh.alive || veh.immobilized) continue;

      /* Stop before exit */
      var targetZ = CONVOY_EXIT_Z + veh.zOff;
      if (veh.mesh.position.z < targetZ) {
        veh.mesh.position.z += CONVOY_SPEED * dt;
        anyAliveMoving = true;
      }
    }

    /* Update lead Z for HUD */
    if (_vehicles[0].alive) {
      _convoyLeadZ = _vehicles[0].mesh.position.z;
    }

    /* Sync radio and cargo with vehicle positions */
    var truck1 = _vehicles[1];
    var truck2 = _vehicles[2];
    var armored = _vehicles[3];

    if (_radioMesh && !_radioDestroyed && armored.alive) {
      _radioMesh.position.z = armored.mesh.position.z;
      _radioMesh.position.y = armored.mesh.position.y + 1.5;
    }
    if (_cargoMeshes[0] && !_cargoSecured[0] && truck1.alive) {
      _cargoMeshes[0].position.z = truck1.mesh.position.z;
      _cargoMeshes[0].position.y = truck1.mesh.position.y + 1;
    }
    if (_cargoMeshes[1] && !_cargoSecured[1] && truck2.alive) {
      _cargoMeshes[1].position.z = truck2.mesh.position.z;
      _cargoMeshes[1].position.y = truck2.mesh.position.y + 1;
    }

    /* Check if convoy reached exit — mission failed */
    if (_vehicles[0].alive && _convoyLeadZ >= CONVOY_EXIT_Z) {
      _missionFailed = true;
      _active        = false;
      _hudFlash('MISSION FAILED — CONVOY ESCAPED');
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     AIR SUPPORT
  ════════════════════════════════════════════════════════════════════════ */

  function _spawnHelicopter() {
    if (_helicopter) return;
    _helicopter = _cyl(0.6, 0.6, 2.5, 8, 0x334433, 0, 30, 0);
    _helicopter.rotation.x = Math.PI / 2;
    _scene.add(_helicopter);
    _hudFlash('AIR SUPPORT INBOUND!');
  }

  function _removeHelicopter() {
    if (_helicopter) {
      _removeFromScene(_helicopter);
      _helicopter = null;
    }
  }

  function _strafeAmbushPositions() {
    _hudFlash('HELICOPTER STRAFING AMBUSH POSITIONS!');
    for (var i = 0; i < _ambushPositions.length; i++) {
      var ap = _ambushPositions[i];
      var d  = _dist2D(_playerPos.x, _playerPos.z, ap.position.x, ap.position.z);
      if (d < 3) {
        _playerHP -= 30;
        _hudFlash('PLAYER HIT BY STRAFE! HP: ' + _playerHP);
        if (_playerHP <= 0) {
          _missionFailed = true;
          _active        = false;
          _hudFlash('PLAYER KIA — MISSION FAILED');
        }
      }
    }
  }

  function _updateAirSupport(dt) {
    if (_radioDestroyed || !_convoyAlerted) return;

    _airSupportTimer += dt;

    if (!_airSupportActive && _airSupportTimer >= 90) {
      _airSupportActive = true;
      _spawnHelicopter();
    }

    if (_airSupportActive && _helicopter) {
      /* Orbit */
      var t = Date.now() / 1000;
      _helicopter.position.x = Math.cos(t * 0.5) * 12;
      _helicopter.position.z = Math.sin(t * 0.5) * 12;
      _helicopter.position.y = 28;

      _airSupportCooldown -= dt;
      if (_airSupportCooldown <= 0) {
        _strafeAmbushPositions();
        _airSupportCooldown = _airSupportInterval;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     CARGO SECURE
  ════════════════════════════════════════════════════════════════════════ */

  function _trySecureCargo() {
    if (!_cargoTimerRunning) return;
    for (var i = 0; i < _cargoMeshes.length; i++) {
      if (_cargoSecured[i]) continue;
      var cm = _cargoMeshes[i];
      if (!cm) continue;
      var d = _dist2D(_playerPos.x, _playerPos.z, cm.position.x, cm.position.z);
      if (d < 2) {
        _cargoSecured[i] = true;
        cm.material.emissive = new THREE.Color(0x00FF00);
        cm.material.emissiveIntensity = 0.8;
        _hudFlash('CARGO ' + (i === 0 ? 'WEAPONS CACHE' : 'DOCUMENTS') + ' SECURED!');
        _score += 750;
        return;
      }
    }
  }

  function _updateCargoTimer(dt) {
    if (!_cargoTimerRunning) return;
    _cargoTimer += dt;
    if (_cargoTimer >= 60) {
      /* Cargo opportunity expired */
      _cargoTimerRunning = false;
      for (var i = 0; i < _cargoSecured.length; i++) {
        if (!_cargoSecured[i]) _hudFlash('CARGO ' + i + ' EXPIRED');
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     EXTRACTION
  ════════════════════════════════════════════════════════════════════════ */

  function _checkExtraction() {
    if (!_extractZone) return;
    var d = _dist2D(_playerPos.x, _playerPos.z, _extractZone.position.x, _extractZone.position.z);
    if (d < 3.5) {
      /* Must have alerted convoy (mission engaged) */
      if (!_convoyAlerted) return;
      _missionDone = true;
      _active      = false;

      /* Bonus for all 5 vehicles disabled */
      var allDisabled = true;
      for (var i = 0; i < _vehicles.length; i++) {
        if (_vehicles[i].alive && !_vehicles[i].immobilized) { allDisabled = false; break; }
      }
      if (allDisabled) {
        _score += 1000;
        _hudFlash('ALL VEHICLES DISABLED! BONUS +1000');
      }

      var cargoCount = (_cargoSecured[0] ? 1 : 0) + (_cargoSecured[1] ? 1 : 0);
      _hudFlash('EXTRACTION COMPLETE! SCORE: ' + _score + ' | CARGO: ' + cargoCount + '/2');
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER MOVEMENT
  ════════════════════════════════════════════════════════════════════════ */

  function _updatePlayer(dt) {
    if (!_playerPos) return;

    /* Mouse look */
    _playerYaw   -= _mouseDX * 0.002;
    _playerPitch -= _mouseDY * 0.002;
    _playerPitch  = Math.max(-1.2, Math.min(1.2, _playerPitch));
    _mouseDX = 0;
    _mouseDY = 0;

    /* WASD movement */
    var speed = 8;
    var fwd   = new THREE.Vector3(-Math.sin(_playerYaw), 0, -Math.cos(_playerYaw));
    var right = new THREE.Vector3(Math.cos(_playerYaw), 0, -Math.sin(_playerYaw));
    var move  = new THREE.Vector3();

    if (_keys['KeyW'] || _keys['ArrowUp'])    move.addScaledVector(fwd,   speed * dt);
    if (_keys['KeyS'] || _keys['ArrowDown'])  move.addScaledVector(fwd,  -speed * dt);
    if (_keys['KeyA'] || _keys['ArrowLeft'])  move.addScaledVector(right,-speed * dt);
    if (_keys['KeyD'] || _keys['ArrowRight']) move.addScaledVector(right, speed * dt);

    _playerPos.add(move);

    /* Simple terrain clamping */
    /* On cliff top or road */
    if (Math.abs(_playerPos.x) > 6.5) _playerPos.x = Math.sign(_playerPos.x) * 6.5;
    if (_playerPos.z < -42) _playerPos.z = -42;
    if (_playerPos.z >  42) _playerPos.z =  42;

    /* Y — standing on cliff top (y ~12.8) or road (y ~0.95) */
    var onCliff = (Math.abs(_playerPos.x) >= 4.5);
    _playerPos.y = onCliff ? 12.8 : 0.95;

    /* Update mesh */
    if (_player) {
      _player.position.copy(_playerPos);
    }

    /* Camera */
    var eyeOffset = new THREE.Vector3(0, 0.8, 0);
    var camPos    = _playerPos.clone().add(eyeOffset);
    _camera.position.copy(camPos);
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y     = _playerYaw;
    _camera.rotation.x     = _playerPitch;

    /* E — interact */
    if (_keys['_ePressed']) {
      _keys['_ePressed'] = false;
      _onInteract();
    }

    /* F — detonate */
    if (_keys['_fPressed']) {
      _keys['_fPressed'] = false;
      _detonateIED();
    }
  }

  function _onInteract() {
    /* Priority: boulder > cargo > IED plant */
    /* Try boulder push */
    var boulderNear = false;
    for (var i = 0; i < _boulders.length; i++) {
      var b = _boulders[i];
      if (b.rolled || b.rolling) continue;
      var d = _dist2D(_playerPos.x, _playerPos.z, b.mesh.position.x, b.mesh.position.z);
      if (d < 2.5) { boulderNear = true; break; }
    }
    if (boulderNear) { _tryPushBoulder(); return; }

    /* Try cargo secure */
    if (_cargoTimerRunning) {
      for (var c = 0; c < _cargoMeshes.length; c++) {
        if (_cargoSecured[c] || !_cargoMeshes[c]) continue;
        var cd = _dist2D(_playerPos.x, _playerPos.z, _cargoMeshes[c].position.x, _cargoMeshes[c].position.z);
        if (cd < 2) { _trySecureCargo(); return; }
      }
    }

    /* Try IED plant */
    _plantIED();
  }

  /* ════════════════════════════════════════════════════════════════════════
     SOLDIERS UPDATE
  ════════════════════════════════════════════════════════════════════════ */

  function _updateSoldiers(dt) {
    var alive = 0;
    for (var i = 0; i < _soldiers.length; i++) {
      var s = _soldiers[i];
      if (!s.alive) continue;
      alive++;

      /* Move toward player */
      var dir = new THREE.Vector3(
        _playerPos.x - s.pos.x,
        0,
        _playerPos.z - s.pos.z
      );
      var dist = dir.length();
      if (dist > 0.5) {
        dir.normalize();
        s.pos.addScaledVector(dir, 4 * dt);
        s.mesh.position.copy(s.pos);
      } else {
        /* Attack player */
        s.fireTimer -= dt;
        if (s.fireTimer <= 0) {
          s.fireTimer = 1 + Math.random();
          _playerHP  -= 10;
          if (_playerHP <= 0) {
            _missionFailed = true;
            _active        = false;
            _hudFlash('PLAYER KIA — MISSION FAILED');
          }
        }
      }
    }
    return alive;
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD
  ════════════════════════════════════════════════════════════════════════ */

  var _flashMsg  = '';
  var _flashLife = 0;

  function _hudFlash(msg) {
    _flashMsg  = msg;
    _flashLife = 3;
  }

  function _createHUD() {
    _hud = document.createElement('div');
    _hud.id = 'convoy-ambush-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.65)',
      'color:#CCFFCC',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 14px',
      'border-radius:4px',
      'z-index:9999',
      'pointer-events:none',
      'display:none',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hud);

    _overlayEl = document.createElement('div');
    _overlayEl.id = 'convoy-ambush-overlay';
    _overlayEl.style.cssText = [
      'position:fixed',
      'top:55px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.5)',
      'color:#FFFF66',
      'font-family:monospace',
      'font-size:14px',
      'padding:4px 12px',
      'border-radius:3px',
      'z-index:9999',
      'pointer-events:none',
      'display:none'
    ].join(';');
    document.body.appendChild(_overlayEl);
  }

  function _updateHUD(dt, soldiersAlive) {
    if (!_hud || !_active) return;

    var toExit   = Math.max(0, Math.round(CONVOY_EXIT_Z - _convoyLeadZ));
    var cargoStr = (_cargoSecured[0] ? 1 : 0) + (_cargoSecured[1] ? 1 : 0) + '/2';
    var radioStr = _radioDestroyed ? 'DESTROYED' : 'ACTIVE';

    var airStr = '';
    if (_convoyAlerted && !_radioDestroyed) {
      if (!_airSupportActive) {
        var remaining = Math.max(0, Math.ceil(90 - _airSupportTimer));
        airStr = ' [AIR SUPPORT: ' + remaining + 's]';
      } else {
        airStr = ' [AIR SUPPORT: ACTIVE]';
      }
    }

    _hud.textContent = 'AMBUSH [CONVOY: ' + toExit + 'm to exit] [CARGO: ' + cargoStr + ' SECURED] [RADIO: ' + radioStr + ']' + airStr + ' | SOLDIERS: ' + soldiersAlive;

    /* Flash overlay */
    if (_flashLife > 0) {
      _flashLife -= dt;
      _overlayEl.textContent  = _flashMsg;
      _overlayEl.style.display = 'block';
    } else {
      _overlayEl.style.display = 'none';
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     INPUT
  ════════════════════════════════════════════════════════════════════════ */

  function _onKeyDown(e) {
    _keys[e.code] = true;

    /* C+A within 400ms → activate */
    if (e.code === 'KeyC') _cPressTime = Date.now();
    if (e.code === 'KeyA') _aPressTime = Date.now();

    if (!_active) {
      var gap = Math.abs(_cPressTime - _aPressTime);
      if (_keys['KeyC'] && _keys['KeyA'] && gap < CA_WINDOW * 1000) {
        _launch();
      }
    }

    if (!_active) return;

    if (e.code === 'KeyE') _keys['_ePressed'] = true;
    if (e.code === 'KeyF') _keys['_fPressed'] = true;

    /* Space / click fires */
    if (e.code === 'Space') _fireWeapon();
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;
  }

  function _onMouseMove(e) {
    if (!_active) return;
    if (_mousePointerLocked) {
      _mouseDX += e.movementX || 0;
      _mouseDY += e.movementY || 0;
    }
  }

  function _onMouseDown(e) {
    if (!_active) return;
    if (e.button === 0) _fireWeapon();
    if (_canvas && !_mousePointerLocked) {
      _canvas.requestPointerLock();
    }
  }

  function _onPointerLockChange() {
    _mousePointerLocked = (document.pointerLockElement === _canvas);
  }

  /* ════════════════════════════════════════════════════════════════════════
     LAUNCH / RESET
  ════════════════════════════════════════════════════════════════════════ */

  function _launch() {
    if (_active) return;
    _reset();
    _active        = true;
    _missionDone   = false;
    _missionFailed = false;
    _score         = 0;
    _iedsAvailable = 3;
    _plantedIEDs   = [];
    _bullets       = [];
    _explosions    = [];
    _soldiers      = [];
    _soldiersExited = false;
    _airSupportTimer = 0;
    _airSupportActive = false;
    _airSupportCooldown = 0;
    _flashMsg  = '';
    _flashLife = 0;

    _buildTerrain();
    _buildConvoy();
    _spawnPlayer();

    _hud.style.display = 'block';
    _overlayEl.style.display = 'none';
    _hudFlash('CONVOY AMBUSH ACTIVE — C+A to reactivate');

    /* Pointer lock */
    if (_canvas) _canvas.requestPointerLock();
  }

  function _reset() {
    /* Remove all scene objects */
    if (_road)     _removeFromScene(_road);
    if (_cliffL)   _removeFromScene(_cliffL);
    if (_cliffR)   _removeFromScene(_cliffR);
    if (_extractZone) _removeFromScene(_extractZone);
    if (_player)   _removeFromScene(_player);
    if (_radioMesh) _removeFromScene(_radioMesh);
    if (_helicopter) _removeFromScene(_helicopter);

    for (var i = 0; i < _ambushPositions.length; i++) _removeFromScene(_ambushPositions[i]);
    for (var j = 0; j < _boulders.length; j++)        _removeFromScene(_boulders[j].mesh);
    for (var v = 0; v < _vehicles.length; v++)        _removeFromScene(_vehicles[v].mesh);
    for (var s = 0; s < _soldiers.length; s++)        _removeFromScene(_soldiers[s].mesh);
    for (var b = 0; b < _bullets.length; b++)         _removeFromScene(_bullets[b].mesh);
    for (var p = 0; p < _plantedIEDs.length; p++)     _removeFromScene(_plantedIEDs[p].mesh);
    for (var e = 0; e < _explosions.length; e++)      _removeFromScene(_explosions[e].mesh);
    for (var c = 0; c < _cargoMeshes.length; c++)     _removeFromScene(_cargoMeshes[c]);

    _road           = null;
    _cliffL         = null;
    _cliffR         = null;
    _extractZone    = null;
    _player         = null;
    _radioMesh      = null;
    _helicopter     = null;
    _ambushPositions = [];
    _boulders       = [];
    _vehicles       = [];
    _soldiers       = [];
    _bullets        = [];
    _plantedIEDs    = [];
    _explosions     = [];
    _cargoMeshes    = [];
    _cargoSecured   = [false, false];
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    _playerPos = new THREE.Vector3(0, 0, 0);

    _createHUD();

    document.addEventListener('keydown',  _onKeyDown);
    document.addEventListener('keyup',    _onKeyUp);
    document.addEventListener('mousemove', _onMouseMove);
    document.addEventListener('mousedown', _onMouseDown);
    document.addEventListener('pointerlockchange', _onPointerLockChange);
  }

  function update(timestamp) {
    if (_lastTime === 0) { _lastTime = timestamp; return; }
    _dt       = Math.min((timestamp - _lastTime) / 1000, 0.05);
    _lastTime = timestamp;

    if (!_active) return;

    _fireCooldown = Math.max(0, _fireCooldown - _dt);

    _updatePlayer(_dt);
    _updateConvoy(_dt);
    _updateBoulders(_dt);
    _updateBullets(_dt);
    _updateAirSupport(_dt);
    _updateCargoTimer(_dt);
    _updateExplosions(_dt);

    var soldiersAlive = _updateSoldiers(_dt);
    _updateHUD(_dt, soldiersAlive);
    _checkExtraction();

    /* Extraction zone pulse */
    if (_extractZone) {
      var pulse = (Math.sin(Date.now() / 300) * 0.5 + 0.5);
      _extractZone.material.emissive = new THREE.Color(0x00FF44);
      _extractZone.material.emissiveIntensity = pulse * 0.6;
    }
  }

  function reset() {
    _active = false;
    _reset();
    if (_hud)       _hud.style.display    = 'none';
    if (_overlayEl) _overlayEl.style.display = 'none';
    if (document.exitPointerLock) document.exitPointerLock();
  }

  return { init: init, update: update, reset: reset };

}());
