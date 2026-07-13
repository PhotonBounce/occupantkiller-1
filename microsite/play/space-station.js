// ============================================================
//  space-station.js — Space Station module
//  Activation: S+P simultaneous keypress (both keys within 400ms)
//  Zero-G environment, cosmonaut enemies, depressurization,
//  reactor sabotage, spacewalk, repair drone, HUD
// ============================================================
window.SpaceStation = (function () {
  'use strict';

  // ── Constants ────────────────────────────────────────────────────────────
  var ACTIVATION_WINDOW = 400; // ms
  var THRUST_FORCE = 12;
  var DRIFT_DAMPEN = 0.995;
  var MAGNETIC_BOOT_SNAP = 8;
  var SUCTION_RANGE = 6;
  var SUCTION_SPEED = 15;
  var SEAL_DURATION = 4000; // ms
  var ROD_REMOVE_DURATION = 6000; // ms
  var REACTOR_COUNTDOWN = 60; // s
  var O2_DURATION = 90; // s
  var HACK_DURATION = 8000; // ms
  var ENEMY_COUNT = 8;
  var PROJECTILE_SPEED = 20;
  var RICOCHET_DAMPEN = 0.8;
  var PATROL_SPEED = 2;

  // ── State ────────────────────────────────────────────────────────────────
  var _active = false;
  var _scene = null;
  var _camera = null;
  var _renderer = null;
  var _clock = null;

  // Key tracking for activation combo
  var _sPressed = false;
  var _pPressed = false;
  var _sTime = 0;
  var _pTime = 0;

  // Zero-G player state
  var _playerVelocity = { x: 0, y: 0, z: 0 };
  var _magneticBoots = true;
  var _playerPos = { x: 0, y: 2, z: 0 };
  var _playerGrounded = false;

  // HUD state
  var _o2Timer = O2_DURATION;
  var _inSpacewalk = false;
  var _rodsRemoved = 0;
  var _reactorCritical = false;
  var _reactorCountdown = REACTOR_COUNTDOWN;
  var _cosmonautsAlive = ENEMY_COUNT;
  var _hudEl = null;

  // Station objects
  var _hub = null;
  var _modules = [];
  var _dockingBay = null;
  var _reactorCore = null;
  var _wallPanels = [];
  var _breaches = [];
  var _coolingRods = [];
  var _escapePod = null;
  var _airlocks = [];
  var _debrisField = [];
  var _hullTurrets = [];
  var _repairDrone = null;

  // Enemies
  var _cosmonauts = [];
  var _projectiles = [];

  // Interaction state
  var _sealingBreachIdx = -1;
  var _sealStartTime = 0;
  var _removingRodIdx = -1;
  var _rodRemoveStartTime = 0;
  var _hackingDrone = false;
  var _hackStartTime = 0;
  var _droneHacked = false;

  // Input state
  var _keys = {};

  // THREE reference
  var THREE = null;

  // Drone state
  var _droneVelocity = { x: 0, y: 0, z: 0 };
  var _droneDetected = false;

  // ── Utility ──────────────────────────────────────────────────────────────
  function _getThree() {
    if (THREE) return THREE;
    if (window.THREE) { THREE = window.THREE; return THREE; }
    return null;
  }

  function _vec3(x, y, z) {
    var T = _getThree();
    if (T) return new T.Vector3(x, y, z);
    return { x: x, y: y, z: z };
  }

  function _dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _normalize3(v) {
    var len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (len < 0.0001) return { x: 0, y: 0, z: 0 };
    return { x: v.x / len, y: v.y / len, z: v.z / len };
  }

  function _makeMesh(geo, color, emissive) {
    var T = _getThree();
    if (!T) return null;
    var matOpts = { color: color };
    if (emissive !== undefined) {
      matOpts.emissive = emissive;
      matOpts.emissiveIntensity = 0.4;
    }
    var mat = new T.MeshStandardMaterial(matOpts);
    return new T.Mesh(geo, mat);
  }

  // ── Build Station Geometry ────────────────────────────────────────────────
  function _buildStation() {
    var T = _getThree();
    if (!T || !_scene) return;

    // Central hub 20x15x20
    var hubGeo = new T.BoxGeometry(20, 15, 20);
    _hub = _makeMesh(hubGeo, 0x445566);
    _hub.position.set(0, 0, 0);
    _scene.add(_hub);

    // 4 cylindrical module arms r=3 h=20 in +X, -X, +Z, -Z
    var armDirs = [
      { x: 1, y: 0, z: 0, rx: 0, ry: 0, rz: Math.PI / 2 },
      { x: -1, y: 0, z: 0, rx: 0, ry: 0, rz: Math.PI / 2 },
      { x: 0, y: 0, z: 1, rx: Math.PI / 2, ry: 0, rz: 0 },
      { x: 0, y: 0, z: -1, rx: Math.PI / 2, ry: 0, rz: 0 }
    ];
    var i;
    for (i = 0; i < armDirs.length; i++) {
      var dir = armDirs[i];
      var armGeo = new T.CylinderGeometry(3, 3, 20, 16);
      var arm = _makeMesh(armGeo, 0x334455);
      arm.position.set(dir.x * 20, 0, dir.z * 20);
      arm.rotation.set(dir.rx, dir.ry, dir.rz);
      _scene.add(arm);
      _modules.push(arm);
    }

    // Docking bay 15x8x10 at +Z end
    var bayGeo = new T.BoxGeometry(15, 8, 10);
    _dockingBay = _makeMesh(bayGeo, 0x223344);
    _dockingBay.position.set(0, 0, 35);
    _scene.add(_dockingBay);

    // Reactor core SphereGeometry r=4 emissive 0xFF4400
    var reactorGeo = new T.SphereGeometry(4, 16, 16);
    _reactorCore = _makeMesh(reactorGeo, 0xFF4400, 0xFF4400);
    _reactorCore.position.set(0, 0, 0);
    _scene.add(_reactorCore);

    // Wall panels (breakable) scattered around hub
    var panelPositions = [
      { x: 9, y: 2, z: 0 }, { x: -9, y: 2, z: 0 },
      { x: 0, y: 2, z: 9 }, { x: 0, y: 2, z: -9 },
      { x: 9, y: -2, z: 5 }, { x: -9, y: -2, z: -5 }
    ];
    for (i = 0; i < panelPositions.length; i++) {
      var pp = panelPositions[i];
      var panelGeo = new T.BoxGeometry(2, 2, 0.3);
      var panel = _makeMesh(panelGeo, 0x445577);
      panel.position.set(pp.x, pp.y, pp.z);
      panel.userData.intact = true;
      panel.userData.idx = i;
      _scene.add(panel);
      _wallPanels.push(panel);
    }

    // Cooling rod panels (4 in core room)
    var rodPositions = [
      { x: 3, y: 0, z: 3 }, { x: -3, y: 0, z: 3 },
      { x: 3, y: 0, z: -3 }, { x: -3, y: 0, z: -3 }
    ];
    for (i = 0; i < rodPositions.length; i++) {
      var rp = rodPositions[i];
      var rodGeo = new T.BoxGeometry(1, 4, 1);
      var rod = _makeMesh(rodGeo, 0x44FF44);
      rod.position.set(rp.x, rp.y, rp.z);
      rod.userData.removed = false;
      rod.userData.idx = i;
      _scene.add(rod);
      _coolingRods.push(rod);
    }

    // Escape pod in docking bay
    var podGeo = new T.BoxGeometry(6, 4, 8);
    _escapePod = _makeMesh(podGeo, 0x226622);
    _escapePod.position.set(0, 0, 38);
    _scene.add(_escapePod);

    // Airlocks at module ends (double-door BoxGeometry)
    var airlockDirs2 = [
      { x: 30, y: 0, z: 0 },
      { x: -30, y: 0, z: 0 },
      { x: 0, y: 0, z: 30 },
      { x: 0, y: 0, z: -30 }
    ];
    for (i = 0; i < airlockDirs2.length; i++) {
      var ad = airlockDirs2[i];
      var lockGeo = new T.BoxGeometry(3, 4, 1);
      var lock1 = _makeMesh(lockGeo, 0x334455);
      lock1.position.set(ad.x - 1, ad.y, ad.z);
      var lock2 = _makeMesh(lockGeo, 0x334455);
      lock2.position.set(ad.x + 1, ad.y, ad.z);
      lock1.userData.isAirlock = true;
      lock2.userData.isAirlock = true;
      _scene.add(lock1);
      _scene.add(lock2);
      _airlocks.push({ door1: lock1, door2: lock2, pos: { x: ad.x, y: ad.y, z: ad.z }, open: false });
    }

    // Debris field outside (floating BoxGeometry)
    for (i = 0; i < 20; i++) {
      var debGeo = new T.BoxGeometry(
        0.5 + Math.random() * 2,
        0.5 + Math.random() * 2,
        0.5 + Math.random() * 2
      );
      var deb = _makeMesh(debGeo, 0x555555);
      var angle = Math.random() * Math.PI * 2;
      var radius = 40 + Math.random() * 30;
      deb.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 20,
        Math.sin(angle) * radius
      );
      deb.userData.velocity = {
        x: (Math.random() - 0.5) * 0.5,
        y: (Math.random() - 0.5) * 0.2,
        z: (Math.random() - 0.5) * 0.5
      };
      _scene.add(deb);
      _debrisField.push(deb);
    }

    // Hull turrets (CylinderGeometry 0x882222) on hull exterior
    var turretPositions = [
      { x: 25, y: 3, z: 0 }, { x: -25, y: 3, z: 0 },
      { x: 0, y: 3, z: 25 }, { x: 0, y: 3, z: -25 }
    ];
    for (i = 0; i < turretPositions.length; i++) {
      var tp = turretPositions[i];
      var turGeo = new T.CylinderGeometry(1, 1.5, 2, 8);
      var tur = _makeMesh(turGeo, 0x882222);
      tur.position.set(tp.x, tp.y, tp.z);
      tur.userData.active = true;
      tur.userData.cooldown = 0;
      _scene.add(tur);
      _hullTurrets.push(tur);
    }

    // Repair drone CylinderGeometry r=0.6 h=1.2
    var droneGeo = new T.CylinderGeometry(0.6, 0.6, 1.2, 12);
    _repairDrone = _makeMesh(droneGeo, 0x445566);
    _repairDrone.position.set(10, 2, 0);
    _repairDrone.userData.patrolIdx = 0;
    _repairDrone.userData.hacked = false;
    _scene.add(_repairDrone);
  }

  // ── Build Cosmonauts ──────────────────────────────────────────────────────
  function _buildCosmonauts() {
    var T = _getThree();
    if (!T || !_scene) return;

    var patrolPaths = [
      [{ x: 20, y: 0, z: 0 }, { x: 25, y: 0, z: 0 }, { x: 30, y: 0, z: 0 }],
      [{ x: -20, y: 0, z: 0 }, { x: -25, y: 0, z: 0 }, { x: -30, y: 0, z: 0 }],
      [{ x: 0, y: 0, z: 20 }, { x: 0, y: 0, z: 25 }, { x: 0, y: 0, z: 30 }],
      [{ x: 0, y: 0, z: -20 }, { x: 0, y: 0, z: -25 }, { x: 0, y: 0, z: -30 }],
      [{ x: 20, y: 2, z: 10 }, { x: 25, y: 2, z: 10 }, { x: 20, y: 2, z: 15 }],
      [{ x: -20, y: -2, z: 10 }, { x: -25, y: -2, z: 10 }, { x: -20, y: -2, z: 15 }],
      [{ x: 10, y: 0, z: 20 }, { x: 15, y: 0, z: 20 }, { x: 10, y: 0, z: 25 }],
      [{ x: -10, y: 0, z: -20 }, { x: -15, y: 0, z: -20 }, { x: -10, y: 0, z: -25 }]
    ];

    var i;
    for (i = 0; i < ENEMY_COUNT; i++) {
      var bodyGeo = new T.BoxGeometry(1, 1.8, 0.8);
      var body = _makeMesh(bodyGeo, 0x334466);

      // Plasma rifle
      var rifleGeo = new T.BoxGeometry(0.2, 0.2, 1.2);
      var rifle = _makeMesh(rifleGeo, 0x44AAFF);
      rifle.position.set(0.6, 0, 0.6);
      body.add(rifle);

      var path = patrolPaths[i % patrolPaths.length];
      body.position.set(path[0].x, path[0].y, path[0].z);
      body.userData = {
        alive: true,
        boots: true,
        velocity: { x: 0, y: 0, z: 0 },
        patrolPath: path,
        patrolIdx: 0,
        patrolDir: 1,
        shootCooldown: 2 + Math.random() * 3,
        hp: 3,
        idx: i
      };
      _scene.add(body);
      _cosmonauts.push(body);
    }
  }

  // ── HUD ──────────────────────────────────────────────────────────────────
  function _buildHUD() {
    if (_hudEl) return;
    _hudEl = document.createElement('div');
    _hudEl.id = 'space-station-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,20,40,0.85)',
      'color:#00ffcc',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 14px',
      'border:1px solid #00ffcc',
      'border-radius:4px',
      'z-index:9999',
      'pointer-events:none',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hudEl);
    _updateHUD();
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var gravity = _magneticBoots ? 'BOOTS-ON' : 'ZERO-G';
    var o2Str = _inSpacewalk ? Math.max(0, Math.ceil(_o2Timer)) + 's' : '90s';
    var reactorStr = _reactorCritical
      ? 'CRITICAL T-' + Math.max(0, Math.ceil(_reactorCountdown)) + 's'
      : 'STABLE';
    var bootsStr = _magneticBoots ? 'ON' : 'OFF';
    _hudEl.textContent = [
      'STATION',
      '[GRAVITY: ' + gravity + ']',
      '[O2: ' + o2Str + ']',
      '[RODS: ' + _rodsRemoved + '/4]',
      '[REACTOR: ' + reactorStr + ']',
      '[COSMONAUTS: ' + _cosmonautsAlive + ']',
      '| BOOTS: ' + bootsStr
    ].join(' ');
  }

  function _removeHUD() {
    if (_hudEl && _hudEl.parentNode) _hudEl.parentNode.removeChild(_hudEl);
    _hudEl = null;
  }

  // ── Input Handlers ────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    var k = e.key.toUpperCase();
    _keys[k] = true;

    // Activation combo: S + P within ACTIVATION_WINDOW ms
    if (k === 'S') { _sPressed = true; _sTime = Date.now(); }
    if (k === 'P') { _pPressed = true; _pTime = Date.now(); }

    if (!_active) {
      if (_sPressed && _pPressed && Math.abs(_sTime - _pTime) <= ACTIVATION_WINDOW) {
        _activate();
      }
      return;
    }

    // Magnetic boots toggle
    if (k === ' ') {
      _grabSurface();
    }
    // E key interactions
    if (k === 'E') {
      _startInteraction();
    }
  }

  function _onKeyUp(e) {
    var k = e.key.toUpperCase();
    _keys[k] = false;
    if (k === 'S') _sPressed = false;
    if (k === 'P') _pPressed = false;

    if (!_active) return;

    if (k === 'E') {
      _cancelInteraction();
    }
  }

  // ── Interaction ───────────────────────────────────────────────────────────
  function _startInteraction() {
    // Check nearest breach to seal
    var nearest = _findNearestBreach();
    if (nearest !== -1) {
      _sealingBreachIdx = nearest;
      _sealStartTime = Date.now();
      _showToast('Sealing breach... hold E for ' + (SEAL_DURATION / 1000) + 's');
      return;
    }

    // Check cooling rod
    var rod = _findNearestCoolingRod();
    if (rod !== -1) {
      _removingRodIdx = rod;
      _rodRemoveStartTime = Date.now();
      _showToast('Removing cooling rod... hold E for ' + (ROD_REMOVE_DURATION / 1000) + 's');
      return;
    }

    // Check drone hack
    if (_repairDrone && !_droneHacked) {
      var droneDist = _dist3(_playerPos, {
        x: _repairDrone.position.x,
        y: _repairDrone.position.y,
        z: _repairDrone.position.z
      });
      if (droneDist < 4) {
        _hackingDrone = true;
        _hackStartTime = Date.now();
        _showToast('Hacking drone... hold E for ' + (HACK_DURATION / 1000) + 's');
      }
    }
  }

  function _cancelInteraction() {
    _sealingBreachIdx = -1;
    _removingRodIdx = -1;
    _hackingDrone = false;
  }

  function _findNearestBreach() {
    var i, b;
    for (i = 0; i < _breaches.length; i++) {
      b = _breaches[i];
      if (!b.sealed) {
        var d = _dist3(_playerPos, { x: b.mesh.position.x, y: b.mesh.position.y, z: b.mesh.position.z });
        if (d < 3) return i;
      }
    }
    return -1;
  }

  function _findNearestCoolingRod() {
    var i, rod;
    for (i = 0; i < _coolingRods.length; i++) {
      rod = _coolingRods[i];
      if (!rod.userData.removed) {
        var d = _dist3(_playerPos, { x: rod.position.x, y: rod.position.y, z: rod.position.z });
        if (d < 3) return i;
      }
    }
    return -1;
  }

  // ── Gravity / Zero-G movement ─────────────────────────────────────────────
  function _grabSurface() {
    // Find nearest wall/floor
    var nearestDist = 999;
    var i;
    for (i = 0; i < _wallPanels.length; i++) {
      var p = _wallPanels[i];
      var d = _dist3(_playerPos, { x: p.position.x, y: p.position.y, z: p.position.z });
      if (d < nearestDist) nearestDist = d;
    }
    if (nearestDist < MAGNETIC_BOOT_SNAP || !_magneticBoots) {
      _magneticBoots = !_magneticBoots;
      if (_magneticBoots) {
        _playerVelocity.x = 0;
        _playerVelocity.y = 0;
        _playerVelocity.z = 0;
      }
      _showToast('Magnetic boots: ' + (_magneticBoots ? 'ON' : 'OFF'));
      _updateHUD();
    }
  }

  function _updatePlayerMovement(dt) {
    if (!_camera) return;

    if (_magneticBoots) {
      // Normal movement relative to camera direction
      var speed = 5;
      var fwd = { x: 0, y: 0, z: -1 };
      var right = { x: 1, y: 0, z: 0 };
      var up = { x: 0, y: 1, z: 0 };

      if (_camera.getWorldDirection) {
        var dir = _camera.getWorldDirection(_vec3(0, 0, 0));
        fwd.x = dir.x; fwd.y = dir.y; fwd.z = dir.z;
        // right = fwd x worldUp
        right.x = fwd.z; right.z = -fwd.x;
      }

      var move = { x: 0, y: 0, z: 0 };
      if (_keys['W']) { move.x += fwd.x * speed * dt; move.y += fwd.y * speed * dt; move.z += fwd.z * speed * dt; }
      if (_keys['S'] && _active) { move.x -= fwd.x * speed * dt; move.y -= fwd.y * speed * dt; move.z -= fwd.z * speed * dt; }
      if (_keys['A']) { move.x -= right.x * speed * dt; move.z -= right.z * speed * dt; }
      if (_keys['D']) { move.x += right.x * speed * dt; move.z += right.z * speed * dt; }
      if (_keys['Q']) { move.y += speed * dt; }
      if (_keys['E'] && !_keys['E']) { move.y -= speed * dt; } // E held = interact, not move

      _playerPos.x += move.x;
      _playerPos.y += move.y;
      _playerPos.z += move.z;
    } else {
      // Zero-G: thrust vectors
      var thrustForce = THRUST_FORCE;
      var camFwd = { x: 0, y: 0, z: -1 };
      var camRight = { x: 1, y: 0, z: 0 };

      if (_camera.getWorldDirection) {
        var cdir = _camera.getWorldDirection(_vec3(0, 0, 0));
        camFwd.x = cdir.x; camFwd.y = cdir.y; camFwd.z = cdir.z;
        camRight.x = cdir.z; camRight.z = -cdir.x;
      }

      if (_keys['W']) {
        _playerVelocity.x += camFwd.x * thrustForce * dt;
        _playerVelocity.y += camFwd.y * thrustForce * dt;
        _playerVelocity.z += camFwd.z * thrustForce * dt;
      }
      if (_keys['S'] && _active) {
        _playerVelocity.x -= camFwd.x * thrustForce * dt;
        _playerVelocity.y -= camFwd.y * thrustForce * dt;
        _playerVelocity.z -= camFwd.z * thrustForce * dt;
      }
      if (_keys['A']) {
        _playerVelocity.x -= camRight.x * thrustForce * dt;
        _playerVelocity.z -= camRight.z * thrustForce * dt;
      }
      if (_keys['D']) {
        _playerVelocity.x += camRight.x * thrustForce * dt;
        _playerVelocity.z += camRight.z * thrustForce * dt;
      }
      if (_keys['Q']) { _playerVelocity.y += thrustForce * dt; }
      // E key down = interact, no vertical movement

      // Drift dampen
      _playerVelocity.x *= DRIFT_DAMPEN;
      _playerVelocity.y *= DRIFT_DAMPEN;
      _playerVelocity.z *= DRIFT_DAMPEN;

      _playerPos.x += _playerVelocity.x * dt;
      _playerPos.y += _playerVelocity.y * dt;
      _playerPos.z += _playerVelocity.z * dt;
    }

    // Apply to camera
    if (_camera) {
      _camera.position.set(_playerPos.x, _playerPos.y + 1.6, _playerPos.z);
    }
  }

  // ── Depressurization ──────────────────────────────────────────────────────
  function _shootWallPanel(panelIdx) {
    var T = _getThree();
    if (!T || !_scene) return;
    var panel = _wallPanels[panelIdx];
    if (!panel || !panel.userData.intact) return;

    panel.userData.intact = false;
    panel.visible = false;

    // Create breach
    var breachGeo = new T.BoxGeometry(2, 2, 0.1);
    var breachMat = new T.MeshStandardMaterial({ color: 0x000011, transparent: true, opacity: 0.6 });
    var breachMesh = new T.Mesh(breachGeo, breachMat);
    breachMesh.position.copy(panel.position);
    _scene.add(breachMesh);

    _breaches.push({
      mesh: breachMesh,
      pos: { x: panel.position.x, y: panel.position.y, z: panel.position.z },
      sealed: false,
      panelIdx: panelIdx
    });

    _showToast('BREACH! Vacuum suction active!');
  }

  function _updateBreaches(dt) {
    var i, j, b;
    for (i = 0; i < _breaches.length; i++) {
      b = _breaches[i];
      if (b.sealed) continue;

      // Pull enemies toward breach
      for (j = 0; j < _cosmonauts.length; j++) {
        var enemy = _cosmonauts[j];
        if (!enemy.userData.alive) continue;
        if (enemy.userData.boots) continue; // boots on = immune

        var ed = _dist3(
          { x: enemy.position.x, y: enemy.position.y, z: enemy.position.z },
          b.pos
        );
        if (ed < SUCTION_RANGE) {
          var dir2 = _normalize3({
            x: b.pos.x - enemy.position.x,
            y: b.pos.y - enemy.position.y,
            z: b.pos.z - enemy.position.z
          });
          enemy.userData.velocity.x += dir2.x * SUCTION_SPEED * dt;
          enemy.userData.velocity.y += dir2.y * SUCTION_SPEED * dt;
          enemy.userData.velocity.z += dir2.z * SUCTION_SPEED * dt;
        }
      }

      // Player sucked if no boots
      if (!_magneticBoots) {
        var pd = _dist3(_playerPos, b.pos);
        if (pd < SUCTION_RANGE) {
          var pdir = _normalize3({
            x: b.pos.x - _playerPos.x,
            y: b.pos.y - _playerPos.y,
            z: b.pos.z - _playerPos.z
          });
          _playerVelocity.x += pdir.x * SUCTION_SPEED * dt;
          _playerVelocity.y += pdir.y * SUCTION_SPEED * dt;
          _playerVelocity.z += pdir.z * SUCTION_SPEED * dt;
        }
      }
    }
  }

  function _updateSealProgress() {
    if (_sealingBreachIdx === -1) return;
    if (!_keys['E']) { _sealingBreachIdx = -1; return; }

    var elapsed = Date.now() - _sealStartTime;
    if (elapsed >= SEAL_DURATION) {
      var b = _breaches[_sealingBreachIdx];
      if (b && !b.sealed) {
        b.sealed = true;
        b.mesh.visible = false;
        // Restore panel
        if (_wallPanels[b.panelIdx]) {
          _wallPanels[b.panelIdx].visible = true;
          _wallPanels[b.panelIdx].userData.intact = true;
        }
        _showToast('Breach sealed!');
      }
      _sealingBreachIdx = -1;
    }
  }

  // ── Cooling Rods ──────────────────────────────────────────────────────────
  function _updateRodRemovalProgress() {
    if (_removingRodIdx === -1) return;
    if (!_keys['E']) { _removingRodIdx = -1; return; }

    var elapsed = Date.now() - _rodRemoveStartTime;
    if (elapsed >= ROD_REMOVE_DURATION) {
      var rod = _coolingRods[_removingRodIdx];
      if (rod && !rod.userData.removed) {
        rod.userData.removed = true;
        rod.visible = false;
        _rodsRemoved++;
        _showToast('Cooling rod removed! (' + _rodsRemoved + '/4)');
        if (_rodsRemoved >= 4) {
          _reactorCritical = true;
          _reactorCountdown = REACTOR_COUNTDOWN;
          _reactorCore.material.emissiveIntensity = 1.0;
          _showToast('REACTOR CRITICAL! Reach escape pod in ' + REACTOR_COUNTDOWN + 's!');
        }
        _updateHUD();
      }
      _removingRodIdx = -1;
    }
  }

  function _updateReactor(dt) {
    if (!_reactorCritical) return;
    _reactorCountdown -= dt;
    if (_reactorCountdown <= 0) {
      _reactorCountdown = 0;
      _triggerExplosion();
    }
    // Pulse reactor
    if (_reactorCore) {
      _reactorCore.material.emissiveIntensity = 0.5 + 0.5 * Math.sin(Date.now() * 0.01);
    }
    _updateHUD();
  }

  function _checkEscapePod() {
    if (!_reactorCritical || !_escapePod) return;
    var d = _dist3(_playerPos, {
      x: _escapePod.position.x,
      y: _escapePod.position.y,
      z: _escapePod.position.z
    });
    if (d < 5) {
      _showToast('ESCAPED! Mission complete!');
      _reactorCritical = false;
      _reactorCountdown = 0;
      _updateHUD();
    }
  }

  function _triggerExplosion() {
    _showToast('REACTOR DETONATION — MISSION FAILED');
    // Flash scene red briefly
    var T = _getThree();
    if (T && _scene) {
      _scene.background = new T.Color(0xFF2200);
      var self = this;
      setTimeout(function () {
        if (_scene) _scene.background = new T.Color(0x000011);
      }, 800);
    }
  }

  // ── Spacewalk / O2 ────────────────────────────────────────────────────────
  function _checkSpacewalk(dt) {
    // Player outside station bounds = spacewalk
    var dist = Math.sqrt(
      _playerPos.x * _playerPos.x +
      _playerPos.y * _playerPos.y +
      _playerPos.z * _playerPos.z
    );
    var wasInSpacewalk = _inSpacewalk;
    _inSpacewalk = dist > 32;

    if (_inSpacewalk) {
      _o2Timer -= dt;
      if (_o2Timer <= 0) {
        _o2Timer = 0;
        _showToast('O2 DEPLETED — PLAYER DIED');
        _deactivate();
      }
      if (!wasInSpacewalk) {
        _showToast('SPACEWALK — O2: ' + Math.ceil(_o2Timer) + 's');
      }
    } else {
      // Slowly refill O2 inside station
      if (_o2Timer < O2_DURATION) {
        _o2Timer = Math.min(O2_DURATION, _o2Timer + dt * 5);
      }
    }
    _updateHUD();
  }

  // ── Debris Field ─────────────────────────────────────────────────────────
  function _updateDebris(dt) {
    var i;
    for (i = 0; i < _debrisField.length; i++) {
      var d = _debrisField[i];
      d.position.x += d.userData.velocity.x * dt;
      d.position.y += d.userData.velocity.y * dt;
      d.position.z += d.userData.velocity.z * dt;
      d.rotation.x += 0.2 * dt;
      d.rotation.y += 0.15 * dt;
    }
  }

  // ── Cosmonaut AI ──────────────────────────────────────────────────────────
  function _updateCosmonauts(dt) {
    var i, enemy, path, target, dx, dz, dist, dir;
    for (i = 0; i < _cosmonauts.length; i++) {
      enemy = _cosmonauts[i];
      if (!enemy.userData.alive) continue;

      // Apply velocity (zero-G if boots off)
      if (!enemy.userData.boots) {
        enemy.position.x += enemy.userData.velocity.x * dt;
        enemy.position.y += enemy.userData.velocity.y * dt;
        enemy.position.z += enemy.userData.velocity.z * dt;

        // Check if sucked out of bounds
        var eDist = _dist3(
          { x: enemy.position.x, y: enemy.position.y, z: enemy.position.z },
          { x: 0, y: 0, z: 0 }
        );
        if (eDist > 60) {
          enemy.userData.alive = false;
          enemy.visible = false;
          _cosmonautsAlive--;
          _updateHUD();
          continue;
        }
      } else {
        // Patrol along path
        path = enemy.userData.patrolPath;
        target = path[enemy.userData.patrolIdx];
        dx = target.x - enemy.position.x;
        dz = target.z - enemy.position.z;
        dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 0.5) {
          enemy.userData.patrolIdx += enemy.userData.patrolDir;
          if (enemy.userData.patrolIdx >= path.length) {
            enemy.userData.patrolIdx = path.length - 2;
            enemy.userData.patrolDir = -1;
          } else if (enemy.userData.patrolIdx < 0) {
            enemy.userData.patrolIdx = 1;
            enemy.userData.patrolDir = 1;
          }
        } else {
          enemy.position.x += (dx / dist) * PATROL_SPEED * dt;
          enemy.position.z += (dz / dist) * PATROL_SPEED * dt;
        }
      }

      // Shoot at player
      enemy.userData.shootCooldown -= dt;
      if (enemy.userData.shootCooldown <= 0) {
        var shootDist = _dist3(_playerPos, {
          x: enemy.position.x,
          y: enemy.position.y,
          z: enemy.position.z
        });
        if (shootDist < 30) {
          _spawnProjectile(
            { x: enemy.position.x, y: enemy.position.y + 0.8, z: enemy.position.z },
            { x: _playerPos.x, y: _playerPos.y + 1.6, z: _playerPos.z },
            false
          );
          enemy.userData.shootCooldown = 2 + Math.random() * 3;
        } else {
          enemy.userData.shootCooldown = 1;
        }
      }

      // Face player
      dir = {
        x: _playerPos.x - enemy.position.x,
        z: _playerPos.z - enemy.position.z
      };
      if (Math.abs(dir.x) + Math.abs(dir.z) > 0.1) {
        enemy.rotation.y = Math.atan2(dir.x, dir.z);
      }
    }
  }

  // ── Projectiles ───────────────────────────────────────────────────────────
  function _spawnProjectile(fromPos, toPos, isPlayer) {
    var T = _getThree();
    if (!T || !_scene) return;

    var projGeo = new T.CylinderGeometry(0.05, 0.05, 0.4, 6);
    var projMat = new T.MeshStandardMaterial({
      color: isPlayer ? 0xFFFF00 : 0x44AAFF,
      emissive: isPlayer ? 0xFFAA00 : 0x2255AA,
      emissiveIntensity: 0.8
    });
    var proj = new T.Mesh(projGeo, projMat);
    proj.position.set(fromPos.x, fromPos.y, fromPos.z);

    var dir = _normalize3({
      x: toPos.x - fromPos.x,
      y: toPos.y - fromPos.y,
      z: toPos.z - fromPos.z
    });

    proj.userData = {
      velocity: {
        x: dir.x * PROJECTILE_SPEED,
        y: dir.y * PROJECTILE_SPEED,
        z: dir.z * PROJECTILE_SPEED
      },
      isPlayer: isPlayer,
      bounces: 0,
      maxBounces: 3,
      tracer: null,
      age: 0
    };

    // LineSegments tracer for zero-G miss
    var points = [];
    points.push(new T.Vector3(fromPos.x, fromPos.y, fromPos.z));
    points.push(new T.Vector3(fromPos.x + dir.x * 2, fromPos.y + dir.y * 2, fromPos.z + dir.z * 2));
    var lineGeo = new T.BufferGeometry().setFromPoints(points);
    var lineMat = new T.LineBasicMaterial({ color: isPlayer ? 0xFFFF00 : 0x44AAFF, opacity: 0.5, transparent: true });
    var tracer = new T.LineSegments(lineGeo, lineMat);
    _scene.add(tracer);
    proj.userData.tracer = tracer;

    _scene.add(proj);
    _projectiles.push(proj);
  }

  function _updateProjectiles(dt) {
    var T = _getThree();
    if (!T) return;

    var toRemove = [];
    var i, j, proj, px, py, pz;

    for (i = 0; i < _projectiles.length; i++) {
      proj = _projectiles[i];
      proj.userData.age += dt;

      // Move
      proj.position.x += proj.userData.velocity.x * dt;
      proj.position.y += proj.userData.velocity.y * dt;
      proj.position.z += proj.userData.velocity.z * dt;

      px = proj.position.x;
      py = proj.position.y;
      pz = proj.position.z;

      // Wall bounce (station walls)
      var bounced = false;
      if (Math.abs(px) > 10) {
        proj.userData.velocity.x *= -RICOCHET_DAMPEN;
        proj.position.x = Math.sign(px) * 10;
        bounced = true;
      }
      if (Math.abs(py) > 7) {
        proj.userData.velocity.y *= -RICOCHET_DAMPEN;
        proj.position.y = Math.sign(py) * 7;
        bounced = true;
      }
      if (Math.abs(pz) > 10) {
        proj.userData.velocity.z *= -RICOCHET_DAMPEN;
        proj.position.z = Math.sign(pz) * 10;
        bounced = true;
      }
      if (bounced) {
        proj.userData.bounces++;
      }

      // Hit player check
      if (!proj.userData.isPlayer) {
        var pd2 = _dist3(_playerPos, { x: px, y: py, z: pz });
        if (pd2 < 1) {
          _showToast('Hit by plasma rifle!');
          toRemove.push(i);
          continue;
        }
      }

      // Hit enemies if player projectile
      if (proj.userData.isPlayer) {
        var hit = false;
        for (j = 0; j < _cosmonauts.length; j++) {
          var enemy = _cosmonauts[j];
          if (!enemy.userData.alive) continue;
          var ed2 = _dist3(
            { x: enemy.position.x, y: enemy.position.y, z: enemy.position.z },
            { x: px, y: py, z: pz }
          );
          if (ed2 < 1.2) {
            enemy.userData.hp--;
            if (enemy.userData.hp <= 0) {
              enemy.userData.alive = false;
              enemy.visible = false;
              _cosmonautsAlive--;
              _updateHUD();
            }
            toRemove.push(i);
            hit = true;
            break;
          }
        }
        if (hit) continue;

        // Hit wall panels
        for (j = 0; j < _wallPanels.length; j++) {
          var panel = _wallPanels[j];
          if (!panel.userData.intact) continue;
          var panDist = _dist3(
            { x: panel.position.x, y: panel.position.y, z: panel.position.z },
            { x: px, y: py, z: pz }
          );
          if (panDist < 1.5) {
            _shootWallPanel(j);
            toRemove.push(i);
            hit = true;
            break;
          }
        }
        if (hit) continue;
      }

      // Remove old projectiles or too many bounces
      if (proj.userData.age > 5 || proj.userData.bounces > proj.userData.maxBounces) {
        toRemove.push(i);
      }
    }

    // Remove projectiles in reverse
    for (i = toRemove.length - 1; i >= 0; i--) {
      var idx = toRemove[i];
      var p = _projectiles[idx];
      if (p) {
        if (p.userData.tracer) {
          _scene.remove(p.userData.tracer);
          p.userData.tracer.geometry.dispose();
        }
        _scene.remove(p);
        p.geometry.dispose();
        _projectiles.splice(idx, 1);
      }
    }
  }

  // ── Hull Turrets ──────────────────────────────────────────────────────────
  function _updateHullTurrets(dt) {
    if (!_inSpacewalk) return;
    var i;
    for (i = 0; i < _hullTurrets.length; i++) {
      var tur = _hullTurrets[i];
      if (!tur.userData.active) continue;
      tur.userData.cooldown -= dt;
      if (tur.userData.cooldown <= 0) {
        var td = _dist3(_playerPos, {
          x: tur.position.x,
          y: tur.position.y,
          z: tur.position.z
        });
        if (td < 40) {
          _spawnProjectile(
            { x: tur.position.x, y: tur.position.y + 1, z: tur.position.z },
            { x: _playerPos.x, y: _playerPos.y + 1.6, z: _playerPos.z },
            false
          );
          tur.userData.cooldown = 3 + Math.random() * 2;
        } else {
          tur.userData.cooldown = 1;
        }
      }
    }
  }

  // ── Repair Drone ─────────────────────────────────────────────────────────
  function _updateRepairDrone(dt) {
    if (!_repairDrone) return;
    var T = _getThree();
    if (!T) return;

    // Rotate
    _repairDrone.rotation.y += 1.5 * dt;

    if (_repairDrone.userData.hacked || _droneHacked) {
      // Follow player
      var toPlayer = _normalize3({
        x: _playerPos.x - _repairDrone.position.x,
        y: _playerPos.y - _repairDrone.position.y,
        z: _playerPos.z - _repairDrone.position.z
      });
      var droneDist2 = _dist3(_playerPos, {
        x: _repairDrone.position.x,
        y: _repairDrone.position.y,
        z: _repairDrone.position.z
      });
      if (droneDist2 > 3) {
        _repairDrone.position.x += toPlayer.x * 4 * dt;
        _repairDrone.position.y += toPlayer.y * 4 * dt;
        _repairDrone.position.z += toPlayer.z * 4 * dt;
      }

      // Attack nearest enemy
      var nearEnemy = null;
      var nearDist = 999;
      var j;
      for (j = 0; j < _cosmonauts.length; j++) {
        var e = _cosmonauts[j];
        if (!e.userData.alive) continue;
        var ed = _dist3(
          { x: _repairDrone.position.x, y: _repairDrone.position.y, z: _repairDrone.position.z },
          { x: e.position.x, y: e.position.y, z: e.position.z }
        );
        if (ed < nearDist) { nearDist = ed; nearEnemy = e; }
      }
      if (nearEnemy && nearDist < 15) {
        _spawnProjectile(
          { x: _repairDrone.position.x, y: _repairDrone.position.y, z: _repairDrone.position.z },
          { x: nearEnemy.position.x, y: nearEnemy.position.y, z: nearEnemy.position.z },
          true
        );
      }
    } else {
      // Patrol station module arms
      var patrolPoints = [
        { x: 20, y: 2, z: 0 }, { x: 0, y: 2, z: 20 },
        { x: -20, y: 2, z: 0 }, { x: 0, y: 2, z: -20 }
      ];
      var pIdx = _repairDrone.userData.patrolIdx || 0;
      var pt = patrolPoints[pIdx % patrolPoints.length];
      var toTarget = _normalize3({
        x: pt.x - _repairDrone.position.x,
        y: pt.y - _repairDrone.position.y,
        z: pt.z - _repairDrone.position.z
      });
      var distToPt = _dist3(
        { x: _repairDrone.position.x, y: _repairDrone.position.y, z: _repairDrone.position.z },
        pt
      );
      if (distToPt < 1) {
        _repairDrone.userData.patrolIdx = (pIdx + 1) % patrolPoints.length;
      } else {
        _repairDrone.position.x += toTarget.x * 3 * dt;
        _repairDrone.position.y += toTarget.y * 3 * dt;
        _repairDrone.position.z += toTarget.z * 3 * dt;
      }

      // Detect player
      var playerDist = _dist3(_playerPos, {
        x: _repairDrone.position.x,
        y: _repairDrone.position.y,
        z: _repairDrone.position.z
      });
      if (playerDist < 10) {
        if (!_droneDetected) {
          _droneDetected = true;
          _showToast('Repair drone detected you!');
        }
        _spawnProjectile(
          { x: _repairDrone.position.x, y: _repairDrone.position.y, z: _repairDrone.position.z },
          { x: _playerPos.x, y: _playerPos.y + 1.6, z: _playerPos.z },
          false
        );
      } else {
        _droneDetected = false;
      }
    }

    // Hack progress
    if (_hackingDrone && _keys['E'] && !_droneHacked) {
      var hackElapsed = Date.now() - _hackStartTime;
      if (hackElapsed >= HACK_DURATION) {
        _droneHacked = true;
        _repairDrone.userData.hacked = true;
        _repairDrone.material.color.setHex(0x00FFAA);
        _hackingDrone = false;
        _showToast('Drone hacked! It now fights for you.');
      }
    } else if (_hackingDrone && !_keys['E']) {
      _hackingDrone = false;
    }
  }

  // ── Toast / Notification ──────────────────────────────────────────────────
  function _showToast(msg) {
    try {
      if (window.HUD && window.HUD.showToast) {
        window.HUD.showToast(msg, 2500, '#00ffcc');
        return;
      }
    } catch (e) {}

    var t = document.createElement('div');
    t.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,20,40,0.9)',
      'color:#00ffcc',
      'font-family:monospace',
      'font-size:14px',
      'padding:8px 18px',
      'border:1px solid #00ffcc',
      'border-radius:4px',
      'z-index:10000',
      'pointer-events:none'
    ].join(';');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2500);
  }

  // ── Activate / Deactivate ─────────────────────────────────────────────────
  function _activate() {
    if (_active) return;
    _active = true;

    var T = _getThree();
    if (!T) {
      _showToast('SpaceStation: THREE.js not found');
      _active = false;
      return;
    }

    // Try to find existing scene/camera/renderer
    if (!_scene) {
      _scene = new T.Scene();
      _scene.background = new T.Color(0x000011);
      var ambLight = new T.AmbientLight(0x223344, 0.5);
      _scene.add(ambLight);
      var pointLight = new T.PointLight(0xFF4400, 2, 40);
      pointLight.position.set(0, 0, 0);
      _scene.add(pointLight);
    }

    if (!_camera) {
      _camera = new T.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
      _camera.position.set(0, 2, 15);
    }

    if (!_renderer) {
      _renderer = new T.WebGLRenderer({ antialias: true });
      _renderer.setSize(window.innerWidth, window.innerHeight);
      _renderer.domElement.id = 'space-station-canvas';
      _renderer.domElement.style.cssText = 'position:fixed;top:0;left:0;z-index:8000;';
      document.body.appendChild(_renderer.domElement);
    }

    _clock = new T.Clock();

    // Build station
    _buildStation();
    _buildCosmonauts();

    // HUD
    _buildHUD();

    // Reset state
    _playerPos = { x: 0, y: 2, z: 15 };
    _playerVelocity = { x: 0, y: 0, z: 0 };
    _magneticBoots = true;
    _o2Timer = O2_DURATION;
    _inSpacewalk = false;
    _rodsRemoved = 0;
    _reactorCritical = false;
    _reactorCountdown = REACTOR_COUNTDOWN;
    _cosmonautsAlive = ENEMY_COUNT;
    _breaches = [];
    _projectiles = [];
    _droneHacked = false;
    _droneDetected = false;
    _hackingDrone = false;

    _showToast('SPACE STATION — Zero-G Mode Active');
    _updateHUD();
    _loop();
  }

  function _deactivate() {
    _active = false;
    _scene = null;
    _camera = null;

    if (_renderer) {
      if (_renderer.domElement && _renderer.domElement.parentNode) {
        _renderer.domElement.parentNode.removeChild(_renderer.domElement);
      }
      _renderer.dispose();
      _renderer = null;
    }

    _removeHUD();

    _hub = null;
    _modules = [];
    _dockingBay = null;
    _reactorCore = null;
    _wallPanels = [];
    _breaches = [];
    _coolingRods = [];
    _escapePod = null;
    _airlocks = [];
    _debrisField = [];
    _hullTurrets = [];
    _repairDrone = null;
    _cosmonauts = [];
    _projectiles = [];
  }

  // ── Main Loop ─────────────────────────────────────────────────────────────
  function _loop() {
    if (!_active) return;
    requestAnimationFrame(_loop);

    var dt = _clock ? _clock.getDelta() : 0.016;
    if (dt > 0.1) dt = 0.1; // cap

    _updatePlayerMovement(dt);
    _updateCosmonauts(dt);
    _updateProjectiles(dt);
    _updateBreaches(dt);
    _updateSealProgress();
    _updateRodRemovalProgress();
    _updateReactor(dt);
    _checkEscapePod();
    _checkSpacewalk(dt);
    _updateDebris(dt);
    _updateHullTurrets(dt);
    _updateRepairDrone(dt);
    _updateHUD();

    if (_renderer && _scene && _camera) {
      _renderer.render(_scene, _camera);
    }
  }

  // ── Resize ────────────────────────────────────────────────────────────────
  function _onResize() {
    if (!_active) return;
    if (_camera) {
      _camera.aspect = window.innerWidth / window.innerHeight;
      _camera.updateProjectionMatrix();
    }
    if (_renderer) {
      _renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    window.addEventListener('keydown', _onKeyDown, false);
    window.addEventListener('keyup', _onKeyUp, false);
    window.addEventListener('resize', _onResize, false);
  }

  function destroy() {
    window.removeEventListener('keydown', _onKeyDown, false);
    window.removeEventListener('keyup', _onKeyUp, false);
    window.removeEventListener('resize', _onResize, false);
    if (_active) _deactivate();
  }

  function isActive() { return _active; }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    init: init,
    destroy: destroy,
    isActive: isActive,
    activate: _activate,
    deactivate: _deactivate
  };

}());
