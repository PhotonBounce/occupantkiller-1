/* ───────────────────────────────────────────────────────────────────────────
   robot-uprising.js — Factory Floor Robot Uprising
   API: window.RobotUprising = { init, update, reset }
   Controls:
     R + B (together, 400ms)  → launch mission
     WASD                     → move player
     Mouse                    → look around
     Left Click / Space       → shoot
     E (near terminal/core)   → interact / hack / insert kill switch
   ─────────────────────────────────────────────────────────────────────────── */
window.RobotUprising = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Activation keys ───────────────────────────────────────────────────── */
  var _keyR = false;
  var _keyB = false;
  var _rTime = 0;
  var _bTime = 0;
  var ACTIVATE_WINDOW = 400;

  /* ── Game state ────────────────────────────────────────────────────────── */
  var _active          = false;
  var _gameOver        = false;
  var _gameWon         = false;
  var _missionTimer    = 300; // 5 minutes countdown
  var _waveTimer       = 60;  // wave every 60s
  var _waveCount       = 0;

  /* ── Player ────────────────────────────────────────────────────────────── */
  var _playerHP        = 100;
  var _playerMaxHP     = 100;
  var _stunTimer       = 0;
  var _keys            = {};
  var _yaw             = 0;
  var _pitch           = 0;
  var _mouseLocked     = false;
  var _lastTime        = 0;
  var _shootCooldown   = 0;
  var _grenades        = 0;
  var _hasRifle        = false;

  /* ── Kill switch ───────────────────────────────────────────────────────── */
  var _killSwitchArmed   = true;
  var _killSwitchInserted = false;
  var _insertTimer       = 0;
  var _insertHolding     = false;

  /* ── AI core / shields ─────────────────────────────────────────────────── */
  var _aiCore          = null;
  var _aiCoreMesh      = null;
  var _shieldGenerators = []; // { mesh, alive, hp }
  var _shieldsDown     = 0;

  /* ── Robots ────────────────────────────────────────────────────────────── */
  var _robots          = []; // { mesh, type, hp, maxHp, alive, state, stateTimer, vel }
  var _robotCount      = 0;

  /* ── Projectiles ───────────────────────────────────────────────────────── */
  var _bullets         = []; // { mesh, vel, lifetime }
  var _sparkBursts     = []; // { mesh, vel, lifetime } robot sparks
  var _laserLines      = []; // { mesh, lifetime }

  /* ── Environment ───────────────────────────────────────────────────────── */
  var _conveyors       = []; // { group, partMeshes, speed }
  var _workStations    = []; // { group, sparkLines }
  var _crane           = null;
  var _craneAngle      = 0;
  var _serverRoom      = null;
  var _serverLights    = []; // { light, timer, phase }
  var _tunnels         = [];
  var _terminals       = []; // { mesh, id, used }
  var _armoryBox       = null;
  var _armoryUnlocked  = false;

  /* ── Hazards ───────────────────────────────────────────────────────────── */
  var _liveWires       = []; // { mesh, timer }
  var _coolantPools    = []; // { mesh }
  var _fallingBeams    = []; // { shadow, beam, state, timer, dropped }
  var _beamSpawnTimer  = 0;
  var _conveyorHazard  = true; // section A conveyor hazard
  var _gasStunTimer    = 0;    // room B stun active
  var _sprinklersOn    = false;

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  var _hud             = null;
  var _toast           = null;
  var _crosshair       = null;
  var _overlay         = null;

  /* ── Crane swing ───────────────────────────────────────────────────────── */
  var _craneGroup      = null;
  var _craneHookGroup  = null;
  var _craneSwing      = 0;
  var _craneSwingVel   = 0;

  /* ── Helpers ───────────────────────────────────────────────────────────── */
  function _clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  function _randRange(lo, hi) { return lo + Math.random() * (hi - lo); }

  function _dist(a, b) { return a.distanceTo(b); }

  function _pos() { return _camera ? _camera.position : new THREE.Vector3(); }

  function _boxMesh(w, h, d, color, emissive) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    if (emissive !== undefined) { mat.emissive = new THREE.Color(emissive); mat.emissiveIntensity = 0.5; }
    return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  }

  function _cylMesh(rt, rb, h, segs, color) {
    return new THREE.Mesh(
      new THREE.CylinderGeometry(rt, rb, h, segs),
      new THREE.MeshLambertMaterial({ color: color })
    );
  }

  function _sphereMesh(r, segs, color) {
    return new THREE.Mesh(
      new THREE.SphereGeometry(r, segs, segs),
      new THREE.MeshLambertMaterial({ color: color })
    );
  }

  function _showToast(txt, col) {
    if (!_toast) return;
    _toast.textContent = txt;
    _toast.style.color = col || '#fff';
    _toast.style.opacity = '1';
    clearTimeout(_toast._hide);
    _toast._hide = setTimeout(function () { _toast.style.opacity = '0'; }, 3000);
  }

  function _makeLineSegments(points, color) {
    var geo = new THREE.BufferGeometry();
    var verts = [];
    for (var i = 0; i < points.length; i++) { verts.push(points[i].x, points[i].y, points[i].z); }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: color }));
  }

  function _makeSparkArc(cx, cy, cz, color) {
    var pts = [];
    var x = cx, y = cy, z = cz;
    for (var s = 0; s < 6; s++) {
      pts.push(new THREE.Vector3(x, y, z));
      x += _randRange(-0.4, 0.4);
      y += _randRange(-0.1, 0.3);
      z += _randRange(-0.4, 0.4);
      pts.push(new THREE.Vector3(x, y, z));
    }
    return _makeLineSegments(pts, color);
  }

  /* ── Build environment ─────────────────────────────────────────────────── */
  function _buildFactory() {
    // Floor
    var floor = _boxMesh(80, 0.5, 80, 0x222233);
    floor.position.set(0, -0.25, 0);
    _scene.add(floor);

    // Outer walls
    var wallMat = new THREE.MeshLambertMaterial({ color: 0x333344 });
    var wallData = [
      [80, 8, 1, 0, 4, -40],
      [80, 8, 1, 0, 4, 40],
      [1, 8, 80, -40, 4, 0],
      [1, 8, 80, 40, 4, 0]
    ];
    for (var wi = 0; wi < wallData.length; wi++) {
      var wd = wallData[wi];
      var wm = new THREE.Mesh(new THREE.BoxGeometry(wd[0], wd[1], wd[2]), wallMat);
      wm.position.set(wd[3], wd[4], wd[5]);
      _scene.add(wm);
    }

    // Ceiling
    var ceiling = _boxMesh(80, 0.5, 80, 0x222233);
    ceiling.position.set(0, 8.25, 0);
    _scene.add(ceiling);

    // ── Assembly line conveyors (section A, Z=-10 to Z=10) ──
    var conveyorPositions = [
      [-15, 0, -5], [-15, 0, 5],
      [-5, 0, -5],  [-5, 0, 5]
    ];
    for (var ci = 0; ci < conveyorPositions.length; ci++) {
      var cp = conveyorPositions[ci];
      var cGroup = new THREE.Group();
      var cBase = _boxMesh(8, 0.4, 1.5, 0x444455);
      cBase.position.y = 0.2;
      cGroup.add(cBase);
      // Moving parts on conveyor
      var parts = [];
      for (var pi = 0; pi < 3; pi++) {
        var part = _boxMesh(0.8, 0.5, 0.8, 0x556677);
        part.position.set(-3 + pi * 3, 0.65, 0);
        cGroup.add(part);
        parts.push(part);
      }
      cGroup.position.set(cp[0], cp[1], cp[2]);
      _scene.add(cGroup);
      _conveyors.push({ group: cGroup, partMeshes: parts, speed: 2, baseX: cp[0] });
    }

    // ── 6 work stations ──
    var wsPositions = [
      [5, 0, -15], [15, 0, -15],
      [5, 0, 0],   [15, 0, 0],
      [5, 0, 15],  [15, 0, 15]
    ];
    for (var wsi = 0; wsi < wsPositions.length; wsi++) {
      var wsp = wsPositions[wsi];
      var wsGroup = new THREE.Group();
      var wsBase = _boxMesh(3, 1, 2, 0x555566);
      wsBase.position.y = 0.5;
      wsGroup.add(wsBase);
      var wsTop = _boxMesh(3, 0.2, 2, 0x667788);
      wsTop.position.y = 1.1;
      wsGroup.add(wsTop);
      // Sparking arc decorations
      var sparkLines = [];
      for (var spk = 0; spk < 3; spk++) {
        var arc = _makeSparkArc(0, 1.2, 0, 0x44FFFF);
        wsGroup.add(arc);
        sparkLines.push({ line: arc, timer: Math.random() * 0.3 });
      }
      wsGroup.position.set(wsp[0], wsp[1], wsp[2]);
      _scene.add(wsGroup);
      _workStations.push({ group: wsGroup, sparkLines: sparkLines });
    }

    // ── Overhead crane (CylinderGeometry rail + BoxGeometry hook) ──
    _craneGroup = new THREE.Group();
    var craneRail = _cylMesh(0.3, 0.3, 60, 8, 0x556677);
    craneRail.rotation.z = Math.PI / 2;
    craneRail.position.set(0, 7.5, 0);
    _craneGroup.add(craneRail);
    _craneHookGroup = new THREE.Group();
    var craneArm = _boxMesh(0.3, 3, 0.3, 0x556677);
    craneArm.position.y = -1.5;
    _craneHookGroup.add(craneArm);
    var craneHook = _boxMesh(0.8, 0.5, 0.5, 0x778899);
    craneHook.position.y = -3.2;
    _craneHookGroup.add(craneHook);
    _craneHookGroup.position.set(0, 7.5, 0);
    _scene.add(_craneGroup);
    _scene.add(_craneHookGroup);

    // ── Server room (Z: -35 to -25, X: 20 to 35) ──
    var serverRoom = _boxMesh(15, 6, 10, 0x334455);
    serverRoom.position.set(27, 3, -30);
    _scene.add(serverRoom);
    _serverRoom = serverRoom;
    // Blinking lights inside server room
    var lightColors = [0x0044FF, 0x440000];
    for (var sli = 0; sli < 6; sli++) {
      var sl = new THREE.PointLight(lightColors[sli % 2], 1.5, 8);
      sl.position.set(20 + sli * 2.5, 4, -30);
      _scene.add(sl);
      _serverLights.push({ light: sl, timer: Math.random() * 1.0, phase: sli % 2 });
    }

    // ── Maintenance tunnels ──
    var tunnelData = [
      [2, 2, 20, -20, 1, 0],
      [2, 2, 20, 10, 1, -20],
      [20, 2, 2, 0, 1, -35]
    ];
    for (var ti = 0; ti < tunnelData.length; ti++) {
      var td = tunnelData[ti];
      var tMesh = _boxMesh(td[0], td[1], td[2], 0x333344);
      tMesh.position.set(td[3], td[4], td[5]);
      _scene.add(tMesh);
      _tunnels.push(tMesh);
    }

    // ── AI core chamber (Z: 15 to 30, X: -15 to 0) ──
    var aiChamber = _boxMesh(15, 6, 15, 0x112233);
    aiChamber.position.set(-7, 3, 22);
    _scene.add(aiChamber);

    // Central pillar (glowing)
    var pillar = _cylMesh(0.8, 0.8, 5, 12, 0x0044FF);
    pillar.position.set(-7, 2.5, 22);
    _scene.add(pillar);
    // Glowing point light at pillar
    var pillarLight = new THREE.PointLight(0x0044FF, 2, 15);
    pillarLight.position.set(-7, 5, 22);
    _scene.add(pillarLight);

    // AI Core itself (CylinderGeometry, emissive blue)
    var aiCoreMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.5, 3, 16),
      new THREE.MeshLambertMaterial({ color: 0x0044FF, emissive: new THREE.Color(0x002266), emissiveIntensity: 0.8 })
    );
    aiCoreMesh.position.set(-7, 4, 22);
    _scene.add(aiCoreMesh);
    _aiCoreMesh = aiCoreMesh;
    _aiCore = { mesh: aiCoreMesh, pos: new THREE.Vector3(-7, 4, 22) };

    // Shield generators (4 corners around core)
    var sgOffsets = [[-4, 0, -4], [4, 0, -4], [-4, 0, 4], [4, 0, 4]];
    for (var sgi = 0; sgi < 4; sgi++) {
      var sgPos = sgOffsets[sgi];
      var sgMesh = _boxMesh(1, 2, 1, 0x002244);
      sgMesh.position.set(-7 + sgPos[0], 1, 22 + sgPos[2]);
      _scene.add(sgMesh);
      var sgLight = new THREE.PointLight(0x0044FF, 1, 6);
      sgLight.position.set(-7 + sgPos[0], 2.5, 22 + sgPos[2]);
      _scene.add(sgLight);
      _shieldGenerators.push({ mesh: sgMesh, light: sgLight, hp: 60, alive: true });
    }

    // ── Hackable terminals ──
    var termPositions = [
      [-15, 0, -2,  1],   // Terminal 1: disable conveyor
      [2,   0, -8,  2],   // Terminal 2: vent gas
      [18,  0, 10,  3],   // Terminal 3: sprinklers
      [30,  0, 5,   4]    // Terminal 4: unlock armory
    ];
    for (var tmi = 0; tmi < termPositions.length; tmi++) {
      var tp = termPositions[tmi];
      var tMesh = _boxMesh(0.8, 1.5, 0.5, 0x445566);
      tMesh.position.set(tp[0], 0.75, tp[2]);
      _scene.add(tMesh);
      var tScreen = _boxMesh(0.7, 0.6, 0.1, 0x00FF44);
      tScreen.position.set(tp[0], 1.3, tp[2] + 0.3);
      _scene.add(tScreen);
      _terminals.push({ mesh: tMesh, id: tp[3], used: false, pos: new THREE.Vector3(tp[0], 0.75, tp[2]) });
    }

    // ── Armory box (locked until terminal 4 used) ──
    var armBox = _boxMesh(2, 1, 1, 0x664422);
    armBox.position.set(32, 0.5, 5);
    _scene.add(armBox);
    _armoryBox = armBox;

    // ── Ambient lights ──
    _scene.add(new THREE.AmbientLight(0x223344, 0.6));
    var factLight1 = new THREE.PointLight(0x334455, 1.5, 40);
    factLight1.position.set(0, 7, 0);
    _scene.add(factLight1);
    var factLight2 = new THREE.PointLight(0x334455, 1.2, 30);
    factLight2.position.set(25, 7, -25);
    _scene.add(factLight2);
  }

  /* ── Build hazards ─────────────────────────────────────────────────────── */
  function _buildHazards() {
    // Live wires (yellow sparking lines)
    var wirePositions = [
      [-10, 0.5, 10],
      [-5, 0.5, -10],
      [20, 0.5, -5]
    ];
    for (var lwi = 0; lwi < wirePositions.length; lwi++) {
      var lwp = wirePositions[lwi];
      var wireLine = _makeSparkArc(lwp[0], lwp[1], lwp[2], 0xFFFF00);
      _scene.add(wireLine);
      _liveWires.push({ mesh: wireLine, timer: 0, pos: new THREE.Vector3(lwp[0], lwp[1], lwp[2]) });
    }

    // Boiling coolant pools
    var coolantPositions = [[10, 0.05, 5], [8, 0.05, -10]];
    for (var cpi = 0; cpi < coolantPositions.length; cpi++) {
      var cpp = coolantPositions[cpi];
      var cpMesh = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.1, 4),
        new THREE.MeshLambertMaterial({ color: 0x44BBFF, transparent: true, opacity: 0.7 })
      );
      cpMesh.position.set(cpp[0], cpp[1], cpp[2]);
      _scene.add(cpMesh);
      _coolantPools.push({ mesh: cpMesh, pos: new THREE.Vector3(cpp[0], 0, cpp[2]) });
    }
  }

  /* ── Spawn robots ──────────────────────────────────────────────────────── */
  function _spawnRobot(type, x, z) {
    var rGroup = new THREE.Group();
    var hp = 80;
    var maxHp = 80;

    if (type === 'welder') {
      var body = _boxMesh(1, 2, 0.8, 0x445566);
      body.position.y = 1;
      rGroup.add(body);
      var head = _boxMesh(0.7, 0.7, 0.7, 0x556677);
      head.position.y = 2.35;
      rGroup.add(head);
      // Welder arm
      var arm = _boxMesh(0.2, 1, 0.2, 0x445566);
      arm.position.set(0.6, 1.3, 0);
      rGroup.add(arm);
      hp = 80; maxHp = 80;
    } else if (type === 'assembler') {
      var abody = _cylMesh(0.5, 0.6, 2, 8, 0x556677);
      abody.position.y = 1;
      rGroup.add(abody);
      var ahead = _sphereMesh(0.4, 6, 0x667788);
      ahead.position.y = 2.2;
      rGroup.add(ahead);
      var armL = _boxMesh(0.2, 1.4, 0.2, 0x556677);
      armL.position.set(-0.8, 1.2, 0);
      rGroup.add(armL);
      var armR = _boxMesh(0.2, 1.4, 0.2, 0x556677);
      armR.position.set(0.8, 1.2, 0);
      rGroup.add(armR);
      hp = 120; maxHp = 120;
    } else if (type === 'forklift') {
      var fbody = _boxMesh(3, 2, 4, 0x886633);
      fbody.position.y = 1;
      rGroup.add(fbody);
      var fcab = _boxMesh(2, 1.5, 1.5, 0x997744);
      fcab.position.set(0, 2.25, -1);
      rGroup.add(fcab);
      // Forks
      var forkL = _boxMesh(0.2, 0.2, 2.5, 0x665522);
      forkL.position.set(-0.7, 0.6, 1.5);
      rGroup.add(forkL);
      var forkR = _boxMesh(0.2, 0.2, 2.5, 0x665522);
      forkR.position.set(0.7, 0.6, 1.5);
      rGroup.add(forkR);
      // Wheels
      var wfl = _cylMesh(0.5, 0.5, 0.3, 8, 0x333333);
      wfl.rotation.z = Math.PI / 2;
      wfl.position.set(-1.6, 0.5, 1.5);
      rGroup.add(wfl);
      var wfr = _cylMesh(0.5, 0.5, 0.3, 8, 0x333333);
      wfr.rotation.z = Math.PI / 2;
      wfr.position.set(1.6, 0.5, 1.5);
      rGroup.add(wfr);
      hp = 200; maxHp = 200;
    } else if (type === 'security') {
      var sbody = _sphereMesh(0.7, 8, 0x334455);
      sbody.position.y = 1.5;
      rGroup.add(sbody);
      var seye = _boxMesh(0.4, 0.15, 0.1, 0xFF0000);
      seye.position.set(0, 1.7, 0.72);
      rGroup.add(seye);
      hp = 60; maxHp = 60;
    }

    rGroup.position.set(x, 0, z);
    _scene.add(rGroup);
    _robots.push({
      mesh: rGroup,
      type: type,
      hp: hp,
      maxHp: maxHp,
      alive: true,
      state: 'patrol',
      stateTimer: 0,
      vel: new THREE.Vector3(),
      attackCooldown: 0,
      yOscPhase: Math.random() * Math.PI * 2,
      chargeDir: new THREE.Vector3()
    });
    _robotCount++;
  }

  function _spawnInitialRobots() {
    _spawnRobot('welder',   -20, 10);
    _spawnRobot('welder',   -10, -15);
    _spawnRobot('assembler', 5, 15);
    _spawnRobot('assembler', 15, -10);
    _spawnRobot('forklift', -5, -20);
    _spawnRobot('security', 20, 20);
    _spawnRobot('security', -18, -18);
  }

  function _spawnWave() {
    _waveCount++;
    var count = 3 + _waveCount;
    var types = ['welder', 'assembler', 'forklift', 'security'];
    for (var wi = 0; wi < count; wi++) {
      var type = types[Math.floor(Math.random() * types.length)];
      var spawnX = _randRange(-35, 35);
      var spawnZ = _randRange(-35, 35);
      // Don't spawn near player
      var pp = _pos();
      if (Math.abs(spawnX - pp.x) < 8 && Math.abs(spawnZ - pp.z) < 8) {
        spawnX += 15;
      }
      _spawnRobot(type, spawnX, spawnZ);
    }
    _showToast('WAVE ' + _waveCount + ' — ' + count + ' ROBOTS INCOMING!', '#FF4444');
    // Hazard escalation
    if (_conveyorHazard) {
      for (var cIdx = 0; cIdx < _conveyors.length; cIdx++) {
        _conveyors[cIdx].speed = 2 + _waveCount * 0.5;
      }
    }
  }

  /* ── Build HUD ─────────────────────────────────────────────────────────── */
  function _buildHUD() {
    _hud = document.createElement('div');
    _hud.style.cssText = 'position:fixed;top:8px;left:8px;color:#00FF99;font:bold 13px monospace;' +
      'pointer-events:none;text-shadow:0 0 4px #000;z-index:9999;line-height:1.6;';
    document.body.appendChild(_hud);

    _toast = document.createElement('div');
    _toast.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
      'color:#fff;font:bold 20px monospace;pointer-events:none;text-align:center;' +
      'text-shadow:0 0 8px #000;z-index:9999;opacity:0;transition:opacity 0.3s;';
    document.body.appendChild(_toast);

    _crosshair = document.createElement('div');
    _crosshair.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
      'width:20px;height:20px;pointer-events:none;z-index:9999;';
    _crosshair.innerHTML = '<svg width="20" height="20"><line x1="10" y1="0" x2="10" y2="20" stroke="#00FF99" stroke-width="1.5"/>' +
      '<line x1="0" y1="10" x2="20" y2="10" stroke="#00FF99" stroke-width="1.5"/>' +
      '<circle cx="10" cy="10" r="2" fill="none" stroke="#00FF99" stroke-width="1"/></svg>';
    document.body.appendChild(_crosshair);

    _overlay = document.createElement('div');
    _overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;' +
      'background:rgba(0,0,0,0.85);color:#00FF99;display:flex;flex-direction:column;' +
      'align-items:center;justify-content:center;font:bold 18px monospace;z-index:10000;' +
      'text-align:center;line-height:2;';
    _overlay.innerHTML = '<div style="font-size:32px;color:#FF4444">ROBOT UPRISING</div>' +
      '<div>Factory security: insert kill switch into AI core</div>' +
      '<div style="color:#FFFF44">5 MINUTES — SHUT DOWN THE ROGUE AI</div>' +
      '<div style="font-size:13px;color:#aaa">WASD Move | Mouse Look | Click/Space Shoot | E Interact</div>' +
      '<div style="font-size:13px;color:#aaa">Destroy 4 shield generators, then hold E at AI core</div>' +
      '<div style="margin-top:16px;color:#44FF99">Press R+B simultaneously to begin</div>';
    document.body.appendChild(_overlay);
  }

  function _updateHUD() {
    if (!_hud || !_active) return;
    var aliveRobots = 0;
    for (var ri = 0; ri < _robots.length; ri++) { if (_robots[ri].alive) aliveRobots++; }
    var mins = Math.floor(_missionTimer / 60);
    var secs = Math.floor(_missionTimer % 60);
    var timeStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
    var ksStr = _killSwitchInserted ? 'INSERTED' : 'ARMED';
    var aiStr = _killSwitchInserted ? 'SHUTDOWN' : 'ONLINE';
    var shieldStr = _shieldsDown + '/4';
    var hpBar = '';
    var hpPct = _playerHP / _playerMaxHP;
    var bars = Math.round(hpPct * 10);
    for (var b = 0; b < 10; b++) { hpBar += b < bars ? '█' : '░'; }
    _hud.innerHTML =
      'ROBOT UPRISING<br>' +
      'HP: [' + hpBar + '] ' + Math.max(0, _playerHP) + '<br>' +
      'SHIELDS DOWN: ' + shieldStr + '<br>' +
      'ROBOTS: ' + aliveRobots + '<br>' +
      'KILL SWITCH: ' + ksStr + '<br>' +
      'TIME: ' + timeStr + '<br>' +
      'AI CORE: ' + aiStr + '<br>' +
      (_hasRifle ? 'RIFLE EQUIPPED  GRENADES:' + _grenades : 'PISTOL') + '<br>' +
      (_insertHolding ? 'INSERTING KILL SWITCH... ' + Math.round(_insertTimer) + '/5s' : '') +
      (_stunTimer > 0 ? '<span style="color:#FF4444">STUNNED!</span>' : '');
  }

  /* ── Player controls ───────────────────────────────────────────────────── */
  function _onKeyDown(e) {
    _keys[e.code] = true;
    if (!_active) {
      if (e.code === 'KeyR') { _keyR = true; _rTime = Date.now(); }
      if (e.code === 'KeyB') { _keyB = true; _bTime = Date.now(); }
      if (_keyR && _keyB && Math.abs(_rTime - _bTime) < ACTIVATE_WINDOW) { _start(); }
      return;
    }
    if (e.code === 'Space') { _tryShoot(); }
    if (e.code === 'KeyE') { _tryInteract(); }
    if (e.code === 'KeyG' && _grenades > 0) { _throwGrenade(); }
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;
    if (e.code === 'KeyR') _keyR = false;
    if (e.code === 'KeyB') _keyB = false;
    if (e.code === 'KeyE') { _insertHolding = false; _insertTimer = 0; }
  }

  function _onMouseMove(e) {
    if (!_active || !_mouseLocked) return;
    _yaw   -= e.movementX * 0.002;
    _pitch -= e.movementY * 0.002;
    _pitch = _clamp(_pitch, -Math.PI / 3, Math.PI / 3);
  }

  function _onMouseDown(e) {
    if (!_active) return;
    if (!_mouseLocked) { _canvas && _canvas.requestPointerLock && _canvas.requestPointerLock(); return; }
    if (e.button === 0) _tryShoot();
  }

  function _onPointerLockChange() {
    _mouseLocked = (document.pointerLockElement === _canvas);
  }

  /* ── Shooting ──────────────────────────────────────────────────────────── */
  function _tryShoot() {
    if (_gameOver || _stunTimer > 0) return;
    if (_shootCooldown > 0) return;
    _shootCooldown = _hasRifle ? 0.12 : 0.35;

    var dir = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(_pitch, _yaw, 0, 'YXZ'));
    var bulletMesh = _boxMesh(0.1, 0.1, 0.4, 0xFFFF88);
    bulletMesh.position.copy(_pos());
    bulletMesh.position.y += 0.1;
    _scene.add(bulletMesh);
    _bullets.push({ mesh: bulletMesh, vel: dir.clone().multiplyScalar(40), lifetime: 2 });
  }

  function _throwGrenade() {
    if (_grenades <= 0 || _gameOver) return;
    _grenades--;
    var dir = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(_pitch, _yaw, 0, 'YXZ'));
    var gpos = _pos().clone();
    gpos.y += 0.5;
    // Grenade explodes after 2s in a 5-unit radius
    var gMesh = _boxMesh(0.25, 0.25, 0.25, 0x886600);
    gMesh.position.copy(gpos);
    _scene.add(gMesh);
    var gVel = dir.clone().multiplyScalar(12);
    gVel.y += 5;
    var g = { mesh: gMesh, vel: gVel, timer: 2 };
    _bullets.push({ mesh: gMesh, vel: gVel, lifetime: 2, grenade: true, explodeTimer: 2 });
    _showToast('GRENADE!', '#FFAA00');
  }

  /* ── Interaction ───────────────────────────────────────────────────────── */
  function _tryInteract() {
    if (_gameOver) return;
    var pp = _pos();

    // Check terminals
    for (var ti = 0; ti < _terminals.length; ti++) {
      var term = _terminals[ti];
      if (term.used) continue;
      if (_dist(pp, term.pos) < 3) {
        _activateTerminal(term);
        return;
      }
    }

    // Check armory
    if (_armoryUnlocked && _armoryBox) {
      var armPos = new THREE.Vector3(32, 0.5, 5);
      if (_dist(pp, armPos) < 3) {
        _hasRifle = true;
        _grenades += 3;
        _armoryBox.material.color.setHex(0x888888);
        _armoryBox = null;
        _showToast('ARMORY UNLOCKED — ASSAULT RIFLE + 3 GRENADES', '#FFFF44');
        return;
      }
    }

    // Check shield generators
    for (var sgi = 0; sgi < _shieldGenerators.length; sgi++) {
      var sg = _shieldGenerators[sgi];
      if (!sg.alive) continue;
      var sgp = sg.mesh.position.clone();
      if (_dist(pp, sgp) < 3) {
        _showToast('Destroy the shield generator! Shoot it.', '#FF8844');
        return;
      }
    }

    // Check AI core (hold E for 5s)
    if (_aiCore && _dist(pp, _aiCore.pos) < 4) {
      if (_shieldsDown < 4) {
        _showToast('AI SHIELDS STILL ACTIVE — Destroy all 4 shield generators first!', '#FF4444');
        return;
      }
      _insertHolding = true;
    }
  }

  function _activateTerminal(term) {
    term.used = true;
    term.mesh.material.color.setHex(0x888888);
    if (term.id === 1) {
      _conveyorHazard = false;
      for (var ci = 0; ci < _conveyors.length; ci++) { _conveyors[ci].speed = 0; }
      _showToast('TERMINAL 1: CONVEYOR DISABLED — Section A safe', '#44FF99');
    } else if (term.id === 2) {
      _gasStunTimer = 10;
      _showToast('TERMINAL 2: GAS VENTED — All robots in room B stunned 10s!', '#44FF99');
    } else if (term.id === 3) {
      _sprinklersOn = true;
      // Short-circuit welder bots
      for (var ri = 0; ri < _robots.length; ri++) {
        if (_robots[ri].type === 'welder' && _robots[ri].alive) {
          _robots[ri].hp -= 50;
          if (_robots[ri].hp <= 0) _killRobot(_robots[ri]);
        }
      }
      _showToast('TERMINAL 3: SPRINKLERS ON — Welder-bots short-circuited -50HP!', '#44BBFF');
    } else if (term.id === 4) {
      _armoryUnlocked = true;
      _showToast('TERMINAL 4: ARMORY UNLOCKED — Head to (32, 5)!', '#FFFF44');
    }
  }

  /* ── Robot AI ──────────────────────────────────────────────────────────── */
  function _updateRobots(dt) {
    var pp = _pos();
    var aliveCount = 0;

    for (var ri = 0; ri < _robots.length; ri++) {
      var rob = _robots[ri];
      if (!rob.alive) continue;
      aliveCount++;

      var rpos = rob.mesh.position;
      var toPlayer = new THREE.Vector3(pp.x - rpos.x, 0, pp.z - rpos.z);
      var distToPlayer = toPlayer.length();
      toPlayer.normalize();

      rob.stateTimer -= dt;
      rob.attackCooldown -= dt;

      // Security bot Y oscillation
      if (rob.type === 'security') {
        rob.yOscPhase += dt * 2;
        rpos.y = 2 + Math.sin(rob.yOscPhase) * 0.8;
      }

      // Gas stun
      var stunned = _gasStunTimer > 0;

      if (rob.state === 'patrol') {
        if (distToPlayer < 20) { rob.state = 'chase'; }
        if (rob.stateTimer <= 0) {
          rob.vel.set(_randRange(-3, 3), 0, _randRange(-3, 3));
          rob.stateTimer = 2 + Math.random() * 3;
        }
        if (!stunned) {
          rpos.x += rob.vel.x * dt;
          rpos.z += rob.vel.z * dt;
          rpos.x = _clamp(rpos.x, -38, 38);
          rpos.z = _clamp(rpos.z, -38, 38);
        }
      } else if (rob.state === 'chase') {
        if (!stunned) {
          var spd = rob.type === 'forklift' ? 3 : (rob.type === 'security' ? 7 : 4);
          rpos.x += toPlayer.x * spd * dt;
          rpos.z += toPlayer.z * spd * dt;
        }
        if (distToPlayer < 2 && rob.type !== 'welder' && rob.type !== 'security') {
          rob.state = 'attack';
          rob.stateTimer = 0.5;
        }
        if (distToPlayer < 15 && rob.attackCooldown <= 0) {
          if (rob.type === 'welder') { _welderShoot(rob, toPlayer); }
          if (rob.type === 'security') { _securityShoot(rob, toPlayer); }
        }
        if (rob.type === 'forklift' && distToPlayer < 18 && rob.stateTimer <= 0) {
          rob.state = 'charge';
          rob.chargeDir.copy(toPlayer);
          rob.stateTimer = 1.5;
        }
      } else if (rob.state === 'attack') {
        if (!stunned && distToPlayer < 3) {
          if (rob.attackCooldown <= 0) {
            _damagePlayer(rob.type === 'assembler' ? 50 : 100);
            rob.attackCooldown = 1.5;
            _showToast(rob.type.toUpperCase() + ' HIT! -' + (rob.type === 'assembler' ? 50 : 100) + 'HP', '#FF4444');
          }
        } else {
          rob.state = 'chase';
        }
      } else if (rob.state === 'charge') {
        if (!stunned) {
          rpos.x += rob.chargeDir.x * 8 * dt;
          rpos.z += rob.chargeDir.z * 8 * dt;
        }
        if (distToPlayer < 2) {
          _damagePlayer(100);
          _showToast('FORKLIFT CHARGE! -100HP', '#FF2200');
          rob.state = 'patrol';
          rob.stateTimer = 3;
        }
        if (rob.stateTimer <= 0) { rob.state = 'chase'; }
      }

      // Face player
      if (distToPlayer > 0.5) {
        rob.mesh.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
      }
    }

    _robotCount = aliveCount;
  }

  function _welderShoot(rob, dir) {
    rob.attackCooldown = 1.2;
    var origin = rob.mesh.position.clone();
    origin.y += 1.5;
    // Create spark burst (LineSegments)
    var pts = [];
    for (var si = 0; si < 5; si++) {
      pts.push(new THREE.Vector3(origin.x, origin.y, origin.z));
      var sp = origin.clone().add(new THREE.Vector3(
        dir.x * (2 + si * 0.5) + _randRange(-0.3, 0.3),
        _randRange(-0.2, 0.2),
        dir.z * (2 + si * 0.5) + _randRange(-0.3, 0.3)
      ));
      pts.push(sp);
    }
    var sparkLine = _makeLineSegments(pts, 0xFFAA00);
    _scene.add(sparkLine);
    _sparkBursts.push({ mesh: sparkLine, lifetime: 0.3, dir: dir.clone(), origin: origin.clone() });
    // Check if hits player
    var toPlayer = new THREE.Vector3(_pos().x - origin.x, 0, _pos().z - origin.z);
    if (toPlayer.length() < 12 && toPlayer.normalize().dot(dir) > 0.85) {
      _damagePlayer(30);
      _showToast('WELDER SPARK HIT! -30HP', '#FF8800');
    }
  }

  function _securityShoot(rob, dir) {
    rob.attackCooldown = 0.8;
    var origin = rob.mesh.position.clone();
    origin.y += 1.5;
    var target = _pos().clone();
    target.y += 0.5;
    var laserPts = [origin, target];
    var laserLine = _makeLineSegments(laserPts, 0xFF2200);
    _scene.add(laserLine);
    _laserLines.push({ mesh: laserLine, lifetime: 0.15 });
    // Check distance for hit
    if (_dist(rob.mesh.position, _pos()) < 18) {
      _damagePlayer(15);
      _showToast('SECURITY LASER! -15HP', '#FF2244');
    }
  }

  function _killRobot(rob) {
    rob.alive = false;
    _scene.remove(rob.mesh);
    // Small explosion effect (line burst)
    var exPts = [];
    var ep = rob.mesh.position;
    for (var ei = 0; ei < 12; ei++) {
      exPts.push(new THREE.Vector3(ep.x, ep.y + 1, ep.z));
      exPts.push(new THREE.Vector3(
        ep.x + _randRange(-2, 2),
        ep.y + 1 + _randRange(-1, 2),
        ep.z + _randRange(-2, 2)
      ));
    }
    var exLine = _makeLineSegments(exPts, 0xFF6600);
    _scene.add(exLine);
    _sparkBursts.push({ mesh: exLine, lifetime: 0.5 });
  }

  /* ── Player damage ─────────────────────────────────────────────────────── */
  function _damagePlayer(dmg) {
    if (_gameOver || _stunTimer > 0) return;
    _playerHP -= dmg;
    // Red flash
    if (_hud) { _hud.style.background = 'rgba(255,0,0,0.3)'; setTimeout(function() { _hud.style.background = ''; }, 200); }
    if (_playerHP <= 0) { _playerHP = 0; _endGame(false); }
  }

  /* ── Bullet updates ────────────────────────────────────────────────────── */
  function _updateBullets(dt) {
    for (var bi = _bullets.length - 1; bi >= 0; bi--) {
      var bul = _bullets[bi];
      bul.lifetime -= dt;
      if (bul.grenade) {
        bul.explodeTimer -= dt;
        bul.vel.y -= 12 * dt;
        bul.mesh.position.x += bul.vel.x * dt;
        bul.mesh.position.y += bul.vel.y * dt;
        bul.mesh.position.z += bul.vel.z * dt;
        if (bul.mesh.position.y < 0.3) { bul.mesh.position.y = 0.3; bul.vel.y = 0; }
        if (bul.explodeTimer <= 0 || bul.lifetime <= 0) {
          _grenadeExplode(bul.mesh.position.clone());
          _scene.remove(bul.mesh);
          _bullets.splice(bi, 1);
          continue;
        }
      } else {
        bul.mesh.position.x += bul.vel.x * dt;
        bul.mesh.position.y += bul.vel.y * dt;
        bul.mesh.position.z += bul.vel.z * dt;
      }

      if (bul.lifetime <= 0) {
        _scene.remove(bul.mesh);
        _bullets.splice(bi, 1);
        continue;
      }

      if (!bul.grenade) {
        // Check robot hits
        for (var ri = 0; ri < _robots.length; ri++) {
          var rob = _robots[ri];
          if (!rob.alive) continue;
          var d = _dist(bul.mesh.position, rob.mesh.position);
          var hitRadius = rob.type === 'forklift' ? 2.5 : (rob.type === 'assembler' ? 1.0 : 0.8);
          if (d < hitRadius) {
            var dmg = _hasRifle ? 25 : 15;
            rob.hp -= dmg;
            if (rob.hp <= 0) { _killRobot(rob); }
            _scene.remove(bul.mesh);
            _bullets.splice(bi, 1);
            // Check shield generator hit
            break;
          }
        }
        // Shield generator hits
        for (var sgi = 0; sgi < _shieldGenerators.length; sgi++) {
          var sg = _shieldGenerators[sgi];
          if (!sg.alive) continue;
          if (_dist(bul.mesh.position, sg.mesh.position) < 1.2) {
            sg.hp -= _hasRifle ? 25 : 15;
            if (sg.hp <= 0) {
              sg.alive = false;
              _scene.remove(sg.mesh);
              _scene.remove(sg.light);
              _shieldsDown++;
              _showToast('SHIELD GENERATOR DESTROYED! ' + _shieldsDown + '/4 DOWN', '#FFFF44');
              if (_shieldsDown >= 4) {
                _showToast('ALL SHIELDS DOWN — Insert kill switch at AI core! Hold E', '#44FF99');
                _aiCoreMesh.material.color.setHex(0xFF4400);
              }
            }
            if (bi < _bullets.length) { _scene.remove(bul.mesh); _bullets.splice(bi, 1); }
            break;
          }
        }
      }
    }
  }

  function _grenadeExplode(pos) {
    var exPts = [];
    for (var ei = 0; ei < 20; ei++) {
      exPts.push(new THREE.Vector3(pos.x, pos.y, pos.z));
      exPts.push(new THREE.Vector3(pos.x + _randRange(-5, 5), pos.y + _randRange(0, 4), pos.z + _randRange(-5, 5)));
    }
    var exLine = _makeLineSegments(exPts, 0xFF8800);
    _scene.add(exLine);
    _sparkBursts.push({ mesh: exLine, lifetime: 0.5 });
    for (var ri = 0; ri < _robots.length; ri++) {
      var rob = _robots[ri];
      if (!rob.alive) continue;
      if (_dist(pos, rob.mesh.position) < 5) {
        rob.hp -= 75;
        if (rob.hp <= 0) _killRobot(rob);
      }
    }
    _showToast('BOOM!', '#FF8800');
  }

  /* ── Hazard updates ────────────────────────────────────────────────────── */
  function _updateHazards(dt) {
    var pp = _pos();

    // Live wires
    for (var lwi = 0; lwi < _liveWires.length; lwi++) {
      var lw = _liveWires[lwi];
      lw.timer -= dt;
      if (lw.timer <= 0) {
        // Re-randomize spark shape
        _scene.remove(lw.mesh);
        var newArc = _makeSparkArc(lw.pos.x, lw.pos.y, lw.pos.z, 0xFFFF00);
        _scene.add(newArc);
        lw.mesh = newArc;
        lw.timer = 0.1 + Math.random() * 0.2;
      }
      if (_dist(pp, lw.pos) < 1.2 && _stunTimer <= 0) {
        _damagePlayer(40);
        _stunTimer = 2;
        _showToast('LIVE WIRE! -40HP — STUNNED 2s', '#FFFF00');
      }
    }

    // Coolant pools
    for (var cpi = 0; cpi < _coolantPools.length; cpi++) {
      var cp = _coolantPools[cpi];
      if (Math.abs(pp.x - cp.pos.x) < 2 && Math.abs(pp.z - cp.pos.z) < 2) {
        _damagePlayer(15 * dt);
      }
    }

    // Stun timer
    if (_stunTimer > 0) { _stunTimer -= dt; }

    // Falling beams
    _beamSpawnTimer -= dt;
    if (_beamSpawnTimer <= 0) {
      _beamSpawnTimer = 15 + Math.random() * 10;
      _spawnFallingBeam();
    }
    for (var fbi = _fallingBeams.length - 1; fbi >= 0; fbi--) {
      var fb = _fallingBeams[fbi];
      fb.timer -= dt;
      if (fb.state === 'warning' && fb.timer <= 0) {
        // Drop the beam
        fb.state = 'falling';
        fb.timer = 0.5;
        if (fb.beam) {
          fb.beam.position.y = 7;
          _scene.add(fb.beam);
        }
      } else if (fb.state === 'falling') {
        if (fb.beam) { fb.beam.position.y -= 12 * dt; }
        if (fb.timer <= 0) {
          // Hit check
          if (fb.beam && Math.abs(fb.beam.position.x - pp.x) < 1 && Math.abs(fb.beam.position.z - pp.z) < 1) {
            _damagePlayer(60);
            _showToast('STEEL BEAM CRUSH! -60HP', '#FF4444');
          }
          if (fb.shadow) _scene.remove(fb.shadow);
          if (fb.beam) {
            fb.beam.position.y = 0.5;
            setTimeout(function() { _scene.remove(fb.beam); }, 5000);
          }
          _fallingBeams.splice(fbi, 1);
        }
      }
    }

    // Gas stun
    if (_gasStunTimer > 0) { _gasStunTimer -= dt; }
  }

  function _spawnFallingBeam() {
    var bx = _randRange(-30, 30);
    var bz = _randRange(-30, 30);
    // Shadow warning (yellow tinted box on floor)
    var shadow = _boxMesh(0.5, 0.1, 4, 0xFFFF00);
    shadow.position.set(bx, 0.05, bz);
    _scene.add(shadow);
    // Beam (starts above, drops after 3s)
    var beam = _boxMesh(0.5, 0.5, 4, 0x888899);
    // Don't add to scene yet (added when dropping)
    _fallingBeams.push({ shadow: shadow, beam: beam, state: 'warning', timer: 3 });
    _showToast('WARNING: FALLING BEAM!', '#FFFF00');
  }

  /* ── Conveyor updates ──────────────────────────────────────────────────── */
  function _updateConveyors(dt) {
    for (var ci = 0; ci < _conveyors.length; ci++) {
      var conv = _conveyors[ci];
      if (conv.speed === 0) continue;
      for (var pi = 0; pi < conv.partMeshes.length; pi++) {
        var part = conv.partMeshes[pi];
        part.position.x += conv.speed * dt;
        if (part.position.x > 3.5) part.position.x = -3.5;
      }
    }
  }

  /* ── Workstation sparks ────────────────────────────────────────────────── */
  function _updateWorkStations(dt) {
    for (var wsi = 0; wsi < _workStations.length; wsi++) {
      var ws = _workStations[wsi];
      for (var spk = 0; spk < ws.sparkLines.length; spk++) {
        var sl = ws.sparkLines[spk];
        sl.timer -= dt;
        if (sl.timer <= 0) {
          ws.group.remove(sl.line);
          var newArc = _makeSparkArc(0, 1.2, 0, _sprinklersOn ? 0x0088FF : 0x44FFFF);
          ws.group.add(newArc);
          sl.line = newArc;
          sl.timer = 0.08 + Math.random() * 0.15;
        }
      }
    }
  }

  /* ── Server lights update ──────────────────────────────────────────────── */
  function _updateServerLights(dt) {
    for (var sli = 0; sli < _serverLights.length; sli++) {
      var sl = _serverLights[sli];
      sl.timer -= dt;
      if (sl.timer <= 0) {
        sl.timer = 0.3 + Math.random() * 0.7;
        sl.light.intensity = sl.light.intensity > 0.5 ? 0.1 : 1.5;
      }
    }
  }

  /* ── Laser lines cleanup ───────────────────────────────────────────────── */
  function _updateEffects(dt) {
    for (var li = _laserLines.length - 1; li >= 0; li--) {
      _laserLines[li].lifetime -= dt;
      if (_laserLines[li].lifetime <= 0) {
        _scene.remove(_laserLines[li].mesh);
        _laserLines.splice(li, 1);
      }
    }
    for (var si = _sparkBursts.length - 1; si >= 0; si--) {
      _sparkBursts[si].lifetime -= dt;
      if (_sparkBursts[si].lifetime <= 0) {
        _scene.remove(_sparkBursts[si].mesh);
        _sparkBursts.splice(si, 1);
      }
    }
  }

  /* ── Crane update ──────────────────────────────────────────────────────── */
  function _updateCrane(dt) {
    // Pendulum swing
    var pp = _pos();
    if (_craneHookGroup) {
      _craneSwingVel += (-0.3 * _craneSwing - 0.05 * _craneSwingVel) * dt * 3;
      _craneSwing += _craneSwingVel * dt;
      _craneHookGroup.position.x = _craneSwing * 8;
      // Player collision with swinging hook
      var hookX = _craneHookGroup.position.x;
      var hookY = 4.5; // approximate hook hanging position
      var hookZ = 0;
      if (Math.abs(pp.x - hookX) < 1.5 && Math.abs(pp.z - hookZ) < 1.5 && pp.y < hookY + 1) {
        _damagePlayer(20 * dt);
      }
      // Give a little nudge to keep it interesting
      if (Math.random() < 0.005) { _craneSwingVel += _randRange(-0.5, 0.5); }
    }
  }

  /* ── AI core pulse ─────────────────────────────────────────────────────── */
  var _corePhase = 0;
  function _updateAICore(dt) {
    if (!_aiCoreMesh) return;
    _corePhase += dt * 2;
    if (!_killSwitchInserted) {
      _aiCoreMesh.rotation.y += dt * 1.5;
      _aiCoreMesh.position.y = 4 + Math.sin(_corePhase) * 0.2;
    }
  }

  /* ── Kill switch insertion ─────────────────────────────────────────────── */
  function _updateKillSwitch(dt) {
    if (!_insertHolding || _gameOver) return;
    var pp = _pos();
    if (!_aiCore || _dist(pp, _aiCore.pos) > 5) { _insertHolding = false; _insertTimer = 0; return; }
    if (_shieldsDown < 4) { _insertHolding = false; _insertTimer = 0; return; }
    _insertTimer += dt;
    if (_insertTimer >= 5) {
      _killSwitchInserted = true;
      _insertHolding = false;
      _showToast('KILL SWITCH INSERTED — AI CORE SHUTTING DOWN!', '#44FF99');
      if (_aiCoreMesh) {
        _aiCoreMesh.material.color.setHex(0xFF0000);
        _aiCoreMesh.material.emissive.setHex(0x330000);
      }
      setTimeout(function() { _endGame(true); }, 2500);
    }
  }

  /* ── Player movement ───────────────────────────────────────────────────── */
  function _updatePlayer(dt) {
    if (_gameOver || _stunTimer > 0) return;
    var speed = 8;
    var fwd = new THREE.Vector3(-Math.sin(_yaw), 0, -Math.cos(_yaw));
    var right = new THREE.Vector3(Math.cos(_yaw), 0, -Math.sin(_yaw));
    var move = new THREE.Vector3();
    if (_keys['KeyW'] || _keys['ArrowUp'])    move.addScaledVector(fwd, speed * dt);
    if (_keys['KeyS'] || _keys['ArrowDown'])  move.addScaledVector(fwd, -speed * dt);
    if (_keys['KeyA'] || _keys['ArrowLeft'])  move.addScaledVector(right, -speed * dt);
    if (_keys['KeyD'] || _keys['ArrowRight']) move.addScaledVector(right, speed * dt);

    _camera.position.add(move);
    _camera.position.x = _clamp(_camera.position.x, -38, 38);
    _camera.position.z = _clamp(_camera.position.z, -38, 38);
    _camera.position.y = 1.7;
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y = _yaw;
    _camera.rotation.x = _pitch;
  }

  /* ── End game ──────────────────────────────────────────────────────────── */
  function _endGame(won) {
    _gameOver = true;
    _gameWon = won;
    if (_overlay) {
      _overlay.style.display = 'flex';
      if (won) {
        _overlay.innerHTML = '<div style="font-size:40px;color:#44FF99">AI CORE SHUTDOWN</div>' +
          '<div style="color:#FFFF44">Mission Complete — Rogue AI eliminated</div>' +
          '<div>Survivors: YOU</div>' +
          '<div style="font-size:13px;color:#aaa;margin-top:16px">Press R+B to play again</div>';
      } else {
        var reason = _playerHP <= 0 ? 'SECURITY TECH TERMINATED' : 'TIME EXPIRED — FACTORY LOST';
        _overlay.innerHTML = '<div style="font-size:36px;color:#FF4444">MISSION FAILED</div>' +
          '<div>' + reason + '</div>' +
          '<div style="color:#FF8844">The rogue AI lives on...</div>' +
          '<div style="font-size:13px;color:#aaa;margin-top:16px">Press R+B to retry</div>';
      }
    }
    document.exitPointerLock && document.exitPointerLock();
  }

  /* ── Start ─────────────────────────────────────────────────────────────── */
  function _start() {
    if (_active) return;
    _active = true;
    if (_overlay) _overlay.style.display = 'none';
    _camera.position.set(0, 1.7, 30);
    _yaw = 0;
    _pitch = 0;
    _showToast('ROBOT UPRISING — REACH THE AI CORE IN 5 MINUTES!', '#FF4444');
    if (_canvas) { _canvas.requestPointerLock && _canvas.requestPointerLock(); }
    _waveTimer = 60;
  }

  /* ── Cleanup ───────────────────────────────────────────────────────────── */
  function _clearScene() {
    for (var ri = 0; ri < _robots.length; ri++) { _scene.remove(_robots[ri].mesh); }
    _robots = [];
    for (var bi = 0; bi < _bullets.length; bi++) { _scene.remove(_bullets[bi].mesh); }
    _bullets = [];
    for (var sbi = 0; sbi < _sparkBursts.length; sbi++) { _scene.remove(_sparkBursts[sbi].mesh); }
    _sparkBursts = [];
    for (var lli = 0; lli < _laserLines.length; lli++) { _scene.remove(_laserLines[lli].mesh); }
    _laserLines = [];
    for (var fbi = 0; fbi < _fallingBeams.length; fbi++) {
      if (_fallingBeams[fbi].shadow) _scene.remove(_fallingBeams[fbi].shadow);
      if (_fallingBeams[fbi].beam)   _scene.remove(_fallingBeams[fbi].beam);
    }
    _fallingBeams = [];
  }

  /* ── Public API ────────────────────────────────────────────────────────── */
  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas || document.querySelector('canvas');

    _buildHUD();
    _buildFactory();
    _buildHazards();
    _spawnInitialRobots();

    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup',   _onKeyUp);
    window.addEventListener('mousemove', _onMouseMove);
    window.addEventListener('mousedown', _onMouseDown);
    document.addEventListener('pointerlockchange', _onPointerLockChange);
  }

  function update(dt, elapsed) {
    if (!dt || dt > 0.1) dt = 0.016;

    // Activation check even if not active yet
    if (!_active || _gameOver) {
      _updateHUD();
      return;
    }

    _missionTimer -= dt;
    if (_missionTimer <= 0) { _missionTimer = 0; _endGame(false); return; }

    _waveTimer -= dt;
    if (_waveTimer <= 0) { _waveTimer = 60; _spawnWave(); }

    _shootCooldown -= dt;
    if (_shootCooldown < 0) _shootCooldown = 0;

    _updatePlayer(dt);
    _updateRobots(dt);
    _updateBullets(dt);
    _updateHazards(dt);
    _updateConveyors(dt);
    _updateWorkStations(dt);
    _updateServerLights(dt);
    _updateEffects(dt);
    _updateCrane(dt);
    _updateAICore(dt);

    if (_keys['KeyE'] && _insertHolding) { _updateKillSwitch(dt); }
    else if (!_keys['KeyE']) { _insertHolding = false; _insertTimer = 0; }

    _updateHUD();
  }

  function reset() {
    _clearScene();
    _active          = false;
    _gameOver        = false;
    _gameWon         = false;
    _playerHP        = 100;
    _stunTimer       = 0;
    _missionTimer    = 300;
    _waveTimer       = 60;
    _waveCount       = 0;
    _killSwitchArmed   = true;
    _killSwitchInserted = false;
    _insertTimer       = 0;
    _insertHolding     = false;
    _shieldsDown     = 0;
    _keyR = false;
    _keyB = false;
    _keys = {};
    _yaw  = 0;
    _pitch = 0;
    _shootCooldown = 0;
    _grenades = 0;
    _hasRifle = false;
    _conveyorHazard = true;
    _gasStunTimer = 0;
    _sprinklersOn = false;
    _beamSpawnTimer = 0;
    _craneSwing = 0;
    _craneSwingVel = 0;
    _corePhase = 0;
    _armoryUnlocked = false;
    _conveyors = [];
    _workStations = [];
    _serverLights = [];
    _tunnels = [];
    _terminals = [];
    _shieldGenerators = [];
    _liveWires = [];
    _coolantPools = [];
    _aiCore = null;
    _aiCoreMesh = null;
    _craneGroup = null;
    _craneHookGroup = null;
    _armoryBox = null;
    _serverRoom = null;

    if (_overlay) {
      _overlay.style.display = 'flex';
      _overlay.innerHTML = '<div style="font-size:32px;color:#FF4444">ROBOT UPRISING</div>' +
        '<div>Factory security: insert kill switch into AI core</div>' +
        '<div style="color:#FFFF44">5 MINUTES — SHUT DOWN THE ROGUE AI</div>' +
        '<div style="font-size:13px;color:#aaa">WASD Move | Mouse Look | Click/Space Shoot | E Interact</div>' +
        '<div style="font-size:13px;color:#aaa">Destroy 4 shield generators, then hold E at AI core</div>' +
        '<div style="margin-top:16px;color:#44FF99">Press R+B simultaneously to begin</div>';
    }

    _buildFactory();
    _buildHazards();
    _spawnInitialRobots();
  }

  return { init: init, update: update, reset: reset };

}());
