/* ───────────────────────────────────────────────────────────────────────────
   volcano-escape.js — Volcano Escape Mini-Game
   API: window.VolcanoEscape = { init, update, reset }
   Controls:
     V + E (simultaneous, 400ms) → activate volcano escape
     W / S                       → move forward / backward
     A / D                       → strafe left / right
     Space                       → jump
     Mouse                       → look / aim
     F                           → collect intel (when near folder)
     G                           → enter/exit jeep
     LMB                         → fire at enemies
   ─────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Game state ────────────────────────────────────────────────────────── */
  var _active      = false;
  var _score       = 0;
  var _playerHP    = 100;
  var _playerDead  = false;
  var _escaped     = false;
  var _intelCount  = 0;   // 0-3 collected
  var _inVehicle   = false;

  /* ── Timing ────────────────────────────────────────────────────────────── */
  var _lastTime       = 0;
  var _totalTime      = 0;  // seconds elapsed since activation
  var _lavaRiseTimer  = 0;  // counts up to 30s then raises lava 1 unit
  var _rockSpawnTimer = 0;
  var _rockNextSpawn  = 2;  // random 2-5s

  /* ── Lava ──────────────────────────────────────────────────────────────── */
  var _lavaMesh       = null;
  var _lavaY          = -30;  // starts low inside volcano
  var _lavaCraterMesh = null;
  var _lavaLight      = null;

  /* ── Player position/velocity ──────────────────────────────────────────── */
  var _playerPos = null;  // THREE.Vector3
  var _playerVel = null;  // THREE.Vector3
  var _onGround  = false;
  var _yaw       = 0;
  var _pitch     = 0;

  /* ── Player marker (visual stand-in) ──────────────────────────────────── */
  var _playerMesh = null;

  /* ── Platforms / steps ─────────────────────────────────────────────────── */
  var _platforms = [];   // { mesh, minX, maxX, minZ, maxZ, y }

  /* ── Tunnel geometry ───────────────────────────────────────────────────── */
  var _tunnelMeshes = [];

  /* ── Falling rocks ─────────────────────────────────────────────────────── */
  var _rocks   = [];   // { mesh, vel, warning, warned, active }

  /* ── Fireballs (eruption) ──────────────────────────────────────────────── */
  var _fireballs = [];  // { mesh, vel, life }

  /* ── Intel folders ─────────────────────────────────────────────────────── */
  var _intelFolders = [];  // { mesh, collected, pos }

  /* ── Jeep ──────────────────────────────────────────────────────────────── */
  var _jeepMesh    = null;
  var _jeepY       = 0;
  var _jeepBlocked = false;

  /* ── Enemy guards ──────────────────────────────────────────────────────── */
  var _enemies = [];  // { mesh, hp, pos, vel, alive, isCommander, fireTimer }

  /* ── Enemy commander ───────────────────────────────────────────────────── */
  var _commanderDefeated = false;

  /* ── Helicopter at summit ──────────────────────────────────────────────── */
  var _helicopterMesh = null;

  /* ── Buildings ─────────────────────────────────────────────────────────── */
  var _buildings = [];

  /* ── Eruption state ────────────────────────────────────────────────────── */
  var _eruptionThresholds = [5, 10, 15, 20];
  var _eruptionFired      = [false, false, false, false];
  var _eruptionLight      = null;
  var _eruptionTimer      = 0;

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  var _hud = null;

  /* ── Input ─────────────────────────────────────────────────────────────── */
  var _keys = {};
  var _mouseX = 0;
  var _mouseY = 0;

  /* ── VE activation tracking ────────────────────────────────────────────── */
  var _vePressTime = { V: 0, E: 0 };
  var VE_WINDOW    = 0.4;  // 400ms

  /* ── Player bullet projectiles ─────────────────────────────────────────── */
  var _bullets = [];  // { mesh, vel, life }

  /* ── Bound handlers for cleanup ────────────────────────────────────────── */
  var _boundKeyDown    = null;
  var _boundKeyUp      = null;
  var _boundMouseMove  = null;
  var _boundMouseClick = null;

  /* ════════════════════════════════════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════════════════════════════════════ */

  function randRange(lo, hi) {
    return lo + Math.random() * (hi - lo);
  }

  function fmtTime(sec) {
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return (m < 10 ? '0' + m : '' + m) + ':' + (s < 10 ? '0' + s : '' + s);
  }

  function distXZ(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  /* ════════════════════════════════════════════════════════════════════════
     MESH BUILDERS
  ════════════════════════════════════════════════════════════════════════ */

  function buildVolcano() {
    /* Main cone */
    var coneGeo = new THREE.ConeGeometry(40, 60, 32);
    var coneMat = new THREE.MeshLambertMaterial({ color: 0x554433 });
    var cone    = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(0, 0, 0);
    _scene.add(cone);

    /* Crater lava — cylinder that rises */
    var lavaGeo  = new THREE.CylinderGeometry(7, 9, 4, 32);
    var lavaMat  = new THREE.MeshLambertMaterial({
      color:   0xFF4400,
      emissive: 0xFF2200,
      emissiveIntensity: 0.8
    });
    _lavaCraterMesh = new THREE.Mesh(lavaGeo, lavaMat);
    _lavaCraterMesh.position.set(0, _lavaY, 0);
    _scene.add(_lavaCraterMesh);

    /* Main lava fill box (rising floor) */
    var lavaFillGeo = new THREE.BoxGeometry(76, 6, 76);
    var lavaFillMat = new THREE.MeshLambertMaterial({
      color:   0xFF4400,
      emissive: 0xFF2200,
      emissiveIntensity: 0.6
    });
    _lavaMesh = new THREE.Mesh(lavaFillGeo, lavaFillMat);
    _lavaMesh.position.set(0, _lavaY - 3, 0);
    _scene.add(_lavaMesh);

    /* Crater glow light */
    _lavaLight = new THREE.PointLight(0xFF2200, 2, 60);
    _lavaLight.position.set(0, _lavaY + 6, 0);
    _scene.add(_lavaLight);

    /* Eruption point light (starts dim) */
    _eruptionLight = new THREE.PointLight(0xFF2200, 0, 80);
    _eruptionLight.position.set(0, 30, 0);
    _scene.add(_eruptionLight);
  }

  function buildBase() {
    /* 3 buildings on the flank of the volcano */
    var positions = [
      { x: -18, z: 18, w: 8, h: 10, d: 8 },
      { x: -28, z:  8, w: 6, h:  8, d: 6 },
      { x: -22, z: 28, w: 7, h: 12, d: 7 }
    ];
    for (var i = 0; i < positions.length; i++) {
      var p   = positions[i];
      var geo = new THREE.BoxGeometry(p.w, p.h, p.d);
      var mat = new THREE.MeshLambertMaterial({ color: 0x445544 });
      var m   = new THREE.Mesh(geo, mat);
      m.position.set(p.x, p.h / 2, p.z);
      _scene.add(m);
      _buildings.push(m);
    }
  }

  function buildNorthStairs() {
    /* 5 step platforms going up north face */
    for (var i = 0; i < 14; i++) {
      var geo = new THREE.BoxGeometry(6, 0.8, 3);
      var mat = new THREE.MeshLambertMaterial({ color: 0x887766 });
      var m   = new THREE.Mesh(geo, mat);
      var yp  = -20 + i * 4.5;
      var zp  = 28 - i * 2.5;
      m.position.set(0, yp, zp);
      _scene.add(m);
      _platforms.push({
        mesh: m,
        minX: -3, maxX: 3,
        minZ: zp - 1.5, maxZ: zp + 1.5,
        y: yp + 0.4
      });
    }
  }

  function buildEastLadder() {
    /* CylinderGeometry rungs up east face */
    for (var i = 0; i < 20; i++) {
      var geo = new THREE.CylinderGeometry(0.15, 0.15, 5, 8);
      var mat = new THREE.MeshLambertMaterial({ color: 0x888888 });
      var m   = new THREE.Mesh(geo, mat);
      m.rotation.z = Math.PI / 2;
      var yp  = -18 + i * 4;
      m.position.set(28, yp, 0);
      _scene.add(m);
      /* thin platform for each rung */
      var pgeo = new THREE.BoxGeometry(1.5, 0.3, 1.5);
      var pmat = new THREE.MeshLambertMaterial({ color: 0x666666 });
      var pm   = new THREE.Mesh(pgeo, pmat);
      pm.position.set(28, yp + 0.15, 0);
      _scene.add(pm);
      _platforms.push({
        mesh: pm,
        minX: 26.25, maxX: 29.75,
        minZ: -0.75,  maxZ: 0.75,
        y: yp + 0.15
      });
    }
  }

  function buildWestTunnel() {
    /* BoxGeometry 3x3x20 tunnel sections on west face */
    var sections = [
      { x: -30, y: -15, z: 0, ry: 0 },
      { x: -32, y:  -5, z: 0, ry: 0.15 },
      { x: -33, y:   5, z: 0, ry: 0.25 },
      { x: -31, y:  15, z: 0, ry: 0.1  }
    ];
    for (var i = 0; i < sections.length; i++) {
      var s   = sections[i];
      var geo = new THREE.BoxGeometry(3, 3, 20);
      var mat = new THREE.MeshLambertMaterial({
        color: 0x554433,
        transparent: true,
        opacity: 0.85
      });
      var m   = new THREE.Mesh(geo, mat);
      m.position.set(s.x, s.y, s.z);
      m.rotation.y = s.ry;
      _scene.add(m);
      _tunnelMeshes.push(m);
      /* Floor of each tunnel section as a platform */
      _platforms.push({
        mesh: m,
        minX: s.x - 1.5, maxX: s.x + 1.5,
        minZ: s.z - 10,   maxZ: s.z + 10,
        y: s.y - 1.5
      });
    }
  }

  function buildEnemies() {
    /* 8 enemy guards — positions on and around volcano paths */
    var positions = [
      { x:  2,  y: -18, z: 26, isCommander: false },
      { x: -2,  y: -10, z: 23, isCommander: false },
      { x:  4,  y:  -2, z: 20, isCommander: false },
      { x:  26, y: -15, z:  2, isCommander: false },
      { x:  26, y:  -5, z: -2, isCommander: false },
      { x: -31, y: -12, z: -3, isCommander: false },
      { x: -32, y:   2, z:  3, isCommander: false },
      { x: -20, y: -5,  z: 12, isCommander: true  }  /* commander */
    ];
    for (var i = 0; i < positions.length; i++) {
      var p    = positions[i];
      var scl  = p.isCommander ? 1.3 : 1.0;
      var clr  = p.isCommander ? 0xFF4444 : 0x445544;
      var geo  = new THREE.BoxGeometry(1.2 * scl, 2.4 * scl, 1.2 * scl);
      var mat  = new THREE.MeshLambertMaterial({ color: clr });
      var m    = new THREE.Mesh(geo, mat);
      m.position.set(p.x, p.y, p.z);
      m.scale.set(scl, scl, scl);
      _scene.add(m);
      _enemies.push({
        mesh:        m,
        hp:          p.isCommander ? 120 : 50,
        pos:         new THREE.Vector3(p.x, p.y, p.z),
        vel:         new THREE.Vector3(0, 0, 0),
        alive:       true,
        isCommander: p.isCommander,
        fireTimer:   randRange(1, 4)
      });
    }
  }

  function buildIntelFolders() {
    var positions = [
      { x: -18, y: 6,  z: 18 },
      { x: -28, y: 5,  z:  8 },
      { x: -22, y: 7,  z: 28 }
    ];
    for (var i = 0; i < positions.length; i++) {
      var p   = positions[i];
      var geo = new THREE.BoxGeometry(0.8, 0.6, 1.0);
      var mat = new THREE.MeshLambertMaterial({
        color:   0xFFFFAA,
        emissive: 0xAAAA44,
        emissiveIntensity: 0.4
      });
      var m = new THREE.Mesh(geo, mat);
      m.position.set(p.x, p.y, p.z);
      _scene.add(m);
      _intelFolders.push({
        mesh:      m,
        collected: false,
        pos:       new THREE.Vector3(p.x, p.y, p.z)
      });
    }
  }

  function buildJeep() {
    var group = new THREE.Group();
    /* Body */
    var bodyGeo = new THREE.BoxGeometry(3, 1.2, 5.5);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x664433 });
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.6;
    group.add(body);
    /* Wheels */
    var wGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 12);
    var wMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var wOffsets = [
      [-1.5, 0, -1.8],
      [ 1.5, 0, -1.8],
      [-1.5, 0,  1.8],
      [ 1.5, 0,  1.8]
    ];
    for (var i = 0; i < wOffsets.length; i++) {
      var w = new THREE.Mesh(wGeo, wMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(wOffsets[i][0], wOffsets[i][1], wOffsets[i][2]);
      group.add(w);
    }
    _jeepY = -10;
    group.position.set(-14, _jeepY, 14);
    _scene.add(group);
    _jeepMesh = group;
  }

  function buildHelicopter() {
    var group = new THREE.Group();
    /* Body */
    var bodyGeo = new THREE.BoxGeometry(4, 2, 7);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x445566 });
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);
    /* Rotor blade */
    var rotorGeo = new THREE.BoxGeometry(10, 0.15, 0.6);
    var rotorMat = new THREE.MeshLambertMaterial({ color: 0x333344 });
    var rotor    = new THREE.Mesh(rotorGeo, rotorMat);
    rotor.position.y = 1.2;
    group.add(rotor);
    group.position.set(0, 57, 0);
    _scene.add(group);
    _helicopterMesh = group;
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD
  ════════════════════════════════════════════════════════════════════════ */

  function buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'volcano-escape-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:8px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.72)',
      'color:#FF8800',
      'font:bold 13px/1.4 monospace',
      'padding:6px 14px',
      'border-radius:4px',
      'z-index:9999',
      'pointer-events:none',
      'white-space:nowrap',
      'letter-spacing:0.04em'
    ].join(';');
    document.body.appendChild(_hud);
  }

  function updateHUD() {
    if (!_hud) return;
    var eruptionWarning = '';
    for (var i = 0; i < _eruptionThresholds.length; i++) {
      if (!_eruptionFired[i] && _lavaY >= _eruptionThresholds[i] - 3) {
        eruptionWarning = ' | <span style="color:#FF2200">ERUPTION IMMINENT</span>';
        break;
      }
    }
    var timeLeft = Math.max(0, 300 - _totalTime);
    _hud.innerHTML =
      'VOLCANO ' +
      '[LAVA: Y=' + Math.round(_lavaY) + '] ' +
      '[ALTITUDE: Y=' + Math.round(_playerPos ? _playerPos.y : 0) + '] ' +
      '[TIME: ' + fmtTime(timeLeft) + '] ' +
      '[INTEL: ' + _intelCount + '/3]' +
      eruptionWarning;
  }

  function removeHUD() {
    if (_hud && _hud.parentNode) {
      _hud.parentNode.removeChild(_hud);
    }
    _hud = null;
  }

  /* ════════════════════════════════════════════════════════════════════════
     SPAWN SYSTEMS
  ════════════════════════════════════════════════════════════════════════ */

  function spawnFallingRock() {
    /* Random XZ somewhere near player path */
    var rx   = randRange(-35, 35);
    var rz   = randRange(-35, 35);
    var startY = 65;

    /* Warning shadow */
    var wGeo = new THREE.BoxGeometry(2.5, 0.05, 2.5);
    var wMat = new THREE.MeshLambertMaterial({
      color:       0xFF8800,
      transparent: true,
      opacity:     0.3
    });
    var warning = new THREE.Mesh(wGeo, wMat);
    warning.position.set(rx, _lavaY + 0.1, rz);
    _scene.add(warning);

    /* Rock mesh — appears 1 second after warning */
    var rGeo = new THREE.CylinderGeometry(0.8, 0.8, 1.6, 8);
    var rMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var rock = new THREE.Mesh(rGeo, rMat);
    rock.position.set(rx, startY, rz);
    rock.visible = false;
    _scene.add(rock);

    _rocks.push({
      mesh:    rock,
      vel:     new THREE.Vector3(randRange(-2, 2), -18, randRange(-2, 2)),
      warning: warning,
      warned:  false,
      active:  false,
      warnTimer: 0
    });
  }

  function triggerEruption(level) {
    /* Intensity spike on eruption light */
    _eruptionLight.intensity = 12;
    _eruptionTimer = 1.5;

    /* Knockback player */
    if (_playerVel) {
      _playerVel.y += 8;
    }

    /* 20 fireballs launched outward */
    for (var i = 0; i < 20; i++) {
      var angle  = (i / 20) * Math.PI * 2;
      var spread = randRange(0.3, 1.0);
      var geo    = new THREE.SphereGeometry(0.6, 8, 8);
      var mat    = new THREE.MeshLambertMaterial({
        color:   0xFF4400,
        emissive: 0xFF2200,
        emissiveIntensity: 1.0
      });
      var fb = new THREE.Mesh(geo, mat);
      fb.position.set(0, 30, 0);
      _scene.add(fb);
      _fireballs.push({
        mesh: fb,
        vel:  new THREE.Vector3(
          Math.cos(angle) * 15 * spread,
          randRange(5, 20),
          Math.sin(angle) * 15 * spread
        ),
        life: 4.0
      });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     ACTIVATION
  ════════════════════════════════════════════════════════════════════════ */

  function activate() {
    if (_active) return;
    _active     = true;
    _score      = 0;
    _playerHP   = 100;
    _playerDead = false;
    _escaped    = false;
    _intelCount = 0;
    _inVehicle  = false;
    _lavaY      = -30;
    _lavaRiseTimer  = 0;
    _rockSpawnTimer = 0;
    _rockNextSpawn  = randRange(2, 5);
    _totalTime  = 0;
    _eruptionFired = [false, false, false, false];
    _commanderDefeated = false;

    /* Player start position — base of west tunnel */
    _playerPos = new THREE.Vector3(-22, -15, 14);
    _playerVel = new THREE.Vector3(0, 0, 0);

    /* Player visual marker */
    var pGeo = new THREE.BoxGeometry(0.9, 1.8, 0.9);
    var pMat = new THREE.MeshLambertMaterial({ color: 0x22AAFF });
    _playerMesh = new THREE.Mesh(pGeo, pMat);
    _playerMesh.position.copy(_playerPos);
    _scene.add(_playerMesh);

    buildVolcano();
    buildBase();
    buildNorthStairs();
    buildEastLadder();
    buildWestTunnel();
    buildEnemies();
    buildIntelFolders();
    buildJeep();
    buildHelicopter();
    buildHUD();
  }

  /* ════════════════════════════════════════════════════════════════════════
     UPDATE — PHYSICS / MOVEMENT
  ════════════════════════════════════════════════════════════════════════ */

  function updatePlayer(dt) {
    if (_playerDead || _escaped) return;

    /* Input direction based on yaw */
    var forward = new THREE.Vector3(-Math.sin(_yaw), 0, -Math.cos(_yaw));
    var right   = new THREE.Vector3(Math.cos(_yaw), 0, -Math.sin(_yaw));
    var move    = new THREE.Vector3(0, 0, 0);
    var speed   = _inVehicle ? 14 : 6;

    if (_keys['w'] || _keys['W']) move.addScaledVector(forward,  speed);
    if (_keys['s'] || _keys['S']) move.addScaledVector(forward, -speed);
    if (_keys['a'] || _keys['A']) move.addScaledVector(right, -speed);
    if (_keys['d'] || _keys['D']) move.addScaledVector(right,  speed);

    _playerVel.x = move.x;
    _playerVel.z = move.z;

    /* Jump */
    if ((_keys[' '] || _keys['Space']) && _onGround) {
      _playerVel.y = 10;
      _onGround = false;
    }

    /* Gravity */
    _playerVel.y -= 20 * dt;

    /* Integrate */
    _playerPos.x += _playerVel.x * dt;
    _playerPos.y += _playerVel.y * dt;
    _playerPos.z += _playerVel.z * dt;

    /* Ground & platform collision */
    _onGround = false;

    /* World floor */
    var worldFloor = -28;
    if (_playerPos.y < worldFloor) {
      _playerPos.y = worldFloor;
      _playerVel.y = 0;
      _onGround = true;
    }

    /* Platform standing */
    for (var i = 0; i < _platforms.length; i++) {
      var pl = _platforms[i];
      if (
        _playerPos.x >= pl.minX - 0.45 && _playerPos.x <= pl.maxX + 0.45 &&
        _playerPos.z >= pl.minZ - 0.45 && _playerPos.z <= pl.maxZ + 0.45 &&
        _playerPos.y >= pl.y - 0.2 &&
        _playerPos.y <= pl.y + 2.5 &&
        _playerVel.y <= 0
      ) {
        _playerPos.y = pl.y + 0.9;
        _playerVel.y = 0;
        _onGround = true;
        break;
      }
    }

    /* Jeep ride — block at Y=20 */
    if (_inVehicle && _jeepMesh) {
      _jeepMesh.position.copy(_playerPos);
      _jeepMesh.position.y -= 0.6;
      if (_playerPos.y >= 20) {
        _inVehicle   = false;
        _jeepBlocked = true;
      }
    }

    /* Sync mesh */
    if (_playerMesh) {
      _playerMesh.position.copy(_playerPos);
      _playerMesh.rotation.y = _yaw;
    }

    /* Camera follow */
    if (_camera) {
      var camOff = new THREE.Vector3(
        Math.sin(_yaw) * 5,
        3,
        Math.cos(_yaw) * 5
      );
      _camera.position.copy(_playerPos).add(camOff);
      _camera.lookAt(
        _playerPos.x - Math.sin(_yaw) * 3,
        _playerPos.y + 1,
        _playerPos.z - Math.cos(_yaw) * 3
      );
    }
  }

  function updateLava(dt) {
    /* Slow rise 0.02/s */
    _lavaY += 0.02 * dt;

    /* Every 30s raises 1 extra unit */
    _lavaRiseTimer += dt;
    if (_lavaRiseTimer >= 30) {
      _lavaRiseTimer -= 30;
      _lavaY += 1;
    }

    /* Update meshes */
    if (_lavaMesh) {
      _lavaMesh.position.y = _lavaY - 3;
    }
    if (_lavaCraterMesh) {
      _lavaCraterMesh.position.y = _lavaY;
    }
    if (_lavaLight) {
      _lavaLight.position.y = _lavaY + 6;
    }

    /* Check eruption thresholds */
    for (var i = 0; i < _eruptionThresholds.length; i++) {
      if (!_eruptionFired[i] && _lavaY >= _eruptionThresholds[i]) {
        _eruptionFired[i] = true;
        triggerEruption(i);
      }
    }

    /* Player lava death */
    if (_playerPos && _playerPos.y <= _lavaY + 0.5 && !_playerDead) {
      killPlayer('CONSUMED BY LAVA');
    }
  }

  function updateRocks(dt) {
    /* Spawn new rocks */
    _rockSpawnTimer += dt;
    if (_rockSpawnTimer >= _rockNextSpawn) {
      _rockSpawnTimer = 0;
      _rockNextSpawn  = randRange(2, 5);
      spawnFallingRock();
    }

    for (var i = _rocks.length - 1; i >= 0; i--) {
      var r = _rocks[i];
      r.warnTimer += dt;

      /* Show rock after 1s warning */
      if (!r.active && r.warnTimer >= 1.0) {
        r.active       = true;
        r.mesh.visible = true;
      }

      if (r.active) {
        r.mesh.position.x += r.vel.x * dt;
        r.mesh.position.y += r.vel.y * dt;
        r.mesh.position.z += r.vel.z * dt;
        r.vel.y -= 9.8 * dt;

        /* Hit player */
        if (_playerPos && !_playerDead) {
          var dx = r.mesh.position.x - _playerPos.x;
          var dy = r.mesh.position.y - _playerPos.y;
          var dz = r.mesh.position.z - _playerPos.z;
          var dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
          if (dist < 2.0) {
            _playerHP -= 20;
            if (_playerHP <= 0) {
              killPlayer('CRUSHED BY FALLING ROCK');
            }
            /* Remove rock */
            _scene.remove(r.mesh);
            _scene.remove(r.warning);
            _rocks.splice(i, 1);
            continue;
          }
        }

        /* Remove when below lava */
        if (r.mesh.position.y < _lavaY) {
          _scene.remove(r.mesh);
          _scene.remove(r.warning);
          _rocks.splice(i, 1);
          continue;
        }
      }

      /* Remove warning shadow after rock appears or it times out */
      if (r.warnTimer >= 2.5 && r.warning.parent) {
        _scene.remove(r.warning);
      }
    }
  }

  function updateFireballs(dt) {
    for (var i = _fireballs.length - 1; i >= 0; i--) {
      var fb = _fireballs[i];
      fb.life -= dt;
      fb.vel.y -= 9.8 * dt;
      fb.mesh.position.x += fb.vel.x * dt;
      fb.mesh.position.y += fb.vel.y * dt;
      fb.mesh.position.z += fb.vel.z * dt;

      /* Hit player */
      if (_playerPos && !_playerDead) {
        var dx = fb.mesh.position.x - _playerPos.x;
        var dz = fb.mesh.position.z - _playerPos.z;
        var dy = fb.mesh.position.y - _playerPos.y;
        if (Math.sqrt(dx*dx + dy*dy + dz*dz) < 1.5) {
          _playerHP -= 15;
          if (_playerHP <= 0) killPlayer('KILLED BY ERUPTION');
          fb.life = 0;
        }
      }

      if (fb.life <= 0 || fb.mesh.position.y < _lavaY) {
        _scene.remove(fb.mesh);
        _fireballs.splice(i, 1);
      }
    }
  }

  function updateEruptionLight(dt) {
    if (_eruptionTimer > 0) {
      _eruptionTimer -= dt;
      _eruptionLight.intensity = Math.max(0, (_eruptionTimer / 1.5) * 12);
    } else {
      _eruptionLight.intensity = 0;
    }
  }

  function updateEnemies(dt) {
    for (var i = 0; i < _enemies.length; i++) {
      var e = _enemies[i];
      if (!e.alive) continue;

      /* Simple AI: move toward player then try to shoot */
      if (_playerPos) {
        var dx = _playerPos.x - e.pos.x;
        var dz = _playerPos.z - e.pos.z;
        var dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 25 && dist > 2.5) {
          var spd = e.isCommander ? 3.5 : 2.5;
          e.pos.x += (dx / dist) * spd * dt;
          e.pos.z += (dz / dist) * spd * dt;
        }

        /* Shoot player */
        e.fireTimer -= dt;
        if (e.fireTimer <= 0 && dist < 20) {
          e.fireTimer = e.isCommander ? 1.5 : 2.5;
          if (!_playerDead) {
            _playerHP -= e.isCommander ? 15 : 8;
            if (_playerHP <= 0) killPlayer('SHOT BY ENEMY');
          }
        }
      }

      /* Enemies also flee lava — go up if lava is near */
      if (e.pos.y <= _lavaY + 2) {
        e.pos.y += 3 * dt;
      }

      e.mesh.position.copy(e.pos);
    }
  }

  function updateBullets(dt) {
    for (var i = _bullets.length - 1; i >= 0; i--) {
      var b = _bullets[i];
      b.life -= dt;
      b.mesh.position.x += b.vel.x * dt;
      b.mesh.position.y += b.vel.y * dt;
      b.mesh.position.z += b.vel.z * dt;

      /* Check enemy hits */
      for (var j = 0; j < _enemies.length; j++) {
        var e = _enemies[j];
        if (!e.alive) continue;
        var dx = b.mesh.position.x - e.pos.x;
        var dy = b.mesh.position.y - e.pos.y;
        var dz = b.mesh.position.z - e.pos.z;
        if (Math.sqrt(dx*dx + dy*dy + dz*dz) < 1.8) {
          e.hp -= 25;
          b.life = 0;
          if (e.hp <= 0) {
            e.alive = false;
            _scene.remove(e.mesh);
            if (e.isCommander) {
              _commanderDefeated = true;
              _score += 300;
            } else {
              _score += 50;
            }
          }
          break;
        }
      }

      if (b.life <= 0) {
        _scene.remove(b.mesh);
        _bullets.splice(i, 1);
      }
    }
  }

  function updateIntel() {
    if (!_playerPos) return;
    for (var i = 0; i < _intelFolders.length; i++) {
      var f = _intelFolders[i];
      if (f.collected) continue;
      if (_keys['f'] || _keys['F']) {
        var dx = _playerPos.x - f.pos.x;
        var dz = _playerPos.z - f.pos.z;
        var dy = _playerPos.y - f.pos.y;
        if (Math.sqrt(dx*dx + dy*dy + dz*dz) < 3.5) {
          f.collected = true;
          _scene.remove(f.mesh);
          _intelCount++;
          _score += 150;
        }
      }
      /* Bob animation */
      f.mesh.position.y = f.pos.y + Math.sin(_totalTime * 2 + i) * 0.15;
      f.mesh.rotation.y += 0.02;
    }
  }

  function updateJeepEntry() {
    if (!_playerPos || !_jeepMesh || _jeepBlocked) return;
    if (_keys['g'] || _keys['G']) {
      var jPos = _jeepMesh.position;
      var dx   = _playerPos.x - jPos.x;
      var dz   = _playerPos.z - jPos.z;
      if (Math.sqrt(dx*dx + dz*dz) < 5 && !_inVehicle) {
        _inVehicle = true;
      } else if (_inVehicle) {
        _inVehicle = false;
      }
    }
    /* Rotor spin on heli */
    if (_helicopterMesh) {
      _helicopterMesh.children[1].rotation.y += 0.12;
    }
  }

  function checkSummitExtraction() {
    if (!_playerPos || _escaped || _playerDead) return;
    /* Helicopter at y=57, summit ~y=55 */
    var dx = _playerPos.x;
    var dy = _playerPos.y - 57;
    var dz = _playerPos.z;
    if (Math.sqrt(dx*dx + dy*dy + dz*dz) < 8 && _playerPos.y >= 50) {
      _escaped = true;
      _score += 500;
      if (_intelCount === 3) _score += 300;
      if (_commanderDefeated) _score += 200;
      showEndMessage('ESCAPED! SCORE: ' + _score);
    }

    /* If lava reaches y=50, helicopter flies away */
    if (_lavaY >= 50 && !_escaped) {
      killPlayer('LAVA REACHED SUMMIT — HELICOPTER GONE');
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER DEATH / WIN
  ════════════════════════════════════════════════════════════════════════ */

  function killPlayer(reason) {
    if (_playerDead) return;
    _playerDead = true;
    showEndMessage('DEAD: ' + reason + ' | SCORE: ' + _score);
  }

  function showEndMessage(msg) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.85)',
      'color:#FF4400',
      'font:bold 22px monospace',
      'padding:20px 36px',
      'border-radius:6px',
      'z-index:10000',
      'text-align:center'
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 5000);
  }

  /* ════════════════════════════════════════════════════════════════════════
     SHOOTING
  ════════════════════════════════════════════════════════════════════════ */

  function fireShot() {
    if (!_playerPos || _playerDead) return;
    var geo = new THREE.SphereGeometry(0.15, 6, 6);
    var mat = new THREE.MeshLambertMaterial({ color: 0xFFFF44, emissive: 0xFFFF00, emissiveIntensity: 1 });
    var m   = new THREE.Mesh(geo, mat);
    m.position.copy(_playerPos);
    m.position.y += 1;
    _scene.add(m);
    var dir = new THREE.Vector3(-Math.sin(_yaw), -Math.sin(_pitch), -Math.cos(_yaw));
    dir.normalize().multiplyScalar(40);
    _bullets.push({ mesh: m, vel: dir, life: 2.0 });
  }

  /* ════════════════════════════════════════════════════════════════════════
     INPUT HANDLERS
  ════════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    _keys[e.key] = true;

    var now = performance.now() / 1000;

    if (e.key === 'v' || e.key === 'V') _vePressTime.V = now;
    if (e.key === 'e' || e.key === 'E') _vePressTime.E = now;

    /* Check V+E simultaneous within 400ms */
    if (!_active) {
      if (
        (e.key === 'v' || e.key === 'V' || e.key === 'e' || e.key === 'E') &&
        _vePressTime.V > 0 && _vePressTime.E > 0 &&
        Math.abs(_vePressTime.V - _vePressTime.E) <= VE_WINDOW
      ) {
        activate();
      }
    }
  }

  function onKeyUp(e) {
    _keys[e.key] = false;
  }

  function onMouseMove(e) {
    if (!_active) return;
    _yaw   -= e.movementX * 0.003;
    _pitch  = Math.max(-1.2, Math.min(1.2, _pitch - e.movementY * 0.003));
    _mouseX = e.clientX;
    _mouseY = e.clientY;
  }

  function onMouseClick() {
    if (!_active || _playerDead || _escaped) return;
    fireShot();
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    _boundKeyDown    = onKeyDown;
    _boundKeyUp      = onKeyUp;
    _boundMouseMove  = onMouseMove;
    _boundMouseClick = onMouseClick;

    window.addEventListener('keydown',    _boundKeyDown);
    window.addEventListener('keyup',      _boundKeyUp);
    window.addEventListener('mousemove',  _boundMouseMove);
    window.addEventListener('click',      _boundMouseClick);
  }

  function update(timestamp) {
    var dt = 0;
    if (_lastTime > 0) {
      dt = (timestamp - _lastTime) / 1000;
      if (dt > 0.1) dt = 0.1;
    }
    _lastTime = timestamp;

    if (!_active) return;

    _totalTime += dt;

    updateLava(dt);
    updatePlayer(dt);
    updateRocks(dt);
    updateFireballs(dt);
    updateEruptionLight(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateIntel();
    updateJeepEntry();
    checkSummitExtraction();
    updateHUD();
  }

  function reset() {
    _active     = false;
    _playerDead = false;
    _escaped    = false;

    /* Remove all scene objects if scene exists */
    if (_scene) {
      var toRemove = [];
      _scene.traverse(function (obj) {
        if (obj !== _scene) toRemove.push(obj);
      });
      for (var i = 0; i < toRemove.length; i++) {
        _scene.remove(toRemove[i]);
      }
    }

    /* Clear arrays */
    _platforms    = [];
    _tunnelMeshes = [];
    _rocks        = [];
    _fireballs    = [];
    _intelFolders = [];
    _enemies      = [];
    _bullets      = [];
    _buildings    = [];
    _intelCount   = 0;
    _score        = 0;
    _lavaY        = -30;
    _keys         = {};
    _vePressTime  = { V: 0, E: 0 };
    _playerPos    = null;
    _playerVel    = null;
    _playerMesh   = null;
    _lavaMesh     = null;
    _lavaCraterMesh = null;
    _lavaLight    = null;
    _eruptionLight = null;
    _jeepMesh     = null;
    _helicopterMesh = null;

    removeHUD();

    if (_boundKeyDown)   window.removeEventListener('keydown',   _boundKeyDown);
    if (_boundKeyUp)     window.removeEventListener('keyup',     _boundKeyUp);
    if (_boundMouseMove) window.removeEventListener('mousemove', _boundMouseMove);
    if (_boundMouseClick) window.removeEventListener('click',    _boundMouseClick);
  }

  window.VolcanoEscape = {
    init:   init,
    update: update,
    reset:  reset
  };

}());
