// ============================================================
//  mortar-calculator.js — Realistic mortar ballistics, grid fire missions,
//  indirect fire mechanics for Three.js FPS game
//  Public API: window.MortarCalculator = { init, update, reset }
// ============================================================
window.MortarCalculator = (function () {
  'use strict';

  // ── Internal state ─────────────────────────────────────────
  var _scene = null;
  var _camera = null;
  var _renderer = null;
  var _playerPosition = null;   // reference to player pos vector

  // Mortar tube model group
  var _tubeGroup = null;
  var _tubeDeployed = false;
  var _tubePosition = new THREE.Vector3();

  // Keyboard state
  var _keys = {};
  var _mKeyHeld = false;
  var _shiftMPressed = false;
  var _leftClickDown = false;

  // Rounds
  var _roundsTotal = 12;
  var ROUND_TYPES = ['HE', 'ILLUM', 'WP', 'SMOKE'];
  var _currentRoundIndex = 0;

  // Fire mission
  var _fireMissionOpen = false;
  var _targetGrid = { x: 0, z: 0 };          // world coords derived from grid
  var _targetGridDisplay = '000 / 000';       // "247 / 315"
  var _calculatedElevation = 0;
  var _calculatedAzimuth = 0;
  var _calculatedCharge = 1;
  var _dangerCloseConfirm = 0;                // 0=none, 1=first Enter, 2=confirmed
  var _dangerCloseWarning = false;

  // FFE (fire for effect) state
  var _ffeActive = false;
  var _ffeRoundsLeft = 0;
  var _ffeTimer = 0;

  // Active projectiles
  var _projectiles = [];
  var _activeEffects = [];   // ILLUM lights, WP spheres, smoke clouds

  // Trajectory preview line
  var _trajectoryLine = null;

  // Splash observer
  var _splashPending = false;
  var _splashTimer = 0;
  var _lastImpactPos = null;
  var _lastTargetPos = null;

  // Supply drops – track resupply calls
  var _supplyDropCount = 0;

  // HUD panel element
  var _hudPanel = null;
  var _hudCollapsed = false;
  var _fireMissionPanel = null;
  var _fireMissionInput = '';
  var _fireMissionStep = 0;   // 0=entering grid X, 1=entering grid Z
  var _messageEl = null;
  var _messageTimer = 0;

  // ── Constants ───────────────────────────────────────────────
  var MUZZLE_VELOCITY = 40;   // m/s
  var GRAVITY = 9.8;
  var DANGER_CLOSE_DIST = 50;
  var HE_DAMAGE_RADIUS = 10;
  var ILLUM_RISE_HEIGHT = 40;
  var WP_BURN_DURATION = 8;
  var WP_COUNT = 5;
  var WP_SCATTER_RADIUS = 5;
  var SMOKE_EXPAND_DURATION = 4;
  var ILLUM_DURATION = 30;
  var TUBE_BARREL_RADIUS = 0.3;
  var TUBE_BARREL_HEIGHT = 2;
  var SPLASH_DELAY = 3;
  var FFE_INTERVAL = 0.5;
  var FFE_ROUNDS = 3;
  var GRID_SCALE = 1;         // 1 world unit per grid unit

  // ── Build 3D mortar tube ─────────────────────────────────────
  function _buildMortarTube() {
    var group = new THREE.Group();

    // Barrel: cylinder tilted 45°
    var barrelGeo = new THREE.CylinderGeometry(TUBE_BARREL_RADIUS, TUBE_BARREL_RADIUS, TUBE_BARREL_HEIGHT, 16);
    var barrelMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    var barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.x = Math.PI / 4;  // 45° angle
    barrel.position.set(0, 1.4, -0.7);
    group.add(barrel);

    // Bipod leg left
    var bipodGeo = new THREE.BoxGeometry(0.06, 1.4, 0.06);
    var bipodMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var legL = new THREE.Mesh(bipodGeo, bipodMat);
    legL.position.set(-0.3, 0.7, 0.15);
    legL.rotation.z = 0.25;
    group.add(legL);

    // Bipod leg right
    var legR = new THREE.Mesh(bipodGeo, bipodMat);
    legR.position.set(0.3, 0.7, 0.15);
    legR.rotation.z = -0.25;
    group.add(legR);

    // Base plate (flat box)
    var plateGeo = new THREE.BoxGeometry(1.2, 0.08, 1.2);
    var plateMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.set(0, 0.04, 0);
    group.add(plate);

    return group;
  }

  // ── Ballistics ───────────────────────────────────────────────
  // Returns elevation angle (radians) for given horizontal range
  // range = v² * sin(2θ) / g  →  sin(2θ) = range*g / v²
  function _calcElevation(range) {
    var sinVal = (range * GRAVITY) / (MUZZLE_VELOCITY * MUZZLE_VELOCITY);
    if (sinVal > 1) sinVal = 1;
    if (sinVal < -1) sinVal = -1;
    // Use high-angle solution (mortar always fires high)
    var twoTheta = Math.asin(sinVal);
    // High angle: θ = (π/2 - twoTheta/2)  for the obtuse solution
    var elevation = (Math.PI / 2) - (twoTheta / 2);
    return elevation;
  }

  // Returns azimuth in degrees (0=North/+Z, clockwise)
  function _calcAzimuth(fromPos, toPos) {
    var dx = toPos.x - fromPos.x;
    var dz = toPos.z - fromPos.z;
    var angle = Math.atan2(dx, dz) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    return angle;
  }

  // Determines charge level based on range
  function _calcCharge(range) {
    if (range < 30) return 1;
    if (range < 60) return 2;
    if (range < 90) return 3;
    return 4;
  }

  // Time of flight for parabolic arc
  function _calcFlightTime(elevation, range) {
    // t = range / (v * cos(θ))
    var cosEl = Math.cos(elevation);
    if (Math.abs(cosEl) < 0.0001) return 5;
    return range / (MUZZLE_VELOCITY * cosEl);
  }

  // ── Trajectory preview (dotted arc) ─────────────────────────
  function _buildTrajectoryLine(fromPos, toPos) {
    if (_trajectoryLine) {
      _scene.remove(_trajectoryLine);
      _trajectoryLine = null;
    }

    var dx = toPos.x - fromPos.x;
    var dz = toPos.z - fromPos.z;
    var range = Math.sqrt(dx * dx + dz * dz);
    if (range < 0.1) return;

    var elevation = _calcElevation(range);
    var flightTime = _calcFlightTime(elevation, range);
    var STEPS = 40;
    var positions = [];

    for (var i = 0; i <= STEPS; i++) {
      var t = (i / STEPS) * flightTime;
      var frac = i / STEPS;
      var px = fromPos.x + dx * frac;
      var pz = fromPos.z + dz * frac;
      var vy0 = MUZZLE_VELOCITY * Math.sin(elevation);
      var py = fromPos.y + vy0 * t - 0.5 * GRAVITY * t * t;
      positions.push(px, py, pz);
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    var mat = new THREE.PointsMaterial({ color: 0xffff00, size: 0.3 });
    _trajectoryLine = new THREE.Points(geo, mat);
    _scene.add(_trajectoryLine);
  }

  function _removeTrajectoryLine() {
    if (_trajectoryLine) {
      _scene.remove(_trajectoryLine);
      _trajectoryLine = null;
    }
  }

  // ── Fire round ───────────────────────────────────────────────
  function _fireRound(targetPos) {
    if (_roundsTotal <= 0) {
      _showMessage('NO ROUNDS REMAINING');
      return;
    }

    var fromPos = _tubePosition.clone();
    fromPos.y += 2;  // muzzle height

    _roundsTotal--;
    _updateHUD();

    var dx = targetPos.x - fromPos.x;
    var dz = targetPos.z - fromPos.z;
    var range = Math.sqrt(dx * dx + dz * dz);
    var elevation = _calcElevation(range);
    var flightTime = _calcFlightTime(elevation, range);

    // Build projectile sphere
    var projGeo = new THREE.SphereGeometry(0.15, 8, 8);
    var projMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var projMesh = new THREE.Mesh(projGeo, projMat);
    projMesh.position.copy(fromPos);
    _scene.add(projMesh);

    var vy0 = MUZZLE_VELOCITY * Math.sin(elevation);

    var proj = {
      mesh: projMesh,
      fromPos: fromPos.clone(),
      targetPos: targetPos.clone(),
      dx: dx,
      dz: dz,
      range: range,
      elevation: elevation,
      flightTime: flightTime,
      vy0: vy0,
      elapsed: 0,
      done: false,
      roundType: ROUND_TYPES[_currentRoundIndex]
    };

    _projectiles.push(proj);
  }

  // ── Round impact effects ─────────────────────────────────────
  function _onImpact(proj) {
    var pos = proj.targetPos.clone();
    var type = proj.roundType;

    _lastImpactPos = pos.clone();
    _lastTargetPos = proj.targetPos.clone();

    if (type === 'HE') {
      _doHEExplosion(pos);
    } else if (type === 'ILLUM') {
      _doIllum(pos);
    } else if (type === 'WP') {
      _doWP(pos);
    } else if (type === 'SMOKE') {
      _doSmoke(pos);
    }

    // Splash observer
    _splashPending = true;
    _splashTimer = SPLASH_DELAY;
  }

  function _doHEExplosion(pos) {
    // Expanding flash sphere
    var flashGeo = new THREE.SphereGeometry(0.5, 8, 8);
    var flashMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.9 });
    var flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.copy(pos);
    _scene.add(flash);

    // Shockwave ring
    var ringGeo = new THREE.RingGeometry(0.1, 0.4, 24);
    var ringMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(pos);
    ring.position.y += 0.1;
    ring.rotation.x = -Math.PI / 2;
    _scene.add(ring);

    _activeEffects.push({
      type: 'HE_FLASH',
      mesh: flash,
      ring: ring,
      elapsed: 0,
      duration: 1.5,
      maxRadius: HE_DAMAGE_RADIUS * 0.3
    });

    _showMessage('SPLASH — HE IMPACT');
  }

  function _doIllum(pos) {
    // Rising flare sphere
    var flareGeo = new THREE.SphereGeometry(0.4, 8, 8);
    var flareMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var flare = new THREE.Mesh(flareGeo, flareMat);
    flare.position.copy(pos);
    _scene.add(flare);

    // Point light that expands
    var light = new THREE.PointLight(0xfffaaa, 0, 60);
    light.position.copy(pos);
    _scene.add(light);

    _activeEffects.push({
      type: 'ILLUM',
      mesh: flare,
      light: light,
      startPos: pos.clone(),
      elapsed: 0,
      duration: ILLUM_DURATION,
      riseComplete: false
    });

    _showMessage('SPLASH — ILLUM ROUND');
  }

  function _doWP(pos) {
    for (var i = 0; i < WP_COUNT; i++) {
      var angle = (i / WP_COUNT) * Math.PI * 2;
      var r = Math.random() * WP_SCATTER_RADIUS;
      var sx = pos.x + Math.cos(angle) * r;
      var sz = pos.z + Math.sin(angle) * r;

      var wpGeo = new THREE.SphereGeometry(0.3, 8, 8);
      var wpMat = new THREE.MeshBasicMaterial({ color: 0xFFAA00 });
      var wpMesh = new THREE.Mesh(wpGeo, wpMat);
      wpMesh.position.set(sx, pos.y + 0.3, sz);
      _scene.add(wpMesh);

      _activeEffects.push({
        type: 'WP',
        mesh: wpMesh,
        elapsed: 0,
        duration: WP_BURN_DURATION,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }

    _showMessage('SPLASH — WP ROUND — AREA DENIAL ACTIVE');
  }

  function _doSmoke(pos) {
    var smokeGeo = new THREE.SphereGeometry(0.1, 8, 8);
    var smokeMat = new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.7 });
    var smokeMesh = new THREE.Mesh(smokeGeo, smokeMat);
    smokeMesh.position.copy(pos);
    smokeMesh.position.y += 1;
    _scene.add(smokeMesh);

    _activeEffects.push({
      type: 'SMOKE',
      mesh: smokeMesh,
      elapsed: 0,
      duration: SMOKE_EXPAND_DURATION,
      maxRadius: 6
    });

    _showMessage('SPLASH — SMOKE ROUND');
  }

  // ── Splash observer ──────────────────────────────────────────
  function _doSplashObserver() {
    if (!_lastImpactPos || !_lastTargetPos) return;

    var dx = _lastImpactPos.x - _lastTargetPos.x;
    var dz = _lastImpactPos.z - _lastTargetPos.z;
    var miss = Math.sqrt(dx * dx + dz * dz);

    if (miss > 5) {
      // Compute adjustment message
      var adjustLeft = -dx;
      var adjustAdd = -dz;
      var leftStr = (adjustLeft >= 0 ? 'RIGHT ' : 'LEFT ') + Math.abs(Math.round(adjustLeft * 10));
      var addStr = (adjustAdd >= 0 ? 'ADD ' : 'DROP ') + Math.abs(Math.round(adjustAdd * 10));
      _showMessage('SPLASH — ADJUST FIRE: ' + leftStr + ', ' + addStr);
    } else {
      _showMessage('SPLASH — ROUNDS ON TARGET — FIRE FOR EFFECT?');
    }
  }

  // ── Fire For Effect ──────────────────────────────────────────
  function _startFFE() {
    if (_roundsTotal < FFE_ROUNDS) {
      _showMessage('INSUFFICIENT ROUNDS FOR FFE');
      return;
    }
    _ffeActive = true;
    _ffeRoundsLeft = FFE_ROUNDS;
    _ffeTimer = 0;
    _showMessage('FIRE FOR EFFECT — 3 ROUNDS');
  }

  // ── Grid reference helpers ───────────────────────────────────
  // Grid display: "247 / 315" maps to world X=247, Z=315 (scaled)
  function _gridToWorld(gridX, gridZ) {
    return new THREE.Vector3(gridX * GRID_SCALE, 0, gridZ * GRID_SCALE);
  }

  function _worldToGrid(worldX, worldZ) {
    return {
      x: Math.round(worldX / GRID_SCALE),
      z: Math.round(worldZ / GRID_SCALE)
    };
  }

  function _formatGrid(gx, gz) {
    var xs = String(Math.abs(gx));
    var zs = String(Math.abs(gz));
    while (xs.length < 3) xs = '0' + xs;
    while (zs.length < 3) zs = '0' + zs;
    return xs + ' / ' + zs;
  }

  // ── HUD ──────────────────────────────────────────────────────
  function _buildHUD() {
    _hudPanel = document.createElement('div');
    _hudPanel.id = 'mortar-hud';
    _hudPanel.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:16px',
      'background:rgba(0,20,0,0.82)',
      'color:#00ff66',
      'font-family:monospace',
      'font-size:12px',
      'padding:10px 14px',
      'border:1px solid #00ff66',
      'border-radius:4px',
      'z-index:9000',
      'min-width:220px',
      'user-select:none',
      'pointer-events:auto'
    ].join(';');

    var title = document.createElement('div');
    title.style.cssText = 'font-weight:bold;font-size:13px;margin-bottom:6px;cursor:pointer;letter-spacing:1px;';
    title.textContent = '[ MORTAR SYSTEM ]';
    title.addEventListener('click', function () {
      _hudCollapsed = !_hudCollapsed;
      _updateHUD();
    });
    _hudPanel.appendChild(title);

    var body = document.createElement('div');
    body.id = 'mortar-hud-body';
    _hudPanel.appendChild(body);

    document.body.appendChild(_hudPanel);

    // Message overlay
    _messageEl = document.createElement('div');
    _messageEl.id = 'mortar-message';
    _messageEl.style.cssText = [
      'position:fixed',
      'top:120px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#ffffff',
      'font-family:monospace',
      'font-size:16px',
      'padding:8px 20px',
      'border-radius:4px',
      'z-index:9100',
      'display:none',
      'pointer-events:none',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(_messageEl);

    _updateHUD();
  }

  function _updateHUD() {
    if (!_hudPanel) return;

    var body = document.getElementById('mortar-hud-body');
    if (!body) return;

    if (_hudCollapsed) {
      body.style.display = 'none';
      return;
    }
    body.style.display = 'block';

    var tubeStr = _tubeDeployed
      ? ('X:' + Math.round(_tubePosition.x) + ' Y:' + Math.round(_tubePosition.y) + ' Z:' + Math.round(_tubePosition.z))
      : 'NOT DEPLOYED';

    var roundColor = _roundsTotal <= 3 ? '#ff4444' : '#00ff66';

    body.innerHTML = [
      '<div>TUBE: ' + tubeStr + '</div>',
      '<div style="color:' + roundColor + '">ROUNDS: ' + _roundsTotal + '/12</div>',
      '<div>TYPE: <span style="color:#ffff00">' + ROUND_TYPES[_currentRoundIndex] + '</span></div>',
      '<div>GRID: ' + _targetGridDisplay + '</div>',
      '<div>ELEV: ' + _calculatedElevation.toFixed(1) + '&deg;</div>',
      '<div>AZ: ' + Math.round(_calculatedAzimuth) + '&deg;</div>',
      '<div>CHARGE: ' + _calculatedCharge + '</div>',
      '<hr style="border-color:#00ff66;margin:4px 0">',
      '<div style="color:#aaa;font-size:10px">M+CLICK=DEPLOY | SHIFT+M=MISSION</div>',
      '<div style="color:#aaa;font-size:10px">SCROLL=ROUND TYPE</div>'
    ].join('');
  }

  function _showMessage(msg) {
    if (!_messageEl) return;
    _messageEl.textContent = msg;
    _messageEl.style.display = 'block';
    _messageTimer = 3;
  }

  // ── Fire Mission Panel ───────────────────────────────────────
  function _buildFireMissionPanel() {
    _fireMissionPanel = document.createElement('div');
    _fireMissionPanel.id = 'mortar-fire-mission';
    _fireMissionPanel.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,10,0,0.92)',
      'color:#00ff66',
      'font-family:monospace',
      'font-size:14px',
      'padding:20px 28px',
      'border:2px solid #00ff66',
      'border-radius:6px',
      'z-index:9200',
      'min-width:360px',
      'display:none',
      'pointer-events:auto'
    ].join(';');

    document.body.appendChild(_fireMissionPanel);
  }

  function _openFireMission() {
    if (!_tubeDeployed) {
      _showMessage('DEPLOY TUBE FIRST (M + LEFT-CLICK)');
      return;
    }
    _fireMissionOpen = true;
    _fireMissionStep = 0;
    _fireMissionInput = '';
    _dangerCloseConfirm = 0;
    _dangerCloseWarning = false;
    _renderFireMissionPanel();
    _fireMissionPanel.style.display = 'block';
  }

  function _closeFireMission() {
    _fireMissionOpen = false;
    if (_fireMissionPanel) _fireMissionPanel.style.display = 'none';
    _removeTrajectoryLine();
    _dangerCloseConfirm = 0;
    _dangerCloseWarning = false;
  }

  function _renderFireMissionPanel() {
    if (!_fireMissionPanel) return;

    var playerGrid = _worldToGrid(
      _playerPosition ? _playerPosition.x : 0,
      _playerPosition ? _playerPosition.z : 0
    );

    var dangerHtml = '';
    if (_dangerCloseWarning) {
      dangerHtml = '<div style="color:#ff0000;font-weight:bold;margin-top:8px">&#9888; DANGER CLOSE — CONFIRM? (Press ENTER again)</div>';
    }

    var missionDataHtml = '';
    if (_calculatedElevation > 0) {
      missionDataHtml = [
        '<div style="margin-top:8px;color:#ffff00">',
        'ELEVATION: ' + _calculatedElevation.toFixed(1) + '&deg; | AZIMUTH: ' + Math.round(_calculatedAzimuth) + '&deg;',
        '</div>',
        '<div style="color:#ffaa00">CHARGE: ' + _calculatedCharge + ' | ROUND: ' + ROUND_TYPES[_currentRoundIndex] + '</div>'
      ].join('');
    }

    var stepLabel = (_fireMissionStep === 0) ? 'GRID EAST (X):' : 'GRID NORTH (Z):';
    var enteredGrid = (_fireMissionStep === 1)
      ? ('EAST: ' + _targetGrid.x + ' | NORTH: ')
      : '';

    _fireMissionPanel.innerHTML = [
      '<div style="font-size:16px;font-weight:bold;margin-bottom:12px;letter-spacing:2px">&#9654; FIRE MISSION</div>',
      '<div>TUBE POS: ' + _formatGrid(Math.round(_tubePosition.x), Math.round(_tubePosition.z)) + '</div>',
      '<div>PLAYER GRID: ' + _formatGrid(playerGrid.x, playerGrid.z) + '</div>',
      '<div>TARGET GRID: ' + _targetGridDisplay + '</div>',
      '<hr style="border-color:#00ff66;margin:8px 0">',
      '<div>' + stepLabel + '</div>',
      '<div style="margin-top:4px">' + enteredGrid + '<span style="color:#ffff00">' + _fireMissionInput + '</span><span style="animation:blink 1s infinite">_</span></div>',
      missionDataHtml,
      dangerHtml,
      '<hr style="border-color:#00ff66;margin:8px 0">',
      '<div style="color:#aaa;font-size:11px">ENTER=confirm | ESC=cancel | F=fire | E=FFE</div>',
      '<div style="color:#aaa;font-size:11px">SCROLL=cycle round type while open</div>'
    ].join('');
  }

  function _fireMissionKeyInput(key) {
    if (!_fireMissionOpen) return;

    if (key === 'Escape') {
      _closeFireMission();
      return;
    }

    if (key === 'f' || key === 'F') {
      _executeFire();
      return;
    }

    if (key === 'e' || key === 'E') {
      _startFFE();
      _closeFireMission();
      return;
    }

    if (key === 'Enter') {
      _handleFireMissionEnter();
      return;
    }

    if (key === 'Backspace') {
      if (_fireMissionInput.length > 0) {
        _fireMissionInput = _fireMissionInput.slice(0, -1);
      }
      _renderFireMissionPanel();
      return;
    }

    // Numeric input only
    if (/^[0-9]$/.test(key)) {
      if (_fireMissionInput.length < 4) {
        _fireMissionInput += key;
        _renderFireMissionPanel();
      }
    }
  }

  function _handleFireMissionEnter() {
    if (_fireMissionStep === 0) {
      var val = parseInt(_fireMissionInput, 10);
      if (isNaN(val)) {
        _showMessage('INVALID GRID COORDINATE');
        return;
      }
      _targetGrid.x = val;
      _fireMissionInput = '';
      _fireMissionStep = 1;
    } else if (_fireMissionStep === 1) {
      var valZ = parseInt(_fireMissionInput, 10);
      if (isNaN(valZ)) {
        _showMessage('INVALID GRID COORDINATE');
        return;
      }
      _targetGrid.z = valZ;
      _fireMissionInput = '';
      _fireMissionStep = 2;

      // Calculate ballistics
      _recalculate();

      // Check danger close
      var tpos = _gridToWorld(_targetGrid.x, _targetGrid.z);
      var ppos = _playerPosition || new THREE.Vector3();
      var dcDist = tpos.distanceTo(new THREE.Vector3(ppos.x, ppos.y, ppos.z));

      if (dcDist < DANGER_CLOSE_DIST) {
        _dangerCloseWarning = true;
        _dangerCloseConfirm = 1;
      }
    } else if (_fireMissionStep === 2) {
      // Confirm or handle danger close
      if (_dangerCloseWarning) {
        if (_dangerCloseConfirm === 1) {
          _dangerCloseConfirm = 2;
          _dangerCloseWarning = false;
          _showMessage('DANGER CLOSE CONFIRMED — READY TO FIRE (F)');
        }
      }
    }

    _renderFireMissionPanel();
  }

  function _recalculate() {
    var targetWorldPos = _gridToWorld(_targetGrid.x, _targetGrid.z);
    var dx = targetWorldPos.x - _tubePosition.x;
    var dz = targetWorldPos.z - _tubePosition.z;
    var range = Math.sqrt(dx * dx + dz * dz);

    _calculatedElevation = _calcElevation(range) * (180 / Math.PI);
    _calculatedAzimuth = _calcAzimuth(_tubePosition, targetWorldPos);
    _calculatedCharge = _calcCharge(range);
    _targetGridDisplay = _formatGrid(_targetGrid.x, _targetGrid.z);

    // Show trajectory preview
    var tubeTop = _tubePosition.clone();
    tubeTop.y += 2;
    _buildTrajectoryLine(tubeTop, targetWorldPos);

    _updateHUD();
  }

  function _executeFire() {
    if (_dangerCloseWarning && _dangerCloseConfirm < 2) {
      _showMessage('DANGER CLOSE — PRESS ENTER TO CONFIRM FIRST');
      return;
    }

    var targetWorldPos = _gridToWorld(_targetGrid.x, _targetGrid.z);
    _fireRound(targetWorldPos);
    _closeFireMission();
    _updateHUD();
  }

  // ── Supply drop handler ──────────────────────────────────────
  function resupply() {
    _roundsTotal = Math.min(_roundsTotal + 6, 99);
    _supplyDropCount++;
    _showMessage('RESUPPLY — +6 ROUNDS — TOTAL: ' + _roundsTotal);
    _updateHUD();
  }

  // ── Input event listeners ─────────────────────────────────────
  function _onKeyDown(e) {
    _keys[e.key] = true;

    if (e.key === 'M' || e.key === 'm') {
      if (e.shiftKey) {
        // Shift+M opens fire mission
        if (!_fireMissionOpen) {
          _openFireMission();
        } else {
          _closeFireMission();
        }
        return;
      }
      _mKeyHeld = true;
    }

    if (_fireMissionOpen) {
      _fireMissionKeyInput(e.key);
      e.preventDefault();
    }
  }

  function _onKeyUp(e) {
    _keys[e.key] = false;
    if (e.key === 'M' || e.key === 'm') {
      _mKeyHeld = false;
    }
  }

  function _onMouseDown(e) {
    if (e.button === 0) {
      _leftClickDown = true;
      if (_mKeyHeld && !_fireMissionOpen) {
        _deployTube();
      }
    }
  }

  function _onMouseUp(e) {
    if (e.button === 0) {
      _leftClickDown = false;
    }
  }

  function _onWheel(e) {
    _currentRoundIndex = (_currentRoundIndex + (e.deltaY > 0 ? 1 : -1) + ROUND_TYPES.length) % ROUND_TYPES.length;
    _showMessage('ROUND TYPE: ' + ROUND_TYPES[_currentRoundIndex]);
    _updateHUD();
    if (_fireMissionOpen) _renderFireMissionPanel();
  }

  // ── Deploy / undeploy tube ───────────────────────────────────
  function _deployTube() {
    if (!_scene || !_playerPosition) return;

    if (_tubeDeployed) {
      // Remove existing
      if (_tubeGroup) {
        _scene.remove(_tubeGroup);
        _tubeGroup = null;
      }
      _tubeDeployed = false;
      _showMessage('MORTAR TUBE UNDEPLOYED');
    } else {
      _tubeGroup = _buildMortarTube();
      _tubePosition.set(_playerPosition.x, _playerPosition.y, _playerPosition.z);
      _tubeGroup.position.copy(_tubePosition);
      _scene.add(_tubeGroup);
      _tubeDeployed = true;
      _showMessage('MORTAR TUBE DEPLOYED — SHIFT+M FOR FIRE MISSION');
    }

    _updateHUD();
  }

  // ── Update effects ───────────────────────────────────────────
  function _updateEffects(dt) {
    for (var i = _activeEffects.length - 1; i >= 0; i--) {
      var ef = _activeEffects[i];
      ef.elapsed += dt;

      if (ef.type === 'HE_FLASH') {
        var progress = ef.elapsed / ef.duration;
        var scale = 1 + progress * ef.maxRadius;
        ef.mesh.scale.set(scale, scale, scale);
        ef.mesh.material.opacity = 0.9 * (1 - progress);
        if (ef.ring) {
          var ringScale = 1 + progress * ef.maxRadius * 3;
          ef.ring.scale.set(ringScale, ringScale, ringScale);
          ef.ring.material.opacity = 0.8 * (1 - progress);
        }
        if (ef.elapsed >= ef.duration) {
          _scene.remove(ef.mesh);
          if (ef.ring) _scene.remove(ef.ring);
          _activeEffects.splice(i, 1);
        }

      } else if (ef.type === 'ILLUM') {
        var riseProgress = Math.min(ef.elapsed / 5, 1);  // 5s to rise
        ef.mesh.position.y = ef.startPos.y + riseProgress * ILLUM_RISE_HEIGHT;
        ef.light.position.y = ef.mesh.position.y;
        // Expand light intensity over first 5s, fade over last 5s
        var fadeStart = ef.duration - 5;
        if (ef.elapsed < 5) {
          ef.light.intensity = (ef.elapsed / 5) * 3;
        } else if (ef.elapsed > fadeStart) {
          ef.light.intensity = 3 * (1 - (ef.elapsed - fadeStart) / 5);
        } else {
          ef.light.intensity = 3;
        }
        if (ef.elapsed >= ef.duration) {
          _scene.remove(ef.mesh);
          _scene.remove(ef.light);
          _activeEffects.splice(i, 1);
        }

      } else if (ef.type === 'WP') {
        // Pulse orange color
        var pulse = 0.5 + 0.5 * Math.sin(ef.elapsed * 8 + ef.pulsePhase);
        var r = Math.floor(255);
        var g2 = Math.floor(80 + 90 * pulse);
        ef.mesh.material.color.setRGB(r / 255, g2 / 255, 0);
        ef.mesh.material.opacity = 1 - (ef.elapsed / ef.duration) * 0.5;
        if (ef.elapsed >= ef.duration) {
          _scene.remove(ef.mesh);
          _activeEffects.splice(i, 1);
        }

      } else if (ef.type === 'SMOKE') {
        var smokeProgress = ef.elapsed / ef.duration;
        var radius = 0.1 + smokeProgress * ef.maxRadius;
        ef.mesh.scale.set(radius, radius * 0.6, radius);
        ef.mesh.material.opacity = 0.7 * (1 - Math.max(0, smokeProgress - 0.7) / 0.3);
        if (ef.elapsed >= ef.duration) {
          _scene.remove(ef.mesh);
          _activeEffects.splice(i, 1);
        }
      }
    }
  }

  // ── Update projectiles ───────────────────────────────────────
  function _updateProjectiles(dt) {
    for (var i = _projectiles.length - 1; i >= 0; i--) {
      var proj = _projectiles[i];
      proj.elapsed += dt;

      var frac = Math.min(proj.elapsed / proj.flightTime, 1);
      var t = proj.elapsed;

      // Horizontal interpolation
      var px = proj.fromPos.x + proj.dx * frac;
      var pz = proj.fromPos.z + proj.dz * frac;

      // Vertical parabola
      var py = proj.fromPos.y + proj.vy0 * t - 0.5 * GRAVITY * t * t;

      proj.mesh.position.set(px, py, pz);

      if (proj.elapsed >= proj.flightTime || py <= 0) {
        _scene.remove(proj.mesh);
        proj.done = true;
        _onImpact(proj);
        _projectiles.splice(i, 1);
      }
    }
  }

  // ── Update FFE ───────────────────────────────────────────────
  function _updateFFE(dt) {
    if (!_ffeActive) return;

    _ffeTimer -= dt;
    if (_ffeTimer <= 0) {
      if (_ffeRoundsLeft > 0) {
        var targetWorldPos = _gridToWorld(_targetGrid.x, _targetGrid.z);
        _fireRound(targetWorldPos);
        _ffeRoundsLeft--;
        _ffeTimer = FFE_INTERVAL;
        _showMessage('FFE — ROUND ' + (FFE_ROUNDS - _ffeRoundsLeft) + ' OF ' + FFE_ROUNDS);
      } else {
        _ffeActive = false;
        _showMessage('FFE COMPLETE');
      }
    }
  }

  // ── Main update ───────────────────────────────────────────────
  function update(dt) {
    if (!_scene) return;

    // Update projectiles
    _updateProjectiles(dt);

    // Update effects
    _updateEffects(dt);

    // Update FFE
    _updateFFE(dt);

    // Splash observer timer
    if (_splashPending) {
      _splashTimer -= dt;
      if (_splashTimer <= 0) {
        _splashPending = false;
        _doSplashObserver();
      }
    }

    // Message fade timer
    if (_messageTimer > 0) {
      _messageTimer -= dt;
      if (_messageTimer <= 0 && _messageEl) {
        _messageEl.style.display = 'none';
      }
    }
  }

  // ── Init ─────────────────────────────────────────────────────
  function init(scene, camera, renderer, playerPosRef) {
    _scene = scene;
    _camera = camera;
    _renderer = renderer;
    _playerPosition = playerPosRef || new THREE.Vector3();

    _buildHUD();
    _buildFireMissionPanel();

    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup', _onKeyUp);
    window.addEventListener('mousedown', _onMouseDown);
    window.addEventListener('mouseup', _onMouseUp);
    window.addEventListener('wheel', _onWheel);

    // Inject blink keyframe if not present
    if (!document.getElementById('mortar-blink-style')) {
      var styleEl = document.createElement('style');
      styleEl.id = 'mortar-blink-style';
      styleEl.textContent = '@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }';
      document.head.appendChild(styleEl);
    }

    _updateHUD();
  }

  // ── Reset ─────────────────────────────────────────────────────
  function reset() {
    // Remove tube
    if (_tubeGroup && _scene) {
      _scene.remove(_tubeGroup);
      _tubeGroup = null;
    }
    _tubeDeployed = false;

    // Remove projectiles
    for (var i = 0; i < _projectiles.length; i++) {
      if (_scene) _scene.remove(_projectiles[i].mesh);
    }
    _projectiles = [];

    // Remove effects
    for (var j = 0; j < _activeEffects.length; j++) {
      var ef = _activeEffects[j];
      if (_scene) {
        _scene.remove(ef.mesh);
        if (ef.light) _scene.remove(ef.light);
        if (ef.ring) _scene.remove(ef.ring);
      }
    }
    _activeEffects = [];

    _removeTrajectoryLine();
    _closeFireMission();

    // Reset rounds
    _roundsTotal = 12;
    _currentRoundIndex = 0;
    _ffeActive = false;
    _ffeRoundsLeft = 0;
    _splashPending = false;
    _dangerCloseConfirm = 0;
    _dangerCloseWarning = false;
    _calculatedElevation = 0;
    _calculatedAzimuth = 0;
    _calculatedCharge = 1;
    _targetGridDisplay = '000 / 000';

    _updateHUD();
  }

  // ── Public API ────────────────────────────────────────────────
  return {
    init: init,
    update: update,
    reset: reset,
    resupply: resupply,
    fireFFE: _startFFE,
    isDeployed: function () { return _tubeDeployed; },
    getRoundsCount: function () { return _roundsTotal; },
    getCurrentRoundType: function () { return ROUND_TYPES[_currentRoundIndex]; }
  };

})();
