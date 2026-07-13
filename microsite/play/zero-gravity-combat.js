/* ───────────────────────────────────────────────────────────────────────────
   zero-gravity-combat.js — Zero-Gravity Combat Mini-Game
   API: window.ZeroGravityCombat = { init, update, reset }
   Controls:
     Z + G (together, 400ms)  → activate zero-gravity combat
     W / S / A / D            → thrust in facing direction
     Q / E                    → thrust up / down
     M                        → toggle magnetic boots (half speed, gravity 0.5)
     G                        → throw grenade (tumbling SphereGeometry)
     Space                    → shoot weapon (recoil pushes player back 0.5 u/s)
     E (near reactor)         → plant shutdown device (30s)
     Shoot window             → airlock breach / explosive decompression
   ─────────────────────────────────────────────────────────────────────────── */
window.ZeroGravityCombat = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Game state ────────────────────────────────────────────────────────── */
  var _active        = false;
  var _gameOver      = false;
  var _missionClear  = false;

  /* ── Activation key tracking (Z+G within 400ms) ───────────────────────── */
  var _keyPressTime  = { Z: 0, G: 0 };
  var ZG_WINDOW      = 0.4; // seconds

  /* ── Player state ──────────────────────────────────────────────────────── */
  var _playerMesh    = null;
  var _playerVel     = null;  // THREE.Vector3
  var _playerHP      = 100;
  var _pitchAngle    = 0;
  var _yawAngle      = 0;
  var DRAG           = 0.98;
  var THRUST_FORCE   = 6.0;

  /* ── Oxygen ────────────────────────────────────────────────────────────── */
  var _o2Station     = 240.0; // 4 minutes in seconds (station supply)
  var _o2Suit        = 120.0; // 2 minutes standalone
  var _o2Current     = 240.0; // current o2 in seconds
  var _inStation     = true;  // whether player is inside pressurized module
  var _o2Canisters   = [];    // { mesh, pos }

  /* ── Magnetic boots ────────────────────────────────────────────────────── */
  var _bootsOn       = false;
  var BOOTS_GRAVITY  = 0.5;
  var BOOTS_SPEED    = 0.5;  // halved speed multiplier

  /* ── Weapons ───────────────────────────────────────────────────────────── */
  var _bullets       = [];   // { mesh, vel, life }
  var _grenades      = [];   // { mesh, vel, rotVel, life, bounces }
  var _shootCooldown = 0;
  var RECOIL_SPEED   = 0.5;

  /* ── Reactor & shutdown ────────────────────────────────────────────────── */
  var _reactorMesh   = null;
  var _reactorPos    = null;  // THREE.Vector3
  var _shuttingDown  = false;
  var _shutdownTimer = 0;
  var SHUTDOWN_TIME  = 30.0;

  /* ── Space station geometry ────────────────────────────────────────────── */
  var _stationModules   = []; // { mesh, center, halfSize }
  var _stationCorridors = []; // { mesh, center, halfSize }
  var _windows          = []; // { lineMesh, paneMesh, breached, center }
  var _handholds        = []; // { mesh, center }
  var _stationGroup     = null;

  /* ── Airlocks / decompression ──────────────────────────────────────────── */
  var _breaches      = []; // { center, normal }

  /* ── Enemies ───────────────────────────────────────────────────────────── */
  var _enemies = []; // { mesh, vel, hp, alive, fireTimer, recoilTimer }

  /* ── Explosions ────────────────────────────────────────────────────────── */
  var _explosions = []; // { mesh, life }

  /* ── Solar flare ───────────────────────────────────────────────────────── */
  var _gameTimer     = 0;
  var FLARE_START    = 180.0; // 3 minutes
  var _flareActive   = false;
  var FLARE_DAMAGE   = 5.0;   // per second

  /* ── Mouse look ────────────────────────────────────────────────────────── */
  var _mouseX = 0;
  var _mouseY = 0;

  /* ── Input ─────────────────────────────────────────────────────────────── */
  var _keys   = {};

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  var _hud         = null;
  var _overlayEl   = null;
  var _vigEl       = null;

  /* ══════════════════════════════════════════════════════════════════════════
     HELPERS
  ══════════════════════════════════════════════════════════════════════════ */

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function vecLen(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  }

  /* ── AABB vs sphere collision (returns penetration vector or null) ─────── */
  function aabbSphereOverlap(center, halfSize, spherePos, radius) {
    var cx = clamp(spherePos.x, center.x - halfSize.x, center.x + halfSize.x);
    var cy = clamp(spherePos.y, center.y - halfSize.y, center.y + halfSize.y);
    var cz = clamp(spherePos.z, center.z - halfSize.z, center.z + halfSize.z);
    var dx = spherePos.x - cx;
    var dy = spherePos.y - cy;
    var dz = spherePos.z - cz;
    var dist2 = dx * dx + dy * dy + dz * dz;
    if (dist2 < radius * radius) {
      return { dx: dx, dy: dy, dz: dz, dist: Math.sqrt(dist2) };
    }
    return null;
  }

  /* ── Is position inside any station module or corridor ─────────────────── */
  function isPosInStation(pos) {
    var i, m;
    for (i = 0; i < _stationModules.length; i++) {
      m = _stationModules[i];
      if (Math.abs(pos.x - m.center.x) < m.halfSize.x &&
          Math.abs(pos.y - m.center.y) < m.halfSize.y &&
          Math.abs(pos.z - m.center.z) < m.halfSize.z) {
        return true;
      }
    }
    for (i = 0; i < _stationCorridors.length; i++) {
      m = _stationCorridors[i];
      if (Math.abs(pos.x - m.center.x) < m.halfSize.x &&
          Math.abs(pos.y - m.center.y) < m.halfSize.y &&
          Math.abs(pos.z - m.center.z) < m.halfSize.z) {
        return true;
      }
    }
    return false;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     BUILD SPACE STATION
  ══════════════════════════════════════════════════════════════════════════ */

  function buildStation() {
    _stationGroup = new THREE.Group();
    _scene.add(_stationGroup);

    var metalMat = new THREE.MeshLambertMaterial({ color: 0x2A2A3A });
    var glassMat = new THREE.MeshLambertMaterial({ color: 0x88BBDD, transparent: true, opacity: 0.3 });
    var handleMat = new THREE.MeshLambertMaterial({ color: 0x667788 });

    /* 5 modules arranged in a + cross pattern */
    var modulePositions = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(18, 0, 0),
      new THREE.Vector3(-18, 0, 0),
      new THREE.Vector3(0, 0, 18),
      new THREE.Vector3(0, 0, -18)
    ];

    var i, j, pos, geo, mesh, center, hx, hy, hz;

    for (i = 0; i < modulePositions.length; i++) {
      pos = modulePositions[i];
      geo  = new THREE.BoxGeometry(6, 4, 6);
      mesh = new THREE.Mesh(geo, metalMat.clone());
      mesh.position.copy(pos);
      _stationGroup.add(mesh);

      hx = 3; hy = 2; hz = 3;
      center = new THREE.Vector3(pos.x, pos.y, pos.z);
      _stationModules.push({ mesh: mesh, center: center, halfSize: new THREE.Vector3(hx, hy, hz) });

      /* Windows on each module face — 2x2 frames */
      addWindowsToModule(pos, glassMat, hx, hy, hz);

      /* Handholds near each module */
      addHandholds(pos, handleMat);
    }

    /* Corridors linking modules — 3x3x8 boxes along X and Z axes */
    var corridorDefs = [
      { pos: new THREE.Vector3(9, 0, 0),  sx: 8, sy: 3, sz: 3 },
      { pos: new THREE.Vector3(-9, 0, 0), sx: 8, sy: 3, sz: 3 },
      { pos: new THREE.Vector3(0, 0, 9),  sx: 3, sy: 3, sz: 8 },
      { pos: new THREE.Vector3(0, 0, -9), sx: 3, sy: 3, sz: 8 }
    ];

    for (i = 0; i < corridorDefs.length; i++) {
      var cd = corridorDefs[i];
      geo  = new THREE.BoxGeometry(cd.sx, cd.sy, cd.sz);
      mesh = new THREE.Mesh(geo, metalMat.clone());
      mesh.position.copy(cd.pos);
      _stationGroup.add(mesh);
      center = new THREE.Vector3(cd.pos.x, cd.pos.y, cd.pos.z);
      _stationCorridors.push({
        mesh: mesh,
        center: center,
        halfSize: new THREE.Vector3(cd.sx / 2, cd.sy / 2, cd.sz / 2)
      });
    }

    /* Reactor core at far module */
    var reactorGeo = new THREE.BoxGeometry(3, 3, 3);
    var reactorMat = new THREE.MeshLambertMaterial({ color: 0xFF2200, emissive: 0xFF2200, emissiveIntensity: 0.6 });
    _reactorMesh = new THREE.Mesh(reactorGeo, reactorMat);
    _reactorMesh.position.set(-18, 0, 0);
    _stationGroup.add(_reactorMesh);
    _reactorPos = new THREE.Vector3(-18, 0, 0);

    /* Reactor glow light */
    var reactorLight = new THREE.PointLight(0xFF2200, 3, 15);
    reactorLight.position.set(-18, 0, 0);
    _scene.add(reactorLight);

    /* O2 canisters scattered in modules */
    var canisterMat = new THREE.MeshLambertMaterial({ color: 0x00AAFF });
    var canisterPositions = [
      new THREE.Vector3(1, -0.5, 1),
      new THREE.Vector3(18, -0.5, 2),
      new THREE.Vector3(-18, -0.5, 1),
      new THREE.Vector3(1, -0.5, 18)
    ];
    for (i = 0; i < canisterPositions.length; i++) {
      var cGeo  = new THREE.BoxGeometry(0.4, 0.8, 0.4);
      var cMesh = new THREE.Mesh(cGeo, canisterMat.clone());
      cMesh.position.copy(canisterPositions[i]);
      _stationGroup.add(cMesh);
      _o2Canisters.push({ mesh: cMesh, pos: canisterPositions[i].clone(), active: true });
    }

    /* Ambient lighting inside station */
    var ambientStation = new THREE.AmbientLight(0x334466, 0.8);
    _scene.add(ambientStation);

    var fillLight = new THREE.PointLight(0x446688, 1.5, 50);
    fillLight.position.set(0, 5, 0);
    _scene.add(fillLight);
  }

  function addWindowsToModule(modulePos, glassMat, hx, hy, hz) {
    /* Add windows on +Z and -Z faces of each module */
    var faces = [
      { normal: new THREE.Vector3(0, 0, 1),  offset: hz },
      { normal: new THREE.Vector3(0, 0, -1), offset: hz },
      { normal: new THREE.Vector3(1, 0, 0),  offset: hx },
      { normal: new THREE.Vector3(-1, 0, 0), offset: hx }
    ];

    var i, face, wx, wy, wz;
    for (i = 0; i < faces.length; i++) {
      face = faces[i];

      /* Window pane position */
      wx = modulePos.x + face.normal.x * (face.offset + 0.01);
      wy = modulePos.y;
      wz = modulePos.z + face.normal.z * (face.offset + 0.01);

      /* Glass pane */
      var paneGeo = new THREE.BoxGeometry(
        face.normal.x !== 0 ? 0.05 : 2,
        2,
        face.normal.z !== 0 ? 0.05 : 2
      );
      var paneMesh = new THREE.Mesh(paneGeo, glassMat.clone());
      paneMesh.position.set(wx, wy, wz);
      _stationGroup.add(paneMesh);

      /* Line frame (2x2 square) */
      var frameW = face.normal.x !== 0 ? 0 : 2;
      var frameH = 2;
      var frameD = face.normal.z !== 0 ? 0 : 2;

      var pts = buildWindowFrame(wx, wy, wz, frameW, frameH, frameD, face.normal);
      var lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      var lineMat = new THREE.LineBasicMaterial({ color: 0xAABBCC });
      var lineMesh = new THREE.LineSegments(lineGeo, lineMat);
      _stationGroup.add(lineMesh);

      var winCenter = new THREE.Vector3(wx, wy, wz);
      _windows.push({
        lineMesh:  lineMesh,
        paneMesh:  paneMesh,
        breached:  false,
        center:    winCenter,
        normal:    face.normal.clone()
      });
    }
  }

  function buildWindowFrame(cx, cy, cz, fw, fh, fd, normal) {
    /* Build 4-corner line loop for a 2x2 window frame */
    var hw = fw / 2, hh = fh / 2, hd = fd / 2;
    var corners = [];
    if (Math.abs(normal.x) > 0.5) {
      /* X-facing: frame in YZ plane */
      corners = [
        new THREE.Vector3(cx, cy - hh, cz - hd),
        new THREE.Vector3(cx, cy + hh, cz - hd),
        new THREE.Vector3(cx, cy + hh, cz + hd),
        new THREE.Vector3(cx, cy - hh, cz + hd)
      ];
    } else {
      /* Z-facing: frame in XY plane */
      corners = [
        new THREE.Vector3(cx - hw, cy - hh, cz),
        new THREE.Vector3(cx + hw, cy - hh, cz),
        new THREE.Vector3(cx + hw, cy + hh, cz),
        new THREE.Vector3(cx - hw, cy + hh, cz)
      ];
    }
    /* Closed loop as line segments */
    return [corners[0], corners[1], corners[1], corners[2], corners[2], corners[3], corners[3], corners[0]];
  }

  function addHandholds(modulePos, handleMat) {
    var offsets = [
      new THREE.Vector3(2, 2, 0),
      new THREE.Vector3(-2, 2, 0),
      new THREE.Vector3(0, 2, 2),
      new THREE.Vector3(0, 2, -2)
    ];
    var i, hpos, hGeo, hMesh;
    for (i = 0; i < offsets.length; i++) {
      hpos  = new THREE.Vector3(modulePos.x + offsets[i].x, modulePos.y + offsets[i].y, modulePos.z + offsets[i].z);
      hGeo  = new THREE.BoxGeometry(0.3, 0.1, 1.2);
      hMesh = new THREE.Mesh(hGeo, handleMat.clone());
      hMesh.position.copy(hpos);
      _stationGroup.add(hMesh);
      _handholds.push({ mesh: hMesh, center: hpos.clone() });
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     BUILD PLAYER
  ══════════════════════════════════════════════════════════════════════════ */

  function buildPlayer() {
    /* Simple cylinder for player body */
    var geo = new THREE.CylinderGeometry(0.3, 0.3, 1.8, 8);
    var mat = new THREE.MeshLambertMaterial({ color: 0x778899 });
    _playerMesh = new THREE.Mesh(geo, mat);
    _playerMesh.position.set(0, 0, 0);
    _scene.add(_playerMesh);

    _playerVel = new THREE.Vector3(0, 0, 0);
    _playerHP  = 100;
    _pitchAngle = 0;
    _yawAngle   = 0;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     BUILD ENEMIES
  ══════════════════════════════════════════════════════════════════════════ */

  function buildEnemies() {
    var enemyMat = new THREE.MeshLambertMaterial({ color: 0x3A3A4A });
    var startPositions = [
      new THREE.Vector3(18, 0, 0),
      new THREE.Vector3(-18, 0, 2),
      new THREE.Vector3(0, 0, 18),
      new THREE.Vector3(0, 0, -18),
      new THREE.Vector3(18, 1, 2),
      new THREE.Vector3(-18, -1, 2),
      new THREE.Vector3(2, 0, 18),
      new THREE.Vector3(-2, 0, -18)
    ];

    var i, pos, geo, mesh;
    _enemies = [];
    for (i = 0; i < 8; i++) {
      pos  = startPositions[i];
      geo  = new THREE.CylinderGeometry(0.3, 0.3, 1.6, 8);
      mesh = new THREE.Mesh(geo, enemyMat.clone());
      mesh.position.copy(pos);
      _scene.add(mesh);

      _enemies.push({
        mesh:       mesh,
        vel:        new THREE.Vector3(0, 0, 0),
        hp:         50,
        alive:      true,
        fireTimer:  1.5 + Math.random() * 3,
        recoilTimer: 0
      });
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     LAUNCH
  ══════════════════════════════════════════════════════════════════════════ */

  function launch() {
    if (_active) return;
    _active        = true;
    _gameOver      = false;
    _missionClear  = false;
    _gameTimer     = 0;
    _flareActive   = false;
    _shuttingDown  = false;
    _shutdownTimer = 0;
    _o2Current     = _o2Station;
    _inStation     = true;
    _bootsOn       = false;
    _breaches      = [];

    buildStation();
    buildPlayer();
    buildEnemies();

    /* Camera starting position */
    if (_camera) {
      _camera.position.set(0, 3, 10);
      _camera.lookAt(0, 0, 0);
    }

    showHUD();
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PLAYER UPDATE
  ══════════════════════════════════════════════════════════════════════════ */

  function updatePlayer(dt) {
    if (!_playerMesh || !_camera) return;

    /* Build facing quaternion from yaw and pitch */
    _yawAngle   += _mouseX * dt * 1.8;
    _pitchAngle += _mouseY * dt * 1.5;
    _pitchAngle  = clamp(_pitchAngle, -Math.PI * 0.45, Math.PI * 0.45);

    var qYaw   = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -_yawAngle);
    var qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), _pitchAngle);
    var faceQ  = new THREE.Quaternion().multiplyQuaternions(qYaw, qPitch);
    _playerMesh.quaternion.slerp(faceQ, dt * 8);

    /* Thrust directions in world space */
    var forward = new THREE.Vector3(0, 0, -1).applyQuaternion(faceQ);
    var right   = new THREE.Vector3(1, 0, 0).applyQuaternion(faceQ);
    var up      = new THREE.Vector3(0, 1, 0);

    var thrust    = THRUST_FORCE;
    var speedMult = _bootsOn ? BOOTS_SPEED : 1.0;

    /* WASD thrust */
    if (_keys['w'] || _keys['W']) { _playerVel.x += forward.x * thrust * speedMult * dt; _playerVel.y += forward.y * thrust * speedMult * dt; _playerVel.z += forward.z * thrust * speedMult * dt; }
    if (_keys['s'] || _keys['S']) { _playerVel.x -= forward.x * thrust * speedMult * dt; _playerVel.y -= forward.y * thrust * speedMult * dt; _playerVel.z -= forward.z * thrust * speedMult * dt; }
    if (_keys['a'] || _keys['A']) { _playerVel.x -= right.x * thrust * speedMult * dt; _playerVel.y -= right.y * thrust * speedMult * dt; _playerVel.z -= right.z * thrust * speedMult * dt; }
    if (_keys['d'] || _keys['D']) { _playerVel.x += right.x * thrust * speedMult * dt; _playerVel.y += right.y * thrust * speedMult * dt; _playerVel.z += right.z * thrust * speedMult * dt; }

    /* Q/E up/down thrust */
    if (_keys['q'] || _keys['Q']) { _playerVel.y += thrust * speedMult * dt; }
    if (_keys['e'] || _keys['E']) { _playerVel.y -= thrust * speedMult * dt; }

    /* Magnetic boots gravity */
    if (_bootsOn) {
      _playerVel.y -= BOOTS_GRAVITY * dt;
    }

    /* Drag (zero-G momentum persistence) */
    _playerVel.x *= Math.pow(DRAG, dt * 60);
    _playerVel.y *= Math.pow(DRAG, dt * 60);
    _playerVel.z *= Math.pow(DRAG, dt * 60);

    /* Decompression suction toward breaches */
    var i, b, toBreachX, toBreachY, toBreachZ, bLen;
    for (i = 0; i < _breaches.length; i++) {
      b = _breaches[i];
      toBreachX = b.center.x - _playerMesh.position.x;
      toBreachY = b.center.y - _playerMesh.position.y;
      toBreachZ = b.center.z - _playerMesh.position.z;
      bLen = Math.sqrt(toBreachX * toBreachX + toBreachY * toBreachY + toBreachZ * toBreachZ);
      if (bLen > 0.1 && bLen < 20) {
        var suck = 8.0 / (bLen + 1);
        /* Check if near handhold to resist */
        var nearHold = false;
        var h, hdx, hdy, hdz;
        for (var hi = 0; hi < _handholds.length; hi++) {
          h   = _handholds[hi];
          hdx = _playerMesh.position.x - h.center.x;
          hdy = _playerMesh.position.y - h.center.y;
          hdz = _playerMesh.position.z - h.center.z;
          if (Math.sqrt(hdx * hdx + hdy * hdy + hdz * hdz) < 1.5) {
            nearHold = true;
            break;
          }
        }
        if (!nearHold) {
          _playerVel.x += (toBreachX / bLen) * suck * dt;
          _playerVel.y += (toBreachY / bLen) * suck * dt;
          _playerVel.z += (toBreachZ / bLen) * suck * dt;
        }
      }
    }

    /* Move player */
    _playerMesh.position.x += _playerVel.x * dt;
    _playerMesh.position.y += _playerVel.y * dt;
    _playerMesh.position.z += _playerVel.z * dt;

    /* Wall bounce — check against all station AABB boxes */
    var PLAYER_R = 0.5;
    var mods = _stationModules.concat(_stationCorridors);
    var m, overlap, dot, vn, penetration;
    for (i = 0; i < mods.length; i++) {
      m = mods[i];
      overlap = aabbSphereOverlap(m.center, m.halfSize, _playerMesh.position, PLAYER_R);
      if (overlap) {
        /* Push player out */
        if (overlap.dist > 0.001) {
          penetration = PLAYER_R - overlap.dist;
          var nx = overlap.dx / overlap.dist;
          var ny = overlap.dy / overlap.dist;
          var nz = overlap.dz / overlap.dist;
          _playerMesh.position.x += nx * penetration;
          _playerMesh.position.y += ny * penetration;
          _playerMesh.position.z += nz * penetration;
          /* Inelastic bounce: reflect velocity along normal, lose 20% */
          dot = _playerVel.x * nx + _playerVel.y * ny + _playerVel.z * nz;
          if (dot < 0) {
            _playerVel.x -= 2 * dot * nx;
            _playerVel.y -= 2 * dot * ny;
            _playerVel.z -= 2 * dot * nz;
            _playerVel.x *= 0.8;
            _playerVel.y *= 0.8;
            _playerVel.z *= 0.8;
          }
        }
      }
    }

    /* Update station status */
    _inStation = isPosInStation(_playerMesh.position);

    /* Camera follow — behind and slightly above */
    var camOffset = new THREE.Vector3(0, 2, 6).applyQuaternion(faceQ);
    var desiredCam = _playerMesh.position.clone().add(camOffset);
    _camera.position.lerp(desiredCam, dt * 7);
    _camera.lookAt(_playerMesh.position);

    /* Reactor shutdown check */
    if (_shuttingDown) {
      _shutdownTimer -= dt;
      if (_shutdownTimer <= 0) {
        triggerMissionClear();
      }
    }

    /* Check if near reactor for E-key planting */
    var rdx = _playerMesh.position.x - _reactorPos.x;
    var rdy = _playerMesh.position.y - _reactorPos.y;
    var rdz = _playerMesh.position.z - _reactorPos.z;
    var reactorDist = Math.sqrt(rdx * rdx + rdy * rdy + rdz * rdz);
    if ((_keys['e'] || _keys['E']) && reactorDist < 4 && !_shuttingDown && _active) {
      _shuttingDown  = true;
      _shutdownTimer = SHUTDOWN_TIME;
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     OXYGEN SYSTEM
  ══════════════════════════════════════════════════════════════════════════ */

  function updateOxygen(dt) {
    /* Consume O2 */
    if (_inStation) {
      /* Consuming station air if station has air and no breach */
      if (_breaches.length === 0 && _o2Station > 0) {
        _o2Station  -= dt;
        _o2Current   = _o2Station;
      } else {
        /* Suit O2 */
        _o2Suit    -= dt;
        _o2Current  = _o2Suit;
      }
    } else {
      /* Outside — suit only */
      _o2Suit    -= dt;
      _o2Current  = _o2Suit;
    }

    _o2Current = Math.max(0, _o2Current);
    _o2Station = Math.max(0, _o2Station);
    _o2Suit    = Math.max(0, _o2Suit);

    /* Suffocation damage */
    if (_o2Current <= 0) {
      _playerHP -= 10 * dt;
    }

    /* Pick up O2 canisters */
    var i, can, cdx, cdy, cdz;
    for (i = 0; i < _o2Canisters.length; i++) {
      can = _o2Canisters[i];
      if (!can.active || !_playerMesh) continue;
      cdx = _playerMesh.position.x - can.pos.x;
      cdy = _playerMesh.position.y - can.pos.y;
      cdz = _playerMesh.position.z - can.pos.z;
      if (Math.sqrt(cdx * cdx + cdy * cdy + cdz * cdz) < 1.5) {
        can.active = false;
        _scene.remove(can.mesh);
        /* Replenish suit O2 */
        _o2Suit = Math.min(120, _o2Suit + 60);
        if (_o2Current < _o2Suit) _o2Current = _o2Suit;
      }
    }

    if (_playerHP <= 0) {
      endFailure('SUFFOCATED');
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SOLAR FLARE
  ══════════════════════════════════════════════════════════════════════════ */

  function updateSolarFlare(dt) {
    if (_gameTimer >= FLARE_START && !_flareActive) {
      _flareActive = true;
    }

    if (_flareActive && !_inStation && _playerMesh) {
      _playerHP -= FLARE_DAMAGE * dt;
      if (_playerHP <= 0) {
        endFailure('RADIATION');
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SHOOTING
  ══════════════════════════════════════════════════════════════════════════ */

  function shoot() {
    if (!_active || !_playerMesh || _shootCooldown > 0) return;
    _shootCooldown = 0.15;

    var qYaw   = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -_yawAngle);
    var qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), _pitchAngle);
    var faceQ  = new THREE.Quaternion().multiplyQuaternions(qYaw, qPitch);
    var dir    = new THREE.Vector3(0, 0, -1).applyQuaternion(faceQ);

    var bGeo  = new THREE.SphereGeometry(0.08, 4, 4);
    var bMat  = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
    var bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.copy(_playerMesh.position);
    bMesh.position.x += dir.x * 0.8;
    bMesh.position.y += dir.y * 0.8;
    bMesh.position.z += dir.z * 0.8;
    _scene.add(bMesh);

    _bullets.push({
      mesh: bMesh,
      vel:  new THREE.Vector3(dir.x * 40, dir.y * 40, dir.z * 40),
      life: 3.0
    });

    /* Recoil — push player backward */
    _playerVel.x -= dir.x * RECOIL_SPEED;
    _playerVel.y -= dir.y * RECOIL_SPEED;
    _playerVel.z -= dir.z * RECOIL_SPEED;
  }

  function throwGrenade() {
    if (!_active || !_playerMesh) return;

    var qYaw   = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -_yawAngle);
    var qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), _pitchAngle);
    var faceQ  = new THREE.Quaternion().multiplyQuaternions(qYaw, qPitch);
    var dir    = new THREE.Vector3(0, 0, -1).applyQuaternion(faceQ);

    var gGeo  = new THREE.SphereGeometry(0.2, 8, 8);
    var gMat  = new THREE.MeshLambertMaterial({ color: 0x558855 });
    var gMesh = new THREE.Mesh(gGeo, gMat);
    gMesh.position.copy(_playerMesh.position);
    _scene.add(gMesh);

    _grenades.push({
      mesh:   gMesh,
      vel:    new THREE.Vector3(dir.x * 10 + _playerVel.x, dir.y * 10 + _playerVel.y, dir.z * 10 + _playerVel.z),
      rotVel: new THREE.Vector3((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8),
      life:   4.0,
      bounces: 0
    });
  }

  function updateBullets(dt) {
    var i, b, overlap, win, dx, dy, dz, dist;
    for (i = _bullets.length - 1; i >= 0; i--) {
      b = _bullets[i];
      b.life -= dt;
      if (b.life <= 0) {
        _scene.remove(b.mesh);
        _bullets.splice(i, 1);
        continue;
      }

      b.mesh.position.x += b.vel.x * dt;
      b.mesh.position.y += b.vel.y * dt;
      b.mesh.position.z += b.vel.z * dt;

      /* Check window hit */
      var hitWin = false;
      var wi;
      for (wi = 0; wi < _windows.length; wi++) {
        win = _windows[wi];
        if (win.breached) continue;
        dx = b.mesh.position.x - win.center.x;
        dy = b.mesh.position.y - win.center.y;
        dz = b.mesh.position.z - win.center.z;
        dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 1.2) {
          breachWindow(win);
          _scene.remove(b.mesh);
          _bullets.splice(i, 1);
          hitWin = true;
          break;
        }
      }
      if (hitWin) continue;

      /* Check enemy hit */
      var hitEnemy = false;
      var ei, e;
      for (ei = 0; ei < _enemies.length; ei++) {
        e = _enemies[ei];
        if (!e.alive) continue;
        dx = b.mesh.position.x - e.mesh.position.x;
        dy = b.mesh.position.y - e.mesh.position.y;
        dz = b.mesh.position.z - e.mesh.position.z;
        dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 1.0) {
          e.hp -= 20;
          if (e.hp <= 0) killEnemy(e);
          _scene.remove(b.mesh);
          _bullets.splice(i, 1);
          hitEnemy = true;
          break;
        }
      }
    }
  }

  function updateGrenades(dt) {
    var i, g, mods, j, m, overlap, dot, nx, ny, nz;
    for (i = _grenades.length - 1; i >= 0; i--) {
      g = _grenades[i];
      g.life -= dt;
      if (g.life <= 0) {
        /* Explode grenade */
        spawnExplosion(g.mesh.position.clone(), 3);
        damageNearbyEnemies(g.mesh.position, 5, 40);
        _scene.remove(g.mesh);
        _grenades.splice(i, 1);
        continue;
      }

      /* Zero-G tumble */
      g.mesh.rotation.x += g.rotVel.x * dt;
      g.mesh.rotation.y += g.rotVel.y * dt;
      g.mesh.rotation.z += g.rotVel.z * dt;

      g.mesh.position.x += g.vel.x * dt;
      g.mesh.position.y += g.vel.y * dt;
      g.mesh.position.z += g.vel.z * dt;

      /* Bounce off walls */
      mods = _stationModules.concat(_stationCorridors);
      for (j = 0; j < mods.length; j++) {
        m = mods[j];
        overlap = aabbSphereOverlap(m.center, m.halfSize, g.mesh.position, 0.25);
        if (overlap && overlap.dist > 0.001) {
          var pen = 0.25 - overlap.dist;
          nx = overlap.dx / overlap.dist;
          ny = overlap.dy / overlap.dist;
          nz = overlap.dz / overlap.dist;
          g.mesh.position.x += nx * pen;
          g.mesh.position.y += ny * pen;
          g.mesh.position.z += nz * pen;
          dot = g.vel.x * nx + g.vel.y * ny + g.vel.z * nz;
          if (dot < 0) {
            g.vel.x -= 2 * dot * nx;
            g.vel.y -= 2 * dot * ny;
            g.vel.z -= 2 * dot * nz;
            g.vel.x *= 0.8;
            g.vel.y *= 0.8;
            g.vel.z *= 0.8;
          }
          g.bounces++;
        }
      }
    }
  }

  function damageNearbyEnemies(pos, radius, dmg) {
    var i, e, dx, dy, dz, dist;
    for (i = 0; i < _enemies.length; i++) {
      e = _enemies[i];
      if (!e.alive) continue;
      dx = e.mesh.position.x - pos.x;
      dy = e.mesh.position.y - pos.y;
      dz = e.mesh.position.z - pos.z;
      dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < radius) {
        e.hp -= dmg * (1 - dist / radius);
        if (e.hp <= 0) killEnemy(e);
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     AIRLOCK BREACH
  ══════════════════════════════════════════════════════════════════════════ */

  function breachWindow(win) {
    win.breached = true;

    /* Remove pane and frame */
    _stationGroup.remove(win.paneMesh);
    _stationGroup.remove(win.lineMesh);
    _scene.remove(win.paneMesh);
    _scene.remove(win.lineMesh);

    /* Register breach for decompression suction */
    _breaches.push({ center: win.center.clone(), normal: win.normal.clone() });

    /* Apply velocity to nearby enemies */
    var i, e, dx, dy, dz, dist, suck;
    for (i = 0; i < _enemies.length; i++) {
      e = _enemies[i];
      if (!e.alive) continue;
      dx = win.center.x - e.mesh.position.x;
      dy = win.center.y - e.mesh.position.y;
      dz = win.center.z - e.mesh.position.z;
      dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 15 && dist > 0.1) {
        suck = 12.0 / (dist + 0.5);
        e.vel.x += (dx / dist) * suck;
        e.vel.y += (dy / dist) * suck;
        e.vel.z += (dz / dist) * suck;
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     ENEMY UPDATE
  ══════════════════════════════════════════════════════════════════════════ */

  function updateEnemies(dt) {
    var i, e, dx, dy, dz, dist, toPlayerLen, desiredX, desiredY, desiredZ;
    for (i = 0; i < _enemies.length; i++) {
      e = _enemies[i];
      if (!e.alive) continue;

      if (!_playerMesh) continue;

      /* Float toward player */
      dx = _playerMesh.position.x - e.mesh.position.x;
      dy = _playerMesh.position.y - e.mesh.position.y;
      dz = _playerMesh.position.z - e.mesh.position.z;
      toPlayerLen = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (toPlayerLen > 0.1) {
        var speed = 3.0;
        desiredX = (dx / toPlayerLen) * speed;
        desiredY = (dy / toPlayerLen) * speed;
        desiredZ = (dz / toPlayerLen) * speed;
        /* Lerp toward desired velocity */
        e.vel.x += (desiredX - e.vel.x) * dt * 1.2;
        e.vel.y += (desiredY - e.vel.y) * dt * 1.2;
        e.vel.z += (desiredZ - e.vel.z) * dt * 1.2;
      }

      /* Apply drag */
      e.vel.x *= Math.pow(DRAG, dt * 60);
      e.vel.y *= Math.pow(DRAG, dt * 60);
      e.vel.z *= Math.pow(DRAG, dt * 60);

      /* Move */
      e.mesh.position.x += e.vel.x * dt;
      e.mesh.position.y += e.vel.y * dt;
      e.mesh.position.z += e.vel.z * dt;

      /* Wall bounce for enemy too */
      var mods = _stationModules.concat(_stationCorridors);
      var j, m, overlap, dot, nx, ny, nz, pen;
      for (j = 0; j < mods.length; j++) {
        m = mods[j];
        overlap = aabbSphereOverlap(m.center, m.halfSize, e.mesh.position, 0.5);
        if (overlap && overlap.dist > 0.001) {
          pen = 0.5 - overlap.dist;
          nx = overlap.dx / overlap.dist;
          ny = overlap.dy / overlap.dist;
          nz = overlap.dz / overlap.dist;
          e.mesh.position.x += nx * pen;
          e.mesh.position.y += ny * pen;
          e.mesh.position.z += nz * pen;
          dot = e.vel.x * nx + e.vel.y * ny + e.vel.z * nz;
          if (dot < 0) {
            e.vel.x -= 2 * dot * nx;
            e.vel.y -= 2 * dot * ny;
            e.vel.z -= 2 * dot * nz;
            e.vel.x *= 0.8;
            e.vel.y *= 0.8;
            e.vel.z *= 0.8;
          }
        }
      }

      /* Decompression suction on enemies */
      var b, bdx, bdy, bdz, bLen, suck;
      for (var bi = 0; bi < _breaches.length; bi++) {
        b = _breaches[bi];
        bdx = b.center.x - e.mesh.position.x;
        bdy = b.center.y - e.mesh.position.y;
        bdz = b.center.z - e.mesh.position.z;
        bLen = Math.sqrt(bdx * bdx + bdy * bdy + bdz * bdz);
        if (bLen > 0.1 && bLen < 20) {
          suck = 8.0 / (bLen + 1);
          e.vel.x += (bdx / bLen) * suck * dt;
          e.vel.y += (bdy / bLen) * suck * dt;
          e.vel.z += (bdz / bLen) * suck * dt;
        }
      }

      /* Enemy fires at player (slower due to recoil) */
      e.fireTimer -= dt;
      if (e.recoilTimer > 0) {
        e.recoilTimer -= dt;
      }
      if (e.fireTimer <= 0 && e.recoilTimer <= 0 && toPlayerLen < 20) {
        enemyFire(e);
        e.fireTimer   = 2.5 + Math.random() * 2;
        e.recoilTimer = 0.8; /* recoil delay before next shot */
      }

      /* Face player */
      if (toPlayerLen > 0.1) {
        var lookTarget = e.mesh.position.clone().add(new THREE.Vector3(dx, dy, dz).normalize());
        e.mesh.lookAt(lookTarget);
      }
    }
  }

  function enemyFire(e) {
    if (!_playerMesh) return;
    var dx = _playerMesh.position.x - e.mesh.position.x;
    var dy = _playerMesh.position.y - e.mesh.position.y;
    var dz = _playerMesh.position.z - e.mesh.position.z;
    var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < 0.1) return;

    var bGeo  = new THREE.SphereGeometry(0.07, 4, 4);
    var bMat  = new THREE.MeshBasicMaterial({ color: 0xFF4400 });
    var bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.copy(e.mesh.position);
    _scene.add(bMesh);

    var spd = 22;
    _bullets.push({
      mesh: bMesh,
      vel:  new THREE.Vector3((dx / dist) * spd, (dy / dist) * spd, (dz / dist) * spd),
      life: 3.0,
      enemy: true
    });

    /* Recoil pushes enemy backward */
    e.vel.x -= (dx / dist) * 0.4;
    e.vel.y -= (dy / dist) * 0.4;
    e.vel.z -= (dz / dist) * 0.4;
  }

  function checkEnemyBulletsHitPlayer() {
    var i, b, dx, dy, dz, dist;
    for (i = _bullets.length - 1; i >= 0; i--) {
      b = _bullets[i];
      if (!b.enemy || !_playerMesh) continue;
      dx = _playerMesh.position.x - b.mesh.position.x;
      dy = _playerMesh.position.y - b.mesh.position.y;
      dz = _playerMesh.position.z - b.mesh.position.z;
      dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 0.8) {
        _playerHP -= 15;
        _scene.remove(b.mesh);
        _bullets.splice(i, 1);
        if (_playerHP <= 0) {
          endFailure('KILLED IN ACTION');
        }
      }
    }
  }

  function killEnemy(e) {
    if (!e.alive) return;
    e.alive = false;
    spawnExplosion(e.mesh.position.clone(), 1.5);
    _scene.remove(e.mesh);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     EXPLOSIONS
  ══════════════════════════════════════════════════════════════════════════ */

  function spawnExplosion(pos, radius) {
    var r   = radius || 2;
    var geo = new THREE.SphereGeometry(r, 8, 8);
    var mat = new THREE.MeshBasicMaterial({ color: 0xFF6600, transparent: true, opacity: 0.9 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    _scene.add(mesh);
    _explosions.push({ mesh: mesh, life: 0.8 });
  }

  function updateExplosions(dt) {
    var i, ex;
    for (i = _explosions.length - 1; i >= 0; i--) {
      ex = _explosions[i];
      ex.life -= dt;
      if (ex.life <= 0) {
        _scene.remove(ex.mesh);
        _explosions.splice(i, 1);
        continue;
      }
      ex.mesh.material.opacity = ex.life * 0.9;
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     HUD
  ══════════════════════════════════════════════════════════════════════════ */

  function showHUD() {
    if (_hud) _hud.style.display = 'block';
    updateHUD();
  }

  function updateHUD() {
    if (!_hud || !_active) return;

    var o2Pct      = Math.max(0, Math.round((_o2Current / Math.max(_o2Station, 1)) * 100));
    var bootsState = _bootsOn ? 'ON' : 'OFF';
    var speed      = _playerVel ? vecLen(_playerVel) : 0;
    var reactorDist = 80;
    if (_playerMesh && _reactorPos) {
      var rdx = _playerMesh.position.x - _reactorPos.x;
      var rdy = _playerMesh.position.y - _reactorPos.y;
      var rdz = _playerMesh.position.z - _reactorPos.z;
      reactorDist = Math.round(Math.sqrt(rdx * rdx + rdy * rdy + rdz * rdz));
    }

    var flareRemain = Math.max(0, FLARE_START - _gameTimer);
    var fMin = Math.floor(flareRemain / 60);
    var fSec = Math.floor(flareRemain % 60);
    var flareStr = _flareActive ? 'ACTIVE!' : (fMin + ':' + (fSec < 10 ? '0' : '') + fSec);

    var shutdownStr = '';
    if (_shuttingDown) {
      shutdownStr = ' | SHUTDOWN: ' + Math.ceil(_shutdownTimer) + 's';
    }

    _hud.textContent = 'ZERO-G [O2: ' + o2Pct + '%] [BOOTS: ' + bootsState + '] [SPEED: ' + speed.toFixed(1) + ' m/s] [REACTOR: ' + reactorDist + 'm] | FLARE: ' + flareStr + shutdownStr;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     MISSION END
  ══════════════════════════════════════════════════════════════════════════ */

  function triggerMissionClear() {
    _missionClear = true;
    _active       = false;
    showOverlay('REACTOR OFFLINE<br><span style="font-size:18px">Mission Complete! Station saved.</span>', '#00FF88');
  }

  function endFailure(reason) {
    if (_gameOver) return;
    _gameOver = true;
    _active   = false;
    showOverlay('MISSION FAILED<br><span style="font-size:18px">' + (reason || 'Unknown') + '</span>', '#FF4444');
  }

  function showOverlay(html, color) {
    if (!_overlayEl) return;
    _overlayEl.innerHTML  = html;
    _overlayEl.style.color = color || '#00FF88';
    _overlayEl.style.display = 'block';
  }

  /* ══════════════════════════════════════════════════════════════════════════
     INPUT HANDLERS
  ══════════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    _keys[e.key] = true;

    /* Z+G simultaneous activation (400ms window) */
    if (e.key === 'z' || e.key === 'Z') _keyPressTime.Z = Date.now();
    if (e.key === 'g' || e.key === 'G') _keyPressTime.G = Date.now();

    var zDiff = Math.abs(_keyPressTime.Z - _keyPressTime.G) / 1000;
    if ((_keys['z'] || _keys['Z']) && (_keys['g'] || _keys['G']) && zDiff < ZG_WINDOW && !_active && !_gameOver) {
      launch();
      return;
    }

    if (!_active) return;

    /* Magnetic boots toggle */
    if (e.key === 'm' || e.key === 'M') {
      _bootsOn = !_bootsOn;
    }

    /* Shoot */
    if (e.key === ' ') {
      e.preventDefault();
      shoot();
    }

    /* Throw grenade */
    if (e.key === 'g' || e.key === 'G') {
      if (!(_keys['z'] || _keys['Z'])) {
        throwGrenade();
      }
    }
  }

  function onKeyUp(e) {
    _keys[e.key] = false;
  }

  function onMouseMove(e) {
    if (!_canvas) return;
    var rect = _canvas.getBoundingClientRect();
    _mouseX  = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
    _mouseY  = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ══════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    /* HUD bar */
    _hud = document.createElement('div');
    _hud.id = 'zerog-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#00FFCC',
      'font-family:monospace',
      'font-size:13px',
      'font-weight:bold',
      'background:rgba(0,0,0,0.6)',
      'padding:6px 16px',
      'border-radius:4px',
      'pointer-events:none',
      'display:none',
      'z-index:900',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(_hud);

    /* Mission overlay */
    _overlayEl = document.createElement('div');
    _overlayEl.id = 'zerog-overlay';
    _overlayEl.style.cssText = [
      'position:fixed',
      'top:40%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#00FF88',
      'font-family:monospace',
      'font-size:32px',
      'font-weight:bold',
      'text-align:center',
      'background:rgba(0,0,0,0.8)',
      'padding:24px 48px',
      'border-radius:8px',
      'pointer-events:none',
      'display:none',
      'z-index:902',
      'text-shadow:0 0 16px currentColor'
    ].join(';');
    document.body.appendChild(_overlayEl);

    /* Vignette for damage */
    _vigEl = document.createElement('div');
    _vigEl.id = 'zerog-vignette';
    _vigEl.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'right:0',
      'bottom:0',
      'pointer-events:none',
      'z-index:899',
      'opacity:0',
      'background:radial-gradient(ellipse at center, transparent 40%, rgba(255,0,0,0.6) 100%)',
      'transition:opacity 0.2s'
    ].join(';');
    document.body.appendChild(_vigEl);

    /* Flare warning indicator */
    var flareWarning = document.createElement('div');
    flareWarning.id = 'zerog-flare';
    flareWarning.style.cssText = [
      'position:fixed',
      'top:44px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#FF8800',
      'font-family:monospace',
      'font-size:12px',
      'font-weight:bold',
      'background:rgba(0,0,0,0.5)',
      'padding:3px 10px',
      'border-radius:3px',
      'pointer-events:none',
      'display:none',
      'z-index:901'
    ].join(';');
    flareWarning.textContent = '! SOLAR FLARE — STAY INSIDE !';
    document.body.appendChild(flareWarning);
    _hud._flareWarn = flareWarning;

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup',   onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
  }

  function update(delta) {
    if (!_active || !_scene) return;

    var dt = delta || 0.016;
    _gameTimer     += dt;
    _shootCooldown  = Math.max(0, _shootCooldown - dt);

    updatePlayer(dt);
    updateOxygen(dt);
    updateSolarFlare(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateGrenades(dt);
    updateExplosions(dt);
    checkEnemyBulletsHitPlayer();

    /* Vignette when low HP */
    if (_vigEl) {
      var hpNorm = Math.max(0, 1 - _playerHP / 100);
      _vigEl.style.opacity = String(hpNorm * 0.8);
    }

    /* Solar flare warning banner */
    if (_hud && _hud._flareWarn) {
      _hud._flareWarn.style.display = _flareActive ? 'block' : 'none';
    }

    updateHUD();
  }

  function reset() {
    _active       = false;
    _gameOver     = false;
    _missionClear = false;

    /* Remove player */
    if (_playerMesh && _scene) {
      _scene.remove(_playerMesh);
      _playerMesh = null;
    }
    _playerVel = null;

    /* Remove enemies */
    var i;
    for (i = 0; i < _enemies.length; i++) {
      if (_scene) _scene.remove(_enemies[i].mesh);
    }
    _enemies = [];

    /* Remove bullets */
    for (i = 0; i < _bullets.length; i++) {
      if (_scene) _scene.remove(_bullets[i].mesh);
    }
    _bullets = [];

    /* Remove grenades */
    for (i = 0; i < _grenades.length; i++) {
      if (_scene) _scene.remove(_grenades[i].mesh);
    }
    _grenades = [];

    /* Remove explosions */
    for (i = 0; i < _explosions.length; i++) {
      if (_scene) _scene.remove(_explosions[i].mesh);
    }
    _explosions = [];

    /* Remove station */
    if (_stationGroup && _scene) {
      _scene.remove(_stationGroup);
      _stationGroup = null;
    }
    _stationModules   = [];
    _stationCorridors = [];
    _windows          = [];
    _handholds        = [];
    _o2Canisters      = [];
    _breaches         = [];

    /* Remove reactor */
    _reactorMesh   = null;
    _reactorPos    = null;
    _shuttingDown  = false;
    _shutdownTimer = 0;

    /* Reset state */
    _gameTimer   = 0;
    _flareActive = false;
    _bootsOn     = false;
    _o2Current   = _o2Station;
    _o2Suit      = 120;
    _playerHP    = 100;
    _keys        = {};
    _mouseX      = 0;
    _mouseY      = 0;
    _pitchAngle  = 0;
    _yawAngle    = 0;

    /* Reset DOM */
    if (_hud)      { _hud.style.display      = 'none'; }
    if (_overlayEl){ _overlayEl.style.display = 'none'; }
    if (_vigEl)    { _vigEl.style.opacity     = '0'; }
    if (_hud && _hud._flareWarn) { _hud._flareWarn.style.display = 'none'; }
  }

  return { init: init, update: update, reset: reset };

}());
