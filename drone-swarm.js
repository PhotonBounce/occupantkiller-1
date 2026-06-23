// drone-swarm.js — DroneSwarm module for FPS military game
// Activation: D+S simultaneous keypress (within 400ms window)
// Pure browser JS — no imports, THREE is a global already loaded

window.DroneSwarm = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────
  var MAX_DRONES         = 8;
  var SPAWN_Y            = 8;
  var DRONE_HP           = 2;
  var ROTOR_SPIN         = 15;      // rad/sec
  var SIGNAL_RANGE       = 80;      // units — beyond this auto-return
  var ECM_RANGE          = 20;      // units — jammer effect radius
  var AA_FIRE_INTERVAL   = 3;       // seconds between AA shots
  var RESUPPLY_INTERVAL  = 90;      // seconds
  var LOITER_RADIUS      = 30;
  var LOITER_Y           = 12;
  var RECON_RADIUS       = 30;
  var ATTACK_KEY_WINDOW  = 400;     // ms for D+S chord

  var FORMATIONS = ['DIAMOND', 'SPREAD', 'PINCER', 'RECON'];

  // Formation offsets relative to player (index 0-7)
  var FORMATION_OFFSETS = {
    DIAMOND: [
      new THREE.Vector3( 0,  0, -3),
      new THREE.Vector3( 2,  0, -1),
      new THREE.Vector3(-2,  0, -1),
      new THREE.Vector3( 3,  0,  2),
      new THREE.Vector3(-3,  0,  2),
      new THREE.Vector3( 1,  0,  4),
      new THREE.Vector3(-1,  0,  4),
      new THREE.Vector3( 0,  0,  6)
    ],
    SPREAD: [
      new THREE.Vector3(-12, 0, -4),
      new THREE.Vector3( -8, 0, -4),
      new THREE.Vector3( -4, 0, -4),
      new THREE.Vector3(  0, 0, -4),
      new THREE.Vector3(  4, 0, -4),
      new THREE.Vector3(  8, 0, -4),
      new THREE.Vector3( 12, 0, -4),
      new THREE.Vector3(  0, 0,  8)
    ],
    PINCER: [
      new THREE.Vector3( 8, 0,  0),
      new THREE.Vector3( 6, 0, -6),
      new THREE.Vector3( 0, 0, -8),
      new THREE.Vector3(-6, 0, -6),
      new THREE.Vector3(-8, 0,  0),
      new THREE.Vector3(-6, 0,  6),
      new THREE.Vector3( 0, 0,  8),
      new THREE.Vector3( 6, 0,  6)
    ],
    RECON: [
      new THREE.Vector3( 30, 0,   0),
      new THREE.Vector3( 21, 0,  21),
      new THREE.Vector3(  0, 0,  30),
      new THREE.Vector3(-21, 0,  21),
      new THREE.Vector3(-30, 0,   0),
      new THREE.Vector3(-21, 0, -21),
      new THREE.Vector3(  0, 0, -30),
      new THREE.Vector3( 21, 0, -21)
    ]
  };

  // ── Module State ───────────────────────────────────────────────────────────
  var _scene        = null;
  var _camera       = null;
  var _playerRef    = null;
  var _enemiesRef   = null;   // array of enemy objects { mesh, hp, position }

  var _active       = false;
  var _drones       = [];     // array of drone state objects
  var _formation    = 0;      // index into FORMATIONS
  var _selectedDrone = -1;    // -1 = none, 0-7 = index

  var _ecmTowers    = [];     // { mesh, position }
  var _aaGuns       = [];     // { mesh, timer, position }
  var _supplyCreate = null;   // { mesh, canopy, lines, group, timer, active }
  var _supplyTimer  = 0;

  var _reticle      = null;   // HUD reticle mesh for selected drone
  var _hudEl        = null;

  // Drone cam state
  var _droneCamActive  = false;
  var _droneCamCanvas  = null;
  var _droneCamCtx     = null;
  var _droneCamContainer = null;

  // Activation chord state
  var _dKeyTime    = 0;
  var _sKeyTime    = 0;

  // Infantry enemies shooting at swarm
  var _infantryEnemies = [];   // { position, shootTimer }
  var _infantryCount   = 6;

  // Loitering munition state per drone
  // stored on drone object: drone.loiterActive, drone.loiterAngle, drone.loiterTarget

  var _keysDown = {};

  // ── Build Drone Mesh ───────────────────────────────────────────────────────
  function _buildDroneMesh() {
    var group = new THREE.Group();

    // Body
    var bodyGeo = new THREE.BoxGeometry(0.6, 0.2, 0.6);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // 4 rotor arms + rotors
    var rotorMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var armPositions = [
      new THREE.Vector3( 0.4, 0,  0.4),
      new THREE.Vector3(-0.4, 0,  0.4),
      new THREE.Vector3( 0.4, 0, -0.4),
      new THREE.Vector3(-0.4, 0, -0.4)
    ];
    var rotors = [];
    for (var i = 0; i < 4; i++) {
      var rotorGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.05, 8);
      var rotor    = new THREE.Mesh(rotorGeo, rotorMat);
      rotor.position.copy(armPositions[i]);
      group.add(rotor);
      rotors.push(rotor);
    }
    group.userData.rotors = rotors;
    return group;
  }

  // ── Build ECM Jammer Tower ─────────────────────────────────────────────────
  function _buildECMTower(x, z) {
    var geo  = new THREE.BoxGeometry(2, 3, 2);
    var mat  = new THREE.MeshLambertMaterial({ color: 0x3366AA });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 1.5, z);
    _scene.add(mesh);
    _ecmTowers.push({ mesh: mesh, position: mesh.position, hp: 3 });
  }

  // ── Build AA Gun ───────────────────────────────────────────────────────────
  function _buildAAGun(x, z) {
    var group   = new THREE.Group();
    var baseMat = new THREE.MeshLambertMaterial({ color: 0x445544 });
    var baseGeo = new THREE.CylinderGeometry(0.6, 0.8, 1.2, 8);
    var base    = new THREE.Mesh(baseGeo, baseMat);
    group.add(base);
    var barrelGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 6);
    var barrel    = new THREE.Mesh(barrelGeo, baseMat);
    barrel.position.set(0, 1.0, 0);
    group.add(barrel);
    group.position.set(x, 0.6, z);
    _scene.add(group);
    _aaGuns.push({ mesh: group, timer: 0, position: group.position, hp: 2 });
  }

  // ── Build Supply Crate ─────────────────────────────────────────────────────
  function _buildSupplyCrate(x, z) {
    var group = new THREE.Group();

    // Crate box
    var crateGeo = new THREE.BoxGeometry(1.2, 0.8, 1.2);
    var crateMat = new THREE.MeshLambertMaterial({ color: 0x00AA44 });
    var crate    = new THREE.Mesh(crateGeo, crateMat);
    group.add(crate);

    // Parachute canopy
    var canopyGeo = new THREE.SphereGeometry(1.5, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    var canopyMat = new THREE.MeshLambertMaterial({ color: 0xDDDDAA, side: THREE.DoubleSide });
    var canopy    = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0, 3, 0);
    group.add(canopy);

    // Parachute lines (LineSegments)
    var linePositions = [];
    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      linePositions.push(Math.cos(angle) * 0.5, 0.4, Math.sin(angle) * 0.5);
      linePositions.push(Math.cos(angle) * 1.2, 2.8, Math.sin(angle) * 1.2);
    }
    var lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    var lineMat   = new THREE.LineBasicMaterial({ color: 0xCCCCCC });
    var lines     = new THREE.LineSegments(lineGeo, lineMat);
    group.add(lines);

    group.position.set(x, 30, z);
    _scene.add(group);

    _supplyCreate = {
      group:    group,
      crate:    crate,
      canopy:   canopy,
      lines:    lines,
      active:   true,
      falling:  true,
      collected: false
    };
  }

  // ── Spawn Drones ───────────────────────────────────────────────────────────
  function _spawnDrones() {
    var playerPos = _playerRef ? _playerRef.position : new THREE.Vector3(0, 0, 0);
    for (var i = 0; i < MAX_DRONES; i++) {
      var mesh = _buildDroneMesh();
      var angle = (i / MAX_DRONES) * Math.PI * 2;
      mesh.position.set(
        playerPos.x + Math.cos(angle) * 4,
        playerPos.y + SPAWN_Y,
        playerPos.z + Math.sin(angle) * 4
      );
      _scene.add(mesh);
      _drones.push({
        mesh:         mesh,
        hp:           DRONE_HP,
        alive:        true,
        manual:       false,
        loiterActive: false,
        loiterAngle:  0,
        loiterTarget: null,
        dying:        false,
        ecmAffected:  false,
        signalStrength: 100,
        autoReturn:   false
      });
    }
  }

  // ── Create Infantry Enemies ────────────────────────────────────────────────
  function _spawnInfantry() {
    for (var i = 0; i < _infantryCount; i++) {
      var angle  = (i / _infantryCount) * Math.PI * 2;
      var dist   = 25 + Math.random() * 10;
      var playerPos = _playerRef ? _playerRef.position : new THREE.Vector3(0, 0, 0);
      var geo    = new THREE.BoxGeometry(0.5, 1.6, 0.5);
      var mat    = new THREE.MeshLambertMaterial({ color: 0x334400 });
      var mesh   = new THREE.Mesh(geo, mat);
      mesh.position.set(
        playerPos.x + Math.cos(angle) * dist,
        0.8,
        playerPos.z + Math.sin(angle) * dist
      );
      _scene.add(mesh);
      _infantryEnemies.push({
        mesh:        mesh,
        position:    mesh.position,
        shootTimer:  Math.random() * 3,
        hp:          2,
        alive:       true
      });
    }
  }

  // ── HUD ────────────────────────────────────────────────────────────────────
  function _createHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'drone-swarm-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.65)',
      'color:#00ff88',
      'font:bold 11px monospace',
      'padding:5px 12px',
      'border:1px solid #00ff88',
      'pointer-events:none',
      'z-index:1000',
      'white-space:nowrap',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl || !_active) return;
    var aliveCount   = 0;
    var totalSignal  = 0;
    for (var i = 0; i < _drones.length; i++) {
      if (_drones[i].alive) {
        aliveCount++;
        totalSignal += _drones[i].signalStrength;
      }
    }
    var avgSignal  = aliveCount > 0 ? Math.round(totalSignal / aliveCount) : 0;
    var formName   = FORMATIONS[_formation];
    var selLabel   = _selectedDrone >= 0 ? '#' + (_selectedDrone + 1) : 'NONE';
    var ecmStatus  = _ecmTowers.length > 0 ? 'TOWERS: ' + _ecmTowers.length : 'CLEAR';

    // Signal bars (5 bars)
    var bars = '';
    var barCount = Math.round(avgSignal / 20);
    for (var b = 0; b < 5; b++) {
      bars += b < barCount ? '█' : '░';
    }

    _hudEl.textContent = 'SWARM [ACTIVE: ' + aliveCount + '/' + MAX_DRONES +
      '] [FORMATION: ' + formName +
      '] [SELECTED: ' + selLabel +
      '] [SIGNAL: ' + avgSignal + '% ' + bars + '] | ECM: ' + ecmStatus;
  }

  function _removeHUD() {
    if (_hudEl && _hudEl.parentNode) {
      _hudEl.parentNode.removeChild(_hudEl);
      _hudEl = null;
    }
  }

  // ── Drone Cam ──────────────────────────────────────────────────────────────
  function _createDroneCam() {
    _droneCamContainer = document.createElement('div');
    _droneCamContainer.id = 'drone-cam-container';
    _droneCamContainer.style.cssText = [
      'position:fixed',
      'top:10px',
      'right:10px',
      'width:120px',
      'height:90px',
      'border:2px solid #00ff88',
      'background:#000',
      'z-index:1001',
      'overflow:hidden'
    ].join(';');

    _droneCamCanvas = document.createElement('canvas');
    _droneCamCanvas.width  = 120;
    _droneCamCanvas.height = 90;
    _droneCamCanvas.style.cssText = 'display:block;width:100%;height:100%;';
    _droneCamCtx = _droneCamCanvas.getContext('2d');

    var label = document.createElement('div');
    label.textContent = 'DRONE CAM';
    label.style.cssText = [
      'position:absolute',
      'bottom:2px',
      'left:2px',
      'font:bold 8px monospace',
      'color:#00ff88',
      'pointer-events:none'
    ].join(';');

    _droneCamContainer.appendChild(_droneCamCanvas);
    _droneCamContainer.appendChild(label);
    document.body.appendChild(_droneCamContainer);
  }

  function _removeDroneCam() {
    if (_droneCamContainer && _droneCamContainer.parentNode) {
      _droneCamContainer.parentNode.removeChild(_droneCamContainer);
    }
    _droneCamContainer = null;
    _droneCamCanvas    = null;
    _droneCamCtx       = null;
  }

  function _renderDroneCam() {
    if (!_droneCamCtx) return;
    var ctx = _droneCamCtx;
    var W   = 120;
    var H   = 90;
    ctx.fillStyle = '#0a1a0a';
    ctx.fillRect(0, 0, W, H);

    // Which drone to show cam from
    var camDrone = null;
    if (_selectedDrone >= 0 && _selectedDrone < _drones.length && _drones[_selectedDrone].alive) {
      camDrone = _drones[_selectedDrone];
    } else {
      for (var i = 0; i < _drones.length; i++) {
        if (_drones[i].alive) { camDrone = _drones[i]; break; }
      }
    }
    if (!camDrone) return;

    var dronePos = camDrone.mesh.position;
    var playerPos = _playerRef ? _playerRef.position : new THREE.Vector3(0,0,0);
    var scale    = 2.5;

    // Draw a simplified top-down grid
    ctx.strokeStyle = '#1a3a1a';
    ctx.lineWidth   = 1;
    for (var gx = 0; gx < W; gx += 15) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (var gy = 0; gy < H; gy += 15) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }

    var cx = W / 2;
    var cy = H / 2;

    // Draw player (relative to cam drone)
    var px = cx + (playerPos.x - dronePos.x) * scale;
    var py = cy + (playerPos.z - dronePos.z) * scale;
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(px - 3, py - 3, 6, 6);

    // Draw enemy infantry
    ctx.fillStyle = '#ff4444';
    for (var ei = 0; ei < _infantryEnemies.length; ei++) {
      var inf = _infantryEnemies[ei];
      if (!inf.alive) continue;
      var ex = cx + (inf.position.x - dronePos.x) * scale;
      var ey = cy + (inf.position.z - dronePos.z) * scale;
      ctx.fillRect(ex - 2, ey - 2, 4, 4);
    }

    // Draw other drones
    for (var di = 0; di < _drones.length; di++) {
      var d = _drones[di];
      if (!d.alive || d === camDrone) continue;
      var dx2 = cx + (d.mesh.position.x - dronePos.x) * scale;
      var dy2 = cy + (d.mesh.position.z - dronePos.z) * scale;
      ctx.fillStyle = '#88aaff';
      ctx.fillRect(dx2 - 2, dy2 - 2, 4, 4);
    }

    // Draw ECM towers
    ctx.fillStyle = '#4488ff';
    for (var ti = 0; ti < _ecmTowers.length; ti++) {
      var tw = _ecmTowers[ti];
      var tx2 = cx + (tw.position.x - dronePos.x) * scale;
      var tz2 = cy + (tw.position.z - dronePos.z) * scale;
      ctx.fillRect(tx2 - 3, tz2 - 3, 6, 6);
    }

    // Draw cam drone crosshair
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth   = 1;
    ctx.beginPath(); ctx.moveTo(cx - 6, cy); ctx.lineTo(cx + 6, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - 6); ctx.lineTo(cx, cy + 6); ctx.stroke();
  }

  // ── Reticle (on-screen marker for selected drone) ─────────────────────────
  function _createReticle() {
    _reticle = document.createElement('div');
    _reticle.id = 'drone-swarm-reticle';
    _reticle.style.cssText = [
      'position:fixed',
      'width:20px',
      'height:20px',
      'border:2px solid #ffff00',
      'border-radius:50%',
      'pointer-events:none',
      'z-index:999',
      'display:none',
      'transform:translate(-50%,-50%)'
    ].join(';');
    document.body.appendChild(_reticle);
  }

  function _removeReticle() {
    if (_reticle && _reticle.parentNode) {
      _reticle.parentNode.removeChild(_reticle);
      _reticle = null;
    }
  }

  function _updateReticle() {
    if (!_reticle || !_camera) return;
    if (_selectedDrone < 0 || _selectedDrone >= _drones.length || !_drones[_selectedDrone].alive) {
      _reticle.style.display = 'none';
      return;
    }
    var drone = _drones[_selectedDrone];
    var pos   = drone.mesh.position.clone();
    pos.project(_camera);
    var x = (pos.x *  0.5 + 0.5) * window.innerWidth;
    var y = (pos.y * -0.5 + 0.5) * window.innerHeight;
    if (pos.z > 1) {
      _reticle.style.display = 'none';
    } else {
      _reticle.style.display  = 'block';
      _reticle.style.left     = x + 'px';
      _reticle.style.top      = y + 'px';
    }
  }

  // ── Formation Target Position ──────────────────────────────────────────────
  function _getFormationTarget(droneIndex) {
    var playerPos  = _playerRef ? _playerRef.position : new THREE.Vector3(0, 0, 0);
    var offsets    = FORMATION_OFFSETS[FORMATIONS[_formation]];
    var off        = offsets[droneIndex % offsets.length];
    return new THREE.Vector3(
      playerPos.x + off.x,
      playerPos.y + SPAWN_Y,
      playerPos.z + off.z
    );
  }

  // ── Explode Drone ─────────────────────────────────────────────────────────
  function _explodeDrone(drone, pos) {
    // Flash sphere
    var flashGeo = new THREE.SphereGeometry(1.5, 6, 6);
    var flashMat = new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.9 });
    var flash    = new THREE.Mesh(flashGeo, flashMat);
    flash.position.copy(pos || drone.mesh.position);
    _scene.add(flash);

    // Remove flash after brief period via userData timer
    flash.userData.lifetime = 0.4;
    flash.userData.isTempFlash = true;
    _tempFlashes.push(flash);

    // Remove drone mesh
    if (drone.mesh && drone.mesh.parent) {
      drone.mesh.parent.removeChild ? drone.mesh.parent.removeChild(drone.mesh) : _scene.remove(drone.mesh);
    }
    drone.alive = false;
  }

  var _tempFlashes = [];

  function _updateFlashes(dt) {
    for (var i = _tempFlashes.length - 1; i >= 0; i--) {
      var f = _tempFlashes[i];
      f.userData.lifetime -= dt;
      if (f.userData.lifetime <= 0) {
        _scene.remove(f);
        _tempFlashes.splice(i, 1);
      } else {
        var frac = f.userData.lifetime / 0.4;
        f.material.opacity = frac * 0.9;
        var s = 1 + (1 - frac) * 0.5;
        f.scale.set(s, s, s);
      }
    }
  }

  // ── AA Gun Fire at Drones ──────────────────────────────────────────────────
  function _updateAAGuns(dt) {
    for (var i = 0; i < _aaGuns.length; i++) {
      var aa = _aaGuns[i];
      if (aa.hp <= 0) continue;
      aa.timer += dt;
      if (aa.timer < AA_FIRE_INTERVAL) continue;
      aa.timer = 0;

      // Find nearest alive drone
      var nearest = null;
      var nearDist = 999;
      for (var d = 0; d < _drones.length; d++) {
        if (!_drones[d].alive) continue;
        var dist = aa.position.distanceTo(_drones[d].mesh.position);
        if (dist < nearDist) {
          nearDist = dist;
          nearest  = _drones[d];
        }
      }
      if (!nearest || nearDist > 50) continue;

      // Track barrel toward drone
      var toTarget = nearest.mesh.position.clone().sub(aa.position);
      toTarget.normalize();
      aa.mesh.children[1].lookAt(nearest.mesh.position);

      // Hit with chance based on distance
      var hitChance = 0.6 - nearDist / 100;
      if (Math.random() < hitChance) {
        nearest.hp -= 1;
        if (nearest.hp <= 0) {
          nearest.dying = true;
        }
      }
    }
  }

  // ── Infantry Fire at Drones ────────────────────────────────────────────────
  function _updateInfantry(dt) {
    for (var i = 0; i < _infantryEnemies.length; i++) {
      var inf = _infantryEnemies[i];
      if (!inf.alive) continue;
      inf.shootTimer -= dt;
      if (inf.shootTimer > 0) continue;
      inf.shootTimer = 2 + Math.random() * 2;

      // Find a drone in range 30
      for (var d = 0; d < _drones.length; d++) {
        var drone = _drones[d];
        if (!drone.alive) continue;
        var dist = inf.position.distanceTo(drone.mesh.position);
        if (dist > 30) continue;
        if (Math.random() < 0.35) {
          drone.hp -= 1;
          if (drone.hp <= 0) {
            drone.dying = true;
          }
        }
        break;
      }
    }
  }

  // ── ECM Effect Check ───────────────────────────────────────────────────────
  function _checkECM() {
    for (var d = 0; d < _drones.length; d++) {
      var drone = _drones[d];
      if (!drone.alive) continue;
      drone.ecmAffected = false;
      for (var t = 0; t < _ecmTowers.length; t++) {
        if (_ecmTowers[t].hp <= 0) continue;
        var dist = _ecmTowers[t].position.distanceTo(drone.mesh.position);
        if (dist < ECM_RANGE) {
          drone.ecmAffected = true;
          break;
        }
      }
    }
  }

  // ── Signal Strength ────────────────────────────────────────────────────────
  function _updateSignalStrength() {
    var playerPos = _playerRef ? _playerRef.position : new THREE.Vector3(0, 0, 0);
    for (var d = 0; d < _drones.length; d++) {
      var drone = _drones[d];
      if (!drone.alive) continue;
      var dist = playerPos.distanceTo(drone.mesh.position);
      drone.signalStrength = Math.max(0, Math.min(100, Math.round((1 - dist / SIGNAL_RANGE) * 100)));
      if (dist > SIGNAL_RANGE) {
        drone.autoReturn = true;
      }
    }
  }

  // ── Attack Mode — all non-manual drones dive nearest enemy ───────────────
  function _launchAttack() {
    var enemies = _enemiesRef || [];
    var allTargets = enemies.concat(_infantryEnemies);

    for (var d = 0; d < _drones.length; d++) {
      var drone = _drones[d];
      if (!drone.alive || drone.manual) continue;

      // Find nearest target
      var nearest  = null;
      var nearDist = 9999;
      for (var ei = 0; ei < allTargets.length; ei++) {
        var e = allTargets[ei];
        if (e.alive === false || (e.hp !== undefined && e.hp <= 0)) continue;
        var ePos = e.position || (e.mesh && e.mesh.position);
        if (!ePos) continue;
        var dist = drone.mesh.position.distanceTo(ePos);
        if (dist < nearDist) {
          nearDist = dist;
          nearest  = e;
        }
      }
      if (!nearest) continue;
      drone.attackTarget = nearest;
      drone.attacking    = true;
    }
  }

  // ── Send Selected Drone to Loiter ─────────────────────────────────────────
  function _toggleLoiter() {
    if (_selectedDrone < 0 || _selectedDrone >= _drones.length) return;
    var drone = _drones[_selectedDrone];
    if (!drone.alive) return;

    if (!drone.loiterActive) {
      drone.loiterActive = true;
      drone.loiterAngle  = 0;
      drone.attacking    = false;
      drone.autoReturn   = false;
      drone.loiterTarget = null;
    } else {
      // Dive-strike at player crosshair point (in front of player, ground level)
      var playerPos = _playerRef ? _playerRef.position : new THREE.Vector3(0, 0, 0);
      var dir       = new THREE.Vector3(0, 0, -1);
      if (_camera) {
        _camera.getWorldDirection(dir);
        dir.y = 0;
        dir.normalize();
      }
      drone.loiterTarget = new THREE.Vector3(
        playerPos.x + dir.x * 20,
        0,
        playerPos.z + dir.z * 20
      );
      drone.loiterActive = false;
      drone.attacking    = true;
      drone.attackTarget = { position: drone.loiterTarget, hp: 999, alive: true };
    }
  }

  // ── Supply Crate Collection ────────────────────────────────────────────────
  function _checkSupplyCollection() {
    if (!_supplyCreate || !_supplyCreate.active || _supplyCreate.collected) return;
    var playerPos = _playerRef ? _playerRef.position : new THREE.Vector3(0, 0, 0);
    var cratePos  = _supplyCreate.group.position;
    if (playerPos.distanceTo(cratePos) < 3) {
      _supplyCreate.collected = true;
      _scene.remove(_supplyCreate.group);
      _supplyCreate.active = false;
      _addReplacementDrones(2);
    }
  }

  function _addReplacementDrones(count) {
    var added  = 0;
    var playerPos = _playerRef ? _playerRef.position : new THREE.Vector3(0, 0, 0);
    for (var d = 0; d < _drones.length && added < count; d++) {
      if (!_drones[d].alive) {
        var mesh = _buildDroneMesh();
        mesh.position.set(
          playerPos.x + (Math.random() - 0.5) * 6,
          playerPos.y + SPAWN_Y,
          playerPos.z + (Math.random() - 0.5) * 6
        );
        _scene.add(mesh);
        _drones[d].mesh           = mesh;
        _drones[d].hp             = DRONE_HP;
        _drones[d].alive          = true;
        _drones[d].manual         = false;
        _drones[d].loiterActive   = false;
        _drones[d].attacking      = false;
        _drones[d].dying          = false;
        _drones[d].ecmAffected    = false;
        _drones[d].autoReturn     = false;
        _drones[d].signalStrength = 100;
        added++;
      }
    }
  }

  // ── Keyboard Handlers ──────────────────────────────────────────────────────
  function _onKeyDown(e) {
    var key = e.key.toLowerCase();
    _keysDown[key] = true;

    // D+S chord for activation
    if (key === 'd') _dKeyTime = Date.now();
    if (key === 's') _sKeyTime = Date.now();

    if (!_active) {
      if ((key === 'd' && Math.abs(Date.now() - _sKeyTime) < ATTACK_KEY_WINDOW) ||
          (key === 's' && Math.abs(Date.now() - _dKeyTime) < ATTACK_KEY_WINDOW)) {
        if (_keysDown['d'] && _keysDown['s']) {
          _activateSwarm();
        }
      }
      return;
    }

    // Formation cycle
    if (key === 'f') {
      _formation = (_formation + 1) % FORMATIONS.length;
    }

    // Drone selection 1-8
    if (key >= '1' && key <= '8') {
      var idx = parseInt(key, 10) - 1;
      if (idx < _drones.length && _drones[idx].alive) {
        if (_selectedDrone === idx) {
          // Toggle manual mode
          _drones[idx].manual = !_drones[idx].manual;
        } else {
          _selectedDrone = idx;
          _drones[idx].manual = true;
        }
      }
    }

    // Attack all non-manual at nearest enemy
    if (key === ' ' && _active) {
      _launchAttack();
    }

    // Loitering munition
    if (key === 'l') {
      _toggleLoiter();
    }

    // Drone cam toggle
    if (key === 'c') {
      _droneCamActive = !_droneCamActive;
      if (_droneCamActive) {
        if (!_droneCamContainer) _createDroneCam();
      } else {
        _removeDroneCam();
      }
    }
  }

  function _onKeyUp(e) {
    _keysDown[e.key.toLowerCase()] = false;
  }

  // ── Manual Drone Control ───────────────────────────────────────────────────
  function _updateManualDrone(drone, dt) {
    var speed = 8 * dt;
    var fwd   = new THREE.Vector3();
    if (_camera) {
      _camera.getWorldDirection(fwd);
    } else {
      fwd.set(0, 0, -1);
    }
    fwd.y = 0;
    fwd.normalize();
    var right = new THREE.Vector3();
    right.crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();

    if (_keysDown['w']) drone.mesh.position.addScaledVector(fwd,   speed);
    if (_keysDown['s'] && !(!_active)) drone.mesh.position.addScaledVector(fwd,  -speed);
    if (_keysDown['a']) drone.mesh.position.addScaledVector(right, -speed);
    if (_keysDown['d']) drone.mesh.position.addScaledVector(right,  speed);
    if (_keysDown['q']) drone.mesh.position.y += speed;
    if (_keysDown['e']) drone.mesh.position.y -= speed;
    if (drone.mesh.position.y < 1) drone.mesh.position.y = 1;
  }

  // ── Activate Swarm ─────────────────────────────────────────────────────────
  function _activateSwarm() {
    if (_active) return;
    _active = true;
    _spawnDrones();
    _spawnInfantry();
    _buildECMTower(20,  30);
    _buildECMTower(-25, -15);
    _buildAAGun(15, -20);
    _buildAAGun(-18,  25);
    _supplyTimer = RESUPPLY_INTERVAL;
    _createHUD();
    _createReticle();
  }

  // ── Main Update ────────────────────────────────────────────────────────────
  function update(dt, scene, camera, player, enemies) {
    // Persist references
    if (scene)   _scene     = scene;
    if (camera)  _camera    = camera;
    if (player)  _playerRef = player;
    if (enemies) _enemiesRef = enemies;

    if (!_active) return;

    var playerPos = _playerRef ? _playerRef.position : new THREE.Vector3(0, 0, 0);

    // Supply crate timer
    _supplyTimer -= dt;
    if (_supplyTimer <= 0 && (!_supplyCreate || !_supplyCreate.active)) {
      _supplyTimer = RESUPPLY_INTERVAL;
      var dropX = playerPos.x + (Math.random() - 0.5) * 30;
      var dropZ = playerPos.z + (Math.random() - 0.5) * 30;
      _buildSupplyCrate(dropX, dropZ);
    }

    // Update supply crate falling
    if (_supplyCreate && _supplyCreate.active && _supplyCreate.falling) {
      _supplyCreate.group.position.y -= 4 * dt;
      if (_supplyCreate.group.position.y <= 0.4) {
        _supplyCreate.group.position.y = 0.4;
        _supplyCreate.falling          = false;
        // Remove canopy once landed
        if (_supplyCreate.canopy && _supplyCreate.canopy.parent) {
          _supplyCreate.group.remove(_supplyCreate.canopy);
        }
        if (_supplyCreate.lines && _supplyCreate.lines.parent) {
          _supplyCreate.group.remove(_supplyCreate.lines);
        }
      }
    }

    _checkSupplyCollection();
    _checkECM();
    _updateSignalStrength();
    _updateAAGuns(dt);
    _updateInfantry(dt);
    _updateFlashes(dt);

    // Update each drone
    for (var i = 0; i < _drones.length; i++) {
      var drone = _drones[i];
      if (!drone.alive) continue;

      // Spin rotors
      var rotors = drone.mesh.userData.rotors;
      if (rotors) {
        for (var r = 0; r < rotors.length; r++) {
          rotors[r].rotation.y += ROTOR_SPIN * dt * (r % 2 === 0 ? 1 : -1);
        }
      }

      // Dying: spin and fall
      if (drone.dying) {
        drone.mesh.rotation.z += 0.3;
        drone.mesh.position.y -= 3 * dt;
        if (drone.mesh.position.y <= 0) {
          _explodeDrone(drone, drone.mesh.position.clone());
          if (_selectedDrone === i) _selectedDrone = -1;
        }
        continue;
      }

      // ECM — random movement
      if (drone.ecmAffected && !drone.manual) {
        drone.mesh.position.x += (Math.random() - 0.5) * 0.3;
        drone.mesh.position.z += (Math.random() - 0.5) * 0.3;
        drone.mesh.position.y += (Math.random() - 0.5) * 0.1;
        drone.mesh.position.y = Math.max(1, drone.mesh.position.y);
        continue;
      }

      // Auto-return if out of signal range
      if (drone.autoReturn && !drone.manual) {
        var retTarget = new THREE.Vector3(playerPos.x, playerPos.y + SPAWN_Y, playerPos.z);
        drone.mesh.position.lerp(retTarget, 0.03);
        if (drone.mesh.position.distanceTo(retTarget) < 1) {
          drone.autoReturn = false;
        }
        continue;
      }

      // Manual control
      if (drone.manual) {
        _updateManualDrone(drone, dt);
        continue;
      }

      // Loitering orbit
      if (drone.loiterActive) {
        drone.loiterAngle += dt * (Math.PI * 2 / 10); // 10s orbit
        drone.mesh.position.x = playerPos.x + Math.cos(drone.loiterAngle) * LOITER_RADIUS;
        drone.mesh.position.z = playerPos.z + Math.sin(drone.loiterAngle) * LOITER_RADIUS;
        drone.mesh.position.y = LOITER_Y;
        continue;
      }

      // Attack mode — dive bomb
      if (drone.attacking && drone.attackTarget) {
        var tPos = drone.attackTarget.position || (drone.attackTarget.mesh && drone.attackTarget.mesh.position);
        if (!tPos) {
          drone.attacking = false;
          continue;
        }
        // Move toward target
        var toTarget = tPos.clone().sub(drone.mesh.position);
        var targetDist = toTarget.length();
        if (targetDist < 1.5) {
          // Explode on impact
          _explodeDrone(drone, drone.mesh.position.clone());
          // Kill target
          if (drone.attackTarget.hp !== undefined) {
            drone.attackTarget.hp -= 100;
            drone.attackTarget.alive = false;
          }
          if (drone.attackTarget.mesh && drone.attackTarget.mesh.parent) {
            _scene.remove(drone.attackTarget.mesh);
          }
          if (_selectedDrone === i) _selectedDrone = -1;
          continue;
        }
        toTarget.normalize();
        drone.mesh.position.addScaledVector(toTarget, 10 * dt);
        // Dive y
        drone.mesh.position.y = THREE.MathUtils.lerp(drone.mesh.position.y, (tPos.y || 0) + 0.5, 0.05);
        continue;
      }

      // Formation movement
      var formTarget = _getFormationTarget(i);
      // RECON formation — orbit
      if (FORMATIONS[_formation] === 'RECON') {
        var reconAngle = (i / MAX_DRONES) * Math.PI * 2 + Date.now() / 5000;
        formTarget.x   = playerPos.x + Math.cos(reconAngle) * RECON_RADIUS;
        formTarget.z   = playerPos.z + Math.sin(reconAngle) * RECON_RADIUS;
        formTarget.y   = playerPos.y + SPAWN_Y;
      }
      drone.mesh.position.lerp(formTarget, 0.04);

      // Gentle hover oscillation
      drone.mesh.position.y += Math.sin(Date.now() / 800 + i * 1.3) * 0.003;
    }

    _updateReticle();

    if (_droneCamActive && _droneCamCtx) {
      _renderDroneCam();
    }

    _updateHUD();
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  function init(scene, camera, player, enemies) {
    _scene      = scene;
    _camera     = camera;
    _playerRef  = player;
    _enemiesRef = enemies || [];

    _active        = false;
    _drones        = [];
    _ecmTowers     = [];
    _aaGuns        = [];
    _infantryEnemies = [];
    _tempFlashes   = [];
    _supplyCreate  = null;
    _supplyTimer   = RESUPPLY_INTERVAL;
    _selectedDrone = -1;
    _formation     = 0;
    _dKeyTime      = 0;
    _sKeyTime      = 0;
    _keysDown      = {};
    _droneCamActive = false;

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);
  }

  // ── Reset ──────────────────────────────────────────────────────────────────
  function reset() {
    document.removeEventListener('keydown', _onKeyDown);
    document.removeEventListener('keyup',   _onKeyUp);

    for (var i = 0; i < _drones.length; i++) {
      if (_drones[i].mesh && _scene) _scene.remove(_drones[i].mesh);
    }
    for (var j = 0; j < _ecmTowers.length; j++) {
      if (_ecmTowers[j].mesh && _scene) _scene.remove(_ecmTowers[j].mesh);
    }
    for (var k = 0; k < _aaGuns.length; k++) {
      if (_aaGuns[k].mesh && _scene) _scene.remove(_aaGuns[k].mesh);
    }
    for (var m = 0; m < _infantryEnemies.length; m++) {
      if (_infantryEnemies[m].mesh && _scene) _scene.remove(_infantryEnemies[m].mesh);
    }
    for (var f = 0; f < _tempFlashes.length; f++) {
      if (_tempFlashes[f] && _scene) _scene.remove(_tempFlashes[f]);
    }
    if (_supplyCreate && _supplyCreate.group && _scene) {
      _scene.remove(_supplyCreate.group);
    }

    _removeHUD();
    _removeReticle();
    _removeDroneCam();

    _drones          = [];
    _ecmTowers       = [];
    _aaGuns          = [];
    _infantryEnemies = [];
    _tempFlashes     = [];
    _supplyCreate    = null;
    _active          = false;
    _keysDown        = {};
    _droneCamActive  = false;
    _selectedDrone   = -1;
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    init:   init,
    update: update,
    reset:  reset
  };

}());
