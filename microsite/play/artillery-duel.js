window.ArtilleryDuel = (function () {
  'use strict';

  // State vars
  var _scene, _camera, _active;
  var _shells = [];
  var _enemyGuns = [];
  var _crew = [];
  var _infantry = [];
  var _ammo = 12;
  var _incomingTimer = 0;
  var _resupplyArrived = false;
  var _radarActive = false;
  var _barrageCount = 0;
  var _howitzer = null;

  // Key tracking
  var _keys = {};
  var _keyTimestamps = {};
  var _activationWindow = 400;

  // HUD
  var _hud = null;
  var _radarCanvas = null;
  var _radarCtx = null;

  // Trajectory preview
  var _trajectoryLine = null;
  var _showTrajectory = false;

  // Barrage tracking
  var _barrageActive = false;
  var _barrageElapsed = 0;
  var _barrageShots = 0;
  var _barrageInterval = 1.5;

  // Ammo truck
  var _truck = null;
  var _truckTimer = 0;
  var _truckActive = false;
  var _truckTarget = null;

  // Guns down counter
  var _gunsDown = 0;

  // Crew alive counter
  var _crewAlive = 3;

  // Infantry advance flag
  var _infantryAdvancing = false;

  // All meshes for cleanup
  var _allMeshes = [];

  // Enemy shell lights
  var _explosionLights = [];

  // Aim direction for howitzer
  var _aimAngleH = 0;
  var _aimAngleV = 0.4;
  var _fireSpeed = 60;

  // AudioContext
  var _audioCtx = null;

  // -----------------------------------------------------------------------
  // Helper: play tone
  // -----------------------------------------------------------------------
  function _playTone(freq, duration) {
    try {
      if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      var osc = _audioCtx.createOscillator();
      var gain = _audioCtx.createGain();
      osc.connect(gain);
      gain.connect(_audioCtx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, _audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + duration);
      osc.start(_audioCtx.currentTime);
      osc.stop(_audioCtx.currentTime + duration);
    } catch (e) { /* ignore audio errors */ }
  }

  // -----------------------------------------------------------------------
  // Helper: add mesh to scene and tracking
  // -----------------------------------------------------------------------
  function _addMesh(mesh) {
    _scene.add(mesh);
    _allMeshes.push(mesh);
    return mesh;
  }

  // -----------------------------------------------------------------------
  // Helper: remove mesh
  // -----------------------------------------------------------------------
  function _removeMesh(mesh) {
    if (!mesh) { return; }
    _scene.remove(mesh);
    var idx = _allMeshes.indexOf(mesh);
    if (idx !== -1) { _allMeshes.splice(idx, 1); }
    if (mesh.geometry) { mesh.geometry.dispose(); }
    if (mesh.material) { mesh.material.dispose(); }
  }

  // -----------------------------------------------------------------------
  // Helper: distance2D
  // -----------------------------------------------------------------------
  function _dist2D(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  // -----------------------------------------------------------------------
  // Create Howitzer
  // -----------------------------------------------------------------------
  function _createHowitzer() {
    _howitzer = new THREE.Group();

    var carriageGeo = new THREE.BoxGeometry(3, 1.5, 2);
    var carriageMat = new THREE.MeshLambertMaterial({ color: 0x445544 });
    var carriage = new THREE.Mesh(carriageGeo, carriageMat);
    carriage.position.set(0, 0.75, 0);
    _howitzer.add(carriage);

    var barrelGeo = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
    var barrelMat = new THREE.MeshLambertMaterial({ color: 0x334433 });
    var barrel = new THREE.Mesh(barrelGeo, barrelMat);
    // Rotate so the cylinder points forward (Z axis)
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 1.5, -2);
    _howitzer.add(barrel);

    _howitzer.position.set(0, 0, 0);
    _scene.add(_howitzer);
    _allMeshes.push(_howitzer);
  }

  // -----------------------------------------------------------------------
  // Create Enemy Guns
  // -----------------------------------------------------------------------
  function _createEnemyGuns() {
    var positions = [
      [-60, 0, -80],
      [0, 0, -100],
      [60, 0, -80]
    ];

    for (var i = 0; i < positions.length; i++) {
      var group = new THREE.Group();

      var carriageGeo = new THREE.BoxGeometry(2.5, 1, 1.5);
      var carriageMat = new THREE.MeshLambertMaterial({ color: 0x553322 });
      var carriage = new THREE.Mesh(carriageGeo, carriageMat);
      carriage.position.set(0, 0.5, 0);
      group.add(carriage);

      var barrelGeo = new THREE.CylinderGeometry(0.25, 0.25, 3.5, 8);
      var barrelMat = new THREE.MeshLambertMaterial({ color: 0x553322 });
      var barrel = new THREE.Mesh(barrelGeo, barrelMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 1.2, 1.5);
      group.add(barrel);

      group.position.set(positions[i][0], positions[i][1], positions[i][2]);

      _scene.add(group);
      _allMeshes.push(group);

      var fireDelay = 15000 + Math.random() * 10000;
      _enemyGuns.push({
        group: group,
        active: true,
        suppressed: false,
        suppressTimer: 0,
        fireTimer: fireDelay,
        lastFired: -9999,
        destroyed: false,
        destroyAnim: false,
        destroyElapsed: 0,
        pos: { x: positions[i][0], y: positions[i][1], z: positions[i][2] }
      });
    }
  }

  // -----------------------------------------------------------------------
  // Create Crew
  // -----------------------------------------------------------------------
  function _createCrew() {
    var positions = [[-1.5, 0, 2], [0, 0, 2], [1.5, 0, 2]];
    for (var i = 0; i < positions.length; i++) {
      var geo = new THREE.BoxGeometry(0.5, 1.2, 0.5);
      var mat = new THREE.MeshLambertMaterial({ color: 0x445544 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(positions[i][0], 0.6, positions[i][2]);
      _scene.add(mesh);
      _allMeshes.push(mesh);
      _crew.push({ mesh: mesh, alive: true });
    }
  }

  // -----------------------------------------------------------------------
  // Create Infantry
  // -----------------------------------------------------------------------
  function _createInfantry() {
    for (var i = 0; i < 4; i++) {
      var geo = new THREE.BoxGeometry(0.5, 1.2, 0.5);
      var mat = new THREE.MeshLambertMaterial({ color: 0x445544 });
      var mesh = new THREE.Mesh(geo, mat);
      var startX = -3 + i * 2;
      mesh.position.set(startX, 0.6, 10);
      _scene.add(mesh);
      _allMeshes.push(mesh);
      _infantry.push({
        mesh: mesh,
        alive: true,
        advancing: false,
        targetGun: null,
        destroyProgress: 0
      });
    }
  }

  // -----------------------------------------------------------------------
  // Create ammo truck
  // -----------------------------------------------------------------------
  function _createTruck() {
    var geo = new THREE.BoxGeometry(5, 2, 2.5);
    var mat = new THREE.MeshLambertMaterial({ color: 0x6B6B4A });
    _truck = new THREE.Mesh(geo, mat);
    _truck.position.set(-80, 1, 60);
    _truck.visible = false;
    _scene.add(_truck);
    _allMeshes.push(_truck);
    _truckTarget = { x: -15, z: 15 };
  }

  // -----------------------------------------------------------------------
  // Create HUD
  // -----------------------------------------------------------------------
  function _createHUD() {
    _hud = document.createElement('div');
    _hud.id = 'artillery-duel-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:10px',
      'color:#00ff88',
      'font-family:monospace',
      'font-size:13px',
      'background:rgba(0,0,0,0.6)',
      'padding:6px 10px',
      'border:1px solid #00ff88',
      'z-index:9999',
      'pointer-events:none',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hud);

    // Radar canvas
    _radarCanvas = document.createElement('canvas');
    _radarCanvas.id = 'artillery-duel-radar';
    _radarCanvas.width = 200;
    _radarCanvas.height = 200;
    _radarCanvas.style.cssText = [
      'position:fixed',
      'top:10px',
      'right:10px',
      'z-index:9999',
      'border:2px solid #00ff88',
      'background:rgba(0,30,0,0.8)',
      'display:none'
    ].join(';');
    document.body.appendChild(_radarCanvas);
    _radarCtx = _radarCanvas.getContext('2d');
  }

  // -----------------------------------------------------------------------
  // Update HUD
  // -----------------------------------------------------------------------
  function _updateHUD() {
    if (!_hud) { return; }
    var secs = Math.max(0, Math.ceil(_incomingTimer));
    var mm = String(Math.floor(secs / 60)).padStart(2, '0');
    var ss = String(secs % 60).padStart(2, '0');
    _hud.textContent = (
      'ARTY DUEL' +
      ' [SHELLS: ' + _ammo + '/12]' +
      ' [GUNS DOWN: ' + _gunsDown + '/3]' +
      ' [CREW: ' + _crewAlive + '/3]' +
      ' [RADAR: ' + (_radarActive ? 'ON' : 'OFF') + ']' +
      ' | INCOMING: ' + mm + ':' + ss
    );
  }

  // -----------------------------------------------------------------------
  // Update Radar
  // -----------------------------------------------------------------------
  function _updateRadar(currentTime) {
    if (!_radarActive || !_radarCtx) { return; }
    var ctx = _radarCtx;
    var W = 200;
    var H = 200;
    ctx.clearRect(0, 0, W, H);

    // Draw grid
    ctx.strokeStyle = '#003300';
    ctx.lineWidth = 1;
    var gx, gy;
    for (gx = 0; gx < W; gx += 20) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, H);
      ctx.stroke();
    }
    for (gy = 0; gy < H; gy += 20) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(W, gy);
      ctx.stroke();
    }

    // Player dot at center
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Enemy guns: show if fired at some point
    for (var i = 0; i < _enemyGuns.length; i++) {
      var gun = _enemyGuns[i];
      if (gun.destroyed) { continue; }
      // Revealed 2s after they fire
      var revealed = (gun.lastFired > 0) && ((currentTime - gun.lastFired) < 30);
      if (!revealed) { continue; }
      // Scale: map range +-120 world units to 200px
      var scale = W / 240;
      var px = W / 2 + gun.pos.x * scale;
      var py = H / 2 + gun.pos.z * scale;

      ctx.fillStyle = gun.suppressed ? '#ffff00' : '#ff4400';
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();

      // Bearing/range text
      var bearing = Math.atan2(gun.pos.x, -gun.pos.z) * 180 / Math.PI;
      if (bearing < 0) { bearing += 360; }
      var range = Math.round(Math.sqrt(gun.pos.x * gun.pos.x + gun.pos.z * gun.pos.z));
      ctx.fillStyle = '#00ff88';
      ctx.font = '9px monospace';
      ctx.fillText(Math.round(bearing) + 'deg ' + range + 'm', px + 6, py);
    }
  }

  // -----------------------------------------------------------------------
  // Create trajectory preview
  // -----------------------------------------------------------------------
  function _createTrajectoryPreview() {
    var points = _calcTrajectoryPoints(30);
    var numPts = points.length;
    var posArr = new Float32Array(numPts * 3);
    for (var i = 0; i < numPts; i++) {
      posArr[i * 3] = points[i].x;
      posArr[i * 3 + 1] = points[i].y;
      posArr[i * 3 + 2] = points[i].z;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));

    // Build indices for LineSegments (pairs of consecutive points)
    var indices = [];
    for (var j = 0; j < numPts - 1; j++) {
      indices.push(j, j + 1);
    }
    geo.setIndex(indices);

    var mat = new THREE.LineBasicMaterial({ color: 0xffff00, opacity: 0.7, transparent: true });
    _trajectoryLine = new THREE.LineSegments(geo, mat);
    _scene.add(_trajectoryLine);
    _allMeshes.push(_trajectoryLine);
  }

  // -----------------------------------------------------------------------
  // Calc trajectory arc points
  // -----------------------------------------------------------------------
  function _calcTrajectoryPoints(numPts) {
    var pts = [];
    var hx = _howitzer.position.x;
    var hy = _howitzer.position.y + 1.5;
    var hz = _howitzer.position.z;

    var cosV = Math.cos(_aimAngleV);
    var sinV = Math.sin(_aimAngleV);
    var cosH = Math.cos(_aimAngleH);
    var sinH = Math.sin(_aimAngleH);

    var vx = sinH * cosV * _fireSpeed;
    var vy = sinV * _fireSpeed;
    var vz = -cosH * cosV * _fireSpeed;

    var dt = 0.1;
    var cx = hx;
    var cy = hy;
    var cz = hz;
    var cvx = vx;
    var cvy = vy;
    var cvz = vz;

    for (var i = 0; i < numPts; i++) {
      pts.push({ x: cx, y: cy, z: cz });
      cvy += -9.8 * dt;
      cx += cvx * dt;
      cy += cvy * dt;
      cz += cvz * dt;
      if (cy < 0) {
        cy = 0;
        break;
      }
    }
    return pts;
  }

  // -----------------------------------------------------------------------
  // Update trajectory preview
  // -----------------------------------------------------------------------
  function _updateTrajectoryPreview() {
    if (!_trajectoryLine) { return; }
    var points = _calcTrajectoryPoints(30);
    var positions = _trajectoryLine.geometry.attributes.position;
    var maxPts = positions.count;
    for (var i = 0; i < maxPts && i < points.length; i++) {
      positions.setXYZ(i, points[i].x, points[i].y, points[i].z);
    }
    positions.needsUpdate = true;
  }

  // -----------------------------------------------------------------------
  // Fire friendly shell
  // -----------------------------------------------------------------------
  function _fireFriendlyShell() {
    if (_ammo <= 0) { return; }
    _ammo--;
    _playTone(80, 0.4);

    var hx = _howitzer.position.x;
    var hy = _howitzer.position.y + 1.5;
    var hz = _howitzer.position.z;

    var cosV = Math.cos(_aimAngleV);
    var sinV = Math.sin(_aimAngleV);
    var cosH = Math.cos(_aimAngleH);
    var sinH = Math.sin(_aimAngleH);

    var vx = sinH * cosV * _fireSpeed;
    var vy = sinV * _fireSpeed;
    var vz = -cosH * cosV * _fireSpeed;

    var geo = new THREE.SphereGeometry(0.35, 6, 6);
    var mat = new THREE.MeshLambertMaterial({ color: 0x888844 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(hx, hy, hz);
    _scene.add(mesh);
    _allMeshes.push(mesh);

    _shells.push({
      mesh: mesh,
      vx: vx,
      vy: vy,
      vz: vz,
      friendly: true,
      exploded: false
    });

    // Infantry start advancing after player fires
    _infantryAdvancing = true;
    for (var i = 0; i < _infantry.length; i++) {
      _infantry[i].advancing = true;
    }
    _updateHUD();
  }

  // -----------------------------------------------------------------------
  // Fire enemy shell from gun index
  // -----------------------------------------------------------------------
  function _fireEnemyShell(gunIdx) {
    var gun = _enemyGuns[gunIdx];
    if (!gun.active || gun.suppressed || gun.destroyed) { return; }

    _playTone(120, 0.4);
    _incomingTimer = Math.random() * 8 + 4;
    gun.lastFired = _getTime();

    // Aim at player position with some spread
    var dx = (Math.random() - 0.5) * 20;
    var dz = (Math.random() - 0.5) * 20;
    var tx = 0 + dx;
    var tz = 0 + dz;

    var sx = gun.pos.x;
    var sy = 1.2;
    var sz = gun.pos.z;

    var distX = tx - sx;
    var distZ = tz - sz;
    var dist = Math.sqrt(distX * distX + distZ * distZ);
    var t = dist / 50;
    if (t < 0.1) { t = 0.1; }
    var vy = (9.8 * t) / 2;
    var vx = distX / t;
    var vz = distZ / t;

    var geo = new THREE.SphereGeometry(0.4, 6, 6);
    var mat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(sx, sy, sz);
    _scene.add(mesh);
    _allMeshes.push(mesh);

    _shells.push({
      mesh: mesh,
      vx: vx,
      vy: vy,
      vz: vz,
      friendly: false,
      exploded: false,
      fromGun: gunIdx
    });
  }

  // -----------------------------------------------------------------------
  // Handle shell explosion
  // -----------------------------------------------------------------------
  function _explodeShell(shell) {
    shell.exploded = true;
    var px = shell.mesh.position.x;
    var py = shell.mesh.position.y;
    var pz = shell.mesh.position.z;

    // Add explosion light
    var light = new THREE.PointLight(0xFF4400, 8, 15);
    light.position.set(px, py, pz);
    _scene.add(light);
    _explosionLights.push({ light: light, timer: 0.5 });

    if (!shell.friendly) {
      // Check crew damage (10-unit radius)
      for (var c = 0; c < _crew.length; c++) {
        var crewMem = _crew[c];
        if (!crewMem.alive) { continue; }
        var cd = _dist2D(px, pz, crewMem.mesh.position.x, crewMem.mesh.position.z);
        if (cd < 10) {
          crewMem.alive = false;
          crewMem.mesh.visible = false;
          _crewAlive = Math.max(0, _crewAlive - 1);
        }
      }
    } else {
      // Check enemy gun suppression/destruction
      for (var g = 0; g < _enemyGuns.length; g++) {
        var gun = _enemyGuns[g];
        if (gun.destroyed) { continue; }
        var gd = _dist2D(px, pz, gun.pos.x, gun.pos.z);
        if (gd < 1.5) {
          // Direct hit - destroy
          gun.destroyed = true;
          gun.destroyAnim = true;
          gun.destroyElapsed = 0;
          _gunsDown++;
        } else if (gd < 5) {
          // Suppression
          gun.suppressed = true;
          gun.suppressTimer = 5;
        }
      }

      // Check infantry boost: if shell lands near an enemy gun, infantry in range can act
      for (var inf = 0; inf < _infantry.length; inf++) {
        var soldier = _infantry[inf];
        if (!soldier.alive) { continue; }
        for (var g2 = 0; g2 < _enemyGuns.length; g2++) {
          var gun2 = _enemyGuns[g2];
          if (gun2.destroyed) { continue; }
          var id = _dist2D(px, pz, gun2.pos.x, gun2.pos.z);
          var sid = _dist2D(soldier.mesh.position.x, soldier.mesh.position.z, gun2.pos.x, gun2.pos.z);
          if (id < 10 && sid < 15) {
            soldier.targetGun = g2;
          }
        }
      }
    }
    _updateHUD();
  }

  // -----------------------------------------------------------------------
  // Get time helper
  // -----------------------------------------------------------------------
  function _getTime() {
    return (typeof performance !== 'undefined') ? performance.now() / 1000 : Date.now() / 1000;
  }

  // -----------------------------------------------------------------------
  // Key handlers
  // -----------------------------------------------------------------------
  function _onKeyDown(e) {
    if (!_active) { return; }
    var key = e.key.toUpperCase();
    _keys[key] = true;
    _keyTimestamps[key] = Date.now();

    // Simultaneous A+L activation check (400ms window)
    if (key === 'A' || key === 'L') {
      var other = (key === 'A') ? 'L' : 'A';
      if (_keys[other]) {
        var diff = Math.abs((_keyTimestamps['A'] || 0) - (_keyTimestamps['L'] || 0));
        if (diff <= _activationWindow) {
          if (_hud) { _hud.style.display = 'block'; }
        }
      }
    }

    if (key === 'R') {
      _radarActive = !_radarActive;
      if (_radarCanvas) {
        _radarCanvas.style.display = _radarActive ? 'block' : 'none';
      }
      _updateHUD();
    }

    if (key === 'T') {
      _showTrajectory = !_showTrajectory;
      if (_showTrajectory && !_trajectoryLine) {
        _createTrajectoryPreview();
      } else if (!_showTrajectory && _trajectoryLine) {
        _removeMesh(_trajectoryLine);
        _trajectoryLine = null;
      }
    }

    if (key === 'B') {
      if (!_barrageActive && _ammo >= 3) {
        _barrageActive = true;
        _barrageElapsed = 0;
        _barrageShots = 0;
        _barrageCount++;
        _fireFriendlyShell();
        _barrageShots = 1;
      }
    }

    if (key === 'F') {
      _fireFriendlyShell();
    }

    // Aim controls
    if (key === 'ARROWLEFT') { _aimAngleH -= 0.05; }
    if (key === 'ARROWRIGHT') { _aimAngleH += 0.05; }
    if (key === 'ARROWUP') { _aimAngleV = Math.min(Math.PI / 2, _aimAngleV + 0.02); }
    if (key === 'ARROWDOWN') { _aimAngleV = Math.max(0.05, _aimAngleV - 0.02); }

    // Resupply collection
    if (key === 'E') {
      if (_truckActive && _truck) {
        var playerDist = _dist2D(0, 0, _truck.position.x, _truck.position.z);
        if (playerDist < 20) {
          _ammo = Math.min(12, _ammo + 8);
          _truck.visible = false;
          _truckActive = false;
          _resupplyArrived = false;
          _truckTimer = 0;
          _updateHUD();
        }
      }
    }
  }

  function _onKeyUp(e) {
    var key = e.key.toUpperCase();
    _keys[key] = false;
  }

  // -----------------------------------------------------------------------
  // init
  // -----------------------------------------------------------------------
  function init(scene, camera) {
    _scene = scene;
    _camera = camera;
    _active = true;

    _shells = [];
    _enemyGuns = [];
    _crew = [];
    _infantry = [];
    _ammo = 12;
    _incomingTimer = 0;
    _resupplyArrived = false;
    _radarActive = false;
    _barrageCount = 0;
    _gunsDown = 0;
    _crewAlive = 3;
    _infantryAdvancing = false;
    _barrageActive = false;
    _barrageShots = 0;
    _barrageElapsed = 0;
    _truckTimer = 0;
    _truckActive = false;
    _trajectoryLine = null;
    _showTrajectory = false;
    _explosionLights = [];
    _allMeshes = [];
    _keys = {};
    _keyTimestamps = {};
    _aimAngleH = 0;
    _aimAngleV = 0.4;

    _createHowitzer();
    _createEnemyGuns();
    _createCrew();
    _createInfantry();
    _createTruck();
    _createHUD();
    _updateHUD();

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup', _onKeyUp);
  }

  // -----------------------------------------------------------------------
  // update
  // -----------------------------------------------------------------------
  function update(delta) {
    if (!_active) { return; }

    var i, shell, gun, soldier;
    var now = _getTime();

    // --- Update howitzer rotation to reflect aim ---
    if (_howitzer) {
      _howitzer.rotation.y = _aimAngleH;
    }
    if (_showTrajectory && _trajectoryLine) {
      _updateTrajectoryPreview();
    }

    // --- Move and check shells ---
    for (i = _shells.length - 1; i >= 0; i--) {
      shell = _shells[i];
      if (shell.exploded) {
        _removeMesh(shell.mesh);
        _shells.splice(i, 1);
        continue;
      }
      shell.vy += -9.8 * delta;
      shell.mesh.position.x += shell.vx * delta;
      shell.mesh.position.y += shell.vy * delta;
      shell.mesh.position.z += shell.vz * delta;

      if (shell.mesh.position.y <= 0) {
        shell.mesh.position.y = 0;
        _explodeShell(shell);
        _removeMesh(shell.mesh);
        _shells.splice(i, 1);
      }
    }

    // --- Update explosion lights ---
    for (i = _explosionLights.length - 1; i >= 0; i--) {
      var el = _explosionLights[i];
      el.timer -= delta;
      if (el.timer <= 0) {
        _scene.remove(el.light);
        _explosionLights.splice(i, 1);
      } else {
        el.light.intensity = 8 * (el.timer / 0.5);
      }
    }

    // --- Update enemy guns ---
    for (i = 0; i < _enemyGuns.length; i++) {
      gun = _enemyGuns[i];
      if (gun.destroyed) {
        // Destroy animation
        if (gun.destroyAnim) {
          gun.destroyElapsed += delta;
          gun.group.rotation.x = Math.min(Math.PI / 2, (gun.destroyElapsed / 1.0) * (Math.PI / 2));
          if (gun.destroyElapsed >= 1.0) {
            gun.destroyAnim = false;
          }
        }
        continue;
      }

      if (gun.suppressed) {
        gun.suppressTimer -= delta;
        if (gun.suppressTimer <= 0) {
          gun.suppressed = false;
        }
        continue;
      }

      gun.fireTimer -= delta * 1000;
      if (gun.fireTimer <= 0) {
        _fireEnemyShell(i);
        gun.fireTimer = 15000 + Math.random() * 10000;
      }
    }

    // --- Incoming timer countdown ---
    if (_incomingTimer > 0) {
      _incomingTimer -= delta;
      if (_incomingTimer < 0) { _incomingTimer = 0; }
    }

    // --- Barrage logic ---
    if (_barrageActive) {
      _barrageElapsed += delta;
      if (_barrageShots < 3 && _barrageElapsed >= _barrageShots * _barrageInterval) {
        _fireFriendlyShell();
        _barrageShots++;
      }
      if (_barrageShots >= 3) {
        _barrageActive = false;
      }
    }

    // --- Ammo truck timer ---
    if (!_truckActive && !_resupplyArrived) {
      _truckTimer += delta;
      if (_truckTimer >= 60 && _truck) {
        _truckActive = true;
        _resupplyArrived = true;
        _truck.visible = true;
        _truck.position.set(-80, 1, 60);
      }
    }

    // --- Animate truck driving in ---
    if (_truckActive && _truck && _truck.visible) {
      var ttx = _truckTarget.x - _truck.position.x;
      var ttz = _truckTarget.z - _truck.position.z;
      var tdist = Math.sqrt(ttx * ttx + ttz * ttz);
      if (tdist > 1) {
        var ts = 8 * delta;
        _truck.position.x += (ttx / tdist) * ts;
        _truck.position.z += (ttz / tdist) * ts;
      }
    }

    // --- Infantry advance ---
    for (i = 0; i < _infantry.length; i++) {
      soldier = _infantry[i];
      if (!soldier.alive || !soldier.advancing) { continue; }

      // Find nearest active enemy gun to advance toward
      var nearestGun = -1;
      var nearestDist = Infinity;
      for (var g = 0; g < _enemyGuns.length; g++) {
        if (_enemyGuns[g].destroyed) { continue; }
        var gd = _dist2D(
          soldier.mesh.position.x, soldier.mesh.position.z,
          _enemyGuns[g].pos.x, _enemyGuns[g].pos.z
        );
        if (gd < nearestDist) {
          nearestDist = gd;
          nearestGun = g;
        }
      }

      if (nearestGun >= 0) {
        var tgIdx = (soldier.targetGun !== null) ? soldier.targetGun : nearestGun;
        var tgg = _enemyGuns[tgIdx];
        if (!tgg || tgg.destroyed) {
          soldier.targetGun = nearestGun;
          tgg = _enemyGuns[nearestGun];
        }

        var distToGun = _dist2D(
          soldier.mesh.position.x, soldier.mesh.position.z,
          tgg.pos.x, tgg.pos.z
        );

        if (distToGun > 15) {
          // Move toward gun
          var moveX = tgg.pos.x - soldier.mesh.position.x;
          var moveZ = tgg.pos.z - soldier.mesh.position.z;
          var moveDist = Math.sqrt(moveX * moveX + moveZ * moveZ);
          var speed = 5 * delta;
          soldier.mesh.position.x += (moveX / moveDist) * speed;
          soldier.mesh.position.z += (moveZ / moveDist) * speed;
        } else if (!tgg.destroyed) {
          // At range 15 — can destroy over 5s if player fires nearby
          if (soldier.targetGun !== null) {
            soldier.destroyProgress += delta;
            if (soldier.destroyProgress >= 5) {
              tgg.destroyed = true;
              tgg.destroyAnim = true;
              tgg.destroyElapsed = 0;
              _gunsDown++;
              soldier.advancing = false;
              _updateHUD();
            }
          }
        }
      }
    }

    // --- Update radar ---
    if (_radarActive) {
      _updateRadar(now);
    }

    // --- Update HUD ---
    _updateHUD();
  }

  // -----------------------------------------------------------------------
  // reset
  // -----------------------------------------------------------------------
  function reset() {
    _active = false;

    // Remove all tracked meshes
    for (var i = 0; i < _allMeshes.length; i++) {
      var m = _allMeshes[i];
      if (!m) { continue; }
      if (_scene) { _scene.remove(m); }
      if (m.geometry) { m.geometry.dispose(); }
      if (m.material) { m.material.dispose(); }
    }
    _allMeshes = [];

    // Remove explosion lights
    for (var j = 0; j < _explosionLights.length; j++) {
      if (_scene && _explosionLights[j].light) {
        _scene.remove(_explosionLights[j].light);
      }
    }
    _explosionLights = [];

    // Remove HUD
    if (_hud && _hud.parentNode) {
      _hud.parentNode.removeChild(_hud);
      _hud = null;
    }
    if (_radarCanvas && _radarCanvas.parentNode) {
      _radarCanvas.parentNode.removeChild(_radarCanvas);
      _radarCanvas = null;
      _radarCtx = null;
    }

    // Remove event listeners
    document.removeEventListener('keydown', _onKeyDown);
    document.removeEventListener('keyup', _onKeyUp);

    // Clear state
    _shells = [];
    _enemyGuns = [];
    _crew = [];
    _infantry = [];
    _ammo = 12;
    _incomingTimer = 0;
    _resupplyArrived = false;
    _radarActive = false;
    _barrageCount = 0;
    _howitzer = null;
    _truck = null;
    _truckActive = false;
    _trajectoryLine = null;
    _showTrajectory = false;
    _gunsDown = 0;
    _crewAlive = 3;
    _barrageActive = false;
    _barrageShots = 0;
    _barrageElapsed = 0;
    _truckTimer = 0;
    _keys = {};
    _keyTimestamps = {};
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
})();
