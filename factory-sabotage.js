/* ───────────────────────────────────────────────────────────────────────────
   factory-sabotage.js — Factory Infiltration & Sabotage Mission
   API: window.FactorySabotage = { init, update, reset }
   Controls:
     F + S (together)    → launch Factory Sabotage mission
     WASD               → move player
     H (near panel)     → hack control panel (3s, disables cameras 60s)
     B (near conveyor)  → plant charge on conveyor belt (3s fuse)
     Shift+B            → plant demolition charge on generator (30s countdown)
     O (near machine)   → overload production machine #1
     C (near generator) → cut power cable (all lights out)
     Shoot fuel tank    → shoot it to destroy (HP 50, massive explosion)
   ─────────────────────────────────────────────────────────────────────────── */
window.FactorySabotage = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Game state ────────────────────────────────────────────────────────── */
  var _active          = false;
  var _score           = 0;
  var _alarmTriggered  = false;
  var _stealthBonus    = true;
  var _missionComplete = false;
  var _exfilActive     = false;
  var _exfilTimer      = 0;       // 60s to exfil after 4 targets done
  var _missionTimer    = 0;       // elapsed mission time
  var _powerOut        = false;   // true when generator cut
  var _cameraDisabled  = false;   // true when panel hacked
  var _cameraDisabledTimer = 0;

  /* ── Targets sabotaged ─────────────────────────────────────────────────── */
  var _targets = {
    panel:     false,
    conveyor:  false,
    machine1:  false,
    fuelTank:  false,
    generator: false
  };
  var _targetCount = 0;

  /* ── Alarm / blast door ────────────────────────────────────────────────── */
  var _blastDoor        = null;
  var _blastDoorClosed  = false;
  var _blastDoorTimer   = 0;      // 30s to close

  /* ── Time bomb ─────────────────────────────────────────────────────────── */
  var _timeBombPlanted   = false;
  var _timeBombTimer     = 0;     // 30s countdown
  var _timeBombMesh      = null;

  /* ── Hacking state ─────────────────────────────────────────────────────── */
  var _hackingPanel      = false;
  var _hackTimer         = 0;

  /* ── Conveyor charge ───────────────────────────────────────────────────── */
  var _conveyorCharge    = false;
  var _conveyorTimer     = 0;

  /* ── Overload state ────────────────────────────────────────────────────── */
  var _overloadActive    = false;
  var _overloadLight     = null;

  /* ── Player ────────────────────────────────────────────────────────────── */
  var _player         = null;
  var _playerPos      = null;   // THREE.Vector3
  var _playerHP       = 100;
  var _keys           = {};
  var _lastTime       = 0;

  /* ── Factory meshes ────────────────────────────────────────────────────── */
  var _factoryGroup   = null;
  var _building       = null;
  var _conveyorBelts  = [];     // 10 platforms
  var _machines       = [];     // 5 machine assemblies
  var _pipes          = [];     // coolant pipes
  var _generator      = null;
  var _fuelTanks      = [];     // 2 tanks
  var _controlPanel   = null;
  var _powerCable     = null;

  /* ── Security ──────────────────────────────────────────────────────────── */
  var _guards         = [];     // 5 patrol + 2 stationary
  var _cameras        = [];     // 4 cameras
  var _cameraLights   = [];     // spotlight meshes for camera vision cones
  var _ambientLight   = null;
  var _guardLights    = [];     // flashlights when power out

  /* ── Worker NPCs ───────────────────────────────────────────────────────── */
  var _workers        = [];     // 8 civilian workers
  var _collateralCount = 0;

  /* ── Exfil marker ──────────────────────────────────────────────────────── */
  var _exfilMarker    = null;

  /* ── Debris / fire particles ───────────────────────────────────────────── */
  var _debris         = [];
  var _fireCubes      = [];
  var _explosions     = [];

  /* ── Fuel tank HP ──────────────────────────────────────────────────────── */
  var _fuelTankHP     = 50;

  /* ── F+S launch tracking ───────────────────────────────────────────────── */
  var _fsPressTime    = { F: 0, S: 0 };
  var FS_WINDOW       = 0.25;

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  var _hud = null;

  /* ════════════════════════════════════════════════════════════════════════
     GEOMETRY / MATERIAL HELPERS
  ════════════════════════════════════════════════════════════════════════ */

  function makeMesh(geo, color, opts) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    if (opts && opts.emissive) mat.emissive = new THREE.Color(opts.emissive);
    var mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  function makeBox(w, h, d, color, opts) {
    return makeMesh(new THREE.BoxGeometry(w, h, d), color, opts);
  }

  function makeCyl(rt, rb, h, segs, color) {
    return makeMesh(new THREE.CylinderGeometry(rt, rb, h, segs || 12), color);
  }

  /* ════════════════════════════════════════════════════════════════════════
     FACTORY LAYOUT BUILDERS
  ════════════════════════════════════════════════════════════════════════ */

  function buildFactory() {
    _factoryGroup = new THREE.Group();

    /* Main building shell */
    _building = makeBox(20, 8, 15, 0x446655);
    _building.position.set(0, 4, 0);
    _factoryGroup.add(_building);

    /* Floor */
    var floor = makeBox(22, 0.2, 17, 0x555555);
    floor.position.set(0, 0, 0);
    _factoryGroup.add(floor);

    buildConveyorBelt();
    buildMachines();
    buildPipes();
    buildGenerator();
    buildFuelTanks();
    buildControlPanel();
    buildPowerCable();

    _scene.add(_factoryGroup);
  }

  function buildConveyorBelt() {
    /* 10 small platforms in a line */
    var i;
    for (i = 0; i < 10; i++) {
      var platform = makeBox(0.9, 0.15, 1.8, 0x333333);
      platform.position.set(-4 + i * 1.0, 0.1, -3);
      _factoryGroup.add(platform);
      _conveyorBelts.push(platform);
    }
  }

  function buildMachines() {
    /* 5 different BoxGeometry assemblies */
    var i, x;
    var machineColors = [0x4A4A4A, 0x3D3D3D, 0x505050, 0x454545, 0x484848];
    var machinePositions = [
      { x: -7, z: 2 },
      { x: -4, z: 5 },
      { x:  0, z: 5 },
      { x:  4, z: 5 },
      { x:  7, z: 2 }
    ];
    for (i = 0; i < 5; i++) {
      var grp = new THREE.Group();
      var base = makeBox(2, 1.5, 1.5, machineColors[i]);
      var top  = makeBox(1.2, 0.8, 1.0, machineColors[i]);
      top.position.set(0, 1.15, 0);
      var arm  = makeBox(0.3, 1.2, 0.3, 0x666666);
      arm.position.set(0.8, 1.8, 0);
      grp.add(base);
      grp.add(top);
      grp.add(arm);
      grp.position.set(machinePositions[i].x, 0.75, machinePositions[i].z);
      _factoryGroup.add(grp);
      _machines.push(grp);
    }
  }

  function buildPipes() {
    /* CylinderGeometry r=0.3, h=8 horizontal, connecting area */
    var pipePositions = [
      { x: 0, y: 6.5, z: -5 },
      { x: 0, y: 6.5, z:  5 },
      { x: -8, y: 5, z: 0 }
    ];
    var i;
    for (i = 0; i < pipePositions.length; i++) {
      var pipe = makeCyl(0.3, 0.3, 8, 10, 0x668888);
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(pipePositions[i].x, pipePositions[i].y, pipePositions[i].z);
      _factoryGroup.add(pipe);
      _pipes.push(pipe);
    }
  }

  function buildGenerator() {
    _generator = makeBox(3, 4, 3, 0x334444);
    _generator.position.set(7, 2, -5);
    _factoryGroup.add(_generator);
  }

  function buildFuelTanks() {
    var positions = [{ x: -8, z: -4 }, { x: -8, z: -1 }];
    var i;
    for (i = 0; i < 2; i++) {
      var tank = makeCyl(2, 2, 4, 16, 0x884422);
      tank.position.set(positions[i].x, 2, positions[i].z);
      _factoryGroup.add(tank);
      _fuelTanks.push(tank);
    }
  }

  function buildControlPanel() {
    _controlPanel = makeBox(1, 1.5, 0.3, 0x222266);
    _controlPanel.position.set(-9, 1.75, 0);
    _factoryGroup.add(_controlPanel);
  }

  function buildPowerCable() {
    var points = [
      new THREE.Vector3(7, 4, -5),
      new THREE.Vector3(7, 7, -5),
      new THREE.Vector3(0, 7, -5)
    ];
    var geo = new THREE.BufferGeometry().setFromPoints(points);
    var mat = new THREE.LineBasicMaterial({ color: 0xFFFF00, linewidth: 2 });
    _powerCable = new THREE.LineSegments(geo, mat);
    _factoryGroup.add(_powerCable);
  }

  /* ════════════════════════════════════════════════════════════════════════
     SECURITY
  ════════════════════════════════════════════════════════════════════════ */

  function buildSecurity() {
    buildGuards();
    buildCameras();
  }

  function buildGuards() {
    var i;
    var patrolPaths = [
      [{ x: -6, z: 0 }, { x: 6, z: 0 }],
      [{ x: -6, z: 3 }, { x: 6, z: 3 }],
      [{ x: -6, z: -3 }, { x: 6, z: -3 }],
      [{ x: -3, z: -6 }, { x: 3, z: -6 }],
      [{ x: 0, z: 6 }, { x: 6, z: 6 }]
    ];

    /* 5 patrol guards */
    for (i = 0; i < 5; i++) {
      var mesh = makeBox(0.5, 1.6, 0.4, 0x226622);
      mesh.position.set(patrolPaths[i][0].x, 0.8, patrolPaths[i][0].z);
      _scene.add(mesh);

      var fl = new THREE.PointLight(0xFFFFAA, 0, 5);
      fl.position.set(0, 1.2, 0);
      mesh.add(fl);

      _guards.push({
        mesh: mesh,
        patrol: patrolPaths[i],
        patrolIdx: 0,
        speed: 2.5 + Math.random() * 0.5,
        alive: true,
        flashlight: fl
      });
      _guardLights.push(fl);
    }

    /* 2 stationary guards at exits */
    var exitPositions = [{ x: 0, z: -7.5 }, { x: 0, z: 7.5 }];
    for (i = 0; i < 2; i++) {
      var smesh = makeBox(0.5, 1.6, 0.4, 0x226622);
      smesh.position.set(exitPositions[i].x, 0.8, exitPositions[i].z);
      _scene.add(smesh);

      var sfl = new THREE.PointLight(0xFFFFAA, 0, 5);
      sfl.position.set(0, 1.2, 0);
      smesh.add(sfl);

      _guards.push({
        mesh: smesh,
        patrol: null,
        patrolIdx: 0,
        speed: 0,
        alive: true,
        flashlight: sfl
      });
      _guardLights.push(sfl);
    }
  }

  function buildCameras() {
    /* 4 cameras on walls */
    var camPositions = [
      { x: -9.5, y: 6, z: 3,  rx: 0,           ry: Math.PI / 2 },
      { x:  9.5, y: 6, z: -3, rx: 0,           ry: -Math.PI / 2 },
      { x: -3,   y: 6, z: -7, rx: 0,           ry: 0 },
      { x:  3,   y: 6, z:  7, rx: 0,           ry: Math.PI }
    ];
    var i;
    for (i = 0; i < camPositions.length; i++) {
      var cp = camPositions[i];
      var body = makeBox(0.3, 0.2, 0.3, 0x222222);
      body.position.set(cp.x, cp.y, cp.z);
      body.rotation.y = cp.ry;
      _scene.add(body);

      var sweepLight = new THREE.PointLight(0xFF0000, 0.3, 6);
      sweepLight.position.set(cp.x, cp.y - 1, cp.z);
      _scene.add(sweepLight);

      _cameras.push({
        mesh: body,
        sweepLight: sweepLight,
        angle: Math.random() * Math.PI * 2,
        sweepDir: (i % 2 === 0) ? 1 : -1,
        sweepSpeed: 0.4 + Math.random() * 0.3,
        baseY: cp.ry,
        destroyed: false
      });
      _cameraLights.push(sweepLight);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     WORKER NPCs
  ════════════════════════════════════════════════════════════════════════ */

  function buildWorkers() {
    var i;
    var workerPositions = [
      { x: -6, z: 2 }, { x: -4, z: 2 }, { x: -2, z: 4 },
      { x:  0, z: 4 }, { x:  2, z: 4 }, { x:  4, z: 2 },
      { x:  6, z: 3 }, { x:  5, z: -2 }
    ];
    for (i = 0; i < 8; i++) {
      var mesh = makeBox(0.45, 1.5, 0.35, 0xCC8844);
      mesh.position.set(workerPositions[i].x, 0.75, workerPositions[i].z);
      _scene.add(mesh);
      _workers.push({
        mesh: mesh,
        targetX: workerPositions[i].x,
        targetZ: workerPositions[i].z,
        moveTimer: 2 + Math.random() * 3,
        alive: true
      });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER
  ════════════════════════════════════════════════════════════════════════ */

  function buildPlayer() {
    _player = makeBox(0.5, 1.6, 0.4, 0x336633);
    _player.position.set(0, 0.8, 6.5);
    _scene.add(_player);
    _playerPos = _player.position;
  }

  /* ════════════════════════════════════════════════════════════════════════
     LIGHTING
  ════════════════════════════════════════════════════════════════════════ */

  function buildLighting() {
    _ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.4);
    _scene.add(_ambientLight);

    var ceiling1 = new THREE.PointLight(0xFFEECC, 0.8, 18);
    ceiling1.position.set(-5, 7, 0);
    _scene.add(ceiling1);

    var ceiling2 = new THREE.PointLight(0xFFEECC, 0.8, 18);
    ceiling2.position.set(5, 7, 0);
    _scene.add(ceiling2);

    _cameraLights.push(ceiling1);
    _cameraLights.push(ceiling2);
  }

  /* ════════════════════════════════════════════════════════════════════════
     EXFIL MARKER
  ════════════════════════════════════════════════════════════════════════ */

  function buildExfilMarker() {
    _exfilMarker = makeCyl(1.5, 1.5, 0.15, 32, 0x00FF88);
    _exfilMarker.position.set(0, 0.1, -7.2);
    _exfilMarker.visible = false;
    _scene.add(_exfilMarker);
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD
  ════════════════════════════════════════════════════════════════════════ */

  function buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'factory-sabotage-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:10px',
      'right:10px',
      'background:rgba(0,20,10,0.82)',
      'color:#00FF88',
      'font-family:monospace',
      'font-size:13px',
      'padding:8px 14px',
      'border:1px solid #00FF88',
      'border-radius:3px',
      'z-index:9999',
      'pointer-events:none',
      'display:none',
      'line-height:1.6'
    ].join(';');
    document.body.appendChild(_hud);
  }

  function updateHUD() {
    if (!_hud) return;
    var alarmStr  = _alarmTriggered ? '<span style="color:#FF3333">ON</span>' : 'OFF';
    var exfilStr  = _exfilActive ? '<span style="color:#00FF88">ACTIVE</span>' : 'WAIT';
    var timerSec  = Math.floor(_missionTimer);
    var mins      = Math.floor(timerSec / 60);
    var secs      = timerSec % 60;
    var timerStr  = (mins < 10 ? '0' + mins : '' + mins) + ':' + (secs < 10 ? '0' + secs : '' + secs);
    var bombStr   = '';
    if (_timeBombPlanted) {
      var bsec = Math.ceil(_timeBombTimer);
      bombStr = ' | <span style="color:#FF6600">BOMB: ' + bsec + 's</span>';
    }
    var exfilCd = '';
    if (_exfilActive && !_missionComplete) {
      var esc = Math.ceil(_exfilTimer);
      exfilCd = ' | EXFIL: ' + esc + 's';
    }
    _hud.innerHTML =
      'SABOTAGE [TARGETS: ' + _targetCount + '/5] [ALARM: ' + alarmStr + '] [TIMER: ' + timerStr + '] | EXFIL: ' + exfilStr +
      bombStr + exfilCd +
      (_collateralCount > 0 ? '<br><span style="color:#FF4400">CIVILIAN CASUALTIES: ' + _collateralCount + ' (-' + (_collateralCount * 200) + ' pts)</span>' : '');
  }

  /* ════════════════════════════════════════════════════════════════════════
     SABOTAGE ACTIONS
  ════════════════════════════════════════════════════════════════════════ */

  function checkNear(targetPos, radius) {
    if (!_playerPos) return false;
    var dx = _playerPos.x - targetPos.x;
    var dy = _playerPos.y - targetPos.y;
    var dz = _playerPos.z - targetPos.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz) < radius;
  }

  function sabotageTarget(name) {
    if (_targets[name]) return;
    _targets[name] = true;
    _targetCount++;
    _score += 400;
    if (_targetCount >= 4) activateExfil();
  }

  function activateExfil() {
    _exfilActive  = true;
    _exfilTimer   = 60;
    if (_exfilMarker) _exfilMarker.visible = true;
  }

  function hackPanel() {
    if (_targets.panel) return;
    if (!_controlPanel) return;
    if (!checkNear(_controlPanel.position, 2.5)) return;
    _hackingPanel = true;
    _hackTimer    = 3;
  }

  function plantConveyorCharge() {
    if (_targets.conveyor) return;
    if (_conveyorBelts.length === 0) return;
    if (!checkNear(_conveyorBelts[4].position, 3)) return;
    _conveyorCharge = true;
    _conveyorTimer  = 3;
  }

  function plantTimeBomb() {
    if (_timeBombPlanted) return;
    if (!_generator) return;
    if (!checkNear(_generator.position, 3)) return;
    _timeBombPlanted = true;
    _timeBombTimer   = 30;

    _timeBombMesh = makeBox(0.4, 0.3, 0.2, 0xFF3300);
    _timeBombMesh.position.copy(_generator.position);
    _timeBombMesh.position.y += 2.2;
    _scene.add(_timeBombMesh);
  }

  function overloadMachine() {
    if (_targets.machine1) return;
    if (_machines.length === 0) return;
    if (!checkNear(_machines[0].position, 2.5)) return;

    _overloadActive = true;
    if (!_overloadLight) {
      _overloadLight = new THREE.PointLight(0xFF6600, 2.5, 6);
      _overloadLight.position.copy(_machines[0].position);
      _overloadLight.position.y += 2;
      _scene.add(_overloadLight);
    }
    sabotageTarget('machine1');
    _score += 100;
  }

  function cutPowerCable() {
    if (_targets.generator) return;
    if (!_generator) return;
    if (!checkNear(_generator.position, 3)) return;

    /* Power out */
    _powerOut = true;
    if (_ambientLight) _ambientLight.intensity = 0.05;

    /* All ceiling lights off */
    var i;
    for (i = 2; i < _cameraLights.length; i++) {
      _cameraLights[i].intensity = 0;
    }

    /* Guards get flashlights */
    for (i = 0; i < _guardLights.length; i++) {
      _guardLights[i].intensity = 1.2;
    }

    /* Destroy cable visually */
    if (_powerCable) {
      _scene.remove(_powerCable);
      _powerCable = null;
    }

    sabotageTarget('generator');
  }

  function destroyFuelTank() {
    if (_targets.fuelTank) return;

    sabotageTarget('fuelTank');
    triggerExplosion(_fuelTanks[0].position.clone(), 12);
    spawnFireCubes(_fuelTanks[0].position.clone(), 18);

    /* Check civilian collateral */
    var i, w, dx, dz;
    for (i = 0; i < _workers.length; i++) {
      w = _workers[i];
      if (!w.alive) continue;
      dx = w.mesh.position.x - _fuelTanks[0].position.x;
      dz = w.mesh.position.z - _fuelTanks[0].position.z;
      if (Math.sqrt(dx * dx + dz * dz) < 8) {
        w.alive = false;
        _scene.remove(w.mesh);
        _collateralCount++;
        _score -= 200;
      }
    }

    /* Remove tank meshes */
    var t;
    for (i = 0; i < _fuelTanks.length; i++) {
      t = _fuelTanks[i];
      _scene.remove(t);
    }
    _fuelTanks = [];
  }

  function destroyConveyor() {
    if (_targets.conveyor) return;
    sabotageTarget('conveyor');

    var i, belt;
    for (i = 0; i < _conveyorBelts.length; i++) {
      belt = _conveyorBelts[i];
      spawnDebris(belt.position.clone(), 3);
      _factoryGroup.remove(belt);
    }
    _conveyorBelts = [];
  }

  /* ════════════════════════════════════════════════════════════════════════
     EXPLOSIONS / EFFECTS
  ════════════════════════════════════════════════════════════════════════ */

  function triggerExplosion(pos, radius) {
    var sphere = makeMesh(new THREE.SphereGeometry(radius, 16, 16), 0xFF4400);
    sphere.position.copy(pos);
    _scene.add(sphere);

    var light = new THREE.PointLight(0xFF6600, 5, radius * 3);
    light.position.copy(pos);
    _scene.add(light);

    _explosions.push({ mesh: sphere, light: light, life: 1.2 });
    _score += 200;
  }

  function spawnFireCubes(center, count) {
    var i, fc, ox, oz;
    for (i = 0; i < count; i++) {
      ox = (Math.random() - 0.5) * 10;
      oz = (Math.random() - 0.5) * 10;
      fc = makeBox(0.5, 0.5, 0.5, 0xFF4400);
      fc.position.set(center.x + ox, 0.25, center.z + oz);
      _scene.add(fc);
      _fireCubes.push({ mesh: fc, life: 4 + Math.random() * 4 });
    }
  }

  function spawnDebris(center, count) {
    var i, d, ox, oy, oz;
    for (i = 0; i < count; i++) {
      ox = (Math.random() - 0.5) * 2;
      oy = Math.random() * 1.5;
      oz = (Math.random() - 0.5) * 2;
      d = makeBox(0.2, 0.2, 0.2, 0x333333);
      d.position.set(center.x + ox, center.y + oy, center.z + oz);
      _scene.add(d);
      _debris.push({
        mesh: d,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 3,
          Math.random() * 4,
          (Math.random() - 0.5) * 3
        ),
        life: 2 + Math.random() * 2
      });
    }
  }

  function chainExplosion() {
    /* Time bomb detonation chain */
    triggerExplosion(_generator.position.clone(), 8);
    if (_fuelTanks.length > 0) {
      triggerExplosion(_fuelTanks[0].position.clone(), 12);
    }
    if (_machines.length > 0) {
      triggerExplosion(_machines[0].position.clone(), 5);
    }
    triggerAlarm();

    /* Force all targets destroyed */
    sabotageTarget('generator');
    sabotageTarget('conveyor');
    sabotageTarget('machine1');
    sabotageTarget('fuelTank');
    sabotageTarget('panel');
  }

  /* ════════════════════════════════════════════════════════════════════════
     ALARM & BLAST DOOR
  ════════════════════════════════════════════════════════════════════════ */

  function triggerAlarm() {
    if (_alarmTriggered) return;
    _alarmTriggered = true;
    _stealthBonus   = false;

    /* Blast door starts closing */
    _blastDoor = makeBox(5, 8, 0.5, 0x555555);
    _blastDoor.position.set(0, 4, -8.5);
    _scene.add(_blastDoor);
    _blastDoorTimer = 30;
  }

  function checkAlarmTrigger() {
    if (_alarmTriggered) return;
    if (_cameraDisabled) return;

    var i, cam, dx, dz, dist, camWorldPos;
    camWorldPos = new THREE.Vector3();

    for (i = 0; i < _cameras.length; i++) {
      cam = _cameras[i];
      if (cam.destroyed) continue;

      cam.mesh.getWorldPosition(camWorldPos);
      dx = _playerPos.x - camWorldPos.x;
      dz = _playerPos.z - camWorldPos.z;
      dist = Math.sqrt(dx * dx + dz * dz);

      /* Simple cone: within 6 units and within 60deg of camera facing */
      if (dist < 6) {
        var toCamAngle = Math.atan2(dx, dz);
        var angDiff = Math.abs(toCamAngle - cam.angle);
        if (angDiff > Math.PI) angDiff = Math.PI * 2 - angDiff;
        if (angDiff < Math.PI / 3) {
          triggerAlarm();
          return;
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     UPDATE SUB-SYSTEMS
  ════════════════════════════════════════════════════════════════════════ */

  function updatePlayer(dt) {
    var speed = 4;
    var moved = false;

    if (_keys['w'] || _keys['W']) { _player.position.z -= speed * dt; moved = true; }
    if (_keys['s'] || _keys['S']) { _player.position.z += speed * dt; moved = true; }
    if (_keys['a'] || _keys['A']) { _player.position.x -= speed * dt; moved = true; }
    if (_keys['d'] || _keys['D']) { _player.position.x += speed * dt; moved = true; }

    /* Clamp inside factory approximate bounds */
    _player.position.x = Math.max(-10, Math.min(10, _player.position.x));
    _player.position.z = Math.max(-8, Math.min(8, _player.position.z));

    /* Shooting fuel tank: press F while near fuel tank deals damage */
    /* (Handled in input as left-click or F key rapid tap near tank) */
  }

  function updateConveyorBelts(dt) {
    var i;
    for (i = 0; i < _conveyorBelts.length; i++) {
      _conveyorBelts[i].position.x -= 0.5 * dt;
      if (_conveyorBelts[i].position.x < -5) {
        _conveyorBelts[i].position.x = 5;
      }
    }
  }

  function updateCameras(dt) {
    if (_cameraDisabled) return;
    var i, cam;
    for (i = 0; i < _cameras.length; i++) {
      cam = _cameras[i];
      if (cam.destroyed) continue;
      cam.angle += cam.sweepDir * cam.sweepSpeed * dt;
      /* Sweep arc limit ±45deg */
      if (Math.abs(cam.angle - cam.baseY) > Math.PI / 4) {
        cam.sweepDir *= -1;
      }
      cam.mesh.rotation.y = cam.angle;
      cam.sweepLight.position.x = cam.mesh.position.x + Math.sin(cam.angle) * 3;
      cam.sweepLight.position.z = cam.mesh.position.z + Math.cos(cam.angle) * 3;
    }
  }

  function updateGuards(dt) {
    var i, g, target, dx, dz, dist, speed;
    for (i = 0; i < _guards.length; i++) {
      g = _guards[i];
      if (!g.alive || !g.patrol) continue;

      target = g.patrol[g.patrolIdx];
      dx = target.x - g.mesh.position.x;
      dz = target.z - g.mesh.position.z;
      dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.3) {
        g.patrolIdx = (g.patrolIdx + 1) % g.patrol.length;
      } else {
        speed = g.speed * dt;
        g.mesh.position.x += (dx / dist) * speed;
        g.mesh.position.z += (dz / dist) * speed;
      }

      /* Alert when alarm triggered: guards move faster toward player */
      if (_alarmTriggered) {
        dx = _playerPos.x - g.mesh.position.x;
        dz = _playerPos.z - g.mesh.position.z;
        dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 0.5) {
          _playerHP -= 15 * dt;
        }
      }
    }
  }

  function updateWorkers(dt) {
    var i, w, dx, dz, dist, speed;
    for (i = 0; i < _workers.length; i++) {
      w = _workers[i];
      if (!w.alive) continue;
      w.moveTimer -= dt;
      if (w.moveTimer <= 0) {
        w.targetX = (Math.random() - 0.5) * 14;
        w.targetZ = (Math.random() - 0.5) * 10;
        w.moveTimer = 2 + Math.random() * 4;
      }
      dx = w.targetX - w.mesh.position.x;
      dz = w.targetZ - w.mesh.position.z;
      dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 0.3) {
        speed = 1.2 * dt;
        w.mesh.position.x += (dx / dist) * speed;
        w.mesh.position.z += (dz / dist) * speed;
      }
    }
  }

  function updateHacking(dt) {
    if (!_hackingPanel) return;
    _hackTimer -= dt;
    if (_hackTimer <= 0) {
      _hackingPanel    = false;
      _cameraDisabled  = true;
      _cameraDisabledTimer = 60;

      /* Turn camera lights off */
      var i;
      for (i = 0; i < _cameras.length; i++) {
        _cameras[i].sweepLight.intensity = 0;
      }
      sabotageTarget('panel');
    }
  }

  function updateCameraDisabled(dt) {
    if (!_cameraDisabled) return;
    _cameraDisabledTimer -= dt;
    if (_cameraDisabledTimer <= 0) {
      _cameraDisabled = false;
      var i;
      for (i = 0; i < _cameras.length; i++) {
        if (!_cameras[i].destroyed) {
          _cameras[i].sweepLight.intensity = 0.3;
        }
      }
    }
  }

  function updateConveyorCharge(dt) {
    if (!_conveyorCharge) return;
    _conveyorTimer -= dt;
    if (_conveyorTimer <= 0) {
      _conveyorCharge = false;
      destroyConveyor();
    }
  }

  function updateTimeBomb(dt) {
    if (!_timeBombPlanted) return;
    _timeBombTimer -= dt;

    /* Flash bomb mesh */
    if (_timeBombMesh) {
      _timeBombMesh.visible = Math.floor(_timeBombTimer * 4) % 2 === 0;
    }

    if (_timeBombTimer <= 0) {
      _timeBombPlanted = false;
      if (_timeBombMesh) {
        _scene.remove(_timeBombMesh);
        _timeBombMesh = null;
      }
      chainExplosion();
      activateExfil();
    }
  }

  function updateBlastDoor(dt) {
    if (!_blastDoor) return;
    if (_blastDoorClosed) return;
    _blastDoorTimer -= dt;
    var progress = 1 - Math.max(0, _blastDoorTimer / 30);
    /* Door slides in from left */
    _blastDoor.position.x = -10 + progress * 10;

    if (_blastDoorTimer <= 0) {
      _blastDoorClosed = true;
    }
  }

  function updateExplosions(dt) {
    var i, exp;
    for (i = _explosions.length - 1; i >= 0; i--) {
      exp = _explosions[i];
      exp.life -= dt;
      var scale = 1 + (1.2 - exp.life) * 0.8;
      exp.mesh.scale.set(scale, scale, scale);
      exp.light.intensity = Math.max(0, exp.life * 4);
      if (exp.life <= 0) {
        _scene.remove(exp.mesh);
        _scene.remove(exp.light);
        _explosions.splice(i, 1);
      }
    }
  }

  function updateDebris(dt) {
    var i, d;
    for (i = _debris.length - 1; i >= 0; i--) {
      d = _debris[i];
      d.life -= dt;
      d.vel.y -= 9.8 * dt;
      d.mesh.position.addScaledVector(d.vel, dt);
      if (d.mesh.position.y < 0) {
        d.mesh.position.y = 0;
        d.vel.y *= -0.3;
      }
      if (d.life <= 0) {
        _scene.remove(d.mesh);
        _debris.splice(i, 1);
      }
    }
  }

  function updateFireCubes(dt) {
    var i, fc;
    for (i = _fireCubes.length - 1; i >= 0; i--) {
      fc = _fireCubes[i];
      fc.life -= dt;
      fc.mesh.position.y = 0.25 + Math.sin(fc.life * 8) * 0.1;
      if (fc.life <= 0) {
        _scene.remove(fc.mesh);
        _fireCubes.splice(i, 1);
      }
    }
  }

  function updateOverloadLight(dt) {
    if (!_overloadLight || !_overloadActive) return;
    _overloadLight.intensity = 2 + Math.sin(Date.now() * 0.02) * 1.5;
  }

  function updateExfil(dt) {
    if (!_exfilActive) return;
    if (_missionComplete) return;

    _exfilTimer -= dt;

    /* Spin exfil marker */
    if (_exfilMarker) {
      _exfilMarker.rotation.y += dt * 2;
    }

    /* Check player at exfil */
    if (_exfilMarker && _exfilMarker.visible) {
      var dx = _playerPos.x - _exfilMarker.position.x;
      var dz = _playerPos.z - _exfilMarker.position.z;
      if (Math.sqrt(dx * dx + dz * dz) < 2) {
        completeMission();
        return;
      }
    }

    if (_exfilTimer <= 0) {
      /* Time expired, mission failed */
      endMission(false);
    }
  }

  function updateFuelTankDamage() {
    /* Player shoots by pressing X key near fuel tank */
    if (!(_keys['x'] || _keys['X'])) return;
    if (_targets.fuelTank) return;
    if (_fuelTanks.length === 0) return;

    var tank = _fuelTanks[0];
    var dx = _playerPos.x - tank.position.x;
    var dz = _playerPos.z - tank.position.z;
    if (Math.sqrt(dx * dx + dz * dz) < 5) {
      _fuelTankHP -= 1;
      if (_fuelTankHP <= 0) {
        destroyFuelTank();
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     MISSION END
  ════════════════════════════════════════════════════════════════════════ */

  function completeMission() {
    _missionComplete = true;
    if (_stealthBonus) _score += 1000;
    _score -= _collateralCount * 200;

    var msg = document.createElement('div');
    msg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.85);color:#00FF88;font-family:monospace;font-size:24px;padding:20px 36px;border:2px solid #00FF88;border-radius:4px;z-index:10000;text-align:center';
    msg.innerHTML = 'MISSION COMPLETE<br><span style="font-size:14px">SCORE: ' + _score + (_stealthBonus ? '<br>STEALTH BONUS +1000' : '') + '</span>';
    document.body.appendChild(msg);
    setTimeout(function () { document.body.removeChild(msg); reset(); }, 5000);
  }

  function endMission(success) {
    if (!success) {
      var msg = document.createElement('div');
      msg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.85);color:#FF3333;font-family:monospace;font-size:24px;padding:20px 36px;border:2px solid #FF3333;border-radius:4px;z-index:10000;text-align:center';
      msg.innerHTML = 'MISSION FAILED<br><span style="font-size:14px">EXFIL WINDOW CLOSED</span>';
      document.body.appendChild(msg);
      setTimeout(function () { document.body.removeChild(msg); reset(); }, 4000);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     INPUT
  ════════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    _keys[e.key] = true;

    /* F+S launch window tracking */
    if (e.key === 'f' || e.key === 'F') _fsPressTime.F = Date.now() / 1000;
    if (e.key === 's' || e.key === 'S') _fsPressTime.S = Date.now() / 1000;

    if (!_active) {
      var now = Date.now() / 1000;
      if (
        (e.key === 'f' || e.key === 'F') && _keys['s'] ||
        (e.key === 's' || e.key === 'S') && _keys['f']
      ) {
        var diff = Math.abs(_fsPressTime.F - _fsPressTime.S);
        if (diff < FS_WINDOW) {
          startMission();
        }
      }
      return;
    }

    /* In-mission controls */
    if (e.key === 'h' || e.key === 'H') hackPanel();
    if (e.key === 'o' || e.key === 'O') overloadMachine();
    if (e.key === 'c' || e.key === 'C') cutPowerCable();

    if ((e.key === 'b' || e.key === 'B') && e.shiftKey) {
      plantTimeBomb();
    } else if (e.key === 'b' || e.key === 'B') {
      plantConveyorCharge();
    }
  }

  function onKeyUp(e) {
    _keys[e.key] = false;
  }

  /* ════════════════════════════════════════════════════════════════════════
     MISSION LIFECYCLE
  ════════════════════════════════════════════════════════════════════════ */

  function startMission() {
    if (_active) return;
    _active          = true;
    _score           = 0;
    _alarmTriggered  = false;
    _stealthBonus    = true;
    _missionComplete = false;
    _exfilActive     = false;
    _exfilTimer      = 60;
    _missionTimer    = 0;
    _powerOut        = false;
    _cameraDisabled  = false;
    _cameraDisabledTimer = 0;
    _targetCount     = 0;
    _collateralCount = 0;
    _fuelTankHP      = 50;
    _timeBombPlanted = false;
    _timeBombTimer   = 0;
    _hackingPanel    = false;
    _hackTimer       = 0;
    _conveyorCharge  = false;
    _conveyorTimer   = 0;
    _blastDoor       = null;
    _blastDoorClosed = false;
    _blastDoorTimer  = 0;
    _overloadActive  = false;

    _targets = {
      panel:     false,
      conveyor:  false,
      machine1:  false,
      fuelTank:  false,
      generator: false
    };

    buildFactory();
    buildLighting();
    buildSecurity();
    buildWorkers();
    buildPlayer();
    buildExfilMarker();

    if (_hud) _hud.style.display = 'block';

    if (_camera) {
      _camera.position.set(0, 12, 18);
      _camera.lookAt(0, 2, 0);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    buildHUD();

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup',   onKeyUp);
  }

  function update(dt) {
    if (!_active) return;

    _missionTimer += dt;

    updatePlayer(dt);
    updateConveyorBelts(dt);
    updateCameras(dt);
    updateGuards(dt);
    updateWorkers(dt);
    updateHacking(dt);
    updateCameraDisabled(dt);
    updateConveyorCharge(dt);
    updateTimeBomb(dt);
    updateBlastDoor(dt);
    updateExplosions(dt);
    updateDebris(dt);
    updateFireCubes(dt);
    updateOverloadLight(dt);
    updateFuelTankDamage();
    updateExfil(dt);
    checkAlarmTrigger();
    updateHUD();
  }

  function reset() {
    _active = false;

    /* Remove factory */
    if (_factoryGroup) {
      _scene.remove(_factoryGroup);
      _factoryGroup = null;
    }

    /* Remove guards */
    var i;
    for (i = 0; i < _guards.length; i++) {
      _scene.remove(_guards[i].mesh);
    }
    _guards = [];

    /* Remove cameras */
    for (i = 0; i < _cameras.length; i++) {
      _scene.remove(_cameras[i].mesh);
      _scene.remove(_cameras[i].sweepLight);
    }
    _cameras    = [];
    _cameraLights = [];

    /* Remove workers */
    for (i = 0; i < _workers.length; i++) {
      _scene.remove(_workers[i].mesh);
    }
    _workers = [];

    /* Remove player */
    if (_player) { _scene.remove(_player); _player = null; }

    /* Remove exfil marker */
    if (_exfilMarker) { _scene.remove(_exfilMarker); _exfilMarker = null; }

    /* Remove blast door */
    if (_blastDoor) { _scene.remove(_blastDoor); _blastDoor = null; }

    /* Remove time bomb mesh */
    if (_timeBombMesh) { _scene.remove(_timeBombMesh); _timeBombMesh = null; }

    /* Remove overload light */
    if (_overloadLight) { _scene.remove(_overloadLight); _overloadLight = null; }

    /* Remove ambient */
    if (_ambientLight) { _scene.remove(_ambientLight); _ambientLight = null; }

    /* Remove remaining explosions/debris/fire */
    for (i = _explosions.length - 1; i >= 0; i--) {
      _scene.remove(_explosions[i].mesh);
      _scene.remove(_explosions[i].light);
    }
    _explosions = [];

    for (i = _debris.length - 1; i >= 0; i--) {
      _scene.remove(_debris[i].mesh);
    }
    _debris = [];

    for (i = _fireCubes.length - 1; i >= 0; i--) {
      _scene.remove(_fireCubes[i].mesh);
    }
    _fireCubes = [];

    /* Reset arrays */
    _guardLights  = [];
    _conveyorBelts = [];
    _machines     = [];
    _pipes        = [];
    _fuelTanks    = [];

    /* Hide HUD */
    if (_hud) _hud.style.display = 'none';
  }

  return { init: init, update: update, reset: reset };

}());
