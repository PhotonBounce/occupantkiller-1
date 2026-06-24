window.CasinoHeist = (function() {
  'use strict';

  // ─── Module-level state ────────────────────────────────────────────────────
  var _scene, _camera, _renderer, _active = false;
  var _group;
  var _hud, _overlay;
  var _keys = {};
  var _mouseX = 0, _mouseY = 0;
  var _yaw = 0, _pitch = 0;

  // Keybind detection: C then H within 400ms
  var _cPressTime = 0;
  var _keydownHandler, _keyupHandler, _mousemoveHandler, _clickHandler, _pointerlockHandler;

  // Player
  var _playerPos = { x: 0, y: 1.7, z: 30 };
  var _playerVelY = 0;
  var _onGround = true;
  var _hp = 100;
  var _score = 0;
  var _gameOver = false, _gameWon = false;

  // Alarm system: 0=silent 1=guards alert 2=SWAT called 3=lockdown
  var _alarmLevel = 0;
  var _alarmTimer = 0;          // how long at current level
  var _lockdownTimer = 0;       // vault re-locks for 30s during lockdown

  // Camera objects (security cameras)
  var _secCameras = [];         // {mesh, pivot, angle, speed, disabled, worldPos}
  var _secCamFOV = Math.PI / 4; // detection cone half-angle
  var _secCamDetectTimer = 0;   // accumulated detection time

  // Guards
  var _guards = [];             // {mesh, pos, hp, maxHp, state, patrol, patrolIdx, alertTimer, type}
  var _swatSpawned = false;
  var _swatGroup = [];

  // Viktor boss
  var _viktor = null;           // {mesh, hp, maxHp, state, shootTimer, reinforceTriggered}
  var _viktorSpawned = false;

  // Vault
  var _vaultDoor = null;
  var _vaultDoorOpen = false;
  var _vaultBreached = false;   // triggered when door first opened
  var _drillingProgress = 0;    // 0..8 seconds
  var _drillingActive = false;
  var _drillHoldTime = 0;
  var _vaultLineSegs = null;

  // Chips collectibles
  var _chipMeshes = [];         // {mesh, collected}
  var _chipsCollected = 0;
  var CHIPS_TOTAL = 12;
  var CHIP_SCORE = 500;

  // Helipad escape
  var _helipadPos = { x: 0, y: 12, z: -50 };
  var _helipadMesh = null;
  var _onHelipad = false;
  var _escapeTimer = 0;         // must stand on pad 3s after win conditions

  // Win conditions
  var _viktorDefeated = false;
  var _helipadReached = false;

  // Props
  var _slotMachines = [];
  var _gamblingTables = [];
  var _glassPanels = [];        // breakable glass

  // Bullets / combat
  var _bullets = [];            // {mesh, vel, life, fromPlayer}
  var _enemyBullets = [];       // {mesh, vel, life}
  var _shootCooldown = 0;
  var _enemyShootCooldown = {};

  // Misc timers
  var _animId = null;
  var _lastTime = 0;
  var _viktorReinforceTimer = 0;

  // ─── Geometry helpers ──────────────────────────────────────────────────────

  function _makeBox(w, h, d, color, ox, oy, oz) {
    var g = new THREE.BoxGeometry(w, h, d);
    var m = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(g, m);
    mesh.position.set(ox || 0, oy !== undefined ? oy : 0, oz || 0);
    _group.add(mesh);
    return mesh;
  }

  function _makeCyl(rt, rb, h, segs, color, ox, oy, oz) {
    var g = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
    var m = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(g, m);
    mesh.position.set(ox || 0, oy !== undefined ? oy : 0, oz || 0);
    _group.add(mesh);
    return mesh;
  }

  function _makeSphere(r, color, ox, oy, oz) {
    var g = new THREE.SphereGeometry(r, 8, 6);
    var m = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(g, m);
    mesh.position.set(ox || 0, oy !== undefined ? oy : 0, oz || 0);
    _group.add(mesh);
    return mesh;
  }

  function _makeCone(r, h, color, ox, oy, oz) {
    var g = new THREE.ConeGeometry(r, h, 8);
    var m = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(g, m);
    mesh.position.set(ox || 0, oy !== undefined ? oy : 0, oz || 0);
    _group.add(mesh);
    return mesh;
  }

  function _dist2(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _vecLen(v) {
    return Math.sqrt(v.x * v.x + v.z * v.z);
  }

  // ─── Environment builder ───────────────────────────────────────────────────

  function _buildEnvironment() {
    // Ambient light
    var ambient = new THREE.AmbientLight(0x444444);
    _group.add(ambient);

    var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    _group.add(dirLight);

    // ── Casino Floor ──
    // Main floor
    _makeBox(80, 0.3, 80, 0x1a0a05, 0, -0.15, 0);

    // Ceiling
    _makeBox(80, 0.3, 80, 0x111111, 0, 10, 0);

    // Perimeter walls (casino floor)
    _makeBox(80, 10, 0.5, 0x220d05, 0, 5, -40);   // north wall
    _makeBox(80, 10, 0.5, 0x220d05, 0, 5,  40);   // south wall
    _makeBox(0.5, 10, 80, 0x220d05, -40, 5, 0);   // west wall
    _makeBox(0.5, 10, 80, 0x220d05,  40, 5, 0);   // east wall

    // Red carpet runner
    _makeBox(6, 0.05, 60, 0x880000, 0, 0.02, 0);

    // ── Gambling Tables ──
    var tablePositions = [
      [-12, 0, -10], [-12, 0,  10], [-12, 0,  -2],
      [ 12, 0, -10], [ 12, 0,  10], [ 12, 0,  -2],
      [ -6, 0,  20], [  6, 0,  20], [  0, 0, -18]
    ];
    for (var ti = 0; ti < tablePositions.length; ti++) {
      var tp = tablePositions[ti];
      // Table legs
      _makeBox(0.15, 0.8, 0.15, 0x5c3317, tp[0] - 1.5, 0.4, tp[2] - 0.9);
      _makeBox(0.15, 0.8, 0.15, 0x5c3317, tp[0] + 1.5, 0.4, tp[2] - 0.9);
      _makeBox(0.15, 0.8, 0.15, 0x5c3317, tp[0] - 1.5, 0.4, tp[2] + 0.9);
      _makeBox(0.15, 0.8, 0.15, 0x5c3317, tp[0] + 1.5, 0.4, tp[2] + 0.9);
      // Green felt top
      var tbl = _makeBox(3.2, 0.12, 2, 0x006633, tp[0], 0.86, tp[2]);
      _gamblingTables.push(tbl);
      // Chip piles on table
      _makeCyl(0.08, 0.08, 0.18, 6, 0xffffff, tp[0] - 0.4, 0.98, tp[2]);
      _makeCyl(0.08, 0.08, 0.18, 6, 0xff3333, tp[0] + 0.4, 0.98, tp[2]);
      _makeCyl(0.08, 0.08, 0.18, 6, 0x3333ff, tp[0],       0.98, tp[2] - 0.4);
    }

    // ── Slot Machines ──
    var slotXs = [-32, -29, -26, -23, 23, 26, 29, 32];
    for (var si = 0; si < slotXs.length; si++) {
      var sx = slotXs[si];
      // Body
      var slotBody = _makeBox(1.4, 2.2, 0.8, 0x333355, sx, 1.1, 28);
      // Glass panel face (lighter)
      _makeBox(0.9, 1.1, 0.05, 0x6699cc, sx, 1.5, 28.38);
      // Top dome / cone finial
      _makeCone(0.2, 0.4, 0xffcc00, sx, 2.4, 28);
      // Button row
      _makeBox(0.8, 0.12, 0.12, 0x222222, sx, 0.6, 28.38);
      _slotMachines.push({ mesh: slotBody, x: sx, z: 28 });
    }

    // ── Neon signs (colored boxes on walls) ──
    _makeBox(6, 0.4, 0.1, 0xff2200, 0, 8, -39.8);
    _makeBox(4, 0.25, 0.1, 0xffcc00, -20, 7, -39.8);
    _makeBox(4, 0.25, 0.1, 0x00ccff, 20, 7, -39.8);

    // ── Chandeliers ──
    _makeCyl(0.05, 0.05, 3, 8, 0x888800, -15, 8.5, -15);
    _makeCyl(0.6, 0.6, 0.15, 12, 0xddcc33, -15, 7, -15);
    _makeCyl(0.05, 0.05, 3, 8, 0x888800, 15, 8.5, -15);
    _makeCyl(0.6, 0.6, 0.15, 12, 0xddcc33, 15, 7, -15);
    _makeCyl(0.05, 0.05, 3, 8, 0x888800, 0, 8.5, 5);
    _makeCyl(0.8, 0.8, 0.2, 12, 0xddcc33, 0, 7, 5);

    // ── Security Checkpoint ──
    // Metal detector archway frame
    _makeBox(0.3, 3.5, 0.3, 0x555577, -2, 1.75, -25);   // left post
    _makeBox(0.3, 3.5, 0.3, 0x555577,  2, 1.75, -25);   // right post
    _makeBox(4.5, 0.3, 0.3, 0x555577,  0, 3.5,  -25);   // top bar
    // Guard booth
    _makeBox(3, 2.5, 2, 0x445566, 8, 1.25, -25);
    _makeBox(3, 0.1, 2, 0x88aacc, 8, 2.55, -25);         // glass top
    // Booth window glass
    _makeBox(2, 1, 0.08, 0x99bbdd, 8, 1.5, -24.05);

    // ── Vault Corridor ──
    // Marble walls (light gray)
    _makeBox(12, 6, 0.3, 0xcccccc, 0, 3, -41.5);         // corridor north end wall
    _makeBox(0.3, 6, 20, 0xd4d4d4, -6, 3, -31);          // left corridor wall
    _makeBox(0.3, 6, 20, 0xd4d4d4,  6, 3, -31);          // right corridor wall
    // Marble floor
    _makeBox(12, 0.3, 20, 0xe0e0e0, 0, -0.14, -31);
    // Marble ceiling
    _makeBox(12, 0.3, 20, 0xbbbbbb, 0, 6.15, -31);
    // Strip lights in corridor ceiling
    _makeBox(8, 0.1, 0.3, 0xffffee, 0, 5.9, -28);
    _makeBox(8, 0.1, 0.3, 0xffffee, 0, 5.9, -34);
    _makeBox(8, 0.1, 0.3, 0xffffee, 0, 5.9, -38);

    // Security camera mounts in corridor (4 cameras)
    _buildSecurityCameras();

    // ── Main Vault Room ──
    // Circular vault room walls via cylinder
    var vaultRoom = _makeCyl(10, 10, 8, 24, 0x888888, 0, 4, -52);
    // Vault room floor
    _makeCyl(10, 10, 0.3, 24, 0x999999, 0, -0.14, -52);
    // Vault room ceiling
    _makeCyl(10, 10, 0.3, 24, 0x777777, 0, 8.15, -52);

    // Cash stacks inside vault
    for (var ci = 0; ci < 8; ci++) {
      var ca = (ci / 8) * Math.PI * 2;
      _makeBox(0.5, 0.8, 0.3, 0x33aa33, Math.cos(ca) * 6, 0.4, -52 + Math.sin(ca) * 6);
    }

    // ── Vault Door ──
    _buildVaultDoor();

    // ── Upper Level / Rooftop Helipad ──
    _buildRooftop();

    // ── Scattered Casino Chips on Floor ──
    _buildChips();
  }

  function _buildSecurityCameras() {
    var camPositions = [
      { x: 0,  z: -26, wallY: 5.5, rotY: 0 },
      { x: -5, z: -30, wallY: 5.5, rotY: Math.PI / 2 },
      { x:  5, z: -30, wallY: 5.5, rotY: -Math.PI / 2 },
      { x:  0, z: -36, wallY: 5.5, rotY: Math.PI }
    ];
    for (var i = 0; i < camPositions.length; i++) {
      var cp = camPositions[i];
      // Camera pivot (mount)
      var mount = new THREE.Object3D();
      mount.position.set(cp.x, cp.wallY, cp.z);
      _group.add(mount);

      // Body
      var bodyGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.25, 8);
      var bodyMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
      var body = new THREE.Mesh(bodyGeo, bodyMat);
      body.rotation.z = Math.PI / 2;
      mount.add(body);

      // Lens dome
      var lensGeo = new THREE.SphereGeometry(0.07, 6, 4);
      var lensMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
      var lens = new THREE.Mesh(lensGeo, lensMat);
      lens.position.set(0.15, 0, 0);
      mount.add(lens);

      _secCameras.push({
        pivot: mount,
        lens: lens,
        baseAngle: cp.rotY,
        angle: cp.rotY,
        speed: 0.4 + Math.random() * 0.3,
        sweepRange: Math.PI / 2,
        disabled: false,
        worldPos: { x: cp.x, y: cp.wallY, z: cp.z }
      });
    }
  }

  function _buildVaultDoor() {
    // Main door slab
    var doorGeo = new THREE.BoxGeometry(6, 5.5, 0.5);
    var doorMat = new THREE.MeshLambertMaterial({ color: 0x888899 });
    _vaultDoor = new THREE.Mesh(doorGeo, doorMat);
    _vaultDoor.position.set(0, 2.9, -41.9);
    _group.add(_vaultDoor);

    // Circular handle detail using LineSegments
    var handlePoints = [];
    var spokes = 8;
    var r = 1.0;
    for (var a = 0; a < spokes; a++) {
      var ang = (a / spokes) * Math.PI * 2;
      var angNext = ((a + 1) / spokes) * Math.PI * 2;
      // Rim segment
      handlePoints.push(new THREE.Vector3(Math.cos(ang) * r, Math.sin(ang) * r, 0.3));
      handlePoints.push(new THREE.Vector3(Math.cos(angNext) * r, Math.sin(angNext) * r, 0.3));
      // Spoke
      handlePoints.push(new THREE.Vector3(0, 0, 0.3));
      handlePoints.push(new THREE.Vector3(Math.cos(ang) * r, Math.sin(ang) * r, 0.3));
    }
    var handleGeo = new THREE.BufferGeometry().setFromPoints(handlePoints);
    var handleMat = new THREE.LineBasicMaterial({ color: 0xddcc44 });
    _vaultLineSegs = new THREE.LineSegments(handleGeo, handleMat);
    _vaultLineSegs.position.copy(_vaultDoor.position);
    _group.add(_vaultLineSegs);

    // Door frame
    _makeBox(0.4, 6.2, 0.6, 0x666677, -3.2, 3.1, -42);
    _makeBox(0.4, 6.2, 0.6, 0x666677,  3.2, 3.1, -42);
    _makeBox(7.0, 0.4, 0.6, 0x666677,  0,   6.3, -42);
  }

  function _buildRooftop() {
    // Stairs / ramp to upper level
    for (var s = 0; s < 8; s++) {
      _makeBox(4, 0.3, 1, 0x555555, 30, 0.3 + s * 1.5, -35 + s * 1.5);
    }
    // Upper platform
    _makeBox(20, 0.4, 20, 0x444444, 20, 12.2, -42);
    // Rooftop walls (low parapet)
    _makeBox(20, 1, 0.3, 0x555555, 20, 12.9, -52.1);
    _makeBox(20, 1, 0.3, 0x555555, 20, 12.9, -31.9);
    _makeBox(0.3, 1, 20, 0x555555, 9.9, 12.9, -42);
    _makeBox(0.3, 1, 20, 0x555555, 30.1, 12.9, -42);

    // Helipad circle markings
    _helipadMesh = _makeCyl(4, 4, 0.05, 16, 0x222288, 20, 12.43, -42);
    // H marker
    _makeBox(0.4, 0.05, 3, 0xffffff, 20 - 1, 12.46, -42);
    _makeBox(0.4, 0.05, 3, 0xffffff, 20 + 1, 12.46, -42);
    _makeBox(2.2, 0.05, 0.4, 0xffffff, 20,     12.46, -42);

    // Helicopter on helipad (decorative)
    _makeBox(5, 0.6, 1.8, 0x336688, 20, 13.2, -42);       // fuselage
    _makeBox(2, 0.15, 0.5, 0x225577, 20, 13.65, -44);     // tail boom
    _makeCyl(3.5, 3.5, 0.1, 6, 0x999999, 20, 13.85, -42); // main rotor disc
    _makeCyl(0.5, 0.5, 0.1, 4, 0x999999, 20, 13.75, -44.5); // tail rotor
  }

  function _buildChips() {
    var chipPositions = [
      [ -8, 0.05, 15], [ 8, 0.05, 15], [ -15, 0.05, 0],
      [ 15, 0.05, 0],  [ 0, 0.05, 25], [-20, 0.05, 10],
      [ 20, 0.05, 10], [ -5, 0.05, -5],[ 5, 0.05, -5],
      [-10, 0.05, -15],[ 10, 0.05,-15],[ 0, 0.05, -20]
    ];
    var chipColors = [0xff3333, 0x3333ff, 0x33cc33, 0xffcc00, 0xcc33cc];
    for (var i = 0; i < chipPositions.length; i++) {
      var cp = chipPositions[i];
      var col = chipColors[i % chipColors.length];
      var cg = new THREE.CylinderGeometry(0.18, 0.18, 0.06, 12);
      var cm = new THREE.MeshLambertMaterial({ color: col });
      var cmesh = new THREE.Mesh(cg, cm);
      cmesh.position.set(cp[0], cp[1], cp[2]);
      _group.add(cmesh);
      _chipMeshes.push({ mesh: cmesh, collected: false, pos: { x: cp[0], y: cp[1], z: cp[2] } });
    }
  }

  // ─── Enemy builders ────────────────────────────────────────────────────────

  function _spawnGuards() {
    // 8 security guards patrol casino floor in pairs
    var patrolRoutes = [
      [{ x: -12, z: 5 }, { x: -12, z: 20 }, { x: 0, z: 20 }, { x: 0, z: 5 }],
      [{ x:  12, z: 5 }, { x:  12, z: 20 }, { x: 20, z: 10 }, { x: 12, z: 5 }],
      [{ x: -20, z: -5}, { x: -20, z: 10 }, { x: -8, z: 10 }, { x: -8, z: -5 }],
      [{ x:  20, z: -5}, { x:  20, z: 10 }, { x:  8, z: 10 }, { x:  8, z: -5 }],
    ];

    for (var p = 0; p < 4; p++) {
      for (var g = 0; g < 2; g++) {
        var route = patrolRoutes[p];
        var startIdx = (g === 0) ? 0 : 2;
        var startPt = route[startIdx];

        var guardGroup = new THREE.Object3D();
        guardGroup.position.set(startPt.x, 0, startPt.z);
        _group.add(guardGroup);

        // Body (black suit)
        var bodyG = new THREE.BoxGeometry(0.6, 1.0, 0.35);
        var bodyM = new THREE.MeshLambertMaterial({ color: 0x334455 });
        var body = new THREE.Mesh(bodyG, bodyM);
        body.position.set(0, 1.15, 0);
        guardGroup.add(body);

        // Head
        var headG = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        var headM = new THREE.MeshLambertMaterial({ color: 0xffcc99 });
        var head = new THREE.Mesh(headG, headM);
        head.position.set(0, 1.85, 0);
        guardGroup.add(head);

        // Gun (small box)
        var gunG = new THREE.BoxGeometry(0.08, 0.08, 0.45);
        var gunM = new THREE.MeshLambertMaterial({ color: 0x111111 });
        var gun = new THREE.Mesh(gunG, gunM);
        gun.position.set(0.35, 1.1, 0.25);
        guardGroup.add(gun);

        _guards.push({
          obj: guardGroup,
          pos: { x: startPt.x, y: 0, z: startPt.z },
          hp: 80,
          maxHp: 80,
          state: 'patrol',    // patrol | alert | combat | dead
          patrol: route,
          patrolIdx: startIdx,
          alertTimer: 0,
          shootTimer: 1.5 + Math.random() * 1.0,
          type: 'guard',
          id: 'guard_' + (p * 2 + g)
        });
      }
    }
  }

  function _spawnSWAT() {
    if (_swatSpawned) return;
    _swatSpawned = true;

    // 8 SWAT responders enter from south wall
    var spawnPoints = [
      { x: -15, z: 38 }, { x: -10, z: 38 }, { x: -5, z: 38 },
      { x:   0, z: 38 }, { x:   5, z: 38 }, { x:  10, z: 38 },
      { x:  15, z: 38 }, { x:  20, z: 38 }
    ];

    for (var i = 0; i < 8; i++) {
      var sp = spawnPoints[i];

      var sg = new THREE.Object3D();
      sg.position.set(sp.x, 0, sp.z);
      _group.add(sg);

      // Body (dark green SWAT)
      var sbody = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 1.0, 0.4),
        new THREE.MeshLambertMaterial({ color: 0x334433 })
      );
      sbody.position.set(0, 1.15, 0);
      sg.add(sbody);

      // Helmet
      var shead = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.36, 0.34),
        new THREE.MeshLambertMaterial({ color: 0x222222 })
      );
      shead.position.set(0, 1.85, 0);
      sg.add(shead);

      // Shield (flat box in front)
      var sshield = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.7, 0.08),
        new THREE.MeshLambertMaterial({ color: 0x445566 })
      );
      sshield.position.set(0, 1.2, 0.3);
      sg.add(sshield);

      var swatEnemy = {
        obj: sg,
        pos: { x: sp.x, y: 0, z: sp.z },
        hp: 100,
        maxHp: 100,
        state: 'advance',
        patrol: [{ x: sp.x, z: 0 }],
        patrolIdx: 0,
        alertTimer: 0,
        shootTimer: 1.0 + Math.random() * 0.8,
        type: 'swat',
        id: 'swat_' + i
      };

      _guards.push(swatEnemy);
      _swatGroup.push(swatEnemy);
    }
  }

  function _spawnViktor() {
    if (_viktorSpawned) return;
    _viktorSpawned = true;

    var vg = new THREE.Object3D();
    vg.position.set(0, 0, -50);
    _group.add(vg);

    // Large imposing body (navy suit)
    var vbody = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 1.1, 0.45),
      new THREE.MeshLambertMaterial({ color: 0x222244 })
    );
    vbody.position.set(0, 1.2, 0);
    vg.add(vbody);

    // Head
    var vhead = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.35, 0.35),
      new THREE.MeshLambertMaterial({ color: 0xddaa88 })
    );
    vhead.position.set(0, 1.95, 0);
    vg.add(vhead);

    // Left pistol
    var vlgun = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.07, 0.4),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    vlgun.position.set(-0.45, 1.1, 0.25);
    vg.add(vlgun);

    // Right pistol
    var vrgun = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.07, 0.4),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    vrgun.position.set(0.45, 1.1, 0.25);
    vg.add(vrgun);

    // Shoulder pads (power indication)
    var vspL = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.15, 0.45),
      new THREE.MeshLambertMaterial({ color: 0x111133 })
    );
    vspL.position.set(-0.48, 1.5, 0);
    vg.add(vspL);
    var vspR = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.15, 0.45),
      new THREE.MeshLambertMaterial({ color: 0x111133 })
    );
    vspR.position.set(0.48, 1.5, 0);
    vg.add(vspR);

    _viktor = {
      obj: vg,
      pos: { x: 0, y: 0, z: -50 },
      hp: 450,
      maxHp: 450,
      state: 'combat',
      shootTimer: 0.6,
      shootInterval: 0.45,
      reinforceTriggered: false,
      circleAngle: 0,
      circleRadius: 5
    };
  }

  // ─── HUD ───────────────────────────────────────────────────────────────────

  function _buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'casino-heist-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.72)',
      'color:#f0d060',
      'font:bold 13px monospace',
      'padding:8px 18px',
      'border-radius:6px',
      'border:1px solid #aa8800',
      'pointer-events:none',
      'z-index:9999',
      'text-align:center',
      'min-width:340px'
    ].join(';');
    document.body.appendChild(_hud);

    _overlay = document.createElement('div');
    _overlay.id = 'casino-heist-overlay';
    _overlay.style.cssText = [
      'position:fixed',
      'top:0','left:0','width:100%','height:100%',
      'display:flex','flex-direction:column',
      'align-items:center','justify-content:center',
      'background:rgba(0,0,0,0.8)',
      'color:#f0d060',
      'font:bold 22px monospace',
      'z-index:10000',
      'pointer-events:none',
      'display:none'
    ].join(';');
    document.body.appendChild(_overlay);
  }

  function _updateHUD() {
    if (!_hud) return;
    var alarmStr = 'ALARM: ';
    if (_alarmLevel === 0) alarmStr += '<span style="color:#44ff44">SILENT</span>';
    else if (_alarmLevel === 1) alarmStr += '<span style="color:#ffcc00">ALERT</span>';
    else if (_alarmLevel === 2) alarmStr += '<span style="color:#ff8800">SWAT CALLED</span>';
    else alarmStr += '<span style="color:#ff2222">LOCKDOWN</span>';

    var chipsStr = 'CHIPS: ' + _chipsCollected + '/' + CHIPS_TOTAL;

    var drillStr = '';
    if (_drillingActive) {
      var pct = Math.floor((_drillingProgress / 8) * 100);
      drillStr = ' | DRILL: <span style="color:#00ccff">' + pct + '%</span>';
    }

    var hpColor = _hp > 60 ? '#44ff44' : _hp > 30 ? '#ffcc00' : '#ff3333';
    var hpStr = 'HP: <span style="color:' + hpColor + '">' + Math.max(0, _hp) + '</span>';

    var scoreStr = 'SCORE: ' + _score;

    var viktorStr = '';
    if (_viktor) {
      var vPct = Math.floor((_viktor.hp / _viktor.maxHp) * 100);
      viktorStr = ' | <span style="color:#cc44ff">VIKTOR: ' + vPct + '%</span>';
    }

    var winCondStr = '';
    if (_vaultDoorOpen && !_viktorDefeated) winCondStr = ' | <span style="color:#ff8800">FIND VIKTOR</span>';
    if (_viktorDefeated && !_helipadReached) winCondStr = ' | <span style="color:#00ccff">REACH HELIPAD</span>';

    _hud.innerHTML = hpStr + ' | ' + alarmStr + ' | ' + chipsStr + drillStr + ' | ' + scoreStr + viktorStr + winCondStr;
  }

  function _showOverlay(msg, sub) {
    if (!_overlay) return;
    _overlay.style.display = 'flex';
    _overlay.innerHTML = '<div>' + msg + '</div>' +
      (sub ? '<div style="font-size:14px;margin-top:12px;color:#aaaaaa">' + sub + '</div>' : '') +
      '<div style="font-size:12px;margin-top:20px;color:#888888">Press R to play again or ESC to quit</div>';
  }

  // ─── Input ─────────────────────────────────────────────────────────────────

  function _setupInput() {
    _keydownHandler = function(e) {
      if (!_active) return;
      _keys[e.code] = true;

      // C → H activation already handled outside
      // Shooting
      if (e.code === 'KeyF') _fireBullet();

      // Reset
      if (e.code === 'KeyR' && (_gameOver || _gameWon)) {
        reset();
        init(_scene, _camera, _renderer);
      }
      if (e.code === 'Escape') {
        reset();
      }
    };

    _keyupHandler = function(e) {
      _keys[e.code] = false;
    };

    _mousemoveHandler = function(e) {
      if (!_active) return;
      if (document.pointerLockElement) {
        _yaw   -= e.movementX * 0.002;
        _pitch -= e.movementY * 0.002;
        _pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, _pitch));
      }
    };

    _clickHandler = function() {
      if (!_active) return;
      if (!document.pointerLockElement && _renderer) {
        _renderer.domElement.requestPointerLock();
      } else {
        _fireBullet();
      }
    };

    _pointerlockHandler = function() {};

    document.addEventListener('keydown', _keydownHandler);
    document.addEventListener('keyup',   _keyupHandler);
    document.addEventListener('mousemove', _mousemoveHandler);
    document.addEventListener('click',   _clickHandler);
  }

  function _teardownInput() {
    if (_keydownHandler)       document.removeEventListener('keydown',    _keydownHandler);
    if (_keyupHandler)         document.removeEventListener('keyup',      _keyupHandler);
    if (_mousemoveHandler)     document.removeEventListener('mousemove',  _mousemoveHandler);
    if (_clickHandler)         document.removeEventListener('click',      _clickHandler);
    _keydownHandler = _keyupHandler = _mousemoveHandler = _clickHandler = null;
    if (document.pointerLockElement) document.exitPointerLock();
  }

  // ─── Combat: bullets ───────────────────────────────────────────────────────

  function _fireBullet() {
    if (_shootCooldown > 0 || _gameOver || _gameWon) return;
    _shootCooldown = 0.18;

    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(_pitch, _yaw, 0, 'YXZ'));

    var bg = new THREE.SphereGeometry(0.06, 4, 3);
    var bm = new THREE.MeshLambertMaterial({ color: 0xffff44 });
    var bmesh = new THREE.Mesh(bg, bm);
    bmesh.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
    _group.add(bmesh);

    _bullets.push({
      mesh: bmesh,
      vel: { x: dir.x * 40, y: dir.y * 40, z: dir.z * 40 },
      life: 2.0,
      fromPlayer: true
    });

    // Check if any security camera is in crosshair
    _checkCameraShot(dir);
  }

  function _checkCameraShot(dir) {
    for (var i = 0; i < _secCameras.length; i++) {
      var cam = _secCameras[i];
      if (cam.disabled) continue;
      var dx = cam.worldPos.x - _playerPos.x;
      var dy = cam.worldPos.y - _playerPos.y;
      var dz = cam.worldPos.z - _playerPos.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 1) continue;
      var ndx = dx / dist, ndy = dy / dist, ndz = dz / dist;
      var dot = ndx * dir.x + ndy * dir.y + ndz * dir.z;
      if (dot > 0.95 && dist < 25) {
        // Camera shot!
        cam.disabled = true;
        cam.lens.material.color.setHex(0x333333);
        _score += 100;
        // Shooting camera doesn't trigger alarm if all cameras disabled stealthily
      }
    }
  }

  function _fireEnemyBullet(enemy) {
    var dx = _playerPos.x - enemy.pos.x;
    var dy = _playerPos.y + 0.5 - enemy.pos.z;
    var dz = _playerPos.z - enemy.pos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 0.1) return;

    var speed = (enemy.type === 'swat') ? 32 : 25;
    var spreadX = (Math.random() - 0.5) * 0.12;
    var spreadZ = (Math.random() - 0.5) * 0.12;

    var bg = new THREE.SphereGeometry(0.05, 4, 3);
    var bm = new THREE.MeshLambertMaterial({ color: 0xff4400 });
    var bmesh = new THREE.Mesh(bg, bm);
    bmesh.position.set(enemy.pos.x, 1.3, enemy.pos.z);
    _group.add(bmesh);

    _enemyBullets.push({
      mesh: bmesh,
      vel: {
        x: (dx / dist) * speed + spreadX,
        y: 0,
        z: (dz / dist) * speed + spreadZ
      },
      life: 2.5
    });
  }

  function _fireViktorBullet() {
    if (!_viktor) return;
    // Viktor fires two bullets (dual pistols)
    for (var side = -1; side <= 1; side += 2) {
      var dx = _playerPos.x - _viktor.pos.x + side * 0.3;
      var dz = _playerPos.z - _viktor.pos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 0.1) continue;

      var bg = new THREE.SphereGeometry(0.07, 4, 3);
      var bm = new THREE.MeshLambertMaterial({ color: 0xff8800 });
      var bmesh = new THREE.Mesh(bg, bm);
      bmesh.position.set(_viktor.pos.x + side * 0.35, 1.2, _viktor.pos.z);
      _group.add(bmesh);

      _enemyBullets.push({
        mesh: bmesh,
        vel: {
          x: (dx / dist) * 35,
          y: 0,
          z: (dz / dist) * 35
        },
        life: 3.0,
        fromViktor: true
      });
    }
  }

  // ─── Alarm system ──────────────────────────────────────────────────────────

  function _triggerAlarm(level) {
    if (level <= _alarmLevel) return;
    _alarmLevel = level;
    _alarmTimer = 0;

    if (_alarmLevel === 2 && !_swatSpawned) {
      _spawnSWAT();
    }
    if (_alarmLevel === 3) {
      // Vault re-locks for 30s
      if (_vaultDoorOpen && !_vaultBreached) {
        _lockdownTimer = 30;
        _closVaultDoor();
      }
    }
  }

  function _closVaultDoor() {
    if (_vaultDoor) {
      _vaultDoorOpen = false;
      _drillingProgress = 0;
      _drillingActive = false;
      _vaultDoor.position.x = 0;
    }
  }

  // ─── Vault drill mechanic ──────────────────────────────────────────────────

  function _updateVaultDrill(dt) {
    // Player must be near vault door and hold E
    var distToDoor = _dist2(_playerPos.x, _playerPos.z, 0, -42);

    if (distToDoor < 3.5 && !_vaultDoorOpen) {
      if (_lockdownTimer > 0) {
        // Can't drill during lockdown
        _drillingActive = false;
        return;
      }
      if (_keys['KeyE']) {
        if (!_drillingActive) {
          _drillingActive = true;
          _drillingProgress = 0;
        }
        _drillingProgress += dt;
        if (_drillingProgress >= 8.0) {
          // Vault drilled open!
          _vaultDoorOpen = true;
          _vaultBreached = true;
          _drillingActive = false;
          _drillingProgress = 8.0;
          // Swing door open visually
          _vaultDoor.position.x = -4;
          if (_vaultLineSegs) _vaultLineSegs.position.x = -4;
          _score += 2000;
          // Spawn Viktor
          _spawnViktor();
          // Vault breach triggers alarm level 2 if not already
          _triggerAlarm(2);
        }
      } else {
        // Not holding E — decay drill progress slowly
        if (_drillingActive) {
          _drillingProgress -= dt * 0.5;
          if (_drillingProgress <= 0) {
            _drillingProgress = 0;
            _drillingActive = false;
          }
        }
      }
    } else {
      if (_drillingActive) {
        _drillingActive = false;
      }
    }
  }

  // ─── Player movement ───────────────────────────────────────────────────────

  function _updatePlayer(dt) {
    if (_gameOver || _gameWon) return;

    // Movement
    var speed = 7.0;
    var fwd = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, _yaw, 0, 'YXZ'));
    var right = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, _yaw, 0, 'YXZ'));

    var moveX = 0, moveZ = 0;
    if (_keys['KeyW'] || _keys['ArrowUp'])    { moveX += fwd.x;   moveZ += fwd.z; }
    if (_keys['KeyS'] || _keys['ArrowDown'])  { moveX -= fwd.x;   moveZ -= fwd.z; }
    if (_keys['KeyA'] || _keys['ArrowLeft'])  { moveX -= right.x; moveZ -= right.z; }
    if (_keys['KeyD'] || _keys['ArrowRight']) { moveX += right.x; moveZ += right.z; }

    var mlen = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (mlen > 0) {
      _playerPos.x += (moveX / mlen) * speed * dt;
      _playerPos.z += (moveZ / mlen) * speed * dt;
    }

    // Jump
    if (_keys['Space'] && _onGround) {
      _playerVelY = 8;
      _onGround = false;
    }

    // Gravity
    _playerVelY -= 18 * dt;
    _playerPos.y += _playerVelY * dt;

    // Ground clamping — multiple surfaces
    var groundY = _getGroundY(_playerPos.x, _playerPos.z);
    if (_playerPos.y <= groundY + 1.7) {
      _playerPos.y = groundY + 1.7;
      _playerVelY = 0;
      _onGround = true;
    }

    // Bounds
    _playerPos.x = Math.max(-39, Math.min(39, _playerPos.x));
    _playerPos.z = Math.max(-59, Math.min(39, _playerPos.z));

    // Camera follow
    _camera.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
    _camera.rotation.set(_pitch, _yaw, 0, 'YXZ');

    // Shoot cooldown
    if (_shootCooldown > 0) _shootCooldown -= dt;
    if (_shootCooldown < 0) _shootCooldown = 0;
  }

  function _getGroundY(x, z) {
    // Rooftop platform
    if (x >= 10 && x <= 30 && z >= -52 && z <= -32) return 12.4;
    // Default floor
    return 0;
  }

  // ─── Chip collection ───────────────────────────────────────────────────────

  function _updateChips() {
    for (var i = 0; i < _chipMeshes.length; i++) {
      var chip = _chipMeshes[i];
      if (chip.collected) continue;
      var d = _dist2(_playerPos.x, _playerPos.z, chip.pos.x, chip.pos.z);
      if (d < 0.8 && Math.abs(_playerPos.y - chip.pos.y - 1.7) < 1.5) {
        chip.collected = true;
        chip.mesh.visible = false;
        _chipsCollected++;
        _score += CHIP_SCORE;
      }
    }
  }

  // ─── Security cameras update ───────────────────────────────────────────────

  function _updateSecurityCameras(dt) {
    var detected = false;
    for (var i = 0; i < _secCameras.length; i++) {
      var cam = _secCameras[i];
      if (cam.disabled) continue;

      // Rotate camera
      cam.angle += cam.speed * dt;
      cam.pivot.rotation.y = cam.baseAngle + Math.sin(cam.angle) * cam.sweepRange;

      // Check if player is in camera view cone (simplified)
      var wp = cam.worldPos;
      var dx = _playerPos.x - wp.x;
      var dz = _playerPos.z - wp.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 15) {
        // Get camera forward direction
        var camFwd = new THREE.Vector3(0, 0, -1);
        camFwd.applyEuler(new THREE.Euler(0, cam.pivot.rotation.y, 0));
        var toPlayer = new THREE.Vector3(dx, 0, dz).normalize();
        var dot = camFwd.dot(toPlayer);
        if (dot > Math.cos(_secCamFOV)) {
          detected = true;
        }
      }
    }

    if (detected) {
      _secCamDetectTimer += dt;
      if (_secCamDetectTimer > 1.5) {
        _triggerAlarm(Math.min(3, _alarmLevel + 1));
        _secCamDetectTimer = 0;
      }
    } else {
      _secCamDetectTimer = Math.max(0, _secCamDetectTimer - dt * 0.5);
    }
  }

  // ─── Guard AI ──────────────────────────────────────────────────────────────

  function _updateGuards(dt) {
    for (var i = _guards.length - 1; i >= 0; i--) {
      var g = _guards[i];
      if (g.state === 'dead') continue;

      var distToPlayer = _dist2(g.pos.x, g.pos.z, _playerPos.x, _playerPos.z);

      // State transitions
      if (g.state === 'patrol' || g.state === 'advance') {
        if (_alarmLevel >= 1 && distToPlayer < 20) {
          g.state = 'combat';
          g.alertTimer = 0;
        } else if (distToPlayer < 8) {
          g.state = 'combat';
          _triggerAlarm(1);
        }
      }

      if (g.state === 'patrol') {
        _updateGuardPatrol(g, dt);
      } else if (g.state === 'advance') {
        _updateGuardAdvance(g, dt);
      } else if (g.state === 'combat') {
        _updateGuardCombat(g, dt, distToPlayer);
      }

      // Update mesh position
      g.obj.position.set(g.pos.x, 0, g.pos.z);

      // Face player in combat
      if (g.state === 'combat') {
        var angleToPlayer = Math.atan2(_playerPos.x - g.pos.x, _playerPos.z - g.pos.z);
        g.obj.rotation.y = angleToPlayer;
      }
    }
  }

  function _updateGuardPatrol(g, dt) {
    var target = g.patrol[g.patrolIdx];
    var dx = target.x - g.pos.x;
    var dz = target.z - g.pos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    var speed = 2.5;
    if (dist < 0.5) {
      g.patrolIdx = (g.patrolIdx + 1) % g.patrol.length;
    } else {
      g.pos.x += (dx / dist) * speed * dt;
      g.pos.z += (dz / dist) * speed * dt;
    }
  }

  function _updateGuardAdvance(g, dt) {
    var dx = _playerPos.x - g.pos.x;
    var dz = _playerPos.z - g.pos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 5) {
      var speed = 4.0;
      g.pos.x += (dx / dist) * speed * dt;
      g.pos.z += (dz / dist) * speed * dt;
    } else {
      g.state = 'combat';
    }
  }

  function _updateGuardCombat(g, dt, distToPlayer) {
    // Chase player until in range
    if (distToPlayer > 12) {
      var dx2 = _playerPos.x - g.pos.x;
      var dz2 = _playerPos.z - g.pos.z;
      var d2 = Math.sqrt(dx2 * dx2 + dz2 * dz2);
      var speed = (g.type === 'swat') ? 4.5 : 3.5;
      g.pos.x += (dx2 / d2) * speed * dt;
      g.pos.z += (dz2 / d2) * speed * dt;
    }

    // Shoot
    g.shootTimer -= dt;
    if (g.shootTimer <= 0 && distToPlayer < 18) {
      _fireEnemyBullet(g);
      g.shootTimer = (g.type === 'swat') ? (0.9 + Math.random() * 0.5)
                                         : (1.4 + Math.random() * 0.8);
    }
  }

  // ─── Viktor boss AI ────────────────────────────────────────────────────────

  function _updateViktor(dt) {
    if (!_viktor || _viktorDefeated) return;

    var distToPlayer = _dist3(
      { x: _viktor.pos.x, y: 1.0, z: _viktor.pos.z },
      { x: _playerPos.x,  y: _playerPos.y - 0.7, z: _playerPos.z }
    );

    // Circle-strafe around the vault
    _viktor.circleAngle += 0.6 * dt;
    var targetX = Math.cos(_viktor.circleAngle) * _viktor.circleRadius;
    var targetZ = -52 + Math.sin(_viktor.circleAngle) * _viktor.circleRadius;

    // Move toward circle position
    var dx = targetX - _viktor.pos.x;
    var dz = targetZ - _viktor.pos.z;
    var len = Math.sqrt(dx * dx + dz * dz);
    if (len > 0.1) {
      _viktor.pos.x += (dx / len) * 3.5 * dt;
      _viktor.pos.z += (dz / len) * 3.5 * dt;
    }

    _viktor.obj.position.set(_viktor.pos.x, 0, _viktor.pos.z);
    _viktor.obj.rotation.y = Math.atan2(
      _playerPos.x - _viktor.pos.x,
      _playerPos.z - _viktor.pos.z
    );

    // Shoot at player
    _viktor.shootTimer -= dt;
    if (_viktor.shootTimer <= 0 && distToPlayer < 30) {
      _fireViktorBullet();
      _viktor.shootTimer = _viktor.shootInterval;
    }

    // At 60% HP call in reinforcements
    if (!_viktor.reinforceTriggered && _viktor.hp < _viktor.maxHp * 0.6) {
      _viktor.reinforceTriggered = true;
      _triggerAlarm(3);
      _viktor.shootInterval = 0.3; // shoot faster
      // Spawn 4 more guards
      _viktorReinforceTimer = 0;
      for (var r = 0; r < 4; r++) {
        _spawnViktorReinforcement(r);
      }
    }
  }

  function _spawnViktorReinforcement(idx) {
    var angles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
    var a = angles[idx];
    var sx = Math.cos(a) * 8;
    var sz = -52 + Math.sin(a) * 8;

    var rg = new THREE.Object3D();
    rg.position.set(sx, 0, sz);
    _group.add(rg);

    var rb = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 1.0, 0.35),
      new THREE.MeshLambertMaterial({ color: 0x222244 })
    );
    rb.position.set(0, 1.15, 0);
    rg.add(rb);
    var rh = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.3, 0.3),
      new THREE.MeshLambertMaterial({ color: 0xddaa88 })
    );
    rh.position.set(0, 1.85, 0);
    rg.add(rh);

    _guards.push({
      obj: rg,
      pos: { x: sx, y: 0, z: sz },
      hp: 80,
      maxHp: 80,
      state: 'combat',
      patrol: [],
      patrolIdx: 0,
      alertTimer: 0,
      shootTimer: 1.0 + Math.random(),
      type: 'guard',
      id: 'reinforce_' + idx
    });
  }

  // ─── Bullet update ─────────────────────────────────────────────────────────

  function _updateBullets(dt) {
    // Player bullets
    for (var i = _bullets.length - 1; i >= 0; i--) {
      var b = _bullets[i];
      b.mesh.position.x += b.vel.x * dt;
      b.mesh.position.y += b.vel.y * dt;
      b.mesh.position.z += b.vel.z * dt;
      b.life -= dt;

      var hit = false;

      // Check guard hits
      for (var g = _guards.length - 1; g >= 0; g--) {
        var guard = _guards[g];
        if (guard.state === 'dead') continue;
        var gd = _dist3(
          { x: b.mesh.position.x, y: b.mesh.position.y, z: b.mesh.position.z },
          { x: guard.pos.x, y: 1.2, z: guard.pos.z }
        );
        if (gd < 0.7) {
          guard.hp -= 25;
          hit = true;
          if (guard.hp <= 0) {
            guard.state = 'dead';
            guard.obj.rotation.z = Math.PI / 2;
            guard.obj.position.y = -0.5;
            _score += (guard.type === 'swat') ? 300 : 200;
          } else {
            // Getting shot triggers alert
            if (guard.state !== 'combat') {
              guard.state = 'combat';
              _triggerAlarm(Math.max(1, _alarmLevel));
            }
          }
          break;
        }
      }

      // Check Viktor hit
      if (!hit && _viktor && !_viktorDefeated) {
        var vd = _dist3(
          { x: b.mesh.position.x, y: b.mesh.position.y, z: b.mesh.position.z },
          { x: _viktor.pos.x, y: 1.3, z: _viktor.pos.z }
        );
        if (vd < 1.0) {
          _viktor.hp -= 20;
          hit = true;
          _score += 50;
          if (_viktor.hp <= 0) {
            _viktor.hp = 0;
            _viktorDefeated = true;
            _viktor.obj.rotation.z = Math.PI / 2;
            _viktor.obj.position.y = -0.3;
            _score += 5000;
          }
        }
      }

      if (hit || b.life <= 0) {
        _group.remove(b.mesh);
        _bullets.splice(i, 1);
      }
    }

    // Enemy bullets
    for (var j = _enemyBullets.length - 1; j >= 0; j--) {
      var eb = _enemyBullets[j];
      eb.mesh.position.x += eb.vel.x * dt;
      eb.mesh.position.y += eb.vel.y * dt;
      eb.mesh.position.z += eb.vel.z * dt;
      eb.life -= dt;

      var phit = false;
      var pd = _dist3(
        { x: eb.mesh.position.x, y: eb.mesh.position.y, z: eb.mesh.position.z },
        { x: _playerPos.x, y: _playerPos.y - 0.5, z: _playerPos.z }
      );
      if (pd < 0.6) {
        phit = true;
        var dmg = eb.fromViktor ? 18 : 12;
        _hp -= dmg;
        if (_hp <= 0) {
          _hp = 0;
          _triggerGameOver();
        }
      }

      if (phit || eb.life <= 0) {
        _group.remove(eb.mesh);
        _enemyBullets.splice(j, 1);
      }
    }
  }

  // ─── Helipad escape ────────────────────────────────────────────────────────

  function _updateEscape(dt) {
    if (!_vaultDoorOpen || !_viktorDefeated) return;
    var distToHelipad = _dist2(_playerPos.x, _playerPos.z, _helipadPos.x, _helipadPos.z);
    var onPad = distToHelipad < 4 && Math.abs(_playerPos.y - (_helipadPos.y + 1.7)) < 1.5;
    if (onPad) {
      _escapeTimer += dt;
      if (_escapeTimer >= 3.0 && !_gameWon) {
        _gameWon = true;
        _score += 10000 + _chipsCollected * 200;
        _showOverlay('HEIST SUCCESS!',
          'Vault drilled | Viktor defeated | Escaped by helicopter<br>Score: ' + _score);
      }
    } else {
      _escapeTimer = Math.max(0, _escapeTimer - dt * 2);
    }
  }

  // ─── Lockdown timer ────────────────────────────────────────────────────────

  function _updateLockdown(dt) {
    if (_lockdownTimer > 0) {
      _lockdownTimer -= dt;
      if (_lockdownTimer <= 0) {
        _lockdownTimer = 0;
        if (_alarmLevel === 3) _alarmLevel = 2; // down from lockdown
      }
    }
  }

  // ─── Game over ─────────────────────────────────────────────────────────────

  function _triggerGameOver() {
    if (_gameOver) return;
    _gameOver = true;
    _showOverlay('MISSION FAILED', 'Viktor\'s men got you.<br>Score: ' + _score);
  }

  // ─── Main update loop ──────────────────────────────────────────────────────

  function _tick(ts) {
    if (!_active) return;
    _animId = requestAnimationFrame(_tick);

    var dt = Math.min((ts - _lastTime) / 1000, 0.05);
    _lastTime = ts;

    if (!_gameOver && !_gameWon) {
      _updatePlayer(dt);
      _updateVaultDrill(dt);
      _updateChips();
      _updateSecurityCameras(dt);
      _updateGuards(dt);
      _updateViktor(dt);
      _updateBullets(dt);
      _updateEscape(dt);
      _updateLockdown(dt);
      _updateAlarmFlicker(dt);
    }

    _updateHUD();
    _renderer.render(_scene, _camera);
  }

  // ─── Alarm visual flicker ──────────────────────────────────────────────────

  var _flickerTimer = 0;
  var _flickerState = false;

  function _updateAlarmFlicker(dt) {
    if (_alarmLevel === 0) return;
    _flickerTimer += dt;
    if (_flickerTimer > 0.4) {
      _flickerTimer = 0;
      _flickerState = !_flickerState;
      var col = _flickerState && _alarmLevel >= 1 ? 0xff0000 : 0x444444;
      // Flash ambient light
      if (_group.children[0] && _group.children[0].isLight) {
        _group.children[0].color.setHex(_alarmLevel >= 2 ? (col) : 0x444444);
      }
    }
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  function init(scene, camera, renderer) {
    _scene    = scene;
    _camera   = camera;
    _renderer = renderer;
    _active   = true;

    // Reset state
    _playerPos  = { x: 0, y: 1.7, z: 30 };
    _playerVelY = 0;
    _onGround   = true;
    _hp         = 100;
    _score      = 0;
    _gameOver   = false;
    _gameWon    = false;
    _alarmLevel = 0;
    _alarmTimer = 0;
    _lockdownTimer = 0;
    _vaultDoorOpen = false;
    _vaultBreached = false;
    _drillingProgress = 0;
    _drillingActive   = false;
    _chipsCollected   = 0;
    _viktorDefeated   = false;
    _helipadReached   = false;
    _swatSpawned      = false;
    _viktorSpawned    = false;
    _escapeTimer      = 0;
    _shootCooldown    = 0;
    _secCamDetectTimer = 0;
    _flickerTimer     = 0;
    _flickerState     = false;
    _yaw   = 0;
    _pitch = 0;
    _keys  = {};
    _guards         = [];
    _swatGroup      = [];
    _viktor         = null;
    _bullets        = [];
    _enemyBullets   = [];
    _secCameras     = [];
    _chipMeshes     = [];
    _slotMachines   = [];
    _gamblingTables = [];
    _glassPanels    = [];

    // Scene group
    _group = new THREE.Object3D();
    _scene.add(_group);

    // Build world
    _buildEnvironment();
    _spawnGuards();
    _buildHUD();
    _setupInput();

    _lastTime = performance.now();
    _animId = requestAnimationFrame(_tick);
  }

  function update(dt) {
    // External update hook — no-op since we run our own RAF
  }

  function reset() {
    _active = false;

    if (_animId !== null) {
      cancelAnimationFrame(_animId);
      _animId = null;
    }

    if (_group && _scene) {
      _scene.remove(_group);
    }
    _group = null;

    if (_hud && _hud.parentNode) {
      _hud.parentNode.removeChild(_hud);
      _hud = null;
    }
    if (_overlay && _overlay.parentNode) {
      _overlay.parentNode.removeChild(_overlay);
      _overlay = null;
    }

    _teardownInput();

    _guards       = [];
    _swatGroup    = [];
    _viktor       = null;
    _bullets      = [];
    _enemyBullets = [];
    _secCameras   = [];
    _chipMeshes   = [];

    _gameOver = false;
    _gameWon  = false;
  }

  // ─── Activation keybind: C then H within 400ms ────────────────────────────
  (function _registerActivation() {
    document.addEventListener('keydown', function(e) {
      if (e.code === 'KeyC') {
        _cPressTime = performance.now();
      }
      if (e.code === 'KeyH') {
        var now = performance.now();
        if (now - _cPressTime <= 400 && !_active) {
          // Activate module
          var s = window.gameScene    || (window.game && window.game.scene);
          var c = window.gameCamera   || (window.game && window.game.camera);
          var r = window.gameRenderer || (window.game && window.game.renderer);
          if (s && c && r) {
            init(s, c, r);
          }
        }
      }
    });
  }());

  return {
    init:   init,
    update: update,
    reset:  reset
  };

}());
