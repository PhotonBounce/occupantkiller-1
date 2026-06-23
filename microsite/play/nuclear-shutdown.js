window.NuclearShutdown = (function() {
  'use strict';

  // ─── State ───────────────────────────────────────────────────────────────────
  var _active = false;
  var _scene, _camera, _renderer, _clock;
  var _keys = {};
  var _keyTimes = {};
  var _animId = null;
  var _container = null;

  // Game state
  var _coreTemp = 400;
  var _meltdownTime = 360; // 6 minutes in seconds
  var _elapsed = 0;
  var _scramTriggered = false;
  var _gameOver = false;
  var _gameWon = false;
  var _playerPos = { x: 0, y: 1, z: 20 };
  var _playerVel = { x: 0, y: 0, z: 0 };
  var _playerHealth = 100;
  var _radSuitOn = false;
  var _radSuitTime = 0;
  var _radSuitDegraded = false;
  var _alarmActive = false;
  var _alarmTimer = 0;
  var _repairKits = 3;
  var _interactCooldown = 0;
  var _hudEl = null;
  var _msgEl = null;
  var _msgTimer = 0;
  var _overlayEl = null;
  var _gameOverEl = null;

  // Control rods
  var _controlRods = [];
  var _rodInserted = [false, false, false, false];
  var _rodInsertProgress = [0, 0, 0, 0];
  var _rodHolding = -1;

  // Main console / SCRAM
  var _consoleObj = null;
  var _consoleActive = false;
  var _scramSequence = [2, 4, 1, 3];
  var _scramInput = [];
  var _scramSuccess = false;

  // Bombs / saboteurs
  var _bombs = [];
  var _saboteurs = [];
  var _bombDefused = [false, false, false];
  var _bombDefuseProgress = [0, 0, 0];
  var _bombHolding = -1;

  // Radiation zones
  var _radZones = [];
  var _radZoneSizes = [2, 2, 2];

  // Coolant pumps
  var _pumps = [];
  var _pumpRepaired = [false, false];
  var _pumpRepairProgress = [0, 0];
  var _pumpHolding = -1;

  // Breaker boxes
  var _breakers = [];
  var _breakerOff = [false, false, false];
  var _breakerOffTime = [0, 0, 0];
  var _emergencyScramCheck = false;

  // Security guards
  var _guards = [];
  var _guardState = []; // 'patrol', 'hostile'
  var _guardTarget = [];
  var _guardPatrolT = [];

  // Cameras
  var _cameras = [];
  var _cameraDisabled = [false, false, false, false];

  // Reactor glow
  var _reactorLight = null;
  var _reactorObj = null;

  // Suit overlay mesh
  var _suitOverlay = null;

  // Repair kit objects
  var _repairKitObjs = [];
  var _repairKitCollected = [false, false, false];

  // ─── Key binding ─────────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    var k = e.key.toLowerCase();
    if (!_keyTimes[k]) _keyTimes[k] = Date.now();
    _keys[k] = true;

    if (!_active) return;

    // SCRAM console input
    if (_consoleActive && !_scramSuccess) {
      if (k === '1') _scramInputKey(1);
      else if (k === '2') _scramInputKey(2);
      else if (k === '3') _scramInputKey(3);
      else if (k === '4') _scramInputKey(4);
      else if (k === 'escape') { _consoleActive = false; _showMsg('Console closed'); }
    }

    if (k === 'p') {
      _radSuitOn = !_radSuitOn;
      if (_radSuitOn) {
        _radSuitTime = 0;
        _radSuitDegraded = false;
        _showMsg('Radiation suit ON');
      } else {
        _showMsg('Radiation suit OFF');
      }
      _updateSuitOverlay();
    }
  }

  function _onKeyUp(e) {
    var k = e.key.toLowerCase();
    _keys[k] = false;
    _keyTimes[k] = 0;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  function _showMsg(txt) {
    if (!_msgEl) return;
    _msgEl.textContent = txt;
    _msgTimer = 3;
  }

  function _dist2D(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _dist3D(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _clamp(v, mn, mx) {
    return v < mn ? mn : v > mx ? mx : v;
  }

  // ─── Scene construction ───────────────────────────────────────────────────────
  function _buildScene() {
    // Ambient + hemisphere
    var amb = new THREE.AmbientLight(0x334433, 0.6);
    _scene.add(amb);

    var hemi = new THREE.HemisphereLight(0x224422, 0x111111, 0.4);
    _scene.add(hemi);

    // Floor
    var floorGeo = new THREE.BoxGeometry(80, 0.5, 80);
    var floorMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, -0.25, 0);
    _scene.add(floor);

    _buildReactor();
    _buildControlRoom();
    _buildControlRods();
    _buildBombs();
    _buildSaboteurs();
    _buildRadZones();
    _buildCoolantPumps();
    _buildBreakers();
    _buildGuards();
    _buildCameras();
    _buildRepairKits();
    _buildWalls();
    _buildSuitOverlay();
  }

  function _buildWalls() {
    var mat = new THREE.MeshLambertMaterial({ color: 0x334433 });
    var positions = [
      [0, 3, -40, 80, 6, 1],
      [0, 3, 40, 80, 6, 1],
      [-40, 3, 0, 1, 6, 80],
      [40, 3, 0, 1, 6, 80]
    ];
    for (var i = 0; i < positions.length; i++) {
      var p = positions[i];
      var geo = new THREE.BoxGeometry(p[3], p[4], p[5]);
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(p[0], p[1], p[2]);
      _scene.add(mesh);
    }
  }

  function _buildReactor() {
    // Cooling tower
    var geo = new THREE.CylinderGeometry(5, 5, 10, 16);
    var mat = new THREE.MeshLambertMaterial({ color: 0x778866 });
    _reactorObj = new THREE.Mesh(geo, mat);
    _reactorObj.position.set(0, 5, 0);
    _scene.add(_reactorObj);

    // Top cap cone
    var coneGeo = new THREE.ConeGeometry(5, 3, 16);
    var coneMat = new THREE.MeshLambertMaterial({ color: 0x556655 });
    var cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(0, 11.5, 0);
    _scene.add(cone);

    // Reactor glow light
    _reactorLight = new THREE.PointLight(0x00FF00, 2, 20);
    _reactorLight.position.set(0, 1, 0);
    _scene.add(_reactorLight);
  }

  function _buildControlRoom() {
    // Control room walls
    var roomMat = new THREE.MeshLambertMaterial({ color: 0x1a2a1a, wireframe: false });
    var roomGeo = new THREE.BoxGeometry(15, 5, 10);
    var room = new THREE.Mesh(roomGeo, roomMat);
    room.position.set(20, 2.5, 20);
    _scene.add(room);

    // Control panel
    var panelGeo = new THREE.BoxGeometry(4, 2, 1);
    var panelMat = new THREE.MeshLambertMaterial({ color: 0x223322 });
    _consoleObj = new THREE.Mesh(panelGeo, panelMat);
    _consoleObj.position.set(20, 2, 16);
    _scene.add(_consoleObj);

    // Panel indicator lights
    for (var i = 0; i < 4; i++) {
      var lightGeo = new THREE.BoxGeometry(0.3, 0.3, 0.2);
      var lightMat = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
      var light = new THREE.Mesh(lightGeo, lightMat);
      light.position.set(20 - 1.5 + i * 1, 2.7, 15.6);
      _scene.add(light);
    }

    // Spotlights for control room
    var spot = new THREE.PointLight(0x334433, 1, 15);
    spot.position.set(20, 5, 20);
    _scene.add(spot);
  }

  function _buildControlRods() {
    var positions = [
      [-2, 0, -2],
      [2, 0, -2],
      [-2, 0, 2],
      [2, 0, 2]
    ];
    for (var i = 0; i < 4; i++) {
      var group = {};

      // Rod itself
      var rodGeo = new THREE.CylinderGeometry(0.4, 0.4, 6, 8);
      var rodMat = new THREE.MeshLambertMaterial({ color: 0x8899AA });
      var rod = new THREE.Mesh(rodGeo, rodMat);
      rod.position.set(positions[i][0], 8, positions[i][2]);
      _scene.add(rod);
      group.rod = rod;

      // Mechanism panel (E to interact)
      var panGeo = new THREE.BoxGeometry(1.2, 0.8, 0.6);
      var panMat = new THREE.MeshLambertMaterial({ color: 0x445544 });
      var panel = new THREE.Mesh(panGeo, panMat);
      panel.position.set(positions[i][0] + 1.5, 5, positions[i][2]);
      _scene.add(panel);
      group.panel = panel;
      group.panelPos = { x: positions[i][0] + 1.5, y: 5, z: positions[i][2] };

      _controlRods.push(group);
    }
  }

  function _buildBombs() {
    var positions = [
      [18, 1.5, 22],
      [22, 1.5, 18],
      [-10, 1.5, 15]
    ];
    for (var i = 0; i < 3; i++) {
      var geo = new THREE.BoxGeometry(0.6, 0.4, 0.4);
      var mat = new THREE.MeshLambertMaterial({ color: 0xFF4400 });
      var bomb = new THREE.Mesh(geo, mat);
      bomb.position.set(positions[i][0], positions[i][1], positions[i][2]);
      _scene.add(bomb);
      _bombs.push({ mesh: bomb, pos: { x: positions[i][0], y: positions[i][1], z: positions[i][2] }, blink: 0 });
    }
  }

  function _buildSaboteurs() {
    var positions = [[-8, 1, 5], [8, 1, -8], [0, 1, 15]];
    for (var i = 0; i < 3; i++) {
      var bodyGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.8, 8);
      var bodyMat = new THREE.MeshLambertMaterial({ color: 0x2A2A2A });
      var body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(positions[i][0], positions[i][1], positions[i][2]);
      _scene.add(body);

      var headGeo = new THREE.SphereGeometry(0.35, 8, 8);
      var head = new THREE.Mesh(headGeo, bodyMat);
      head.position.set(positions[i][0], positions[i][1] + 1.1, positions[i][2]);
      _scene.add(head);

      _saboteurs.push({
        body: body,
        head: head,
        pos: { x: positions[i][0], y: positions[i][1], z: positions[i][2] },
        alive: true,
        patrol: 0
      });
    }
  }

  function _buildRadZones() {
    var positions = [
      [-5, 0.1, 8],
      [5, 0.1, -5],
      [-3, 0.1, -12]
    ];
    for (var i = 0; i < 3; i++) {
      var geo = new THREE.BoxGeometry(_radZoneSizes[i] * 2, 0.2, _radZoneSizes[i] * 2);
      var mat = new THREE.MeshLambertMaterial({ color: 0x33FF33, transparent: true, opacity: 0.3 });
      var zone = new THREE.Mesh(geo, mat);
      zone.position.set(positions[i][0], positions[i][1], positions[i][2]);
      _scene.add(zone);
      _radZones.push({ mesh: zone, pos: { x: positions[i][0], z: positions[i][2] }, size: _radZoneSizes[i] });
    }
  }

  function _buildCoolantPumps() {
    var positions = [[-8, 1, -5], [8, 1, 5]];
    for (var i = 0; i < 2; i++) {
      var geo = new THREE.CylinderGeometry(0.8, 0.8, 2, 10);
      var mat = new THREE.MeshLambertMaterial({ color: 0x334455 });
      var pump = new THREE.Mesh(geo, mat);
      pump.position.set(positions[i][0], positions[i][1], positions[i][2]);
      _scene.add(pump);

      // Broken pipe as LineSegments
      var pipePoints = [];
      pipePoints.push(new THREE.Vector3(positions[i][0], 2, positions[i][2]));
      pipePoints.push(new THREE.Vector3(positions[i][0] + 0.5, 2.5, positions[i][2]));
      pipePoints.push(new THREE.Vector3(positions[i][0] + 1.5, 2.3, positions[i][2]));
      pipePoints.push(new THREE.Vector3(positions[i][0] + 2.5, 2, positions[i][2]));
      var pipeBuf = new THREE.BufferGeometry().setFromPoints(pipePoints);
      var pipeMat = new THREE.LineBasicMaterial({ color: 0xFF2200 });
      var pipe = new THREE.LineSegments(pipeBuf, pipeMat);
      _scene.add(pipe);

      _pumps.push({
        mesh: pump,
        pipe: pipe,
        pos: { x: positions[i][0], y: positions[i][1], z: positions[i][2] }
      });
    }
  }

  function _buildBreakers() {
    var positions = [
      [-15, 2, 10],
      [15, 2, -15],
      [-15, 2, -15]
    ];
    for (var i = 0; i < 3; i++) {
      var geo = new THREE.BoxGeometry(0.8, 1.2, 0.4);
      var mat = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
      var box = new THREE.Mesh(geo, mat);
      box.position.set(positions[i][0], positions[i][1], positions[i][2]);
      _scene.add(box);
      _breakers.push({ mesh: box, pos: { x: positions[i][0], y: positions[i][1], z: positions[i][2] }, mat: mat });
    }
  }

  function _buildGuards() {
    var positions = [
      [10, 1, 10], [-10, 1, 10], [10, 1, -10], [-10, 1, -10],
      [0, 1, 25], [25, 1, 0], [0, 1, -25], [-25, 1, 0]
    ];
    for (var i = 0; i < 8; i++) {
      var bodyGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.8, 8);
      var bodyMat = new THREE.MeshLambertMaterial({ color: 0x886644 });
      var body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(positions[i][0], positions[i][1], positions[i][2]);
      _scene.add(body);

      var headGeo = new THREE.SphereGeometry(0.35, 8, 8);
      var headMat = new THREE.MeshLambertMaterial({ color: 0xBB9977 });
      var head = new THREE.Mesh(headGeo, headMat);
      head.position.set(positions[i][0], positions[i][1] + 1.1, positions[i][2]);
      _scene.add(head);

      _guards.push({
        body: body,
        head: head,
        pos: { x: positions[i][0], y: positions[i][1], z: positions[i][2] }
      });
      _guardState.push('patrol');
      _guardTarget.push({ x: positions[i][0], z: positions[i][2] });
      _guardPatrolT.push(Math.random() * Math.PI * 2);
    }
  }

  function _buildCameras() {
    var positions = [
      [20, 4, 25],
      [15, 4, 15],
      [-15, 4, -15],
      [0, 4, -30]
    ];
    for (var i = 0; i < 4; i++) {
      var geo = new THREE.BoxGeometry(0.4, 0.3, 0.6);
      var mat = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var cam = new THREE.Mesh(geo, mat);
      cam.position.set(positions[i][0], positions[i][1], positions[i][2]);
      _scene.add(cam);

      // Camera cone/indicator
      var indGeo = new THREE.ConeGeometry(0.5, 1.5, 6);
      var indMat = new THREE.MeshLambertMaterial({ color: 0xFF3300, transparent: true, opacity: 0.4 });
      var ind = new THREE.Mesh(indGeo, indMat);
      ind.rotation.x = Math.PI / 2;
      ind.position.set(positions[i][0], positions[i][1] - 0.3, positions[i][2] + 1);
      _scene.add(ind);

      _cameras.push({
        mesh: cam,
        indicator: ind,
        pos: { x: positions[i][0], y: positions[i][1], z: positions[i][2] },
        indMat: indMat,
        rotT: 0
      });
    }
  }

  function _buildRepairKits() {
    var positions = [[12, 0.5, 5], [-12, 0.5, 5], [0, 0.5, -20]];
    for (var i = 0; i < 3; i++) {
      var geo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
      var mat = new THREE.MeshLambertMaterial({ color: 0x4499FF });
      var kit = new THREE.Mesh(geo, mat);
      kit.position.set(positions[i][0], positions[i][1], positions[i][2]);
      _scene.add(kit);
      _repairKitObjs.push({ mesh: kit, pos: { x: positions[i][0], y: positions[i][1], z: positions[i][2] } });
    }
  }

  function _buildSuitOverlay() {
    var geo = new THREE.BoxGeometry(1.2, 2.2, 0.6);
    var mat = new THREE.MeshLambertMaterial({ color: 0x88FFAA, transparent: true, opacity: 0.4 });
    _suitOverlay = new THREE.Mesh(geo, mat);
    _suitOverlay.visible = false;
    _scene.add(_suitOverlay);
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────────
  function _buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'ns-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,20,0,0.85)',
      'color:#00FF44',
      'font-family:monospace',
      'font-size:13px',
      'padding:8px 14px',
      'border:1px solid #00FF44',
      'border-radius:4px',
      'z-index:1000',
      'white-space:nowrap',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(_hudEl);

    _msgEl = document.createElement('div');
    _msgEl.id = 'ns-msg';
    _msgEl.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,20,0,0.8)',
      'color:#AAFFAA',
      'font-family:monospace',
      'font-size:14px',
      'padding:6px 12px',
      'border:1px solid #00FF44',
      'border-radius:3px',
      'z-index:1001',
      'pointer-events:none',
      'min-width:200px',
      'text-align:center'
    ].join(';');
    document.body.appendChild(_msgEl);

    _overlayEl = document.createElement('div');
    _overlayEl.id = 'ns-overlay';
    _overlayEl.style.cssText = [
      'position:fixed',
      'bottom:10px',
      'right:10px',
      'background:rgba(0,10,0,0.75)',
      'color:#88FF88',
      'font-family:monospace',
      'font-size:11px',
      'padding:6px 10px',
      'border:1px solid #336633',
      'border-radius:3px',
      'z-index:1000',
      'pointer-events:none'
    ].join(';');
    _overlayEl.innerHTML = [
      'WASD: Move | E: Interact | P: Rad Suit',
      '<br>1-4: SCRAM Sequence | ESC: Close Console'
    ].join('');
    document.body.appendChild(_overlayEl);

    _gameOverEl = document.createElement('div');
    _gameOverEl.id = 'ns-gameover';
    _gameOverEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.92)',
      'color:#FF4444',
      'font-family:monospace',
      'font-size:28px',
      'padding:30px 50px',
      'border:2px solid #FF4444',
      'border-radius:8px',
      'z-index:2000',
      'text-align:center',
      'display:none',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(_gameOverEl);
  }

  function _updateHUD(dt) {
    if (!_hudEl || !_active) return;

    if (_msgTimer > 0) {
      _msgTimer -= dt;
      if (_msgTimer <= 0) _msgEl.textContent = '';
    }

    var rods = 0;
    for (var i = 0; i < 4; i++) if (_rodInserted[i]) rods++;

    var mins = Math.floor(_meltdownTime / 60);
    var secs = Math.floor(_meltdownTime % 60);
    var timeStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
    var temp = Math.round(_coreTemp);
    var suit = _radSuitOn ? (_radSuitDegraded ? 'CRACKED' : 'ON') : 'OFF';
    var scram = _scramSuccess || _emergencyScramCheck ? 'YES' : 'NO';

    _hudEl.textContent = 'NUCLEAR [CORE: ' + temp + '°C] [RODS: ' + rods + '/4] [SCRAM: ' + scram + '] [RAD SUIT: ' + suit + '] | MELTDOWN: ' + timeStr;

    if (_coreTemp > 1000) {
      _hudEl.style.color = '#FF4400';
      _hudEl.style.borderColor = '#FF4400';
    } else if (_coreTemp > 700) {
      _hudEl.style.color = '#FFAA00';
      _hudEl.style.borderColor = '#FFAA00';
    } else {
      _hudEl.style.color = '#00FF44';
      _hudEl.style.borderColor = '#00FF44';
    }

    // Update reactor light color
    if (_reactorLight) {
      if (_coreTemp > 1000) {
        _reactorLight.color.setHex(0xFF2200);
        _reactorLight.intensity = 3;
      } else if (_coreTemp > 700) {
        _reactorLight.color.setHex(0xFF8800);
        _reactorLight.intensity = 2.5;
      } else {
        _reactorLight.color.setHex(0x00FF00);
        _reactorLight.intensity = 2;
      }
    }

    // Game over
    if (_gameOver && _gameOverEl) {
      _gameOverEl.style.display = 'block';
      _gameOverEl.style.color = '#FF4444';
      _gameOverEl.style.borderColor = '#FF4444';
      _gameOverEl.innerHTML = 'MELTDOWN<br><span style="font-size:14px">The reactor has gone critical.<br>R to restart</span>';
    } else if (_gameWon && _gameOverEl) {
      _gameOverEl.style.display = 'block';
      _gameOverEl.style.color = '#00FF44';
      _gameOverEl.style.borderColor = '#00FF44';
      _gameOverEl.innerHTML = 'SHUTDOWN COMPLETE<br><span style="font-size:14px">The reactor has been safely shut down.<br>R to restart</span>';
    }
  }

  // ─── Update helpers ───────────────────────────────────────────────────────────
  function _updateSuitOverlay() {
    if (!_suitOverlay) return;
    _suitOverlay.visible = _radSuitOn;
  }

  function _scramInputKey(n) {
    _scramInput.push(n);
    _showMsg('Sequence: ' + _scramInput.join('-'));
    if (_scramInput.length === 4) {
      var ok = true;
      for (var i = 0; i < 4; i++) {
        if (_scramInput[i] !== _scramSequence[i]) { ok = false; break; }
      }
      if (ok) {
        _scramSuccess = true;
        _consoleActive = false;
        _showMsg('SCRAM INITIATED! Reactor shutting down...');
        _triggerScram();
      } else {
        _showMsg('Wrong sequence! Try again.');
        _scramInput = [];
      }
    }
  }

  function _triggerScram() {
    _scramTriggered = true;
    // Rapidly cool the reactor
    _coreTemp = Math.max(200, _coreTemp - 300);
    _gameWon = true;
  }

  function _checkEmergencyScram() {
    var allOff = _breakerOff[0] && _breakerOff[1] && _breakerOff[2];
    if (!allOff) return;
    // Check if all switched within 30 seconds of each other
    var times = [_breakerOffTime[0], _breakerOffTime[1], _breakerOffTime[2]];
    var mn = times[0], mx = times[0];
    for (var i = 1; i < 3; i++) {
      if (times[i] < mn) mn = times[i];
      if (times[i] > mx) mx = times[i];
    }
    if (mx - mn <= 30) {
      _emergencyScramCheck = true;
      _showMsg('EMERGENCY SCRAM! All breakers off!');
      _triggerScram();
    }
  }

  function _updatePlayer(dt) {
    if (_gameOver || _gameWon || _consoleActive) return;

    var speed = _radSuitOn ? 4 : 6;
    var moved = false;

    if (_keys['w'] || _keys['arrowup']) {
      _playerPos.z -= speed * dt;
      moved = true;
    }
    if (_keys['s'] || _keys['arrowdown']) {
      _playerPos.z += speed * dt;
      moved = true;
    }
    if (_keys['a'] || _keys['arrowleft']) {
      _playerPos.x -= speed * dt;
      moved = true;
    }
    if (_keys['d'] || _keys['arrowright']) {
      _playerPos.x += speed * dt;
      moved = true;
    }

    _playerPos.x = _clamp(_playerPos.x, -38, 38);
    _playerPos.z = _clamp(_playerPos.z, -38, 38);

    // Camera follows player
    if (_camera) {
      _camera.position.set(_playerPos.x, _playerPos.y + 10, _playerPos.z + 14);
      _camera.lookAt(_playerPos.x, _playerPos.y, _playerPos.z);
    }

    // Suit overlay follows player
    if (_suitOverlay && _radSuitOn) {
      _suitOverlay.position.set(_playerPos.x, _playerPos.y + 0.5, _playerPos.z);
    }

    // E key interactions
    if (_keys['e'] && _interactCooldown <= 0) {
      _handleInteract(dt);
    }

    if (!_keys['e']) {
      _rodHolding = -1;
      _bombHolding = -1;
      _pumpHolding = -1;
    }
  }

  function _handleInteract(dt) {
    var pp = _playerPos;

    // Repair kits
    for (var k = 0; k < 3; k++) {
      if (!_repairKitCollected[k]) {
        var rk = _repairKitObjs[k];
        if (_dist3D(pp, rk.pos) < 2.5) {
          _repairKitCollected[k] = true;
          rk.mesh.visible = false;
          _repairKits++;
          _showMsg('Repair kit collected! (' + _repairKits + ' total)');
          _interactCooldown = 0.5;
          return;
        }
      }
    }

    // Control rod panels
    for (var i = 0; i < 4; i++) {
      if (!_rodInserted[i]) {
        var rod = _controlRods[i];
        if (_dist3D(pp, rod.panelPos) < 3) {
          if (_rodHolding !== i) {
            _rodHolding = i;
            _rodInsertProgress[i] = 0;
          }
          _rodInsertProgress[i] += dt;
          _showMsg('Inserting rod ' + (i + 1) + '... ' + Math.round(_rodInsertProgress[i] / 5 * 100) + '%');
          if (_rodInsertProgress[i] >= 5) {
            _rodInserted[i] = true;
            rod.rod.position.y = 5; // lower rod
            _showMsg('Control rod ' + (i + 1) + ' inserted!');
          }
          return;
        }
      }
    }

    // Main console
    if (_consoleObj && _dist3D(pp, { x: 20, y: 2, z: 16 }) < 4) {
      _consoleActive = true;
      _showMsg('Console: Press 1-4 in order: ' + _scramSequence.join('-'));
      _interactCooldown = 0.5;
      return;
    }

    // Bomb defusal
    for (var b = 0; b < 3; b++) {
      if (!_bombDefused[b]) {
        var bomb = _bombs[b];
        if (_dist3D(pp, bomb.pos) < 2.5) {
          if (_bombHolding !== b) {
            _bombHolding = b;
            _bombDefuseProgress[b] = 0;
          }
          _bombDefuseProgress[b] += dt;
          _showMsg('Defusing bomb ' + (b + 1) + '... ' + Math.round(_bombDefuseProgress[b] / 5 * 100) + '%');
          if (_bombDefuseProgress[b] >= 5) {
            _bombDefused[b] = true;
            bomb.mesh.visible = false;
            _showMsg('Bomb ' + (b + 1) + ' defused!');
          }
          return;
        }
      }
    }

    // Coolant pump repair
    for (var p = 0; p < 2; p++) {
      if (!_pumpRepaired[p]) {
        var pump = _pumps[p];
        if (_dist3D(pp, pump.pos) < 3) {
          if (_repairKits <= 0) {
            _showMsg('Need repair kits! (' + _repairKits + ' remaining)');
            _interactCooldown = 1;
            return;
          }
          if (_pumpHolding !== p) {
            _pumpHolding = p;
            _pumpRepairProgress[p] = 0;
          }
          _pumpRepairProgress[p] += dt;
          _showMsg('Repairing pump ' + (p + 1) + '... ' + Math.round(_pumpRepairProgress[p] / 3 * 100) + '%');
          if (_pumpRepairProgress[p] >= 3) {
            _pumpRepaired[p] = true;
            _repairKits--;
            pump.pipe.material.color.setHex(0x00FF00);
            _showMsg('Pump ' + (p + 1) + ' repaired! Kits: ' + _repairKits);
          }
          return;
        }
      }
    }

    // Breaker boxes
    for (var br = 0; br < 3; br++) {
      if (!_breakerOff[br]) {
        var brk = _breakers[br];
        if (_dist3D(pp, brk.pos) < 3) {
          _breakerOff[br] = true;
          _breakerOffTime[br] = _elapsed;
          brk.mat.color.setHex(0x444444);
          _showMsg('Breaker ' + (br + 1) + ' switched OFF!');
          _interactCooldown = 0.5;
          _checkEmergencyScram();
          return;
        }
      }
    }
  }

  function _updateCoreTemp(dt) {
    if (_gameOver || _gameWon || _scramTriggered) return;

    // Base temperature rise toward 1200 over 6 minutes
    var ratePerSec = (1200 - 400) / 360;

    // Each inserted rod reduces by 15%/min
    var rods = 0;
    for (var i = 0; i < 4; i++) if (_rodInserted[i]) rods++;
    var rodReduction = rods * 0.15 * _coreTemp / 60;

    // Repaired pumps reduce temp
    var pumpsRepaired = 0;
    for (var p = 0; p < 2; p++) if (_pumpRepaired[p]) pumpsRepaired++;
    var pumpReduction = pumpsRepaired * 5; // 5°/s per pump

    _coreTemp += (ratePerSec - rodReduction - pumpReduction) * dt;
    _coreTemp = _clamp(_coreTemp, 200, 1200);

    // Countdown
    _meltdownTime -= dt;
    if (_meltdownTime <= 0 || _coreTemp >= 1200) {
      _gameOver = true;
      _meltdownTime = 0;
    }

    // Expand radiation zones as temp rises
    var tempFactor = (_coreTemp - 400) / 800;
    for (var z = 0; z < 3; z++) {
      var newSize = 2 + tempFactor * 4;
      _radZoneSizes[z] = newSize;
      if (_radZones[z]) {
        _radZones[z].mesh.scale.set(newSize / 2, 1, newSize / 2);
        _radZones[z].size = newSize;
      }
    }
  }

  function _updateRadiation(dt) {
    var inZone = false;
    for (var i = 0; i < 3; i++) {
      var rz = _radZones[i];
      if (Math.abs(_playerPos.x - rz.pos.x) < rz.size && Math.abs(_playerPos.z - rz.pos.z) < rz.size) {
        inZone = true;
        break;
      }
    }

    if (inZone) {
      if (!_radSuitOn || _radSuitDegraded) {
        _playerHealth -= 5 * dt;
      }
    }

    // High temp radiation damage
    if (_coreTemp > 900) {
      if (!_radSuitOn || _radSuitDegraded) {
        _playerHealth -= 10 * dt;
      }
    } else if (_coreTemp > 1000) {
      if (!_radSuitOn || _radSuitDegraded) {
        _playerHealth -= 15 * dt;
      }
    }

    // Suit degradation after 3 minutes
    if (_radSuitOn) {
      _radSuitTime += dt;
      if (_radSuitTime > 180 && !_radSuitDegraded) {
        _radSuitDegraded = true;
        _showMsg('WARNING: Radiation suit cracking!');
        if (_suitOverlay) {
          _suitOverlay.material.color.setHex(0xAA6633);
          _suitOverlay.material.opacity = 0.6;
        }
      }
    }

    _playerHealth = _clamp(_playerHealth, 0, 100);
    if (_playerHealth <= 0 && !_gameOver) {
      _gameOver = true;
      _showMsg('You died from radiation exposure!');
    }
  }

  function _updateGuards(dt) {
    var pp = _playerPos;

    for (var i = 0; i < 8; i++) {
      var g = _guards[i];
      if (!g) continue;

      _guardPatrolT[i] += dt * 0.5;

      if (_guardState[i] === 'hostile' || _alarmActive) {
        _guardState[i] = 'hostile';
        // Move toward player
        var dx = pp.x - g.pos.x;
        var dz = pp.z - g.pos.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 1.5) {
          var spd = 3;
          g.pos.x += (dx / dist) * spd * dt;
          g.pos.z += (dz / dist) * spd * dt;
        } else {
          // Attack player
          _playerHealth -= 15 * dt;
        }
      } else {
        // Patrol in figure-eight
        var r = 5;
        g.pos.x = _guards[i].pos.x + Math.sin(_guardPatrolT[i]) * r * dt;
        g.pos.z = _guards[i].pos.z + Math.cos(_guardPatrolT[i] * 0.7) * r * dt;

        // Detect player
        var dist2 = _dist2D(pp.x, pp.z, g.pos.x, g.pos.z);
        if (dist2 < 5) {
          _guardState[i] = 'hostile';
          _triggerAlarm();
        }
      }

      g.body.position.set(g.pos.x, g.pos.y, g.pos.z);
      g.head.position.set(g.pos.x, g.pos.y + 1.1, g.pos.z);
    }
  }

  function _triggerAlarm() {
    if (!_alarmActive) {
      _alarmActive = true;
      _alarmTimer = 30;
      _showMsg('ALARM TRIGGERED! Guards alerted!');
      // Make all guards hostile
      for (var i = 0; i < 8; i++) _guardState[i] = 'hostile';
    }
  }

  function _updateAlarm(dt) {
    if (_alarmActive) {
      _alarmTimer -= dt;
      if (_alarmTimer <= 0) {
        _alarmActive = false;
        // Guards return to patrol if player far enough
        for (var i = 0; i < 8; i++) {
          if (_dist2D(_playerPos.x, _playerPos.z, _guards[i].pos.x, _guards[i].pos.z) > 10) {
            _guardState[i] = 'patrol';
          }
        }
      }
    }
  }

  function _updateCameras(dt) {
    var pp = _playerPos;

    for (var i = 0; i < 4; i++) {
      if (_cameraDisabled[i]) continue;
      var cam = _cameras[i];
      cam.rotT += dt * 0.4;

      // Sweep indicator
      if (cam.indicator) {
        cam.indicator.rotation.y = Math.sin(cam.rotT) * 0.8;
      }

      // Detection cone check
      var distToCam = _dist3D(pp, cam.pos);
      if (distToCam < 8) {
        // Simple detection: if player within range
        _triggerAlarm();
        _showMsg('Camera detected you!');
        _cameraDisabled[i] = true;
        if (cam.indMat) cam.indMat.color.setHex(0x444444);
      }
    }
  }

  function _updateBombs(dt) {
    for (var i = 0; i < 3; i++) {
      if (!_bombDefused[i]) {
        var bomb = _bombs[i];
        bomb.blink += dt * 3;
        if (bomb.mesh) {
          bomb.mesh.material.color.setHex(bomb.blink % 1 < 0.5 ? 0xFF4400 : 0xFF8800);
        }
        // Bombs increase meltdown speed
        _coreTemp += 2 * dt;
      }
    }
  }

  function _updateSaboteurs(dt) {
    for (var i = 0; i < 3; i++) {
      var sab = _saboteurs[i];
      if (!sab || !sab.alive) continue;

      // Simple wandering
      sab.patrol += dt * 0.3;
      var ox = Math.sin(sab.patrol + i) * 2;
      var oz = Math.cos(sab.patrol * 0.8 + i) * 2;

      var baseX = [- 8, 8, 0][i];
      var baseZ = [5, -8, 15][i];
      sab.pos.x = baseX + ox;
      sab.pos.z = baseZ + oz;

      sab.body.position.set(sab.pos.x, sab.pos.y, sab.pos.z);
      sab.head.position.set(sab.pos.x, sab.pos.y + 1.1, sab.pos.z);
    }
  }

  // ─── Main loop ───────────────────────────────────────────────────────────────
  function update(dt) {
    if (!_active) return;
    if (!dt) dt = 0.016;

    _elapsed += dt;

    if (!_gameOver && !_gameWon) {
      _updatePlayer(dt);
      _updateCoreTemp(dt);
      _updateRadiation(dt);
      _updateGuards(dt);
      _updateAlarm(dt);
      _updateCameras(dt);
      _updateBombs(dt);
      _updateSaboteurs(dt);
    }

    _updateHUD(dt);

    // Restart
    if (_keys['r'] && (_gameOver || _gameWon)) {
      reset();
      init(_container, _renderer);
    }

    if (_renderer && _scene && _camera) {
      _renderer.render(_scene, _camera);
    }
  }

  // ─── Init / Reset ─────────────────────────────────────────────────────────────
  function init(container, renderer) {
    _container = container || document.body;
    _renderer = renderer;

    // Reset all state
    _active = false;
    _keys = {};
    _keyTimes = {};
    _controlRods = [];
    _rodInserted = [false, false, false, false];
    _rodInsertProgress = [0, 0, 0, 0];
    _rodHolding = -1;
    _bombs = [];
    _bombDefused = [false, false, false];
    _bombDefuseProgress = [0, 0, 0];
    _bombHolding = -1;
    _saboteurs = [];
    _radZones = [];
    _radZoneSizes = [2, 2, 2];
    _pumps = [];
    _pumpRepaired = [false, false];
    _pumpRepairProgress = [0, 0];
    _pumpHolding = -1;
    _breakers = [];
    _breakerOff = [false, false, false];
    _breakerOffTime = [0, 0, 0];
    _guards = [];
    _guardState = [];
    _guardTarget = [];
    _guardPatrolT = [];
    _cameras = [];
    _cameraDisabled = [false, false, false, false];
    _repairKitObjs = [];
    _repairKitCollected = [false, false, false];
    _coreTemp = 400;
    _meltdownTime = 360;
    _elapsed = 0;
    _scramTriggered = false;
    _gameOver = false;
    _gameWon = false;
    _playerPos = { x: 0, y: 1, z: 20 };
    _playerVel = { x: 0, y: 0, z: 0 };
    _playerHealth = 100;
    _radSuitOn = false;
    _radSuitTime = 0;
    _radSuitDegraded = false;
    _alarmActive = false;
    _alarmTimer = 0;
    _repairKits = 3;
    _interactCooldown = 0;
    _consoleActive = false;
    _scramInput = [];
    _scramSuccess = false;
    _emergencyScramCheck = false;
    _reactorLight = null;
    _reactorObj = null;
    _suitOverlay = null;
    _consoleObj = null;

    // Scene
    _scene = new THREE.Scene();
    _scene.background = new THREE.Color(0x0a120a);
    _scene.fog = new THREE.Fog(0x0a120a, 30, 80);

    // Camera
    var w = _container.clientWidth || window.innerWidth;
    var h = _container.clientHeight || window.innerHeight;
    _camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 200);
    _camera.position.set(0, 11, 34);
    _camera.lookAt(0, 0, 0);

    if (_renderer) {
      _renderer.setSize(w, h);
      _renderer.shadowMap && (_renderer.shadowMap.enabled = false);
    }

    _buildScene();
    _buildHUD();

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup', _onKeyUp);

    _active = true;
    _showMsg('NUCLEAR SHUTDOWN: Prevent meltdown! E=Interact P=Suit 1-4=SCRAM');
  }

  function reset() {
    _active = false;

    if (_animId) {
      cancelAnimationFrame(_animId);
      _animId = null;
    }

    document.removeEventListener('keydown', _onKeyDown);
    document.removeEventListener('keyup', _onKeyUp);

    // Remove HUD elements
    var ids = ['ns-hud', 'ns-msg', 'ns-overlay', 'ns-gameover'];
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
    _hudEl = null;
    _msgEl = null;
    _overlayEl = null;
    _gameOverEl = null;

    // Dispose scene objects
    if (_scene) {
      _scene.traverse(function(obj) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(function(m) { m.dispose(); });
          } else {
            obj.material.dispose();
          }
        }
      });
      while (_scene.children.length > 0) {
        _scene.remove(_scene.children[0]);
      }
    }
    _scene = null;
    _camera = null;
    _keys = {};
    _keyTimes = {};
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
})();
