/* ───────────────────────────────────────────────────────────────────────────
   helipad-extraction.js — Helipad Extraction Mini-Game
   API: window.HelipadExtraction = { init, update, reset }
   Controls:
     H + E (simultaneous, 400ms window) → activate mission
     W / A / S / D  → move player between floors
     Mouse          → look / aim
     E              → interact (server room, hostage, elevator, rappel, RPG)
     Space / Click  → shoot
   ─────────────────────────────────────────────────────────────────────────── */
window.HelipadExtraction = (function () {
  'use strict';

  /* ── Scene references ───────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Constants ──────────────────────────────────────────────────────────── */
  var TOTAL_FLOORS    = 10;
  var FLOOR_HEIGHT    = 3.5;
  var BUILDING_W      = 15;
  var BUILDING_H      = 30;
  var BUILDING_D      = 12;
  var MISSION_TIME    = 480; // 8 minutes in seconds
  var COMBO_WINDOW    = 0.4;
  var ELEVATOR_MAX_FLOOR = 4;

  /* ── Game state ─────────────────────────────────────────────────────────── */
  var _active        = false;
  var _failed        = false;
  var _success       = false;
  var _score         = 0;
  var _timeRemaining = MISSION_TIME;
  var _alertLevel    = 1; // 1-4
  var _reinforcementsArrived = false;

  /* ── Player ─────────────────────────────────────────────────────────────── */
  var _playerFloor   = 1;
  var _playerHP      = 100;
  var _playerSpeed   = 6;
  var _playerMesh    = null;
  var _playerPos     = { x: 0, y: 0, z: 0 };

  /* ── Input ──────────────────────────────────────────────────────────────── */
  var _keys         = {};
  var _mouseX       = 0;
  var _mouseY       = 0;
  var _yaw          = 0;
  var _pitch        = 0;

  /* ── Activation combo ───────────────────────────────────────────────────── */
  var _hPressTime   = 0;
  var _ePressTime   = 0;

  /* ── Objectives ─────────────────────────────────────────────────────────── */
  var _hasServerData     = false;
  var _hostageFreed      = false;
  var _rpgDestroyed      = false;
  var _powerKilled       = false;
  var _serverCopying     = false;
  var _serverCopyTimer   = 0;
  var _serverCopyDuration = 6;

  /* ── Floors cleared ─────────────────────────────────────────────────────── */
  var _floorsCleared = []; // boolean array index 0-9

  /* ── Enemies ────────────────────────────────────────────────────────────── */
  var _enemies       = []; // { mesh, floor, hp, speed, pos }
  var _maxEnemies    = 20;
  var _spawnTimer    = 0;
  var _spawnInterval = 4;

  /* ── Helicopter ─────────────────────────────────────────────────────────── */
  var _heliMesh       = null;
  var _heliStatus     = 'WAITING'; // WAITING | INBOUND | DEPARTING
  var _heliAngle      = 0;
  var _heliRadius     = 22;
  var _heliAltitude   = 0;
  var _warningTimes   = [360, 240, 120]; // 6min, 4min, 2min
  var _warningsFired  = [false, false, false];
  var _warningLight   = null;
  var _warningFlash   = 0;

  /* ── Elevator ───────────────────────────────────────────────────────────── */
  var _elevatorMesh   = null;
  var _elevatorFloor  = 1;
  var _elevatorMoving = false;
  var _elevatorTarget = 1;
  var _elevatorTimer  = 0;
  var _elevatorBroken = false; // broken above floor 4

  /* ── Rappel ─────────────────────────────────────────────────────────────── */
  var _rappelRope     = null;
  var _rappelActive   = false;
  var _rappelTimer    = 0;

  /* ── Armored vehicle ────────────────────────────────────────────────────── */
  var _armoredVehicle       = null;
  var _vehicleDisabled      = false;
  var _vehicleReinforcements = 0; // soldiers sent

  /* ── Hostage ────────────────────────────────────────────────────────────── */
  var _hostageMesh   = null;
  var _chairMesh     = null;
  var _hostagePos    = { x: 3, y: 0, z: 2 };

  /* ── RPG nest ───────────────────────────────────────────────────────────── */
  var _rpgMesh       = null;
  var _rpgPos        = { x: 5, y: 0, z: -4 };

  /* ── Power box ──────────────────────────────────────────────────────────── */
  var _powerBox      = null;
  var _darknessFloors = []; // floors 6-8 in darkness

  /* ── Server room ────────────────────────────────────────────────────────── */
  var _serverMesh    = null;

  /* ── Building group ─────────────────────────────────────────────────────── */
  var _buildingGroup = null;
  var _windowMeshes  = [];
  var _stairMeshes   = [];
  var _floorLights   = [];

  /* ── Bullets / combat ───────────────────────────────────────────────────── */
  var _bullets       = []; // { mesh, dir, pos, life }
  var _shootCooldown = 0;

  /* ── HUD ─────────────────────────────────────────────────────────────────── */
  var _hudEl         = null;

  /* ─────────────────────────────────────────────────────────────────────────
     HELPERS
  ───────────────────────────────────────────────────────────────────────── */

  function _floorY(floor) {
    return (floor - 1) * FLOOR_HEIGHT;
  }

  function _makeBox(w, h, d, color, transparent, opacity) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({
      color: color,
      transparent: !!transparent,
      opacity: (opacity !== undefined) ? opacity : 1
    });
    return new THREE.Mesh(geo, mat);
  }

  function _makeWireBox(w, h, d, color) {
    var geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d));
    var mat = new THREE.LineBasicMaterial({ color: color });
    return new THREE.LineSegments(geo, mat);
  }

  function _makeCylinder(rt, rb, h, segs, color) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function _dist2D(a, b) {
    var dx = a.x - b.x;
    var dz = (a.z || 0) - (b.z || 0);
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _padTime(seconds) {
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
  }

  function _countEnemies() {
    return _enemies.filter(function (e) { return e.hp > 0; }).length;
  }

  /* ─────────────────────────────────────────────────────────────────────────
     BUILD SCENE
  ───────────────────────────────────────────────────────────────────────── */

  function _buildScene() {
    _buildingGroup = new THREE.Group();
    _scene.add(_buildingGroup);

    /* Building shell */
    var buildingMesh = _makeBox(BUILDING_W, BUILDING_H, BUILDING_D, 0x556644);
    buildingMesh.position.set(0, BUILDING_H / 2, 0);
    _buildingGroup.add(buildingMesh);

    /* Floor slabs and windows */
    for (var f = 1; f <= TOTAL_FLOORS; f++) {
      var fy = _floorY(f);

      /* Floor slab */
      var slab = _makeBox(BUILDING_W, 0.2, BUILDING_D, 0x445533);
      slab.position.set(0, fy, 0);
      _buildingGroup.add(slab);

      /* Windows — front face */
      var win = _makeBox(2.5, 1.8, 0.1, 0x44AAFF, true, 0.45);
      win.position.set(-4, fy + 1.5, BUILDING_D / 2 + 0.05);
      win.userData.floor = f;
      _buildingGroup.add(win);
      _windowMeshes.push(win);

      var win2 = _makeBox(2.5, 1.8, 0.1, 0x44AAFF, true, 0.45);
      win2.position.set(4, fy + 1.5, BUILDING_D / 2 + 0.05);
      win2.userData.floor = f;
      _buildingGroup.add(win2);
      _windowMeshes.push(win2);

      /* Stairwell ladder LineSegments each floor */
      var stairPts = [];
      for (var step = 0; step <= 8; step++) {
        var sx = -BUILDING_W / 2 + 1.5;
        var sy = fy + step * (FLOOR_HEIGHT / 8);
        var sz = -BUILDING_D / 2 + 1.5;
        if (step % 2 === 0) {
          stairPts.push(sx - 0.3, sy, sz);
          stairPts.push(sx + 0.3, sy, sz);
        } else {
          stairPts.push(sx - 0.3, sy, sz);
          stairPts.push(sx - 0.3, sy + FLOOR_HEIGHT / 8, sz);
        }
      }
      var stairGeo = new THREE.BufferGeometry();
      stairGeo.setAttribute('position', new THREE.Float32BufferAttribute(stairPts, 3));
      var stairMat = new THREE.LineBasicMaterial({ color: 0x887755 });
      var stairLines = new THREE.LineSegments(stairGeo, stairMat);
      _buildingGroup.add(stairLines);
      _stairMeshes.push(stairLines);

      /* Floor light */
      var light = new THREE.PointLight(0xFFEECC, 0.6, 8);
      light.position.set(0, fy + 2, 0);
      light.userData.floor = f;
      _buildingGroup.add(light);
      _floorLights.push(light);

      _floorsCleared.push(false);
    }

    /* Rooftop helipad */
    var helipadY = _floorY(TOTAL_FLOORS + 1);
    var helipad = _makeBox(BUILDING_W, 0.5, BUILDING_D, 0x334433);
    helipad.position.set(0, helipadY, 0);
    _buildingGroup.add(helipad);

    /* H marker on helipad — LineSegments */
    var hPts = [
      -2.5, helipadY + 0.3, 0,  -2.5, helipadY + 0.3, -3,
       2.5, helipadY + 0.3, 0,   2.5, helipadY + 0.3, -3,
      -2.5, helipadY + 0.3, -1.5, 2.5, helipadY + 0.3, -1.5
    ];
    var hGeo = new THREE.BufferGeometry();
    hGeo.setAttribute('position', new THREE.Float32BufferAttribute(hPts, 3));
    var hMat = new THREE.LineBasicMaterial({ color: 0x44FF44 });
    var hLines = new THREE.LineSegments(hGeo, hMat);
    _buildingGroup.add(hLines);

    /* Helipad perimeter light */
    var padLight = new THREE.PointLight(0x44FF44, 1.2, 12);
    padLight.position.set(0, helipadY + 1, 0);
    _buildingGroup.add(padLight);

    /* Elevator shaft */
    var shaftH = _floorY(ELEVATOR_MAX_FLOOR + 1);
    var shaft = _makeCylinder(0.6, 0.6, shaftH, 8, 0x333344);
    shaft.position.set(BUILDING_W / 2 - 1.5, shaftH / 2, 0);
    _buildingGroup.add(shaft);

    /* Elevator cab */
    _elevatorMesh = _makeBox(1.2, 2.2, 1.2, 0x445566);
    _elevatorMesh.position.set(BUILDING_W / 2 - 1.5, _floorY(1) + 1.1, 0);
    _buildingGroup.add(_elevatorMesh);

    /* Objectives */

    /* Floor 3 — server room */
    var serverFloorY = _floorY(3) + 1;
    _serverMesh = _makeBox(1.8, 1.8, 0.4, 0x225533);
    _serverMesh.position.set(2, serverFloorY, BUILDING_D / 2 - 1.5);
    _serverMesh.userData.type = 'server';
    _buildingGroup.add(_serverMesh);

    /* Floor 5 — hostage + chair */
    var hostageFloorY = _floorY(5) + 0.9;
    _hostageMesh = _makeBox(0.5, 1.6, 0.4, 0xFFDDCC);
    _hostageMesh.position.set(1, hostageFloorY, 1);
    _hostageMesh.userData.type = 'hostage';
    _buildingGroup.add(_hostageMesh);

    _chairMesh = _makeWireBox(0.6, 1.0, 0.6, 0x884422);
    _chairMesh.position.set(1, _floorY(5) + 0.5, 1);
    _buildingGroup.add(_chairMesh);

    /* Floor 7 — power box */
    var powerFloorY = _floorY(7) + 1;
    _powerBox = _makeBox(0.8, 1.2, 0.3, 0x334466);
    _powerBox.position.set(-5, powerFloorY, BUILDING_D / 2 - 0.5);
    _powerBox.userData.type = 'powerbox';
    _buildingGroup.add(_powerBox);

    /* Floor 9 — RPG nest */
    var rpgFloorY = _floorY(9) + 1.5;
    _rpgMesh = _makeCylinder(0.3, 0.4, 1.2, 8, 0x553322);
    _rpgMesh.position.set(_rpgPos.x, rpgFloorY, _rpgPos.z);
    _rpgMesh.userData.type = 'rpg';
    _buildingGroup.add(_rpgMesh);

    /* Helicopter circling */
    _heliMesh = _makeBox(4, 1, 2, 0x334455);
    _heliAltitude = helipadY + 6;
    _heliMesh.position.set(_heliRadius, _heliAltitude, 0);
    _scene.add(_heliMesh);

    /* Helicopter rotor LineSegments */
    var rotorPts = [-3, 0, 0, 3, 0, 0, 0, 0, -3, 0, 0, 3];
    var rotorGeo = new THREE.BufferGeometry();
    rotorGeo.setAttribute('position', new THREE.Float32BufferAttribute(rotorPts, 3));
    var rotorMat = new THREE.LineBasicMaterial({ color: 0x88AACC });
    var rotorLines = new THREE.LineSegments(rotorGeo, rotorMat);
    rotorLines.position.set(0, 0.7, 0);
    _heliMesh.add(rotorLines);

    /* Warning flash light */
    _warningLight = new THREE.PointLight(0x00FF00, 0, 30);
    _warningLight.position.set(0, helipadY + 2, 0);
    _scene.add(_warningLight);

    /* Player mesh */
    _playerMesh = _makeBox(0.6, 1.8, 0.6, 0x2255AA);
    _playerPos.x = 0;
    _playerPos.y = _floorY(1) + 0.9;
    _playerPos.z = 2;
    _playerMesh.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
    _scene.add(_playerMesh);

    /* Camera behind player */
    _camera.position.set(_playerPos.x, _playerPos.y + 1.2, _playerPos.z + 5);
    _camera.lookAt(_playerPos.x, _playerPos.y, _playerPos.z);

    /* Ambient + directional light */
    var ambient = new THREE.AmbientLight(0x334455, 0.8);
    _scene.add(ambient);
    var sun = new THREE.DirectionalLight(0xFFFFCC, 0.6);
    sun.position.set(20, 40, 10);
    _scene.add(sun);

    /* Ground plane */
    var ground = _makeBox(120, 0.5, 120, 0x223322);
    ground.position.set(0, -0.25, 0);
    _scene.add(ground);

    /* Spawn initial enemies */
    _spawnInitialEnemies();
  }

  /* ─────────────────────────────────────────────────────────────────────────
     ENEMY SPAWNING
  ───────────────────────────────────────────────────────────────────────── */

  function _spawnInitialEnemies() {
    /* 2 per floor for first 2 floors */
    for (var f = 1; f <= 2; f++) {
      _spawnEnemiesOnFloor(f, 2);
    }
  }

  function _spawnEnemiesOnFloor(floor, count) {
    for (var i = 0; i < count; i++) {
      if (_enemies.length >= _maxEnemies) { break; }
      var em = _makeBox(0.55, 1.7, 0.55, 0x334433);
      var ex = (Math.random() - 0.5) * (BUILDING_W - 2);
      var ez = (Math.random() - 0.5) * (BUILDING_D - 2);
      var ey = _floorY(floor) + 0.85;
      em.position.set(ex, ey, ez);
      _scene.add(em);
      _enemies.push({
        mesh: em,
        floor: floor,
        hp: 30,
        speed: 2.5 + _alertLevel * 0.4,
        pos: { x: ex, y: ey, z: ez }
      });
    }
  }

  function _onFloorCleared(floor) {
    _floorsCleared[floor - 1] = true;
    /* Next floor gets 4 enemies */
    if (floor < TOTAL_FLOORS) {
      _spawnEnemiesOnFloor(floor + 1, 4);
    }
    _alertLevel = Math.min(4, _alertLevel + 1);
    _spawnInterval = Math.max(1.5, _spawnInterval - 0.5);
  }

  /* ─────────────────────────────────────────────────────────────────────────
     ARMORED VEHICLE
  ───────────────────────────────────────────────────────────────────────── */

  function _spawnArmoredVehicle() {
    _armoredVehicle = _makeBox(5, 2.5, 3, 0x334433);
    _armoredVehicle.position.set(BUILDING_W + 6, 1.25, 0);
    _armoredVehicle.userData.type = 'vehicle';
    _scene.add(_armoredVehicle);

    /* Fuel tank indicator LineSegments */
    var ftPts = [-1, 0, 0, 1, 0, 0, 0, -0.5, 0, 0, 0.5, 0];
    var ftGeo = new THREE.BufferGeometry();
    ftGeo.setAttribute('position', new THREE.Float32BufferAttribute(ftPts, 3));
    var ftMat = new THREE.LineBasicMaterial({ color: 0xFF4400 });
    var ftLines = new THREE.LineSegments(ftGeo, ftMat);
    ftLines.position.set(2, -0.8, 0);
    _armoredVehicle.add(ftLines);

    /* Send 8 additional soldiers */
    for (var i = 0; i < 8; i++) {
      _spawnEnemiesOnFloor(Math.ceil(Math.random() * 3) + 1, 1);
    }
    _vehicleReinforcements = 8;
  }

  /* ─────────────────────────────────────────────────────────────────────────
     RAPPEL ROPE
  ───────────────────────────────────────────────────────────────────────── */

  function _startRappel() {
    if (_playerFloor < 3) { return; } // need at least 2 floors to rappel
    if (_rappelActive) { return; }
    _rappelActive = true;
    _rappelTimer = 0;

    var startY = _floorY(_playerFloor) + 1;
    var endY = _floorY(_playerFloor - 2) + 1;
    var ropeLen = startY - endY;

    var ropePts = [0, 0, 0, 0, -ropeLen, 0];
    var ropeGeo = new THREE.BufferGeometry();
    ropeGeo.setAttribute('position', new THREE.Float32BufferAttribute(ropePts, 3));
    var ropeMat = new THREE.LineBasicMaterial({ color: 0xCCBB88 });
    _rappelRope = new THREE.LineSegments(ropeGeo, ropeMat);
    _rappelRope.position.set(_playerPos.x, startY, _playerPos.z);
    _scene.add(_rappelRope);
  }

  function _finishRappel() {
    if (_rappelRope) {
      _scene.remove(_rappelRope);
      _rappelRope = null;
    }
    var targetFloor = Math.max(1, _playerFloor - 2);
    _playerFloor = targetFloor;
    _playerPos.y = _floorY(_playerFloor) + 0.9;
    _rappelActive = false;
  }

  /* ─────────────────────────────────────────────────────────────────────────
     COMBAT
  ───────────────────────────────────────────────────────────────────────── */

  function _shoot() {
    if (_shootCooldown > 0) { return; }
    _shootCooldown = 0.25;

    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(0, _yaw, 0));

    var bulletGeo = new THREE.SphereGeometry(0.08, 4, 4);
    var bulletMat = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
    var bMesh = new THREE.Mesh(bulletGeo, bulletMat);
    bMesh.position.set(_playerPos.x, _playerPos.y + 0.8, _playerPos.z);
    _scene.add(bMesh);

    _bullets.push({
      mesh: bMesh,
      dir: dir,
      pos: { x: _playerPos.x, y: _playerPos.y + 0.8, z: _playerPos.z },
      life: 2.0
    });
  }

  function _updateBullets(dt) {
    var speed = 30;
    for (var i = _bullets.length - 1; i >= 0; i--) {
      var b = _bullets[i];
      b.life -= dt;
      b.pos.x += b.dir.x * speed * dt;
      b.pos.y += b.dir.y * speed * dt;
      b.pos.z += b.dir.z * speed * dt;
      b.mesh.position.set(b.pos.x, b.pos.y, b.pos.z);

      if (b.life <= 0) {
        _scene.remove(b.mesh);
        _bullets.splice(i, 1);
        continue;
      }

      /* Check enemy hits */
      for (var j = _enemies.length - 1; j >= 0; j--) {
        var e = _enemies[j];
        if (e.hp <= 0) { continue; }
        var dx = b.pos.x - e.pos.x;
        var dy = b.pos.y - e.pos.y;
        var dz = b.pos.z - e.pos.z;
        if (Math.sqrt(dx*dx + dy*dy + dz*dz) < 0.9) {
          e.hp -= 25;
          _scene.remove(b.mesh);
          _bullets.splice(i, 1);
          if (e.hp <= 0) {
            _scene.remove(e.mesh);
            _score += 100;
            /* Check floor cleared */
            var floorEnemies = _enemies.filter(function (en) {
              return en.floor === e.floor && en.hp > 0;
            });
            if (floorEnemies.length === 0 && !_floorsCleared[e.floor - 1]) {
              _onFloorCleared(e.floor);
            }
          }
          break;
        }
      }

      /* Check power box hit (shoot to kill power) */
      if (_powerBox && !_powerKilled) {
        var pb = _powerBox.position;
        var dx2 = b.pos.x - pb.x;
        var dz2 = b.pos.z - pb.z;
        if (Math.sqrt(dx2*dx2 + dz2*dz2) < 1.2 && Math.abs(b.pos.y - pb.y) < 1.5) {
          _powerKilled = true;
          _powerBox.material.color.setHex(0x111111);
          _applyDarkness();
        }
      }

      /* Check RPG hit */
      if (_rpgMesh && !_rpgDestroyed) {
        var rp = _rpgMesh.position;
        var dx3 = b.pos.x - rp.x;
        var dz3 = b.pos.z - rp.z;
        if (Math.sqrt(dx3*dx3 + dz3*dz3) < 1.0 && Math.abs(b.pos.y - rp.y) < 1.5) {
          _rpgDestroyed = true;
          _rpgMesh.visible = false;
          _score += 500;
        }
      }

      /* Check vehicle fuel tank hit (from rooftop) */
      if (_armoredVehicle && !_vehicleDisabled) {
        var vp = _armoredVehicle.position;
        var dx4 = b.pos.x - (vp.x + 2);
        var dz4 = b.pos.z - vp.z;
        if (Math.sqrt(dx4*dx4 + dz4*dz4) < 1.5 && b.pos.y < 3) {
          _vehicleDisabled = true;
          _armoredVehicle.material.color.setHex(0x111111);
          _score += 300;
        }
      }
    }
  }

  function _applyDarkness() {
    /* Floors 6-8 go dark */
    for (var i = 0; i < _floorLights.length; i++) {
      var fl = _floorLights[i];
      var f = fl.userData.floor;
      if (f >= 6 && f <= 8) {
        fl.intensity = 0.05;
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────────────
     ELEVATOR
  ───────────────────────────────────────────────────────────────────────── */

  function _callElevator() {
    if (_elevatorMoving) { return; }
    if (_playerFloor > ELEVATOR_MAX_FLOOR) {
      /* Elevator broken above floor 4 */
      _elevatorBroken = true;
      return;
    }
    _elevatorTarget = _playerFloor;
    _elevatorMoving = true;
    _elevatorTimer = 0;
  }

  function _updateElevator(dt) {
    if (!_elevatorMoving) { return; }
    _elevatorTimer += dt;

    var targetY = _floorY(_elevatorTarget) + 1.1;
    var currentY = _elevatorMesh.position.y;
    var diff = targetY - currentY;

    if (Math.abs(diff) < 0.05) {
      _elevatorMesh.position.y = targetY;
      _elevatorMoving = false;
      _elevatorFloor = _elevatorTarget;
    } else {
      _elevatorMesh.position.y += diff * dt * 3;
    }
  }

  /* ─────────────────────────────────────────────────────────────────────────
     INTERACT (E key)
  ───────────────────────────────────────────────────────────────────────── */

  function _interact() {
    var py = _floorY(_playerFloor);

    /* Elevator call */
    var ep = _elevatorMesh.position;
    if (!_elevatorBroken && Math.abs(_playerPos.x - ep.x) < 2 && Math.abs(_playerPos.z - ep.z) < 2) {
      if (_playerFloor <= ELEVATOR_MAX_FLOOR) {
        _callElevator();
        return;
      }
    }

    /* Rappel — near a window and floor >= 3 */
    if (_playerFloor >= 3) {
      for (var wi = 0; wi < _windowMeshes.length; wi++) {
        var wm = _windowMeshes[wi];
        if (wm.userData.floor === _playerFloor) {
          var wp = wm.position;
          var wdx = _playerPos.x - wp.x;
          var wdz = _playerPos.z - wp.z;
          if (Math.sqrt(wdx*wdx + wdz*wdz) < 2.5) {
            _startRappel();
            return;
          }
        }
      }
    }

    /* Server room floor 3 */
    if (_playerFloor === 3 && !_hasServerData && !_serverCopying) {
      var sp = _serverMesh.position;
      if (Math.abs(_playerPos.x - sp.x) < 2 && Math.abs(_playerPos.z - sp.z) < 2) {
        _serverCopying = true;
        _serverCopyTimer = 0;
        return;
      }
    }

    /* Hostage floor 5 */
    if (_playerFloor === 5 && !_hostageFreed) {
      var hp = _hostageMesh.position;
      if (Math.abs(_playerPos.x - hp.x) < 2 && Math.abs(_playerPos.z - hp.z) < 2) {
        _hostageFreed = true;
        _hostageMesh.material.color.setHex(0x88FFAA);
        _chairMesh.visible = false;
        _score += 500;
        return;
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────────────
     HELICOPTER UPDATE
  ───────────────────────────────────────────────────────────────────────── */

  function _updateHelicopter(dt) {
    /* Circle rooftop */
    _heliAngle += dt * 0.4;
    var hx = Math.cos(_heliAngle) * _heliRadius;
    var hz = Math.sin(_heliAngle) * _heliRadius;
    _heliMesh.position.set(hx, _heliAltitude, hz);
    _heliMesh.rotation.y = -_heliAngle + Math.PI / 2;

    /* Rotor spin (child object) */
    if (_heliMesh.children.length > 0) {
      _heliMesh.children[0].rotation.y += dt * 8;
    }

    /* Timer warnings */
    for (var wi = 0; wi < _warningTimes.length; wi++) {
      if (!_warningsFired[wi] && _timeRemaining <= _warningTimes[wi]) {
        _warningsFired[wi] = true;
        _triggerWarning(wi);
      }
    }

    /* Flash warning light */
    if (_warningFlash > 0) {
      _warningFlash -= dt;
      _warningLight.intensity = Math.sin(_warningFlash * 10) > 0 ? 2.5 : 0;
    } else {
      _warningLight.intensity = 0;
    }

    /* Timer expired */
    if (_timeRemaining <= 0 && !_success) {
      _heliStatus = 'DEPARTING';
      /* Heli flies away */
      _heliMesh.position.y += dt * 5;
      if (!_rpgDestroyed) {
        /* RPG threatens heli */
        _failed = true;
      } else {
        _failed = true;
      }
    }

    /* Heli at 0 time — abort if player not on roof */
    if (_timeRemaining <= 0 && _playerFloor < TOTAL_FLOORS) {
      _failed = true;
    }
  }

  function _triggerWarning(index) {
    _warningFlash = 3.0;
    _warningLight.intensity = 2.5;
    _warningLight.color.setHex(0x00FF00);
    _updateHUD();
  }

  /* ─────────────────────────────────────────────────────────────────────────
     ENEMY AI
  ───────────────────────────────────────────────────────────────────────── */

  function _updateEnemies(dt) {
    for (var i = 0; i < _enemies.length; i++) {
      var e = _enemies[i];
      if (e.hp <= 0) { continue; }

      /* Move toward player if on same floor */
      if (e.floor === _playerFloor) {
        var dx = _playerPos.x - e.pos.x;
        var dz = _playerPos.z - e.pos.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 0.5) {
          var spd = e.speed * dt;
          e.pos.x += (dx / dist) * spd;
          e.pos.z += (dz / dist) * spd;
          e.mesh.position.set(e.pos.x, e.pos.y, e.pos.z);
        }

        /* Attack player */
        if (dist < 1.2) {
          _playerHP -= 8 * dt;
          if (_playerHP <= 0) {
            _failed = true;
          }
        }
      } else if (e.floor < _playerFloor) {
        /* Work upward — simulate climbing (slow) */
        var climbSpeed = 0.4 * dt;
        e.pos.y += climbSpeed;
        var targetFloorY = _floorY(e.floor + 1) + 0.85;
        if (e.pos.y >= targetFloorY) {
          e.floor = Math.min(e.floor + 1, TOTAL_FLOORS);
          e.pos.y = _floorY(e.floor) + 0.85;
        }
        e.mesh.position.set(e.pos.x, e.pos.y, e.pos.z);
      }
    }

    /* Periodic additional spawns based on alert */
    _spawnTimer += dt;
    if (_spawnTimer >= _spawnInterval) {
      _spawnTimer = 0;
      if (_enemies.filter(function (e) { return e.hp > 0; }).length < _maxEnemies) {
        var spawnFloor = Math.max(1, _playerFloor - 2);
        _spawnEnemiesOnFloor(spawnFloor, 1);
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────────────
     PLAYER MOVEMENT
  ───────────────────────────────────────────────────────────────────────── */

  function _updatePlayer(dt) {
    if (_rappelActive) {
      _rappelTimer += dt;
      if (_rappelTimer >= 1.2) {
        _finishRappel();
      }
      return;
    }

    /* Horizontal movement */
    var moveX = 0;
    var moveZ = 0;
    if (_keys['w'] || _keys['W']) { moveZ -= 1; }
    if (_keys['s'] || _keys['S']) { moveZ += 1; }
    if (_keys['a'] || _keys['A']) { moveX -= 1; }
    if (_keys['d'] || _keys['D']) { moveX += 1; }

    var cos = Math.cos(_yaw);
    var sin = Math.sin(_yaw);
    var worldX = cos * moveX - sin * moveZ;
    var worldZ = sin * moveX + cos * moveZ;
    var len = Math.sqrt(worldX * worldX + worldZ * worldZ);
    if (len > 0) {
      worldX /= len;
      worldZ /= len;
    }

    _playerPos.x += worldX * _playerSpeed * dt;
    _playerPos.z += worldZ * _playerSpeed * dt;

    /* Clamp inside building */
    var hw = BUILDING_W / 2 - 0.5;
    var hd = BUILDING_D / 2 - 0.5;
    if (_playerPos.x < -hw) { _playerPos.x = -hw; }
    if (_playerPos.x >  hw) { _playerPos.x =  hw; }
    if (_playerPos.z < -hd) { _playerPos.z = -hd; }
    if (_playerPos.z >  hd) { _playerPos.z =  hd; }

    /* Floor transitions via stairwell area */
    var stairX = -BUILDING_W / 2 + 1.5;
    var stairZ = -BUILDING_D / 2 + 1.5;
    var nearStair = Math.abs(_playerPos.x - stairX) < 1.5 && Math.abs(_playerPos.z - stairZ) < 1.5;

    if (nearStair) {
      if ((_keys['w'] || _keys['W']) && _playerFloor < TOTAL_FLOORS) {
        _playerFloor = Math.min(TOTAL_FLOORS, _playerFloor + 1);
        _playerPos.y = _floorY(_playerFloor) + 0.9;
      } else if ((_keys['s'] || _keys['S']) && _playerFloor > 1) {
        _playerFloor = Math.max(1, _playerFloor - 1);
        _playerPos.y = _floorY(_playerFloor) + 0.9;
      }
    } else {
      _playerPos.y = _floorY(_playerFloor) + 0.9;
    }

    /* Elevator ride */
    if (!_elevatorMoving && _elevatorFloor === _playerFloor) {
      var ep2 = _elevatorMesh.position;
      if (Math.abs(_playerPos.x - ep2.x) < 0.8 && Math.abs(_playerPos.z - ep2.z) < 0.8) {
        /* Ride elevator if floors match */
      }
    }

    _playerMesh.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
    _playerMesh.rotation.y = _yaw;

    /* Camera follow */
    var camDist = 5;
    _camera.position.x = _playerPos.x - Math.sin(_yaw) * camDist;
    _camera.position.y = _playerPos.y + 2;
    _camera.position.z = _playerPos.z + Math.cos(_yaw) * camDist;
    _camera.lookAt(_playerPos.x, _playerPos.y + 0.5, _playerPos.z);
  }

  /* ─────────────────────────────────────────────────────────────────────────
     SERVER COPY PROGRESS
  ───────────────────────────────────────────────────────────────────────── */

  function _updateServerCopy(dt) {
    if (!_serverCopying) { return; }
    _serverCopyTimer += dt;
    if (_serverCopyTimer >= _serverCopyDuration) {
      _serverCopying = false;
      _hasServerData = true;
      _serverMesh.material.color.setHex(0x44FF44);
      _score += 600;
    }
  }

  /* ─────────────────────────────────────────────────────────────────────────
     CHECK WIN / PERFECT EXTRACTION
  ───────────────────────────────────────────────────────────────────────── */

  function _checkWin() {
    if (_playerFloor >= TOTAL_FLOORS && _timeRemaining > 0) {
      if (_rpgDestroyed || true) { /* heli can land if RPG gone or if not threatened */
        if (!_rpgDestroyed && _timeRemaining > 0) {
          /* Heli aborts — mission fail */
          _failed = true;
          return;
        }
        _success = true;
        _heliStatus = 'INBOUND';

        /* Bonus objectives */
        if (_hasServerData && _hostageFreed && _rpgDestroyed) {
          _score += 3000;
        }
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────────────
     HUD
  ───────────────────────────────────────────────────────────────────────── */

  function _createHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'helipad-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#44FF44',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 14px',
      'border:1px solid #44FF44',
      'border-radius:4px',
      'z-index:9999',
      'pointer-events:none',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) { return; }

    var floor    = _playerFloor + '/10';
    var time     = _padTime(_timeRemaining);
    var soldiers = _countEnemies();
    var heliStat = _heliStatus;
    var objData  = _hasServerData ? '[DATA]' : (_serverCopying ? '[COPYING...]' : '[ ]data');
    var objHost  = _hostageFreed ? '[HOSTAGE]' : '[ ]hostage';
    var objRpg   = _rpgDestroyed ? '[RPG-CLEAR]' : '[ ]RPG';
    var warn     = '';

    if (_warningFlash > 0) {
      warn = ' *** HELI WARNING ***';
    }
    if (_serverCopying) {
      var pct = Math.floor((_serverCopyTimer / _serverCopyDuration) * 100);
      warn = ' [COPYING: ' + pct + '%]';
    }
    if (_failed) {
      warn = ' *** MISSION FAILED ***';
    }
    if (_success) {
      warn = ' *** EXTRACTION SUCCESS *** SCORE:' + _score;
    }

    _hudEl.textContent =
      'EXTRACTION' +
      ' [FLOOR: ' + floor + ']' +
      ' [TIME: ' + time + ']' +
      ' [SOLDIERS: ' + soldiers + ']' +
      ' [HELI: ' + heliStat + ']' +
      ' | OBJECTIVES: ' + objData + ' ' + objHost + ' ' + objRpg +
      warn;
  }

  function _removeHUD() {
    if (_hudEl && _hudEl.parentNode) {
      _hudEl.parentNode.removeChild(_hudEl);
      _hudEl = null;
    }
  }

  /* ─────────────────────────────────────────────────────────────────────────
     INPUT HANDLERS
  ───────────────────────────────────────────────────────────────────────── */

  function _onKeyDown(e) {
    var key = e.key.toLowerCase();
    _keys[e.key] = true;

    /* Activation combo H + E within 400ms */
    if (key === 'h') { _hPressTime = performance.now(); }
    if (key === 'e') { _ePressTime = performance.now(); }

    if (!_active) {
      var gap = Math.abs(_hPressTime - _ePressTime);
      if (gap < COMBO_WINDOW * 1000 && _hPressTime > 0 && _ePressTime > 0) {
        _activate();
      }
      return;
    }

    /* In-game keys */
    if (key === 'e') {
      _interact();
    }
    if (key === ' ') {
      _shoot();
    }
  }

  function _onKeyUp(e) {
    _keys[e.key] = false;
  }

  function _onMouseMove(e) {
    if (!_active) { return; }
    _mouseX += e.movementX || 0;
    _mouseY += e.movementY || 0;
    _yaw   = -_mouseX * 0.002;
    _pitch =  _mouseY * 0.002;
    _pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, _pitch));
  }

  function _onMouseDown(e) {
    if (!_active) { return; }
    if (e.button === 0) { _shoot(); }
  }

  /* ─────────────────────────────────────────────────────────────────────────
     ACTIVATE / RESET
  ───────────────────────────────────────────────────────────────────────── */

  function _activate() {
    if (_active) { return; }
    _active = true;
    _hPressTime = 0;
    _ePressTime = 0;
    _buildScene();
    _createHUD();

    /* Pointer lock */
    if (_canvas && _canvas.requestPointerLock) {
      _canvas.requestPointerLock();
    }
  }

  function _cleanupScene() {
    if (_buildingGroup) {
      _scene.remove(_buildingGroup);
      _buildingGroup = null;
    }
    if (_heliMesh) { _scene.remove(_heliMesh); _heliMesh = null; }
    if (_playerMesh) { _scene.remove(_playerMesh); _playerMesh = null; }
    if (_warningLight) { _scene.remove(_warningLight); _warningLight = null; }
    if (_armoredVehicle) { _scene.remove(_armoredVehicle); _armoredVehicle = null; }
    if (_rappelRope) { _scene.remove(_rappelRope); _rappelRope = null; }

    for (var i = 0; i < _bullets.length; i++) {
      _scene.remove(_bullets[i].mesh);
    }
    _bullets = [];

    for (var j = 0; j < _enemies.length; j++) {
      _scene.remove(_enemies[j].mesh);
    }
    _enemies = [];

    _windowMeshes = [];
    _stairMeshes  = [];
    _floorLights  = [];
    _floorsCleared = [];
  }

  /* ─────────────────────────────────────────────────────────────────────────
     PUBLIC API
  ───────────────────────────────────────────────────────────────────────── */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas || null;

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);
    document.addEventListener('mousemove', _onMouseMove);
    document.addEventListener('mousedown', _onMouseDown);
  }

  function update(dt) {
    if (!_active) { return; }
    if (_failed || _success) {
      _updateHUD();
      return;
    }

    _timeRemaining -= dt;
    if (_timeRemaining < 0) { _timeRemaining = 0; }

    /* Reinforcements at 4 minute mark */
    if (!_reinforcementsArrived && _timeRemaining <= 240) {
      _reinforcementsArrived = true;
      _spawnArmoredVehicle();
    }

    _updatePlayer(dt);
    _updateElevator(dt);
    _updateEnemies(dt);
    _updateBullets(dt);
    _updateHelicopter(dt);
    _updateServerCopy(dt);
    _checkWin();
    _updateHUD();
  }

  function reset() {
    _active        = false;
    _failed        = false;
    _success       = false;
    _score         = 0;
    _timeRemaining = MISSION_TIME;
    _alertLevel    = 1;
    _reinforcementsArrived = false;

    _playerFloor   = 1;
    _playerHP      = 100;
    _playerPos     = { x: 0, y: 0, z: 0 };

    _hasServerData  = false;
    _hostageFreed   = false;
    _rpgDestroyed   = false;
    _powerKilled    = false;
    _serverCopying  = false;
    _serverCopyTimer = 0;

    _elevatorFloor  = 1;
    _elevatorMoving = false;
    _elevatorTarget = 1;
    _elevatorBroken = false;
    _rappelActive   = false;
    _vehicleDisabled = false;

    _heliStatus    = 'WAITING';
    _heliAngle     = 0;
    _warningsFired = [false, false, false];
    _warningFlash  = 0;

    _hPressTime    = 0;
    _ePressTime    = 0;
    _keys          = {};
    _yaw           = 0;
    _pitch         = 0;
    _mouseX        = 0;
    _mouseY        = 0;
    _shootCooldown = 0;
    _spawnTimer    = 0;
    _spawnInterval = 4;

    _cleanupScene();
    _removeHUD();
  }

  return { init: init, update: update, reset: reset };

}());
