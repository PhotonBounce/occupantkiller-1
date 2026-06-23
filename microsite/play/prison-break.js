window.PrisonBreak = (function () {
  'use strict';

  // ── State ─────────────────────────────────────────────────────────────────────
  var _scene, _camera, _renderer, _clock;
  var _active = false;
  var _container;

  // Key tracking for chord detection
  var _keysDown = {};
  var _keyTimestamps = {};
  var _pTime = 0;
  var _bTime = 0;

  // Player state
  var _player;
  var _playerSpeed = 8;
  var _cameraAngle = 0;
  var _cameraDistance = 18;
  var _cameraHeight = 12;
  var _crouching = false;

  // Game collections (matching spec variable names)
  var _prisoners = [];
  var _guards = [];
  var _alarmActive = false;
  var _disguised = false;
  var _alarmBoxes = [];
  var _jeep = null;
  var _dog = null;

  // Extended state
  var _group;
  var _hud;
  var _guardDogs = [];
  var _alarmTimer = 0;
  var _disguiseTimer = 0;
  var _hasKeycard = false;
  var _cellDoorOpen = false;
  var _freedPrisoners = 0;
  var _totalPrisoners = 5;
  var _selectedRoute = 'NORTH';
  var _extractionTimer = 180;
  var _gameOver = false;
  var _gameWon = false;
  var _guardBodies = [];
  var _followingPrisoners = [];
  var _spawnedExtraGuards = false;
  var _keycard = null;
  var _cellDoor = null;
  var _commander = null;
  var _exchangeOffered = false;
  var _exchangeResolved = false;
  var _dogChain = null;
  var _sewerMode = false;
  var _heliCalled = false;
  var _heliTimer = 0;
  var _heliArrived = false;
  var _heliMesh = null;
  var _promptElement = null;
  var _promptTimer = 0;
  var _audioCtx = null;
  var _dogBarkTimer = 0;
  var _dogDetected = false;

  // Jeep driving
  var _drivingJeep = false;
  var _jeepSpeed = 12;
  var _jeepVelocity = { x: 0, z: 0 };
  var _jeepAngle = 0;
  var _jeepOccupants = 0;

  // Extraction points
  var _northExtraction = { x: 0, z: -80 };
  var _extractionZone = null;

  // Sewer
  var _sewerEntry = { x: 28, z: 0 };
  var _sewerExit = { x: 58, z: 0 };

  // Heli LZ
  var _heliLZ = { x: 0, z: 5, y: 8 };

  // ── Geometry helpers ──────────────────────────────────────────────────────────
  function _makeMesh(geo, color) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function _makeBox(w, h, d, color) {
    return _makeMesh(new THREE.BoxGeometry(w, h, d), color);
  }

  function _makeCyl(rt, rb, h, segs, color) {
    return _makeMesh(new THREE.CylinderGeometry(rt, rb, h, segs || 8), color);
  }

  function _makeSphere(r, color) {
    return _makeMesh(new THREE.SphereGeometry(r, 8, 8), color);
  }

  function _makeCone(r, h, segs, color) {
    return _makeMesh(new THREE.ConeGeometry(r, h, segs || 8), color);
  }

  function _makeLineSegments(points, color) {
    var geo = new THREE.BufferGeometry();
    var verts = [];
    for (var i = 0; i < points.length; i++) {
      verts.push(points[i].x, points[i].y, points[i].z);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    var mat = new THREE.LineBasicMaterial({ color: color });
    return new THREE.LineSegments(geo, mat);
  }

  function _dist2D(a, b) {
    var dx = a.x - b.x;
    var dz = (a.z !== undefined ? a.z : 0) - (b.z !== undefined ? b.z : 0);
    return Math.sqrt(dx * dx + dz * dz);
  }

  // ── Audio helpers ─────────────────────────────────────────────────────────────
  function _initAudio() {
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      _audioCtx = null;
    }
  }

  function _playBark() {
    if (!_audioCtx) return;
    try {
      var osc = _audioCtx.createOscillator();
      var gain = _audioCtx.createGain();
      osc.connect(gain);
      gain.connect(_audioCtx.destination);
      osc.frequency.value = 440;
      osc.type = 'square';
      gain.gain.setValueAtTime(0.15, _audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + 0.12);
      osc.start(_audioCtx.currentTime);
      osc.stop(_audioCtx.currentTime + 0.12);
    } catch (e) { /* silence */ }
  }

  // ── Build world ───────────────────────────────────────────────────────────────
  function _buildPrison() {
    // Ground
    var ground = _makeBox(300, 0.2, 300, 0x446633);
    ground.position.set(0, -0.1, 0);
    _scene.add(ground);

    // ── Outer walls: 4 BoxGeometry segments 50x6x2 (0x555555) ──────────────────
    var wallColor = 0x555555;
    var wN = _makeBox(50, 6, 2, wallColor);
    wN.position.set(0, 3, -27);
    _scene.add(wN);
    var wS = _makeBox(50, 6, 2, wallColor);
    wS.position.set(0, 3, 27);
    _scene.add(wS);
    var wE = _makeBox(2, 6, 50, wallColor);
    wE.position.set(27, 3, 0);
    _scene.add(wE);
    var wW = _makeBox(2, 6, 50, wallColor);
    wW.position.set(-27, 3, 0);
    _scene.add(wW);

    // ── 4 corner watchtowers BoxGeometry 3x10x3 (0x444444) ────────────────────
    var towerColor = 0x444444;
    var towerPositions = [
      { x: -27, z: -27 }, { x: 27, z: -27 },
      { x: -27, z: 27 }, { x: 27, z: 27 }
    ];
    for (var ti = 0; ti < 4; ti++) {
      var tp = towerPositions[ti];
      var tower = _makeBox(3, 10, 3, towerColor);
      tower.position.set(tp.x, 5, tp.z);
      _scene.add(tower);
      var tGuard = _makeCyl(0.4, 0.4, 1.8, 8, 0x334433);
      tGuard.position.set(tp.x, 11.9, tp.z);
      _scene.add(tGuard);
    }

    // ── Cell block BoxGeometry 20x8x12 (0x555544) ─────────────────────────────
    var cellBlock = _makeBox(20, 8, 12, 0x555544);
    cellBlock.position.set(0, 4, 5);
    _scene.add(cellBlock);

    // ── Guard office BoxGeometry 4x3x4 (0x443333) ─────────────────────────────
    var guardOffice = _makeBox(4, 3, 4, 0x443333);
    guardOffice.position.set(-14, 1.5, 5);
    _scene.add(guardOffice);

    // ── Keycard BoxGeometry 0.3x0.1x0.5 (0xFFFF00) in guard office ────────────
    _keycard = _makeBox(0.3, 0.1, 0.5, 0xFFFF00);
    _keycard.position.set(-14, 3.3, 5);
    _scene.add(_keycard);

    // ── Cell block door ────────────────────────────────────────────────────────
    _cellDoor = _makeBox(2, 4, 0.3, 0x666655);
    _cellDoor.position.set(0, 2, -1.2);
    _scene.add(_cellDoor);

    // ── 5 prisoners: CylinderGeometry (0x8B7355) in BoxGeometry 4x4x4 cells ───
    var cellPositions = [
      { x: -8, z: 5 }, { x: -4, z: 5 }, { x: 0, z: 5 },
      { x: 4, z: 5 }, { x: 8, z: 5 }
    ];
    for (var ci = 0; ci < 5; ci++) {
      var cp = cellPositions[ci];
      var cell = _makeBox(4, 4, 4, 0x665544);
      cell.position.set(cp.x, 2, cp.z);
      _scene.add(cell);

      var barVerts = [];
      for (var bi = 0; bi < 5; bi++) {
        var bx = cp.x - 1.5 + bi * 0.75;
        barVerts.push({ x: bx, y: 0.2, z: cp.z - 2.1 });
        barVerts.push({ x: bx, y: 3.8, z: cp.z - 2.1 });
      }
      var bars = _makeLineSegments(barVerts, 0x888888);
      _scene.add(bars);

      var prisoner = _makeCyl(0.35, 0.35, 1.0, 8, 0x8B7355);
      prisoner.position.set(cp.x, 0.5, cp.z);
      prisoner.userData = {
        type: 'prisoner',
        index: ci,
        freed: false,
        following: false,
        highValue: (ci === 2)
      };
      _scene.add(prisoner);
      _prisoners.push(prisoner);
    }

    // ── Alarm boxes BoxGeometry (0xFF2200) on walls ────────────────────────────
    var alarmPos = [
      { x: 0, y: 4, z: -26.5 },
      { x: 0, y: 4, z: 26.5 },
      { x: 26.5, y: 4, z: 0 },
      { x: -26.5, y: 4, z: 0 }
    ];
    for (var ai = 0; ai < 4; ai++) {
      var ap = alarmPos[ai];
      var abox = _makeBox(0.8, 0.8, 0.4, 0xFF2200);
      abox.position.set(ap.x, ap.y, ap.z);
      abox.userData = { type: 'alarmBox', disabled: false };
      _scene.add(abox);
      _alarmBoxes.push(abox);
    }

    // ── Jeep BoxGeometry 4x2x2.5 (0x333333) at north gate ─────────────────────
    _jeep = _makeBox(4, 2, 2.5, 0x333333);
    _jeep.position.set(4, 1, -24);
    _jeep.userData = { type: 'jeep' };
    _scene.add(_jeep);

    // ── NORTH extraction: van BoxGeometry (0x333366) 60 units north ────────────
    var van = _makeBox(5, 3, 8, 0x333366);
    van.position.set(_northExtraction.x, 1.5, _northExtraction.z - 6);
    _scene.add(van);

    // Extraction zone BoxGeometry (0x00FF44)
    _extractionZone = _makeBox(12, 0.3, 12, 0x00FF44);
    _extractionZone.position.set(_northExtraction.x, 0.15, _northExtraction.z);
    _scene.add(_extractionZone);

    // Fence gap north as LineSegments
    var fenceGap = _makeLineSegments([
      { x: -3, y: 0, z: -55 }, { x: -3, y: 4, z: -55 },
      { x: 3, y: 0, z: -55 }, { x: 3, y: 4, z: -55 }
    ], 0xFFAA00);
    _scene.add(fenceGap);

    // ── EAST: sewer grate BoxGeometry (0x666666) ───────────────────────────────
    var sewerGrate = _makeBox(2, 0.2, 2, 0x666666);
    sewerGrate.position.set(_sewerEntry.x, 0.1, _sewerEntry.z);
    sewerGrate.userData = { type: 'sewerGrate', open: false };
    _scene.add(sewerGrate);

    var sewerTunnel = _makeBox(3, 2, 32, 0x443322);
    sewerTunnel.position.set(43, -2, 0);
    _scene.add(sewerTunnel);

    // ── WEST: helicopter LZ on roof BoxGeometry 0x00FF88 at y=8 ───────────────
    var lzPad = _makeBox(6, 0.2, 6, 0x00FF88);
    lzPad.position.set(_heliLZ.x, _heliLZ.y + 0.1, _heliLZ.z);
    lzPad.userData = { type: 'heliLZ' };
    _scene.add(lzPad);

    // ── Enemy commander CylinderGeometry (0x222222) at gate ───────────────────
    _commander = _makeCyl(0.7, 0.7, 2.2, 8, 0x222222);
    _commander.position.set(6, 1.1, -22);
    _commander.userData = { type: 'commander', active: true };
    _scene.add(_commander);

    // ── Lighting ───────────────────────────────────────────────────────────────
    var ambient = new THREE.AmbientLight(0x404050, 0.6);
    _scene.add(ambient);
    var dirLight = new THREE.DirectionalLight(0xffffcc, 0.9);
    dirLight.position.set(10, 20, 10);
    _scene.add(dirLight);

    var searchLight = new THREE.PointLight(0x8888ff, 0.5, 80);
    searchLight.position.set(0, 18, 0);
    searchLight.userData = { type: 'searchlight' };
    _scene.add(searchLight);
  }

  // ── Build guards ──────────────────────────────────────────────────────────────
  function _buildGuards() {
    var patrolRoutes = [
      [{ x: -10, z: -20 }, { x: 10, z: -20 }, { x: 10, z: -10 }, { x: -10, z: -10 }],
      [{ x: -20, z: 0 }, { x: -10, z: 0 }, { x: -10, z: 10 }, { x: -20, z: 10 }],
      [{ x: 10, z: 0 }, { x: 20, z: 0 }, { x: 20, z: 10 }, { x: 10, z: 10 }],
      [{ x: -5, z: 15 }, { x: 5, z: 15 }, { x: 5, z: 22 }, { x: -5, z: 22 }],
      [{ x: -22, z: -15 }, { x: -15, z: -15 }, { x: -15, z: -5 }, { x: -22, z: -5 }],
      [{ x: 15, z: -15 }, { x: 22, z: -15 }, { x: 22, z: -5 }, { x: 15, z: -5 }]
    ];

    for (var i = 0; i < 6; i++) {
      var g = _makeCyl(0.4, 0.4, 1.8, 8, 0x334433);
      var sp = patrolRoutes[i][0];
      g.position.set(sp.x, 0.9, sp.z);
      g.userData = {
        type: 'guard',
        patrol: true,
        route: patrolRoutes[i],
        routeIndex: 0,
        speed: 3,
        spottingPlayer: false,
        spotTimer: 0,
        downed: false,
        alerted: false
      };
      _scene.add(g);
      _guards.push(g);
    }

    var staticPosts = [
      { x: 0, z: -25 },
      { x: 0, z: 25 },
      { x: 25, z: 0 },
      { x: -25, z: 0 }
    ];
    for (var j = 0; j < 4; j++) {
      var sg = _makeCyl(0.4, 0.4, 1.8, 8, 0x334433);
      sg.position.set(staticPosts[j].x, 0.9, staticPosts[j].z);
      sg.userData = {
        type: 'guard',
        patrol: false,
        post: { x: staticPosts[j].x, z: staticPosts[j].z },
        speed: 3,
        spottingPlayer: false,
        spotTimer: 0,
        downed: false,
        alerted: false
      };
      _scene.add(sg);
      _guards.push(sg);
    }

    // ── Guard dog: CylinderGeometry 0x8B4513 at 0.5x scale on LineSegments leash
    _dog = _makeCyl(0.25, 0.25, 0.8, 6, 0x8B4513);
    _dog.scale.set(0.5, 0.5, 0.5);
    _dog.position.set(10, 0.4, 10);
    _dog.userData = {
      type: 'dog',
      center: { x: 10, z: 10 },
      angle: 0,
      orbitRadius: 8,
      speed: 12,
      detected: false
    };
    _scene.add(_dog);
    _guardDogs.push(_dog);

    _dogChain = _makeLineSegments([
      { x: 10, y: 0.4, z: 10 },
      { x: 10, y: 0.4, z: 10 }
    ], 0x888888);
    _dogChain.userData = { type: 'dogChain' };
    _scene.add(_dogChain);
  }

  // ── Build player ──────────────────────────────────────────────────────────────
  function _buildPlayer() {
    _player = _makeCyl(0.4, 0.4, 1.8, 8, 0x2244AA);
    _player.position.set(0, 0.9, 20);
    _player.userData = { type: 'player' };
    _scene.add(_player);
  }

  // ── HUD ───────────────────────────────────────────────────────────────────────
  function _buildHUD() {
    _hud = document.createElement('div');
    _hud.style.cssText = [
      'position:fixed', 'top:10px', 'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.78)',
      'color:#00FF44',
      'font-family:monospace',
      'font-size:14px',
      'padding:6px 16px',
      'border:1px solid #00FF44',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hud);

    _promptElement = document.createElement('div');
    _promptElement.style.cssText = [
      'position:fixed', 'bottom:60px', 'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.85)',
      'color:#FFFF00',
      'font-family:monospace',
      'font-size:13px',
      'padding:5px 14px',
      'border:1px solid #FFFF00',
      'border-radius:3px',
      'pointer-events:none',
      'z-index:9999',
      'display:none'
    ].join(';');
    document.body.appendChild(_promptElement);
  }

  function _formatTime(sec) {
    var s = Math.max(0, Math.floor(sec));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
  }

  function _activeGuardCount() {
    var n = 0;
    for (var i = 0; i < _guards.length; i++) {
      if (!_guards[i].userData.downed) n++;
    }
    return n;
  }

  function _updateHUD() {
    if (!_hud) return;
    var alarmStr = _alarmActive ? 'ON' : 'OFF';
    var alarmColor = _alarmActive ? '#FF2200' : '#00FF44';
    var disguiseStr = _disguised ? ' [DISGUISE:' + Math.ceil(_disguiseTimer) + 's]' : '';
    var heliStr = (_heliCalled && !_heliArrived) ? ' [HELI:' + Math.ceil(30 - _heliTimer) + 's]' : '';
    _hud.innerHTML =
      'PRISON BREAK [FREED: ' + _freedPrisoners + '/' + _totalPrisoners + '] ' +
      '[GUARDS: ' + _activeGuardCount() + '] ' +
      '[ALARM: <span style="color:' + alarmColor + '">' + alarmStr + '</span>] ' +
      '[ROUTE: ' + _selectedRoute + ']' +
      disguiseStr + heliStr +
      ' | EXTRACTION: ' + _formatTime(_extractionTimer);
  }

  function _showPrompt(text, dur) {
    if (!_promptElement) return;
    _promptElement.textContent = text;
    _promptElement.style.display = 'block';
    _promptTimer = dur || 2;
  }

  // ── Guard AI ──────────────────────────────────────────────────────────────────
  function _updateGuards(dt) {
    for (var i = 0; i < _guards.length; i++) {
      var g = _guards[i];
      if (g.userData.downed) continue;

      var gx = g.position.x;
      var gz = g.position.z;
      var px = _player.position.x;
      var pz = _player.position.z;
      var dx = px - gx;
      var dz = pz - gz;
      var dLen = Math.sqrt(dx * dx + dz * dz);

      // Guard FOV dot product check
      var gfx = Math.sin(g.rotation.y);
      var gfz = Math.cos(g.rotation.y);
      var dotVal = (dLen > 0.001) ? (gfx * (dx / dLen) + gfz * (dz / dLen)) : 0;

      // Detection: dot>0.5 and distance<20 no disguise; distance<8 with disguise
      var spotted = false;
      if (!_disguised) {
        spotted = (dotVal > 0.5 && dLen < 20);
      } else {
        spotted = (dLen < 8);
      }

      if (_alarmActive || g.userData.alerted) {
        if (dLen > 1.5) {
          var spd = g.userData.speed * 1.5;
          g.position.x += (dx / dLen) * spd * dt;
          g.position.z += (dz / dLen) * spd * dt;
          g.rotation.y = Math.atan2(dx, dz);
        }
      } else if (g.userData.patrol) {
        var route = g.userData.route;
        var tgt = route[g.userData.routeIndex];
        var tdx = tgt.x - gx;
        var tdz = tgt.z - gz;
        var td = Math.sqrt(tdx * tdx + tdz * tdz);
        if (td < 0.5) {
          g.userData.routeIndex = (g.userData.routeIndex + 1) % route.length;
        } else {
          g.position.x += (tdx / td) * g.userData.speed * dt;
          g.position.z += (tdz / td) * g.userData.speed * dt;
          g.rotation.y = Math.atan2(tdx, tdz);
        }
        if (spotted) {
          g.userData.spotTimer += dt;
          if (g.userData.spotTimer > 3) _triggerAlarm();
        } else {
          g.userData.spotTimer = Math.max(0, g.userData.spotTimer - dt * 2);
        }
      } else {
        if (spotted) {
          g.userData.spotTimer += dt;
          if (g.userData.spotTimer > 3) _triggerAlarm();
        } else {
          g.userData.spotTimer = Math.max(0, g.userData.spotTimer - dt * 2);
        }
      }
    }

    // Spawn 4 extra guards on alarm
    if (_alarmActive && !_spawnedExtraGuards) {
      _spawnedExtraGuards = true;
      for (var s = 0; s < 4; s++) {
        var ang = (s / 4) * Math.PI * 2;
        var eg = _makeCyl(0.4, 0.4, 1.8, 8, 0x552222);
        eg.position.set(Math.cos(ang) * 32, 0.9, Math.sin(ang) * 32);
        eg.userData = {
          type: 'guard', patrol: false, speed: 4,
          spottingPlayer: false, spotTimer: 0,
          downed: false, alerted: true
        };
        _scene.add(eg);
        _guards.push(eg);
      }
    }
  }

  // ── Dog AI ────────────────────────────────────────────────────────────────────
  function _updateDog(dt) {
    if (!_dog) return;
    _dog.userData.angle += (_dog.userData.speed / _dog.userData.orbitRadius) * dt;
    var nx = _dog.userData.center.x + Math.cos(_dog.userData.angle) * _dog.userData.orbitRadius;
    var nz = _dog.userData.center.z + Math.sin(_dog.userData.angle) * _dog.userData.orbitRadius;
    _dog.position.x = nx;
    _dog.position.z = nz;

    if (_dogChain) {
      var pos = _dogChain.geometry.attributes.position;
      pos.setXYZ(0, _dog.userData.center.x, 0.4, _dog.userData.center.z);
      pos.setXYZ(1, nx, 0.4, nz);
      pos.needsUpdate = true;
    }

    var ddx = nx - _player.position.x;
    var ddz = nz - _player.position.z;
    var dd = Math.sqrt(ddx * ddx + ddz * ddz);
    if (dd < 10) {
      _dogDetected = true;
      _dogBarkTimer -= dt;
      if (_dogBarkTimer <= 0) {
        _dogBarkTimer = 0.4;
        _playBark();
      }
      _triggerAlarm();
    } else {
      _dogDetected = false;
    }
  }

  function _triggerAlarm() {
    if (!_alarmActive) {
      _alarmActive = true;
      _showPrompt('!! ALARM TRIGGERED! GUARDS CONVERGING !!', 4);
      for (var i = 0; i < _scene.children.length; i++) {
        var c = _scene.children[i];
        if (c.userData && c.userData.type === 'searchlight') {
          c.color.setHex(0xFF2200);
          c.intensity = 1.2;
        }
      }
      for (var j = 0; j < _alarmBoxes.length; j++) {
        if (!_alarmBoxes[j].userData.disabled) {
          _alarmBoxes[j].material.emissive = new THREE.Color(0xFF2200);
          _alarmBoxes[j].material.emissiveIntensity = 0.5;
        }
      }
    }
  }

  // ── Prisoner following ────────────────────────────────────────────────────────
  function _updatePrisoners(dt) {
    for (var i = 0; i < _prisoners.length; i++) {
      var p = _prisoners[i];
      if (!p.userData.following) continue;

      var idx = _followingPrisoners.indexOf(p);
      var tgtX, tgtZ;
      if (idx === 0) {
        tgtX = _player.position.x;
        tgtZ = _player.position.z + 3;
      } else {
        var prev = _followingPrisoners[idx - 1];
        tgtX = prev.position.x;
        tgtZ = prev.position.z + 3;
      }

      var dx = tgtX - p.position.x;
      var dz = tgtZ - p.position.z;
      var d = Math.sqrt(dx * dx + dz * dz);
      if (d > 1) {
        p.position.x += (dx / d) * 4 * dt;
        p.position.z += (dz / d) * 4 * dt;
      }

      var distToPlayer = _dist2D(p.position, _player.position);
      if (distToPlayer > 22) {
        p.userData.following = false;
        var fi = _followingPrisoners.indexOf(p);
        if (fi >= 0) _followingPrisoners.splice(fi, 1);
        p.material.color.setHex(0xFF4400);
        _showPrompt('A prisoner was recaptured!', 3);
      }
    }
  }

  // ── Player movement ───────────────────────────────────────────────────────────
  function _updatePlayer(dt) {
    if (_drivingJeep) {
      _updateJeepDriving(dt);
      return;
    }

    var mx = 0, mz = 0;
    if (_keysDown['KeyW'] || _keysDown['ArrowUp']) mz -= 1;
    if (_keysDown['KeyS'] || _keysDown['ArrowDown']) mz += 1;
    if (_keysDown['KeyA'] || _keysDown['ArrowLeft']) mx -= 1;
    if (_keysDown['KeyD'] || _keysDown['ArrowRight']) mx += 1;
    if (_keysDown['KeyQ']) _cameraAngle -= 1.5 * dt;

    var len = Math.sqrt(mx * mx + mz * mz);
    if (len > 0) {
      mx /= len; mz /= len;
      var ca = _cameraAngle;
      var rx = mx * Math.cos(ca) + mz * Math.sin(ca);
      var rz = -mx * Math.sin(ca) + mz * Math.cos(ca);
      var spd = _crouching ? _playerSpeed * 0.5 : _playerSpeed;
      _player.position.x += rx * spd * dt;
      _player.position.z += rz * spd * dt;
      _player.rotation.y = Math.atan2(rx, rz);
    }

    _player.position.x = Math.max(-120, Math.min(120, _player.position.x));
    _player.position.z = Math.max(-120, Math.min(120, _player.position.z));

    if (_sewerMode) {
      _player.scale.set(1, 0.667, 1);
    } else {
      _player.scale.set(1, 1, 1);
    }

    _cameraFollow(_player.position);
  }

  function _cameraFollow(target) {
    _camera.position.x = target.x + Math.sin(_cameraAngle) * _cameraDistance;
    _camera.position.z = target.z + Math.cos(_cameraAngle) * _cameraDistance;
    _camera.position.y = _cameraHeight;
    _camera.lookAt(new THREE.Vector3(target.x, 1, target.z));
  }

  function _updateJeepDriving(dt) {
    if (!_jeep) return;
    if (_keysDown['KeyW'] || _keysDown['ArrowUp']) {
      _jeepVelocity.x += Math.sin(_jeepAngle) * _jeepSpeed * dt;
      _jeepVelocity.z += Math.cos(_jeepAngle) * _jeepSpeed * dt;
    }
    if (_keysDown['KeyS'] || _keysDown['ArrowDown']) {
      _jeepVelocity.x -= Math.sin(_jeepAngle) * _jeepSpeed * 0.6 * dt;
      _jeepVelocity.z -= Math.cos(_jeepAngle) * _jeepSpeed * 0.6 * dt;
    }
    if (_keysDown['KeyA'] || _keysDown['ArrowLeft']) _jeepAngle += 1.5 * dt;
    if (_keysDown['KeyD'] || _keysDown['ArrowRight']) _jeepAngle -= 1.5 * dt;

    _jeepVelocity.x *= 0.92;
    _jeepVelocity.z *= 0.92;

    _jeep.position.x += _jeepVelocity.x;
    _jeep.position.z += _jeepVelocity.z;
    _jeep.rotation.y = _jeepAngle;

    _player.position.x = _jeep.position.x;
    _player.position.z = _jeep.position.z;

    _cameraFollow(_jeep.position);

    var d = _dist2D(_jeep.position, { x: _northExtraction.x, z: _northExtraction.z });
    if (d < 8) _triggerVictory('JEEP EXTRACTION COMPLETE!');
  }

  // ── Interactions ──────────────────────────────────────────────────────────────
  function _checkInteractions() {
    if (_gameOver || _gameWon) return;
    var px = _player.position.x;
    var pz = _player.position.z;

    // Keycard (E)
    if (_keycard && !_hasKeycard) {
      var kd = _dist2D({ x: px, z: pz }, _keycard.position);
      if (kd < 3) {
        _showPrompt('[E] Pick up keycard', 0.5);
        if (_keysDown['_e_pressed']) {
          _hasKeycard = true;
          _scene.remove(_keycard);
          _keycard = null;
          _showPrompt('Keycard obtained! Open the cell block with [E]', 3);
          _keysDown['_e_pressed'] = false;
        }
      }
    }

    // Cell door (E)
    if (_cellDoor && !_cellDoorOpen) {
      var cdd = _dist2D({ x: px, z: pz }, _cellDoor.position);
      if (cdd < 3) {
        if (_hasKeycard) {
          _showPrompt('[E] Open cell block', 0.5);
          if (_keysDown['_e_pressed']) {
            _cellDoorOpen = true;
            _scene.remove(_cellDoor);
            _cellDoor = null;
            _showPrompt('Cell block open! Free the prisoners with [E]!', 3);
            _keysDown['_e_pressed'] = false;
          }
        } else {
          _showPrompt('Need keycard! Check guard office.', 0.5);
        }
      }
    }

    // Free prisoners (E, within 3 units)
    if (_cellDoorOpen) {
      for (var pi = 0; pi < _prisoners.length; pi++) {
        var p = _prisoners[pi];
        if (p.userData.freed) continue;
        var pd = _dist2D({ x: px, z: pz }, p.position);
        if (pd < 3) {
          _showPrompt('[E] Free prisoner ' + (pi + 1), 0.5);
          if (_keysDown['_e_pressed']) {
            p.userData.freed = true;
            p.userData.following = true;
            p.material.color.setHex(0xAABB77);
            _followingPrisoners.push(p);
            _freedPrisoners++;
            _showPrompt('Prisoner ' + _freedPrisoners + '/' + _totalPrisoners + ' freed!', 2);
            _keysDown['_e_pressed'] = false;
            if (_freedPrisoners === _totalPrisoners && _commander) {
              _showPrompt('All prisoners freed! Commander at gate — [H] accept or [N] reject exchange', 6);
            }
          }
          break;
        }
      }
    }

    // Sewer grate (E, EAST route)
    var sgd = _dist2D({ x: px, z: pz }, _sewerEntry);
    if (sgd < 3 && !_sewerMode && _selectedRoute === 'EAST') {
      _showPrompt('[E] Enter sewer tunnel (30-unit crawl)', 0.5);
      if (_keysDown['_e_pressed']) {
        _sewerMode = true;
        _player.position.y = -4.5;
        _player.position.x = _sewerEntry.x + 2;
        _crouching = true;
        _showPrompt('Sewer crawl! Head east 30 units to exit.', 4);
        _keysDown['_e_pressed'] = false;
      }
    }

    // Sewer exit
    if (_sewerMode) {
      var sexd = _dist2D({ x: px, z: pz }, _sewerExit);
      if (sexd < 5) {
        _sewerMode = false;
        _crouching = false;
        _player.position.y = 0.9;
        _triggerVictory('SEWER EXTRACTION COMPLETE!');
      }
    }

    // Helicopter LZ (E, WEST route)
    var hld = Math.sqrt(
      Math.pow(px - _heliLZ.x, 2) + Math.pow(pz - _heliLZ.z, 2)
    );
    if (hld < 5 && _selectedRoute === 'WEST' && !_heliCalled) {
      _showPrompt('[E] Call helicopter (arrives 30s)', 0.5);
      if (_keysDown['_e_pressed']) {
        _heliCalled = true;
        _heliTimer = 0;
        _showPrompt('Helicopter en route! 30 seconds...', 4);
        _keysDown['_e_pressed'] = false;
      }
    }

    // Jeep (V)
    if (_jeep) {
      var jd = _dist2D({ x: px, z: pz }, _jeep.position);
      if (jd < 5 && !_drivingJeep) {
        _showPrompt('[V] Enter jeep (fits 6)', 0.5);
        if (_keysDown['KeyV']) {
          _drivingJeep = true;
          _jeepOccupants = 1 + _followingPrisoners.length;
          _showPrompt('Driving jeep! (' + _jeepOccupants + ' aboard) Head to extraction!', 4);
          _keysDown['KeyV'] = false;
        }
      }
    }

    // Exit jeep (X)
    if (_drivingJeep && _keysDown['KeyX']) {
      _drivingJeep = false;
      _keysDown['KeyX'] = false;
      _showPrompt('Exited jeep', 2);
    }

    // Disguise from body (G)
    for (var gi = 0; gi < _guardBodies.length; gi++) {
      var body = _guardBodies[gi];
      var bd = _dist2D({ x: px, z: pz }, body.position);
      if (bd < 2.5 && !body.userData.uniformTaken) {
        _showPrompt('[G] Grab guard uniform (120s disguise)', 0.5);
        if (_keysDown['KeyG']) {
          body.userData.uniformTaken = true;
          _disguised = true;
          _disguiseTimer = 120;
          _player.material.color.setHex(0x334433);
          _showPrompt('Disguise active for 120s!', 3);
          _keysDown['KeyG'] = false;
        }
      }
    }

    // Take down guard (SPACE)
    for (var gj = 0; gj < _guards.length; gj++) {
      var guard = _guards[gj];
      if (guard.userData.downed) continue;
      var gdd = _dist2D({ x: px, z: pz }, guard.position);
      if (gdd < 2) {
        _showPrompt('[SPACE] Take down guard', 0.5);
        if (_keysDown['Space']) {
          guard.userData.downed = true;
          guard.position.y = -0.4;
          guard.rotation.z = Math.PI / 2;
          guard.material.color.setHex(0x222211);
          _guardBodies.push(guard);
          _showPrompt('Guard down! Grab uniform with [G]', 3);
          _keysDown['Space'] = false;
          break;
        }
      }
    }

    // Shoot alarm box (X, range 8)
    for (var ai = 0; ai < _alarmBoxes.length; ai++) {
      var abox = _alarmBoxes[ai];
      if (abox.userData.disabled) continue;
      var abd = _dist2D({ x: px, z: pz }, abox.position);
      if (abd < 8) {
        _showPrompt('[X] Shoot alarm box', 0.5);
        if (_keysDown['KeyX']) {
          abox.userData.disabled = true;
          abox.material.color.setHex(0x444444);
          abox.material.emissiveIntensity = 0;
          _keysDown['KeyX'] = false;
          var allOff = true;
          for (var aj = 0; aj < _alarmBoxes.length; aj++) {
            if (!_alarmBoxes[aj].userData.disabled) { allOff = false; break; }
          }
          if (allOff) {
            _alarmActive = false;
            _showPrompt('All alarms disabled!', 3);
          }
          break;
        }
      }
    }

    // Hostage exchange (H/N keys)
    if (_commander && _commander.userData.active && !_exchangeResolved && _freedPrisoners === _totalPrisoners) {
      var comd = _dist2D({ x: px, z: pz }, _commander.position);
      if (comd < 6) {
        if (!_exchangeOffered) {
          _exchangeOffered = true;
          _showPrompt('Commander: trade 1 prisoner? [H] Accept (+100pts) | [N] Reject (firefight)', 8);
        }
        if (_exchangeOffered) {
          if (_keysDown['KeyH']) {
            _exchangeResolved = true;
            var traded = _followingPrisoners.shift();
            if (traded) {
              traded.userData.following = false;
              traded.material.color.setHex(0x00FF44);
            }
            _showPrompt('Exchange accepted. 1 prisoner traded, passage secured. +100pts', 5);
            _commander.userData.active = false;
            _keysDown['KeyH'] = false;
          } else if (_keysDown['KeyN']) {
            _exchangeResolved = true;
            _triggerAlarm();
            _showPrompt('Exchange rejected! Firefight!', 3);
            _keysDown['KeyN'] = false;
          }
        }
      }
    }

    // Route select (R)
    if (_keysDown['_r_pressed']) {
      var routes = ['NORTH', 'EAST', 'WEST'];
      var ri = routes.indexOf(_selectedRoute);
      _selectedRoute = routes[(ri + 1) % 3];
      _showPrompt('Route: ' + _selectedRoute, 2);
      _keysDown['_r_pressed'] = false;
    }

    // On-foot extraction (NORTH)
    if (!_drivingJeep && _selectedRoute === 'NORTH') {
      var nd = _dist2D({ x: px, z: pz }, { x: _northExtraction.x, z: _northExtraction.z });
      if (nd < 8 && _freedPrisoners > 0) {
        _triggerVictory('NORTH EXTRACTION COMPLETE!');
      }
    }
  }

  function _triggerVictory(msg) {
    if (!_gameWon) {
      _gameWon = true;
      _showPrompt(msg + ' Freed: ' + _freedPrisoners + '/' + _totalPrisoners + ' — MISSION SUCCESS!', 12);
    }
  }

  // ── Helicopter countdown ──────────────────────────────────────────────────────
  function _updateHelicopter(dt) {
    if (!_heliCalled || _heliArrived) return;
    _heliTimer += dt;
    if (_heliTimer >= 30) {
      _heliArrived = true;
      if (!_heliMesh) {
        _heliMesh = _makeBox(6, 2, 10, 0x223344);
        _heliMesh.position.set(_heliLZ.x, _heliLZ.y + 4, _heliLZ.z);
        _scene.add(_heliMesh);
      }
      _showPrompt('Helicopter arrived! Reach the rooftop LZ!', 5);
      var hd = Math.sqrt(
        Math.pow(_player.position.x - _heliLZ.x, 2) +
        Math.pow(_player.position.z - _heliLZ.z, 2)
      );
      if (hd < 6) {
        _triggerVictory('HELICOPTER EXTRACTION!');
      }
    }
  }

  // ── Disguise timer ────────────────────────────────────────────────────────────
  function _updateDisguise(dt) {
    if (!_disguised) return;
    _disguiseTimer -= dt;
    if (_disguiseTimer <= 0) {
      _disguised = false;
      _player.material.color.setHex(0x2244AA);
      _showPrompt('Disguise worn off!', 3);
    }
  }

  // ── Extraction countdown ──────────────────────────────────────────────────────
  function _updateExtraction(dt) {
    if (_gameWon || _gameOver) return;
    _extractionTimer -= dt;
    if (_extractionTimer <= 0) {
      _extractionTimer = 0;
      _gameOver = true;
      _showPrompt('TIME UP! MISSION FAILED!', 12);
    }
  }

  // ── Visual updates ────────────────────────────────────────────────────────────
  function _updateVisuals(dt) {
    if (_keycard) {
      _keycard.rotation.y += dt * 2.5;
      _keycard.position.y = 3.3 + 0.15 * Math.sin(Date.now() * 0.003);
    }
    if (_extractionZone) {
      _extractionZone.rotation.y += dt * 0.4;
      var s = 1 + 0.08 * Math.sin(Date.now() * 0.004);
      _extractionZone.scale.set(s, 1, s);
    }
    if (_alarmActive) {
      var flash = 0.4 + 0.4 * Math.abs(Math.sin(Date.now() * 0.006));
      for (var i = 0; i < _alarmBoxes.length; i++) {
        if (!_alarmBoxes[i].userData.disabled && _alarmBoxes[i].material.emissive) {
          _alarmBoxes[i].material.emissiveIntensity = flash;
        }
      }
    }
  }

  // ── Prompt fade ───────────────────────────────────────────────────────────────
  function _updatePrompt(dt) {
    if (_promptTimer > 0) {
      _promptTimer -= dt;
      if (_promptTimer <= 0 && _promptElement) {
        _promptElement.style.display = 'none';
      }
    }
  }

  // ── Main game loop ────────────────────────────────────────────────────────────
  function _gameLoop() {
    if (!_active) return;
    requestAnimationFrame(_gameLoop);

    var dt = Math.min(_clock.getDelta(), 0.05);

    _updatePlayer(dt);
    _updateGuards(dt);
    _updateDog(dt);
    _updatePrisoners(dt);
    _updateDisguise(dt);
    _updateExtraction(dt);
    _updateHelicopter(dt);
    _checkInteractions();
    _updateVisuals(dt);
    _updatePrompt(dt);
    _updateHUD();

    _renderer.render(_scene, _camera);
  }

  // ── Key events ────────────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    _keysDown[e.code] = true;
    _keyTimestamps[e.code] = Date.now();

    if (e.code === 'KeyP') _pTime = Date.now();
    if (e.code === 'KeyB') _bTime = Date.now();

    if (!_active) {
      _checkActivation();
      return;
    }

    if (e.code === 'KeyE') _keysDown['_e_pressed'] = true;
    if (e.code === 'KeyR') _keysDown['_r_pressed'] = true;
    if (e.code === 'Escape') reset();
  }

  function _onKeyUp(e) {
    _keysDown[e.code] = false;
  }

  function _checkActivation() {
    if (_keysDown['KeyP'] && _keysDown['KeyB']) {
      var diff = Math.abs(_pTime - _bTime);
      if (diff < 400) init();
    }
  }

  function _onResize() {
    if (!_active) return;
    _camera.aspect = window.innerWidth / window.innerHeight;
    _camera.updateProjectionMatrix();
    _renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ── Init ──────────────────────────────────────────────────────────────────────
  function init() {
    if (_active) return;
    _active = true;

    _prisoners = [];
    _guards = [];
    _alarmActive = false;
    _disguised = false;
    _alarmBoxes = [];
    _jeep = null;
    _dog = null;
    _guardDogs = [];
    _alarmTimer = 0;
    _disguiseTimer = 0;
    _hasKeycard = false;
    _cellDoorOpen = false;
    _freedPrisoners = 0;
    _selectedRoute = 'NORTH';
    _extractionTimer = 180;
    _gameOver = false;
    _gameWon = false;
    _guardBodies = [];
    _followingPrisoners = [];
    _spawnedExtraGuards = false;
    _keycard = null;
    _cellDoor = null;
    _commander = null;
    _exchangeOffered = false;
    _exchangeResolved = false;
    _dogChain = null;
    _sewerMode = false;
    _heliCalled = false;
    _heliTimer = 0;
    _heliArrived = false;
    _heliMesh = null;
    _drivingJeep = false;
    _jeepSpeed = 12;
    _jeepVelocity = { x: 0, z: 0 };
    _jeepAngle = 0;
    _jeepOccupants = 0;
    _cameraAngle = 0;
    _crouching = false;
    _dogDetected = false;
    _dogBarkTimer = 0;
    _keysDown = {};
    _keyTimestamps = {};
    _pTime = 0;
    _bTime = 0;
    _group = null;
    _extractionZone = null;

    _container = document.createElement('div');
    _container.id = 'prison-break-container';
    _container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9000;background:#000;';
    document.body.appendChild(_container);

    _renderer = new THREE.WebGLRenderer({ antialias: true });
    _renderer.setSize(window.innerWidth, window.innerHeight);
    _renderer.shadowMap.enabled = false;
    _container.appendChild(_renderer.domElement);

    _scene = new THREE.Scene();
    _scene.background = new THREE.Color(0x0a1a0a);
    _scene.fog = new THREE.Fog(0x0a1a0a, 70, 140);

    _camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 400);
    _camera.position.set(0, _cameraHeight, 20 + _cameraDistance);

    _clock = new THREE.Clock();

    _initAudio();
    _buildPrison();
    _buildGuards();
    _buildPlayer();
    _buildHUD();

    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup', _onKeyUp);
    window.addEventListener('resize', _onResize);

    _showPrompt('PRISON BREAK — WASD:move  E:interact  G:uniform  V:jeep  X:shoot/exit  H/N:exchange  R:route  SPACE:takedown  Q:cam  ESC:quit', 10);

    _gameLoop();
  }

  // ── Update (external hook) ────────────────────────────────────────────────────
  function update(dt) {
    // External hook — internal loop is self-contained
  }

  // ── Reset ─────────────────────────────────────────────────────────────────────
  function reset() {
    _active = false;

    window.removeEventListener('keydown', _onKeyDown);
    window.removeEventListener('keyup', _onKeyUp);
    window.removeEventListener('resize', _onResize);

    if (_renderer) { _renderer.dispose(); _renderer = null; }
    if (_container && _container.parentNode) {
      _container.parentNode.removeChild(_container);
      _container = null;
    }
    if (_hud && _hud.parentNode) {
      _hud.parentNode.removeChild(_hud);
      _hud = null;
    }
    if (_promptElement && _promptElement.parentNode) {
      _promptElement.parentNode.removeChild(_promptElement);
      _promptElement = null;
    }
    if (_audioCtx) {
      try { _audioCtx.close(); } catch (e) { /* silence */ }
      _audioCtx = null;
    }

    _scene = null;
    _camera = null;
    _clock = null;
    _prisoners = [];
    _guards = [];
    _alarmBoxes = [];
    _guardBodies = [];
    _followingPrisoners = [];
    _guardDogs = [];
    _keycard = null;
    _cellDoor = null;
    _jeep = null;
    _dog = null;
    _dogChain = null;
    _extractionZone = null;
    _commander = null;
    _heliMesh = null;
    _keysDown = {};
    _keyTimestamps = {};
  }

  return { init: init, update: update, reset: reset };

})();
